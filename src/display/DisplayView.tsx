import { useEffect, useMemo, useState } from 'react'
import { workshopConfig } from '../config/workshop.ts'
import { formatDuration, formatOvertime } from '../domain/time.ts'
import { useWorkshopData } from '../store/useWorkshopData.ts'
import { workshopStore } from '../store/workshopStore.ts'
import { nextDeadlineCopy } from './deadlineCopy.ts'
import { FacilitatorControls } from './FacilitatorControls.tsx'
import { toggleFullscreen } from './fullscreen.ts'
import { interpretFacilitatorKey } from './hotkeys.ts'
import { MilestoneCards } from './MilestoneCards.tsx'
import { phaseLabel } from './phaseLabel.ts'
import { PhaseStepper } from './PhaseStepper.tsx'
import { ScissorsRail } from './ScissorsRail.tsx'
import { Timeline } from './Timeline.tsx'
import { useWorkshopSession } from './useWorkshopSession.ts'
import './DisplayView.css'

function wallClock(nowMs: number): string {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(nowMs)
}

export function DisplayView() {
  const { state, view, nowMs, store } = useWorkshopSession()
  const { data } = useWorkshopData()
  const [controlsVisible, setControlsVisible] = useState(true)
  const [resetArmed, setResetArmed] = useState(false)

  useEffect(() => {
    if (!resetArmed) return
    const id = window.setTimeout(() => setResetArmed(false), 4000)
    return () => window.clearTimeout(id)
  }, [resetArmed])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const action = interpretFacilitatorKey(event, {
        resetArmed,
        controlsVisible,
      })
      if (!action) return
      event.preventDefault()
      if (action === 'toggleRunning') store.toggleRunning()
      if (action === 'armReset') setResetArmed(true)
      if (action === 'confirmReset') {
        store.reset()
        workshopStore.resetSessionExtras()
        setResetArmed(false)
      }
      if (action === 'cancelReset') setResetArmed(false)
      if (action === 'toggleControls') setControlsVisible((value) => !value)
      if (action === 'toggleFullscreen') void toggleFullscreen()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [controlsVisible, resetArmed, store])

  const hero = useMemo(() => {
    if (view.isOvertime) {
      return {
        value: formatOvertime(view.overtimeMs),
        label: 'Zeit überschritten',
      }
    }
    return {
      value: formatDuration(view.remainingMs),
      label: state.status === 'idle' ? 'Gesamtzeit' : 'Restzeit',
    }
  }, [state.status, view.isOvertime, view.overtimeMs, view.remainingMs])

  const statusLabel =
    state.status === 'running'
      ? 'Läuft'
      : state.status === 'paused'
        ? 'Pause'
        : 'Bereit'

  const nextCopy = nextDeadlineCopy({
    status: state.status,
    overtime: view.isOvertime,
    nextLabel: view.nextMilestone?.label,
    nextRemainingMs: view.nextMilestone?.remainingMs ?? 0,
  })

  return (
    <div
      className={`display urgency-${view.urgency} status-${state.status}${controlsVisible ? ' has-controls' : ''}`}
    >
      <header className="topbar">
        <div className="brand">
          <BridgeMark />
          <div>
            <p className="eyebrow">Projekt-Simulation</p>
            <h1>{workshopConfig.title}</h1>
          </div>
        </div>
        <PhaseStepper
          phases={view.phases}
          onSelect={(phase) => store.setPhaseOverride(phase)}
        />
        <div className="clock-block">
          <p className="status-pill">
            {state.status === 'running' ? <span className="live-dot" /> : null}
            {state.status === 'paused' ? <span className="pause-bars" /> : null}
            {statusLabel}
          </p>
          <p className="wall-clock">{wallClock(nowMs)}</p>
        </div>
      </header>

      <main className="stage">
        {state.status === 'paused' ? (
          <p className="pause-banner" role="status">
            Pausiert — Uhr steht. Leertaste zum Fortsetzen.
          </p>
        ) : null}
        {state.status === 'running' ? (
          <p className="run-banner" role="status">
            Timer läuft
          </p>
        ) : null}
        <p className="hero-label">{hero.label}</p>
        <p className="hero-time" aria-live="polite">
          {hero.value}
        </p>
        <p className="hero-sub">{nextCopy}</p>
        <ScissorsRail
          rentals={data.scissorsRentals}
          teams={data.teams}
          nowMs={nowMs}
        />
        {resetArmed ? (
          <p className="reset-banner" role="status">
            Nochmal R drücken, um zurückzusetzen
          </p>
        ) : null}
        <MilestoneCards milestones={view.milestones} />
        <Timeline elapsedMs={view.elapsedMs} progress={view.progress} />
      </main>

      <FacilitatorControls
        visible={controlsVisible}
        statusLabel={`${statusLabel} · Phase ${phaseLabel(view.activePhaseId)}`}
        activePhaseId={view.activePhaseId}
        teams={data.teams}
        ttsApiKey={data.ttsApiKey}
        scissorsRentals={data.scissorsRentals}
        nowMs={nowMs}
        onSelectPhase={(phase) => store.setPhaseOverride(phase)}
      />
    </div>
  )
}

function BridgeMark() {
  return (
    <svg
      className="mark"
      viewBox="0 0 64 40"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 28h56M8 28V18l24-10 24 10v10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M20 28v-7m12 7v-11m12 11v-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path d="M4 32h56" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

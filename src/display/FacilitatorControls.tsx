import { useState, useSyncExternalStore } from 'react'
import { speakGerman } from '../audio/speech.ts'
import { totalMinutes, type PhaseId } from '../config/workshop.ts'
import {
  scissorsElapsed,
  scissorsRemainingMs,
  teamHasRunningScissors,
  type ScissorsRental,
} from '../domain/scissors.ts'
import { teamLabel, type Team } from '../domain/teams.ts'
import { formatDuration } from '../domain/time.ts'
import { sessionStore } from '../store/browserStore.ts'
import { workshopStore } from '../store/workshopStore.ts'
import { toggleFullscreen } from './fullscreen.ts'
import { TimeSettingsDialog } from './TimeSettingsDialog.tsx'
import { useEffectiveWorkshopConfig } from './useWorkshopSession.ts'

type Props = {
  visible: boolean
  activePhaseId: PhaseId
  teams: Team[]
  ttsApiKey: string
  scissorsRentals: ScissorsRental[]
  nowMs: number
  onSelectPhase: (phase: PhaseId | null) => void
}

function resetWorkshop() {
  sessionStore.reset()
  workshopStore.resetSessionExtras()
}

export function FacilitatorControls({
  visible,
  activePhaseId,
  teams,
  ttsApiKey,
  scissorsRentals,
  nowMs,
  onSelectPhase,
}: Props) {
  const config = useEffectiveWorkshopConfig()
  const [timeSettingsOpen, setTimeSettingsOpen] = useState(false)
  const status = useSyncExternalStore(
    sessionStore.subscribe,
    () => sessionStore.getState().status,
  )

  if (!visible) return null

  const estimateDue =
    config.milestones.find((milestone) => milestone.id === 'vorkalkulation')
      ?.atMinutes ?? 0
  const sketchDue =
    config.milestones.find((milestone) => milestone.id === 'skizze')
      ?.atMinutes ?? 0
  const total = totalMinutes(config)
  const jumps = [
    { label: 'Sprung: 00:00', ms: 0 },
    { label: '1 Min vor Vorkalkulation', ms: (estimateDue - 1) * 60_000 },
    { label: `Vorkalkulation (${estimateDue} Min)`, ms: estimateDue * 60_000 },
    { label: '1 Min vor Skizze', ms: (sketchDue - 1) * 60_000 },
    {
      label: `Skizze / Bau startet (${sketchDue} Min)`,
      ms: sketchDue * 60_000,
    },
    { label: '1 Min vor Ende', ms: (total - 1) * 60_000 },
    { label: `Fertigstellung (${total} Min)`, ms: total * 60_000 },
  ]

  return (
    <aside className="controls" aria-label="Facilitator-Steuerung">
      <div className="controls-row">
        <strong>Steuerung</strong>
      </div>
      <div className="controls-row">
        <button
          type="button"
          className={status === 'running' ? 'primary is-running' : 'primary is-stopped'}
          onClick={() => sessionStore.toggleRunning()}
        >
          Start / Pause
        </button>
        <button type="button" onClick={resetWorkshop}>
          Zurücksetzen
        </button>
        <button type="button" onClick={() => void toggleFullscreen()}>
          Vollbild
        </button>
        <button type="button" onClick={() => onSelectPhase(null)}>
          Phase automatisch
        </button>
      </div>
      <div className="controls-row">
        <strong>Phase</strong>
      </div>
      <div className="controls-row wrap" role="group" aria-label="Phase setzen">
        {config.phases.map((phase) => (
          <button
            key={phase.id}
            type="button"
            className={phase.id === activePhaseId ? 'is-pressed' : undefined}
            aria-pressed={phase.id === activePhaseId}
            onClick={() => onSelectPhase(phase.id)}
          >
            {phase.label}
          </button>
        ))}
      </div>
      <div className="controls-row">
        <strong>Schere (30 Min)</strong>
      </div>
      <div className="controls-row wrap" role="group" aria-label="Schere 30 Minuten">
        {teams.length === 0 ? (
          <span className="controls-status">Zuerst Teams anlegen</span>
        ) : (
          teams.map((team, index) => {
            const running = teamHasRunningScissors(
              scissorsRentals,
              team.id,
              nowMs,
            )
            const rental = scissorsRentals.find(
              (item) => item.teamId === team.id && !scissorsElapsed(item, nowMs),
            )
            const due = scissorsRentals.some(
              (item) => item.teamId === team.id && scissorsElapsed(item, nowMs),
            )
            return (
              <button
                key={team.id}
                type="button"
                className={running || due ? 'is-pressed' : undefined}
                aria-pressed={running || due}
                onClick={() => workshopStore.startScissors(team.id, nowMs)}
              >
                {teamLabel(team, index)}
                {rental
                  ? ` · ${formatDuration(scissorsRemainingMs(rental, nowMs))}`
                  : due
                    ? ' · zurück'
                    : ''}
              </button>
            )
          })
        )}
      </div>
      <div className="controls-row time-settings-row">
        <details className="controls-more" open>
          <summary>Zeitsprünge</summary>
          <div className="controls-row wrap">
            {jumps.map((jump) => (
              <button
                key={jump.label}
                type="button"
                onClick={() => sessionStore.jumpToElapsedMs(jump.ms)}
              >
                {jump.label}
              </button>
            ))}
          </div>
        </details>
        <button
          type="button"
          className="time-settings-open"
          onClick={() => setTimeSettingsOpen(true)}
        >
          Timer bearbeiten
        </button>
      </div>
      <details className="controls-more">
        <summary>Ansage</summary>
        <div className="controls-row">
          <label className="controls-key">
            ElevenLabs-Schlüssel
            <input
              type="password"
              autoComplete="off"
              placeholder="optional"
              value={ttsApiKey}
              onChange={(event) => workshopStore.setTtsApiKey(event.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              void speakGerman(
                'Achtung. Stimme bereit. Die Schere muss zurück.',
                {
                  elevenLabsKey:
                    ttsApiKey || import.meta.env.VITE_ELEVENLABS_API_KEY,
                  voiceId: import.meta.env.VITE_ELEVENLABS_VOICE_ID,
                },
              )
            }}
          >
            Stimme testen
          </button>
        </div>
      </details>
      <p className="controls-help">
        Tasten: Leertaste Start/Pause · R zweimal zurücksetzen · F Vollbild · C
        Steuerung · Esc schließen
      </p>
      <TimeSettingsDialog
        open={timeSettingsOpen}
        onClose={() => setTimeSettingsOpen(false)}
      />
    </aside>
  )
}

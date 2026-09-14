import { workshopConfig, type PhaseId } from '../config/workshop.ts'
import { sessionStore } from '../store/browserStore.ts'
import { toggleFullscreen } from './fullscreen.ts'

type Props = {
  visible: boolean
  statusLabel: string
  activePhaseId: PhaseId
  onSelectPhase: (phase: PhaseId | null) => void
}

const JUMPS = [
  { label: 'Sprung: 00:00', ms: 0 },
  { label: '1 Min vor Vorkalkulation', ms: 29 * 60_000 },
  { label: 'Vorkalkulation (30 Min)', ms: 30 * 60_000 },
  { label: '1 Min vor Skizze', ms: 44 * 60_000 },
  { label: 'Skizze / Bau startet (45 Min)', ms: 45 * 60_000 },
  { label: '1 Min vor Ende', ms: 134 * 60_000 },
  { label: 'Fertigstellung (45+90)', ms: 135 * 60_000 },
]

export function FacilitatorControls({
  visible,
  statusLabel,
  activePhaseId,
  onSelectPhase,
}: Props) {
  if (!visible) return null

  return (
    <aside className="controls" aria-label="Facilitator-Steuerung">
      <div className="controls-row">
        <strong>Steuerung</strong>
        <span className="controls-status">{statusLabel}</span>
      </div>
      <div className="controls-row">
        <button type="button" onClick={() => sessionStore.toggleRunning()}>
          Start / Pause
        </button>
        <button type="button" onClick={() => sessionStore.reset()}>
          Reset
        </button>
        <button type="button" onClick={() => void toggleFullscreen()}>
          Fullscreen
        </button>
        <button type="button" onClick={() => onSelectPhase(null)}>
          Phase auto
        </button>
      </div>
      <div className="controls-row wrap">
        {workshopConfig.phases.map((phase) => (
          <button
            key={phase.id}
            type="button"
            className={phase.id === activePhaseId ? 'is-pressed' : undefined}
            onClick={() => onSelectPhase(phase.id)}
          >
            {phase.label}
          </button>
        ))}
      </div>
      <div className="controls-row wrap">
        {JUMPS.map((jump) => (
          <button
            key={jump.label}
            type="button"
            onClick={() => sessionStore.jumpToElapsedMs(jump.ms)}
          >
            {jump.label}
          </button>
        ))}
      </div>
      <p className="controls-help">
        Tasten: Leertaste Start/Pause · R Reset (zweimal) · F Fullscreen · C
        Steuerung · Esc schließen
      </p>
    </aside>
  )
}

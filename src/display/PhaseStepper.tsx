import type { PhaseId } from '../config/workshop.ts'
import type { PhaseView } from '../domain/session.ts'

type Props = {
  phases: PhaseView[]
  onSelect?: (phase: PhaseId) => void
}

const STATE_COPY: Record<PhaseView['status'], string> = {
  upcoming: '',
  active: 'jetzt',
  completed: 'fertig',
}

export function PhaseStepper({ phases, onSelect }: Props) {
  return (
    <ol className="phases" aria-label="Projektphasen">
      {phases.map((phase, index) => (
        <li key={phase.id} className={`phase is-${phase.status}`}>
          <button
            type="button"
            className="phase-btn"
            aria-current={phase.status === 'active' ? 'step' : undefined}
            onClick={() => onSelect?.(phase.id)}
          >
            <span className="phase-index">
              {STATE_COPY[phase.status] || String(index + 1)}
            </span>
            <span className="phase-label">{phase.label}</span>
          </button>
        </li>
      ))}
    </ol>
  )
}

import { formatDuration } from '../domain/time.ts'
import type { MilestoneView } from '../domain/session.ts'

const STATUS_LABEL: Record<MilestoneView['status'], string> = {
  upcoming: 'Offen',
  current: 'Läuft',
  due: 'Fällig',
  reached: 'Erreicht',
}

type Props = {
  milestones: MilestoneView[]
}

export function MilestoneCards({ milestones }: Props) {
  return (
    <section className="cards" aria-label="Meilensteine">
      {milestones.map((milestone) => (
        <article key={milestone.id} className={`card is-${milestone.status}`}>
          <p className="card-kicker">{STATUS_LABEL[milestone.status]}</p>
          <h2 className="card-title">{milestone.label}</h2>
          <p className="card-hint">{milestone.hint}</p>
          <p className="card-time">
            {milestone.status === 'reached'
              ? 'abgegeben'
              : milestone.status === 'due'
                ? 'jetzt'
                : formatDuration(milestone.remainingMs)}
          </p>
          <p className="card-meta">bei {formatClockMark(milestone.atMinutes)}</p>
        </article>
      ))}
    </section>
  )
}

function formatClockMark(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

import { workshopConfig, totalMinutes } from '../config/workshop.ts'
import { formatDuration } from '../domain/time.ts'

type Props = {
  elapsedMs: number
  progress: number
}

export function Timeline({ elapsedMs, progress }: Props) {
  const total = totalMinutes(workshopConfig)
  const planningPct = (workshopConfig.planningMinutes / total) * 100
  const realizationPct = 100 - planningPct

  return (
    <section className="timeline" aria-label="Zeitstrahl">
      <div className="timeline-bands">
        <div className="band band-plan" style={{ width: `${planningPct}%` }}>
          Planung {workshopConfig.planningMinutes} Min
        </div>
        <div className="band band-build" style={{ width: `${realizationPct}%` }}>
          Realisierung {workshopConfig.realizationMinutes} Min
        </div>
      </div>
      <div className="timeline-track">
        <div
          className="timeline-fill"
          style={{ width: `${Math.min(100, progress * 100)}%` }}
        />
        {workshopConfig.milestones.map((milestone) => (
          <span
            key={milestone.id}
            className="timeline-mark"
            style={{ left: `${(milestone.atMinutes / total) * 100}%` }}
          >
            <span className="timeline-dot" />
            <span className="timeline-caption">
              {milestone.label}
              <br />
              {milestone.atMinutes} Min
            </span>
          </span>
        ))}
      </div>
      <p className="timeline-elapsed">
        Gelaufen: {formatDuration(elapsedMs)} von {formatDuration(total * 60_000)}
      </p>
    </section>
  )
}

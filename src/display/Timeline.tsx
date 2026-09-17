import { totalMinutes } from '../config/workshop.ts'
import { useEffectiveWorkshopConfig } from './useWorkshopSession.ts'

type Props = {
  elapsedMs: number
  progress: number
}

export function Timeline({ progress }: Props) {
  const config = useEffectiveWorkshopConfig()
  const total = totalMinutes(config)
  const planningPct = (config.planningMinutes / total) * 100
  const realizationPct = 100 - planningPct
  const percent = Math.min(100, Math.round(progress * 100))

  return (
    <section className="timeline" aria-label="Zeitstrahl">
      <div className="timeline-bands">
        <div className="band band-plan" style={{ width: `${planningPct}%` }}>
          Planung {config.planningMinutes} Min
        </div>
        <div className="band band-build" style={{ width: `${realizationPct}%` }}>
          Realisierung {config.realizationMinutes} Min
        </div>
      </div>
      <div
        className="timeline-track"
        role="progressbar"
        aria-label="Fortschritt"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className="timeline-fill"
          style={{ width: `${Math.min(100, progress * 100)}%` }}
        />
        {config.milestones.map((milestone) => (
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
    </section>
  )
}

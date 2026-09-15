import { formatDuration } from '../domain/time.ts'
import {
  scissorsElapsed,
  scissorsRemainingMs,
  type ScissorsRental,
} from '../domain/scissors.ts'
import { teamLabel, type Team } from '../domain/teams.ts'

type Props = {
  rentals: ScissorsRental[]
  teams: Team[]
  nowMs: number
}

export function ScissorsRail({ rentals, teams, nowMs }: Props) {
  if (rentals.length === 0) return null

  return (
    <ul className="scissors-rail" aria-label="Scheren-Timer">
      {rentals.map((rental) => {
        const index = teams.findIndex((team) => team.id === rental.teamId)
        const team = teams[index]
        const due = scissorsElapsed(rental, nowMs)
        const remaining = scissorsRemainingMs(rental, nowMs)
        return (
          <li
            key={rental.id}
            className={due ? 'scissors-chip is-due' : 'scissors-chip'}
          >
            <span>Schere</span>
            <strong>
              {teamLabel(team ?? { id: rental.teamId, name: '' }, Math.max(0, index))}
            </strong>
            <em>{due ? 'zurück!' : formatDuration(remaining)}</em>
          </li>
        )
      })}
    </ul>
  )
}

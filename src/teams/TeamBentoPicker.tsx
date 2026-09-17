import type { JSX } from 'react'
import type { Team } from '../domain/teams.ts'
import { teamLabel } from '../domain/teams.ts'
import './teamPicker.css'

export type TeamBentoPickerProps = {
  teams: Team[]
  activeTeamId: string
  onSelect: (id: string) => void
  statusFor?: (id: string) => string | null
}

export function TeamBentoPicker({
  teams,
  activeTeamId,
  onSelect,
  statusFor,
}: TeamBentoPickerProps): JSX.Element {
  return (
    <div className="team-picker" role="group" aria-label="Team auswählen">
      {teams.map((team, index) => {
        const active = team.id === activeTeamId
        const status = statusFor?.(team.id) ?? null
        return (
          <button
            key={team.id}
            type="button"
            className={`team-picker-card${active ? ' is-active' : ''}`}
            aria-pressed={active}
            onClick={() => onSelect(team.id)}
          >
            <span className="team-picker-index" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            {status ? (
              <span className="team-picker-status">{status}</span>
            ) : null}
            <span className="team-picker-name">{teamLabel(team, index)}</span>
          </button>
        )
      })}
    </div>
  )
}

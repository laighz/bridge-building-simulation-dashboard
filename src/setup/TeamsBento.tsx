import type { Team } from '../domain/teams.ts'
import { canContinueSetup } from '../domain/teams.ts'

type Props = {
  teams: Team[]
  onAdd: () => void
  onRemove: (id: string) => void
  onRename: (id: string, name: string) => void
  onContinue: () => void
}

export function TeamsBento({
  teams,
  onAdd,
  onRemove,
  onRename,
  onContinue,
}: Props) {
  const ready = canContinueSetup(teams)

  return (
    <main className="bento">
      <header className="bento-head">
        <p className="eyebrow">Vor dem Start</p>
        <h1>Wer spielt?</h1>
        <p className="bento-lead">
          Jede Kachel ist ein Unternehmen. Plus für ein weiteres Team, dann
          weiter zu den Regeln.
        </p>
      </header>

      <div className="bento-grid">
        {teams.map((team, index) => (
          <article
            key={team.id}
            className={`bento-card${index === 0 ? ' is-hero' : ''}`}
          >
            <span className="bento-index">{String(index + 1).padStart(2, '0')}</span>
            <label>
              Teamname
              <input
                autoFocus={index === teams.length - 1 && team.name === ''}
                value={team.name}
                placeholder={`Team ${index + 1}`}
                onChange={(event) => onRename(team.id, event.target.value)}
              />
            </label>
            <button
              type="button"
              className="bento-remove"
              onClick={() => onRemove(team.id)}
              aria-label={`Team ${index + 1} entfernen`}
            >
              Entfernen
            </button>
          </article>
        ))}

        <button
          type="button"
          className={`bento-add${teams.length === 0 ? ' is-hero' : ''}`}
          onClick={onAdd}
        >
          <span className="bento-plus" aria-hidden="true">
            +
          </span>
          <span>Team hinzufügen</span>
        </button>
      </div>

      <footer className="bento-foot">
        <p>{teams.length === 0 ? 'Noch keine Teams' : `${teams.length} Teams`}</p>
        <button
          type="button"
          className="primary"
          disabled={!ready}
          onClick={onContinue}
        >
          Weiter zu den Regeln
        </button>
      </footer>
    </main>
  )
}

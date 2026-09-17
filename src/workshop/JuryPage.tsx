import {
  COST_DEVIATION_LIMIT_PERCENT,
  estimateItems,
} from '../config/catalog.ts'
import { costDeviationVerdict, sheetTotal } from '../domain/costing.ts'
import { formatEuro } from '../domain/money.ts'
import { isDisqualified, juryTotal } from '../domain/scoring.ts'
import { useWorkshopData } from '../store/useWorkshopData.ts'
import {
  getTeamJury,
  getTeamLoadTest,
  getTeamSheets,
  getTeamSubmit,
} from '../store/workshopStore.ts'
import { TeamBentoPicker } from '../teams/TeamBentoPicker.tsx'
import './workshop.css'
import './jury.css'

const CRITERIA = [
  { key: 'cost', label: 'Geringe tatsächliche Kosten' },
  { key: 'deviation', label: 'Geringe Abweichung Vor-/Nachkalkulation' },
  { key: 'looks', label: 'Optische Gestaltung' },
  { key: 'stability', label: 'Stabilität' },
] as const

export function JuryPage() {
  const { data, store } = useWorkshopData()
  const teamId = data.activeTeamId
  const activeIndex = data.teams.findIndex((team) => team.id === teamId)
  const activeTeam = activeIndex >= 0 ? data.teams[activeIndex] : undefined
  const teamName = activeTeam
    ? activeTeam.name.trim() || `Team ${activeIndex + 1}`
    : ''

  const sheets = getTeamSheets(data, teamId)
  const jury = getTeamJury(data, teamId)
  const loadTestPassed = getTeamLoadTest(data, teamId)
  const planned = sheetTotal(estimateItems, sheets.estimate)
  const actual = sheetTotal(estimateItems, sheets.actual)
  const actualSubmitted = getTeamSubmit(data, teamId, 'actual') != null
  const verdict = costDeviationVerdict(planned, actual)
  const deviation = verdict.deviation
  const disqualified = isDisqualified({
    loadTestPassed,
    costExcluded: verdict.excluded,
  })
  const missing: string[] = []
  if (loadTestPassed == null) missing.push('Belastungstest')
  if (!actualSubmitted) missing.push('Nachkalkulation')
  const pending = missing.length > 0 && !verdict.excluded
  const pendingText =
    missing.length === 2
      ? `${missing[0]} und ${missing[1]} stehen noch aus.`
      : `${missing[0]} steht noch aus.`
  const total = juryTotal(jury)

  const pageStateClass =
    activeTeam == null
      ? ''
      : disqualified
        ? ' is-failed'
        : pending
          ? ''
          : ' is-approved'

  return (
    <main className={`workshop-page jury-page${pageStateClass}`}>
      <header className="jury-head">
        <h1>Jury &amp; Vergleich</h1>
        <p className="jury-lead">
          Team wählen, Belastungstest und Kalkulation prüfen, dann Punkte
          vergeben.
        </p>
      </header>

      <TeamBentoPicker
        teams={data.teams}
        activeTeamId={teamId}
        onSelect={(id) => store.setActiveTeam(id)}
        statusFor={(id) =>
          getTeamSubmit(data, id, 'actual') != null ? 'abgegeben' : null
        }
      />

      {activeTeam == null ? (
        <p className="jury-status is-pending" role="status">
          Noch keine Teams angelegt — bitte zuerst im Setup Teams anlegen.
        </p>
      ) : (
        <>
          {disqualified ? (
            <p className="jury-status is-hot" role="status">
              Ausgeschlossen: Belastungstest nicht bestanden oder
              Kostenabweichung über {COST_DEVIATION_LIMIT_PERCENT} %.
            </p>
          ) : pending ? (
            <p className="jury-status is-pending" role="status">
              {pendingText}
            </p>
          ) : (
            <p className="jury-status is-ok" role="status">
              Im Rennen: Belastungstest bestanden, Kostenabweichung im Limit.
            </p>
          )}

          <section className="jury-panel" aria-labelledby="jury-calc-title">
            <div className="jury-panel-head">
              <div>
                <h2 id="jury-calc-title">Kalkulationsprüfung</h2>
                <p className="jury-panel-sub">
                  Ausschluss bei mehr als {COST_DEVIATION_LIMIT_PERCENT} %
                  Abweichung zwischen Vor- und Nachkalkulation.
                </p>
              </div>
            </div>

            <dl className="jury-calc-rows">
              <div className="jury-calc-row">
                <dt>Summe Vorkalkulation</dt>
                <dd>{formatEuro(planned)}</dd>
              </div>
              <div className="jury-calc-row">
                <dt>Summe Nachkalkulation</dt>
                <dd>{formatEuro(actual)}</dd>
              </div>
              <div className="jury-calc-row">
                <dt>Abweichung</dt>
                <dd>
                  {actualSubmitted && deviation != null
                    ? `${deviation.toFixed(1)} %`
                    : '—'}
                </dd>
              </div>
            </dl>

            {planned === 0 ? (
              <p className="jury-verdict is-muted" role="status">
                <strong>Keine Vorkalkulation abgegeben</strong>
                <span>
                  Ohne Vorkalkulation kann die Abweichung nicht geprüft werden.
                </span>
              </p>
            ) : !actualSubmitted ? (
              <p className="jury-verdict is-pending" role="status">
                <strong>Nachkalkulation ausstehend</strong>
                <span>
                  Die Abweichung wird geprüft, sobald {teamName} die
                  Nachkalkulation abgegeben hat.
                </span>
              </p>
            ) : verdict.excluded ? (
              <p className="jury-verdict is-hot" role="status">
                <strong>
                  ÜBER {COST_DEVIATION_LIMIT_PERCENT} % — Ausschluss
                </strong>
                <span>
                  Abweichung {deviation?.toFixed(1)} % — {teamName} scheidet
                  über die Kostenregel aus.
                </span>
              </p>
            ) : (
              <p className="jury-verdict is-ok" role="status">
                <strong>
                  UNTER {COST_DEVIATION_LIMIT_PERCENT} % — im Limit
                </strong>
                <span>
                  Abweichung {deviation?.toFixed(1)} % — kein Ausschluss über
                  die Kostenregel.
                </span>
              </p>
            )}
          </section>

          <section className="jury-panel" aria-labelledby="jury-load-title">
            <div className="jury-panel-head">
              <div>
                <h2 id="jury-load-title">Belastungstest</h2>
                <p className="jury-panel-sub">
                  Trägt die Brücke von {teamName} 1 kg?
                </p>
              </div>
            </div>
            <div
              className="jury-actions"
              role="group"
              aria-label={`Belastungstest ${teamName}`}
            >
              <button
                type="button"
                className={
                  loadTestPassed === true ? 'primary is-pressed' : undefined
                }
                aria-pressed={loadTestPassed === true}
                onClick={() => store.setLoadTestPassed(true, teamId)}
              >
                Bestanden
              </button>
              <button
                type="button"
                className={
                  loadTestPassed === false ? 'danger is-pressed' : 'danger'
                }
                aria-pressed={loadTestPassed === false}
                onClick={() => store.setLoadTestPassed(false, teamId)}
              >
                Nicht bestanden
              </button>
            </div>
          </section>

          <section className="jury-panel" aria-labelledby="jury-score-title">
            <div className="jury-panel-head">
              <div>
                <h2 id="jury-score-title">Jury-Bewertung</h2>
                <p className="jury-panel-sub">
                  Je Kriterium 0–10 Punkte für {teamName}.
                </p>
              </div>
              <p
                className="jury-total"
                aria-label={`Jury gesamt ${total} von 40 Punkten`}
              >
                <strong>{total}</strong>
                <span>/ 40</span>
              </p>
            </div>

            <div className="jury-score-grid">
              {CRITERIA.map((criterion) => (
                <div key={criterion.key} className="jury-score-row">
                  <div className="jury-score-label">
                    <span id={`jury-label-${criterion.key}`}>
                      {criterion.label}
                    </span>
                    <span className="jury-score-hint">0–10 Punkte</span>
                  </div>
                  <div
                    className="jury-stepper"
                    role="group"
                    aria-labelledby={`jury-label-${criterion.key}`}
                  >
                    <button
                      type="button"
                      className="jury-step-btn"
                      disabled={jury[criterion.key] <= 0}
                      aria-label={`${criterion.label} verringern`}
                      onClick={() =>
                        store.setJury(
                          { ...jury, [criterion.key]: jury[criterion.key] - 1 },
                          teamId,
                        )
                      }
                    >
                      −
                    </button>
                    <output
                      className="jury-score-value"
                      aria-live="polite"
                      aria-label={`${jury[criterion.key]} von 10 Punkten`}
                    >
                      {jury[criterion.key]}
                    </output>
                    <button
                      type="button"
                      className="jury-step-btn"
                      disabled={jury[criterion.key] >= 10}
                      aria-label={`${criterion.label} erhöhen`}
                      onClick={() =>
                        store.setJury(
                          { ...jury, [criterion.key]: jury[criterion.key] + 1 },
                          teamId,
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  )
}

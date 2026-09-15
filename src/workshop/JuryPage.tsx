import { estimateItems, materialItems } from '../config/catalog.ts'
import {
  costDeviationPercent,
  isExcludedByCost,
  sheetTotal,
} from '../domain/costing.ts'
import { formatEuro } from '../domain/money.ts'
import { isDisqualified, juryTotal } from '../domain/scoring.ts'
import { useWorkshopData } from '../store/useWorkshopData.ts'
import { workshopStore } from '../store/workshopStore.ts'
import './workshop.css'

const CRITERIA = [
  { key: 'cost', label: 'Geringe tatsächliche Kosten' },
  { key: 'deviation', label: 'Geringe Abweichung Vor-/Nachkalkulation' },
  { key: 'looks', label: 'Optische Gestaltung' },
  { key: 'stability', label: 'Stabilität' },
] as const

export function JuryPage() {
  const { data } = useWorkshopData()
  const planned = sheetTotal(estimateItems, data.estimateQty)
  const actual = sheetTotal(estimateItems, data.actualQty)
  const ordered = sheetTotal(materialItems, data.orderQty)
  const deviation = costDeviationPercent(planned, actual)
  const costExcluded = isExcludedByCost(planned, actual)
  const disqualified = isDisqualified({
    loadTestPassed: data.loadTestPassed,
    costExcluded,
  })
  const pending = data.loadTestPassed == null && !costExcluded

  return (
    <main className="workshop-page jury-page">
      <header className="brief-head">
        <div>
          <h1>Jury &amp; Vergleich</h1>
          <p className="brief-lead">
            {data.groupName || 'Gruppe noch nicht benannt'}
          </p>
        </div>
      </header>

      {disqualified ? (
        <p className="disqualified" role="status">
          Ausschluss: Belastungstest nicht bestanden oder Kostenabweichung über
          40 %.
        </p>
      ) : pending ? (
        <p className="pending-banner" role="status">
          Belastungstest steht noch aus.
        </p>
      ) : (
        <p className="ok-banner" role="status">
          Im Bewerb: Belastungstest bestanden, Kostenabweichung höchstens 40 %.
        </p>
      )}

      <section className="jury-compare">
        <article>
          <span>Materialbestellung</span>
          <strong>{formatEuro(ordered)}</strong>
        </article>
        <article>
          <span>Vorkalkulation</span>
          <strong>{formatEuro(planned)}</strong>
        </article>
        <article>
          <span>Nachkalkulation</span>
          <strong>{formatEuro(actual)}</strong>
        </article>
        <article>
          <span>Abweichung</span>
          <strong>
            {deviation == null ? '—' : `${deviation.toFixed(1)} %`}
          </strong>
        </article>
        <article>
          <span>Jury gesamt</span>
          <strong>{juryTotal(data.jury)} / 40</strong>
        </article>
      </section>

      <div className="jury-actions" role="group" aria-label="Belastungstest">
        <button
          type="button"
          className={data.loadTestPassed === true ? 'primary is-pressed' : undefined}
          aria-pressed={data.loadTestPassed === true}
          onClick={() => workshopStore.setLoadTestPassed(true)}
        >
          Belastungstest 1 kg bestanden
        </button>
        <button
          type="button"
          className={data.loadTestPassed === false ? 'danger is-pressed' : undefined}
          aria-pressed={data.loadTestPassed === false}
          onClick={() => workshopStore.setLoadTestPassed(false)}
        >
          Belastungstest nicht bestanden
        </button>
      </div>

      <div className="brief-grid jury-scores">
        {CRITERIA.map((criterion) => (
          <div key={criterion.key} className="brief-card">
            <label htmlFor={`jury-${criterion.key}`}>{criterion.label}</label>
            <span className="score-hint">Punkte 0–10</span>
            <div className="score-control">
              <button
                type="button"
                className="qty-btn"
                disabled={data.jury[criterion.key] <= 0}
                aria-label={`${criterion.label} verringern`}
                onClick={() =>
                  workshopStore.setJury({
                    ...data.jury,
                    [criterion.key]: data.jury[criterion.key] - 1,
                  })
                }
              >
                −
              </button>
              <input
                id={`jury-${criterion.key}`}
                type="number"
                min={0}
                max={10}
                step={1}
                inputMode="numeric"
                className="score-value"
                value={data.jury[criterion.key]}
                onChange={(event) =>
                  workshopStore.setJury({
                    ...data.jury,
                    [criterion.key]: Number(event.target.value),
                  })
                }
              />
              <button
                type="button"
                className="qty-btn"
                disabled={data.jury[criterion.key] >= 10}
                aria-label={`${criterion.label} erhöhen`}
                onClick={() =>
                  workshopStore.setJury({
                    ...data.jury,
                    [criterion.key]: data.jury[criterion.key] + 1,
                  })
                }
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

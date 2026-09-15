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
  const pending =
    data.loadTestPassed == null && !costExcluded && !disqualified

  return (
    <main className="workshop-page jury-page">
      <header className="brief-head">
        <div>
          <p className="eyebrow">
            {data.groupName || 'Gruppe noch nicht benannt'}
          </p>
          <h1>Jury &amp; Vergleich</h1>
        </div>
      </header>

      {disqualified ? (
        <p className="disqualified" role="status">
          Ausschluss: Belastungstest nicht bestanden oder Kostenabweichung über
          40 %.
        </p>
      ) : pending ? (
        <p className="pending-banner" role="status">
          Noch nicht ausgeschlossen. Belastungstest und 40-%-Regel stehen noch
          aus oder sind erfüllt.
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

      <div className="jury-actions">
        <button
          type="button"
          className={data.loadTestPassed === true ? 'primary' : undefined}
          onClick={() => workshopStore.setLoadTestPassed(true)}
        >
          Belastungstest 1 kg bestanden
        </button>
        <button
          type="button"
          className={data.loadTestPassed === false ? 'danger' : undefined}
          onClick={() => workshopStore.setLoadTestPassed(false)}
        >
          Belastungstest nicht bestanden
        </button>
      </div>

      <div className="brief-grid jury-scores">
        {CRITERIA.map((criterion) => (
          <label key={criterion.key} className="brief-card">
            {criterion.label} (0–10)
            <input
              type="number"
              min={0}
              max={10}
              step={1}
              inputMode="numeric"
              value={data.jury[criterion.key]}
              onChange={(event) =>
                workshopStore.setJury({
                  ...data.jury,
                  [criterion.key]: Number(event.target.value),
                })
              }
            />
          </label>
        ))}
      </div>
    </main>
  )
}

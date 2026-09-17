import { estimateItems } from '../config/catalog.ts'
import { totalMinutes } from '../config/workshop.ts'
import {
  costDeviationPercent,
  isExcludedByCost,
  sheetTotal,
  timeAdjustmentQty,
} from '../domain/costing.ts'
import { elapsedMs } from '../domain/session.ts'
import { formatEuro } from '../domain/money.ts'
import { useWorkshopSession } from '../display/useWorkshopSession.ts'
import { useWorkshopData } from '../store/useWorkshopData.ts'
import {
  getTeamSheets,
  getTeamSubmit,
  workshopStore,
} from '../store/workshopStore.ts'
import { CostSheet } from './CostSheet.tsx'
import './workshop.css'

type Props = {
  mode: 'estimate' | 'actual'
}

export function EstimatePage({ mode }: Props) {
  const { data } = useWorkshopData()
  const { state, nowMs, config } = useWorkshopSession()
  const elapsed = elapsedMs(state, nowMs)
  const plannedMs = totalMinutes(config) * 60_000
  const sheets = getTeamSheets(data, data.activeTeamId)
  const qty = mode === 'estimate' ? sheets.estimate : sheets.actual
  const submitted = getTeamSubmit(data, data.activeTeamId, mode)
  const plannedTotal = sheetTotal(estimateItems, sheets.estimate)
  const actualTotal = sheetTotal(estimateItems, sheets.actual)
  const deviation = costDeviationPercent(plannedTotal, actualTotal)

  return (
    <main className="workshop-page">
      <CostSheet
        title={mode === 'estimate' ? 'Vorkalkulation' : 'Nachkalkulation'}
        sheet={mode}
        items={estimateItems}
        qty={qty}
        groupName={data.groupName}
        submittedElapsedMs={submitted}
        timeLabel="Abgabezeit"
        elapsedMs={elapsed}
      >
        {mode === 'actual' ? (
          <>
            <button
              type="button"
              onClick={() =>
                workshopStore.copyMaterialQuantities('order', 'actual')
              }
            >
              Materialmengen aus Bestellung übernehmen
            </button>
            <button
              type="button"
              onClick={() =>
                workshopStore.copySheetQuantities('estimate', 'actual')
              }
            >
              Werte aus Vorkalkulation übernehmen
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() =>
              workshopStore.copyMaterialQuantities('order', 'estimate')
            }
          >
            Materialmengen aus Bestellung übernehmen
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            const blocks = timeAdjustmentQty(elapsed, plannedMs)
            workshopStore.applyTimeAdjustments(
              mode,
              blocks.extraBlocks,
              blocks.savedBlocks,
            )
          }}
        >
          Zeitblöcke aus Timer übernehmen
        </button>
      </CostSheet>

      {mode === 'actual' ? (
        <section className="cost-delta" aria-live="polite">
          <article>
            <span>Vorkalkulation</span>
            <strong>{formatEuro(plannedTotal)}</strong>
          </article>
          <article>
            <span>Nachkalkulation</span>
            <strong>{formatEuro(actualTotal)}</strong>
          </article>
          <article>
            <span>Abweichung</span>
            <strong>
              {deviation == null ? '—' : `${deviation.toFixed(1)} %`}
            </strong>
          </article>
          <p
            className={
              isExcludedByCost(plannedTotal, actualTotal)
                ? 'disqualified'
                : 'ok-banner'
            }
            role="status"
          >
            {isExcludedByCost(plannedTotal, actualTotal)
              ? 'Ausschluss: Abweichung über 40 %.'
              : 'Kostenabweichung innerhalb der 40-%-Grenze.'}
          </p>
        </section>
      ) : null}
    </main>
  )
}

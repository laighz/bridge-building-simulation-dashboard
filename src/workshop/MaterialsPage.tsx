import { materialItems } from '../config/catalog.ts'
import { elapsedMs } from '../domain/session.ts'
import { useWorkshopSession } from '../display/useWorkshopSession.ts'
import { useWorkshopData } from '../store/useWorkshopData.ts'
import { workshopStore } from '../store/workshopStore.ts'
import { CostSheet } from './CostSheet.tsx'
import './workshop.css'

export function MaterialsPage() {
  const { data } = useWorkshopData()
  const { state, nowMs } = useWorkshopSession()
  return (
    <main className="workshop-page">
      <CostSheet
        title="Materialbestellung"
        sheet="order"
        items={materialItems}
        qty={data.orderQty}
        groupName={data.groupName}
        submittedElapsedMs={data.orderSubmittedElapsedMs}
        timeLabel="Bestellzeit"
        elapsedMs={elapsedMs(state, nowMs)}
      >
        <button
          type="button"
          onClick={() =>
            workshopStore.copyMaterialQuantities('estimate', 'order')
          }
        >
          Mengen aus Vorkalkulation übernehmen
        </button>
      </CostSheet>
    </main>
  )
}

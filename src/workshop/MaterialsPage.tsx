import { materialItems } from '../config/catalog.ts'
import { elapsedMs } from '../domain/session.ts'
import { useWorkshopSession } from '../display/useWorkshopSession.ts'
import { useWorkshopData } from '../store/useWorkshopData.ts'
import {
  getTeamSheets,
  getTeamSubmit,
  workshopStore,
} from '../store/workshopStore.ts'
import { CostSheet } from './CostSheet.tsx'
import './workshop.css'

export function MaterialsPage() {
  const { data } = useWorkshopData()
  const { state, nowMs } = useWorkshopSession()
  const sheets = getTeamSheets(data, data.activeTeamId)
  return (
    <main className="workshop-page">
      <CostSheet
        title="Materialbestellung"
        sheet="order"
        items={materialItems}
        qty={sheets.order}
        groupName={data.groupName}
        submittedElapsedMs={getTeamSubmit(data, data.activeTeamId, 'order')}
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

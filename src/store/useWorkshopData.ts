import { useSyncExternalStore } from 'react'
import { workshopStore } from '../store/workshopStore.ts'

export function useWorkshopData() {
  const data = useSyncExternalStore(
    workshopStore.subscribe,
    workshopStore.getState,
    workshopStore.getState,
  )
  return { data, store: workshopStore }
}

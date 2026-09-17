import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import {
  applyTimingOverrides,
  workshopConfig,
  type WorkshopConfig,
} from '../config/workshop.ts'
import { deriveView } from '../domain/session.ts'
import { sessionStore } from '../store/browserStore.ts'

function useNow(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [])
  return now
}

export function useEffectiveWorkshopConfig(): WorkshopConfig {
  const timingOverrides = useSyncExternalStore(
    sessionStore.subscribe,
    () => sessionStore.getState().timingOverrides,
    () => sessionStore.getState().timingOverrides,
  )
  return useMemo(
    () => applyTimingOverrides(workshopConfig, timingOverrides),
    [timingOverrides],
  )
}

export function useWorkshopSession() {
  const state = useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getState,
    sessionStore.getState,
  )
  const nowMs = useNow()
  const config = useEffectiveWorkshopConfig()
  const view = deriveView(config, state, nowMs)
  return { state, view, nowMs, store: sessionStore, config }
}

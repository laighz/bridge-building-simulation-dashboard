import { useEffect, useState, useSyncExternalStore } from 'react'
import { workshopConfig } from '../config/workshop.ts'
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

export function useWorkshopSession() {
  const state = useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getState,
    sessionStore.getState,
  )
  const nowMs = useNow()
  const view = deriveView(workshopConfig, state, nowMs)
  return { state, view, nowMs, store: sessionStore }
}

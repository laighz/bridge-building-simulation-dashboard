import {
  initialSessionState,
  type SessionState,
} from '../domain/session.ts'
import type { PhaseId } from '../config/workshop.ts'

export type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export type SessionAction =
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'reset' }
  | { type: 'toggleRunning' }
  | { type: 'setPhaseOverride'; phase: PhaseId | null }
  | { type: 'jumpToElapsedMs'; elapsedMs: number }

const DEFAULT_KEY = 'bridge-session'

function isPhaseId(value: unknown): value is PhaseId {
  return (
    value === 'vorbereitung' ||
    value === 'auftrag' ||
    value === 'planung' ||
    value === 'realisierung' ||
    value === 'abschluss'
  )
}

function parseState(raw: string | null): SessionState | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as Partial<SessionState>
    if (
      data.status !== 'idle' &&
      data.status !== 'running' &&
      data.status !== 'paused'
    ) {
      return null
    }
    if (typeof data.elapsedMsAtPause !== 'number' || data.elapsedMsAtPause < 0) {
      return null
    }
    if (
      data.startedAtMs !== null &&
      data.startedAtMs !== undefined &&
      typeof data.startedAtMs !== 'number'
    ) {
      return null
    }
    if (data.phaseOverride !== null && !isPhaseId(data.phaseOverride)) {
      return null
    }
    return {
      status: data.status,
      startedAtMs: data.startedAtMs ?? null,
      elapsedMsAtPause: data.elapsedMsAtPause,
      phaseOverride: data.phaseOverride ?? null,
    }
  } catch {
    return null
  }
}

export function createSessionStore(options: {
  now: () => number
  storage?: StorageLike
  storageKey?: string
}) {
  const key = options.storageKey ?? DEFAULT_KEY
  const storage = options.storage
  let state: SessionState = parseState(storage?.getItem(key) ?? null) ?? {
    ...initialSessionState,
  }
  const listeners = new Set<() => void>()

  function persist() {
    storage?.setItem(key, JSON.stringify(state))
  }

  function commit(next: SessionState) {
    state = next
    persist()
    for (const listener of listeners) listener()
  }

  function start() {
    if (state.status === 'running') return
    commit({
      ...state,
      status: 'running',
      startedAtMs: options.now(),
    })
  }

  function pause() {
    if (state.status !== 'running') return
    const elapsed =
      state.elapsedMsAtPause +
      (state.startedAtMs == null ? 0 : options.now() - state.startedAtMs)
    commit({
      ...state,
      status: 'paused',
      startedAtMs: null,
      elapsedMsAtPause: elapsed,
    })
  }

  function reset() {
    if (storage) storage.removeItem(key)
    state = { ...initialSessionState }
    for (const listener of listeners) listener()
  }

  function setPhaseOverride(phase: PhaseId | null) {
    commit({ ...state, phaseOverride: phase })
  }

  function jumpToElapsedMs(elapsed: number) {
    const clamped = Math.max(0, elapsed)
    commit({
      ...state,
      status: state.status === 'idle' ? 'paused' : state.status,
      elapsedMsAtPause: clamped,
      startedAtMs: state.status === 'running' ? options.now() : null,
    })
  }

  function toggleRunning() {
    if (state.status === 'running') pause()
    else start()
  }

  function dispatch(action: SessionAction) {
    if (action.type === 'start') start()
    else if (action.type === 'pause') pause()
    else if (action.type === 'reset') reset()
    else if (action.type === 'toggleRunning') toggleRunning()
    else if (action.type === 'setPhaseOverride') setPhaseOverride(action.phase)
    else jumpToElapsedMs(action.elapsedMs)
  }

  return {
    getState(): SessionState {
      return state
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    dispatch,
    start,
    pause,
    reset,
    setPhaseOverride,
    jumpToElapsedMs,
    toggleRunning,
  }
}

export type SessionStore = ReturnType<typeof createSessionStore>

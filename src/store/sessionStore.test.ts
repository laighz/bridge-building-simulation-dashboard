import { describe, expect, it } from 'vitest'
import { initialSessionState } from '../domain/session.ts'
import { createSessionStore, type StorageLike } from './sessionStore.ts'

function memoryStorage(seed: Record<string, string> = {}): StorageLike {
  const data = { ...seed }
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value
    },
    removeItem: (key) => {
      delete data[key]
    },
  }
}

describe('sessionStore', () => {
  it('starts the clock from idle', () => {
    let now = 1_000
    const store = createSessionStore({ now: () => now, storage: memoryStorage() })
    store.start()
    expect(store.getState()).toMatchObject({
      status: 'running',
      startedAtMs: 1_000,
      elapsedMsAtPause: 0,
    })
  })

  it('pauses and keeps elapsed frozen', () => {
    let now = 0
    const store = createSessionStore({ now: () => now, storage: memoryStorage() })
    store.start()
    now = 20_000
    store.pause()
    now = 50_000
    expect(store.getState()).toMatchObject({
      status: 'paused',
      startedAtMs: null,
      elapsedMsAtPause: 20_000,
    })
  })

  it('resumes from the paused elapsed time', () => {
    let now = 0
    const store = createSessionStore({ now: () => now, storage: memoryStorage() })
    store.start()
    now = 20_000
    store.pause()
    now = 40_000
    store.start()
    expect(store.getState()).toMatchObject({
      status: 'running',
      startedAtMs: 40_000,
      elapsedMsAtPause: 20_000,
    })
  })

  it('reset returns to the initial idle state', () => {
    let now = 0
    const store = createSessionStore({ now: () => now, storage: memoryStorage() })
    store.start()
    now = 5_000
    store.setPhaseOverride('planung')
    store.reset()
    expect(store.getState()).toEqual(initialSessionState)
  })

  it('jumpToElapsedMs sets elapsed for rehearsal', () => {
    let now = 100_000
    const store = createSessionStore({ now: () => now, storage: memoryStorage() })
    store.start()
    store.jumpToElapsedMs(45 * 60_000)
    const state = store.getState()
    expect(state.status).toBe('running')
    expect(state.elapsedMsAtPause).toBe(45 * 60_000)
    expect(state.startedAtMs).toBe(100_000)
  })

  it('restores a persisted session', () => {
    const persisted = JSON.stringify({
      status: 'paused',
      startedAtMs: null,
      elapsedMsAtPause: 12_000,
      phaseOverride: 'auftrag',
    })
    const store = createSessionStore({
      now: () => 0,
      storage: memoryStorage({ 'bridge-session': persisted }),
    })
    expect(store.getState()).toMatchObject({
      status: 'paused',
      elapsedMsAtPause: 12_000,
      phaseOverride: 'auftrag',
    })
  })

  it('ignores corrupt storage and starts idle', () => {
    const store = createSessionStore({
      now: () => 0,
      storage: memoryStorage({ 'bridge-session': '{not json' }),
    })
    expect(store.getState()).toEqual(initialSessionState)
  })

  it('notifies subscribers on changes', () => {
    const store = createSessionStore({ now: () => 0, storage: memoryStorage() })
    let ticks = 0
    const unsubscribe = store.subscribe(() => {
      ticks += 1
    })
    store.start()
    store.pause()
    unsubscribe()
    store.reset()
    expect(ticks).toBe(2)
  })

  it('dispatch start/pause matches the convenience methods', () => {
    let now = 5_000
    const store = createSessionStore({ now: () => now, storage: memoryStorage() })
    store.dispatch({ type: 'start' })
    now = 9_000
    store.dispatch({ type: 'pause' })
    expect(store.getState()).toMatchObject({
      status: 'paused',
      elapsedMsAtPause: 4_000,
    })
  })

  it('dispatch reset clears a persisted session', () => {
    const storage = memoryStorage()
    const store = createSessionStore({ now: () => 0, storage })
    store.dispatch({ type: 'start' })
    store.dispatch({ type: 'reset' })
    expect(store.getState()).toEqual(initialSessionState)
    expect(storage.getItem('bridge-session')).toBeNull()
  })
})

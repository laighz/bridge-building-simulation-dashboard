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

  it('stores timing overrides and persists them', () => {
    const storage = memoryStorage()
    const store = createSessionStore({ now: () => 0, storage })
    store.setTimingOverrides({ planningMinutes: 30, warningMinutes: 10 })
    expect(store.getState().timingOverrides).toEqual({
      planningMinutes: 30,
      warningMinutes: 10,
    })
    const persisted = JSON.parse(storage.getItem('bridge-session') ?? '{}')
    expect(persisted.timingOverrides).toEqual({
      planningMinutes: 30,
      warningMinutes: 10,
    })
  })

  it('sanitizes timing overrides on set', () => {
    const store = createSessionStore({ now: () => 0, storage: memoryStorage() })
    store.setTimingOverrides({
      planningMinutes: -5,
      realizationMinutes: Number.NaN,
      estimateDueMinute: Number.POSITIVE_INFINITY,
      warningMinutes: 8,
    })
    expect(store.getState().timingOverrides).toEqual({ warningMinutes: 8 })
  })

  it('resetTimingOverrides restores the defaults', () => {
    const storage = memoryStorage()
    const store = createSessionStore({ now: () => 0, storage })
    store.setTimingOverrides({ planningMinutes: 30 })
    store.resetTimingOverrides()
    expect(store.getState().timingOverrides).toEqual({})
    const persisted = JSON.parse(storage.getItem('bridge-session') ?? '{}')
    expect(persisted.timingOverrides).toEqual({})
  })

  it('dispatch setTimingOverrides/resetTimingOverrides match the methods', () => {
    const store = createSessionStore({ now: () => 0, storage: memoryStorage() })
    store.dispatch({
      type: 'setTimingOverrides',
      overrides: { realizationMinutes: 60 },
    })
    expect(store.getState().timingOverrides).toEqual({
      realizationMinutes: 60,
    })
    store.dispatch({ type: 'resetTimingOverrides' })
    expect(store.getState().timingOverrides).toEqual({})
  })

  it('restores persisted timing overrides tolerantly', () => {
    const persisted = JSON.stringify({
      status: 'paused',
      startedAtMs: null,
      elapsedMsAtPause: 0,
      phaseOverride: null,
      timingOverrides: {
        planningMinutes: 30,
        realizationMinutes: 'bald',
        briefingMinutes: -3,
        estimateDueMinute: 25,
        warningMinutes: null,
        criticalMinutes: 2,
        bogus: 99,
      },
    })
    const store = createSessionStore({
      now: () => 0,
      storage: memoryStorage({ 'bridge-session': persisted }),
    })
    expect(store.getState().timingOverrides).toEqual({
      planningMinutes: 30,
      estimateDueMinute: 25,
      criticalMinutes: 2,
    })
  })

  it('treats a non-object timingOverrides as empty', () => {
    const persisted = JSON.stringify({
      status: 'idle',
      startedAtMs: null,
      elapsedMsAtPause: 0,
      phaseOverride: null,
      timingOverrides: 42,
    })
    const store = createSessionStore({
      now: () => 0,
      storage: memoryStorage({ 'bridge-session': persisted }),
    })
    expect(store.getState().timingOverrides).toEqual({})
  })
})

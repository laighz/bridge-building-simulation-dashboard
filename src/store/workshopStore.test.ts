import { describe, expect, it } from 'vitest'
import type { StorageLike } from './sessionStore.ts'
import {
  createWorkshopStore,
  getTeamJury,
  getTeamLoadTest,
  getTeamSheets,
  getTeamSubmit,
  initialWorkshopData,
} from './workshopStore.ts'

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

describe('workshopStore', () => {
  it('records material quantities and group name', () => {
    const store = createWorkshopStore({ storage: memoryStorage() })
    store.setGroupName('Team Blau')
    store.setQuantity('order', 'carton-1', 2)
    const state = store.getState()
    expect(state.groupName).toBe('Team Blau')
    expect(getTeamSheets(state, state.activeTeamId).order['carton-1']).toBe(2)
  })

  it('stamps Vorkalkulation submit with workshop elapsed time', () => {
    const store = createWorkshopStore({ storage: memoryStorage() })
    store.submit('estimate', 30 * 60_000)
    const state = store.getState()
    expect(getTeamSubmit(state, state.activeTeamId, 'estimate')).toBe(30 * 60_000)
  })

  it('restores a persisted workshop sheet', () => {
    const persisted = JSON.stringify({
      ...initialWorkshopData,
      groupName: 'Team Rot',
      sheetsByTeam: {
        'team-1': { order: { 'carton-1': 1 }, estimate: {}, actual: {} },
      },
    })
    const store = createWorkshopStore({
      storage: memoryStorage({ 'bridge-workshop': persisted }),
    })
    const state = store.getState()
    expect(state.groupName).toBe('Team Rot')
    expect(getTeamSheets(state, 'team-1').order['carton-1']).toBe(1)
    expect(state.teams[0]?.name).toBe('Team Rot')
  })

  it('migrates legacy flat fields onto the active team', () => {
    const persisted = JSON.stringify({
      groupName: 'Team Rot',
      teams: [
        { id: 'team-1', name: 'Team Rot' },
        { id: 'team-2', name: 'Team Blau' },
      ],
      activeTeamId: 'team-2',
      orderQty: { 'carton-1': 3 },
      estimateQty: { overhead: 1, 'carton-1': 2 },
      orderSubmittedElapsedMs: 60_000,
      estimateSubmittedElapsedMs: 120_000,
      loadTestPassed: true,
      jury: { cost: 5, deviation: 4, looks: 3, stability: 2 },
    })
    const store = createWorkshopStore({
      storage: memoryStorage({ 'bridge-workshop': persisted }),
    })
    const state = store.getState()
    expect(getTeamSheets(state, 'team-2').order['carton-1']).toBe(3)
    expect(getTeamSheets(state, 'team-2').estimate['carton-1']).toBe(2)
    expect(getTeamSubmit(state, 'team-2', 'order')).toBe(60_000)
    expect(getTeamSubmit(state, 'team-2', 'estimate')).toBe(120_000)
    expect(getTeamLoadTest(state, 'team-2')).toBe(true)
    expect(getTeamJury(state, 'team-2')).toEqual({
      cost: 5,
      deviation: 4,
      looks: 3,
      stability: 2,
    })
    // The other team keeps pristine defaults.
    expect(getTeamSheets(state, 'team-1').order['carton-1']).toBeUndefined()
    expect(getTeamSubmit(state, 'team-1', 'order')).toBeNull()
    expect(getTeamLoadTest(state, 'team-1')).toBeNull()
    expect(getTeamJury(state, 'team-1')).toEqual({
      cost: 0,
      deviation: 0,
      looks: 0,
      stability: 0,
    })
  })

  it('migrates legacy flat fields onto the first team without an active team', () => {
    const persisted = JSON.stringify({
      groupName: 'Team Rot',
      orderQty: { 'carton-1': 1 },
      loadTestPassed: false,
    })
    const store = createWorkshopStore({
      storage: memoryStorage({ 'bridge-workshop': persisted }),
    })
    const state = store.getState()
    expect(state.activeTeamId).toBe('team-1')
    expect(getTeamSheets(state, 'team-1').order['carton-1']).toBe(1)
    expect(getTeamLoadTest(state, 'team-1')).toBe(false)
  })

  it('keeps quantities isolated per team across team switches', () => {
    const store = createWorkshopStore({ storage: memoryStorage() })
    store.setGroupName('Team A')
    const teamA = store.getState().activeTeamId
    store.addTeam()
    const teamB = store.getState().activeTeamId
    expect(teamB).not.toBe(teamA)

    store.setActiveTeam(teamA)
    store.setQuantity('order', 'carton-1', 5)
    store.setActiveTeam(teamB)
    expect(getTeamSheets(store.getState(), teamB).order['carton-1']).toBeUndefined()

    store.setActiveTeam(teamA)
    expect(getTeamSheets(store.getState(), teamA).order['carton-1']).toBe(5)
  })

  it('keeps submit stamps, load test and jury scores independent per team', () => {
    const store = createWorkshopStore({ storage: memoryStorage() })
    store.setGroupName('Team A')
    const teamA = store.getState().activeTeamId
    store.addTeam()
    const teamB = store.getState().activeTeamId

    store.submit('order', 10_000, teamA)
    store.setLoadTestPassed(true, teamA)
    store.setJury({ cost: 9, deviation: 8, looks: 7, stability: 6 }, teamA)

    let state = store.getState()
    expect(getTeamSubmit(state, teamB, 'order')).toBeNull()
    expect(getTeamLoadTest(state, teamB)).toBeNull()
    expect(getTeamJury(state, teamB)).toEqual({
      cost: 0,
      deviation: 0,
      looks: 0,
      stability: 0,
    })

    store.submit('order', 20_000, teamB)
    store.setLoadTestPassed(false, teamB)
    store.setJury({ cost: 1, deviation: 2, looks: 3, stability: 4 }, teamB)

    state = store.getState()
    expect(getTeamSubmit(state, teamA, 'order')).toBe(10_000)
    expect(getTeamLoadTest(state, teamA)).toBe(true)
    expect(getTeamJury(state, teamA)).toEqual({
      cost: 9,
      deviation: 8,
      looks: 7,
      stability: 6,
    })
    expect(getTeamSubmit(state, teamB, 'order')).toBe(20_000)
    expect(getTeamLoadTest(state, teamB)).toBe(false)
    expect(getTeamJury(state, teamB)).toEqual({
      cost: 1,
      deviation: 2,
      looks: 3,
      stability: 4,
    })
  })

  it('initializes buckets for added teams and cleans them up on removal', () => {
    const store = createWorkshopStore({ storage: memoryStorage() })
    store.setGroupName('Team A')
    const teamA = store.getState().activeTeamId
    store.addTeam()
    const teamB = store.getState().activeTeamId

    const sheetsB = getTeamSheets(store.getState(), teamB)
    expect(sheetsB.order).toEqual({})
    expect(sheetsB.estimate).toEqual({ overhead: 1 })
    expect(sheetsB.actual).toEqual({ overhead: 1 })
    expect(getTeamLoadTest(store.getState(), teamB)).toBeNull()
    expect(getTeamJury(store.getState(), teamB)).toEqual({
      cost: 0,
      deviation: 0,
      looks: 0,
      stability: 0,
    })

    store.setQuantity('order', 'carton-1', 2, teamB)
    store.submit('order', 5_000, teamB)
    store.removeTeam(teamB)
    const state = store.getState()
    expect(state.sheetsByTeam[teamB]).toBeUndefined()
    expect(state.submittedByTeam[teamB]).toBeUndefined()
    expect(state.loadTestByTeam[teamB]).toBeUndefined()
    expect(state.juryByTeam[teamB]).toBeUndefined()
    expect(getTeamSheets(state, teamA).order).toEqual({})
  })

  it('clamps limited stock such as scissors to maxQty', () => {
    const store = createWorkshopStore({ storage: memoryStorage() })
    store.setQuantity('order', 'scissors-buy', 4)
    const state = store.getState()
    expect(getTeamSheets(state, state.activeTeamId).order['scissors-buy']).toBe(1)
  })

  it('copies material quantities between sheets without touching overhead', () => {
    const store = createWorkshopStore({ storage: memoryStorage() })
    store.setQuantity('estimate', 'carton-1', 2)
    store.setQuantity('estimate', 'overhead', 1)
    store.copyMaterialQuantities('estimate', 'order')
    const state = store.getState()
    const sheets = getTeamSheets(state, state.activeTeamId)
    expect(sheets.order['carton-1']).toBe(2)
    expect(sheets.order.overhead).toBeUndefined()
  })

  it('writes timer time-blocks only onto the chosen costing sheet', () => {
    const store = createWorkshopStore({ storage: memoryStorage() })
    store.applyTimeAdjustments('actual', 2, 0)
    const state = store.getState()
    const sheets = getTeamSheets(state, state.activeTeamId)
    expect(sheets.actual['overtime-10']).toBe(2)
    expect(sheets.estimate['overtime-10']).toBeUndefined()
  })

  it('clamps jury scores to 0–10', () => {
    const store = createWorkshopStore({ storage: memoryStorage() })
    store.setJury({ cost: 12, deviation: -3, looks: 7.4, stability: 9.6 })
    const state = store.getState()
    expect(getTeamJury(state, state.activeTeamId)).toEqual({
      cost: 10,
      deviation: 0,
      looks: 7,
      stability: 10,
    })
  })

  it('adds named teams from the bento and starts a 30-minute scissors rental', () => {
    const store = createWorkshopStore({ storage: memoryStorage() })
    store.addTeam()
    store.renameTeam(store.getState().teams[0]!.id, 'Cyan')
    store.startScissors(store.getState().teams[0]!.id, 5_000)
    expect(store.getState().teams[0]?.name).toBe('Cyan')
    expect(store.getState().scissorsRentals).toHaveLength(1)
    expect(store.getState().scissorsRentals[0]?.startedAtMs).toBe(5_000)
  })

  it('records spoken announcement keys so a timer is not announced twice', () => {
    const store = createWorkshopStore({ storage: memoryStorage() })
    store.markSpoken('milestone:vorkalkulation')
    store.markSpoken('milestone:vorkalkulation')
    expect(store.getState().spokenKeys).toEqual(['milestone:vorkalkulation'])
  })
})

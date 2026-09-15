import { describe, expect, it } from 'vitest'
import type { StorageLike } from './sessionStore.ts'
import { createWorkshopStore, initialWorkshopData } from './workshopStore.ts'

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
    expect(store.getState().groupName).toBe('Team Blau')
    expect(store.getState().orderQty['carton-1']).toBe(2)
  })

  it('stamps Vorkalkulation submit with workshop elapsed time', () => {
    const store = createWorkshopStore({ storage: memoryStorage() })
    store.submit('estimate', 30 * 60_000)
    expect(store.getState().estimateSubmittedElapsedMs).toBe(30 * 60_000)
  })

  it('restores a persisted workshop sheet', () => {
    const persisted = JSON.stringify({
      ...initialWorkshopData,
      groupName: 'Team Rot',
      orderQty: { 'carton-1': 1 },
    })
    const store = createWorkshopStore({
      storage: memoryStorage({ 'bridge-workshop': persisted }),
    })
    expect(store.getState().groupName).toBe('Team Rot')
    expect(store.getState().orderQty['carton-1']).toBe(1)
    expect(store.getState().teams[0]?.name).toBe('Team Rot')
  })

  it('clamps limited stock such as scissors to maxQty', () => {
    const store = createWorkshopStore({ storage: memoryStorage() })
    store.setQuantity('order', 'scissors-buy', 4)
    expect(store.getState().orderQty['scissors-buy']).toBe(1)
  })

  it('copies material quantities between sheets without touching overhead', () => {
    const store = createWorkshopStore({ storage: memoryStorage() })
    store.setQuantity('estimate', 'carton-1', 2)
    store.setQuantity('estimate', 'overhead', 1)
    store.copyMaterialQuantities('estimate', 'order')
    expect(store.getState().orderQty['carton-1']).toBe(2)
    expect(store.getState().orderQty.overhead).toBeUndefined()
  })

  it('writes timer time-blocks only onto the chosen costing sheet', () => {
    const store = createWorkshopStore({ storage: memoryStorage() })
    store.applyTimeAdjustments('actual', 2, 0)
    expect(store.getState().actualQty['overtime-10']).toBe(2)
    expect(store.getState().estimateQty['overtime-10']).toBeUndefined()
  })

  it('clamps jury scores to 0–10', () => {
    const store = createWorkshopStore({ storage: memoryStorage() })
    store.setJury({ cost: 12, deviation: -3, looks: 7.4, stability: 9.6 })
    expect(store.getState().jury).toEqual({
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

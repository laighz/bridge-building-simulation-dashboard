import { estimateItems, materialItems } from '../config/catalog.ts'
import { clampScore, type JuryScores } from '../domain/scoring.ts'
import type { StorageLike } from './sessionStore.ts'

const itemById = new Map(estimateItems.map((item) => [item.id, item]))

function clampQuantity(itemId: string, quantity: number): number {
  const parsed = Number(quantity)
  if (!Number.isFinite(parsed) || parsed <= 0) return 0
  const rounded = Math.floor(parsed)
  const maxQty = itemById.get(itemId)?.maxQty
  return maxQty == null ? rounded : Math.min(rounded, maxQty)
}

function qtyKey(sheet: SheetId): 'orderQty' | 'estimateQty' | 'actualQty' {
  if (sheet === 'order') return 'orderQty'
  if (sheet === 'estimate') return 'estimateQty'
  return 'actualQty'
}

export type SheetId = 'order' | 'estimate' | 'actual'

export type WorkshopData = {
  groupName: string
  orderQty: Record<string, number>
  estimateQty: Record<string, number>
  actualQty: Record<string, number>
  orderSubmittedElapsedMs: number | null
  estimateSubmittedElapsedMs: number | null
  actualSubmittedElapsedMs: number | null
  loadTestPassed: boolean | null
  jury: JuryScores
}

export const initialWorkshopData: WorkshopData = {
  groupName: '',
  orderQty: {},
  estimateQty: { overhead: 1 },
  actualQty: { overhead: 1 },
  orderSubmittedElapsedMs: null,
  estimateSubmittedElapsedMs: null,
  actualSubmittedElapsedMs: null,
  loadTestPassed: null,
  jury: { cost: 0, deviation: 0, looks: 0, stability: 0 },
}

const DEFAULT_KEY = 'bridge-workshop'

function asQty(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') return {}
  const result: Record<string, number> = {}
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
      result[key] = raw
    }
  }
  return result
}

function parseData(raw: string | null): WorkshopData | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as Partial<WorkshopData>
    return {
      ...initialWorkshopData,
      groupName: typeof data.groupName === 'string' ? data.groupName : '',
      orderQty: asQty(data.orderQty),
      estimateQty: asQty(data.estimateQty),
      actualQty: asQty(data.actualQty),
      orderSubmittedElapsedMs:
        typeof data.orderSubmittedElapsedMs === 'number'
          ? data.orderSubmittedElapsedMs
          : null,
      estimateSubmittedElapsedMs:
        typeof data.estimateSubmittedElapsedMs === 'number'
          ? data.estimateSubmittedElapsedMs
          : null,
      actualSubmittedElapsedMs:
        typeof data.actualSubmittedElapsedMs === 'number'
          ? data.actualSubmittedElapsedMs
          : null,
      loadTestPassed:
        data.loadTestPassed === true || data.loadTestPassed === false
          ? data.loadTestPassed
          : null,
      jury: {
        cost: Number(data.jury?.cost) || 0,
        deviation: Number(data.jury?.deviation) || 0,
        looks: Number(data.jury?.looks) || 0,
        stability: Number(data.jury?.stability) || 0,
      },
    }
  } catch {
    return null
  }
}

export function createWorkshopStore(options: { storage?: StorageLike }) {
  const storage = options.storage
  let state: WorkshopData =
    parseData(storage?.getItem(DEFAULT_KEY) ?? null) ?? {
      ...initialWorkshopData,
      orderQty: { ...initialWorkshopData.orderQty },
      estimateQty: { ...initialWorkshopData.estimateQty },
      actualQty: { ...initialWorkshopData.actualQty },
      jury: { ...initialWorkshopData.jury },
    }
  const listeners = new Set<() => void>()

  function commit(next: WorkshopData) {
    state = next
    storage?.setItem(DEFAULT_KEY, JSON.stringify(state))
    for (const listener of listeners) listener()
  }

  return {
    getState(): WorkshopData {
      return state
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    setGroupName(groupName: string) {
      commit({ ...state, groupName })
    },
    setQuantity(sheet: SheetId, itemId: string, quantity: number) {
      const key = qtyKey(sheet)
      commit({
        ...state,
        [key]: { ...state[key], [itemId]: clampQuantity(itemId, quantity) },
      })
    },
    copyMaterialQuantities(from: SheetId, to: SheetId) {
      if (from === to) return
      const source = state[qtyKey(from)]
      const next = { ...state[qtyKey(to)] }
      for (const item of materialItems) {
        next[item.id] = source[item.id] ?? 0
      }
      commit({ ...state, [qtyKey(to)]: next })
    },
    submit(sheet: SheetId, elapsedMs: number) {
      if (sheet === 'order') {
        commit({ ...state, orderSubmittedElapsedMs: elapsedMs })
      } else if (sheet === 'estimate') {
        commit({ ...state, estimateSubmittedElapsedMs: elapsedMs })
      } else {
        commit({ ...state, actualSubmittedElapsedMs: elapsedMs })
      }
    },
    setLoadTestPassed(value: boolean | null) {
      commit({ ...state, loadTestPassed: value })
    },
    setJury(jury: JuryScores) {
      commit({
        ...state,
        jury: {
          cost: clampScore(jury.cost),
          deviation: clampScore(jury.deviation),
          looks: clampScore(jury.looks),
          stability: clampScore(jury.stability),
        },
      })
    },
    applyTimeAdjustments(
      sheet: 'estimate' | 'actual',
      extraBlocks: number,
      savedBlocks: number,
    ) {
      const key = qtyKey(sheet)
      commit({
        ...state,
        [key]: {
          ...state[key],
          'overtime-10': clampQuantity('overtime-10', extraBlocks),
          'saved-10': clampQuantity('saved-10', savedBlocks),
        },
      })
    },
  }
}

export const workshopStore = createWorkshopStore({
  storage: typeof localStorage === 'undefined' ? undefined : localStorage,
})

import { estimateItems, materialItems } from '../config/catalog.ts'
import { appendSpoken } from '../domain/announce.ts'
import { startScissorsForTeam, type ScissorsRental } from '../domain/scissors.ts'
import { clampScore, type JuryScores } from '../domain/scoring.ts'
import {
  addTeam as appendTeam,
  removeTeam as dropTeam,
  renameTeam as relabelTeam,
  type Team,
} from '../domain/teams.ts'
import type { SetupStep } from '../domain/setup.ts'
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
  teams: Team[]
  activeTeamId: string
  setupStep: SetupStep
  rulesSlideIndex: number
  scissorsRentals: ScissorsRental[]
  spokenKeys: string[]
  ttsApiKey: string
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
  teams: [],
  activeTeamId: '',
  setupStep: 'teams',
  rulesSlideIndex: 0,
  scissorsRentals: [],
  spokenKeys: [],
  ttsApiKey: '',
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

function asTeams(value: unknown): Team[] {
  if (!Array.isArray(value)) return []
  const teams: Team[] = []
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue
    const item = raw as { id?: unknown; name?: unknown }
    if (typeof item.id !== 'string' || !item.id) continue
    teams.push({
      id: item.id,
      name: typeof item.name === 'string' ? item.name : '',
    })
  }
  return teams
}

function asRentals(value: unknown): ScissorsRental[] {
  if (!Array.isArray(value)) return []
  const rentals: ScissorsRental[] = []
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue
    const item = raw as Partial<ScissorsRental>
    if (
      typeof item.id !== 'string' ||
      typeof item.teamId !== 'string' ||
      typeof item.startedAtMs !== 'number' ||
      typeof item.durationMs !== 'number'
    ) {
      continue
    }
    rentals.push({
      id: item.id,
      teamId: item.teamId,
      startedAtMs: item.startedAtMs,
      durationMs: item.durationMs,
    })
  }
  return rentals
}

function migrateTeams(data: Partial<WorkshopData>, groupName: string): Team[] {
  const teams = asTeams(data.teams)
  if (teams.length > 0) return teams
  if (groupName.trim()) return [{ id: 'team-1', name: groupName }]
  return []
}

function syncGroupName(teams: Team[], activeTeamId: string, fallback: string): string {
  const active = teams.find((team) => team.id === activeTeamId) ?? teams[0]
  return active?.name ?? fallback
}

function parseData(raw: string | null): WorkshopData | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as Partial<WorkshopData>
    const groupName = typeof data.groupName === 'string' ? data.groupName : ''
    const teams = migrateTeams(data, groupName)
    const activeTeamId =
      typeof data.activeTeamId === 'string' &&
      teams.some((team) => team.id === data.activeTeamId)
        ? data.activeTeamId
        : (teams[0]?.id ?? '')
    return {
      ...initialWorkshopData,
      groupName: syncGroupName(teams, activeTeamId, groupName),
      teams,
      activeTeamId,
      setupStep: data.setupStep === 'rules' ? 'rules' : 'teams',
      rulesSlideIndex:
        typeof data.rulesSlideIndex === 'number' && data.rulesSlideIndex >= 0
          ? Math.floor(data.rulesSlideIndex)
          : 0,
      scissorsRentals: asRentals(data.scissorsRentals),
      spokenKeys: Array.isArray(data.spokenKeys)
        ? data.spokenKeys.filter((key): key is string => typeof key === 'string')
        : [],
      ttsApiKey: typeof data.ttsApiKey === 'string' ? data.ttsApiKey : '',
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
      teams: [],
      scissorsRentals: [],
      spokenKeys: [],
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

  function withTeams(teams: Team[], activeTeamId = state.activeTeamId): WorkshopData {
    const nextActive =
      teams.some((team) => team.id === activeTeamId) ? activeTeamId : (teams[0]?.id ?? '')
    return {
      ...state,
      teams,
      activeTeamId: nextActive,
      groupName: syncGroupName(teams, nextActive, ''),
    }
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
      if (state.teams.length === 0) {
        const teams = [{ id: 'team-1', name: groupName }]
        commit({
          ...state,
          teams,
          activeTeamId: 'team-1',
          groupName,
        })
        return
      }
      const id = state.activeTeamId || state.teams[0]!.id
      commit(withTeams(relabelTeam(state.teams, id, groupName), id))
    },
    addTeam() {
      const teams = appendTeam(state.teams)
      const created = teams[teams.length - 1]
      commit(withTeams(teams, created?.id ?? state.activeTeamId))
    },
    removeTeam(id: string) {
      commit(withTeams(dropTeam(state.teams, id)))
    },
    renameTeam(id: string, name: string) {
      commit(withTeams(relabelTeam(state.teams, id, name), id))
    },
    setActiveTeam(id: string) {
      if (!state.teams.some((team) => team.id === id)) return
      commit(withTeams(state.teams, id))
    },
    setSetupStep(setupStep: SetupStep, rulesSlideIndex = state.rulesSlideIndex) {
      commit({ ...state, setupStep, rulesSlideIndex })
    },
    setRulesSlideIndex(rulesSlideIndex: number) {
      commit({ ...state, rulesSlideIndex: Math.max(0, rulesSlideIndex) })
    },
    startScissors(teamId: string, nowMs: number) {
      if (!state.teams.some((team) => team.id === teamId)) return
      commit({
        ...state,
        scissorsRentals: startScissorsForTeam(state.scissorsRentals, teamId, nowMs),
      })
    },
    markSpoken(key: string) {
      commit({ ...state, spokenKeys: appendSpoken(state.spokenKeys, key) })
    },
    setTtsApiKey(ttsApiKey: string) {
      commit({ ...state, ttsApiKey })
    },
    resetSessionExtras() {
      commit({
        ...state,
        setupStep: 'teams',
        rulesSlideIndex: 0,
        scissorsRentals: [],
        spokenKeys: [],
      })
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

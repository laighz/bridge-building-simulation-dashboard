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

export type SheetId = 'order' | 'estimate' | 'actual'

export type TeamSheets = {
  order: Record<string, number>
  estimate: Record<string, number>
  actual: Record<string, number>
}

export type WorkshopData = {
  groupName: string
  teams: Team[]
  activeTeamId: string
  setupStep: SetupStep
  rulesSlideIndex: number
  scissorsRentals: ScissorsRental[]
  spokenKeys: string[]
  ttsApiKey: string
  sheetsByTeam: Record<string, TeamSheets>
  submittedByTeam: Record<string, Partial<Record<SheetId, number>>>
  loadTestByTeam: Record<string, boolean | null>
  juryByTeam: Record<string, JuryScores>
}

function defaultTeamSheets(): TeamSheets {
  return { order: {}, estimate: { overhead: 1 }, actual: { overhead: 1 } }
}

function defaultJury(): JuryScores {
  return { cost: 0, deviation: 0, looks: 0, stability: 0 }
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
  sheetsByTeam: {},
  submittedByTeam: {},
  loadTestByTeam: {},
  juryByTeam: {},
}

export function getTeamSheets(data: WorkshopData, teamId: string): TeamSheets {
  return data.sheetsByTeam[teamId] ?? defaultTeamSheets()
}

export function getTeamJury(data: WorkshopData, teamId: string): JuryScores {
  return data.juryByTeam[teamId] ?? defaultJury()
}

export function getTeamLoadTest(data: WorkshopData, teamId: string): boolean | null {
  return data.loadTestByTeam[teamId] ?? null
}

export function getTeamSubmit(
  data: WorkshopData,
  teamId: string,
  sheet: SheetId,
): number | null {
  return data.submittedByTeam[teamId]?.[sheet] ?? null
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

function asJury(value: unknown): JuryScores {
  const raw = (value ?? {}) as Partial<Record<keyof JuryScores, unknown>>
  return {
    cost: Number(raw.cost) || 0,
    deviation: Number(raw.deviation) || 0,
    looks: Number(raw.looks) || 0,
    stability: Number(raw.stability) || 0,
  }
}

function asSheetsByTeam(value: unknown): Record<string, TeamSheets> {
  if (!value || typeof value !== 'object') return {}
  const result: Record<string, TeamSheets> = {}
  for (const [teamId, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue
    const sheets = raw as Partial<Record<SheetId, unknown>>
    const defaults = defaultTeamSheets()
    result[teamId] = {
      order: sheets.order != null ? asQty(sheets.order) : defaults.order,
      estimate: sheets.estimate != null ? asQty(sheets.estimate) : defaults.estimate,
      actual: sheets.actual != null ? asQty(sheets.actual) : defaults.actual,
    }
  }
  return result
}

function asSubmittedByTeam(
  value: unknown,
): Record<string, Partial<Record<SheetId, number>>> {
  if (!value || typeof value !== 'object') return {}
  const result: Record<string, Partial<Record<SheetId, number>>> = {}
  for (const [teamId, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue
    const record = raw as Partial<Record<SheetId, unknown>>
    const entry: Partial<Record<SheetId, number>> = {}
    for (const sheet of ['order', 'estimate', 'actual'] as const) {
      const stamp = record[sheet]
      if (typeof stamp === 'number' && Number.isFinite(stamp)) entry[sheet] = stamp
    }
    result[teamId] = entry
  }
  return result
}

function asLoadTestByTeam(value: unknown): Record<string, boolean | null> {
  if (!value || typeof value !== 'object') return {}
  const result: Record<string, boolean | null> = {}
  for (const [teamId, raw] of Object.entries(value as Record<string, unknown>)) {
    result[teamId] = raw === true || raw === false ? raw : null
  }
  return result
}

function asJuryByTeam(value: unknown): Record<string, JuryScores> {
  if (!value || typeof value !== 'object') return {}
  const result: Record<string, JuryScores> = {}
  for (const [teamId, raw] of Object.entries(value as Record<string, unknown>)) {
    result[teamId] = asJury(raw)
  }
  return result
}

type LegacyFlatData = {
  orderQty?: unknown
  estimateQty?: unknown
  actualQty?: unknown
  orderSubmittedElapsedMs?: unknown
  estimateSubmittedElapsedMs?: unknown
  actualSubmittedElapsedMs?: unknown
  loadTestPassed?: unknown
  jury?: unknown
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
    const data = JSON.parse(raw) as Partial<WorkshopData> & LegacyFlatData
    const groupName = typeof data.groupName === 'string' ? data.groupName : ''
    const teams = migrateTeams(data, groupName)
    const activeTeamId =
      typeof data.activeTeamId === 'string' &&
      teams.some((team) => team.id === data.activeTeamId)
        ? data.activeTeamId
        : (teams[0]?.id ?? '')

    const sheetsByTeam = asSheetsByTeam(data.sheetsByTeam)
    const submittedByTeam = asSubmittedByTeam(data.submittedByTeam)
    const loadTestByTeam = asLoadTestByTeam(data.loadTestByTeam)
    const juryByTeam = asJuryByTeam(data.juryByTeam)

    // Legacy flat fields (pre per-team model) migrate onto the active team.
    const legacyTarget = activeTeamId || teams[0]?.id || ''
    if (legacyTarget) {
      if (
        sheetsByTeam[legacyTarget] == null &&
        (data.orderQty != null || data.estimateQty != null || data.actualQty != null)
      ) {
        const defaults = defaultTeamSheets()
        sheetsByTeam[legacyTarget] = {
          order: data.orderQty != null ? asQty(data.orderQty) : defaults.order,
          estimate:
            data.estimateQty != null ? asQty(data.estimateQty) : defaults.estimate,
          actual: data.actualQty != null ? asQty(data.actualQty) : defaults.actual,
        }
      }
      if (submittedByTeam[legacyTarget] == null) {
        const legacy: Partial<Record<SheetId, number>> = {}
        if (typeof data.orderSubmittedElapsedMs === 'number') {
          legacy.order = data.orderSubmittedElapsedMs
        }
        if (typeof data.estimateSubmittedElapsedMs === 'number') {
          legacy.estimate = data.estimateSubmittedElapsedMs
        }
        if (typeof data.actualSubmittedElapsedMs === 'number') {
          legacy.actual = data.actualSubmittedElapsedMs
        }
        if (Object.keys(legacy).length > 0) submittedByTeam[legacyTarget] = legacy
      }
      if (
        loadTestByTeam[legacyTarget] === undefined &&
        (data.loadTestPassed === true || data.loadTestPassed === false)
      ) {
        loadTestByTeam[legacyTarget] = data.loadTestPassed
      }
      if (juryByTeam[legacyTarget] == null && data.jury != null) {
        juryByTeam[legacyTarget] = asJury(data.jury)
      }
    }

    // Every team needs its own buckets.
    for (const team of teams) {
      sheetsByTeam[team.id] ??= defaultTeamSheets()
      juryByTeam[team.id] ??= defaultJury()
      loadTestByTeam[team.id] ??= null
    }

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
      sheetsByTeam,
      submittedByTeam,
      loadTestByTeam,
      juryByTeam,
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
      sheetsByTeam: {},
      submittedByTeam: {},
      loadTestByTeam: {},
      juryByTeam: {},
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

  function withTeamBuckets(teamId: string): Partial<WorkshopData> {
    return {
      sheetsByTeam: { ...state.sheetsByTeam, [teamId]: defaultTeamSheets() },
      juryByTeam: { ...state.juryByTeam, [teamId]: defaultJury() },
      loadTestByTeam: { ...state.loadTestByTeam, [teamId]: null },
    }
  }

  function withoutTeamBuckets(teamId: string): Partial<WorkshopData> {
    const sheetsByTeam = { ...state.sheetsByTeam }
    const submittedByTeam = { ...state.submittedByTeam }
    const loadTestByTeam = { ...state.loadTestByTeam }
    const juryByTeam = { ...state.juryByTeam }
    delete sheetsByTeam[teamId]
    delete submittedByTeam[teamId]
    delete loadTestByTeam[teamId]
    delete juryByTeam[teamId]
    return { sheetsByTeam, submittedByTeam, loadTestByTeam, juryByTeam }
  }

  function withTeamSheets(
    teamId: string,
    sheets: TeamSheets,
  ): WorkshopData {
    return {
      ...state,
      sheetsByTeam: { ...state.sheetsByTeam, [teamId]: sheets },
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
          ...withTeamBuckets('team-1'),
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
      const next = withTeams(teams, created?.id ?? state.activeTeamId)
      commit(created ? { ...next, ...withTeamBuckets(created.id) } : next)
    },
    removeTeam(id: string) {
      commit({ ...withTeams(dropTeam(state.teams, id)), ...withoutTeamBuckets(id) })
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
    setQuantity(sheet: SheetId, itemId: string, quantity: number, teamId?: string) {
      const id = teamId ?? state.activeTeamId
      const sheets = getTeamSheets(state, id)
      commit(
        withTeamSheets(id, {
          ...sheets,
          [sheet]: { ...sheets[sheet], [itemId]: clampQuantity(itemId, quantity) },
        }),
      )
    },
    copyMaterialQuantities(from: SheetId, to: SheetId, teamId?: string) {
      if (from === to) return
      const id = teamId ?? state.activeTeamId
      const sheets = getTeamSheets(state, id)
      const next = { ...sheets[to] }
      for (const item of materialItems) {
        next[item.id] = sheets[from][item.id] ?? 0
      }
      commit(withTeamSheets(id, { ...sheets, [to]: next }))
    },
    copySheetQuantities(from: SheetId, to: SheetId, teamId?: string) {
      if (from === to) return
      const id = teamId ?? state.activeTeamId
      const sheets = getTeamSheets(state, id)
      const next = { ...sheets[to] }
      for (const item of estimateItems) {
        next[item.id] = sheets[from][item.id] ?? 0
      }
      commit(withTeamSheets(id, { ...sheets, [to]: next }))
    },
    submit(sheet: SheetId, elapsedMs: number, teamId?: string) {
      const id = teamId ?? state.activeTeamId
      commit({
        ...state,
        submittedByTeam: {
          ...state.submittedByTeam,
          [id]: { ...state.submittedByTeam[id], [sheet]: elapsedMs },
        },
      })
    },
    setLoadTestPassed(value: boolean | null, teamId?: string) {
      const id = teamId ?? state.activeTeamId
      commit({
        ...state,
        loadTestByTeam: { ...state.loadTestByTeam, [id]: value },
      })
    },
    setJury(jury: JuryScores, teamId?: string) {
      const id = teamId ?? state.activeTeamId
      commit({
        ...state,
        juryByTeam: {
          ...state.juryByTeam,
          [id]: {
            cost: clampScore(jury.cost),
            deviation: clampScore(jury.deviation),
            looks: clampScore(jury.looks),
            stability: clampScore(jury.stability),
          },
        },
      })
    },
    applyTimeAdjustments(
      sheet: 'estimate' | 'actual',
      extraBlocks: number,
      savedBlocks: number,
      teamId?: string,
    ) {
      const id = teamId ?? state.activeTeamId
      const sheets = getTeamSheets(state, id)
      commit(
        withTeamSheets(id, {
          ...sheets,
          [sheet]: {
            ...sheets[sheet],
            'overtime-10': clampQuantity('overtime-10', extraBlocks),
            'saved-10': clampQuantity('saved-10', savedBlocks),
          },
        }),
      )
    },
  }
}

export const workshopStore = createWorkshopStore({
  storage: typeof localStorage === 'undefined' ? undefined : localStorage,
})

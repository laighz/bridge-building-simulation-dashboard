export type PhaseId =
  | 'vorbereitung'
  | 'auftrag'
  | 'planung'
  | 'realisierung'
  | 'abschluss'

export type MilestoneId = 'vorkalkulation' | 'skizze' | 'fertigstellung'

export type MilestoneConfig = {
  id: MilestoneId
  label: string
  hint: string
  atMinutes: number
}

export type PhaseConfig = {
  id: PhaseId
  label: string
  startMinutes: number | null
}

export type WorkshopConfig = {
  title: string
  planningMinutes: number
  realizationMinutes: number
  warningMinutes: number
  criticalMinutes: number
  milestones: MilestoneConfig[]
  phases: PhaseConfig[]
}

export function totalMinutes(config: WorkshopConfig): number {
  return config.planningMinutes + config.realizationMinutes
}

export type TimingOverrides = {
  planningMinutes?: number
  realizationMinutes?: number
  briefingMinutes?: number // Phasenstart Planung (Default 10)
  estimateDueMinute?: number // Meilenstein Vorkalkulation (Default 30)
  sketchDueMinute?: number // Meilenstein Projektskizze (Default: Planungszeit)
  warningMinutes?: number // Default 5
  criticalMinutes?: number // Default 1
}

const TIMING_OVERRIDE_KEYS = [
  'planningMinutes',
  'realizationMinutes',
  'briefingMinutes',
  'estimateDueMinute',
  'sketchDueMinute',
  'warningMinutes',
  'criticalMinutes',
] as const

export function sanitizeTimingOverrides(value: unknown): TimingOverrides {
  if (typeof value !== 'object' || value === null) return {}
  const record = value as Record<string, unknown>
  const result: TimingOverrides = {}
  for (const key of TIMING_OVERRIDE_KEYS) {
    const raw = record[key]
    if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 0) {
      result[key] = raw
    }
  }
  return result
}

function milestoneAt(base: WorkshopConfig, id: MilestoneId): number | undefined {
  return base.milestones.find((milestone) => milestone.id === id)?.atMinutes
}

function phaseStart(base: WorkshopConfig, id: PhaseId): number | null | undefined {
  return base.phases.find((phase) => phase.id === id)?.startMinutes
}

function milestoneMeta(base: WorkshopConfig, id: MilestoneId) {
  return base.milestones.find((milestone) => milestone.id === id)
}

function phaseMeta(base: WorkshopConfig, id: PhaseId) {
  return base.phases.find((phase) => phase.id === id)
}

export function applyTimingOverrides(
  base: WorkshopConfig,
  overrides: TimingOverrides,
): WorkshopConfig {
  const planning = overrides.planningMinutes ?? base.planningMinutes
  const realization = overrides.realizationMinutes ?? base.realizationMinutes
  const briefing =
    overrides.briefingMinutes ?? phaseStart(base, 'planung') ?? 10
  const estimateDue =
    overrides.estimateDueMinute ?? milestoneAt(base, 'vorkalkulation') ?? 30
  // Ableitung: In der Basis-Konfiguration faellt die Projektskizze mit dem
  // Ende der Planungszeit zusammen (45 = planningMinutes). Ohne expliziten
  // Override folgt der Skizzen-Meilenstein daher der Planungszeit. Die
  // Realisierungsphase startet am Skizzen-Meilenstein; Fertigstellung und
  // Abschluss liegen bei planning + realization.
  const sketchDue = overrides.sketchDueMinute ?? planning
  const warning = overrides.warningMinutes ?? base.warningMinutes
  const critical = overrides.criticalMinutes ?? base.criticalMinutes
  const total = planning + realization

  const vorkalkulation = milestoneMeta(base, 'vorkalkulation')
  const skizze = milestoneMeta(base, 'skizze')
  const fertigstellung = milestoneMeta(base, 'fertigstellung')

  return {
    ...base,
    planningMinutes: planning,
    realizationMinutes: realization,
    warningMinutes: warning,
    criticalMinutes: critical,
    milestones: [
      {
        id: 'vorkalkulation',
        label: vorkalkulation?.label ?? 'Vorkalkulation',
        hint: vorkalkulation?.hint ?? 'abgeben',
        atMinutes: estimateDue,
      },
      {
        id: 'skizze',
        label: skizze?.label ?? 'Projektskizze',
        hint: skizze?.hint ?? 'abgeben',
        atMinutes: sketchDue,
      },
      {
        id: 'fertigstellung',
        label: fertigstellung?.label ?? 'Fertigstellung',
        hint: fertigstellung?.hint ?? 'Brücke fertig',
        atMinutes: total,
      },
    ],
    phases: [
      {
        id: 'vorbereitung',
        label: phaseMeta(base, 'vorbereitung')?.label ?? 'Vorbereitung',
        startMinutes: null,
      },
      {
        id: 'auftrag',
        label: phaseMeta(base, 'auftrag')?.label ?? 'Auftrag',
        startMinutes: phaseStart(base, 'auftrag') ?? 0,
      },
      {
        id: 'planung',
        label: phaseMeta(base, 'planung')?.label ?? 'Planung',
        startMinutes: briefing,
      },
      {
        id: 'realisierung',
        label: phaseMeta(base, 'realisierung')?.label ?? 'Realisierung',
        startMinutes: sketchDue,
      },
      {
        id: 'abschluss',
        label: phaseMeta(base, 'abschluss')?.label ?? 'Abschluss',
        startMinutes: total,
      },
    ],
  }
}

export const workshopConfig: WorkshopConfig = {
  title: 'Brückenbau-Simulation',
  planningMinutes: 45,
  realizationMinutes: 90,
  warningMinutes: 5,
  criticalMinutes: 1,
  milestones: [
    {
      id: 'vorkalkulation',
      label: 'Vorkalkulation',
      hint: 'abgeben',
      atMinutes: 30,
    },
    {
      id: 'skizze',
      label: 'Projektskizze',
      hint: 'abgeben',
      atMinutes: 45,
    },
    {
      id: 'fertigstellung',
      label: 'Fertigstellung',
      hint: 'Brücke fertig',
      atMinutes: 45 + 90,
    },
  ],
  phases: [
    { id: 'vorbereitung', label: 'Vorbereitung', startMinutes: null },
    { id: 'auftrag', label: 'Auftrag', startMinutes: 0 },
    { id: 'planung', label: 'Planung', startMinutes: 10 },
    { id: 'realisierung', label: 'Realisierung', startMinutes: 45 },
    { id: 'abschluss', label: 'Abschluss', startMinutes: 45 + 90 },
  ],
}

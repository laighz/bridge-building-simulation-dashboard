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

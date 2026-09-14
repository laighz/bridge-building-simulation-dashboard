import { workshopConfig, type PhaseId } from '../config/workshop.ts'

export function phaseLabel(id: PhaseId): string {
  return workshopConfig.phases.find((phase) => phase.id === id)?.label ?? id
}

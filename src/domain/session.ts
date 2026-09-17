import {
  totalMinutes,
  type MilestoneId,
  type PhaseId,
  type TimingOverrides,
  type WorkshopConfig,
} from '../config/workshop.ts'

export type SessionStatus = 'idle' | 'running' | 'paused'

export type SessionState = {
  status: SessionStatus
  startedAtMs: number | null
  elapsedMsAtPause: number
  phaseOverride: PhaseId | null
  timingOverrides: TimingOverrides
}

export type MilestoneStatus = 'upcoming' | 'current' | 'due' | 'reached'

export type PhaseStatus = 'upcoming' | 'active' | 'completed'

export type Urgency = 'normal' | 'warning' | 'critical' | 'overtime'

export type MilestoneView = {
  id: MilestoneId
  label: string
  hint: string
  atMinutes: number
  atMs: number
  remainingMs: number
  status: MilestoneStatus
}

export type PhaseView = {
  id: PhaseId
  label: string
  status: PhaseStatus
}

export type WorkshopView = {
  elapsedMs: number
  totalMs: number
  remainingMs: number
  overtimeMs: number
  isOvertime: boolean
  clockRunning: boolean
  activePhaseId: PhaseId
  phases: PhaseView[]
  milestones: MilestoneView[]
  nextMilestone: MilestoneView | null
  urgency: Urgency
  progress: number
}

export const initialSessionState: SessionState = {
  status: 'idle',
  startedAtMs: null,
  elapsedMsAtPause: 0,
  phaseOverride: null,
  timingOverrides: {},
}

export const DUE_WINDOW_MS = 10_000

export type SessionEvent =
  | { type: 'milestoneReached'; id: MilestoneId }
  | { type: 'overtimeStarted' }

export function elapsedMs(state: SessionState, nowMs: number): number {
  if (state.status === 'idle') return 0
  if (state.status === 'paused' || state.startedAtMs == null) {
    return state.elapsedMsAtPause
  }
  return state.elapsedMsAtPause + (nowMs - state.startedAtMs)
}

function resolvePhase(
  config: WorkshopConfig,
  state: SessionState,
  elapsed: number,
): PhaseId {
  if (state.phaseOverride) return state.phaseOverride
  if (state.status === 'idle') return 'vorbereitung'

  const elapsedMinutes = elapsed / 60_000
  let active: PhaseId = 'auftrag'
  for (const phase of config.phases) {
    if (phase.startMinutes == null) continue
    if (elapsedMinutes >= phase.startMinutes) {
      active = phase.id
    }
  }
  return active
}

function resolvePhaseViews(
  config: WorkshopConfig,
  state: SessionState,
  elapsed: number,
  activePhaseId: PhaseId,
): PhaseView[] {
  const elapsedMinutes = elapsed / 60_000
  return config.phases.map((phase, index) => {
    if (phase.id === activePhaseId) {
      return { id: phase.id, label: phase.label, status: 'active' }
    }
    const next = config.phases[index + 1]
    const finishedByTime =
      phase.startMinutes == null
        ? state.status !== 'idle'
        : next?.startMinutes != null && elapsedMinutes >= next.startMinutes
    return {
      id: phase.id,
      label: phase.label,
      status: finishedByTime ? 'completed' : 'upcoming',
    }
  })
}

function milestoneStatus(
  atMs: number,
  elapsed: number,
  nextAtMs: number | null,
): MilestoneStatus {
  if (elapsed >= atMs + DUE_WINDOW_MS) return 'reached'
  if (elapsed >= atMs) return 'due'
  if (nextAtMs == null || atMs === nextAtMs) return 'current'
  return 'upcoming'
}

export function sessionEvents(
  config: WorkshopConfig,
  previousElapsedMs: number,
  currentElapsedMs: number,
): SessionEvent[] {
  const events: SessionEvent[] = []
  for (const milestone of config.milestones) {
    const atMs = milestone.atMinutes * 60_000
    if (previousElapsedMs < atMs && currentElapsedMs >= atMs) {
      events.push({ type: 'milestoneReached', id: milestone.id })
    }
  }
  const totalMs = totalMinutes(config) * 60_000
  if (previousElapsedMs < totalMs && currentElapsedMs >= totalMs) {
    events.push({ type: 'overtimeStarted' })
  }
  return events
}

function resolveUrgency(
  config: WorkshopConfig,
  remainingToNextMs: number | null,
  isOvertime: boolean,
): Urgency {
  if (isOvertime) return 'overtime'
  if (remainingToNextMs == null) return 'normal'
  if (remainingToNextMs <= config.criticalMinutes * 60_000) return 'critical'
  if (remainingToNextMs <= config.warningMinutes * 60_000) return 'warning'
  return 'normal'
}

export function deriveView(
  config: WorkshopConfig,
  state: SessionState,
  nowMs: number,
): WorkshopView {
  const elapsed = elapsedMs(state, nowMs)
  const totalMs = totalMinutes(config) * 60_000
  const remainingMs = Math.max(0, totalMs - elapsed)
  const overtimeMs = Math.max(0, elapsed - totalMs)
  const isOvertime =
    overtimeMs > 0 || (elapsed >= totalMs && state.status !== 'idle')
  const activePhaseId = resolvePhase(config, state, elapsed)

  const sorted = [...config.milestones].sort((a, b) => a.atMinutes - b.atMinutes)
  const nextConfig = sorted.find((m) => elapsed < m.atMinutes * 60_000) ?? null
  const nextAtMs = nextConfig ? nextConfig.atMinutes * 60_000 : null

  const milestones: MilestoneView[] = sorted.map((m) => {
    const atMs = m.atMinutes * 60_000
    const remainingForMilestone = Math.max(0, atMs - elapsed)
    return {
      id: m.id,
      label: m.label,
      hint: m.hint,
      atMinutes: m.atMinutes,
      atMs,
      remainingMs: remainingForMilestone,
      status: milestoneStatus(atMs, elapsed, nextAtMs),
    }
  })

  const nextMilestone = milestones.find((m) => m.status === 'current') ?? null
  const remainingToNext = nextMilestone?.remainingMs ?? null

  return {
    elapsedMs: elapsed,
    totalMs,
    remainingMs,
    overtimeMs,
    isOvertime,
    clockRunning: state.status === 'running',
    activePhaseId,
    phases: resolvePhaseViews(config, state, elapsed, activePhaseId),
    milestones,
    nextMilestone,
    urgency: resolveUrgency(config, remainingToNext, isOvertime),
    progress: totalMs === 0 ? 0 : Math.min(1, elapsed / totalMs),
  }
}

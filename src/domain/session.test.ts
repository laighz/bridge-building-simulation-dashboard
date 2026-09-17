import { describe, expect, it } from 'vitest'
import { applyTimingOverrides, workshopConfig } from '../config/workshop.ts'
import {
  deriveView,
  elapsedMs,
  initialSessionState,
  sessionEvents,
  type SessionState,
} from './session.ts'

const MIN = 60_000

function runningAt(elapsed: number): { state: SessionState; nowMs: number } {
  return {
    state: {
      status: 'running',
      startedAtMs: 0,
      elapsedMsAtPause: 0,
      phaseOverride: null,
      timingOverrides: {},
    },
    nowMs: elapsed,
  }
}

describe('elapsedMs', () => {
  it('is 0 while idle', () => {
    expect(elapsedMs(initialSessionState, 50_000)).toBe(0)
  })

  it('counts from start while running', () => {
    const state: SessionState = {
      status: 'running',
      startedAtMs: 10_000,
      elapsedMsAtPause: 0,
      phaseOverride: null,
      timingOverrides: {},
    }
    expect(elapsedMs(state, 25_000)).toBe(15_000)
  })

  it('freezes elapsed while paused', () => {
    const state: SessionState = {
      status: 'paused',
      startedAtMs: null,
      elapsedMsAtPause: 12_000,
      phaseOverride: null,
      timingOverrides: {},
    }
    expect(elapsedMs(state, 99_000)).toBe(12_000)
  })

  it('resumes from accumulated pause time', () => {
    const state: SessionState = {
      status: 'running',
      startedAtMs: 100_000,
      elapsedMsAtPause: 30_000,
      phaseOverride: null,
      timingOverrides: {},
    }
    expect(elapsedMs(state, 110_000)).toBe(40_000)
  })
})

describe('workshop timeline 30 / 45 / +90', () => {
  it('starts with 2h 15m remaining (45 min planning + 90 min realization)', () => {
    const { state, nowMs } = runningAt(0)
    const view = deriveView(workshopConfig, state, nowMs)
    expect(view.totalMs).toBe(135 * MIN)
    expect(view.remainingMs).toBe(135 * MIN)
    expect(view.overtimeMs).toBe(0)
    expect(view.activePhaseId).toBe('auftrag')
    expect(view.nextMilestone?.id).toBe('vorkalkulation')
  })

  it('keeps Vorkalkulation current at 29:59', () => {
    const { state, nowMs } = runningAt(30 * MIN - 1000)
    const view = deriveView(workshopConfig, state, nowMs)
    expect(view.milestones.map((m) => [m.id, m.status])).toEqual([
      ['vorkalkulation', 'current'],
      ['skizze', 'upcoming'],
      ['fertigstellung', 'upcoming'],
    ])
    expect(view.nextMilestone?.remainingMs).toBe(1000)
  })

  it('marks Vorkalkulation due at 30:00 and aims at the sketch', () => {
    const { state, nowMs } = runningAt(30 * MIN)
    const view = deriveView(workshopConfig, state, nowMs)
    expect(view.milestones.find((m) => m.id === 'vorkalkulation')?.status).toBe(
      'due',
    )
    expect(view.nextMilestone?.id).toBe('skizze')
    expect(view.nextMilestone?.remainingMs).toBe(15 * MIN)
  })

  it('marks Vorkalkulation reached after the due window', () => {
    const { state, nowMs } = runningAt(30 * MIN + 15_000)
    const view = deriveView(workshopConfig, state, nowMs)
    expect(view.milestones.find((m) => m.id === 'vorkalkulation')?.status).toBe(
      'reached',
    )
  })

  it('keeps the sketch current at 44:59', () => {
    const { state, nowMs } = runningAt(45 * MIN - 1000)
    const view = deriveView(workshopConfig, state, nowMs)
    expect(view.nextMilestone?.id).toBe('skizze')
    expect(view.nextMilestone?.status).toBe('current')
    expect(view.nextMilestone?.remainingMs).toBe(1000)
  })

  it('marks the sketch due at 45:00 and then has 90 minutes left', () => {
    const { state, nowMs } = runningAt(45 * MIN)
    const view = deriveView(workshopConfig, state, nowMs)
    expect(view.milestones.find((m) => m.id === 'skizze')?.status).toBe('due')
    expect(view.remainingMs).toBe(90 * MIN)
    expect(view.nextMilestone?.id).toBe('fertigstellung')
    expect(view.nextMilestone?.remainingMs).toBe(90 * MIN)
    expect(view.activePhaseId).toBe('realisierung')
  })

  it('keeps realization as the active phase during the extra 90 minutes', () => {
    const { state, nowMs } = runningAt(45 * MIN + 40 * MIN)
    const view = deriveView(workshopConfig, state, nowMs)
    expect(view.activePhaseId).toBe('realisierung')
    expect(view.remainingMs).toBe(50 * MIN)
  })

  it('finishes at 135 minutes and starts overtime', () => {
    const { state, nowMs } = runningAt(135 * MIN + 8_000)
    const view = deriveView(workshopConfig, state, nowMs)
    expect(view.remainingMs).toBe(0)
    expect(view.overtimeMs).toBe(8_000)
    expect(view.isOvertime).toBe(true)
    expect(view.activePhaseId).toBe('abschluss')
    expect(view.milestones.find((m) => m.id === 'fertigstellung')?.status).toBe(
      'due',
    )
    expect(view.nextMilestone).toBeNull()
  })
})

describe('phase colors follow finished task windows', () => {
  it('keeps Vorbereitung active before start', () => {
    const view = deriveView(workshopConfig, initialSessionState, 0)
    expect(view.phases.map((p) => [p.id, p.status])).toEqual([
      ['vorbereitung', 'active'],
      ['auftrag', 'upcoming'],
      ['planung', 'upcoming'],
      ['realisierung', 'upcoming'],
      ['abschluss', 'upcoming'],
    ])
  })

  it('completes Vorbereitung when the clock starts', () => {
    const { state, nowMs } = runningAt(0)
    const view = deriveView(workshopConfig, state, nowMs)
    expect(view.phases.find((p) => p.id === 'vorbereitung')?.status).toBe(
      'completed',
    )
    expect(view.phases.find((p) => p.id === 'auftrag')?.status).toBe('active')
  })

  it('marks Auftrag completed once Planung begins at 10 minutes', () => {
    const { state, nowMs } = runningAt(10 * MIN)
    const view = deriveView(workshopConfig, state, nowMs)
    expect(view.phases.find((p) => p.id === 'auftrag')?.status).toBe('completed')
    expect(view.phases.find((p) => p.id === 'planung')?.status).toBe('active')
  })

  it('marks Planung completed when the sketch timer is done at 45 minutes', () => {
    const { state, nowMs } = runningAt(45 * MIN)
    const view = deriveView(workshopConfig, state, nowMs)
    expect(view.phases.find((p) => p.id === 'planung')?.status).toBe('completed')
    expect(view.phases.find((p) => p.id === 'realisierung')?.status).toBe(
      'active',
    )
  })

  it('marks Realisierung completed when the 90 minute build timer is done', () => {
    const { state, nowMs } = runningAt(135 * MIN)
    const view = deriveView(workshopConfig, state, nowMs)
    expect(view.phases.find((p) => p.id === 'realisierung')?.status).toBe(
      'completed',
    )
    expect(view.phases.find((p) => p.id === 'abschluss')?.status).toBe('active')
  })
})

describe('phases', () => {
  it('uses Vorbereitung before the clock starts', () => {
    const view = deriveView(workshopConfig, initialSessionState, 0)
    expect(view.activePhaseId).toBe('vorbereitung')
    expect(view.clockRunning).toBe(false)
  })

  it('enters Planung after the Auftrag window', () => {
    const { state, nowMs } = runningAt(10 * MIN)
    expect(deriveView(workshopConfig, state, nowMs).activePhaseId).toBe('planung')
  })

  it('honors a facilitator phase override', () => {
    const { state, nowMs } = runningAt(12 * MIN)
    const view = deriveView(
      workshopConfig,
      { ...state, phaseOverride: 'realisierung' },
      nowMs,
    )
    expect(view.activePhaseId).toBe('realisierung')
    expect(view.phases.find((p) => p.id === 'realisierung')?.status).toBe(
      'active',
    )
  })
})

describe('sessionEvents', () => {
  it('emits milestoneReached when elapsed crosses a deadline', () => {
    expect(sessionEvents(workshopConfig, 30 * MIN - 1, 30 * MIN)).toEqual([
      { type: 'milestoneReached', id: 'vorkalkulation' },
    ])
  })

  it('emits overtimeStarted when elapsed crosses the 135 minute total', () => {
    expect(sessionEvents(workshopConfig, 135 * MIN - 1, 135 * MIN)).toEqual([
      { type: 'milestoneReached', id: 'fertigstellung' },
      { type: 'overtimeStarted' },
    ])
  })

  it('emits nothing when elapsed stays inside the same window', () => {
    expect(sessionEvents(workshopConfig, 10 * MIN, 11 * MIN)).toEqual([])
  })
})

describe('urgency', () => {
  it('is warning within 5 minutes of the next milestone', () => {
    const { state, nowMs } = runningAt(26 * MIN)
    const view = deriveView(workshopConfig, state, nowMs)
    expect(view.urgency).toBe('warning')
  })

  it('is critical within 1 minute of the next milestone', () => {
    const { state, nowMs } = runningAt(44 * MIN + 30_000)
    const view = deriveView(workshopConfig, state, nowMs)
    expect(view.urgency).toBe('critical')
  })

  it('is overtime after the full 135 minutes', () => {
    const { state, nowMs } = runningAt(135 * MIN)
    expect(deriveView(workshopConfig, state, nowMs).urgency).toBe('overtime')
  })
})

describe('applyTimingOverrides', () => {
  it('reproduces the base timeline when no overrides are set', () => {
    const config = applyTimingOverrides(workshopConfig, {})
    expect(config.milestones.map((m) => [m.id, m.atMinutes])).toEqual([
      ['vorkalkulation', 30],
      ['skizze', 45],
      ['fertigstellung', 135],
    ])
    expect(config.phases.map((p) => [p.id, p.startMinutes])).toEqual([
      ['vorbereitung', null],
      ['auftrag', 0],
      ['planung', 10],
      ['realisierung', 45],
      ['abschluss', 135],
    ])
    const { state, nowMs } = runningAt(0)
    expect(deriveView(config, state, nowMs).totalMs).toBe(135 * MIN)
  })

  it('recomputes milestones and phases from planning/realization overrides', () => {
    const config = applyTimingOverrides(workshopConfig, {
      planningMinutes: 30,
      realizationMinutes: 60,
    })
    // Ohne expliziten sketchDueMinute folgt die Skizze der Planungszeit.
    expect(config.milestones.find((m) => m.id === 'skizze')?.atMinutes).toBe(30)
    expect(
      config.milestones.find((m) => m.id === 'fertigstellung')?.atMinutes,
    ).toBe(90)
    expect(config.phases.find((p) => p.id === 'realisierung')?.startMinutes).toBe(
      30,
    )
    expect(config.phases.find((p) => p.id === 'abschluss')?.startMinutes).toBe(90)
    const { state, nowMs } = runningAt(30 * MIN)
    const view = deriveView(config, state, nowMs)
    expect(view.activePhaseId).toBe('realisierung')
    expect(view.remainingMs).toBe(60 * MIN)
  })

  it('starts realization at an explicit sketchDueMinute', () => {
    const config = applyTimingOverrides(workshopConfig, { sketchDueMinute: 50 })
    expect(config.milestones.find((m) => m.id === 'skizze')?.atMinutes).toBe(50)
    expect(config.phases.find((p) => p.id === 'realisierung')?.startMinutes).toBe(
      50,
    )
    const { state, nowMs } = runningAt(45 * MIN)
    expect(deriveView(config, state, nowMs).activePhaseId).toBe('planung')
  })

  it('moves the planning phase start with briefingMinutes', () => {
    const config = applyTimingOverrides(workshopConfig, { briefingMinutes: 5 })
    expect(config.phases.find((p) => p.id === 'planung')?.startMinutes).toBe(5)
    const { state, nowMs } = runningAt(5 * MIN)
    expect(deriveView(config, state, nowMs).activePhaseId).toBe('planung')
  })

  it('shifts the estimate milestone with estimateDueMinute', () => {
    const config = applyTimingOverrides(workshopConfig, {
      estimateDueMinute: 20,
    })
    const { state, nowMs } = runningAt(20 * MIN)
    const view = deriveView(config, state, nowMs)
    expect(
      view.milestones.find((m) => m.id === 'vorkalkulation')?.status,
    ).toBe('due')
    expect(view.nextMilestone?.id).toBe('skizze')
  })

  it('adjusts the warning and critical windows', () => {
    const config = applyTimingOverrides(workshopConfig, {
      warningMinutes: 10,
      criticalMinutes: 3,
    })
    const eightBefore = runningAt(22 * MIN)
    expect(deriveView(config, eightBefore.state, eightBefore.nowMs).urgency).toBe(
      'warning',
    )
    const twoBefore = runningAt(28 * MIN)
    expect(deriveView(config, twoBefore.state, twoBefore.nowMs).urgency).toBe(
      'critical',
    )
  })
})

import { describe, expect, it } from 'vitest'
import { nextDeadlineCopy } from './deadlineCopy.ts'

describe('nextDeadlineCopy', () => {
  it('explains the 45 then 90 minute split while idle', () => {
    expect(
      nextDeadlineCopy({
        status: 'idle',
        overtime: false,
        nextLabel: 'Vorkalkulation',
        nextRemainingMs: 30 * 60_000,
      }),
    ).toBe('45 Min Planung (Abgaben bei 30 und 45) — danach 90 Min Bau')
  })

  it('names the next deadline and remaining time', () => {
    expect(
      nextDeadlineCopy({
        status: 'running',
        overtime: false,
        nextLabel: 'Vorkalkulation',
        nextRemainingMs: 12 * 60_000,
      }),
    ).toBe('Nächste Abgabe: Vorkalkulation in 00:12:00')
  })

  it('mentions the 90 minute realization after the sketch', () => {
    expect(
      nextDeadlineCopy({
        status: 'running',
        overtime: false,
        nextLabel: 'Fertigstellung',
        nextRemainingMs: 90 * 60_000,
      }),
    ).toBe(
      'Nächste Abgabe: Fertigstellung in 01:30:00 — 90 Min nach der Skizze',
    )
  })

  it('announces overtime after realization', () => {
    expect(
      nextDeadlineCopy({
        status: 'running',
        overtime: true,
        nextLabel: undefined,
        nextRemainingMs: 0,
      }),
    ).toBe('Die 90 Minuten Realisierung sind um.')
  })
})

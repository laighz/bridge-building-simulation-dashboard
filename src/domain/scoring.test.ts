import { describe, expect, it } from 'vitest'
import { clampScore, isDisqualified, juryTotal } from './scoring.ts'

describe('clampScore', () => {
  it('rounds and keeps scores in 0–10', () => {
    expect(clampScore(12)).toBe(10)
    expect(clampScore(-1)).toBe(0)
    expect(clampScore(7.6)).toBe(8)
  })
})

describe('juryTotal', () => {
  it('sums four 0-10 scores', () => {
    expect(
      juryTotal({
        cost: 8,
        deviation: 7,
        looks: 9,
        stability: 10,
      }),
    ).toBe(34)
  })
})

describe('isDisqualified', () => {
  it('disqualifies when the 1 kg load test fails', () => {
    expect(
      isDisqualified({
        loadTestPassed: false,
        costExcluded: false,
      }),
    ).toBe(true)
  })

  it('disqualifies when Nachkalkulation exceeds 40 percent deviation', () => {
    expect(
      isDisqualified({
        loadTestPassed: true,
        costExcluded: true,
      }),
    ).toBe(true)
  })

  it('keeps a team that passes load test and cost deviation', () => {
    expect(
      isDisqualified({
        loadTestPassed: true,
        costExcluded: false,
      }),
    ).toBe(false)
  })
})

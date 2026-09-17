import { describe, expect, it } from 'vitest'
import { COST_DEVIATION_LIMIT_PERCENT, estimateItems } from '../config/catalog.ts'
import {
  costDeviationPercent,
  costDeviationVerdict,
  isExcludedByCost,
  lineTotal,
  sheetTotal,
  timeAdjustmentQty,
} from './costing.ts'

describe('lineTotal', () => {
  it('multiplies pack quantity by unit price', () => {
    expect(lineTotal(2, 570_000)).toBe(1_140_000)
  })

  it('treats empty quantity as zero', () => {
    expect(lineTotal(0, 570_000)).toBe(0)
  })

  it('does not render negative zero on unused saved-time lines', () => {
    expect(lineTotal(0, -1_000_000)).toBe(0)
    expect(Object.is(lineTotal(0, -1_000_000), -0)).toBe(false)
  })
})

describe('sheetTotal', () => {
  it('sums material and overhead lines', () => {
    const qty: Record<string, number> = {
      'carton-1': 1,
      overhead: 1,
    }
    expect(sheetTotal(estimateItems, qty)).toBe(570_000 + 12_500_000)
  })
})

describe('costDeviationPercent', () => {
  it('is the percent difference of Nachkalkulation vs Vorkalkulation', () => {
    expect(costDeviationPercent(10_000_000, 12_000_000)).toBe(20)
  })

  it('is negative when actual costs are lower', () => {
    expect(costDeviationPercent(10_000_000, 8_000_000)).toBe(-20)
  })
})

describe('isExcludedByCost', () => {
  it(`excludes the team when deviation exceeds ${COST_DEVIATION_LIMIT_PERCENT}%`, () => {
    expect(isExcludedByCost(10_000_000, 14_100_000)).toBe(true)
  })

  it('keeps the team at exactly 40 percent', () => {
    expect(isExcludedByCost(10_000_000, 14_000_000)).toBe(false)
  })
})

describe('costDeviationVerdict', () => {
  it('keeps the team at exactly 40.0 percent', () => {
    const verdict = costDeviationVerdict(10_000_000, 14_000_000)
    expect(verdict.deviation).toBe(40)
    expect(verdict.excluded).toBe(false)
  })

  it('excludes the team at 40.1 percent', () => {
    const verdict = costDeviationVerdict(10_000_000, 14_010_000)
    expect(verdict.deviation).toBeCloseTo(40.1, 5)
    expect(verdict.excluded).toBe(true)
  })

  it('excludes large negative deviations as well', () => {
    const verdict = costDeviationVerdict(10_000_000, 5_000_000)
    expect(verdict.deviation).toBe(-50)
    expect(verdict.excluded).toBe(true)
  })

  it('reports zero deviation when both sums are zero', () => {
    expect(costDeviationVerdict(0, 0)).toEqual({
      deviation: 0,
      excluded: false,
    })
  })

  it('reports no deviation when the planned sum is zero', () => {
    expect(costDeviationVerdict(0, 5_000_000)).toEqual({
      deviation: null,
      excluded: false,
    })
  })
})

describe('timeAdjustmentQty', () => {
  const planned = 135 * 60_000

  it('charges started extra 10-minute blocks in overtime', () => {
    expect(timeAdjustmentQty(planned + 1, planned)).toEqual({
      extraBlocks: 1,
      savedBlocks: 0,
    })
    expect(timeAdjustmentQty(planned + 10 * 60_000, planned)).toEqual({
      extraBlocks: 1,
      savedBlocks: 0,
    })
    expect(timeAdjustmentQty(planned + 10 * 60_000 + 1, planned)).toEqual({
      extraBlocks: 2,
      savedBlocks: 0,
    })
  })

  it('credits complete saved 10-minute blocks when finishing early', () => {
    expect(timeAdjustmentQty(planned - 10 * 60_000, planned)).toEqual({
      extraBlocks: 0,
      savedBlocks: 1,
    })
    expect(timeAdjustmentQty(planned - 19 * 60_000, planned)).toEqual({
      extraBlocks: 0,
      savedBlocks: 1,
    })
  })
})

describe('saved time bonus', () => {
  it('reduces the sheet total with the negative unit price', () => {
    expect(
      sheetTotal(estimateItems, {
        overhead: 1,
        'saved-10': 2,
      }),
    ).toBe(12_500_000 - 2_000_000)
  })
})

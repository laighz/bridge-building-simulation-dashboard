import { describe, expect, it } from 'vitest'
import { COST_DEVIATION_LIMIT_PERCENT, estimateItems } from '../config/catalog.ts'
import {
  costDeviationPercent,
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

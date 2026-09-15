import { describe, expect, it } from 'vitest'
import { formatEuro } from './money.ts'

describe('formatEuro', () => {
  it('formats workshop prices in German currency', () => {
    expect(formatEuro(570_000)).toBe('570.000,00 €')
  })

  it('keeps the saved-time bonus negative', () => {
    expect(formatEuro(-1_000_000)).toBe('-1.000.000,00 €')
  })
})

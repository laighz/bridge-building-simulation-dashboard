import { describe, expect, it } from 'vitest'
import { formatDuration, formatOvertime } from './time.ts'

describe('formatDuration', () => {
  it('renders hours, minutes, and seconds for the 2h15m total', () => {
    expect(formatDuration(135 * 60_000)).toBe('02:15:00')
  })

  it('renders the 90 minute realization block', () => {
    expect(formatDuration(90 * 60_000)).toBe('01:30:00')
  })

  it('zero-pads minutes and seconds', () => {
    expect(formatDuration(5_000)).toBe('00:00:05')
  })
})

describe('formatOvertime', () => {
  it('prefixes overtime with a plus sign', () => {
    expect(formatOvertime(65_000)).toBe('+00:01:05')
  })
})

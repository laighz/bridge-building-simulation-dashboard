import { describe, expect, it } from 'vitest'
import {
  SCISSORS_RENT_MS,
  newlyElapsedRentals,
  scissorsElapsed,
  scissorsRemainingMs,
  startScissorsForTeam,
  teamHasRunningScissors,
} from './scissors.ts'

describe('scissors rental timer', () => {
  it('lasts 30 minutes from start', () => {
    const [rental] = startScissorsForTeam([], 'team-1', 1_000)
    expect(rental?.durationMs).toBe(SCISSORS_RENT_MS)
    expect(scissorsRemainingMs(rental!, 1_000)).toBe(SCISSORS_RENT_MS)
    expect(scissorsRemainingMs(rental!, 1_000 + 10 * 60_000)).toBe(20 * 60_000)
    expect(scissorsElapsed(rental!, 1_000 + SCISSORS_RENT_MS)).toBe(true)
  })

  it('does not start a second running rental for the same team', () => {
    const first = startScissorsForTeam([], 'team-1', 0)
    const second = startScissorsForTeam(first, 'team-1', 1_000)
    expect(second).toHaveLength(1)
    expect(teamHasRunningScissors(second, 'team-1', 1_000)).toBe(true)
  })

  it('allows another rental after the first 30 minutes elapsed', () => {
    const first = startScissorsForTeam([], 'team-1', 0)
    const after = startScissorsForTeam(first, 'team-1', SCISSORS_RENT_MS)
    expect(after).toHaveLength(2)
  })

  it('emits newly elapsed rentals only on the crossing tick', () => {
    const rentals = startScissorsForTeam([], 'team-1', 0)
    expect(newlyElapsedRentals(rentals, 0, SCISSORS_RENT_MS - 1)).toEqual([])
    expect(newlyElapsedRentals(rentals, SCISSORS_RENT_MS - 1, SCISSORS_RENT_MS)).toHaveLength(1)
    expect(newlyElapsedRentals(rentals, SCISSORS_RENT_MS, SCISSORS_RENT_MS + 1_000)).toEqual([])
  })
})

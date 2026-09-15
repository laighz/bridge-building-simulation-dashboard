export const SCISSORS_RENT_MS = 30 * 60_000

export type ScissorsRental = {
  id: string
  teamId: string
  startedAtMs: number
  durationMs: number
}

export function createScissorsRental(
  teamId: string,
  startedAtMs: number,
  existing: ScissorsRental[] = [],
): ScissorsRental {
  const index = existing.length + 1
  return {
    id: `scissors-${teamId}-${index}`,
    teamId,
    startedAtMs,
    durationMs: SCISSORS_RENT_MS,
  }
}

export function scissorsRemainingMs(rental: ScissorsRental, nowMs: number): number {
  return Math.max(0, rental.startedAtMs + rental.durationMs - nowMs)
}

export function scissorsElapsed(rental: ScissorsRental, nowMs: number): boolean {
  return scissorsRemainingMs(rental, nowMs) === 0
}

export function teamHasRunningScissors(
  rentals: ScissorsRental[],
  teamId: string,
  nowMs: number,
): boolean {
  return rentals.some(
    (rental) => rental.teamId === teamId && !scissorsElapsed(rental, nowMs),
  )
}

export function startScissorsForTeam(
  rentals: ScissorsRental[],
  teamId: string,
  nowMs: number,
): ScissorsRental[] {
  if (teamHasRunningScissors(rentals, teamId, nowMs)) return rentals
  return [...rentals, createScissorsRental(teamId, nowMs, rentals)]
}

export function newlyElapsedRentals(
  rentals: ScissorsRental[],
  previousNowMs: number,
  nowMs: number,
): ScissorsRental[] {
  return rentals.filter(
    (rental) =>
      !scissorsElapsed(rental, previousNowMs) && scissorsElapsed(rental, nowMs),
  )
}

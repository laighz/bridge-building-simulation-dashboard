export type JuryScores = {
  cost: number
  deviation: number
  looks: number
  stability: number
}

export function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.min(10, Math.max(0, Math.round(value)))
}

export function juryTotal(scores: JuryScores): number {
  return (
    clampScore(scores.cost) +
    clampScore(scores.deviation) +
    clampScore(scores.looks) +
    clampScore(scores.stability)
  )
}

export function isDisqualified(options: {
  loadTestPassed: boolean | null
  costExcluded: boolean
}): boolean {
  if (options.loadTestPassed === false) return true
  return options.costExcluded
}

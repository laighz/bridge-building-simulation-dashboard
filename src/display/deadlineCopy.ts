import { formatDuration } from '../domain/time.ts'

export function nextDeadlineCopy(options: {
  status: string
  overtime: boolean
  nextLabel: string | undefined
  nextRemainingMs: number
}): string {
  if (options.overtime) return 'Die 90 Minuten Realisierung sind um.'
  if (options.status === 'idle') {
    return '45 Min Planung (Abgaben bei 30 und 45) — danach 90 Min Bau'
  }
  if (!options.nextLabel) return 'Alle Meilensteine erreicht'
  const remaining = formatDuration(options.nextRemainingMs)
  if (options.nextLabel === 'Fertigstellung') {
    return `Nächste Abgabe: ${options.nextLabel} in ${remaining} — 90 Min nach der Skizze`
  }
  return `Nächste Abgabe: ${options.nextLabel} in ${remaining}`
}

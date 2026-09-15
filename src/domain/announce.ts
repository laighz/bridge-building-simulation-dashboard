import type { SessionEvent } from './session.ts'

export type Announcement = {
  key: string
  text: string
}

const MILESTONE_LINES: Record<string, string> = {
  vorkalkulation:
    'Achtung. Die Zeit für die Vorkalkulation ist abgelaufen. Teams, gebt die Kalkulation jetzt ab.',
  skizze:
    'Achtung. Die Zeit für den Bauplan ist abgelaufen. Gebt die Projektskizze jetzt ab.',
  fertigstellung:
    'Achtung. Die Bauzeit ist vorbei. Die Brücke muss stehen.',
}

export function timerStartedAnnouncement(): Announcement {
  return {
    key: 'timer-started',
    text: 'Achtung. Der Timer läuft. Dreißig Minuten bis zur Vorkalkulation.',
  }
}

export function scissorsReturnAnnouncement(
  rentalId: string,
  teamName: string,
): Announcement {
  return {
    key: `scissors:${rentalId}`,
    text: `Gruppe ${teamName}. Die Schere muss zurück. Die Mietzeit von dreißig Minuten ist abgelaufen.`,
  }
}

export function announcementFromSessionEvents(
  events: SessionEvent[],
): Announcement[] {
  const lines: Announcement[] = []
  for (const event of events) {
    if (event.type === 'milestoneReached') {
      const text = MILESTONE_LINES[event.id]
      if (text) {
        lines.push({ key: `milestone:${event.id}`, text })
      }
    } else {
      lines.push({
        key: 'overtime',
        text: 'Achtung. Die Simulationszeit ist abgelaufen.',
      })
    }
  }
  return lines
}

export function unspoken(
  announcements: Announcement[],
  spokenKeys: string[],
): Announcement[] {
  const seen = new Set(spokenKeys)
  return announcements.filter((item) => !seen.has(item.key))
}

export function appendSpoken(spokenKeys: string[], key: string): string[] {
  if (spokenKeys.includes(key)) return spokenKeys
  return [...spokenKeys, key]
}

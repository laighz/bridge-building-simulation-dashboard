import { describe, expect, it } from 'vitest'
import { sessionEvents } from './session.ts'
import { workshopConfig } from '../config/workshop.ts'
import {
  announcementFromSessionEvents,
  scissorsReturnAnnouncement,
  timerStartedAnnouncement,
  unspoken,
} from './announce.ts'

const MIN = 60_000

describe('announcementFromSessionEvents', () => {
  it('announces Vorkalkulation, Bauplan and overtime in German', () => {
    const at30 = sessionEvents(workshopConfig, 29 * MIN, 30 * MIN)
    const at45 = sessionEvents(workshopConfig, 44 * MIN, 45 * MIN)
    const atEnd = sessionEvents(workshopConfig, 134 * MIN, 135 * MIN)

    expect(announcementFromSessionEvents(at30).map((item) => item.key)).toEqual([
      'milestone:vorkalkulation',
    ])
    expect(announcementFromSessionEvents(at30)[0]?.text).toMatch(/Vorkalkulation/i)
    expect(announcementFromSessionEvents(at45)[0]?.text).toMatch(/Bauplan|Projektskizze/i)
    expect(announcementFromSessionEvents(atEnd).map((item) => item.key)).toEqual([
      'milestone:fertigstellung',
      'overtime',
    ])
    expect(announcementFromSessionEvents(atEnd).at(-1)?.text).toMatch(/abgelaufen/i)
  })
})

describe('scissorsReturnAnnouncement', () => {
  it('tells a named group to return the scissors', () => {
    const line = scissorsReturnAnnouncement('scissors-team-1-1', 'Team Blau')
    expect(line.key).toBe('scissors:scissors-team-1-1')
    expect(line.text).toMatch(/Team Blau/)
    expect(line.text).toMatch(/Schere/)
    expect(line.text).toMatch(/zurück/)
  })
})

describe('unspoken', () => {
  it('drops announcements that were already spoken', () => {
    const start = timerStartedAnnouncement()
    expect(unspoken([start], [])).toEqual([start])
    expect(unspoken([start], [start.key])).toEqual([])
  })
})

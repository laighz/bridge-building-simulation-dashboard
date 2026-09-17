import { useEffect, useRef } from 'react'
import { speakGerman } from '../audio/speech.ts'
import {
  announcementFromSessionEvents,
  scissorsReturnAnnouncement,
  unspoken,
} from '../domain/announce.ts'
import { newlyElapsedRentals } from '../domain/scissors.ts'
import { elapsedMs, sessionEvents } from '../domain/session.ts'
import { teamLabel } from '../domain/teams.ts'
import { useWorkshopData } from '../store/useWorkshopData.ts'
import { workshopStore } from '../store/workshopStore.ts'
import { useWorkshopSession } from './useWorkshopSession.ts'

export function Announcer() {
  const { state, nowMs, config } = useWorkshopSession()
  const { data } = useWorkshopData()
  const prevElapsed = useRef<number | null>(null)
  const prevNow = useRef<number | null>(null)

  useEffect(() => {
    if (state.status === 'idle') {
      prevElapsed.current = 0
      prevNow.current = nowMs
      return
    }

    const elapsed = elapsedMs(state, nowMs)
    if (prevElapsed.current == null || prevNow.current == null) {
      prevElapsed.current = elapsed
      prevNow.current = nowMs
      return
    }

    const lines = announcementFromSessionEvents(
      sessionEvents(config, prevElapsed.current, elapsed),
    )
    const due = newlyElapsedRentals(
      data.scissorsRentals,
      prevNow.current,
      nowMs,
    )
    for (const rental of due) {
      const index = data.teams.findIndex((team) => team.id === rental.teamId)
      const team = data.teams[index]
      lines.push(
        scissorsReturnAnnouncement(
          rental.id,
          teamLabel(team ?? { id: rental.teamId, name: '' }, Math.max(0, index)),
        ),
      )
    }

    prevElapsed.current = elapsed
    prevNow.current = nowMs

    const pending = unspoken(lines, data.spokenKeys)
    if (pending.length === 0) return

    for (const item of pending) workshopStore.markSpoken(item.key)

    const key = data.ttsApiKey || import.meta.env.VITE_ELEVENLABS_API_KEY
    void (async () => {
      for (const item of pending) {
        try {
          await speakGerman(item.text, {
            elevenLabsKey: key,
            voiceId: import.meta.env.VITE_ELEVENLABS_VOICE_ID,
          })
        } catch {
          // Keep the timer running even if speech is blocked.
        }
      }
    })()
  }, [
    config,
    data.scissorsRentals,
    data.spokenKeys,
    data.teams,
    data.ttsApiKey,
    nowMs,
    state,
  ])

  return null
}

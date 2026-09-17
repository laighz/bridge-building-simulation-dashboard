import { useEffect } from 'react'
import type { MouseEvent } from 'react'
import { speakGerman } from '../audio/speech.ts'
import { rulesSlides } from '../config/rulesSlides.ts'
import { timerStartedAnnouncement } from '../domain/announce.ts'
import {
  advanceRules,
  backToTeams,
  leaveTeams,
  slideClickSide,
} from '../domain/setup.ts'
import { canContinueSetup } from '../domain/teams.ts'
import { interpretFacilitatorKey } from '../display/hotkeys.ts'
import { toggleFullscreen } from '../display/fullscreen.ts'
import { sessionStore } from '../store/browserStore.ts'
import { useWorkshopData } from '../store/useWorkshopData.ts'
import { workshopStore } from '../store/workshopStore.ts'
import { RulesDeck } from './RulesDeck.tsx'
import { TeamsBento } from './TeamsBento.tsx'
import './setup.css'

async function unlockAndStart() {
  const announcement = timerStartedAnnouncement()
  workshopStore.markSpoken(announcement.key)
  sessionStore.start()
  const key = workshopStore.getState().ttsApiKey
  try {
    await speakGerman(announcement.text, {
      elevenLabsKey: key || import.meta.env.VITE_ELEVENLABS_API_KEY,
      voiceId: import.meta.env.VITE_ELEVENLABS_VOICE_ID,
    })
  } catch {
    // Voice is best-effort; the timer still starts.
  }
}

export function SetupView() {
  const { data } = useWorkshopData()

  function goNextFromTeams() {
    if (!canContinueSetup(data.teams)) return
    const next = leaveTeams()
    workshopStore.setSetupStep(next.setupStep, next.rulesSlideIndex)
  }

  function handleRulesDirection(direction: 'prev' | 'next') {
    const result = advanceRules(
      data.rulesSlideIndex,
      rulesSlides.length,
      direction,
    )
    if (result.action === 'start') {
      void unlockAndStart()
      return
    }
    if (result.action === 'prev' && direction === 'prev') {
      const back = backToTeams()
      workshopStore.setSetupStep(back.setupStep, back.rulesSlideIndex)
      return
    }
    workshopStore.setRulesSlideIndex(result.slideIndex)
  }

  function onDeckClick(event: MouseEvent<HTMLElement>) {
    const width = event.currentTarget.getBoundingClientRect().width
    const x = event.clientX - event.currentTarget.getBoundingClientRect().left
    handleRulesDirection(slideClickSide(x, width))
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const action = interpretFacilitatorKey(event, {
        resetArmed: false,
        controlsVisible: false,
        setupActive: true,
      })
      if (!action) return
      if (action === 'toggleFullscreen') {
        event.preventDefault()
        void toggleFullscreen()
        return
      }
      if (action === 'setupNext') {
        event.preventDefault()
        if (data.setupStep === 'teams') goNextFromTeams()
        else handleRulesDirection('next')
      }
      if (action === 'setupPrev') {
        event.preventDefault()
        if (data.setupStep === 'rules') handleRulesDirection('prev')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <div className="setup">
      {data.setupStep === 'teams' ? (
        <TeamsBento
          teams={data.teams}
          onAdd={() => workshopStore.addTeam()}
          onRemove={(id) => workshopStore.removeTeam(id)}
          onRename={(id, name) => workshopStore.renameTeam(id, name)}
          onContinue={goNextFromTeams}
        />
      ) : (
        <RulesDeck
          slide={rulesSlides[data.rulesSlideIndex] ?? rulesSlides[0]!}
          index={data.rulesSlideIndex}
          total={rulesSlides.length}
          onClick={onDeckClick}
          onPrev={() => handleRulesDirection('prev')}
          onNext={() => handleRulesDirection('next')}
        />
      )}
    </div>
  )
}

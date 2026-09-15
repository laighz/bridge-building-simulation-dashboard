import { playFuturisticCue, speakGerman } from '../audio/speech.ts'
import { workshopConfig, type PhaseId } from '../config/workshop.ts'
import {
  scissorsElapsed,
  scissorsRemainingMs,
  teamHasRunningScissors,
  type ScissorsRental,
} from '../domain/scissors.ts'
import { teamLabel, type Team } from '../domain/teams.ts'
import { formatDuration } from '../domain/time.ts'
import { sessionStore } from '../store/browserStore.ts'
import { workshopStore } from '../store/workshopStore.ts'
import { toggleFullscreen } from './fullscreen.ts'

type Props = {
  visible: boolean
  statusLabel: string
  activePhaseId: PhaseId
  teams: Team[]
  ttsApiKey: string
  scissorsRentals: ScissorsRental[]
  nowMs: number
  onSelectPhase: (phase: PhaseId | null) => void
}

const JUMPS = [
  { label: 'Sprung: 00:00', ms: 0 },
  { label: '1 Min vor Vorkalkulation', ms: 29 * 60_000 },
  { label: 'Vorkalkulation (30 Min)', ms: 30 * 60_000 },
  { label: '1 Min vor Skizze', ms: 44 * 60_000 },
  { label: 'Skizze / Bau startet (45 Min)', ms: 45 * 60_000 },
  { label: '1 Min vor Ende', ms: 134 * 60_000 },
  { label: 'Fertigstellung (45+90)', ms: 135 * 60_000 },
]

function resetWorkshop() {
  sessionStore.reset()
  workshopStore.resetSessionExtras()
}

export function FacilitatorControls({
  visible,
  statusLabel,
  activePhaseId,
  teams,
  ttsApiKey,
  scissorsRentals,
  nowMs,
  onSelectPhase,
}: Props) {
  if (!visible) return null

  return (
    <aside className="controls" aria-label="Facilitator-Steuerung">
      <div className="controls-row">
        <strong>Steuerung</strong>
        <span className="controls-status">{statusLabel}</span>
      </div>
      <div className="controls-row">
        <button type="button" onClick={() => sessionStore.toggleRunning()}>
          Start / Pause
        </button>
        <button type="button" onClick={resetWorkshop}>
          Reset
        </button>
        <button type="button" onClick={() => void toggleFullscreen()}>
          Fullscreen
        </button>
        <button type="button" onClick={() => onSelectPhase(null)}>
          Phase auto
        </button>
      </div>
      <div className="controls-row wrap">
        {workshopConfig.phases.map((phase) => (
          <button
            key={phase.id}
            type="button"
            className={phase.id === activePhaseId ? 'is-pressed' : undefined}
            onClick={() => onSelectPhase(phase.id)}
          >
            {phase.label}
          </button>
        ))}
      </div>
      <div className="controls-row wrap">
        {JUMPS.map((jump) => (
          <button
            key={jump.label}
            type="button"
            onClick={() => sessionStore.jumpToElapsedMs(jump.ms)}
          >
            {jump.label}
          </button>
        ))}
      </div>
      <div className="controls-row wrap">
        <span className="controls-status">Schere 30 Min</span>
        {teams.length === 0 ? (
          <span className="controls-status">Zuerst Teams anlegen</span>
        ) : (
          teams.map((team, index) => {
            const running = teamHasRunningScissors(
              scissorsRentals,
              team.id,
              nowMs,
            )
            const rental = scissorsRentals.find(
              (item) => item.teamId === team.id && !scissorsElapsed(item, nowMs),
            )
            const due = scissorsRentals.some(
              (item) => item.teamId === team.id && scissorsElapsed(item, nowMs),
            )
            return (
              <button
                key={team.id}
                type="button"
                className={running || due ? 'is-pressed' : undefined}
                onClick={() => workshopStore.startScissors(team.id, nowMs)}
              >
                {teamLabel(team, index)}
                {rental
                  ? ` · ${formatDuration(scissorsRemainingMs(rental, nowMs))}`
                  : due
                    ? ' · zurück'
                    : ''}
              </button>
            )
          })
        )}
      </div>
      <div className="controls-row">
        <label className="controls-key">
          ElevenLabs
          <input
            type="password"
            autoComplete="off"
            placeholder="API-Key optional"
            value={ttsApiKey}
            onChange={(event) => workshopStore.setTtsApiKey(event.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            void speakGerman(
              'Achtung. Stimme bereit. Die Schere muss zurück.',
              {
                elevenLabsKey:
                  ttsApiKey || import.meta.env.VITE_ELEVENLABS_API_KEY,
                voiceId: import.meta.env.VITE_ELEVENLABS_VOICE_ID,
                playCue: () => playFuturisticCue(),
              },
            )
          }}
        >
          Stimme testen
        </button>
      </div>
      <p className="controls-help">
        Tasten: Leertaste Start/Pause · R Reset (zweimal) · F Fullscreen · C
        Steuerung · Esc schließen
      </p>
    </aside>
  )
}

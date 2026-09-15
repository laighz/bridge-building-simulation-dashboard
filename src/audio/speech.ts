export type VoiceLike = {
  lang: string
  name: string
}

export const FUTURISTIC_UTTERANCE = {
  lang: 'de-DE',
  rate: 0.86,
  pitch: 0.68,
}

export const ELEVENLABS_DEFAULT_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'

export type ElevenLabsPayload = {
  text: string
  model_id: string
  voice_settings: {
    stability: number
    similarity_boost: number
    style: number
    use_speaker_boost: boolean
  }
}

export function pickGermanVoice(voices: VoiceLike[]): VoiceLike | null {
  if (voices.length === 0) return null
  const german = voices.filter(
    (voice) =>
      /^de([-_]|$)/i.test(voice.lang) || /german|deutsch/i.test(voice.name),
  )
  const pool = german.length > 0 ? german : voices
  return (
    pool.find((voice) => /google|neural|natural|online/i.test(voice.name)) ??
    pool[0] ??
    null
  )
}

export function elevenLabsPayload(text: string): ElevenLabsPayload {
  return {
    text,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.28,
      similarity_boost: 0.72,
      style: 0.55,
      use_speaker_boost: true,
    },
  }
}

export function elevenLabsUrl(voiceId = ELEVENLABS_DEFAULT_VOICE_ID): string {
  return `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`
}

type SpeakDeps = {
  elevenLabsKey?: string
  voiceId?: string
  fetchImpl?: typeof fetch
  synth?: Pick<SpeechSynthesis, 'speak' | 'cancel' | 'getVoices'>
  playCue?: () => Promise<void>
  playAudio?: (buffer: ArrayBuffer) => Promise<void>
}

async function speakBrowser(
  text: string,
  synth: NonNullable<SpeakDeps['synth']>,
): Promise<void> {
  if (typeof SpeechSynthesisUtterance === 'undefined') return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = FUTURISTIC_UTTERANCE.lang
  utterance.rate = FUTURISTIC_UTTERANCE.rate
  utterance.pitch = FUTURISTIC_UTTERANCE.pitch
  const voice = pickGermanVoice(synth.getVoices())
  if (voice && 'voiceURI' in (voice as object)) {
    utterance.voice = voice as SpeechSynthesisVoice
  }
  await new Promise<void>((resolve, reject) => {
    utterance.onend = () => resolve()
    utterance.onerror = () => reject(new Error('speech failed'))
    synth.cancel()
    synth.speak(utterance)
  })
}

export async function speakElevenLabsAudio(
  text: string,
  apiKey: string,
  options: {
    voiceId?: string
    fetchImpl?: typeof fetch
  } = {},
): Promise<ArrayBuffer> {
  const fetchImpl = options.fetchImpl ?? fetch
  const response = await fetchImpl(elevenLabsUrl(options.voiceId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify(elevenLabsPayload(text)),
  })
  if (!response.ok) {
    throw new Error(`ElevenLabs ${response.status}`)
  }
  return response.arrayBuffer()
}

export async function speakGerman(
  text: string,
  deps: SpeakDeps = {},
): Promise<void> {
  await deps.playCue?.()
  const key = deps.elevenLabsKey?.trim()
  if (key) {
    try {
      const buffer = await speakElevenLabsAudio(text, key, {
        voiceId: deps.voiceId,
        fetchImpl: deps.fetchImpl,
      })
      if (deps.playAudio) {
        await deps.playAudio(buffer)
        return
      }
      const blob = new Blob([buffer], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      await new Promise<void>((resolve, reject) => {
        const audio = new Audio(url)
        audio.onended = () => {
          URL.revokeObjectURL(url)
          resolve()
        }
        audio.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('audio failed'))
        }
        void audio.play()
      })
      return
    } catch {
      // Browser voices still announce if ElevenLabs is unreachable.
    }
  }
  const synth =
    deps.synth ??
    (typeof speechSynthesis === 'undefined' ? undefined : speechSynthesis)
  if (!synth) return
  await speakBrowser(text, synth)
}

export function playFuturisticCue(
  contextCtor?: typeof AudioContext,
): Promise<void> {
  const Ctor =
    contextCtor ??
    (typeof AudioContext === 'undefined' ? undefined : AudioContext)
  if (!Ctor) return Promise.resolve()
  const context = new Ctor()
  const now = context.currentTime
  const master = context.createGain()
  master.gain.value = 0.07
  master.connect(context.destination)
  const notes = [
    { freq: 932, at: 0, dur: 0.09 },
    { freq: 1244, at: 0.08, dur: 0.12 },
    { freq: 1864, at: 0.18, dur: 0.16 },
  ]
  for (const note of notes) {
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = 'triangle'
    osc.frequency.value = note.freq
    gain.gain.setValueAtTime(0.0001, now + note.at)
    gain.gain.exponentialRampToValueAtTime(1, now + note.at + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.at + note.dur)
    osc.connect(gain)
    gain.connect(master)
    osc.start(now + note.at)
    osc.stop(now + note.at + note.dur + 0.02)
  }
  return new Promise((resolve) => {
    window.setTimeout(() => {
      void context.close()
      resolve()
    }, 420)
  })
}

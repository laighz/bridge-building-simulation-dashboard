export type VoiceLike = {
  lang: string
  name: string
}

export const NATURAL_UTTERANCE = {
  lang: 'de-DE',
  rate: 0.98,
  pitch: 1.0,
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

// Prefer the most natural-sounding German voice the browser offers:
// 1) voices labeled "natural"/"neural", 2) high-quality brands or tiers
// (Google, online, enhanced, premium), 3) the first German voice.
export function pickGermanVoice(voices: VoiceLike[]): VoiceLike | null {
  if (voices.length === 0) return null
  const german = voices.filter(
    (voice) =>
      /^de([-_]|$)/i.test(voice.lang) || /german|deutsch/i.test(voice.name),
  )
  const pool = german.length > 0 ? german : voices
  return (
    pool.find((voice) => /natural|neural/i.test(voice.name)) ??
    pool.find((voice) => /google|online|enhanced|premium/i.test(voice.name)) ??
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
  playAudio?: (buffer: ArrayBuffer) => Promise<void>
}

async function speakBrowser(
  text: string,
  synth: NonNullable<SpeakDeps['synth']>,
): Promise<void> {
  if (typeof SpeechSynthesisUtterance === 'undefined') return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = NATURAL_UTTERANCE.lang
  utterance.rate = NATURAL_UTTERANCE.rate
  utterance.pitch = NATURAL_UTTERANCE.pitch
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

import { describe, expect, it } from 'vitest'
import {
  elevenLabsPayload,
  NATURAL_UTTERANCE,
  pickGermanVoice,
} from './speech.ts'

describe('NATURAL_UTTERANCE', () => {
  it('uses a natural German pace and pitch', () => {
    expect(NATURAL_UTTERANCE.lang).toBe('de-DE')
    expect(NATURAL_UTTERANCE.rate).toBeCloseTo(0.98)
    expect(NATURAL_UTTERANCE.pitch).toBeCloseTo(1.0)
  })
})

describe('pickGermanVoice', () => {
  it('prefers a natural/neural voice over Google over any German voice', () => {
    const chosen = pickGermanVoice([
      { lang: 'de-DE', name: 'Anna' },
      { lang: 'de-DE', name: 'Google Deutsch' },
      { lang: 'de-DE', name: 'Microsoft Conrad Natural' },
    ])
    expect(chosen?.name).toBe('Microsoft Conrad Natural')
  })

  it('prefers a Google voice over a generic German voice', () => {
    const chosen = pickGermanVoice([
      { lang: 'en-US', name: 'Samantha' },
      { lang: 'de-DE', name: 'Anna' },
      { lang: 'de-DE', name: 'Google Deutsch' },
    ])
    expect(chosen?.name).toBe('Google Deutsch')
  })

  it('falls back to the first German voice', () => {
    const chosen = pickGermanVoice([
      { lang: 'en-US', name: 'Samantha' },
      { lang: 'de-DE', name: 'Anna' },
      { lang: 'de-DE', name: 'Katja' },
    ])
    expect(chosen?.name).toBe('Anna')
  })
})

describe('elevenLabsPayload', () => {
  it('requests multilingual German with a tighter futuristic voice', () => {
    const body = elevenLabsPayload('Die Schere muss zurück.')
    expect(body.model_id).toBe('eleven_multilingual_v2')
    expect(body.text).toContain('Schere')
    expect(body.voice_settings.stability).toBeLessThan(0.5)
  })
})

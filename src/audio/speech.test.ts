import { describe, expect, it } from 'vitest'
import { elevenLabsPayload, pickGermanVoice } from './speech.ts'

describe('pickGermanVoice', () => {
  it('prefers a German neural or Google voice', () => {
    const chosen = pickGermanVoice([
      { lang: 'en-US', name: 'Samantha' },
      { lang: 'de-DE', name: 'Anna' },
      { lang: 'de-DE', name: 'Google Deutsch' },
    ])
    expect(chosen?.name).toBe('Google Deutsch')
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

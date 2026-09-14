import { describe, expect, it } from 'vitest'
import { interpretFacilitatorKey } from './hotkeys.ts'

describe('interpretFacilitatorKey', () => {
  it('starts or pauses on Space', () => {
    expect(
      interpretFacilitatorKey(
        { key: ' ', repeat: false },
        { resetArmed: false, controlsVisible: false },
      ),
    ).toBe('toggleRunning')
  })

  it('arms reset on the first R, confirms on the second', () => {
    expect(
      interpretFacilitatorKey(
        { key: 'r', repeat: false },
        { resetArmed: false, controlsVisible: false },
      ),
    ).toBe('armReset')
    expect(
      interpretFacilitatorKey(
        { key: 'R', repeat: false },
        { resetArmed: true, controlsVisible: false },
      ),
    ).toBe('confirmReset')
  })

  it('ignores keys while typing in an input', () => {
    expect(
      interpretFacilitatorKey(
        { key: ' ', repeat: false, target: { tagName: 'INPUT' } },
        { resetArmed: false, controlsVisible: false },
      ),
    ).toBeNull()
  })

  it('toggles controls on C and fullscreen on F', () => {
    expect(
      interpretFacilitatorKey(
        { key: 'c', repeat: false },
        { resetArmed: false, controlsVisible: false },
      ),
    ).toBe('toggleControls')
    expect(
      interpretFacilitatorKey(
        { key: 'f', repeat: false },
        { resetArmed: false, controlsVisible: false },
      ),
    ).toBe('toggleFullscreen')
  })
})

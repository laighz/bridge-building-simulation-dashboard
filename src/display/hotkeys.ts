export type FacilitatorKeyAction =
  | 'toggleRunning'
  | 'armReset'
  | 'confirmReset'
  | 'cancelReset'
  | 'toggleControls'
  | 'toggleFullscreen'

type KeyEventLike = {
  key: string
  repeat: boolean
  target?: unknown
}

function typingTarget(
  target: unknown,
): { tagName?: string; isContentEditable?: boolean } | null {
  if (!target || typeof target !== 'object' || !('tagName' in target)) return null
  return target as { tagName?: string; isContentEditable?: boolean }
}

export function interpretFacilitatorKey(
  event: KeyEventLike,
  options: { resetArmed: boolean; controlsVisible: boolean },
): FacilitatorKeyAction | null {
  const target = typingTarget(event.target)
  const tag = target?.tagName
  if (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target?.isContentEditable
  ) {
    return null
  }
  if (event.repeat) return null

  if (event.key === 'Escape') {
    if (options.resetArmed) return 'cancelReset'
    if (options.controlsVisible) return 'toggleControls'
    return null
  }
  if (event.key === ' ' || event.key === 'Spacebar') return 'toggleRunning'
  if (event.key === 'r' || event.key === 'R') {
    return options.resetArmed ? 'confirmReset' : 'armReset'
  }
  if (event.key === 'c' || event.key === 'C') return 'toggleControls'
  if (event.key === 'f' || event.key === 'F') return 'toggleFullscreen'
  return null
}

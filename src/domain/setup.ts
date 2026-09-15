export type SetupStep = 'teams' | 'rules'

export type SetupAction = 'stay' | 'next' | 'prev' | 'start'

export function slideClickSide(clientX: number, width: number): 'prev' | 'next' {
  if (width <= 0) return 'next'
  return clientX < width / 2 ? 'prev' : 'next'
}

export function advanceRules(
  slideIndex: number,
  slideCount: number,
  direction: 'prev' | 'next',
): { slideIndex: number; action: SetupAction } {
  if (slideCount <= 0) return { slideIndex: 0, action: 'stay' }
  if (direction === 'prev') {
    if (slideIndex <= 0) return { slideIndex: 0, action: 'prev' }
    return { slideIndex: slideIndex - 1, action: 'stay' }
  }
  if (slideIndex >= slideCount - 1) {
    return { slideIndex: slideCount - 1, action: 'start' }
  }
  return { slideIndex: slideIndex + 1, action: 'stay' }
}

export function leaveTeams(): { setupStep: SetupStep; rulesSlideIndex: number } {
  return { setupStep: 'rules', rulesSlideIndex: 0 }
}

export function backToTeams(): { setupStep: SetupStep; rulesSlideIndex: number } {
  return { setupStep: 'teams', rulesSlideIndex: 0 }
}

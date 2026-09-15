import { describe, expect, it } from 'vitest'
import { advanceRules, backToTeams, leaveTeams, slideClickSide } from './setup.ts'

describe('slideClickSide', () => {
  it('treats the left half as back and the right half as forward', () => {
    expect(slideClickSide(10, 200)).toBe('prev')
    expect(slideClickSide(99, 200)).toBe('prev')
    expect(slideClickSide(100, 200)).toBe('next')
    expect(slideClickSide(190, 200)).toBe('next')
  })
})

describe('advanceRules', () => {
  it('moves forward until the last slide, then starts the timer', () => {
    expect(advanceRules(0, 3, 'next')).toEqual({ slideIndex: 1, action: 'stay' })
    expect(advanceRules(2, 3, 'next')).toEqual({ slideIndex: 2, action: 'start' })
  })

  it('moves back and signals leaving the deck on the first slide', () => {
    expect(advanceRules(1, 3, 'prev')).toEqual({ slideIndex: 0, action: 'stay' })
    expect(advanceRules(0, 3, 'prev')).toEqual({ slideIndex: 0, action: 'prev' })
  })
})

describe('setup steps', () => {
  it('enters the rules deck from teams and can return', () => {
    expect(leaveTeams()).toEqual({ setupStep: 'rules', rulesSlideIndex: 0 })
    expect(backToTeams()).toEqual({ setupStep: 'teams', rulesSlideIndex: 0 })
  })
})

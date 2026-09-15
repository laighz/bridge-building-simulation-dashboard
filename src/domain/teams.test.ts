import { describe, expect, it } from 'vitest'
import {
  addTeam,
  canContinueSetup,
  namedTeams,
  nextTeamId,
  removeTeam,
  renameTeam,
  teamLabel,
} from './teams.ts'

describe('nextTeamId', () => {
  it('starts at team-1 and increments from existing ids', () => {
    expect(nextTeamId([])).toBe('team-1')
    expect(nextTeamId([{ id: 'team-2', name: 'Blau' }])).toBe('team-3')
  })
})

describe('addTeam and removeTeam', () => {
  it('appends a blank team card', () => {
    const teams = addTeam([])
    expect(teams).toEqual([{ id: 'team-1', name: '' }])
  })

  it('allows removing every team including the last one', () => {
    expect(removeTeam([{ id: 'team-1', name: 'A' }], 'team-1')).toEqual([])
  })
})

describe('renameTeam', () => {
  it('updates only the named team', () => {
    const teams = renameTeam(
      [
        { id: 'team-1', name: '' },
        { id: 'team-2', name: '' },
      ],
      'team-2',
      'Rot',
    )
    expect(teams[1]?.name).toBe('Rot')
    expect(teams[0]?.name).toBe('')
  })
})

describe('canContinueSetup', () => {
  it('requires at least one non-empty team name', () => {
    expect(canContinueSetup([{ id: 'team-1', name: '  ' }])).toBe(false)
    expect(canContinueSetup([{ id: 'team-1', name: 'Blau' }])).toBe(true)
    expect(namedTeams([{ id: 'team-1', name: 'Blau' }, { id: 'team-2', name: '' }])).toHaveLength(1)
  })
})

describe('teamLabel', () => {
  it('falls back to Team N when the name is empty', () => {
    expect(teamLabel({ id: 'team-1', name: '' }, 0)).toBe('Team 1')
    expect(teamLabel({ id: 'team-1', name: 'Cyan' }, 0)).toBe('Cyan')
  })
})

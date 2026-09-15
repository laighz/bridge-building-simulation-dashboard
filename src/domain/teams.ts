export type Team = {
  id: string
  name: string
}

export function nextTeamId(teams: Team[]): string {
  let max = 0
  for (const team of teams) {
    const match = /^team-(\d+)$/.exec(team.id)
    if (match) max = Math.max(max, Number(match[1]))
  }
  return `team-${max + 1}`
}

export function createTeam(teams: Team[], name = ''): Team {
  return { id: nextTeamId(teams), name }
}

export function addTeam(teams: Team[], name = ''): Team[] {
  return [...teams, createTeam(teams, name)]
}

export function removeTeam(teams: Team[], id: string): Team[] {
  return teams.filter((team) => team.id !== id)
}

export function renameTeam(teams: Team[], id: string, name: string): Team[] {
  return teams.map((team) => (team.id === id ? { ...team, name } : team))
}

export function namedTeams(teams: Team[]): Team[] {
  return teams.filter((team) => team.name.trim().length > 0)
}

export function canContinueSetup(teams: Team[]): boolean {
  return namedTeams(teams).length > 0
}

export function teamLabel(team: Team, index: number): string {
  const name = team.name.trim()
  return name || `Team ${index + 1}`
}

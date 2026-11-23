import type { PublicAppearance } from './public-editorial-schemas'

export function todayIsoDay(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}
export function shiftIsoDay(day: string, delta: number): string {
  const date = new Date(`${day}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + delta)
  return date.toISOString().slice(0, 10)
}

export function parseIsoDay(value: string | undefined, fallback: string): string {
  if (value === undefined || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback
  return Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()) ? fallback : value
}

export function isLiveAppearance(appearance: PublicAppearance, now: Date = new Date()): boolean {
  return appearance.result === undefined && Date.parse(appearance.startsAt) <= now.getTime()
}

export function appearanceParticipantLabel(appearance: PublicAppearance): string {
  return appearance.nationalTeam?.name ?? appearance.athlete?.name ?? appearance.opponentLabel
}

export function appearanceResultLabel(appearance: PublicAppearance): string | undefined {
  const score = appearance.result?.score
  if (typeof score === 'string') return score
  const sets = appearance.result?.sets
  return typeof sets === 'string' ? sets : undefined
}

import { HttpErrorResponse } from '@angular/common/http'

export const MSG_COMPETITION_ID = 'Enter an id: letters, digits, hyphens or underscores.'
export const MSG_CHOOSE_SPORT = 'Choose a sport.'
export const MSG_COMPETITION_NAME = 'Enter a name.'
export const MSG_COMPETITION_SEASON = 'Enter a season.'
export const MSG_CHOOSE_LEVEL = 'Choose a level.'

export const MSG_TEAM_ID = MSG_COMPETITION_ID
export const MSG_TEAM_SLUG =
  'Enter a slug: lowercase letters and digits with single hyphens between words.'
export const MSG_TEAM_NAME = 'Enter a name.'
export const MSG_TEAM_SHORT_NAME = 'Enter a short name.'
export const MSG_TEAM_COUNTRY = 'Enter a country code (two letters).'

export const COMPETITION_FIELD_ORDER = ['id', 'sportId', 'name', 'season', 'level'] as const
export const TEAM_FIELD_ORDER = ['id', 'slug', 'name', 'shortName', 'country'] as const

export const COMPETITION_FIELD_IDS: Record<(typeof COMPETITION_FIELD_ORDER)[number], string> = {
  id: 'competition-id',
  sportId: 'competition-sport',
  name: 'competition-name',
  season: 'competition-season',
  level: 'competition-level',
}

export const TEAM_FIELD_IDS: Record<(typeof TEAM_FIELD_ORDER)[number], string> = {
  id: 'team-id',
  slug: 'team-slug',
  name: 'team-name',
  shortName: 'team-short-name',
  country: 'team-country',
}

type CompetitionFormModel = {
  id: string
  sportId: string
  name: string
  season: string
  level: string
}

type TeamFormModel = {
  id: string
  slug: string
  name: string
  shortName: string
  country: string
}

/** Zod `ZodError` shape used for field messages (studio does not depend on `zod` directly). */
type ZodFlattenable = {
  flatten(): { fieldErrors: Record<string, string[] | undefined> }
}

export function httpErrorBodyMessage(error: HttpErrorResponse, fallback: string): string {
  const body: unknown = error.error
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const message = (body as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return fallback
}

function firstZodFieldMessage(
  fieldErrors: Record<string, string[] | undefined>,
  key: string,
): string | undefined {
  const first = fieldErrors[key]?.[0]
  return typeof first === 'string' ? first : undefined
}

export function competitionFieldMessages(
  model: CompetitionFormModel,
  zodError: ZodFlattenable,
): Record<string, string> {
  const fieldErrors = zodError.flatten().fieldErrors
  const out: Record<string, string> = {}
  if (model.id.trim() === '') {
    out['id'] = MSG_COMPETITION_ID
  } else {
    const z = firstZodFieldMessage(fieldErrors, 'id')
    if (z !== undefined) {
      out['id'] = z.includes('Expected an id') ? MSG_COMPETITION_ID : z
    }
  }
  if (model.sportId.trim() === '') {
    out['sportId'] = MSG_CHOOSE_SPORT
  } else {
    const z = firstZodFieldMessage(fieldErrors, 'sportId')
    if (z !== undefined) out['sportId'] = z
  }
  if (model.name.trim() === '') {
    out['name'] = MSG_COMPETITION_NAME
  } else {
    const z = firstZodFieldMessage(fieldErrors, 'name')
    if (z !== undefined) out['name'] = z
  }
  if (model.season.trim() === '') {
    out['season'] = MSG_COMPETITION_SEASON
  } else {
    const z = firstZodFieldMessage(fieldErrors, 'season')
    if (z !== undefined) out['season'] = z
  }
  if (model.level === '') {
    out['level'] = MSG_CHOOSE_LEVEL
  } else {
    const z = firstZodFieldMessage(fieldErrors, 'level')
    if (z !== undefined) out['level'] = z
  }
  return out
}

export function teamFieldMessages(
  model: TeamFormModel,
  zodError: ZodFlattenable,
): Record<string, string> {
  const fieldErrors = zodError.flatten().fieldErrors
  const out: Record<string, string> = {}
  if (model.id.trim() === '') {
    out['id'] = MSG_TEAM_ID
  } else {
    const z = firstZodFieldMessage(fieldErrors, 'id')
    if (z !== undefined) {
      out['id'] = z.includes('Expected an id') ? MSG_TEAM_ID : z
    }
  }
  if (model.slug.trim() === '') {
    out['slug'] = MSG_TEAM_SLUG
  } else {
    const z = firstZodFieldMessage(fieldErrors, 'slug')
    if (z !== undefined) {
      out['slug'] = z.includes('Expected a lowercase slug') ? MSG_TEAM_SLUG : z
    }
  }
  if (model.name.trim() === '') {
    out['name'] = MSG_TEAM_NAME
  } else {
    const z = firstZodFieldMessage(fieldErrors, 'name')
    if (z !== undefined) out['name'] = z
  }
  if (model.shortName.trim() === '') {
    out['shortName'] = MSG_TEAM_SHORT_NAME
  } else {
    const z = firstZodFieldMessage(fieldErrors, 'shortName')
    if (z !== undefined) out['shortName'] = z
  }
  if (model.country.trim() === '') {
    out['country'] = MSG_TEAM_COUNTRY
  } else {
    const z = firstZodFieldMessage(fieldErrors, 'country')
    if (z !== undefined) {
      out['country'] = z.includes('Expected an ISO') ? MSG_TEAM_COUNTRY : z
    }
  }
  return out
}

export function focusFirstFieldWithMessages(
  fieldOrder: readonly string[],
  messages: Record<string, string>,
  idByField: Record<string, string>,
): void {
  for (const key of fieldOrder) {
    if (messages[key] === undefined) continue
    const id = idByField[key]
    if (id === undefined) continue
    queueMicrotask(() => {
      globalThis.document.getElementById(id)?.focus()
    })
    return
  }
}

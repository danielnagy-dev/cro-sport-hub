/** Zod / shared-schema copy stays stable for matching; API messages are unchanged in libs. */
const SCHEMA_ID_EXPECTED = 'Expected an id of 1–64 letters, digits, underscores, or hyphens'
const SCHEMA_INVALID_ISO_DATE = 'Invalid ISO date'
const SCHEMA_STRING_TOO_SMALL = 'Too small: expected string to have >=1 characters'
const SCHEMA_NUMBER_NAN = 'Invalid input: expected number, received NaN'
const SCHEMA_INVALID_INPUT = 'Invalid input'
const SCHEMA_ARRAY_TOO_SMALL = 'Too small: expected array to have >=1 items'
const TENNIS_DIFFERENT_PLAYERS = 'The two players must be different athletes'
const FOOTBALL_APPEARANCE_CLUB_MISMATCH = 'The appearance club is one of the two sides'

export type MatchFormValidationContext = 'tennis' | 'football'

/**
 * Maps shared-schema validation copy to short field copy for studio match forms.
 * Pass the issue `path` from `FieldIssue` (e.g. `['competitionId']` or `['appearances', '0', 'athleteId']`).
 */
export function mapMatchFormValidationMessage(
  path: readonly string[],
  message: string,
  form: MatchFormValidationContext,
): string {
  const head = path[0]
  const tail = path.length > 0 ? path[path.length - 1] : undefined

  if (message === SCHEMA_ID_EXPECTED) {
    switch (head) {
      case 'competitionId':
        return 'Choose a competition.'
      case 'playerAId':
        return 'Choose player A.'
      case 'playerBId':
        return 'Choose player B.'
      case 'winnerId':
        return 'Choose the winner.'
      case 'homeTeamId':
        return 'Choose the home club.'
      case 'awayTeamId':
        return 'Choose the away club.'
      case 'appearances':
        if (tail === 'athleteId') return 'Choose an athlete.'
        if (tail === 'teamId') return 'Choose a club.'
        return message
      default:
        return message
    }
  }

  if (message === SCHEMA_INVALID_ISO_DATE && head === 'date') {
    return 'Enter the match date.'
  }

  if (message === SCHEMA_STRING_TOO_SMALL && head === 'round') {
    return 'Enter the round.'
  }

  if (message === SCHEMA_NUMBER_NAN) {
    if (form === 'football' && (head === 'homeGoals' || head === 'awayGoals')) {
      return 'Enter the number of goals.'
    }
    return message
  }

  if (message === SCHEMA_ARRAY_TOO_SMALL && form === 'tennis' && head === 'score') {
    return 'Enter at least one completed set score.'
  }

  if (message === SCHEMA_INVALID_INPUT && form === 'tennis' && head === 'bestOf') {
    return 'Choose best of 3 or best of 5.'
  }

  if (message === TENNIS_DIFFERENT_PLAYERS && form === 'tennis' && head === 'playerBId') {
    return 'Choose two different players.'
  }

  if (
    form === 'football' &&
    head === 'appearances' &&
    tail === 'teamId' &&
    message === FOOTBALL_APPEARANCE_CLUB_MISMATCH
  ) {
    return 'Choose a club.'
  }

  return message
}

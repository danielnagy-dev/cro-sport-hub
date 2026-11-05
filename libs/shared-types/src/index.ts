export const packageId = '@cro-sport-hub/shared-types'

export {
  countryCodeSchema,
  httpsUrlSchema,
  idSchema,
  isoDateSchema,
  seasonSchema,
  slugSchema,
  textSchema,
  timestampSchema,
} from './common.ts'
export type { FieldIssue } from './common.ts'

export {
  cardTypeSchema,
  competitionLevelSchema,
  matchSourceSchema,
  roleSchema,
  sportSlugSchema,
  statusSchema,
} from './enums.ts'
export type { CardType, CompetitionLevel, MatchSource, Role, SportSlug, Status } from './enums.ts'

export { sportSchema } from './sport.ts'
export type { Sport } from './sport.ts'

export { athleteSchema, athleteTeamSchema, birthYearSchema } from './athlete.ts'
export type { Athlete, AthleteTeam } from './athlete.ts'

export { teamSchema } from './team.ts'
export type { Team } from './team.ts'

export { competitionSchema } from './competition.ts'
export type { Competition } from './competition.ts'

export { athleteLookupSchema, competitionLookupSchema, teamLookupSchema } from './editor-lookup.ts'
export type { AthleteLookup, CompetitionLookup, TeamLookup } from './editor-lookup.ts'

export { matchSchema, roundSchema } from './match.ts'
export type { Match } from './match.ts'

export {
  matchListQuerySchema,
  publishedMatchPageSchema,
  publishedMatchSchema,
} from './published-match.ts'
export type { PublishedMatch, PublishedMatchPage } from './published-match.ts'

export {
  editorMatchListQuerySchema,
  editorMatchPageSchema,
  editorMatchSchema,
} from './editor-match.ts'
export type { EditorMatch, EditorMatchListQuery, EditorMatchPage } from './editor-match.ts'

export { editorTennisDraftSchema } from './editor-tennis-draft.ts'
export type { EditorTennisDraft } from './editor-tennis-draft.ts'

export {
  athleteNameListSchema,
  athleteNameSchema,
  publicAthleteSchema,
  publicClubSpellSchema,
  publicFootballResultSchema,
  publicTennisResultSchema,
} from './published-athlete.ts'
export type {
  AthleteName,
  PublicAthlete,
  PublicClubSpell,
  PublicFootballResult,
  PublicTennisResult,
} from './published-athlete.ts'

export {
  evaluateTennisScore,
  tennisBestOfSchema,
  tennisMatchSchema,
  tennisSetSchema,
} from './tennis-score.ts'
export type {
  TennisBestOf,
  TennisMatch,
  TennisScoreEvaluation,
  TennisSetScore,
} from './tennis-score.ts'

export {
  tennisMatchStatsSchema,
  tennisPercentages,
  tennisPercentagesSchema,
  tennisStatCountsSchema,
  tennisStatIssues,
} from './tennis-stats.ts'
export type { TennisMatchStats, TennisPercentages, TennisStatCounts } from './tennis-stats.ts'

export { appearanceIssues, appearanceSchema, footballMatchSchema } from './football.ts'
export type { Appearance, AppearanceCounts, FootballMatch } from './football.ts'

export {
  galleryCaptionPatchSchema,
  galleryCreateBodySchema,
  galleryCreatedSchema,
  galleryRenderResponseSchema,
  galleryViewSchema,
} from './gallery.ts'

import { boolean, date, integer, jsonb, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

export const sports = pgTable("sports", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
});

export const competitions = pgTable("competitions", {
  id: text("id").primaryKey(),
  sportId: text("sport_id").notNull(),
  name: text("name").notNull(),
  season: text("season").notNull(),
  level: text("level").notNull(),
});

export const teams = pgTable("teams", {
  id: text("id").primaryKey(),
  sportId: text("sport_id").notNull(),
  sportSlug: text("sport_slug").notNull(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  country: text("country").notNull(),
  crestUrl: text("crest_url"),
});

export const athletes = pgTable("athletes", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  sportId: text("sport_id").notNull(),
  sportSlug: text("sport_slug").notNull(),
  country: text("country").notNull(),
  birthYear: integer("birth_year"),
  position: text("position"),
  photoUrl: text("photo_url"),
});

export const athleteTeams = pgTable(
  "athlete_teams",
  {
    athleteId: text("athlete_id").notNull(),
    teamId: text("team_id").notNull(),
    from: date("from_date", { mode: "string" }).notNull(),
    to: date("to_date", { mode: "string" }),
    athleteSport: text("athlete_sport").notNull(),
  },
  (table) => [primaryKey({ columns: [table.athleteId, table.teamId, table.from] })],
);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  role: text("role").notNull(),
});

export const matches = pgTable("matches", {
  id: text("id").primaryKey(),
  sportId: text("sport_id").notNull(),
  sportSlug: text("sport_slug").notNull(),
  competitionId: text("competition_id").notNull(),
  date: date("match_date", { mode: "string" }).notNull(),
  round: text("round").notNull(),
  status: text("status").notNull(),
  source: text("source").notNull(),
  sourceRef: text("source_ref"),
  createdBy: text("created_by").notNull(),
  reviewedBy: text("reviewed_by"),
  publishedAt: text("published_at"),
});

export const tennisMatches = pgTable("tennis_matches", {
  matchId: text("match_id").primaryKey(),
  sportSlug: text("sport_slug").notNull(),
  playerAId: text("player_a_id").notNull(),
  playerASport: text("player_a_sport").notNull(),
  playerBId: text("player_b_id").notNull(),
  playerBSport: text("player_b_sport").notNull(),
  winnerId: text("winner_id").notNull(),
  bestOf: integer("best_of").notNull(),
  score: jsonb("score").notNull(),
  retired: boolean("retired"),
});

export const tennisMatchStats = pgTable(
  "tennis_match_stats",
  {
    matchId: text("match_id").notNull(),
    athleteId: text("athlete_id").notNull(),
    athleteSport: text("athlete_sport").notNull(),
    aces: integer("aces").notNull(),
    doubleFaults: integer("double_faults").notNull(),
    firstServeIn: integer("first_serve_in").notNull(),
    firstServeTotal: integer("first_serve_total").notNull(),
    firstServePointsWon: integer("first_serve_points_won").notNull(),
    secondServePointsWon: integer("second_serve_points_won").notNull(),
    secondServeTotal: integer("second_serve_total").notNull(),
    breakPointsSaved: integer("break_points_saved").notNull(),
    breakPointsFaced: integer("break_points_faced").notNull(),
    breakPointsWon: integer("break_points_won").notNull(),
    breakPointsTotal: integer("break_points_total").notNull(),
    winners: integer("winners"),
    unforcedErrors: integer("unforced_errors"),
    totalPointsWon: integer("total_points_won").notNull(),
  },
  (table) => [primaryKey({ columns: [table.matchId, table.athleteId] })],
);

export const footballMatches = pgTable("football_matches", {
  matchId: text("match_id").primaryKey(),
  sportSlug: text("sport_slug").notNull(),
  homeTeamId: text("home_team_id").notNull(),
  awayTeamId: text("away_team_id").notNull(),
  homeGoals: integer("home_goals").notNull(),
  awayGoals: integer("away_goals").notNull(),
});

export const importRuns = pgTable("import_runs", {
  id: text("id").primaryKey(),
  startedAt: text("started_at").notNull(),
  finishedAt: text("finished_at").notNull(),
  createdCount: integer("created_count").notNull(),
  updatedCount: integer("updated_count").notNull(),
  skippedCount: integer("skipped_count").notNull(),
  error: text("error").notNull(),
});

export const appearances = pgTable(
  "appearances",
  {
    matchId: text("match_id").notNull(),
    matchSport: text("match_sport").notNull(),
    athleteId: text("athlete_id").notNull(),
    athleteSport: text("athlete_sport").notNull(),
    teamId: text("team_id").notNull(),
    started: boolean("started").notNull(),
    minutes: integer("minutes").notNull(),
    goals: integer("goals").notNull(),
    assists: integer("assists").notNull(),
    yellowCards: integer("yellow_cards").notNull(),
    redCard: boolean("red_card").notNull(),
  },
  (table) => [primaryKey({ columns: [table.matchId, table.athleteId] })],
);

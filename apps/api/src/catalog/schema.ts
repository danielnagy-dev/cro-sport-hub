import { date, integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

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

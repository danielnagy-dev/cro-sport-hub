import { z } from "zod";
import { idSchema, seasonSchema, textSchema } from "./common.ts";
import { competitionLevelSchema } from "./enums.ts";

export const competitionSchema = z.strictObject({
  id: idSchema,
  sportId: idSchema,
  name: textSchema(120),
  season: seasonSchema,
  level: competitionLevelSchema,
});

export type Competition = z.infer<typeof competitionSchema>;

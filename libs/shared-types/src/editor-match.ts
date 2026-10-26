import { z } from "zod";
import { idSchema, isoDateSchema, textSchema } from "./common.ts";
import { matchSourceSchema, sportSlugSchema, statusSchema } from "./enums.ts";
import { roundSchema } from "./match.ts";

/** Two stored names joined for the editorial list. Each name is at most 80 characters. */
const labelSchema = textSchema(164);

/** One row on the editorial list. Names are a label. Club ids and stat counts stay off it. */
export const editorMatchSchema = z.strictObject({
  id: idSchema,
  sport: sportSlugSchema,
  competition: textSchema(120),
  date: isoDateSchema,
  round: roundSchema,
  status: statusSchema,
  source: matchSourceSchema,
  label: labelSchema,
});

export const editorMatchPageSchema = z.strictObject({
  items: z.array(editorMatchSchema),
  limit: z.int().min(1).max(50),
  offset: z.int().min(0),
  total: z.int().min(0),
});

/** `limit` defaults to 20 at the handler. Offset defaults to 0. Filters are optional. */
export const editorMatchListQuerySchema = z.strictObject({
  sport: sportSlugSchema.optional(),
  status: statusSchema.optional(),
  source: matchSourceSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50),
  offset: z.coerce.number().int().min(0),
});

export type EditorMatch = z.infer<typeof editorMatchSchema>;
export type EditorMatchPage = z.infer<typeof editorMatchPageSchema>;
export type EditorMatchListQuery = z.infer<typeof editorMatchListQuerySchema>;

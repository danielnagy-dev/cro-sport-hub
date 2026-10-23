import { z } from "zod";

/** Review workflow for a match, and later for a gallery. */
export const statusSchema = z.enum(["draft", "review", "published"]);
export type Status = z.infer<typeof statusSchema>;

/** Studio accounts. The user record itself lands with authentication. */
export const roleSchema = z.enum(["editor", "admin"]);
export type Role = z.infer<typeof roleSchema>;

/** The two v1 sports. `Sport` is the entity; this is the slug enum. */
export const sportSlugSchema = z.enum(["tennis", "football"]);
export type SportSlug = z.infer<typeof sportSlugSchema>;

/**
 * Shared card vocabulary. A football appearance still stores `yellowCards`
 * as a count and `redCard` as a flag, which is what the spec describes.
 */
export const cardTypeSchema = z.enum(["yellow", "red"]);
export type CardType = z.infer<typeof cardTypeSchema>;

export const matchSourceSchema = z.enum(["manual", "import"]);
export type MatchSource = z.infer<typeof matchSourceSchema>;

export const competitionLevelSchema = z.enum(["domestic", "international"]);
export type CompetitionLevel = z.infer<typeof competitionLevelSchema>;

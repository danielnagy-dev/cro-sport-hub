import { z } from 'zod'

/** Review workflow for a match (`draft` → `review` → `published`). */
export const statusSchema = z.enum(['draft', 'review', 'published'])
export type Status = z.infer<typeof statusSchema>

/** Studio accounts. The user record itself lands with authentication. */
export const roleSchema = z.enum(['editor', 'admin'])
export type Role = z.infer<typeof roleSchema>

/** ADR-010 v1 sports. `Sport` is the entity; this is the slug enum. */
export const sportSlugSchema = z.enum(['tennis', 'football', 'basketball'])
export type SportSlug = z.infer<typeof sportSlugSchema>

/**
 * Shared card vocabulary. A football appearance still stores `yellowCards`
 * as a count and `redCard` as a flag, which is what the spec describes.
 */
export const cardTypeSchema = z.enum(['yellow', 'red'])
export type CardType = z.infer<typeof cardTypeSchema>

export const matchSourceSchema = z.enum(['manual', 'import'])
export type MatchSource = z.infer<typeof matchSourceSchema>

export const competitionLevelSchema = z.enum(['domestic', 'international'])
export type CompetitionLevel = z.infer<typeof competitionLevelSchema>

/** Editorial appearance lifecycle (ADR-010). */
export const appearanceStatusSchema = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled'])
export type AppearanceStatus = z.infer<typeof appearanceStatusSchema>

/** Publish-slot lifecycle for social buckets (ADR-010). */
export const publishSlotStatusSchema = z.enum([
  'planned',
  'waiting_for_data',
  'ready_for_review',
  'approved',
  'published',
  'skipped',
  'error',
])
export type PublishSlotStatus = z.infer<typeof publishSlotStatusSchema>

/** Social networks that receive NetworkPosts. */
export const networkSchema = z.enum(['instagram', 'facebook', 'x'])
export type Network = z.infer<typeof networkSchema>

/**
 * Per-network post lifecycle (ADR-010 NetworkPost).
 * Narrower than publish-slot status: no `waiting_for_data`.
 */
export const networkPostStatusSchema = z.enum([
  'planned',
  'ready_for_review',
  'approved',
  'published',
  'skipped',
  'error',
])
export type NetworkPostStatus = z.infer<typeof networkPostStatusSchema>

/** Who drafted a row for audit (ADR-010). */
export const creatorKindSchema = z.enum(['bot', 'manual'])
export type CreatorKind = z.infer<typeof creatorKindSchema>

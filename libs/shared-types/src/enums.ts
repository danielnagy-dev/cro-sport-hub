import { z } from 'zod'

export const statusSchema = z.enum(['draft', 'review', 'published'])
export type Status = z.infer<typeof statusSchema>

export const roleSchema = z.enum(['editor', 'admin'])
export type Role = z.infer<typeof roleSchema>

export const sportSlugSchema = z.enum(['tennis', 'football', 'basketball'])
export type SportSlug = z.infer<typeof sportSlugSchema>

export const cardTypeSchema = z.enum(['yellow', 'red'])
export type CardType = z.infer<typeof cardTypeSchema>

export const matchSourceSchema = z.enum(['manual', 'import'])
export type MatchSource = z.infer<typeof matchSourceSchema>

export const competitionLevelSchema = z.enum(['domestic', 'international'])
export type CompetitionLevel = z.infer<typeof competitionLevelSchema>

export const appearanceStatusSchema = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled'])
export type AppearanceStatus = z.infer<typeof appearanceStatusSchema>

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

export const networkSchema = z.enum(['instagram', 'facebook', 'x'])
export type Network = z.infer<typeof networkSchema>

export const networkPostStatusSchema = z.enum([
  'planned',
  'ready_for_review',
  'approved',
  'published',
  'skipped',
  'error',
])
export type NetworkPostStatus = z.infer<typeof networkPostStatusSchema>

export const creatorKindSchema = z.enum(['bot', 'manual'])
export type CreatorKind = z.infer<typeof creatorKindSchema>

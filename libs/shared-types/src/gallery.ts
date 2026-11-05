import { z } from 'zod'
import { idSchema } from './common.ts'
import { statusSchema } from './enums.ts'

export const galleryCreateBodySchema = z.strictObject({ matchIds: z.array(idSchema) })
export const galleryCaptionPatchSchema = z.strictObject({ caption: z.string().max(500) })
export const galleryCreatedSchema = z.strictObject({
  id: idSchema,
  slideIndexes: z.array(z.number().int().nonnegative()),
})
const galleryTextStatSchema = z.object({ label: z.string(), value: z.string() })
const gallerySlidePlayerSchema = z.object({
  name: z.string(),
  stats: z.array(galleryTextStatSchema),
})
const gallerySlideViewSchema = z.object({
  index: z.number().int().nonnegative(),
  matchId: idSchema,
  caption: z.string(),
  stats: z.array(gallerySlidePlayerSchema),
})
export const galleryViewSchema = z.strictObject({
  id: idSchema,
  status: statusSchema,
  slides: z.array(gallerySlideViewSchema),
})
export type GalleryView = z.infer<typeof galleryViewSchema>

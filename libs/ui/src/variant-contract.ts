/**
 * Documented `data-*` variant attributes for upcoming kit primitives.
 * Studio Angular hosts and React primitives bind only these names and values.
 */

export const KIT_DATA_ATTRIBUTES = {
  tone: 'data-tone',
  size: 'data-size',
  variant: 'data-variant',
  status: 'data-status',
} as const

export const KIT_TONES = ['neutral', 'tennis', 'football', 'basketball'] as const
export const KIT_SIZES = ['sm', 'md', 'lg'] as const
export const KIT_VARIANTS = ['solid', 'soft', 'outline'] as const
export const KIT_STATUSES = ['draft', 'review', 'published'] as const

export type KitDataAttribute = (typeof KIT_DATA_ATTRIBUTES)[keyof typeof KIT_DATA_ATTRIBUTES]
export type KitTone = (typeof KIT_TONES)[number]
export type KitSize = (typeof KIT_SIZES)[number]
export type KitVariant = (typeof KIT_VARIANTS)[number]
export type KitStatus = (typeof KIT_STATUSES)[number]

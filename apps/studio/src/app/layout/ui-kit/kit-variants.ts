export const KIT_TONES = ['neutral', 'tennis', 'football', 'basketball'] as const
export const KIT_SIZES = ['sm', 'md', 'lg'] as const
export const KIT_VARIANTS = ['solid', 'soft', 'outline'] as const
export const KIT_STATUSES = ['draft', 'review', 'published'] as const

export type KitTone = (typeof KIT_TONES)[number]
export type KitSize = (typeof KIT_SIZES)[number]
export type KitVariant = (typeof KIT_VARIANTS)[number]
export type KitStatus = (typeof KIT_STATUSES)[number]

import { z } from 'zod'

/** A cross-field failure. `path` is the form field to highlight. */
export type FieldIssue = {
  path: readonly string[]
  message: string
}

/** 1–64 characters. UUIDs fit; so do short seed ids such as `player-one`. */
export const idSchema = z
  .string()
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/,
    'Expected an id of 1–64 letters, digits, underscores, or hyphens',
  )

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Expected a lowercase slug')
  .max(80)

const textWithoutEdges = /^\S(?:.*\S)?$/u

export function textSchema(maxLength: number) {
  return z
    .string()
    .min(1)
    .max(maxLength)
    .regex(textWithoutEdges, 'Expected text without surrounding whitespace')
}

/** ISO 3166-1 alpha-2 shape. The full country list is not checked here. */
export const countryCodeSchema = z
  .string()
  .regex(/^[A-Z]{2}$/, 'Expected an ISO 3166-1 alpha-2 country code')

export const httpsUrlSchema = z
  .url()
  .max(500)
  .refine((value) => value.startsWith('https://'), 'Expected an https URL')

/** Calendar date, year 1950–2100. Match days and club spells use this. */
export const isoDateSchema = z.iso.date().superRefine((value, ctx) => {
  const year = Number(value.slice(0, 4))
  if (year < 1950 || year > 2100) {
    ctx.addIssue('Expected a date from 1950 to 2100')
  }
})

/** UTC or an explicit offset, with seconds. */
export const timestampSchema = z.iso.datetime({ offset: true })

/**
 * `2026` or `2026/27`. The two-digit year must be the next year.
 * `1999/00` is the cross-century case.
 */
export const seasonSchema = z.string().superRefine((value, ctx) => {
  const singleYear = /^(\d{4})$/.exec(value)
  if (singleYear?.[1] !== undefined) {
    const year = Number(singleYear[1])
    if (year < 1900 || year > 2100) {
      ctx.addIssue('Expected a season year from 1900 to 2100')
    }
    return
  }

  const splitYear = /^(\d{4})\/(\d{2})$/.exec(value)
  if (splitYear?.[1] === undefined || splitYear[2] === undefined) {
    ctx.addIssue('Expected a season like 2026 or 2026/27')
    return
  }

  const start = Number(splitYear[1])
  const end = Number(splitYear[2])
  if (start < 1900 || start > 2099 || end !== (start + 1) % 100) {
    ctx.addIssue('Expected the second year to follow the first, as in 2026/27')
  }
})

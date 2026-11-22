import { hrMessages } from './hr'
import type { MessageKey, MessageMap } from './keys'

export type { MessageKey, MessageMap } from './keys'
export { MESSAGE_KEYS } from './keys'
export { hrMessages } from './hr'

/**
 * Resolve a key against a locale map. Missing keys throw — no silent fallback.
 * Callers that need the default HR map use {@link t}.
 */
export function resolveMessage(map: Partial<MessageMap>, key: string): string {
  const value = map[key as MessageKey]
  if (typeof value !== 'string') {
    throw new Error(`Missing Studio message: ${key}`)
  }
  return value
}

/** Look up a typed key in the default HR catalog. */
export function t(key: MessageKey, map: MessageMap = hrMessages): string {
  return resolveMessage(map, key)
}

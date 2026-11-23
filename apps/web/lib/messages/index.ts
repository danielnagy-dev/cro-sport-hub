import { hrMessages } from './hr'
import type { MessageKey, MessageMap } from './keys'

export type { MessageKey, MessageMap } from './keys'
export { MESSAGE_KEYS } from './keys'
export { hrMessages } from './hr'

export function resolveMessage(map: Partial<MessageMap>, key: string): string {
  const value = map[key as MessageKey]
  if (typeof value !== 'string') {
    throw new Error(`Missing web message: ${key}`)
  }
  return value
}

export function t(key: MessageKey, map: MessageMap = hrMessages): string {
  return resolveMessage(map, key)
}

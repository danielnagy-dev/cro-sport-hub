import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'tennis' | 'football'

export type BadgeProps = {
  tone?: BadgeTone
  children: ReactNode
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return <span className={`csh-badge csh-badge--${tone}`}>{children}</span>
}

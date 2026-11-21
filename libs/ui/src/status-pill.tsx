import type { ReactNode } from 'react'
import type { KitSize, KitStatus } from './variant-contract.ts'

export type StatusPillProps = {
  status: KitStatus
  size?: KitSize
  children: ReactNode
}

export function StatusPill({ status, size = 'sm', children }: StatusPillProps) {
  return (
    <span className="csh-status-pill csh-kit" data-status={status} data-size={size}>
      {children}
    </span>
  )
}

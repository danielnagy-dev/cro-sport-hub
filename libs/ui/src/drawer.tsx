import type { ReactNode } from 'react'
import { Button } from './button.tsx'

export type DrawerProps = {
  title: string
  open: boolean
  onClose?: () => void
  children: ReactNode
}

export function Drawer({ title, open, onClose, children }: DrawerProps) {
  if (!open) return null

  return (
    <div className="csh-drawer" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="csh-drawer__backdrop"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside className="csh-drawer__panel">
        <header className="csh-drawer__header">
          <h2 className="csh-drawer__title">{title}</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </header>
        <div className="csh-drawer__body">{children}</div>
      </aside>
    </div>
  )
}

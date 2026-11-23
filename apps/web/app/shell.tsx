import type { ReactNode } from 'react'

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <header className="shell-header">
        <a className="shell-home" href="/">
          Cro Sport Hub
        </a>
        <nav className="shell-sports" aria-label="Sports">
          <a className="shell-sport" href="/tennis">
            tennis
          </a>
          <a className="shell-sport" href="/football">
            football
          </a>
        </nav>
      </header>
      {children}
    </div>
  )
}

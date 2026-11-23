import type { ReactNode } from 'react'
import { t } from '../lib/messages'

const NAV_LINKS = [
  { href: '/', key: 'nav.pocetna' },
  { href: '/sportasi', key: 'nav.sportasi' },
  { href: '/reprezentacija', key: 'nav.reprezentacija' },
] as const

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <a className="skip-link" href="#content">
        {t('chrome.skip')}
      </a>
      <header className="shell-header">
        <a className="shell-home" href="/">
          {t('chrome.brand')}
        </a>
        <nav className="shell-nav" aria-label={t('chrome.nav-aria')}>
          {NAV_LINKS.map((link) => (
            <a className="shell-nav-link" href={link.href} key={link.href}>
              {t(link.key)}
            </a>
          ))}
        </nav>
      </header>
      {children}
    </div>
  )
}

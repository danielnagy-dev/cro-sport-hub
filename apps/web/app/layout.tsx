import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '@cro-sport-hub/ui/components.css'
import '@cro-sport-hub/ui/tokens.css'
import { t } from '../lib/messages'
import { SITE_ORIGIN } from '../lib/site-metadata'
import { SiteShell } from './shell'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: t('chrome.brand'),
  description: t('layout.description'),
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hr">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}

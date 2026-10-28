import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '@cro-sport-hub/ui/components.css'
import '@cro-sport-hub/ui/tokens.css'
import { SiteShell } from './shell'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cro Sport Hub',
  description: 'Public results portal',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}

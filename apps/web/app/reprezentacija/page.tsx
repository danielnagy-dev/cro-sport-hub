import type { Metadata } from 'next'
import { t } from '../../lib/messages'
import { shareMetadata } from '../../lib/site-metadata'

const TITLE = `${t('reprezentacija.title')} · ${t('chrome.brand')}`
const DESCRIPTION = t('reprezentacija.lead')

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...shareMetadata({
    pathname: '/reprezentacija',
    title: TITLE,
    description: DESCRIPTION,
  }),
}

export default function ReprezentacijaPage() {
  return (
    <main id="content" tabIndex={-1}>
      <h1>{t('reprezentacija.title')}</h1>
      <p>{t('reprezentacija.lead')}</p>
    </main>
  )
}

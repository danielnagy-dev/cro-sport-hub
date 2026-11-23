import type { Metadata } from 'next'
import { t } from '../../lib/messages'
import { shareMetadata } from '../../lib/site-metadata'

const TITLE = `${t('sportasi.title')} · ${t('chrome.brand')}`
const DESCRIPTION = t('sportasi.lead')

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...shareMetadata({
    pathname: '/sportasi',
    title: TITLE,
    description: DESCRIPTION,
  }),
}

export default function SportasiPage() {
  return (
    <main id="content" tabIndex={-1}>
      <h1>{t('sportasi.title')}</h1>
      <p>{t('sportasi.lead')}</p>
    </main>
  )
}

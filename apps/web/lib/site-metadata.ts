import type { Metadata } from 'next'

/** Public site origin for absolute SEO URLs (sitemap, Open Graph). */
export const SITE_ORIGIN = 'http://localhost:3000'

export const SITE_NAME = 'Cro Sport Hub'

export function absoluteUrl(pathname: string): string {
  const base = SITE_ORIGIN.replace(/\/$/, '')
  if (pathname === '/' || pathname === '') {
    return `${base}/`
  }
  return `${base}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
}

type ShareMetaInput = {
  pathname: string
  title: string
  description: string
}

export function shareMetadata({
  pathname,
  title,
  description,
}: ShareMetaInput): Pick<Metadata, 'openGraph' | 'twitter'> {
  const url = absoluteUrl(pathname)
  return {
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

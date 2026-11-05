import type { SportSlug } from '@cro-sport-hub/shared-types'
import type { MetadataRoute } from 'next'
import type { ApiClient } from './api-client'

export const staticPublicPaths = ['/', '/tennis', '/football'] as const

const publicSports: SportSlug[] = ['tennis', 'football']

export type AthletesBySport = ApiClient['athletesBySport']

/** Pathnames for the public sitemap, in stable order. */
export async function publicSitemapPaths(athletesBySport: AthletesBySport): Promise<string[]> {
  const paths: string[] = [...staticPublicPaths]
  for (const sport of publicSports) {
    try {
      const athletes = await athletesBySport(sport)
      for (const athlete of athletes) {
        paths.push(`/athletes/${athlete.slug}`)
      }
    } catch {
      continue
    }
  }
  return paths
}

export function pathsToSitemapEntries(
  paths: readonly string[],
  siteOrigin: string,
): MetadataRoute.Sitemap {
  const origin = siteOrigin.replace(/\/$/, '')
  return paths.map((path) => ({
    url: path === '/' ? `${origin}/` : `${origin}${path}`,
  }))
}

export async function buildPublicSitemap(
  client: Pick<ApiClient, 'athletesBySport'>,
  siteOrigin: string,
): Promise<MetadataRoute.Sitemap> {
  const paths = await publicSitemapPaths((sport) => client.athletesBySport(sport))
  return pathsToSitemapEntries(paths, siteOrigin)
}

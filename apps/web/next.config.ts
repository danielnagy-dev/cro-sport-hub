import type { NextConfig } from 'next'

export const retiredSportHubRedirects = [
  { source: '/tennis', destination: '/', permanent: true },
  { source: '/football', destination: '/', permanent: true },
] as const

const nextConfig: NextConfig = {
  async redirects() {
    return [...retiredSportHubRedirects]
  },
}

export default nextConfig

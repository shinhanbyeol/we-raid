import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@fullcalendar/core',
    '@fullcalendar/react',
    '@fullcalendar/daygrid',
    '@fullcalendar/timegrid',
    '@fullcalendar/interaction',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.we-raid.com',
      },
    ],
  },
}

export default nextConfig

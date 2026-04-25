import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compiler: {
    // Strip console.* in production builds
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

export default nextConfig

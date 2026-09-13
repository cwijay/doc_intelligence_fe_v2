import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Hostnames allowed to request /_next/* from the dev server. Needed when the
  // dev server is reached over a tunnel or from another device on the LAN.
  // NOTE: setting this at all switches Next from "warn" to "block" mode for
  // cross-origin dev requests, so any new access hostname must be listed here.
  allowedDevOrigins: [
    'localhost',
    '*.localhost',
    '127.0.0.1',
    // Cloudflare quick tunnels (scripts/local_exec/start-local.sh --tunnel)
    '*.trycloudflare.com',
    // LAN access from other devices
    '192.168.*.*',
    '10.*.*.*',
  ],
  // Disable trailing slash redirects to prevent 308 loops with backend APIs
  skipTrailingSlashRedirect: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Optimize package imports for better performance
  experimental: {
    optimizePackageImports: [
      '@tanstack/react-query',
      '@tanstack/react-query-devtools',
      '@headlessui/react',
      '@heroicons/react',
      'framer-motion',
      'date-fns',
      'react-hot-toast'
    ],
  },
  // Headers configuration - minimal headers to avoid hydration issues
  async headers() {
    return [
      // Only add security headers, no aggressive caching that breaks hydration
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

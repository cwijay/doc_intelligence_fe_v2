import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
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
  // Turbopack configuration (default in Next.js 16)
  turbopack: {},

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

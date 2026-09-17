import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    unoptimized: true,
  },
  // Keep Node built-ins on the server; do not polyfill into the browser bundle.
  serverExternalPackages: [],
  async redirects() {
    return [
      { source: '/admin', destination: '/', permanent: false },
      { source: '/admin/:path*', destination: '/:path*', permanent: false },
      { source: '/clients', destination: '/customers', permanent: false },
      { source: '/clients/:path*', destination: '/customers/:path*', permanent: false },
    ];
  },
};

export default nextConfig;

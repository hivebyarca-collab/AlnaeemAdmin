import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Static export removed: the admin system requires server actions, API routes
  // (image search proxy, WhatsApp webhook) and the local SQLite repository.
  // Storefront pages remain static-friendly server components.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

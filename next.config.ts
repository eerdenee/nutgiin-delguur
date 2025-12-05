import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Enable image optimization
    formats: ['image/avif', 'image/webp'],

    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "qxumibesceleayqhzznc.supabase.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        // Cloudflare R2 public URL
        protocol: "https",
        hostname: "pub-e60593642d044eecb8fe8d8ea95b781a.r2.dev",
      },
      {
        // Any R2 subdomain
        protocol: "https",
        hostname: "*.r2.dev",
      },
    ],
  },

  // Enable experimental features for better caching
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react'],
  },

  // Cache headers for static assets
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

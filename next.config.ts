import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standard Next.js output — fully compatible with AWS Amplify Hosting (SSR mode).
  // No experimental edge runtime; all routes use Node.js runtime.
  // Do NOT add output:'export' — Amplify needs the SSR server to handle dynamic routes.

  // Amplify + CloudFront handle trailing slashes correctly with this set to false
  trailingSlash: false,

  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
      {
        // Prevent caching manifest so icon changes take effect immediately
        source: '/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'no-cache' }],
      },
    ];
  },
};

export default nextConfig;

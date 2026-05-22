import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standard Next.js output — fully compatible with AWS Amplify Hosting (SSR mode).
  // No experimental edge runtime; all routes use Node.js runtime.
  // Do NOT add output:'export' — Amplify needs the SSR server to handle dynamic routes.

  // Amplify SSR (Lambda) does not reliably expose non-NEXT_PUBLIC_ env vars at runtime.
  // Baking them here at build time (where they ARE available, confirmed by amplify.yml check)
  // embeds the values into the server bundle. These keys are ONLY referenced in server-side
  // Route Handlers (app/api/*) and will never appear in client JS bundles.
  env: {
    GOOGLE_VISION_API_KEY: process.env.GOOGLE_VISION_API_KEY ?? '',
  },

  // Amplify + CloudFront handle trailing slashes correctly with this set to false
  trailingSlash: false,

  async headers() {
    return [
      {
        // SECURITY: All HTML page responses must not be cached by CDN (CloudFront/Amplify)
        // or any intermediate proxy. Server-rendered pages contain user-specific data
        // (RSC payload, auth state) and must always be fetched fresh per-request.
        // Excludes Next.js static assets and public files which are safe to cache.
        source: '/((?!_next\\/static|_next\\/image|favicon\\.ico|icons\\/|images\\/).*)',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, no-cache, must-revalidate' },
        ],
      },
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

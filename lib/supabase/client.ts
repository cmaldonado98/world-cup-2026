import { createBrowserClient } from '@supabase/ssr';

// Re-exports the browser client using the @supabase/ssr factory so session
// cookies are handled consistently with the SSR middleware.
//
// SECURITY: The singleton is intentionally guarded to only live in the browser.
// In Next.js, client components are also executed on the server during SSR.
// A module-level singleton on the server is shared across ALL requests, so if
// it ever held auth state (e.g. from an in-memory fallback store) it would leak
// one user's session into another user's SSR render.
let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  // Graceful during static pre-render – real values are baked in by the bundler.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'placeholder';

  // On the server (SSR), always return a fresh client so the module-level
  // singleton is never shared across different users' requests.
  if (typeof window === 'undefined') {
    return createBrowserClient(url, key);
  }

  if (!_client) {
    _client = createBrowserClient(url, key);
  }
  return _client;
}

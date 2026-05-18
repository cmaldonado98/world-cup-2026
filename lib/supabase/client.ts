import { createBrowserClient } from '@supabase/ssr';

// Re-exports the browser client using the @supabase/ssr factory so session
// cookies are handled consistently with the SSR middleware.
let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  // Graceful during static pre-render – real values are baked in by the bundler.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? 'placeholder';

  if (!_client) {
    _client = createBrowserClient(url, key);
  }
  return _client;
}

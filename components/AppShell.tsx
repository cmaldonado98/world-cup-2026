'use client';

// Decides whether to show the login screen (no nav) or the app (with nav).
// This replaces the per-page auth guards that were in each page component.
import { Loader2 } from 'lucide-react';
import { useAlbum   } from '@/contexts/AlbumContext';
import { BottomNav  } from '@/components/BottomNav';
import { LoginScreen } from '@/components/LoginScreen';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAlbum();

  // Brief splash while Supabase resolves the cached session from localStorage
  if (loading) {
    return (
      <div className="min-h-screen bg-ios-gray6 dark:bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-5xl leading-none">⚽</span>
          <Loader2 size={22} className="text-ios-blue animate-spin mt-2" />
        </div>
      </div>
    );
  }

  // Not authenticated – full-screen login, bottom nav hidden
  if (!user) {
    return <LoginScreen />;
  }

  // Authenticated – render the requested page + bottom nav
  return (
    <>
      <main className="pb-nav min-h-screen">{children}</main>
      <BottomNav />
    </>
  );
}

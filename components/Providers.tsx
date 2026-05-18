'use client';

// Thin client wrapper that mounts all providers.
// Kept separate so app/layout.tsx stays a Server Component.
import { AlbumProvider } from '@/contexts/AlbumContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return <AlbumProvider>{children}</AlbumProvider>;
}

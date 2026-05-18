'use client';

// Public share page – shows a user's QR code so others can scan it.
// Accessible without authentication.
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2   } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Props {
  params: Promise<{ userId: string }>;
}

export default function SharePage({ params }: Props) {
  const [userId,  setUserId]  = useState('');
  const [owned,   setOwned]   = useState(0);
  const [ready,   setReady]   = useState(false);

  useEffect(() => {
    params.then(async ({ userId: uid }) => {
      setUserId(uid);

      // Fetch count for display (public read per RLS policy)
      const { count } = await getSupabaseClient()
        .from('user_cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid)
        .gt('quantity', 0);

      setOwned(count ?? 0);
      setReady(true);
    });
  }, [params]);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/share/${userId}`
    : '';

  return (
    <div className="min-h-screen bg-ios-gray6 dark:bg-black flex flex-col items-center justify-center px-6 py-12 gap-6">
      <div className="text-5xl">⚽</div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white text-center">
        Álbum Mundial 2026
      </h1>

      {!ready ? (
        <Loader2 size={32} className="text-ios-blue animate-spin" />
      ) : (
        <>
          <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 shadow-ios-card">
            {shareUrl ? (
              <QRCodeSVG value={shareUrl} size={220} level="M" includeMargin={false} />
            ) : (
              <div className="w-[220px] h-[220px] bg-ios-gray5 dark:bg-[#2C2C2E] rounded-2xl animate-pulse" />
            )}
          </div>

          <p className="text-sm text-ios-gray text-center">
            Este usuario tiene <strong className="text-gray-900 dark:text-white">{owned}</strong> cromos registrados
          </p>

          <p className="text-xs text-ios-gray text-center max-w-xs">
            Escanea este QR desde la sección <em>Intercambio</em> de tu álbum para ver qué pueden intercambiar
          </p>
        </>
      )}
    </div>
  );
}

'use client';

import { useCallback, useState } from 'react';
import dynamic   from 'next/dynamic';
import { QRCodeSVG  } from 'qrcode.react';
import { ScanLine, QrCode, ArrowLeft, Loader2 } from 'lucide-react';
import { useAlbum   } from '@/contexts/AlbumContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { CardMap } from '@/contexts/AlbumContext';
import { getAllStickers } from '@/lib/data/teams';

// Load scanner only on the client – html5-qrcode touches window/navigator
const QRScanner = dynamic(() => import('@/components/QRScanner'), { ssr: false });

// ── Types ──────────────────────────────────────────────────────────────────────
type ScanPhase = 'qr' | 'scanning' | 'matching';

interface MatchResult {
  theirId:   string;
  iCanGive:  string[]; // I have repeated, they're missing
  theyGive:  string[]; // they have repeated, I'm missing
}

// ── Matcher helpers ────────────────────────────────────────────────────────────
function computeMatch(myCards: CardMap, theirCards: CardMap): Omit<MatchResult, 'theirId'> {
  const all = getAllStickers();
  const iCanGive: string[] = [];
  const theyGive: string[] = [];

  for (const id of all) {
    const mine  = myCards[id]   ?? 0;
    const theirs = theirCards[id] ?? 0;
    if (mine  > 1 && theirs === 0) iCanGive.push(id);
    if (theirs > 1 && mine   === 0) theyGive.push(id);
  }
  return { iCanGive, theyGive };
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function IntercambioPage() {
  const { user, cardMap } = useAlbum();

  const [phase,    setPhase]    = useState<ScanPhase>('qr');
  const [match,    setMatch]    = useState<MatchResult | null>(null);
  const [matchTab, setMatchTab] = useState<0 | 1>(0);
  const [fetching, setFetching] = useState(false);
  const [errMsg,   setErrMsg]   = useState('');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  const handleScan = useCallback(async (text: string) => {
    // Expect URL format: https://domain/share/[userId]
    const match = text.match(/\/share\/([a-f0-9-]{36})/i);
    if (!match) { setErrMsg('QR no reconocido'); return; }

    const theirId = match[1];
    setFetching(true);
    setPhase('matching');

    const { data, error } = await getSupabaseClient()
      .from('user_cards')
      .select('card_id, quantity')
      .eq('user_id', theirId);

    setFetching(false);

    if (error || !data) {
      setErrMsg('No se pudo cargar el álbum escaneado');
      setPhase('scanning');
      return;
    }

    const rows = data as Array<{ card_id: string; quantity: number }>;
    const theirCards: CardMap = {};
    for (const row of rows) {
      if (row.quantity > 0) theirCards[row.card_id] = row.quantity;
    }

    const { iCanGive, theyGive } = computeMatch(cardMap, theirCards);
    setMatch({ theirId, iCanGive, theyGive });
  }, [cardMap]);



  return (
    <div className="min-h-screen bg-ios-gray6 dark:bg-black">
      {/* ── Header ── */}
      <header className="px-4 pt-14 pb-4 flex items-center gap-3">
        {phase !== 'qr' && (
          <button
            onClick={() => { setPhase('qr'); setMatch(null); setErrMsg(''); }}
            className="tap-scale p-1 -ml-1"
          >
            <ArrowLeft size={22} className="text-ios-blue" />
          </button>
        )}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Intercambio</h1>
      </header>

      {/* ── Phase: My QR ── */}
      {phase === 'qr' && user && (
        <div className="flex flex-col items-center gap-6 px-4 py-4">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 shadow-ios-card">
            <QRCodeSVG
              value={`${appUrl}/share/${user.id}`}
              size={220}
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="text-xs text-ios-gray text-center px-4">
            Comparte este QR para que un amigo escanee tu álbum y vean qué pueden intercambiar
          </p>

          <button
            onClick={() => setPhase('scanning')}
            className="flex items-center gap-2 bg-ios-blue text-white font-semibold
                       text-sm px-8 py-3.5 rounded-2xl tap-scale shadow-ios-card"
          >
            <ScanLine size={18} />
            Escanear álbum de un amigo
          </button>
        </div>
      )}

      {/* ── Phase: Scanner ── */}
      {phase === 'scanning' && (
        <div className="px-4 py-4 flex flex-col gap-4">
          <p className="text-sm text-ios-gray text-center">
            Apunta la cámara al QR de tu amigo
          </p>
          <QRScanner
            onScan={handleScan}
            onError={msg => setErrMsg(msg)}
          />
          {errMsg && (
            <p className="text-sm text-[#FF3B30] text-center">{errMsg}</p>
          )}
        </div>
      )}

      {/* ── Phase: Match results ── */}
      {phase === 'matching' && (
        <div className="px-4 py-4 flex flex-col gap-4">
          {fetching ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <Loader2 size={32} className="text-ios-blue animate-spin" />
              <p className="text-sm text-ios-gray">Cargando álbum…</p>
            </div>
          ) : match ? (
            <>
              {/* iOS Segmented control */}
              <div className="flex bg-ios-gray5 dark:bg-[#2C2C2E] rounded-xl p-1">
                {(['Lo que le doy', 'Lo que me da'] as const).map((label, i) => (
                  <button
                    key={label}
                    onClick={() => setMatchTab(i as 0 | 1)}
                    className={[
                      'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all tap-scale',
                      matchTab === i
                        ? 'segmented-active text-gray-900'
                        : 'text-ios-gray',
                    ].join(' ')}
                  >
                    {label} ({i === 0 ? match.iCanGive.length : match.theyGive.length})
                  </button>
                ))}
              </div>

              {/* Results list */}
              <MatchList ids={matchTab === 0 ? match.iCanGive : match.theyGive} />
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ── Match list sub-component ────────────────────────────────────────────────
function MatchList({ ids }: { ids: string[] }) {
  if (ids.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🤝</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Sin coincidencias</p>
        <p className="text-xs text-ios-gray mt-1">No hay cromos para intercambiar aquí</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ids.map(id => (
        <span
          key={id}
          className="bg-white dark:bg-[#1C1C1E] border border-ios-gray5 dark:border-[#3A3A3C]
                     text-gray-900 dark:text-white text-xs font-semibold
                     rounded-xl px-3 py-2 shadow-ios-card"
        >
          {id}
        </span>
      ))}
    </div>
  );
}

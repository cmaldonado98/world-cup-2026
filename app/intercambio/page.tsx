'use client';

import { useCallback, useState } from 'react';
import dynamic   from 'next/dynamic';
import { QRCodeSVG  } from 'qrcode.react';
import { ScanLine, QrCode, ArrowLeft, Loader2, Share } from 'lucide-react';
import { useAlbum   } from '@/contexts/AlbumContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { CardMap } from '@/contexts/AlbumContext';
import { getAllStickers, TEAMS, GROUPS } from '@/lib/data/teams';

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

  const shareOrCopy = async (title: string, text: string) => {
    if (navigator.share) {
      try { 
        await navigator.share({ title, text }); 
        return;
      } catch (e: any) { 
        if (e.name === 'AbortError') return; // Usuario canceló explícitamente el native share
      }
    }
    
    // Fallback: Clipboard API moderna (requiere HTTPS o localhost)
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        alert('Copiado al portapapeles');
        return;
      } catch (e) {}
    }

    // Fallback absoluto: Hack de TextArea
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (success) alert('Copiado al portapapeles');
      else alert('No se pudo copiar el texto');
    } catch (e) {
      alert('Tu navegador no soporta auto-copiar.');
    }
  };

  const formatStickersMessage = (header: string, stickerIds: string[]): string => {
    if (stickerIds.length === 0) return `${header}\n\n¡No hay cromos aquí!`;

    // Map sticker IDs by Team Code
    const idsByTeam: Record<string, string[]> = {};
    for (const id of stickerIds) {
      const code = id.match(/^[A-Z]+/)?.[0] || 'FWC';
      if (!idsByTeam[code]) idsByTeam[code] = [];
      idsByTeam[code].push(id);
    }

    let msg = `==================\n${header}\n==================\n\n`;

    for (const [groupName, groupTeams] of Array.from(GROUPS.entries())) {
      // Check if group has any matching stickers
      const hasStickers = groupTeams.some(team => idsByTeam[team.code]?.length > 0);
      if (!hasStickers) continue;

      const groupTitle = 
        groupName === 'Especiales' ? '✦ Especiales ✦' : 
        groupName === 'CocaCola'   ? '🥤 Coca-Cola 🥤' : 
        `🏆 Grupo ${groupName}`;

      msg += `${groupTitle}\n`;
      msg += `------------------------\n`;

      for (const team of groupTeams) {
        const ids = idsByTeam[team.code];
        if (ids && ids.length > 0) {
          // Extrae solo el número (ej: "MEX 10" -> "10")
          const numbers = ids.map(id => id.replace(/^[A-Z]+/, '') || 'Logo');
          msg += `${team.flag} ${team.name}:\n  ${numbers.join(', ')}\n`;
        }
      }
      msg += `\n`;
    }

    return msg.trim();
  };

  const handleShareMissing = () => {
    const all = getAllStickers();
    const missing = all.filter(id => (cardMap[id] ?? 0) === 0);
    const text = formatStickersMessage('Me Faltan (Álbum Mundial 2026)', missing);
    shareOrCopy('Mis Faltantes', text);
  };

  const handleShareRepeated = () => {
    const all = getAllStickers();
    const repeated = all.filter(id => (cardMap[id] ?? 0) > 1);
    const text = formatStickersMessage('Tengo Repetidas (Álbum Mundial 2026)', repeated);
    shareOrCopy('Mis Repetidas', text);
  };

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
                       text-sm px-8 py-3.5 rounded-2xl tap-scale shadow-ios-card min-w-[280px] justify-center"
          >
            <ScanLine size={18} />
            Escanear álbum de un amigo
          </button>

          {/* Share buttons */}
          <div className="flex gap-3 w-full max-w-[280px]">
            <button
              onClick={handleShareMissing}
              className="flex-1 flex flex-col items-center gap-1.5 bg-white dark:bg-[#1C1C1E]
                         text-gray-900 dark:text-white text-xs font-semibold
                         px-4 py-3 rounded-2xl tap-scale shadow-ios-card"
            >
              <Share size={16} className="text-ios-blue" />
              Compartir<br/>Faltantes
            </button>
            <button
              onClick={handleShareRepeated}
              className="flex-1 flex flex-col items-center gap-1.5 bg-white dark:bg-[#1C1C1E]
                         text-gray-900 dark:text-white text-xs font-semibold
                         px-4 py-3 rounded-2xl tap-scale shadow-ios-card"
            >
              <Share size={16} className="text-ios-blue" />
              Compartir<br/>Repetidas
            </button>
          </div>
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

'use client';

import { useCallback, useState, useEffect } from 'react';
import dynamic   from 'next/dynamic';
import { QRCodeSVG  } from 'qrcode.react';
import { ScanLine, QrCode, ArrowLeft, Loader2, Share } from 'lucide-react';
import { useAlbum   } from '@/contexts/AlbumContext';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { CardMap } from '@/contexts/AlbumContext';
import { getAllStickers, TEAMS, GROUPS } from '@/lib/data/teams';
import type { QRScanMetadata } from '@/components/QRScanner';

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
  const { user, cardMap, incrementCard, decrementCard } = useAlbum();

  const [phase,    setPhase]    = useState<ScanPhase>('qr');
  const [match,    setMatch]    = useState<MatchResult | null>(null);
  const [fetching, setFetching] = useState(false);
  const [errMsg,   setErrMsg]   = useState('');
  
  // Estados para selección de cromos a intercambiar
  const [selectedToGive, setSelectedToGive] = useState<Set<string>>(new Set());
  const [selectedToReceive, setSelectedToReceive] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  // Bloquear scroll cuando el modal está abierto
  useEffect(() => {
    if (showConfirmModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showConfirmModal]);

  const handleScan = useCallback(async (text: string, metadata?: QRScanMetadata) => {
    setFetching(true);
    setPhase('matching');
    setErrMsg('');
    setSelectedToGive(new Set());
    setSelectedToReceive(new Set());

    // Manejar códigos QR de Figuritas
    if (metadata?.source === 'figuritas' && metadata.figuritasData) {
      const { faltantes, repetidos } = metadata.figuritasData;
      
      // Reconstruir el CardMap de la otra persona basado en faltantes y repetidos
      const allStickers = getAllStickers();
      const theirCards: CardMap = {};
      
      for (const stickerId of allStickers) {
        if (repetidos.includes(stickerId)) {
          // Si está en repetidos, asumimos que tienen al menos 2
          theirCards[stickerId] = 2;
        } else if (!faltantes.includes(stickerId)) {
          // Si no está en faltantes ni en repetidos, tienen exactamente 1
          theirCards[stickerId] = 1;
        }
        // Si está en faltantes, no lo agregamos al map (cantidad = 0)
      }

      const { iCanGive, theyGive } = computeMatch(cardMap, theirCards);
      setMatch({ theirId: 'figuritas-user', iCanGive, theyGive });
      setFetching(false);
      return;
    }

    // Manejar códigos QR nativos (URL con userId)
    // Expect URL format: https://domain/share/[userId]
    const match = text.match(/\/share\/([a-f0-9-]{36})/i);
    if (!match) { 
      setErrMsg('QR no reconocido'); 
      setFetching(false);
      setPhase('scanning');
      return; 
    }

    const theirId = match[1];

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

  const handleOpenConfirmModal = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  const handleCompleteExchange = useCallback(() => {
    if (!match) return;
    
    // Decrementar los cromos que doy
    selectedToGive.forEach(stickerId => {
      decrementCard(stickerId);
    });
    
    // Incrementar los cromos que recibo
    selectedToReceive.forEach(stickerId => {
      incrementCard(stickerId);
    });
    
    // Resetear y volver al inicio
    setMatch(null);
    setSelectedToGive(new Set());
    setSelectedToReceive(new Set());
    setShowConfirmModal(false);
    setPhase('qr');
  }, [match, selectedToGive, selectedToReceive, incrementCard, decrementCard]);

  const toggleGiveSelection = useCallback((stickerId: string) => {
    setSelectedToGive(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stickerId)) {
        newSet.delete(stickerId);
      } else {
        newSet.add(stickerId);
      }
      return newSet;
    });
  }, []);

  const toggleReceiveSelection = useCallback((stickerId: string) => {
    setSelectedToReceive(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stickerId)) {
        newSet.delete(stickerId);
      } else {
        newSet.add(stickerId);
      }
      return newSet;
    });
  }, []);

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
      {/* ── Header Sticky con Contadores ── */}
      <header className="sticky top-0 z-30 bg-ios-gray6 dark:bg-black border-b border-ios-gray5 dark:border-[#3A3A3C]">
        <div className="px-4 pt-14 pb-3 flex items-center gap-3">
          {phase !== 'qr' && (
            <button
              onClick={() => { setPhase('qr'); setMatch(null); setErrMsg(''); }}
              className="tap-scale p-1 -ml-1"
            >
              <ArrowLeft size={22} className="text-ios-blue" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Intercambio</h1>
        </div>
        
        {/* Mini Dashboard de Contadores - Solo visible en fase matching */}
        {phase === 'matching' && match && !fetching && (
          <div className="px-4 pb-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Contador de seleccionados que doy */}
              <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-3 text-center shadow-sm">
                <p className="text-xs text-ios-gray uppercase font-semibold mb-1">Yo Doy</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedToGive.size}</p>
              </div>
              {/* Contador de seleccionados que recibo */}
              <div className="bg-white dark:bg-[#1C1C1E] rounded-xl p-3 text-center shadow-sm">
                <p className="text-xs text-ios-gray uppercase font-semibold mb-1">Yo Recibo</p>
                <p className="text-2xl font-bold text-[#34C759] dark:text-[#32D74B]">{selectedToReceive.size}</p>
              </div>
            </div>
          </div>
        )}
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
        <div className="flex flex-col h-full">
          {fetching ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <Loader2 size={32} className="text-ios-blue animate-spin" />
              <p className="text-sm text-ios-gray">Cargando álbum…</p>
            </div>
          ) : match ? (
            <>
              {/* Área de scroll con las dos columnas */}
              <div className="flex-1 overflow-y-auto pb-28">
                {match.iCanGive.length === 0 && match.theyGive.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <p className="text-4xl mb-3">🤝</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Sin coincidencias</p>
                    <p className="text-xs text-ios-gray mt-1">No hay cromos para intercambiar</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 px-2 py-4">
                    {/* Columna izquierda: Lo que doy */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-center text-ios-gray uppercase sticky top-0 bg-ios-gray6 dark:bg-black py-2 z-10">
                        Yo doy ({selectedToGive.size})
                      </h3>
                      <StickerList
                        stickers={match.iCanGive}
                        selected={selectedToGive}
                        onToggle={toggleGiveSelection}
                      />
                    </div>
                    
                    {/* Columna derecha: Lo que recibo */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-center text-ios-gray uppercase sticky top-0 bg-ios-gray6 dark:bg-black py-2 z-10">
                        Yo recibo ({selectedToReceive.size})
                      </h3>
                      <StickerList
                        stickers={match.theyGive}
                        selected={selectedToReceive}
                        onToggle={toggleReceiveSelection}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Botón flotante redondo */}
              {(match.iCanGive.length > 0 || match.theyGive.length > 0) && (
                <button
                  onClick={handleOpenConfirmModal}
                  disabled={selectedToGive.size === 0 && selectedToReceive.size === 0}
                  className="fixed bottom-24 right-4 z-40 w-16 h-16 bg-ios-blue text-white rounded-full shadow-lg
                             flex items-center justify-center tap-scale transition-all
                             disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Intercambiar"
                >
                  <svg 
                    className="w-7 h-7" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2.5} 
                      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" 
                    />
                  </svg>
                </button>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={(e) => {
            // Solo cerrar si se hace click en el fondo, no en el modal
            if (e.target === e.currentTarget) {
              setShowConfirmModal(false);
            }
          }}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-ios-gray5 dark:border-[#3A3A3C]">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">
                Confirmar intercambio
              </h2>
            </div>

            {/* Content */}
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {/* Lo que das */}
              {selectedToGive.size > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-ios-gray uppercase mb-2">
                    Vas a dar ({selectedToGive.size})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedToGive).map(stickerId => (
                      <span
                        key={stickerId}
                        className="bg-ios-gray6 dark:bg-[#2C2C2E] text-gray-900 dark:text-white 
                                   text-xs font-semibold px-3 py-1.5 rounded-lg"
                      >
                        {stickerId}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Lo que recibes */}
              {selectedToReceive.size > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-ios-gray uppercase mb-2">
                    Vas a recibir ({selectedToReceive.size})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedToReceive).map(stickerId => (
                      <span
                        key={stickerId}
                        className="bg-[#34C759] dark:bg-[#32D74B] text-white 
                                   text-xs font-semibold px-3 py-1.5 rounded-lg"
                      >
                        {stickerId}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedToGive.size === 0 && selectedToReceive.size === 0 && (
                <p className="text-center text-ios-gray text-sm py-4">
                  No has seleccionado ningún cromo
                </p>
              )}
            </div>

            {/* Footer con botones */}
            <div className="px-6 py-4 border-t border-ios-gray5 dark:border-[#3A3A3C] flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-ios-gray5 dark:bg-[#2C2C2E] text-gray-900 dark:text-white 
                           font-semibold text-sm py-3 rounded-2xl tap-scale"
              >
                Cancelar
              </button>
              <button
                onClick={handleCompleteExchange}
                className="flex-1 bg-ios-blue text-white font-semibold text-sm py-3 rounded-2xl tap-scale"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Match list sub-component ────────────────────────────────────────────────
interface StickerListProps {
  stickers: string[];
  selected: Set<string>;
  onToggle: (stickerId: string) => void;
}

function StickerList({ stickers, selected, onToggle }: StickerListProps) {
  if (stickers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-2xl mb-2">—</p>
        <p className="text-[10px] text-ios-gray">Sin cromos</p>
      </div>
    );
  }

  // Agrupar cromos por equipo manteniendo el orden del álbum
  const stickersByTeam: Map<string, string[]> = new Map();
  
  for (const stickerId of stickers) {
    const teamCode = stickerId.match(/^[A-Z]+/)?.[0] || 'FWC';
    if (!stickersByTeam.has(teamCode)) {
      stickersByTeam.set(teamCode, []);
    }
    stickersByTeam.get(teamCode)!.push(stickerId);
  }

  // Ordenar equipos según el orden del álbum
  const orderedTeams: Array<{ code: string; stickers: string[] }> = [];
  for (const team of TEAMS) {
    const teamStickers = stickersByTeam.get(team.code);
    if (teamStickers && teamStickers.length > 0) {
      orderedTeams.push({ code: team.code, stickers: teamStickers });
    }
  }

  return (
    <div className="space-y-3 px-1">
      {orderedTeams.map(({ code, stickers: teamStickers }) => {
        const team = TEAMS.find(t => t.code === code);
        if (!team) return null;

        return (
          <div key={code} className="space-y-2">
            {/* Header del equipo */}
            <div className="flex items-center gap-1.5 px-1">
              <span className="text-sm">{team.flag}</span>
              <span className="text-[10px] font-semibold text-gray-900 dark:text-white truncate">
                {team.name}
              </span>
            </div>
            
            {/* Grid de cromos del equipo - 3 por fila */}
            <div className="grid grid-cols-3 gap-1.5">
              {teamStickers.map(stickerId => {
                const isSelected = selected.has(stickerId);
                return (
                  <button
                    key={stickerId}
                    onClick={() => onToggle(stickerId)}
                    className={`flex items-center justify-center px-2 py-4 rounded-lg 
                               font-bold text-xs transition-all tap-scale
                               ${isSelected 
                                 ? 'bg-[#34C759] dark:bg-[#32D74B] text-white border-2 border-[#34C759] dark:border-[#32D74B] shadow-md' 
                                 : 'bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white border-2 border-ios-gray5 dark:border-[#3A3A3C]'
                               }`}
                  >
                    {stickerId}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

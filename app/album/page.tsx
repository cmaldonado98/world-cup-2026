'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Search, X, Camera } from 'lucide-react';
import { useAlbum         } from '@/contexts/AlbumContext';
import { CardGrid          } from '@/components/CardGrid';
import type { StatusFilter } from '@/components/CardGrid';
import { CountrySelector   } from '@/components/CountrySelector';
import { ContextMenu       } from '@/components/ContextMenu';
import { TEAMS             } from '@/lib/data/teams';
import { useTeamSearch     } from '@/lib/hooks/useTeamSearch';

// ScanModal uses FileReader + camera APIs — must be client-only
const ScanModal = dynamic(() => import('@/components/ScanModal'), { ssr: false });

const STATUS_CHIPS: { value: StatusFilter; label: string }[] = [
  { value: 'all',        label: 'Todos'      },
  { value: 'missing',    label: 'Faltantes'  },
  { value: 'duplicates', label: 'Repetidas'  },
];

export default function AlbumPage() {
  const { loading, cardMap, incrementCard, decrementCard, removeCard } = useAlbum();
  const [scanOpen, setScanOpen] = useState(false);

  const [filter,       setFilter]       = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [activeCode,   setActiveCode]   = useState(TEAMS[0].code);
  const [contextCard,  setContextCard]  = useState<string | null>(null);

  // Fuse.js team-name search — returns Set<code> or null for sticker-number mode
  const filteredTeamCodes = useTeamSearch(filter);

  // Measure sticky top-bar height so CountrySection headers stick below it
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setHeaderHeight(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleLongPress = useCallback((id: string) => setContextCard(id), []);
  const handleCloseMenu = useCallback(() => setContextCard(null), []);

  // Called by CountrySelector group chips → puts the term in the search box
  const handleGroupFilter = useCallback((term: string) => setFilter(term), []);

  return (
    <div className="min-h-screen bg-ios-gray6 dark:bg-black">
      {/* ── Sticky top bar ── */}
      <div
        ref={headerRef}
        className="sticky top-0 z-20 bg-ios-gray6/90 dark:bg-black/90 backdrop-blur-ios pt-14"
      >
        {/* Search — now accepts country names via Fuse.js */}
        <div className="px-4 pb-2">
          <label className="flex items-center gap-2 bg-white dark:bg-[#2C2C2E] rounded-xl px-3 h-10 shadow-ios-card">
            <Search size={16} className="text-ios-gray flex-shrink-0" />
            <input
              type="search"
              inputMode="text"
              placeholder="País, código, grupo…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="flex-1 bg-transparent text-[16px] text-gray-900 dark:text-white
                         placeholder:text-ios-gray4 outline-none"
            />
            {filter && (
              <button onClick={() => setFilter('')} className="tap-scale">
                <X size={14} className="text-ios-gray" />
              </button>
            )}
          </label>
        </div>

        {/* Status filter chips */}
        <div className="flex gap-2 px-4 pb-2">
          {STATUS_CHIPS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={[
                'flex-shrink-0 px-3 h-8 rounded-full text-xs font-semibold tap-scale',
                'transition-colors duration-150',
                statusFilter === value
                  ? 'bg-[#007AFF] text-white'
                  : 'bg-white dark:bg-[#2C2C2E] text-ios-gray dark:text-ios-gray2',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Country selector — hidden while any text filter is active */}
        {!filter && (
          <CountrySelector
            teams={TEAMS}
            active={activeCode}
            onSelect={setActiveCode}
            onGroupFilter={handleGroupFilter}
          />
        )}
      </div>

      {/* ── Sticker grid ── */}
      {loading ? (
        <div className="grid grid-cols-5 gap-2 px-3 py-4">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="h-11 rounded-xl bg-ios-gray5 dark:bg-[#2C2C2E] animate-pulse" />
          ))}
        </div>
      ) : (
        <CardGrid
          cardMap={cardMap}
          filter={filter}
          statusFilter={statusFilter}
          headerHeight={headerHeight}
          filteredTeamCodes={filteredTeamCodes}
          onIncrement={incrementCard}
          onLongPress={handleLongPress}
        />
      )}

      {/* ── Context menu (action sheet) ── */}
      {contextCard && (
        <ContextMenu
          cardId={contextCard}
          quantity={cardMap[contextCard] ?? 0}
          onClose={handleCloseMenu}
          onIncrement={incrementCard}
          onDecrement={decrementCard}
          onRemove={removeCard}
        />
      )}

      {/* ── Scan FAB ── */}
      <button
        onClick={() => setScanOpen(true)}
        aria-label="Escanear cromos con cámara"
        className="fixed bottom-28 right-4 z-30 w-14 h-14 flex items-center justify-center
                   rounded-full bg-[#007AFF] text-white shadow-lg tap-scale
                   active:scale-95 transition-transform"
      >
        <Camera size={24} />
      </button>

      {/* ── Scan modal ── */}
      {scanOpen && (
        <ScanModal mode="add" onClose={() => setScanOpen(false)} />
      )}
    </div>
  );
}


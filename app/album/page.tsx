'use client';

import { useCallback, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useAlbum         } from '@/contexts/AlbumContext';
import { CardGrid          } from '@/components/CardGrid';
import { CountrySelector   } from '@/components/CountrySelector';
import { ContextMenu       } from '@/components/ContextMenu';
import { TEAMS             } from '@/lib/data/teams';

export default function AlbumPage() {
  const { loading, cardMap, incrementCard, decrementCard, removeCard } = useAlbum();

  const [filter,      setFilter]      = useState('');
  const [activeCode,  setActiveCode]  = useState(TEAMS[0].code);
  const [contextCard, setContextCard] = useState<string | null>(null);

  const handleLongPress = useCallback((id: string) => setContextCard(id), []);
  const handleCloseMenu = useCallback(() => setContextCard(null), []);

  return (
    <div className="min-h-screen bg-ios-gray6 dark:bg-black">
      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-20 bg-ios-gray6/90 dark:bg-black/90 backdrop-blur-ios pt-14">
        {/* Search */}
        <div className="px-4 pb-2">
          <label className="flex items-center gap-2 bg-white dark:bg-[#2C2C2E] rounded-xl px-3 h-10 shadow-ios-card">
            <Search size={16} className="text-ios-gray flex-shrink-0" />
            <input
              type="search"
              inputMode="numeric"    // instant numeric keypad on mobile
              pattern="[0-9]*"
              placeholder="Buscar número…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white
                         placeholder:text-ios-gray4 outline-none"
            />
            {filter && (
              <button onClick={() => setFilter('')} className="tap-scale">
                <X size={14} className="text-ios-gray" />
              </button>
            )}
          </label>
        </div>

        {/* Country selector – hidden while search filter is active */}
        {!filter && (
          <CountrySelector
            teams={TEAMS}
            active={activeCode}
            onSelect={setActiveCode}
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
    </div>
  );
}

'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { CardItem          } from '@/components/CardItem';
import type { Team         } from '@/lib/data/teams';
import { getTeamStickers   } from '@/lib/data/teams';
import type { CardMap      } from '@/contexts/AlbumContext';

// ── Country section ────────────────────────────────────────────────────────────

interface CountrySectionProps {
  team:        Team;
  cardMap:     CardMap;
  onIncrement: (id: string) => void;
  onLongPress: (id: string) => void;
}

/**
 * Lazy-renders its sticker grid only when the section enters (or approaches)
 * the viewport. A height placeholder is shown while offscreen so the page
 * doesn't collapse and scrollbar position stays stable.
 */
const CountrySection = memo(function CountrySection({
  team, cardMap, onIncrement, onLongPress,
}: CountrySectionProps) {
  const wrapRef     = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { rootMargin: '300px 0px' } // pre-load 300px before entering view
    );
    if (wrapRef.current) observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, []);

  const stickers   = getTeamStickers(team);
  const cols       = 5;
  const rowH       = 52; // approximate px per row (cell h-11 = 44px + gap)
  const placeholderH = Math.ceil(stickers.length / cols) * rowH;

  // Count owned in this section for the header badge
  const ownedCount = stickers.filter(id => (cardMap[id] ?? 0) > 0).length;

  return (
    <div id={`section-${team.code}`} ref={wrapRef}>
      {/* Sticky section header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2
                      bg-ios-gray6/90 dark:bg-black/90 backdrop-blur-ios border-b
                      border-gray-200/40 dark:border-gray-800/40">
        <span className="text-lg leading-none">{team.flag}</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white flex-1">
          {team.name}
        </span>
        <span className="text-xs font-bold text-ios-gray tabular-nums">
          {ownedCount}/{stickers.length}
        </span>
      </div>

      {visible ? (
        <div className="grid grid-cols-5 gap-2 px-3 py-3">
          {stickers.map(id => (
            <CardItem
              key={id}
              cardId={id}
              quantity={cardMap[id] ?? 0}
              onIncrement={onIncrement}
              onLongPress={onLongPress}
            />
          ))}
        </div>
      ) : (
        // Placeholder keeps scroll position stable while offscreen
        <div style={{ height: placeholderH }} aria-hidden="true" />
      )}
    </div>
  );
});

// ── Main grid ──────────────────────────────────────────────────────────────────

import { TEAMS } from '@/lib/data/teams';

interface CardGridProps {
  cardMap:     CardMap;
  filter:      string;  // search text – numeric substring filter
  onIncrement: (id: string) => void;
  onLongPress: (id: string) => void;
}

export function CardGrid({ cardMap, filter, onIncrement, onLongPress }: CardGridProps) {
  // When a numeric filter is active, show only matching sticker IDs across all teams
  if (filter.trim()) {
    const needle = filter.trim();
    const matches: string[] = [];
    for (const team of TEAMS) {
      for (const id of getTeamStickers(team)) {
        if (id.split(' ')[1] === needle || id.toLowerCase().includes(needle.toLowerCase())) {
          matches.push(id);
        }
      }
    }

    return (
      <div className="grid grid-cols-5 gap-2 px-3 py-3">
        {matches.length === 0 ? (
          <p className="col-span-5 text-center text-ios-gray py-12 text-sm">
            No se encontró el cromo "{filter}"
          </p>
        ) : (
          matches.map(id => (
            <CardItem
              key={id}
              cardId={id}
              quantity={cardMap[id] ?? 0}
              onIncrement={onIncrement}
              onLongPress={onLongPress}
            />
          ))
        )}
      </div>
    );
  }

  return (
    <>
      {TEAMS.map(team => (
        <CountrySection
          key={team.code}
          team={team}
          cardMap={cardMap}
          onIncrement={onIncrement}
          onLongPress={onLongPress}
        />
      ))}
    </>
  );
}

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

import { TEAMS, GROUPS } from '@/lib/data/teams';

interface CardGridProps {
  cardMap:     CardMap;
  filter:      string;  // search text – numeric substring filter
  onIncrement: (id: string) => void;
  onLongPress: (id: string) => void;
}

// Group label colours (cycles through A–L; Especiales and CocaCola get fixed colours)
const GROUP_COLORS: Record<string, string> = {
  'Especiales': 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-400/30',
  'CocaCola':   'bg-red-500/15   text-red-700   dark:text-red-400   border-red-400/30',
  'A': 'bg-blue-500/15   text-blue-700   dark:text-blue-400   border-blue-400/30',
  'B': 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-400/30',
  'C': 'bg-green-500/15  text-green-700  dark:text-green-400  border-green-400/30',
  'D': 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-400/30',
  'E': 'bg-pink-500/15   text-pink-700   dark:text-pink-400   border-pink-400/30',
  'F': 'bg-cyan-500/15   text-cyan-700   dark:text-cyan-400   border-cyan-400/30',
  'G': 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-400/30',
  'H': 'bg-teal-500/15   text-teal-700   dark:text-teal-400   border-teal-400/30',
  'I': 'bg-rose-500/15   text-rose-700   dark:text-rose-400   border-rose-400/30',
  'J': 'bg-lime-500/15   text-lime-700   dark:text-lime-400   border-lime-400/30',
  'K': 'bg-sky-500/15    text-sky-700    dark:text-sky-400    border-sky-400/30',
  'L': 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-400/30',
};

function groupLabel(name: string) {
  if (name === 'Especiales') return '✦ Especiales';
  if (name === 'CocaCola')   return '🥤 Coca-Cola';
  return `Grupo ${name}`;
}

export function CardGrid({ cardMap, filter, onIncrement, onLongPress }: CardGridProps) {
  // When a numeric filter is active, show only matching sticker IDs across all teams
  if (filter.trim()) {
    const needle = filter.trim();
    const matches: string[] = [];
    for (const team of TEAMS) {
      for (const id of getTeamStickers(team)) {
        if (id.replace(/^[A-Z]+/, '') === needle || id.toLowerCase().includes(needle.toLowerCase())) {
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
              showTeamCode={true}
            />
          ))
        )}
      </div>
    );
  }

  // Render by groups with a header banner before each group
  return (
    <>
      {Array.from(GROUPS).map(([groupName, groupTeams]) => {
        const colorCls = GROUP_COLORS[groupName] ?? 'bg-gray-200/40 text-gray-600 border-gray-300/30';
        return (
          <div key={groupName}>
            {/* Group header banner */}
            <div
              id={`group-${groupName}`}
              className={`mx-3 mt-4 mb-1 px-4 py-1.5 rounded-xl border text-xs font-black
                          uppercase tracking-widest ${colorCls}`}
            >
              {groupLabel(groupName)}
            </div>

            {groupTeams.map(team => (
              <CountrySection
                key={team.code}
                team={team}
                cardMap={cardMap}
                onIncrement={onIncrement}
                onLongPress={onLongPress}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}

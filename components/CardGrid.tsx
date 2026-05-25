'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { CardItem          } from '@/components/CardItem';
import type { Team         } from '@/lib/data/teams';
import { getTeamStickers   } from '@/lib/data/teams';
import type { CardMap      } from '@/contexts/AlbumContext';

// ── Status filter type (exported so album/page can import it) ─────────────────
export type StatusFilter = 'all' | 'missing' | 'duplicates' | 'especiales';

// ── Country section ────────────────────────────────────────────────────────────

interface CountrySectionProps {
  team:         Team;
  cardMap:      CardMap;
  onIncrement:  (id: string) => void;
  onLongPress:  (id: string) => void;
  statusFilter: StatusFilter;
  headerHeight: number;
}

/**
 * Lazy-renders its sticker grid only when the section enters (or approaches)
 * the viewport. Respects the active status filter to show only relevant stickers.
 * The sticky header sits at `headerHeight` px from the top so it clears the
 * album page's own sticky bar.
 */
const CountrySection = memo(function CountrySection({
  team, cardMap, onIncrement, onLongPress, statusFilter, headerHeight,
}: CountrySectionProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const allStickers = getTeamStickers(team);

  // Filter stickers to only those matching the active status filter
  const visibleStickers = useMemo(() => {
    switch (statusFilter) {
      case 'missing':     return allStickers.filter(id => !(cardMap[id]));
      case 'duplicates':  return allStickers.filter(id => (cardMap[id] ?? 0) > 1);
      case 'especiales':  return team.code === 'FWC'
                            ? allStickers                            // 00 + FWC1–FWC19 completos
                            : allStickers.slice(0, 1);              // solo el cromo nº1 de cada país
      default:            return allStickers;
    }
  }, [allStickers, statusFilter, cardMap, team.code]);

  useEffect(() => {
    if (visibleStickers.length === 0) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { rootMargin: '300px 0px' }
    );
    if (wrapRef.current) observer.observe(wrapRef.current);
    return () => observer.disconnect();
  }, [visibleStickers.length]);

  // Hide the entire section when nothing matches the current filter
  if (visibleStickers.length === 0) return <div id={`section-${team.code}`} />;

  const cols         = 5;
  const rowH         = 52;
  const placeholderH = Math.ceil(visibleStickers.length / cols) * rowH;
  const ownedCount   = allStickers.filter(id => (cardMap[id] ?? 0) > 0).length;

  return (
    <div
      id={`section-${team.code}`}
      ref={wrapRef}
      style={{ scrollMarginTop: headerHeight }}
    >
      {/* Sticky section header — clears the album page sticky top bar */}
      <div
        className="sticky z-10 flex items-center gap-2 px-4 py-2
                   bg-ios-gray6/90 dark:bg-black/90 backdrop-blur-ios border-b
                   border-gray-200/40 dark:border-gray-800/40"
        style={{ top: headerHeight }}
      >
        <span className="text-lg leading-none">{team.flag}</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {team.name}
        </span>
        {/* Country code badge */}
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full
                         bg-[#3A3A3C]/10 dark:bg-[#636366]/25
                         text-ios-gray dark:text-ios-gray2 tracking-wider">
          {team.code}
        </span>
        <span className="ml-auto text-xs font-bold text-ios-gray tabular-nums">
          {ownedCount}/{allStickers.length}
        </span>
      </div>

      {visible ? (
        <div className="grid grid-cols-5 gap-2 px-3 py-3">
          {visibleStickers.map(id => (
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
        <div style={{ height: placeholderH }} aria-hidden="true" />
      )}
    </div>
  );
});

// ── Main grid ──────────────────────────────────────────────────────────────────

import { TEAMS, GROUPS } from '@/lib/data/teams';

interface CardGridProps {
  cardMap:            CardMap;
  filter:             string;               // raw search text
  statusFilter:       StatusFilter;         // owned-state chip filter
  headerHeight:       number;               // px height of the album page sticky bar
  /** Non-null = Fuse.js result; null = show all or sticker-number list */
  filteredTeamCodes?: Set<string> | null;
  onIncrement:        (id: string) => void;
  onLongPress:        (id: string) => void;
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

export function CardGrid({
  cardMap, filter, statusFilter, headerHeight, filteredTeamCodes,
  onIncrement, onLongPress,
}: CardGridProps) {

  // ── Branch 1: Fuse.js team-name search result ──────────────────────────────
  if (filteredTeamCodes != null) {
    if (filteredTeamCodes.size === 0) {
      return (
        <p className="text-center text-ios-gray py-16 text-sm px-8">
          No se encontró ningún país para &ldquo;{filter}&rdquo;
        </p>
      );
    }

    return (
      <>
        {Array.from(GROUPS).map(([groupName, groupTeams]) => {
          const matchingTeams = groupTeams.filter(t => filteredTeamCodes.has(t.code));
          if (matchingTeams.length === 0) return null;
          const colorCls = GROUP_COLORS[groupName] ?? 'bg-gray-200/40 text-gray-600 border-gray-300/30';
          return (
            <div key={groupName}>
              <div
                id={`group-${groupName}`}
                className={`mx-3 mt-4 mb-1 px-4 py-1.5 rounded-xl border text-xs font-black
                            uppercase tracking-widest ${colorCls}`}
              >
                {groupLabel(groupName)}
              </div>
              {matchingTeams.map(team => (
                <CountrySection
                  key={team.code}
                  team={team}
                  cardMap={cardMap}
                  onIncrement={onIncrement}
                  onLongPress={onLongPress}
                  statusFilter={statusFilter}
                  headerHeight={headerHeight}
                />
              ))}
            </div>
          );
        })}
      </>
    );
  }

  // ── Branch 2: Sticker-number flat search ──────────────────────────────────
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

    const filtered =
      statusFilter === 'missing'    ? matches.filter(id => !(cardMap[id])) :
      statusFilter === 'duplicates' ? matches.filter(id => (cardMap[id] ?? 0) > 1) :
      matches;

    return (
      <div className="grid grid-cols-5 gap-2 px-3 py-3">
        {filtered.length === 0 ? (
          <p className="col-span-5 text-center text-ios-gray py-12 text-sm">
            No se encontró el cromo &ldquo;{filter}&rdquo;
          </p>
        ) : (
          filtered.map(id => (
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

  // ── Branch 3: Full grouped view ──────────────────────────────────────────
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
                statusFilter={statusFilter}
                headerHeight={headerHeight}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}

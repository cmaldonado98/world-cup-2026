'use client';

// Horizontal pill-scroller for quick country navigation, grouped by match group
import { useRef, useMemo } from 'react';
import type { Team } from '@/lib/data/teams';
import { groupChipToSearchTerm } from '@/lib/hooks/useTeamSearch';

interface CountrySelectorProps {
  teams:          readonly Team[];
  active:         string;                        // currently highlighted team code
  onSelect:       (code: string) => void;
  /** Called when a group label chip is pressed — sets the search input text. */
  onGroupFilter?: (term: string) => void;
}

export function CountrySelector({ teams, active, onSelect, onGroupFilter }: CountrySelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Derive ordered groups from teams (Set preserves insertion order)
  const groups = useMemo(() => {
    const map = new Map<string, Team[]>();
    for (const t of teams) {
      if (!map.has(t.group)) map.set(t.group, []);
      map.get(t.group)!.push(t);
    }
    return map;
  }, [teams]);

  const handleSelect = (code: string) => {
    onSelect(code);
    const el = scrollRef.current?.querySelector<HTMLButtonElement>(`[data-code="${code}"]`);
    el?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
    document.getElementById(`section-${code}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleGroupClick = (firstCode: string) => {
    handleSelect(firstCode);
  };

  return (
    <div
      ref={scrollRef}
      className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar px-4 py-2"
    >
      {Array.from(groups).map(([groupName, groupTeams]) => (
        <div key={groupName} className="flex items-center gap-1.5 flex-shrink-0">
          {/* Group label — if onGroupFilter is provided, clicking filters by group;
               otherwise falls back to scrolling to the first team in the group */}
          <button
            onClick={() => {
              if (onGroupFilter) {
                onGroupFilter(groupChipToSearchTerm(groupName));
              } else {
                handleGroupClick(groupTeams[0].code);
              }
            }}
            className={[
              'flex-shrink-0 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide tap-scale',
              'transition-colors duration-150',
              groupTeams.some(t => t.code === active)
                ? 'bg-ios-blue/20 text-ios-blue'
                : 'bg-gray-200/70 dark:bg-[#3A3A3C] text-ios-gray dark:text-ios-gray2',
            ].join(' ')}
          >
            {groupName}
          </button>

          {/* Team pills */}
          {groupTeams.map(t => {
            const isActive = t.code === active;
            return (
              <button
                key={t.code}
                data-code={t.code}
                onClick={() => handleSelect(t.code)}
                className={[
                  'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tap-scale',
                  'transition-colors duration-150',
                  isActive
                    ? 'bg-ios-blue text-white'
                    : 'bg-white dark:bg-[#2C2C2E] text-gray-700 dark:text-ios-gray2 shadow-ios-card',
                ].join(' ')}
              >
                <span>{t.flag}</span>
                <span>{t.code}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

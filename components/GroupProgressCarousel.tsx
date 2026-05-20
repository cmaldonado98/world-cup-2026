'use client';

import { useMemo } from 'react';
import type { GroupProgressItem } from '@/contexts/AlbumContext';

interface GroupProgressCarouselProps {
  /** Full sorted list from stats.groupProgress (already sorted % desc) */
  groupProgress: GroupProgressItem[];
  /** How many top items to display (default 3) */
  topN?: number;
}

function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <div className="w-full h-1.5 bg-ios-gray5 dark:bg-[#3A3A3C] rounded-full overflow-hidden mt-2">
      <div
        className="h-full rounded-full bg-[#34C759] transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export function GroupProgressCarousel({
  groupProgress,
  topN = 3,
}: GroupProgressCarouselProps) {
  // Only national teams (groups A-L), exclude Especiales and CocaCola
  const topTeams = useMemo(
    () =>
      groupProgress
        .filter(t => t.group.length === 1) // single letter = A-L
        .slice(0, topN),
    [groupProgress, topN]
  );

  if (topTeams.length === 0) return null;

  return (
    <section className="px-4">
      <p className="text-xs font-semibold text-ios-gray uppercase tracking-widest mb-2">
        Más cerca de completar
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-none">
        {topTeams.map(team => (
          <div
            key={team.code}
            className="flex-shrink-0 snap-start w-32 rounded-2xl bg-white dark:bg-[#1C1C1E] shadow-ios-card p-3"
          >
            <span className="text-2xl leading-none">{team.flag}</span>
            <p className="text-xs font-semibold text-gray-900 dark:text-white mt-1 truncate">
              {team.name}
            </p>
            <p className="text-[10px] text-ios-gray dark:text-ios-gray2 font-mono">
              {team.owned}/{team.total}
            </p>
            <ProgressBar percentage={team.percentage} />
            <p className="text-xs font-bold text-[#34C759] mt-1 text-right">
              {team.percentage}%
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

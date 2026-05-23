'use client';

import { useMemo } from 'react';
import type { GroupProgressItem } from '@/contexts/AlbumContext';

interface GroupProgressCarouselProps {
  /** Full sorted list from stats.groupProgress (already sorted % desc) */
  groupProgress: GroupProgressItem[];
  /** How many items to show per section (default 5) */
  topN?: number;
}

function ProgressBar({ percentage, color }: { percentage: number; color: string }) {
  return (
    <div className="w-full h-1.5 bg-ios-gray5 dark:bg-[#3A3A3C] rounded-full overflow-hidden mt-2">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${percentage}%`, backgroundColor: color }}
      />
    </div>
  );
}

function TeamCard({ team, color }: { team: GroupProgressItem; color: string }) {
  return (
    <div className="flex-shrink-0 snap-start w-32 rounded-2xl bg-white dark:bg-[#1C1C1E] shadow-ios-card p-3">
      <span className="text-2xl leading-none">{team.flag}</span>
      <p className="text-xs font-semibold text-gray-900 dark:text-white mt-1 truncate">
        {team.name}
      </p>
      <p className="text-[10px] text-ios-gray dark:text-ios-gray2 font-mono">
        {team.owned}/{team.total}
      </p>
      <ProgressBar percentage={team.percentage} color={color} />
      <p className="text-xs font-bold mt-1 text-right" style={{ color }}>
        {team.percentage}%
      </p>
    </div>
  );
}

export function GroupProgressCarousel({
  groupProgress,
  topN = 5,
}: GroupProgressCarouselProps) {
  // Only national teams (groups A-L), exclude Especiales and CocaCola
  const nationalTeams = useMemo(
    () => groupProgress.filter(t => t.group.length === 1),
    [groupProgress]
  );

  // Closest to completing: already sorted % desc, exclude 100%
  const topTeams = useMemo(
    () => nationalTeams.filter(t => t.percentage < 100).slice(0, topN),
    [nationalTeams, topN]
  );

  // Least complete: reverse (sorted desc → asc), take topN
  const bottomTeams = useMemo(
    () => [...nationalTeams].reverse().slice(0, topN),
    [nationalTeams, topN]
  );

  if (nationalTeams.length === 0) return null;

  return (
    <section className="px-4 flex flex-col gap-4">
      {topTeams.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ios-gray uppercase tracking-widest mb-2">
            Más cerca de completar
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-none">
            {topTeams.map(team => (
              <TeamCard key={team.code} team={team} color="#34C759" />
            ))}
          </div>
        </div>
      )}
      {bottomTeams.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ios-gray uppercase tracking-widest mb-2">
            Los que menos tienes
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-none">
            {bottomTeams.map(team => (
              <TeamCard key={team.code} team={team} color="#FF3B30" />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

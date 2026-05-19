'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useAlbum      } from '@/contexts/AlbumContext';
import { TEAMS, getTeamStickers } from '@/lib/data/teams';

export default function RepetidosPage() {
  const { loading, cardMap } = useAlbum();
  const [expanded, setExpanded] = useState<string | null>(null);

  // Only show teams that have at least one sticker with quantity > 1
  const teamsWithDupes = TEAMS.filter(team =>
    getTeamStickers(team).some(id => (cardMap[id] ?? 0) > 1)
  );

  const totalDupes = Object.values(cardMap).reduce(
    (sum, q) => sum + (q > 1 ? q - 1 : 0), 0
  );

  return (
    <div className="min-h-screen bg-ios-gray6 dark:bg-black">
      {/* ── Header ── */}
      <header className="px-4 pt-14 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Repetidas</h1>
        <p className="text-sm text-ios-gray mt-0.5">
          {totalDupes > 0
            ? `${totalDupes} cromos repetidos para intercambiar`
            : 'Sin repetidas por ahora'}
        </p>
      </header>

      {loading ? (
        <div className="space-y-1 mx-4">
          {[0,1,2,3].map(i => (
            <div key={i} className="h-14 rounded-2xl bg-ios-gray5 dark:bg-[#2C2C2E] animate-pulse" />
          ))}
        </div>
      ) : teamsWithDupes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <p className="text-4xl mb-4">🔁</p>
          <p className="font-semibold text-gray-900 dark:text-white">Sin repetidas</p>
          <p className="text-sm text-ios-gray mt-1">
            Cuando tengas cromos duplicados aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="mx-4 bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-ios-card divide-y divide-gray-200/60 dark:divide-gray-700/40">
          {teamsWithDupes.map(team => {
            const dupeStickers = getTeamStickers(team)
              .filter(id => (cardMap[id] ?? 0) > 1);
            const isOpen = expanded === team.code;

            return (
              <div key={team.code}>
                {/* Row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : team.code)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 tap-scale"
                >
                  <span className="text-xl leading-none">{team.flag}</span>
                  <span className="flex-1 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    {team.name}
                  </span>
                  {/* Duplicate count badge */}
                  <span className="bg-[#FF9500] text-white text-xs font-bold
                                   rounded-full px-2 py-0.5 min-w-[24px] text-center">
                    {dupeStickers.length}
                  </span>
                  <ChevronRight
                    size={16}
                    className={`text-ios-gray transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                  />
                </button>

                {/* Expanded sticker badges */}
                {isOpen && (
                  <div className="flex flex-wrap gap-2 px-4 pb-4 pt-1">
                    {dupeStickers.map(id => {
                      const qty = cardMap[id] ?? 0;
                      return (
                        <span
                          key={id}
                          className="bg-[#FF9500]/15 text-[#FF9500] text-xs font-bold
                                     rounded-lg px-2.5 py-1.5"
                        >
                          {id} (×{qty - 1})
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

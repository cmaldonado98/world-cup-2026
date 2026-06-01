'use client';

import { useAlbum } from '@/contexts/AlbumContext';
import { ProgressRing } from '@/components/ProgressRing';
import { StatsWidget } from '@/components/StatsWidget';
import { HowToCollapsible } from '@/components/HowToCollapsible';
import { GroupProgressCarousel } from '@/components/GroupProgressCarousel';
import { SpecialsProgress } from '@/components/SpecialsProgress';
import { TradePowerCard, CuriosityCards } from '@/components/CuriosityCards';
import { DaysCollectingCard } from '@/components/DaysCollectingCard';

export default function DashboardPage() {
  const { loading, stats, todayAdded, daysCollecting } = useAlbum();

  return (
    <div className="min-h-screen bg-ios-gray6 dark:bg-black flex flex-col">
      {/* ── Header ── */}
      <header className="px-4 pt-14 pb-4">
        <p className="text-xs font-semibold text-ios-gray uppercase tracking-widest">
          FIFA World Cup
        </p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
          Mi Álbum 2026
        </h1>
      </header>

      {/* ── Progress Ring ── */}
      <section className="flex flex-col items-center py-8 gap-2">
        {loading ? (
          <div className="w-[200px] h-[200px] rounded-full bg-ios-gray5 dark:bg-[#2C2C2E] animate-pulse" />
        ) : (
          <ProgressRing percentage={stats.percentage} size={200} />
        )}
        <p className="text-sm text-ios-gray dark:text-ios-gray2 mt-2">
          {stats.owned} / {stats.total} cromos
        </p>
      </section>

      {/* ── Stats cards ── */}
      <section className="pb-4">
        {loading ? (
          <div className="flex gap-3 px-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex-1 h-20 rounded-2xl bg-ios-gray5 dark:bg-[#2C2C2E] animate-pulse" />
            ))}
          </div>
        ) : (
          <StatsWidget
            owned={stats.owned}
            missing={stats.missing}
            duplicates={stats.duplicates}
          />
        )}
      </section>

      {/* ── Days collecting ── */}
      {!loading && daysCollecting !== null && (
        <section className="pb-4">
          <DaysCollectingCard days={daysCollecting} />
        </section>
      )}

      {/* ── Detailed progress (normals vs specials) ── */}
      {!loading && (
        <section className="pb-4">
          <SpecialsProgress
            normalsOwned={stats.normalsOwned}
            normalsTotal={stats.normalsTotal}
            normalsPercentage={stats.normalsPercentage}
            specialsOwned={stats.specialsOwned}
            specialsTotal={stats.specialsTotal}
            specialsPercentage={stats.specialsPercentage}
          />
        </section>
      )}

      {/* ── Group progress carousel ── */}
      {!loading && (
        <section className="pb-4">
          <GroupProgressCarousel groupProgress={stats.groupProgress} />
        </section>
      )}

      {/* ── Trade power + curiosity cards ── */}
      {!loading && (
        <section className="px-4 pb-4 flex gap-3">
          <TradePowerCard
            tradePower={stats.tradePower}
            tradeableCount={stats.tradeableCount}
            missing={stats.missing}
          />
        </section>
      )}

      {!loading && (
        <section className="pb-4">
          <CuriosityCards
            todayAdded={todayAdded}
            mostDuplicated={stats.mostDuplicated}
          />
        </section>
      )}

      {/* ── Collapsible how-to ── */}
      <section className="pb-8">
        <HowToCollapsible />
      </section>
    </div>
  );
}


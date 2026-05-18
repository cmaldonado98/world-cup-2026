'use client';

import { useAlbum } from '@/contexts/AlbumContext';
import { ProgressRing } from '@/components/ProgressRing';
import { StatsWidget   } from '@/components/StatsWidget';

export default function DashboardPage() {
  const { loading, stats } = useAlbum();

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

      {/* ── Progress Ring (iOS Health widget feel) ── */}
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
      <section className="pb-6">
        {loading ? (
          <div className="flex gap-3 px-4">
            {[0,1,2].map(i => (
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

      {/* ── Quick info banner ── */}
      <section className="mx-4 rounded-2xl bg-white dark:bg-[#1C1C1E] shadow-ios-card p-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          ¿Cómo usar?
        </p>
        <ul className="text-xs text-ios-gray dark:text-ios-gray2 space-y-1 list-none">
          <li>• <strong>Tap</strong> en un cromo para marcarlo como obtenido</li>
          <li>• <strong>Tap nuevamente</strong> para añadir repetidas</li>
          <li>• <strong>Mantén presionado</strong> para opciones avanzadas</li>
          <li>• <strong>Intercambio</strong> para hacer trade con amigos via QR</li>
        </ul>
      </section>
    </div>
  );
}

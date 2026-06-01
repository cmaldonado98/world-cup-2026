'use client';

interface DaysCollectingCardProps {
  days: number | null;
}

export function DaysCollectingCard({ days }: DaysCollectingCardProps) {
  if (days === null) return null;

  return (
    <div className="mx-4 bg-gradient-to-br from-[#007AFF] to-[#5856D6] rounded-2xl p-6 shadow-ios-card">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-white/80">
            Coleccionando desde
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tabular-nums text-white leading-none">
              {days}
            </span>
            <span className="text-lg font-semibold text-white/90">
              {days === 1 ? 'día' : 'días'}
            </span>
          </div>
        </div>
        <div className="text-5xl">
          📅
        </div>
      </div>
    </div>
  );
}

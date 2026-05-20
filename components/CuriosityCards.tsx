'use client';

// ── Trade Power ──────────────────────────────────────────────────────────────

interface TradePowerCardProps {
  tradePower:    number; // 0-100 %
  tradeableCount: number;
  missing:       number;
}

export function TradePowerCard({ tradePower, tradeableCount, missing }: TradePowerCardProps) {
  const barColor =
    tradePower >= 75 ? 'bg-[#34C759]' :
    tradePower >= 40 ? 'bg-[#FF9500]' :
                       'bg-[#FF3B30]';

  return (
    <div className="flex-1 rounded-2xl bg-white dark:bg-[#1C1C1E] shadow-ios-card p-3 flex flex-col gap-2">
      <p className="text-[10px] font-semibold text-ios-gray uppercase tracking-wide">
        Poder de intercambio
      </p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none tabular-nums">
        {tradePower}%
      </p>
      <div className="h-1.5 bg-ios-gray5 dark:bg-[#3A3A3C] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${tradePower}%` }}
        />
      </div>
      <p className="text-[10px] text-ios-gray dark:text-ios-gray2 leading-tight">
        {tradeableCount} repetida{tradeableCount !== 1 ? 's' : ''} para{' '}
        {missing} faltante{missing !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

// ── Curiosity Cards ──────────────────────────────────────────────────────────

interface CuriosityCardsProps {
  todayAdded:     number;
  mostDuplicated: { cardId: string; count: number } | null;
}

export function CuriosityCards({ todayAdded, mostDuplicated }: CuriosityCardsProps) {
  return (
    <div className="flex gap-3 px-4">
      {/* Today added */}
      <div className="flex-1 rounded-2xl bg-white dark:bg-[#1C1C1E] shadow-ios-card p-3 flex flex-col gap-1">
        <p className="text-[10px] font-semibold text-ios-gray uppercase tracking-wide">
          Hoy añadiste
        </p>
        <p className="text-2xl font-bold text-[#007AFF] leading-none tabular-nums">
          {todayAdded}
        </p>
        <p className="text-[10px] text-ios-gray dark:text-ios-gray2">
          cromo{todayAdded !== 1 ? 's' : ''} nuevos
        </p>
      </div>

      {/* Most duplicated */}
      <div className="flex-1 rounded-2xl bg-white dark:bg-[#1C1C1E] shadow-ios-card p-3 flex flex-col gap-1">
        <p className="text-[10px] font-semibold text-ios-gray uppercase tracking-wide">
          Más repetido
        </p>
        {mostDuplicated ? (
          <>
            <p className="text-lg font-bold text-[#FF9500] leading-none font-mono tracking-tight">
              {mostDuplicated.cardId}
            </p>
            <p className="text-[10px] text-ios-gray dark:text-ios-gray2">
              ×{mostDuplicated.count} copias
            </p>
          </>
        ) : (
          <p className="text-[10px] text-ios-gray dark:text-ios-gray2 mt-1">
            Sin repetidas aún
          </p>
        )}
      </div>
    </div>
  );
}

'use client';

interface ProgressRowProps {
  label:      string;
  owned:      number;
  total:      number;
  percentage: number;
  barColor:   string; // Tailwind bg class
}

function ProgressRow({ label, owned, total, percentage, barColor }: ProgressRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-xs tabular-nums text-ios-gray dark:text-ios-gray2">
          {owned}
          <span className="text-[10px]">/{total}</span>
          <span className="ml-1 font-semibold text-gray-800 dark:text-white">{percentage}%</span>
        </span>
      </div>
      <div className="h-2 bg-ios-gray5 dark:bg-[#3A3A3C] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface SpecialsProgressProps {
  normalsOwned:       number;
  normalsTotal:       number;
  normalsPercentage:  number;
  specialsOwned:      number;
  specialsTotal:      number;
  specialsPercentage: number;
}

export function SpecialsProgress({
  normalsOwned,
  normalsTotal,
  normalsPercentage,
  specialsOwned,
  specialsTotal,
  specialsPercentage,
}: SpecialsProgressProps) {
  return (
    <section className="mx-4 rounded-2xl bg-white dark:bg-[#1C1C1E] shadow-ios-card p-4 flex flex-col gap-3">
      <p className="text-xs font-semibold text-ios-gray uppercase tracking-widest">
        Progreso detallado
      </p>
      <ProgressRow
        label="Jugadores"
        owned={normalsOwned}
        total={normalsTotal}
        percentage={normalsPercentage}
        barColor="bg-[#007AFF]"
      />
      <ProgressRow
        label="Especiales ✨"
        owned={specialsOwned}
        total={specialsTotal}
        percentage={specialsPercentage}
        barColor="bg-[#FF9500]"
      />
    </section>
  );
}

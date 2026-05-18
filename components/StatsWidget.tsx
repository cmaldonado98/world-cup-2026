'use client';

// Three iOS-widget cards: Tengo / Faltan / Repetidas
interface StatCardProps {
  label:    string;
  value:    number;
  color:    string; // Tailwind bg class
  textColor: string;
}

function StatCard({ label, value, color, textColor }: StatCardProps) {
  return (
    <div className={`${color} rounded-2xl p-4 flex-1 flex flex-col gap-1 shadow-ios-card`}>
      <span className={`text-xs font-semibold uppercase tracking-wide ${textColor} opacity-80`}>
        {label}
      </span>
      <span className={`text-3xl font-bold tabular-nums ${textColor} leading-none`}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}

interface StatsWidgetProps {
  owned:      number;
  missing:    number;
  duplicates: number;
}

export function StatsWidget({ owned, missing, duplicates }: StatsWidgetProps) {
  return (
    <div className="flex gap-3 w-full px-4">
      <StatCard label="Tengo"     value={owned}      color="bg-[#34C759]"         textColor="text-white" />
      <StatCard label="Faltan"    value={missing}    color="bg-ios-gray5 dark:bg-[#2C2C2E]" textColor="text-ios-gray dark:text-ios-gray2" />
      <StatCard label="Repetidas" value={duplicates} color="bg-[#FF9500]"         textColor="text-white" />
    </div>
  );
}

'use client';

// Animates an SVG circular progress ring (iOS-Health style)
interface ProgressRingProps {
  percentage: number; // 0–100
  size?:      number; // px, default 200
  stroke?:    number; // stroke width, default 12
}

export function ProgressRing({ percentage, size = 200, stroke = 12 }: ProgressRingProps) {
  const r     = (size - stroke) / 2;
  const circ  = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, percentage)) / 100) * circ;
  const center = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* SVG is rotated so arc starts at 12 o'clock */}
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-ios-gray5 dark:text-[#2C2C2E]"
        />
        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="#007AFF"
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-4xl font-bold tabular-nums text-gray-900 dark:text-white leading-none">
          {percentage}%
        </span>
        <span className="text-xs text-ios-gray mt-1 font-medium">completado</span>
      </div>
    </div>
  );
}

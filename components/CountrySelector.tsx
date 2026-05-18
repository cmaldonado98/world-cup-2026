'use client';

// Horizontal pill-scroller for quick country navigation
import { useRef } from 'react';
import type { Team } from '@/lib/data/teams';

interface CountrySelectorProps {
  teams:    readonly Team[];
  active:   string;          // currently highlighted code
  onSelect: (code: string) => void;
}

export function CountrySelector({ teams, active, onSelect }: CountrySelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSelect = (code: string) => {
    onSelect(code);
    // Scroll the selected pill into view
    const el = scrollRef.current?.querySelector<HTMLButtonElement>(`[data-code="${code}"]`);
    el?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
    // Jump to the corresponding album section
    document.getElementById(`section-${code}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto hide-scrollbar px-4 py-2"
    >
      {teams.map(t => {
        const isActive = t.code === active;
        return (
          <button
            key={t.code}
            data-code={t.code}
            onClick={() => handleSelect(t.code)}
            className={[
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tap-scale',
              'transition-colors duration-150',
              isActive
                ? 'bg-ios-blue text-white'
                : 'bg-white dark:bg-[#2C2C2E] text-gray-700 dark:text-ios-gray2 shadow-ios-card',
            ].join(' ')}
          >
            <span>{t.flag}</span>
            <span>{t.code}</span>
          </button>
        );
      })}
    </div>
  );
}

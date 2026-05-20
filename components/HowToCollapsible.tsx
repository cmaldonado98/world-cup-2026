'use client';

import { useState } from 'react';

const STEPS = [
  { action: 'Tap',              desc: 'en un cromo para marcarlo como obtenido' },
  { action: 'Tap nuevamente',   desc: 'para añadir repetidas' },
  { action: 'Mantén presionado', desc: 'para opciones avanzadas' },
  { action: 'Intercambio',      desc: 'para hacer trade con amigos via QR' },
];

export function HowToCollapsible() {
  const [open, setOpen] = useState(false);

  return (
    <section className="mx-4 rounded-2xl bg-white dark:bg-[#1C1C1E] shadow-ios-card overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          ¿Cómo usar?
        </span>
        {/* Chevron icon rotates when open */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-4 h-4 text-ios-gray transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Collapsible body — CSS max-height transition */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <ul className="px-4 pb-4 text-xs text-ios-gray dark:text-ios-gray2 space-y-1.5 list-none">
          {STEPS.map(s => (
            <li key={s.action}>
              • <strong className="text-gray-800 dark:text-gray-200">{s.action}</strong>{' '}
              {s.desc}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

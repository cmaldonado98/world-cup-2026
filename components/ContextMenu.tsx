'use client';

// iOS-style Action Sheet (bottom drawer) triggered on long press
import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ContextMenuProps {
  cardId:      string;           // e.g. "ARG 10"
  quantity:    number;
  onClose:     () => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove:    (id: string) => void;
}

export function ContextMenu({
  cardId, quantity, onClose, onIncrement, onDecrement, onRemove,
}: ContextMenuProps) {
  // Lock body scroll while sheet is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const rowClass = [
    'w-full py-4 px-4 flex items-center text-sm font-medium text-gray-900 dark:text-white',
    'border-b border-gray-200/60 dark:border-gray-700/40 last:border-none',
    'tap-scale',
  ].join(' ');

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Opciones para ${cardId}`}
        className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up"
        style={{ paddingBottom: 'calc(8px + var(--sab))' }}
      >
        <div className="mx-3 mb-2 rounded-2xl overflow-hidden bg-white/92 dark:bg-[#1C1C1E]/95 backdrop-blur-xl shadow-ios-sheet">
          {/* Card title */}
          <div className="py-3 px-4 text-center border-b border-gray-200/60 dark:border-gray-700/40">
            <p className="text-[11px] text-ios-gray font-medium uppercase tracking-wide">Cromo</p>
            <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{cardId}</p>
          </div>

          {/* Actions */}
          <button
            className={`${rowClass} text-ios-blue`}
            onClick={() => { onIncrement(cardId); onClose(); }}
          >
            <span className="flex-1 text-left">Sumar repetida</span>
            <span className="text-ios-gray text-xs">+1</span>
          </button>

          {quantity > 1 && (
            <button
              className={rowClass}
              onClick={() => { onDecrement(cardId); onClose(); }}
            >
              <span className="flex-1 text-left">Restar repetida</span>
              <span className="text-ios-gray text-xs">−1</span>
            </button>
          )}

          <button
            className={`${rowClass} text-[#FF3B30]`}
            onClick={() => { onRemove(cardId); onClose(); }}
          >
            <span className="flex-1 text-left">Eliminar cromo</span>
            <X size={16} className="opacity-70" />
          </button>
        </div>

        {/* Cancel – separate iOS pill */}
        <div className="mx-3 rounded-2xl overflow-hidden bg-white/92 dark:bg-[#1C1C1E]/95 backdrop-blur-xl shadow-ios-sheet">
          <button
            className="w-full py-4 text-sm font-semibold text-ios-blue tap-scale"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
}

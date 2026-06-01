'use client';

import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

interface EditSwapsModalProps {
  cardId:      string;           // e.g. "MEX 3"
  quantity:    number;           // current quantity
  onClose:     () => void;
  onSave:      (id: string, newQuantity: number) => void;
}

export function EditSwapsModal({
  cardId, quantity, onClose, onSave
}: EditSwapsModalProps) {
  const [count, setCount] = useState(quantity);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleDone(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [count]);

  const handleIncrement = () => {
    setCount(prev => prev + 1);
    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleDecrement = () => {
    setCount(prev => Math.max(0, prev - 1));
    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleDone = () => {
    // Save the new quantity
    if (count !== quantity) {
      onSave(cardId, count);
    }
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleDone();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in flex items-center justify-center"
        aria-hidden="true"
      >
        {/* Modal Card */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Editar repetidas de ${cardId}`}
          className="w-[90%] max-w-sm bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl animate-scale-in overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="pt-6 pb-2 px-6 border-b border-gray-200/30 dark:border-gray-700/30">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
              Editar cromos
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            <p className="text-base text-gray-600 dark:text-gray-400 text-center mb-8">
              ¿Cuántos cromos tienes de <span className="font-semibold text-gray-900 dark:text-white">"{cardId}"</span>?
            </p>

            {/* Counter Controls */}
            <div className="flex items-center justify-center gap-6 mb-2">
              {/* Decrement Button */}
              <button
                onClick={handleDecrement}
                disabled={count === 0}
                className={[
                  'w-14 h-14 rounded-full flex items-center justify-center',
                  'transition-all duration-200 tap-scale',
                  'focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2',
                  'dark:focus:ring-offset-black',
                  count === 0
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-[#007AFF] text-white active:scale-90 shadow-lg',
                ].join(' ')}
                aria-label="Restar cromo"
              >
                <Minus size={24} strokeWidth={3} />
              </button>

              {/* Count Display */}
              <div className="min-w-[80px] flex items-center justify-center">
                <span className="text-6xl font-bold text-gray-900 dark:text-white tabular-nums">
                  {count}
                </span>
              </div>

              {/* Increment Button */}
              <button
                onClick={handleIncrement}
                className={[
                  'w-14 h-14 rounded-full flex items-center justify-center',
                  'bg-[#007AFF] text-white transition-all duration-200 tap-scale',
                  'active:scale-90 shadow-lg',
                  'focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2',
                  'dark:focus:ring-offset-black',
                ].join(' ')}
                aria-label="Sumar cromo"
              >
                <Plus size={24} strokeWidth={3} />
              </button>
            </div>

            {/* Helper text */}
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-2">
              {count === 0 
                ? 'No tienes este cromo' 
                : count === 1 
                ? '1 cromo (sin repetidas)' 
                : `${count} cromos (${count - 1} repetida${count - 1 > 1 ? 's' : ''})`
              }
            </p>
          </div>

          {/* Done Button */}
          <div className="px-6 pb-6">
            <button
              onClick={handleDone}
              className={[
                'w-full py-4 rounded-2xl font-semibold text-white',
                'bg-[#007AFF] tap-scale active:scale-98',
                'transition-transform duration-150',
                'focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2',
                'dark:focus:ring-offset-black',
              ].join(' ')}
            >
              Listo
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

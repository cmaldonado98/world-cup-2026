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
  const [swaps, setSwaps] = useState(Math.max(0, quantity - 1));

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
  }, [swaps]);

  const handleIncrement = () => {
    setSwaps(prev => prev + 1);
    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleDecrement = () => {
    setSwaps(prev => Math.max(0, prev - 1));
    // Haptic feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleDone = () => {
    // Save the new quantity (swaps + 1 for the base card)
    const newQuantity = swaps + 1;
    if (newQuantity !== quantity) {
      onSave(cardId, newQuantity);
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
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
              Editar repetidas
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            <p className="text-base text-gray-600 dark:text-gray-400 text-center mb-8">
              ¿Cuántas repetidas tienes de <span className="font-semibold text-gray-900 dark:text-white">"{cardId}"</span>?
            </p>

            {/* Counter Controls */}
            <div className="flex items-center justify-center gap-6 mb-2">
              {/* Decrement Button */}
              <button
                onClick={handleDecrement}
                disabled={swaps === 0}
                className={[
                  'w-14 h-14 rounded-full flex items-center justify-center',
                  'transition-all duration-200 tap-scale',
                  'focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2',
                  'dark:focus:ring-offset-black',
                  swaps === 0
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-[#007AFF] text-white active:scale-90 shadow-lg',
                ].join(' ')}
                aria-label="Restar repetida"
              >
                <Minus size={24} strokeWidth={3} />
              </button>

              {/* Count Display */}
              <div className="min-w-[80px] flex items-center justify-center">
                <span className="text-6xl font-bold text-gray-900 dark:text-white tabular-nums">
                  {swaps}
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
                aria-label="Sumar repetida"
              >
                <Plus size={24} strokeWidth={3} />
              </button>
            </div>

            {/* Helper text */}
            <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-2">
              {swaps === 0 ? 'Sin repetidas' : `${swaps} repetida${swaps > 1 ? 's' : ''}`}
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

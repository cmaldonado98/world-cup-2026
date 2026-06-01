'use client';

import React, { memo, useEffect, useRef, useState } from 'react';
import { useLongPress } from '@/lib/hooks/useLongPress';

interface CardItemProps {
  cardId:       string;
  quantity:     number;
  onIncrement:  (id: string) => void;
  onLongPress:  (id: string) => void;
  showTeamCode?: boolean;
}

/**
 * Individual sticker cell.
 *
 * State legend:
 *  quantity == 0 → gray   (missing)
 *  quantity == 1 → green  (tengo, no badge)
 *  quantity  > 1 → green  (tengo) + orange badge with count
 */
const CardItem = memo(function CardItem({
  cardId, quantity, onIncrement, onLongPress, showTeamCode
}: CardItemProps) {
  const number   = cardId.replace(/^[A-Z]+/, '') || 'Logo';
  const teamCode = cardId.match(/^[A-Z]+/)?.[0] ?? '';

  // ── Pop animation when card goes from missing → owned ─────────────────────
  const prevQRef   = useRef(quantity);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (prevQRef.current === 0 && quantity >= 1) {
      setJustAdded(true);
      const t = setTimeout(() => setJustAdded(false), 400);
      return () => clearTimeout(t);
    }
    prevQRef.current = quantity;
  }, [quantity]);

  // ── Long-press / tap handlers ──────────────────────────────────────────────
  const handlers = useLongPress(
    () => onLongPress(cardId),
    {
      delay:   480,
      onPress: () => {
        // Haptic feedback (Android + some browsers)
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(50);
        }
        onIncrement(cardId);
      },
    }
  );

  const owned    = quantity >= 1;
  const hasExtra = quantity  > 1;

  return (
    <button
      {...handlers}
      aria-label={`Cromo ${cardId}${owned ? `, cantidad: ${quantity}` : ', falta'}`}
      className={[
        'relative flex flex-col items-center justify-center rounded-xl',
        'h-11 w-full text-sm font-semibold select-none',
        'tap-scale outline-none focus-visible:ring-2 focus-visible:ring-ios-blue',
        'transition-colors duration-200',
        justAdded ? 'animate-card-pop' : '',
        owned
          ? 'bg-[#34C759] text-white'
          : 'bg-ios-gray5 dark:bg-[#2C2C2E] text-ios-gray dark:text-ios-gray2',
      ].join(' ')}
      style={{
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        userSelect: 'none'
      }}
    >
      {showTeamCode && (
        <span className="text-[10px] leading-tight opacity-75 mt-0.5">{teamCode}</span>
      )}
      <span className={showTeamCode ? 'leading-tight mb-0.5' : ''}>{number}</span>

      {/* Orange badge for repeated stickers */}
      {hasExtra && (
        <span
          className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full
                     bg-[#FF9500] text-white text-[10px] font-bold
                     flex items-center justify-center px-1 animate-pop-in
                     ring-2 ring-white dark:ring-black"
        >
          {quantity - 1}
        </span>
      )}
    </button>
  );
});

export { CardItem };

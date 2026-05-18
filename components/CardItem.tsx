'use client';

import React, { memo } from 'react';
import { useLongPress } from '@/lib/hooks/useLongPress';

interface CardItemProps {
  cardId:      string;  // e.g. "ARG 10"
  quantity:    number;
  onIncrement: (id: string) => void;
  onLongPress: (id: string) => void;
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
  cardId, quantity, onIncrement, onLongPress,
}: CardItemProps) {
  const number = cardId.split(' ')[1]; // show only numeric part inside the cell

  const handlers = useLongPress(
    () => onLongPress(cardId),
    {
      delay:   480,
      onPress: () => onIncrement(cardId),
    }
  );

  const owned    = quantity >= 1;
  const hasExtra = quantity  > 1;

  return (
    <button
      {...handlers}
      aria-label={`Cromo ${cardId}${owned ? `, cantidad: ${quantity}` : ', falta'}`}
      className={[
        'relative flex items-center justify-center rounded-xl',
        'h-11 w-full text-sm font-semibold select-none',
        'tap-scale outline-none focus-visible:ring-2 focus-visible:ring-ios-blue',
        owned
          ? 'bg-[#34C759] text-white'
          : 'bg-ios-gray5 dark:bg-[#2C2C2E] text-ios-gray dark:text-ios-gray2',
      ].join(' ')}
    >
      {number}

      {/* Orange badge for repeated stickers */}
      {hasExtra && (
        <span
          className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full
                     bg-[#FF9500] text-white text-[10px] font-bold
                     flex items-center justify-center px-1 animate-pop-in
                     ring-2 ring-white dark:ring-black"
        >
          {quantity}
        </span>
      )}
    </button>
  );
});

export { CardItem };

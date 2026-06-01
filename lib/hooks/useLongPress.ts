'use client';

import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  delay?: number;        // ms before long press fires (default 500)
  onPress?: () => void;  // called on quick tap (no long press)
}

/**
 * Returns touch/mouse event handlers that distinguish between
 * a short tap (onPress) and a long press (onLongPress).
 * Works on both touch and pointer devices.
 */
export function useLongPress(
  onLongPress: () => void,
  { delay = 500, onPress }: UseLongPressOptions = {},
) {
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef    = useRef(false); // whether long press already triggered

  const start = useCallback(() => {
    firedRef.current = false;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Prevent text selection on long press
  const handleContextMenu = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
  }, []);

  // onClick fires after mouseup/touchend – only run if it wasn't a long press
  const click = useCallback(() => {
    if (!firedRef.current) onPress?.();
  }, [onPress]);

  return {
    onMouseDown:  start,
    onMouseUp:    cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd:   cancel,
    onTouchMove:  cancel, // scrolling cancels the timer
    onClick:      click,
    onContextMenu: handleContextMenu, // prevent context menu
  } as const;
}

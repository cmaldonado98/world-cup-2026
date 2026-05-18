'use client';

// Wraps html5-qrcode with a clean React lifecycle.
// Only import this component via next/dynamic with ssr: false.
import { useEffect, useRef } from 'react';
import type { Html5Qrcode as Html5QrcodeType } from 'html5-qrcode';

interface QRScannerProps {
  onScan:  (text: string) => void;
  onError?: (err: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeType | null>(null);
  const divId      = 'qr-reader-div';

  useEffect(() => {
    let stopped = false;

    async function start() {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (stopped) return;

      scannerRef.current = new Html5Qrcode(divId);
      try {
        await scannerRef.current.start(
          { facingMode: 'environment' },
          { fps: 12, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            onScan(decoded);
            scannerRef.current?.stop().catch(() => {});
          },
          undefined
        );
      } catch (e) {
        onError?.((e as Error).message ?? 'Camera error');
      }
    }

    start();

    return () => {
      stopped = true;
      scannerRef.current?.stop().catch(() => {});
    };
  }, [onScan, onError]);

  return (
    <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black">
      <div id={divId} className="w-full h-full" />
      {/* Scanning guide overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-56 h-56 border-2 border-white/60 rounded-2xl" />
      </div>
    </div>
  );
}

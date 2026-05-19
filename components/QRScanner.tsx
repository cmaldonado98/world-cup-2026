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

    const stopScanner = () => {
      try {
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
      } catch (err) {
        // En algunas versiones, stop() lanza un error síncrono si no está escaneando
        console.warn('Scanner stop error ignored', err);
      }
    };

    async function start() {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (stopped) return;

      scannerRef.current = new Html5Qrcode(divId);
      
      const config = { fps: 12, qrbox: { width: 240, height: 240 } };
      const onSuccess = (decoded: string) => {
        stopScanner();
        onScan(decoded);
      };

      try {
        // Intenta primero con la cámara trasera
        await scannerRef.current.start(
          { facingMode: 'environment' },
          config,
          onSuccess,
          undefined
        );
      } catch (e1) {
        // Si falla (ej: MacBooks solo tienen cámara frontal), intenta cualquier cámara disponible
        try {
          if (stopped) return;
          await scannerRef.current.start(
            { facingMode: 'user' },
            config,
            onSuccess,
            undefined
          );
        } catch (e2) {
          onError?.((e2 as Error).message ?? 'Camera error');
        }
      }
    }

    start();

    return () => {
      stopped = true;
      stopScanner();
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

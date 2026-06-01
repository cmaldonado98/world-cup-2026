'use client';

// Wraps html5-qrcode with a clean React lifecycle.
// Only import this component via next/dynamic with ssr: false.
import { useEffect, useRef } from 'react';
import type { Html5Qrcode as Html5QrcodeType } from 'html5-qrcode';
import { decodeQR, isFiguritasQR, decodeFiguritasQRToStickers } from '@/utils/qrDecoder';

interface QRScannerProps {
  onScan:  (text: string, metadata?: QRScanMetadata) => void;
  onError?: (err: string) => void;
}

export interface QRScanMetadata {
  source: 'native' | 'figuritas';
  figuritasData?: {
    faltantes: string[];
    repetidos: string[];
  };
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
      
      const config = { fps: 12 };
      const onSuccess = (decoded: string) => {
        stopScanner();
        
        // Detectar y procesar códigos QR de Figuritas
        if (isFiguritasQR(decoded)) {
          try {
            const { faltantes, repetidos } = decodeFiguritasQRToStickers(decoded);
            console.log('[QRScanner] QR de Figuritas detectado:', { faltantes, repetidos });
            
            // Pasar metadata con los datos decodificados
            onScan(decoded, {
              source: 'figuritas',
              figuritasData: { faltantes, repetidos },
            });
          } catch (error) {
            console.error('[QRScanner] Error decodificando QR de Figuritas:', error);
            onError?.(
              error instanceof Error 
                ? `Error al leer QR de Figuritas: ${error.message}` 
                : 'Error al procesar QR de Figuritas'
            );
          }
        } else {
          // QR nativo de la app
          onScan(decoded, { source: 'native' });
        }
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
    </div>
  );
}

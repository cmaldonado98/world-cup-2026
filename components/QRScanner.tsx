'use client';

// Wraps html5-qrcode with a clean React lifecycle.
// Only import this component via next/dynamic with ssr: false.
import { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const lastDecodedRef = useRef<string | null>(null);
  const stableCountRef = useRef(0);
  const confirmedRef = useRef(false);
  const divId      = 'qr-reader-div';
  const REQUIRED_STABLE_FRAMES = 2;

  const processQRResult = (decoded: string) => {
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      onError?.('Por favor selecciona una imagen válida');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Detener el escaneo de cámara si está activo
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      // Escanear el archivo
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = scannerRef.current || new Html5Qrcode(divId);
      
      const decoded = await html5QrCode.scanFile(file, false);
      processQRResult(decoded);
    } catch (error) {
      console.error('[QRScanner] Error escaneando archivo:', error);
      onError?.('No se pudo leer el código QR de la imagen');
    } finally {
      setIsProcessing(false);
      // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
        if (confirmedRef.current) return;

        if (lastDecodedRef.current === decoded) {
          const nextStable = stableCountRef.current + 1;
          stableCountRef.current = nextStable;
          if (nextStable < REQUIRED_STABLE_FRAMES) {
            return;
          }
        } else {
          lastDecodedRef.current = decoded;
          stableCountRef.current = 1;
          return;
        }

        confirmedRef.current = true;
        stopScanner();
        processQRResult(decoded);
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

  useEffect(() => {
    if (isProcessing) {
      lastDecodedRef.current = null;
      stableCountRef.current = 0;
      confirmedRef.current = false;
    }
  }, [isProcessing]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#E8F2FF] dark:bg-[#0A223D] px-4 py-3">
        <p className="text-xs font-semibold text-[#0A4A9E] dark:text-[#86B7FF]">Modo QR instantaneo</p>
        <p className="text-xs text-[#0A4A9E] dark:text-[#86B7FF] mt-1">
          Escanea un QR directo con camara. Es rapido y funciona sin internet.
        </p>
      </div>

      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black">
        <div id={divId} className="w-full h-full" />
      </div>
      
      {/* Botón para subir foto */}
      <div className="flex justify-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          id="qr-file-upload"
        />
        <label
          htmlFor="qr-file-upload"
          className={`flex items-center gap-2 bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white 
                     font-semibold text-sm px-6 py-3 rounded-2xl tap-scale shadow-ios-card cursor-pointer
                     ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Upload size={18} />
          {isProcessing ? 'Procesando...' : 'Modo foto (puede tardar por internet)'}
        </label>
      </div>

      <p className="text-xs text-ios-gray text-center px-3">
        Si estas en exterior y la señal es inestable, primero intenta el modo QR instantaneo.
      </p>
    </div>
  );
}

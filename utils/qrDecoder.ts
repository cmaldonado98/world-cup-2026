/**
 * QR Decoder Utility
 * 
 * Decodifica códigos QR de la app "Figuritas" y los convierte a nuestro formato.
 * 
 * Formato de "Figuritas": ⋋~{base64_gzip_faltantes};{base64_gzip_repetidos}
 * - Prefijo identificador: ⋋~
 * - Separador: ;
 * - Cada bloque: Base64 + GZIP
 * - Contenido descomprimido: Uint8Array con bitmask (LSB first)
 * - Fórmula: numero_cromo = (byteIndex * 8) + bitIndex
 */

import pako from 'pako';
import { getAllStickers } from '@/lib/data/teams';

// ── Constantes ────────────────────────────────────────────────────────────────
const FIGURITAS_PREFIX = '⋋~';
const SEPARATOR = ';';

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface FiguritasQRData {
  faltantes: number[];  // Índices de cromos faltantes
  repetidos: number[];  // Índices de cromos repetidos
}

export interface DecodedQRResult {
  source: 'native' | 'figuritas';
  data: string | FiguritasQRData;
}

// ── Mapeo de Índices ──────────────────────────────────────────────────────────
/**
 * Genera el mapeo completo de índices numéricos (Figuritas) a códigos alfanuméricos (nuestra app).
 * 
 * Orden según teams.ts:
 * - Índice 0: "00" (logo FWC)
 * - Índices 1-19: "FWC1" a "FWC19"
 * - Índices 20-39: "MEX1" a "MEX20"
 * - Índices 40-59: "RSA1" a "RSA20"
 * - ...y así sucesivamente hasta el final
 * 
 * @returns Mapa: índice numérico → código de cromo
 */
function buildIndexToCodeMap(): Map<number, string> {
  const allStickers = getAllStickers();
  const map = new Map<number, string>();
  
  allStickers.forEach((code, index) => {
    map.set(index, code);
  });
  
  return map;
}

// Caché del mapeo para evitar regenerarlo en cada escaneo
let indexToCodeCache: Map<number, string> | null = null;

/**
 * Obtiene el mapeo de índices a códigos, usando caché.
 */
function getIndexToCodeMap(): Map<number, string> {
  if (!indexToCodeCache) {
    indexToCodeCache = buildIndexToCodeMap();
  }
  return indexToCodeCache;
}

/**
 * Convierte un índice numérico de Figuritas a nuestro código de cromo.
 * @param index Índice numérico (0 a N)
 * @returns Código de cromo (ej. "00", "FWC1", "MEX1") o undefined si no existe
 */
export function indexToStickerCode(index: number): string | undefined {
  return getIndexToCodeMap().get(index);
}

// ── Funciones de Decodificación ───────────────────────────────────────────────
/**
 * Detecta si un string de QR pertenece a la app "Figuritas".
 * @param qrText Texto crudo del código QR
 * @returns true si es formato Figuritas
 */
export function isFiguritasQR(qrText: string): boolean {
  return qrText.startsWith(FIGURITAS_PREFIX);
}

/**
 * Decodifica un bloque Base64 + GZIP y extrae los índices activos del bitmask.
 * 
 * @param base64GzipData Cadena Base64 que contiene datos comprimidos con GZIP
 * @returns Array de índices donde el bit está en 1 (LSB first)
 * @throws Error si la decodificación o descompresión falla
 */
function decodeBitmask(base64GzipData: string): number[] {
  try {
    // 1. Decodificar Base64
    const binaryString = atob(base64GzipData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 2. Descomprimir GZIP
    const decompressed = pako.inflate(bytes);

    // 3. Extraer índices de bits activos (LSB first)
    const activeIndices: number[] = [];
    for (let byteIndex = 0; byteIndex < decompressed.length; byteIndex++) {
      const byte = decompressed[byteIndex];
      for (let bitIndex = 0; bitIndex < 8; bitIndex++) {
        if ((byte & (1 << bitIndex)) !== 0) {
          const globalIndex = byteIndex * 8 + bitIndex;
          activeIndices.push(globalIndex);
        }
      }
    }

    return activeIndices;
  } catch (error) {
    throw new Error(`Error decodificando bitmask: ${error instanceof Error ? error.message : 'desconocido'}`);
  }
}

/**
 * Decodifica un código QR de Figuritas completo.
 * 
 * @param qrText Texto crudo del QR (debe empezar con ⋋~)
 * @returns Objeto con arrays de índices de faltantes y repetidos
 * @throws Error si el formato es inválido o la decodificación falla
 */
export function decodeFiguritasQR(qrText: string): FiguritasQRData {
  // Validar prefijo
  if (!isFiguritasQR(qrText)) {
    throw new Error('No es un código QR de Figuritas (falta prefijo ⋋~)');
  }

  // Remover prefijo
  const dataWithoutPrefix = qrText.slice(FIGURITAS_PREFIX.length);

  // Dividir en bloques
  const parts = dataWithoutPrefix.split(SEPARATOR);
  if (parts.length !== 2) {
    throw new Error(`Formato inválido: se esperaban 2 bloques separados por "${SEPARATOR}", se encontraron ${parts.length}`);
  }

  const [faltantesBlock, repetidosBlock] = parts;

  // Validar que no estén vacíos
  if (!faltantesBlock.trim()) {
    throw new Error('Bloque de faltantes vacío');
  }
  if (!repetidosBlock.trim()) {
    throw new Error('Bloque de repetidos vacío');
  }

  try {
    // Decodificar ambos bloques
    const faltantes = decodeBitmask(faltantesBlock);
    const repetidos = decodeBitmask(repetidosBlock);

    return { faltantes, repetidos };
  } catch (error) {
    throw new Error(`Error procesando QR de Figuritas: ${error instanceof Error ? error.message : 'desconocido'}`);
  }
}

/**
 * Convierte índices numéricos de Figuritas a códigos de cromos de nuestra app.
 * Filtra los índices que no tienen mapeo válido.
 * 
 * @param indices Array de índices numéricos
 * @returns Array de códigos de cromos válidos
 */
export function indicesToStickerCodes(indices: number[]): string[] {
  const codes: string[] = [];
  const map = getIndexToCodeMap();

  for (const index of indices) {
    const code = map.get(index);
    if (code) {
      codes.push(code);
    } else {
      console.warn(`[qrDecoder] Índice ${index} no tiene mapeo a código de cromo`);
    }
  }

  return codes;
}

/**
 * Decodifica un código QR y determina su fuente (nativo o Figuritas).
 * 
 * @param qrText Texto crudo del código QR
 * @returns Objeto con la fuente y los datos decodificados
 */
export function decodeQR(qrText: string): DecodedQRResult {
  if (isFiguritasQR(qrText)) {
    const data = decodeFiguritasQR(qrText);
    return {
      source: 'figuritas',
      data,
    };
  }

  // Es un código QR nativo de nuestra app
  return {
    source: 'native',
    data: qrText,
  };
}

/**
 * Decodifica un código QR de Figuritas y retorna los códigos de cromos directamente.
 * Útil para integración rápida con el flujo de escaneo existente.
 * 
 * @param qrText Texto crudo del QR de Figuritas
 * @returns Objeto con arrays de códigos de faltantes y repetidos
 */
export interface FiguritasStickers {
  faltantes: string[];
  repetidos: string[];
}

export function decodeFiguritasQRToStickers(qrText: string): FiguritasStickers {
  const { faltantes, repetidos } = decodeFiguritasQR(qrText);

  return {
    faltantes: indicesToStickerCodes(faltantes),
    repetidos: indicesToStickerCodes(repetidos),
  };
}

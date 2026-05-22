'use client';

// Load via next/dynamic with ssr: false (uses FileReader + camera APIs).
import { useRef, useState, useCallback } from 'react';
import {
  Camera,
  X,
  Check,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  Maximize2,
} from 'lucide-react';
import { useAlbum } from '@/contexts/AlbumContext';
import { getAllStickers } from '@/lib/data/teams';

// ─── Valid sticker set (computed once at module load) ─────────────────────────
const VALID_STICKERS = new Set(getAllStickers());

// ─── Types ────────────────────────────────────────────────────────────────────
export type ScanMode = 'add' | 'remove';
type Phase = 'capture' | 'processing' | 'confirm' | 'done';

interface DetectedCode {
  code: string;
  px:   number; // center x in Vision pixel coords (0 = no bbox)
  py:   number; // center y in Vision pixel coords
}
interface ImageDims { w: number; h: number }

interface CodeEntry {
  id:       string;
  selected: boolean;
  px?:      number; // undefined → manually added (no overlay)
  py?:      number;
}

interface DoneResult {
  applied: number;
  skipped: number;
}

export interface ScanModalProps {
  mode: ScanMode;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Read a file and draw it through a <canvas>.
 * The browser auto-applies EXIF rotation during drawImage, so the resulting
 * pixels — and their dimensions — match exactly what the user sees on screen.
 * Vision API receives this corrected image, making its pixel coordinates line
 * up with the displayed image for the SVG overlay.
 */
function normalizeImage(file: File): Promise<{ dataUrl: string; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // naturalWidth/naturalHeight in modern browsers already reflect EXIF
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas unavailable')); return; }
        ctx.drawImage(img, 0, 0); // bakes EXIF rotation into pixels
        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', 0.88),
          w: canvas.width,
          h: canvas.height,
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ScanModal({ mode, onClose }: ScanModalProps) {
  const { cardMap, incrementCard, decrementCard } = useAlbum();
  const fileRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase]               = useState<Phase>('capture');
  const [codes, setCodes]               = useState<CodeEntry[]>([]);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageDims, setImageDims]       = useState<ImageDims | null>(null);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [newCodeInput, setNewCodeInput] = useState('');
  const [error, setError]               = useState('');
  const [doneResult, setDoneResult]     = useState<DoneResult | null>(null);

  // ── Process image → call API → filter valid codes ──────────────────────────
  const processImage = useCallback(
    async (file: File) => {
      setPhase('processing');
      setError('');

      try {
        // Draw through canvas so EXIF rotation is baked into the pixels.
        // Vision API gets the same orientation the user sees, so coordinates align.
        const { dataUrl, w, h } = await normalizeImage(file);
        // canvas.toDataURL always produces a data:image/ URL — validate explicitly
        if (!dataUrl.startsWith('data:image/')) {
          setError('Formato de imagen no compatible');
          setPhase('capture');
          return;
        }
        setImageDataUrl(dataUrl);
        setImageDims({ w, h });

        const imageBase64 = dataUrl.split(',')[1];

        const res = await fetch('/api/scan-cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64, imageWidth: w, imageHeight: h }),
        });

        const data: {
          success:        boolean;
          detectedCodes?: DetectedCode[];
          imageWidth?:    number;
          imageHeight?:   number;
          error?:         string;
        } = await res.json();

        console.log('[ScanModal] API response:', data);

        if (!data.success) {
          setError(data.error ?? 'Error al procesar la imagen');
          setPhase('capture');
          return;
        }

        // Use server-computed dims if available (more accurate)
        if (data.imageWidth && data.imageHeight) {
          setImageDims({ w: data.imageWidth, h: data.imageHeight });
        }

        const rawCodes: DetectedCode[] = data.detectedCodes ?? [];
        console.log('[ScanModal] detectedCodes from API:', rawCodes);

        // Filter against valid sticker set + mode constraints; deduplicate
        const seen = new Set<string>();
        const filtered: CodeEntry[] = [];
        for (const dc of rawCodes) {
          const id = dc.code.trim().toUpperCase();
          if (!VALID_STICKERS.has(id) || seen.has(id)) continue;
          if (mode === 'remove' && (cardMap[id] ?? 0) <= 1) continue;
          seen.add(id);
          filtered.push({
            id,
            selected: true,
            // px/py of 0 means no bbox — don't show in overlay
            px: dc.px > 0 ? dc.px : undefined,
            py: dc.py > 0 ? dc.py : undefined,
          });
        }
        console.log('[ScanModal] filtered codes:', filtered);

        if (filtered.length === 0) {
          setError(
            mode === 'remove'
              ? 'No se detectaron cromos con repetidas. Verifica la foto.'
              : 'No se detectaron códigos de cromos. Intenta con otra foto.'
          );
          setPhase('capture');
          return;
        }

        setCodes(filtered);
        setPhase('confirm');
      } catch {
        setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
        setPhase('capture');
      }
    },
    [cardMap, mode]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processImage(file);
      // Reset so the same file can be re-selected
      e.target.value = '';
    },
    [processImage]
  );

  // ── Manual code addition ───────────────────────────────────────────────────
  const addCode = useCallback(() => {
    const id = newCodeInput.trim().toUpperCase();
    if (!id) return;
    if (!VALID_STICKERS.has(id)) {
      setError(`"${id}" no es un código de cromo válido`);
      return;
    }
    if (codes.some((c) => c.id === id)) {
      setError(`"${id}" ya está en la lista`);
      return;
    }
    if (mode === 'remove' && (cardMap[id] ?? 0) <= 1) {
      setError(`"${id}" no tiene repetidas`);
      return;
    }
    setCodes((prev) => [...prev, { id, selected: true }]);
    setNewCodeInput('');
    setError('');
  }, [newCodeInput, codes, cardMap, mode]);

  // ── Apply changes ──────────────────────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    const selected = codes.filter((c) => c.selected);
    let applied = 0;
    let skipped = 0;

    for (const { id } of selected) {
      if (mode === 'add') {
        incrementCard(id);
        applied++;
      } else {
        // Re-check at apply time (state may have changed)
        if ((cardMap[id] ?? 0) > 1) {
          decrementCard(id);
          applied++;
        } else {
          skipped++;
        }
      }
    }

    setDoneResult({ applied, skipped });
    setPhase('done');
  }, [codes, cardMap, mode, incrementCard, decrementCard]);

  // ── Reset to capture phase ─────────────────────────────────────────────────
  const handleRetake = useCallback(() => {
    setCodes([]);
    setError('');
    setImageDataUrl(null);
    setImageDims(null);
    setImageExpanded(false);
    setPhase('capture');
  }, []);

  const selectedCount = codes.filter((c) => c.selected).length;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-white dark:bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl shadow-2xl">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-200/60 dark:border-gray-700/40">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {mode === 'add' ? 'Escanear para agregar' : 'Escanear para quitar'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-ios-gray5 dark:bg-[#3A3A3C] text-ios-gray tap-scale"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-5">

          {/* ── Phase: capture ── */}
          {phase === 'capture' && (
            <>
              {error && (
                <div className="mb-4 flex items-start gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl px-3 py-2.5">
                  <span className="text-sm leading-snug">{error}</span>
                </div>
              )}

              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-3 py-12 rounded-2xl border-2 border-dashed border-ios-gray3 dark:border-[#48484A] text-ios-gray hover:border-[#007AFF] hover:text-[#007AFF] transition-colors tap-scale"
              >
                <Camera size={40} />
                <span className="text-sm font-semibold">Fotografiar cromos</span>
                <span className="text-xs opacity-60 text-center px-6">
                  Apunta la cámara a los códigos escritos en los cromos
                </span>
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />

              <p className="mt-3 text-center text-xs text-ios-gray">
                {mode === 'add'
                  ? 'Se agregarán los cromos detectados a tu álbum'
                  : 'Se quitará 1 repetida por cada cromo detectado'}
              </p>
            </>
          )}

          {/* ── Phase: processing ── */}
          {phase === 'processing' && (
            <div className="flex flex-col items-center justify-center py-14 gap-4">
              <Loader2 size={40} className="text-[#007AFF] animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Detectando cromos…
                </p>
                <p className="text-xs text-ios-gray mt-1">
                  Analizando la imagen con Google Vision
                </p>
              </div>
            </div>
          )}

          {/* ── Phase: confirm ── */}
          {phase === 'confirm' && (
            <>
              {/* ── Captured photo with SVG code overlays ── */}
              {imageDataUrl && imageDims && imageDims.w > 0 && (
                <button
                  type="button"
                  onClick={() => setImageExpanded(true)}
                  aria-label="Expandir imagen"
                  className="relative w-full rounded-2xl overflow-hidden bg-black mb-3 cursor-zoom-in"
                  style={{
                    aspectRatio: `${imageDims.w} / ${imageDims.h}`,
                    maxHeight: '40vh',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageDataUrl}
                    alt="Foto escaneada"
                    className="w-full h-full object-fill"
                  />
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox={`0 0 ${imageDims.w} ${imageDims.h}`}
                    preserveAspectRatio="none"
                  >
                    {codes.map((entry) => {
                      if (!entry.px || !entry.py) return null;
                      const isNew = (cardMap[entry.id] ?? 0) === 0;
                      const fs  = Math.round(Math.min(imageDims.w, imageDims.h) / 18);
                      const pad = Math.round(fs * 0.45);
                      const rw  = entry.id.length * fs * 0.65 + pad * 2;
                      const rh  = fs + pad * 2;
                      const bg  = entry.selected ? (isNew ? '#22c55e' : '#f97316') : '#6b7280';
                      return (
                        <g key={entry.id} transform={`translate(${entry.px},${entry.py})`}>
                          <rect
                            x={-rw / 2} y={-rh / 2}
                            width={rw}  height={rh}
                            rx={rh / 3}
                            fill={bg}
                            opacity={entry.selected ? '0.88' : '0.55'}
                          />
                          <text
                            x="0" y="0"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={fs}
                            fontWeight="bold"
                            fontFamily="monospace"
                            fill="white"
                          >
                            {entry.id}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                  {/* Expand hint */}
                  <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5 pointer-events-none">
                    <Maximize2 size={12} className="text-white" />
                  </div>
                </button>
              )}

              <p className="text-xs text-ios-gray mb-3">
                Toca un cromo para activarlo o desactivarlo. Pulsa{' '}
                <span className="text-red-400">✕</span> para eliminar de la lista.
              </p>

              {/* Code list */}
              <div className="max-h-40 overflow-y-auto rounded-2xl bg-ios-gray6 dark:bg-[#2C2C2E] divide-y divide-gray-200/60 dark:divide-gray-700/40 mb-3">
                {codes.map((entry) => {
                  const qty = cardMap[entry.id] ?? 0;
                  return (
                    <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5">
                      {/* Toggle checkbox */}
                      <button
                        onClick={() =>
                          setCodes((prev) =>
                            prev.map((c) =>
                              c.id === entry.id ? { ...c, selected: !c.selected } : c
                            )
                          )
                        }
                        aria-label={entry.selected ? 'Deseleccionar' : 'Seleccionar'}
                        className={[
                          'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                          entry.selected
                            ? 'bg-[#007AFF]'
                            : 'bg-white dark:bg-[#48484A] border border-ios-gray3',
                        ].join(' ')}
                      >
                        {entry.selected && <Check size={13} className="text-white" />}
                      </button>

                      {/* Code */}
                      <span className="font-mono text-sm font-bold text-gray-900 dark:text-white flex-1">
                        {entry.id}
                      </span>

                      {/* Status badge */}
                      {mode === 'add' && (
                        <span
                          className={[
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            qty === 0
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                              : 'bg-[#FF9500]/15 text-[#FF9500]',
                          ].join(' ')}
                        >
                          {qty === 0 ? 'Nuevo' : `×${qty} repetida`}
                        </span>
                      )}
                      {mode === 'remove' && (
                        <span
                          className={[
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            qty > 1
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                              : 'bg-ios-gray5 dark:bg-[#3A3A3C] text-ios-gray',
                          ].join(' ')}
                        >
                          {qty > 1 ? `×${qty - 1} para dar` : 'Sin repetidas'}
                        </span>
                      )}

                      {/* Remove from list */}
                      <button
                        onClick={() =>
                          setCodes((prev) => prev.filter((c) => c.id !== entry.id))
                        }
                        aria-label={`Eliminar ${entry.id} de la lista`}
                        className="text-ios-gray tap-scale ml-1 p-0.5"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Manual code input */}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  inputMode="text"
                  placeholder="Agregar código manual (ej: MEX10)"
                  value={newCodeInput}
                  onChange={(e) => {
                    setNewCodeInput(e.target.value.toUpperCase());
                    setError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && addCode()}
                  className="flex-1 bg-ios-gray6 dark:bg-[#2C2C2E] rounded-xl px-3 py-2 text-sm font-mono text-gray-900 dark:text-white outline-none border border-transparent focus:border-[#007AFF] transition-colors"
                />
                <button
                  onClick={addCode}
                  aria-label="Agregar código"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#007AFF] text-white tap-scale flex-shrink-0"
                >
                  <Plus size={18} />
                </button>
              </div>

              {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

              {/* Summary line */}
              <p className="text-xs text-ios-gray mb-3">
                {selectedCount} seleccionado(s) de {codes.length} detectado(s)
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleRetake}
                  className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-ios-gray5 dark:bg-[#3A3A3C] text-gray-900 dark:text-white text-sm font-semibold tap-scale"
                >
                  <RefreshCw size={14} />
                  Repetir
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={selectedCount === 0}
                  className="flex-1 py-3 rounded-2xl bg-[#007AFF] text-white text-sm font-semibold tap-scale disabled:opacity-40 transition-opacity"
                >
                  {mode === 'add' ? 'Agregar' : 'Quitar'} {selectedCount} cromo
                  {selectedCount !== 1 ? 's' : ''}
                </button>
              </div>
            </>
          )}

          {/* ── Phase: done ── */}
          {phase === 'done' && doneResult && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check size={32} className="text-green-500" />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900 dark:text-white text-lg">
                  {mode === 'add' ? '¡Cromos agregados!' : '¡Cromos quitados!'}
                </p>
                <p className="text-sm text-ios-gray mt-1">
                  {doneResult.applied} cromo{doneResult.applied !== 1 ? 's' : ''}{' '}
                  {mode === 'add' ? 'agregado' : 'quitado'}
                  {doneResult.applied !== 1 ? 's' : ''}
                  {doneResult.skipped > 0 &&
                    `, ${doneResult.skipped} omitido${doneResult.skipped !== 1 ? 's' : ''} (sin repetidas)`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-[#007AFF] text-white text-sm font-semibold tap-scale"
              >
                Listo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Fullscreen image viewer ── */}
      {imageExpanded && imageDataUrl && imageDims && (
        <div
          className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
          onClick={() => setImageExpanded(false)}
        >
          <div
            style={{
              position: 'relative',
              aspectRatio: `${imageDims.w} / ${imageDims.h}`,
              width: '100vw',
              maxWidth: `calc(100dvh * ${imageDims.w} / ${imageDims.h})`,
              maxHeight: '100dvh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageDataUrl}
              alt="Foto escaneada"
              className="absolute inset-0 w-full h-full object-fill"
            />
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${imageDims.w} ${imageDims.h}`}
              preserveAspectRatio="none"
            >
              {codes.map((entry) => {
                if (!entry.px || !entry.py) return null;
                const isNew = (cardMap[entry.id] ?? 0) === 0;
                const fs  = Math.round(Math.min(imageDims.w, imageDims.h) / 18);
                const pad = Math.round(fs * 0.45);
                const rw  = entry.id.length * fs * 0.65 + pad * 2;
                const rh  = fs + pad * 2;
                const bg  = entry.selected ? (isNew ? '#22c55e' : '#f97316') : '#6b7280';
                return (
                  <g key={entry.id} transform={`translate(${entry.px},${entry.py})`}>
                    <rect
                      x={-rw / 2} y={-rh / 2}
                      width={rw}  height={rh}
                      rx={rh / 3}
                      fill={bg}
                      opacity={entry.selected ? '0.9' : '0.55'}
                    />
                    <text
                      x="0" y="0"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={fs}
                      fontWeight="bold"
                      fontFamily="monospace"
                      fill="white"
                    >
                      {entry.id}
                    </text>
                  </g>
                );
              })}
            </svg>
            <button
              onClick={() => setImageExpanded(false)}
              aria-label="Cerrar vista ampliada"
              className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

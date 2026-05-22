import { NextRequest, NextResponse } from 'next/server';

// ─── Vision types ──────────────────────────────────────────────────────────────
interface BVertex { x: number; y: number }
interface VAnnotation {
  description: string;
  boundingPoly?: { vertices: BVertex[] };
}

function mergeVertices(a: BVertex[], b: BVertex[]): BVertex[] {
  const all = [...a, ...b];
  const xs  = all.map(v => v.x ?? 0);
  const ys  = all.map(v => v.y ?? 0);
  return [
    { x: Math.min(...xs), y: Math.min(...ys) },
    { x: Math.max(...xs), y: Math.min(...ys) },
    { x: Math.max(...xs), y: Math.max(...ys) },
    { x: Math.min(...xs), y: Math.max(...ys) },
  ];
}

function centerOf(vertices: BVertex[]): { px: number; py: number } {
  if (!vertices.length) return { px: 0, py: 0 };
  const px = Math.round(vertices.reduce((s, v) => s + (v.x ?? 0), 0) / vertices.length);
  const py = Math.round(vertices.reduce((s, v) => s + (v.y ?? 0), 0) / vertices.length);
  return { px, py };
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'Vision API key not configured' },
      { status: 500 }
    );
  }

  let imageBase64: string;
  let clientImageW = 0;
  let clientImageH = 0;
  try {
    const body = await request.json();
    imageBase64   = body.imageBase64;
    clientImageW  = typeof body.imageWidth  === 'number' ? body.imageWidth  : 0;
    clientImageH  = typeof body.imageHeight === 'number' ? body.imageHeight : 0;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing imageBase64 field' },
        { status: 400 }
      );
    }
    // Basic sanity check: base64 only (no data: prefix expected here)
    if (imageBase64.startsWith('data:')) {
      return NextResponse.json(
        { success: false, error: 'Send raw base64 without data: prefix' },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  let visionRes: Response;
  try {
    visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [{ type: 'TEXT_DETECTION', maxResults: 100 }],
            },
          ],
        }),
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Could not reach Vision API' },
      { status: 502 }
    );
  }

  if (!visionRes.ok) {
    const errorText = await visionRes.text().catch(() => '');
    console.error('[scan-cards] Vision API HTTP error', visionRes.status, errorText);
    return NextResponse.json(
      { success: false, error: 'Vision API request failed' },
      { status: 502 }
    );
  }

  const visionData = await visionRes.json();
  const vResponse   = visionData.responses?.[0] ?? {};
  const annotations: VAnnotation[] = vResponse.textAnnotations ?? [];

  // ── Image dimensions ──────────────────────────────────────────────────────
  // Prefer client-supplied values; fall back to extent of first annotation bbox
  let imageWidth  = clientImageW;
  let imageHeight = clientImageH;
  if ((!imageWidth || !imageHeight) && annotations[0]?.boundingPoly?.vertices) {
    const verts = annotations[0].boundingPoly.vertices;
    imageWidth  = Math.max(...verts.map(v => v.x ?? 0));
    imageHeight = Math.max(...verts.map(v => v.y ?? 0));
  }

  // ── Debug logs ────────────────────────────────────────────────────────────
  const fullText = (annotations[0]?.description ?? '').toUpperCase();
  console.log('[scan-cards] annotations:', annotations.length, '| imageSize:', imageWidth, 'x', imageHeight);
  console.log('[scan-cards] full text block:', JSON.stringify(fullText));
  console.log('[scan-cards] tokens:', JSON.stringify(annotations.slice(1).map(a => a.description)));

  // ── Token-level extraction with bounding boxes ───────────────────────────
  // A sticker code is either:
  //   A) a single token already matching the pattern  ("MEX10", "FWC")
  //   B) a letters-only token + adjacent digits-only token ("RSA" + "6" → "RSA6")
  const detectedCodes: Array<{ code: string; px: number; py: number }> = [];
  const seenCodes = new Set<string>();

  for (let i = 1; i < annotations.length; i++) {
    const curr     = annotations[i];
    const currText = curr.description.trim().toUpperCase();
    const verts    = curr.boundingPoly?.vertices ?? [];

    // Case A: single complete code
    if (/^[A-Z]{2,4}\d{1,2}$/.test(currText) || currText === 'FWC') {
      if (!seenCodes.has(currText)) {
        detectedCodes.push({ code: currText, ...centerOf(verts) });
        seenCodes.add(currText);
      }
      continue;
    }

    // Case B: letters token + digits token → combined code
    if (/^[A-Z]{2,4}$/.test(currText) && i + 1 < annotations.length) {
      const next     = annotations[i + 1];
      const nextText = next.description.trim().toUpperCase();
      if (/^\d{1,2}$/.test(nextText)) {
        const combined = currText + nextText;
        if (!seenCodes.has(combined)) {
          const merged = mergeVertices(verts, next.boundingPoly?.vertices ?? []);
          detectedCodes.push({ code: combined, ...centerOf(merged) });
          seenCodes.add(combined);
        }
        i++; // consume the digits token
        continue;
      }
    }
  }

  // ── Regex fallback on full-text block (no positional data, px/py = 0) ────
  const STICKER_RE = /\b([A-Z]{2,4}) ?(\d{1,2})\b|\b(FWC)\b/g;
  for (const m of fullText.matchAll(STICKER_RE)) {
    const code = m[3] ?? `${m[1]}${m[2]}`;
    if (!seenCodes.has(code)) {
      detectedCodes.push({ code, px: 0, py: 0 });
      seenCodes.add(code);
    }
  }

  console.log('[scan-cards] detectedCodes:', JSON.stringify(detectedCodes));

  return NextResponse.json({ success: true, detectedCodes, imageWidth, imageHeight });
}

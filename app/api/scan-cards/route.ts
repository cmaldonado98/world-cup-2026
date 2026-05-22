import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'Vision API key not configured' },
      { status: 500 }
    );
  }

  let imageBase64: string;
  try {
    const body = await request.json();
    imageBase64 = body.imageBase64;
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
  const annotations: Array<{ description: string }> =
    visionData.responses?.[0]?.textAnnotations ?? [];

  // ── Debug: log raw Vision response ──────────────────────────────────────────
  console.log('[scan-cards] total annotations:', annotations.length);
  const fullText = (annotations[0]?.description ?? '').toUpperCase();
  console.log('[scan-cards] full text block (index 0):', JSON.stringify(fullText));
  console.log(
    '[scan-cards] individual tokens (index 1+):',
    JSON.stringify(annotations.slice(1).map((a) => a.description))
  );

  // Sticker codes are printed with an optional space: "RSA 6", "NOR 2", "MEX10"
  // Regex captures letters and digits separately so we can strip the space.
  // Also handles standalone "FWC" (logo sticker, no number).
  const STICKER_RE = /\b([A-Z]{2,4}) ?(\d{1,2})\b|\b(FWC)\b/g;
  const fromFullText: string[] = [];
  for (const m of fullText.matchAll(STICKER_RE)) {
    if (m[3]) {
      fromFullText.push('FWC'); // standalone FWC logo sticker
    } else {
      fromFullText.push(`${m[1]}${m[2]}`); // join letters + digits (no space)
    }
  }
  console.log('[scan-cards] regex candidates from full text:', JSON.stringify(fromFullText));

  // Keep individual tokens too as a fallback
  const individualTokens = annotations.slice(1).map((a) => a.description);

  const detectedTexts: string[] = [...fromFullText, ...individualTokens];
  console.log('[scan-cards] final detectedTexts sent to client:', JSON.stringify(detectedTexts));

  return NextResponse.json({ success: true, detectedTexts });
}

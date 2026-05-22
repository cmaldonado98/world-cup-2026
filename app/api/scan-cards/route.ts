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

  // Index 0 is the full concatenated text block — skip it, use individual tokens
  const detectedTexts: string[] = annotations.slice(1).map((a) => a.description);

  return NextResponse.json({ success: true, detectedTexts });
}

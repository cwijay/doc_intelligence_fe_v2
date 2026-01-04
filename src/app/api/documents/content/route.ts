import { NextRequest, NextResponse } from 'next/server';
import { serverConfig, clientConfig } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// AI API base URL (port 8001)
const AI_API_BASE = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8001';

/**
 * GET /api/documents/content
 * Proxies document content from backend or directly from GCS
 *
 * Query params:
 * - path: The document path (e.g., "Acme corp/original/invoices/IMG_4696.JPEG")
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const documentPath = searchParams.get('path');

    if (!documentPath) {
      return NextResponse.json(
        { error: 'Missing required parameter: path' },
        { status: 400 }
      );
    }

    // Forward authorization header
    const authHeader = request.headers.get('authorization');

    console.log('📄 Document content request:', { documentPath });

    // Try multiple approaches to get the document content

    // Approach 1: Try AI API content endpoint (if it exists)
    try {
      const aiContentUrl = `${AI_API_BASE}/api/v1/content/original?path=${encodeURIComponent(documentPath)}`;
      console.log('📥 Trying AI API:', aiContentUrl);

      const aiResponse = await fetch(aiContentUrl, {
        method: 'GET',
        headers: authHeader ? { 'Authorization': authHeader } : {},
      });

      if (aiResponse.ok) {
        console.log('✅ Got content from AI API');
        const contentType = aiResponse.headers.get('content-type') || 'application/octet-stream';
        const responseHeaders = new Headers();
        responseHeaders.set('Content-Type', contentType);
        return new NextResponse(aiResponse.body, { status: 200, headers: responseHeaders });
      }
    } catch (e) {
      console.log('⚠️ AI API content endpoint not available');
    }

    // Approach 2: Try Main API content endpoint
    try {
      const mainApiUrl = `${serverConfig.apiBaseUrl}/api/v1/documents/content?path=${encodeURIComponent(documentPath)}`;
      console.log('📥 Trying Main API:', mainApiUrl);

      const mainResponse = await fetch(mainApiUrl, {
        method: 'GET',
        headers: authHeader ? { 'Authorization': authHeader } : {},
      });

      if (mainResponse.ok) {
        console.log('✅ Got content from Main API');
        const contentType = mainResponse.headers.get('content-type') || 'application/octet-stream';
        const responseHeaders = new Headers();
        responseHeaders.set('Content-Type', contentType);
        return new NextResponse(mainResponse.body, { status: 200, headers: responseHeaders });
      }
    } catch (e) {
      console.log('⚠️ Main API content endpoint not available');
    }

    // Approach 3: Try direct GCS URL (for public buckets)
    const gcsBucket = clientConfig.gcsBucketName || process.env.NEXT_PUBLIC_GCS_BUCKET_NAME;
    const gcsBaseUrl = clientConfig.gcsBucketUrl || 'https://storage.googleapis.com';

    if (gcsBucket) {
      const directGcsUrl = `${gcsBaseUrl}/${gcsBucket}/${documentPath}`;
      console.log('📥 Trying direct GCS URL:', directGcsUrl);

      try {
        const gcsResponse = await fetch(directGcsUrl);

        if (gcsResponse.ok) {
          console.log('✅ Got content from direct GCS URL');
          const contentType = gcsResponse.headers.get('content-type') || 'application/octet-stream';
          const responseHeaders = new Headers();
          responseHeaders.set('Content-Type', contentType);
          return new NextResponse(gcsResponse.body, { status: 200, headers: responseHeaders });
        } else {
          console.log('❌ Direct GCS failed:', gcsResponse.status, gcsResponse.statusText);
        }
      } catch (e) {
        console.log('⚠️ Direct GCS URL failed:', e instanceof Error ? e.message : 'Unknown error');
      }
    }

    // All approaches failed
    console.error('🚫 All content retrieval methods failed');
    return NextResponse.json(
      {
        error: 'Document content not accessible',
        hint: 'The GCS bucket may be private. Configure the bucket for public access or add a backend endpoint to serve document content.',
        tried: [
          'AI API /api/v1/content/original',
          'Main API /api/v1/documents/content',
          gcsBucket ? `Direct GCS: ${gcsBaseUrl}/${gcsBucket}/...` : 'No GCS bucket configured'
        ]
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('🚫 Document content proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy document content', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

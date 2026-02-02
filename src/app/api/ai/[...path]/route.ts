import { NextRequest, NextResponse } from 'next/server';
import { serverConfig } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

const normalizeSegments = (segments: string[] | undefined): string[] => {
  if (!segments || segments.length === 0) {
    return [];
  }
  return segments.filter(Boolean);
};

const buildTargetUrl = (request: NextRequest, segments: string[], hasTrailingSlash: boolean): URL => {
  let path = segments.join('/');
  if (hasTrailingSlash && path && !path.endsWith('/')) {
    path = `${path}/`;
  }
  const base = serverConfig.aiApiBaseUrl;
  const baseUrl = new URL(base.endsWith('/') ? base : `${base}/`);
  const targetUrl = new URL(path, baseUrl);

  const search = request.nextUrl.search;
  if (search) {
    targetUrl.search = search;
  }

  return targetUrl;
};

const forwardRequest = async (request: NextRequest, context: RouteContext) => {
  try {
    const params = await context.params;
    const segments = normalizeSegments(params.path);
    const hasTrailingSlash = request.nextUrl.pathname.endsWith('/');
    let targetUrl = buildTargetUrl(request, segments, hasTrailingSlash);

    const headers = new Headers(request.headers);
    headers.set('host', targetUrl.host);
    headers.set('origin', targetUrl.origin);
    headers.delete('content-length');
    headers.delete('connection');
    headers.delete('accept-encoding');

    let body: Buffer | undefined;
    if (!['GET', 'HEAD'].includes(request.method)) {
      const arrayBuffer = await request.arrayBuffer();
      if (arrayBuffer.byteLength > 0) {
        body = Buffer.from(arrayBuffer);
      }
    }

    // Make the request with manual redirect handling
    let response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
    });

    // Handle 307/308 redirects manually to preserve method and body
    if (response.status === 307 || response.status === 308) {
      const location = response.headers.get('location');
      if (location) {
        targetUrl = new URL(location, targetUrl);
        headers.set('host', targetUrl.host);
        headers.set('origin', targetUrl.origin);

        response = await fetch(targetUrl, {
          method: request.method,
          headers,
          body,
          redirect: 'manual',
        });
      }
    }

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');
    responseHeaders.delete('connection');

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AI API proxy error';
    console.error('AI API proxy error:', message);

    return NextResponse.json(
      {
        error: 'AI API proxy request failed',
        message,
      },
      { status: 502 }
    );
  }
};

export const GET = forwardRequest;
export const POST = forwardRequest;
export const PUT = forwardRequest;
export const PATCH = forwardRequest;
export const DELETE = forwardRequest;
export const OPTIONS = forwardRequest;
export const HEAD = forwardRequest;

import { NextRequest, NextResponse } from 'next/server';
import { serverConfig } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

const normalizeSegments = (segments: string[] | undefined): string[] =>
  segments?.filter(Boolean) ?? [];

const buildTargetUrl = (request: NextRequest, segments: string[]): URL => {
  const baseUrl = new URL(serverConfig.ingestApiUrl);
  const origin = `${baseUrl.protocol}//${baseUrl.host}`;
  const basePathSegments = baseUrl.pathname.split('/').filter(Boolean);
  const combinedSegments = [...basePathSegments, ...segments];
  const targetPath = combinedSegments.join('/');
  const targetUrl = new URL(targetPath ? `/${targetPath}` : '/', origin);

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
    const targetUrl = buildTargetUrl(request, segments);

    const headers = new Headers(request.headers);
    headers.set('host', targetUrl.host);
    headers.set('origin', targetUrl.origin);
    headers.delete('content-length');
    headers.delete('connection');
    headers.delete('accept-encoding');

    let body: BodyInit | undefined;
    if (!['GET', 'HEAD'].includes(request.method)) {
      const arrayBuffer = await request.arrayBuffer();
      if (arrayBuffer.byteLength > 0) {
        body = Buffer.from(arrayBuffer);
      }
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');
    responseHeaders.delete('connection');

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown ingest proxy error';
    console.error('Ingest proxy error:', message);

    return NextResponse.json(
      {
        error: 'Ingest proxy request failed',
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

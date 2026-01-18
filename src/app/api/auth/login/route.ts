import { NextRequest, NextResponse } from 'next/server';
import { serverConfig, getApiUrl } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Login attempt with:', {
      email: body.email,
      hasPassword: !!body.password,
      extraFields: Object.keys(body).filter(key => !['email', 'password'].includes(key)),
      apiUrl: getApiUrl('auth/login', true)
    });

    const response = await fetch(getApiUrl('auth/login', true), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse login response as JSON:', parseError);
      data = { error: `Invalid response from backend (${response.status})` };
    }

    console.log('Backend login response:', {
      status: response.status,
      statusText: response.statusText,
      data,
    });

    if (!response.ok) {
      // Ensure we have a meaningful error message
      const errorResponse = {
        error: data?.error || data?.message || data?.detail || `Login failed: ${response.status} ${response.statusText}`,
        status: response.status,
        statusText: response.statusText,
        ...(data && typeof data === 'object' ? data : {})
      };
      return NextResponse.json(errorResponse, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error('Login API Error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    let errorMessage = 'Internal server error during login';
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = `Cannot connect to backend server at ${serverConfig.apiBaseUrl}`;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
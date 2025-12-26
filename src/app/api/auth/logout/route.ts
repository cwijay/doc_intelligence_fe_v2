import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api/server-config';

export async function POST(request: NextRequest) {
  try {
    // Extract auth token from request headers
    let authHeader = request.headers.get('authorization');
    let requestSource = 'manual';
    
    // Handle FormData from Navigator.sendBeacon
    if (!authHeader) {
      try {
        const contentType = request.headers.get('content-type') || '';
        
        if (contentType.includes('multipart/form-data')) {
          // This is likely a sendBeacon request with FormData
          const formData = await request.formData();
          const token = formData.get('token') as string;
          const source = formData.get('source') as string;
          
          if (token) {
            authHeader = `Bearer ${token}`;
            requestSource = source || 'beacon';
          }
        } else {
          // Try to parse JSON body for token
          const body = await request.json().catch(() => ({}));
          if (body.source) {
            requestSource = body.source;
          }
        }
      } catch {
        console.log('Could not parse request body for token');
      }
    }
    
    if (!authHeader) {
      console.log(`No authorization token found for logout (source: ${requestSource})`);
      // Still return success - user might be logging out due to expired token
      return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
    }

    console.log(`Logout attempt (${requestSource}) with token:`, authHeader ? 'present' : 'missing');
    
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse logout response as JSON:', parseError);
      data = { message: 'Logout completed' };
    }

    console.log('Backend logout response:', {
      status: response.status,
      statusText: response.statusText,
      data,
    });

    if (!response.ok) {
      // Log the error but still return success - we want logout to work even if backend fails
      console.warn('Backend logout failed, but continuing with client logout:', {
        status: response.status,
        error: data?.error || data?.message,
      });
      
      return NextResponse.json(
        { 
          message: 'Logged out successfully (backend warning)',
          warning: data?.error || data?.message || `Backend returned ${response.status}`,
        }, 
        { status: 200 }
      );
    }

    return NextResponse.json(data || { message: 'Logged out successfully' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Logout API Error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // Always return success for logout - even if backend is unreachable
    // This ensures users can always logout from the frontend
    let message = 'Logged out successfully (offline)';
    
    if (error instanceof Error && error.message.includes('fetch')) {
      message = `Logged out locally (backend unavailable at ${API_BASE_URL})`;
    }
    
    return NextResponse.json(
      { 
        message,
        warning: error instanceof Error ? error.message : 'Backend error during logout',
      },
      { status: 200 }
    );
  }
}
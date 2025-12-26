import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api/server-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/organizations/lookup?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Ensure data has the expected structure
    const responseData = {
      organizations: Array.isArray(data?.organizations) ? data.organizations : 
                    Array.isArray(data) ? data : []
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error: unknown) {
    console.error('Organization Lookup API Error:', error);
    
    let errorMessage = 'Failed to lookup organizations';
    
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        organizations: [] // Always provide an empty array as fallback
      },
      { status: 500 }
    );
  }
}
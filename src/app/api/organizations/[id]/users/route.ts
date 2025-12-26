import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/api/server-config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = new URLSearchParams(searchParams);
    const { id } = await params;
    
    const response = await fetch(`${API_BASE_URL}/api/v1/organizations/${id}/users?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Users API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;
    
    const response = await fetch(`${API_BASE_URL}/api/v1/organizations/${id}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      
      if (errorData) {
        return NextResponse.json(errorData, { status: response.status });
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    console.error('Create User API Error:', error);
    
    let errorMessage = 'Failed to create user';
    let statusCode = 500;
    
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      if (error.message.includes('HTTP error! status:')) {
        const status = error.message.match(/status: (\d+)/)?.[1];
        if (status) {
          statusCode = parseInt(status);
          errorMessage = `Server returned ${status} error`;
        }
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
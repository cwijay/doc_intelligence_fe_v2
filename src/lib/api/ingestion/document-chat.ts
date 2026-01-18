/**
 * Document Chat API operations using unified DocumentAgent
 */
import { AxiosResponse } from 'axios';
import { ragApi } from './clients';
import {
  DocumentChatRequest,
  DocumentChatResponse,
  DocumentChatStreamRequest,
  StreamEvent
} from '@/types/rag';
import { getBrowserAiApiBaseUrl } from '@/lib/config';
import { authService } from '@/lib/auth';
import { HEADERS } from '@/lib/constants';

/**
 * Chat with documents using the unified DocumentAgent
 * Supports conversational RAG with semantic, keyword, and hybrid search modes
 */
export async function chatWithDocuments(
  request: DocumentChatRequest
): Promise<DocumentChatResponse> {
  console.log('💬 Chatting with documents:', {
    query: request.query,
    organizationName: request.organization_name,
    searchMode: request.search_mode || 'hybrid',
    folderFilter: request.folder_filter,
    fileFilter: request.file_filter,
    sessionId: request.session_id,
  });

  const response: AxiosResponse<DocumentChatResponse> = await ragApi.post(
    '/api/v1/documents/chat',
    {
      query: request.query,
      organization_name: request.organization_name,
      session_id: request.session_id,
      folder_filter: request.folder_filter,
      file_filter: request.file_filter,
      search_mode: request.search_mode || 'hybrid',
      max_sources: request.max_sources || 5,
    }
  );

  console.log('✅ Document chat response:', {
    success: response.data.success,
    citationsCount: response.data.citations?.length || 0,
    processingTimeMs: response.data.processing_time_ms,
    searchMode: response.data.search_mode,
    sessionId: response.data.session_id,
  });

  return response.data;
}

/**
 * Chat with documents using streaming SSE endpoint
 * Returns tokens progressively for real-time UI updates
 *
 * @param request - The chat request parameters
 * @param onEvent - Callback fired for each streaming event
 * @returns Promise that resolves when stream completes
 */
export async function chatWithDocumentsStream(
  request: DocumentChatStreamRequest,
  onEvent: (event: StreamEvent) => void
): Promise<void> {
  console.log('🌊 Starting streaming chat:', {
    query: request.query,
    organizationName: request.organization_name,
    searchMode: request.search_mode || 'hybrid',
    folderFilter: request.folder_filter,
    fileFilter: request.file_filter,
    sessionId: request.session_id,
  });

  const baseUrl = getBrowserAiApiBaseUrl();
  const url = `${baseUrl}/api/v1/documents/chat/stream`;

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  const token = authService.getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add organization header (AI API expects org_name)
  const user = authService.getUser();
  if (user?.org_name) {
    headers[HEADERS.ORG_ID] = user.org_name;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: request.query,
      organization_name: request.organization_name,
      session_id: request.session_id,
      folder_filter: request.folder_filter,
      file_filter: request.file_filter,
      search_mode: request.search_mode || 'hybrid',
      max_sources: request.max_sources || 5,
      include_tool_events: request.include_tool_events ?? true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Stream request failed: ${response.status} ${errorText}`);
  }

  if (!response.body) {
    throw new Error('Response body is null - streaming not supported');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('🏁 Stream completed');
        break;
      }

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE events from buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        // Skip empty lines and event type lines
        if (!line.trim() || line.startsWith('event:')) {
          continue;
        }

        // Parse data lines
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6); // Remove 'data: ' prefix
          if (jsonStr.trim()) {
            try {
              const event: StreamEvent = JSON.parse(jsonStr);
              onEvent(event);

              // Log significant events
              if (event.event === 'tool_start') {
                console.log('🔧 Tool started:', event.tool_name);
              } else if (event.event === 'tool_end') {
                console.log('✅ Tool completed:', event.tool_name);
              } else if (event.event === 'done') {
                console.log('🎉 Stream done:', {
                  sessionId: event.session_id,
                  processingTimeMs: event.processing_time_ms,
                });
              } else if (event.event === 'error') {
                console.error('❌ Stream error:', event.error);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE event:', jsonStr, parseError);
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

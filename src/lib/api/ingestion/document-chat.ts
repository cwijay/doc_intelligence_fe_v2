/**
 * Document Chat API operations using unified DocumentAgent
 */
import { AxiosResponse } from 'axios';
import { ragApi } from './clients';
import { DocumentChatRequest, DocumentChatResponse } from '@/types/rag';

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

import { AxiosResponse } from 'axios';
import aiApi from '../ai-base';
import {
  Document,
  DocumentSummary,
  AISummarizeRequest,
  AISummarizeResponse,
} from '@/types/api';
import { API_ENDPOINTS, AI_LIMITS } from '@/lib/constants';
import {
  validateAIInputs,
  clampQuantity,
  logGenerationStart,
  logGenerationSuccess,
  logGenerationError,
  buildBaseRequest
} from './helpers';

export const summaryApi = {
  /**
   * Generate a summary for a document using the AI API (port 8001)
   */
  generateSummary: async (
    documentName: string,
    orgName: string,
    folderName: string,
    maxWords: number = AI_LIMITS.SUMMARY.DEFAULT_WORDS,
    sessionId?: string,
    force: boolean = false
  ): Promise<AISummarizeResponse> => {
    validateAIInputs(documentName, orgName, folderName);

    const validMaxWords = clampQuantity(maxWords, AI_LIMITS.SUMMARY.MIN_WORDS, AI_LIMITS.SUMMARY.MAX_WORDS);

    try {
      logGenerationStart('📝', 'summary', documentName, orgName, folderName, validMaxWords, force);

      const requestData: AISummarizeRequest = {
        ...buildBaseRequest(documentName, orgName, folderName, sessionId, force),
        max_words: validMaxWords,
      } as AISummarizeRequest;

      // Debug: Log the request being sent
      console.log('📝 Summary Request being sent:', {
        endpoint: API_ENDPOINTS.SUMMARIZE,
        requestData,
        orgName,
        folderName,
        documentName
      });

      const response: AxiosResponse<AISummarizeResponse> = await aiApi.post(
        API_ENDPOINTS.SUMMARIZE,
        requestData
      );

      // Debug: Log the raw API response to diagnose summary field issues
      console.log('📝 Raw API Response from /summarize:', {
        status: response.status,
        data: response.data,
        hasSummaryField: 'summary' in response.data,
        hasMessageField: 'message' in response.data,
        summaryValue: response.data.summary,
        messageValue: (response.data as any).message,
      });

      logGenerationSuccess(documentName, {
        wordCount: response.data.word_count,
        cached: response.data.cached,
        processingTime: response.data.processing_time_ms
      });

      return response.data;
    } catch (error) {
      logGenerationError('Summary', error);
      throw error;
    }
  },

  /**
   * Convert AI API response to DocumentSummary format for UI consumption
   */
  convertToDocumentSummary: (
    response: AISummarizeResponse,
    documentId: string
  ): DocumentSummary => {
    const now = new Date().toISOString();

    // Debug: Log the raw response to understand the structure
    console.log('📝 Raw summarize response:', {
      hasSummary: !!response.summary,
      summaryLength: response.summary?.length,
      summaryPreview: response.summary?.substring(0, 100),
      hasMessage: !!response.message,
      messageLength: response.message?.length,
      messagePreview: response.message?.substring(0, 100),
      fullResponse: response
    });

    // Use summary field first, fall back to message field if summary is empty/missing
    // Backend may return the actual summary in either field
    const summaryContent = response.summary || response.message || '';

    // Warn if we're using the message field as fallback
    if (!response.summary && response.message) {
      console.warn('⚠️ Summary field empty, using message field as fallback');
    }

    return {
      id: `${documentId}-summary`,
      document_id: documentId,
      content: summaryContent,
      metadata: {
        word_count: response.word_count,
        cached: response.cached,
        processing_time_ms: response.processing_time_ms
      },
      created_at: now,
      updated_at: now,
      word_count: response.word_count,
      cached: response.cached,
      processing_time_ms: response.processing_time_ms
    };
  },

  /**
   * Generate and convert summary in one call (convenience method)
   */
  generateAndConvert: async (
    document: Document,
    orgName: string,
    folderName: string,
    maxWords: number = AI_LIMITS.SUMMARY.DEFAULT_WORDS,
    sessionId?: string,
    force: boolean = false
  ): Promise<DocumentSummary> => {
    const response = await summaryApi.generateSummary(
      document.name,
      orgName,
      folderName,
      maxWords,
      sessionId,
      force
    );

    // Debug: Log response for troubleshooting
    console.log('📝 Summary generateAndConvert - checking response:', {
      success: response.success,
      hasSummary: !!response.summary,
      hasMessage: !!response.message,
      summaryLength: response.summary?.length,
      messageLength: response.message?.length,
      error: response.error,
      fullResponse: response
    });

    // Check for explicit error first
    if (response.error) {
      // Provide more helpful error messages for common issues
      const errorMsg = response.error;
      if (errorMsg.toLowerCase().includes('not found') || errorMsg.toLowerCase().includes('does not exist')) {
        throw new Error(`Document not found. Please ensure the document has been parsed before generating a summary.`);
      }
      if (errorMsg.toLowerCase().includes('failed to generate')) {
        throw new Error(`${errorMsg}. This may happen if the document hasn't been parsed yet. Please parse the document first.`);
      }
      throw new Error(errorMsg);
    }

    // Consider successful if we have summary/message content, even if success field is missing/false
    // Backend may return content in either 'summary' or 'message' field
    const hasSummaryContent = !!(response.summary || response.message);
    if (!response.success && !hasSummaryContent) {
      throw new Error('Failed to generate summary: No summary content received');
    }

    // Warn if success is false but we have data
    if (!response.success && hasSummaryContent) {
      console.warn('⚠️ Summary response has success=false but contains content, proceeding anyway');
    }

    return summaryApi.convertToDocumentSummary(response, document.id);
  }
};

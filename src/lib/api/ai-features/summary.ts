import { AxiosResponse } from 'axios';
import aiApi from '../ai-base';
import {
  Document,
  DocumentSummary,
  AISummarizeRequest,
  AISummarizeResponse,
} from '@/types/api';
import { constructParsedFilePath, validateParsedFilePath } from '../utils/path-utils';
import { API_ENDPOINTS, AI_LIMITS } from '@/lib/constants';

export const summaryApi = {
  /**
   * Generate a summary for a document using the AI API (port 8001)
   */
  generateSummary: async (
    documentName: string,
    parsedFilePath: string,
    maxWords: number = AI_LIMITS.SUMMARY.DEFAULT_WORDS,
    sessionId?: string,
    force: boolean = false
  ): Promise<AISummarizeResponse> => {
    if (!documentName || documentName.trim() === '') {
      throw new Error('document_name is required and cannot be empty');
    }
    validateParsedFilePath(parsedFilePath);

    const validMaxWords = Math.min(
      Math.max(maxWords, AI_LIMITS.SUMMARY.MIN_WORDS),
      AI_LIMITS.SUMMARY.MAX_WORDS
    );

    try {
      console.log('📝 Generating summary via AI API:', {
        documentName,
        parsedFilePath,
        maxWords: validMaxWords,
        force
      });

      const requestData: AISummarizeRequest = {
        document_name: documentName,
        parsed_file_path: parsedFilePath,
        max_words: validMaxWords,
        ...(sessionId && { session_id: sessionId }),
        ...(force && { force: true })
      };

      const response: AxiosResponse<AISummarizeResponse> = await aiApi.post(
        API_ENDPOINTS.SUMMARIZE,
        requestData
      );

      console.log('✅ Summary generated successfully:', {
        documentName,
        wordCount: response.data.word_count,
        cached: response.data.cached,
        processingTime: response.data.processing_time_ms
      });

      return response.data;
    } catch (error) {
      console.error('🚫 Summary generation failed:', error);
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

    return {
      id: `${documentId}-summary`,
      document_id: documentId,
      content: response.summary || '',
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
    const parsedFilePath = constructParsedFilePath(orgName, folderName, document.name);

    const response = await summaryApi.generateSummary(
      document.name,
      parsedFilePath,
      maxWords,
      sessionId,
      force
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to generate summary');
    }

    return summaryApi.convertToDocumentSummary(response, document.id);
  }
};

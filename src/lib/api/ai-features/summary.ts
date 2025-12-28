import { AxiosResponse } from 'axios';
import aiApi from '../ai-base';
import {
  Document,
  DocumentSummary,
  AISummarizeRequest,
  AISummarizeResponse,
} from '@/types/api';
import { constructParsedFilePath } from '../utils/path-utils';
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
    parsedFilePath: string,
    maxWords: number = AI_LIMITS.SUMMARY.DEFAULT_WORDS,
    sessionId?: string,
    force: boolean = false
  ): Promise<AISummarizeResponse> => {
    validateAIInputs(documentName, parsedFilePath);

    const validMaxWords = clampQuantity(maxWords, AI_LIMITS.SUMMARY.MIN_WORDS, AI_LIMITS.SUMMARY.MAX_WORDS);

    try {
      logGenerationStart('📝', 'summary', documentName, parsedFilePath, validMaxWords, force);

      const requestData: AISummarizeRequest = {
        ...buildBaseRequest(documentName, parsedFilePath, sessionId, force),
        max_words: validMaxWords,
      } as AISummarizeRequest;

      const response: AxiosResponse<AISummarizeResponse> = await aiApi.post(
        API_ENDPOINTS.SUMMARIZE,
        requestData
      );

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

import { AxiosResponse } from 'axios';
import aiApi from '../ai-base';
import {
  Document,
  DocumentFAQ,
  AIFAQsRequest,
  AIFAQsResponse,
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

export const faqApi = {
  /**
   * Generate FAQs for a document using the AI API (port 8001)
   */
  generateFAQs: async (
    documentName: string,
    parsedFilePath: string,
    numFaqs: number = AI_LIMITS.FAQ.DEFAULT,
    sessionId?: string,
    force: boolean = false
  ): Promise<AIFAQsResponse> => {
    validateAIInputs(documentName, parsedFilePath);

    const validNumFaqs = clampQuantity(numFaqs, AI_LIMITS.FAQ.MIN, AI_LIMITS.FAQ.MAX);

    try {
      logGenerationStart('❓', 'FAQs', documentName, parsedFilePath, validNumFaqs, force);

      const requestData: AIFAQsRequest = {
        ...buildBaseRequest(documentName, parsedFilePath, sessionId, force),
        num_faqs: validNumFaqs,
      } as AIFAQsRequest;

      const response: AxiosResponse<AIFAQsResponse> = await aiApi.post(
        API_ENDPOINTS.FAQS,
        requestData
      );

      logGenerationSuccess(documentName, {
        count: response.data.count,
        cached: response.data.cached,
        processingTime: response.data.processing_time_ms
      });

      return response.data;
    } catch (error) {
      logGenerationError('FAQ', error);
      throw error;
    }
  },

  /**
   * Convert AI API response to DocumentFAQ format for UI consumption
   */
  convertToDocumentFAQ: (
    response: AIFAQsResponse,
    documentId: string
  ): DocumentFAQ => {
    const now = new Date().toISOString();

    return {
      id: `${documentId}-faq`,
      document_id: documentId,
      faqs: (response.faqs || []).map(faq => ({
        question: faq.question,
        answer: faq.answer
      })),
      metadata: {
        count: response.count,
        cached: response.cached,
        processing_time_ms: response.processing_time_ms
      },
      created_at: now,
      updated_at: now,
      count: response.count,
      cached: response.cached,
      processing_time_ms: response.processing_time_ms
    };
  },

  /**
   * Generate and convert FAQs in one call (convenience method)
   */
  generateAndConvert: async (
    document: Document,
    orgName: string,
    folderName: string,
    numFaqs: number = AI_LIMITS.FAQ.DEFAULT,
    sessionId?: string,
    force: boolean = false
  ): Promise<DocumentFAQ> => {
    const parsedFilePath = constructParsedFilePath(orgName, folderName, document.name);

    const response = await faqApi.generateFAQs(
      document.name,
      parsedFilePath,
      numFaqs,
      sessionId,
      force
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to generate FAQs');
    }

    return faqApi.convertToDocumentFAQ(response, document.id);
  }
};

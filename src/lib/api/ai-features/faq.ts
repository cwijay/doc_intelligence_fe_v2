import { AxiosResponse } from 'axios';
import aiApi from '../ai-base';
import {
  Document,
  DocumentFAQ,
  AIFAQsRequest,
  AIFAQsResponse,
} from '@/types/api';
import { constructParsedFilePath, validateParsedFilePath } from '../utils/path-utils';
import { API_ENDPOINTS, AI_LIMITS } from '@/lib/constants';

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
    if (!documentName || documentName.trim() === '') {
      throw new Error('document_name is required and cannot be empty');
    }
    validateParsedFilePath(parsedFilePath);

    const validNumFaqs = Math.min(
      Math.max(numFaqs, AI_LIMITS.FAQ.MIN),
      AI_LIMITS.FAQ.MAX
    );

    try {
      console.log('❓ Generating FAQs via AI API:', {
        documentName,
        parsedFilePath,
        numFaqs: validNumFaqs,
        force
      });

      const requestData: AIFAQsRequest = {
        document_name: documentName,
        parsed_file_path: parsedFilePath,
        num_faqs: validNumFaqs,
        ...(sessionId && { session_id: sessionId }),
        ...(force && { force: true })
      };

      const response: AxiosResponse<AIFAQsResponse> = await aiApi.post(
        API_ENDPOINTS.FAQS,
        requestData
      );

      console.log('✅ FAQs generated successfully:', {
        documentName,
        count: response.data.count,
        cached: response.data.cached,
        processingTime: response.data.processing_time_ms
      });

      return response.data;
    } catch (error) {
      console.error('🚫 FAQ generation failed:', error);
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
      faqs: response.faqs.map(faq => ({
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

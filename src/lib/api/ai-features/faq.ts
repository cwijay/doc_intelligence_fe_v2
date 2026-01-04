import { AxiosResponse } from 'axios';
import aiApi from '@/lib/api/ai-base';
import {
  Document,
  DocumentFAQ,
  AIFAQsRequest,
  AIFAQsResponse,
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
import { handleGenerateAndConvertResponse } from './errors';

export const faqApi = {
  /**
   * Generate FAQs for a document using the AI API (port 8001)
   */
  generateFAQs: async (
    documentName: string,
    orgName: string,
    folderName: string,
    numFaqs: number = AI_LIMITS.FAQ.DEFAULT,
    sessionId?: string,
    force: boolean = false
  ): Promise<AIFAQsResponse> => {
    validateAIInputs(documentName, orgName, folderName);

    const validNumFaqs = clampQuantity(numFaqs, AI_LIMITS.FAQ.MIN, AI_LIMITS.FAQ.MAX);

    try {
      logGenerationStart('❓', 'FAQs', documentName, orgName, folderName, validNumFaqs, force);

      const requestData: AIFAQsRequest = {
        ...buildBaseRequest(documentName, orgName, folderName, sessionId, force),
        num_faqs: validNumFaqs,
      } as AIFAQsRequest;

      // Debug: Log the request being sent
      console.log('❓ FAQ Request being sent:', {
        endpoint: API_ENDPOINTS.FAQS,
        requestData,
        orgName,
        folderName,
        documentName
      });

      const response: AxiosResponse<AIFAQsResponse> = await aiApi.post(
        API_ENDPOINTS.FAQS,
        requestData
      );

      // Debug: Log the raw API response to diagnose issues
      console.log('❓ Raw API Response from /faqs:', {
        status: response.status,
        data: response.data,
        hasSuccessField: 'success' in response.data,
        successValue: response.data.success,
        hasFaqsField: 'faqs' in response.data,
        faqsCount: response.data.faqs?.length,
        errorField: response.data.error,
      });

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
    const response = await faqApi.generateFAQs(
      document.name,
      orgName,
      folderName,
      numFaqs,
      sessionId,
      force
    );

    // Debug: Log response for troubleshooting
    console.log('❓ FAQ generateAndConvert - checking response:', {
      success: response.success,
      hasFaqs: !!response.faqs,
      faqsLength: response.faqs?.length,
      error: response.error,
      fullResponse: response
    });

    // Use shared error handling
    handleGenerateAndConvertResponse(
      response,
      (r) => !!(r.faqs && r.faqs.length > 0),
      'FAQ'
    );

    return faqApi.convertToDocumentFAQ(response, document.id);
  }
};

import { AxiosResponse } from 'axios';
import aiApi from '@/lib/api/ai-base';
import {
  Document,
  DocumentQuestions,
  AIQuestionsRequest,
  AIQuestionsResponse,
  DifficultyLevel,
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

export const questionsApi = {
  /**
   * Generate questions for a document using the AI API (port 8001)
   */
  generateQuestions: async (
    documentName: string,
    orgName: string,
    folderName: string,
    numQuestions: number = AI_LIMITS.QUESTIONS.DEFAULT,
    sessionId?: string,
    force: boolean = false
  ): Promise<AIQuestionsResponse> => {
    validateAIInputs(documentName, orgName, folderName);

    const validNumQuestions = clampQuantity(numQuestions, AI_LIMITS.QUESTIONS.MIN, AI_LIMITS.QUESTIONS.MAX);

    try {
      logGenerationStart('📋', 'questions', documentName, orgName, folderName, validNumQuestions, force);

      const requestData: AIQuestionsRequest = {
        ...buildBaseRequest(documentName, orgName, folderName, sessionId, force),
        num_questions: validNumQuestions,
      } as AIQuestionsRequest;

      // Debug: Log the request being sent
      console.log('📋 Questions Request being sent:', {
        endpoint: API_ENDPOINTS.QUESTIONS,
        requestData,
        orgName,
        folderName,
        documentName
      });

      const response: AxiosResponse<AIQuestionsResponse> = await aiApi.post(
        API_ENDPOINTS.QUESTIONS,
        requestData
      );

      // Debug: Log the raw API response to diagnose issues
      console.log('📋 Raw API Response from /questions:', {
        status: response.status,
        data: response.data,
        hasSuccessField: 'success' in response.data,
        successValue: response.data.success,
        hasQuestionsField: 'questions' in response.data,
        questionsCount: response.data.questions?.length,
        errorField: response.data.error,
      });

      logGenerationSuccess(documentName, {
        count: response.data.count,
        difficultyDistribution: response.data.difficulty_distribution,
        cached: response.data.cached,
        processingTime: response.data.processing_time_ms
      });

      return response.data;
    } catch (error) {
      logGenerationError('Questions', error);
      throw error;
    }
  },

  /**
   * Convert AI API response to DocumentQuestions format for UI consumption
   */
  convertToDocumentQuestions: (
    response: AIQuestionsResponse,
    documentId: string
  ): DocumentQuestions => {
    const now = new Date().toISOString();

    return {
      id: `${documentId}-questions`,
      document_id: documentId,
      questions: (response.questions || []).map(q => ({
        question: q.question,
        expected_answer: q.expected_answer,
        difficulty: q.difficulty as DifficultyLevel,
        type: 'short_answer' as const
      })),
      metadata: {
        count: response.count,
        difficulty_distribution: response.difficulty_distribution,
        cached: response.cached,
        processing_time_ms: response.processing_time_ms
      },
      created_at: now,
      updated_at: now,
      count: response.count,
      difficulty_distribution: response.difficulty_distribution,
      cached: response.cached,
      processing_time_ms: response.processing_time_ms
    };
  },

  /**
   * Generate and convert questions in one call (convenience method)
   */
  generateAndConvert: async (
    document: Document,
    orgName: string,
    folderName: string,
    numQuestions: number = AI_LIMITS.QUESTIONS.DEFAULT,
    sessionId?: string,
    force: boolean = false
  ): Promise<DocumentQuestions> => {
    const response = await questionsApi.generateQuestions(
      document.name,
      orgName,
      folderName,
      numQuestions,
      sessionId,
      force
    );

    // Debug: Log response for troubleshooting
    console.log('📋 Questions generateAndConvert - checking response:', {
      success: response.success,
      hasQuestions: !!response.questions,
      questionsLength: response.questions?.length,
      error: response.error,
      fullResponse: response
    });

    // Use shared error handling
    handleGenerateAndConvertResponse(
      response,
      (r) => !!(r.questions && r.questions.length > 0),
      'Questions'
    );

    return questionsApi.convertToDocumentQuestions(response, document.id);
  },

  /**
   * Get difficulty badge color for UI display
   */
  getDifficultyColor: (difficulty: DifficultyLevel): string => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  }
};

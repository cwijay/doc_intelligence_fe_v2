import { AxiosResponse } from 'axios';
import aiApi from '../ai-base';
import {
  Document,
  DocumentQuestions,
  AIQuestionsRequest,
  AIQuestionsResponse,
  DifficultyLevel,
} from '@/types/api';
import { constructParsedFilePath, validateParsedFilePath } from '../utils/path-utils';
import { API_ENDPOINTS, AI_LIMITS } from '@/lib/constants';

export const questionsApi = {
  /**
   * Generate questions for a document using the AI API (port 8001)
   */
  generateQuestions: async (
    documentName: string,
    parsedFilePath: string,
    numQuestions: number = AI_LIMITS.QUESTIONS.DEFAULT,
    sessionId?: string,
    force: boolean = false
  ): Promise<AIQuestionsResponse> => {
    if (!documentName || documentName.trim() === '') {
      throw new Error('document_name is required and cannot be empty');
    }
    validateParsedFilePath(parsedFilePath);

    const validNumQuestions = Math.min(
      Math.max(numQuestions, AI_LIMITS.QUESTIONS.MIN),
      AI_LIMITS.QUESTIONS.MAX
    );

    try {
      console.log('📋 Generating questions via AI API:', {
        documentName,
        parsedFilePath,
        numQuestions: validNumQuestions,
        force
      });

      const requestData: AIQuestionsRequest = {
        document_name: documentName,
        parsed_file_path: parsedFilePath,
        num_questions: validNumQuestions,
        ...(sessionId && { session_id: sessionId }),
        ...(force && { force: true })
      };

      const response: AxiosResponse<AIQuestionsResponse> = await aiApi.post(
        API_ENDPOINTS.QUESTIONS,
        requestData
      );

      console.log('✅ Questions generated successfully:', {
        documentName,
        count: response.data.count,
        difficultyDistribution: response.data.difficulty_distribution,
        cached: response.data.cached,
        processingTime: response.data.processing_time_ms
      });

      return response.data;
    } catch (error) {
      console.error('🚫 Questions generation failed:', error);
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
      questions: response.questions.map(q => ({
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
    const parsedFilePath = constructParsedFilePath(orgName, folderName, document.name);

    const response = await questionsApi.generateQuestions(
      document.name,
      parsedFilePath,
      numQuestions,
      sessionId,
      force
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to generate questions');
    }

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

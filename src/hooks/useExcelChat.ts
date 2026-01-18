'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Document } from '@/types/api';
import { excelApiService, ChatMessage, ChatSession, SheetsAnalyzeResponse } from '@/lib/api/excel';
import { fileUtils } from '@/lib/file-utils';
import { API_OPERATION_TIMEOUTS } from '@/lib/constants';
import toast from 'react-hot-toast';

/**
 * Parse structured API response that may be in Python-style format
 * Extracts text content from response like:
 * [{'type': 'reasoning', ...}, {'type': 'text', 'text': 'actual content...', ...}]
 */
function parseApiResponse(content: string): string {
  if (!content || typeof content !== 'string') {
    return content || '';
  }

  const trimmed = content.trim();

  // Check if this looks like a Python/JSON array of content blocks
  if (trimmed.startsWith('[') && trimmed.includes("'type':")) {
    try {
      // Extract text from text blocks using regex
      // Pattern: find text after 'text': ' and before ', 'annotations' or similar ending

      // The text content is between 'text': ' and ', 'annotations'
      // We need to handle the full pattern carefully

      const textBlocks: string[] = [];

      // Split by type markers to find text blocks
      const typeTextPattern = /'type':\s*'text'/g;
      let match;
      let lastIndex = 0;
      const indices: number[] = [];

      while ((match = typeTextPattern.exec(trimmed)) !== null) {
        indices.push(match.index);
      }

      for (const idx of indices) {
        // Find the 'text': ' part after this type marker
        const afterType = trimmed.substring(idx);
        const textKeyMatch = afterType.match(/'text':\s*'/);

        if (textKeyMatch && textKeyMatch.index !== undefined) {
          const contentStart = idx + textKeyMatch.index + textKeyMatch[0].length;

          // Now find the end - look for ', 'annotations' or ', "annotations"
          // The content could contain \n, |, etc.
          const remaining = trimmed.substring(contentStart);

          // Find the pattern that ends the text value
          // It should be: ', 'annotations' or similar
          // We need to find the LAST occurrence of the closing pattern before the next block

          // Look for the closing quote followed by comma and annotations
          const endPatterns = [
            "', 'annotations'",
            '\', "annotations"',
            "', 'id':",  // fallback if no annotations
          ];

          let endIdx = -1;
          for (const pattern of endPatterns) {
            const idx = remaining.indexOf(pattern);
            if (idx !== -1 && (endIdx === -1 || idx < endIdx)) {
              endIdx = idx;
            }
          }

          if (endIdx !== -1) {
            const textContent = remaining.substring(0, endIdx);
            // Unescape the content
            const unescaped = textContent
              .replace(/\\n/g, '\n')
              .replace(/\\t/g, '\t')
              .replace(/\\'/g, "'")
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
            textBlocks.push(unescaped);
          }
        }
      }

      if (textBlocks.length > 0) {
        return textBlocks.join('\n\n');
      }
    } catch (e) {
      console.warn('Failed to parse structured API response:', e);
    }
  }

  // Return original content if not a structured response or parsing failed
  return content;
}

interface UseExcelChatReturn {
  // Modal state
  isOpen: boolean;
  openChat: (documents: Document[]) => void;
  closeChat: () => void;
  
  // Chat state
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  
  // Chat actions
  sendMessage: (query: string, options?: { detailed_analysis?: boolean }) => Promise<void>;
  clearChat: () => void;
  
  // Current documents
  currentDocuments: Document[];
  
  // Retry functionality
  retryLastMessage: () => Promise<void>;
}

export function useExcelChat(): UseExcelChatReturn {
  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  
  // Chat state
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDocuments, setCurrentDocuments] = useState<Document[]>([]);
  
  // Store last query for retry
  const lastQueryRef = useRef<{
    query: string;
    options?: { detailed_analysis?: boolean };
  } | null>(null);
  
  // Track if component is ready to show toasts (to avoid toasts during setup)
  // Use ref instead of state to avoid callback recreation
  const isReadyRef = useRef(false);

  useEffect(() => {
    // Mark as ready after initial render
    isReadyRef.current = true;
  }, []);
  
  const openChat = useCallback((documents: Document[]) => {
    console.log('🔍 Opening Excel chat for documents:', {
      documentsProvided: !!documents,
      documentsType: typeof documents,
      isArray: Array.isArray(documents),
      documentsLength: documents?.length,
      documents: documents
    });
    
    // Add extra defensive checks before validation
    if (!documents) {
      console.error('🚨 useExcelChat.openChat: No documents provided (null/undefined)');
      // Only show toast when component is ready (avoid toasts during setup)
      if (isReadyRef.current) {
        toast.error('Cannot open Excel chat: No documents provided');
      }
      return;
    }

    if (!Array.isArray(documents)) {
      console.error('🚨 useExcelChat.openChat: Invalid documents format:', typeof documents, documents);
      // Only show toast when component is ready (avoid toasts during setup)
      if (isReadyRef.current) {
        toast.error('Cannot open Excel chat: Invalid documents format');
      }
      return;
    }

    // Validate documents
    const { valid, invalid, errors } = fileUtils.validateSpreadsheetDocuments(documents);

    if (errors.length > 0) {
      console.error('Invalid documents for Excel chat:', errors);
      // Only show toast when component is ready (avoid toasts during setup)
      if (isReadyRef.current) {
        toast.error(`Cannot open Excel chat: ${errors[0]}`);
      }
      return;
    }

    if (invalid.length > 0) {
      console.warn('Some documents are invalid for Excel chat:', invalid);
      // Only show toast when component is ready (avoid toasts during setup)
      if (isReadyRef.current) {
        toast(`${invalid.length} document(s) are not supported for Excel analysis`, {
          icon: '⚠️',
        });
      }
    }
    
    // Create new session
    const session: ChatSession = {
      id: excelApiService.generateSessionId(),
      documents: valid,
      messages: [],
      created_at: new Date(),
      last_activity: new Date(),
    };
    
    setCurrentSession(session);
    setCurrentDocuments(valid);
    setMessages([]);
    setError(null);
    setIsOpen(true);
    
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'assistant',
      content: `Hello! I'm ready to help you analyze your ${valid.length === 1 ? 'spreadsheet' : 'spreadsheets'}:\n\n${valid.map(doc => `📊 ${doc.name} (${fileUtils.getSpreadsheetFormat(doc)})`).join('\n')}\n\nAsk me anything about your data - I can help with calculations, trends, summaries, and more!`,
      timestamp: new Date(),
    };
    
    setMessages([welcomeMessage]);
    
    console.log('✅ Excel chat session created:', {
      sessionId: session.id,
      documentCount: valid.length,
      documents: valid.map(d => d.name)
    });
  }, []);
  
  const closeChat = useCallback(() => {
    setIsOpen(false);
    // Keep session data for potential reopening
    // setCurrentSession(null);
    // setMessages([]);
    // setCurrentDocuments([]);
    setError(null);
  }, []);
  
  const sendMessage = useCallback(async (
    query: string,
    options?: { detailed_analysis?: boolean }
  ) => {
    if (!currentSession || !currentDocuments.length) {
      toast.error('No active Excel chat session');
      return;
    }
    
    if (!query.trim()) {
      toast.error('Please enter a question');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    // Store for retry functionality
    lastQueryRef.current = { query, options };
    
    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      type: 'user',
      content: query.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      console.log('📊 Sending Excel chat query:', {
        sessionId: currentSession.id,
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        documentCount: currentDocuments.length,
        options
      });
      
      const response = await excelApiService.chat(
        currentDocuments,
        query.trim(),
        currentSession.id,
        {
          detailed_analysis: options?.detailed_analysis || false,
          timeout: API_OPERATION_TIMEOUTS.EXCEL_ANALYSIS,
          max_results: 100
        }
      );
      
      // Log the full response structure for debugging
      console.log('📊 Sheets API raw response:', {
        response: response,
        responseType: typeof response,
        hasSuccess: 'success' in response,
        successValue: response.success,
        hasResponse: 'response' in response,
        hasMessage: 'message' in response,
        hasError: 'error' in response,
        responseKeys: response ? Object.keys(response) : []
      });

      // Validate response structure
      if (!response || typeof response !== 'object') {
        throw new Error(`Invalid response from Sheets agent: ${typeof response}`);
      }

      // Convert processing time from ms to seconds for display
      const processingTimeSeconds = response.processing_time_ms
        ? response.processing_time_ms / 1000
        : undefined;

      // Check for success using the 'success' boolean field
      const isSuccessResponse = response.success === true;
      const isErrorResponse = response.success === false || !!response.error;

      if (isSuccessResponse && !isErrorResponse) {
        // Handle successful response - provide fallback content if response is empty
        const rawContent = response.response ||
          response.message ||
          'Analysis completed successfully, but no detailed response was provided.';

        // Parse structured response (handles Python-style array format from API)
        const responseContent = parseApiResponse(rawContent);

        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          type: 'assistant',
          content: responseContent,
          timestamp: new Date(),
          metadata: {
            files_processed: response.files_processed,
            processing_time_ms: response.processing_time_ms,
            token_usage: response.token_usage,
            tools_used: response.tools_used,
          }
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Update session
        setCurrentSession(prev => prev ? {
          ...prev,
          messages: [...prev.messages, userMessage, assistantMessage],
          last_activity: new Date(),
        } : null);

        console.log('✅ Sheets analysis response received:', {
          responseLength: responseContent.length,
          processingTimeMs: response.processing_time_ms,
          tokensUsed: response.token_usage?.total_tokens,
          filesProcessed: response.files_processed?.length,
          hasResponseContent: !!response.response,
          success: response.success
        });

        // Show success toast with processing info
        if (processingTimeSeconds && response.token_usage) {
          toast.success(
            `Analysis completed in ${processingTimeSeconds.toFixed(1)}s` +
            ` - Used ${response.token_usage.total_tokens} tokens to analyze ${response.files_processed?.length || currentDocuments.length} file(s)`
          );
        }

      } else if (isErrorResponse) {
        // Handle explicit error responses
        const errorMessage = response.error || response.message || 'Failed to analyze spreadsheet data';
        console.error('❌ Sheets API returned error:', {
          success: response.success,
          error: response.error,
          message: response.message,
          details: response.details
        });
        throw new Error(errorMessage);
      } else {
        // Handle truly unexpected response format with detailed information
        const responseInfo = {
          success: response.success,
          hasResponse: !!response.response,
          hasMessage: !!response.message,
          hasError: !!response.error,
          responseKeys: Object.keys(response),
          response: response
        };

        console.error('❌ Unexpected Sheets API response format:', responseInfo);

        // Try to extract any useful content as a fallback
        if (response.response || response.message) {
          console.warn('⚠️ Attempting to use response content despite unexpected format');
          const rawFallback = (response.response || response.message) as string;
          const fallbackContent = parseApiResponse(rawFallback);

          const assistantMessage: ChatMessage = {
            id: `msg-${Date.now()}-assistant`,
            type: 'assistant',
            content: fallbackContent,
            timestamp: new Date(),
            metadata: {
              files_processed: response.files_processed,
              processing_time_ms: response.processing_time_ms,
              token_usage: response.token_usage,
              tools_used: response.tools_used,
            }
          };

          setMessages(prev => [...prev, assistantMessage]);

          // Show warning toast
          toast('Response received with unexpected format, but content was extracted', { icon: '⚠️' });
          return;
        }

        throw new Error(
          `Unexpected response format from Sheets agent. Success: "${response.success}", Available keys: ${Object.keys(response).join(', ')}`
        );
      }
      
    } catch (error) {
      console.error('Excel chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze spreadsheet data';
      
      setError(errorMessage);
      
      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        type: 'assistant',
        content: `I apologize, but I encountered an error while analyzing your data:\n\n${errorMessage}\n\nPlease try again or rephrase your question.`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorChatMessage]);
      
      toast.error(`Excel analysis failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, currentDocuments]);
  
  const retryLastMessage = useCallback(async () => {
    if (!lastQueryRef.current) {
      toast.error('No previous message to retry');
      return;
    }
    
    const { query, options } = lastQueryRef.current;
    await sendMessage(query, options);
  }, [sendMessage]);
  
  const clearChat = useCallback(() => {
    if (!currentSession) return;

    // Keep welcome message but clear the rest
    // Access messages through setState callback to avoid dependency on messages array
    setMessages(prevMessages => {
      const welcomeMessage = prevMessages.find(
        msg => msg.type === 'assistant' && msg.content.includes('ready to help')
      );
      return welcomeMessage ? [welcomeMessage] : [];
    });

    setError(null);
    lastQueryRef.current = null;

    // Update session
    setCurrentSession(prev => prev ? {
      ...prev,
      messages: [], // Clear session messages
      last_activity: new Date(),
    } : null);

    toast.success('Chat history cleared');
  }, [currentSession]);
  
  return {
    // Modal state
    isOpen,
    openChat,
    closeChat,
    
    // Chat state
    currentSession,
    messages,
    isLoading,
    error,
    
    // Chat actions
    sendMessage,
    clearChat,
    
    // Current documents
    currentDocuments,
    
    // Retry functionality
    retryLastMessage,
  };
}

export default useExcelChat;
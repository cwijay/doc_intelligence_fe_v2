import { Document } from '@/types/api';

/**
 * Determines if a document has been parsed and has content available
 * for AI operations like summarization, FAQ generation, or chat.
 * 
 * @param document The document to check
 * @returns true if the document has been parsed and has content available
 */
export const isDocumentParsed = (document: Document): boolean => {
  // Check if document has 'parsed' status or other indicators of being parsed
  return !!(
    document.status === 'parsed' ||
    document.parsed_content ||
    document.parsed_content_path ||
    document.parsed_at
  );
};

/**
 * Gets a human-readable message explaining why AI operations
 * are not available for a document.
 * 
 * @param document The document to check
 * @returns A message explaining the status, or null if operations are available
 */
export const getDocumentParseStatusMessage = (document: Document): string | null => {
  if (canPerformAIOperations(document)) {
    return null; // No message needed - document is ready for AI operations
  }
  
  if (document.status === 'error' || document.status === 'failed') {
    return 'Document has errors and cannot be processed. Please re-upload the document.';
  }
  
  if (document.status === 'processing') {
    return 'Document is currently being processed. Please wait for processing to complete.';
  }
  
  // For uploaded documents or other states
  return 'Document is ready. Click the parse button to extract content for AI features.';
};

/**
 * Determines if a document is ready for basic operations (viewing, downloading).
 * This is a more permissive check than isDocumentParsed.
 * 
 * @param document The document to check
 * @returns true if the document is in a valid state for basic operations
 */
export const isDocumentReady = (document: Document): boolean => {
  // Document is ready if it's uploaded or processed (not in error state)
  return !!(
    document.status === 'uploaded' ||
    document.status === 'processing' ||
    document.status === 'processed' ||
    isDocumentParsed(document)
  );
};

/**
 * Determines if AI operations (summarize, FAQ, chat) should be enabled
 * for a document based on its parse status.
 * 
 * @param document The document to check
 * @returns true if AI operations should be enabled
 */
export const canPerformAIOperations = (document: Document): boolean => {
  // AI operations are only available for documents with 'parsed' status
  // This ensures the document content has been extracted and is available for AI processing
  return document.status === 'parsed';
};

/**
 * Gets the effective status of a document, taking into account if it's currently being parsed.
 * 
 * @param document The document to check
 * @param parsingDocuments Set of document IDs currently being parsed
 * @returns The effective status to display in the UI
 */
export const getEffectiveDocumentStatus = (document: Document, parsingDocuments: Set<string>): Document['status'] | 'processing' => {
  if (parsingDocuments.has(document.id)) {
    return 'processing';
  }
  return document.status;
};

/**
 * Determines if a document has been summarized and has summary content available.
 * 
 * @param document The document to check
 * @returns true if the document has been summarized and has summary content
 */
export const isDocumentSummarized = (document: Document): boolean => {
  return !!(
    document.summary_content ||
    document.summary_id ||
    document.summarized_at ||
    document.ai_summary  // Check ai_summary field from Firestore
  );
};

/**
 * Determines if summary operations (generate, view, edit) should be enabled
 * for a document based on its parse status and current state.
 * 
 * @param document The document to check
 * @returns true if summary operations should be enabled
 */
export const canPerformSummaryOperations = (document: Document): boolean => {
  // Summary operations are only available for parsed documents
  // This ensures the document content has been extracted and is available for summarization
  return document.status === 'parsed';
};

/**
 * Gets a human-readable message explaining why summary operations
 * are not available for a document.
 * 
 * @param document The document to check
 * @returns A message explaining the status, or null if operations are available
 */
export const getDocumentSummaryStatusMessage = (document: Document): string | null => {
  if (canPerformSummaryOperations(document)) {
    return null; // No message needed - document is ready for summary operations
  }
  
  if (document.status === 'error' || document.status === 'failed') {
    return 'Document has errors and cannot be summarized. Please re-upload the document.';
  }
  
  if (document.status === 'processing') {
    return 'Document is currently being processed. Please wait for processing to complete before generating summaries.';
  }
  
  if (document.status === 'uploaded' || document.status === 'processed') {
    return 'Document content must be parsed first. Click the parse button to extract content before generating summaries.';
  }
  
  // Default message for other states
  return 'Document is not ready for summarization. Please ensure the document is parsed first.';
};

/**
 * Gets the effective summarization status of a document, taking into account 
 * if it's currently being summarized.
 * 
 * @param document The document to check
 * @param summarizingDocuments Set of document IDs currently being summarized
 * @returns The effective summarization status to display in the UI
 */
export const getEffectiveSummaryStatus = (
  document: Document, 
  summarizingDocuments: Set<string>
): 'none' | 'generating' | 'available' | 'error' => {
  if (summarizingDocuments.has(document.id)) {
    return 'generating';
  }
  
  if (isDocumentSummarized(document)) {
    return 'available';
  }
  
  if (document.status === 'error' || document.status === 'failed') {
    return 'error';
  }
  
  return 'none';
};

/**
 * Determines if a document has FAQs generated and available.
 * 
 * @param document The document to check
 * @returns true if the document has FAQs generated
 */
export const isDocumentFAQGenerated = (document: Document): boolean => {
  return !!(
    document.faq_content ||
    document.faq_id ||
    document.faq_generated_at ||
    document.ai_faq  // Check ai_faq field from Firestore
  );
};

/**
 * Determines if FAQ operations (generate, view, edit) should be enabled
 * for a document based on its parse status and current state.
 * 
 * @param document The document to check
 * @returns true if FAQ operations should be enabled
 */
export const canPerformFAQOperations = (document: Document): boolean => {
  // FAQ operations are only available for parsed documents
  // This ensures the document content has been extracted and is available for FAQ generation
  return document.status === 'parsed';
};

/**
 * Gets a human-readable message explaining why FAQ operations
 * are not available for a document.
 * 
 * @param document The document to check
 * @returns A message explaining the status, or null if operations are available
 */
export const getDocumentFAQStatusMessage = (document: Document): string | null => {
  if (canPerformFAQOperations(document)) {
    return null; // No message needed - document is ready for FAQ operations
  }
  
  if (document.status === 'error' || document.status === 'failed') {
    return 'Document has errors and cannot generate FAQs. Please re-upload the document.';
  }
  
  if (document.status === 'processing') {
    return 'Document is currently being processed. Please wait for processing to complete before generating FAQs.';
  }
  
  if (document.status === 'uploaded' || document.status === 'processed') {
    return 'Document content must be parsed first. Click the parse button to extract content before generating FAQs.';
  }
  
  // Default message for other states
  return 'Document is not ready for FAQ generation. Please ensure the document is parsed first.';
};

/**
 * Gets the effective FAQ status of a document, taking into account 
 * if it's currently generating FAQs.
 * 
 * @param document The document to check
 * @param faqGeneratingDocuments Set of document IDs currently generating FAQs
 * @returns The effective FAQ status to display in the UI
 */
export const getEffectiveFAQStatus = (
  document: Document, 
  faqGeneratingDocuments: Set<string>
): 'none' | 'generating' | 'available' | 'error' => {
  if (faqGeneratingDocuments.has(document.id)) {
    return 'generating';
  }
  
  if (isDocumentFAQGenerated(document)) {
    return 'available';
  }
  
  if (document.status === 'error' || document.status === 'failed') {
    return 'error';
  }
  
  return 'none';
};

/**
 * Determines if a document has questions generated and available.
 * 
 * @param document The document to check
 * @returns true if the document has questions generated
 */
export const isDocumentQuestionsGenerated = (document: Document): boolean => {
  return !!(
    document.questions_content ||
    document.questions_id ||
    document.questions_generated_at ||
    document.ai_questions  // Check ai_questions field from Firestore
  );
};

/**
 * Determines if questions operations (generate, view, edit) should be enabled
 * for a document based on its parse status and current state.
 * 
 * @param document The document to check
 * @returns true if questions operations should be enabled
 */
export const canPerformQuestionsOperations = (document: Document): boolean => {
  // Questions operations are only available for parsed documents
  // This ensures the document content has been extracted and is available for questions generation
  return document.status === 'parsed';
};

/**
 * Gets a human-readable message explaining why questions operations
 * are not available for a document.
 * 
 * @param document The document to check
 * @returns A message explaining the status, or null if operations are available
 */
export const getDocumentQuestionsStatusMessage = (document: Document): string | null => {
  if (canPerformQuestionsOperations(document)) {
    return null; // No message needed - document is ready for questions operations
  }
  
  if (document.status === 'error' || document.status === 'failed') {
    return 'Document has errors and cannot generate questions. Please re-upload the document.';
  }
  
  if (document.status === 'processing') {
    return 'Document is currently being processed. Please wait for processing to complete before generating questions.';
  }
  
  if (document.status === 'uploaded' || document.status === 'processed') {
    return 'Document content must be parsed first. Click the parse button to extract content before generating questions.';
  }
  
  // Default message for other states
  return 'Document is not ready for questions generation. Please ensure the document is parsed first.';
};

/**
 * Gets the effective questions status of a document, taking into account 
 * if it's currently generating questions.
 * 
 * @param document The document to check
 * @param questionsGeneratingDocuments Set of document IDs currently generating questions
 * @returns The effective questions status to display in the UI
 */
export const getEffectiveQuestionsStatus = (
  document: Document,
  questionsGeneratingDocuments: Set<string>
): 'none' | 'generating' | 'available' | 'error' => {
  if (questionsGeneratingDocuments.has(document.id)) {
    return 'generating';
  }

  if (isDocumentQuestionsGenerated(document)) {
    return 'available';
  }

  if (document.status === 'error' || document.status === 'failed') {
    return 'error';
  }

  return 'none';
};

/**
 * Determines if a document has been indexed in Gemini File Search store.
 *
 * @param document The document to check
 * @returns true if the document has been indexed
 */
export const isDocumentIndexed = (document: Document): boolean => {
  return !!document.indexed_at;
};
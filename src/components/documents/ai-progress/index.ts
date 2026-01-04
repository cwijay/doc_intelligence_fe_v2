/**
 * AI Progress Toast Module
 *
 * Generic progress toast factory for AI features.
 * Pre-configured exports for Summary, FAQ, and Questions.
 */

export {
  createProgressToast,
  summaryProgressToast,
  faqProgressToast,
  questionsProgressToast,
  type ProgressToastConfig,
  type ProgressToastApi,
} from './AIProgressToast';

// Legacy exports for backward compatibility - re-export with original function names
export {
  summaryProgressToast as showSummaryProgressToast,
  summaryProgressToast as updateSummaryProgressToast,
  summaryProgressToast as completeSummaryProgressToast,
  summaryProgressToast as errorSummaryProgressToast,
} from './AIProgressToast';

export {
  faqProgressToast as showFAQProgressToast,
  faqProgressToast as updateFAQProgressToast,
  faqProgressToast as completeFAQProgressToast,
  faqProgressToast as errorFAQProgressToast,
} from './AIProgressToast';

export {
  questionsProgressToast as showQuestionsProgressToast,
  questionsProgressToast as updateQuestionsProgressToast,
  questionsProgressToast as completeQuestionsProgressToast,
  questionsProgressToast as errorQuestionsProgressToast,
  questionsProgressToast as dismissQuestionsProgressToast,
} from './AIProgressToast';

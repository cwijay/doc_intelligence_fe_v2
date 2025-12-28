/**
 * Main API export file
 * Provides unified access to all API modules and utilities
 */

import api from './base';

// Export the base API instance as default
export default api;

// Import all API modules
import { authApi } from './auth';
import { organizationsApi } from './organizations';
import { usersApi } from './users';
import { foldersApi } from './folders';
import { documentsApi as documentsBasicApi } from './documents';
import { healthApi } from './health';
import { usageApi } from './usage';
import { summaryApi } from './ai-features/summary';
import { faqApi } from './ai-features/faq';
import { questionsApi } from './ai-features/questions';

// Export individual API modules
export { authApi };
export { organizationsApi };
export { usersApi };
export { foldersApi };
export { healthApi };
export { usageApi };

// Export AI features individually
export { summaryApi, faqApi, questionsApi };

// Create a combined documentsApi with AI features for backward compatibility
export const documentsApi = {
  ...documentsBasicApi,
  ...summaryApi,
  ...faqApi,
  ...questionsApi,
};

// Export utility modules
export { normalizeErrorMessage, createApiError, extractErrorMessage } from './utils/error-utils';
export {
  checkServiceHealth,
  runServiceDiagnostics,
  testApiConnection,
  checkSessionStatus,
  type HealthCheckResult,
  type ServiceDiagnosticResult,
  type SessionStatus,
} from './utils/diagnostics';
export { withBackendFallback } from './fallback';
export { adaptIngestParseResponse, isConnectionError } from './utils/parse-adapter';

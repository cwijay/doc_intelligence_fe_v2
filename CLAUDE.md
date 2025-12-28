# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Biz-To-Bricks is a document intelligence platform for small businesses, built with Next.js 16.0.10, React 19.2.3, TypeScript, and TailwindCSS 4.1.18. The application provides AI-powered document analysis, organization management, and JWT-based authentication with role-based access control.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Alternative development modes
npm run dev:turbo    # Explicit Turbopack mode
npm run dev:webpack  # Webpack mode (fallback)

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## Backend API Integration

The application integrates with two backend APIs using a simplified 2-URL configuration:
- **Main API** (`http://localhost:8000`): Core platform functionality (auth, documents, folders, users)
- **AI API** (`http://localhost:8001`): AI services (summaries, FAQs, questions, RAG chat, ingestion)

Environment variables should be configured in `.env.local`:
```env
# Simplified 2-URL configuration
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_AI_API_URL=http://localhost:8001

# Authentication
NEXT_PUBLIC_AUTH_ENABLED=true

# App Configuration
NEXT_PUBLIC_APP_NAME=Biz-To-Bricks
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## Architecture

### System Overview
```
                    ┌─────────────────────────┐
                    │     Next.js Frontend    │
                    │       (Port 3000)       │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
    ┌─────────────────┐  ┌─────────────┐  ┌─────────────┐
    │   Main API      │  │   AI API    │  │    GCS      │
    │   (:8000)       │  │   (:8001)   │  │  Storage    │
    │  • Auth         │  │  • Summary  │  │             │
    │  • CRUD         │  │  • FAQ      │  │             │
    │  • Parsing      │  │  • RAG Chat │  │             │
    └─────────────────┘  └─────────────┘  └─────────────┘
```

### Core Structure
- **Next.js App Router**: Modern app directory structure (`src/app/`) with React 19.2.3
- **Authentication**: JWT-based auth with Bearer tokens and automatic refresh
- **State Management**: TanStack Query for server state, React Context for auth/theme state
- **API Layer**: Centralized API client with Axios interceptors for token management
- **Configuration**: Centralized config in `src/lib/config.ts` with client/server separation
- **Type Safety**: Full TypeScript with shared types in `src/types/`
- **Theme System**: Dark mode support via ThemeContext (light/dark/system)

### Key Directories
- `src/app/` - Next.js app router pages with protected routes
- `src/components/` - Reusable UI components organized by feature
  - `documents/ai-modal/` - Modular AI content modal components
  - `documents/card/` - Reusable document card components
  - `editors/` - Rich text editor (TipTap-based)
- `src/lib/` - Core utilities (API client, auth, configuration)
  - `api/` - API client modules (base, ai-base, ingestion/)
  - `api/ai-features/` - AI feature modules (summary, faq, questions)
  - `api/ingestion/` - Document ingestion and RAG operations
- `src/hooks/` - Custom TanStack Query hooks for data fetching
  - `ai/` - Modular AI generation hooks (useSummary, useFAQ, useQuestions)
  - `rag/` - RAG-specific hooks (useRagChatConfig, useRagChatSession)
- `src/types/` - TypeScript type definitions for API and auth
- `src/contexts/` - React contexts (AuthContext, ThemeContext)

### Authentication & Route Protection
- JWT tokens with automatic refresh via Axios interceptors
- `AuthContext` provides global authentication state using useReducer
- `AuthGuard` component protects pages requiring authentication
- Middleware (`src/middleware.ts`) controls route access and security headers
- Tokens stored in localStorage via `AuthTokenManager`
- Role-based access: admin users can access organization settings and user management

### Data Fetching Architecture
- Custom hooks built on TanStack Query: `useAuth`, `useProfile`, `useOrganizations`, `useUsers`, `useFolders`, `useDocuments`, `useDocumentAI`
- API client (`src/lib/api.ts`) with request/response interceptors
- Modular API structure in `src/lib/api/` with feature-specific modules
- Profile system with fallback API pattern: `/api/v1/organizations/{org_id}/users/search/by-email/{email}` with `/auth/me` fallback

### Route Structure
Protected routes require authentication:
- `/dashboard` - Main dashboard with metrics
- `/profile` - User profile with organization details
- `/settings` - Comprehensive settings (Account/Organization/Application tabs)
- `/organizations` - Organization management
- `/users` - User management (admin-only)
- `/documents` - Document library with AI features
- `/folders` - Folder management

## Key Files to Understand

### Configuration & API
- `src/lib/config.ts` - Centralized configuration with 2-URL pattern (Main API + AI API)
- `src/lib/constants.ts` - Centralized constants (timeouts, storage keys, layout, API config)
- `src/lib/api/client-factory.ts` - Shared API client factory with interceptors (token injection, error handling)
- `src/lib/api/base.ts` - Main API client for port 8000 (uses client factory)
- `src/lib/api/ai-base.ts` - AI API client for port 8001 (uses client factory)
- `src/lib/api/ai-features/` - AI feature modules (summary.ts, faq.ts, questions.ts)
- `src/lib/api/ai-features/helpers.ts` - Shared AI feature utilities
- `src/lib/api/ingestion/` - Document ingestion and RAG operations
- `src/lib/api/utils/error-utils.ts` - Centralized error handling utilities

### State & Context
- `src/contexts/AuthContext.tsx` - Authentication state using useReducer pattern
- `src/contexts/ThemeContext.tsx` - Dark mode support (light/dark/system)
- `src/middleware.ts` - Route protection and security headers

### Hooks
- `src/hooks/useProfile.ts` - Profile data management with API fallback pattern
- `src/hooks/useDocumentAI.ts` - AI features integration (summary, FAQ, questions)
- `src/hooks/ai/` - Modular AI hooks (useSummaryGeneration, useFAQGeneration, useQuestionsGeneration)
- `src/hooks/rag/` - RAG hooks (useRagChatConfig, useRagChatSession, useSearchHistory)
- `src/hooks/useAIModalState.ts` - Shared state management for AI content modals
- `src/hooks/useSidebarState.ts` - Sidebar collapse/expand state
- `src/hooks/useTreeSelection.ts` - Folder tree selection state

### Components
- `src/components/guards/AuthGuard.tsx` - Route protection component
- `src/components/documents/DocumentAIContentModal.tsx` - Unified modal for all AI content types
- `src/components/documents/ai-modal/` - Modular AI modal views (SummaryView, FAQView, QuestionsView)
- `src/components/documents/DocumentTreeLayout.tsx` - Tree-based document browser
- `src/components/documents/DocumentTreeSidebar.tsx` - Collapsible folder sidebar
- `src/components/settings/SettingsPage.tsx` - Tab-based settings with role-based access
- `src/components/editors/RichTextEditor.tsx` - TipTap-based rich text editor

## Critical Implementation Details

### Configuration Management
- Client-side config in `clientConfig` (accessible in browser)
- Server-side config in `serverConfig` (server components only)
- Helper functions: `getApiUrl()`, `getApiBaseUrl()` for URL construction
- Local proxy support for development (`/api/backend` proxy path)

### Centralized Constants (`src/lib/constants.ts`)
All hardcoded values are centralized for maintainability:

```typescript
// API Timeouts (all 2 minutes)
TIMEOUTS.AI_API, TIMEOUTS.AUTH_API, TIMEOUTS.RAG_API, TIMEOUTS.BASE_API

// Storage Keys (localStorage)
STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.SIDEBAR_STATE, etc.

// Layout Constants
LAYOUT.NAVBAR_HEIGHT, LAYOUT.SIDEBAR.MIN_WIDTH, LAYOUT.BREAKPOINTS.XL

// File Configuration
FILE_EXTENSIONS.EXCEL, MIME_TYPES.PDF, UPLOAD_LIMITS.MAX_FILE_SIZE

// AI Generation Limits
AI_LIMITS.SUMMARY.MAX_WORDS, AI_LIMITS.FAQ.DEFAULT
```

### Authentication Flow
1. User logs in via `/login` with email/password
2. JWT tokens stored in localStorage via `AuthTokenManager`
3. Axios interceptors automatically add Bearer tokens to requests
4. Token refresh handled automatically on 401 responses
5. Context state managed via useReducer for predictable updates

### Settings System
Three main settings categories with role-based access:
- **Account Settings**: Profile, security, notifications (all users)
- **Organization Settings**: Company details, billing, team management (admin-only)
- **Application Settings**: Document preferences, storage, export options (all users)

## Testing the Backend Connection

Use the `testApiConnection()` function from `src/lib/api.ts` to verify backend connectivity before development.

## Document Processing Architecture

### Document Upload Flow
1. Documents must be uploaded to a folder (no root-level uploads allowed)
2. Folder name is resolved from folder ID before upload
3. Target path format: `{org_name}/original/{folder_name}/{file_name}`
4. Files are stored in GCS bucket: `biz-to-bricks-document-store`

### Document Parsing & AI Features
The application supports multiple AI-powered document operations:

#### Parsing Documents
- **Endpoint**: `POST /documents/parse`
- **Input**: Storage path from GCS bucket
- **Output**: Parsed text content with metadata (pages, headers, footers)

#### Saving Parsed Content
- **Endpoint**: `POST /documents/save-parsed` (NOT `/documents/{id}/content`)
- **Request Structure**:
  ```json
  {
    "target_path": "organization/parsed/folder/filename",
    "content": "edited content",
    "original_filename": "document.pdf",
    "metadata": {}
  }
  ```

#### AI Features (`src/lib/api/ai-features/`)
All AI features use a dedicated AI API client (`ai-base.ts`) connecting to port 8001.

**Endpoints** (via AI API on port 8001):
- **Summary Generation**: `POST /api/v1/documents/summarize`
- **FAQ Generation**: `POST /api/v1/documents/faqs`
- **Questions Generation**: `POST /api/v1/documents/questions`

**Request Format** (all AI endpoints use this structure):
```json
{
  "document_name": "Sample.pdf",
  "parsed_file_path": "Acme Corp/parsed/invoices/Sample.md",
  "max_words": 500,  // for summarize
  "num_faqs": 10,    // for FAQs
  "num_questions": 10, // for questions
  "session_id": "optional-session-id",
  "force": false  // bypass GCS cache
}
```

**Path Construction** (`parsed_file_path`):
- Format: `{org_name}/parsed/{folder_name}/{document_name}.md`
- Example: `Acme Corp/parsed/invoices/Sample.md`
- The `.md` extension is always used (parsed files are markdown)

### AI Features Integration (`useDocumentAI` Hook)

The `useDocumentAI` hook manages all AI-powered document features:

#### Summary Management
- **Generate**: `handleSummarize(document, options)`
- **Regenerate**: `handleSummaryRegenerate(options)`
- **Response**: `AISummarizeResponse` with `summary`, `word_count`, `cached`, `processing_time_ms`

#### FAQ Management
- **Generate**: `handleFaq(document, quantity)`
- **Regenerate**: `handleFaqRegenerate(options)`
- **Response**: `AIFAQsResponse` with `faqs[]`, `count`, `cached`, `processing_time_ms`

#### Questions Management
- **Generate**: `handleQuestions(document, quantity)`
- **Regenerate**: `handleQuestionsRegenerate(options)`
- **Response**: `AIQuestionsResponse` with `questions[]`, `difficulty_distribution`, `cached`

### Unified AI Content Modal

#### DocumentAIContentModal (`src/components/documents/DocumentAIContentModal.tsx`)
Consolidates Summary, FAQ, and Questions modals into a single reusable component.

- **Content Types**: `'summary' | 'faq' | 'questions'`
- **Features**: Three-tab interface (Content, Analysis, Options)
- **Regeneration Options**:
  - Summary: length (short/medium/long), format (bullets/paragraphs/executive)
  - FAQ: question_count, depth (basic/intermediate/advanced), format
  - Questions: question_count (1-20), custom prompt
- **Display Features**:
  - Expandable FAQ/Questions cards with chevron toggle
  - Markdown rendering with syntax highlighting
  - Difficulty badges for questions (easy/medium/hard)
  - Cache status and processing time indicators

#### useAIModalState Hook (`src/hooks/useAIModalState.ts`)
Shared hook for managing AI modal state across all content types:
- Tab navigation (content/metadata/actions)
- Edit mode with unsaved changes tracking
- Regeneration options management
- Save/regenerate handlers with loading states

### Error Handling Patterns

#### Axios Interceptors
- Automatically adds Bearer token to all requests
- Handles 401 responses by attempting token refresh
- Logs all requests/responses in development mode
- Network errors are caught and provide user-friendly messages

#### Common Error Patterns
```typescript
// API errors are handled with specific messages
if (error.response?.status === 404) {
  throw new Error('Document not found in storage');
} else if (error.response?.status === 401) {
  throw new Error('Authentication failed. Please log in again');
}
```

### Important Implementation Notes

1. **Folder Requirements**: Documents cannot be uploaded without selecting a folder. The API requires folder organization for security and structure.

2. **Folder Name Resolution**: When performing document operations (parse, save), the folder name must be resolved from the folder ID using the folders API.

3. **Token Management**: Access tokens are stored in localStorage via `AuthTokenManager`. The refresh mechanism is automatic through Axios interceptors.

4. **API Response Formats**: The backend uses snake_case for JSON fields, while the frontend types use camelCase. Conversion happens in the API layer.

5. **Document Status Flow**:
   - `uploaded` → Document uploaded
   - `processing` → Being parsed/analyzed
   - `processed` → Successfully processed
   - `error`/`failed` → Processing error

6. **AI Features Data Flow**:
   - Backend responses use `DocumentSummarizeResponse`, `DocumentFAQResponse`, `DocumentQuestionsResponse`
   - Frontend converts to `DocumentSummary`, `DocumentFAQ`, `DocumentQuestions` formats
   - All AI operations require proper authentication and organization context

## API Architecture

The application uses a simplified 2-URL configuration pattern:

### Primary APIs
- **Main API** (`NEXT_PUBLIC_API_URL` - port 8000):
  - Authentication (`/auth/*`)
  - Organizations (`/api/v1/organizations/*`)
  - Users (`/api/v1/organizations/{org_id}/users/*`)
  - Documents (`/api/v1/organizations/{org_id}/documents/*`)
  - Folders (`/api/v1/organizations/{org_id}/folders/*`)
  - Document parsing and saving

- **AI API** (`NEXT_PUBLIC_AI_API_URL` - port 8001):
  - Summary generation (`/api/v1/documents/summarize`)
  - FAQ generation (`/api/v1/documents/faqs`)
  - Questions generation (`/api/v1/documents/questions`)
  - RAG chat (`/api/v1/simple-rag`)
  - Document ingestion (`/api/v1/ingest`)
  - Excel chat

### API Clients
All API clients use the centralized client factory (`src/lib/api/client-factory.ts`) for consistent behavior:

- `src/lib/api/base.ts` - Main API client for port 8000
- `src/lib/api/ai-base.ts` - AI API client for port 8001
- `src/lib/api/ingestion/clients.ts` - RAG and ingestion clients

**Shared Features (via client factory):**
- 2-minute timeout for all API operations (configurable in `constants.ts`)
- Automatic Bearer token injection from localStorage
- Organization ID header (`X-Organization-ID`) where applicable
- Centralized error handling with user-friendly messages
- Request/response logging in development mode

### Local Development Proxy
- Development requests use `/api/backend` proxy to avoid CORS issues
- Controlled by `shouldUseLocalProxy()` in `src/lib/config.ts`
- Can be disabled with `NEXT_PUBLIC_DISABLE_API_PROXY=true`

## Debugging and Development

### Console Logging
- Extensive debug logging throughout the application
- Key logging patterns:
  - `🔍` - Data fetching and state updates
  - `✅` - Successful operations
  - `❌` - Errors and failures
  - `🔄` - Processing/loading states
  - `🛡️` - Authentication state changes
  - `🤖` - AI API requests/responses
  - `📝` - Summary generation
  - `❓` - FAQ generation
  - `📋` - Questions generation
  - `🚫` - AI operation failures

### Important Debugging Hook: `useDocumentAI`
- Contains comprehensive logging for AI feature operations
- Tracks data flow from API → hooks → modal components
- Logs include document name, parsed file path, and response metadata

### Authentication Debugging
- `AuthGuard` component logs authentication state transitions
- Token refresh operations logged via Axios interceptors
- Profile loading with fallback API patterns extensively logged

## Custom Hooks Architecture

### Core Data Hooks
- `useAuth()` - Authentication state and user information
- `useProfile()` - Enhanced profile data with organization details
- `useOrganizations()` - Organization management
- `useUsers()` - User management (admin only)
- `useFolders()` - Folder operations with document integration
- `useDocuments()` - Document management with AI features integration

### Modular AI Hooks (`src/hooks/ai/`)
- `useSummaryGeneration()` - Summary generation state and handlers
- `useFAQGeneration()` - FAQ generation state and handlers
- `useQuestionsGeneration()` - Questions generation state and handlers
- `useDocumentAI()` - Composed hook combining all AI generation hooks

### RAG Hooks (`src/hooks/rag/`)
- `useRagChatConfig()` - Search mode and filter configuration
- `useRagChatSession()` - Chat session state management
- `useSearchHistory()` - Search history tracking and persistence

### UI State Hooks
- `useSidebarState()` - Sidebar collapse/expand state
- `useTreeSelection()` - Folder tree selection management
- `useAIModalState()` - Shared state for AI content modals (tabs, editing, regeneration)

### Specialized Hooks
- `useDocumentActions()` - Document operations (parse, save, etc.)
- `useDocumentUpload()` - File upload with progress tracking
- `useExcelChat()` - Excel-specific chat functionality
- `useRagChat()` - RAG chat integration with Gemini semantic search
- `useIngestionJobs()` - Document ingestion job management
- `useFolderActions()` - Folder-specific operations
- `useAllDocuments()` - Cross-organization document access
- `useRecentActivity()` - Activity feed management

### Conversational RAG (`useRagChat` Hook)

The `useRagChat` hook (`src/hooks/useRagChat.ts`) manages conversational RAG with the unified DocumentAgent chat endpoint.

**State:**
```typescript
const {
  searchMode,        // 'semantic' | 'keyword' | 'hybrid'
  folderFilter,      // string | null
  fileFilter,        // string | null
  searchHistory,     // SearchHistoryItem[]
  // ...existing state
} = useRagChat();
```

**Actions:**
```typescript
// Send chat query to DocumentAgent (uses /api/v1/documents/chat)
sendGeminiSearch(query: string, options?: {
  searchMode?: GeminiSearchMode;
  folderName?: string;
  fileFilter?: string;
  maxSources?: number;
});

// View previous search from history
viewHistoryItem(item: SearchHistoryItem);

// Clear search history
clearHistory();

// Configuration setters
setSearchMode(mode: GeminiSearchMode);
setFolderFilter(folder: string | null);
setFileFilter(file: string | null);
```

**Search Scopes:**
| Scope | How to Use |
|-------|------------|
| Single File | Set `fileFilter` to file name |
| Folder | Set `folderFilter` to folder name |
| Org-wide | Leave both filters empty |

**Types** (`src/types/rag.ts`):
```typescript
type GeminiSearchMode = 'semantic' | 'keyword' | 'hybrid';

// Request for unified DocumentAgent chat
interface DocumentChatRequest {
  query: string;
  organization_name: string;
  session_id?: string;
  folder_filter?: string;
  file_filter?: string;
  search_mode?: GeminiSearchMode;
  max_sources?: number;
}

// Response from DocumentAgent chat
interface DocumentChatResponse {
  success: boolean;
  answer: string;
  citations: DocumentChatCitation[];
  session_id: string;
  processing_time_ms: number;
  search_mode: GeminiSearchMode;
}

interface DocumentChatCitation {
  text: string;
  file: string;
  relevance_score: number;
  folder_name?: string;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  response: string;
  citations: GeminiCitation[];
  timestamp: Date;
  filters: { folder?: string; file?: string; searchMode: GeminiSearchMode };
}
```

**API Client** (`src/lib/api/ingestion.ts`):
```typescript
// Unified DocumentAgent chat (calls /api/v1/documents/chat)
chatWithDocuments(request: DocumentChatRequest): Promise<DocumentChatResponse>

// Get org-specific store (for store management)
getOrgStore(): Promise<GeminiStoreInfo | null>
```

**UI Component** (`src/components/documents/RagChatModal.tsx`):
- Search mode toggle (Semantic/Keyword/Hybrid buttons)
- Folder dropdown filter
- File filter text input
- Search history panel with view/clear
- Answer display with citations

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.


      IMPORTANT: this context may or may not be relevant to your tasks. You should not respond to this context unless it is highly relevant to your task.
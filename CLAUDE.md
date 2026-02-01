# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev              # Start with Turbopack (default)
npm run dev:turbo        # Explicit Turbopack mode
npm run dev:webpack      # Webpack mode (fallback)

# Build & Production
npm run build            # Build for production
npm start                # Start production server

# Quality
npm run lint             # Run ESLint
npx tsc --noEmit         # Type checking

# API Types Generation (requires backends running)
npm run generate:types   # Generate types from both APIs
npm run generate:types:main  # Main API types only (port 8000)
npm run generate:types:ai    # AI API types only (port 8001)

# Deployment
npm run deploy:build     # GCP Cloud Build
npm run deploy:gcp       # Deploy via script
```

## Project Overview

Biz-To-Bricks is a document intelligence platform built with Next.js 16, React 19, TypeScript, and TailwindCSS 4. It provides AI-powered document analysis with JWT-based authentication and role-based access control.

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

### 2-URL API Configuration
- **Main API** (`NEXT_PUBLIC_API_URL` - port 8000): Auth, documents, folders, users, parsing
- **AI API** (`NEXT_PUBLIC_AI_API_URL` - port 8001): Summaries, FAQs, questions, RAG chat, ingestion, bulk upload, insights, usage tracking

### Core Patterns
- **Next.js App Router**: Modern app directory structure in `src/app/`
- **State Management**: TanStack Query for server state, React Context for auth/theme
- **API Layer**: Centralized Axios clients with interceptors in `src/lib/api/`
- **Authentication**: JWT with automatic refresh via Axios interceptors
- **Type Safety**: Full TypeScript with types in `src/types/`

## Key Directories

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/ai/            # AI API proxy routes
│   ├── api/documents/     # Document content proxy
│   └── documents/[documentId]/  # Dynamic document routes (summary, faq, chat, etc.)
├── components/            # React components by feature
│   ├── documents/         # Document UI (ai-modal, ai-content, chat, card)
│   ├── insights/          # Audit dashboard components
│   ├── usage/             # Usage tracking components
│   └── ui/                # Shared UI components
├── contexts/              # React contexts (AuthContext, ThemeContext)
├── hooks/                 # Custom hooks
│   ├── ai/                # AI generation hooks
│   └── rag/               # RAG chat hooks
├── lib/                   # Core utilities
│   ├── api/               # API clients (base, ai-base, client-factory)
│   │   ├── ai-features/   # Summary, FAQ, questions modules
│   │   └── ingestion/     # RAG and ingestion clients
│   ├── config.ts          # Centralized configuration
│   └── constants.ts       # Timeouts, storage keys, limits
└── types/                 # TypeScript definitions
```

## Critical Implementation Details

### Document Upload Requirements
1. **Documents must be uploaded to a folder** - no root-level uploads allowed
2. **Path format**: `{org_name}/original/{folder_name}/{file_name}`
3. **GCS bucket**: `biz-to-bricks-document-store`
4. **Folder resolution**: Folder name must be resolved from folder ID before operations

### AI Features Path Construction
All AI endpoints use `parsed_file_path` with format:
```
{org_name}/parsed/{folder_name}/{document_name}.md
```
The `.md` extension is always used for parsed files.

### API Response Format
- Backend uses `snake_case`, frontend uses `camelCase`
- Conversion handled in API layer
- All AI responses cached in GCS (use `force: true` to bypass)

### Authentication Flow
1. Login via `/login` with email/password
2. JWT tokens stored in localStorage via `AuthTokenManager`
3. Axios interceptors auto-inject Bearer tokens
4. 401 responses trigger automatic token refresh
5. Auth state managed via `AuthContext` with useReducer

### Document Status Flow
`uploaded` → `processing` → `processed` | `error`/`failed`

## Environment Configuration

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_AI_API_URL=http://localhost:8001
NEXT_PUBLIC_AUTH_ENABLED=true
NEXT_PUBLIC_APP_NAME=Biz-To-Bricks
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## Key Files

### Configuration
- `src/lib/config.ts` - 2-URL pattern configuration with client/server separation
- `src/lib/constants.ts` - Centralized constants (TIMEOUTS, STORAGE_KEYS, LAYOUT, AI_LIMITS)
- `src/lib/api/client-factory.ts` - Shared Axios client factory with interceptors

### API Clients
- `src/lib/api/base.ts` - Main API client (port 8000)
- `src/lib/api/ai-base.ts` - AI API client (port 8001)
- `src/lib/api/ai-features/` - Summary, FAQ, questions modules with shared helpers

### State Management
- `src/contexts/AuthContext.tsx` - Auth state with useReducer pattern
- `src/middleware.ts` - Route protection and security headers

### Core Hooks
| Hook | Purpose |
|------|---------|
| `useAuth()` | Authentication state and actions |
| `useProfile()` | Profile data with fallback API pattern |
| `useDocuments()` | Document CRUD with AI integration |
| `useFolders()` | Folder operations |
| `useDocumentAI()` | Combined AI generation (summary, FAQ, questions) |
| `useBulkUpload()` | Multi-file upload with job polling |
| `useInsights()` | Audit dashboard with 30s auto-refresh |
| `useUsageDashboard()` | Usage tracking and quotas |

### AI Hooks (`src/hooks/ai/`)
- `useAIGeneration.ts` - Generic factory hook for AI features
- `useSummaryGeneration.ts`, `useFAQGeneration.ts`, `useQuestionsGeneration.ts`
- `useAIContentPage.ts` - Page state for full-page AI views

### RAG Hooks (`src/hooks/rag/`)
- `useRagChatSession.ts` - Chat session state
- `useRagChatConfig.ts` - Search mode and filter config
- `useChatPage.ts` - Full-page chat state

## API Endpoints Reference

### Main API (port 8000)
- `POST /auth/login` - Authentication
- `GET /api/v1/organizations/{org_id}/documents/` - List documents
- `POST /documents/parse` - Parse document from GCS
- `POST /documents/save-parsed` - Save edited content (NOT `/documents/{id}/content`)

### AI API (port 8001)
- `POST /api/v1/documents/summarize` - Generate summary
- `POST /api/v1/documents/faqs` - Generate FAQs
- `POST /api/v1/documents/questions` - Generate questions
- `POST /api/v1/documents/chat` - RAG document chat
- `POST /api/v1/bulk/upload` - Bulk upload with AI processing
- `GET /api/v1/bulk/jobs/{jobId}` - Job status polling
- `GET /api/v1/audit/dashboard` - Insights dashboard
- `GET /api/v1/usage/summary` - Usage metrics

## Routes

### Protected Routes (require auth)
- `/dashboard` - Main dashboard
- `/documents` - Document library
- `/documents/[documentId]/summary` - AI summary view
- `/documents/[documentId]/faq` - AI FAQ view
- `/documents/[documentId]/questions` - AI questions view
- `/documents/[documentId]/chat` - RAG document chat
- `/documents/[documentId]/excel-chat` - Excel analysis chat
- `/documents/[documentId]/parse` - Document parsing/editing
- `/folders` - Folder management
- `/insights` - Audit dashboard
- `/usage` - Usage tracking
- `/settings` - Settings (Account/Organization/Application tabs)
- `/users` - User management (admin-only)

## Bulk Upload

### Workflow
1. Click "Bulk Upload" button (switches to bulk mode)
2. Select destination folder
3. Drag & drop files (up to 10, collected in `pendingFiles`)
4. Click "Start Bulk Upload" to begin

### Job Polling
- Poll interval: 5 seconds
- States: `pending` → `processing` → `completed`/`partial_failure`/`failed`

### Hook Usage
```typescript
const { upload, jobStatus, isPolling } = useBulkUpload({
  onComplete: (status) => console.log('Done:', status),
  onError: (error) => console.error(error),
});
```

## RAG Chat

### Search Modes
- `semantic` - Vector similarity search
- `keyword` - BM25 keyword matching
- `hybrid` - Combined search

### Search Scopes
| Scope | How to Use |
|-------|------------|
| Single File | Set `fileFilter` to filename |
| Folder | Set `folderFilter` to folder name |
| Org-wide | Leave both filters empty |

## Debug Logging

Console logging uses emoji prefixes:
- `🔍` Data fetching
- `✅` Success
- `❌` Errors
- `🤖` AI API calls
- `📝` Summary, `❓` FAQ, `📋` Questions
- `📊` Insights, `💰` Usage

## Testing Backend Connection

```typescript
import { testApiConnection } from '@/lib/api';
await testApiConnection(); // Verify backend connectivity
```

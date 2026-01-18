# Code Quality Findings Report

This document captures code quality findings from an analysis conducted on 2026-01-18.
These findings are preserved for future refactoring work.

## God Files (Deferred for Future Refactoring)

The following files exceed 300 lines and have multiple responsibilities. They are candidates for future refactoring but were not addressed in the initial cleanup due to scope and risk.

### High Priority (600+ lines)

| File | Lines | Responsibilities | Suggested Refactoring |
|------|-------|------------------|----------------------|
| `src/components/documents/DocumentTreeLayout.tsx` | ~700 | Tree view, document display, selection, actions | Split into TreeView, DocumentGrid, SelectionProvider |
| `src/components/documents/excel-chat/ExcelChatPage.tsx` | ~795 | Chat UI, message handling, markdown rendering | Extract MessageList, ChatInput, MarkdownRenderer components |
| `src/hooks/useExcelChat.ts` | ~498 | Chat state, API calls, response parsing | Split API calls to service, parsing to utility |

### Medium Priority (400-600 lines)

| File | Lines | Responsibilities | Suggested Refactoring |
|------|-------|------------------|----------------------|
| `src/lib/api/excel.ts` | ~442 | API client, types, validation, utilities | Split types to types file, validation to utils |
| `src/components/documents/chat/ChatPage.tsx` | ~500+ | RAG chat UI, state, rendering | Similar to ExcelChatPage refactoring |
| `src/components/settings/SettingsPage.tsx` | ~400+ | Multiple settings tabs, forms | Extract individual tab components |

### Lower Priority (300-400 lines)

| File | Lines | Responsibilities | Suggested Refactoring |
|------|-------|------------------|----------------------|
| `src/lib/api/client-factory.ts` | ~336 | Factory, interceptors, configs | Configs could be in separate file |
| `src/lib/api/utils/error-utils.ts` | ~378 | Multiple error handling utilities | Consider splitting by error type |
| `src/components/documents/ai-modal/*.tsx` | 300+ | AI view components | Generally well-structured but large |

## Recommended Refactoring Approach

### For Large Components (TreeLayout, ChatPages)
1. Extract reusable sub-components to separate files
2. Create custom hooks for complex state management
3. Move business logic to services/utilities
4. Consider using React Context for deeply nested state

### For API/Service Files
1. Move types to dedicated type files
2. Extract validation functions to utility modules
3. Consider splitting by feature domain

### For Hook Files
1. Separate API calls from state management
2. Create smaller, composable hooks
3. Move complex parsing/transformation to utilities

## Issues Addressed in Cleanup

The following issues were fixed in the associated cleanup:

### Hardcoded Values Fixed
- `src/lib/api/rag.ts:20` - timeout: 15000 → TIMEOUTS.RAG_FAST
- `src/lib/api/excel.ts:13` - timeout: 600000 → TIMEOUTS.EXCEL_CHAT
- `src/lib/api/excel.ts:271` - timeout: 300 → TIMEOUTS.EXCEL_ANALYSIS
- `src/hooks/useExcelChat.ts:283` - timeout: 300 → TIMEOUTS.EXCEL_ANALYSIS
- `src/components/documents/excel-chat/ExcelChatPage.tsx:334` - timeout: 300 → TIMEOUTS.EXCEL_ANALYSIS

### Dead Code Removed
- `src/lib/api/utils/path-utils.ts` - All functions deprecated, file removed
- `src/lib/utils/rag-paths.ts` - Deprecated functions removed
- `src/lib/api/ingestion.ts` - Deprecated re-export file removed
- `src/lib/api/client-factory.ts:292` - Deprecated AI_API_CONFIG removed

### Duplicated Code Consolidated
- Added `extractFormError()` utility to `src/lib/api/utils/error-utils.ts`
- Refactored `AddUserModal.tsx` and `EditUserModal.tsx` to use shared utility

## Notes for Future Work

1. **Testing**: Any refactoring of god files should be accompanied by comprehensive testing
2. **Incremental**: Tackle one file at a time to minimize risk
3. **Backwards Compatibility**: Consider re-exports for any public API changes
4. **Type Safety**: Maintain or improve TypeScript coverage during refactoring

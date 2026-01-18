'use client';

import { use, Suspense } from 'react';
import AuthGuard from '@/components/guards/AuthGuard';
import AppLayout from '@/components/layout/AppLayout';
import { ExcelChatPage } from '@/components/documents/excel-chat';
import { useExcelChatPage } from '@/hooks/useExcelChatPage';

// =============================================================================
// Types
// =============================================================================

interface ExcelChatPageRouteProps {
  params: Promise<{
    documentId: string;
  }>;
}

// =============================================================================
// Page Content Component
// =============================================================================

interface ExcelChatPageContentProps {
  documentId: string;
}

function ExcelChatPageContent({ documentId }: ExcelChatPageContentProps) {
  const pageState = useExcelChatPage(documentId);

  const pageTitle = pageState.documents.length > 0
    ? `Excel Chat: ${pageState.documents[0].name}`
    : 'Excel Analysis Chat';

  return (
    <AppLayout
      noPadding
      hideSidebar
      pageTitle={pageTitle}
    >
      <ExcelChatPage documentId={documentId} />
    </AppLayout>
  );
}

// =============================================================================
// Loading Fallback
// =============================================================================

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-brand-navy-700">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-brand-coral-500 mb-4" />
      <p className="text-gray-600 dark:text-gray-400">Loading Excel chat...</p>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function ExcelChatPageRoute({ params }: ExcelChatPageRouteProps) {
  const resolvedParams = use(params);
  const { documentId } = resolvedParams;

  return (
    <AuthGuard>
      <Suspense fallback={<LoadingFallback />}>
        <ExcelChatPageContent documentId={documentId} />
      </Suspense>
    </AuthGuard>
  );
}

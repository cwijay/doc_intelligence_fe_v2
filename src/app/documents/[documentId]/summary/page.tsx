'use client';

import { use, Suspense } from 'react';
import AuthGuard from '@/components/guards/AuthGuard';
import AppLayout from '@/components/layout/AppLayout';
import { AIContentPage } from '@/components/documents/ai-content';
import { useAIContentPage } from '@/hooks/ai/useAIContentPage';

// =============================================================================
// Types
// =============================================================================

interface SummaryPageProps {
  params: Promise<{
    documentId: string;
  }>;
}

// =============================================================================
// Page Content Component
// =============================================================================

interface SummaryPageContentProps {
  documentId: string;
}

function SummaryPageContent({ documentId }: SummaryPageContentProps) {
  const pageState = useAIContentPage(documentId, 'summary');

  return (
    <AppLayout
      noPadding
      hideSidebar
      pageTitle={pageState.document ? `Summary: ${pageState.document.name}` : 'Document Summary'}
    >
      <AIContentPage documentId={documentId} contentType="summary" />
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
      <p className="text-gray-600 dark:text-gray-400">Loading summary...</p>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function SummaryPage({ params }: SummaryPageProps) {
  const resolvedParams = use(params);
  const { documentId } = resolvedParams;

  return (
    <AuthGuard>
      <Suspense fallback={<LoadingFallback />}>
        <SummaryPageContent documentId={documentId} />
      </Suspense>
    </AuthGuard>
  );
}

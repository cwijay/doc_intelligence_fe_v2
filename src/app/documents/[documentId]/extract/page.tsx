'use client';

import { use, Suspense } from 'react';
import AuthGuard from '@/components/guards/AuthGuard';
import AppLayout from '@/components/layout/AppLayout';
import { ExtractionPage } from '@/components/documents/extraction/ExtractionPage';
import { useExtractionPage } from '@/hooks/extraction/useExtractionPage';

// =============================================================================
// Types
// =============================================================================

interface ExtractPageProps {
  params: Promise<{
    documentId: string;
  }>;
}

// =============================================================================
// Page Content Component
// =============================================================================

interface ExtractPageContentProps {
  documentId: string;
}

function ExtractPageContent({ documentId }: ExtractPageContentProps) {
  const pageState = useExtractionPage(documentId);

  return (
    <AppLayout
      noPadding
      hideSidebar
      pageTitle={pageState.document ? `Extract: ${pageState.document.name}` : 'Extract Data'}
    >
      <ExtractionPage pageState={pageState} />
    </AppLayout>
  );
}

// =============================================================================
// Loading Fallback
// =============================================================================

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-brand-navy-700">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-500 mb-4" />
      <p className="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function ExtractPage({ params }: ExtractPageProps) {
  const resolvedParams = use(params);
  const { documentId } = resolvedParams;

  return (
    <AuthGuard>
      <Suspense fallback={<LoadingFallback />}>
        <ExtractPageContent documentId={documentId} />
      </Suspense>
    </AuthGuard>
  );
}

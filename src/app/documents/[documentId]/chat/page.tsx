'use client';

import { use, Suspense } from 'react';
import AuthGuard from '@/components/guards/AuthGuard';
import AppLayout from '@/components/layout/AppLayout';
import { ChatPage } from '@/components/documents/chat';
import { useChatPage } from '@/hooks/rag/useChatPage';

// =============================================================================
// Types
// =============================================================================

interface ChatPageRouteProps {
  params: Promise<{
    documentId: string;
  }>;
}

// =============================================================================
// Page Content Component
// =============================================================================

interface ChatPageContentProps {
  documentId: string;
}

function ChatPageContent({ documentId }: ChatPageContentProps) {
  const pageState = useChatPage(documentId);

  return (
    <AppLayout
      noPadding
      hideSidebar
      pageTitle={pageState.document ? `Chat: ${pageState.document.name}` : 'Document Chat'}
    >
      <ChatPage documentId={documentId} />
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
      <p className="text-gray-600 dark:text-gray-400">Loading chat...</p>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

export default function ChatPageRoute({ params }: ChatPageRouteProps) {
  const resolvedParams = use(params);
  const { documentId } = resolvedParams;

  return (
    <AuthGuard>
      <Suspense fallback={<LoadingFallback />}>
        <ChatPageContent documentId={documentId} />
      </Suspense>
    </AuthGuard>
  );
}

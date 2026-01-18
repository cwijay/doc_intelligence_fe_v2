'use client';

import { use } from 'react';
import AuthGuard from '@/components/guards/AuthGuard';
import AppLayout from '@/components/layout/AppLayout';
import { ParseResultsPage } from '@/components/documents/parse';

interface ParsePageProps {
  params: Promise<{
    documentId: string;
  }>;
}

export default function ParsePage({ params }: ParsePageProps) {
  const resolvedParams = use(params);
  const { documentId } = resolvedParams;

  return (
    <AuthGuard>
      <ParsePageContent documentId={documentId} />
    </AuthGuard>
  );
}

interface ParsePageContentProps {
  documentId: string;
}

function ParsePageContent({ documentId }: ParsePageContentProps) {
  return (
    <AppLayout
      noPadding
      hideSidebar
      pageTitle="Parse Results"
    >
      <ParseResultsPage documentId={documentId} />
    </AppLayout>
  );
}

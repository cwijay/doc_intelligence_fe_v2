'use client';

import AuthGuard from '@/components/guards/AuthGuard';
import DocumentTreeLayout from '@/components/documents/DocumentTreeLayout';

export default function DocumentsPage() {
  return (
    <AuthGuard>
      <DocumentTreeLayout />
    </AuthGuard>
  );
}
'use client';

import AuthGuard from '@/components/guards/AuthGuard';
import UsagePage from '@/components/usage/UsagePage';

export default function Usage() {
  return (
    <AuthGuard>
      <UsagePage />
    </AuthGuard>
  );
}

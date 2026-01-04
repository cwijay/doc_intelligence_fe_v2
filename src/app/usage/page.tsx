'use client';

import AuthGuard from '@/components/guards/AuthGuard';
import UsagePage from '@/components/usage/UsagePage';

export default function Usage() {
  console.log('📊 /usage route: Component rendering');
  return (
    <AuthGuard>
      <UsagePage />
    </AuthGuard>
  );
}

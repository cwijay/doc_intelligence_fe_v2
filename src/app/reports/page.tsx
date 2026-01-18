'use client';

import AuthGuard from '@/components/guards/AuthGuard';
import ReportsPage from '@/components/reports/ReportsPage';

export default function Reports() {
  console.log('📊 /reports route: Component rendering');
  return (
    <AuthGuard>
      <ReportsPage />
    </AuthGuard>
  );
}

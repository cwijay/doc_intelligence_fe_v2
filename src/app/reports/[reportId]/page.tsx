'use client';

import AuthGuard from '@/components/guards/AuthGuard';
import { ReportDetailPage } from '@/components/reports';

export default function ReportDetail() {
  console.log('📊 /reports/[reportId] route: Component rendering');
  return (
    <AuthGuard>
      <ReportDetailPage />
    </AuthGuard>
  );
}

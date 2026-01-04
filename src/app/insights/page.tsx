'use client';

import AuthGuard from '@/components/guards/AuthGuard';
import { InsightsPage } from '@/components/insights';

export default function Insights() {
  console.log('📊 /insights route: Component rendering');
  return (
    <AuthGuard>
      <InsightsPage />
    </AuthGuard>
  );
}

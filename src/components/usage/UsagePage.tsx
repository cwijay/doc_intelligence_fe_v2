'use client';

import Link from 'next/link';
import {
  ChartPieIcon,
  HomeIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import { AppLayout } from '@/components/layout';
import { UsageDashboard } from './UsageDashboard';

export default function UsagePage() {
  console.log('📊 UsagePage: Component rendering');
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-secondary-600 dark:text-secondary-400 mb-6">
          <Link
            href="/dashboard"
            className="flex items-center space-x-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
          >
            <HomeIcon className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <ChevronLeftIcon className="w-4 h-4 rotate-180" />
          <span className="text-secondary-900 dark:text-secondary-100 font-medium">Usage</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-secondary-100 flex items-center space-x-3">
            <ChartPieIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            <span>Usage & Billing</span>
          </h1>
          <p className="text-secondary-600 dark:text-secondary-400 mt-2">
            Monitor your API usage, quotas, and subscription details
          </p>
        </div>

        {/* Usage Dashboard */}
        <UsageDashboard />
      </div>
    </AppLayout>
  );
}

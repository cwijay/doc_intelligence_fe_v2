'use client';

import Link from 'next/link';
import {
  ChartPieIcon,
  HomeIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';

export default function UsagePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f5f5] via-[#f0fafa] to-[#fef6f3] dark:from-brand-navy-500 dark:via-brand-navy-600 dark:to-brand-navy-700">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
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
              <span>Usage Summary</span>
            </h1>
            <p className="text-secondary-600 dark:text-secondary-400 mt-2">
              View your API usage and subscription details
            </p>
          </div>

          {/* Simple content */}
          <div className="bg-white dark:bg-secondary-800 rounded-lg shadow p-6">
            <p className="text-secondary-700 dark:text-secondary-300">
              Welcome, {user?.full_name || 'User'}! Your organization ID is: {user?.org_id || 'N/A'}
            </p>
            <p className="text-secondary-500 dark:text-secondary-400 mt-2 text-sm">
              Usage data will be displayed here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

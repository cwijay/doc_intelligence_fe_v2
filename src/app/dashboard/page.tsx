'use client';

import React from 'react';
import {
  DocumentTextIcon,
  BoltIcon,
  ChartBarIcon,
  CircleStackIcon,
  SparklesIcon,
  PlusIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AuthGuard from '@/components/guards/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentStats } from '@/hooks/useFolders';
import { useActivityTimeline } from '@/hooks/useInsights';
import { useUsageSummary } from '@/hooks/useUsageHistory';
import { formatFileSize } from '@/lib/file-utils';
import { ActivityTimeline, ActivityTimelineSkeleton } from '@/components/insights/ActivityTimeline';
import { useCapabilitiesModal } from '@/hooks/useCapabilitiesModal';
import { CapabilitiesModal } from '@/components/ui/CapabilitiesModal';

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const organizationId = user?.org_id || '';
  const capabilitiesModal = useCapabilitiesModal();

  // Fetch document stats for document count
  const { data: documentStats, isLoading: statsLoading, error: statsError } = useDocumentStats(
    organizationId,
    !!organizationId // only fetch if we have an organization ID
  );

  // Fetch recent activity data from audit endpoint
  const { data: activityData, isLoading: activitiesLoading, error: activitiesError } = useActivityTimeline(
    { limit: 10 },
    !!organizationId // only fetch if we have an organization ID
  );

  // Fetch usage summary for API usage card
  const { data: usageSummary, isLoading: usageLoading, error: usageError } = useUsageSummary(
    !!organizationId
  );


  // Helper to format large numbers (1000 → 1K, 1000000 → 1M)
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Debug: Log stats data (can be removed in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Dashboard data:', {
      organizationId,
      statsLoading,
      statsError: statsError?.message,
      totalDocuments: documentStats?.total_documents,
      storageUsedBytes: documentStats?.storage_used,
      storageUsedFormatted: documentStats?.storage_used ? formatFileSize(documentStats.storage_used) : 'N/A',
      activitiesLoading,
      activitiesError: activitiesError?.message,
      activitiesCount: activityData?.activities?.length || 0,
      usageLoading,
      usageError: usageError?.message,
      tokensUsed: usageSummary?.tokens_used,
      tokensLimit: usageSummary?.tokens_limit,
      tokensPercentage: usageSummary?.tokens_percentage,
      storageLimitGb: usageSummary?.storage_limit_gb
    });
  }

  // Dynamic stats array with real data
  const stats = [
    { 
      name: 'Documents', 
      value: statsLoading ? '...' : (statsError ? 'Error' : (documentStats?.total_documents || 0).toString()),
      change: statsLoading ? 'Loading...' : (statsError ? 'API Error' : `${documentStats?.total_documents ? '+' : ''}${documentStats?.total_documents || 0}`),
      changeType: statsError ? 'decrease' as const : 'increase' as const,
      icon: DocumentTextIcon,
      description: statsLoading ? 'Loading document data...' : (statsError ? 'Unable to load document data from API' : 'Documents in your organization'),
      link: '/documents'
    },
    {
      name: 'API Usage',
      value: usageLoading ? '...' : (usageError ? 'Error' : formatNumber(usageSummary?.tokens_used || 0)),
      change: (() => {
        if (usageLoading) return 'Loading...';
        if (usageError) return 'API Error';
        const pct = usageSummary?.tokens_percentage || 0;
        if (pct === 0) return '0%';
        if (pct < 1) return '< 1%';
        return `${Math.round(pct)}%`;
      })(),
      changeType: (usageSummary?.tokens_percentage || 0) > 80 ? 'decrease' as const : 'increase' as const,
      icon: BoltIcon,
      description: usageLoading ? 'Loading usage data...' : (usageError ? 'Unable to load usage data' : `${formatNumber(usageSummary?.tokens_used || 0)} / ${formatNumber(usageSummary?.tokens_limit || 0)} tokens`),
      link: '/usage'
    },
    {
      name: 'Storage',
      value: statsLoading ? '...' : (statsError ? 'Error' : formatFileSize(documentStats?.storage_used || 0)),
      change: (() => {
        if (statsLoading || usageLoading) return 'Loading...';
        if (statsError) return 'API Error';
        const limitBytes = (usageSummary?.storage_limit_gb || 5) * 1024 * 1024 * 1024;
        const pct = ((documentStats?.storage_used || 0) / limitBytes) * 100;
        if (pct === 0) return '0%';
        if (pct < 1) return '< 1%';
        return `${Math.round(pct)}%`;
      })(),
      changeType: (() => {
        const limitBytes = (usageSummary?.storage_limit_gb || 5) * 1024 * 1024 * 1024;
        const pct = ((documentStats?.storage_used || 0) / limitBytes) * 100;
        return pct > 80 ? 'decrease' as const : 'increase' as const;
      })(),
      icon: CircleStackIcon,
      description: statsLoading ? 'Loading storage data...' : (statsError ? 'Unable to load storage data' : `${formatFileSize(documentStats?.storage_used || 0)} / ${usageSummary?.storage_limit_gb || 5} GB`),
      link: '/usage'
    },
  ];

  const handleStatClick = (link?: string) => {
    if (link) {
      router.push(link);
    }
  };


  const handleUploadDocument = () => {
    router.push('/documents');
  };

  const handleViewReports = () => {
    router.push('/documents');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f5f5] via-[#f0fafa] to-[#fef6f3] dark:from-brand-navy-500 dark:via-brand-navy-600 dark:to-brand-navy-700 transition-colors duration-200">
      <Navbar />

      {/* Gradient Header - Brand Colors */}
      <div className="bg-gradient-to-br from-brand-navy-500 via-brand-cyan-400 to-brand-coral-500 dark:from-brand-navy-600 dark:via-brand-cyan-500 dark:to-brand-coral-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="animate-fade-in">
            <h1 className="text-3xl font-poppins font-bold text-white mb-2">
              Organization Dashboard
            </h1>
            <p className="text-lg text-primary-100">
              Manage your organization&apos;s documents and settings
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={stat.name}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Card
                className={`relative overflow-hidden group transition-all duration-300 ${
                  stat.link ? 'hover:shadow-medium dark:hover:shadow-dark-medium cursor-pointer hover:scale-[1.02]' : 'hover:shadow-medium dark:hover:shadow-dark-medium'
                }`}
                onClick={() => handleStatClick(stat.link)}
              >
                {/* Decorative gradient orb */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/10 dark:bg-primary-400/10 rounded-full blur-2xl group-hover:bg-primary-500/20 dark:group-hover:bg-primary-400/20 transition-all duration-300" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg group-hover:bg-primary-200 dark:group-hover:bg-primary-800/50 transition-colors duration-200">
                        <stat.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-poppins font-bold text-secondary-900 dark:text-secondary-100">
                          {stat.value}
                        </p>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400">{stat.name}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      stat.changeType === 'increase'
                        ? 'bg-success-100 dark:bg-success-900/40 text-success-800 dark:text-success-300'
                        : 'bg-error-100 dark:bg-error-900/40 text-error-800 dark:text-error-300'
                    }`}>
                      {stat.change}
                    </div>
                  </div>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2">{stat.description}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <ChartBarIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <span>Recent Activity</span>
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => router.push('/insights?tab=activity')}>
                    View All
                  </Button>
                </CardTitle>
                <CardDescription>
                  Latest document processing and organizational updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activitiesLoading ? (
                  <ActivityTimelineSkeleton />
                ) : activitiesError ? (
                  <div className="text-center py-8">
                    <p className="text-error-600 dark:text-error-400 text-sm">Failed to load recent activities</p>
                  </div>
                ) : !activityData?.activities || activityData.activities.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-secondary-500 dark:text-secondary-400 text-sm">No recent activities found</p>
                  </div>
                ) : (
                  <ActivityTimeline activities={activityData.activities} />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PlusIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <span>Quick Actions</span>
                </CardTitle>
                <CardDescription>
                  Common tasks for your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    icon={<DocumentTextIcon className="w-4 h-4" />}
                    onClick={handleUploadDocument}
                  >
                    Upload Document
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    icon={<ChartBarIcon className="w-4 h-4" />}
                    onClick={handleViewReports}
                  >
                    View Reports
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className="bg-gradient-to-br from-brand-navy-500 via-brand-cyan-400 to-brand-coral-500 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <SparklesIcon className="w-6 h-6 text-white/90" />
                  <h3 className="text-lg font-poppins font-semibold">Transform Your Documents</h3>
                </div>
                <p className="text-white/90 text-sm mb-4">
                  Unlock AI-powered summaries, FAQs, smart search, and conversational RAG - all powered by Google Gemini and enterprise-grade security.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ArrowRightIcon className="w-4 h-4" />}
                  iconPosition="right"
                  onClick={capabilitiesModal.open}
                >
                  Explore Features
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Capabilities Modal */}
      <CapabilitiesModal
        isOpen={capabilitiesModal.isOpen}
        onClose={capabilitiesModal.close}
      />
    </div>
  );
}
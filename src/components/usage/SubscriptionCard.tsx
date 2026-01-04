'use client';

import { clsx } from 'clsx';
import { SubscriptionResponse } from '@/types/usage';
import { SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface SubscriptionCardProps {
  subscription: SubscriptionResponse;
}

const tierColors: Record<string, { badge: string; border: string }> = {
  free: {
    badge: 'bg-secondary-100 dark:bg-secondary-700 text-secondary-800 dark:text-secondary-200',
    border: 'border-secondary-200 dark:border-secondary-700',
  },
  pro: {
    badge: 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300',
    border: 'border-primary-200 dark:border-primary-700',
  },
  enterprise: {
    badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-700',
  },
};

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const tier = subscription.tier?.toLowerCase() || 'free';
  const colors = tierColors[tier] || tierColors.free;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  return (
    <div
      className={clsx(
        'rounded-xl border bg-white dark:bg-secondary-800 overflow-hidden',
        colors.border
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-secondary-100 dark:border-secondary-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-primary-500" />
            <h3 className="font-semibold text-secondary-900 dark:text-secondary-100">
              Subscription
            </h3>
          </div>
          <span
            className={clsx('px-2.5 py-1 rounded-full text-xs font-medium', colors.badge)}
          >
            {subscription.tier_display_name || 'Free'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Price */}
        <div>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">Monthly Price</p>
          <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            {subscription.monthly_price_usd === 0 ? (
              'Free'
            ) : (
              <>
                ${subscription.monthly_price_usd.toFixed(0)}
                <span className="text-sm font-normal text-secondary-500">/mo</span>
              </>
            )}
          </p>
        </div>

        {/* Limits Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-0.5">
            <p className="text-secondary-500 dark:text-secondary-400">Tokens</p>
            <p className="font-medium text-secondary-900 dark:text-secondary-100">
              {formatNumber(subscription.monthly_token_limit)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-secondary-500 dark:text-secondary-400">Parse Pages</p>
            <p className="font-medium text-secondary-900 dark:text-secondary-100">
              {formatNumber(subscription.monthly_llamaparse_pages)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-secondary-500 dark:text-secondary-400">Search Queries</p>
            <p className="font-medium text-secondary-900 dark:text-secondary-100">
              {formatNumber(subscription.monthly_file_search_queries)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-secondary-500 dark:text-secondary-400">Storage</p>
            <p className="font-medium text-secondary-900 dark:text-secondary-100">
              {subscription.storage_gb_limit} GB
            </p>
          </div>
        </div>

        {/* Status */}
        {subscription.status && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
            <span className="text-secondary-600 dark:text-secondary-400 capitalize">
              {subscription.status}
            </span>
          </div>
        )}

        {/* Upgrade Button */}
        {tier !== 'enterprise' && (
          <button className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors duration-200">
            Upgrade Plan
          </button>
        )}
      </div>
    </div>
  );
}

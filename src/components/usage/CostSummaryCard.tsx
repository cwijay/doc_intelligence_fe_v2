'use client';

import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface CostSummaryCardProps {
  totalCost: number;
  periodLabel: string;
  breakdown?: { name: string; cost: number }[];
}

export function CostSummaryCard({ totalCost, periodLabel, breakdown }: CostSummaryCardProps) {
  // Sort breakdown by cost descending
  const sortedBreakdown = breakdown
    ? [...breakdown].sort((a, b) => b.cost - a.cost).slice(0, 5)
    : [];

  return (
    <div className="rounded-xl border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-secondary-100 dark:border-secondary-700">
        <div className="flex items-center gap-2">
          <CurrencyDollarIcon className="w-5 h-5 text-green-500" />
          <h3 className="font-semibold text-secondary-900 dark:text-secondary-100">
            Cost Summary
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Total Cost */}
        <div>
          <p className="text-xs text-secondary-500 dark:text-secondary-400">{periodLabel}</p>
          <p className="text-3xl font-bold text-secondary-900 dark:text-secondary-100">
            ${totalCost.toFixed(2)}
          </p>
        </div>

        {/* Breakdown */}
        {sortedBreakdown.length > 0 && (
          <div className="border-t border-secondary-100 dark:border-secondary-700 pt-4 space-y-2.5">
            <p className="text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wide">
              By Feature
            </p>
            {sortedBreakdown.map((item) => (
              <div
                key={item.name}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-secondary-600 dark:text-secondary-400 truncate flex-1 mr-2">
                  {item.name}
                </span>
                <span className="font-medium text-secondary-900 dark:text-secondary-100">
                  ${item.cost.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}

        {sortedBreakdown.length === 0 && (
          <p className="text-sm text-secondary-500 dark:text-secondary-400">
            No cost breakdown available
          </p>
        )}
      </div>
    </div>
  );
}

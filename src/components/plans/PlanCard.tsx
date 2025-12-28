'use client';

import { clsx } from 'clsx';
import { CheckIcon, StarIcon } from '@heroicons/react/24/solid';
import { PlanInfo } from '@/lib/plans';
import { PlanType } from '@/types/api';

interface PlanCardProps {
  plan: PlanInfo;
  selected: boolean;
  onSelect: (planId: PlanType) => void;
  onViewDetails?: () => void;
}

export default function PlanCard({ plan, selected, onSelect, onViewDetails }: PlanCardProps) {
  return (
    <div
      onClick={() => onSelect(plan.id)}
      className={clsx(
        'relative flex flex-col p-4 rounded-xl cursor-pointer transition-all duration-200',
        'border-2',
        selected
          ? 'border-brand-cyan-400 bg-brand-cyan-50/50 dark:bg-brand-cyan-900/20 shadow-lg ring-2 ring-brand-cyan-400/30'
          : 'border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 hover:border-brand-cyan-300 dark:hover:border-brand-cyan-600 hover:shadow-md'
      )}
    >
      {/* Popular Badge */}
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-brand-coral-500 text-white shadow-sm">
            <StarIcon className="w-3 h-3" />
            POPULAR
          </span>
        </div>
      )}

      {/* Selection Indicator */}
      {selected && (
        <div className="absolute top-3 right-3">
          <div className="w-6 h-6 rounded-full bg-brand-cyan-500 flex items-center justify-center">
            <CheckIcon className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Plan Name & Price */}
      <div className={clsx('text-center', plan.highlighted && 'mt-2')}>
        <h3 className="text-lg font-bold text-secondary-900 dark:text-secondary-100">
          {plan.name}
        </h3>
        <div className="mt-1">
          {plan.monthlyPrice === 0 ? (
            <span className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">Free</span>
          ) : (
            <>
              <span className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                ${plan.monthlyPrice}
              </span>
              <span className="text-sm text-secondary-500 dark:text-secondary-400">/mo</span>
            </>
          )}
        </div>
      </div>

      {/* Key Features */}
      <ul className="mt-4 space-y-2">
        {plan.keyFeatures.map((feature, index) => (
          <li key={index} className="flex items-center text-sm text-secondary-600 dark:text-secondary-400">
            <CheckIcon className="w-4 h-4 mr-2 text-brand-cyan-500 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      {/* View Details Link */}
      {onViewDetails && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
          className="mt-4 text-sm font-medium text-brand-cyan-600 dark:text-brand-cyan-400 hover:text-brand-cyan-700 dark:hover:text-brand-cyan-300 transition-colors"
        >
          View details
        </button>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { CheckIcon, XMarkIcon, StarIcon } from '@heroicons/react/24/solid';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { PLANS, PLAN_FEATURES, PLAN_LIMITS_LABELS, PlanLimit, PlanInfo } from '@/lib/plans';
import { PlanType } from '@/types/api';

interface PlanComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: PlanType;
  onSelectPlan: (planId: PlanType) => void;
  /** Optional plans to display - defaults to hardcoded PLANS if not provided */
  plans?: PlanInfo[];
}

type TabType = 'limits' | 'features';

export default function PlanComparisonModal({
  isOpen,
  onClose,
  selectedPlan,
  onSelectPlan,
  plans: plansProp,
}: PlanComparisonModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('limits');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  // Use provided plans or fallback to hardcoded
  const plans = plansProp || PLANS;

  const handleSelectPlan = (planId: PlanType) => {
    onSelectPlan(planId);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compare Plans" size="4xl">
      <div className="space-y-6">
        {/* Billing Period Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex items-center p-1 bg-secondary-100 dark:bg-secondary-700 rounded-lg">
            <button
              type="button"
              onClick={() => setBillingPeriod('monthly')}
              className={clsx(
                'px-4 py-2 text-sm font-medium rounded-md transition-all',
                billingPeriod === 'monthly'
                  ? 'bg-white dark:bg-secondary-600 text-secondary-900 dark:text-secondary-100 shadow-sm'
                  : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-200'
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('annual')}
              className={clsx(
                'px-4 py-2 text-sm font-medium rounded-md transition-all',
                billingPeriod === 'annual'
                  ? 'bg-white dark:bg-secondary-600 text-secondary-900 dark:text-secondary-100 shadow-sm'
                  : 'text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-secondary-200'
              )}
            >
              Annual
              <span className="ml-1 text-xs text-brand-cyan-600 dark:text-brand-cyan-400">(Save 17%)</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center border-b border-secondary-200 dark:border-secondary-700">
          <button
            type="button"
            onClick={() => setActiveTab('limits')}
            className={clsx(
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'limits'
                ? 'border-brand-cyan-500 text-brand-cyan-600 dark:text-brand-cyan-400'
                : 'border-transparent text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300'
            )}
          >
            Usage Limits
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('features')}
            className={clsx(
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'features'
                ? 'border-brand-cyan-500 text-brand-cyan-600 dark:text-brand-cyan-400'
                : 'border-transparent text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300'
            )}
          >
            Features
          </button>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-secondary-500 dark:text-secondary-400">
                  {activeTab === 'limits' ? 'Limit' : 'Feature'}
                </th>
                {plans.map((plan) => (
                  <th key={plan.id} className="text-center py-3 px-4 min-w-[140px]">
                    <div className="flex flex-col items-center">
                      {plan.highlighted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 mb-1 text-xs font-semibold rounded-full bg-brand-coral-500 text-white">
                          <StarIcon className="w-3 h-3" />
                          POPULAR
                        </span>
                      )}
                      <span className="text-lg font-bold text-secondary-900 dark:text-secondary-100">
                        {plan.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100 dark:divide-secondary-700">
              {activeTab === 'limits' ? (
                // Usage Limits Tab
                (Object.keys(PLAN_LIMITS_LABELS) as Array<keyof PlanLimit>).map((limitKey) => (
                  <tr key={limitKey} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                    <td className="py-3 px-4 text-sm text-secondary-700 dark:text-secondary-300">
                      {PLAN_LIMITS_LABELS[limitKey]}
                    </td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="text-center py-3 px-4 text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        {plan.limits[limitKey]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                // Features Tab
                PLAN_FEATURES.map((feature) => (
                  <tr key={feature.name} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                    <td className="py-3 px-4 text-sm text-secondary-700 dark:text-secondary-300">
                      {feature.name}
                    </td>
                    {plans.map((plan) => {
                      const hasFeature = feature[plan.id as keyof typeof feature] as boolean;
                      return (
                        <td key={plan.id} className="text-center py-3 px-4">
                          {hasFeature ? (
                            <CheckIcon className="w-5 h-5 mx-auto text-success-500" />
                          ) : (
                            <XMarkIcon className="w-5 h-5 mx-auto text-secondary-300 dark:text-secondary-600" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pricing & Select Buttons */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
          {plans.map((plan) => {
            const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
            const isSelected = selectedPlan === plan.id;

            return (
              <div key={plan.id} className="text-center">
                <div className="mb-3">
                  {price === 0 ? (
                    <span className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">Free</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                        ${price}
                      </span>
                      <span className="text-sm text-secondary-500 dark:text-secondary-400">
                        /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </>
                  )}
                </div>
                <Button
                  type="button"
                  variant={isSelected ? 'primary' : 'outline'}
                  size="sm"
                  className="w-full"
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {isSelected ? 'Selected' : 'Select Plan'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

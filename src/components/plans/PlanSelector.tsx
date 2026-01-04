'use client';

import { useState, useMemo } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import PlanCard from './PlanCard';
import PlanComparisonModal from './PlanComparisonModal';
import { PLANS, PlanInfo } from '@/lib/plans';
import { PlanType } from '@/types/api';
import { useTiers, convertTierToPlanInfo } from '@/hooks/useTiers';

interface PlanSelectorProps {
  value: PlanType;
  onChange: (planId: PlanType) => void;
}

export default function PlanSelector({ value, onChange }: PlanSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch tiers from API
  const { data: tiersData, isLoading, isError } = useTiers();

  // Convert API tiers to PlanInfo format, fallback to hardcoded if API fails
  const plans: PlanInfo[] = useMemo(() => {
    if (tiersData?.success && tiersData.tiers.length > 0) {
      return tiersData.tiers.map(convertTierToPlanInfo);
    }
    // Fallback to hardcoded plans if API fails or is loading
    return PLANS;
  }, [tiersData]);

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl border-2 border-secondary-200 dark:border-secondary-700 bg-secondary-100 dark:bg-secondary-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={value === plan.id}
            onSelect={onChange}
            onViewDetails={() => setIsModalOpen(true)}
          />
        ))}
      </div>

      {/* Compare Plans Button */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="flex items-center justify-center w-full gap-2 py-2 text-sm font-medium text-brand-cyan-600 dark:text-brand-cyan-400 hover:text-brand-cyan-700 dark:hover:text-brand-cyan-300 transition-colors"
      >
        <InformationCircleIcon className="w-5 h-5" />
        Compare all plans in detail
      </button>

      {/* Comparison Modal */}
      <PlanComparisonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedPlan={value}
        onSelectPlan={onChange}
        plans={plans}
      />
    </div>
  );
}

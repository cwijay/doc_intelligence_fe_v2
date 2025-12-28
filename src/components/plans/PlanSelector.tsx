'use client';

import { useState } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import PlanCard from './PlanCard';
import PlanComparisonModal from './PlanComparisonModal';
import { PLANS } from '@/lib/plans';
import { PlanType } from '@/types/api';

interface PlanSelectorProps {
  value: PlanType;
  onChange: (planId: PlanType) => void;
}

export default function PlanSelector({ value, onChange }: PlanSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map((plan) => (
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
      />
    </div>
  );
}

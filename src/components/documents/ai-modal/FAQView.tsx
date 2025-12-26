'use client';

import React from 'react';
import { DocumentFAQ } from '@/types/api';
import {
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  TagIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import MarkdownRenderer from './MarkdownRenderer';
import { FAQRegenerationOptions, CONTENT_CONFIG } from './types';

interface FAQContentProps {
  data: DocumentFAQ;
  expandedItems: Set<number>;
  toggleExpanded: (index: number) => void;
  setExpandedItems: (items: Set<number>) => void;
}

export function FAQContent({ data, expandedItems, toggleExpanded, setExpandedItems }: FAQContentProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-secondary-900">Frequently Asked Questions</h3>
        <div className="flex items-center space-x-2">
          {data.faqs && data.faqs.length > 0 && (
            <>
              <Button
                onClick={() => setExpandedItems(new Set(data.faqs.map((_: unknown, i: number) => i)))}
                variant="ghost"
                size="sm"
              >
                Expand All
              </Button>
              <Button
                onClick={() => setExpandedItems(new Set())}
                variant="ghost"
                size="sm"
              >
                Collapse All
              </Button>
            </>
          )}
        </div>
      </div>

      {data.faqs && data.faqs.length > 0 ? (
        <div className="space-y-3">
          {data.faqs.map((faq, index) => (
            <div key={index} className="border border-secondary-200 rounded-lg overflow-hidden">
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleExpanded(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleExpanded(index);
                  }
                }}
                className="w-full px-4 py-3 bg-secondary-50 hover:bg-secondary-100 transition-colors flex items-start justify-between text-left cursor-pointer"
              >
                <div className="flex items-start space-x-3 flex-1">
                  {expandedItems.has(index) ? (
                    <ChevronDownIcon className="w-5 h-5 text-secondary-500 mt-0.5" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-secondary-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-secondary-900">Q{index + 1}.</span>
                      <span className="text-sm font-medium text-secondary-900">{faq.question}</span>
                    </div>
                    {(faq as { category?: string }).category && (
                      <div className="flex items-center mt-1">
                        <TagIcon className="w-3 h-3 text-secondary-400 mr-1" />
                        <span className="text-xs text-secondary-500">{(faq as { category?: string }).category}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {expandedItems.has(index) && (
                <div className="px-4 py-3 bg-white border-t border-secondary-200">
                  <MarkdownRenderer content={faq.answer} />
                  {faq.confidence && (
                    <div className="mt-2 text-xs text-secondary-500">
                      Confidence: {Math.round(faq.confidence * 100)}%
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-secondary-500">
          <QuestionMarkCircleIcon className="w-12 h-12 mx-auto mb-2" />
          <p>No FAQ content available</p>
        </div>
      )}
    </div>
  );
}

interface FAQMetadataProps {
  data: DocumentFAQ;
}

export function FAQMetadata({ data }: FAQMetadataProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-secondary-900">FAQ Analysis</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {(data.count || data.faqs?.length) && (
            <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Total FAQs</h4>
              <p className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                {data.count || data.faqs?.length || 0}
              </p>
            </div>
          )}

          {data.processing_time_ms && (
            <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Processing Time</h4>
              <p className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                {(data.processing_time_ms / 1000).toFixed(2)}s
              </p>
            </div>
          )}

          <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Cache Status</h4>
            <p className="text-lg font-semibold">
              {data.cached ? (
                <span className="text-blue-600 dark:text-blue-400">Cached</span>
              ) : (
                <span className="text-green-600 dark:text-green-400">Freshly Generated</span>
              )}
            </p>
          </div>
        </div>

        {data.metadata?.categories && data.metadata.categories.length > 0 && (
          <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Categories</h4>
            <div className="flex flex-wrap gap-2">
              {data.metadata.categories.map((category: string, index: number) => (
                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                  <TagIcon className="w-3 h-3 mr-1" />
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">Generation Details</h4>
          <div className="space-y-2 text-sm text-secondary-600 dark:text-secondary-400">
            <p>Generated: {new Date(data.created_at).toLocaleDateString()} at {new Date(data.created_at).toLocaleTimeString()}</p>
            {data.metadata?.generation_model && (
              <p>Model: {data.metadata.generation_model}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface FAQActionsProps {
  regenerationOptions: FAQRegenerationOptions;
  setRegenerationOptions: (options: FAQRegenerationOptions) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
  hasOnRegenerate: boolean;
}

export function FAQActions({
  regenerationOptions,
  setRegenerationOptions,
  onRegenerate,
  isGenerating,
  hasOnRegenerate,
}: FAQActionsProps) {
  const config = CONTENT_CONFIG.faq;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-secondary-900">FAQ Options</h3>
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-secondary-700">Regeneration Settings</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Number of Questions</label>
            <input
              type="number"
              value={regenerationOptions.question_count}
              onChange={(e) => setRegenerationOptions({ ...regenerationOptions, question_count: parseInt(e.target.value) || 10 })}
              min="1"
              max="50"
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Depth</label>
            <select
              value={regenerationOptions.depth}
              onChange={(e) => setRegenerationOptions({ ...regenerationOptions, depth: e.target.value as 'basic' | 'intermediate' | 'advanced' })}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="basic">Basic</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">Format</label>
          <select
            value={regenerationOptions.format}
            onChange={(e) => setRegenerationOptions({ ...regenerationOptions, format: e.target.value as 'simple' | 'detailed' | 'technical' })}
            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="simple">Simple</option>
            <option value="detailed">Detailed</option>
            <option value="technical">Technical</option>
          </select>
        </div>
        <Button
          onClick={onRegenerate}
          disabled={!hasOnRegenerate || isGenerating}
          className="w-full"
          variant="outline"
        >
          <ArrowPathIcon className="w-4 h-4 mr-2" />
          {isGenerating ? 'Regenerating...' : config.regenerateLabel}
        </Button>
      </div>
    </div>
  );
}

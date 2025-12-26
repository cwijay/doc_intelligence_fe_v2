'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import Modal from '@/components/ui/Modal';
import { InformationCircleIcon, Cog6ToothIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import Button from '@/components/ui/Button';
import { useAIModalState, type AIModalTab } from '@/hooks/useAIModalState';

// Import types and config
import {
  DocumentAIContentModalProps,
  RegenerationOptions,
  SummaryRegenerationOptions,
  FAQRegenerationOptions,
  QuestionsRegenerationOptions,
  CONTENT_CONFIG,
  DEFAULT_REGEN_OPTIONS,
  isSummaryData,
  isFAQData,
  isQuestionsData,
} from './types';

// Import view components
import { SummaryContent, SummaryMetadata, SummaryActions } from './SummaryView';
import { FAQContent, FAQMetadata, FAQActions } from './FAQView';
import { QuestionsContent, QuestionsMetadata, QuestionsActions } from './QuestionsView';

// Re-export types for consumers
export type { AIContentType, DocumentAIContentModalProps } from './types';

export default function DocumentAIContentModal({
  contentType,
  isOpen,
  onClose,
  document,
  data,
  onRegenerate,
  isGenerating = false,
}: DocumentAIContentModalProps) {
  const config = CONTENT_CONFIG[contentType];

  // State for expandable items (FAQs and Questions)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Use shared AI modal state hook
  const {
    activeTab,
    setActiveTab,
    regenerationOptions,
    setRegenerationOptions,
    handleRegenerate,
  } = useAIModalState<unknown, RegenerationOptions>({
    initialData: null,
    onRegenerate: onRegenerate ? async (options) => await onRegenerate(options) : undefined,
    defaultRegenerationOptions: DEFAULT_REGEN_OPTIONS[contentType],
  });

  // Expand first few items by default when data changes (for FAQs and Questions)
  useEffect(() => {
    if (contentType === 'faq' && isFAQData(data) && data.faqs.length > 0) {
      setExpandedItems(new Set([0, 1, 2]));
    } else if (contentType === 'questions' && isQuestionsData(data) && data.questions.length > 0) {
      setExpandedItems(new Set());
    } else {
      setExpandedItems(new Set());
    }
  }, [data, contentType]);

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  // Get item count based on content type
  const getItemCount = (): number => {
    if (contentType === 'summary' && isSummaryData(data)) {
      return data.word_count || 0;
    } else if (contentType === 'faq' && isFAQData(data)) {
      return data.faqs?.length || 0;
    } else if (contentType === 'questions' && isQuestionsData(data)) {
      return data.questions?.length || 0;
    }
    return 0;
  };

  // Define tabs
  const tabs = [
    {
      id: 'content' as AIModalTab,
      label: config.tabLabel,
      icon: config.icon,
      count: getItemCount(),
    },
    {
      id: 'metadata' as AIModalTab,
      label: 'Analysis',
      icon: InformationCircleIcon,
      count: 0,
    },
    {
      id: 'actions' as AIModalTab,
      label: 'Options',
      icon: Cog6ToothIcon,
      count: 0,
    },
  ];

  // Render loading state
  const renderLoading = () => (
    <div className="flex items-center justify-center h-64 text-secondary-500">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-lg font-medium text-secondary-900 mb-2">{config.generatingMessage}</p>
        <p>{config.generatingSubtext}</p>
      </div>
    </div>
  );

  // Render empty state
  const renderEmpty = () => {
    const EmptyIcon = config.emptyIcon;
    return (
      <div className="flex items-center justify-center h-64 text-secondary-500">
        <div className="text-center">
          <EmptyIcon className="w-12 h-12 mx-auto mb-4" />
          <p className="mb-2">{config.emptyMessage}</p>
          <p className="text-sm">{config.emptySubtext}</p>
        </div>
      </div>
    );
  };

  // Render content based on type and tab
  const renderTabContent = () => {
    if (isGenerating) return renderLoading();
    if (!data) return renderEmpty();

    switch (activeTab) {
      case 'content':
        if (contentType === 'summary' && isSummaryData(data)) {
          return <SummaryContent data={data} />;
        } else if (contentType === 'faq' && isFAQData(data)) {
          return (
            <FAQContent
              data={data}
              expandedItems={expandedItems}
              toggleExpanded={toggleExpanded}
              setExpandedItems={setExpandedItems}
            />
          );
        } else if (contentType === 'questions' && isQuestionsData(data)) {
          return (
            <QuestionsContent
              data={data}
              expandedItems={expandedItems}
              toggleExpanded={toggleExpanded}
            />
          );
        }
        return null;

      case 'metadata':
        if (contentType === 'summary' && isSummaryData(data)) {
          return <SummaryMetadata data={data} />;
        } else if (contentType === 'faq' && isFAQData(data)) {
          return <FAQMetadata data={data} />;
        } else if (contentType === 'questions' && isQuestionsData(data)) {
          return <QuestionsMetadata data={data} />;
        }
        return null;

      case 'actions':
        if (contentType === 'summary') {
          return (
            <SummaryActions
              regenerationOptions={regenerationOptions as SummaryRegenerationOptions}
              setRegenerationOptions={(opts) => setRegenerationOptions(opts)}
              onRegenerate={handleRegenerate}
              isGenerating={isGenerating}
              hasOnRegenerate={!!onRegenerate}
            />
          );
        } else if (contentType === 'faq') {
          return (
            <FAQActions
              regenerationOptions={regenerationOptions as FAQRegenerationOptions}
              setRegenerationOptions={(opts) => setRegenerationOptions(opts)}
              onRegenerate={handleRegenerate}
              isGenerating={isGenerating}
              hasOnRegenerate={!!onRegenerate}
            />
          );
        } else if (contentType === 'questions') {
          return (
            <QuestionsActions
              regenerationOptions={regenerationOptions as QuestionsRegenerationOptions}
              setRegenerationOptions={(opts) => setRegenerationOptions(opts)}
              onRegenerate={handleRegenerate}
              isGenerating={isGenerating}
              hasOnRegenerate={!!onRegenerate}
            />
          );
        }
        return null;

      default:
        return null;
    }
  };

  if (!document) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      size="2xl"
      className="max-h-[90vh]"
    >
      <div className="space-y-6">
        {/* Document name with status badges */}
        <div className="text-sm text-secondary-600">
          <div className="flex items-center justify-between">
            <div className="font-medium">{document.name}</div>
            <div className="flex items-center gap-2">
              {data?.cached && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  Cached
                </span>
              )}
              {getItemCount() > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-300">
                  {getItemCount()} {config.countLabel}
                </span>
              )}
              {data?.processing_time_ms && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  {(data.processing_time_ms / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          </div>
          {data?.created_at && (
            <div className="mt-1">
              Generated {new Date(data.created_at).toLocaleDateString()} at{' '}
              {new Date(data.created_at).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Tab navigation */}
        <div className="border-b border-secondary-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-2 bg-secondary-100 text-secondary-600 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab content */}
        <div className="max-h-[60vh] overflow-y-auto">{renderTabContent()}</div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-secondary-200 mt-6">
          {onRegenerate && data && (
            <Button onClick={handleRegenerate} disabled={isGenerating} variant="outline">
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          )}
          <Button onClick={onClose} variant="primary">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowPathIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import Button from '@/components/ui/Button';
import AIContentHeader from './AIContentHeader';
import { useAIContentPage, UseAIContentPageReturn } from '@/hooks/ai/useAIContentPage';
import { useDocumentAI } from '@/hooks/ai';
import { useAIModalState, type AIModalTab } from '@/hooks/useAIModalState';

// Import types and config from ai-modal
import {
  AIContentType,
  AIContentData,
  RegenerationOptions,
  SummaryRegenerationOptions,
  FAQRegenerationOptions,
  QuestionsRegenerationOptions,
  CONTENT_CONFIG,
  DEFAULT_REGEN_OPTIONS,
  isSummaryData,
  isFAQData,
  isQuestionsData,
} from '../ai-modal/types';

// Import view components
import { SummaryContent, SummaryMetadata, SummaryActions } from '../ai-modal/SummaryView';
import { FAQContent, FAQMetadata, FAQActions } from '../ai-modal/FAQView';
import { QuestionsContent, QuestionsMetadata, QuestionsActions } from '../ai-modal/QuestionsView';

// =============================================================================
// Types
// =============================================================================

interface AIContentPageProps {
  documentId: string;
  contentType: AIContentType;
}

// =============================================================================
// Main Component
// =============================================================================

export default function AIContentPage({ documentId, contentType }: AIContentPageProps) {
  const router = useRouter();
  const config = CONTENT_CONFIG[contentType];

  // Page-level state from hook
  const pageState = useAIContentPage(documentId, contentType);

  // AI features hook for generating/regenerating content
  const documentAI = useDocumentAI();

  // Local state for expandable items (FAQs and Questions)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Determine which data/state to use based on contentType
  const { data, isGenerating, handleRegenerate } = useMemo(() => {
    switch (contentType) {
      case 'summary':
        return {
          data: documentAI.summaryData,
          isGenerating: documentAI.isGeneratingSummary,
          handleRegenerate: documentAI.handleSummaryRegenerate,
        };
      case 'faq':
        return {
          data: documentAI.faqData,
          isGenerating: documentAI.isGeneratingFAQ,
          handleRegenerate: documentAI.handleFAQRegenerate,
        };
      case 'questions':
        return {
          data: documentAI.questionsData,
          isGenerating: documentAI.isGeneratingQuestions,
          handleRegenerate: documentAI.handleQuestionsRegenerate,
        };
    }
  }, [contentType, documentAI]);

  // Convert regeneration options based on content type
  const convertRegenOptions = useCallback((options: RegenerationOptions) => {
    switch (contentType) {
      case 'summary':
        return { maxWords: (options as SummaryRegenerationOptions).length === 'short' ? 200 : (options as SummaryRegenerationOptions).length === 'long' ? 1000 : 500 };
      case 'faq':
        return { numFaqs: (options as FAQRegenerationOptions).question_count };
      case 'questions':
        return { numQuestions: (options as QuestionsRegenerationOptions).question_count };
    }
  }, [contentType]);

  // Use shared AI modal state hook for tabs and regeneration options
  const {
    activeTab,
    setActiveTab,
    regenerationOptions,
    setRegenerationOptions,
    handleRegenerate: handleRegenerateWithOptions,
  } = useAIModalState<unknown, RegenerationOptions>({
    initialData: null,
    onRegenerate: handleRegenerate ? async (options) => await handleRegenerate(convertRegenOptions(options as RegenerationOptions)) : undefined,
    defaultRegenerationOptions: DEFAULT_REGEN_OPTIONS[contentType],
  });

  // Trigger initial generation when page loads and document is available
  useEffect(() => {
    if (pageState.isInitialized && pageState.document && !data && !isGenerating) {
      console.log(`📦 AIContentPage: Triggering initial ${contentType} generation`);
      switch (contentType) {
        case 'summary':
          documentAI.handleSummarize(pageState.document);
          break;
        case 'faq':
          documentAI.handleFaq(pageState.document, 10);
          break;
        case 'questions':
          documentAI.handleQuestions(pageState.document, 10);
          break;
      }
    }
  }, [pageState.isInitialized, pageState.document, contentType, data, isGenerating, documentAI]);

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

  const toggleExpanded = useCallback((index: number) => {
    setExpandedItems(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(index)) {
        newExpanded.delete(index);
      } else {
        newExpanded.add(index);
      }
      return newExpanded;
    });
  }, []);

  // Get item count based on content type
  const getItemCount = useCallback((): number => {
    if (contentType === 'summary' && isSummaryData(data)) {
      return data.word_count || 0;
    } else if (contentType === 'faq' && isFAQData(data)) {
      return data.faqs?.length || 0;
    } else if (contentType === 'questions' && isQuestionsData(data)) {
      return data.questions?.length || 0;
    }
    return 0;
  }, [contentType, data]);

  // Tab definitions
  const tabs = useMemo(() => [
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
  ], [config, getItemCount]);

  // Render loading state
  const renderLoading = () => (
    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-coral-500 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">{config.generatingMessage}</p>
        <p>{config.generatingSubtext}</p>
      </div>
    </div>
  );

  // Render empty state
  const renderEmpty = () => {
    const EmptyIcon = config.emptyIcon;
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <EmptyIcon className="w-12 h-12 mx-auto mb-4" />
          <p className="mb-2">{config.emptyMessage}</p>
          <p className="text-sm">{config.emptySubtext}</p>
        </div>
      </div>
    );
  };

  // Render error state
  const renderError = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-brand-navy-700">
      <div className="text-center max-w-md px-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExclamationCircleIcon className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Error Loading Content
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {pageState.initError || 'Failed to load document context'}
        </p>
        <Button onClick={pageState.handleBack} variant="primary">
          Back to Documents
        </Button>
      </div>
    </div>
  );

  // Render initializing state
  const renderInitializing = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-brand-navy-700">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-brand-coral-500 mb-4" />
      <p className="text-gray-600 dark:text-gray-400">Loading document...</p>
    </div>
  );

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
              onRegenerate={handleRegenerateWithOptions}
              isGenerating={isGenerating}
              hasOnRegenerate={!!handleRegenerate}
            />
          );
        } else if (contentType === 'faq') {
          return (
            <FAQActions
              regenerationOptions={regenerationOptions as FAQRegenerationOptions}
              setRegenerationOptions={(opts) => setRegenerationOptions(opts)}
              onRegenerate={handleRegenerateWithOptions}
              isGenerating={isGenerating}
              hasOnRegenerate={!!handleRegenerate}
            />
          );
        } else if (contentType === 'questions') {
          return (
            <QuestionsActions
              regenerationOptions={regenerationOptions as QuestionsRegenerationOptions}
              setRegenerationOptions={(opts) => setRegenerationOptions(opts)}
              onRegenerate={handleRegenerateWithOptions}
              isGenerating={isGenerating}
              hasOnRegenerate={!!handleRegenerate}
            />
          );
        }
        return null;

      default:
        return null;
    }
  };

  // Handle different states
  if (pageState.isInitializing) {
    return renderInitializing();
  }

  if (pageState.initError || !pageState.document) {
    return renderError();
  }

  return (
    <div className="grid grid-rows-[auto_auto_1fr_auto] h-[calc(100vh-56px)] overflow-hidden bg-gray-50 dark:bg-brand-navy-700">
      {/* Page Header */}
      <AIContentHeader
        contentType={contentType}
        documentName={pageState.document.name}
        folderName={pageState.folderName}
        onBack={pageState.handleBack}
        itemCount={getItemCount()}
        cached={data?.cached}
        processingTime={data?.processing_time_ms}
      />

      {/* Tab navigation bar - full width */}
      <div className="bg-white dark:bg-brand-navy-600 border-b border-gray-200 dark:border-gray-700 px-6">
        <div className="flex items-center justify-between">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                    activeTab === tab.id
                      ? 'border-brand-coral-500 text-brand-coral-600 dark:text-brand-coral-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          {/* Document info inline with tabs */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-white">{pageState.document.name}</span>
            {data?.created_at && (
              <span className="ml-3 text-xs">
                Generated {new Date(data.created_at).toLocaleDateString()} at{' '}
                {new Date(data.created_at).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area - full width and height */}
      <div className="p-6 min-h-0 overflow-hidden">
        <div className="h-full bg-white dark:bg-brand-navy-600 rounded-lg shadow-sm border border-gray-200 dark:border-brand-navy-500 p-6 overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>

      {/* Footer - full width */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-brand-navy-600 px-6 py-4">
        <div className="flex justify-between items-center">
          <Button onClick={pageState.handleBack} variant="outline">
            Back to Documents
          </Button>
          <div className="flex items-center space-x-3">
            {data && (
              <Button
                onClick={handleRegenerateWithOptions}
                disabled={isGenerating}
                variant="outline"
              >
                <ArrowPathIcon className={clsx('w-4 h-4 mr-2', isGenerating && 'animate-spin')} />
                Regenerate
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

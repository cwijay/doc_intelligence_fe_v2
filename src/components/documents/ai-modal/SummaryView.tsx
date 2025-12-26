'use client';

import React from 'react';
import { DocumentSummary } from '@/types/api';
import { SparklesIcon, InformationCircleIcon, BookmarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import MarkdownRenderer from './MarkdownRenderer';
import { SummaryRegenerationOptions, CONTENT_CONFIG } from './types';

interface SummaryContentProps {
  data: DocumentSummary;
}

export function SummaryContent({ data }: SummaryContentProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-secondary-900">Document Summary</h3>
      {data.content ? (
        <div className="border border-secondary-200 rounded-lg overflow-hidden">
          <div className="p-4 h-96 overflow-y-auto">
            <MarkdownRenderer content={data.content} />
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-secondary-500">
          <SparklesIcon className="w-12 h-12 mx-auto mb-2" />
          <p>No summary content available</p>
        </div>
      )}
    </div>
  );
}

interface SummaryMetadataProps {
  data: DocumentSummary;
}

export function SummaryMetadata({ data }: SummaryMetadataProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-secondary-900">Summary Analysis</h3>
      {data.metadata && Object.keys(data.metadata).length > 0 ? (
        <div className="space-y-4">
          {data.metadata.key_topics && (
            <div className="bg-secondary-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-secondary-700 mb-2">Key Topics</h4>
              <div className="flex flex-wrap gap-2">
                {data.metadata.key_topics.map((topic: string, index: number) => (
                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    <BookmarkIcon className="w-3 h-3 mr-1" />
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {(data.word_count || data.metadata?.word_count) && (
              <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Word Count</h4>
                <p className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                  {(data.word_count || data.metadata?.word_count || 0).toLocaleString()}
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

          {data.metadata.sentiment && (
            <div className="bg-secondary-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-secondary-700 mb-1">Sentiment Analysis</h4>
              <p className="text-secondary-900 capitalize">{data.metadata.sentiment}</p>
            </div>
          )}

          <div className="bg-secondary-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-secondary-700 mb-2">Generation Details</h4>
            <div className="space-y-2 text-sm text-secondary-600">
              <p>Generated: {new Date(data.created_at).toLocaleDateString()} at {new Date(data.created_at).toLocaleTimeString()}</p>
              {data.metadata.generation_model && (
                <p>Model: {data.metadata.generation_model}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-secondary-500">
          <InformationCircleIcon className="w-12 h-12 mx-auto mb-2" />
          <p>No analysis data available</p>
        </div>
      )}
    </div>
  );
}

interface SummaryActionsProps {
  regenerationOptions: SummaryRegenerationOptions;
  setRegenerationOptions: (options: SummaryRegenerationOptions) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
  hasOnRegenerate: boolean;
}

export function SummaryActions({
  regenerationOptions,
  setRegenerationOptions,
  onRegenerate,
  isGenerating,
  hasOnRegenerate,
}: SummaryActionsProps) {
  const config = CONTENT_CONFIG.summary;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-secondary-900">Summary Options</h3>
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-secondary-700">Regeneration Settings</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Length</label>
            <select
              value={regenerationOptions.length}
              onChange={(e) => setRegenerationOptions({ ...regenerationOptions, length: e.target.value as 'short' | 'medium' | 'long' })}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="short">Short (1-2 paragraphs)</option>
              <option value="medium">Medium (3-5 paragraphs)</option>
              <option value="long">Long (6+ paragraphs)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Format</label>
            <select
              value={regenerationOptions.format}
              onChange={(e) => setRegenerationOptions({ ...regenerationOptions, format: e.target.value as 'bullets' | 'paragraphs' | 'executive' })}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="paragraphs">Paragraphs</option>
              <option value="bullets">Bullet Points</option>
              <option value="executive">Executive Summary</option>
            </select>
          </div>
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

'use client';

import React from 'react';
import { DocumentQuestions } from '@/types/api';
import {
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import Button from '@/components/ui/Button';
import { QuestionsRegenerationOptions, CONTENT_CONFIG, getDifficultyBadgeStyles } from './types';

interface QuestionsContentProps {
  data: DocumentQuestions;
  expandedItems: Set<number>;
  toggleExpanded: (index: number) => void;
}

export function QuestionsContent({ data, expandedItems, toggleExpanded }: QuestionsContentProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-secondary-900">Comprehension Questions</h3>
        {data.questions && data.questions.length > 0 && (
          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
            {data.questions.length} questions
          </span>
        )}
      </div>

      {data.questions && data.questions.length > 0 ? (
        <div className="space-y-3">
          {data.questions.map((questionObj, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg overflow-hidden">
              <div
                role="button"
                tabIndex={0}
                onClick={() => questionObj.expected_answer && toggleExpanded(index)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && questionObj.expected_answer) {
                    e.preventDefault();
                    toggleExpanded(index);
                  }
                }}
                className={clsx(
                  'p-4',
                  questionObj.expected_answer && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50'
                )}
              >
                <div className="flex items-start gap-3">
                  {questionObj.expected_answer && (
                    expandedItems.has(index) ? (
                      <ChevronDownIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <ChevronRightIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    )
                  )}
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0">
                    Q{index + 1}:
                  </span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-gray-800 dark:text-gray-200">{questionObj.question}</span>
                      {questionObj.difficulty && (
                        <span className={clsx(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
                          getDifficultyBadgeStyles(questionObj.difficulty)
                        )}>
                          {questionObj.difficulty}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {questionObj.expected_answer && expandedItems.has(index) && (
                <div className="px-4 pb-4 pt-0">
                  <div className="ml-8 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <span className="text-xs font-medium text-green-700 dark:text-green-400 uppercase">
                      Expected Answer:
                    </span>
                    <p className="mt-1 text-sm text-green-800 dark:text-green-300">
                      {questionObj.expected_answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-secondary-500">
          <QuestionMarkCircleIcon className="w-12 h-12 mx-auto mb-2" />
          <p>No questions available</p>
        </div>
      )}
    </div>
  );
}

interface QuestionsMetadataProps {
  data: DocumentQuestions;
}

export function QuestionsMetadata({ data }: QuestionsMetadataProps) {
  const difficultyDist = data.difficulty_distribution;
  const questionsCount = data.questions?.length || 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-secondary-900">Questions Analysis</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Total Questions</h4>
            <p className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              {data.count || questionsCount}
            </p>
          </div>

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

          {data.created_at && (
            <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">Generated</h4>
              <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                {new Date(data.created_at).toLocaleDateString()} at {new Date(data.created_at).toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>

        {difficultyDist && (
          <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">Difficulty Distribution</h4>
            <div className="space-y-3">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <div key={level} className="flex items-center gap-3">
                  <span className={clsx(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-16 justify-center',
                    getDifficultyBadgeStyles(level)
                  )}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={clsx(
                        'h-2 rounded-full',
                        level === 'easy' && 'bg-green-500',
                        level === 'medium' && 'bg-yellow-500',
                        level === 'hard' && 'bg-red-500'
                      )}
                      style={{ width: `${questionsCount > 0 ? (difficultyDist[level] / questionsCount) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100 w-8 text-right">
                    {difficultyDist[level]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface QuestionsActionsProps {
  regenerationOptions: QuestionsRegenerationOptions;
  setRegenerationOptions: (options: QuestionsRegenerationOptions) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
  hasOnRegenerate: boolean;
}

export function QuestionsActions({
  regenerationOptions,
  setRegenerationOptions,
  onRegenerate,
  isGenerating,
  hasOnRegenerate,
}: QuestionsActionsProps) {
  const config = CONTENT_CONFIG.questions;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-secondary-900">Questions Options</h3>
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-secondary-700">Regeneration Settings</h4>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">Number of Questions (1-20)</label>
          <input
            type="number"
            min="1"
            max="20"
            value={regenerationOptions.question_count}
            onChange={(e) => setRegenerationOptions({ ...regenerationOptions, question_count: parseInt(e.target.value) || 5 })}
            className="w-24 px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">Custom Prompt (Optional)</label>
          <textarea
            value={regenerationOptions.prompt}
            onChange={(e) => setRegenerationOptions({ ...regenerationOptions, prompt: e.target.value })}
            placeholder="e.g., Generate questions suitable for testing comprehension of technical concepts..."
            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[80px]"
            rows={3}
          />
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

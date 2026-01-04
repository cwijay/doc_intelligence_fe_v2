'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { clsx } from 'clsx';
import {
  PlusIcon,
  MinusIcon,
  SparklesIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Button from './Button';
import { UI_TIMING, POPOVER_CONFIG } from '@/lib/constants';

interface CountSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (count: number) => void;
  type: 'faq' | 'questions';
  currentCount: number;
  presets?: number[];
  min?: number;
  max?: number;
  anchorEl?: HTMLElement | null;
}

export default function CountSelector({
  isOpen,
  onClose,
  onSelect,
  type,
  currentCount,
  presets = [5, 10, 15, 20],
  min = 1,
  max = 50,
  anchorEl
}: CountSelectorProps) {
  const [customCount, setCustomCount] = useState(currentCount);
  const [inputValue, setInputValue] = useState(currentCount.toString());
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Position state for the popover
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      const popoverHeight = POPOVER_CONFIG.HEIGHT_ESTIMATE;
      const spaceBelow = window.innerHeight - rect.bottom;

      // Position below if there's space, otherwise above
      const top = spaceBelow > popoverHeight
        ? rect.bottom + POPOVER_CONFIG.OFFSET
        : rect.top - popoverHeight - POPOVER_CONFIG.OFFSET;

      setPosition({
        top,
        left: rect.left
      });

      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), UI_TIMING.INPUT_FOCUS_DELAY);
    }
  }, [isOpen, anchorEl]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      setTimeout(() => document.addEventListener('click', handleClickOutside), UI_TIMING.MICROTASK_DELAY);
    }

    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen, onClose]);

  const handlePresetClick = (count: number) => {
    setCustomCount(count);
    setInputValue(count.toString());
    onSelect(count);
    onClose();
  };

  const handleIncrement = () => {
    const newCount = Math.min(customCount + 1, max);
    setCustomCount(newCount);
    setInputValue(newCount.toString());
  };

  const handleDecrement = () => {
    const newCount = Math.max(customCount - 1, min);
    setCustomCount(newCount);
    setInputValue(newCount.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      setCustomCount(parsed);
    }
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleApply();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
    }
  };

  const handleApply = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onSelect(parsed);
      onClose();
    }
  };

  const getRecommendation = () => {
    if (type === 'faq') {
      return {
        text: 'Recommended: 10-15 FAQs',
        description: 'Provides comprehensive coverage without overwhelming readers'
      };
    }
    return {
      text: 'Recommended: 10-20 questions',
      description: 'Balances variety with manageability for assessments'
    };
  };

  if (!isOpen) return null;

  const recommendation = getRecommendation();

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-secondary-200 p-4 w-72"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
      role="dialog"
      aria-label={`Select number of ${type === 'faq' ? 'FAQs' : 'questions'} to generate`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-secondary-900 flex items-center">
          <SparklesIcon className="w-4 h-4 mr-1.5 text-primary-600" />
          {type === 'faq' ? 'FAQ Count' : 'Question Count'}
        </h3>
        <button
          onClick={onClose}
          className="text-secondary-400 hover:text-secondary-600 transition-colors"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Quick Presets */}
      <div className="mb-4">
        <p className="text-xs text-secondary-600 mb-2">Quick Selection</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetClick(preset)}
              className={clsx(
                'px-3 py-1.5 text-sm font-medium rounded-full transition-all',
                'border hover:shadow-sm',
                preset === currentCount
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-secondary-700 border-secondary-300 hover:border-primary-400 hover:text-primary-600'
              )}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Input */}
      <div className="mb-4">
        <p className="text-xs text-secondary-600 mb-2">Custom Count</p>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDecrement}
            disabled={customCount <= min}
            className={clsx(
              'p-1.5 rounded-md transition-colors',
              customCount <= min
                ? 'bg-secondary-100 text-secondary-400 cursor-not-allowed'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            )}
            aria-label="Decrease count"
          >
            <MinusIcon className="w-4 h-4" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            className="flex-1 px-3 py-1.5 text-center text-sm border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            aria-label="Enter custom count"
          />

          <button
            onClick={handleIncrement}
            disabled={customCount >= max}
            className={clsx(
              'p-1.5 rounded-md transition-colors',
              customCount >= max
                ? 'bg-secondary-100 text-secondary-400 cursor-not-allowed'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            )}
            aria-label="Increase count"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-secondary-500 mt-1 text-center">
          Min: {min} • Max: {max}
        </p>
      </div>

      {/* Recommendation */}
      <div className="mb-4 p-3 bg-primary-50 rounded-md">
        <div className="flex items-start space-x-2">
          <InformationCircleIcon className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-primary-900">{recommendation.text}</p>
            <p className="text-xs text-primary-700 mt-0.5">{recommendation.description}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onClose}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleApply}
          className="flex-1"
          disabled={
            isNaN(parseInt(inputValue, 10)) ||
            parseInt(inputValue, 10) < min ||
            parseInt(inputValue, 10) > max
          }
        >
          Generate {customCount}
        </Button>
      </div>

      {/* Keyboard Shortcut Hint */}
      <div className="mt-3 pt-3 border-t border-secondary-200">
        <p className="text-xs text-secondary-500 text-center">
          Press <kbd className="px-1 py-0.5 bg-secondary-100 rounded text-xs">↑</kbd>
          <kbd className="px-1 py-0.5 bg-secondary-100 rounded text-xs ml-1">↓</kbd> to adjust • 
          <kbd className="px-1 py-0.5 bg-secondary-100 rounded text-xs ml-1">Enter</kbd> to generate
        </p>
      </div>
    </div>
  );
}
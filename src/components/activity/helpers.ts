/**
 * Activity Component Helpers
 * Shared helper functions for activity-related components
 */

import React from 'react';
import {
  DocumentTextIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ChatBubbleBottomCenterTextIcon,
  QuestionMarkCircleIcon,
  DocumentCheckIcon,
} from '@heroicons/react/24/outline';

/**
 * Get icon based on event type or icon hint
 */
export function getActivityIcon(iconOrType: string): React.ReactNode {
  const iconClass = 'w-5 h-5 text-white';

  // Map icon names from API to actual icons
  const iconMap: Record<string, React.ReactNode> = {
    // Icon names from backend
    'file-text': React.createElement(DocumentTextIcon, { className: iconClass }),
    'sparkles': React.createElement(SparklesIcon, { className: iconClass }),
    'help-circle': React.createElement(QuestionMarkCircleIcon, { className: iconClass }),
    'message-circle': React.createElement(ChatBubbleBottomCenterTextIcon, { className: iconClass }),
    'search': React.createElement(MagnifyingGlassIcon, { className: iconClass }),
    'check-circle': React.createElement(CheckCircleIcon, { className: iconClass }),
    'alert-circle': React.createElement(ExclamationCircleIcon, { className: iconClass }),
    'file-check': React.createElement(DocumentCheckIcon, { className: iconClass }),
    'copy': React.createElement(DocumentDuplicateIcon, { className: iconClass }),
    'clock': React.createElement(ClockIcon, { className: iconClass }),

    // Event types fallback
    'document_loaded': React.createElement(DocumentTextIcon, { className: iconClass }),
    'parse_started': React.createElement(ArrowPathIcon, { className: iconClass }),
    'parse_completed': React.createElement(DocumentCheckIcon, { className: iconClass }),
    'summary_generated': React.createElement(SparklesIcon, { className: iconClass }),
    'faqs_generated': React.createElement(ChatBubbleBottomCenterTextIcon, { className: iconClass }),
    'questions_generated': React.createElement(QuestionMarkCircleIcon, { className: iconClass }),
    'content_generated': React.createElement(SparklesIcon, { className: iconClass }),
    'generation_started': React.createElement(ArrowPathIcon, { className: iconClass }),
    'generation_completed': React.createElement(CheckCircleIcon, { className: iconClass }),
    'generation_cache_hit': React.createElement(DocumentDuplicateIcon, { className: iconClass }),
    'cache_hit': React.createElement(DocumentDuplicateIcon, { className: iconClass }),
    'document_agent_query': React.createElement(MagnifyingGlassIcon, { className: iconClass }),
    'error': React.createElement(ExclamationCircleIcon, { className: iconClass }),
  };

  return iconMap[iconOrType] || React.createElement(DocumentTextIcon, { className: iconClass });
}

/**
 * Get icon background color class
 */
export function getIconBackground(colorOrType: string): string {
  const colorMap: Record<string, string> = {
    // Color names from API - mapped to brand colors for consistency
    'green': 'bg-green-500',
    'blue': 'bg-brand-cyan-500',
    'purple': 'bg-brand-navy-500',
    'yellow': 'bg-brand-coral-500',
    'orange': 'bg-brand-coral-500',
    'red': 'bg-red-500',
    'gray': 'bg-brand-cyan-500',

    // Event types fallback - using brand colors for consistency
    'document_loaded': 'bg-brand-cyan-500',
    'parse_started': 'bg-brand-coral-500',
    'parse_completed': 'bg-green-500',
    'summary_generated': 'bg-brand-navy-500',
    'faqs_generated': 'bg-brand-navy-500',
    'questions_generated': 'bg-brand-navy-500',
    'content_generated': 'bg-brand-navy-500',
    'generation_started': 'bg-brand-coral-500',
    'generation_completed': 'bg-green-500',
    'generation_cache_hit': 'bg-brand-cyan-500',
    'cache_hit': 'bg-brand-cyan-500',
    'document_agent_query': 'bg-brand-cyan-500',
    'error': 'bg-red-500',
  };

  return colorMap[colorOrType] || 'bg-brand-cyan-500';
}

/**
 * Get status badge color class
 */
export function getStatusBadgeColor(status: string): string {
  const colorMap: Record<string, string> = {
    'green': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'blue': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'yellow': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'orange': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    'red': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'processing': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'failed': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return colorMap[status.toLowerCase()] || 'bg-secondary-100 text-secondary-800 dark:bg-secondary-700 dark:text-secondary-300';
}

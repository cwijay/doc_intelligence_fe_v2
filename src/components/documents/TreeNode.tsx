'use client';

import { useCallback } from 'react';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderOpenIcon,
  BuildingOffice2Icon,
  DocumentTextIcon,
  DocumentIcon,
  TableCellsIcon,
  PhotoIcon,
  PresentationChartBarIcon,
  SparklesIcon,
  QuestionMarkCircleIcon,
  AcademicCapIcon,
  MagnifyingGlassCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { DocumentStatus } from '@/types/api';

export type TreeNodeType = 'organization' | 'folder' | 'document';

export interface TreeNodeBadge {
  type: 'indexed' | 'summary' | 'faq' | 'questions' | 'error';
  tooltip: string;
}

export interface TreeNodeProps {
  id: string;
  type: TreeNodeType;
  name: string;
  level: number;
  isExpanded?: boolean;
  isSelected: boolean;
  isMultiSelected?: boolean;
  hasChildren?: boolean;
  childCount?: number;
  documentType?: string; // File type for documents (pdf, docx, xlsx, etc.)
  status?: DocumentStatus;
  badges?: TreeNodeBadge[];
  onToggleExpand?: () => void;
  onClick: () => void;
  onCheckboxChange?: (checked: boolean) => void;
  isCollapsedMode: boolean;
  showCheckbox?: boolean;
}

// Get colorful icon for file types
function getDocumentIcon(documentType?: string) {
  if (!documentType) {
    return { icon: DocumentIcon, colorClass: 'text-gray-500', bgClass: 'bg-gray-100 dark:bg-gray-800' };
  }

  const type = documentType.toLowerCase();

  // PDF
  if (type.includes('pdf')) {
    return { icon: DocumentTextIcon, colorClass: 'text-red-600', bgClass: 'bg-red-50 dark:bg-red-900/20' };
  }

  // Word documents
  if (type.includes('doc') || type.includes('word') || type.includes('docx')) {
    return { icon: DocumentTextIcon, colorClass: 'text-blue-600', bgClass: 'bg-blue-50 dark:bg-blue-900/20' };
  }

  // Excel/Spreadsheets
  if (type.includes('xls') || type.includes('xlsx') || type.includes('spreadsheet') || type.includes('excel')) {
    return { icon: TableCellsIcon, colorClass: 'text-green-600', bgClass: 'bg-green-50 dark:bg-green-900/20' };
  }

  // CSV
  if (type.includes('csv')) {
    return { icon: TableCellsIcon, colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50 dark:bg-emerald-900/20' };
  }

  // PowerPoint
  if (type.includes('ppt') || type.includes('pptx') || type.includes('presentation') || type.includes('powerpoint')) {
    return { icon: PresentationChartBarIcon, colorClass: 'text-orange-600', bgClass: 'bg-orange-50 dark:bg-orange-900/20' };
  }

  // Images
  if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg') || type.includes('gif') || type.includes('webp')) {
    return { icon: PhotoIcon, colorClass: 'text-pink-600', bgClass: 'bg-pink-50 dark:bg-pink-900/20' };
  }

  // Markdown/Text
  if (type.includes('md') || type.includes('markdown') || type.includes('txt') || type.includes('text')) {
    return { icon: DocumentTextIcon, colorClass: 'text-violet-600', bgClass: 'bg-violet-50 dark:bg-violet-900/20' };
  }

  // Default
  return { icon: DocumentIcon, colorClass: 'text-gray-500', bgClass: 'bg-gray-100 dark:bg-gray-800' };
}

// Get status icon and color
function getStatusBadge(status?: DocumentStatus) {
  switch (status) {
    case 'uploaded':
      return { icon: ClockIcon, colorClass: 'text-yellow-500', bgClass: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Uploaded' };
    case 'processing':
      return { icon: ArrowPathIcon, colorClass: 'text-blue-500 animate-spin', bgClass: 'bg-blue-100 dark:bg-blue-900/30', label: 'Processing' };
    case 'processed':
      return { icon: CheckCircleIcon, colorClass: 'text-green-500', bgClass: 'bg-green-100 dark:bg-green-900/30', label: 'Ready' };
    case 'error':
    case 'failed':
      return { icon: ExclamationCircleIcon, colorClass: 'text-red-500', bgClass: 'bg-red-100 dark:bg-red-900/30', label: 'Error' };
    default:
      return null;
  }
}

// Get feature badge icon and color
function getFeatureBadgeIcon(type: TreeNodeBadge['type']) {
  switch (type) {
    case 'indexed':
      return { icon: MagnifyingGlassCircleIcon, colorClass: 'text-teal-500' };
    case 'summary':
      return { icon: SparklesIcon, colorClass: 'text-purple-500' };
    case 'faq':
      return { icon: QuestionMarkCircleIcon, colorClass: 'text-blue-500' };
    case 'questions':
      return { icon: AcademicCapIcon, colorClass: 'text-emerald-500' };
    case 'error':
      return { icon: ExclamationCircleIcon, colorClass: 'text-red-500' };
    default:
      return { icon: DocumentIcon, colorClass: 'text-gray-400' };
  }
}

export default function TreeNode({
  id,
  type,
  name,
  level,
  isExpanded = false,
  isSelected,
  isMultiSelected = false,
  hasChildren = false,
  childCount,
  documentType,
  status,
  badges = [],
  onToggleExpand,
  onClick,
  onCheckboxChange,
  isCollapsedMode,
  showCheckbox = true,
}: TreeNodeProps) {
  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onCheckboxChange?.(e.target.checked);
  }, [onCheckboxChange]);

  const handleToggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand?.();
  }, [onToggleExpand]);

  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  // Calculate indentation
  const indentPx = isCollapsedMode ? 0 : level * 16;

  // Get icon based on type
  const getIcon = () => {
    if (type === 'organization') {
      return {
        icon: BuildingOffice2Icon,
        colorClass: 'text-primary-600 dark:text-primary-400',
        bgClass: 'bg-primary-100 dark:bg-primary-900/30',
      };
    }

    if (type === 'folder') {
      const Icon = isExpanded ? FolderOpenIcon : FolderIcon;
      const hasDocuments = childCount && childCount > 0;
      return {
        icon: Icon,
        colorClass: hasDocuments ? 'text-amber-500 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500',
        bgClass: hasDocuments ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-100 dark:bg-gray-800',
      };
    }

    return getDocumentIcon(documentType);
  };

  const iconConfig = getIcon();
  const IconComponent = iconConfig.icon;
  const statusBadge = type === 'document' ? getStatusBadge(status) : null;

  // Collapsed mode - show only icon with tooltip
  if (isCollapsedMode) {
    return (
      <div
        className={`
          relative group flex items-center justify-center p-2 mx-1 my-0.5 rounded-lg cursor-pointer
          transition-all duration-200
          ${isSelected ? 'bg-primary-100 dark:bg-primary-900/40' : 'hover:bg-secondary-100 dark:hover:bg-secondary-800'}
          ${isMultiSelected ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''}
        `}
        onClick={handleClick}
        title={name}
      >
        <div className={`p-1.5 rounded-lg ${iconConfig.bgClass}`}>
          <IconComponent className={`w-5 h-5 ${iconConfig.colorClass}`} />
        </div>

        {/* Tooltip */}
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded
                        opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
          {name}
          {childCount !== undefined && ` (${childCount})`}
        </div>
      </div>
    );
  }

  // Expanded mode - full tree node
  return (
    <div
      className={`
        flex items-center py-1.5 px-2 mx-1 my-0.5 rounded-lg cursor-pointer
        transition-all duration-200
        ${isSelected ? 'bg-primary-100 dark:bg-primary-900/40' : 'hover:bg-secondary-50 dark:hover:bg-secondary-800/50'}
        ${isMultiSelected ? 'ring-2 ring-primary-500 dark:ring-primary-400 ring-inset' : ''}
      `}
      style={{ paddingLeft: `${indentPx + 8}px` }}
      onClick={handleClick}
    >
      {/* Checkbox */}
      {showCheckbox && onCheckboxChange && (
        <div className="flex-shrink-0 mr-2">
          <input
            type="checkbox"
            checked={isMultiSelected}
            onChange={handleCheckboxChange}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600
                       text-primary-600 dark:text-primary-500
                       focus:ring-primary-500 dark:focus:ring-primary-400
                       bg-white dark:bg-gray-700
                       cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Expand/Collapse Arrow */}
      <div className="flex-shrink-0 w-5 mr-1">
        {hasChildren && onToggleExpand ? (
          <button
            onClick={handleToggleExpand}
            className="p-0.5 rounded hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors"
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 text-secondary-500 dark:text-secondary-400" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-secondary-500 dark:text-secondary-400" />
            )}
          </button>
        ) : (
          <span className="w-4 h-4" />
        )}
      </div>

      {/* Icon */}
      <div className={`flex-shrink-0 p-1 rounded-lg mr-2 ${iconConfig.bgClass}`}>
        <IconComponent className={`w-4 h-4 ${iconConfig.colorClass}`} />
      </div>

      {/* Name and Info */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span className={`
          text-sm truncate
          ${isSelected ? 'font-medium text-primary-900 dark:text-primary-100' : 'text-secondary-700 dark:text-secondary-300'}
        `}>
          {name}
        </span>

        {/* Child Count Badge */}
        {childCount !== undefined && childCount > 0 && (
          <span className="flex-shrink-0 px-1.5 py-0.5 text-xs font-medium rounded-full
                           bg-secondary-100 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300">
            {childCount}
          </span>
        )}

        {/* Status Badge (for documents) */}
        {statusBadge && (
          <span className={`flex-shrink-0 p-0.5 rounded ${statusBadge.bgClass}`} title={statusBadge.label}>
            <statusBadge.icon className={`w-3.5 h-3.5 ${statusBadge.colorClass}`} />
          </span>
        )}
      </div>

      {/* Feature Badges */}
      {badges.length > 0 && (
        <div className="flex-shrink-0 flex items-center gap-1 ml-2">
          {badges.map((badge, index) => {
            const { icon: BadgeIcon, colorClass } = getFeatureBadgeIcon(badge.type);
            return (
              <span key={index} className="p-0.5" title={badge.tooltip}>
                <BadgeIcon className={`w-3.5 h-3.5 ${colorClass}`} />
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

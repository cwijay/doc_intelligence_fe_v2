'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Squares2X2Icon,
  ListBulletIcon,
  Bars3Icon,
  FunnelIcon,
  ArrowsUpDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export type ViewMode = 'grid' | 'list' | 'compact';
export type SortField = 'name' | 'size' | 'type' | 'uploaded_at' | 'status';
export type SortDirection = 'asc' | 'desc';
export type FilterCategory = 'all' | 'document' | 'spreadsheet' | 'presentation' | 'image' | 'video' | 'audio' | 'code' | 'archive' | 'other';

export interface ViewSettings {
  mode: ViewMode;
  sortField: SortField;
  sortDirection: SortDirection;
  filterCategory: FilterCategory;
  showParsedOnly: boolean;
  density: 'comfortable' | 'compact' | 'spacious';
}

interface DocumentViewSwitcherProps {
  viewSettings: ViewSettings;
  onViewSettingsChange: (settings: ViewSettings) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  totalCount: number;
  selectedCount: number;
  showAdvancedFilters?: boolean;
  onToggleAdvancedFilters?: () => void;
  className?: string;
}

const viewModeOptions = [
  {
    key: 'grid' as ViewMode,
    icon: Squares2X2Icon,
    label: 'Grid View',
    description: 'Card-based layout with previews',
  },
  {
    key: 'list' as ViewMode,
    icon: ListBulletIcon,
    label: 'List View',
    description: 'Detailed list with metadata',
  },
  {
    key: 'compact' as ViewMode,
    icon: Bars3Icon,
    label: 'Table View',
    description: 'Compact table layout',
  },
];

const sortOptions = [
  { key: 'name' as SortField, label: 'Name' },
  { key: 'size' as SortField, label: 'Size' },
  { key: 'type' as SortField, label: 'Type' },
  { key: 'uploaded_at' as SortField, label: 'Date Modified' },
  { key: 'status' as SortField, label: 'Status' },
];

const filterCategories = [
  { key: 'all' as FilterCategory, label: 'All Files', color: 'text-gray-600' },
  { key: 'document' as FilterCategory, label: 'Documents', color: 'text-blue-600' },
  { key: 'spreadsheet' as FilterCategory, label: 'Spreadsheets', color: 'text-green-600' },
  { key: 'presentation' as FilterCategory, label: 'Presentations', color: 'text-orange-600' },
  { key: 'image' as FilterCategory, label: 'Images', color: 'text-pink-600' },
  { key: 'video' as FilterCategory, label: 'Videos', color: 'text-indigo-600' },
  { key: 'audio' as FilterCategory, label: 'Audio', color: 'text-teal-600' },
  { key: 'code' as FilterCategory, label: 'Code', color: 'text-yellow-600' },
  { key: 'archive' as FilterCategory, label: 'Archives', color: 'text-gray-600' },
  { key: 'other' as FilterCategory, label: 'Other', color: 'text-gray-600' },
];

export default function DocumentViewSwitcher({
  viewSettings,
  onViewSettingsChange,
  searchTerm,
  onSearchChange,
  totalCount,
  selectedCount,
  showAdvancedFilters = false,
  onToggleAdvancedFilters,
  className,
}: DocumentViewSwitcherProps) {
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const updateViewSettings = (updates: Partial<ViewSettings>) => {
    onViewSettingsChange({ ...viewSettings, ...updates });
  };

  const toggleSortDirection = () => {
    updateViewSettings({
      sortDirection: viewSettings.sortDirection === 'asc' ? 'desc' : 'asc'
    });
  };

  const currentSortOption = sortOptions.find(option => option.key === viewSettings.sortField);
  const currentFilterCategory = filterCategories.find(cat => cat.key === viewSettings.filterCategory);

  return (
    <div className={clsx('flex flex-col space-y-4', className)}>
      {/* Search Bar */}
      <div className="flex items-center space-x-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search documents by name, type, or content..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {onToggleAdvancedFilters && (
          <Button
            variant={showAdvancedFilters ? 'primary' : 'outline'}
            size="sm"
            icon={<AdjustmentsHorizontalIcon className="w-4 h-4" />}
            onClick={onToggleAdvancedFilters}
          >
            Filters
          </Button>
        )}
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between bg-white rounded-lg border p-3">
        {/* Left side - View modes */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {viewModeOptions.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => updateViewSettings({ mode: key })}
                className={clsx(
                  'flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200',
                  viewSettings.mode === key
                    ? 'bg-white shadow-sm text-primary-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
                title={label}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Density Control */}
          <div className="hidden sm:flex items-center space-x-1 text-xs text-gray-500">
            <span>Density:</span>
            <select
              value={viewSettings.density}
              onChange={(e) => updateViewSettings({ density: e.target.value as ViewSettings['density'] })}
              className="text-xs border-0 bg-transparent focus:ring-0 cursor-pointer"
            >
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
              <option value="spacious">Spacious</option>
            </select>
          </div>
        </div>

        {/* Center - Results count */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>
            {totalCount} document{totalCount !== 1 ? 's' : ''}
            {selectedCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
                {selectedCount} selected
              </span>
            )}
          </span>
        </div>

        {/* Right side - Sort and filter */}
        <div className="flex items-center space-x-2">
          {/* Category Filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={clsx(
                'flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm transition-colors',
                viewSettings.filterCategory === 'all'
                  ? 'text-gray-600 hover:bg-gray-50'
                  : 'text-primary-600 bg-primary-50 hover:bg-primary-100'
              )}
            >
              <FunnelIcon className="w-4 h-4" />
              <span className={currentFilterCategory?.color}>
                {currentFilterCategory?.label}
              </span>
              {viewSettings.filterCategory !== 'all' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateViewSettings({ filterCategory: 'all' });
                  }}
                  className="text-gray-400 hover:text-gray-600 ml-1"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              )}
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border py-1 z-20 min-w-[180px]">
                {filterCategories.map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => {
                      updateViewSettings({ filterCategory: key });
                      setShowFilterDropdown(false);
                    }}
                    className={clsx(
                      'flex items-center w-full px-3 py-2 text-sm hover:bg-gray-50',
                      viewSettings.filterCategory === key ? 'bg-gray-50' : ''
                    )}
                  >
                    <span className={color}>{label}</span>
                    {viewSettings.filterCategory === key && (
                      <span className="ml-auto text-primary-600">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-50"
            >
              <ArrowsUpDownIcon className="w-4 h-4" />
              <span>{currentSortOption?.label}</span>
              <span className="text-xs text-gray-400">
                {viewSettings.sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            </button>

            {showSortDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border py-1 z-20 min-w-[150px]">
                {sortOptions.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => {
                      updateViewSettings({ sortField: key });
                      setShowSortDropdown(false);
                    }}
                    className={clsx(
                      'flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-gray-50',
                      viewSettings.sortField === key ? 'bg-gray-50' : ''
                    )}
                  >
                    <span>{label}</span>
                    {viewSettings.sortField === key && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSortDirection();
                        }}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {viewSettings.sortDirection === 'asc' ? '↑' : '↓'}
                      </button>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Parsed Only Toggle */}
          <label className="flex items-center space-x-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={viewSettings.showParsedOnly}
              onChange={(e) => updateViewSettings({ showParsedOnly: e.target.checked })}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="text-gray-600">Parsed only</span>
          </label>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-lg border p-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">File Size</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500">
                <option>Any size</option>
                <option>Less than 1MB</option>
                <option>1MB - 10MB</option>
                <option>10MB - 100MB</option>
                <option>More than 100MB</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary-500 focus:border-primary-500">
                <option>Any time</option>
                <option>Today</option>
                <option>This week</option>
                <option>This month</option>
                <option>This year</option>
                <option>Custom range</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">AI Features</label>
              <div className="space-y-2">
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2 w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                  Has summary
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2 w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                  Has FAQ
                </label>
                <label className="flex items-center text-sm">
                  <input type="checkbox" className="mr-2 w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                  Has questions
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
            <Button variant="outline" size="sm">
              Reset Filters
            </Button>
            <Button variant="primary" size="sm">
              Apply Filters
            </Button>
          </div>
        </motion.div>
      )}

      {/* Click away handlers */}
      {(showSortDropdown || showFilterDropdown) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowSortDropdown(false);
            setShowFilterDropdown(false);
          }}
        />
      )}
    </div>
  );
}
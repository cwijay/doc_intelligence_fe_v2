'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FolderIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FolderCard from './FolderCard';
import { Folder, FolderFilters } from '@/types/api';
import { clsx } from 'clsx';

interface FolderListProps {
  folders: Folder[];
  isLoading?: boolean;
  error?: string | null;
  onCreateFolder?: () => void;
  onEditFolder?: (folder: Folder) => void;
  onDeleteFolder?: (folder: Folder) => void;
  onFolderClick?: (folder: Folder) => void;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  filters?: FolderFilters;
  onFiltersChange?: (filters: FolderFilters) => void;
}

export default function FolderList({
  folders,
  isLoading = false,
  error = null,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  onFolderClick,
  searchTerm = '',
  onSearchChange,
  filters,
  onFiltersChange,
}: FolderListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-poppins font-bold text-secondary-900 flex items-center space-x-3">
              <FolderIcon className="w-7 h-7 text-primary-600" />
              <span>Folders</span>
            </h2>
            <p className="text-secondary-600 mt-1">
              Organize your documents in folders
            </p>
          </div>
          
          {onCreateFolder && (
            <Button
              variant="primary"
              icon={<PlusIcon className="w-4 h-4" />}
              onClick={onCreateFolder}
            >
              New Folder
            </Button>
          )}
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" className="border-error-200">
        <CardContent className="p-8 text-center">
          <div className="text-error-600 mb-4">
            <FolderIcon className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-error-900 mb-2">Failed to load folders</h3>
          <p className="text-error-600">{error || 'An unknown error occurred'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-poppins font-bold text-secondary-900 flex items-center space-x-3">
            <FolderIcon className="w-7 h-7 text-primary-600" />
            <span>Folders</span>
          </h2>
          <p className="text-secondary-600 mt-1">
            Organize your documents in folders
          </p>
        </div>
        
        {onCreateFolder && (
          <Button
            variant="primary"
            icon={<PlusIcon className="w-4 h-4" />}
            onClick={onCreateFolder}
          >
            New Folder
          </Button>
        )}
      </div>

      {/* Search and filters */}
      {(onSearchChange || onFiltersChange) && (
        <div className="flex flex-col lg:flex-row gap-4">
          {onSearchChange && (
            <div className="flex-1">
              <Input
                placeholder="Search folders..."
                value={searchTerm}
                onChange={handleSearchChange}
                icon={<MagnifyingGlassIcon className="w-4 h-4" />}
                className="w-full"
              />
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              icon={<FunnelIcon className="w-4 h-4" />}
            >
              Filters
            </Button>
            
            <div className="flex bg-secondary-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                icon={<Squares2X2Icon className="w-4 h-4" />}
              />
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                icon={<ViewColumnsIcon className="w-4 h-4" />}
              />
            </div>
          </div>
        </div>
      )}

      {/* Folders */}
      {folders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-xl font-poppins font-semibold text-secondary-900 mb-2">
              No folders found
            </h3>
            <p className="text-secondary-600 mb-6">
              {searchTerm ? 'No folders match your search criteria.' : 'Create your first folder to organize your documents.'}
            </p>
            {onCreateFolder && (
              <Button
                variant="primary"
                icon={<PlusIcon className="w-4 h-4" />}
                onClick={onCreateFolder}
              >
                Create Folder
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={clsx(
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
              : 'space-y-4'
          )}
        >
          {folders.map((folder, index) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onEdit={onEditFolder}
              onDelete={onDeleteFolder}
              onClick={onFolderClick}
              className={viewMode === 'list' ? 'w-full' : ''}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
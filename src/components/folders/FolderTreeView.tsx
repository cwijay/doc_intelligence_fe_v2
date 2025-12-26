'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderIcon,
  FolderOpenIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Folder, Document } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';
import { formatFileSize, getFileTypeIcon } from '@/lib/file-utils';
import { useFolderDocuments } from '@/hooks/useFolders';
import { useAuth } from '@/hooks/useAuth';

interface FolderTreeItemProps {
  folder: Folder;
  onEdit?: (folder: Folder) => void;
  onDelete?: (folder: Folder) => void;
  onCreateFolder?: () => void;
  level?: number;
}

function FolderTreeItem({ 
  folder, 
  onEdit, 
  onDelete, 
  onCreateFolder,
  level = 0 
}: FolderTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuth();
  const organizationId = user?.org_id || '';

  // Fetch documents for this folder when expanded
  const { data: documentsData, isLoading: documentsLoading, error: documentsError } = useFolderDocuments(
    organizationId,
    folder.id,
    folder.name,
    isExpanded && !!organizationId
  );

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(folder);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(folder);
    }
  };

  const indentationStyle = {
    paddingLeft: `${level * 24}px`
  };

  return (
    <div className="border-l-2 border-secondary-100 last:border-l-0">
      {/* Folder Header */}
      <div
        style={indentationStyle}
        className="flex items-center group hover:bg-secondary-50 rounded-lg p-3 cursor-pointer transition-colors duration-200"
        onClick={handleToggleExpand}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Expand/Collapse Icon */}
        <div className="flex-shrink-0 mr-2">
          {documentsData?.documents.length ? (
            isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 text-secondary-500" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-secondary-500" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </div>

        {/* Folder Icon */}
        <div className="flex-shrink-0 mr-3">
          {isExpanded ? (
            <FolderOpenIcon className="w-5 h-5 text-primary-600" />
          ) : (
            <FolderIcon className="w-5 h-5 text-primary-600" />
          )}
        </div>

        {/* Folder Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-secondary-900 truncate group-hover:text-primary-600 transition-colors">
                {folder.name}
              </h3>
              <div className="flex items-center space-x-3 text-xs text-secondary-500 mt-1">
                <span className="flex items-center space-x-1">
                  <DocumentTextIcon className="w-3 h-3" />
                  <span>
                    {typeof folder.document_count === 'number' 
                      ? `${folder.document_count} document${folder.document_count !== 1 ? 's' : ''}`
                      : '— documents'
                    }
                  </span>
                </span>
                <span>
                  {formatDistanceToNow(new Date(folder.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Action Menu */}
            {(onEdit || onDelete) && (
              <Menu as="div" className="relative" onClick={(e) => e.stopPropagation()}>
                <Menu.Button 
                  as={Button} 
                  variant="ghost" 
                  size="sm"
                  className={`transition-opacity duration-200 ${
                    isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <EllipsisVerticalIcon className="w-4 h-4" />
                </Menu.Button>
                
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-strong ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      {onEdit && (
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleEdit}
                              className={`${
                                active ? 'bg-secondary-50 text-secondary-900' : 'text-secondary-700'
                              } flex items-center space-x-2 px-4 py-2 text-sm w-full text-left`}
                            >
                              <PencilIcon className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                          )}
                        </Menu.Item>
                      )}
                      {onDelete && (
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleDelete}
                              className={`${
                                active ? 'bg-error-50 text-error-900' : 'text-error-700'
                              } flex items-center space-x-2 px-4 py-2 text-sm w-full text-left`}
                            >
                              <TrashIcon className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          )}
                        </Menu.Item>
                      )}
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            )}
          </div>
        </div>
      </div>

      {/* Documents List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div style={{ paddingLeft: `${(level + 1) * 24}px` }} className="space-y-1 py-2">
              {documentsLoading && (
                <div className="flex items-center space-x-2 p-2 text-sm text-secondary-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  <span>Loading documents...</span>
                </div>
              )}
              
              {documentsError && (
                <div className="p-2 text-sm text-error-600">
                  Failed to load documents: {documentsError instanceof Error ? documentsError.message : 'Unknown error'}
                </div>
              )}
              
              {documentsData?.documents.map((document: Document) => (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-3 p-2 hover:bg-secondary-50 rounded-md group cursor-pointer transition-colors duration-150"
                >
                  {/* Document Icon */}
                  <div className="flex-shrink-0 text-lg">
                    {getFileTypeIcon(document.type)}
                  </div>
                  
                  {/* Document Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-secondary-900 truncate group-hover:text-primary-600 transition-colors">
                          {document.name}
                        </p>
                        <div className="flex items-center space-x-3 text-xs text-secondary-500">
                          <span>{formatFileSize(document.size)}</span>
                          <span>{document.type?.toUpperCase() || 'FILE'}</span>
                          <span>
                            {document.uploaded_at && !isNaN(new Date(document.uploaded_at).getTime()) 
                              ? formatDistanceToNow(new Date(document.uploaded_at), { addSuffix: true })
                              : '—'
                            }
                          </span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {/* Parse Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<CpuChipIcon className="w-3 h-3" />}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement parse functionality
                            console.log('Parse document:', document.name);
                          }}
                        >
                          Parse
                        </Button>
                        
                        {/* Status Badge */}
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                          {document.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {documentsData?.documents.length === 0 && !documentsLoading && !documentsError && (
                <div className="p-2 text-sm text-secondary-500 italic">
                  No documents in this folder
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FolderTreeViewProps {
  folders: Folder[];
  isLoading?: boolean;
  error?: string | null;
  onCreateFolder?: () => void;
  onEditFolder?: (folder: Folder) => void;
  onDeleteFolder?: (folder: Folder) => void;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
}

export default function FolderTreeView({
  folders,
  isLoading = false,
  error = null,
  onCreateFolder,
  onEditFolder,
  onDeleteFolder,
  searchTerm = '',
  onSearchChange,
}: FolderTreeViewProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
            <span>Folders & Documents</span>
          </h2>
          <p className="text-secondary-600 mt-1">
            Organize and browse your documents in a tree structure
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

      {/* Search */}
      {onSearchChange && (
        <div className="max-w-md">
          <input
            type="text"
            placeholder="Search folders..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      )}

      {/* Tree View */}
      {filteredFolders.length === 0 ? (
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
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-secondary-100">
              {filteredFolders.map((folder) => (
                <FolderTreeItem
                  key={folder.id}
                  folder={folder}
                  onEdit={onEditFolder}
                  onDelete={onDeleteFolder}
                  onCreateFolder={onCreateFolder}
                  level={0}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
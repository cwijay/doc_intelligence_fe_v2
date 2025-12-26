'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FolderIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Folder } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';

interface FolderCardProps {
  folder: Folder;
  onEdit?: (folder: Folder) => void;
  onDelete?: (folder: Folder) => void;
  onClick?: (folder: Folder) => void;
  className?: string;
}

export default function FolderCard({ 
  folder, 
  onEdit, 
  onDelete, 
  onClick,
  className = '' 
}: FolderCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleCardClick = () => {
    if (onClick) {
      onClick(folder);
    }
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card 
        hover 
        className="group cursor-pointer h-full"
        onClick={handleCardClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <FolderIcon className="w-8 h-8 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors duration-200 truncate">
                  {folder.name}
                </h3>
                {folder.description && (
                  <p className="text-sm text-secondary-600 mt-1 line-clamp-2">
                    {folder.description}
                  </p>
                )}
              </div>
            </div>
            
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
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-secondary-600 gap-3">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <DocumentTextIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {typeof folder.document_count === 'number' 
                    ? `${folder.document_count} document${folder.document_count !== 1 ? 's' : ''}`
                    : '— documents'
                  }
                </span>
              </div>
              <span className="text-xs text-secondary-500 flex-shrink-0">
                {formatDistanceToNow(new Date(folder.created_at), { addSuffix: true })}
              </span>
            </div>
            
            {folder.parent_folder_id && (
              <div className="text-xs text-secondary-500">
                <span className="inline-flex items-center px-2 py-1 bg-secondary-100 text-secondary-700 rounded">
                  Subfolder
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
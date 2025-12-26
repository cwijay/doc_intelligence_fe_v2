'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FolderIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useCreateFolder } from '@/hooks/useFolders';
import { FolderCreateRequest } from '@/types/api';
import toast from 'react-hot-toast';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  parentFolderId?: string;
}

interface CreateFolderFormData extends FolderCreateRequest {}

export default function CreateFolderModal({
  isOpen,
  onClose,
  organizationId,
  parentFolderId,
}: CreateFolderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createFolder = useCreateFolder();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CreateFolderFormData>({
    mode: 'onChange',
    defaultValues: {
      parent_folder_id: parentFolderId,
    },
  });

  const onSubmit = async (data: CreateFolderFormData) => {
    if (!organizationId) {
      toast.error('Organization ID is required');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await createFolder.mutateAsync({
        orgId: organizationId,
        data: {
          ...data,
          parent_folder_id: parentFolderId,
        },
      });

      toast.success('Folder created successfully!');
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to create folder:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      
      let errorMessage = 'Failed to create folder. Please try again.';
      
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if ('response' in error && error.response && typeof error.response === 'object') {
          const response = error.response as any;
          if (response.data?.message) {
            errorMessage = response.data.message;
          } else if (response.data?.error) {
            errorMessage = response.data.error;
          }
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="flex items-center justify-between p-6 border-b border-secondary-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <FolderIcon className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-secondary-900">
              Create New Folder
            </h2>
            <p className="text-sm text-secondary-600">
              {parentFolderId ? 'Create a subfolder' : 'Create a new folder to organize your documents'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          <XMarkIcon className="w-5 h-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        <div className="space-y-4">
          <Input
            label="Folder Name"
            {...register('name', {
              required: 'Folder name is required',
              minLength: { value: 1, message: 'Folder name cannot be empty' },
              maxLength: { value: 100, message: 'Folder name must be less than 100 characters' },
              pattern: {
                value: /^[^<>:"/\\|?*]+$/,
                message: 'Folder name contains invalid characters',
              },
            })}
            error={errors.name?.message}
            placeholder="Enter folder name"
            disabled={isSubmitting}
            autoFocus
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-700">
              Description (Optional)
            </label>
            <textarea
              {...register('description', {
                maxLength: { value: 500, message: 'Description must be less than 500 characters' },
              })}
              className="block w-full px-3 py-2 border border-secondary-300 rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed disabled:opacity-60 resize-none"
              rows={3}
              placeholder="Optional description for this folder"
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-error-600">{errors.description.message}</p>
            )}
          </div>

          {parentFolderId && (
            <div className="p-3 bg-secondary-50 border border-secondary-200 rounded-lg">
              <p className="text-sm text-secondary-700">
                <span className="font-medium">Note:</span> This folder will be created as a subfolder.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Folder'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FolderIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import FormModalHeader from '@/components/ui/FormModalHeader';
import FormModalFooter from '@/components/ui/FormModalFooter';
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
    <Modal isOpen={isOpen} onClose={handleClose} size="md" title="Create New Folder">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormModalHeader
          icon={<FolderIcon className="w-6 h-6" />}
          title="Create Folder"
          description={parentFolderId ? 'Create a subfolder' : 'Create a new folder to organize your documents'}
        />
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

        <FormModalFooter
          onCancel={handleClose}
          isSubmitting={isSubmitting}
          isDisabled={!isValid}
          submitText="Create Folder"
          submittingText="Creating..."
          cancelVariant="outline"
        />
      </form>
    </Modal>
  );
}
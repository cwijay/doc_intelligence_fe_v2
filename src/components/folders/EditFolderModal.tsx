'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FolderIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useUpdateFolder } from '@/hooks/useFolders';
import { Folder, FolderUpdateRequest } from '@/types/api';
import toast from 'react-hot-toast';

interface EditFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: Folder | null;
}

interface EditFolderFormData extends FolderUpdateRequest {}

export default function EditFolderModal({
  isOpen,
  onClose,
  folder,
}: EditFolderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateFolder = useUpdateFolder();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid, isDirty },
  } = useForm<EditFolderFormData>({
    mode: 'onChange',
  });

  // Update form when folder changes
  useEffect(() => {
    if (folder) {
      setValue('name', folder.name);
      setValue('description', folder.description || '');
    }
  }, [folder, setValue]);

  const onSubmit = async (data: EditFolderFormData) => {
    if (!folder) {
      toast.error('No folder selected');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await updateFolder.mutateAsync({
        orgId: folder.organization_id,
        folderId: folder.id,
        data,
      });

      toast.success('Folder updated successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to update folder:', error);
      toast.error('Failed to update folder. Please try again.');
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

  if (!folder) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="flex items-center justify-between p-6 border-b border-secondary-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <FolderIcon className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-secondary-900">
              Edit Folder
            </h2>
            <p className="text-sm text-secondary-600">
              Update folder details
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

          {folder.parent_folder_id && (
            <div className="p-3 bg-secondary-50 border border-secondary-200 rounded-lg">
              <p className="text-sm text-secondary-700">
                <span className="font-medium">Note:</span> This is a subfolder.
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
            disabled={!isValid || !isDirty || isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Folder'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
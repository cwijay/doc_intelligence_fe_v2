'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FolderIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import FormModalHeader from '@/components/ui/FormModalHeader';
import FormModalFooter from '@/components/ui/FormModalFooter';
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
    <Modal isOpen={isOpen} onClose={handleClose} size="md" title="Edit Folder">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormModalHeader
          icon={<FolderIcon className="w-6 h-6" />}
          title="Update Folder"
          description="Update folder details"
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

          {folder.parent_folder_id && (
            <div className="p-3 bg-secondary-50 border border-secondary-200 rounded-lg">
              <p className="text-sm text-secondary-700">
                <span className="font-medium">Note:</span> This is a subfolder.
              </p>
            </div>
          )}
        </div>

        <FormModalFooter
          onCancel={handleClose}
          isSubmitting={isSubmitting}
          isDisabled={!isValid || !isDirty}
          submitText="Update Folder"
          submittingText="Updating..."
          cancelVariant="outline"
        />
      </form>
    </Modal>
  );
}
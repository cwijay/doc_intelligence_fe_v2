'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useUpdateOrganization } from '@/hooks/useOrganizations';
import { OrganizationUpdateRequest, PlanType, Organization } from '@/types/api';

interface EditOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
}

interface FormData {
  name: string;
  domain: string;
  plan_type: PlanType;
}

export default function EditOrganizationModal({ 
  isOpen, 
  onClose, 
  organization 
}: EditOrganizationModalProps) {
  const updateOrganization = useUpdateOrganization();
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormData>();

  // Populate form when organization changes
  useEffect(() => {
    if (organization) {
      setValue('name', organization.name);
      setValue('domain', organization.domain || '');
      setValue('plan_type', organization.plan_type);
    }
  }, [organization, setValue]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    if (!organization) return;

    try {
      const updateData: OrganizationUpdateRequest = {
        name: data.name !== organization.name ? data.name : undefined,
        domain: data.domain !== (organization.domain || '') ? (data.domain || undefined) : undefined,
        plan_type: data.plan_type !== organization.plan_type ? data.plan_type : undefined,
      };

      // Only send fields that have changed
      const hasChanges = Object.values(updateData).some(value => value !== undefined);
      
      if (!hasChanges) {
        toast.success('No changes to save.');
        handleClose();
        return;
      }

      await updateOrganization.mutateAsync({ id: organization.id, data: updateData });
      toast.success(`Organization "${data.name}" updated successfully!`);
      handleClose();
    } catch (error) {
      console.error('Failed to update organization:', error);
      toast.error('Failed to update organization. Please try again.');
    }
  };

  if (!organization) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="Edit Organization"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center space-x-3 p-4 bg-primary-50 rounded-lg">
          <div className="p-2 bg-primary-100 rounded-lg">
            <BuildingOfficeIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h4 className="font-medium text-primary-900">Update Organization</h4>
            <p className="text-sm text-primary-700">Modify organization details and settings.</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Organization Name"
            {...register('name', { 
              required: 'Organization name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
              maxLength: { value: 255, message: 'Name must be less than 255 characters' }
            })}
            error={errors.name?.message}
            placeholder="Enter organization name"
          />

          <Input
            label="Domain (Optional)"
            {...register('domain', {
              pattern: {
                value: /^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$/,
                message: 'Please enter a valid domain name'
              }
            })}
            error={errors.domain?.message}
            placeholder="example.com"
            hint="The organization's website domain"
          />

          <div>
            <label htmlFor="plan_type" className="block text-sm font-medium text-secondary-700 mb-1">
              Plan Type
            </label>
            <select
              id="plan_type"
              {...register('plan_type')}
              className="block w-full border border-secondary-300 rounded-lg px-4 py-2.5 bg-white focus:border-primary-500 focus:ring-primary-500/20 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200"
            >
              <option value="free">Free Plan</option>
              <option value="starter">Starter Plan</option>
              <option value="pro">Pro Plan</option>
            </select>
          </div>
        </div>

        <div className="bg-secondary-50 p-4 rounded-lg">
          <h5 className="text-sm font-medium text-secondary-900 mb-2">Organization Details</h5>
          <div className="space-y-1 text-sm text-secondary-600">
            <p><span className="font-medium">ID:</span> {organization.id}</p>
            <p><span className="font-medium">Created:</span> {new Date(organization.created_at).toLocaleDateString()}</p>
            <p><span className="font-medium">Status:</span> 
              <span className={`ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                organization.is_active 
                  ? 'bg-success-100 text-success-800' 
                  : 'bg-error-100 text-error-800'
              }`}>
                {organization.is_active ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-secondary-200">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Organization'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
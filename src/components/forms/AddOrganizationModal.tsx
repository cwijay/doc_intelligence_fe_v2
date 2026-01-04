'use client';

import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import FormModalHeader from '@/components/ui/FormModalHeader';
import FormModalFooter from '@/components/ui/FormModalFooter';
import { useCreateOrganization } from '@/hooks/useOrganizations';
import { OrganizationCreateRequest, PlanType } from '@/types/api';

interface AddOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  domain: string;
  plan_type: PlanType;
}

export default function AddOrganizationModal({ isOpen, onClose }: AddOrganizationModalProps) {
  const createOrganization = useCreateOrganization();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: {
      plan_type: 'free'
    }
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    try {
      const organizationData: OrganizationCreateRequest = {
        name: data.name,
        domain: data.domain || undefined,
        plan_type: data.plan_type,
        settings: {}
      };

      await createOrganization.mutateAsync(organizationData);
      toast.success(`Organization "${data.name}" created successfully!`);
      handleClose();
    } catch (error) {
      console.error('Failed to create organization:', error);
      toast.error('Failed to create organization. Please try again.');
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="Add New Organization"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormModalHeader
          icon={<BuildingOfficeIcon className="w-6 h-6" />}
          title="Create Organization"
          description="Set up a new organization to manage documents and users."
        />

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

        <FormModalFooter
          onCancel={handleClose}
          isSubmitting={isSubmitting}
          submitText="Create Organization"
          submittingText="Creating..."
        />
      </form>
    </Modal>
  );
}
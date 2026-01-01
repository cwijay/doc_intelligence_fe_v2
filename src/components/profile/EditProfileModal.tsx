'use client';

import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  UserIcon, 
  EnvelopeIcon, 
  AtSymbolIcon,
} from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useUpdateProfile, EnhancedProfile } from '@/hooks/useProfile';
import { SessionUser } from '@/types/auth';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SessionUser | EnhancedProfile;
}

interface FormData {
  full_name: string;
  username: string;
  email: string;
}

export default function EditProfileModal({ 
  isOpen, 
  onClose, 
  currentUser 
}: EditProfileModalProps) {
  const updateProfile = useUpdateProfile();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: {
      full_name: currentUser.full_name || '',
      username: currentUser.username || '',
      email: currentUser.email || '',
    }
  });

  const handleClose = () => {
    reset({
      full_name: currentUser.full_name || '',
      username: currentUser.username || '',
      email: currentUser.email || '',
    });
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Only send fields that have changed
      const changes: Partial<FormData> = {};
      
      if (data.full_name !== currentUser.full_name) {
        changes.full_name = data.full_name;
      }
      if (data.username !== currentUser.username) {
        changes.username = data.username;
      }
      if (data.email !== currentUser.email) {
        changes.email = data.email;
      }

      // If no changes, just close the modal
      if (Object.keys(changes).length === 0) {
        toast.success('No changes to save');
        handleClose();
        return;
      }

      await updateProfile.mutateAsync(changes);
      toast.success('Profile updated successfully!');
      handleClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to update profile. Please try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="Edit Profile"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile Avatar Section */}
        <div className="flex items-center space-x-4 p-4 bg-secondary-50 rounded-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-navy-500 via-brand-cyan-400 to-brand-coral-500 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-white">
              {currentUser.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-secondary-900">Profile Picture</h4>
            <p className="text-sm text-secondary-600">
              Custom profile pictures coming soon
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <Input
            label="Full Name"
            {...register('full_name', { 
              required: 'Full name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
              maxLength: { value: 100, message: 'Name must be less than 100 characters' }
            })}
            error={errors.full_name?.message}
            placeholder="Enter your full name"
            icon={<UserIcon className="w-4 h-4" />}
          />

          <Input
            label="Username"
            {...register('username', {
              required: 'Username is required',
              minLength: { value: 3, message: 'Username must be at least 3 characters' },
              maxLength: { value: 50, message: 'Username must be less than 50 characters' },
              pattern: {
                value: /^[a-zA-Z0-9_-]+$/,
                message: 'Username can only contain letters, numbers, underscores, and hyphens'
              }
            })}
            error={errors.username?.message}
            placeholder="Enter your username"
            icon={<AtSymbolIcon className="w-4 h-4" />}
          />

          <Input
            label="Email Address"
            type="email"
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address'
              },
              maxLength: { value: 255, message: 'Email must be less than 255 characters' }
            })}
            error={errors.email?.message}
            placeholder="Enter your email address"
            icon={<EnvelopeIcon className="w-4 h-4" />}
          />
        </div>

        {/* Information Note */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Some changes may require you to log in again. 
            Your role and organization cannot be changed from this form.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-secondary-200">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting || updateProfile.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting || updateProfile.isPending}
            disabled={isSubmitting || updateProfile.isPending}
          >
            {isSubmitting || updateProfile.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
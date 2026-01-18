'use client';

import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { UserPlusIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import FormModalHeader from '@/components/ui/FormModalHeader';
import FormModalFooter from '@/components/ui/FormModalFooter';
import PasswordRequirements, { requirements } from '@/components/ui/PasswordRequirements';
import { useCreateUser } from '@/hooks/useUsers';
import { UserCreateRequest, UserRole } from '@/types/api';
import { extractFormError } from '@/lib/api/utils/error-utils';
import { useState } from 'react';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
}

interface FormData {
  email: string;
  username: string;
  full_name: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export default function AddUserModal({ 
  isOpen, 
  onClose, 
  orgId 
}: AddUserModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const createUser = useCreateUser(orgId);
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: {
      role: 'user'
    }
  });

  const password = watch('password') || '';

  const validatePassword = (value: string) => {
    const failedRequirements = requirements.filter(req => !req.validator(value));
    if (failedRequirements.length > 0) {
      return `Password must ${failedRequirements[0].text.toLowerCase()}`;
    }
    return true;
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const userData: UserCreateRequest = {
        email: data.email,
        username: data.username,
        full_name: data.full_name,
        password: data.password,
        role: data.role,
      };
      
      await createUser.mutateAsync(userData);
      toast.success(`User "${data.full_name}" created successfully!`);
      handleClose();
    } catch (error: unknown) {
      console.error('Failed to create user:', error);
      const errorMessage = extractFormError(error, 'Failed to create user. Please try again.', 'password');
      toast.error(errorMessage);
    }
  };

  const roleOptions = [
    { value: 'viewer', label: 'Viewer', description: 'Can view organization data' },
    { value: 'user', label: 'User', description: 'Can view and create content' },
    { value: 'admin', label: 'Admin', description: 'Full access to organization' },
  ];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="Add New User"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormModalHeader
          icon={<UserPlusIcon className="w-6 h-6" />}
          title="Create User Account"
          description="Add a new user to this organization."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            {...register('full_name', { 
              required: 'Full name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
              maxLength: { value: 100, message: 'Name must be less than 100 characters' }
            })}
            error={errors.full_name?.message}
            placeholder="John Doe"
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
            placeholder="johndoe"
          />
        </div>

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
          placeholder="john@example.com"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              {...register('password', { 
                required: 'Password is required',
                validate: validatePassword,
                maxLength: { value: 128, message: 'Password must be less than 128 characters' }
              })}
              error={errors.password?.message}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute right-3 top-8 text-secondary-500 hover:text-secondary-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeSlashIcon className="w-4 h-4" />
              ) : (
                <EyeIcon className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword', { 
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match'
              })}
              error={errors.confirmPassword?.message}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute right-3 top-8 text-secondary-500 hover:text-secondary-700"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="w-4 h-4" />
              ) : (
                <EyeIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {password && (
          <div className="mt-4">
            <PasswordRequirements password={password} />
          </div>
        )}

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-secondary-700 mb-3">
            User Role
          </label>
          <div className="space-y-3">
            {roleOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-start space-x-3 p-3 border border-secondary-200 rounded-lg hover:bg-secondary-50 cursor-pointer"
              >
                <input
                  type="radio"
                  {...register('role')}
                  value={option.value}
                  className="mt-0.5 w-4 h-4 text-primary-600 border-secondary-300 focus:ring-primary-500 focus:ring-2"
                />
                <div className="flex-1">
                  <div className="font-medium text-secondary-900">{option.label}</div>
                  <div className="text-sm text-secondary-600">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <FormModalFooter
          onCancel={handleClose}
          isSubmitting={isSubmitting}
          submitText="Create User"
          submittingText="Creating..."
        />
      </form>
    </Modal>
  );
}
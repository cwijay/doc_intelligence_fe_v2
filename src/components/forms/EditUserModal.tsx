'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { UserIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PasswordRequirements, { requirements } from '@/components/ui/PasswordRequirements';
import { useUpdateUser } from '@/hooks/useUsers';
import { UserUpdateRequest, UserRole, User } from '@/types/api';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  user: User | null;
}

interface FormData {
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  password?: string;
  confirmPassword?: string;
}

export default function EditUserModal({ 
  isOpen, 
  onClose, 
  orgId,
  user
}: EditUserModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const updateUser = useUpdateUser(orgId);
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormData>();

  const password = watch('password') || '';

  const validatePassword = (value: string | undefined) => {
    if (!isChangingPassword || !value) return true;
    const failedRequirements = requirements.filter(req => !req.validator(value));
    if (failedRequirements.length > 0) {
      return `Password must ${failedRequirements[0].text.toLowerCase()}`;
    }
    return true;
  };

  // Populate form when user changes
  useEffect(() => {
    if (user) {
      setValue('email', user.email);
      setValue('username', user.username);
      setValue('full_name', user.full_name);
      setValue('role', user.role);
      setIsChangingPassword(false);
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [user, setValue]);

  const handleClose = () => {
    reset();
    setIsChangingPassword(false);
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;

    if (isChangingPassword && data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const updateData: UserUpdateRequest = {};

      // Only send fields that have changed
      if (data.email !== user.email) updateData.email = data.email;
      if (data.username !== user.username) updateData.username = data.username;
      if (data.full_name !== user.full_name) updateData.full_name = data.full_name;
      if (data.role !== user.role) updateData.role = data.role;
      
      // Include password only if user wants to change it
      if (isChangingPassword && data.password) {
        updateData.password = data.password;
      }

      // Check if there are any changes
      const hasChanges = Object.keys(updateData).length > 0;
      
      if (!hasChanges) {
        toast.success('No changes to save.');
        handleClose();
        return;
      }

      await updateUser.mutateAsync({ userId: user.id, data: updateData });
      toast.success(`User "${data.full_name}" updated successfully!`);
      handleClose();
    } catch (error: unknown) {
      console.error('Failed to update user:', error);
      
      let errorMessage = 'Failed to update user. Please try again.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error as { response?: { data?: { message?: string; detail?: unknown } }; message?: string };
        
        if (errorResponse.response?.data?.message) {
          errorMessage = errorResponse.response.data.message;
        } else if (errorResponse.response?.data?.detail) {
          if (Array.isArray(errorResponse.response.data.detail)) {
            const detail = errorResponse.response.data.detail as Array<{ loc?: string[]; msg?: string }>;
            const passwordErrors = detail.filter((err) => 
              err.loc?.includes('password') || err.msg?.toLowerCase().includes('password')
            );
            if (passwordErrors.length > 0 && passwordErrors[0].msg) {
              errorMessage = passwordErrors[0].msg;
            } else if (detail[0]?.msg) {
              errorMessage = detail[0].msg;
            }
          } else if (typeof errorResponse.response.data.detail === 'string') {
            errorMessage = errorResponse.response.data.detail;
          }
        } else if (errorResponse.message && errorResponse.message !== 'Request failed with status code 422') {
          errorMessage = errorResponse.message;
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const roleOptions = [
    { value: 'viewer', label: 'Viewer', description: 'Can view organization data' },
    { value: 'user', label: 'User', description: 'Can view and create content' },
    { value: 'admin', label: 'Admin', description: 'Full access to organization' },
  ];

  if (!user) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="Edit User"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center space-x-3 p-4 bg-primary-50 rounded-lg">
          <div className="p-2 bg-primary-100 rounded-lg">
            <UserIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h4 className="font-medium text-primary-900">Update User Account</h4>
            <p className="text-sm text-primary-700">Modify user details and permissions.</p>
          </div>
        </div>

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

        {/* Password Change Section */}
        <div className="border border-secondary-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h5 className="font-medium text-secondary-900">Password</h5>
              <p className="text-sm text-secondary-600">Leave blank to keep current password</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsChangingPassword(!isChangingPassword)}
            >
              {isChangingPassword ? 'Cancel' : 'Change Password'}
            </Button>
          </div>

          {isChangingPassword && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { 
                      required: isChangingPassword ? 'Password is required' : false,
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
                    label="Confirm New Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword', { 
                      required: isChangingPassword ? 'Please confirm your password' : false,
                      validate: (value) => !isChangingPassword || value === password || 'Passwords do not match'
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
                <div>
                  <PasswordRequirements password={password} />
                </div>
              )}
            </div>
          )}
        </div>

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

        {/* User Details */}
        <div className="bg-secondary-50 p-4 rounded-lg">
          <h5 className="text-sm font-medium text-secondary-900 mb-2">User Details</h5>
          <div className="space-y-1 text-sm text-secondary-600">
            <p><span className="font-medium">ID:</span> {user.id}</p>
            <p><span className="font-medium">Created:</span> {new Date(user.created_at).toLocaleDateString()}</p>
            <p><span className="font-medium">Last Login:</span> {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</p>
            <p><span className="font-medium">Status:</span> 
              <span className={`ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                user.is_active 
                  ? 'bg-success-100 text-success-800' 
                  : 'bg-error-100 text-error-800'
              }`}>
                {user.is_active ? 'Active' : 'Inactive'}
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
            {isSubmitting ? 'Updating...' : 'Update User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
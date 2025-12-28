'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  UserPlusIcon,
  UserIcon,
  LockClosedIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import PasswordRequirements, { requirements } from '@/components/ui/PasswordRequirements';
import { PlanSelector } from '@/components/plans';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/lib/api/auth';
import { organizationsApi } from '@/lib/api/index';
import { extractErrorMessage } from '@/lib/api/utils/error-utils';
import { RegisterRequest } from '@/types/auth';
import { OrganizationCreateRequest, PlanType } from '@/types/api';

interface RegisterFormData extends RegisterRequest {
  confirmPassword: string;
  organization_lookup?: string;
  // Organization creation fields
  company_name?: string;
  company_domain?: string;
  plan_type?: PlanType;
}

interface OrganizationOption {
  id: string;
  name: string;
  domain?: string;
  plan_type: string;
  allow_self_registration: boolean;
}

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [searchingOrgs, setSearchingOrgs] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationOption | null>(null);
  const [registrationType, setRegistrationType] = useState<'join' | 'create'>('create');
  
  const { register: registerUser, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({ mode: 'onChange' });

  const password = watch('password') || '';
  const confirmPassword = watch('confirmPassword') || '';
  const email = watch('email') || '';
  const username = watch('username') || '';
  const fullName = watch('full_name') || '';
  const organizationLookup = watch('organization_lookup') || '';
  const companyName = watch('company_name') || '';

  // Organization validation - requires selection for 'join' or company name for 'create'
  const organizationValid = registrationType === 'create' ? 
    companyName.trim().length >= 2 : 
    selectedOrganization;
  
  // Create a bulletproof validation that works regardless of React Hook Form state
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const emailValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const usernameValid = username && username.length >= 3 && /^[a-zA-Z0-9_-]+$/.test(username);
  const fullNameValid = fullName && fullName.trim().length >= 2;
  
  // Use the same validation logic as the form validator
  const passwordValid = password && requirements && requirements.every(req => req.validator(password));
  
  const allFieldsValid = emailValid && usernameValid && fullNameValid && passwordValid && passwordsMatch;
  const isFormValid = allFieldsValid && organizationValid;



  const validatePassword = (value: string) => {
    if (!value) return 'Password is required';
    const failedRequirements = requirements?.filter(req => !req.validator(value)) || [];
    if (failedRequirements.length > 0) {
      return `Password must ${failedRequirements[0].text.toLowerCase()}`;
    }
    return true;
  };

  const loadOrganizations = async () => {
    try {
      setSearchingOrgs(true);
      
      // Check if we're in development mode with no backend
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Development mode: Attempting to load organizations...');
        
        // Try to connect with a short timeout for development
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Development timeout')), 3000)
        );
        
        try {
          const response = await Promise.race([
            authApi.getOrganizations(),
            timeoutPromise
          ]) as { id: string; name: string; domain?: string; plan_type: string }[];

          // Success - backend is available
          const orgOptions = response.map((org: { id: string; name: string; domain?: string; plan_type: string }) => ({
            id: org.id,
            name: org.name,
            domain: org.domain,
            plan_type: org.plan_type,
            allow_self_registration: true
          }));
          setOrganizations(orgOptions);
          console.log('✅ Organizations loaded from backend in development');
          return;
        } catch {
          console.log('⚠️ Backend not available in development, using fallback organizations');
          
          // Fallback organizations for development
          const fallbackOrgs = [
            {
              id: 'dev-org-1',
              name: 'Development Organization',
              domain: 'dev.local',
              plan_type: 'enterprise',
              allow_self_registration: true
            },
            {
              id: 'dev-org-2', 
              name: 'Test Company',
              domain: 'test.local',
              plan_type: 'professional',
              allow_self_registration: true
            }
          ];
          
          setOrganizations(fallbackOrgs);
          toast.success('Using development organizations (backend offline)');
          return;
        }
      }
      
      // Production mode - require backend connection
      const response = await authApi.getOrganizations();
      const orgOptions = response.map((org: { id: string; name: string; domain?: string; plan_type: string }) => ({
        id: org.id,
        name: org.name,
        domain: org.domain,
        plan_type: org.plan_type,
        allow_self_registration: true
      }));
      setOrganizations(orgOptions);
      
    } catch (error) {
      console.error('Failed to load organizations:', error);
      
      if (process.env.NODE_ENV === 'development') {
        toast.error('Backend unavailable - check if services are running');
        console.log('💡 Development tip: Start backend services or use offline development mode');
      } else {
        toast.error('Failed to load organizations - please try again');
      }
      
      setOrganizations([]);
    } finally {
      setSearchingOrgs(false);
    }
  };

  // Load organizations on component mount
  useEffect(() => {
    loadOrganizations();
  }, []);

  const onSubmit = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      clearError();

      // Build base register data - organization_id will be added below
      const registerData: Omit<RegisterRequest, 'organization_id'> & { organization_id?: string } = {
        email: data.email,
        username: data.username,
        full_name: data.full_name,
        password: data.password,
      };

      if (registrationType === 'create') {
        // Create new organization first
        if (!data.company_name || data.company_name.trim().length < 2) {
          toast.error('Please enter a valid company name');
          return;
        }

        const organizationData: OrganizationCreateRequest = {
          name: data.company_name.trim(),
          domain: data.company_domain || data.email.split('@')[1],
          plan_type: data.plan_type || 'free',
        };

        console.log('Creating new organization:', organizationData);

        try {
          const newOrganization = await organizationsApi.create(organizationData);
          console.log('Organization created successfully:', newOrganization);

          registerData.organization_id = newOrganization.id;
          toast.success(`Company "${newOrganization.name}" created successfully!`);
        } catch (orgError: any) {
          console.error('Organization creation failed:', orgError);

          // Extract meaningful error message from backend response
          const errorMsg = extractErrorMessage(orgError);

          if (orgError?.message?.includes('ECONNREFUSED') || orgError?.message?.includes('ERR_NETWORK')) {
            if (process.env.NODE_ENV === 'development') {
              throw new Error('Backend server not available. Please start the API server to create organizations.');
            } else {
              throw new Error('Service temporarily unavailable. Please try again later.');
            }
          } else if (orgError?.response?.status === 409) {
            throw new Error('A company with this name or domain already exists.');
          } else if (orgError?.response?.status === 422) {
            throw new Error('Invalid company information. Please check your inputs.');
          } else {
            throw new Error(errorMsg);
          }
        }
      } else {
        // Join existing organization - organization_id is required
        if (!selectedOrganization) {
          toast.error('Please select an organization to join');
          return;
        }
        registerData.organization_id = selectedOrganization.id;
      }

      // At this point organization_id is guaranteed to be set
      await registerUser(registerData as RegisterRequest);
      toast.success('Registration successful!');
      router.push('/dashboard'); // Redirect to dashboard
    } catch (error: any) {
      console.error('Registration failed:', error);

      // Extract meaningful error message from backend response
      const errorMsg = extractErrorMessage(error);

      // Enhanced error handling for different scenarios
      if (error?.message?.includes('ECONNREFUSED') || error?.message?.includes('ERR_NETWORK')) {
        if (process.env.NODE_ENV === 'development') {
          toast.error('Backend server not available. Please start the API server on port 8000.');
          console.log('💡 Development tip: Run the backend API server to enable registration');
        } else {
          toast.error('Service temporarily unavailable. Please try again later.');
        }
      } else if (error?.message?.includes('timeout')) {
        toast.error('Registration request timed out. Please check your connection and try again.');
      } else if (error?.response?.status === 409) {
        toast.error('An account with this email or username already exists.');
      } else if (error?.response?.status === 422) {
        toast.error('Invalid registration data. Please check your inputs and try again.');
      } else if (error?.response?.status >= 500) {
        // Use the extracted message from backend for 500 errors
        toast.error(errorMsg);
      } else {
        // Use the extracted message for all other cases
        toast.error(errorMsg);
      }
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center justify-center mb-6">
          <div className="p-3 bg-primary-100 rounded-full">
            <UserPlusIcon className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center text-secondary-900">
          Create Account
        </CardTitle>
        <p className="text-center text-secondary-600 mt-2">
          Create your account and join our platform
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
              <p className="text-sm text-error-700">{error || 'Registration failed'}</p>
            </div>
          )}

          {/* FORM COMPLETION ASSISTANT */}
          <div className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-xl text-sm space-y-2">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
              <p className="font-semibold text-primary-800">✨ Smart Form Assistant</p>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="flex items-center space-x-1">
                <span>{emailValid ? '✅' : '⚪'}</span>
                <span className={emailValid ? 'text-success-700' : 'text-secondary-500'}>Valid Email</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>{usernameValid ? '✅' : '⚪'}</span>
                <span className={usernameValid ? 'text-success-700' : 'text-secondary-500'}>Username Ready</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>{fullNameValid ? '✅' : '⚪'}</span>
                <span className={fullNameValid ? 'text-success-700' : 'text-secondary-500'}>Name Complete</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>{passwordsMatch ? '✅' : '⚪'}</span>
                <span className={passwordsMatch ? 'text-success-700' : 'text-secondary-500'}>Passwords Match</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>{passwordValid ? '✅' : '⚪'}</span>
                <span className={passwordValid ? 'text-success-700' : 'text-secondary-500'}>Secure Password</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>{organizationValid ? '✅' : '⚪'}</span>
                <span className={organizationValid ? 'text-success-700' : 'text-secondary-500'}>
                  {registrationType === 'create' ? 'Company Ready' : 'Organization Set'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 mt-3 border-t border-primary-200">
              <span className="text-xs text-primary-700 font-medium">Account Setup Progress</span>
              <div className="flex items-center space-x-2">
                {isFormValid ? (
                  <span className="text-success-700 font-semibold text-xs">
                    🚀 Ready to {registrationType === 'create' ? 'Create Company!' : 'Join Team!'}
                  </span>
                ) : (
                  <span className="text-amber-600 font-semibold text-xs">⏳ Almost There...</span>
                )}
              </div>
            </div>
          </div>



          {/* Registration Type Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-secondary-700">
              Choose Registration Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setRegistrationType('create');
                  setSelectedOrganization(null);
                  setValue('organization_lookup', '');
                }}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  registrationType === 'create'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-secondary-200 bg-white text-secondary-600 hover:border-secondary-300'
                }`}
              >
                <div className="text-center">
                  <BuildingOfficeIcon className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-medium">Create New Company</p>
                  <p className="text-xs mt-1">Start fresh with your own company</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRegistrationType('join')}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  registrationType === 'join'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-secondary-200 bg-white text-secondary-600 hover:border-secondary-300'
                }`}
              >
                <div className="text-center">
                  <UserPlusIcon className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-medium">Join Existing Company</p>
                  <p className="text-xs mt-1">Join your team&apos;s organization</p>
                </div>
              </button>
            </div>
          </div>

          {/* Company Creation Form - Show when creating new company */}
          {registrationType === 'create' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-secondary-900">Company Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <Input
                  label="Company Name"
                  {...register('company_name', {
                    required: 'Company name is required',
                    minLength: { value: 2, message: 'Company name must be at least 2 characters' },
                    maxLength: { value: 100, message: 'Company name must be less than 100 characters' }
                  })}
                  error={errors.company_name?.message}
                  placeholder="Acme Corporation"
                  icon={<BuildingOfficeIcon className="w-4 h-4" />}
                />
                
                <Input
                  label="Company Domain (Optional)"
                  {...register('company_domain', {
                    pattern: {
                      value: /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
                      message: 'Please enter a valid domain name'
                    }
                  })}
                  error={errors.company_domain?.message}
                  placeholder="acme.com (auto-filled from email if empty)"
                  hint="Leave empty to auto-generate from your email domain"
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300">
                    Select Your Plan
                  </label>
                  <PlanSelector
                    value={watch('plan_type') || 'free'}
                    onChange={(planId) => setValue('plan_type', planId)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Organization Search - Only show when joining existing */}
          {registrationType === 'join' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary-700">
              Find Your Organization
            </label>
            <div className="relative">
              <Input
                {...register('organization_lookup')}
                placeholder="Filter organizations..."
                icon={<MagnifyingGlassIcon className="w-4 h-4" />}
              />
              {searchingOrgs && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                </div>
              )}
            </div>
            
            {Array.isArray(organizations) && organizations.length > 0 && (
              <div className="max-h-40 overflow-y-auto border border-secondary-200 rounded-lg">
                {organizations
                  .filter(org => org && org.id && org.name && (!organizationLookup || 
                    org.name.toLowerCase().includes(organizationLookup.toLowerCase()) ||
                    (org.domain && org.domain.toLowerCase().includes(organizationLookup.toLowerCase()))
                  ))
                  .map((org) => (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => {
                        setSelectedOrganization(org);
                        setValue('organization_lookup', org.name || '');
                      }}
                      className="w-full text-left p-3 hover:bg-secondary-50 transition-colors border-b border-secondary-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-secondary-900">{org.name || 'Unknown Organization'}</p>
                          {org.domain && (
                            <p className="text-sm text-secondary-600">{org.domain}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            org.allow_self_registration
                              ? 'bg-success-100 text-success-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {org.allow_self_registration ? 'Open' : 'Invite Only'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            )}

            {selectedOrganization && selectedOrganization.name && (
              <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <BuildingOfficeIcon className="w-4 h-4 text-success-600" />
                  <p className="text-sm text-success-800">
                    Selected: <strong>{selectedOrganization.name}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Personal Information */}
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
              placeholder="johndoe"
              icon={<UserIcon className="w-4 h-4" />}
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
            icon={<EnvelopeIcon className="w-4 h-4" />}
          />

          {/* Password Section */}
          <div className="space-y-4">
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
                  icon={<LockClosedIcon className="w-4 h-4" />}
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
                  icon={<LockClosedIcon className="w-4 h-4" />}
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
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={isSubmitting || isLoading}
            disabled={isSubmitting || isLoading || !isFormValid}
          >
            {isSubmitting || isLoading 
              ? (registrationType === 'create' ? 'Creating Company & Account...' : 'Creating Account...')
              : (registrationType === 'create' ? 'Create Company & Account' : 'Create Account')
            }
          </Button>

        </form>
      </CardContent>
    </Card>
  );
}
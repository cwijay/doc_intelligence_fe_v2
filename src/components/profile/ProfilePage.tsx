'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  UserCircleIcon, 
  PencilIcon, 
  BuildingOfficeIcon,
  EnvelopeIcon,
  AtSymbolIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  CalendarIcon,
  ChevronLeftIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useProfile, useUserOrganization, EnhancedProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import EditProfileModal from './EditProfileModal';

export default function ProfilePage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile();
  const { data: organization, isLoading: orgLoading } = useUserOrganization();

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-secondary-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="h-96 bg-secondary-200 rounded-lg"></div>
              </div>
              <div className="space-y-6">
                <div className="h-48 bg-secondary-200 rounded-lg"></div>
                <div className="h-32 bg-secondary-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-error-600 mb-4">
                <UserCircleIcon className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-secondary-900 mb-2">
                Failed to Load Profile
              </h3>
              <p className="text-secondary-600 mb-4">
                {profileError ? (typeof profileError === 'string' ? profileError : (profileError as Error)?.message || String(profileError)) : 'Unable to load profile information'}
              </p>
              <Button 
                variant="primary" 
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentUser = profile || user;

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-secondary-600">No user information available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-secondary-600 mb-6">
          <Link 
            href="/dashboard" 
            className="flex items-center space-x-1 hover:text-primary-600 transition-colors duration-200"
          >
            <HomeIcon className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <ChevronLeftIcon className="w-4 h-4 rotate-180" />
          <span className="text-secondary-900 font-medium">Profile Settings</span>
        </nav>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Link 
                href="/dashboard" 
                className="inline-flex items-center space-x-2 text-secondary-600 hover:text-primary-600 transition-colors duration-200"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                <span className="text-sm">Back to Dashboard</span>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-secondary-900">Profile Settings</h1>
            <p className="text-secondary-600 mt-2">
              Manage your account information and preferences
            </p>
          </div>
          <Button
            variant="primary"
            icon={<PencilIcon className="w-4 h-4" />}
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCircleIcon className="w-5 h-5" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture Placeholder */}
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {currentUser.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-secondary-900">
                      {currentUser.full_name}
                    </h3>
                    <p className="text-secondary-600">@{currentUser.username}</p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="flex items-center text-sm font-medium text-secondary-700">
                      <EnvelopeIcon className="w-4 h-4 mr-2" />
                      Email Address
                    </label>
                    <p className="text-secondary-900">{currentUser.email}</p>
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center text-sm font-medium text-secondary-700">
                      <AtSymbolIcon className="w-4 h-4 mr-2" />
                      Username
                    </label>
                    <p className="text-secondary-900">@{currentUser.username}</p>
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center text-sm font-medium text-secondary-700">
                      <IdentificationIcon className="w-4 h-4 mr-2" />
                      Full Name
                    </label>
                    <p className="text-secondary-900">{currentUser.full_name}</p>
                  </div>

                  <div className="space-y-1">
                    <label className="flex items-center text-sm font-medium text-secondary-700">
                      <ShieldCheckIcon className="w-4 h-4 mr-2" />
                      Role
                    </label>
                    <p className="text-secondary-900 capitalize">
                      {currentUser.role || 'User'}
                    </p>
                  </div>
                </div>

                {/* Account Information */}
                <div className="pt-4 border-t border-secondary-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-secondary-600">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      <span>User ID: {(currentUser as EnhancedProfile)?.id || (currentUser as any)?.user_id}</span>
                    </div>
                    {(currentUser as EnhancedProfile)?.session_id && (
                      <div className="flex items-center text-secondary-600">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        <span>Session ID: {(currentUser as EnhancedProfile).session_id}</span>
                      </div>
                    )}
                    {(currentUser as EnhancedProfile)?.is_active !== undefined && (
                      <div className="flex items-center text-secondary-600">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        <span>Status: {(currentUser as EnhancedProfile).is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                    )}
                    {(currentUser as EnhancedProfile)?.last_login && (
                      <div className="flex items-center text-secondary-600">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        <span>Last Login: {new Date((currentUser as EnhancedProfile).last_login!).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organization Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BuildingOfficeIcon className="w-5 h-5" />
                  <span>Organization</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orgLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-secondary-200 rounded w-3/4"></div>
                    <div className="h-3 bg-secondary-200 rounded w-1/2"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium text-secondary-900">
                      {organization?.name || (currentUser as EnhancedProfile)?.org_name || 'Unknown Organization'}
                    </p>
                    <p className="text-sm text-secondary-600">
                      Organization ID: {currentUser.org_id}
                    </p>
                    {organization?.plan_type && (
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 capitalize">
                        {organization.plan_type} Plan
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => console.log('Change password')}
                  disabled
                >
                  <ShieldCheckIcon className="w-4 h-4 mr-2" />
                  Change Password
                  <span className="ml-auto text-xs text-secondary-500">Soon</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Profile Modal */}
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}
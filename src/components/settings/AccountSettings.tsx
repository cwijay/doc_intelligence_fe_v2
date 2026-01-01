'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  UserIcon,
  PencilIcon,
  ShieldCheckIcon,
  BellIcon,
  ClockIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  AtSymbolIcon,
  IdentificationIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, EnhancedProfile } from '@/hooks/useProfile';

export default function AccountSettings() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const currentUser = profile || user;

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-48 bg-secondary-200 rounded-lg mb-6"></div>
          <div className="h-32 bg-secondary-200 rounded-lg mb-6"></div>
          <div className="h-32 bg-secondary-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-error-600 mx-auto mb-4" />
          <p className="text-secondary-600">Unable to load account information</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <UserIcon className="w-5 h-5" />
              <span>Profile Information</span>
            </CardTitle>
            <Link href="/profile">
              <Button variant="outline" size="sm" icon={<PencilIcon className="w-4 h-4" />}>
                Edit Profile
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Picture and Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-navy-500 via-brand-cyan-400 to-brand-coral-500 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {currentUser.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900">
                    {currentUser.full_name}
                  </h3>
                  <p className="text-secondary-600">@{currentUser.username}</p>
                  <p className="text-xs text-secondary-500 capitalize mt-1">
                    {currentUser.role} • {(currentUser as EnhancedProfile)?.org_name || 'Unknown Org'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="w-4 h-4 text-secondary-500" />
                <div>
                  <p className="text-sm font-medium text-secondary-700">Email</p>
                  <p className="text-secondary-900">{currentUser.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <AtSymbolIcon className="w-4 h-4 text-secondary-500" />
                <div>
                  <p className="text-sm font-medium text-secondary-700">Username</p>
                  <p className="text-secondary-900">@{currentUser.username}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <ShieldCheckIcon className="w-4 h-4 text-secondary-500" />
                <div>
                  <p className="text-sm font-medium text-secondary-700">Role</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 capitalize">
                    {currentUser.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Status Information */}
          {(currentUser as EnhancedProfile)?.is_active !== undefined && (
            <div className="mt-6 pt-6 border-t border-secondary-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    (currentUser as EnhancedProfile).is_active ? 'bg-success-500' : 'bg-error-500'
                  }`}></div>
                  <span className="text-secondary-600">
                    Status: {(currentUser as EnhancedProfile).is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {(currentUser as EnhancedProfile)?.last_login && (
                  <div className="flex items-center space-x-2 text-secondary-600">
                    <ClockIcon className="w-4 h-4" />
                    <span>
                      Last login: {new Date((currentUser as EnhancedProfile).last_login!).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-secondary-600">
                  <IdentificationIcon className="w-4 h-4" />
                  <span>
                    ID: {(currentUser as EnhancedProfile)?.id || (currentUser as any)?.user_id}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShieldCheckIcon className="w-5 h-5" />
            <span>Password & Security</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">Password</h4>
              <p className="text-sm text-secondary-600">
                Last updated: Not available
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsChangingPassword(true)}
              disabled
            >
              Change Password
              <span className="ml-2 text-xs text-secondary-500">Soon</span>
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">Two-Factor Authentication</h4>
              <p className="text-sm text-secondary-600">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Enable 2FA
              <span className="ml-2 text-xs text-secondary-500">Soon</span>
            </Button>
          </div>

          {(currentUser as EnhancedProfile)?.session_id && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <IdentificationIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Current Session</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Session ID: {(currentUser as EnhancedProfile).session_id}
                  </p>
                  {(currentUser as EnhancedProfile)?.expires_at && (
                    <p className="text-xs text-blue-600 mt-1">
                      Expires: {new Date((currentUser as EnhancedProfile).expires_at!).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BellIcon className="w-5 h-5" />
            <span>Notification Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-secondary-900">Email Notifications</h4>
              <p className="text-sm text-secondary-600">
                Receive notifications about important account activities
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Configure
              <span className="ml-2 text-xs text-secondary-500">Soon</span>
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-secondary-900">Document Processing</h4>
              <p className="text-sm text-secondary-600">
                Get notified when document processing is complete
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Configure
              <span className="ml-2 text-xs text-secondary-500">Soon</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GlobeAltIcon className="w-5 h-5" />
            <span>Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Timezone
              </label>
              <select 
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled
              >
                <option>UTC (Coordinated Universal Time)</option>
              </select>
              <p className="text-xs text-secondary-500 mt-1">Coming soon</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Language
              </label>
              <select 
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled
              >
                <option>English (US)</option>
              </select>
              <p className="text-xs text-secondary-500 mt-1">Coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
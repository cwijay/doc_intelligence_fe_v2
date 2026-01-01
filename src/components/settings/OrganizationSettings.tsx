'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BuildingOfficeIcon,
  PencilIcon,
  CreditCardIcon,
  UsersIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUserOrganization } from '@/hooks/useProfile';

export default function OrganizationSettings() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: organization, isLoading: orgLoading } = useUserOrganization();

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShieldCheckIcon className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            Admin Access Required
          </h3>
          <p className="text-secondary-600">
            You need administrator privileges to access organization settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (orgLoading) {
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

  const currentOrg = organization || {
    id: user?.org_id || '',
    name: user?.org_name || 'Unknown Organization',
    plan_type: 'free' as const,
    domain: '',
    is_active: true,
  };

  return (
    <div className="space-y-6">
      {/* Organization Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BuildingOfficeIcon className="w-5 h-5" />
              <span>Organization Details</span>
            </CardTitle>
            <Button variant="outline" size="sm" icon={<PencilIcon className="w-4 h-4" />} disabled>
              Edit Details
              <span className="ml-2 text-xs text-secondary-500">Soon</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Organization Name
                </label>
                <p className="text-lg font-semibold text-secondary-900">
                  {currentOrg.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Organization ID
                </label>
                <p className="text-sm text-secondary-600 font-mono">
                  {currentOrg.id}
                </p>
              </div>

              {currentOrg.domain && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Domain
                  </label>
                  <p className="text-secondary-900">
                    {currentOrg.domain}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Current Plan
                </label>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 capitalize">
                    {currentOrg.plan_type} Plan
                  </span>
                  {currentOrg.is_active !== false && (
                    <CheckCircleIcon className="w-4 h-4 text-success-500" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Status
                </label>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    currentOrg.is_active !== false ? 'bg-success-500' : 'bg-error-500'
                  }`}></div>
                  <span className="text-sm text-secondary-600">
                    {currentOrg.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan & Billing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCardIcon className="w-5 h-5" />
            <span>Plan & Billing</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-brand-cyan-50 to-brand-navy-50 border border-brand-cyan-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-brand-navy-800 capitalize">
                  {currentOrg.plan_type} Plan
                </h4>
                <p className="text-sm text-brand-navy-600 mt-1">
                  {currentOrg.plan_type === 'free' 
                    ? 'Basic features with limited storage and processing'
                    : `${currentOrg.plan_type} plan with advanced features`
                  }
                </p>
              </div>
              <Button variant="primary" size="sm" disabled>
                Upgrade Plan
                <span className="ml-2 text-xs">Soon</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-secondary-200 rounded-lg">
              <h4 className="font-medium text-secondary-900">Storage Used</h4>
              <p className="text-2xl font-bold text-primary-600 mt-2">N/A</p>
              <p className="text-xs text-secondary-500 mt-1">Coming soon</p>
            </div>
            
            <div className="text-center p-4 border border-secondary-200 rounded-lg">
              <h4 className="font-medium text-secondary-900">Documents</h4>
              <p className="text-2xl font-bold text-primary-600 mt-2">N/A</p>
              <p className="text-xs text-secondary-500 mt-1">Coming soon</p>
            </div>
            
            <div className="text-center p-4 border border-secondary-200 rounded-lg">
              <h4 className="font-medium text-secondary-900">Users</h4>
              <p className="text-2xl font-bold text-primary-600 mt-2">N/A</p>
              <p className="text-xs text-secondary-500 mt-1">Coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <UsersIcon className="w-5 h-5" />
              <span>Team Management</span>
            </CardTitle>
            <Link href="/users">
              <Button variant="outline" size="sm" icon={<UsersIcon className="w-4 h-4" />}>
                Manage Users
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">User Management</h4>
              <p className="text-sm text-secondary-600">
                Invite, manage, and remove team members
              </p>
            </div>
            <Link href="/users">
              <Button variant="outline" size="sm">
                View Users
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">Role Permissions</h4>
              <p className="text-sm text-secondary-600">
                Configure what each role can access and modify
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Configure
              <span className="ml-2 text-xs text-secondary-500">Soon</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShieldCheckIcon className="w-5 h-5" />
            <span>Security Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">Login Security</h4>
              <p className="text-sm text-secondary-600">
                Password policies and session management
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Configure
              <span className="ml-2 text-xs text-secondary-500">Soon</span>
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">API Keys</h4>
              <p className="text-sm text-secondary-600">
                Generate and manage API keys for integrations
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Manage Keys
              <span className="ml-2 text-xs text-secondary-500">Soon</span>
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">Audit Logs</h4>
              <p className="text-sm text-secondary-600">
                Track user activities and system changes
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              View Logs
              <span className="ml-2 text-xs text-secondary-500">Soon</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analytics & Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <ChartBarIcon className="w-5 h-5" />
              <span>Analytics & Reports</span>
            </CardTitle>
            <Link href="/organizations">
              <Button variant="outline" size="sm" icon={<ChartBarIcon className="w-4 h-4" />}>
                View Analytics
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">Usage Analytics</h4>
              <p className="text-sm text-secondary-600">
                Track document processing and user activity
              </p>
            </div>
            <Link href="/organizations">
              <Button variant="outline" size="sm">
                View Stats
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">Custom Reports</h4>
              <p className="text-sm text-secondary-600">
                Generate detailed reports for business insights
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Create Report
              <span className="ml-2 text-xs text-secondary-500">Soon</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
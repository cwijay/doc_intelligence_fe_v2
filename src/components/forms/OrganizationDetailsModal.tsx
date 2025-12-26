'use client';

import { Fragment } from 'react';
import { 
  BuildingOfficeIcon,
  GlobeAltIcon,
  CalendarIcon,
  ShieldCheckIcon,
  CogIcon,
  XMarkIcon,
  UsersIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/solid';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Organization } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';
import { useUserStats } from '@/hooks/useUsers';
import { useRouter } from 'next/navigation';

interface OrganizationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
  onEdit?: (organization: Organization) => void;
  onDelete?: (organization: Organization) => void;
}

export default function OrganizationDetailsModal({ 
  isOpen, 
  onClose, 
  organization,
  onEdit,
  onDelete
}: OrganizationDetailsModalProps) {
  const router = useRouter();
  const { data: userStats } = useUserStats(organization?.id || '');
  
  if (!organization) return null;

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'pro': return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'starter': return 'bg-warning-100 text-warning-800 border-warning-200';
      default: return 'bg-secondary-100 text-secondary-800 border-secondary-200';
    }
  };

  const getPlanFeatures = (planType: string) => {
    switch (planType) {
      case 'pro':
        return ['Unlimited documents', 'Advanced analytics', 'Priority support', 'Custom integrations'];
      case 'starter':
        return ['Up to 1,000 documents', 'Basic analytics', 'Email support'];
      default:
        return ['Up to 100 documents', 'Basic features', 'Community support'];
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title=""
      size="lg"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 rounded-xl">
              <BuildingOfficeIcon className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h3 className="text-2xl font-poppins font-bold text-secondary-900">
                {organization.name}
              </h3>
              {organization.domain && (
                <div className="flex items-center space-x-2 mt-1">
                  <GlobeAltIcon className="w-4 h-4 text-secondary-500" />
                  <span className="text-secondary-600">{organization.domain}</span>
                </div>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <XMarkIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Status and Plan */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {organization.is_active ? (
              <CheckCircleIcon className="w-5 h-5 text-success-600" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-error-600" />
            )}
            <span className={`text-sm font-medium ${
              organization.is_active ? 'text-success-700' : 'text-error-700'
            }`}>
              {organization.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPlanColor(organization.plan_type)}`}>
            <ShieldCheckIcon className="w-4 h-4 mr-2" />
            {organization.plan_type.charAt(0).toUpperCase() + organization.plan_type.slice(1)} Plan
          </div>
        </div>

        {/* Organization Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-secondary-50 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <DocumentTextIcon className="w-5 h-5 text-secondary-600" />
              <h4 className="font-poppins font-semibold text-secondary-900">Organization Details</h4>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-secondary-700">Organization ID</label>
                <p className="text-sm text-secondary-600 font-mono bg-white px-2 py-1 rounded border mt-1">
                  {organization.id}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-secondary-700">Name</label>
                <p className="text-secondary-900 mt-1">{organization.name}</p>
              </div>
              
              {organization.domain && (
                <div>
                  <label className="text-sm font-medium text-secondary-700">Domain</label>
                  <p className="text-secondary-900 mt-1">{organization.domain}</p>
                </div>
              )}
            </div>
          </div>

          {/* Plan Features */}
          <div className="bg-primary-50 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <ShieldCheckIcon className="w-5 h-5 text-primary-600" />
              <h4 className="font-poppins font-semibold text-primary-900">Plan Features</h4>
            </div>
            
            <div className="space-y-2">
              {getPlanFeatures(organization.plan_type).map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-4 h-4 text-success-600 flex-shrink-0" />
                  <span className="text-sm text-secondary-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-blue-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <UsersIcon className="w-5 h-5 text-blue-600" />
              <h4 className="font-poppins font-semibold text-blue-900">Users</h4>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                router.push(`/users?org=${organization.id}`);
                onClose();
              }}
              icon={<ArrowTopRightOnSquareIcon className="w-4 h-4" />}
            >
              Manage Users
            </Button>
          </div>
          
          {userStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900">{userStats.total_users || 0}</div>
                <div className="text-sm text-blue-700">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success-600">{userStats.active_users || 0}</div>
                <div className="text-sm text-blue-700">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-error-600">{userStats.admins || 0}</div>
                <div className="text-sm text-blue-700">Admins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning-600">{userStats.recent_logins || 0}</div>
                <div className="text-sm text-blue-700">Recent Logins</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-blue-600 mb-2">
                <UsersIcon className="w-8 h-8 mx-auto" />
              </div>
              <p className="text-blue-700">Click "Manage Users" to view and manage organization users.</p>
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CalendarIcon className="w-5 h-5 text-secondary-600" />
            <h4 className="font-poppins font-semibold text-secondary-900">Timeline</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-secondary-700">Created</label>
              <div className="mt-1">
                <p className="text-secondary-900">{new Date(organization.created_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
                <p className="text-sm text-secondary-600">
                  {formatDistanceToNow(new Date(organization.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-secondary-700">Last Updated</label>
              <div className="mt-1">
                <p className="text-secondary-900">{new Date(organization.updated_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
                <p className="text-sm text-secondary-600">
                  {formatDistanceToNow(new Date(organization.updated_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Info */}
        {organization.settings && Object.keys(organization.settings).length > 0 && (
          <div className="bg-warning-50 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CogIcon className="w-5 h-5 text-warning-600" />
              <h4 className="font-poppins font-semibold text-warning-900">Configuration</h4>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <pre className="text-sm text-secondary-700 font-mono overflow-x-auto">
                {JSON.stringify(organization.settings, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-secondary-200">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          
          {onEdit && (
            <Button
              variant="secondary"
              onClick={() => {
                onEdit(organization);
                onClose();
              }}
              icon={<CogIcon className="w-4 h-4" />}
            >
              Edit
            </Button>
          )}
          
          {onDelete && (
            <Button
              variant="error"
              onClick={() => {
                onDelete(organization);
                onClose();
              }}
              icon={<XMarkIcon className="w-4 h-4" />}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
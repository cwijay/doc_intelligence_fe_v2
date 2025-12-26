'use client';

import { Fragment } from 'react';
import { 
  UserIcon,
  EnvelopeIcon,
  AtSymbolIcon,
  CalendarIcon,
  ShieldCheckIcon,
  CogIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/solid';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { User } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
}

export default function UserDetailsModal({ 
  isOpen, 
  onClose, 
  user,
  onEdit,
  onDelete
}: UserDetailsModalProps) {
  if (!user) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-error-100 text-error-800 border-error-200';
      case 'user': return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'viewer': return 'bg-secondary-100 text-secondary-800 border-secondary-200';
      default: return 'bg-secondary-100 text-secondary-800 border-secondary-200';
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin': return 'Full access to organization and user management';
      case 'user': return 'Can view, create, and manage own content';
      case 'viewer': return 'Read-only access to organization data';
      default: return 'Unknown role';
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
              <UserIcon className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h3 className="text-2xl font-poppins font-bold text-secondary-900">
                {user.full_name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <AtSymbolIcon className="w-4 h-4 text-secondary-500" />
                <span className="text-secondary-600">{user.username}</span>
              </div>
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

        {/* Status and Role */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {user.is_active ? (
              <CheckCircleIcon className="w-5 h-5 text-success-600" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-error-600" />
            )}
            <span className={`text-sm font-medium ${
              user.is_active ? 'text-success-700' : 'text-error-700'
            }`}>
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user.role)}`}>
            <ShieldCheckIcon className="w-4 h-4 mr-2" />
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </div>
        </div>

        {/* User Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-secondary-50 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <EnvelopeIcon className="w-5 h-5 text-secondary-600" />
              <h4 className="font-poppins font-semibold text-secondary-900">Contact Information</h4>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-secondary-700">Email Address</label>
                <p className="text-secondary-900 mt-1 break-all">{user.email}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-secondary-700">Username</label>
                <p className="text-secondary-900 mt-1 font-mono">{user.username}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-secondary-700">Full Name</label>
                <p className="text-secondary-900 mt-1">{user.full_name}</p>
              </div>
            </div>
          </div>

          {/* Role & Permissions */}
          <div className="bg-primary-50 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <ShieldCheckIcon className="w-5 h-5 text-primary-600" />
              <h4 className="font-poppins font-semibold text-primary-900">Role & Permissions</h4>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-primary-700">Current Role</label>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user.role)}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-primary-700">Permissions</label>
                <p className="text-sm text-primary-700 mt-1">{getRoleDescription(user.role)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <UserIcon className="w-5 h-5 text-secondary-600" />
            <h4 className="font-poppins font-semibold text-secondary-900">Account Details</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-secondary-700">User ID</label>
              <p className="text-sm text-secondary-600 font-mono bg-white px-2 py-1 rounded border mt-1 break-all">
                {user.id}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-secondary-700">Organization ID</label>
              <p className="text-sm text-secondary-600 font-mono bg-white px-2 py-1 rounded border mt-1 break-all">
                {user.org_id}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-secondary-700">Account Status</label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  user.is_active 
                    ? 'bg-success-100 text-success-800' 
                    : 'bg-error-100 text-error-800'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-warning-50 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CalendarIcon className="w-5 h-5 text-warning-600" />
            <h4 className="font-poppins font-semibold text-warning-900">Activity Timeline</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-warning-700">Account Created</label>
              <div className="mt-1">
                <p className="text-warning-900">{new Date(user.created_at).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}</p>
                <p className="text-sm text-warning-700">
                  {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-warning-700">Last Updated</label>
              <div className="mt-1">
                <p className="text-warning-900">{new Date(user.updated_at).toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}</p>
                <p className="text-sm text-warning-700">
                  {formatDistanceToNow(new Date(user.updated_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-warning-700 flex items-center space-x-1">
                <ClockIcon className="w-4 h-4" />
                <span>Last Login</span>
              </label>
              <div className="mt-1">
                {user.last_login ? (
                  <>
                    <p className="text-warning-900">{new Date(user.last_login).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</p>
                    <p className="text-sm text-warning-700">
                      {formatDistanceToNow(new Date(user.last_login), { addSuffix: true })}
                    </p>
                  </>
                ) : (
                  <p className="text-warning-700 italic">Never logged in</p>
                )}
              </div>
            </div>
          </div>
        </div>

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
                onEdit(user);
                onClose();
              }}
              icon={<CogIcon className="w-4 h-4" />}
            >
              Edit User
            </Button>
          )}
          
          {onDelete && (
            <Button
              variant="error"
              onClick={() => {
                onDelete(user);
                onClose();
              }}
              icon={<XMarkIcon className="w-4 h-4" />}
            >
              Delete User
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
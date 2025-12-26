'use client';

import { Suspense, useState, useEffect, Fragment } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  UsersIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  AtSymbolIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import AddUserModal from '@/components/forms/AddUserModal';
import EditUserModal from '@/components/forms/EditUserModal';
import UserDetailsModal from '@/components/forms/UserDetailsModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useUsers, useDeleteUser } from '@/hooks/useUsers';
import { useOrganizations } from '@/hooks/useOrganizations';
import { formatDistanceToNow } from 'date-fns';
import { User } from '@/types/api';
import toast from 'react-hot-toast';

function UsersPageContent() {
  const searchParams = useSearchParams();
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  
  // Handle URL parameter for organization selection
  useEffect(() => {
    const orgParam = searchParams.get('org');
    if (orgParam) {
      setSelectedOrgId(orgParam);
    }
  }, [searchParams]);
  
  // Get organizations for selection
  const { data: organizationsData } = useOrganizations({ per_page: 100 });
  
  // Get users for selected organization
  const { data: usersData, isLoading, error } = useUsers(selectedOrgId, {
    page: currentPage,
    per_page: 10,
    email: searchTerm || undefined,
    username: searchTerm || undefined,
    full_name: searchTerm || undefined,
    role: roleFilter as any || undefined,
  });

  const deleteUser = useDeleteUser(selectedOrgId);

  const handleView = (user: User) => {
    setViewingUser(user);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
  };

  const handleDelete = (user: User) => {
    setDeletingUser(user);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    
    try {
      await deleteUser.mutateAsync(deletingUser.id);
      toast.success(`User "${deletingUser.full_name}" deleted successfully!`);
      setDeletingUser(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user. Please try again.');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-error-100 text-error-800';
      case 'user': return 'bg-primary-100 text-primary-800';
      case 'viewer': return 'bg-secondary-100 text-secondary-800';
      default: return 'bg-secondary-100 text-secondary-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-poppins font-bold text-secondary-900 flex items-center space-x-3">
                <UsersIcon className="w-8 h-8 text-primary-600" />
                <span>Users Management</span>
              </h1>
              <p className="text-lg text-secondary-600 mt-2">
                Manage users across your organizations
              </p>
            </div>
            
            {selectedOrgId && (
              <Button
                variant="primary"
                icon={<PlusIcon className="w-4 h-4" />}
                className="shadow-lg"
                onClick={() => setIsAddModalOpen(true)}
              >
                Add User
              </Button>
            )}
          </div>

          {/* Organization Selection */}
          <div className="mb-6">
            <label htmlFor="organization" className="block text-sm font-medium text-secondary-700 mb-2">
              Select Organization
            </label>
            <select
              id="organization"
              value={selectedOrgId}
              onChange={(e) => {
                setSelectedOrgId(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full max-w-md border border-secondary-300 rounded-lg px-4 py-2.5 bg-white focus:border-primary-500 focus:ring-primary-500/20 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200"
            >
              <option value="">Choose an organization...</option>
              {organizationsData?.organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {selectedOrgId && (
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search users by name, email, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<MagnifyingGlassIcon className="w-4 h-4" />}
                  className="w-full"
                />
              </div>
              
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-secondary-300 rounded-lg px-4 py-2.5 bg-white focus:border-primary-500 focus:ring-primary-500/20 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="viewer">Viewer</option>
              </select>
              
              <Button
                variant="outline"
                icon={<FunnelIcon className="w-4 h-4" />}
              >
                Filters
              </Button>
            </div>
          )}
        </motion.div>

        {!selectedOrgId ? (
          <Card>
            <CardContent className="p-12 text-center">
              <UsersIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-xl font-poppins font-semibold text-secondary-900 mb-2">
                Select an Organization
              </h3>
              <p className="text-secondary-600 mb-6">
                Choose an organization from the dropdown above to view and manage its users.
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card variant="outlined" className="border-error-200">
            <CardContent className="p-8 text-center">
              <div className="text-error-600 mb-4">
                <UsersIcon className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-error-900 mb-2">Failed to load users</h3>
              <p className="text-error-600">Please check your connection and try again.</p>
            </CardContent>
          </Card>
        ) : usersData?.users.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <UsersIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-xl font-poppins font-semibold text-secondary-900 mb-2">
                No users found
              </h3>
              <p className="text-secondary-600 mb-6">
                {searchTerm ? 'No users match your search criteria.' : 'Get started by adding the first user to this organization.'}
              </p>
              <Button
                variant="primary"
                icon={<PlusIcon className="w-4 h-4" />}
                onClick={() => setIsAddModalOpen(true)}
              >
                Add First User
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
            >
              {usersData?.users.map((user: User, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card hover className="group cursor-pointer" onClick={() => handleView(user)}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-poppins font-semibold text-secondary-900 mb-1 group-hover:text-primary-600 transition-colors duration-200">
                            {user.full_name}
                          </h3>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm text-secondary-600">
                              <AtSymbolIcon className="w-4 h-4" />
                              <span>{user.username}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-secondary-600">
                              <EnvelopeIcon className="w-4 h-4" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Menu as="div" className="relative" onClick={(e) => e.stopPropagation()}>
                          <Menu.Button as={Button} variant="ghost" size="sm">
                            <EllipsisVerticalIcon className="w-4 h-4" />
                          </Menu.Button>
                          
                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                          >
                            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-strong ring-1 ring-black ring-opacity-5 focus:outline-none">
                              <div className="py-1">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleView(user)}
                                      className={`${
                                        active ? 'bg-secondary-50 text-secondary-900' : 'text-secondary-700'
                                      } flex items-center space-x-2 px-4 py-2 text-sm w-full text-left`}
                                    >
                                      <EyeIcon className="w-4 h-4" />
                                      <span>View Details</span>
                                    </button>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleEdit(user)}
                                      className={`${
                                        active ? 'bg-secondary-50 text-secondary-900' : 'text-secondary-700'
                                      } flex items-center space-x-2 px-4 py-2 text-sm w-full text-left`}
                                    >
                                      <PencilIcon className="w-4 h-4" />
                                      <span>Edit</span>
                                    </button>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() => handleDelete(user)}
                                      className={`${
                                        active ? 'bg-error-50 text-error-900' : 'text-error-700'
                                      } flex items-center space-x-2 px-4 py-2 text-sm w-full text-left`}
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                      <span>Delete</span>
                                    </button>
                                  )}
                                </Menu.Item>
                              </div>
                            </Menu.Items>
                          </Transition>
                        </Menu>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_active 
                              ? 'bg-success-100 text-success-800' 
                              : 'bg-error-100 text-error-800'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-secondary-500 space-y-1">
                        <p>Created {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</p>
                        <p>Last login: {user.last_login ? formatDistanceToNow(new Date(user.last_login), { addSuffix: true }) : 'Never'}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {usersData && (usersData as { total_pages?: number }).total_pages && (usersData as { total_pages: number }).total_pages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-secondary-600">
                  Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, usersData.total)} of {usersData.total} users
                </p>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    Previous
                  </Button>

                  <span className="px-3 py-1 text-sm text-secondary-700">
                    Page {currentPage} of {(usersData as { total_pages: number }).total_pages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === (usersData as { total_pages: number }).total_pages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {selectedOrgId && (
        <>
          <AddUserModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            orgId={selectedOrgId}
          />
          
          <UserDetailsModal
            isOpen={!!viewingUser}
            onClose={() => setViewingUser(null)}
            user={viewingUser}
            onEdit={(user) => {
              setViewingUser(null);
              setEditingUser(user);
            }}
            onDelete={(user) => {
              setViewingUser(null);
              setDeletingUser(user);
            }}
          />
          
          <EditUserModal
            isOpen={!!editingUser}
            onClose={() => setEditingUser(null)}
            orgId={selectedOrgId}
            user={editingUser}
          />
          
          <ConfirmDialog
            isOpen={!!deletingUser}
            onClose={() => setDeletingUser(null)}
            onConfirm={confirmDelete}
            title="Delete User"
            message={deletingUser ? `Are you sure you want to delete "${deletingUser.full_name}"? This action cannot be undone and will revoke all access for this user.` : ''}
            confirmText="Delete User"
            variant="danger"
            loading={deleteUser.isPending}
          />
        </>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-secondary-600">
          Loading users...
        </div>
      }
    >
      <UsersPageContent />
    </Suspense>
  );
}

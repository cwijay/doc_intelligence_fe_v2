'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BuildingOfficeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import AddOrganizationModal from '@/components/forms/AddOrganizationModal';
import EditOrganizationModal from '@/components/forms/EditOrganizationModal';
import OrganizationDetailsModal from '@/components/forms/OrganizationDetailsModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useOrganizations, useDeleteOrganization } from '@/hooks/useOrganizations';
import { formatDistanceToNow } from 'date-fns';
import { Organization } from '@/types/api';
import toast from 'react-hot-toast';

export default function OrganizationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [deletingOrganization, setDeletingOrganization] = useState<Organization | null>(null);
  const [viewingOrganization, setViewingOrganization] = useState<Organization | null>(null);
  
  const { data: organizationsData, isLoading, error } = useOrganizations({
    page: currentPage,
    per_page: 10,
    name: searchTerm || undefined,
  });

  const deleteOrganization = useDeleteOrganization();

  const handleView = (organization: Organization) => {
    setViewingOrganization(organization);
  };

  const handleEdit = (organization: Organization) => {
    setEditingOrganization(organization);
  };

  const handleDelete = (organization: Organization) => {
    setDeletingOrganization(organization);
  };

  const confirmDelete = async () => {
    if (!deletingOrganization) return;
    
    try {
      await deleteOrganization.mutateAsync(deletingOrganization.id);
      toast.success(`Organization "${deletingOrganization.name}" deleted successfully!`);
      setDeletingOrganization(null);
    } catch (error) {
      console.error('Failed to delete organization:', error);
      toast.error('Failed to delete organization. Please try again.');
    }
  };

  const getStatusColor = (isActive: boolean) => isActive ? 'text-success-600' : 'text-error-600';
  const getStatusBg = (isActive: boolean) => isActive ? 'bg-success-100' : 'bg-error-100';
  
  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'pro': return 'bg-primary-100 text-primary-800';
      case 'starter': return 'bg-warning-100 text-warning-800';
      default: return 'bg-secondary-100 text-secondary-800';
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-poppins font-bold text-secondary-900 dark:text-secondary-100 flex items-center space-x-3">
                <BuildingOfficeIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                <span>Organizations</span>
              </h1>
              <p className="text-lg text-secondary-600 dark:text-secondary-400 mt-2">
                Manage your business organizations and their settings
              </p>
            </div>
            
            <Button
              variant="primary"
              icon={<PlusIcon className="w-4 h-4" />}
              className="shadow-lg"
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Organization
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<MagnifyingGlassIcon className="w-4 h-4" />}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              icon={<FunnelIcon className="w-4 h-4" />}
            >
              Filters
            </Button>
          </div>
        </motion.div>

        {isLoading ? (
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
                <BuildingOfficeIcon className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-error-900 mb-2">Failed to load organizations</h3>
              <p className="text-error-600">Please check your connection and try again.</p>
            </CardContent>
          </Card>
        ) : organizationsData?.organizations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BuildingOfficeIcon className="w-16 h-16 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-xl font-poppins font-semibold text-secondary-900 mb-2">
                No organizations found
              </h3>
              <p className="text-secondary-600 mb-6">
                {searchTerm ? 'No organizations match your search criteria.' : 'Get started by creating your first organization.'}
              </p>
              <Button
                variant="primary"
                icon={<PlusIcon className="w-4 h-4" />}
                onClick={() => setIsAddModalOpen(true)}
              >
                Create Organization
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
              {organizationsData?.organizations.map((org: Organization, index) => (
                <motion.div
                  key={org.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card hover className="group cursor-pointer" onClick={() => handleView(org)}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-poppins font-semibold text-secondary-900 mb-1 group-hover:text-primary-600 transition-colors duration-200">
                            {org.name}
                          </h3>
                          {org.domain && (
                            <p className="text-sm text-secondary-600">{org.domain}</p>
                          )}
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
                                      onClick={() => handleEdit(org)}
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
                                      onClick={() => handleDelete(org)}
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
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanColor(org.plan_type)}`}>
                            {org.plan_type.charAt(0).toUpperCase() + org.plan_type.slice(1)}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBg(org.is_active)} ${getStatusColor(org.is_active)}`}>
                            {org.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-secondary-500 space-y-1">
                        <p>Created {formatDistanceToNow(new Date(org.created_at), { addSuffix: true })}</p>
                        <p>Updated {formatDistanceToNow(new Date(org.updated_at), { addSuffix: true })}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {organizationsData && (organizationsData as { total_pages?: number }).total_pages && (organizationsData as { total_pages: number }).total_pages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-secondary-600">
                  Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, organizationsData.total)} of {organizationsData.total} organizations
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
                    Page {currentPage} of {(organizationsData as { total_pages: number }).total_pages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === (organizationsData as { total_pages: number }).total_pages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AddOrganizationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      
      <OrganizationDetailsModal
        isOpen={!!viewingOrganization}
        onClose={() => setViewingOrganization(null)}
        organization={viewingOrganization}
        onEdit={(org) => {
          setViewingOrganization(null);
          setEditingOrganization(org);
        }}
        onDelete={(org) => {
          setViewingOrganization(null);
          setDeletingOrganization(org);
        }}
      />
      
      <EditOrganizationModal
        isOpen={!!editingOrganization}
        onClose={() => setEditingOrganization(null)}
        organization={editingOrganization}
      />
      
      <ConfirmDialog
        isOpen={!!deletingOrganization}
        onClose={() => setDeletingOrganization(null)}
        onConfirm={confirmDelete}
        title="Delete Organization"
        message={deletingOrganization ? `Are you sure you want to delete "${deletingOrganization.name}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        variant="danger"
        loading={deleteOrganization.isPending}
      />
    </AppLayout>
  );
}
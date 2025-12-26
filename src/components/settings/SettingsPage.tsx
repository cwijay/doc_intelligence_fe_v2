'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Cog6ToothIcon,
  UserIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  HomeIcon,
  ChevronLeftIcon,
  ShieldCheckIcon,
  BellIcon,
  KeyIcon,
  CreditCardIcon,
  UsersIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import AccountSettings from './AccountSettings';
import OrganizationSettings from './OrganizationSettings';
import ApplicationSettings from './ApplicationSettings';

type SettingsTab = 'account' | 'organization' | 'application';

interface SettingsMenuItem {
  id: SettingsTab;
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  adminOnly?: boolean;
}

const settingsMenu: SettingsMenuItem[] = [
  {
    id: 'account',
    name: 'Account',
    description: 'Profile, password, and personal preferences',
    icon: UserIcon,
  },
  {
    id: 'organization',
    name: 'Organization',
    description: 'Company settings, billing, and team management',
    icon: BuildingOfficeIcon,
    adminOnly: true,
  },
  {
    id: 'application',
    name: 'Application',
    description: 'Document management and app preferences',
    icon: DocumentTextIcon,
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  const isAdmin = user?.role === 'admin';

  // Filter menu items based on user role
  const availableMenuItems = settingsMenu.filter(
    item => !item.adminOnly || isAdmin
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return <AccountSettings />;
      case 'organization':
        return <OrganizationSettings />;
      case 'application':
        return <ApplicationSettings />;
      default:
        return <AccountSettings />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
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
          <span className="text-secondary-900 font-medium">Settings</span>
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
            <h1 className="text-3xl font-bold text-secondary-900 flex items-center space-x-3">
              <Cog6ToothIcon className="w-8 h-8 text-primary-600" />
              <span>Settings</span>
            </h1>
            <p className="text-secondary-600 mt-2">
              Manage your account, organization, and application preferences
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-secondary-700">
                  Settings Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {availableMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full text-left px-4 py-3 transition-colors duration-200 flex items-start space-x-3 hover:bg-secondary-50 ${
                          isActive 
                            ? 'bg-primary-50 border-r-2 border-primary-500 text-primary-700' 
                            : 'text-secondary-700 hover:text-secondary-900'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          isActive ? 'text-primary-600' : 'text-secondary-500'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium ${
                            isActive ? 'text-primary-900' : 'text-secondary-900'
                          }`}>
                            {item.name}
                          </p>
                          <p className={`text-xs mt-1 ${
                            isActive ? 'text-primary-600' : 'text-secondary-500'
                          }`}>
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-secondary-700">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/profile" className="block">
                  <button className="w-full text-left px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50 rounded-lg transition-colors duration-200 flex items-center space-x-2">
                    <UserIcon className="w-4 h-4" />
                    <span>View Profile</span>
                  </button>
                </Link>
                
                {isAdmin && (
                  <Link href="/users" className="block">
                    <button className="w-full text-left px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50 rounded-lg transition-colors duration-200 flex items-center space-x-2">
                      <UsersIcon className="w-4 h-4" />
                      <span>Manage Users</span>
                    </button>
                  </Link>
                )}

                <Link href="/organizations" className="block">
                  <button className="w-full text-left px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50 rounded-lg transition-colors duration-200 flex items-center space-x-2">
                    <ChartBarIcon className="w-4 h-4" />
                    <span>Analytics</span>
                  </button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
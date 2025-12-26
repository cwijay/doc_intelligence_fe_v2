'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  DocumentTextIcon,
  FolderIcon,
  CloudArrowUpIcon,
  CogIcon,
  PuzzlePieceIcon,
  BellIcon,
  EyeIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export default function ApplicationSettings() {
  const { user } = useAuth();
  const [autoProcessing, setAutoProcessing] = useState(true);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="space-y-6">
      {/* Document Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DocumentTextIcon className="w-5 h-5" />
            <span>Document Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">Default Upload Folder</h4>
              <p className="text-sm text-secondary-600">
                Set the default folder for new document uploads
              </p>
            </div>
            <Link href="/folders">
              <Button variant="outline" size="sm" icon={<FolderIcon className="w-4 h-4" />}>
                Select Folder
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">Auto-Processing</h4>
              <p className="text-sm text-secondary-600">
                Automatically process documents after upload
              </p>
            </div>
            <Button 
              variant={autoProcessing ? "primary" : "outline"} 
              size="sm"
              onClick={() => setAutoProcessing(!autoProcessing)}
              disabled
            >
              {autoProcessing ? 'Enabled' : 'Disabled'}
              <span className="ml-2 text-xs">Soon</span>
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">File Type Support</h4>
              <p className="text-sm text-secondary-600">
                Configure supported document formats
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Configure
              <span className="ml-2 text-xs text-secondary-500">Soon</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Storage & Processing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CloudArrowUpIcon className="w-5 h-5" />
            <span>Storage & Processing</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-secondary-200 rounded-lg">
              <ServerIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <h4 className="font-medium text-secondary-900">Storage Usage</h4>
              <p className="text-lg font-bold text-primary-600 mt-1">N/A</p>
              <p className="text-xs text-secondary-500">Coming soon</p>
            </div>
            
            <div className="text-center p-4 border border-secondary-200 rounded-lg">
              <CogIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <h4 className="font-medium text-secondary-900">Processing Queue</h4>
              <p className="text-lg font-bold text-primary-600 mt-1">N/A</p>
              <p className="text-xs text-secondary-500">Coming soon</p>
            </div>
            
            <div className="text-center p-4 border border-secondary-200 rounded-lg">
              <DocumentTextIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <h4 className="font-medium text-secondary-900">Documents</h4>
              <p className="text-lg font-bold text-primary-600 mt-1">N/A</p>
              <p className="text-xs text-secondary-500">Coming soon</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">Storage Cleanup</h4>
              <p className="text-sm text-secondary-600">
                Automatically clean up processed temporary files
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Configure
              <span className="ml-2 text-xs text-secondary-500">Soon</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export & Download Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span>Export & Download Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Default Export Format
              </label>
              <select 
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled
              >
                <option>JSON</option>
                <option>CSV</option>
                <option>PDF</option>
                <option>Excel</option>
              </select>
              <p className="text-xs text-secondary-500 mt-1">Coming soon</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Download Quality
              </label>
              <select 
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled
              >
                <option>High Quality</option>
                <option>Standard</option>
                <option>Compressed</option>
              </select>
              <p className="text-xs text-secondary-500 mt-1">Coming soon</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">Batch Export</h4>
              <p className="text-sm text-secondary-600">
                Export multiple documents at once
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Configure
              <span className="ml-2 text-xs text-secondary-500">Soon</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ChartBarIcon className="w-5 h-5" />
            <span>Dashboard Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">Default Dashboard View</h4>
              <p className="text-sm text-secondary-600">
                Choose what you see first when logging in
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" icon={<EyeIcon className="w-4 h-4" />}>
                Preview
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">Widget Layout</h4>
              <p className="text-sm text-secondary-600">
                Customize dashboard widgets and their positions
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Customize
              <span className="ml-2 text-xs text-secondary-500">Soon</span>
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">Data Refresh Rate</h4>
              <p className="text-sm text-secondary-600">
                How often dashboard data updates automatically
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Configure
              <span className="ml-2 text-xs text-secondary-500">Soon</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications & Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BellIcon className="w-5 h-5" />
            <span>Notifications & Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">In-App Notifications</h4>
              <p className="text-sm text-secondary-600">
                Show notifications within the application
              </p>
            </div>
            <Button 
              variant={notifications ? "primary" : "outline"} 
              size="sm"
              onClick={() => setNotifications(!notifications)}
              disabled
            >
              {notifications ? 'Enabled' : 'Disabled'}
              <span className="ml-2 text-xs">Soon</span>
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">Processing Alerts</h4>
              <p className="text-sm text-secondary-600">
                Get notified when document processing completes
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Configure
              <span className="ml-2 text-xs text-secondary-500">Soon</span>
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">Error Notifications</h4>
              <p className="text-sm text-secondary-600">
                Alert when processing fails or errors occur
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Configure
              <span className="ml-2 text-xs text-secondary-500">Soon</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PuzzlePieceIcon className="w-5 h-5" />
            <span>Integrations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">Third-Party Services</h4>
              <p className="text-sm text-secondary-600">
                Connect with external document processing services
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Browse
              <span className="ml-2 text-xs text-secondary-500">Soon</span>
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">Webhooks</h4>
              <p className="text-sm text-secondary-600">
                Configure webhook endpoints for event notifications
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Setup
              <span className="ml-2 text-xs text-secondary-500">Soon</span>
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
            <div>
              <h4 className="font-medium text-secondary-900">API Access</h4>
              <p className="text-sm text-secondary-600">
                View API documentation and generate access keys
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              View Docs
              <span className="ml-2 text-xs text-secondary-500">Soon</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
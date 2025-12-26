'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ExclamationTriangleIcon, 
  ArrowLeftIcon,
  HomeIcon 
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-error-100 rounded-full">
              <ExclamationTriangleIcon className="w-12 h-12 text-error-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-secondary-900 mb-4">
            Access Denied
          </h1>
          
          <p className="text-secondary-600 mb-6">
            You don't have permission to access this page. 
            {user && (
              <>
                <br />
                <span className="text-sm">
                  Current role: <strong>{user.role}</strong>
                </span>
              </>
            )}
          </p>

          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => router.back()}
              icon={<ArrowLeftIcon className="w-4 h-4" />}
            >
              Go Back
            </Button>
            
            <Link href="/">
              <Button
                variant="outline"
                className="w-full"
                icon={<HomeIcon className="w-4 h-4" />}
              >
                Go to Dashboard
              </Button>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-secondary-200">
            <p className="text-sm text-secondary-500 mb-3">
              Need higher permissions?
            </p>
            
            <div className="space-y-2">
              <Link
                href="/support"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Contact your administrator
              </Link>
              
              <div className="text-sm text-secondary-400">
                or
              </div>
              
              <button
                onClick={logout}
                className="text-sm text-secondary-600 hover:text-secondary-500"
              >
                Sign in as different user
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
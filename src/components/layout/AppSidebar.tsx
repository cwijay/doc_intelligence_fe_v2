'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  ChartBarIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  LightBulbIcon,
  SparklesIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import Logo from '@/components/ui/Logo';
import { clsx } from 'clsx';
import { AppSidebarState } from '@/hooks/useAppSidebarState';
import { LAYOUT } from '@/lib/constants';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  { name: 'Documents', href: '/documents', icon: DocumentTextIcon },
  { name: 'Reports', href: '/reports', icon: DocumentChartBarIcon },
  { name: 'Usage', href: '/usage', icon: ChartPieIcon },
  { name: 'Insights', href: '/insights', icon: LightBulbIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

interface AppSidebarProps {
  sidebarState: AppSidebarState;
  onToggleSidebar: () => void;
  onOpenFeatures: () => void;
}

export default function AppSidebar({
  sidebarState,
  onToggleSidebar,
  onOpenFeatures,
}: AppSidebarProps) {
  const pathname = usePathname();
  const isCollapsed = sidebarState === 'collapsed';

  const sidebarWidth = isCollapsed
    ? LAYOUT.APP_SIDEBAR.COLLAPSED_WIDTH
    : LAYOUT.APP_SIDEBAR.EXPANDED_WIDTH;

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={clsx(
        'fixed left-0 top-0 h-screen z-30',
        'bg-white dark:bg-secondary-900',
        'border-r border-secondary-200 dark:border-secondary-700',
        'flex flex-col',
        'transition-colors duration-200'
      )}
    >
      {/* Logo Section */}
      <div className={clsx(
        'flex-shrink-0 h-14 flex items-center',
        'border-b border-secondary-200 dark:border-secondary-700',
        isCollapsed ? 'justify-center px-2' : 'px-4'
      )}>
        <Link href="/dashboard" className="flex items-center group">
          <Logo size="sm" showText={!isCollapsed} />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center rounded-lg transition-all duration-150',
                isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5',
                // Active state
                isActive && [
                  'border-l-2 border-primary-500',
                  'bg-primary-50 dark:bg-primary-900/20',
                  'text-primary-600 dark:text-primary-400',
                ],
                // Default state
                !isActive && [
                  'border-l-2 border-transparent',
                  'text-secondary-600 dark:text-secondary-400',
                  'hover:bg-secondary-50 dark:hover:bg-secondary-800',
                  'hover:text-secondary-900 dark:hover:text-secondary-100',
                ]
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className={clsx(
                'flex-shrink-0',
                isCollapsed ? 'w-6 h-6' : 'w-5 h-5'
              )} />
              {!isCollapsed && (
                <span className="ml-3 text-sm font-medium truncate">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className={clsx(
        'flex-shrink-0 px-2 py-4 space-y-2',
        'border-t border-secondary-200 dark:border-secondary-700'
      )}>
        {/* Features Button */}
        <button
          onClick={onOpenFeatures}
          className={clsx(
            'w-full flex items-center rounded-lg transition-all duration-150',
            isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5',
            'text-primary-600 dark:text-primary-400',
            'hover:bg-primary-50 dark:hover:bg-primary-900/20'
          )}
          title={isCollapsed ? 'Features' : undefined}
        >
          <SparklesIcon className={clsx(
            'flex-shrink-0',
            isCollapsed ? 'w-6 h-6' : 'w-5 h-5'
          )} />
          {!isCollapsed && (
            <span className="ml-3 text-sm font-medium">Features</span>
          )}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={onToggleSidebar}
          className={clsx(
            'w-full flex items-center rounded-lg transition-all duration-150',
            isCollapsed ? 'justify-center p-3' : 'px-3 py-2.5',
            'text-secondary-500 dark:text-secondary-400',
            'hover:bg-secondary-100 dark:hover:bg-secondary-800',
            'hover:text-secondary-700 dark:hover:text-secondary-200'
          )}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronDoubleRightIcon className="w-5 h-5" />
          ) : (
            <>
              <ChevronDoubleLeftIcon className="w-5 h-5" />
              <span className="ml-3 text-sm font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}

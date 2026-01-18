'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon,
  ChartBarIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  LightBulbIcon,
  SparklesIcon,
  XMarkIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import Logo from '@/components/ui/Logo';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  { name: 'Documents', href: '/documents', icon: DocumentTextIcon },
  { name: 'Reports', href: '/reports', icon: DocumentChartBarIcon },
  { name: 'Usage', href: '/usage', icon: ChartPieIcon },
  { name: 'Insights', href: '/insights', icon: LightBulbIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeatures: () => void;
}

export default function MobileSidebar({
  isOpen,
  onClose,
  onOpenFeatures,
}: MobileSidebarProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />

          {/* Sidebar Panel */}
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={clsx(
              'fixed inset-y-0 left-0 w-[280px] z-50 lg:hidden',
              'bg-white dark:bg-secondary-900',
              'border-r border-secondary-200 dark:border-secondary-700',
              'flex flex-col'
            )}
          >
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-secondary-200 dark:border-secondary-700">
              <Link href="/dashboard" className="flex items-center group" onClick={onClose}>
                <Logo size="sm" showText />
              </Link>
              <button
                onClick={onClose}
                className={clsx(
                  'p-2 rounded-lg',
                  'text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100',
                  'dark:text-secondary-400 dark:hover:text-secondary-200 dark:hover:bg-secondary-800',
                  'transition-colors duration-200'
                )}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={clsx(
                      'flex items-center px-3 py-2.5 rounded-lg transition-all duration-150',
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
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="ml-3 text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Section */}
            <div className="flex-shrink-0 px-2 py-4 border-t border-secondary-200 dark:border-secondary-700">
              <button
                onClick={() => {
                  onClose();
                  onOpenFeatures();
                }}
                className={clsx(
                  'w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-150',
                  'text-primary-600 dark:text-primary-400',
                  'hover:bg-primary-50 dark:hover:bg-primary-900/20'
                )}
              >
                <SparklesIcon className="w-5 h-5" />
                <span className="ml-3 text-sm font-medium">Features</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  ChevronDownIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { clsx } from 'clsx';
import { LAYOUT } from '@/lib/constants';

interface AppHeaderProps {
  sidebarWidth: number;
  pageTitle?: string;
  onOpenMobileMenu?: () => void;
  showMobileMenuButton?: boolean;
}

export default function AppHeader({
  sidebarWidth,
  pageTitle,
  onOpenMobileMenu,
  showMobileMenuButton = false,
}: AppHeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header
      className={clsx(
        'fixed top-0 right-0 z-40',
        'bg-white/95 dark:bg-secondary-900/95 backdrop-blur-md',
        'border-b border-secondary-200 dark:border-secondary-700',
        'transition-all duration-200'
      )}
      style={{
        left: sidebarWidth,
        height: LAYOUT.HEADER_HEIGHT,
      }}
    >
      <div className="h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Left Side - Mobile Menu + Page Title */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          {showMobileMenuButton && onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className={clsx(
                'lg:hidden p-2 rounded-lg',
                'text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100',
                'dark:text-secondary-400 dark:hover:text-secondary-200 dark:hover:bg-secondary-800',
                'transition-colors duration-200'
              )}
              aria-label="Open menu"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
          )}

          {/* Page Title */}
          {pageTitle && (
            <h1 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              {pageTitle}
            </h1>
          )}
        </div>

        {/* Right Side - Theme Toggle + User Menu */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={clsx(
              'p-2 rounded-lg transition-colors duration-200',
              'text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100',
              'dark:text-secondary-400 dark:hover:text-secondary-200 dark:hover:bg-secondary-800',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
            )}
            aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {resolvedTheme === 'dark' ? (
              <SunIcon className="w-5 h-5" />
            ) : (
              <MoonIcon className="w-5 h-5" />
            )}
          </button>

          {/* User Menu */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={clsx(
                  'flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors duration-200',
                  'hover:bg-secondary-50 dark:hover:bg-secondary-800'
                )}
              >
                <UserCircleIcon className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100 leading-tight">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 capitalize leading-tight">
                    {user.role}
                  </p>
                </div>
                <ChevronDownIcon className={clsx(
                  'hidden sm:block w-4 h-4 text-secondary-500 dark:text-secondary-400 transition-transform duration-200',
                  isUserMenuOpen && 'rotate-180'
                )} />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsUserMenuOpen(false)}
                    />

                    {/* Dropdown Menu */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className={clsx(
                        'absolute right-0 mt-2 w-56 rounded-xl shadow-lg z-50',
                        'bg-white dark:bg-secondary-800',
                        'border border-secondary-200 dark:border-secondary-700'
                      )}
                    >
                      {/* User Info */}
                      <div className="p-3 border-b border-secondary-100 dark:border-secondary-700">
                        <p className="font-medium text-secondary-900 dark:text-secondary-100">{user.full_name}</p>
                        <p className="text-sm text-secondary-500 dark:text-secondary-400">{user.email}</p>
                        <p className="text-xs text-secondary-400 dark:text-secondary-500 capitalize mt-1">
                          {user.role} {user.org_name && `• ${user.org_name}`}
                        </p>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          href="/profile"
                          className="flex items-center px-3 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <UserIcon className="w-4 h-4 mr-2" />
                          Profile Settings
                        </Link>

                        <Link
                          href="/settings"
                          className="flex items-center px-3 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Cog6ToothIcon className="w-4 h-4 mr-2" />
                          Account Settings
                        </Link>
                      </div>

                      {/* Sign Out */}
                      <div className="py-2 border-t border-secondary-100 dark:border-secondary-700">
                        <button
                          onClick={async () => {
                            setIsUserMenuOpen(false);
                            try {
                              await logout();
                            } catch (error) {
                              console.error('Logout error:', error);
                            }
                          }}
                          className="flex items-center w-full px-3 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

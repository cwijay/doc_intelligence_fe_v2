'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon,
  ChartBarIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Logo from '@/components/ui/Logo';
import { clsx } from 'clsx';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { useCapabilitiesModal } from '@/hooks/useCapabilitiesModal';
import { CapabilitiesModal } from '@/components/ui/CapabilitiesModal';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
  { name: 'Documents', href: '/documents', icon: DocumentTextIcon },
  { name: 'Usage', href: '/usage', icon: ChartPieIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const capabilitiesModal = useCapabilitiesModal();

  return (
    <nav className={clsx(
      'sticky top-0 z-50 transition-all duration-200',
      'bg-white/95 dark:bg-secondary-900/95 backdrop-blur-md',
      'border-b border-secondary-200/80 dark:border-secondary-700/80',
      'shadow-xs dark:shadow-dark-soft'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <Logo size="md" showText />
            </Link>
            
            <div className="hidden md:ml-10 md:flex md:space-x-1">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
              {/* Features Button */}
              <button
                onClick={capabilitiesModal.open}
                className={clsx(
                  'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group',
                  'text-primary-600 dark:text-primary-400',
                  'hover:bg-primary-50 dark:hover:bg-primary-900/20'
                )}
              >
                <SparklesIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                Features
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-3">
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

            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={clsx(
                    'flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200',
                    'hover:bg-secondary-50 dark:hover:bg-secondary-800'
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <UserCircleIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                        {user.full_name}
                      </p>
                      <p className="text-xs text-secondary-500 dark:text-secondary-400 capitalize">
                        {user.role} • {user.org_id}
                      </p>
                    </div>
                  </div>
                  <ChevronDownIcon className={clsx(
                    'w-4 h-4 text-secondary-500 dark:text-secondary-400 transition-transform duration-200',
                    isUserMenuOpen && 'rotate-180'
                  )} />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={clsx(
                        'absolute right-0 mt-2 w-56 rounded-xl shadow-medium z-50',
                        'bg-white dark:bg-secondary-800',
                        'border border-secondary-200 dark:border-secondary-700'
                      )}
                    >
                      <div className="p-3 border-b border-secondary-100 dark:border-secondary-700">
                        <p className="font-medium text-secondary-900 dark:text-secondary-100">{user.full_name}</p>
                        <p className="text-sm text-secondary-500 dark:text-secondary-400">{user.email}</p>
                        <p className="text-xs text-secondary-400 dark:text-secondary-500 capitalize mt-1">
                          {user.role} • Organization: {user.org_id}
                        </p>
                      </div>

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
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              icon={isOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-secondary-900 border-t border-secondary-200 dark:border-secondary-700"
          >
            <div className="px-4 py-3 space-y-1">
              {navigation.map((item) => (
                <MobileNavItem key={item.name} item={item} onClick={() => setIsOpen(false)} />
              ))}

              {/* Mobile Features Button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  capabilitiesModal.open();
                }}
                className={clsx(
                  'flex items-center w-full px-3 py-2 rounded-lg text-base font-medium transition-all duration-200',
                  'text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                )}
              >
                <SparklesIcon className="w-5 h-5 mr-3" />
                Features
              </button>

              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={clsx(
                  'flex items-center w-full px-3 py-2 rounded-lg text-base font-medium transition-all duration-200',
                  'text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                )}
              >
                {resolvedTheme === 'dark' ? (
                  <SunIcon className="w-5 h-5 mr-3" />
                ) : (
                  <MoonIcon className="w-5 h-5 mr-3" />
                )}
                {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>

              <div className="pt-4 border-t border-secondary-200 dark:border-secondary-700 mt-4">
                {isAuthenticated && user ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-secondary-50 dark:bg-secondary-800 rounded-lg">
                      <p className="font-medium text-secondary-900 dark:text-secondary-100">{user.full_name}</p>
                      <p className="text-sm text-secondary-500 dark:text-secondary-400">{user.email}</p>
                      <p className="text-xs text-secondary-400 dark:text-secondary-500 capitalize mt-1">
                        {user.role} • {user.org_id}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Link href="/profile" onClick={() => setIsOpen(false)}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          icon={<UserIcon className="w-4 h-4" />}
                        >
                          Profile Settings
                        </Button>
                      </Link>

                      <Link href="/settings" onClick={() => setIsOpen(false)}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          icon={<Cog6ToothIcon className="w-4 h-4" />}
                        >
                          Account Settings
                        </Button>
                      </Link>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      icon={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
                      onClick={async () => {
                        setIsOpen(false);
                        try {
                          await logout();
                        } catch (error) {
                          console.error('Logout error:', error);
                        }
                      }}
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capabilities Modal */}
      <CapabilitiesModal
        isOpen={capabilitiesModal.isOpen}
        onClose={capabilitiesModal.close}
      />
    </nav>
  );
}

function NavItem({ item }: { item: typeof navigation[0] }) {
  return (
    <Link
      href={item.href}
      className={clsx(
        'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group',
        'text-secondary-700 dark:text-secondary-300',
        'hover:text-primary-600 dark:hover:text-primary-400',
        'hover:bg-primary-50 dark:hover:bg-primary-900/20'
      )}
    >
      <item.icon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
      {item.name}
    </Link>
  );
}

function MobileNavItem({
  item,
  onClick
}: {
  item: typeof navigation[0];
  onClick: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={clsx(
        'flex items-center px-3 py-2 rounded-lg text-base font-medium transition-all duration-200',
        'text-secondary-700 dark:text-secondary-300',
        'hover:text-primary-600 dark:hover:text-primary-400',
        'hover:bg-primary-50 dark:hover:bg-primary-900/20'
      )}
    >
      <item.icon className="w-5 h-5 mr-3" />
      {item.name}
    </Link>
  );
}
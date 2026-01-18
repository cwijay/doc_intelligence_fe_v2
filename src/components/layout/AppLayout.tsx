'use client';

import { useState, ReactNode } from 'react';
import { clsx } from 'clsx';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import MobileSidebar from './MobileSidebar';
import { useAppSidebarState } from '@/hooks/useAppSidebarState';
import { useCapabilitiesModal } from '@/hooks/useCapabilitiesModal';
import { CapabilitiesModal } from '@/components/ui/CapabilitiesModal';
import { LAYOUT } from '@/lib/constants';

interface AppLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  /**
   * Whether to hide the sidebar completely (e.g., for pages with their own sidebar)
   */
  hideSidebar?: boolean;
  /**
   * Custom class name for the main content area
   */
  contentClassName?: string;
  /**
   * Whether to apply default padding to the content area
   */
  noPadding?: boolean;
}

export default function AppLayout({
  children,
  pageTitle,
  hideSidebar = false,
  contentClassName,
  noPadding = false,
}: AppLayoutProps) {
  const { sidebarState, toggleSidebar, sidebarWidth, isMobile } = useAppSidebarState();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const capabilitiesModal = useCapabilitiesModal();

  // On mobile, sidebar is always hidden and we use MobileSidebar instead
  const showDesktopSidebar = !hideSidebar && !isMobile;
  const effectiveSidebarWidth = showDesktopSidebar ? sidebarWidth : 0;

  return (
    <div className={clsx(
      "bg-gradient-to-br from-[#f5f5f5] via-[#f0fafa] to-[#fef6f3] dark:from-brand-navy-500 dark:via-brand-navy-600 dark:to-brand-navy-700 transition-colors duration-200",
      noPadding ? "h-screen overflow-hidden" : "min-h-screen"
    )}>
      {/* Desktop Sidebar */}
      {showDesktopSidebar && (
        <AppSidebar
          sidebarState={sidebarState}
          onToggleSidebar={toggleSidebar}
          onOpenFeatures={capabilitiesModal.open}
        />
      )}

      {/* Mobile Sidebar (overlay) */}
      {!hideSidebar && (
        <MobileSidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          onOpenFeatures={capabilitiesModal.open}
        />
      )}

      {/* Header */}
      <AppHeader
        sidebarWidth={effectiveSidebarWidth}
        pageTitle={pageTitle}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        showMobileMenuButton={!hideSidebar && isMobile}
      />

      {/* Main Content */}
      <main
        className={clsx(
          'transition-all duration-200',
          contentClassName
        )}
        style={{
          marginLeft: effectiveSidebarWidth,
          paddingTop: LAYOUT.HEADER_HEIGHT,
          ...(noPadding
            ? { height: '100vh', overflow: 'hidden' }
            : { minHeight: '100vh' }
          ),
        }}
      >
        {noPadding ? (
          children
        ) : (
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        )}
      </main>

      {/* Capabilities Modal */}
      <CapabilitiesModal
        isOpen={capabilitiesModal.isOpen}
        onClose={capabilitiesModal.close}
      />
    </div>
  );
}

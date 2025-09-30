'use client';

import React, { useCallback, useMemo } from 'react';
import { SidebarProps, Plugin } from '../types';
import { useSidebar } from '../hooks/useSidebar';
import { useAuth } from '../hooks/useAuth';
import { usePlugins } from '../hooks/usePlugins';
import { UserProfile } from './UserProfile';
import { SidebarSection } from './SidebarSection';
import { LoadingSkeleton } from './LoadingSkeleton';
import clsx from 'clsx';
import '../styles/tailwind.css';

// Default configuration
const DEFAULT_CONFIG = {
  collapsed: false,
  theme: 'dark' as const,
  authEnabled: true,
  keyboardShortcuts: true,
};

export const Sidebar = ({
  config = {},
  authProvider,
  onNavigate,
  className,
  children,
}: SidebarProps) => {
  // Memoize finalConfig to prevent recreation on every render
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [
    JSON.stringify(config)
  ]);

  // Initialize hooks
  const { collapsed, toggleSidebar } = useSidebar(finalConfig);
  const { user, isAuthenticated, isLoading: authLoading, login, logout } = useAuth(authProvider, finalConfig);
  const { plugins, isLoading: pluginsLoading, error: pluginsError } = usePlugins(
    finalConfig.authEnabled ? isAuthenticated : true,
    finalConfig,
    authProvider
  );

  const handlePluginClick = useCallback((plugin: Plugin) => {
    console.log('Plugin clicked:', plugin);
    // This can be extended with additional plugin click logic
  }, []);

  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  // Show loading state
  if (authLoading || pluginsLoading) {
    return (
      <div className={clsx(
        'font-sans w-64 min-w-64 max-w-64 bg-slate-900 border-r border-slate-700 min-h-screen h-full top-0 left-0 overflow-x-hidden transition-[width] duration-200 ease-linear relative',
        { 'w-12 min-w-12 max-w-12': collapsed },
        className
      )}>
        <div className={clsx(
          'transition-[width] duration-200 ease-linear w-64 min-w-64 max-w-64 flex-col top-0 bottom-0 left-0 flex h-full',
          { 'w-12 min-w-12 max-w-12': collapsed }
        )}>
          <LoadingSkeleton
            items={4}
            showUser={finalConfig.authEnabled}
            collapsed={collapsed}
          />
        </div>
      </div>
    );
  }

  // Show error state
  if (pluginsError) {
    return (
      <div className={clsx(
        'font-sans w-64 min-w-64 max-w-64 bg-slate-900 border-r border-slate-700 min-h-screen h-full top-0 left-0 overflow-x-hidden transition-[width] duration-200 ease-linear relative',
        { 'w-12 min-w-12 max-w-12': collapsed },
        className
      )}>
        <div className={clsx(
          'transition-[width] duration-200 ease-linear w-64 min-w-64 max-w-64 flex-col top-0 bottom-0 left-0 flex h-full',
          { 'w-12 min-w-12 max-w-12': collapsed }
        )}>
          <div className="flex flex-col gap-2 p-2 bg-slate-900 border-b border-slate-700 overflow-x-hidden">
            <div className="relative flex items-center gap-2 w-full min-w-0">
              <button
                type="button"
                onClick={handleToggleSidebar}
                className="flex-shrink-0 rounded-md flex items-center justify-center h-8 w-8 text-slate-300 p-0 bg-transparent border-0 cursor-pointer transition-colors duration-150 hover:text-slate-100"
                aria-label="Toggle sidebar"
                title="Toggle sidebar (Ctrl+B)"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 3v18" />
                </svg>
              </button>

              {/* User Profile Section in Header */}
              {finalConfig.authEnabled && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 p-2 rounded-md bg-transparent">
                    <div className="w-8 h-8 rounded-lg bg-slate-600"></div>
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="h-3.5 w-16 bg-slate-600 rounded"></div>
                      <div className="h-3 w-24 bg-slate-600 rounded"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden bg-slate-900 flex p-4 text-red-400">
            <p>Failed to load sidebar data: {pluginsError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-2 py-1 bg-red-500 text-white border-0 rounded cursor-pointer hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Determine which sections to show based on user permissions
  const showGlobalSection = plugins.global.length > 0;
  const showCommunitySection = plugins.community.length > 0;
  const showAdminSection = plugins.admin.length > 0;

  return (
    <div className={clsx(
      'font-sans w-64 min-w-64 max-w-64 bg-slate-900 border-r border-slate-700 min-h-screen h-full top-0 left-0 overflow-x-hidden transition-[width] duration-200 ease-linear relative',
      { 'w-12 min-w-12 max-w-12': collapsed },
      className
    )}>
      <div className={clsx(
        'transition-[width] duration-200 ease-linear w-64 min-w-64 max-w-64 flex-col top-0 bottom-0 left-0 flex h-full',
        { 'w-12 min-w-12 max-w-12': collapsed }
      )}>
        {/* Header with toggle and user profile */}
        <div className="flex flex-col gap-2 p-2 bg-slate-900 border-b border-slate-700 overflow-x-hidden">
          <div className="relative flex items-center gap-2 w-full min-w-0">
            <button
              type="button"
              onClick={handleToggleSidebar}
              className="flex-shrink-0 rounded-md flex items-center justify-center h-8 w-8 text-slate-300 p-0 bg-transparent border-0 cursor-pointer transition-colors duration-150 hover:text-slate-100"
              aria-label="Toggle sidebar"
              title="Toggle sidebar (Ctrl+B)"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
              </svg>
            </button>

            {/* User Profile Section */}
            {finalConfig.authEnabled && (
              <UserProfile
                user={user}
                onLogin={login}
                onLogout={logout}
                collapsed={collapsed}
                loading={authLoading}
                onNavigate={onNavigate}
              />
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden bg-slate-900 flex">
          {/* Global Section */}
          {showGlobalSection && (
            <SidebarSection
              title="GLOBAL"
              plugins={plugins.global}
              type="global"
              collapsed={collapsed}
              onPluginClick={handlePluginClick}
              onNavigate={onNavigate}
                          />
          )}

          {/* Community Section */}
          {showCommunitySection && (
            <SidebarSection
              title="Community"
              plugins={plugins.community}
              type="community"
              collapsed={collapsed}
              onPluginClick={handlePluginClick}
              onNavigate={onNavigate}
                            showSeparator={showGlobalSection}
            />
          )}


          {/* Custom children content */}
          {children}

          {/* Empty state when no plugins are available */}
          {!showGlobalSection && !showCommunitySection && !showAdminSection && !children && (
            <div className="relative flex w-full min-w-0 flex-col p-2">
              <div className="py-8 px-4 text-center text-slate-400">
                {finalConfig.authEnabled && !isAuthenticated ? (
                  <p>Please log in to see available options.</p>
                ) : (
                  <p>No plugins available.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with admin plugins */}
        <div className="flex flex-col gap-2 p-2 bg-slate-900 border-t border-slate-700 overflow-x-hidden">
          {/* Admin Section */}
          {showAdminSection && (
            <div className="flex flex-col gap-1">
              {plugins.admin.map((plugin) => (
                <div key={plugin.id} className="relative rounded-md">
                  <button
                    type="button"
                    onClick={() => handlePluginClick(plugin)}
                    className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-slate-300 bg-transparent border-0 cursor-pointer transition-all duration-150 min-w-0 hover:bg-slate-700 hover:text-slate-100"
                    title={plugin.name}
                  >
                    <svg className="flex-shrink-0 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"/>
                    </svg>
                    <span className={clsx(
                      'overflow-hidden text-ellipsis whitespace-nowrap opacity-100 transition-opacity duration-150 flex-1',
                      { 'hidden opacity-0': collapsed }
                    )}>{plugin.name}</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Logout button */}
          {finalConfig.authEnabled && isAuthenticated && (
            <div className="relative rounded-md">
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-slate-300 bg-transparent border-0 cursor-pointer transition-all duration-150 min-w-0 hover:bg-slate-700 hover:text-slate-100"
                title="Log out"
              >
                <svg
                  className="flex-shrink-0 w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16,17 21,12 16,7" />
                  <line x1="21" x2="9" y1="12" y2="12" />
                </svg>
                <span className={clsx(
                  'overflow-hidden text-ellipsis whitespace-nowrap opacity-100 transition-opacity duration-150 flex-1',
                  { 'hidden opacity-0': collapsed }
                )}>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
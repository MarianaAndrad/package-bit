'use client';

import { useState, useEffect, useCallback } from 'react';
import { SidebarConfig } from '../types';

const STORAGE_KEY = 'iam-sidebar-collapsed';

interface UseSidebarReturn {
  collapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useSidebar = (config?: Partial<SidebarConfig>): UseSidebarReturn => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    // Initialize from localStorage if available, otherwise use config default
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return config?.collapsed ?? false;
  });

  const setSidebarCollapsed = useCallback((isCollapsed: boolean) => {
    setCollapsed(isCollapsed);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, isCollapsed.toString());
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(!collapsed);
  }, [collapsed, setSidebarCollapsed]);

  // Keyboard shortcut handler (Ctrl+B)
  useEffect(() => {
    if (!config?.keyboardShortcuts || typeof window === 'undefined') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleSidebar, config?.keyboardShortcuts]);

  // Listen for storage changes in other tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue !== null) {
        setCollapsed(event.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    collapsed,
    toggleSidebar,
    setSidebarCollapsed,
  };
};
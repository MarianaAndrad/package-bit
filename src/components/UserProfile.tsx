'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UserProfileProps } from '../types';
import clsx from 'clsx';
import '../styles/tailwind.css';

export const UserProfile = ({
  user,
  onLogin,
  onLogout,
  collapsed = false,
  loading = false,
  onNavigate,
}: UserProfileProps & {
  onNavigate?: (path: string) => void;
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleDropdown = useCallback(() => {
    if (!user) return;
    setDropdownOpen(!dropdownOpen);
  }, [user, dropdownOpen]);

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false);
  }, []);

  const handleAccountClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('/profile');
    } else {
      window.location.href = '/profile';
    }
    closeDropdown();
  }, [onNavigate, closeDropdown]);

  const handleLogoutClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onLogout();
    closeDropdown();
  }, [onLogout, closeDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDropdown();
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [dropdownOpen, closeDropdown]);

  // Not authenticated - show login button
  if (!user) {
    return (
      <div className="flex-1 min-w-0">
        <button
          type="button"
          onClick={onLogin}
          disabled={loading}
          className={clsx(
            "w-full inline-flex items-center justify-center text-sm font-semibold rounded-md border border-transparent text-white cursor-pointer transition-colors duration-200 bg-blue-600 hover:bg-blue-700",
            collapsed ? "px-2 py-2" : "px-4 py-2"
          )}
          aria-label={loading ? 'Logging in...' : 'Login'}
        >
          {collapsed ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10,17 15,12 10,7" />
              <line x1="15" x2="3" y1="12" y2="12" />
            </svg>
          ) : (
            loading ? 'Logging in...' : 'Login'
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={toggleDropdown}
          className="flex items-center gap-2 p-2 rounded-md bg-transparent border-0 cursor-pointer text-slate-300 transition-all duration-150 min-w-0 w-full hover:bg-slate-700"
          aria-expanded={dropdownOpen}
          aria-haspopup="menu"
          aria-label={`User menu for ${user.name}`}
        >
          {/* User Avatar */}
          <div className="flex h-8 w-8 min-w-8 rounded-lg bg-slate-600 text-slate-200 items-center justify-center text-sm font-medium overflow-hidden">
            {user.picture ? (
              <img
                className="w-full h-full object-cover rounded-lg"
                src={user.picture}
                alt={user.name}
              />
            ) : (
              <span>{user.initials}</span>
            )}
          </div>

          {/* User Info - hidden when collapsed */}
          {!collapsed && (
            <div className={clsx(
              'grid flex-1 text-left text-sm leading-tight min-w-0 opacity-100 transition-opacity duration-150',
              { 'hidden opacity-0': collapsed }
            )}>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-white">
                {user.name}
              </span>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-400">
                {user.email || 'No email provided'}
              </span>
            </div>
          )}
        </button>

        {/* Dropdown Menu */}
        <div
          ref={dropdownRef}
          className={clsx(
            'fixed top-[55px] left-[30px] min-w-48 bg-slate-700 border border-slate-600 rounded-lg shadow-[0_10px_15px_-3px_rgba(0,0,0,0.3),0_4px_6px_-2px_rgba(0,0,0,0.2)] p-1 opacity-0 invisible -translate-y-2 transition-all duration-150 z-[99999]',
            {
              'opacity-100 visible translate-y-0': dropdownOpen,
              'md:left-[15px]': true // responsive adjustment for mobile
            }
          )}
          role="menu"
          aria-hidden={!dropdownOpen}
        >
          {/* Account Link */}
          <a
            href="/profile"
            onClick={handleAccountClick}
            className="relative flex cursor-pointer items-center rounded-md px-2 py-1.5 text-sm outline-none transition-150 ease-in-out text-slate-300 gap-2 bg-transparent no-underline border-0 w-full hover:bg-slate-600 hover:text-slate-100"
            role="menuitem"
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span>Account</span>
          </a>

          {/* Separator */}
          <div className="my-1 h-px bg-slate-600" />

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogoutClick}
            className="relative flex cursor-pointer items-center rounded-md px-2 py-1.5 text-sm outline-none transition-150 ease-in-out text-slate-300 gap-2 bg-transparent border-0 w-full hover:bg-slate-600 hover:text-red-400"
            role="menuitem"
          >
            <svg
              width="16"
              height="16"
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
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
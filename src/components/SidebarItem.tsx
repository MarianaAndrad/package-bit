'use client';

import React, { useState, useCallback } from 'react';
import { SidebarItemProps, Plugin } from '../types';
import clsx from 'clsx';
import '../styles/tailwind.css';

// Helper function to get link properties based on plugin type
const getLinkProperties = (plugin: Plugin) => {
  const params: { href?: string; target?: string } = {};

  switch (plugin.plugin_view) {
    case 'EXT_LINK':
      params.href = plugin.base_path + plugin.relative_path;
      params.target = '_blank';
      break;
    case 'HTML_IFRAME':
      params.href = plugin.base_path + plugin.relative_path;
      break;
    case 'TP_IFRAME':
      params.href = `/iframe/${plugin.slug}`;
      break;
    default:
      params.href = plugin.base_path + plugin.relative_path;
  }

  return params;
};

// Helper function to trim trailing slash for URL comparison
const trimLastSlash = (url: string): string => {
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

// Helper function to render plugin icon
const PluginIcon = ({ plugin }: { plugin: Plugin }) => {
  if (plugin.icon_url) {
    // If icon_url is already a full URL, use it directly
    // Otherwise, use relative path (should be configured via environment variables)
    const iconSrc = plugin.icon_url.startsWith('http')
      ? plugin.icon_url
      : `/internal/api${plugin.icon_url}`;

    return (
      <img
        src={iconSrc}
        alt={`${plugin.name} icon`}
        className="flex-shrink-0 w-4 h-4"
      />
    );
  }

  // Default puzzle piece icon
  return (
    <svg
      className="flex-shrink-0 w-4 h-4"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z" />
    </svg>
  );
};

// Shortcut item component
const ShortcutItem: React.FC<{
  plugin: Plugin;
  shortcut: Plugin['shortcuts'][0];
  onNavigate?: (path: string) => void;
  }> = ({ plugin, shortcut, onNavigate }) => {
  const shortcutLinkProps = getLinkProperties({
    ...plugin,
    slug: `${plugin.slug}-${shortcut.slug}`,
    base_path: plugin.base_path,
    relative_path: shortcut.url_path,
  });

  const url = shortcutLinkProps.href || '#';
  const target = shortcutLinkProps.target || '_self';

  // Check if this shortcut is currently active
  const isActive = typeof window !== 'undefined'
    ? trimLastSlash(window.location.pathname) === trimLastSlash(url)
    : false;

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(url);
    }
  }, [onNavigate, url]);

  return (
    <li className="relative rounded-md">
      <a
        href={url}
        target={target}
        onClick={handleClick}
        className={clsx(
          'flex w-full items-center gap-2 overflow-hidden rounded-md py-1.5 px-2 text-left text-xs text-slate-400 bg-transparent border-0 cursor-pointer transition-all duration-150 min-w-0 no-underline hover:bg-slate-700 hover:text-slate-100',
          { 'bg-primary text-white': isActive }
        )}
      >
        <span className={clsx(
          'overflow-hidden text-ellipsis whitespace-nowrap opacity-100 transition-opacity duration-150 flex-1'
        )}>
          {shortcut.name}
        </span>
      </a>
    </li>
  );
};

// Dropdown component for plugins with shortcuts
const PluginDropdown: React.FC<{
  plugin: Plugin;
  collapsed?: boolean;
  onNavigate?: (path: string) => void;
  }> = ({ plugin, collapsed = false, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = useCallback(() => {
    if (collapsed) return; // Don't allow dropdown in collapsed state
    setIsOpen(!isOpen);
  }, [collapsed, isOpen]);

  return (
    <li className="relative rounded-md">
      <button
        type="button"
        onClick={toggleDropdown}
        className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-slate-300 bg-transparent border-0 cursor-pointer transition-all duration-150 min-w-0 hover:bg-slate-700 hover:text-slate-100"
        aria-expanded={isOpen}
        aria-controls={`dropdown-${plugin.slug}`}
      >
        <PluginIcon plugin={plugin}  />
        <span className={clsx(
          'overflow-hidden text-ellipsis whitespace-nowrap opacity-100 transition-opacity duration-150 flex-1',
          { 'hidden opacity-0': collapsed }
        )}>
          {plugin.name}
        </span>
        <svg
          className={clsx(
            'w-4 h-4 flex-shrink-0 transition-transform duration-200 opacity-100',
            { 'opacity-0': collapsed },
            { 'rotate-180': isOpen }
          )}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div
        id={`dropdown-${plugin.slug}`}
        className={clsx(
          'overflow-hidden transition-[max-height,opacity] duration-300 ease-out pl-4',
          {
            'block opacity-100 max-h-[200px]': isOpen,
            'hidden max-h-0 opacity-0': !isOpen
          }
        )}
      >
        <ul className="flex w-full min-w-0 flex-col gap-0.5 list-none m-0 p-0 mt-1 border-l-2 border-slate-600 pl-1.5">
          {plugin.shortcuts.map((shortcut) => (
            <ShortcutItem
              key={shortcut.id}
              plugin={plugin}
              shortcut={shortcut}
              onNavigate={onNavigate}
                          />
          ))}
        </ul>
      </div>
    </li>
  );
};

// Main SidebarItem component
export const SidebarItem: React.FC<SidebarItemProps & {
  onNavigate?: (path: string) => void;
  }> = ({
  plugin,
  isActive = false,
  onClick,
  collapsed = false,
  onNavigate,
  }) => {
  // If plugin has shortcuts, render as dropdown
  if (plugin.shortcuts && plugin.shortcuts.length > 0) {
    return (
      <PluginDropdown
        plugin={plugin}
        collapsed={collapsed}
        onNavigate={onNavigate}
              />
    );
  }

  // Regular plugin item
  const linkProps = getLinkProperties(plugin);
  const url = linkProps.href || '#';
  const target = linkProps.target || '_self';

  // Check if this plugin is currently active
  const currentlyActive = isActive || (
    typeof window !== 'undefined'
      ? trimLastSlash(window.location.pathname) === trimLastSlash(url)
      : false
  );

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (onClick) {
      onClick(plugin);
    }

    if (onNavigate) {
      e.preventDefault();
      onNavigate(url);
    }
  }, [onClick, onNavigate, plugin, url]);

  return (
    <li className="relative rounded-md">
      <a
        href={url}
        target={target}
        onClick={handleClick}
        className={clsx(
          'flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-slate-300 bg-transparent border-0 cursor-pointer transition-all duration-150 min-w-0 no-underline hover:bg-slate-700 hover:text-slate-100',
          { 'bg-primary text-white': currentlyActive }
        )}
        title={plugin.name}
      >
        <PluginIcon plugin={plugin}  />
        <span className={clsx(
          'overflow-hidden text-ellipsis whitespace-nowrap opacity-100 transition-opacity duration-150 flex-1',
          { 'hidden opacity-0': collapsed }
        )}>
          {plugin.name}
        </span>
      </a>
    </li>
  );
};

export default SidebarItem;
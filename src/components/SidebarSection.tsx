import React from 'react';
import { SidebarSectionProps, Plugin } from '../types';
import { SidebarItem } from './SidebarItem';
import clsx from 'clsx';
import '../styles/tailwind.css';

// Special items that should be added to specific sections
const SpecialItems: Record<string, Plugin[]> = {
  global: [
    {
      id: 'workspace',
      name: 'Workspace',
      slug: 'workspace',
      base_path: '',
      relative_path: '/workspace',
      display_section: 'GLOBAL',
      type: 'internal',
      shortcuts: [],
    },
  ],
};

// Helper function to get icon for special items
const SpecialItemIcon = ({ itemId }: { itemId: string }) => {
  switch (itemId) {
    case 'workspace':
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
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
          <path d="M10 6h4" />
          <path d="M10 10h4" />
          <path d="M10 14h4" />
          <path d="M10 18h4" />
        </svg>
      );
    default:
      return null;
  }
};

// Component for special items that renders with custom icons
const SpecialItem: React.FC<{
  item: Plugin;
  onNavigate?: (path: string) => void;
  collapsed?: boolean;
}> = ({ item, onNavigate, collapsed }) => {
  const handleClick = (e: React.MouseEvent) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(item.base_path + item.relative_path);
    }
  };

  const isActive = typeof window !== 'undefined'
    ? window.location.pathname === (item.base_path + item.relative_path)
    : false;

  return (
    <li className="relative rounded-md">
      <a
        href={item.base_path + item.relative_path}
        onClick={handleClick}
        className={clsx(
          'flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-slate-300 bg-transparent border-0 cursor-pointer transition-all duration-150 min-w-0 no-underline hover:bg-slate-700 hover:text-slate-100',
          { 'bg-primary text-white': isActive }
        )}
        title={item.name}
      >
        <SpecialItemIcon itemId={item.id} />
        <span className={clsx(
          'overflow-hidden text-ellipsis whitespace-nowrap opacity-100 transition-opacity duration-150 flex-1',
          { 'hidden opacity-0': collapsed }
        )}>
          {item.name}
        </span>
      </a>
    </li>
  );
};

export const SidebarSection: React.FC<SidebarSectionProps & {
  onNavigate?: (path: string) => void;
  showSeparator?: boolean;
}> = ({
  title,
  plugins,
  type,
  collapsed = false,
  onPluginClick,
  onNavigate,
  showSeparator = false,
}) => {
  // Don't render empty sections (except for global which has special items)
  const specialItems = SpecialItems[type] || [];
  const hasContent = plugins.length > 0 || specialItems.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <>
      {/* Section Separator - shown before sections that need it */}
      {showSeparator && !collapsed && (
        <div className="block mx-2 w-auto h-px bg-slate-700 opacity-100 transition-opacity duration-150" />
      )}

      <div className="relative flex w-full min-w-0 flex-col p-2">
        {/* Section Label */}
        {!collapsed && (
          <div className="flex transition-opacity duration-150 text-slate-400 text-xs font-semibold uppercase tracking-wider h-8 items-center px-2 mb-1 opacity-100">
            {title}
          </div>
        )}

        <div className="w-full text-sm">
          <ul className="flex w-full min-w-0 flex-col gap-1 list-none m-0 p-0">
            {/* Render special items first (like Workspace for global section) */}
            {specialItems.map((item) => (
              <SpecialItem
                key={item.id}
                item={item}
                onNavigate={onNavigate}
                collapsed={collapsed}
              />
            ))}

            {/* Render plugin items */}
            {plugins.map((plugin) => (
              <SidebarItem
                key={plugin.id}
                plugin={plugin}
                onClick={onPluginClick}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default SidebarSection;
import React from 'react';
import { LoadingSkeletonProps } from '../types';
import '../styles/tailwind.css';

export const LoadingSkeleton = ({
  items = 3,
  showUser = true,
  collapsed = false,
}: LoadingSkeletonProps) => {
  return (
    <div className="min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden bg-slate-900 flex">
      {showUser && (
        <div className="flex flex-col gap-2 p-2 bg-slate-900 border-b border-slate-700 overflow-x-hidden">
          <div className="relative flex items-center gap-2 w-full min-w-0">
            <button
              type="button"
              className="flex-shrink-0 rounded-md flex items-center justify-center h-8 w-8 text-slate-300 p-0 bg-transparent border-0 cursor-pointer transition-colors duration-150 hover:text-slate-100"
              disabled
              aria-label="Toggle sidebar (loading)"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
              </svg>
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 p-2 rounded-md bg-transparent border-0 cursor-pointer text-slate-300 transition-all duration-150 min-w-0 w-full hover:bg-slate-700">
                <div className="w-8 h-8 rounded-lg bg-slate-700 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full" />
                {!collapsed && (
                  <div className="grid flex-1 text-left text-sm leading-tight min-w-0 opacity-100 transition-opacity duration-150">
                    <div className="h-3.5 w-16 mb-1 bg-slate-700 rounded relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full" />
                    <div className="h-3 w-24 bg-slate-700 rounded relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Section Skeleton */}
      <div className="relative flex w-full min-w-0 flex-col p-2">
        {!collapsed && (
          <div className="h-3 w-14 mx-2 mb-3 bg-slate-700 rounded relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full" />
        )}
        <div className="w-full text-sm">
          <ul className="flex w-full min-w-0 flex-col gap-1 list-none m-0 p-0">
            {Array.from({ length: items }, (_, index) => (
              <li key={`global-${index}`} className="relative rounded-md">
                <div className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-slate-300 bg-transparent border-0 cursor-pointer transition-all duration-150 min-w-0">
                  <div className="w-4 h-4 rounded-sm bg-slate-700 flex-shrink-0 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full" />
                  {!collapsed && (
                    <div className={`h-3.5 bg-slate-700 rounded flex-1 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full ${
                      index === 0 ? 'w-20' : index === 1 ? 'w-16' : 'w-24'
                    }`} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Separator Skeleton */}
      {!collapsed && (
        <div className="mx-2 w-auto h-px bg-slate-700 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full" />
      )}

      {/* Community Section Skeleton */}
      <div className="relative flex w-full min-w-0 flex-col p-2">
        {!collapsed && (
          <div className="h-3 w-18 mx-2 mb-3 bg-slate-700 rounded relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full" />
        )}
        <div className="w-full text-sm">
          <ul className="flex w-full min-w-0 flex-col gap-1 list-none m-0 p-0">
            {Array.from({ length: Math.max(1, items - 1) }, (_, index) => (
              <li key={`community-${index}`} className="relative rounded-md">
                <div className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-slate-300 bg-transparent border-0 cursor-pointer transition-all duration-150 min-w-0">
                  <div className="w-4 h-4 rounded-sm bg-slate-700 flex-shrink-0 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full" />
                  {!collapsed && (
                    <div className={`h-3.5 bg-slate-700 rounded flex-1 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full ${
                      index === 0 ? 'w-16' : index === 1 ? 'w-26' : 'w-14'
                    }`} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="flex flex-col gap-2 p-2 bg-slate-900 border-t border-slate-700 overflow-x-hidden">
        <div className="relative flex w-full min-w-0 flex-col p-2">
          <div className="relative rounded-md">
            <div className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-slate-300 bg-transparent border-0 cursor-pointer transition-all duration-150 min-w-0">
              <div className="w-4 h-4 rounded-sm bg-slate-700 flex-shrink-0 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full" />
              {!collapsed && (
                <div className="h-3.5 w-16 bg-slate-700 rounded flex-1 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
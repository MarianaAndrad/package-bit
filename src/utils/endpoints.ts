'use client';

import { SidebarConfig } from '../types';

// Default endpoint paths - matching original IAM-Keycloak implementation
// These are relative paths that will work with any domain when used with apiBaseUrl
const DEFAULT_ENDPOINTS = {
  plugins: '/internal/api/plugin/?activate=true&display_section=GLOBAL&display_section=ADMIN&no_page=true',
  globalPlugins: '/internal/api/plugin/?activate=true&display_section=GLOBAL&no_page=true',
  adminPlugins: '/internal/api/plugin/?activate=true&display_section=ADMIN&no_page=true',
  tenantPlugins: '/internal/api//community/{slug}/plugin/all?no_page=true', // Note: double slash is intentional
  communityDetails: '/internal/api/community/{slug}',
  authRefresh: '/internal/api/auth/refresh',
  authSignin: '/api/auth/signin/keycloak',
  authLogout: '/api/auth/federated-logout',
  authCSRF: '/api/auth/csrf',
};

// Environment variable keys for NextJS (must start with NEXT_PUBLIC_ for client-side access)
const ENV_KEYS = {
  plugins: 'NEXT_PUBLIC_IAM_SIDEBAR_PLUGINS_ENDPOINT',
  globalPlugins: 'NEXT_PUBLIC_IAM_SIDEBAR_GLOBAL_PLUGINS_ENDPOINT',
  adminPlugins: 'NEXT_PUBLIC_IAM_SIDEBAR_ADMIN_PLUGINS_ENDPOINT',
  tenantPlugins: 'NEXT_PUBLIC_IAM_SIDEBAR_TENANT_PLUGINS_ENDPOINT',
  communityDetails: 'NEXT_PUBLIC_IAM_SIDEBAR_COMMUNITY_DETAILS_ENDPOINT',
  authRefresh: 'NEXT_PUBLIC_IAM_SIDEBAR_AUTH_REFRESH_ENDPOINT',
  authSignin: 'NEXT_PUBLIC_IAM_SIDEBAR_AUTH_SIGNIN_ENDPOINT',
  authLogout: 'NEXT_PUBLIC_IAM_SIDEBAR_AUTH_LOGOUT_ENDPOINT',
  authCSRF: 'NEXT_PUBLIC_IAM_SIDEBAR_AUTH_CSRF_ENDPOINT',
};

/**
 * Get an endpoint URL with the following priority:
 * 1. Config override
 * 2. Environment variable
 * 3. Default value
 */
function getEndpoint(
  endpointName: keyof typeof DEFAULT_ENDPOINTS,
  config?: SidebarConfig,
  params?: Record<string, string>
): string {
  // 1. Check config override
  const configEndpoint = config?.endpoints?.[endpointName];
  if (configEndpoint) {
    return replaceParams(configEndpoint, params);
  }

  // 2. Use default
  return replaceParams(DEFAULT_ENDPOINTS[endpointName], params);
}

/**
 * Replace parameters in endpoint URLs (e.g., {slug} -> actual slug)
 */
function replaceParams(endpoint: string, params?: Record<string, string>): string {
  if (!params) return endpoint;

  let result = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`{${key}}`, value);
  });

  return result;
}

/**
 * Get the full URL for an endpoint
 */
export function getFullEndpointUrl(
  endpointName: keyof typeof DEFAULT_ENDPOINTS,
  config?: SidebarConfig,
  params?: Record<string, string>
): string {
  const endpoint = getEndpoint(endpointName, config, params);

  // If endpoint is already absolute URL, return as-is
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  // For relative URLs, we need to handle the basePath context
  if (typeof window !== 'undefined' && endpoint.startsWith('/')) {
    const currentPath = window.location.pathname;
    const origin = window.location.origin;

    // Check if we're in the dante frontend context (with basePath)
    if (currentPath.includes('/internal/api/service/')) {
      // We're in a Next.js app with basePath, so API calls need to go to domain root
      // to avoid the basePath being prepended
      return `${origin}${endpoint}`;
    }

    // Otherwise, use relative URL (for apps without basePath)
    return endpoint;
  }

  return endpoint;
}

/**
 * Get all configured endpoints for debugging
 */
export function getAllEndpoints(config?: SidebarConfig): Record<string, string> {
  const endpoints: Record<string, string> = {};

  Object.keys(DEFAULT_ENDPOINTS).forEach((key) => {
    const endpointName = key as keyof typeof DEFAULT_ENDPOINTS;
    try {
      endpoints[key] = getFullEndpointUrl(endpointName, config);
    } catch (error) {
      endpoints[key] = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  });

  return endpoints;
}

/**
 * Check if we're in standalone mode
 */
export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if there's a specific environment variable or config that indicates standalone mode
  const standaloneSlug = process.env.NEXT_PUBLIC_STANDALONE_SLUG;
  if (standaloneSlug) return true;

  // Alternative check: if no community is set in localStorage, might be standalone
  const community = localStorage.getItem('iam-community');
  return !community;
}

/**
 * Check if user is an admin based on token
 */
export function isUserAdmin(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // Get token from cookies (similar to usePlugins logic)
    const token = getCookieValue('iam-token');
    if (!token) return false;

    // Simple JWT decode to check roles
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.realm_access?.roles?.includes('admin') || false;
  } catch {
    return false;
  }
}

/**
 * Check if user is a manager for current community
 */
export function isUserManager(): boolean {
  if (typeof window === 'undefined') return false;

  // This would need to be set by the community details fetch
  // For now, we'll return false and let the usePlugins hook handle this
  return false;
}

// Helper function to get cookie value (moved here to avoid duplication)
function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.split('=').map(c => c.trim());
    if (key === name) {
      return decodeURIComponent(value);
    }
    // Handle chunked tokens
    if (key.startsWith(name + '.')) {
      const chunks: string[] = [];
      let index = 0;
      while (true) {
        const chunkKey = `${name}.${index}`;
        const chunkValue = document.cookie
          .split(';')
          .find(c => c.trim().startsWith(chunkKey + '='));

        if (!chunkValue) break;
        chunks.push(chunkValue.split('=')[1].trim());
        index++;
      }
      return chunks.join('');
    }
  }
  return null;
}

/**
 * Validate that all required endpoints are configured
 */
export function validateEndpointConfig(config?: SidebarConfig): {
  isValid: boolean;
  missing: string[];
  configured: string[];
} {
  const missing: string[] = [];
  const configured: string[] = [];

  Object.keys(DEFAULT_ENDPOINTS).forEach((key) => {
    const endpointName = key as keyof typeof DEFAULT_ENDPOINTS;
    const configEndpoint = config?.endpoints?.[endpointName];

    if (configEndpoint) {
      configured.push(`${endpointName}: ${configEndpoint}`);
    } else {
      missing.push(`config.endpoints.${endpointName}`);
    }
  });

  return {
    isValid: missing.length === 0,
    missing,
    configured,
  };
}
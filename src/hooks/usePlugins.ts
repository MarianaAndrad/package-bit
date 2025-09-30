'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plugin, ApiHeaders, CommunityDetails, SidebarConfig, AuthProvider } from '../types';
import { getFullEndpointUrl } from '../utils/endpoints';

interface UsePluginsReturn {
  plugins: {
    global: Plugin[];
    community: Plugin[];
    admin: Plugin[];
  };
  communityDetails: CommunityDetails | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const STORAGE_KEYS = {
  TOKEN: 'iam-token',
  COMMUNITY: 'iam-community',
  ROLE_ADMIN: 'admin',
};

// Helper function to get cookie value
const getCookieValue = (name: string): string | null => {
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
};

// Helper function to check if user is admin
const checkUserAdminRole = (): boolean => {
  try {
    const token = getCookieValue(STORAGE_KEYS.TOKEN);
    if (!token) return false;

    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.realm_access?.roles?.includes(STORAGE_KEYS.ROLE_ADMIN) || false;
  } catch {
    return false;
  }
};

// Helper function to create auth headers
const getAuthHeaders = (authProvider?: AuthProvider): ApiHeaders => {
  const headers: ApiHeaders = { 'Content-Type': 'application/json' };

  let token: string | null = null;

  if (authProvider) {
    token = authProvider.getToken();
  } else {
    token = getCookieValue(STORAGE_KEYS.TOKEN);
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

// Helper function to make API request
const apiRequest = async <T = any>(
  url: string,
  headers: ApiHeaders
): Promise<T> => {
  // Filter out undefined values for fetch compatibility
  const cleanHeaders: Record<string, string> = {};
  Object.entries(headers).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanHeaders[key] = value;
    }
  });

  const response = await fetch(url, {
    method: 'GET',
    headers: cleanHeaders,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Clear cookies on unauthorized
      if (typeof document !== 'undefined') {
        document.cookie = `${STORAGE_KEYS.TOKEN}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
      throw new Error('Unauthorized - please login again');
    }
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
};

export const usePlugins = (
  isAuthenticated: boolean,
  config?: Partial<SidebarConfig>,
  authProvider?: AuthProvider
): UsePluginsReturn => {
  const [plugins, setPlugins] = useState<{
    global: Plugin[];
    community: Plugin[];
    admin: Plugin[];
  }>({
    global: [],
    community: [],
    admin: [],
  });

  const [communityDetails, setCommunityDetails] = useState<CommunityDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize config to prevent unnecessary recreations
  const stableConfig = useMemo(() => config, [JSON.stringify(config)]);

  // Use ref to store the current authProvider to avoid dependency issues
  const authProviderRef = useRef(authProvider);
  authProviderRef.current = authProvider;

  const fetchPlugins = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      setPlugins({ global: [], community: [], admin: [] });
      setCommunityDetails(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const headers = getAuthHeaders(authProviderRef.current);

      let globalPlugins: Plugin[] = [];
      let adminPlugins: Plugin[] = [];
      let communityPlugins: Plugin[] = [];
      let communityData: CommunityDetails | null = null;

      // Check if user has a community context
      const communitySlug = typeof window !== 'undefined'
        ? localStorage.getItem(STORAGE_KEYS.COMMUNITY)
        : null;

      // First, always fetch global and admin plugins using the combined endpoint (like original)
      try {
        const pluginsEndpoint = getFullEndpointUrl('plugins', stableConfig);
        console.log('Fetching plugins from:', pluginsEndpoint);
        const allPlugins = await apiRequest<Plugin[]>(pluginsEndpoint, headers);

        globalPlugins = allPlugins.filter(plugin => plugin.display_section === 'GLOBAL');
        adminPlugins = allPlugins.filter(plugin => plugin.display_section === 'ADMIN');
      } catch (pluginsError) {
        console.warn('Failed to fetch global/admin plugins:', pluginsError);
        // Continue - we might still be able to fetch community plugins
      }

      // Fetch community plugins and details if community exists
      if (communitySlug) {
        try {
          const tenantPluginsUrl = getFullEndpointUrl('tenantPlugins', stableConfig, { slug: communitySlug });
          const communityDetailsUrl = getFullEndpointUrl('communityDetails', stableConfig, { slug: communitySlug });

          console.log('Fetching tenant plugins from:', tenantPluginsUrl);
          console.log('Fetching community details from:', communityDetailsUrl);

          const [tenantPluginsResponse, communityDetailsResponse] = await Promise.allSettled([
            apiRequest<Plugin[]>(tenantPluginsUrl, headers),
            apiRequest<CommunityDetails>(communityDetailsUrl, headers)
          ]);

          if (tenantPluginsResponse.status === 'fulfilled') {
            communityPlugins = tenantPluginsResponse.value || [];
          }

          if (communityDetailsResponse.status === 'fulfilled') {
            communityData = communityDetailsResponse.value;
          }
        } catch (communityError) {
          console.warn('Failed to fetch community data:', communityError);
        }
      }

      // Check if we're in standalone mode for plugin display logic
      const isStandalone = typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_STANDALONE_SLUG;

      if (isStandalone) {
        // In standalone mode, combine global and community plugins
        const allStandalonePlugins = [...globalPlugins, ...communityPlugins];
        globalPlugins = allStandalonePlugins;
        communityPlugins = []; // Don't show separate community section
      }

      // Filter admin plugins based on user permissions
      const filteredAdminPlugins = adminPlugins.filter(() => {
        // Check if user is admin or manager
        const isAdmin = checkUserAdminRole();
        const isManager = communityData?.user_status === 'manager';
        return isAdmin || isManager;
      });

      setPlugins({
        global: globalPlugins,
        community: communityPlugins,
        admin: filteredAdminPlugins,
      });

      setCommunityDetails(communityData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch plugins';
      setError(errorMessage);
      console.error('Plugin fetch error:', err);

      // Reset plugins on error
      setPlugins({ global: [], community: [], admin: [] });
      setCommunityDetails(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, stableConfig]);

  // Initial fetch and refetch when authentication state or config changes
  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  // Store fetchPlugins in a ref to avoid dependency cycles
  const fetchPluginsRef = useRef(fetchPlugins);
  fetchPluginsRef.current = fetchPlugins;

  // Check for community context changes
  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.COMMUNITY) {
        fetchPluginsRef.current(); // Use ref to avoid dependency cycles
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated]);

  return {
    plugins,
    communityDetails,
    isLoading,
    error,
    refetch: fetchPlugins,
  };
};
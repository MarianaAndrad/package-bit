'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, User, AuthSession, SidebarConfig } from '../types';
import { getFullEndpointUrl } from '../utils/endpoints';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const STORAGE_KEYS = {
  TOKEN: 'ECOSYSTEM.session-token',
  REFRESH_TOKEN: 'ECOSYSTEM.refresh-token',
  USER: 'iam-user',
};

// Helper function to decode JWT (basic implementation)
const decodeJWT = (token: string): AuthSession | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

// Helper function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

// Helper function to extract user from session
const getUserFromSession = (session: AuthSession): User => {
  const name = session.name || 'Guest';
  const email = session.email || '';
  const initials = name.split(' ').map(word => word.charAt(0).toUpperCase()).join('');

  return {
    name,
    email,
    picture: session.picture,
    initials,
  };
};

// Helper function to get cookies
const getCookieValue = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.split('=').map(c => c.trim());
    if (key === name) {
      return decodeURIComponent(value);
    }
    // Handle chunked tokens (for large JWTs)
    if (key.startsWith(name + '.')) {
      // Reconstruct chunked token
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

export const useAuth = (authProvider?: AuthProvider, config?: Partial<SidebarConfig>): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authProvider) {
          // Use provided auth provider
          const isAuth = authProvider.isAuthenticated();
          setIsAuthenticated(isAuth);

          if (isAuth) {
            const userData = authProvider.getUser();
            setUser(userData);
          }
        } else {
          // Default cookie-based authentication
          const token = getCookieValue(STORAGE_KEYS.TOKEN);

          if (token && !isTokenExpired(token)) {
            const session = decodeJWT(token);
            if (session) {
              const userData = getUserFromSession(session);
              setUser(userData);
              setIsAuthenticated(true);

              // Store user in localStorage for persistence
              if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
              }
            }
          } else {
            // Try to get user from localStorage
            if (typeof window !== 'undefined') {
              const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
              if (storedUser) {
                try {
                  const userData = JSON.parse(storedUser);
                  setUser(userData);
                  // Don't set authenticated without valid token
                } catch (error) {
                  console.error('Failed to parse stored user:', error);
                  localStorage.removeItem(STORAGE_KEYS.USER);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [authProvider]);

  // Auto-refresh token
  useEffect(() => {
    if (!isAuthenticated || authProvider) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
      }
    }, 2 * 60 * 1000); // Refresh every 2 minutes

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, authProvider]);

  const login = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      if (authProvider) {
        await authProvider.login();
        const userData = authProvider.getUser();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        // Default federated login implementation using configurable endpoints
        const csrfEndpoint = getFullEndpointUrl('authCSRF', config);
        const signinEndpoint = getFullEndpointUrl('authSignin', config);

        const response = await fetch(csrfEndpoint, {});
        const responseData = await response.json();
        const csrf = responseData['csrfToken'];

        const signin = await fetch(signinEndpoint, {
          method: 'post',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            csrfToken: csrf,
            callbackUrl: window.location.href,
            json: 'true'
          })
        });

        const signinData = await signin.json();
        if (signinData && signinData.url) {
          window.location.href = signinData.url;
        } else {
          throw new Error('Sign-in failed');
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authProvider]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      if (authProvider) {
        await authProvider.logout();
      } else {
        // Default federated logout implementation using configurable endpoint
        const logoutEndpoint = getFullEndpointUrl('authLogout', config);

        const response = await fetch(logoutEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
        });

        const data = await response.json();
        if (data && data.url) {
          // Clear local storage before redirect
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEYS.USER);
          }
          window.location.href = data.url;
          return;
        }
      }

      // Clear user state
      setUser(null);
      setIsAuthenticated(false);

      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [authProvider]);

  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      if (authProvider?.refreshToken) {
        await authProvider.refreshToken();
        const userData = authProvider.getUser();
        setUser(userData);
        return;
      }

      // Default refresh token implementation using configurable endpoint
      const refreshTokenValue = getCookieValue(STORAGE_KEYS.REFRESH_TOKEN);
      const token = getCookieValue(STORAGE_KEYS.TOKEN);

      if (!token || !refreshTokenValue) {
        throw new Error('No tokens available for refresh');
      }

      const refreshEndpoint = getFullEndpointUrl('authRefresh', config);
      const response = await fetch(refreshEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refresh_token: refreshTokenValue
        })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      // Update cookies (simplified - in real implementation this would handle chunking)
      document.cookie = `${STORAGE_KEYS.TOKEN}=${data.access_token}; Path=/`;
      document.cookie = `${STORAGE_KEYS.REFRESH_TOKEN}=${data.refresh_token}; Path=/`;

      // Update user data
      const session = decodeJWT(data.access_token);
      if (session) {
        const userData = getUserFromSession(session);
        setUser(userData);

        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }, [authProvider]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshToken,
  };
};
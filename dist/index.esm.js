import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

const STORAGE_KEY = 'iam-sidebar-collapsed';
const useSidebar = (config) => {
    const [collapsed, setCollapsed] = useState(() => {
        var _a;
        // Initialize from localStorage if available, otherwise use config default
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored !== null) {
                return stored === 'true';
            }
        }
        return (_a = config === null || config === void 0 ? void 0 : config.collapsed) !== null && _a !== void 0 ? _a : false;
    });
    const setSidebarCollapsed = useCallback((isCollapsed) => {
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
        if (!(config === null || config === void 0 ? void 0 : config.keyboardShortcuts) || typeof window === 'undefined') {
            return;
        }
        const handleKeyDown = (event) => {
            if (event.ctrlKey && event.key === 'b') {
                event.preventDefault();
                toggleSidebar();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [toggleSidebar, config === null || config === void 0 ? void 0 : config.keyboardShortcuts]);
    // Listen for storage changes in other tabs
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        const handleStorageChange = (event) => {
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
/**
 * Get an endpoint URL with the following priority:
 * 1. Config override
 * 2. Environment variable
 * 3. Default value
 */
function getEndpoint(endpointName, config, params) {
    var _a;
    // 1. Check config override
    const configEndpoint = (_a = config === null || config === void 0 ? void 0 : config.endpoints) === null || _a === void 0 ? void 0 : _a[endpointName];
    if (configEndpoint) {
        return replaceParams(configEndpoint, params);
    }
    // 2. Use default
    return replaceParams(DEFAULT_ENDPOINTS[endpointName], params);
}
/**
 * Replace parameters in endpoint URLs (e.g., {slug} -> actual slug)
 */
function replaceParams(endpoint, params) {
    if (!params)
        return endpoint;
    let result = endpoint;
    Object.entries(params).forEach(([key, value]) => {
        result = result.replace(`{${key}}`, value);
    });
    return result;
}
/**
 * Get the full URL for an endpoint
 */
function getFullEndpointUrl(endpointName, config, params) {
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
function getAllEndpoints(config) {
    const endpoints = {};
    Object.keys(DEFAULT_ENDPOINTS).forEach((key) => {
        const endpointName = key;
        try {
            endpoints[key] = getFullEndpointUrl(endpointName, config);
        }
        catch (error) {
            endpoints[key] = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    });
    return endpoints;
}
/**
 * Validate that all required endpoints are configured
 */
function validateEndpointConfig(config) {
    const missing = [];
    const configured = [];
    Object.keys(DEFAULT_ENDPOINTS).forEach((key) => {
        var _a;
        const endpointName = key;
        const configEndpoint = (_a = config === null || config === void 0 ? void 0 : config.endpoints) === null || _a === void 0 ? void 0 : _a[endpointName];
        if (configEndpoint) {
            configured.push(`${endpointName}: ${configEndpoint}`);
        }
        else {
            missing.push(`config.endpoints.${endpointName}`);
        }
    });
    return {
        isValid: missing.length === 0,
        missing,
        configured,
    };
}

const STORAGE_KEYS$1 = {
    TOKEN: 'ECOSYSTEM.session-token',
    REFRESH_TOKEN: 'ECOSYSTEM.refresh-token',
    USER: 'iam-user',
};
// Helper function to decode JWT (basic implementation)
const decodeJWT = (token) => {
    try {
        const payload = token.split('.')[1];
        if (!payload)
            return null;
        const decoded = JSON.parse(atob(payload));
        return decoded;
    }
    catch (error) {
        console.error('Failed to decode JWT:', error);
        return null;
    }
};
// Helper function to check if token is expired
const isTokenExpired = (token) => {
    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp)
        return true;
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
};
// Helper function to extract user from session
const getUserFromSession = (session) => {
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
const getCookieValue$1 = (name) => {
    if (typeof document === 'undefined')
        return null;
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [key, value] = cookie.split('=').map(c => c.trim());
        if (key === name) {
            return decodeURIComponent(value);
        }
        // Handle chunked tokens (for large JWTs)
        if (key.startsWith(name + '.')) {
            // Reconstruct chunked token
            const chunks = [];
            let index = 0;
            while (true) {
                const chunkKey = `${name}.${index}`;
                const chunkValue = document.cookie
                    .split(';')
                    .find(c => c.trim().startsWith(chunkKey + '='));
                if (!chunkValue)
                    break;
                chunks.push(chunkValue.split('=')[1].trim());
                index++;
            }
            return chunks.join('');
        }
    }
    return null;
};
const useAuth = (authProvider, config) => {
    const [user, setUser] = useState(null);
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
                }
                else {
                    // Default cookie-based authentication
                    const token = getCookieValue$1(STORAGE_KEYS$1.TOKEN);
                    if (token && !isTokenExpired(token)) {
                        const session = decodeJWT(token);
                        if (session) {
                            const userData = getUserFromSession(session);
                            setUser(userData);
                            setIsAuthenticated(true);
                            // Store user in localStorage for persistence
                            if (typeof window !== 'undefined') {
                                localStorage.setItem(STORAGE_KEYS$1.USER, JSON.stringify(userData));
                            }
                        }
                    }
                    else {
                        // Try to get user from localStorage
                        if (typeof window !== 'undefined') {
                            const storedUser = localStorage.getItem(STORAGE_KEYS$1.USER);
                            if (storedUser) {
                                try {
                                    const userData = JSON.parse(storedUser);
                                    setUser(userData);
                                    // Don't set authenticated without valid token
                                }
                                catch (error) {
                                    console.error('Failed to parse stored user:', error);
                                    localStorage.removeItem(STORAGE_KEYS$1.USER);
                                }
                            }
                        }
                    }
                }
            }
            catch (error) {
                console.error('Failed to initialize auth:', error);
            }
            finally {
                setIsLoading(false);
            }
        };
        initializeAuth();
    }, [authProvider]);
    // Auto-refresh token
    useEffect(() => {
        if (!isAuthenticated || authProvider)
            return;
        const refreshInterval = setInterval(async () => {
            try {
                await refreshToken();
            }
            catch (error) {
                console.error('Token refresh failed:', error);
                logout();
            }
        }, 2 * 60 * 1000); // Refresh every 2 minutes
        return () => clearInterval(refreshInterval);
    }, [isAuthenticated, authProvider]);
    const login = useCallback(async () => {
        try {
            setIsLoading(true);
            if (authProvider) {
                await authProvider.login();
                const userData = authProvider.getUser();
                setUser(userData);
                setIsAuthenticated(true);
            }
            else {
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
                }
                else {
                    throw new Error('Sign-in failed');
                }
            }
        }
        catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
        finally {
            setIsLoading(false);
        }
    }, [authProvider]);
    const logout = useCallback(async () => {
        try {
            setIsLoading(true);
            if (authProvider) {
                await authProvider.logout();
            }
            else {
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
                        localStorage.removeItem(STORAGE_KEYS$1.USER);
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
                localStorage.removeItem(STORAGE_KEYS$1.USER);
            }
        }
        catch (error) {
            console.error('Logout failed:', error);
            throw error;
        }
        finally {
            setIsLoading(false);
        }
    }, [authProvider]);
    const refreshToken = useCallback(async () => {
        try {
            if (authProvider === null || authProvider === void 0 ? void 0 : authProvider.refreshToken) {
                await authProvider.refreshToken();
                const userData = authProvider.getUser();
                setUser(userData);
                return;
            }
            // Default refresh token implementation using configurable endpoint
            const refreshTokenValue = getCookieValue$1(STORAGE_KEYS$1.REFRESH_TOKEN);
            const token = getCookieValue$1(STORAGE_KEYS$1.TOKEN);
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
            document.cookie = `${STORAGE_KEYS$1.TOKEN}=${data.access_token}; Path=/`;
            document.cookie = `${STORAGE_KEYS$1.REFRESH_TOKEN}=${data.refresh_token}; Path=/`;
            // Update user data
            const session = decodeJWT(data.access_token);
            if (session) {
                const userData = getUserFromSession(session);
                setUser(userData);
                if (typeof window !== 'undefined') {
                    localStorage.setItem(STORAGE_KEYS$1.USER, JSON.stringify(userData));
                }
            }
        }
        catch (error) {
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

const STORAGE_KEYS = {
    TOKEN: 'iam-token',
    COMMUNITY: 'iam-community',
    ROLE_ADMIN: 'admin',
};
// Helper function to get cookie value
const getCookieValue = (name) => {
    if (typeof document === 'undefined')
        return null;
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [key, value] = cookie.split('=').map(c => c.trim());
        if (key === name) {
            return decodeURIComponent(value);
        }
        // Handle chunked tokens
        if (key.startsWith(name + '.')) {
            const chunks = [];
            let index = 0;
            while (true) {
                const chunkKey = `${name}.${index}`;
                const chunkValue = document.cookie
                    .split(';')
                    .find(c => c.trim().startsWith(chunkKey + '='));
                if (!chunkValue)
                    break;
                chunks.push(chunkValue.split('=')[1].trim());
                index++;
            }
            return chunks.join('');
        }
    }
    return null;
};
// Helper function to check if user is admin
const checkUserAdminRole = () => {
    var _a, _b;
    try {
        const token = getCookieValue(STORAGE_KEYS.TOKEN);
        if (!token)
            return false;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return ((_b = (_a = payload.realm_access) === null || _a === void 0 ? void 0 : _a.roles) === null || _b === void 0 ? void 0 : _b.includes(STORAGE_KEYS.ROLE_ADMIN)) || false;
    }
    catch (_c) {
        return false;
    }
};
// Helper function to create auth headers
const getAuthHeaders = (authProvider) => {
    const headers = { 'Content-Type': 'application/json' };
    let token = null;
    if (authProvider) {
        token = authProvider.getToken();
    }
    else {
        token = getCookieValue(STORAGE_KEYS.TOKEN);
    }
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return headers;
};
// Helper function to make API request
const apiRequest = async (url, headers) => {
    // Filter out undefined values for fetch compatibility
    const cleanHeaders = {};
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
const usePlugins = (isAuthenticated, config, authProvider) => {
    const [plugins, setPlugins] = useState({
        global: [],
        community: [],
        admin: [],
    });
    const [communityDetails, setCommunityDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    // Memoize config to prevent unnecessary recreations
    const stableConfig = useMemo(() => config, [JSON.stringify(config)]);
    // Use ref to store the current authProvider to avoid dependency issues
    const authProviderRef = useRef(authProvider);
    authProviderRef.current = authProvider;
    const fetchPlugins = useCallback(async () => {
        if (!isAuthenticated) {
            setPlugins({ global: [], community: [], admin: [] });
            setCommunityDetails(null);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const headers = getAuthHeaders(authProviderRef.current);
            let globalPlugins = [];
            let adminPlugins = [];
            let communityPlugins = [];
            let communityData = null;
            // Check if user has a community context
            const communitySlug = typeof window !== 'undefined'
                ? localStorage.getItem(STORAGE_KEYS.COMMUNITY)
                : null;
            // First, always fetch global and admin plugins using the combined endpoint (like original)
            try {
                const pluginsEndpoint = getFullEndpointUrl('plugins', stableConfig);
                console.log('Fetching plugins from:', pluginsEndpoint);
                const allPlugins = await apiRequest(pluginsEndpoint, headers);
                globalPlugins = allPlugins.filter(plugin => plugin.display_section === 'GLOBAL');
                adminPlugins = allPlugins.filter(plugin => plugin.display_section === 'ADMIN');
            }
            catch (pluginsError) {
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
                        apiRequest(tenantPluginsUrl, headers),
                        apiRequest(communityDetailsUrl, headers)
                    ]);
                    if (tenantPluginsResponse.status === 'fulfilled') {
                        communityPlugins = tenantPluginsResponse.value || [];
                    }
                    if (communityDetailsResponse.status === 'fulfilled') {
                        communityData = communityDetailsResponse.value;
                    }
                }
                catch (communityError) {
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
                const isManager = (communityData === null || communityData === void 0 ? void 0 : communityData.user_status) === 'manager';
                return isAdmin || isManager;
            });
            setPlugins({
                global: globalPlugins,
                community: communityPlugins,
                admin: filteredAdminPlugins,
            });
            setCommunityDetails(communityData);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch plugins';
            setError(errorMessage);
            console.error('Plugin fetch error:', err);
            // Reset plugins on error
            setPlugins({ global: [], community: [], admin: [] });
            setCommunityDetails(null);
        }
        finally {
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
        if (!isAuthenticated || typeof window === 'undefined')
            return;
        const handleStorageChange = (event) => {
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

function r(e){var t,f,n="";if("string"==typeof e||"number"==typeof e)n+=e;else if("object"==typeof e)if(Array.isArray(e)){var o=e.length;for(t=0;t<o;t++)e[t]&&(f=r(e[t]))&&(n&&(n+=" "),n+=f);}else for(f in e)e[f]&&(n&&(n+=" "),n+=f);return n}function clsx(){for(var e,t,f=0,n="",o=arguments.length;f<o;f++)(e=arguments[f])&&(t=r(e))&&(n&&(n+=" "),n+=t);return n}

const UserProfile = ({ user, onLogin, onLogout, collapsed = false, loading = false, onNavigate, }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const toggleDropdown = useCallback(() => {
        if (!user)
            return;
        setDropdownOpen(!dropdownOpen);
    }, [user, dropdownOpen]);
    const closeDropdown = useCallback(() => {
        setDropdownOpen(false);
    }, []);
    const handleAccountClick = useCallback((e) => {
        e.preventDefault();
        if (onNavigate) {
            onNavigate('/profile');
        }
        else {
            window.location.href = '/profile';
        }
        closeDropdown();
    }, [onNavigate, closeDropdown]);
    const handleLogoutClick = useCallback((e) => {
        e.preventDefault();
        onLogout();
        closeDropdown();
    }, [onLogout, closeDropdown]);
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current &&
                buttonRef.current &&
                !dropdownRef.current.contains(event.target) &&
                !buttonRef.current.contains(event.target)) {
                closeDropdown();
            }
        };
        const handleEscape = (event) => {
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
        return (jsx("div", { className: "flex-1 min-w-0", children: jsx("button", { type: "button", onClick: onLogin, disabled: loading, className: clsx("w-full inline-flex items-center justify-center text-sm font-semibold rounded-md border border-transparent text-white cursor-pointer transition-colors duration-200 bg-blue-600 hover:bg-blue-700", collapsed ? "px-2 py-2" : "px-4 py-2"), "aria-label": loading ? 'Logging in...' : 'Login', children: collapsed ? (jsxs("svg", { className: "w-4 h-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [jsx("path", { d: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" }), jsx("polyline", { points: "10,17 15,12 10,7" }), jsx("line", { x1: "15", x2: "3", y1: "12", y2: "12" })] })) : (loading ? 'Logging in...' : 'Login') }) }));
    }
    return (jsx("div", { className: "flex-1 min-w-0", children: jsxs("div", { className: "relative", children: [jsxs("button", { ref: buttonRef, type: "button", onClick: toggleDropdown, className: "flex items-center gap-2 p-2 rounded-md bg-transparent border-0 cursor-pointer text-slate-300 transition-all duration-150 min-w-0 w-full hover:bg-slate-700", "aria-expanded": dropdownOpen, "aria-haspopup": "menu", "aria-label": `User menu for ${user.name}`, children: [jsx("div", { className: "flex h-8 w-8 min-w-8 rounded-lg bg-slate-600 text-slate-200 items-center justify-center text-sm font-medium overflow-hidden", children: user.picture ? (jsx("img", { className: "w-full h-full object-cover rounded-lg", src: user.picture, alt: user.name })) : (jsx("span", { children: user.initials })) }), !collapsed && (jsxs("div", { className: clsx('grid flex-1 text-left text-sm leading-tight min-w-0 opacity-100 transition-opacity duration-150', { 'hidden opacity-0': collapsed }), children: [jsx("span", { className: "overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-white", children: user.name }), jsx("span", { className: "overflow-hidden text-ellipsis whitespace-nowrap text-xs text-slate-400", children: user.email || 'No email provided' })] }))] }), jsxs("div", { ref: dropdownRef, className: clsx('fixed top-[55px] left-[30px] min-w-48 bg-slate-700 border border-slate-600 rounded-lg shadow-[0_10px_15px_-3px_rgba(0,0,0,0.3),0_4px_6px_-2px_rgba(0,0,0,0.2)] p-1 opacity-0 invisible -translate-y-2 transition-all duration-150 z-[99999]', {
                        'opacity-100 visible translate-y-0': dropdownOpen,
                        'md:left-[15px]': true // responsive adjustment for mobile
                    }), role: "menu", "aria-hidden": !dropdownOpen, children: [jsxs("a", { href: "/profile", onClick: handleAccountClick, className: "relative flex cursor-pointer items-center rounded-md px-2 py-1.5 text-sm outline-none transition-150 ease-in-out text-slate-300 gap-2 bg-transparent no-underline border-0 w-full hover:bg-slate-600 hover:text-slate-100", role: "menuitem", children: [jsx("svg", { width: "16", height: "16", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }) }), jsx("span", { children: "Account" })] }), jsx("div", { className: "my-1 h-px bg-slate-600" }), jsxs("button", { type: "button", onClick: handleLogoutClick, className: "relative flex cursor-pointer items-center rounded-md px-2 py-1.5 text-sm outline-none transition-150 ease-in-out text-slate-300 gap-2 bg-transparent border-0 w-full hover:bg-slate-600 hover:text-red-400", role: "menuitem", children: [jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [jsx("path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }), jsx("polyline", { points: "16,17 21,12 16,7" }), jsx("line", { x1: "21", x2: "9", y1: "12", y2: "12" })] }), jsx("span", { children: "Log out" })] })] })] }) }));
};

// Helper function to get link properties based on plugin type
const getLinkProperties = (plugin) => {
    const params = {};
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
const trimLastSlash = (url) => {
    return url.endsWith('/') ? url.slice(0, -1) : url;
};
// Helper function to render plugin icon
const PluginIcon = ({ plugin }) => {
    if (plugin.icon_url) {
        // If icon_url is already a full URL, use it directly
        // Otherwise, use relative path (should be configured via environment variables)
        const iconSrc = plugin.icon_url.startsWith('http')
            ? plugin.icon_url
            : `/internal/api${plugin.icon_url}`;
        return (jsx("img", { src: iconSrc, alt: `${plugin.name} icon`, className: "flex-shrink-0 w-4 h-4" }));
    }
    // Default puzzle piece icon
    return (jsx("svg", { className: "flex-shrink-0 w-4 h-4", xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: jsx("path", { d: "M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z" }) }));
};
// Shortcut item component
const ShortcutItem = ({ plugin, shortcut, onNavigate }) => {
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
    const handleClick = useCallback((e) => {
        if (onNavigate) {
            e.preventDefault();
            onNavigate(url);
        }
    }, [onNavigate, url]);
    return (jsx("li", { className: "relative rounded-md", children: jsx("a", { href: url, target: target, onClick: handleClick, className: clsx('flex w-full items-center gap-2 overflow-hidden rounded-md py-1.5 px-2 text-left text-xs text-slate-400 bg-transparent border-0 cursor-pointer transition-all duration-150 min-w-0 no-underline hover:bg-slate-700 hover:text-slate-100', { 'bg-primary text-white': isActive }), children: jsx("span", { className: clsx('overflow-hidden text-ellipsis whitespace-nowrap opacity-100 transition-opacity duration-150 flex-1'), children: shortcut.name }) }) }));
};
// Dropdown component for plugins with shortcuts
const PluginDropdown = ({ plugin, collapsed = false, onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const toggleDropdown = useCallback(() => {
        if (collapsed)
            return; // Don't allow dropdown in collapsed state
        setIsOpen(!isOpen);
    }, [collapsed, isOpen]);
    return (jsxs("li", { className: "relative rounded-md", children: [jsxs("button", { type: "button", onClick: toggleDropdown, className: "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-slate-300 bg-transparent border-0 cursor-pointer transition-all duration-150 min-w-0 hover:bg-slate-700 hover:text-slate-100", "aria-expanded": isOpen, "aria-controls": `dropdown-${plugin.slug}`, children: [jsx(PluginIcon, { plugin: plugin }), jsx("span", { className: clsx('overflow-hidden text-ellipsis whitespace-nowrap opacity-100 transition-opacity duration-150 flex-1', { 'hidden opacity-0': collapsed }), children: plugin.name }), jsx("svg", { className: clsx('w-4 h-4 flex-shrink-0 transition-transform duration-200 opacity-100', { 'opacity-0': collapsed }, { 'rotate-180': isOpen }), viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: jsx("path", { d: "m6 9 6 6 6-6" }) })] }), jsx("div", { id: `dropdown-${plugin.slug}`, className: clsx('overflow-hidden transition-[max-height,opacity] duration-300 ease-out pl-4', {
                    'block opacity-100 max-h-[200px]': isOpen,
                    'hidden max-h-0 opacity-0': !isOpen
                }), children: jsx("ul", { className: "flex w-full min-w-0 flex-col gap-0.5 list-none m-0 p-0 mt-1 border-l-2 border-slate-600 pl-1.5", children: plugin.shortcuts.map((shortcut) => (jsx(ShortcutItem, { plugin: plugin, shortcut: shortcut, onNavigate: onNavigate }, shortcut.id))) }) })] }));
};
// Main SidebarItem component
const SidebarItem = ({ plugin, isActive = false, onClick, collapsed = false, onNavigate, }) => {
    // If plugin has shortcuts, render as dropdown
    if (plugin.shortcuts && plugin.shortcuts.length > 0) {
        return (jsx(PluginDropdown, { plugin: plugin, collapsed: collapsed, onNavigate: onNavigate }));
    }
    // Regular plugin item
    const linkProps = getLinkProperties(plugin);
    const url = linkProps.href || '#';
    const target = linkProps.target || '_self';
    // Check if this plugin is currently active
    const currentlyActive = isActive || (typeof window !== 'undefined'
        ? trimLastSlash(window.location.pathname) === trimLastSlash(url)
        : false);
    const handleClick = useCallback((e) => {
        if (onClick) {
            onClick(plugin);
        }
        if (onNavigate) {
            e.preventDefault();
            onNavigate(url);
        }
    }, [onClick, onNavigate, plugin, url]);
    return (jsx("li", { className: "relative rounded-md", children: jsxs("a", { href: url, target: target, onClick: handleClick, className: clsx('flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-slate-300 bg-transparent border-0 cursor-pointer transition-all duration-150 min-w-0 no-underline hover:bg-slate-700 hover:text-slate-100', { 'bg-primary text-white': currentlyActive }), title: plugin.name, children: [jsx(PluginIcon, { plugin: plugin }), jsx("span", { className: clsx('overflow-hidden text-ellipsis whitespace-nowrap opacity-100 transition-opacity duration-150 flex-1', { 'hidden opacity-0': collapsed }), children: plugin.name })] }) }));
};

// Special items that should be added to specific sections
const SpecialItems = {
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
const SpecialItemIcon = ({ itemId }) => {
    switch (itemId) {
        case 'workspace':
            return (jsxs("svg", { className: "flex-shrink-0 w-4 h-4", xmlns: "http://www.w3.org/2000/svg", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [jsx("path", { d: "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" }), jsx("path", { d: "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" }), jsx("path", { d: "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" }), jsx("path", { d: "M10 6h4" }), jsx("path", { d: "M10 10h4" }), jsx("path", { d: "M10 14h4" }), jsx("path", { d: "M10 18h4" })] }));
        default:
            return null;
    }
};
// Component for special items that renders with custom icons
const SpecialItem = ({ item, onNavigate, collapsed }) => {
    const handleClick = (e) => {
        if (onNavigate) {
            e.preventDefault();
            onNavigate(item.base_path + item.relative_path);
        }
    };
    const isActive = typeof window !== 'undefined'
        ? window.location.pathname === (item.base_path + item.relative_path)
        : false;
    return (jsx("li", { className: "relative rounded-md", children: jsxs("a", { href: item.base_path + item.relative_path, onClick: handleClick, className: clsx('flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-slate-300 bg-transparent border-0 cursor-pointer transition-all duration-150 min-w-0 no-underline hover:bg-slate-700 hover:text-slate-100', { 'bg-primary text-white': isActive }), title: item.name, children: [jsx(SpecialItemIcon, { itemId: item.id }), jsx("span", { className: clsx('overflow-hidden text-ellipsis whitespace-nowrap opacity-100 transition-opacity duration-150 flex-1', { 'hidden opacity-0': collapsed }), children: item.name })] }) }));
};
const SidebarSection = ({ title, plugins, type, collapsed = false, onPluginClick, onNavigate, showSeparator = false, }) => {
    // Don't render empty sections (except for global which has special items)
    const specialItems = SpecialItems[type] || [];
    const hasContent = plugins.length > 0 || specialItems.length > 0;
    if (!hasContent) {
        return null;
    }
    return (jsxs(Fragment, { children: [showSeparator && !collapsed && (jsx("div", { className: "block mx-2 w-auto h-px bg-slate-700 opacity-100 transition-opacity duration-150" })), jsxs("div", { className: "relative flex w-full min-w-0 flex-col p-2", children: [!collapsed && (jsx("div", { className: "flex transition-opacity duration-150 text-slate-400 text-xs font-semibold uppercase tracking-wider h-8 items-center px-2 mb-1 opacity-100", children: title })), jsx("div", { className: "w-full text-sm", children: jsxs("ul", { className: "flex w-full min-w-0 flex-col gap-1 list-none m-0 p-0", children: [specialItems.map((item) => (jsx(SpecialItem, { item: item, onNavigate: onNavigate, collapsed: collapsed }, item.id))), plugins.map((plugin) => (jsx(SidebarItem, { plugin: plugin, onClick: onPluginClick, collapsed: collapsed, onNavigate: onNavigate }, plugin.id)))] }) })] })] }));
};

const LoadingSkeleton = ({ items = 3, showUser = true, collapsed = false, }) => {
    return (jsxs("div", { className: "min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden bg-slate-900 flex", children: [showUser && (jsx("div", { className: "flex flex-col gap-2 p-2 bg-slate-900 border-b border-slate-700 overflow-x-hidden", children: jsxs("div", { className: "relative flex items-center gap-2 w-full min-w-0", children: [jsx("button", { type: "button", className: "flex-shrink-0 rounded-md flex items-center justify-center h-8 w-8 text-slate-300 p-0 bg-transparent border-0 cursor-pointer transition-colors duration-150 hover:text-slate-100", disabled: true, "aria-label": "Toggle sidebar (loading)", children: jsxs("svg", { className: "w-4 h-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [jsx("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }), jsx("path", { d: "M9 3v18" })] }) }), jsx("div", { className: "flex-1 min-w-0", children: jsxs("div", { className: "flex items-center gap-2 p-2 rounded-md bg-transparent border-0 cursor-pointer text-slate-300 transition-all duration-150 min-w-0 w-full hover:bg-slate-700", children: [jsx("div", { className: "w-8 h-8 rounded-lg bg-slate-700 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full" }), !collapsed && (jsxs("div", { className: "grid flex-1 text-left text-sm leading-tight min-w-0 opacity-100 transition-opacity duration-150", children: [jsx("div", { className: "h-3.5 w-16 mb-1 bg-slate-700 rounded relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full" }), jsx("div", { className: "h-3 w-24 bg-slate-700 rounded relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full" })] }))] }) })] }) })), jsxs("div", { className: "relative flex w-full min-w-0 flex-col p-2", children: [!collapsed && (jsx("div", { className: "h-3 w-14 mx-2 mb-3 bg-slate-700 rounded relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full" })), jsx("div", { className: "w-full text-sm", children: jsx("ul", { className: "flex w-full min-w-0 flex-col gap-1 list-none m-0 p-0", children: Array.from({ length: items }, (_, index) => (jsx("li", { className: "relative rounded-md", children: jsxs("div", { className: "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-slate-300 bg-transparent border-0 cursor-pointer transition-all duration-150 min-w-0", children: [jsx("div", { className: "w-4 h-4 rounded-sm bg-slate-700 flex-shrink-0 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full" }), !collapsed && (jsx("div", { className: `h-3.5 bg-slate-700 rounded flex-1 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full ${index === 0 ? 'w-20' : index === 1 ? 'w-16' : 'w-24'}` }))] }) }, `global-${index}`))) }) })] }), !collapsed && (jsx("div", { className: "mx-2 w-auto h-px bg-slate-700 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full" })), jsxs("div", { className: "relative flex w-full min-w-0 flex-col p-2", children: [!collapsed && (jsx("div", { className: "h-3 w-18 mx-2 mb-3 bg-slate-700 rounded relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full" })), jsx("div", { className: "w-full text-sm", children: jsx("ul", { className: "flex w-full min-w-0 flex-col gap-1 list-none m-0 p-0", children: Array.from({ length: Math.max(1, items - 1) }, (_, index) => (jsx("li", { className: "relative rounded-md", children: jsxs("div", { className: "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-slate-300 bg-transparent border-0 cursor-pointer transition-all duration-150 min-w-0", children: [jsx("div", { className: "w-4 h-4 rounded-sm bg-slate-700 flex-shrink-0 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full" }), !collapsed && (jsx("div", { className: `h-3.5 bg-slate-700 rounded flex-1 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full ${index === 0 ? 'w-16' : index === 1 ? 'w-26' : 'w-14'}` }))] }) }, `community-${index}`))) }) })] }), jsx("div", { className: "flex flex-col gap-2 p-2 bg-slate-900 border-t border-slate-700 overflow-x-hidden", children: jsx("div", { className: "relative flex w-full min-w-0 flex-col p-2", children: jsx("div", { className: "relative rounded-md", children: jsxs("div", { className: "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-slate-300 bg-transparent border-0 cursor-pointer transition-all duration-150 min-w-0", children: [jsx("div", { className: "w-4 h-4 rounded-sm bg-slate-700 flex-shrink-0 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full" }), !collapsed && (jsx("div", { className: "h-3.5 w-16 bg-slate-700 rounded flex-1 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1/2 before:h-full before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:animate-shimmer before:-translate-x-full" }))] }) }) }) })] }));
};

// Default configuration
const DEFAULT_CONFIG = {
    collapsed: false,
    theme: 'dark',
    authEnabled: true,
    keyboardShortcuts: true,
};
const Sidebar = ({ config = {}, authProvider, onNavigate, className, children, }) => {
    // Memoize finalConfig to prevent recreation on every render
    const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [
        JSON.stringify(config)
    ]);
    // Initialize hooks
    const { collapsed, toggleSidebar } = useSidebar(finalConfig);
    const { user, isAuthenticated, isLoading: authLoading, login, logout } = useAuth(authProvider, finalConfig);
    const { plugins, isLoading: pluginsLoading, error: pluginsError } = usePlugins(finalConfig.authEnabled ? isAuthenticated : true, finalConfig, authProvider);
    const handlePluginClick = useCallback((plugin) => {
        console.log('Plugin clicked:', plugin);
        // This can be extended with additional plugin click logic
    }, []);
    const handleToggleSidebar = useCallback(() => {
        toggleSidebar();
    }, [toggleSidebar]);
    // Show loading state
    if (authLoading || pluginsLoading) {
        return (jsx("div", { className: clsx('font-sans w-64 min-w-64 max-w-64 bg-slate-900 border-r border-slate-700 min-h-screen h-full top-0 left-0 overflow-x-hidden transition-[width] duration-200 ease-linear relative', { 'w-12 min-w-12 max-w-12': collapsed }, className), children: jsx("div", { className: clsx('transition-[width] duration-200 ease-linear w-64 min-w-64 max-w-64 flex-col top-0 bottom-0 left-0 flex h-full', { 'w-12 min-w-12 max-w-12': collapsed }), children: jsx(LoadingSkeleton, { items: 4, showUser: finalConfig.authEnabled, collapsed: collapsed }) }) }));
    }
    // Show error state
    if (pluginsError) {
        return (jsx("div", { className: clsx('font-sans w-64 min-w-64 max-w-64 bg-slate-900 border-r border-slate-700 min-h-screen h-full top-0 left-0 overflow-x-hidden transition-[width] duration-200 ease-linear relative', { 'w-12 min-w-12 max-w-12': collapsed }, className), children: jsxs("div", { className: clsx('transition-[width] duration-200 ease-linear w-64 min-w-64 max-w-64 flex-col top-0 bottom-0 left-0 flex h-full', { 'w-12 min-w-12 max-w-12': collapsed }), children: [jsx("div", { className: "flex flex-col gap-2 p-2 bg-slate-900 border-b border-slate-700 overflow-x-hidden", children: jsxs("div", { className: "relative flex items-center gap-2 w-full min-w-0", children: [jsx("button", { type: "button", onClick: handleToggleSidebar, className: "flex-shrink-0 rounded-md flex items-center justify-center h-8 w-8 text-slate-300 p-0 bg-transparent border-0 cursor-pointer transition-colors duration-150 hover:text-slate-100", "aria-label": "Toggle sidebar", title: "Toggle sidebar (Ctrl+B)", children: jsxs("svg", { className: "w-4 h-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [jsx("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }), jsx("path", { d: "M9 3v18" })] }) }), finalConfig.authEnabled && (jsx("div", { className: "flex-1 min-w-0", children: jsxs("div", { className: "flex items-center gap-2 p-2 rounded-md bg-transparent", children: [jsx("div", { className: "w-8 h-8 rounded-lg bg-slate-600" }), jsxs("div", { className: "flex flex-col gap-1 flex-1", children: [jsx("div", { className: "h-3.5 w-16 bg-slate-600 rounded" }), jsx("div", { className: "h-3 w-24 bg-slate-600 rounded" })] })] }) }))] }) }), jsxs("div", { className: "min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden bg-slate-900 flex p-4 text-red-400", children: [jsxs("p", { children: ["Failed to load sidebar data: ", pluginsError] }), jsx("button", { onClick: () => window.location.reload(), className: "mt-2 px-2 py-1 bg-red-500 text-white border-0 rounded cursor-pointer hover:bg-red-600 transition-colors", children: "Retry" })] })] }) }));
    }
    // Determine which sections to show based on user permissions
    const showGlobalSection = plugins.global.length > 0;
    const showCommunitySection = plugins.community.length > 0;
    const showAdminSection = plugins.admin.length > 0;
    return (jsx("div", { className: clsx('font-sans w-64 min-w-64 max-w-64 bg-slate-900 border-r border-slate-700 min-h-screen h-full top-0 left-0 overflow-x-hidden transition-[width] duration-200 ease-linear relative', { 'w-12 min-w-12 max-w-12': collapsed }, className), children: jsxs("div", { className: clsx('transition-[width] duration-200 ease-linear w-64 min-w-64 max-w-64 flex-col top-0 bottom-0 left-0 flex h-full', { 'w-12 min-w-12 max-w-12': collapsed }), children: [jsx("div", { className: "flex flex-col gap-2 p-2 bg-slate-900 border-b border-slate-700 overflow-x-hidden", children: jsxs("div", { className: "relative flex items-center gap-2 w-full min-w-0", children: [jsx("button", { type: "button", onClick: handleToggleSidebar, className: "flex-shrink-0 rounded-md flex items-center justify-center h-8 w-8 text-slate-300 p-0 bg-transparent border-0 cursor-pointer transition-colors duration-150 hover:text-slate-100", "aria-label": "Toggle sidebar", title: "Toggle sidebar (Ctrl+B)", children: jsxs("svg", { className: "w-4 h-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [jsx("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }), jsx("path", { d: "M9 3v18" })] }) }), finalConfig.authEnabled && (jsx(UserProfile, { user: user, onLogin: login, onLogout: logout, collapsed: collapsed, loading: authLoading, onNavigate: onNavigate }))] }) }), jsxs("div", { className: "min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden bg-slate-900 flex", children: [showGlobalSection && (jsx(SidebarSection, { title: "GLOBAL", plugins: plugins.global, type: "global", collapsed: collapsed, onPluginClick: handlePluginClick, onNavigate: onNavigate })), showCommunitySection && (jsx(SidebarSection, { title: "Community", plugins: plugins.community, type: "community", collapsed: collapsed, onPluginClick: handlePluginClick, onNavigate: onNavigate, showSeparator: showGlobalSection })), children, !showGlobalSection && !showCommunitySection && !showAdminSection && !children && (jsx("div", { className: "relative flex w-full min-w-0 flex-col p-2", children: jsx("div", { className: "py-8 px-4 text-center text-slate-400", children: finalConfig.authEnabled && !isAuthenticated ? (jsx("p", { children: "Please log in to see available options." })) : (jsx("p", { children: "No plugins available." })) }) }))] }), jsxs("div", { className: "flex flex-col gap-2 p-2 bg-slate-900 border-t border-slate-700 overflow-x-hidden", children: [showAdminSection && (jsx("div", { className: "flex flex-col gap-1", children: plugins.admin.map((plugin) => (jsx("div", { className: "relative rounded-md", children: jsxs("button", { type: "button", onClick: () => handlePluginClick(plugin), className: "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-slate-300 bg-transparent border-0 cursor-pointer transition-all duration-150 min-w-0 hover:bg-slate-700 hover:text-slate-100", title: plugin.name, children: [jsx("svg", { className: "flex-shrink-0 w-4 h-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: jsx("path", { d: "M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z" }) }), jsx("span", { className: clsx('overflow-hidden text-ellipsis whitespace-nowrap opacity-100 transition-opacity duration-150 flex-1', { 'hidden opacity-0': collapsed }), children: plugin.name })] }) }, plugin.id))) })), finalConfig.authEnabled && isAuthenticated && (jsx("div", { className: "relative rounded-md", children: jsxs("button", { type: "button", onClick: logout, className: "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm text-slate-300 bg-transparent border-0 cursor-pointer transition-all duration-150 min-w-0 hover:bg-slate-700 hover:text-slate-100", title: "Log out", children: [jsxs("svg", { className: "flex-shrink-0 w-4 h-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [jsx("path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }), jsx("polyline", { points: "16,17 21,12 16,7" }), jsx("line", { x1: "21", x2: "9", y1: "12", y2: "12" })] }), jsx("span", { className: clsx('overflow-hidden text-ellipsis whitespace-nowrap opacity-100 transition-opacity duration-150 flex-1', { 'hidden opacity-0': collapsed }), children: "Log out" })] }) }))] })] }) }));
};

export { LoadingSkeleton, Sidebar, SidebarItem, SidebarSection, UserProfile, Sidebar as default, getAllEndpoints, getFullEndpointUrl, useAuth, usePlugins, useSidebar, validateEndpointConfig };
//# sourceMappingURL=index.esm.js.map

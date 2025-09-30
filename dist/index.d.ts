import * as react_jsx_runtime from 'react/jsx-runtime';
import React$1 from 'react';

interface Plugin {
    id: string;
    name: string;
    slug: string;
    base_path: string;
    relative_path: string;
    display_section: 'GLOBAL' | 'COMMUNITY' | 'ADMIN';
    type: string;
    plugin_view?: 'EXT_LINK' | 'HTML_IFRAME' | 'TP_IFRAME';
    icon_url?: string;
    shortcuts: Shortcut[];
}
interface Shortcut {
    id: string;
    name: string;
    slug: string;
    url_path: string;
}
interface User {
    name: string;
    email: string;
    picture?: string;
    initials: string;
}
interface AuthSession {
    name?: string;
    email?: string;
    picture?: string;
    realm_access?: {
        roles: string[];
    };
    exp?: number;
    iat?: number;
}
interface SidebarConfig {
    collapsed?: boolean;
    theme?: 'dark' | 'light';
    authEnabled?: boolean;
    keyboardShortcuts?: boolean;
    endpoints?: {
        plugins?: string;
        globalPlugins?: string;
        adminPlugins?: string;
        tenantPlugins?: string;
        communityDetails?: string;
        authRefresh?: string;
        authSignin?: string;
        authLogout?: string;
        authCSRF?: string;
    };
}
interface SidebarContextValue {
    collapsed: boolean;
    toggleSidebar: () => void;
    user: User | null;
    plugins: {
        global: Plugin[];
        community: Plugin[];
        admin: Plugin[];
    };
    loading: boolean;
    config: SidebarConfig;
}
interface ApiHeaders {
    'Content-Type': string;
    Authorization?: string;
    [key: string]: string | undefined;
}
interface AuthProvider {
    login: () => Promise<void>;
    logout: () => Promise<void>;
    getToken: () => string | null;
    getUser: () => User | null;
    isAuthenticated: () => boolean;
    refreshToken?: () => Promise<void>;
}
interface SidebarProps {
    config?: Partial<SidebarConfig>;
    authProvider?: AuthProvider;
    onNavigate?: (path: string) => void;
    className?: string;
    children?: React.ReactNode;
}
interface SidebarItemProps {
    plugin: Plugin;
    isActive?: boolean;
    onClick?: (plugin: Plugin) => void;
    collapsed?: boolean;
}
interface UserProfileProps {
    user: User | null;
    onLogin: () => void;
    onLogout: () => void;
    collapsed?: boolean;
    loading?: boolean;
}
interface PluginDropdownProps {
    plugin: Plugin;
    isOpen: boolean;
    onToggle: () => void;
    collapsed?: boolean;
}
interface LoadingSkeletonProps {
    items?: number;
    showUser?: boolean;
    collapsed?: boolean;
}
type SectionType = 'global' | 'community' | 'admin';
interface SidebarSectionProps {
    title: string;
    plugins: Plugin[];
    type: SectionType;
    collapsed?: boolean;
    onPluginClick?: (plugin: Plugin) => void;
}
interface CommunityDetails {
    slug: string;
    name: string;
    user_status: 'member' | 'manager' | 'admin';
}
interface ApiResponse<T = any> {
    data: T;
    status: number;
    message?: string;
}

declare const Sidebar: ({ config, authProvider, onNavigate, className, children, }: SidebarProps) => react_jsx_runtime.JSX.Element;

declare const UserProfile: ({ user, onLogin, onLogout, collapsed, loading, onNavigate, }: UserProfileProps & {
    onNavigate?: (path: string) => void;
}) => react_jsx_runtime.JSX.Element;

declare const SidebarSection: React$1.FC<SidebarSectionProps & {
    onNavigate?: (path: string) => void;
    showSeparator?: boolean;
}>;

declare const SidebarItem: React$1.FC<SidebarItemProps & {
    onNavigate?: (path: string) => void;
}>;

declare const LoadingSkeleton: ({ items, showUser, collapsed, }: LoadingSkeletonProps) => react_jsx_runtime.JSX.Element;

interface UseSidebarReturn {
    collapsed: boolean;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
}
declare const useSidebar: (config?: Partial<SidebarConfig>) => UseSidebarReturn;

interface UseAuthReturn {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
}
declare const useAuth: (authProvider?: AuthProvider, config?: Partial<SidebarConfig>) => UseAuthReturn;

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
declare const usePlugins: (isAuthenticated: boolean, config?: Partial<SidebarConfig>, authProvider?: AuthProvider) => UsePluginsReturn;

declare const DEFAULT_ENDPOINTS: {
    plugins: string;
    globalPlugins: string;
    adminPlugins: string;
    tenantPlugins: string;
    communityDetails: string;
    authRefresh: string;
    authSignin: string;
    authLogout: string;
    authCSRF: string;
};
/**
 * Get the full URL for an endpoint
 */
declare function getFullEndpointUrl(endpointName: keyof typeof DEFAULT_ENDPOINTS, config?: SidebarConfig, params?: Record<string, string>): string;
/**
 * Get all configured endpoints for debugging
 */
declare function getAllEndpoints(config?: SidebarConfig): Record<string, string>;
/**
 * Validate that all required endpoints are configured
 */
declare function validateEndpointConfig(config?: SidebarConfig): {
    isValid: boolean;
    missing: string[];
    configured: string[];
};

export { LoadingSkeleton, Sidebar, SidebarItem, SidebarSection, UserProfile, Sidebar as default, getAllEndpoints, getFullEndpointUrl, useAuth, usePlugins, useSidebar, validateEndpointConfig };
export type { ApiHeaders, ApiResponse, AuthProvider, AuthSession, CommunityDetails, LoadingSkeletonProps, Plugin, PluginDropdownProps, SectionType, Shortcut, SidebarConfig, SidebarContextValue, SidebarItemProps, SidebarProps, SidebarSectionProps, User, UserProfileProps };

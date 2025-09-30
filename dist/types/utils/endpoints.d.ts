import { SidebarConfig } from '../types';
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
export declare function getFullEndpointUrl(endpointName: keyof typeof DEFAULT_ENDPOINTS, config?: SidebarConfig, params?: Record<string, string>): string;
/**
 * Get all configured endpoints for debugging
 */
export declare function getAllEndpoints(config?: SidebarConfig): Record<string, string>;
/**
 * Check if we're in standalone mode
 */
export declare function isStandaloneMode(): boolean;
/**
 * Check if user is an admin based on token
 */
export declare function isUserAdmin(): boolean;
/**
 * Check if user is a manager for current community
 */
export declare function isUserManager(): boolean;
/**
 * Validate that all required endpoints are configured
 */
export declare function validateEndpointConfig(config?: SidebarConfig): {
    isValid: boolean;
    missing: string[];
    configured: string[];
};
export {};
//# sourceMappingURL=endpoints.d.ts.map
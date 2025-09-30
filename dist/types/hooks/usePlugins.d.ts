import { Plugin, CommunityDetails, SidebarConfig, AuthProvider } from '../types';
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
export declare const usePlugins: (isAuthenticated: boolean, config?: Partial<SidebarConfig>, authProvider?: AuthProvider) => UsePluginsReturn;
export {};
//# sourceMappingURL=usePlugins.d.ts.map
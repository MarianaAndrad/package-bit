import { AuthProvider, User, SidebarConfig } from '../types';
interface UseAuthReturn {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
}
export declare const useAuth: (authProvider?: AuthProvider, config?: Partial<SidebarConfig>) => UseAuthReturn;
export {};
//# sourceMappingURL=useAuth.d.ts.map
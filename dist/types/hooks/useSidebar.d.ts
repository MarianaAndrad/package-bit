import { SidebarConfig } from '../types';
interface UseSidebarReturn {
    collapsed: boolean;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
}
export declare const useSidebar: (config?: Partial<SidebarConfig>) => UseSidebarReturn;
export {};
//# sourceMappingURL=useSidebar.d.ts.map
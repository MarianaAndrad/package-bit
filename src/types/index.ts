export interface Plugin {
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

export interface Shortcut {
  id: string;
  name: string;
  slug: string;
  url_path: string;
}

export interface User {
  name: string;
  email: string;
  picture?: string;
  initials: string;
}

export interface AuthSession {
  name?: string;
  email?: string;
  picture?: string;
  realm_access?: {
    roles: string[];
  };
  exp?: number;
  iat?: number;
}

export interface SidebarConfig {
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

export interface SidebarContextValue {
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

export interface ApiHeaders {
  'Content-Type': string;
  Authorization?: string;
  [key: string]: string | undefined;
}

export interface AuthProvider {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => string | null;
  getUser: () => User | null;
  isAuthenticated: () => boolean;
  refreshToken?: () => Promise<void>;
}

export interface SidebarProps {
  config?: Partial<SidebarConfig>;
  authProvider?: AuthProvider;
  onNavigate?: (path: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export interface SidebarItemProps {
  plugin: Plugin;
  isActive?: boolean;
  onClick?: (plugin: Plugin) => void;
  collapsed?: boolean;
}

export interface UserProfileProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  collapsed?: boolean;
  loading?: boolean;
}

export interface PluginDropdownProps {
  plugin: Plugin;
  isOpen: boolean;
  onToggle: () => void;
  collapsed?: boolean;
}

export interface LoadingSkeletonProps {
  items?: number;
  showUser?: boolean;
  collapsed?: boolean;
}

export type SectionType = 'global' | 'community' | 'admin';

export interface SidebarSectionProps {
  title: string;
  plugins: Plugin[];
  type: SectionType;
  collapsed?: boolean;
  onPluginClick?: (plugin: Plugin) => void;
}

export interface CommunityDetails {
  slug: string;
  name: string;
  user_status: 'member' | 'manager' | 'admin';
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}
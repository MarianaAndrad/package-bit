// Main component
export { Sidebar, default as default } from './components/Sidebar';

// Sub-components
export { UserProfile } from './components/UserProfile';
export { SidebarSection } from './components/SidebarSection';
export { SidebarItem } from './components/SidebarItem';
export { LoadingSkeleton } from './components/LoadingSkeleton';

// Hooks
export { useSidebar } from './hooks/useSidebar';
export { useAuth } from './hooks/useAuth';
export { usePlugins } from './hooks/usePlugins';

// Utilities
export { getFullEndpointUrl, getAllEndpoints, validateEndpointConfig } from './utils/endpoints';

// Types
export type {
  Plugin,
  Shortcut,
  User,
  AuthSession,
  SidebarConfig,
  SidebarContextValue,
  ApiHeaders,
  AuthProvider,
  SidebarProps,
  SidebarItemProps,
  UserProfileProps,
  PluginDropdownProps,
  LoadingSkeletonProps,
  SectionType,
  SidebarSectionProps,
  CommunityDetails,
  ApiResponse,
} from './types';

// Styles (will be automatically included when components are imported)
import './styles/tailwind.css';
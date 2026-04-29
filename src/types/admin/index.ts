// Admin Types
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  userType: 'patient' | 'provider';
  status: 'active' | 'suspended' | 'pending' | 'inactive';
  verified: boolean;
  registrationDate: string;
  lastActive: string;
  country: string;
  city?: string;
  specialty?: string;
  institution?: string;
  questionsCount: number;
  riskScore: 'low' | 'medium' | 'high';
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  questionsToday: number;
  suspendedUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  patients: number;
  providers: number;
  avgQuestionsPerUserDay: number;
  avgQuestionsPerUserWeek: number;
}

export interface SystemStatus {
  isHealthy: boolean;
  alerts: Array<{ level: string; message: string; timestamp: string; }>;
  metrics: {
    requestsPerMinute: number;
    errorRate: number;
    responseTime: number;
    uptime: number;
  };
}

export interface UserFilters {
  search?: string;
  status?: string;
  userType?: string;
  country?: string;
}

// State management types
export type AdminState = {
  activeView: 'dashboard' | 'users' | 'analytics' | 'reports';
  users: AdminUser[];
  stats: AdminStats | null;
  systemStatus: SystemStatus | null;
  filters: UserFilters;
  selectedUsers: Set<string>;
  ui: {
    loading: boolean;
    error: string | null;
    isMobileOpen: boolean;
    showQuickActions: boolean;
    isDarkMode: boolean;
    bulkActionsVisible: boolean;
  };
  growthData: {
    period: '7d' | '30d' | '90d' | '1y';
    grouping: 'day' | 'week' | 'month';
    userType: 'all' | 'patients' | 'providers';
  };
};

export type AdminAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_VIEW'; payload: AdminState['activeView'] }
  | { type: 'SET_USERS'; payload: AdminUser[] }
  | { type: 'SET_STATS'; payload: AdminStats }
  | { type: 'SET_SYSTEM_STATUS'; payload: SystemStatus }
  | { type: 'SET_FILTERS'; payload: UserFilters }
  | { type: 'TOGGLE_USER_SELECTION'; payload: string }
  | { type: 'SELECT_ALL_USERS'; payload: boolean }
  | { type: 'TOGGLE_MOBILE_SIDEBAR' }
  | { type: 'TOGGLE_QUICK_ACTIONS' }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'UPDATE_GROWTH_SETTINGS'; payload: Partial<AdminState['growthData']> };

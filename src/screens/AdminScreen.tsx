import React, { useState, useEffect, useMemo, useReducer, useCallback } from 'react';

// Enhanced Chart components for separate user and question tracking
const UserGrowthChart: React.FC<{
  data: Array<{ date: string; patients: number; providers: number; total: number; }>;
  period: string;
  onPeriodChange: (period: string) => void;
  customDateRange?: { start: string; end: string };
  onCustomDateChange?: (start: string, end: string) => void;
}> = ({ data, period, onPeriodChange, customDateRange, onCustomDateChange }) => {
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [startDate, setStartDate] = useState(customDateRange?.start || '');
  const [endDate, setEndDate] = useState(customDateRange?.end || '');

  const maxTotal = Math.max(...data.map(d => d.total));

  const handleCustomDateApply = () => {
    if (startDate && endDate && onCustomDateChange) {
      onCustomDateChange(startDate, endDate);
      setShowCustomDate(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
          <p className="text-sm text-gray-600">New user registrations by type</p>
        </div>
        <div className="flex space-x-2">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {['7d', '30d', '90d', '1y'].map((p) => (
              <button
                key={p}
                onClick={() => onPeriodChange(p)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-[#D97941] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCustomDate(!showCustomDate)}
            className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-200"
          >
            Custom
          </button>
        </div>
      </div>

      {showCustomDate && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#D97941]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#D97941]"
              />
            </div>
            <div className="pt-5">
              <button
                onClick={handleCustomDateApply}
                className="px-4 py-2 bg-[#D97941] text-white rounded-md text-sm font-medium hover:bg-[#C97A20]"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chart Area */}
      <div className="relative h-64 mb-4">
        <div className="absolute inset-0 flex items-end justify-between space-x-1">
          {data.map((point, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              {/* Stacked Bar Chart */}
              <div className="w-full flex flex-col items-center relative">
                {/* Providers (top) */}
                <div
                  className="w-3/4 bg-blue-500 rounded-t-sm"
                  style={{ height: `${(point.providers / maxTotal) * 200}px` }}
                  title={`${point.providers} providers`}
                />
                {/* Patients (bottom) */}
                <div
                  className="w-3/4 bg-[#D97941]"
                  style={{ height: `${(point.patients / maxTotal) * 200}px` }}
                  title={`${point.patients} patients`}
                />
                <div className="text-xs text-gray-500 mt-1 font-medium">{point.total}</div>
              </div>
              
              {/* Date Label */}
              <div className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-left">
                {new Date(point.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-[#D97941] rounded"></div>
          <span className="text-sm text-gray-600">New Patients</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-600">New Providers</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {data.reduce((sum, d) => sum + d.total, 0)}
          </div>
          <div className="text-xs text-gray-600">Total New Users</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-[#D97941]">
            {data.reduce((sum, d) => sum + d.patients, 0)}
          </div>
          <div className="text-xs text-gray-600">New Patients</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-500">
            {data.reduce((sum, d) => sum + d.providers, 0)}
          </div>
          <div className="text-xs text-gray-600">New Providers</div>
        </div>
      </div>
    </div>
  );
};

const QuestionActivityChart: React.FC<{
  data: Array<{ date: string; patientQuestions: number; providerQuestions: number; total: number; }>;
  period: string;
}> = ({ data, period }) => {
  const maxTotal = Math.max(...data.map(d => d.total));

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Question Activity</h3>
          <p className="text-sm text-gray-600">Daily questions asked by user type</p>
        </div>
        <div className="text-sm text-gray-500">
          Period: {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : period === '90d' ? '90 Days' : '1 Year'}
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative h-64 mb-4">
        <div className="absolute inset-0 flex items-end justify-between space-x-1">
          {data.map((point, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              {/* Stacked Bar Chart */}
              <div className="w-full flex flex-col items-center relative">
                {/* Provider Questions (top) */}
                <div
                  className="w-3/4 bg-blue-400 rounded-t-sm"
                  style={{ height: `${(point.providerQuestions / maxTotal) * 200}px` }}
                  title={`${point.providerQuestions} provider questions`}
                />
                {/* Patient Questions (bottom) */}
                <div
                  className="w-3/4 bg-orange-400"
                  style={{ height: `${(point.patientQuestions / maxTotal) * 200}px` }}
                  title={`${point.patientQuestions} patient questions`}
                />
                <div className="text-xs text-gray-500 mt-1 font-medium">{point.total}</div>
              </div>
              
              {/* Date Label */}
              <div className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-left">
                {new Date(point.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-400 rounded"></div>
          <span className="text-sm text-gray-600">Patient Questions</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-400 rounded"></div>
          <span className="text-sm text-gray-600">Provider Questions</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {data.reduce((sum, d) => sum + d.total, 0)}
          </div>
          <div className="text-xs text-gray-600">Total Questions</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-orange-500">
            {data.reduce((sum, d) => sum + d.patientQuestions, 0)}
          </div>
          <div className="text-xs text-gray-600">Patient Questions</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-500">
            {data.reduce((sum, d) => sum + d.providerQuestions, 0)}
          </div>
          <div className="text-xs text-gray-600">Provider Questions</div>
        </div>
      </div>
    </div>
  );
};

// User Action Modal for suspend/activate
const UserActionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser | null;
  action: 'suspend' | 'activate';
  onConfirm: (userId: string, action: 'suspend' | 'activate', reason?: string) => void;
}> = ({ isOpen, onClose, user, action, onConfirm }) => {
  const [reason, setReason] = useState('');

  if (!isOpen || !user) return null;

  const handleConfirm = () => {
    onConfirm(user.id, action, reason);
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {action === 'suspend' ? 'Suspend User' : 'Activate User'}
        </h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Are you sure you want to {action} <strong>{user.name}</strong>?
          </p>
          <div className="text-xs text-gray-500">
            Email: {user.email}<br/>
            Type: {user.userType}<br/>
            Current Status: {user.status}
          </div>
        </div>

        {action === 'suspend' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for suspension (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D97941] text-sm"
              rows={3}
              placeholder="Enter reason for suspension..."
            />
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium ${
              action === 'suspend'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {action === 'suspend' ? 'Suspend User' : 'Activate User'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Types
interface AdminUser {
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

interface AdminStats {
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

interface SystemStatus {
  isHealthy: boolean;
  alerts: Array<{ level: string; message: string; timestamp: string; }>;
  metrics: {
    requestsPerMinute: number;
    errorRate: number;
    responseTime: number;
    uptime: number;
  };
}

interface UserFilters {
  search?: string;
  status?: string;
  userType?: string;
  country?: string;
}

// State management
type AdminState = {
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

type AdminAction = 
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

const initialState: AdminState = {
  activeView: 'dashboard',
  users: [],
  stats: null,
  systemStatus: null,
  filters: {},
  selectedUsers: new Set(),
  ui: {
    loading: true,
    error: null,
    isMobileOpen: false,
    showQuickActions: false,
    isDarkMode: false,
    bulkActionsVisible: false,
  },
  growthData: {
    period: '7d',
    grouping: 'day',
    userType: 'all',
  },
};

function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, ui: { ...state.ui, loading: action.payload } };
    case 'SET_ERROR':
      return { ...state, ui: { ...state.ui, error: action.payload } };
    case 'SET_VIEW':
      return { ...state, activeView: action.payload };
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'SET_SYSTEM_STATUS':
      return { ...state, systemStatus: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'TOGGLE_USER_SELECTION':
      const newSelectedUsers = new Set(state.selectedUsers);
      if (newSelectedUsers.has(action.payload)) {
        newSelectedUsers.delete(action.payload);
      } else {
        newSelectedUsers.add(action.payload);
      }
      return {
        ...state,
        selectedUsers: newSelectedUsers,
        ui: { ...state.ui, bulkActionsVisible: newSelectedUsers.size > 0 }
      };
    case 'SELECT_ALL_USERS':
      return {
        ...state,
        selectedUsers: action.payload ? new Set(state.users.map(u => u.id)) : new Set(),
        ui: { ...state.ui, bulkActionsVisible: action.payload }
      };
    case 'TOGGLE_MOBILE_SIDEBAR':
      return { ...state, ui: { ...state.ui, isMobileOpen: !state.ui.isMobileOpen } };
    case 'TOGGLE_QUICK_ACTIONS':
      return { ...state, ui: { ...state.ui, showQuickActions: !state.ui.showQuickActions } };
    case 'TOGGLE_DARK_MODE':
      return { ...state, ui: { ...state.ui, isDarkMode: !state.ui.isDarkMode } };
    case 'UPDATE_GROWTH_SETTINGS':
      return { ...state, growthData: { ...state.growthData, ...action.payload } };
    default:
      return state;
  }
}

// Mock data and services
const mockUsers: AdminUser[] = [
  {
    id: '1001',
    name: 'John Doe',
    email: 'john.doe@email.com',
    userType: 'patient',
    status: 'active',
    verified: true,
    registrationDate: '2025-08-15',
    lastActive: '2 hours ago',
    country: 'United States',
    city: 'California',
    questionsCount: 23,
    riskScore: 'low',
  },
  {
    id: '1002',
    name: 'Dr. Sarah Smith',
    email: 'dr.smith@hospital.com',
    userType: 'provider',
    status: 'active',
    verified: true,
    registrationDate: '2025-08-10',
    lastActive: '1 day ago',
    country: 'Canada',
    city: 'Toronto, ON',
    specialty: 'Cardiology',
    institution: 'Toronto General Hospital',
    questionsCount: 156,
    riskScore: 'low',
  },
  {
    id: '1003',
    name: 'Mike Brown',
    email: 'mike.b@gmail.com',
    userType: 'patient',
    status: 'suspended',
    verified: false,
    registrationDate: '2025-08-12',
    lastActive: '3 days ago',
    country: 'United Kingdom',
    city: 'London',
    questionsCount: 8,
    riskScore: 'medium',
  },
  {
    id: '1004',
    name: 'Dr. Lisa Wang',
    email: 'l.wang@clinic.com',
    userType: 'provider',
    status: 'active',
    verified: true,
    registrationDate: '2025-08-08',
    lastActive: '4 hours ago',
    country: 'Australia',
    city: 'Sydney, NSW',
    specialty: 'Dermatology',
    institution: 'Sydney Skin Clinic',
    questionsCount: 89,
    riskScore: 'low',
  },
  {
    id: '1005',
    name: 'Anna Johnson',
    email: 'anna.j@example.com',
    userType: 'patient',
    status: 'inactive',
    verified: false,
    registrationDate: '2025-07-28',
    lastActive: '21 days ago',
    country: 'United States',
    city: 'New York, NY',
    questionsCount: 2,
    riskScore: 'medium',
  },
  {
    id: '1006',
    name: 'Dr. Robert Garcia',
    email: 'r.garcia@medcenter.com',
    userType: 'provider',
    status: 'active',
    verified: true,
    registrationDate: '2025-08-05',
    lastActive: '6 hours ago',
    country: 'United States',
    city: 'Texas',
    specialty: 'Pediatrics',
    institution: 'Children\'s Medical Center',
    questionsCount: 203,
    riskScore: 'low',
  },
];

const mockStats: AdminStats = {
  totalUsers: 2847,
  activeUsers: 1234,
  questionsToday: 456,
  suspendedUsers: 23,
  verifiedUsers: 2624,
  unverifiedUsers: 223,
  patients: 2340,
  providers: 507,
  avgQuestionsPerUserDay: 2.3,
  avgQuestionsPerUserWeek: 16.1,
};

const mockSystemStatus: SystemStatus = {
  isHealthy: true,
  alerts: [
    { level: 'warning', message: 'High API response times detected', timestamp: '2025-08-28T10:30:00Z' },
    { level: 'info', message: 'Scheduled maintenance completed', timestamp: '2025-08-28T09:00:00Z' },
  ],
  metrics: {
    requestsPerMinute: 847,
    errorRate: 2.1,
    responseTime: 245,
    uptime: 99.8,
  },
};

// Components
const MetricCard: React.FC<{
  title: string;
  value: string;
  trend?: { direction: 'up' | 'down'; percentage: string; };
  icon: React.ReactNode;
}> = ({ title, value, trend, icon }) => (
  <div className="bg-white rounded-lg shadow-sm border-l-4 border-[#D97941]">
    <div className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-xl font-semibold text-gray-900">{value}</div>
          <div className="text-sm text-gray-600">{title}</div>
          {trend && (
            <div className={`text-xs mt-1 ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.direction === 'up' ? '↗' : '↘'} {trend.percentage}
            </div>
          )}
        </div>
        <div className="w-8 h-8 rounded bg-[#D97941]/10 flex items-center justify-center text-[#D97941]">
          {icon}
        </div>
      </div>
    </div>
  </div>
);

const AlertsPanel: React.FC<{ alerts: SystemStatus['alerts'] }> = ({ alerts }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
    <div className="flex items-center mb-3">
      <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
      </svg>
      <h3 className="text-md font-medium text-red-900">System Alerts</h3>
      <span className="ml-auto bg-red-600 text-white px-2 py-1 rounded-full text-xs">
        {alerts.length}
      </span>
    </div>
    <div className="space-y-2">
      {alerts.slice(0, 3).map((alert, index) => (
        <div key={index} className="bg-white rounded-md p-3 border-l-3 border-red-400">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-1 ${
                alert.level === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {alert.level.toUpperCase()}
              </span>
              <p className="text-sm text-gray-700">{alert.message}</p>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const UserAvatar: React.FC<{ user: AdminUser }> = ({ user }) => {
  const getBgColor = (userType: string, status: string) => {
    if (status === 'suspended') return 'bg-red-500';
    if (status === 'inactive') return 'bg-gray-400';
    if (userType === 'provider') return 'bg-blue-500';
    return 'bg-[#D97941]';
  };

  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm ${
      getBgColor(user.userType, user.status)
    }`}>
      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
    </div>
  );
};

const StatusBadge: React.FC<{ status: string; type?: 'status' | 'verification' | 'userType' }> = ({ 
  status, 
  type = 'status' 
}) => {
  const getStatusStyles = () => {
    if (type === 'verification') {
      return status === 'verified' 
        ? 'bg-green-100 text-green-800 border-green-200'
        : 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    
    if (type === 'userType') {
      return status === 'provider'
        ? 'bg-blue-100 text-blue-800 border-blue-200'
        : 'bg-purple-100 text-purple-800 border-purple-200';
    }

    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyles()}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const BulkActionsBar: React.FC<{
  selectedCount: number;
  onSendEmails: () => void;
  onSuspend: () => void;
  onActivate: () => void;
  onExport: () => void;
  onCancel: () => void;
}> = ({ selectedCount, onSendEmails, onSuspend, onActivate, onExport, onCancel }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 px-6 py-4 z-50">
      <div className="flex items-center space-x-4">
        <span className="font-medium text-gray-900">
          {selectedCount} users selected
        </span>
        <div className="flex space-x-2">
          <button
            onClick={onSendEmails}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Send Email
          </button>
          <button
            onClick={onSuspend}
            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
          >
            Suspend
          </button>
          <button
            onClick={onActivate}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
          >
            Activate
          </button>
          <button
            onClick={onExport}
            className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
          >
            Export
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Mock growth data generator
const generateGrowthData = (period: string, customRange?: { start: string; end: string }) => {
  const data = [];
  const now = new Date();
  let days = 7;
  
  if (customRange) {
    const start = new Date(customRange.start);
    const end = new Date(customRange.end);
    days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    switch (period) {
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      case '1y': days = 365; break;
      default: days = 7;
    }
  }
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate realistic growth data with some randomness
    const baseUsers = Math.floor(Math.random() * 50) + 10;
    const baseQuestions = Math.floor(Math.random() * 200) + 50;
    
    data.push({
      date: date.toISOString().split('T')[0],
      users: baseUsers + Math.floor(Math.random() * 20),
      questions: baseQuestions + Math.floor(Math.random() * 100)
    });
  }
  
  return data;
};

// Main Component
export const AdminScreen: React.FC<{ onReturnToHome: () => void }> = ({ onReturnToHome }) => {
  const [state, dispatch] = useReducer(adminReducer, initialState);
  const [userActionModal, setUserActionModal] = useState<{
    isOpen: boolean;
    user: AdminUser | null;
    action: 'suspend' | 'activate';
  }>({ isOpen: false, user: null, action: 'suspend' });
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string } | undefined>();
  
  // Generate growth data based on current period
  const growthData = useMemo(() => {
    return generateGrowthData(state.growthData.period, customDateRange);
  }, [state.growthData.period, customDateRange]);

  // Simulate data loading
  useEffect(() => {
    const loadData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        dispatch({ type: 'SET_USERS', payload: mockUsers });
        dispatch({ type: 'SET_STATS', payload: mockStats });
        dispatch({ type: 'SET_SYSTEM_STATUS', payload: mockSystemStatus });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load admin data' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadData();
  }, []);

  // Filtered users based on current filters
  const filteredUsers = useMemo(() => {
    return state.users.filter(user => {
      if (state.filters.search && 
          !user.name.toLowerCase().includes(state.filters.search.toLowerCase()) &&
          !user.email.toLowerCase().includes(state.filters.search.toLowerCase())) {
        return false;
      }
      if (state.filters.status && user.status !== state.filters.status) return false;
      if (state.filters.userType && user.userType !== state.filters.userType) return false;
      if (state.filters.country && user.country !== state.filters.country) return false;
      return true;
    });
  }, [state.users, state.filters]);

  const handleUserAction = useCallback((action: string, userId: string) => {
    // Implement actual user actions here
  }, []);

  const handleBulkAction = useCallback((action: string) => {
    dispatch({ type: 'SELECT_ALL_USERS', payload: false });
  }, [state.selectedUsers.size]);

  // Sidebar component
  const Sidebar = () => (
    <div className={`${state.ui.isMobileOpen ? 'fixed inset-0 z-50' : 'hidden'} lg:block lg:relative`}>
      {state.ui.isMobileOpen && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 lg:hidden"
          onClick={() => dispatch({ type: 'TOGGLE_MOBILE_SIDEBAR' })}
        />
      )}
      <div className="relative bg-white w-64 h-full shadow-lg border-r border-gray-200 p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <img src="/leny.webp" alt="Leny" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Leny Admin</h1>
              <p className="text-xs text-gray-600">Healthcare Platform</p>
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_MOBILE_SIDEBAR' })}
            className="lg:hidden p-1 rounded hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <nav className="space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m8 5 4-4 4 4"/>
              </svg>
            ) },
            { id: 'users', label: 'Users', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
              </svg>
            ) },
            { id: 'analytics', label: 'Analytics', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            ) },
            { id: 'reports', label: 'Reports', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            ) },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => dispatch({ type: 'SET_VIEW', payload: item.id as AdminState['activeView'] })}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left text-sm transition-colors ${
                state.activeView === item.id
                  ? 'bg-[#D97941] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={onReturnToHome}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors text-sm mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            <span>Return to Home</span>
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={state.ui.isDarkMode ? 
                "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" :
                "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              }/>
            </svg>
            <span>{state.ui.isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Handle user actions (suspend/activate)
  const handleUserStatusAction = useCallback((userId: string, action: 'suspend' | 'activate', reason?: string) => {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;

    // Update user status in state
    const updatedUsers = state.users.map(u => 
      u.id === userId 
        ? { ...u, status: action === 'suspend' ? 'suspended' as const : 'active' as const }
        : u
    );
    
    dispatch({ type: 'SET_USERS', payload: updatedUsers });
    
    // In a real app, you would make an API call here
    
    // Show success message (you could add a toast notification here)
    alert(`User ${user.name} has been ${action === 'suspend' ? 'suspended' : 'activated'} successfully.`);
  }, [state.users]);

  // Handle custom date range change
  const handleCustomDateChange = useCallback((start: string, end: string) => {
    setCustomDateRange({ start, end });
  }, []);

  // Handle growth period change
  const handleGrowthPeriodChange = useCallback((period: string) => {
    dispatch({ 
      type: 'UPDATE_GROWTH_SETTINGS', 
      payload: { period: period as AdminState['growthData']['period'] }
    });
    setCustomDateRange(undefined); // Clear custom range when switching to preset
  }, []);

  // Dashboard View
  const DashboardView = () => (
    <div className="space-y-8">
      {/* System Status Alerts */}
      {state.systemStatus?.alerts && state.systemStatus.alerts.length > 0 && (
        <AlertsPanel alerts={state.systemStatus.alerts} />
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={state.stats?.totalUsers.toLocaleString() || '0'}
          trend={{ direction: 'up', percentage: '+12.3%' }}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          }
        />
        <MetricCard
          title="Active Users"
          value={state.stats?.activeUsers.toLocaleString() || '0'}
          trend={{ direction: 'up', percentage: '+8.7%' }}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
        />
        <MetricCard
          title="Questions Today"
          value={state.stats?.questionsToday.toLocaleString() || '0'}
          trend={{ direction: 'down', percentage: '-3.2%' }}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
        />
        <MetricCard
          title="System Health"
          value={`${state.systemStatus?.metrics?.uptime || 0}%`}
          trend={{ direction: 'up', percentage: '+0.1%' }}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
        />
      </div>

      {/* System Performance */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {state.systemStatus?.metrics?.requestsPerMinute || 0}
            </div>
            <div className="text-sm text-gray-600">Requests/min</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {state.systemStatus?.metrics?.errorRate || 0}%
            </div>
            <div className="text-sm text-gray-600">Error Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {state.systemStatus?.metrics?.responseTime || 0}ms
            </div>
            <div className="text-sm text-gray-600">Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {state.systemStatus?.metrics?.uptime || 0}%
            </div>
            <div className="text-sm text-gray-600">Uptime</div>
          </div>
        </div>
      </div>

      {/* Enhanced Growth Charts - Separate User Growth and Question Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserGrowthChart
          data={growthData.map(d => ({
            date: d.date as string,
            patients: Math.floor(d.users * 0.82), // 82% patients based on mock data
            providers: Math.floor(d.users * 0.18), // 18% providers
            total: d.users
          }))}
          period={state.growthData.period}
          onPeriodChange={handleGrowthPeriodChange}
          customDateRange={customDateRange}
          onCustomDateChange={handleCustomDateChange}
        />
        <QuestionActivityChart
          data={growthData.map(d => ({
            date: d.date as string,
            patientQuestions: Math.floor(d.questions * 0.65), // 65% patient questions
            providerQuestions: Math.floor(d.questions * 0.35), // 35% provider questions
            total: d.questions
          }))}
          period={state.growthData.period}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-[#D97941] rounded-lg p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button className="bg-white bg-opacity-20 rounded-md p-3 hover:bg-opacity-30 transition-colors text-center">
            <div className="text-sm">Send Emails</div>
          </button>
          <button className="bg-white bg-opacity-20 rounded-md p-3 hover:bg-opacity-30 transition-colors text-center">
            <div className="text-sm">Generate Report</div>
          </button>
          <button className="bg-white bg-opacity-20 rounded-md p-3 hover:bg-opacity-30 transition-colors text-center">
            <div className="text-sm">Backup System</div>
          </button>
          <button className="bg-white bg-opacity-20 rounded-md p-3 hover:bg-opacity-30 transition-colors text-center">
            <div className="text-sm">Settings</div>
          </button>
        </div>
      </div>
    </div>
  );

  // Users View
  const UsersView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-600">
            {filteredUsers.length} of {state.users.length} users
          </p>
        </div>
        <button className="px-4 py-2 bg-[#D97941] text-white rounded-lg hover:bg-[#C97A20]">
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search users..."
            value={state.filters.search || ''}
            onChange={(e) => dispatch({ 
              type: 'SET_FILTERS', 
              payload: { ...state.filters, search: e.target.value }
            })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D97941]"
          />
          <select
            value={state.filters.status || ''}
            onChange={(e) => dispatch({ 
              type: 'SET_FILTERS', 
              payload: { ...state.filters, status: e.target.value || undefined }
            })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D97941]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={state.filters.userType || ''}
            onChange={(e) => dispatch({ 
              type: 'SET_FILTERS', 
              payload: { ...state.filters, userType: e.target.value || undefined }
            })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D97941]"
          >
            <option value="">All Types</option>
            <option value="patient">Patients</option>
            <option value="provider">Providers</option>
          </select>
          <button
            onClick={() => dispatch({ type: 'SET_FILTERS', payload: {} })}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <input
                  type="checkbox"
                  checked={state.selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                  onChange={(e) => dispatch({ type: 'SELECT_ALL_USERS', payload: e.target.checked })}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Questions</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={state.selectedUsers.has(user.id)}
                    onChange={() => dispatch({ type: 'TOGGLE_USER_SELECTION', payload: user.id })}
                    className="rounded border-gray-300 text-[#D97941] focus:ring-[#D97941]"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <UserAvatar user={user} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-600">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={user.userType} type="userType" />
                  {user.specialty && (
                    <div className="text-xs text-gray-500 mt-1">{user.specialty}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={user.status} />
                  <div className="text-xs text-gray-500 mt-1">{user.lastActive}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900">{user.country}</div>
                  {user.city && <div className="text-xs text-gray-500">{user.city}</div>}
                </td>
                <td className="px-4 py-3 text-center font-medium">
                  {user.questionsCount}
                </td>
                <td className="px-4 py-3">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleUserAction('view', user.id)}
                      className="p-1 text-gray-600 hover:text-[#D97941] rounded"
                      title="View Profile"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 616 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => handleUserAction('message', user.id)}
                      className="p-1 text-gray-600 hover:text-blue-600 rounded"
                      title="Send Message"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                    </button>
                    {user.status === 'active' ? (
                      <button
                        onClick={() => setUserActionModal({ isOpen: true, user, action: 'suspend' })}
                        className="p-1 text-gray-600 hover:text-red-600 rounded"
                        title="Suspend User"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"/>
                        </svg>
                      </button>
                    ) : user.status === 'suspended' ? (
                      <button
                        onClick={() => setUserActionModal({ isOpen: true, user, action: 'activate' })}
                        className="p-1 text-gray-600 hover:text-green-600 rounded"
                        title="Activate User"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Analytics View with Enhanced Data
  const AnalyticsView = () => {
    const [analyticsTab, setAnalyticsTab] = useState<'overview' | 'demographics' | 'engagement' | 'geographic'>('overview');
    
    // Calculate detailed analytics from user data
    const analyticsData = useMemo(() => {
      const providers = state.users.filter(u => u.userType === 'provider');
      const patients = state.users.filter(u => u.userType === 'patient');
      
      // Country distribution
      const countryStats = state.users.reduce((acc, user) => {
        acc[user.country] = (acc[user.country] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Institution analysis (providers only)
      const institutionStats = providers
        .filter(p => p.institution)
        .reduce((acc, provider) => {
          acc[provider.institution!] = (acc[provider.institution!] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      
      // Specialty distribution
      const specialtyStats = providers
        .filter(p => p.specialty)
        .reduce((acc, provider) => {
          acc[provider.specialty!] = (acc[provider.specialty!] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      
      // Activity analysis
      const totalQuestions = state.users.reduce((sum, user) => sum + user.questionsCount, 0);
      const providerQuestions = providers.reduce((sum, user) => sum + user.questionsCount, 0);
      const patientQuestions = patients.reduce((sum, user) => sum + user.questionsCount, 0);
      
      // Status distribution
      const statusStats = state.users.reduce((acc, user) => {
        acc[user.status] = (acc[user.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        userTypes: {
          providers: providers.length,
          patients: patients.length,
          providerPercentage: ((providers.length / state.users.length) * 100).toFixed(1),
          patientPercentage: ((patients.length / state.users.length) * 100).toFixed(1)
        },
        countries: Object.entries(countryStats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([country, count]) => ({ country, count, percentage: ((count / state.users.length) * 100).toFixed(1) })),
        institutions: Object.entries(institutionStats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 8)
          .map(([institution, count]) => ({ institution, count })),
        specialties: Object.entries(specialtyStats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 8)
          .map(([specialty, count]) => ({ specialty, count })),
        activity: {
          totalQuestions,
          providerQuestions,
          patientQuestions,
          avgQuestionsPerProvider: providers.length ? (providerQuestions / providers.length).toFixed(1) : '0',
          avgQuestionsPerPatient: patients.length ? (patientQuestions / patients.length).toFixed(1) : '0'
        },
        status: Object.entries(statusStats).map(([status, count]) => ({ status, count })),
        verification: {
          verified: state.users.filter(u => u.verified).length,
          unverified: state.users.filter(u => !u.verified).length
        }
      };
    }, [state.users]);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Advanced Analytics</h2>
            <p className="text-sm text-gray-600">Comprehensive insights into user demographics and platform usage</p>
          </div>
          <div className="flex space-x-2">
            <select
              value={state.growthData.period}
              onChange={(e) => dispatch({ 
                type: 'UPDATE_GROWTH_SETTINGS', 
                payload: { period: e.target.value as AdminState['growthData']['period'] }
              })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D97941] text-sm"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
            <button className="px-4 py-2 bg-[#D97941] text-white rounded-lg hover:bg-[#C97A20] text-sm">
              Export Report
            </button>
          </div>
        </div>

        {/* Enhanced Growth Charts - Separate User Growth and Question Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UserGrowthChart
            data={growthData.map(d => ({
              date: d.date as string,
              patients: Math.floor(d.users * 0.82), // 82% patients based on mock data
              providers: Math.floor(d.users * 0.18), // 18% providers
              total: d.users
            }))}
            period={state.growthData.period}
            onPeriodChange={handleGrowthPeriodChange}
            customDateRange={customDateRange}
            onCustomDateChange={handleCustomDateChange}
          />
          <QuestionActivityChart
            data={growthData.map(d => ({
              date: d.date as string,
              patientQuestions: Math.floor(d.questions * 0.65), // 65% patient questions
              providerQuestions: Math.floor(d.questions * 0.35), // 35% provider questions
              total: d.questions
            }))}
            period={state.growthData.period}
          />
        </div>

        {/* Analytics Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'demographics', label: 'Demographics', icon: '👥' },
                { id: 'engagement', label: 'Engagement', icon: '📈' },
                { id: 'geographic', label: 'Geographic', icon: '🌍' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAnalyticsTab(tab.id as typeof analyticsTab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    analyticsTab === tab.id
                      ? 'border-[#D97941] text-[#D97941]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {analyticsTab === 'overview' && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Total Users"
                    value={state.users.length.toLocaleString()}
                    trend={{ direction: 'up', percentage: '+12.3%' }}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                    }
                  />
                  <MetricCard
                    title="Total Questions"
                    value={analyticsData.activity.totalQuestions.toLocaleString()}
                    trend={{ direction: 'up', percentage: '+8.7%' }}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    }
                  />
                  <MetricCard
                    title="Countries"
                    value={analyticsData.countries.length.toString()}
                    trend={{ direction: 'up', percentage: '+2.1%' }}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    }
                  />
                  <MetricCard
                    title="Institutions"
                    value={analyticsData.institutions.length.toString()}
                    trend={{ direction: 'up', percentage: '+5.4%' }}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                      </svg>
                    }
                  />
                </div>

                {/* User Type Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">User Type Distribution</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                          <span className="text-sm font-medium">Healthcare Providers</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">{analyticsData.userTypes.providers}</div>
                          <div className="text-xs text-gray-500">{analyticsData.userTypes.providerPercentage}%</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-[#D97941] rounded"></div>
                          <span className="text-sm font-medium">Patients</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">{analyticsData.userTypes.patients}</div>
                          <div className="text-xs text-gray-500">{analyticsData.userTypes.patientPercentage}%</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Question Activity</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg per Provider</span>
                        <span className="font-semibold">{analyticsData.activity.avgQuestionsPerProvider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg per Patient</span>
                        <span className="font-semibold">{analyticsData.activity.avgQuestionsPerPatient}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Provider Questions</span>
                        <span className="font-semibold">{analyticsData.activity.providerQuestions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Patient Questions</span>
                        <span className="font-semibold">{analyticsData.activity.patientQuestions.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {analyticsTab === 'demographics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Provider Specialties */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Provider Specialties</h3>
                    <div className="space-y-3">
                      {analyticsData.specialties.map((specialty, index) => (
                        <div key={specialty.specialty} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
                            <span className="text-sm">{specialty.specialty}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${(specialty.count / (analyticsData.specialties[0]?.count || 1)) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold w-8">{specialty.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* User Status */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">User Status Distribution</h3>
                    <div className="space-y-3">
                      {analyticsData.status.map((status) => (
                        <div key={status.status} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              status.status === 'active' ? 'bg-green-500' :
                              status.status === 'suspended' ? 'bg-red-500' :
                              status.status === 'inactive' ? 'bg-gray-400' : 'bg-yellow-500'
                            }`}></div>
                            <span className="text-sm capitalize">{status.status}</span>
                          </div>
                          <span className="text-sm font-semibold">{status.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Verification Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-md font-semibold text-gray-900 mb-4">Email Verification Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-700">{analyticsData.verification.verified}</div>
                      <div className="text-sm text-green-600">Verified Users</div>
                      <div className="text-xs text-green-500 mt-1">
                        {((analyticsData.verification.verified / state.users.length) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-700">{analyticsData.verification.unverified}</div>
                      <div className="text-sm text-yellow-600">Unverified Users</div>
                      <div className="text-xs text-yellow-500 mt-1">
                        {((analyticsData.verification.unverified / state.users.length) * 100).toFixed(1)}% of total
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {analyticsTab === 'engagement' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Avg Questions/Provider"
                    value={analyticsData.activity.avgQuestionsPerProvider}
                    trend={{ direction: 'up', percentage: '+15.2%' }}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                    }
                  />
                  <MetricCard
                    title="Avg Questions/Patient"
                    value={analyticsData.activity.avgQuestionsPerPatient}
                    trend={{ direction: 'up', percentage: '+8.3%' }}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                      </svg>
                    }
                  />
                  <MetricCard
                    title="Provider Activity"
                    value={`${((analyticsData.activity.providerQuestions / analyticsData.activity.totalQuestions) * 100).toFixed(1)}%`}
                    trend={{ direction: 'up', percentage: '+3.7%' }}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                      </svg>
                    }
                  />
                  <MetricCard
                    title="Patient Activity"
                    value={`${((analyticsData.activity.patientQuestions / analyticsData.activity.totalQuestions) * 100).toFixed(1)}%`}
                    trend={{ direction: 'down', percentage: '-1.2%' }}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                      </svg>
                    }
                  />
                </div>

                {/* Top Active Users by Type */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Most Active Providers</h3>
                    <div className="space-y-3">
                      {state.users
                        .filter(u => u.userType === 'provider')
                        .sort((a, b) => b.questionsCount - a.questionsCount)
                        .slice(0, 5)
                        .map((user, index) => (
                          <div key={user.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
                              <div>
                                <div className="text-sm font-medium">{user.name}</div>
                                <div className="text-xs text-gray-500">{user.specialty || 'General'}</div>
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-blue-600">{user.questionsCount}</div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Most Active Patients</h3>
                    <div className="space-y-3">
                      {state.users
                        .filter(u => u.userType === 'patient')
                        .sort((a, b) => b.questionsCount - a.questionsCount)
                        .slice(0, 5)
                        .map((user, index) => (
                          <div key={user.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
                              <div>
                                <div className="text-sm font-medium">{user.name}</div>
                                <div className="text-xs text-gray-500">{user.country}</div>
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-[#D97941]">{user.questionsCount}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {analyticsTab === 'geographic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Countries */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Users by Country</h3>
                    <div className="space-y-3">
                      {analyticsData.countries.map((country, index) => (
                        <div key={country.country} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
                            <span className="text-sm">{country.country}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-[#D97941] h-2 rounded-full"
                                style={{ width: `${country.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold w-8">{country.count}</span>
                            <span className="text-xs text-gray-500 w-10">{country.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Institutions */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Top Healthcare Institutions</h3>
                    <div className="space-y-3">
                      {analyticsData.institutions.map((institution, index) => (
                        <div key={institution.institution} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-sm font-medium text-gray-500">#{index + 1}</div>
                            <span className="text-sm">{institution.institution}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${(institution.count / (analyticsData.institutions[0]?.count || 1)) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold w-8">{institution.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Provider vs Patient Geographic Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Provider Distribution by Country</h3>
                    <div className="space-y-3">
                      {Object.entries(
                        state.users
                          .filter(u => u.userType === 'provider')
                          .reduce((acc, user) => {
                            acc[user.country] = (acc[user.country] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                      )
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([country, count]) => (
                          <div key={country} className="flex items-center justify-between">
                            <span className="text-sm">{country}</span>
                            <span className="text-sm font-semibold text-blue-600">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Patient Distribution by Country</h3>
                    <div className="space-y-3">
                      {Object.entries(
                        state.users
                          .filter(u => u.userType === 'patient')
                          .reduce((acc, user) => {
                            acc[user.country] = (acc[user.country] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                      )
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([country, count]) => (
                          <div key={country} className="flex items-center justify-between">
                            <span className="text-sm">{country}</span>
                            <span className="text-sm font-semibold text-[#D97941]">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Reports View
  const ReportsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Reports & Analytics</h2>
          <p className="text-sm text-gray-600">Generate comprehensive system reports</p>
        </div>
        <button className="px-4 py-2 bg-[#D97941] text-white rounded-lg hover:bg-[#C97A20]">
          Schedule Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'User Activity Report', description: 'Comprehensive user behavior analysis', icon: '👥' },
          { title: 'Financial Report', description: 'Revenue and cost analysis', icon: '💰' },
          { title: 'System Health Report', description: 'Performance and uptime metrics', icon: '⚡' },
          { title: 'Security Analysis', description: 'Security vulnerabilities and threats', icon: '🔒' },
          { title: 'Compliance Audit', description: 'HIPAA compliance status', icon: '📋' },
          { title: 'Custom Report Builder', description: 'Build custom reports with selected metrics', icon: '🔧' },
        ].map((report, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="text-2xl mr-3">{report.icon}</div>
              <div>
                <h3 className="font-semibold text-gray-900">{report.title}</h3>
                <p className="text-sm text-gray-600">{report.description}</p>
              </div>
            </div>
            <button className="w-full px-4 py-2 bg-[#D97941] text-white rounded-lg hover:bg-[#C97A20]">
              Generate Report
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  if (state.ui.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D97941] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (state.ui.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-gray-900 font-semibold mb-2">Something went wrong</p>
          <p className="text-gray-600 mb-4">{state.ui.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#D97941] text-white rounded-lg hover:bg-[#C97A20]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${state.ui.isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 lg:ml-0">
          {/* Mobile Header */}
          <div className="lg:hidden bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => dispatch({ type: 'TOGGLE_MOBILE_SIDEBAR' })}
                className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                ☰
              </button>
              <h1 className="text-lg font-semibold text-gray-900 capitalize">
                {state.activeView}
              </h1>
              <div className="w-10"></div>
            </div>
          </div>

          {/* Main Content */}
          <main className="p-6 lg:p-8">
            {state.activeView === 'dashboard' && <DashboardView />}
            {state.activeView === 'users' && <UsersView />}
            {state.activeView === 'analytics' && <AnalyticsView />}
            {state.activeView === 'reports' && <ReportsView />}
          </main>
        </div>
      </div>

      {/* User Action Modal */}
      <UserActionModal
        isOpen={userActionModal.isOpen}
        onClose={() => setUserActionModal({ isOpen: false, user: null, action: 'suspend' })}
        user={userActionModal.user}
        action={userActionModal.action}
        onConfirm={handleUserStatusAction}
      />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={state.selectedUsers.size}
        onSendEmails={() => handleBulkAction('sendEmails')}
        onSuspend={() => handleBulkAction('suspend')}
        onActivate={() => handleBulkAction('activate')}
        onExport={() => handleBulkAction('export')}
        onCancel={() => dispatch({ type: 'SELECT_ALL_USERS', payload: false })}
      />
    </div>
  );
};

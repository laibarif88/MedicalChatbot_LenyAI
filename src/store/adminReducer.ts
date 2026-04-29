import { AdminState, AdminAction } from '../types/admin';

export const initialState: AdminState = {
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

export function adminReducer(state: AdminState, action: AdminAction): AdminState {
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

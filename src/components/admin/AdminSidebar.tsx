import React from 'react';
import { AdminState } from '../../types/admin';

interface AdminSidebarProps {
  activeView: AdminState['activeView'];
  isMobileOpen: boolean;
  isDarkMode: boolean;
  onViewChange: (view: AdminState['activeView']) => void;
  onToggleMobile: () => void;
  onToggleDarkMode: () => void;
  onReturnToHome: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeView,
  isMobileOpen,
  isDarkMode,
  onViewChange,
  onToggleMobile,
  onToggleDarkMode,
  onReturnToHome,
}) => {
  const navItems = [
    { 
      id: 'dashboard' as const, 
      label: 'Dashboard', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m8 5 4-4 4 4"/>
        </svg>
      ) 
    },
    { 
      id: 'users' as const, 
      label: 'Users', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
        </svg>
      ) 
    },
    { 
      id: 'analytics' as const, 
      label: 'Analytics', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
      ) 
    },
    { 
      id: 'reports' as const, 
      label: 'Reports', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      ) 
    },
  ];

  return (
    <div className={`${isMobileOpen ? 'fixed inset-0 z-50' : 'hidden'} lg:block lg:relative`}>
      {isMobileOpen && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggleMobile}
        />
      )}
      <div className="relative bg-white w-64 h-full shadow-lg border-r border-gray-200 p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#D97941] rounded-lg flex items-center justify-center text-white font-bold text-sm">
              L
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Leny Admin</h1>
              <p className="text-xs text-gray-600">Healthcare Platform</p>
            </div>
          </div>
          <button
            onClick={onToggleMobile}
            className="lg:hidden p-1 rounded hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left text-sm transition-colors ${
                activeView === item.id
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
            onClick={onToggleDarkMode}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isDarkMode ? 
                "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" :
                "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              }/>
            </svg>
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

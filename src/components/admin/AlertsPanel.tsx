import React from 'react';
import { SystemStatus } from '../../types/admin';

interface AlertsPanelProps {
  alerts: SystemStatus['alerts'];
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {
  return (
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
};

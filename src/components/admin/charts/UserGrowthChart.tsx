import React, { useState } from 'react';

interface UserGrowthChartProps {
  data: Array<{ 
    date: string; 
    patients: number; 
    providers: number; 
    total: number; 
  }>;
  period: string;
  onPeriodChange: (period: string) => void;
  customDateRange?: { start: string; end: string };
  onCustomDateChange?: (start: string, end: string) => void;
}

export const UserGrowthChart: React.FC<UserGrowthChartProps> = ({ 
  data, 
  period, 
  onPeriodChange, 
  customDateRange, 
  onCustomDateChange 
}) => {
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
              <div className="w-full flex flex-col items-center relative">
                <div
                  className="w-3/4 bg-blue-500 rounded-t-sm"
                  style={{ height: `${(point.providers / maxTotal) * 200}px` }}
                  title={`${point.providers} providers`}
                />
                <div
                  className="w-3/4 bg-[#D97941]"
                  style={{ height: `${(point.patients / maxTotal) * 200}px` }}
                  title={`${point.patients} patients`}
                />
                <div className="text-xs text-gray-500 mt-1 font-medium">{point.total}</div>
              </div>
              
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

import React from 'react';

interface ChartData {
  label: string;
  value: number;
  percentage?: number;
}

interface AnalyticsChartProps {
  title: string;
  data: ChartData[];
  type?: 'bar' | 'pie' | 'line';
  color?: string;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ 
  title, 
  data, 
  type = 'bar',
  color = '#D97941' 
}) => {
  const maxValue = Math.max(...data.map(d => d.value));

  if (type === 'bar') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-medium text-gray-900">{item.value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: color 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'pie') {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const colors = ['#D97941', '#E89F6D', '#F4C5A0', '#FDE8D3', '#FFE5CC'];
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center mb-4">
          <div className="relative w-48 h-48">
            {/* Simple pie chart representation using CSS */}
            <div className="absolute inset-0 rounded-full border-8 border-gray-100"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{total}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">{item.value}</span>
                <span className="text-xs text-gray-500 ml-1">
                  ({Math.round((item.value / total) * 100)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Line chart (simplified representation)
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="relative h-48">
        <div className="absolute inset-0 flex items-end justify-between gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-gradient-to-t from-orange-500 to-orange-300 rounded-t"
                style={{ 
                  height: `${(item.value / maxValue) * 100}%`,
                  minHeight: '4px'
                }}
              />
              <div className="text-xs text-gray-500 mt-2 text-center">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between mt-4 text-xs text-gray-500">
        <span>Min: {Math.min(...data.map(d => d.value))}</span>
        <span>Max: {maxValue}</span>
      </div>
    </div>
  );
};

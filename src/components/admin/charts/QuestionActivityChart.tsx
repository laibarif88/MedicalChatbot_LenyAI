import React from 'react';

interface QuestionActivityChartProps {
  data: Array<{ 
    date: string; 
    patientQuestions: number; 
    providerQuestions: number; 
    total: number; 
  }>;
  period: string;
}

export const QuestionActivityChart: React.FC<QuestionActivityChartProps> = ({ data, period }) => {
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
              <div className="w-full flex flex-col items-center relative">
                <div
                  className="w-3/4 bg-blue-400 rounded-t-sm"
                  style={{ height: `${(point.providerQuestions / maxTotal) * 200}px` }}
                  title={`${point.providerQuestions} provider questions`}
                />
                <div
                  className="w-3/4 bg-orange-400"
                  style={{ height: `${(point.patientQuestions / maxTotal) * 200}px` }}
                  title={`${point.patientQuestions} patient questions`}
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

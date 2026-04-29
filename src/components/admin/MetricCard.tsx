import React from 'react';

interface MetricCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon }) => {
    return (
        <div className="bg-white p-6 rounded-lg rounded-tr-sm shadow-md flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-[#FFF4EC] text-[#D97941] flex items-center justify-center">
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-3xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
};

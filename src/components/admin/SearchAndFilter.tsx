import React, { useState } from 'react';
import { SearchIcon } from '../chat/Icons';
import { UserFilters } from '../../services/adminService';

interface SearchAndFilterProps {
    onFiltersChange: (filters: UserFilters) => void;
    onClearFilters: () => void;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
    onFiltersChange,
    onClearFilters
}) => {
    const [filters, setFilters] = useState<UserFilters>({});
    const [isExpanded, setIsExpanded] = useState(false);

    const handleFilterChange = (key: keyof UserFilters, value: string) => {
        const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
        setFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const handleClearAll = () => {
        setFilters({});
        onClearFilters();
    };

    const hasActiveFilters = Object.values(filters).some(value =>
        value !== undefined && value !== '' && value !== 'all'
    );

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            {/* Search Bar */}
            <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 relative">
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={filters.search || ''}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D97941] focus:border-transparent"
                    />
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Filters {hasActiveFilters && '●'}
                </button>
                {hasActiveFilters && (
                    <button
                        onClick={handleClearAll}
                        className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Expanded Filters */}
            {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            User Type
                        </label>
                        <select
                            value={filters.userType || 'all'}
                            onChange={(e) => handleFilterChange('userType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D97941] focus:border-transparent"
                        >
                            <option value="all">All Types</option>
                            <option value="patient">Patients</option>
                            <option value="provider">Providers</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={filters.status || 'all'}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D97941] focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Suspended">Suspended</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Signup From
                        </label>
                        <input
                            type="date"
                            value={filters.signupDateFrom || ''}
                            onChange={(e) => handleFilterChange('signupDateFrom', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D97941] focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Signup To
                        </label>
                        <input
                            type="date"
                            value={filters.signupDateTo || ''}
                            onChange={(e) => handleFilterChange('signupDateTo', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D97941] focus:border-transparent"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

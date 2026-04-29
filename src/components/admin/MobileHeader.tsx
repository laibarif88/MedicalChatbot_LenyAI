import React from 'react';
import { MenuIcon } from '../chat/Icons';

interface MobileHeaderProps {
    onMenuClick: () => void;
    title: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick, title }) => {
    return (
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
            <button
                onClick={onMenuClick}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Open menu"
            >
                <MenuIcon />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            <div className="w-10"></div> {/* Spacer for centering */}
        </div>
    );
};

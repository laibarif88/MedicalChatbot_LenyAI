import React from 'react';
import { AdminUser } from '../../types/admin';

interface UserAvatarProps {
  user: AdminUser;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user }) => {
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

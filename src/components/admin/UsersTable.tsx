import React, { useState } from 'react';
import { AdminUser } from '../../types';
import { MoreVertIcon, UserIcon, BriefcaseIcon } from '../chat/Icons';
import { adminService } from '../../services/adminService';

export const UsersTable: React.FC<{ users: AdminUser[]; onUserUpdate?: () => void }> = ({ users, onUserUpdate }) => {
    const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

    const getStatusBadge = (status: 'Active' | 'Suspended') => {
        return status === 'Active'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800';
    };

    const getUserTypeIcon = (userType: 'patient' | 'provider') => {
        return userType === 'provider' ? <BriefcaseIcon /> : <UserIcon />;
    };

    const handleSuspendActivate = async (user: AdminUser) => {
        setLoadingUserId(user.id);
        try {
            const result = user.status === 'Active' 
                ? await adminService.suspendUser(user.id)
                : await adminService.activateUser(user.id);
            
            if (result.success) {
                // Refresh the users list
                if (onUserUpdate) {
                    onUserUpdate();
                }
            } else {
                alert(result.message);
            }
        } catch (error) {
            
            alert('Failed to update user status');
        } finally {
            setLoadingUserId(null);
        }
    };

    // Mobile card view
    const MobileUserCard: React.FC<{ user: AdminUser }> = ({ user }) => (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        {getUserTypeIcon(user.userType)}
                        <h3 className="font-semibold text-gray-900">{user.fullName}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(user.status)}`}>
                            {user.status}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{user.email}</p>
                    {user.country && (
                        <p className="text-sm text-gray-600 mb-1">📍 {user.country}</p>
                    )}
                    {user.userType === 'provider' && user.institution && (
                        <p className="text-sm text-gray-600 mb-1">🏥 {user.institution}</p>
                    )}
                    {user.userType === 'provider' && user.specialty && (
                        <p className="text-sm text-gray-600 mb-1">👨‍⚕️ {user.specialty}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500 capitalize">{user.userType}</span>
                        <span className="text-xs text-gray-500">{user.signupDate}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <button
                            onClick={() => handleSuspendActivate(user)}
                            disabled={loadingUserId === user.id}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                user.status === 'Active'
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                            } ${loadingUserId === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loadingUserId === user.id ? 'Processing...' : (user.status === 'Active' ? 'Suspend' : 'Activate')}
                        </button>
                    </div>
                </div>
                <button className="p-2 rounded-full hover:bg-gray-100 ml-2">
                    <MoreVertIcon />
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile View */}
            <div className="md:hidden">
                {users.map(user => (
                    <MobileUserCard key={user.id} user={user} />
                ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Name</th>
                            <th scope="col" className="px-6 py-3">User Type</th>
                            <th scope="col" className="px-6 py-3">Country</th>
                            <th scope="col" className="px-6 py-3">Institution</th>
                            <th scope="col" className="px-6 py-3">Signup Date</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900">
                                    <div className="font-semibold">{user.fullName}</div>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                </th>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1">
                                        {getUserTypeIcon(user.userType)}
                                        <span className="capitalize">{user.userType}</span>
                                    </div>
                                    {user.userType === 'provider' && user.specialty && (
                                        <div className="text-xs text-gray-500 mt-1">{user.specialty}</div>
                                    )}
                                </td>
                                <td className="px-6 py-4">{user.country || '-'}</td>
                                <td className="px-6 py-4">{user.institution || '-'}</td>
                                <td className="px-6 py-4">{user.signupDate}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(user.status)}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleSuspendActivate(user)}
                                            disabled={loadingUserId === user.id}
                                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                                user.status === 'Active'
                                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                            } ${loadingUserId === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {loadingUserId === user.id ? '...' : (user.status === 'Active' ? 'Suspend' : 'Activate')}
                                        </button>
                                        <button className="p-1 rounded-full hover:bg-gray-200">
                                            <MoreVertIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

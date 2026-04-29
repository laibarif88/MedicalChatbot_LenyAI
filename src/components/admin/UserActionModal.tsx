import React, { useState } from 'react';
import { AdminUser } from '../../types/admin';

interface UserActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser | null;
  action: 'suspend' | 'activate';
  onConfirm: (userId: string, action: 'suspend' | 'activate', reason?: string) => void;
}

export const UserActionModal: React.FC<UserActionModalProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  action, 
  onConfirm 
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen || !user) return null;

  const handleConfirm = () => {
    onConfirm(user.id, action, reason);
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {action === 'suspend' ? 'Suspend User' : 'Activate User'}
        </h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Are you sure you want to {action} <strong>{user.name}</strong>?
          </p>
          <div className="text-xs text-gray-500">
            Email: {user.email}<br/>
            Type: {user.userType}<br/>
            Current Status: {user.status}
          </div>
        </div>

        {action === 'suspend' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for suspension (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#D97941] text-sm"
              rows={3}
              placeholder="Enter reason for suspension..."
            />
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium ${
              action === 'suspend'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {action === 'suspend' ? 'Suspend User' : 'Activate User'}
          </button>
        </div>
      </div>
    </div>
  );
};

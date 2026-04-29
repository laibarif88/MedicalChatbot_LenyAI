import React, { useState, useEffect } from 'react';
import { invitationService, PendingInvitation } from '../../services/invitationService';
import { showErrorToast, getErrorMessage } from '../../utils/errorHandling';

interface InvitationManagerProps {
  conversationId: string;
  conversationTitle: string;
  onClose: () => void;
}

const InvitationManager: React.FC<InvitationManagerProps> = ({
  conversationId,
  conversationTitle,
  onClose
}) => {
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPendingInvitations = () => {
      try {
        const invitations = invitationService.getPendingInvitationsForConversation(conversationId);
        setPendingInvitations(invitations);
      } catch (error) {
        
        showErrorToast({
          message: 'Failed to load pending invitations',
          retry: loadPendingInvitations
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPendingInvitations();
  }, [conversationId]);

  const handleCancelInvitation = (token: string) => {
    try {
      const success = invitationService.cancelInvitation(token);
      if (success) {
        setPendingInvitations(prev => 
          prev.filter(inv => inv.invitationToken !== token)
        );
      } else {
        showErrorToast({ message: 'Failed to cancel invitation' });
      }
    } catch (error) {
      
      const errorMessage = getErrorMessage(error);
      showErrorToast({
        message: `Failed to cancel invitation: ${errorMessage}`,
        retry: () => handleCancelInvitation(token)
      });
    }
  };

  const handleCopyInvitationLink = (token: string) => {
    const link = invitationService.generateInvitationLink(token);
    navigator.clipboard.writeText(link).then(() => {
      // You could show a toast notification here
    }).catch(err => {
      
      showErrorToast({ message: 'Failed to copy invitation link' });
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center text-gray-600 mt-4">Loading invitations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Manage Invitations</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">{conversationTitle}</p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {pendingInvitations.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending invitations</h3>
              <p className="mt-1 text-sm text-gray-500">All invitations for this conversation have been resolved.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{invitation.inviteeContact}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                          {invitation.status}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        <p>Invited via {invitation.invitationType}</p>
                        <p>Sent: {formatDate(invitation.createdAt)}</p>
                        <p>Expires: {formatDate(invitation.expiresAt)}</p>
                        {invitation.joinedAt && (
                          <p>Joined: {formatDate(invitation.joinedAt)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {invitation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleCopyInvitationLink(invitation.invitationToken)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy Link
                          </button>
                          <button
                            onClick={() => handleCancelInvitation(invitation.invitationToken)}
                            className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvitationManager;
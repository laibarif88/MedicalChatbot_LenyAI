import React, { useState, useEffect } from 'react';
import { invitationService } from '../../services/invitationService';
import { createChatService } from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';
import { showErrorToast, getErrorMessage } from '../../utils/errorHandling';
import { Participant } from '../../types';

interface JoinConversationPageProps {
  onJoinSuccess: (conversationId: string) => void;
  onNavigateToHome: () => void;
  invitationToken?: string;
}

const JoinConversationPage: React.FC<JoinConversationPageProps> = ({ 
  onJoinSuccess, 
  onNavigateToHome,
  invitationToken
}) => {
  const { user, startAsGuest } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [participantName, setParticipantName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = invitationToken;

  useEffect(() => {
    const loadInvitation = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setIsLoading(false);
        return;
      }

      try {
        const invitationData = invitationService.getInvitationByToken(token);
        
        if (!invitationData) {
          setError('Invitation not found or expired');
          return;
        }

        if (invitationData.status === 'accepted') {
          setError('This invitation has already been used');
          return;
        }

        if (invitationData.status === 'expired') {
          setError('This invitation has expired');
          return;
        }

        setInvitation(invitationData);
      } catch (error) {
        
        setError('Failed to load invitation');
      } finally {
        setIsLoading(false);
      }
    };

    loadInvitation();
  }, [token]);

  const handleJoinConversation = async () => {
    if (!invitation || !participantName.trim()) return;

    setIsJoining(true);
    try {
      // Start as guest if not authenticated
      let currentUser = user;
      if (!currentUser) {
        startAsGuest();
        // Wait a moment for the guest user to be created
        await new Promise(resolve => setTimeout(resolve, 100));
        currentUser = user;
      }

      if (!currentUser) {
        throw new Error('Failed to authenticate');
      }

      // Accept the invitation
      const result = await invitationService.acceptInvitation(invitation.invitationToken, {
        name: participantName.trim(),
        email: currentUser.email || undefined
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to accept invitation');
      }

      // Add system message about the new participant
      const chatService = createChatService(currentUser.uid);
      await chatService.sendMessage(
        invitation.conversationId,
        `${participantName} joined the conversation`,
        'assistant'
      );

      // Navigate to the conversation
      onJoinSuccess(invitation.conversationId);
    } catch (error) {
      
      const errorMessage = getErrorMessage(error);
      showErrorToast({
        message: `Failed to join conversation: ${errorMessage}`,
        retry: handleJoinConversation
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center text-gray-600 mt-4">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Invalid Invitation</h3>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <button
              onClick={onNavigateToHome}
              className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.013 8.013 0 01-2.319-.324l-4.596 1.526a.75.75 0 01-.977-.977l1.526-4.596A8.013 8.013 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Join Conversation</h2>
          <p className="mt-2 text-sm text-gray-600">
            You've been invited by <strong>{invitation?.inviterName}</strong> to join:
          </p>
          <p className="mt-1 text-lg font-medium text-gray-900">{invitation?.conversationTitle}</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleJoinConversation(); }}>
          <div className="mb-4">
            <label htmlFor="participantName" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="participantName"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isJoining}
            />
          </div>

          <button
            type="submit"
            disabled={!participantName.trim() || isJoining}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Joining...
              </>
            ) : (
              'Join Conversation'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={onNavigateToHome}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinConversationPage;

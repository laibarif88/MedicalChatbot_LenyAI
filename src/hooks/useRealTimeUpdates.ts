import { useEffect, useCallback } from 'react';
import { ChatService } from '../services/chatService';
import { Conversation } from '../types';

interface UseRealTimeUpdatesProps {
  chatService: ChatService | null;
  isGuest: boolean;
  activeConversationId: string;
  updateConversations: (updater: (prev: Conversation[]) => Conversation[]) => void;
  setActiveConversationId: (id: string) => void;
}

export const useRealTimeUpdates = ({
  chatService,
  isGuest,
  activeConversationId,
  updateConversations,
  setActiveConversationId
}: UseRealTimeUpdatesProps) => {
  
  // Subscribe to conversation list updates
  const subscribeToConversations = useCallback(() => {
    if (!chatService || isGuest) {
      return () => {}; // No-op cleanup function
    }

    const unsubscribe = chatService.subscribeToConversations((updatedConversations) => {
      updateConversations(() => updatedConversations);
      
      // If no active conversation is set and we have conversations, set the first one
      if (!activeConversationId && updatedConversations.length > 0) {
        setActiveConversationId(updatedConversations[0].id);
      }
    });

    return unsubscribe;
  }, [chatService, isGuest, activeConversationId, updateConversations, setActiveConversationId]);

  // Subscribe to messages for the active conversation
  const subscribeToMessages = useCallback(() => {
    if (!chatService || !activeConversationId || isGuest) {
      return () => {}; // No-op cleanup function
    }

    const unsubscribe = chatService.subscribeToMessages(activeConversationId, (messages) => {
      updateConversations(prev => 
        prev.map(convo => {
          if (convo.id === activeConversationId) {
            return {
              ...convo,
              messages: messages
            };
          }
          return convo;
        })
      );
    });

    return unsubscribe;
  }, [chatService, activeConversationId, isGuest, updateConversations]);

  // Set up conversation subscription
  useEffect(() => {
    const unsubscribe = subscribeToConversations();
    return unsubscribe;
  }, [subscribeToConversations]);

  // Set up message subscription for active conversation
  useEffect(() => {
    const unsubscribe = subscribeToMessages();
    return unsubscribe;
  }, [subscribeToMessages]);

  return {};
};

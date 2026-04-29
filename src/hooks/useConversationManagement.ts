import { useState, useCallback } from 'react';
import { Conversation, Participant, Message } from '../types';
import { CONVERSATIONS, CURRENT_USER, SYSTEM_PARTICIPANT } from '../constants';
import { ChatService } from '../services/chatService';
import { showErrorToast, showSuccessToast, getErrorMessage } from '../utils/errorHandling';
import { generatePreviewText } from '../utils/conversationUtils';

// Helper function to generate personalized welcome message
const generatePersonalizedWelcomeMessage = (userName?: string): string => {
  const now = new Date();
  const hour = now.getHours();
  
  // Determine greeting based on time of day
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon';
  } else if (hour >= 17) {
    greeting = 'Good evening';
  }
  
  // Extract first name if available, but exclude 'You' as it's not a real name
  const firstName = userName && userName !== 'You' ? userName.split(' ')[0] : '';
  const nameGreeting = firstName ? ` ${firstName}` : '';
  
  return `${greeting}${nameGreeting}, how can I help you today?`;
};

interface UseConversationManagementProps {
  chatService: ChatService | null;
  isGuest: boolean;
  currentUser: Participant;
}

export const useConversationManagement = ({
  chatService,
  isGuest,
  currentUser
}: UseConversationManagementProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    
    try {
      if (chatService && !isGuest) {
        // For authenticated users, use Firebase
        const userConversations = await chatService.getUserConversations();
        setConversations(userConversations);
        setActiveConversationId(userConversations[0]?.id || '');
      } else {
        // For guests, start with empty conversations
        setConversations([]);
        setActiveConversationId('');
      }
    } catch (error) {
      
      const errorMessage = getErrorMessage(error);
      showErrorToast({
        message: `Failed to load conversations: ${errorMessage}`,
        retry: loadConversations
      });
      
      // For auth users, fallback to empty conversations if Firebase fails
      setConversations([]);
      setActiveConversationId('');
    } finally {
      setIsLoadingConversations(false);
    }
  }, [chatService, isGuest]);

  const createNewConversation = useCallback(async (includeWelcomeMessage: boolean = true) => {
    try {
      if (chatService && !isGuest) {
        // For authenticated users, use Firebase
        const conversationId = await chatService.createNewConversation('New Conversation');
        setActiveConversationId(conversationId);
        
        // Add welcome message only if requested
        if (includeWelcomeMessage) {
          const welcomeMessage = generatePersonalizedWelcomeMessage(currentUser?.name);
          await chatService.sendMessage(conversationId, welcomeMessage, 'assistant');
        }
      } else {
        // For guests, use localStorage
        const newChatId = `chat-${Date.now()}`;
        const aiAssistant: Participant = {
          id: `ai-leny-${newChatId}`,
          name: 'Leny AI Assistant',
          avatarUrl: '/leny.webp',
          role: 'ai_assistant',
          specialty: 'General AI',
        };

        const messages: Message[] = [];
        let preview = 'New conversation';
        
        // Add welcome message only if requested
        if (includeWelcomeMessage) {
          const welcomeMessageText = generatePersonalizedWelcomeMessage(currentUser?.name);
          const welcomeMessage: Message = {
            id: `welcome-${newChatId}`,
            senderId: aiAssistant.id,
            text: welcomeMessageText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          messages.push(welcomeMessage);
          preview = generatePreviewText(welcomeMessageText, 60); // Longer preview for welcome message
        }

        const newChat: Conversation = {
          id: newChatId,
          title: 'New Conversation',
          preview,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          participants: [currentUser, aiAssistant],
          messages,
        };
        
        setConversations(prev => [newChat, ...prev]);
        setActiveConversationId(newChatId);
      }
    } catch (error) {
      
      throw error;
    }
  }, [chatService, isGuest, currentUser]);

  const switchConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      if (chatService && !isGuest) {
        // For authenticated users, delete from Firebase
        await chatService.deleteConversation(conversationId);
      } else {
        // For guests, delete from memory only
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        
        // If we deleted the active conversation, switch to another one
        if (conversationId === activeConversationId) {
          const remainingConversations = conversations.filter(c => c.id !== conversationId);
          if (remainingConversations.length > 0) {
            setActiveConversationId(remainingConversations[0]?.id || '');
          } else {
            // Create a new conversation if no conversations remain
            await createNewConversation(true);
          }
        }
      }
    } catch (error) {
      
      throw error;
    }
  }, [chatService, isGuest, activeConversationId, conversations, createNewConversation]);

  const updateConversations = useCallback((updater: (prev: Conversation[]) => Conversation[]) => {
    setConversations(updater);
  }, []);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  return {
    conversations,
    activeConversationId,
    activeConversation,
    isLoadingConversations,
    loadConversations,
    createNewConversation,
    switchConversation,
    deleteConversation,
    updateConversations,
    setActiveConversationId
  };
};

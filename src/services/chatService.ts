import {
  createConversation,
  getUserConversations,
  updateConversation,
  deleteConversation,
  addMessage,
  getConversationMessages,
  subscribeToUserConversations,
  subscribeToConversationMessages,
  Conversation as FirestoreConversation,
  Message as FirestoreMessage
} from './firestoreService';
import { Conversation, Message, Participant, QuickAction } from '../types';
import { CURRENT_USER_ID, SYSTEM_PARTICIPANT } from '../constants';

// Convert Firestore conversation to app conversation format
const convertFirestoreConversation = (
  firestoreConvo: FirestoreConversation,
  messages: FirestoreMessage[] = []
): Conversation => {
  // Create participants based on the conversation data
  // In a real app, you'd fetch participant data from a separate collection
  const participants: Participant[] = [
    {
      id: firestoreConvo.userId,
      name: 'You',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop',
      role: 'patient' // This should come from user profile
    },
    {
      id: `ai-leny-${firestoreConvo.id}`,
      name: 'Leny AI Assistant',
      avatarUrl: '/leny.webp',
      role: 'ai_assistant',
      specialty: 'General AI'
    }
  ];

  // Convert Firestore messages to app message format
  const appMessages: Message[] = messages.map(msg => ({
    id: msg.id,
    senderId: msg.role === 'user' ? firestoreConvo.userId : `ai-leny-${firestoreConvo.id}`,
    text: msg.content,
    timestamp: msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isSystemMessage: false,
    quickActions: msg.quickActions,
    followUps: msg.followUps
  }));

  const lastMessage = messages[messages.length - 1];
  const preview = lastMessage ? 
    (lastMessage.content.length > 40 ? lastMessage.content.substring(0, 40) + '...' : lastMessage.content) :
    'New conversation';

  return {
    id: firestoreConvo.id,
    title: firestoreConvo.title,
    preview,
    timestamp: firestoreConvo.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    participants,
    messages: appMessages
  };
};

// Chat Service Class
export class ChatService {
  private userId: string;
  private conversationSubscriptions: Map<string, () => void> = new Map();
  private messageSubscriptions: Map<string, () => void> = new Map();

  constructor(userId: string) {
    this.userId = userId;
  }

  // Create a new conversation
  async createNewConversation(title: string = 'New Conversation'): Promise<string> {
    try {
      const conversationId = await createConversation(this.userId, title);
      
      // No welcome message needed
      
      return conversationId;
    } catch (error) {
      
      throw error;
    }
  }

  // Get all user conversations
  async getUserConversations(): Promise<Conversation[]> {
    try {
      const firestoreConversations = await getUserConversations(this.userId);
      
      // Get messages for each conversation
      const conversationsWithMessages = await Promise.all(
        firestoreConversations.map(async (convo) => {
          const messages = await getConversationMessages(convo.id);
          return convertFirestoreConversation(convo, messages);
        })
      );
      
      return conversationsWithMessages;
    } catch (error) {
      
      throw error;
    }
  }

  // Send a message
  async sendMessage(
    conversationId: string,
    content: string,
    role: 'user' | 'assistant' = 'user',
    quickActions?: QuickAction[],
    followUps?: string[]
  ): Promise<string> {
    try {
      const messageId = await addMessage(conversationId, this.userId, content, role, undefined, quickActions, followUps);
      return messageId;
    } catch (error) {
      
      throw error;
    }
  }

  // Get messages for a conversation
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    try {
      const firestoreMessages = await getConversationMessages(conversationId);
      
      return firestoreMessages.map(msg => ({
        id: msg.id,
        senderId: msg.role === 'user' ? this.userId : `ai-leny-${conversationId}`,
        text: msg.content,
        timestamp: msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystemMessage: false,
        quickActions: msg.quickActions,
        followUps: msg.followUps
      }));
    } catch (error) {
      
      throw error;
    }
  }

  // Subscribe to user conversations (real-time updates)
  subscribeToConversations(callback: (conversations: Conversation[]) => void): () => void {
    const unsubscribe = subscribeToUserConversations(this.userId, async (firestoreConversations) => {
      try {
        // Get messages for each conversation
        const conversationsWithMessages = await Promise.all(
          firestoreConversations.map(async (convo) => {
            const messages = await getConversationMessages(convo.id);
            return convertFirestoreConversation(convo, messages);
          })
        );
        
        callback(conversationsWithMessages);
      } catch (error) {
        
      }
    });

    return unsubscribe;
  }

  // Subscribe to messages in a conversation (real-time updates)
  subscribeToMessages(
    conversationId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    const unsubscribe = subscribeToConversationMessages(conversationId, (firestoreMessages) => {
      const appMessages: Message[] = firestoreMessages.map(msg => ({
        id: msg.id,
        senderId: msg.role === 'user' ? this.userId : `ai-leny-${conversationId}`,
        text: msg.content,
        timestamp: msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystemMessage: false,
        quickActions: msg.quickActions,
        followUps: msg.followUps
      }));
      
      callback(appMessages);
    });

    // Store subscription for cleanup
    this.messageSubscriptions.set(conversationId, unsubscribe);
    
    return unsubscribe;
  }

  // Update conversation title
  async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    try {
      await updateConversation(conversationId, { title });
    } catch (error) {
      
      throw error;
    }
  }

  // Delete a conversation
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      // Clean up subscriptions
      const messageUnsubscribe = this.messageSubscriptions.get(conversationId);
      if (messageUnsubscribe) {
        messageUnsubscribe();
        this.messageSubscriptions.delete(conversationId);
      }
      
      await deleteConversation(conversationId);
    } catch (error) {
      
      throw error;
    }
  }

  // Clean up all subscriptions
  cleanup(): void {
    this.messageSubscriptions.forEach(unsubscribe => unsubscribe());
    this.messageSubscriptions.clear();
  }

  // Update user ID (for when user logs in/out)
  updateUserId(newUserId: string): void {
    this.cleanup();
    this.userId = newUserId;
  }
}

// Factory function to create chat service
export const createChatService = (userId: string): ChatService => {
  return new ChatService(userId);
};
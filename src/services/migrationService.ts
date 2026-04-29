import { createChatService } from './chatService';
import { createUserProfile } from './firestoreService';
import { Conversation, Message, Participant } from '../types';

export interface MigrationResult {
  success: boolean;
  migratedConversations: number;
  migratedMessages: number;
  error?: string;
}

/**
 * Migrates guest user data to a newly registered user account
 * @param guestUid - The guest user's UID
 * @param newUserUid - The new authenticated user's UID
 * @param userEmail - The new user's email
 * @param displayName - The new user's display name
 * @returns Migration result with success status and counts
 */
export const migrateGuestToUser = async (
  guestUid: string,
  newUserUid: string,
  userEmail: string,
  displayName: string
): Promise<MigrationResult> => {
  try {
    // Create user profile for the new user
    await createUserProfile(newUserUid, {
      email: userEmail,
      displayName,
      createdAt: new Date(),
      isGuest: false
    });

    // Get guest conversations from localStorage
    const guestConversations = getGuestConversationsFromStorage(guestUid);
    
    if (!guestConversations || guestConversations.length === 0) {
      return {
        success: true,
        migratedConversations: 0,
        migratedMessages: 0
      };
    }

    // Create chat service for the new user
    const chatService = createChatService(newUserUid);

    let migratedConversations = 0;
    let migratedMessages = 0;

    // Migrate each conversation
    for (const conversation of guestConversations) {
      try {
        // Update participants to use new user UID
        const updatedParticipants = conversation.participants.map(participant => 
          participant.id === guestUid ? { ...participant, id: newUserUid } : participant
        );

        // Create conversation in Firestore
        const newConversationId = await chatService.createNewConversation(
          conversation.title
        );

        migratedConversations++;

        // Migrate messages for this conversation
        for (const message of conversation.messages) {
          const messageText = message.text;
          const messageRole = message.senderId === guestUid ? 'user' : 'assistant';

          await chatService.sendMessage(newConversationId, messageText, messageRole);
          migratedMessages++;
        }
      } catch (error) {
        
        // Continue with other conversations even if one fails
      }
    }

    // Clear guest data from localStorage after successful migration
    clearGuestDataFromStorage(guestUid);

    return {
      success: true,
      migratedConversations,
      migratedMessages
    };
  } catch (error) {
    
    return {
      success: false,
      migratedConversations: 0,
      migratedMessages: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Retrieves guest conversations from localStorage
 * @param guestUid - The guest user's UID
 * @returns Array of conversations or null if not found
 */
function getGuestConversationsFromStorage(guestUid: string): Conversation[] | null {
  try {
    // First try the new key used by ChatScreen
    const guestConversations = localStorage.getItem('guestConversations');
    if (guestConversations) {
      return JSON.parse(guestConversations);
    }
    
    // Then try legacy keys for backward compatibility
    const storageKey = `conversations_${guestUid}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Final fallback
    const fallbackStored = localStorage.getItem('conversations');
    return fallbackStored ? JSON.parse(fallbackStored) : null;
  } catch (error) {
    console.error('Error retrieving guest conversations:', error);
    return null;
  }
}

/**
 * Clears guest data from localStorage after successful migration
 * @param guestUid - The guest user's UID
 */
function clearGuestDataFromStorage(guestUid: string): void {
  try {
    // Clear the new keys used by ChatScreen
    localStorage.removeItem('guestConversations');
    localStorage.removeItem('guestActiveConversationId');
    localStorage.removeItem('guestUser');
    
    // Clear legacy keys for backward compatibility
    const storageKey = `conversations_${guestUid}`;
    localStorage.removeItem(storageKey);
    localStorage.removeItem('conversations');
    
    // Clear any other guest-related data
    localStorage.removeItem('currentUser');
    
    console.log('Guest data cleared from localStorage after migration');
  } catch (error) {
    console.error('Error clearing guest data from localStorage:', error);
  }
}

/**
 * Checks if there is guest data available for migration
 * @param guestUid - The guest user's UID
 * @returns True if guest data exists, false otherwise
 */
export const hasGuestDataToMigrate = (guestUid: string): boolean => {
  try {
    const conversations = getGuestConversationsFromStorage(guestUid);
    return conversations !== null && conversations.length > 0;
  } catch (error) {
    
    return false;
  }
};

/**
 * Gets a preview of what will be migrated
 * @param guestUid - The guest user's UID
 * @returns Migration preview with counts
 */
export const getMigrationPreview = (guestUid: string): { conversations: number; messages: number } => {
  try {
    const conversations = getGuestConversationsFromStorage(guestUid);
    
    if (!conversations) {
      return { conversations: 0, messages: 0 };
    }
    
    const messageCount = conversations.reduce((total, conv) => total + conv.messages.length, 0);
    
    return {
      conversations: conversations.length,
      messages: messageCount
    };
  } catch (error) {
    
    return { conversations: 0, messages: 0 };
  }
};

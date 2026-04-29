import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { QuickAction } from "../types";
import { SymptomData } from "../types/contextType";

// User Profile Interface
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  userType?: "patient" | "provider";
  specialty?: string;
  npi?: string;
  country?: string;
  institution?: string;
  createdAt: Date;
  updatedAt?: Date;
  isGuest: boolean;
  profileComplete?: boolean; // Flag to track if Google sign-in users completed their profile
  emailVerified?: boolean; // Flag to track email verification status
  preferences?: {
    theme?: "light" | "dark";
    language?: string;
  };
  personalization?: {
    communicationStyle?:
      | "supportive"
      | "professional"
      | "conversational"
      | "direct";
    healthInterests?: string[];
    infoPreference?: "data-driven" | "detailed" | "summaries" | "visual";
    patientGoals?: string[];
    providerFocus?: string[];
  };
}

// Conversation Interface
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  participantIds: string[]; // Required for Firestore security rules
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

// Message Interface
export interface Message {
  id: string;
  conversationId: string;
  userId: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  quickActions?: QuickAction[];
  followUps?: string[];
  metadata?: {
    model?: string;
    tokens?: number;
  };
  isFollowUpQuestion?: boolean;
}

// User Profile Operations
export const createUserProfile = async (
  uid: string,
  profileData: Omit<UserProfile, "uid" | "updatedAt">
): Promise<void> => {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      ...profileData,
      uid,
      createdAt: Timestamp.fromDate(profileData.createdAt),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    throw error;
  }
};

export const getUserProfile = async (
  uid: string
): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        ...data,
        createdAt: data["createdAt"].toDate(),
        updatedAt: data["updatedAt"]?.toDate(),
      } as UserProfile;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const updateUserProfile = async (
  uid: string,
  updates: Partial<Omit<UserProfile, "uid" | "createdAt">>
): Promise<void> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    throw error;
  }
};

// Conversation Operations
export const createConversation = async (
  userId: string,
  title: string
): Promise<string> => {
  try {
    const conversationRef = await addDoc(collection(db, "conversations"), {
      userId,
      title,
      participantIds: [userId], // Required for Firestore security rules
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      messageCount: 0,
    });
    return conversationRef.id;
  } catch (error) {
    throw error;
  }
};

export const getUserConversations = async (
  userId: string
): Promise<Conversation[]> => {
  try {
    const q = query(
      collection(db, "conversations"),
      where("participantIds", "array-contains", userId),
      orderBy("updatedAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        participantIds: data["participantIds"] || [data["userId"]], // Fallback for existing conversations
        createdAt: data["createdAt"].toDate(),
        updatedAt: data["updatedAt"].toDate(),
      };
    }) as Conversation[];
  } catch (error) {
    throw error;
  }
};

export const updateConversation = async (
  conversationId: string,
  updates: Partial<Omit<Conversation, "id" | "createdAt">>
): Promise<void> => {
  try {
    const conversationRef = doc(db, "conversations", conversationId);
    await updateDoc(conversationRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    throw error;
  }
};

export const deleteConversation = async (
  conversationId: string
): Promise<void> => {
  try {
    // Delete all messages in the conversation subcollection first
    const messagesCollectionRef = collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );
    const messagesSnapshot = await getDocs(messagesCollectionRef);

    const deletePromises = messagesSnapshot.docs.map((doc) =>
      deleteDoc(doc.ref)
    );
    await Promise.all(deletePromises);

    // Delete the conversation
    const conversationRef = doc(db, "conversations", conversationId);
    await deleteDoc(conversationRef);
  } catch (error) {
    throw error;
  }
};

// Message Data Interface for Firestore
interface MessageData {
  conversationId: string;
  userId: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Timestamp;
  metadata: Message["metadata"];
  quickActions?: Array<{ label: string; type: string }>;
  followUps?: string[];
  isFollowUpQuestion?: boolean; // ✅ ADD THIS
}

// Message Operations
export const addMessage = async (
  conversationId: string,
  userId: string,
  content: string,
  role: "user" | "assistant",
  metadata?: Message["metadata"],
  quickActions?: Array<{ label: string; type: string }>,
  followUps?: string[],
  isFollowUpQuestion?: boolean
): Promise<string> => {
  try {
    const messageData: MessageData = {
      conversationId,
      userId,
      content,
      role,
      timestamp: Timestamp.now(),
      metadata: metadata || {},
    };

    if (quickActions) {
      messageData.quickActions = quickActions;
    }

    if (followUps) {
      messageData.followUps = followUps;
    }

    if (isFollowUpQuestion !== undefined) {
      messageData.isFollowUpQuestion = isFollowUpQuestion;
    }

    const messageRef = await addDoc(
      collection(db, "conversations", conversationId, "messages"),
      messageData
    );

    // Update conversation message count and timestamp
    const conversationRef = doc(db, "conversations", conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (conversationSnap.exists()) {
      const currentCount = conversationSnap.data()["messageCount"] || 0;
      await updateDoc(conversationRef, {
        messageCount: currentCount + 1,
        updatedAt: Timestamp.now(),
      });
    }

    return messageRef.id;
  } catch (error) {
    throw error;
  }
};

export const getConversationMessages = async (
  conversationId: string
): Promise<Message[]> => {
  try {
    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("timestamp", "asc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data()["timestamp"].toDate(),
      isFollowUpQuestion: doc.data()["isFollowUpQuestion"] || false, // ✅ ADD THIS
    })) as Message[];
  } catch (error) {
    throw error;
  }
};

// Real-time listeners
export const subscribeToUserConversations = (
  userId: string,
  callback: (conversations: Conversation[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, "conversations"),
    where("participantIds", "array-contains", userId),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(q, (querySnapshot) => {
    const conversations = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        participantIds: data["participantIds"] || [data["userId"]], // Fallback for existing conversations
        createdAt: data["createdAt"].toDate(),
        updatedAt: data["updatedAt"].toDate(),
      };
    }) as Conversation[];

    callback(conversations);
  });
};

export const subscribeToConversationMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(q, (querySnapshot) => {
    const messages = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data()["timestamp"].toDate(),
      isFollowUpQuestion: doc.data()["isFollowUpQuestion"] || false,
    })) as Message[];

    callback(messages);
  });
};

// Migration helper for guest users
export const migrateGuestDataToUser = async (
  guestUid: string,
  newUserUid: string
): Promise<void> => {
  try {
    // Get all guest conversations
    const guestConversations = await getUserConversations(guestUid);

    // Transfer each conversation to the new user
    for (const conversation of guestConversations) {
      // Get all messages for this conversation
      const messages = await getConversationMessages(conversation.id);

      // Create new conversation for the registered user
      const newConversationId = await createConversation(
        newUserUid,
        conversation.title
      );

      // Transfer all messages
      for (const message of messages) {
        await addMessage(
          newConversationId,
          newUserUid,
          message.content,
          message.role,
          message.metadata
        );
      }

      // Delete old conversation
      await deleteConversation(conversation.id);
    }
  } catch (error) {
    throw error;
  }
};
// ENHANCED INTERFACES for Dynamic Context Management
export interface ContextState {
  id: string;
  conversationId: string;
  userId: string;
  currentState: "initial" | "gathering" | "complete" | "ready";
  symptomType: string[];
  gatheredData: SymptomData;
  missingFields: string[];
  followUpQuestions: string[];
  currentQuestionIndex?: number;
  conversationHistory: ContextMessage[];
  medicalConfidence: number;
  originalMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContextMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  extractedData?: Partial<SymptomData>;
  isFollowUpQuestion?: boolean;
}

// In firestoreService.ts - Update the createContextState function
export const createContextState = async (
  conversationId: string,
  userId: string,
  initialMessage: string,
  originalMessage: string
): Promise<string> => {
  try {
    // Handle guest users by using 'guest' as userId
    const effectiveUserId = userId === "guest" ? "guest" : userId;

    const contextRef = await addDoc(collection(db, "contextStates"), {
      conversationId,
      userId: effectiveUserId,
      originalMessage,
      currentState: "initial",
      symptomType: [],
      gatheredData: {
        symptoms: [],
        locations: [],
        associatedSymptoms: [],
      },
      missingFields: [],
      followUpQuestions: [],
      conversationHistory: [
        {
          role: "user",
          content: initialMessage,
          timestamp: Timestamp.now(),
        },
      ],
      medicalConfidence: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return contextRef.id;
  } catch (error) {
    console.error("Failed to create context state:", error);
    throw error;
  }
};

// Update getContextState to handle guest users
export const getContextState = async (
  conversationId: string,
  userId: string
): Promise<ContextState | null> => {
  try {
    const effectiveUserId = userId === "guest" ? "guest" : userId;

    // Secure query: matches your Firestore rules (conversationId + userId)
    const q = query(
      collection(db, "contextStates"),
      where("conversationId", "==", conversationId),
      where("userId", "==", effectiveUserId),
      orderBy("updatedAt", "desc"),
      limit(1) // you only need the latest, no need for 5
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.warn("No context state found, returning null");
      return null;
    }

    const doc = querySnapshot.docs[0];
    if (!doc) return null;
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data["createdAt"]?.toDate?.() || new Date(),
      updatedAt: data["updatedAt"]?.toDate?.() || new Date(),
      gatheredData: data["gatheredData"] || {
        symptoms: [],
        locations: [],
        associatedSymptoms: [],
      },
      symptomType: data["symptomType"] || [],
      missingFields: data["missingFields"] || [],
      followUpQuestions: data["followUpQuestions"] || [],
      conversationHistory: (data["conversationHistory"] || []).map(
        (msg: any) => ({
          ...msg,
          timestamp: msg.timestamp?.toDate?.() || new Date(),
        })
      ),
    } as ContextState;
  } catch (error) {
    console.error("Failed to get context state:", error);
    return null;
  }
};

export const updateContextState = async (
  contextId: string,
  updates: Partial<Omit<ContextState, "id" | "createdAt">>
): Promise<void> => {
  try {
    const contextRef = doc(db, "contextStates", contextId);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    // Convert Date objects to Timestamp for Firestore
    if (updates.conversationHistory) {
      updateData.conversationHistory = updates.conversationHistory.map(
        (msg) => ({
          ...msg,
          timestamp: Timestamp.fromDate(msg.timestamp),
        })
      );
    }

    await updateDoc(contextRef, updateData);
  } catch (error) {
    console.error("Failed to update context state:", error);
    throw error;
  }
};

export const deleteContextState = async (contextId: string): Promise<void> => {
  try {
    const contextRef = doc(db, "contextStates", contextId);
    await deleteDoc(contextRef);
  } catch (error) {
    console.error("Failed to delete context state:", error);
    throw error;
  }
};

export const updateContextHistory = async (
  contextId: string,
  message: ContextMessage
): Promise<void> => {
  try {
    const contextRef = doc(db, "contextStates", contextId);
    const contextSnap = await getDoc(contextRef);

    if (contextSnap.exists()) {
      const data = contextSnap.data();
      const currentHistory = data["conversationHistory"] || [];

      // Update context history
      await updateDoc(contextRef, {
        conversationHistory: [
          ...currentHistory,
          {
            ...message,
            timestamp: Timestamp.fromDate(message.timestamp),
          },
        ],
        updatedAt: Timestamp.now(),
      });

      // ✅ CRITICAL FIX: Also save follow-up questions as actual conversation messages
      if (message.role === "assistant" && message.isFollowUpQuestion) {
        const conversationId = data["conversationId"];
        const userId = data["userId"];

        if (conversationId && userId) {
          console.log(
            "💾 Saving follow-up question to conversation:",
            message.content
          );

          await addMessage(
            conversationId,
            userId,
            message.content,
            "assistant",
            undefined, // metadata
            undefined, // quickActions
            undefined, // followUps
            true // isFollowUpQuestion - we need to add this parameter
          );
        }
      }
    }
  } catch (error) {
    console.error("Failed to update context history:", error);
    throw error;
  }
};

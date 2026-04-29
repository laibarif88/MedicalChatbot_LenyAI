import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { UserType, Message, ProactiveAnalysis, Conversation } from '../types';
import { CURRENT_USER } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { aiService } from '../services/aiService';
import { appConfig } from '../config/appConfig';
import { buildAdaptivePrompt, buildAdaptivePromptWithContext } from '@/functions/src/prompts/promptManager';
import { DynamicContextManager } from '../services/dynamicContextManager';
import { FormMedicalDetector } from '../services/formMedicalDetector';
import { SymptomForm as SymptomFormType } from '../types/contextType';
import {
  createConversation,
  addMessage,
  getUserConversations,
  getConversationMessages,
  subscribeToUserConversations,
  subscribeToConversationMessages,
  deleteConversation as deleteFirebaseConversation
} from '../services/firestoreService';
import { collection, doc } from 'firebase/firestore';
import { db } from '../../firebase.config';

// Import components we'll create/update
import Sidebar from '../components/chat/Sidebar';
import NotesView from '../components/workspace/notes/NotesView';
import ProactiveWorkspace from '../components/workspace/ProactiveWorkspace';
import MessageBubbleSimple from '../components/chat/MessageBubbleSimple';
import ChatInput from '../components/chat/ChatInput';
import QuickReplyBar from '../components/chat/QuickReplyBar';
import ExpertPanelSelector from '../components/workspace/ExpertPanelSelector';
import { SendIcon, DotsVerticalIcon, ShareIcon, TrashIcon } from '../components/chat/Icons';

// App modes matching prototype
type AppMode = 'chat' | 'notes' | 'proactive';

interface ChatScreenProps {
  initialQuery?: string;
  userType?: UserType;
  onReturnToHome: () => void;
  onNavigateToProfile: () => void;
  onNavigateToSettings: () => void;
  onNavigateToSignUp: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({
  initialQuery,
  userType = appConfig.defaultUserType, // Use provider default from config
  onReturnToHome,
  onNavigateToProfile,
  onNavigateToSettings,
  onNavigateToSignUp
}) => {
  const { user, isGuest, startAsGuest, logout } = useAuth();

  // State matching prototype
  const [mode, setMode] = useState<AppMode>('chat');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isGeneratingFollowUps, setIsGeneratingFollowUps] = useState(false);

  // Workspace State
  const [notesTitle, setNotesTitle] = useState('Clinical Notes');
  const [notesContent, setNotesContent] = useState('');
  const [analysisData, setAnalysisData] = useState<ProactiveAnalysis | null>(null);

  const [useFormApproach, setUseFormApproach] = useState(true); // Toggle between approaches
  const [activeForm, setActiveForm] = useState<SymptomFormType | null>(null);

const [isGeneratingForm, setIsGeneratingForm] = useState(false);
  // Expert Panel State  
  const [expertPanelState, setExpertPanelState] = useState<{
    active: boolean;
    selected: string[];
  }>({
    active: false,
    selected: [],
  });

  // Pro Mode state (use config default for providers)
  const [isProMode, setIsProMode] = useState(
    userType === 'provider' && appConfig.features.proMode.enabledByDefault
  );
  const [proModeView, setProModeView] = useState<'notes' | 'proactive'>('notes');

  // Track if pro mode was toggled to create new conversation
  const [wasProModeToggled, setWasProModeToggled] = useState(false);

  // Header menu state
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  // Resizer state
  const [chatWidth, setChatWidth] = useState(400); // Default width for chat column
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Enhanced auto-scroll effect
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'end'
        });
      }
    };

    // Scroll immediately when messages change
    scrollToBottom();
  }, [messages]);

  // Additional effect for streaming and loading states
  useEffect(() => {
    if (isGenerating || isGeneratingFollowUps) {
      // Scroll when AI starts generating
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'end'
          });
        }
      }, 100);
    }
  }, [isGenerating, isGeneratingFollowUps]);

  // Close header menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
        setIsHeaderMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize guest if needed
  useEffect(() => {
    if (!user && !isGuest) {
      startAsGuest();
    }
  }, [user, isGuest, startAsGuest]);

  // Track if we've loaded saved conversations
  const [hasLoadedSavedConversations, setHasLoadedSavedConversations] = useState(false);

  // Real-time subscription cleanup
  const conversationUnsubscribe = useRef<(() => void) | null>(null);
  const messageUnsubscribe = useRef<(() => void) | null>(null);

  // Track pending saves for logout safety
  const pendingSaves = useRef<Promise<any>[]>([]);
  const [isSavingBeforeLogout, setIsSavingBeforeLogout] = useState(false);

  // Helper to generate Firebase-compatible IDs
  const generateFirebaseCompatibleId = useCallback(() => {
    if (!isGuest && user) {
      // For authenticated users, generate a proper Firebase ID
      return doc(collection(db, 'conversations')).id;
    }
    // For guests, use a guest-prefixed ID
    return `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, [user, isGuest]);



  // Guest conversations are not persisted to localStorage

  // Load saved conversations for authenticated users
  useEffect(() => {
    const loadSavedConversations = async () => {
      if (user && !isGuest) {
        try {
          const savedConversations = await getUserConversations(user.uid);

          // Convert Firestore conversations to local format
          const localConversations: Conversation[] = [];

          for (const firestoreConv of savedConversations) {
            try {
              // Fix TypeScript error by checking if properties exist
              if (!firestoreConv || !firestoreConv.id) {
                console.warn('Invalid conversation data:', firestoreConv);
                continue;
              }

              // Don't load all messages upfront - just get the preview
              const messages = await getConversationMessages(firestoreConv.id);
              const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

              localConversations.push({
                id: firestoreConv.id,
                title: firestoreConv.title || 'Untitled Conversation',
                preview: lastMessage ? (lastMessage.content.substring(0, 100) || '') + '...' : '',
                timestamp: firestoreConv.updatedAt ? firestoreConv.updatedAt.toISOString() : new Date().toISOString(),
                participants: [],
                messages: [] // Don't store messages locally - fetch when needed
              });
            } catch (error) {
              console.error('Error loading messages for conversation:', firestoreConv?.id || 'unknown', error);
            }
          }

          setConversations(localConversations);
          setHasLoadedSavedConversations(true); // Mark that we've loaded saved conversations
        } catch (error) {
          console.error('Failed to load saved conversations:', error);
          setHasLoadedSavedConversations(true); // Even on error, mark as loaded
        }
      } else {
        // For guest users, start with empty state (no localStorage persistence)
        setHasLoadedSavedConversations(true);
      }
    };

    loadSavedConversations();
  }, [user, isGuest]);

  // Clean up subscriptions on unmount or user change
  useEffect(() => {
    return () => {
      if (conversationUnsubscribe.current) {
        conversationUnsubscribe.current();
        conversationUnsubscribe.current = null;
      }
      if (messageUnsubscribe.current) {
        messageUnsubscribe.current();
        messageUnsubscribe.current = null;
      }
    };
  }, [user]);

  // Simplified message saving for authenticated users
  const saveMessageToFirebase = useCallback(async (conversationId: string, newMessage: Message) => {
    if (!user || isGuest || !conversationId) return;

    try {
      // Save to Firebase if it's not a local temporary ID
      // Local temp IDs start with 'conversation-' followed by a timestamp
      const isLocalTempId = conversationId.startsWith('conversation-') && /^conversation-\d+$/.test(conversationId);

      if (!isLocalTempId) {
        await addMessage(
          conversationId,
          user.uid,
          newMessage.text || '',
          newMessage.senderId === 'ai' ? 'assistant' : 'user',
          undefined,
          undefined,
          newMessage.followUps,
          newMessage.isFollowUpQuestion
        );
        console.log('Message saved to Firebase conversation:', conversationId);
      } else {
        console.log('Skipping save for local temp conversation:', conversationId);
      }
    } catch (error) {
      console.error('Failed to save message to Firebase:', error);
    }
  }, [user, isGuest]);

  // Handle initial query - process it immediately if present
  const hasProcessedInitialQuery = useRef(false);
  const processingInitialQuery = useRef(false);

  const handleNewChat = async (initialQuery?: string) => {
    let newConversationId: string;
    const truncatedQuery = initialQuery && initialQuery.length > 50 ? initialQuery.substring(0, 50) + '...' : initialQuery;
    const conversationTitle = truncatedQuery || (wasProModeToggled ? 'Pro Mode Session' : 'New Conversation');

    // Use proper ID generation
    if (user && !isGuest) {
      try {
        newConversationId = await createConversation(user.uid, conversationTitle);
        console.log('Created Firebase conversation:', newConversationId);
      } catch (error) {
        console.error('Failed to create Firebase conversation:', error);
        toast.error('Failed to create conversation. Working offline.');
        // Use proper Firebase-compatible ID for offline mode
        newConversationId = generateFirebaseCompatibleId();
      }
    } else {
      // Guest users use proper generated IDs
      newConversationId = generateFirebaseCompatibleId();
    }

    const newConversation: Conversation = {
      id: newConversationId,
      title: conversationTitle,
      preview: initialQuery || (wasProModeToggled ? 'Pro mode conversation' : 'New conversation'),
      timestamp: new Date().toISOString(),
      participants: [],
      messages: []
    };

    setConversations(prev => [...prev, newConversation]);
    setActiveConversationId(newConversationId);
    setMessages([]);
    setNotesContent('');
    setAnalysisData(null);
    setExpertPanelState({ active: false, selected: [] });
    setIsGenerating(false); // Clear any loading state from previous conversation

    // If there's an initial query, send it automatically
    if (initialQuery && initialQuery.trim()) {
      // Set the input value and trigger send after a brief delay to ensure state is updated
      setTimeout(() => {
        setInput(initialQuery.trim());
        setTimeout(() => {
          handleSendMessage(initialQuery.trim());
        }, 100);
      }, 100);
    }

    // Reset pro mode toggle flag
    setWasProModeToggled(false);

    // Reset initial query processing flags to prevent duplicate processing
    hasProcessedInitialQuery.current = true; // Mark as processed to prevent re-processing
    processingInitialQuery.current = false;
  };

  const handleSelectConversation = async (id: string) => {
    setActiveConversationId(id);
    setMode('chat'); // Switch to chat mode when a conversation is selected
    setIsGenerating(false); // Clear any loading state from previous conversation

    // Load messages from Firebase for authenticated users
    if (user && !isGuest && !id.startsWith('conversation-')) {
      try {
        const messages = await getConversationMessages(id);
        const localMessages: Message[] = messages.map(msg => ({
          id: msg.id,
          senderId: msg.role === 'user' ? CURRENT_USER.id : 'ai',
          text: msg.content,
          timestamp: msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          followUps: msg.followUps
        }));
        setMessages(localMessages);
      } catch (error) {
        console.error('Failed to load messages for conversation:', error);
        // Fallback to local messages if available
        const conversation = conversations.find(c => c.id === id);
        if (conversation && !conversation.isNote) {
          setMessages(conversation.messages || []);
        }
      }
    } else {
      // For guest users or local conversations, use local messages
      const conversation = conversations.find(c => c.id === id);
      if (conversation && !conversation.isNote) {
        setMessages(conversation.messages || []);
      }
    }
  };

  const handleSelectNote = (id: string) => {
    setActiveConversationId(id);
    setMode('notes'); // Switch to notes mode when a note is selected
    // Load note content
    const note = conversations.find(c => c.id === id);
    if (note && note.isNote) {
      setNotesContent(note.notesContent || '');
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      // Delete from Firebase for authenticated users
      if (user && !isGuest && !id.startsWith('guest-')) {
        await deleteFirebaseConversation(id);
        toast.success('Conversation deleted');
      }

      // Remove from local state
      setConversations(prev => prev.filter(c => c.id !== id));

      // If deleting active conversation, create new one
      if (activeConversationId === id) {
        setActiveConversationId(null);
        handleNewChat();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const handleLogout = async () => {
    // Show saving indicator
    setIsSavingBeforeLogout(true);

    try {
      // Wait for any pending saves to complete
      if (pendingSaves.current.length > 0) {
        toast.loading('Saving your conversations...');
        await Promise.all(pendingSaves.current);
        pendingSaves.current = [];
      }

      // Clean up subscriptions
      if (conversationUnsubscribe.current) {
        conversationUnsubscribe.current();
        conversationUnsubscribe.current = null;
      }
      if (messageUnsubscribe.current) {
        messageUnsubscribe.current();
        messageUnsubscribe.current = null;
      }

      // Clear local state
      setConversations([]);
      setActiveConversationId(null);
      setMessages([]);
      setNotesContent('');
      setAnalysisData(null);

      // Clear guest data from localStorage
      if (isGuest) {
        localStorage.removeItem('guestConversations');
        localStorage.removeItem('guestActiveConversationId');
        localStorage.removeItem('guestUser');
      }

      // Call logout from AuthContext to properly clear Firebase auth state
      await logout();

      toast.success('Logged out successfully');

      // Return to home page after logout completes
      onReturnToHome();
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Failed to logout properly. Please try again.');
    } finally {
      setIsSavingBeforeLogout(false);
    }
  };
  // Enhanced message processing with dynamic context
  const processMessageWithDynamicContext = async (message: string): Promise<{
    shouldProceedToAI: boolean;
    enhancedMessage?: string;
    followUpQuestions?: string[];
    isMedical?: boolean;
  }> => {
    if (!activeConversationId) {
      return { shouldProceedToAI: true, enhancedMessage: message, isMedical: false };
    }

    try {
      const result = await DynamicContextManager.processMessage(
        message,
        activeConversationId,
        user?.uid || 'guest',
        userType
      );

      console.log('Context processing result:', result);
      return result;
    } catch (error) {
      console.error('Dynamic context processing failed:', error);
      return { shouldProceedToAI: true, enhancedMessage: message, isMedical: false };
    }
  };

  // const handleSendMessage = useCallback(async (messageText?: string) => {
  //   let message: string;
  //   if (typeof messageText === 'string') {
  //     message = messageText;
  //   } else {
  //     message = input.trim();
  //   }

  //   if (!message || isGenerating) return;

  //   // Handle form submissions
  //   if (message.startsWith('FORM_SUBMISSION:')) {
  //     try {
  //       const formData = JSON.parse(message.replace('FORM_SUBMISSION:', ''));

  //       if (activeForm) {
  //         const enhancedMessage = FormMedicalDetector.processFormSubmission(
  //           formData,
  //           activeForm.symptomContext?.join(' ') || message,
  //           activeForm.symptomContext || []
  //         );

  //         // Clear the form
  //         setActiveForm(null);

  //         // Proceed with enhanced message to AI
  //         await handleSendMessage(enhancedMessage);
  //       }
  //     } catch (error) {
  //       console.error('Form submission error:', error);
  //     }
  //     return;
  //   }

  //   // Cancel any existing request
  //   if (abortController) {
  //     abortController.abort();
  //   }

  //   // Create new AbortController for this request
  //   const controller = new AbortController();
  //   setAbortController(controller);

  //   // Use existing conversation or create a new one
  //   let currentConversationId = activeConversationId;
  //   if (!currentConversationId) {
  //     const truncatedMessage = message.length > 50 ? message.substring(0, 50) + '...' : message;

  //     if (user && !isGuest) {
  //       try {
  //         currentConversationId = await createConversation(user.uid, truncatedMessage);
  //         console.log('Created Firebase conversation in handleSendMessage:', currentConversationId);
  //       } catch (error) {
  //         console.error('Failed to create Firebase conversation:', error);
  //         toast.error('Failed to save conversation. Working offline.');
  //         currentConversationId = generateFirebaseCompatibleId();
  //       }
  //     } else {
  //       currentConversationId = generateFirebaseCompatibleId();
  //     }

  //     const newConversation: Conversation = {
  //       id: currentConversationId,
  //       title: truncatedMessage,
  //       preview: message,
  //       timestamp: new Date().toISOString(),
  //       participants: [],
  //       messages: []
  //     };

  //     setConversations(prev => [...prev, newConversation]);
  //     setActiveConversationId(currentConversationId);
  //   }

  //   // Store the conversation ID for this request
  //   const targetConversationId = currentConversationId;

  //   // ✅ IMMEDIATELY CREATE AND DISPLAY USER MESSAGE
  //   const userMessage: Message = {
  //     id: `user-${Date.now()}`,
  //     senderId: CURRENT_USER.id,
  //     text: message,
  //     timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  //   };

  //   // ✅ IMMEDIATELY ADD TO CHAT AND CLEAR INPUT
  //   setMessages(prev => [...prev, userMessage]);
  //   if (typeof messageText !== 'string') setInput('');
  //   setTimeout(() => {
  //     if (messagesEndRef.current) {
  //       messagesEndRef.current.scrollIntoView({
  //         behavior: 'smooth',
  //         block: 'end'
  //       });
  //     }
  //   }, 50);

  //   // ✅ FORM APPROACH: ALWAYS ENABLED BY DEFAULT FOR PATIENTS
  //   if (userType === 'patient' && useFormApproach) {
  //     console.log('🔄 Checking for form generation for message:', message);
  //     const formResult = await FormMedicalDetector.detectAndGenerateForm(message, userType);

  //     console.log('📋 Form detection result:', formResult);

  //     if (formResult.formData && !formResult.shouldProceedToAI) {
  //       // Show form instead of proceeding to AI
  //       setActiveForm(formResult.formData);

  //       // Add form message to chat
  //       const formMessage: Message = {
  //         id: `form-${Date.now()}`,
  //         senderId: 'ai',
  //         text: 'I need some more information to help you better.',
  //         formData: formResult.formData,
  //         timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  //       };

  //       setMessages(prev => [...prev, formMessage]);

  //       // Save user message to Firebase
  //       if (targetConversationId) {
  //         await saveMessageToFirebase(targetConversationId, userMessage);
  //       }

  //       // Save form message to Firebase
  //       await saveMessageToFirebase(targetConversationId, formMessage);

  //       return; // 🛑 STOP - don't proceed to context manager or AI
  //     }
  //   }

  //   // ============================================================================
  //   // ✅ CONTEXT MANAGER APPROACH: COMMENTED OUT - UNCOMMENT TO USE CONTEXT MANAGER
  //   // ============================================================================
  //   /*
  //   let contextResult;
  //   try {
  //     setIsGeneratingFollowUps(true); // Start follow-up loading
  //     console.log('🔄 Starting context processing for:', message);
  //     contextResult = await DynamicContextManager.processMessage(
  //       message,
  //       targetConversationId,
  //       user?.uid || 'guest',
  //       userType
  //     );
  //     console.log('✅ Context processing result:', contextResult);
  //   } catch (error) {
  //     console.error('❌ Context processing failed, proceeding directly to AI:', error);
  //     contextResult = {
  //       shouldProceedToAI: true,
  //       enhancedMessage: message,
  //       isMedical: false
  //     };
  //   } finally {
  //     setIsGeneratingFollowUps(false); // Always stop follow-up loading
  //   }
  
  //   // 🛑 STOP FLOW if we need to ask follow-up questions (context manager approach)
  //   if (!contextResult.shouldProceedToAI && contextResult.followUpQuestions) {
  //     console.log('🛑 Context incomplete - showing follow-up questions:', contextResult.followUpQuestions);
  
  //     // Show follow-up questions instead of proceeding to AI
  //     const followUpMessages: Message[] = contextResult.followUpQuestions.map((question, index) => ({
  //       id: `followup-${Date.now()}-${index}`,
  //       senderId: 'ai',
  //       text: question,
  //       timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  //       isFollowUpQuestion: true
  //     }));
  
  //     setMessages(prev => [...prev, ...followUpMessages]);
  //     setTimeout(() => {
  //       if (messagesEndRef.current) {
  //         messagesEndRef.current.scrollIntoView({
  //           behavior: 'smooth',
  //           block: 'end'
  //         });
  //       }
  //     }, 100);
  
  //     // Update conversation preview with context gathering status
  //     setConversations(prev => prev.map(conv =>
  //       conv.id === targetConversationId
  //         ? {
  //           ...conv,
  //           preview: `Gathering details about ${contextResult.currentContext?.symptomType?.join(', ') || 'symptoms'}...`,
  //           timestamp: new Date().toISOString()
  //         }
  //         : conv
  //     ));
  
  //     // Save user message to Firebase
  //     if (targetConversationId) {
  //       await saveMessageToFirebase(targetConversationId, userMessage);
  //     }
  //     for (const followUpMessage of followUpMessages) {
  //       await saveMessageToFirebase(targetConversationId, followUpMessage);
  //     }
  
  //     setIsGenerating(false);
  //     return; // 🛑 STOP - don't proceed to AI
  //   }
  
  //   const finalMessage = contextResult.enhancedMessage || message;
  //   */
  //   // ============================================================================
  //   // END OF COMMENTED CONTEXT MANAGER SECTION
  //   // ============================================================================

  //   // ✅ PROCEED to AI with original message (since context manager is commented out)
  //   const finalMessage = message; // Use original message when context manager is disabled
  //   console.log('✅ Proceeding to AI with message:', finalMessage);
  //   setIsGenerating(true);

  //   // Update conversation preview with the final message
  //   setConversations(prev => prev.map(conv =>
  //     conv.id === targetConversationId
  //       ? {
  //         ...conv,
  //         preview: finalMessage.length > 100 ? finalMessage.substring(0, 100) + '...' : finalMessage,
  //         timestamp: new Date().toISOString()
  //       }
  //       : conv
  //   ));

  //   // Save user message to Firebase
  //   if (targetConversationId) {
  //     await saveMessageToFirebase(targetConversationId, userMessage);
  //   }

  //   try {
  //     // Handle Expert Panel keyword trigger
  //     if (message.toLowerCase().includes('expert panel') && !expertPanelState.active) {
  //       setExpertPanelState({ active: true, selected: [] });
  //       const selectorMessage: Message = {
  //         id: `selector-${Date.now()}`,
  //         senderId: 'system',
  //         text: '',
  //         timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  //       };
  //       setMessages(prev => [...prev, selectorMessage]);
  //       setIsGenerating(false);
  //       return;
  //     }

  //     // Build conversation history for context
  //     const conversationHistory = messages.map(msg => ({
  //       role: msg.senderId === CURRENT_USER.id ? 'user' : 'assistant',
  //       content: msg.text
  //     }));

  //     // Call AI service based on mode
  //     let responseText = '';

  //     if (mode === 'proactive') {
  //       const analysis = await aiService.analyzeConversation(conversationHistory, userType);
  //       setAnalysisData({
  //         differentialDiagnosis: analysis.insights.slice(0, 3).map((insight, i) => ({
  //           condition: insight,
  //           confidence: 90 - (i * 20)
  //         })),
  //         recommendedLabsAndImaging: analysis.recommendations.map(rec => ({
  //           title: rec,
  //           details: 'Based on clinical presentation'
  //         })),
  //         clinicalPearls: analysis.risks.map(risk => ({
  //           title: 'Important consideration',
  //           details: risk
  //         }))
  //       });
  //       responseText = "I've analyzed the case. The results are now available in the Proactive Analysis workspace.";
  //     }
  //     else if (expertPanelState.active && expertPanelState.selected.length > 0) {
  //       // Simulate expert panel discussion
  //       const expertPromises = expertPanelState.selected.map(async (specialty) => {
  //         const expertPrompt = `As a ${specialty} specialist, provide your expert opinion on: ${finalMessage}`;
  //         const opinion = await aiService.getResponse(expertPrompt, 'provider', false, conversationHistory);
  //         return { specialty, opinion };
  //       });

  //       const expertOpinions = await Promise.all(expertPromises);

  //       expertOpinions.forEach(({ specialty, opinion }) => {
  //         const expertMessage: Message = {
  //           id: `expert-${Date.now()}-${specialty}`,
  //           senderId: 'ai',
  //           text: `**${specialty}:** ${opinion}`,
  //           timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  //         };
  //         setMessages(prev => [...prev, expertMessage]);
  //       });

  //       setExpertPanelState({ active: false, selected: [] });
  //       setIsGenerating(false);
  //       return;
  //     }
  //     else {
  //       // Standard chat response - use basic prompt without context
  //       const prompt = buildAdaptivePrompt(finalMessage, userType, false);

  //       console.log('🤖 Sending to AI with prompt length:', prompt.length);

  //       // Try to use streaming with cancellation support
  //       try {
  //         const stream = aiService.streamResponse(
  //           finalMessage,
  //           userType,
  //           false,
  //           conversationHistory,
  //           controller
  //         );

  //         responseText = '';
  //         for await (const chunk of stream) {
  //           responseText = chunk;

  //           if (controller.signal.aborted) {
  //             console.log('Request was cancelled');
  //             return;
  //           }
  //         }
  //       } catch (streamError) {
  //         // Fallback to non-streaming if streaming fails
  //         console.warn('Streaming failed, falling back to regular response:', streamError);
  //         responseText = await aiService.getResponse(
  //           finalMessage,
  //           userType,
  //           false,
  //           conversationHistory
  //         );
  //       }
  //     }

  //     // Clean and process the response text
  //     const cleanedResponseText = typeof responseText === 'string' ? responseText.trim() : responseText;

  //     // Get follow-up suggestions
  //     const followUps = await aiService.getQuickActions(cleanedResponseText, userType);
  //     console.log('Generated follow-ups:', followUps);

  //     // Add AI response to messages
  //     const aiResponse: Message = {
  //       id: `ai-${Date.now()}`,
  //       senderId: 'ai',
  //       text: cleanedResponseText,
  //       followUps: followUps.length > 0 ? followUps : undefined,
  //       timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  //     };
  //     console.log('AI Response with follow-ups:', aiResponse);

  //     // Check if we're still on the same conversation before updating messages
  //     setMessages(prev => {
  //       if (activeConversationId === targetConversationId) {
  //         return [...prev, aiResponse];
  //       }
  //       return prev;
  //     });
  //     setTimeout(() => {
  //       if (messagesEndRef.current) {
  //         messagesEndRef.current.scrollIntoView({
  //           behavior: 'smooth',
  //           block: 'end'
  //         });
  //       }
  //     }, 100);

  //     // Update conversation preview and save AI response
  //     if (targetConversationId) {
  //       setConversations(prev => prev.map(conv => {
  //         if (conv.id === targetConversationId) {
  //           const updatedMessages = [...(conv.messages || []), aiResponse];
  //           return {
  //             ...conv,
  //             preview: responseText.length > 100 ? responseText.substring(0, 100) + '...' : responseText,
  //             timestamp: new Date().toISOString(),
  //             messages: updatedMessages
  //           };
  //         }
  //         return conv;
  //       }));

  //       // Save AI response to Firebase
  //       await saveMessageToFirebase(targetConversationId, aiResponse);
  //     }
  //   } catch (error) {
  //     console.error("Error sending message:", error);
  //     const errorResponse: Message = {
  //       id: `error-${Date.now()}`,
  //       senderId: 'system',
  //       text: 'Sorry, I encountered an error. Please try again.',
  //       timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  //     };

  //     setMessages(prev => {
  //       if (activeConversationId === targetConversationId) {
  //         return [...prev, errorResponse];
  //       }
  //       return prev;
  //     });
  //   } finally {
  //     if (activeConversationId === targetConversationId) {
  //       setIsGenerating(false);
  //     }
  //     setAbortController(null);
  //   }
  // }, [input, isGenerating, messages, mode, expertPanelState, userType, activeConversationId, conversations, saveMessageToFirebase, user, isGuest, abortController, activeForm, useFormApproach]); // Added useFormApproach to dependencies

// Helper function to process form submission without showing enhanced message
const processFormSubmissionToAI = async (enhancedMessage: string) => {
  if (!activeConversationId || isGenerating) return;

  // Cancel any existing request
  if (abortController) {
    abortController.abort();
  }

  const controller = new AbortController();
  setAbortController(controller);
  
  const targetConversationId = activeConversationId;
  
  console.log('✅ Processing form submission directly to AI');
  setIsGenerating(true);

  try {
    // Build conversation history for context
    const conversationHistory = messages.map(msg => ({
      role: msg.senderId === CURRENT_USER.id ? 'user' : 'assistant',
      content: msg.text
    }));

    // Standard chat response
    const prompt = buildAdaptivePrompt(enhancedMessage, userType, false);
    console.log('🤖 Sending form data to AI with prompt length:', prompt.length);

    let responseText = '';
    
    // Try to use streaming with cancellation support
    try {
      const stream = aiService.streamResponse(
        enhancedMessage,
        userType,
        false,
        conversationHistory,
        controller
      );

      responseText = '';
      for await (const chunk of stream) {
        responseText = chunk;

        if (controller.signal.aborted) {
          console.log('Request was cancelled');
          return;
        }
      }
    } catch (streamError) {
      // Fallback to non-streaming if streaming fails
      console.warn('Streaming failed, falling back to regular response:', streamError);
      responseText = await aiService.getResponse(
        enhancedMessage,
        userType,
        false,
        conversationHistory
      );
    }

    // Clean and process the response text
    const cleanedResponseText = typeof responseText === 'string' ? responseText.trim() : responseText;

    // Get follow-up suggestions
    const followUps = await aiService.getQuickActions(cleanedResponseText, userType);
    console.log('Generated follow-ups:', followUps);

    // Add AI response to messages (this is the only message that will show)
    const aiResponse: Message = {
      id: `ai-${Date.now()}`,
      senderId: 'ai',
      text: cleanedResponseText,
      followUps: followUps.length > 0 ? followUps : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => {
      if (activeConversationId === targetConversationId) {
        return [...prev, aiResponse];
      }
      return prev;
    });

    // Update conversation preview and save AI response
    if (targetConversationId) {
      setConversations(prev => prev.map(conv => {
        if (conv.id === targetConversationId) {
          return {
            ...conv,
            preview: responseText.length > 100 ? responseText.substring(0, 100) + '...' : responseText,
            timestamp: new Date().toISOString()
          };
        }
        return conv;
      }));

      // Save AI response to Firebase
      await saveMessageToFirebase(targetConversationId, aiResponse);
    }
  } catch (error) {
    console.error("Error processing form submission:", error);
    const errorResponse: Message = {
      id: `error-${Date.now()}`,
      senderId: 'system',
      text: 'Sorry, I encountered an error. Please try again.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => {
      if (activeConversationId === targetConversationId) {
        return [...prev, errorResponse];
      }
      return prev;
    });
  } finally {
    if (activeConversationId === targetConversationId) {
      setIsGenerating(false);
    }
    setAbortController(null);
  }
};
  const handleSendMessage = useCallback(async (messageText?: string) => {
  let message: string;
  if (typeof messageText === 'string') {
    message = messageText;
  } else {
    message = input.trim();
  }

  if (!message || isGenerating) return;

  // Handle form submissions
  if (message.startsWith('FORM_SUBMISSION:')) {
  try {
    const formData = JSON.parse(message.replace('FORM_SUBMISSION:', ''));

    if (activeForm) {
      const enhancedMessage = FormMedicalDetector.processFormSubmission(
        formData,
        activeForm.symptomContext?.join(' ') || message,
        activeForm.symptomContext || []
      );

      // Clear the form immediately after submission
      setActiveForm(null);

      // ✅ PROCEED TO AI with enhanced message BUT DON'T SHOW IT IN CHAT
      console.log('✅ Form submission complete, proceeding to AI with enhanced message');
      
      // Instead of calling handleSendMessage which would display the enhanced message,
      // we'll proceed directly to AI processing without showing the enhanced message
      await processFormSubmissionToAI(enhancedMessage);
    }
  } catch (error) {
    console.error('Form submission error:', error);
  }
  return;
}

  // Cancel any existing request
  if (abortController) {
    abortController.abort();
  }

  // Create new AbortController for this request
  const controller = new AbortController();
  setAbortController(controller);

  // Use existing conversation or create a new one
  let currentConversationId = activeConversationId;
  if (!currentConversationId) {
    const truncatedMessage = message.length > 50 ? message.substring(0, 50) + '...' : message;

    if (user && !isGuest) {
      try {
        currentConversationId = await createConversation(user.uid, truncatedMessage);
        console.log('Created Firebase conversation in handleSendMessage:', currentConversationId);
      } catch (error) {
        console.error('Failed to create Firebase conversation:', error);
        toast.error('Failed to save conversation. Working offline.');
        currentConversationId = generateFirebaseCompatibleId();
      }
    } else {
      currentConversationId = generateFirebaseCompatibleId();
    }

    const newConversation: Conversation = {
      id: currentConversationId,
      title: truncatedMessage,
      preview: message,
      timestamp: new Date().toISOString(),
      participants: [],
      messages: []
    };

    setConversations(prev => [...prev, newConversation]);
    setActiveConversationId(currentConversationId);
  }

  // Store the conversation ID for this request
  const targetConversationId = currentConversationId;

  // ✅ IMMEDIATELY CREATE AND DISPLAY USER MESSAGE
  const userMessage: Message = {
    id: `user-${Date.now()}`,
    senderId: CURRENT_USER.id,
    text: message,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  // ✅ IMMEDIATELY ADD TO CHAT AND CLEAR INPUT
  setMessages(prev => [...prev, userMessage]);
  if (typeof messageText !== 'string') setInput('');
  setTimeout(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, 50);

  // ✅ FORM APPROACH: Check if we should show form (only for patients, only for medical content)
  if (userType === 'patient' && !activeForm) {
    console.log('🔄 Checking for form generation for message:', message);
    setIsGeneratingForm(true); 
    const formResult = await FormMedicalDetector.detectAndGenerateForm(message, userType);
    setIsGeneratingForm(false); 

    console.log('📋 Form detection result:', formResult);

    if (formResult.formData && !formResult.shouldProceedToAI) {
      // Show form instead of proceeding to AI
      setActiveForm(formResult.formData);

      // Add form message to chat
      const formMessage: Message = {
        id: `form-${Date.now()}`,
        senderId: 'ai',
        text: 'I need some more information about your symptoms to help you better. Please fill out this form:',
        formData: formResult.formData,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, formMessage]);

      // Save user message to Firebase
      if (targetConversationId) {
        await saveMessageToFirebase(targetConversationId, userMessage);
      }

      // Save form message to Firebase
      await saveMessageToFirebase(targetConversationId, formMessage);

      return; // 🛑 STOP - don't proceed to context manager or AI
    }
  }

  // ✅ PROCEED to AI with original message (since context processing is commented out)
  const finalMessage = message;
  console.log('✅ Proceeding to AI with message:', finalMessage);
  setIsGenerating(true);

  // Update conversation preview with the final message
  setConversations(prev => prev.map(conv =>
    conv.id === targetConversationId
      ? {
        ...conv,
        preview: finalMessage.length > 100 ? finalMessage.substring(0, 100) + '...' : finalMessage,
        timestamp: new Date().toISOString()
      }
      : conv
  ));

  // Save user message to Firebase
  if (targetConversationId) {
    await saveMessageToFirebase(targetConversationId, userMessage);
  }

  try {
    // Handle Expert Panel keyword trigger
    if (message.toLowerCase().includes('expert panel') && !expertPanelState.active) {
      setExpertPanelState({ active: true, selected: [] });
      const selectorMessage: Message = {
        id: `selector-${Date.now()}`,
        senderId: 'system',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, selectorMessage]);
      setIsGenerating(false);
      return;
    }

    // Build conversation history for context
    const conversationHistory = messages.map(msg => ({
      role: msg.senderId === CURRENT_USER.id ? 'user' : 'assistant',
      content: msg.text
    }));

    // Call AI service based on mode
    let responseText = '';

    if (mode === 'proactive') {
      const analysis = await aiService.analyzeConversation(conversationHistory, userType);
      setAnalysisData({
        differentialDiagnosis: analysis.insights.slice(0, 3).map((insight, i) => ({
          condition: insight,
          confidence: 90 - (i * 20)
        })),
        recommendedLabsAndImaging: analysis.recommendations.map(rec => ({
          title: rec,
          details: 'Based on clinical presentation'
        })),
        clinicalPearls: analysis.risks.map(risk => ({
          title: 'Important consideration',
          details: risk
        }))
      });
      responseText = "I've analyzed the case. The results are now available in the Proactive Analysis workspace.";
    }
    else if (expertPanelState.active && expertPanelState.selected.length > 0) {
      // Simulate expert panel discussion
      const expertPromises = expertPanelState.selected.map(async (specialty) => {
        const expertPrompt = `As a ${specialty} specialist, provide your expert opinion on: ${finalMessage}`;
        const opinion = await aiService.getResponse(expertPrompt, 'provider', false, conversationHistory);
        return { specialty, opinion };
      });

      const expertOpinions = await Promise.all(expertPromises);

      expertOpinions.forEach(({ specialty, opinion }) => {
        const expertMessage: Message = {
          id: `expert-${Date.now()}-${specialty}`,
          senderId: 'ai',
          text: `**${specialty}:** ${opinion}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, expertMessage]);
      });

      setExpertPanelState({ active: false, selected: [] });
      setIsGenerating(false);
      return;
    }
    else {
      // Standard chat response - use basic prompt without context
      // Since context processing is commented out, use basic prompt
      const prompt = buildAdaptivePrompt(finalMessage, userType, false);

      console.log('🤖 Sending to AI with prompt length:', prompt.length);

      // Try to use streaming with cancellation support
      try {
        const stream = aiService.streamResponse(
          finalMessage,
          userType,
          false,
          conversationHistory,
          controller
        );

        responseText = '';
        for await (const chunk of stream) {
          responseText = chunk;

          if (controller.signal.aborted) {
            console.log('Request was cancelled');
            return;
          }
        }
      } catch (streamError) {
        // Fallback to non-streaming if streaming fails
        console.warn('Streaming failed, falling back to regular response:', streamError);
        responseText = await aiService.getResponse(
          finalMessage,
          userType,
          false,
          conversationHistory
        );
      }
    }

    // Clean and process the response text
    const cleanedResponseText = typeof responseText === 'string' ? responseText.trim() : responseText;

    // Get follow-up suggestions
    const followUps = await aiService.getQuickActions(cleanedResponseText, userType);
    console.log('Generated follow-ups:', followUps);

    // Add AI response to messages
    const aiResponse: Message = {
      id: `ai-${Date.now()}`,
      senderId: 'ai',
      text: cleanedResponseText,
      followUps: followUps.length > 0 ? followUps : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    console.log('AI Response with follow-ups:', aiResponse);

    // Check if we're still on the same conversation before updating messages
    setMessages(prev => {
      if (activeConversationId === targetConversationId) {
        return [...prev, aiResponse];
      }
      return prev;
    });
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'end'
        });
      }
    }, 100);

    // Update conversation preview and save AI response
    if (targetConversationId) {
      setConversations(prev => prev.map(conv => {
        if (conv.id === targetConversationId) {
          const updatedMessages = [...(conv.messages || []), aiResponse];
          return {
            ...conv,
            preview: responseText.length > 100 ? responseText.substring(0, 100) + '...' : responseText,
            timestamp: new Date().toISOString(),
            messages: updatedMessages
          };
        }
        return conv;
      }));

      // Save AI response to Firebase
      await saveMessageToFirebase(targetConversationId, aiResponse);
    }
  } catch (error) {
    console.error("Error sending message:", error);
    const errorResponse: Message = {
      id: `error-${Date.now()}`,
      senderId: 'system',
      text: 'Sorry, I encountered an error. Please try again.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => {
      if (activeConversationId === targetConversationId) {
        return [...prev, errorResponse];
      }
      return prev;
    });
  } finally {
    if (activeConversationId === targetConversationId) {
      setIsGenerating(false);
    }
    setAbortController(null);
  }
}, [input, isGenerating, messages, mode, expertPanelState, userType, activeConversationId, conversations, saveMessageToFirebase, user, isGuest, abortController, activeForm]);

const handleStopGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsGenerating(false);
    }
  }, [abortController]);

  // Process initial query when provided from landing page
  useEffect(() => {
    // Process initial query if it exists and hasn't been processed yet
    if (initialQuery &&
      initialQuery.trim() &&
      !hasProcessedInitialQuery.current &&
      !processingInitialQuery.current &&
      hasLoadedSavedConversations) { // Wait until we know if there are saved conversations

      processingInitialQuery.current = true;
      hasProcessedInitialQuery.current = true;

      const processInitialQuery = async () => {
        // Create a new conversation for this initial query
        let newConversationId: string;
        const truncatedQuery = initialQuery.length > 50 ? initialQuery.substring(0, 50) + '...' : initialQuery;

        // Use proper ID generation for initial query
        if (user && !isGuest) {
          try {
            newConversationId = await createConversation(user.uid, truncatedQuery);
            console.log('Created Firebase conversation for initial query:', newConversationId);
          } catch (error) {
            console.error('Failed to create Firebase conversation:', error);
            // Use proper Firebase-compatible ID for offline mode
            newConversationId = generateFirebaseCompatibleId();
          }
        } else {
          // Guest users use proper generated IDs
          newConversationId = generateFirebaseCompatibleId();
        }

        // Add user message first
        const userMessage: Message = {
          id: 'user-initial',
          senderId: CURRENT_USER.id,
          text: initialQuery,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        // Create initial conversation with user message
        const newConversation: Conversation = {
          id: newConversationId,
          title: truncatedQuery,
          preview: initialQuery,
          timestamp: new Date().toISOString(),
          participants: [],
          messages: [userMessage]
        };

        setConversations(prev => [...prev, newConversation]);
        setActiveConversationId(newConversationId);
        setMessages([userMessage]);

        // Save user message to Firebase
        await saveMessageToFirebase(newConversationId, userMessage);

        setIsGenerating(true);
        try {
          // No conversation history for initial query
          const conversationHistory: Array<{ role: string; content: string }> = [];

          // Get AI response
          const responseText = await aiService.getResponse(
            initialQuery,
            userType,
            false,
            conversationHistory
          );

          // Clean and process the response text to ensure completeness
          const cleanedResponseText = typeof responseText === 'string' ? responseText.trim() : responseText;

          // Get follow-up suggestions
          const followUps = await aiService.getQuickActions(cleanedResponseText, userType);

          // Add AI response to messages
          const aiResponse: Message = {
            id: `ai-${Date.now()}`,
            senderId: 'ai',
            text: cleanedResponseText,
            followUps: followUps.length > 0 ? followUps : undefined,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          const updatedMessages = [userMessage, aiResponse];
          setMessages(updatedMessages);

          // Update conversation with AI response for preview
          setConversations(prev => prev.map(conv =>
            conv.id === newConversationId
              ? {
                ...conv,
                preview: responseText.length > 100 ? responseText.substring(0, 100) + '...' : responseText,
                messages: updatedMessages
              }
              : conv
          ));

          // Save AI response to Firebase
          await saveMessageToFirebase(newConversationId, aiResponse);
        } catch (error) {
          console.error("Error processing initial query:", error);
          const errorResponse: Message = {
            id: `error-${Date.now()}`,
            senderId: 'system',
            text: 'Sorry, I encountered an error. Please try again.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages(prev => [...prev, errorResponse]);

          // Update conversation even on error
          setConversations(prev => prev.map(conv =>
            conv.id === newConversationId
              ? {
                ...conv,
                messages: [userMessage, errorResponse]
              }
              : conv
          ));
        } finally {
          setIsGenerating(false);
          processingInitialQuery.current = false;
        }
      };

      processInitialQuery();
    } else if (!initialQuery && hasLoadedSavedConversations && conversations.length > 0 && !activeConversationId) {
      // No initial query, but user has existing conversations - select the most recent one
      const mostRecentConversation = conversations[0];
      if (mostRecentConversation) {
        setActiveConversationId(mostRecentConversation.id);
        setMessages(mostRecentConversation.messages || []);
      }
    }
  }, [initialQuery, userType, hasLoadedSavedConversations, conversations.length, user, isGuest, saveMessageToFirebase, activeConversationId]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Resizer functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const containerWidth = (typeof window !== 'undefined' ? window.innerWidth : 1024) - 288; // Account for sidebar width (w-72 = 288px)
    const newWidth = Math.min(Math.max(300, e.clientX - 280), containerWidth - 300); // Min 300px, max container - 300px
    setChatWidth(newWidth);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Determine if we should show the workspace (hide on mobile)
  const showWorkspace = userType === 'provider' && isProMode && (typeof window !== 'undefined' && window.innerWidth >= 768);

  return (
    <>
      <Toaster position="top-right" />
      <div className="flex h-screen w-screen font-sans">
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onNewChat={handleNewChat}
          onSelectConversation={handleSelectConversation}
          onSelectNote={handleSelectNote}
          onDeleteConversation={handleDeleteConversation}
          userType={userType}
          isProMode={isProMode}
          onToggleProMode={() => {
            const newProMode = !isProMode;
            setIsProMode(newProMode);

            // When switching to pro mode, create a new conversation
            if (newProMode && messages.length > 0) {
              setWasProModeToggled(true);
              handleNewChat();
            }
          }}
          isCollapsed={isSidebarCollapsed}
          setCollapsed={setIsSidebarCollapsed}
          onNavigateToSignUp={onNavigateToSignUp}
          onNavigateToProfile={onNavigateToProfile}
          onLogout={handleLogout}
        />

        <main className="flex-1 flex bg-white min-w-0">
          {/* Chat Column */}
          <div
            className="flex flex-col border-r border-[var(--border)]"
            style={{ width: showWorkspace ? `${chatWidth}px` : '100%' }}
          >
            <header className="px-4 py-2 bg-white border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">

              <div className="flex items-center gap-2.5">
                {/* Mobile sidebar toggle - only show when sidebar is collapsed */}
                {isSidebarCollapsed && (
                  <button
                    onClick={() => setIsSidebarCollapsed(false)}
                    className="md:hidden p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-gray-200 min-h-[36px] min-w-[36px]"
                    aria-label="Open sidebar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 9l3 3-3 3M8 9l3 3-3 3" />
                    </svg>
                  </button>
                )}
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img
                    src={userType === 'provider' && isProMode ? "/Alex.webp" : "/leny.webp"}
                    alt={userType === 'provider' && isProMode ? "Alex AI" : "Leny AI"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-semibold text-base text-gray-900">
                      {userType === 'provider' && isProMode ? 'Alex' : 'Leny'}
                    </h1>
                    <span className="ai-badge text-xs">
                      <svg className="w-2 h-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {userType === 'provider' && isProMode ? 'AI' : 'AI Assistant'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {userType === 'provider' && isProMode ? 'Pro Assistant' : 'Internal medicine specialist'}
                  </p>
                </div>
              </div>
              {/* <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Approach:</span>
                <button
                  onClick={() => setUseFormApproach(!useFormApproach)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${useFormApproach
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                    }`}
                >
                  {useFormApproach ? 'Form Mode' : 'Chat Mode'}
                </button>
              </div> */}

              <div className="flex items-center gap-2">
                {userType === 'provider' && isProMode && (
                  <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                    <button
                      onClick={() => setProModeView('notes')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${proModeView === 'notes'
                        ? 'bg-white text-[var(--accent-blue)] shadow-sm'
                        : 'text-[var(--text-secondary)] hover:bg-gray-200'
                        }`}
                    >
                      📝 Notes
                    </button>
                    <button
                      onClick={() => setProModeView('proactive')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${proModeView === 'proactive'
                        ? 'bg-white text-[var(--accent-orange)] shadow-sm'
                        : 'text-[var(--text-secondary)] hover:bg-gray-200'
                        }`}
                    >
                      💡 Proactive
                    </button>
                  </div>
                )}

                {/* Three dots menu */}
                <div className="relative" ref={headerMenuRef}>
                  <button
                    onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    title="More options"
                  >
                    <DotsVerticalIcon className="w-5 h-5" />
                  </button>
                  {isHeaderMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 animate-fade-in"
                      style={{ animationDuration: '150ms' }}
                    >
                      <button
                        onClick={() => {
                          // TODO: Implement forward functionality
                          setIsHeaderMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <ShareIcon className="w-4 h-4" />
                        <span>Forward</span>
                      </button>

                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => {
                          if (activeConversationId) {
                            handleDeleteConversation(activeConversationId);
                          }
                          setIsHeaderMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto bg-[var(--bg-main)]">
              {/* Welcome message for pro mode */}
              {userType === 'provider' && isProMode && messages.length === 0 && (
                <div className="bg-[#F8F5F1] border-b border-[#E8D5C8] p-4">
                  <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-[#E8D5C8]">
                      <p className="text-gray-700 text-sm leading-relaxed">
                        Hi, Alex here to help you. Enter the case details like "56 yo man with fever and abdominal pain" and I will assist you with diagnosis and treatment recommendations.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="max-w-3xl mx-auto px-4 py-2">
                <div className="space-y-3">
                  {messages.map((msg, index) => {
                    // Handle expert panel selector
                    if (expertPanelState.active && msg.senderId === 'system' && msg.text === '') {
                      return (
                        <ExpertPanelSelector
                          key={msg.id}
                          onSelectionChange={(s) => setExpertPanelState(prev => ({ ...prev, selected: s }))}
                        />
                      );
                    }

                    return (
                      // <MessageBubbleSimple
                      //   key={msg.id}
                      //   message={msg}
                      //   currentUserId={CURRENT_USER.id}
                      //   onFollowupClick={(text) => {
                      //     setInput(text);
                      //   }}
                      // />
                      <MessageBubbleSimple
                        key={msg.id}
                        message={msg}
                        currentUserId={CURRENT_USER.id}
                        onFollowupClick={(text) => {
                          if (text.startsWith('FORM_SUBMISSION:')) {
                            // Handle form submission directly
                            handleSendMessage(text);
                          } else {
                            setInput(text);
                          }
                        }}
                      />
                    );
                  })}
                  {/* Show follow-up loading OR AI loading */}
                  {isGeneratingFollowUps && <MessageBubbleSimple isGeneratingFollowUps />}
                  {isGeneratingForm && <MessageBubbleSimple isGeneratingForm />}
                  {isGenerating && !isGeneratingFollowUps && <MessageBubbleSimple isLoading />}

                  <div ref={messagesEndRef} style={{ height: '1px' }} />
                </div>
              </div>
            </div>

            {/* Quick Reply Bar - shows follow-up questions above input */}
            <QuickReplyBar
              followUps={(() => {
                // Get follow-ups from the last AI message
                const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
                if (lastMessage && lastMessage.senderId === 'ai' && lastMessage.followUps) {
                  return lastMessage.followUps;
                }
                return [];
              })()}
              onFollowupClick={(text) => setInput(text)}
              isUserTyping={input.length > 0}
              shouldAutoHide={true}
            />

            <ChatInput
              input={input}
              setInput={setInput}
              isGenerating={isGenerating}
              onSendMessage={handleSendMessage}
              onStopGeneration={handleStopGeneration}
            />
          </div>

          {/* Resizer */}
          {userType === 'provider' && showWorkspace && (
            <div
              ref={resizeRef}
              className={`w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors ${isResizing ? 'bg-blue-500' : ''
                }`}
              onMouseDown={handleMouseDown}
            />
          )}

          {/* Workspace Column (Pro Mode Only for Providers) */}
          {userType === 'provider' && showWorkspace && (
            <div className="flex-1 flex-col bg-white min-w-0 flex">
              {proModeView === 'notes' && (
                <NotesView
                  title={notesTitle}
                  content={notesContent}
                  onUpdate={(updates) => {
                    if (updates.title !== undefined) setNotesTitle(updates.title);
                    if (updates.content !== undefined) setNotesContent(updates.content);

                    // Save notes as a conversation object with isNote flag
                    const noteId = activeConversationId || `note-${Date.now()}`;
                    const noteConversation: Conversation = {
                      id: noteId,
                      title: updates.title || notesTitle,
                      preview: (updates.content || notesContent).replace(/<[^>]+>/g, '').substring(0, 100) + '...',
                      timestamp: new Date().toISOString(),
                      participants: [],
                      messages: [],
                      isNote: true,
                      notesTitle: updates.title || notesTitle,
                      notesContent: updates.content || notesContent
                    };

                    // Update or create the note conversation
                    setConversations(prev => {
                      const existingIndex = prev.findIndex(c => c.id === noteId);
                      if (existingIndex >= 0) {
                        // Update existing note
                        const updated = [...prev];
                        updated[existingIndex] = noteConversation;
                        return updated;
                      } else {
                        // Create new note
                        setActiveConversationId(noteId);
                        return [...prev, noteConversation];
                      }
                    });
                  }}
                />
              )}
              {proModeView === 'proactive' && (
                <ProactiveWorkspace
                  analysisData={analysisData}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default ChatScreen;

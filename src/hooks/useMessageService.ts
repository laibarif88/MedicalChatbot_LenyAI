import { useState, useCallback } from 'react';
import { UserType, Conversation, Message, QuickAction, ProactiveAnalysis } from '../types';
import { medicalIntegration } from '../services/medicalIntegration';
import { ChatService } from '../services/chatService';
import { showErrorToast, getErrorMessage } from '../utils/errorHandling';
import { generateConversationTitle, generatePreviewText, getFirstUserMessage } from '../utils/conversationUtils';

interface UseMessageServiceProps {
  activeConversationId: string;
  userType: UserType;
  isProactiveMode: boolean;
  chatService: ChatService | null;
  isGuest: boolean;
  currentUserId: string;
  updateConversations: (updater: (prev: Conversation[]) => Conversation[]) => void;
  onAnalysisUpdate?: (analysis: ProactiveAnalysis | null) => void;
  onAnalyzingUpdate?: (isAnalyzing: boolean) => void;
}

export const useMessageService = ({
  activeConversationId,
  userType,
  isProactiveMode,
  chatService,
  isGuest,
  currentUserId,
  updateConversations,
  onAnalysisUpdate,
  onAnalyzingUpdate
}: UseMessageServiceProps) => {
  const [isTyping, setIsTyping] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string, activeConvo: Conversation) => {
    if (!activeConvo) return;

    // Cancel any existing request
    if (abortController) {
      abortController.abort();
    }

    // Create new AbortController for this request
    const controller = new AbortController();
    setAbortController(controller);

    if (userType === 'provider' && isProactiveMode) {
      onAnalysisUpdate?.(null);
      onAnalyzingUpdate?.(true);
    }

    setIsTyping(true);

    try {
      if (chatService && !isGuest) {
        // For authenticated users, use Firebase
        await chatService.sendMessage(activeConversationId, text, 'user');
        
        // Construct conversation history from active conversation messages
        // Include more context for better continuity (last 20 messages = ~10 exchanges)
        // This ensures the AI maintains context when responding to questions
        const conversationHistory = activeConvo.messages.slice(-20).map(msg => ({
          role: msg.senderId === currentUserId ? 'user' : 'assistant',
          content: msg.text
        }));
        
        
        // Get AI response and stream it to UI in real-time with cancellation support
        const stream = await medicalIntegration.streamEnhancedResponse(text, userType, isProactiveMode, conversationHistory, controller);
        let fullResponseText = '';
        
        const aiParticipant = activeConvo.participants.find(p => p.role === 'ai_assistant');
        if (!aiParticipant) {

          setIsTyping(false);
          return;
        }
        
        // Add AI message for real-time streaming updates
        const aiMessageId = `ai-${Date.now()}`;
        const aiMessage: Message = {
          id: aiMessageId,
          senderId: aiParticipant.id,
          text: '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        
        updateConversations(prev =>
          prev.map(convo =>
            convo.id === activeConversationId
              ? { ...convo, messages: [...convo.messages, aiMessage] }
              : convo
          )
        );
        
        // Stream response with smooth, time-based UI updates
        let updateCounter = 0;
        let lastUpdateTime = Date.now();
        const MIN_UPDATE_INTERVAL = 100; // Minimum 100ms between updates for smooth animation
        
        for await (const chunk of stream) {
          fullResponseText = chunk;
          updateCounter++;
          const currentTime = Date.now();
          
          // Update UI based on time interval and word boundaries for smoother experience
          const shouldUpdate = 
            currentTime - lastUpdateTime >= MIN_UPDATE_INTERVAL || // Time-based throttling
            fullResponseText.endsWith(' ') || // Word boundaries
            fullResponseText.endsWith('.') || fullResponseText.endsWith('!') || fullResponseText.endsWith('?') || // Sentence endings
            updateCounter % 10 === 0; // Fallback every 10 characters
          
          if (shouldUpdate) {
            // Clean incomplete HTML tags before rendering to prevent parser errors
            const safeText = sanitizeIncompleteHTML(fullResponseText);
            
            updateConversations(prev =>
              prev.map(convo => {
                if (convo.id === activeConversationId) {
                  const updatedMessages = convo.messages.map(msg =>
                    msg.id === aiMessageId ? { ...msg, text: safeText } : msg
                  );
                  return { ...convo, messages: updatedMessages };
                }
                return convo;
              })
            );
            lastUpdateTime = currentTime;
          }
        }
        
        // Final update to ensure complete text is displayed
        updateConversations(prev =>
          prev.map(convo => {
            if (convo.id === activeConversationId) {
              const updatedMessages = convo.messages.map(msg =>
                msg.id === aiMessageId ? { ...msg, text: fullResponseText } : msg
              );
              return { ...convo, messages: updatedMessages };
            }
            return convo;
          })
        );
        
        // Only set typing to false after streaming is completely done
        setIsTyping(false);
        
        // Process the response (extract quick actions, follow-ups, etc.)
        const { processedText, quickActions, followUps, analysis } = processAIResponse(fullResponseText, userType, isProactiveMode);
        
        // Handle proactive analysis for providers
        if (userType === 'provider' && isProactiveMode) {
          onAnalysisUpdate?.(analysis);
          onAnalyzingUpdate?.(false);
        }
        
        // Update the local message with processed content including follow-ups
        updateConversations(prev =>
          prev.map(convo => {
            if (convo.id === activeConversationId) {
              const updatedMessages = convo.messages.map(msg =>
                msg.id === aiMessageId ? { 
                  ...msg, 
                  text: processedText,
                  quickActions,
                  followUps,
                } : msg
              );
              return { ...convo, messages: updatedMessages };
            }
            return convo;
          })
        );

        // Send final processed message to Firebase
        if (chatService) {
          await chatService.sendMessage(activeConversationId, processedText, 'assistant', quickActions, followUps);
        }
        
      } else {
        // For guests, use localStorage
        const newMessage: Message = {
          id: Date.now().toString(),
          senderId: currentUserId,
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        updateConversations(prev =>
          prev.map(convo => {
            if (convo.id === activeConversationId) {
              const updatedMessages = [...convo.messages, newMessage];
              
              // Check if this is the first user message (excluding welcome messages)
              const isFirstUserMessage = convo.messages.filter(msg => 
                msg.senderId === currentUserId
              ).length === 0;
              
              let updatedTitle = convo.title;
              let updatedPreview = generatePreviewText(text);
              
              // Generate meaningful title for first user message
              if (isFirstUserMessage && convo.title === 'New Conversation') {
                updatedTitle = generateConversationTitle(text);
              }
              
              return {
                ...convo,
                messages: updatedMessages,
                title: updatedTitle,
                preview: updatedPreview,
                timestamp: newMessage.timestamp
              };
            }
            return convo;
          })
        );

        const aiParticipant = activeConvo.participants.find(p => p.role === 'ai_assistant');
        if (!aiParticipant) {

          setIsTyping(false);
          return;
        }

        const aiMessageId = (Date.now() + 1).toString();
        const aiMessage: Message = {
          id: aiMessageId,
          senderId: aiParticipant.id,
          text: '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        
        updateConversations(prev =>
          prev.map(convo =>
            convo.id === activeConversationId
              ? { ...convo, messages: [...convo.messages, aiMessage] }
              : convo
          )
        );

        try {
          // Construct conversation history from active conversation messages
          // Include more context for better continuity (last 20 messages = ~10 exchanges)
          // This ensures the AI maintains context when responding to questions
          const conversationHistory = activeConvo.messages.slice(-20).map(msg => ({
            role: msg.senderId === currentUserId ? 'user' : 'assistant',
            content: msg.text
          }));
          
          
          const stream = await medicalIntegration.streamEnhancedResponse(text, userType, isProactiveMode, conversationHistory, controller);
          let fullResponseText = '';

          let updateCounter = 0;
          let lastUpdateTime = Date.now();
          const MIN_UPDATE_INTERVAL = 100; // Minimum 100ms between updates for smooth animation
          
          for await (const chunk of stream) {
            fullResponseText = chunk;
            updateCounter++;
            const currentTime = Date.now();
            
            // Update UI based on time interval and word boundaries for smoother experience
            const shouldUpdate = 
              currentTime - lastUpdateTime >= MIN_UPDATE_INTERVAL || // Time-based throttling
              fullResponseText.endsWith(' ') || // Word boundaries
              fullResponseText.endsWith('.') || fullResponseText.endsWith('!') || fullResponseText.endsWith('?') || // Sentence endings
              updateCounter % 10 === 0; // Fallback every 10 characters
            
            if (shouldUpdate) {
              // Clean incomplete HTML tags before rendering to prevent parser errors
              const safeText = sanitizeIncompleteHTML(fullResponseText);
              
              updateConversations(prev =>
                prev.map(convo => {
                  if (convo.id === activeConversationId) {
                    const updatedMessages = convo.messages.map(msg =>
                      msg.id === aiMessageId ? { ...msg, text: safeText } : msg
                    );
                    return { ...convo, messages: updatedMessages };
                  }
                  return convo;
                })
              );
              lastUpdateTime = currentTime;
            }
          }
          
          // Final update to ensure complete text is displayed
          updateConversations(prev =>
            prev.map(convo => {
              if (convo.id === activeConversationId) {
                const updatedMessages = convo.messages.map(msg =>
                  msg.id === aiMessageId ? { ...msg, text: fullResponseText } : msg
                );
                return { ...convo, messages: updatedMessages };
              }
              return convo;
            })
          );

          // Process the response
          const { processedText, quickActions, followUps, analysis } = processAIResponse(fullResponseText, userType, isProactiveMode);

          // Handle proactive analysis for providers
          if (userType === 'provider' && isProactiveMode) {
            onAnalysisUpdate?.(analysis);
            onAnalyzingUpdate?.(false);
          }

          // Update final message with processed content
          updateConversations(prev =>
            prev.map(convo => {
              if (convo.id === activeConversationId) {
                const updatedMessages = convo.messages.map(msg =>
                  msg.id === aiMessageId ? { 
                    ...msg, 
                    text: processedText,
                    quickActions,
                    followUps,
                  } : msg
                );
                return { ...convo, messages: updatedMessages, preview: generatePreviewText(processedText) };
              }
              return convo;
            })
          );

          // Only set typing to false after all processing is complete
          setIsTyping(false);

        } catch (error) {
          
          setIsTyping(false);
          onAnalyzingUpdate?.(false);
          
          const errorMessage = getErrorMessage(error);
          showErrorToast({
            message: errorMessage,
            retry: () => sendMessage(text, activeConvo)
          });
          
          updateConversations(prev =>
            prev.map(convo => {
              if (convo.id === activeConversationId) {
                const updatedMessages = convo.messages.map(msg => {
                  if (msg.id === aiMessageId) {
                    return { ...msg, text: "Sorry, I encountered an error. Please try again." };
                  }
                  return msg;
                });
                return { ...convo, messages: updatedMessages };
              }
              return convo;
            })
          );
        }
      }
    } catch (error) {
      
      setIsTyping(false);
      onAnalyzingUpdate?.(false);
      setAbortController(null);
      throw error;
    } finally {
      // Clean up controller reference after completion
      if (controller.signal.aborted) {
        setIsTyping(false);
        onAnalyzingUpdate?.(false);
      }
    }
  }, [
    activeConversationId,
    userType,
    isProactiveMode,
    chatService,
    isGuest,
    currentUserId,
    updateConversations,
    onAnalysisUpdate,
    onAnalyzingUpdate
  ]);

  const stopGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsTyping(false);
      onAnalyzingUpdate?.(false);
    }
  }, [abortController, onAnalyzingUpdate]);

  return {
    sendMessage,
    isTyping,
    stopGeneration
  };
};

// Helper function to process AI response and extract structured data
const processAIResponse = (fullResponseText: string, userType: UserType, isProactiveMode: boolean) => {
  let processedText = fullResponseText;
  let quickActions: QuickAction[] | undefined;
  let followUps: string[] | undefined;
  let analysis: ProactiveAnalysis | null = null;

  // Always provide default quick actions - no need for JSON parsing
  quickActions = getDefaultQuickActions();

  // Extract follow-ups ONLY from explicit <follow_ups> tags to avoid removing actual content
  const followUpsRegex = /<follow_ups>([\s\S]*?)<\/follow_ups>/gi;
  
  // Try to extract follow-ups from <follow_ups> tags
  let followUpsMatch = processedText.match(followUpsRegex);
  
  if (followUpsMatch && followUpsMatch[0]) {
    const fullMatch = followUpsMatch[0];
    const contentMatch = fullMatch.match(/<follow_ups>([\s\S]*?)<\/follow_ups>/i);
    
    if (contentMatch && contentMatch[1]) {
      try {
        let jsonString = contentMatch[1].trim();
        
        // Clean HTML tags FIRST before any other processing
        jsonString = jsonString.replace(/<[^>]*>/g, '');
        
        // Clean up common JSON corruption issues
        jsonString = jsonString.replace(/[\r\n\t]/g, ' ');
        jsonString = jsonString.replace(/\s+/g, ' ');
        
        // Extract only the JSON array part if there's extra text
        const arrayMatch = jsonString.match(/\[[\s\S]*?\]/);
        if (arrayMatch) {
          jsonString = arrayMatch[0];
        }
        
        // Validate and parse JSON
        if (jsonString && jsonString.startsWith('[') && jsonString.endsWith(']')) {
          followUps = JSON.parse(jsonString);
          // Clean HTML tags from follow-ups if present
          if (followUps && Array.isArray(followUps)) {
            followUps = followUps.map(q => {
              if (typeof q === 'string') {
                // Remove HTML tags but keep the text
                return q.replace(/<[^>]*>/g, '').trim();
              }
              return q;
            }).filter(q => q && q.length > 0).slice(0, 3); // Limit to 3
          }
        } else {
          // Try parsing as plain text list if not valid JSON
          const questions = jsonString.split(/(?:<\/b>|"\s*,\s*"|$)/)
            .map(q => q.replace(/<[^>]*>/g, '').replace(/^["'\s]+|["'\s]+$/g, '').trim())
            .filter(q => q.length > 10 && q.includes('?'));
          
          if (questions.length > 0) {
            followUps = questions.slice(0, 3);
          }
        }
      } catch (e) {
        console.warn('Failed to parse follow-ups JSON:', e);
      }
    }
    
    // Remove ONLY the explicit follow_ups tags from the text
    processedText = processedText.replace(followUpsRegex, '').trim();
  }
  
  // Do NOT attempt to extract follow-ups from the body text to avoid removing actual content
  // Only use explicitly tagged follow-ups
  
  // Handle proactive analysis for providers
  if (userType === 'provider' && isProactiveMode) {
    const analysisRegex = /<proactive_analysis>([\s\S]*?)<\/proactive_analysis>/;
    const match = processedText.match(analysisRegex);

    if (match && match[1]) {
      try {
        analysis = JSON.parse(match[1]);
        processedText = processedText.replace(analysisRegex, '').trim();
      } catch (e) {
        console.error('Failed to parse proactive analysis:', e);
        analysis = null;
      }
    }
  }

  // Final cleanup: Remove only explicit markup tags, not content
  processedText = processedText.replace(/\n{3,}/g, '\n\n').trim();
  
  // Log for debugging
  if (followUps && followUps.length > 0) {
    console.log('Extracted follow-up questions:', followUps);
  }

  return {
    processedText,
    quickActions,
    followUps,
    analysis
  };
};

// Helper function to get default quick actions
const getDefaultQuickActions = (): QuickAction[] => [
  { "label": "Copy", "type": "copy" },
  { "label": "Share", "type": "share" },
  { "label": "Sign In for More", "type": "signin" }
];

// Helper function to sanitize incomplete HTML tags during streaming
const sanitizeIncompleteHTML = (text: string): string => {
  // Find the last potential incomplete tag
  const lastOpenBracket = text.lastIndexOf('<');
  
  if (lastOpenBracket === -1) {
    // No HTML tags at all
    return text;
  }
  
  // Check if there's a closing bracket after the last open bracket
  const hasClosingBracket = text.indexOf('>', lastOpenBracket) > -1;
  
  if (!hasClosingBracket) {
    // We have an incomplete tag at the end, remove it
    return text.substring(0, lastOpenBracket);
  }
  
  // Check for incomplete closing tags (e.g., "</b" without ">")
  const lastTag = text.substring(lastOpenBracket);
  
  // Check if this appears to be a self-closing or complete tag
  if (!lastTag.includes('>')) {
    // Incomplete tag, remove it
    return text.substring(0, lastOpenBracket);
  }
  
  // Check for tags that are opened but not closed within the current text
  // This handles cases like "<code>90%" where the closing tag hasn't arrived yet
  const tagMatch = lastTag.match(/<(\w+)([^>]*)>/);
  if (tagMatch && tagMatch[1]) {
    const tagName = tagMatch[1];
    const fullTag = tagMatch[0];
    const tagStart = lastOpenBracket;
    
    // Look for the closing tag
    const closingTag = `</${tagName}>`;
    const remainingText = text.substring(tagStart + fullTag.length);
    
    if (!remainingText.includes(closingTag)) {
      // Tag is opened but not closed, check if it's a self-closing tag
      const selfClosingTags = ['br', 'hr', 'img', 'input', 'meta', 'link'];
      if (!selfClosingTags.includes(tagName.toLowerCase())) {
        // Not self-closing and not closed, so we should wait for the complete tag
        // For now, return text up to this unclosed tag
        return text.substring(0, lastOpenBracket);
      }
    }
  }
  
  return text;
};

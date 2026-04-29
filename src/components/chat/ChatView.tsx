import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Conversation, Message, QuickAction } from '../../types';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { TypingIndicator } from './TypingIndicator';
import ChatInput from './ChatInput';
import ChatHeader from './ChatHeader';
import MessageBubbleSimple from './MessageBubbleSimple';
import QuickReplyBar from './QuickReplyBar';
import { MenuIcon, MoreVertIcon, StarOutlineIcon, TrashIcon } from './Icons';
import { SYSTEM_PARTICIPANT } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../services/logger';


// Fix: Add explicit type definitions for the Web Speech API to resolve TypeScript errors.
// The SpeechRecognition API is not part of the default DOM typings.
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [index: number]: SpeechRecognitionAlternative;
  readonly length: number;
}

interface SpeechRecognitionResultList {
  readonly [index: number]: SpeechRecognitionResult;
  readonly length: number;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionStatic {
    new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

const SystemMessage: React.FC<{ text: string }> = ({ text }) => (
    <div className="text-center text-xs text-gray-500 py-2">
        {text}
    </div>
);

// Helper function to identify welcome messages
const isWelcomeMessage = (messageText: string): boolean => {
    const welcomePatterns = [
        /^Good (morning|afternoon|evening).*how can I help you today\?$/i,
        /^Good (morning|afternoon|evening) \w+.*how can I help you today\?$/i
    ];
    return welcomePatterns.some(pattern => pattern.test(messageText.trim()));
};

const AvatarWithFallback: React.FC<{ 
    src?: string; 
    alt: string; 
    fallbackText: string;
}> = ({ src, alt, fallbackText }) => {
    const [imageError, setImageError] = useState(false);
    
    if (imageError || !src) {
        return (
            <div className="w-8 h-8 rounded-full bg-[#4F79A4] text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
                {fallbackText.toUpperCase()}
            </div>
        );
    }
    
    return (
        <img 
            src={src} 
            alt={alt} 
            className="w-8 h-8 rounded-full flex-shrink-0 object-cover" 
            onError={() => setImageError(true)}
        />
    );
};

const MessageContentRenderer: React.FC<{ htmlContent: string }> = ({ htmlContent }) => {
    // Ideal case: The AI provides correctly formatted HTML with the warning div.
    if (htmlContent.includes('<div class="warning-note">')) {
        return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
    }

    // Fallback case: The AI provides plain text with a '⚠️ Important Note:' marker.
    const warningMarker = '⚠️ Important Note:';
    if (htmlContent.includes(warningMarker)) {
        // Split the content at the first occurrence of the marker.
        // The regex captures the marker and everything after it.
        const parts = htmlContent.split(new RegExp(`(${warningMarker}[\\s\\S]*)`));
        const beforeWarning = parts[0] || '';
        const warningAndAfter = parts[1] || ''; // This is the captured group.
        
        // Find the end of the warning paragraph, marked by a double newline.
        const paragraphBreak = warningAndAfter.indexOf('\n\n');
        
        let warningContent = warningAndAfter;
        let afterWarning = '';

        if (paragraphBreak !== -1) {
            warningContent = warningAndAfter.substring(0, paragraphBreak);
            afterWarning = warningAndAfter.substring(paragraphBreak);
        }

        return (
            <>
                {/* Render the part before the warning. It might contain other HTML. */}
                <div dangerouslySetInnerHTML={{ __html: beforeWarning }} />
                
                {/* Render our formatted warning note. */}
                {warningContent && (
                    <div
                        className="warning-note"
                        dangerouslySetInnerHTML={{ __html: warningContent.replace(warningMarker, `<strong>${warningMarker}</strong>`) }}
                    />
                )}

                {/* Render the rest of the message. It might also contain HTML. */}
                <div dangerouslySetInnerHTML={{ __html: afterWarning }} />
            </>
        );
    }
    
    // Default case: No warning, just render the content as is.
    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};


const AccountPromptBanner: React.FC<{ 
  messageCount: number; 
  onCreateAccount: () => void; 
  onDismiss: () => void;
  isDismissed: boolean;
}> = ({ messageCount, onCreateAccount, onDismiss, isDismissed }) => {
  if (isDismissed || messageCount < 3) return null;

  return (
    <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h3 className="text-sm font-semibold text-gray-800">💡 Loving the conversation?</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            <strong className="text-green-600">Create a FREE account</strong> to save this conversation and access it from any device. 
            <span className="text-xs text-gray-500">({messageCount} messages so far)</span>
          </p>
          <div className="flex gap-2">
            <button 
              onClick={onCreateAccount}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Create Free Account
            </button>
            <button 
              onClick={onDismiss}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
        <button 
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export const ChatView: React.FC<{
  conversation: Conversation;
  onSendMessage: (text: string) => void;
  onToggleSidebar: () => void;
  onOpenInviteModal: () => void;
  onNavigateToSignUp: () => void;
  onToggleFavorite?: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  isTyping: boolean;
  currentUserId: string;
  isProMode?: boolean;
  userType?: 'patient' | 'provider';
  onStopGeneration?: () => void;
}> = ({ conversation, onSendMessage, onToggleSidebar, onOpenInviteModal, onNavigateToSignUp, onToggleFavorite, onDeleteConversation, isTyping, currentUserId, isProMode = false, userType = 'patient', onStopGeneration }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isPromptDismissed, setIsPromptDismissed] = useState(false);
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [currentFollowUps, setCurrentFollowUps] = useState<string[]>([]);
  const [isActuallyTyping, setIsActuallyTyping] = useState(false);

  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const moreOptionsRef = useRef<HTMLDivElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollPositionRef = useRef(0);
  const { isGuest } = useAuth();
  
  // Count user messages (excluding system messages)
  const userMessageCount = conversation.messages.filter(msg => 
    msg.senderId === currentUserId && !msg.isSystemMessage
  ).length;

  // Track follow-ups from the most recent AI message
  useEffect(() => {
    const messages = conversation.messages || [];
    if (!messages || messages.length === 0) {
      setCurrentFollowUps([]);
      return;
    }
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      setCurrentFollowUps([]);
      return;
    }
    
    const sender = conversation.participants.find(p => p.id === lastMessage.senderId);
    const isAiMessage = sender?.role === 'ai_assistant';
    
    // Debug logging
    console.log('Follow-up Debug:', {
      lastMessageId: lastMessage.id,
      isAiMessage,
      hasFollowUps: lastMessage.followUps && lastMessage.followUps.length > 0,
      followUps: lastMessage.followUps
    });
    
    if (isAiMessage && lastMessage.followUps && lastMessage.followUps.length > 0) {
      setCurrentFollowUps(lastMessage.followUps);
    } else if (lastMessage.senderId === currentUserId) {
      // Clear follow-ups when user sends a message
      setCurrentFollowUps([]);
    }
  }, [conversation.messages, conversation.participants, currentUserId]);

  // Improved check if at bottom function with better threshold
  const checkIfAtBottom = useCallback(() => {
    if (!mainRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = mainRef.current;
    // More forgiving threshold - consider "at bottom" if within 50px
    const threshold = 50;
    return scrollHeight - scrollTop - clientHeight <= threshold;
  }, []);
  

  // Enhanced scroll to bottom with smooth behavior
  const scrollToBottom = useCallback((smooth?: boolean) => {
    if (!mainRef.current) return;
    
    // Clear any pending scroll timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Use a small timeout to ensure DOM is updated
    scrollTimeoutRef.current = setTimeout(() => {
      if (mainRef.current) {
        const targetScroll = mainRef.current.scrollHeight - mainRef.current.clientHeight;
        
        if (smooth) {
          mainRef.current.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
          });
        } else {
          mainRef.current.scrollTop = targetScroll;
        }
        setIsAtBottom(true);
        setShowScrollButton(false);
        setUserScrolledUp(false);
      }
    }, 10);
  }, []);

  // Improved scroll event handler
  const handleScroll = useCallback(() => {
    if (!mainRef.current) return;
    
    const currentScrollTop = mainRef.current.scrollTop;
    const atBottom = checkIfAtBottom();
    
    // Detect if user manually scrolled up
    if (currentScrollTop < lastScrollPositionRef.current && !atBottom) {
      setUserScrolledUp(true);
    }
    
    // If user scrolled to bottom manually, reset the flag
    if (atBottom) {
      setUserScrolledUp(false);
      setShowScrollButton(false);
    } else {
      // Show scroll button when not at bottom
      setShowScrollButton(true);
    }
    
    lastScrollPositionRef.current = currentScrollTop;
    setIsAtBottom(atBottom);
  }, [checkIfAtBottom]);

  // Main auto-scroll effect - consolidated logic
  useEffect(() => {
    const shouldAutoScroll = () => {
      // Don't auto-scroll if user manually scrolled up
      if (userScrolledUp) return false;
      
      // Always scroll for user's own messages
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      if (lastMessage && lastMessage.senderId === currentUserId) {
        return true;
      }
      
      // For AI messages during streaming, check if we should auto-scroll
      if (isTyping && mainRef.current) {
        const { scrollHeight, scrollTop, clientHeight } = mainRef.current;
        const contentBelowView = scrollHeight - (scrollTop + clientHeight);
        
        // Stop auto-scrolling if we have significant content below view
        if (contentBelowView > 150) {
          setShowScrollButton(true);
          return false;
        }
      }
      
      // Auto-scroll if already at bottom
      return isAtBottom;
    };
    
    if (shouldAutoScroll()) {
      // Use RAF to ensure DOM is ready
      requestAnimationFrame(() => {
        scrollToBottom(false);
      });
    }
  }, [conversation.messages, currentUserId, isAtBottom, userScrolledUp, isTyping, scrollToBottom]);

  // Special handling for streaming messages - stop when content gets too long
  useEffect(() => {
    if (!isTyping || !mainRef.current) return;
    
    let rafId: number;
    let lastHeight = 0;
    let hasStoppedAutoScroll = false;
    let initialScrollTop = mainRef.current.scrollTop;
    
    const smoothFollow = () => {
      if (!mainRef.current || userScrolledUp) return;
      
      const { scrollTop, scrollHeight, clientHeight } = mainRef.current;
      const currentHeight = scrollHeight;
      
      // Calculate total content height vs viewport
      const totalContentHeight = scrollHeight - clientHeight;
      const currentScrollPosition = scrollTop;
      
      // Calculate how much new content has been added since streaming started
      const newContentHeight = currentHeight - lastHeight;
      
      // Stop auto-scrolling when:
      // 1. We have significant unviewed content below (more than 150px)
      // 2. The message is getting very long (scrollHeight > 2x viewport)
      const contentBelowView = scrollHeight - (scrollTop + clientHeight);
      const messageGettingLong = scrollHeight > (clientHeight * 2);
      const shouldStopScrolling = (contentBelowView > 150 || messageGettingLong) && !hasStoppedAutoScroll;
      
      if (shouldStopScrolling) {
        hasStoppedAutoScroll = true;
        setShowScrollButton(true);
        setIsAtBottom(false);
        // Keep the user's current view stable
        return;
      }
      
      // Only continue scrolling if we haven't stopped
      if (!hasStoppedAutoScroll && currentHeight !== lastHeight) {
        // Smooth scroll to show new content
        const targetScroll = scrollHeight - clientHeight;
        const scrollDiff = targetScroll - scrollTop;
        
        // Smooth animation for small changes, instant for large changes
        if (scrollDiff < 100) {
          mainRef.current.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
          });
        } else {
          mainRef.current.scrollTop = targetScroll;
        }
        
        lastHeight = currentHeight;
      }
      
      if (isTyping && !userScrolledUp && !hasStoppedAutoScroll) {
        rafId = requestAnimationFrame(smoothFollow);
      }
    };
    
    // Start tracking height
    lastHeight = mainRef.current.scrollHeight;
    rafId = requestAnimationFrame(smoothFollow);
    
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isTyping, userScrolledUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleToggleListening = () => {
    if (isListening) {
      speechRecognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Sorry, your browser doesn't support speech recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      logger.error('Speech recognition error', { error: event.error });
      setIsListening(false);
    };
    
    let finalTranscript = '';
    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            if (result && result[0]) {
                const transcript = result[0].transcript;
                if (result.isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
        }
        setInput(finalTranscript + interimTranscript);
    };
    
    recognition.start();
    speechRecognitionRef.current = recognition;
  };
  
  // Cleanup speech recognition on component unmount
  useEffect(() => {
    return () => {
      speechRecognitionRef.current?.stop();
    };
  }, []);

  // Handle click outside for more options dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target as Node)) {
        setIsMoreOptionsOpen(false);
      }
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setIsPlusMenuOpen(false);
      }
    };

    if (isMoreOptionsOpen || isPlusMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreOptionsOpen, isPlusMenuOpen]);

  const handleToggleFavorite = () => {
    onToggleFavorite?.(conversation.id);
    setIsMoreOptionsOpen(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
    setIsMoreOptionsOpen(false);
  };

  const handleConfirmDelete = () => {
    onDeleteConversation?.(conversation.id);
    setShowDeleteModal(false);
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Handle image upload logic here
        // You can add actual upload logic here
      }
    };
    input.click();
    setIsPlusMenuOpen(false);
  };

  const handleInviteParticipant = () => {
    onOpenInviteModal();
    setIsPlusMenuOpen(false);
  };

  const handleSend = (text: string) => {
    if (text.trim()) {
      if (isListening) {
        speechRecognitionRef.current?.stop();
      }
      onSendMessage(text.trim());
      setInput('');
      
      // Reset scroll state and force scroll to bottom
      setUserScrolledUp(false);
      // Small delay to ensure message is added to DOM
      setTimeout(() => {
        scrollToBottom(true);
      }, 50);
    }
  };
  

  const handleFollowupClick = (text: string) => {
    setInput(text);
    setIsActuallyTyping(false); // Not typing, just selected a follow-up
    // Input should be cleared after sending
  };

  // Improved quick action handler
  const handleQuickActionClick = (action: QuickAction, messageText: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = messageText;
    const cleanText = tempDiv.textContent || tempDiv.innerText || '';

    if (action.type === 'copy') {
        navigator.clipboard.writeText(cleanText).catch(err => {
            logger.error('Failed to copy message', err);
        });
    } else if (action.type === 'share') {
        const shareData = {
            title: `Medical Information from Leny AI`,
            text: cleanText,
        };
        if (navigator.share) {
            navigator.share(shareData).catch(err => logger.error('Error sharing', err));
        } else {
            navigator.clipboard.writeText(cleanText).then(() => {
                alert('Message copied to clipboard. You can now paste it to share.');
            }).catch(err => {
                logger.error('Failed to copy message', err);
            });
        }
    }
  };

  const participantNames = conversation.participants.map(p => p.id === currentUserId ? 'You' : p.name).join(', ');

  return (
    <div className="flex-1 flex flex-col bg-[#FAF6F2] h-full">
      <ChatHeader
         conversation={conversation}
         currentUserId={currentUserId}
         onToggleSidebar={onToggleSidebar}
         onForward={() => {}}
         onDelete={handleDeleteClick}
         isMoreOptionsOpen={isMoreOptionsOpen}
         setIsMoreOptionsOpen={setIsMoreOptionsOpen}
         isProMode={isProMode}
         userType={userType}
       />
       
       {/* Welcome message for pro mode */}
       {userType === 'provider' && isProMode && conversation.messages.length === 0 && (
         <div className="bg-[#F8F5F1] p-4">
           <div className="max-w-4xl mx-auto">
             <div className="bg-white rounded-lg p-4 shadow-sm border border-[#E8D5C8]">
               <p className="text-gray-700 text-sm leading-relaxed">
                 Hi, Alex here to help you. Enter the case details like "56 yo man with fever and abdominal pain" and I will assist you.
               </p>
             </div>
           </div>
         </div>
       )}
       
       <main 
        ref={mainRef}
        className="flex-1 overflow-y-auto relative flex justify-center" 
        style={{padding: '20px 0'}}
        onScroll={handleScroll}
      >
        {/* Scroll to bottom button - shows during streaming or when scrolled up */}
        {showScrollButton && (
          <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 animate-fade-in">
            <button
              onClick={() => {
                setUserScrolledUp(false);
                setIsAtBottom(true);
                setShowScrollButton(false);
                scrollToBottom(true);
              }}
              className="bg-white hover:bg-gray-50 text-gray-700 rounded-full shadow-lg border border-gray-200 p-3 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              title={isTyping ? "New messages below" : "Scroll to bottom"}
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 20 20" 
                fill="none" 
                className="text-[#C97A20]"
              >
                <path 
                  d="M10 3L10 17M10 17L17 10M10 17L3 10" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {isTyping && (
              <div className="absolute -top-1 -right-1">
                <div className="w-3 h-3 bg-[#C97A20] rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-[#C97A20] rounded-full animate-ping"></div>
              </div>
            )}
          </div>
        )}
        
        {/* Centered message container */}
        <div className="w-full max-w-4xl">
          <div className="space-y-6 py-4">
          {/* Single, clean message rendering loop */}
          {conversation.messages.map((msg, index) => {
              if (msg.isSystemMessage || msg.senderId === SYSTEM_PARTICIPANT.id) {
                  return <SystemMessage key={msg.id} text={msg.text} />;
              }
              const isLastMessage = index === conversation.messages.length - 1;
              const sender = conversation.participants.find(p => p.id === msg.senderId);
              const isAiMessage = sender?.role === 'ai_assistant';
              const isComplete = !(isTyping && isLastMessage && isAiMessage);
              
              // Don't render MessageBubble for empty AI messages during initial streaming
              if (isAiMessage && isTyping && isLastMessage && msg.text.trim() === '') {
                  return null;
              }
              
              return (
                <MessageBubbleSimple 
                  key={msg.id}
                  message={msg} 
                  currentUserId={currentUserId} 
                  onFollowupClick={handleFollowupClick} 
                  isWelcomeMessage={isWelcomeMessage(msg.text)} 
                />
              );
          })}
          
          {/* Enhanced TypingIndicator logic */}
          {isTyping && (() => {
              const lastMessage = conversation.messages[conversation.messages.length - 1];
              if (!lastMessage) {
                  // No messages yet - show loading messages without bubble
                  return <TypingIndicator showBubble={false} />;
              }
              
              const sender = conversation.participants.find(p => p.id === lastMessage.senderId);
              const isAiMessage = sender?.role === 'ai_assistant';
              
              // Show TypingIndicator without bubble if:
              // 1. Last message is from user, OR
              // 2. Last message is from AI but is empty (streaming hasn't started yet)
              if (!isAiMessage || (isAiMessage && lastMessage.text.trim() === '')) {
                  return <TypingIndicator showBubble={false} />;
              }
              
              return null; // MessageBubble handles the streaming display
          })()}
          
          {/* Show account creation prompt for guest users */}
          {isGuest && (
            <AccountPromptBanner 
              messageCount={userMessageCount}
              onCreateAccount={onNavigateToSignUp}
              onDismiss={() => setIsPromptDismissed(true)}
              isDismissed={isPromptDismissed}
            />
          )}
          
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>
      
      {/* Quick Reply Bar - shows follow-ups above input */}
      <QuickReplyBar
        followUps={currentFollowUps}
        onFollowupClick={handleFollowupClick}
        isUserTyping={isActuallyTyping}
        shouldAutoHide={true}
      />
      
      {/* Clean footer with new ChatInput component - exactly matching components-medical */}
      <ChatInput
        input={input}
        setInput={(value) => {
          setInput(value);
          // Only set typing to true if input is being modified and not empty
          setIsActuallyTyping(value.length > 0 && value !== input);
        }}
        isGenerating={isTyping}
        onSendMessage={handleSend}
        onStopGeneration={onStopGeneration}
      />
      
      {showDeleteModal && (
        <DeleteConfirmationModal
          conversationTitle={conversation.title}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
      

     </div>
   );
};

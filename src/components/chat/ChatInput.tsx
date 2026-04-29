import React, { useRef, useEffect, useState } from 'react';
import { ArrowRightIcon, PlusIcon } from './Icons';
import { InviteParticipantModal } from '../modals/InviteParticipantModal';

// Pause/Stop icon component
const PauseIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isGenerating: boolean;
  onSendMessage: (text: string) => void;
  onStopGeneration?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  input, 
  setInput, 
  isGenerating, 
  onSendMessage,
  onStopGeneration
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isPlusDropdownOpen, setIsPlusDropdownOpen] = useState(false);
  const plusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
      
      // Dynamic border radius - pill form when single line, rounded rectangle when expanded
      const isExpanded = scrollHeight > 56; // Approximate single line height
      textareaRef.current.style.borderRadius = isExpanded ? '16px' : '28px'; // 28px creates pill shape for the height
    }
  }, [input]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (plusDropdownRef.current && !plusDropdownRef.current.contains(event.target as Node)) {
        setIsPlusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Set initial pill shape on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.borderRadius = '28px';
    }
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        onSendMessage(input.trim());
        setInput(''); // Clear input after sending
      }
    }
  };
  
  const handleSendClick = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput(''); // Clear input after sending
    }
  };

  const handleInvite = (email: string) => {
    // TODO: Implement actual invite functionality
    console.log('Inviting:', email);
    // For now, just close the modal
    setShowInviteModal(false);
    // In the future, this will send an invitation via the backend
  };

    return (
        <>
        <div className="p-2 md:p-4 flex-shrink-0 bg-[var(--bg-main)]">
            <div className="flex justify-center">
                <div className="max-w-2xl w-full">
                    <div className="relative flex items-end">
                        <div ref={plusDropdownRef} className="absolute left-4 top-1/2 -translate-y-1/2">
                            <button 
                                onClick={() => setIsPlusDropdownOpen(!isPlusDropdownOpen)}
                                className="flex items-center justify-center text-[var(--accent-orange)] hover:text-[#B56E1B] transition-colors"
                                title="More options"
                            >
                                <PlusIcon className="w-6 h-6 stroke-[2.5]" />
                            </button>
                            
                            {isPlusDropdownOpen && (
                                 <div className="absolute bottom-full left-0 mb-2 bg-white border border-[var(--border-light)] rounded-lg shadow-lg py-1 min-w-[140px] z-50">
                                     <button
                                          onClick={() => {
                                              setShowInviteModal(true);
                                              setIsPlusDropdownOpen(false);
                                          }}
                                          className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-gray-50 flex items-center gap-2 whitespace-nowrap"
                                      >
                                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                          </svg>
                                          Add a contact
                                      </button>
                                 </div>
                             )}
                        </div>
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your question..."
                            className="w-full py-3.5 pl-14 pr-14 text-base bg-white border border-[var(--border-light)] rounded-full outline-none focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-orange-100 resize-none overflow-y-hidden overscroll-behavior-contain transition-all"
                            style={{ maxHeight: '120px' }}
                        />
                        {isGenerating ? (
                            <button 
                                onClick={() => onStopGeneration?.()} 
                                className="absolute right-2 bottom-1.5 w-10 h-10 rounded-full bg-gray-600 text-white flex items-center justify-center transition hover:bg-gray-700"
                                title="Stop generating"
                            >
                                <PauseIcon className="w-4 h-4" />
                            </button>
                        ) : (
                            <button 
                                onClick={handleSendClick} 
                                disabled={!input.trim()} 
                                className="absolute right-2 bottom-1.5 w-10 h-10 rounded-full bg-[var(--accent-orange)] text-white flex items-center justify-center transition hover:bg-[#B56E1B] disabled:bg-gray-300"
                            >
                                <ArrowRightIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
        
        {/* Invite Participant Modal */}
        {showInviteModal && (
            <InviteParticipantModal
                onClose={() => setShowInviteModal(false)}
                onInvite={handleInvite}
            />
        )}
        </>
  );
};

export default ChatInput;

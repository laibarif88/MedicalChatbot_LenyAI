import React, { useState, useEffect } from 'react';
import { Message } from '../../types';

const loadingMessages = [
  "Analyzing your query...",
  "Consulting clinical knowledge base...",
  "Cross-referencing medical data...",
  "Formatting response...",
  "Just a moment while I check on that...",
  "Preparing your clinical insights...",
];

interface MessageBubbleProps {
  message?: Message;
  isLoading?: boolean;
  currentUserId?: string;
  onFollowupClick?: (text: string) => void;
  specialtyColor?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isLoading, 
  currentUserId,
  onFollowupClick,
  specialtyColor 
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("Leny is thinking...");
  
  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;
    let messageInterval: NodeJS.Timeout | null = null;

    if (isLoading) {
      setElapsedSeconds(0);
      setLoadingMessage("Leny is thinking...");

      timerInterval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

      messageInterval = setInterval(() => {
        const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
        if (randomMessage) {
          setLoadingMessage(randomMessage);
        }
      }, 3000);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
      if (messageInterval) clearInterval(messageInterval);
    };
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex w-full animate-fadeIn justify-start">
        <div className="w-full max-w-[80%]">
          <div className="border border-[var(--border)] rounded-lg p-3 bg-white shadow-sm">
            <div className="flex justify-between items-center">
              <p className="text-sm text-[var(--text-secondary)]">
                {loadingMessage}
                <span className="thinking-dots">
                  <span>.</span><span>.</span><span>.</span>
                </span>
              </p>
              <span className="text-xs text-[var(--text-meta)] font-mono flex-shrink-0 ml-4">{elapsedSeconds}s</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!message) return null;

  const isUser = currentUserId && message.senderId === currentUserId;
  const isSystem = message.senderId === 'system';
  
  // Don't render AI messages with empty text (while streaming is starting)
  if (!isUser && !isSystem && (!message.text || message.text.trim() === '')) {
    return null;
  }
  
  const formatText = (text: string) => {
    // Normalize excessive line breaks (3+ consecutive newlines become 2)
    let normalizedText = text.replace(/\n{3,}/g, '\n\n');
    
    // Split text into lines
    const lines = normalizedText.split('\n');
    
    return (
      <>
        {lines.map((line, idx) => {
          // Check if this line contains multiple questions that should be split
          if (line.includes('?') && (line.match(/\?/g) || []).length > 1) {
            // Split questions but keep the question mark with each question
            const questions = line.split(/\?\s+/).map((q, i, arr) => 
              i < arr.length - 1 ? q + '?' : q
            ).filter(q => q.trim());
            
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <br />}
                {questions.map((question, qIdx) => (
                  <React.Fragment key={`${idx}-q-${qIdx}`}>
                    {qIdx > 0 && <br />}
                    {question}
                  </React.Fragment>
                ))}
              </React.Fragment>
            );
          }
          
          // Process markdown formatting within each line
          const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={`${idx}-${i}`}>{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return <em key={`${idx}-${i}`}>{part.slice(1, -1)}</em>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return <code key={`${idx}-${i}`} className="bg-gray-100 text-red-500 rounded px-1 py-0.5 text-sm">{part.slice(1, -1)}</code>;
            }
            return part;
          });
          
          return (
            <React.Fragment key={idx}>
              {idx > 0 && <br />}
              {parts}
            </React.Fragment>
          );
        })}
      </>
    );
  };

  // System messages (like expert panel selector placeholder)
  if (isSystem && message.text === '') {
    return null; // Let the parent handle rendering the selector
  }

  if (isUser) {
    return (
      <div className="flex w-full animate-fadeIn justify-end">
        <div className="max-w-[80%] rounded-xl px-3 pt-3 pb-2 shadow-sm border bg-[var(--bg-user-message)] border-[var(--border)]">
          <div className="text-base text-[var(--bg-user-message-text)] leading-relaxed">
            {formatText(message.text)}
          </div>
          <div className="text-right text-sm text-[var(--bg-user-message-text)] opacity-80 mt-1">
            {message.timestamp}
          </div>
        </div>
      </div>
    );
  }

  // AI/Model message with optional specialty color
  return (
    <div className="w-full animate-fadeIn">
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-xl p-3 shadow-sm border bg-white border-[var(--border-light)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
              <img 
                src="/leny.webp" 
                alt="Leny AI" 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-base" style={{ color: specialtyColor || 'var(--accent-orange)' }}>
              Leny AI
            </span>
          </div>
          <div className="pl-11">
            <div className="text-base text-[var(--text-primary)] leading-relaxed">
              {formatText(message.text)}
            </div>
            <div className="text-right text-sm text-[var(--text-meta)] mt-1">
              {message.timestamp}
            </div>
            
            {/* Follow-up suggestions removed - using natural ending questions instead */}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end mt-2">
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1">
            <ActionButton 
              icon={ClipboardCopyIcon} 
              label="Copy" 
              onClick={() => {
                navigator.clipboard.writeText(message.text);
              }} 
            />
            <ActionButton icon={ShareIcon} label="Share" onClick={() => {}} />
            <ActionButton icon={ThumbsUpIcon} label="Good response" onClick={() => {}} />
            <ActionButton icon={ThumbsDownIcon} label="Bad response" onClick={() => {}} />
          </div>
          <p className="text-sm text-[var(--text-meta)] italic mt-1">
            Not medical advice. Verify the information.
          </p>
        </div>
      </div>
    </div>
  );
};

// Icon Components
const BotIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 7h2a5 5 0 0 1 5 5v4a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V6a5 5 0 0 1 5-5Z"/>
    <path d="M9 7H7a5 5 0 0 0-5 5v4a5 5 0 0 0 5 5h2a5 5 0 0 0 5-5V6a5 5 0 0 0-5-5Z"/>
    <path d="M12 16v-4"/>
    <path d="M12 8h.01"/>
  </svg>
);

const ClipboardCopyIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const ShareIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
  </svg>
);

const ThumbsUpIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
  </svg>
);

const ThumbsDownIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3h7.28z" />
  </svg>
);

const ActionButton: React.FC<{ icon: React.FC<{className?: string}>, label: string, onClick: () => void }> = ({ 
  icon: Icon, 
  label, 
  onClick 
}) => (
  <button 
    onClick={onClick}
    title={label}
    className="p-1.5 rounded-full text-[var(--text-meta)] hover:bg-gray-100 hover:text-[var(--text-primary)] transition-colors"
  >
    <Icon className="w-4 h-4" />
  </button>
);

export default MessageBubble;

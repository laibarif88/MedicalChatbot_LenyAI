import React, { useState, useRef, useEffect } from 'react';
import { Conversation } from '../../types';
import { ChevronDownIcon, ShareIcon, TrashIcon } from './Icons';

interface ChatItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  isCollapsed: boolean;
  onDelete: (conversationId: string) => void;
}

const ChatItem: React.FC<ChatItemProps> = ({ 
  conversation, 
  isActive, 
  onClick, 
  isCollapsed, 
  onDelete 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  if (isCollapsed) {
    return (
      <button
        onClick={onClick}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
          isActive 
            ? 'bg-orange-100 text-[var(--accent-orange)]' 
            : 'text-[var(--text-secondary)] hover:bg-gray-100'
        }`}
        title={conversation.title || 'Untitled Chat'}
      >
        <div className="w-10 h-10 rounded-full overflow-hidden">
          <img 
            src="/leny.webp" 
            alt="Leny AI" 
            className="w-full h-full object-cover"
          />
        </div>
      </button>
    );
  }

  const truncateTitle = (title: string, maxLength: number = 30) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  const formattedTime = conversation.timestamp 
    ? new Date(conversation.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '';

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-all ${
        isActive 
          ? 'bg-orange-100' 
          : 'hover:bg-gray-50'
      }`}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${isActive ? 'text-[var(--accent-orange)]' : 'text-[var(--text-secondary)]'}`}>
        <div className="w-10 h-10 rounded-full overflow-hidden">
          <img 
            src="/leny.webp" 
            alt="Leny AI" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className={`text-sm font-semibold truncate pr-2 ${isActive ? 'text-[var(--accent-orange)]' : 'text-[var(--text-primary)]'}`}>
            Leny AI
          </p>
        </div>
        {conversation.preview && conversation.preview !== 'New conversation' && (
          <p className="text-xs truncate text-[var(--text-secondary)]">
            {conversation.preview}
          </p>
        )}
      </div>

      {/* Timestamp and Menu */}
      <div className="flex flex-col items-end flex-shrink-0 self-start space-y-1">
        <time className="text-xs text-[var(--text-meta)]">{formattedTime}</time>
        <div className="relative h-5" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(prev => !prev);
            }}
            className="p-0.5 rounded-full text-[var(--text-meta)] opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
            aria-label="Conversation options"
          >
            <ChevronDownIcon className="w-5 h-5" />
          </button>
          {isMenuOpen && (
            <div className="absolute top-full right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-100 z-20">
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  alert('Forward not implemented'); 
                  setIsMenuOpen(false); 
                }}
                className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-gray-100 flex items-center gap-2"
              >
                <ShareIcon className="w-4 h-4" />
                Forward
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conversation.id);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatItem;

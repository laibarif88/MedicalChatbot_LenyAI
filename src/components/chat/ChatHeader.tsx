import React from 'react';
import { Conversation } from '../../types';
import { MenuIcon, MoreVertIcon, ShareIcon, TrashIcon } from './Icons';

interface ChatHeaderProps {
  conversation: Conversation;
  currentUserId: string;
  onToggleSidebar: () => void;
  onForward?: () => void;
  onDelete?: () => void;
  isMoreOptionsOpen: boolean;
  setIsMoreOptionsOpen: (open: boolean) => void;
  isProMode?: boolean;
  userType?: 'patient' | 'provider';
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  currentUserId,
  onToggleSidebar,
  onForward,
  onDelete,
  isMoreOptionsOpen,
  setIsMoreOptionsOpen,
  isProMode = false,
  userType = 'patient'
}) => {
  const participantNames = conversation.participants
    .map(p => p.id === currentUserId ? 'You' : p.name)
    .join(', ');

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-3 p-3.5 bg-white border-b border-[#E8D5C8] shadow-sm flex-shrink-0 safe-area-inset-top">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onToggleSidebar} className="md:hidden text-[#5C4A3F]">
          <MenuIcon />
        </button>
        <div className="relative">
          <div className="flex -space-x-3">
            {conversation.participants.filter(p => p.id !== currentUserId).slice(0, 3).map(p => (
              <img 
                key={p.id} 
                src={p.avatarUrl} 
                alt={p.name} 
                className="w-10 h-10 rounded-full object-cover border-2 border-white"
              />
            ))}
          </div>
          {conversation.participants.length > 0 && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#6B8068] rounded-full border-2 border-white"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-sm font-semibold text-[#C97A20] truncate">
              {userType === 'provider' && isProMode ? 'Alex' : (conversation.participants.find(p => p.role === 'ai_assistant')?.name || conversation.title)}
            </h2>
            {userType === 'provider' && isProMode ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#6B8068]/10 text-[#6B8068] border border-[#6B8068]/20">
                AI
              </span>
            ) : (
              conversation.participants.find(p => p.role === 'ai_assistant' && p.specialty) && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#6B8068]/10 text-[#6B8068] border border-[#6B8068]/20">
                  {conversation.participants.find(p => p.role === 'ai_assistant')?.specialty}
                </span>
              )
            )}
          </div>
          <p className="text-xs text-gray-500 truncate leading-tight" title={participantNames}>
            {userType === 'provider' && isProMode ? 'Pro Assistant' : participantNames}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button 
            onClick={() => setIsMoreOptionsOpen(!isMoreOptionsOpen)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="More options"
          >
            <MoreVertIcon />
          </button>
          {isMoreOptionsOpen && (
            <div 
              className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 animate-fade-in" 
              style={{ animationDuration: '150ms' }}
            >
              <button
                onClick={() => {
                  onForward?.();
                  setIsMoreOptionsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ShareIcon />
                <span>Forward</span>
              </button>

              <div className="border-t border-gray-100 my-1"></div>
              <button
                onClick={() => {
                  onDelete?.();
                  setIsMoreOptionsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <TrashIcon />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;

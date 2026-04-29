import React from 'react';
import { Conversation } from '../../types';

interface NoteItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  isCollapsed: boolean;
}

const NoteItem: React.FC<NoteItemProps> = ({ 
  conversation, 
  isActive, 
  onClick, 
  isCollapsed 
}) => {
  if (isCollapsed) {
    return (
      <button
        onClick={onClick}
        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
          isActive 
            ? 'bg-[var(--accent-blue)] text-white' 
            : 'text-[var(--text-secondary)] hover:bg-gray-200'
        }`}
        title={conversation.notesTitle || conversation.title || 'Untitled Note'}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    );
  }

  const truncateTitle = (title: string, maxLength: number = 30) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  const getPreview = (content: string | undefined): string => {
    if (!content) return 'Empty note';
    // Strip HTML tags and get plain text
    const plainText = content.replace(/<[^>]+>/g, '');
    // Truncate to 50 characters
    return plainText.length > 50 ? plainText.substring(0, 50) + '...' : plainText;
  };

  const formattedDate = conversation.timestamp 
    ? new Date(conversation.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })
    : '';

  const noteTitle = conversation.notesTitle || conversation.title || 'Untitled Note';
  const noteContent = conversation.notesContent || '';

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-start gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${
        isActive 
          ? 'bg-[var(--accent-blue)] text-white' 
          : 'hover:bg-gray-100 text-[var(--text-secondary)]'
      }`}
    >
      <div className="flex-shrink-0 mt-0.5">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-[var(--text-primary)]'}`}>
          {truncateTitle(noteTitle)}
        </p>
        <p className={`text-xs line-clamp-2 mt-0.5 ${isActive ? 'text-white/80' : 'text-[var(--text-meta)]'}`}>
          {getPreview(noteContent)}
        </p>
        <p className={`text-xs mt-1 ${isActive ? 'text-white/60' : 'text-[var(--text-meta)]'}`}>
          {formattedDate}
        </p>
      </div>
    </div>
  );
};

export default NoteItem;

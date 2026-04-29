import React, { useState, useRef, useEffect } from 'react';
import { Conversation, UserType } from '../../types';
import ChatItem from './ChatItem';
import NoteItem from './NoteItem';
import { 
  PlusIcon, 
  ChevronDownIcon, 
  SearchIcon,
  ChevronsLeft,
  ChevronsRight,
  UserIcon,
  ArrowRightIcon
} from './Icons';
import { DEFAULT_NOTE_CONTENT } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import SettingsScreen from '../../screens/SettingsScreen';
import LanguageScreen from '../../screens/LanguageScreen';
import PreferencesScreen from '../../screens/PreferencesScreen';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onNewChat: (initialQuery?: string) => void;
  onSelectConversation: (id: string) => void;
  onSelectNote?: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  userType: UserType;
  isProMode: boolean;
  onToggleProMode: () => void;
  isCollapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onNavigateToSignUp: () => void;
  onNavigateToProfile: () => void;
  onLogout?: () => Promise<void>;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  conversations, 
  activeConversationId, 
  onNewChat, 
  onSelectConversation, 
  onSelectNote,
  onDeleteConversation, 
  userType,
  isProMode, 
  onToggleProMode,
  isCollapsed,
  setCollapsed,
  onNavigateToSignUp,
  onNavigateToProfile,
  onLogout
}) => {
  const { user, isGuest, logout } = useAuth();
  const [isConversationsExpanded, setIsConversationsExpanded] = useState(true);
  const [isNotesExpanded, setIsNotesExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isPlusDropdownOpen, setIsPlusDropdownOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'settings' | 'language' | 'preferences' | null>(null);
  const [showAllConversations, setShowAllConversations] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const plusDropdownRef = useRef<HTMLDivElement>(null);

  const lowerCaseSearchTerm = searchTerm.toLowerCase();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (plusDropdownRef.current && !plusDropdownRef.current.contains(event.target as Node)) {
        setIsPlusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileMenuAction = (action: string) => {
    setIsProfileDropdownOpen(false);
    
    switch (action) {
      case 'profile':
        onNavigateToProfile();
        break;
      case 'settings':
        setActiveModal('settings');
        break;
      case 'language':
        setActiveModal('language');
        break;
      case 'preferences':
        setActiveModal('preferences');
        break;
      case 'logout':
        if (onLogout) {
          onLogout();
        } else {
          logout();
        }
        break;
      default:
        break;
    }
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const filteredConversations = conversations
    .filter(c => {
      if (!c || c.isNote) return false;
      if (typeof c.title !== 'string' || !c.title) return false;
      return c.title.toLowerCase().includes(lowerCaseSearchTerm);
    })
    .sort((a, b) => {
      // Sort by timestamp in descending order (newest first)
      const timestampA = new Date(a.timestamp).getTime();
      const timestampB = new Date(b.timestamp).getTime();
      return timestampB - timestampA;
    });

  // Limit conversations to 5 most recent unless showing all or searching
  const displayedConversations = searchTerm || showAllConversations 
    ? filteredConversations 
    : filteredConversations.slice(0, 5);
  
  const hasMoreConversations = filteredConversations.length > 5 && !searchTerm;

  const filteredNotes = conversations
    .filter(c => {
      if (!c) return false;
      
      const isExplicitNote = c.isNote;
      const isImplicitNote = c.notesContent && c.notesContent !== DEFAULT_NOTE_CONTENT && c.messages && Array.isArray(c.messages) && c.messages.some(m => m.senderId === 'user');
      
      if (!isExplicitNote && !isImplicitNote) return false;

      const titleMatch = typeof c.notesTitle === 'string' && c.notesTitle && c.notesTitle.toLowerCase().includes(lowerCaseSearchTerm);
      const contentMatch = typeof c.notesContent === 'string' && c.notesContent && c.notesContent.toLowerCase().replace(/<[^>]+>/g, '').includes(lowerCaseSearchTerm);
      
      return titleMatch || contentMatch;
    })
    .sort((a, b) => {
      // Sort by timestamp in descending order (newest first)
      const timestampA = new Date(a.timestamp).getTime();
      const timestampB = new Date(b.timestamp).getTime();
      return timestampB - timestampA;
    });

  if (isCollapsed) {
    return (
      <>
        {/* Desktop collapsed sidebar */}
        <aside className="hidden md:flex h-full bg-white border-r border-[var(--border)] flex-col items-center py-4 px-2 transition-all duration-300 ease-in-out w-16">
          <header className="mb-4">
            <button 
              onClick={() => setCollapsed(!isCollapsed)} 
              className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-gray-200"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
          </header>
          
          <div className="flex-1 flex items-start pt-2 justify-center">
            <button 
              onClick={() => onNewChat()}
              title="New Chat"
              className="w-9 h-9 bg-[var(--accent-orange)] text-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md hover:bg-[#B56E1B] transition-all duration-200 hover:scale-105"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>

          <footer className="pb-2">
            {user && !isGuest ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  title={user.displayName || "Profile Menu"}
                  className="w-9 h-9 rounded-full bg-[var(--accent-orange)] flex items-center justify-center text-white font-semibold text-sm hover:bg-[#B56E1B] transition-all duration-200"
                >
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </button>
                
                {isProfileDropdownOpen && (
                  <div className="absolute bottom-0 left-full ml-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
                    <button
                      onClick={() => handleProfileMenuAction('profile')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => handleProfileMenuAction('settings')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Settings
                    </button>
                    <button
                      onClick={() => handleProfileMenuAction('language')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Language
                    </button>
                    <button
                      onClick={() => handleProfileMenuAction('preferences')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Preferences
                    </button>
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={() => handleProfileMenuAction('logout')}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onNavigateToSignUp}
                title="Sign up for free"
                className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-gray-200"
              >
                <UserIcon className="w-6 h-6" />
              </button>
            )}
          </footer>
        </aside>
        {/* Mobile: completely hidden when collapsed, only arrows will show in header */}
      </>
    );
  }

  return (
    <>
      {/* Mobile backdrop overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}
      
      <aside className="bg-white border-r border-[var(--border)] flex flex-col transition-all duration-300 ease-in-out w-72 px-3 py-4 h-full md:relative fixed inset-y-0 left-0 z-50 md:z-auto transform md:transform-none">
        <header className="flex items-center mb-4 justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCollapsed(!isCollapsed)} 
            className="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-gray-200"
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg text-[var(--accent-orange)]">Leny</h1>
        </div>
        {/* Pro Mode Toggle - Only for Providers on Desktop */}
        {userType === 'provider' && (
          <div className="hidden md:flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Pro</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleProMode();
              }}
              aria-pressed={isProMode}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-orange)] ${
                isProMode ? 'bg-[var(--accent-orange)]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  isProMode ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        )}
      </header>
      
      <div className="px-1 mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="w-4 h-4 text-[var(--text-meta)]" />
          </div>
          <input
            type="text"
            placeholder="Search or ask a question..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => {
               if (e.key === 'Enter' && searchTerm.trim()) {
                 onNewChat(searchTerm.trim());
                 // Clear search after starting new chat
                 setSearchTerm('');
               }
             }}
            className="w-full bg-white border border-[var(--border)] rounded-lg py-2 pl-9 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-orange)] focus:border-[var(--accent-orange)]"
          />
          {searchTerm.trim() && (
            <button
               onClick={() => {
                 onNewChat(searchTerm.trim());
                 // Clear search after starting new chat
                 setSearchTerm('');
               }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--accent-orange)] text-white flex items-center justify-center transition hover:bg-[#B56E1B] disabled:bg-gray-300"
              title="Ask this question"
            >
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden -mr-2 pr-2 space-y-4">
        {/* Conversations */}
        <div>
          <button 
            onClick={() => setIsConversationsExpanded(!isConversationsExpanded)} 
            className="flex items-center justify-between mb-2 w-full text-xs font-bold uppercase text-[var(--text-secondary)]"
          >
            <span>Conversations</span>
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${isConversationsExpanded ? '' : '-rotate-90'}`} />
          </button>
          {isConversationsExpanded && (
            <div className="space-y-1">
              {displayedConversations.length > 0 ? (
                <>
                  {displayedConversations.map(convo => (
                    <ChatItem
                      key={convo.id}
                      conversation={convo}
                      isActive={activeConversationId === convo.id}
                      onClick={() => onSelectConversation(convo.id)}
                      isCollapsed={isCollapsed}
                      onDelete={onDeleteConversation}
                    />
                  ))}
                  {hasMoreConversations && (
                    <button
                      onClick={() => setShowAllConversations(!showAllConversations)}
                      className="w-full text-left px-3 py-2 text-xs text-[var(--accent-orange)] hover:bg-gray-50 rounded-lg transition-colors duration-150 font-medium"
                    >
                      {showAllConversations 
                        ? `Show less (${displayedConversations.length} of ${filteredConversations.length})`
                        : `Show older conversations (${filteredConversations.length - 5} more)`}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-xs text-[var(--text-meta)] px-3 py-2">
                  {searchTerm ? 'No matching conversations' : 'No conversations yet'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Notes - Only for Providers in Pro Mode */}
        {userType === 'provider' && isProMode && (
          <div className="mt-4">
            <button 
              onClick={() => setIsNotesExpanded(!isNotesExpanded)} 
              className="flex items-center justify-between mb-2 w-full text-xs font-bold uppercase text-[var(--text-secondary)]"
            >
              <span>Notes</span>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isNotesExpanded ? '' : '-rotate-90'}`} />
            </button>
            {isNotesExpanded && (
              <div className="space-y-1">
                {filteredNotes.length > 0 ? (
                  filteredNotes.map(convo => (
                    <NoteItem
                      key={convo.id}
                      conversation={convo}
                      isActive={activeConversationId === convo.id}
                      onClick={() => onSelectNote ? onSelectNote(convo.id) : onSelectConversation(convo.id)}
                      isCollapsed={isCollapsed}
                    />
                  ))
                ) : (
                  <p className="text-xs text-[var(--text-meta)] px-3 py-2">No notes yet</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 px-2">
        <div className="flex justify-end mb-5">
          <div className="relative" ref={plusDropdownRef}>
            <button 
              onClick={() => setIsPlusDropdownOpen(!isPlusDropdownOpen)}
              title="More options"
              className="w-12 h-12 bg-[var(--accent-orange)] text-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:bg-[#B56E1B] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-orange)] transition-all duration-200 hover:scale-105"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
            
            {isPlusDropdownOpen && (
              <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
                <button
                  onClick={() => {
                    onNewChat();
                    setIsPlusDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 20l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                  </svg>
                  New Chat
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement add contact functionality
                    console.log('Add contact clicked');
                    setIsPlusDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Add a contact
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="text-center">
          <hr className="border-[var(--border)]" />
          {user && !isGuest ? (
            <>
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2.5 my-3 px-2 py-1.5 w-full hover:bg-gray-50 rounded-lg transition-all duration-150"
                >
                  <div className="w-7 h-7 rounded-full bg-[var(--accent-orange)] flex items-center justify-center text-white font-semibold text-xs">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{user.displayName || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <ChevronDownIcon className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isProfileDropdownOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                    <button
                      onClick={() => handleProfileMenuAction('profile')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => handleProfileMenuAction('settings')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Settings
                    </button>
                    <button
                      onClick={() => handleProfileMenuAction('language')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Language
                    </button>
                    <button
                      onClick={() => handleProfileMenuAction('preferences')}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Preferences
                    </button>
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={() => handleProfileMenuAction('logout')}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : isGuest ? (
            <>
              <div className="text-center my-3">
                <p className="text-xs text-[var(--text-meta)] mb-2">Chatting as guest</p>
                <button 
                  onClick={onNavigateToSignUp}
                  className="w-full bg-[var(--accent-orange)] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#B56E1B] transition-colors text-sm"
                >
                  Sign up to save chats
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-[var(--text-secondary)] my-3">
                {userType === 'provider' 
                  ? 'Access all provider features'
                  : 'Save conversations & access from any device'
                }
              </p>
              <button 
                onClick={onNavigateToSignUp}
                className="w-full bg-[var(--accent-orange)] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#B56E1B] transition-colors"
              >
                Sign up for free
              </button>
            </>
          )}
        </div>
      </div>
      </aside>

      {/* Modal Screens */}
      {activeModal === 'settings' && <SettingsScreen onClose={closeModal} />}
      {activeModal === 'language' && <LanguageScreen onClose={closeModal} />}
      {activeModal === 'preferences' && <PreferencesScreen onClose={closeModal} />}
    </>
  );
};

export default Sidebar;

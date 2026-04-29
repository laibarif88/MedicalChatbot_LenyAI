import React from 'react';

interface ChatLoadingFallbackProps {
  message?: string;
}

const ChatLoadingFallback: React.FC<ChatLoadingFallbackProps> = ({ 
  message = "Preparing chat..." 
}) => {
  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-center space-x-3">
          {/* Animated chat bubble icon */}
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-[#D97941] to-[#E89B4C] rounded-lg flex items-center justify-center animate-pulse">
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                className="text-white"
              >
                <path 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          
          {/* Loading message */}
          <div>
            <p className="text-sm font-medium text-[#D97941]">{message}</p>
            <p className="text-xs text-gray-500">Setting up your conversation...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatLoadingFallback;
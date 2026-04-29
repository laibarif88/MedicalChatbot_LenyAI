import React, { useEffect, useState, useRef } from 'react';

interface QuickReplyBarProps {
  followUps: string[];
  onFollowupClick: (text: string) => void;
  isUserTyping: boolean;
  shouldAutoHide?: boolean;
}

const QuickReplyBar: React.FC<QuickReplyBarProps> = ({ 
  followUps, 
  onFollowupClick, 
  isUserTyping,
  shouldAutoHide = true 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldShow, setShouldShow] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout>();

  // Show animation on mount
  useEffect(() => {
    if (followUps.length > 0) {
      const timer = setTimeout(() => setShouldShow(true), 100);
      return () => clearTimeout(timer);
    }
  }, [followUps]);

  // Auto-hide after 30 seconds if enabled
  useEffect(() => {
    if (shouldAutoHide && followUps.length > 0) {
      fadeTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 30000);

      return () => {
        if (fadeTimeoutRef.current) {
          clearTimeout(fadeTimeoutRef.current);
        }
      };
    }
  }, [followUps, shouldAutoHide]);

  // Hide when user starts typing
  useEffect(() => {
    if (isUserTyping) {
      setIsVisible(false);
    } else if (followUps.length > 0) {
      setIsVisible(true);
    }
  }, [isUserTyping, followUps]);

  // Don't render if no follow-ups
  if (!followUps || followUps.length === 0) {
    return null;
  }

  // Hide with animation
  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={`
        px-4 pb-2 transition-all duration-300 ease-out bg-[var(--bg-main)]
        ${shouldShow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      <div className="flex justify-center">
        <div className="max-w-2xl w-full">
          <div 
            ref={scrollContainerRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-1"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            } as React.CSSProperties}
          >
            {followUps.map((followUp, index) => (
              <button
                key={index}
                onClick={() => {
                  onFollowupClick(followUp);
                  setIsVisible(false);
                }}
                className="
                  whitespace-nowrap px-4 py-2 
                  bg-white border border-gray-200 
                  rounded-full text-sm font-medium text-gray-700 
                  hover:bg-orange-50 hover:border-orange-300 hover:text-gray-900 
                  transition-all duration-150 shadow-sm hover:shadow
                  flex-shrink-0 animate-fade-in
                "
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'backwards'
                }}
              >
                {followUp}
              </button>
            ))}
          </div>
          {/* Scroll indicator for mobile if needed */}
          {followUps.length > 3 && (
            <div className="text-center mt-1">
              <span className="text-xs text-gray-400">← Swipe for more →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickReplyBar;

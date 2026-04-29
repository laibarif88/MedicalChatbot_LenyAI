import React, { useState, useEffect } from 'react';
import { UserType } from '../../types';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  isTyping?: boolean;
  currentTab: UserType;
  onTabChange: (type: UserType) => void;
}

const placeholderSequence = [
  { text: "Ask your health question", isPrimary: true },
  { text: "Is this rash something to worry about?", isPrimary: false },
  { text: "Why does my child have a fever?", isPrimary: false },
  { text: "Ask your health question", isPrimary: true },
  { text: "What should I do about this headache?", isPrimary: false },
  { text: "When should I see a doctor?", isPrimary: false },
  { text: "Ask your health question", isPrimary: true },
  { text: "What medications are safe during pregnancy?", isPrimary: false },
  { text: "Is this chest pain serious?", isPrimary: false },
];

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onSearch,
  currentTab,
  onTabChange,
  isTyping = false
}) => {
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimTyping, setIsAnimTyping] = useState(true);
  const [showCursor, setShowCursor] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Typewriter effect for placeholder - stops when input is focused
  useEffect(() => {
    if (!value.trim() && !isInputFocused) {
      const currentItem = placeholderSequence[currentSequenceIndex];
      
      if (!currentItem) return; // Safety check
      
      if (isAnimTyping) {
        // Typing animation
        if (displayedText.length < currentItem.text.length) {
          const timeout = setTimeout(() => {
            setDisplayedText(currentItem.text.slice(0, displayedText.length + 1));
          }, 50 + Math.random() * 30); // Variable speed for more natural typing
          return () => clearTimeout(timeout);
        } else {
          // Finished typing, wait then start deleting
          // Longer pause for "Ask your health question", shorter for examples
          const pauseDuration = currentItem.isPrimary ? 3000 : 1500;
          const timeout = setTimeout(() => {
            setIsAnimTyping(false);
          }, pauseDuration);
          return () => clearTimeout(timeout);
        }
      } else {
        // Deleting animation
        if (displayedText.length > 0) {
          const timeout = setTimeout(() => {
            setDisplayedText(displayedText.slice(0, -1));
          }, 30);
          return () => clearTimeout(timeout);
        } else {
          // Finished deleting, move to next in sequence
          setCurrentSequenceIndex((prev) => (prev + 1) % placeholderSequence.length);
          setIsAnimTyping(true);
        }
      }
    }
  }, [displayedText, isAnimTyping, currentSequenceIndex, value, isInputFocused]);

  // Cursor blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  // Create placeholder text with cursor
  const placeholderText = !value.trim() 
    ? displayedText + (showCursor && !value ? '|' : '')
    : '';

  return (
    <div className="search-animation" style={{ width: '100%', maxWidth: window.innerWidth >= 768 ? '500px' : '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          placeholder={placeholderText}
          className="search-input"
          style={{
            width: '100%',
            padding: '15px 20px',
            paddingRight: '60px',
            border: 'none',
            borderRadius: '30px',
            fontSize: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            color: '#333333',
            outline: 'none',
            boxShadow: '0 6px 15px rgba(0, 0, 0, 0.15), inset 0 1px 3px rgba(0, 0, 0, 0.05)',
            transition: 'box-shadow 0.3s ease'
          }}
        />
        <button
          onClick={onSearch}
          className="search-button"
          style={{
            position: 'absolute',
            right: '8px',
            width: '45px',
            height: '45px',
            backgroundColor: '#D97941',
            border: 'none',
            borderRadius: '50%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)'
          }}
          type="button"
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '20px', height: '20px' }}
          >
            <path 
              d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" 
              stroke="white"
              strokeWidth="2" 
              strokeLinejoin="round" 
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Tab Switcher - Only show when user starts typing */}
      {value.trim() && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          animation: 'fadeInUp 0.3s ease-out',
          marginTop: '10px'
        }}>
          <div style={{
            display: 'flex',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '30px',
            padding: '5px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <button
              onClick={() => onTabChange('patient')}
              style={{
                padding: '8px 20px',
                borderRadius: '25px',
                transition: 'all 0.3s',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: currentTab === 'patient' ? '#D97941' : 'transparent',
                color: currentTab === 'patient' ? 'white' : '#666666',
                border: 'none',
                cursor: 'pointer'
              }}
              type="button"
            >
              Patient
            </button>
            <button
              onClick={() => onTabChange('provider')}
              style={{
                padding: '8px 20px',
                borderRadius: '25px',
                transition: 'all 0.3s',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: currentTab === 'provider' ? '#D97941' : 'transparent',
                color: currentTab === 'provider' ? 'white' : '#666666',
                border: 'none',
                cursor: 'pointer'
              }}
              type="button"
            >
              Provider
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

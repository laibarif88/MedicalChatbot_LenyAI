import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface HeaderProps {
  onNavigateToHome?: () => void;
  onNavigateToBlog?: () => void;
  onNavigateToWaitingList?: () => void;
  onNavigateToSignUp?: () => void;
  variant?: 'transparent' | 'solid';
}

const Header: React.FC<HeaderProps> = ({
  onNavigateToHome,
  onNavigateToBlog,
  onNavigateToWaitingList,
  onNavigateToSignUp,
  variant = 'transparent'
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isTransparent = variant === 'transparent';
  const headerStyle: React.CSSProperties = {
    position: isTransparent ? 'relative' : 'sticky',
    top: isTransparent ? 'auto' : '0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    zIndex: 10,
    flexShrink: 0,
    backgroundColor: isTransparent ? 'transparent' : 'white',
    boxShadow: isTransparent ? 'none' : '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  };

  const logoColor = isTransparent ? 'white' : '#1c1917';
  const buttonColor = isTransparent ? 'white' : '#57534e';

  return (
    <header style={headerStyle}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button 
          onClick={onNavigateToHome}
          style={{ 
            fontSize: '24px', 
            fontWeight: 700, 
            color: logoColor,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          Leny
          <span 
            style={{
              background: '#e8f5e9',
              color: '#2e7d32',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            AI assistant
          </span>
        </button>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Solutions Dropdown */}
        <div className="dropdown" ref={dropdownRef}>
          <button
            className="dropdown-toggle"
            onClick={toggleDropdown}
            type="button"
            style={{
              color: buttonColor,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            Solutions
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={`chevron-down ${isDropdownOpen ? 'open' : ''}`}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          
          {isDropdownOpen && (
            <div className="dropdown-menu">
              <button
                className="dropdown-item"
                onClick={() => {
                  onNavigateToBlog?.();
                  setIsDropdownOpen(false);
                }}
                type="button"
              >
                Blog
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  onNavigateToWaitingList?.();
                  setIsDropdownOpen(false);
                }}
                type="button"
              >
                Waiting List
              </button>
            </div>
          )}
        </div>
        
        <button
          onClick={onNavigateToSignUp}
          className="sign-up-btn"
          style={{
            backgroundColor: '#D97941',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '25px',
            textDecoration: 'none',
            fontWeight: 600,
            transition: 'background-color 0.3s ease',
            border: 'none',
            cursor: 'pointer'
          }}
          type="button"
        >
          Sign up for free
        </button>
      </div>
    </header>
  );
};

export default Header;
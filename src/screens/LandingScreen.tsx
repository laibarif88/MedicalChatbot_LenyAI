import React, { useState, useEffect } from 'react';
import { VideoBackground } from '../components/landing/VideoBackground';
import { SearchInput } from '../components/landing/SearchInput';

// Define UserType if not imported
type UserType = 'patient' | 'provider';

interface LandingScreenProps {
  onStartChat: (query?: string, type?: UserType) => void;
  onNavigateToSignUp: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToBlog: () => void;
  onNavigateToWaitingList: () => void;
  onNavigateToHome?: () => void;
  onNavigateToContact: () => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({ 
  onStartChat, 
  onNavigateToSignUp, 
  onNavigateToAdmin,
  onNavigateToContact,
  onNavigateToBlog,
  onNavigateToWaitingList,
  onNavigateToHome
}) => {
  const [inputValue, setInputValue] = useState('');
  const [currentTab, setCurrentTab] = useState<UserType>('patient');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fix mobile viewport height issue
  useEffect(() => {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    // Set initial height
    setViewportHeight();
    
    // Update on resize and orientation change
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
    
    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
    };
  }, []);

  const handleSearch = () => {
    // Always navigate to chat, even with empty query
    onStartChat(inputValue.trim() || undefined, currentTab);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

        /* Dynamic viewport height for mobile */
        :root {
          --vh: 1vh;
        }

        * {
          box-sizing: border-box;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .title-animation {
          animation: fadeInUp 0.8s ease-out;
        }

        .search-animation {
          animation: fadeInUp 0.8s ease-out 0.2s both;
        }

        .search-button:hover {
          background-color: #C97A20 !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25) !important;
        }

        .search-button:active {
          transform: translateY(0) !important;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2) !important;
        }

        .sign-up-btn:hover {
          background-color: #C97A20 !important;
          transform: translateY(-2px);
        }

        .search-input::placeholder {
          color: rgba(0, 0, 0, 0.5);
        }

        .search-input:focus {
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2), inset 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        }

        .trust-text {
          animation: fadeInUp 0.6s ease-out 0.4s both;
        }

        .dropdown {
          position: relative;
          display: inline-block;
        }

        .dropdown-toggle {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          font-weight: 400;
          padding: 6px 10px;
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        .dropdown-toggle:hover {
          color: white;
          background-color: rgba(255, 255, 255, 0.08);
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          min-width: 150px;
          overflow: hidden;
          z-index: 1000;
          margin-top: 5px;
        }

        .dropdown-item {
          display: block;
          width: 100%;
          padding: 12px 16px;
          background: none;
          border: none;
          text-align: left;
          color: #374151;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .dropdown-item:hover {
          background-color: #f3f4f6;
        }

        .chevron-down {
          transform: rotate(0deg);
          transition: transform 0.2s ease;
        }

        .chevron-down.open {
          transform: rotate(180deg);
        }
      `}</style>
      
      {/* Main Container - Fixed positioning for mobile */}
      <div 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' // Fallback gradient
        }}
      >
        {/* Video Background Component */}
        <VideoBackground src="/father.mp4" />

        {/* Header - Fixed at top */}
        <header 
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 20px',
            zIndex: 10,
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button 
              onClick={onNavigateToHome}
              style={{ 
                fontSize: '24px', 
                fontWeight: 700, 
                color: 'white',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Leny
              <span 
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#D97941',
                  borderRadius: '50%',
                  marginLeft: '5px',
                  display: 'inline-block',
                  animation: 'pulse 2s infinite'
                }}
              />
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Solutions Dropdown */}
            <div className="dropdown">
              <button
                className="dropdown-toggle"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                type="button"
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
                      onNavigateToBlog();
                      setIsDropdownOpen(false);
                    }}
                    type="button"
                  >
                    Blog
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      onNavigateToWaitingList();
                      setIsDropdownOpen(false);
                    }}
                    type="button"
                  >
                    Waiting List
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      onNavigateToContact();
                      setIsDropdownOpen(false);
                    }}
                    type="button"
                  >
                    Contact Us
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

        {/* Hero Section - Flex-based centering */}
        <main 
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '20px',
            zIndex: 2,
            position: 'relative',
            minHeight: 0 // Important for flex children
          }}
        >
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: window.innerWidth >= 768 ? '25px' : '15px',
              maxWidth: window.innerWidth >= 768 ? '768px' : '90%',
              width: '100%'
            }}
          >
            <h1 
              className="title-animation"
              style={{
                fontSize: window.innerWidth >= 768 ? '48px' : '32px',
                fontWeight: 700,
                lineHeight: 1.2,
                maxWidth: window.innerWidth >= 768 ? '500px' : '100%',
                margin: 0,
                color: 'white'
              }}
            >
              Trusted Medical Answers. Instantly.
            </h1>

            {/* Search Input Component */}
            <SearchInput 
              value={inputValue}
              onChange={setInputValue}
              onSearch={handleSearch}
              currentTab={currentTab}
              onTabChange={setCurrentTab}
            />

            {/* Trust Text */}
            <p 
              className="trust-text"
              style={{ 
                fontSize: '14px', 
                fontWeight: 400,
                color: 'rgba(255, 255, 255, 0.9)',
                margin: 0,
                marginTop: inputValue.trim() ? '0' : '-5px'
              }}
            >
              Trusted by 100,000+ Doctors & Patients
            </p>

            {/* Bottom Info */}
            <div 
              style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.85)',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                flexWrap: 'wrap',
                justifyContent: 'center',
                maxWidth: '350px',
                marginTop: '5px'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                HIPAA secure
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                Your data is private
              </span>
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px',
                color: '#4ade80', 
                fontWeight: 600 
              }}>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                100% Free
              </span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default LandingScreen;

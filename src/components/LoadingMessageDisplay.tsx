import React from 'react';
import { useLoadingMessages, LoadingMessage } from '../utils/loadingMessages';
import { UserType } from '../types';

interface LoadingMessageDisplayProps {
  userType: UserType;
  queryType?: 'symptoms' | 'medications' | 'general';
  isLoading: boolean;
  className?: string;
}

/**
 * Component to display cycling educational messages during AI response delays
 * Transforms wait anxiety into learning opportunities
 */
export const LoadingMessageDisplay: React.FC<LoadingMessageDisplayProps> = ({
  userType,
  queryType,
  isLoading,
  className = ''
}) => {
  const currentMessage = useLoadingMessages(userType, queryType, isLoading);

  if (!isLoading) return null;

  return (
    <div className={`loading-message-display ${className}`}>
      <div className="loading-message-content">
        <div className="loading-icon">
          <div className="spinner"></div>
          {currentMessage.icon && (
            <span className="message-icon" role="img" aria-label="tip">
              {currentMessage.icon}
            </span>
          )}
        </div>
        
        <div className="message-text">
          <p>{currentMessage.text}</p>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.1); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `
      }} />
    </div>
  );
};

export default LoadingMessageDisplay;

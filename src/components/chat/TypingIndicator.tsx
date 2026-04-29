import React, { useState, useEffect } from 'react';

// Enhanced loading messages pool - more like GPT/Anthropic
const LOADING_MESSAGES = [
    "Thinking",
    "Analyzing your question",
    "Reviewing medical information", 
    "Cross-referencing data",
    "Consulting guidelines",
    "Formulating response",
    "Checking accuracy",
    "Finalizing details"
];

interface TypingIndicatorProps {
  showBubble?: boolean;
}

// Clean, minimal TypingIndicator without avatar or dots - like GPT/Anthropic
export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ showBubble = true }) => {
    const [currentMessage, setCurrentMessage] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    
    useEffect(() => {
        // Rotate through messages
        const messageInterval = setInterval(() => {
            setCurrentMessage(prev => (prev + 1) % LOADING_MESSAGES.length);
        }, 2500); // Change message every 2.5 seconds
        
        // Track elapsed time
        const timeInterval = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);
        
        return () => {
            clearInterval(messageInterval);
            clearInterval(timeInterval);
        };
    }, []);
    
    if (!showBubble) {
        // Clean loading indicator without avatar or bubble - minimal like GPT/Anthropic
        return (
            <div className="flex items-start animate-fade-in ml-10">
                <div className="flex items-center gap-2.5 py-2">
                    {/* Simple breathing circle - minimal */}
                    <div className="relative">
                        <div 
                            className="w-2.5 h-2.5 rounded-full bg-[#C97A20]"
                            style={{
                                animation: 'gentlePulse 2s ease-in-out infinite',
                            }}
                        />
                    </div>
                    
                    {/* Clean loading message without dots */}
                    <span className="text-sm text-gray-500 font-light">
                        {LOADING_MESSAGES[currentMessage]}
                    </span>
                    
                    {/* Time indicator after 5 seconds - subtle */}
                    {elapsedTime > 5 && (
                        <span className="text-xs text-gray-400 font-light">
                            {elapsedTime}s
                        </span>
                    )}
                </div>
                
                {/* Simplified CSS animation - more subtle like GPT/Anthropic */}
                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes gentlePulse {
                        0%, 100% { 
                            opacity: 0.6; 
                            transform: scale(1); 
                        }
                        50% { 
                            opacity: 1; 
                            transform: scale(1.15); 
                        }
                    }
                `}} />
            </div>
        );
    }

    // Show with bubble (for consistency if needed elsewhere) - also cleaned up
    return (
        <div className="flex items-start animate-fade-in ml-10">
            <div className="p-3 rounded-lg bg-white border border-[#F2E6DC] shadow-sm">
                <div className="flex items-center gap-2.5">
                    {/* Simple breathing circle */}
                    <div className="relative">
                        <div 
                            className="w-2.5 h-2.5 rounded-full bg-[#C97A20]"
                            style={{
                                animation: 'gentlePulse 2s ease-in-out infinite',
                            }}
                        />
                    </div>
                    
                    {/* Clean message without dots */}
                    <span className="text-sm text-gray-500 font-light">
                        {LOADING_MESSAGES[currentMessage]}
                    </span>
                </div>
                
                {/* Simplified CSS animation */}
                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes gentlePulse {
                        0%, 100% { 
                            opacity: 0.6; 
                            transform: scale(1); 
                        }
                        50% { 
                            opacity: 1; 
                            transform: scale(1.15); 
                        }
                    }
                `}} />
            </div>
        </div>
    );
};

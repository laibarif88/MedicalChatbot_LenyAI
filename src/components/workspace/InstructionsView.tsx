import React, { useState } from 'react';
import { Message } from '../../types';
import { SendIcon } from '../chat/Icons';

interface InstructionsViewProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isGenerating: boolean;
  onStopGeneration?: () => void;
}

const InstructionsView: React.FC<InstructionsViewProps> = ({
  messages,
  onSendMessage,
  isGenerating,
  onStopGeneration
}) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !isGenerating) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">Instructions & Guidance</h3>
        <p className="text-xs text-gray-500 mt-0.5">Quick, actionable guidance for your case</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="mb-3">
              <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-sm">Ask for specific guidance or instructions</p>
            <p className="text-xs mt-1">Responses will be concise and action-oriented</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`${msg.senderId === 'user' ? 'text-right' : 'text-left'}`}>
              <div 
                className={`inline-block max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                  msg.senderId === 'user' 
                    ? 'bg-[#D97941] text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {/* Render concise message */}
                <div className="instruction-message">
                  {msg.senderId !== 'user' && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-5 h-5 bg-[#D97941] rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">A</span>
                      </div>
                      <span className="text-xs font-medium text-gray-600">Alex</span>
                    </div>
                  )}
                  
                  {/* Parse and render instruction-style content */}
                  <div className="space-y-1">
                    {msg.text.split('\n').map((line, idx) => {
                      // Check if line starts with a bullet or number
                      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
                      const isNumbered = /^\d+[\.\)]\s/.test(line.trim());
                      
                      if (isBullet || isNumbered) {
                        return (
                          <div key={idx} className="flex gap-2">
                            <span className="text-[#D97941] font-semibold">→</span>
                            <span className="flex-1">{line.replace(/^[\•\-\d\.\)]\s*/, '')}</span>
                          </div>
                        );
                      }
                      
                      // Bold headers
                      if (line.includes(':') && line.indexOf(':') < 30) {
                        const [header, ...rest] = line.split(':');
                        return (
                          <div key={idx}>
                            <span className="font-semibold">{header}:</span>
                            {rest.join(':')}
                          </div>
                        );
                      }
                      
                      return <div key={idx}>{line}</div>;
                    })}
                  </div>
                </div>
              </div>
              
              {/* Timestamp */}
              <div className={`text-xs text-gray-400 mt-1 ${msg.senderId === 'user' ? 'pr-1' : 'pl-1'}`}>
                {msg.timestamp}
              </div>
            </div>
          ))
        )}
        
        {/* Typing Indicator */}
        {isGenerating && (
          <div className="text-left">
            <div className="inline-block bg-gray-100 px-3 py-2 rounded-lg">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask for guidance..."
            disabled={isGenerating}
            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#D97941] focus:border-[#D97941] disabled:opacity-50"
          />
          
          {isGenerating ? (
            <button
              onClick={onStopGeneration}
              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              title="Stop generating"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2 bg-[#D97941] text-white rounded-lg hover:bg-[#C97A20] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send"
            >
              <SendIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onSendMessage('Summarize the key findings')}
            className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Summarize
          </button>
          <button
            onClick={() => onSendMessage('What are the next steps?')}
            className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Next Steps
          </button>
          <button
            onClick={() => onSendMessage('List differential diagnoses')}
            className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Differentials
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructionsView;

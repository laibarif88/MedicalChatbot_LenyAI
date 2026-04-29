import React, { useState } from 'react';
import { CopyIcon, ShareIcon, ThumbUpIcon, ThumbDownIcon } from './Icons';
import logger from '../../services/logger';
import { QuickAction } from '../../types';

interface MessageActionsProps {
    messageText: string;
    onQuickActionClick: (action: QuickAction, messageText: string) => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({ 
    messageText, 
    onQuickActionClick 
}) => {
    const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

    const handleCopy = () => {
        onQuickActionClick({ label: 'Copy', type: 'copy' }, messageText);
    };

    const handleShare = () => {
        onQuickActionClick({ label: 'Share', type: 'share' }, messageText);
    };

    return (
        <div className="mt-4 pt-3 border-t border-[#F2E6DC]/60">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleCopy}
                        className="text-xs px-2.5 py-1.5 rounded-md border border-[#E8D5C8] bg-[#FFFBF8] text-[#5C4A3F] hover:border-[#C97A20] hover:text-[#C97A20] transition-colors flex items-center gap-1.5"
                    >
                        <CopyIcon />
                        Copy
                    </button>
                    <button 
                        onClick={handleShare}
                        className="text-xs px-2.5 py-1.5 rounded-md border border-[#E8D5C8] bg-[#FFFBF8] text-[#5C4A3F] hover:border-[#C97A20] hover:text-[#C97A20] transition-colors flex items-center gap-1.5"
                    >
                        <ShareIcon />
                        Share
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <button 
                            onClick={() => setFeedback(f => f === 'up' ? null : 'up')}
                            className={`p-1.5 rounded-full transition-colors ${feedback === 'up' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:bg-gray-100 hover:text-green-500'}`}
                            title="Good response"
                        >
                            <ThumbUpIcon />
                        </button>
                        <button 
                            onClick={() => setFeedback(f => f === 'down' ? null : 'down')}
                            className={`p-1.5 rounded-full transition-colors ${feedback === 'down' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:bg-gray-100 hover:text-red-500'}`}
                            title="Bad response"
                        >
                            <ThumbDownIcon />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { MailIcon } from '../chat/Icons';

interface InviteParticipantModalProps {
    onClose: () => void;
    onInvite: (email: string) => void;
}

export const InviteParticipantModal: React.FC<InviteParticipantModalProps> = ({ onClose, onInvite }) => {
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) {
            onInvite(email.trim());
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in" 
            style={{ animationDuration: '200ms' }}
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-in-right"
                style={{ animationDuration: '300ms' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="text-center">
                    <h2 className="text-xl font-bold text-[#2D241F] mb-2">Invite Participant</h2>
                    <p className="text-sm text-gray-600 mb-6">Enter the email address of the person you want to add to this conversation.</p>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="relative mb-4">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MailIcon />
                        </div>
                        <input
                            type="email"
                            placeholder="colleague@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D97941] transition"
                        />
                    </div>
                    
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-full text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-[#D97941] hover:bg-[#C97A20] transition-colors shadow-sm hover:shadow-md"
                        >
                            Send Invite
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

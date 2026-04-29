import React from 'react';

interface DeleteConfirmationModalProps {
    conversationTitle: string;
    onClose: () => void;
    onConfirm: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ conversationTitle, onClose, onConfirm }) => {
    return (
        <div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fade-in"
            style={{ animationDuration: '200ms' }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg rounded-tl-sm shadow-2xl w-full max-w-sm p-6 animate-slide-in-right"
                style={{ animationDuration: '300ms' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-[#2D241F] mb-2">Delete Conversation</h2>
                    <p className="text-sm text-gray-600 mb-6">
                        Are you sure you want to permanently delete the conversation titled "{conversationTitle}"? This action cannot be undone.
                    </p>
                </div>
                
                <div className="flex justify-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="flex-1 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm hover:shadow-md"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

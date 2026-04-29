import React from 'react';

interface QuickActionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSendBulkEmails: () => void;
    onSuspendInactiveUsers: () => void;
    onExportData: () => void;
    onGenerateReport: () => void;
    onBackupSystem: () => void;
}

export const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
    isOpen,
    onClose,
    onSendBulkEmails,
    onSuspendInactiveUsers,
    onExportData,
    onGenerateReport,
    onBackupSystem
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div 
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={onClose}
                />

                {/* Modal panel */}
                <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                                Quick Actions
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    onSendBulkEmails();
                                    onClose();
                                }}
                                className="w-full px-4 py-3 text-left bg-[#D97941] text-white rounded-lg hover:bg-[#C86A35] transition-colors flex items-center justify-between group"
                            >
                                <span>Send Verification Emails to All</span>
                                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </button>

                            <button
                                onClick={() => {
                                    onSuspendInactiveUsers();
                                    onClose();
                                }}
                                className="w-full px-4 py-3 text-left bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-between group"
                            >
                                <span>Suspend Inactive Users (90+ days)</span>
                                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            </button>

                            <button
                                onClick={() => {
                                    onExportData();
                                    onClose();
                                }}
                                className="w-full px-4 py-3 text-left bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-between group"
                            >
                                <span>Export User Data (CSV)</span>
                                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </button>

                            <button
                                onClick={() => {
                                    onGenerateReport();
                                    onClose();
                                }}
                                className="w-full px-4 py-3 text-left bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-between group"
                            >
                                <span>Generate System Health Report</span>
                                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v8m5-5h2m-2 4h2m-6 4h10" />
                                </svg>
                            </button>

                            <button
                                onClick={() => {
                                    onBackupSystem();
                                    onClose();
                                }}
                                className="w-full px-4 py-3 text-left bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-between group"
                            >
                                <span>Backup System Database</span>
                                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

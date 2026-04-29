import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../../types';
import { formatMedicalContent } from '../../utils/unifiedMedicalFormatter';
import { SymptomForm } from './SymptomForm';

interface MessageBubbleProps {
    message?: Message;
    isLoading?: boolean;
    isWelcomeMessage?: boolean;
    currentUserId?: string;
    onFollowupClick?: (text: string) => void;
    isGeneratingFollowUps?: boolean;
    isGeneratingForm?: boolean; 
}

// Simple markdown to HTML converter for AI responses
function convertMarkdownToHTML(text: string): string {
    let html = text;

    // First, preserve existing valid HTML tags by replacing them with placeholders
    const placeholders: { [key: string]: string } = {};
    let placeholderIndex = 0;

    // Preserve existing HTML tags that we want to keep
    // This includes b, strong, i, em, code, and also div, span, p, h1-h6, ul, ol, li, br, hr
    const allowedTags = 'b|strong|i|em|code|div|span|p|h[1-6]|ul|ol|li|br|hr|a|blockquote|pre';
    const tagRegex = new RegExp(`<(/?)(${allowedTags})(\\s+[^>]*)?>`, 'gi');

    html = html.replace(tagRegex, (match) => {
        const placeholder = `__PLACEHOLDER_${placeholderIndex++}__`;
        placeholders[placeholder] = match;
        return placeholder;
    });

    // Also preserve self-closing tags
    html = html.replace(/<(br|hr)\s*\/?>/gi, (match) => {
        const placeholder = `__PLACEHOLDER_${placeholderIndex++}__`;
        placeholders[placeholder] = match;
        return placeholder;
    });

    // Now escape any remaining < and > characters that aren't part of our preserved tags
    // These would be things like "< 90%" or "> 100" in the text
    html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Restore all the preserved HTML tags
    Object.keys(placeholders).forEach(placeholder => {
        const replacement = placeholders[placeholder];
        if (replacement) {
            html = html.replace(placeholder, replacement);
        }
    });

    // Normalize line endings
    html = html.replace(/\r\n/g, '\n');

    // Normalize excessive line breaks (3+ consecutive newlines become 2)
    html = html.replace(/\n{3,}/g, '\n\n');

    // Convert headers (###, ##, #) to HTML
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');

    // Convert horizontal rules (---)
    html = html.replace(/^---+$/gm, '<hr class="my-4 border-gray-300"/>');

    // Convert **text** to <strong>text</strong> (bold)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Convert *text* to <em>text</em> (italic) - make sure not to match bold
    html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');

    // Process lists - handle both single line breaks and double line breaks
    const lines = html.split('\n');
    const processedLines: string[] = [];
    let inList = false;
    let inNumberedList = false;
    let listBuffer: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i] || '';
        const trimmedLine = line.trim();

        // Check for bullet points - handle various formats
        const isBullet = /^[•\-\*]\s+/.test(trimmedLine) ||
            /^[•\-\*]\s+/.test(line);

        // Check for numbered lists
        const isNumbered = /^\d+\.\s+/.test(trimmedLine);

        if (isBullet) {
            if (!inList) {
                if (listBuffer.length > 0) {
                    processedLines.push(...listBuffer);
                    listBuffer = [];
                }
                processedLines.push('<ul class="list-disc list-inside ml-4 my-2 space-y-1">');
                inList = true;
            }
            // Handle lines that look like list items
            const cleanLine = trimmedLine.replace(/^[•\-\*]\s+/, '');
            if (cleanLine) {
                processedLines.push(`<li>${cleanLine}</li>`);
            }
        } else if (isNumbered) {
            if (!inNumberedList) {
                if (listBuffer.length > 0) {
                    processedLines.push(...listBuffer);
                    listBuffer = [];
                }
                processedLines.push('<ol class="list-decimal list-inside ml-4 my-2 space-y-1">');
                inNumberedList = true;
            }
            const cleanLine = trimmedLine.replace(/^\d+\.\s+/, '');
            processedLines.push(`<li>${cleanLine}</li>`);
        } else {
            // Close any open lists
            if (inList) {
                processedLines.push('</ul>');
                inList = false;
            }
            if (inNumberedList) {
                processedLines.push('</ol>');
                inNumberedList = false;
            }

            // Process regular lines
            if (trimmedLine || processedLines.length > 0) {
                processedLines.push(line);
            }
        }
    }

    // Close any remaining open lists
    if (inList) {
        processedLines.push('</ul>');
    }
    if (inNumberedList) {
        processedLines.push('</ol>');
    }

    html = processedLines.join('\n');

    // Split into paragraphs at double line breaks
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs
        .map(p => {
            const trimmed = p.trim();
            // Don't wrap lists, headers, or hrs in paragraphs
            if (trimmed.startsWith('<ul') || trimmed.startsWith('<ol') ||
                trimmed.startsWith('<h') || trimmed.startsWith('<hr')) {
                return trimmed;
            }
            // Don't wrap if it's already wrapped
            if (trimmed.startsWith('<p>')) {
                return trimmed;
            }
            // Only wrap non-empty content
            return trimmed ? `<p class="mb-3">${trimmed}</p>` : '';
        })
        .filter(p => p) // Remove empty strings
        .join('\n');

    return html;
}

// Icon components
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const ClipboardCopyIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const ShareIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
    </svg>
);

const ThumbsUpIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
    </svg>
);

const ThumbsDownIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3h7.28z" />
    </svg>
);

const ThinkingBox: React.FC<{ text: string }> = ({ text }) => (
    <div className="border border-[var(--border)] rounded-lg p-3 flex items-center justify-between bg-white shadow-sm mb-2">
        <p className="text-[var(--text-secondary)] text-sm">{text}</p>
        <ChevronDownIcon className="w-5 h-5 text-[var(--text-meta)]" />
    </div>
);

const loadingMessages = [
    "Analyzing your query...",
    "Consulting clinical knowledge base...",
    "Cross-referencing medical data...",
    "Formatting response...",
    "Just a moment while I check on that...",
    "Preparing your clinical insights...",
];

const followUpLoadingMessages = [
    "Gathering more context...",
    "Analyzing what information we need...",
    "Preparing follow-up questions...",
    "Understanding your query...",
    "Thinking about what to ask next...",
    "Processing your medical details...",
];
const formGenerationMessages = [
    "Analyzing query...",
    "Preparing assessment form...",
    "Customizing questions for your case...",
    "Setting up medical assessment...",
    "Creating personalized form...",
    "Configuring symptom evaluation...",
];

const MessageBubbleSimple: React.FC<MessageBubbleProps> = ({
    message,
    isLoading,
    isWelcomeMessage = false,
    currentUserId,
    onFollowupClick,
    isGeneratingFollowUps = false,
    isGeneratingForm = false
}) => {

    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState("Leny is thinking...");

    useEffect(() => {
        let timerInterval: ReturnType<typeof setInterval> | null = null;
        let messageInterval: ReturnType<typeof setInterval> | null = null;

        if (isLoading || isGeneratingFollowUps || isGeneratingForm) {
            setElapsedSeconds(0);
            setLoadingMessage("Leny is thinking...");
            if (isGeneratingForm) {
                setLoadingMessage("Analyzing your symptoms...");
            } else if (isGeneratingFollowUps) {
                setLoadingMessage("Gathering more context...");
            } else {
                setLoadingMessage("Leny is thinking...");
            }

            timerInterval = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);

             messageInterval = setInterval(() => {
                let messagePool;
                if (isGeneratingForm) {
                    messagePool = formGenerationMessages;
                } else if (isGeneratingFollowUps) {
                    messagePool = followUpLoadingMessages;
                } else {
                    messagePool = loadingMessages;
                }
                
                const randomMessage = messagePool[Math.floor(Math.random() * messagePool.length)];
                if (randomMessage) {
                    setLoadingMessage(randomMessage);
                }
            }, 3000);
        }

        return () => {
            if (timerInterval) clearInterval(timerInterval);
            if (messageInterval) clearInterval(messageInterval);
        };
    }, [isLoading, isGeneratingFollowUps, isGeneratingForm]);

    if (isLoading) {
        return (
            <div className="flex w-full animate-fadeIn justify-center">
                <div className="max-w-2xl w-full">
                    <div className="inline-block bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5">
                        <div className="flex items-center gap-3">
                            <p className="text-xs text-[var(--text-secondary)]">
                                {loadingMessage}
                                <span className="thinking-dots">
                                    <span>.</span><span>.</span><span>.</span>
                                </span>
                            </p>
                            <span className="text-xs text-[var(--text-meta)] font-mono">{elapsedSeconds}s</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    if (isGeneratingFollowUps) {
        return (
            <div className="flex w-full animate-fadeIn justify-center">
                <div className="max-w-2xl w-full">
                    <div className="inline-block bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5">
                        <div className="flex items-center gap-3">
                            <p className="text-xs text-[var(--text-secondary)]">
                                {loadingMessage}
                                <span className="thinking-dots">
                                    <span>.</span><span>.</span><span>.</span>
                                </span>
                            </p>
                            <span className="text-xs text-[var(--text-meta)] font-mono">{elapsedSeconds}s</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show loading state for form generation
    if (isGeneratingForm) {
        return (
            <div className="flex w-full animate-fadeIn justify-center">
                <div className="max-w-2xl w-full">
                    <div className="inline-block bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5">
                        <div className="flex items-center gap-3">
                            <p className="text-xs text-[var(--text-secondary)]">
                                {loadingMessage}
                                <span className="thinking-dots">
                                    <span>.</span><span>.</span><span>.</span>
                                </span>
                            </p>
                            <span className="text-xs text-[var(--text-meta)] font-mono">{elapsedSeconds}s</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!message) return null;

    const isUser = message.senderId === currentUserId;

    // Convert message format if needed
    const textContent = message.text;
    const formattedTimestamp = message.timestamp || new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    if (isUser) {
        return (
            <div className="flex w-full animate-fadeIn justify-center px-4 sm:px-6">
                <div className="max-w-2xl w-full flex justify-end">
                    <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 pt-4 pb-3 shadow-sm border bg-[var(--bg-user-message)] border-[var(--border)]">
                        <div className="flex items-end gap-3">
                            <div className="text-base text-[var(--bg-user-message-text)] leading-relaxed flex-1">
                                {textContent}
                            </div>
                            <span className="text-[11px] text-[var(--bg-user-message-text)] opacity-70 whitespace-nowrap self-end pb-[2px] ml-2">
                                {formattedTimestamp}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // AI/Model message
    return (
        <div className="flex justify-center w-full animate-fadeIn px-4 sm:px-6">
            <div className="max-w-2xl w-full">
                <div className="rounded-2xl bg-white shadow-sm relative">
                    <div className="p-5 sm:p-6">
                        <div
                            className="text-base text-[var(--text-primary)] leading-[1.65] prose prose-sm"
                            dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(textContent) }}
                        />
                    </div>
                    <div className="absolute bottom-3 right-5 sm:right-6">
                        <span className="text-[11px] text-gray-400 whitespace-nowrap">
                            {formattedTimestamp}
                        </span>
                    </div>
                </div>

                {/* Icons and disclaimer - shown before follow-up questions */}
                {!isWelcomeMessage && (
                    <div className="mt-3 px-3">
                        <div className="flex justify-end items-center gap-2 mb-2">
                            <ActionButton
                                icon={ClipboardCopyIcon}
                                label="Copy"
                                onClick={() => {
                                    navigator.clipboard.writeText(textContent);
                                }}
                            />
                            <ActionButton icon={ShareIcon} label="Share" onClick={() => { }} />
                            <ActionButton icon={ThumbsUpIcon} label="Good response" onClick={() => { }} />
                            <ActionButton icon={ThumbsDownIcon} label="Bad response" onClick={() => { }} />
                        </div>
                        <p className="text-[11px] text-[var(--text-meta)] opacity-75 text-right pr-1">
                            Not medical advice. Verify the information.
                        </p>
                    </div>
                )}

                {/* Form display - only show if form exists and hasn't been submitted */}
                {message.formData && !message.formData.submitted && (
                    <div className="mt-4">
                        <SymptomForm
                            form={message.formData}
                            onSubmit={(formData) => {
                                // Handle form submission
                                const submissionMessage = `FORM_SUBMISSION:${JSON.stringify(formData)}`;
                                onFollowupClick?.(submissionMessage);
                            }}
                            onCancel={() => {
                                // Handle form cancellation
                                console.log('Form cancelled');
                            }}
                        />
                    </div>
                )}

                {/* Follow-up questions removed - now shown in Quick Reply Bar */}
            </div>
        </div>
    );
};

const ActionButton: React.FC<{ icon: React.FC<{ className?: string }>, label: string, onClick: () => void }> = ({
    icon: Icon,
    label,
    onClick
}) => (
    <button
        onClick={onClick}
        title={label}
        className="p-1.5 rounded-full text-[var(--text-meta)] hover:bg-gray-100 hover:text-[var(--text-primary)] transition-colors"
    >
        <Icon className="w-4 h-4" />
    </button>
);

// Icon Components
export default MessageBubbleSimple;

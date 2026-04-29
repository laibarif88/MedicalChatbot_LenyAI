import React, { useState, useEffect, useRef } from 'react';
import { ShareIcon, PrintIcon, ClipboardCopyIcon } from '../../chat/Icons';
import FormattingToolbar from './FormattingToolbar';

// Universal floppy disk save icon
const SaveIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <path d="M17 21v-8H7v8"/>
    <path d="M7 3v5h8"/>
  </svg>
);

interface NotesViewProps {
  title: string;
  content: string;
  onUpdate: (updates: { title?: string, content?: string }) => void;
}

const NotesView: React.FC<NotesViewProps> = ({ title, content, onUpdate }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [localTitle, setLocalTitle] = useState(title);
  
  type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved';
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  
  // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
  const savedStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local title with parent prop
  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  // Sync editor content with parent prop
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && content !== editor.innerHTML) {
      editor.innerHTML = content;
    }
  }, [content]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (savedStatusTimer.current) clearTimeout(savedStatusTimer.current);
    };
  }, []);

  const performSave = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    const currentContent = editorRef.current?.innerHTML || '';
    
    setSaveStatus('saving');
    
    onUpdate({ title: localTitle, content: currentContent });

    // Show 'Saved' message for a short duration
    setTimeout(() => {
      setSaveStatus('saved');
      if (savedStatusTimer.current) clearTimeout(savedStatusTimer.current);
      savedStatusTimer.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }, 500); // Artificial delay to make 'Saving...' visible
  };

  const handleDataChange = () => {
    if (savedStatusTimer.current) clearTimeout(savedStatusTimer.current);
    setSaveStatus('unsaved');
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      performSave();
    }, 1500); // Auto-save after 1.5s of inactivity
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTitle(e.target.value);
    handleDataChange();
  }
  
  const handleContentChange = () => {
    handleDataChange();
  };

  const handleCopy = () => {
    const editor = editorRef.current;
    if (editor) {
      navigator.clipboard.writeText(editor.innerText);
      alert('Note content copied to clipboard!');
    }
  };

  const handlePrint = () => {
    const editor = editorRef.current;
    if (editor) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`<html><head><title>${title}</title></head><body>${editor.innerHTML}</body></html>`);
      printWindow?.document.close();
      printWindow?.print();
    }
  };
  
  const handleShare = async () => {
    const editor = editorRef.current;
    if (navigator.share && editor) {
      try {
        await navigator.share({ title: localTitle, text: editor.innerText });
      } catch (error) { console.error('Error sharing:', error); }
    } else {
      alert('Share functionality is not supported on this browser.');
    }
  };

  const applyTemplate = (templateContent: string) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = templateContent;
      // Don't trigger auto-save when just exploring templates
      // Save will only happen when user actually edits the content
    }
  };
  
  const applyFormat = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      handleContentChange(); // Treat format as a content change to trigger save
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="p-3 bg-white border-b border-[var(--border)] flex items-center justify-between gap-4">
         <input 
          type="text"
          value={localTitle}
          onChange={handleTitleChange}
          className="text-lg font-semibold text-[var(--accent-blue)] w-full outline-none bg-transparent"
          placeholder="Untitled Note"
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-sm text-[var(--text-meta)] transition-opacity duration-300 min-w-[80px]">
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && <span className="text-green-600">✓ Saved</span>}
          </div>
          <ActionButton 
            icon={SaveIcon} 
            label="Save" 
            onClick={performSave} 
            disabled={saveStatus === 'saved' || saveStatus === 'saving'} 
          />
          <ActionButton icon={ShareIcon} label="Share" onClick={handleShare} />
          <ActionButton icon={ClipboardCopyIcon} label="Copy" onClick={handleCopy} />
          <ActionButton icon={PrintIcon} label="Print" onClick={handlePrint} />
        </div>
      </header>
      
      <FormattingToolbar onFormat={applyFormat} onApplyTemplate={applyTemplate} />

      <div className="flex-1 overflow-y-auto bg-white">
        <div 
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          className="w-full min-h-full p-6 pb-24 text-sm leading-relaxed focus:outline-none text-black"
          style={{ color: '#000000' }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
};

const ActionButton: React.FC<{ icon: React.FC<{className?: string}>, label: string, onClick: () => void, disabled?: boolean }> = ({ icon: Icon, label, onClick, disabled }) => (
  <button 
    onClick={onClick}
    title={label}
    disabled={disabled}
    className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <Icon className="w-5 h-5" />
  </button>
);



export default NotesView;

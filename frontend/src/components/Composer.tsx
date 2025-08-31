
import React, { useRef } from 'react';
import { Send } from 'lucide-react';

interface ComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onVoice?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const Composer: React.FC<ComposerProps> = ({ value, onChange, onSend, onVoice, placeholder, disabled }) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex gap-2 items-center w-full" role="form" aria-label="Message composer">
      <input
        ref={ref}
        aria-label="Message"
        className="flex-1 border rounded px-3 py-2 focus:ring-2 focus:ring-sky-400 focus:outline-none bg-white dark:bg-slate-900"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') onSend();
        }}
        placeholder={placeholder || 'Share how you’re feeling… I’m here to listen.'}
        disabled={disabled}
        autoFocus
      />
      <button
        className="btn-icon bg-sky-600 hover:bg-sky-700 text-white shadow focus:ring-2 focus:ring-sky-400 focus:outline-none"
        onClick={onSend}
        disabled={disabled}
        aria-label="Send message (Ctrl+Enter)"
        style={{ borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Send className="w-5 h-5" />
      </button>
      {onVoice && (
        <button
          className="btn-icon bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow focus:ring-2 focus:ring-blue-400 focus:outline-none ml-2"
          onClick={onVoice}
          aria-label="Start voice input"
          style={{ borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v2m0 0c-3.314 0-6-2.686-6-6m6 6c3.314 0 6-2.686 6-6m-6 6v-2m0-6a3 3 0 003-3V7a3 3 0 10-6 0v2a3 3 0 003 3z" /></svg>
        </button>
      )}
    </div>
  );
};

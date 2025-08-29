import React from 'react';

interface SettingsModalProps {
  lang: string;
  setLang: (lang: string) => void;
  outputMode: 'text' | 'audio';
  setOutputMode: (mode: 'text' | 'audio') => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ lang, setLang, outputMode, setOutputMode, onClose }) => (
  <div id="settings-modal" role="dialog" aria-modal="true" className="fixed inset-0 bg-black/40 dark:bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
    <div className="glass rounded-xl shadow p-4 w-full max-w-md text-slate-800 dark:text-slate-100 bg-white/90 dark:bg-slate-800" onClick={e => e.stopPropagation()}>
      <div className="text-lg font-semibold mb-2">Settings</div>
      <div className="space-y-2">
        <label className="block text-sm">Default language
          <select className="block w-full border rounded px-2 py-1 mt-1" value={lang} onChange={e => setLang(e.target.value)}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </label>
        <label className="block text-sm">Default output mode
          <select className="block w-full border rounded px-2 py-1 mt-1" value={outputMode} onChange={e => setOutputMode(e.target.value as 'text' | 'audio')}>
            <option value="text">Text</option>
            <option value="audio">Audio</option>
          </select>
        </label>
      </div>
      <div className="mt-4 text-right">
        <button className="btn px-3 py-1 rounded border" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

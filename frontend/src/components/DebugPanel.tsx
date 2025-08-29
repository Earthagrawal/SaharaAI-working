import React from 'react';

interface DebugPanelProps {
  logs: string[];
  onClear: () => void;
}

function redactPII(str: string): string {
  return str.replace(/([\w.-]+@[\w.-]+\.[A-Za-z]{2,6})/g, '[redacted-email]')
    .replace(/\b\d{10,}\b/g, '[redacted-phone]');
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ logs, onClear }) => {
  const [open, setOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
  }, [open]);
  return (
    <aside className="fixed bottom-0 left-0 w-full md:w-96 bg-slate-900 text-white shadow-lg z-40 rounded-t-xl" aria-label="Debug panel">
      <button className="w-full text-left px-4 py-2 font-semibold bg-slate-800 rounded-t-xl" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls="debug-content">
        Debug Panel
      </button>
      {open && (
        <div id="debug-content" className="p-4 max-h-64 overflow-auto text-xs outline-none" tabIndex={-1} ref={panelRef}>
          <button className="btn mb-2" onClick={onClear}>Clear</button>
          <pre aria-live="polite">{logs.join('\n')}</pre>
        </div>
      )}
    </aside>
  );
};

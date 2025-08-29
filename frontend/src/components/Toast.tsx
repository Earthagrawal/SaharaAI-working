import React from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

// ...existing code...
  import { motion, AnimatePresence } from 'framer-motion';
  export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
    React.useEffect(() => {
      const t = setTimeout(onClose, 4000);
      return () => clearTimeout(t);
    }, [onClose]);
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={`fixed bottom-4 right-4 z-50 px-4 py-2 rounded shadow-lg text-white dark:text-slate-900 ${type === 'success' ? 'bg-green-600 dark:bg-green-300' : type === 'error' ? 'bg-red-600 dark:bg-red-300' : 'bg-slate-800 dark:bg-slate-200'}`}
          role="alert" aria-live="assertive" tabIndex={0}
          onKeyDown={e => { if (e.key === 'Escape') onClose(); }}
        >
          <span>{message}</span>
          <button className="ml-2 btn-icon" aria-label="Close" onClick={onClose}>×</button>
        </motion.div>
      </AnimatePresence>
    );
  };

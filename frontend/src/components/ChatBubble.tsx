
import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardCopy, Reply, User, Bot } from 'lucide-react';
import { Signals } from '../types';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  audio?: string | null;
  timestamp?: string;
  status?: 'sending' | 'sent' | 'failed';
  signals?: Signals;
  onCopy?: () => void;
  onReply?: () => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  role,
  content,
  audio,
  timestamp,
  status,
  signals,
  onCopy,
  onReply,
}) => {
  const avatar = role === 'user' ? <User className="w-6 h-6 text-sky-500" /> : <Bot className="w-6 h-6 text-emerald-500" />;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className={`flex gap-2 items-end max-w-2xl ${role === 'user' ? 'flex-row-reverse ml-auto' : 'mr-auto'}`}
      aria-live={role === 'assistant' ? 'polite' : undefined}
    >
      <div className="shrink-0 rounded-full bg-white shadow p-1 border border-slate-200">{avatar}</div>
      <div className={`inline-block px-4 py-2 rounded-2xl shadow-md max-w-lg ${role === 'user' ? 'bg-sky-100 dark:bg-sky-900 text-sky-900 dark:text-sky-100' : 'bg-white/90 dark:bg-slate-800 text-slate-900 dark:text-slate-100'}`}
        tabIndex={0} aria-label={role === 'user' ? 'User message' : 'Assistant message'}>
        <div className="flex items-center gap-2">
          <span className="whitespace-pre-line break-words">{content}</span>
          {signals && role === 'assistant' && (
            <span
              className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${signals.mood_fused === 'sad' ? 'bg-blue-200 text-blue-800' : signals.mood_fused === 'calm' ? 'bg-green-200 text-green-800' : signals.mood_fused === 'anxious' ? 'bg-yellow-200 text-yellow-800' : signals.mood_fused === 'angry' ? 'bg-red-200 text-red-800' : signals.mood_fused === 'urgent' ? 'bg-pink-200 text-pink-800' : 'bg-gray-200 text-gray-800'}`}
              title={`Sentiment: ${signals.mood_fused} (${Math.round(signals.confidence * 100)}%)`}
              aria-label={`Sentiment: ${signals.mood_fused}`}
            >
              {signals.mood_fused}
            </span>
          )}
        </div>
        {audio && (
          <div className="mt-2">
            <audio controls src={audio} aria-label="Audio reply" className="w-full" />
            <a download={`turn-audio.mp3`} href={audio} className="text-xs text-slate-500 ml-2">Download</a>
          </div>
        )}
        <div className="flex gap-2 mt-2 opacity-80">
          <button className="btn-icon" onClick={onCopy} aria-label="Copy message"><ClipboardCopy size={16} /></button>
          <button className="btn-icon" onClick={onReply} aria-label="Reply"><Reply size={16} /></button>
        </div>
        {timestamp && <div className="text-xs text-slate-400 mt-1">{new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
        {status && <div className="text-xs text-slate-400 mt-1">{status}</div>}
      </div>
    </motion.div>
  );
};

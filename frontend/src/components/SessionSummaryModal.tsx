import React from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, MessageSquare } from 'lucide-react';
import { TodoItem } from '../types';

interface SessionSummaryModalProps {
  messages: Array<{ role: 'user' | 'assistant'; content: string; ts?: string }>;
  todos: TodoItem[];
  onClose: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({ messages, todos, onClose }) => {
  const completedTodos = todos.filter(t => t.done).length;
  const totalTodos = todos.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/40 dark:bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass rounded-xl shadow p-6 w-full max-w-2xl text-slate-800 dark:text-slate-100 bg-white/90 dark:bg-slate-800"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Session Summary</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
            aria-label="Close summary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Conversation Stats */}
          <div className="flex gap-4 text-center">
            <div className="flex-1 p-4 rounded-lg bg-sky-100/50 dark:bg-sky-900/30">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-sky-600 dark:text-sky-400" />
              <div className="text-2xl font-bold">{messages.length}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Messages</div>
            </div>
            <div className="flex-1 p-4 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/30">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
              <div className="text-2xl font-bold">{completedTodos}/{totalTodos}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Tasks Completed</div>
            </div>
          </div>

          {/* Recent Messages */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Recent Messages</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto p-2">
              {messages.slice(-5).map((msg, i) => (
                <div
                  key={i}
                  className={`p-2 rounded ${
                    msg.role === 'user'
                      ? 'bg-sky-100 dark:bg-sky-900/50 ml-4'
                      : 'bg-emerald-100 dark:bg-emerald-900/50 mr-4'
                  }`}
                >
                  <div className="text-sm font-medium mb-1">
                    {msg.role === 'user' ? 'You' : 'Sahara'}
                    {msg.ts && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                        {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="text-sm">{msg.content}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Tasks */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Active Tasks</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto p-2">
              {todos.filter(t => !t.done).map(todo => (
                <div
                  key={todo.id}
                  className="p-2 rounded bg-white/50 dark:bg-slate-700/50 flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full" style={{
                    backgroundColor: todo.priority === 1 ? '#ef4444' : todo.priority === 2 ? '#f59e0b' : '#10b981'
                  }} />
                  <span>{todo.title}</span>
                  {todo.due && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
                      Due: {new Date(todo.due).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

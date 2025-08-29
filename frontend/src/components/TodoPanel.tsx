
import React from 'react';
import { TodoItem } from '../types';
import { motion } from 'framer-motion';
import { Plus, Trash2, Check, Clock, Edit } from 'lucide-react';

interface TodoPanelProps {
  todos: TodoItem[];
  onCreate: (title: string, priority?: number) => void;
  onUpdate: (id: string, data: Partial<TodoItem>) => void;
  onDelete: (id: string) => void;
  onSnooze: (id: string, hours: number) => void;
}

export const TodoPanel: React.FC<TodoPanelProps> = ({ todos, onCreate, onUpdate, onDelete, onSnooze }) => {
  const [title, setTitle] = React.useState('');
  const [priority, setPriority] = React.useState<number | undefined>(undefined);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState('');
  return (
  <aside className="rounded-xl shadow glass flex flex-col bg-white/90 dark:bg-slate-800 text-slate-800 dark:text-slate-100" aria-label="Todo panel">
      <div className="p-4 border-b font-semibold flex items-center justify-between">
        <span>Todo</span>
        <button className="btn-icon" title="Add" aria-label="Add todo" onClick={() => { if (title) { onCreate(title, priority); setTitle(''); setPriority(undefined); } }}><Plus size={18} /></button>
      </div>
      <div className="p-4 space-y-2 overflow-auto">
        {todos.map(t => (
          <motion.div key={t.id} className={`border rounded p-2 flex items-center gap-2 bg-white/70 dark:bg-slate-900 text-slate-800 dark:text-slate-100 ${t.done ? 'opacity-60' : ''}`}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <input aria-label={`mark ${t.title} done`} type="checkbox" checked={!!t.done} onChange={e => onUpdate(t.id, { done: e.target.checked })} />
            <div className="flex-1">
              {editing === t.id ? (
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onBlur={() => { setEditing(null); setEditValue(''); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { onUpdate(t.id, { title: editValue }); setEditing(null); setEditValue(''); }
                  }}
                  autoFocus
                />
              ) : (
                <div className={t.done ? 'line-through' : ''}>{t.title}</div>
              )}
              {t.priority ? <div className="text-xs text-slate-500 dark:text-slate-300">Priority {t.priority}</div> : null}
            </div>
            <button className="btn-icon" onClick={() => { setEditing(t.id); setEditValue(t.title); }} title="Edit"><Edit size={16} /></button>
            <button className="btn-icon" onClick={() => onUpdate(t.id, { priority: (t.priority || 0) + 1 })} title="Increase priority"><Check size={16} /></button>
            <button className="btn-icon" onClick={() => onSnooze(t.id, 24)} title="Snooze 24h"><Clock size={16} /></button>
            <button className="btn-icon text-red-600" onClick={() => onDelete(t.id)} title="Delete"><Trash2 size={16} /></button>
          </motion.div>
        ))}
        <form onSubmit={e => { e.preventDefault(); if (title) { onCreate(title, priority); setTitle(''); setPriority(undefined); } }} className="grid grid-cols-5 gap-2 mt-2">
          <input name="title" placeholder="Add task" className="col-span-3 border rounded px-2 py-1" value={title} onChange={e => setTitle(e.target.value)} aria-label="New todo title" />
          <input name="priority" placeholder="P" className="col-span-1 border rounded px-2 py-1" value={priority || ''} onChange={e => setPriority(Number(e.target.value) || undefined)} aria-label="New todo priority" />
          <button className="btn col-span-1 px-2 py-1 rounded bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900" type="submit">Add</button>
        </form>
      </div>
    </aside>
  );
};

import { VoiceOverlay } from './components/VoiceOverlay';

import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createTodo, deleteTodo, listTodos, sendTurn, updateTodo } from './api';
import { AnimatePresence, motion } from 'framer-motion';


// MSW mock mode support
if ((import.meta as any).env.VITE_MOCK_MODE === 'true') {
  import('./mockWorker').then(({ worker }) => worker.start());
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUIStore } from './store';
import { ChatBubble } from './components/ChatBubble';
import { Composer } from './components/Composer';
import { TodoPanel } from './components/TodoPanel';
import { AudioPlayer } from './components/AudioPlayer';
import { SentimentChip } from './components/SentimentChip';
import { Toast } from './components/Toast';
import { DebugPanel } from './components/DebugPanel';
import { SettingsModal } from './components/SettingsModal';
import { WellnessTips } from './components/WellnessTips';
import { SessionSummaryModal } from './components/SessionSummaryModal';
import { Mic, Camera } from 'lucide-react';
import { OutputEnvelope, TodoItem, Signals } from './types';
import { v4 as uuidv4 } from 'uuid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './axios';

const queryClient = new QueryClient();





function App() {
  // Voice overlay state
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  // UI state
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; audio?: string | null; signals?: Signals; ts?: string }>>([]);
  const [text, setText] = useState('');
  const [lang, setLang] = useState((window as any).VITE_DEFAULT_LANG || 'en');
  const [outputMode, setOutputMode] = useState<'text' | 'audio'>('text');
  const [showSettings, setShowSettings] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null);
  const [debug, setDebug] = useState<{ req: any; res: any; reqId?: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const [recStart, setRecStart] = useState<number | null>(null);
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
  const [showSessionSummary, setShowSessionSummary] = useState(false);

  // Todo state
  const { data: todos = [], refetch: refetchTodos } = useQuery<TodoItem[]>({
    queryKey: ['todos'],
    queryFn: async () => (await api.get('/todo')).data,
  });
  const queryClient = useQueryClient();

  // Hero section state
  const [showHero, setShowHero] = useState(() => messages.length === 0);

  // Hide hero on first message
  useEffect(() => {
    if (messages.length > 0) setShowHero(false);
  }, [messages.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        send();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[aria-label="Message"]')?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        document.getElementById('todo-panel')?.scrollIntoView({ behavior: 'smooth' });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setShowSettings(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setTheme(theme => theme === 'dark' ? 'light' : 'dark');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setShowSessionSummary(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setShowVoiceOverlay(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Recording logic
  const recSeconds = useMemo(() => (recStart ? Math.floor((Date.now() - recStart) / 1000) : 0), [recStart, recording, text]);
  async function startRec(pressHold = false) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunks.current = [];
    mr.ondataavailable = (e) => chunks.current.push(e.data);
    mr.onstop = async () => {
      const blob = new Blob(chunks.current, { type: 'audio/webm' });
      const buf = await blob.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      await send({ content: '[voice]', audio_base64: b64 });
      setRecStart(null);
    };
    mr.start();
    setRec(mr);
    setRecording(true);
    setRecStart(Date.now());
    if (!pressHold) {
      setTimeout(() => {
        if (mr.state !== 'inactive') {
          mr.stop();
          setRecording(false);
        }
  }, Number((window as any).VITE_RECORD_MAX_SECONDS || 60) * 1000);
    }
  }
  function stopRec() {
    if (rec && rec.state !== 'inactive') {
      rec.stop();
      setRecording(false);
    }
  }
  function cancelRec() {
    if (rec && rec.state !== 'inactive') {
      rec.stop();
    }
    setRecording(false);
    setRecStart(null);
    chunks.current = [];
  }

  // Camera logic
  async function openCamera() {
    setShowCamera(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) videoRef.current.srcObject = stream;
  }
  function takeSnapshot() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    const data = canvas.toDataURL('image/png').split(',')[1];
    setImageData(data);
  }
  function closeCamera() {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
    setShowCamera(false);
  }

  // Message send logic
  async function send(payloadOverride?: any) {
    const contentToSend = payloadOverride?.content ?? text;
    const audioB64 = payloadOverride?.audio_base64;
    const imageB64 = payloadOverride?.image_base64;
    if (!contentToSend && !audioB64 && !imageB64) return;
    if (contentToSend) setMessages((m) => [...m, { role: 'user', content: contentToSend, ts: new Date().toISOString() }]);
    setText('');
    try {
      const req = { session_id: 's1', content: contentToSend, audio_base64: audioB64, image_base64: imageB64, lang_hint: lang, output_mode: outputMode };
      const res = await api.post<OutputEnvelope>('/turn', req);
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: res.data.llm_output.text,
          audio: res.data.audio_ref,
          signals: res.data.llm_output as any, // For demo, signals can be improved
          ts: new Date().toISOString(),
        },
      ]);
      setDebug({ req, res: res.data, reqId: res.headers['x-request-id'] });
    } catch (e: any) {
      setToast({ message: e?.message || 'Error sending message', type: 'error' });
    }
  }

  // Todo handlers
  async function handleCreateTodo(title: string, priority?: number) {
    await api.post('/todo', { title, priority });
  queryClient.invalidateQueries({ queryKey: ['todos'] });
    setToast({ message: 'Todo added', type: 'success' });
  }
  async function handleUpdateTodo(id: string, data: Partial<TodoItem>) {
    await api.patch(`/todo/${id}`, data);
  queryClient.invalidateQueries({ queryKey: ['todos'] });
    setToast({ message: 'Todo updated', type: 'success' });
  }
  async function handleDeleteTodo(id: string) {
    await api.delete(`/todo/${id}`);
  queryClient.invalidateQueries({ queryKey: ['todos'] });
    setToast({ message: 'Todo deleted', type: 'success' });
  }
  async function handleSnooze(id: string, hours: number) {
    const due = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    await api.patch(`/todo/${id}`, { due });
  queryClient.invalidateQueries({ queryKey: ['todos'] });
    setToast({ message: `Snoozed for ${hours}h`, type: 'info' });
  }

  // Privacy clear
  function privacyClear() {
    setMessages([]);
    localStorage.removeItem('sahara_msgs');
    setToast({ message: 'Conversation cleared', type: 'info' });
  }

  // Persist messages
  useEffect(() => {
    const saved = localStorage.getItem('sahara_msgs');
    if (saved) setMessages(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem('sahara_msgs', JSON.stringify(messages));
  }, [messages]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-sky-200 via-indigo-200 to-emerald-100 text-slate-800">
      {/* Floating animated shapes for legendary background */}
      <div className="floating-bg">
        <div className="float-shape float-shape1"></div>
        <div className="float-shape float-shape2"></div>
        <div className="float-shape float-shape3"></div>
      </div>
      {/* Legendary Hero Section */}
      {showHero && (
        <section className="hero fade-in">
          <h1 className="hero-title">Sahara: Youth Mental Wellness</h1>
          <p className="hero-desc">Empathetic, confidential support for your mental wellness journey. Sahara listens, understands, and guides you—anytime, anywhere.</p>
          <button className="btn px-8 py-3 text-lg shadow-xl" onClick={() => setShowHero(false)}>Start Chatting</button>
        </section>
      )}
      {/* Main App Layout */}
      {!showHero && (
        <>
          <header className="glass flex items-center justify-between px-6 py-4 border-b border-white/40 sticky top-0 z-10 soft-shadow">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-extrabold tracking-tight hero-title">Sahara</div>
              <span className="text-sm text-slate-500" aria-label="session-label">Session: s1</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn" onClick={() => setShowSessionSummary(true)} aria-label="Show session summary">Summary (Ctrl+S)</button>
              <button className="btn" onClick={() => setShowSettings(true)} aria-haspopup="dialog" aria-controls="settings-modal">Settings</button>
              <button className="btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme (Ctrl+T)">{theme === 'dark' ? 'Light' : 'Dark'}</button>
              <button className="btn" onClick={privacyClear} title="Clear local conversation">Privacy</button>
            </div>
          </header>
          <main className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-8 p-6">
            {/* Chat Section */}
            <section className="md:col-span-2 lg:col-span-3 flex flex-col rounded-3xl glass soft-shadow p-0 overflow-hidden">
              <div className="flex flex-wrap gap-3 items-center px-6 py-4 border-b border-white/30 bg-white/60">
                <select aria-label="Language" className="border rounded px-2 py-1" value={lang} onChange={e => setLang(e.target.value)}>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
                <select aria-label="Output mode" className="border rounded px-2 py-1" value={outputMode} onChange={e => setOutputMode(e.target.value as 'text' | 'audio')}>
                  <option value="text">Text</option>
                  <option value="audio">Audio</option>
                </select>
                <button className="btn-icon" onClick={openCamera} aria-label="Open camera" title="Open camera"><Camera className="w-6 h-6" /></button>
              </div>
              <div className="flex-1 overflow-auto px-6 py-4 space-y-4 bg-gradient-to-br from-white/80 via-sky-50 to-emerald-50" role="log" aria-live="polite">
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => (
                    <ChatBubble
                      key={i}
                      role={m.role}
                      content={m.content}
                      audio={m.audio}
                      signals={m.signals}
                      timestamp={m.ts}
                      onCopy={() => { navigator.clipboard.writeText(m.content); setToast({ message: 'Copied', type: 'info' }); }}
                      onReply={() => setText(m.content)}
                    />
                  ))}
                </AnimatePresence>
              </div>
              <div className="px-6 py-4 border-t border-white/30 bg-white/60 flex flex-wrap gap-3 items-center">
                <Composer value={text} onChange={setText} onSend={send} onVoice={() => setShowVoiceOverlay(true)} />
          <VoiceOverlay
            transcript={voiceTranscript}
            listening={showVoiceOverlay}
            onSend={() => {
              if (voiceTranscript.trim()) {
                send(voiceTranscript);
                setVoiceTranscript("");
                setShowVoiceOverlay(false);
              }
            }}
            onClose={() => setShowVoiceOverlay(false)}
          />
                <button
                  className={`btn-icon mic-btn ${recording ? 'bg-emerald-600 text-white animate-pulse' : 'bg-white/80 text-emerald-600'}`}
                  onClick={() => (recording ? stopRec() : startRec(false))}
                  aria-label={recording ? 'Stop recording' : 'Start voice input'}
                  title={recording ? 'Stop recording' : 'Start voice input'}
                  style={{ borderRadius: '50%', width: 44, height: 44, fontSize: 0 }}
                >
                  <Mic className="w-6 h-6" />
                </button>
              </div>
            </section>
            {/* Side Panel */}
            <div className="md:col-span-2 lg:col-span-1 space-y-6">
              {/* Wellness Tips Panel */}
              <WellnessTips />

              {/* Todo Panel */}
              <div id="todo-panel">
                <TodoPanel
                  todos={todos}
                  onCreate={handleCreateTodo}
                  onUpdate={handleUpdateTodo}
                  onDelete={handleDeleteTodo}
                  onSnooze={handleSnooze}
                />
              </div>
            </div>
          </main>

          {showSettings && (
            <SettingsModal lang={lang} setLang={setLang} outputMode={outputMode} setOutputMode={setOutputMode} onClose={() => setShowSettings(false)} />
          )}

          {showCamera && (
            <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" onClick={closeCamera}>
              <div className="glass rounded-2xl shadow-xl p-6 w-full max-w-2xl soft-shadow" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-lg font-semibold">Camera</div>
                  <button onClick={closeCamera} className="btn px-2 py-1 border rounded">Close</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <video ref={videoRef} autoPlay playsInline className="w-full rounded bg-black aspect-video" />
                  <div className="flex flex-col gap-3">
                    <button className="btn bg-sky-600" onClick={takeSnapshot}>Snapshot</button>
                    {imageData && (
                      <>
                        <img className="rounded border" alt="snapshot" src={`data:image/png;base64,${imageData}`} />
                        <button className="btn bg-emerald-600" onClick={() => { send({ content: '[image]', image_base64: imageData }); setImageData(null); }}>Send Image</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
          {debug && <DebugPanel logs={[JSON.stringify(debug, null, 2)]} onClear={() => setDebug(null)} />}

          {showSessionSummary && (
            <SessionSummaryModal
              messages={messages}
              todos={todos}
              onClose={() => setShowSessionSummary(false)}
            />
          )}
        </>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);



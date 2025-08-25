import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createTodo, deleteTodo, listTodos, sendTurn, updateTodo } from './api'
import { AnimatePresence, motion } from 'framer-motion'

function App() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; audio?: string | null }[]>([])
  const [text, setText] = useState('')
  const [lang, setLang] = useState('en')
  const [outputMode, setOutputMode] = useState<'text'|'audio'>('text')
  const [todos, setTodos] = useState<any[]>([])
  const [rec, setRec] = useState<MediaRecorder | null>(null)
  const [recording, setRecording] = useState(false)
  const [recStart, setRecStart] = useState<number | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [theme, setTheme] = useState<'light'|'dark'>(() => (localStorage.getItem('theme') as 'light'|'dark') || 'light')
  const chunks = useRef<Blob[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const [imageData, setImageData] = useState<string | null>(null)

  useEffect(() => { listTodos().then(setTodos).catch(() => {}) }, [])

  const recSeconds = useMemo(() => recStart ? Math.floor((Date.now() - recStart)/1000) : 0, [recStart, recording, text])

  async function send(payloadOverride?: any) {
    const contentToSend = payloadOverride?.content ?? text
    const audioB64 = payloadOverride?.audio_base64
    const imageB64 = payloadOverride?.image_base64
    if (!contentToSend && !audioB64 && !imageB64) return
    if (contentToSend) setMessages((m) => [...m, { role: 'user', content: contentToSend }])
    setText('')
    const res = await sendTurn({ session_id: 's1', content: contentToSend, audio_base64: audioB64, image_base64: imageB64, lang_hint: lang, output_mode: outputMode })
    setMessages((m) => [...m, { role: 'assistant', content: res.llm_output.text, audio: res.audio_ref }])
  }

  async function startRec(pressHold=false) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream)
    chunks.current = []
    mr.ondataavailable = (e) => chunks.current.push(e.data)
    mr.onstop = async () => {
      const blob = new Blob(chunks.current, { type: 'audio/webm' })
      const buf = await blob.arrayBuffer()
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
      await send({ content: '[voice]', audio_base64: b64 })
      setRecStart(null)
    }
    mr.start()
    setRec(mr)
    setRecording(true)
    setRecStart(Date.now())
    if (!pressHold) {
      setTimeout(() => { if (mr.state !== 'inactive') { mr.stop(); setRecording(false) } }, 60000)
    }
  }
  function stopRec() { if (rec && rec.state !== 'inactive') { rec.stop(); setRecording(false) } }
  function cancelRec() { if (rec && rec.state !== 'inactive') { rec.stop(); } setRecording(false); setRecStart(null); chunks.current = [] }

  async function openCamera() {
    setShowCamera(true)
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    if (videoRef.current) videoRef.current.srcObject = stream
  }
  function takeSnapshot() {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    const data = canvas.toDataURL('image/png').split(',')[1]
    setImageData(data)
  }
  function closeCamera() {
    if (videoRef.current && videoRef.current.srcObject) {
      ;(videoRef.current.srcObject as MediaStream).getTracks().forEach(t=>t.stop())
    }
    setShowCamera(false)
  }

  useEffect(()=>{
    document.documentElement.classList.toggle('dark', theme==='dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  function privacyClear() { setMessages([]); localStorage.removeItem('sahara_msgs') }
  useEffect(()=>{ const saved = localStorage.getItem('sahara_msgs'); if(saved) setMessages(JSON.parse(saved)) }, [])
  useEffect(()=>{ localStorage.setItem('sahara_msgs', JSON.stringify(messages)) }, [messages])

  return (
    <div className="min-h-screen grid grid-rows-[auto,1fr] text-slate-800">
      <header className="glass flex items-center justify-between px-4 py-3 border-b border-white/40 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="text-xl font-semibold">
            <span className="inline-block bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 bg-clip-text text-transparent">Sahara</span>
          </div>
          <span className="text-sm text-slate-500" aria-label="session-label">Session: s1</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn px-3 py-1 rounded border bg-white/70" onClick={()=>setShowSettings(true)} aria-haspopup="dialog" aria-controls="settings-modal">Settings</button>
          <button className="btn px-3 py-1 rounded border bg-white/70" onClick={()=>setTheme(theme==='dark'?'light':'dark')} title="Toggle theme">{theme==='dark'?'Light':'Dark'}</button>
          <button className="btn px-3 py-1 rounded border bg-white/70" onClick={privacyClear} title="Clear local conversation">Privacy</button>
        </div>
      </header>
      <main className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        <section className="md:col-span-2 flex flex-col rounded-xl shadow glass">
          <div className="p-3 border-b flex flex-wrap gap-2 items-center">
            <select aria-label="Language" className="border rounded px-2 py-1" value={lang} onChange={e=>setLang(e.target.value)}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
            <select aria-label="Output mode" className="border rounded px-2 py-1" value={outputMode} onChange={e=>setOutputMode(e.target.value as any)}>
              <option value="text">Text</option>
              <option value="audio">Audio</option>
            </select>
            <button className="btn px-3 py-1 rounded border" onClick={openCamera}>Camera</button>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3" role="log" aria-live="polite">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className={m.role === 'user' ? 'text-right' : ''}>
                  <div className={`inline-block px-3 py-2 rounded-2xl shadow-sm ${m.role==='user'?'bg-sky-50/70':'bg-white/70'}`}>{m.content}</div>
                  {m.audio && (
                    <div>
                      <audio controls src={m.audio}></audio>
                      <a download={`sahara_${i}.mp3`} href={m.audio} className="text-xs text-slate-500">Download</a>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="p-4 border-t flex flex-wrap gap-2 items-center">
            <input aria-label="Message" className="flex-1 border rounded px-3 py-2" value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter') send()}} placeholder="Type your message..." />
            <button className="btn px-3 py-2 rounded bg-sky-600 text-white" onClick={()=>send()}>Send</button>
            {!recording ? (
              <>
                <button className="btn px-3 py-2 rounded bg-emerald-600 text-white" onMouseDown={()=>startRec(true)} onMouseUp={stopRec} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' '){startRec(true)}}} onKeyUp={(e)=>{if(e.key==='Enter'||e.key===' '){stopRec()}}} aria-pressed={recording}>Hold to Rec</button>
                <button className="btn px-3 py-2 rounded bg-emerald-700 text-white" onClick={()=>startRec(false)} aria-pressed={recording}>Toggle Rec</button>
              </>
            ) : (
              <>
                <span aria-live="polite" className="text-sm">Recording... {recSeconds}s</span>
                <button className="btn px-3 py-2 rounded bg-red-600 text-white" onClick={stopRec}>Stop</button>
                <button className="btn px-3 py-2 rounded bg-slate-500 text-white" onClick={cancelRec}>Cancel</button>
              </>
            )}
          </div>
        </section>
        <aside className="md:col-span-1 rounded-xl shadow glass flex flex-col" aria-label="Todo panel">
          <div className="p-4 border-b font-semibold">Todo</div>
          <div className="p-4 space-y-2 overflow-auto">
            {todos.map(t => (
              <motion.div key={t.id} className="border rounded p-2 flex items-center gap-2 bg-white/70"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y:0 }}>
                <input aria-label={`mark ${t.title} done`} type="checkbox" checked={!!t.done} onChange={async e=>{const u=await updateTodo(t.id,{done:e.target.checked}); setTodos(prev=>prev.map(x=>x.id===t.id?u:x))}} />
                <div className="flex-1">
                  <div className={t.done? 'line-through' : ''}>{t.title}</div>
                  {t.priority ? <div className="text-xs text-slate-500">Priority {t.priority}</div> : null}
                </div>
                <button className="btn text-sm text-slate-600" onClick={async ()=>{const u=await updateTodo(t.id,{priority:(t.priority||0)+1}); setTodos(prev=>prev.map(x=>x.id===t.id?u:x))}}>+P</button>
                <button className="btn text-sm text-slate-600" onClick={async ()=>{const due=new Date(Date.now()+24*60*60*1000).toISOString(); const u=await updateTodo(t.id,{due}); setTodos(prev=>prev.map(x=>x.id===t.id?u:x))}}>Snooze</button>
                <button className="btn text-sm text-red-600" onClick={async ()=>{await deleteTodo(t.id); setTodos(prev=>prev.filter(x=>x.id!==t.id))}}>Delete</button>
              </motion.div>
            ))}
            <form onSubmit={async e=>{e.preventDefault(); const fd=new FormData(e.currentTarget as HTMLFormElement); const title=fd.get('title') as string; if(!title) return; const priority = Number(fd.get('priority')||0)||undefined; const n=await createTodo({title, priority}); setTodos(prev=>[...prev,n]); (e.currentTarget as HTMLFormElement).reset()}} className="grid grid-cols-5 gap-2">
              <input name="title" placeholder="Add task" className="col-span-3 border rounded px-2 py-1" />
              <input name="priority" placeholder="P" className="col-span-1 border rounded px-2 py-1" />
              <button className="btn col-span-1 px-2 py-1 rounded bg-slate-800 text-white">Add</button>
            </form>
          </div>
        </aside>
      </main>

      {showSettings && (
        <div id="settings-modal" role="dialog" aria-modal="true" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" onClick={()=>setShowSettings(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-xl shadow p-4 w-full max-w-md" onClick={e=>e.stopPropagation()}>
            <div className="text-lg font-semibold mb-2">Settings</div>
            <div className="space-y-2">
              <label className="block text-sm">Default language
                <select className="block w-full border rounded px-2 py-1 mt-1" value={lang} onChange={e=>setLang(e.target.value)}>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                </select>
              </label>
              <label className="block text-sm">Default output mode
                <select className="block w-full border rounded px-2 py-1 mt-1" value={outputMode} onChange={e=>setOutputMode(e.target.value as any)}>
                  <option value="text">Text</option>
                  <option value="audio">Audio</option>
                </select>
              </label>
            </div>
            <div className="mt-4 text-right">
              <button className="btn px-3 py-1 rounded border" onClick={()=>setShowSettings(false)}>Close</button>
            </div>
          </motion.div>
        </div>
      )}

      {showCamera && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" onClick={closeCamera}>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl shadow p-4 w-full max-w-2xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-lg font-semibold">Camera</div>
              <button onClick={closeCamera} className="btn px-2 py-1 border rounded">Close</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded bg-black aspect-video" />
              <div className="flex flex-col gap-2">
                <button className="btn px-3 py-2 rounded bg-sky-600 text-white" onClick={takeSnapshot}>Snapshot</button>
                {imageData && (
                  <>
                    <img className="rounded border" alt="snapshot" src={`data:image/png;base64,${imageData}`} />
                    <button className="btn px-3 py-2 rounded bg-emerald-600 text-white" onClick={()=>{send({ content: '[image]', image_base64: imageData }); setImageData(null);}}>Send Image</button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)



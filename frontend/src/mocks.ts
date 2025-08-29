import { http } from 'msw';
import { v4 as uuidv4 } from 'uuid';

// Deterministic mock data for OutputEnvelope, TodoItem, etc.
const MOCK_TODO = [
  {
    id: '1',
    title: 'Try 5-minute breathing',
    description: 'Inhale 4s, hold 4s, exhale 6s',
    due: null,
    done: false,
    priority: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const handlers = [
  http.post('/turn', async (req) => {
    const { content, output_mode } = (await req.request.json()) as any;
    return new Response(
      JSON.stringify({
        turn_id: uuidv4(),
        llm_output: {
          text: content?.toLowerCase().includes('sad')
            ? "I hear you. Based on your mood (sad), try a short grounding exercise: inhale 4, hold 4, exhale 6. I'm here to listen."
            : "I'm here to listen. How are you feeling today?",
          tokens: 24,
          safety_flags: [],
          language: 'en',
        },
        todo_advice: [],
        audio_ref: output_mode === 'audio' ? 'data:audio/mp3;base64,AAAA' : null,
        metadata: { retrieval_used: false },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }),
  http.get('/todo', () => new Response(JSON.stringify(MOCK_TODO), { status: 200, headers: { 'Content-Type': 'application/json' } })),
  http.post('/todo', async (req) => {
    const { title, priority } = (await req.request.json()) as any;
    const newTodo = {
      id: uuidv4(),
      title,
      description: '',
      due: null,
      done: false,
      priority: priority || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    MOCK_TODO.push(newTodo);
    return new Response(JSON.stringify(newTodo), { status: 201, headers: { 'Content-Type': 'application/json' } });
  }),
  http.patch('/todo/:id', async (req) => {
    const { id } = req.params;
    const data = await req.request.json();
    const todo = MOCK_TODO.find(t => t.id === id);
    if (todo) Object.assign(todo, data, { updated_at: new Date().toISOString() });
    return new Response(JSON.stringify(todo), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }),
  http.delete('/todo/:id', (req) => {
    const { id } = req.params;
    const idx = MOCK_TODO.findIndex(t => t.id === id);
    if (idx !== -1) MOCK_TODO.splice(idx, 1);
    return new Response(null, { status: 204 });
  }),
  http.get('/healthz', () => new Response(JSON.stringify({ status: 'ok' }), { status: 200, headers: { 'Content-Type': 'application/json' } })),
  http.get('/metrics', () => new Response('mock_metrics 1', { status: 200, headers: { 'Content-Type': 'text/plain' } })),
];

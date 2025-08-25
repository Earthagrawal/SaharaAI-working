export type OutputEnvelope = {
  turn_id: string
  llm_output: { text: string }
  todo_advice: any[]
  audio_ref?: string | null
}

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export async function sendTurn(body: any): Promise<OutputEnvelope> {
  const res = await fetch(`${BASE}/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('turn failed')
  return res.json()
}

export async function listTodos() {
  const res = await fetch(`${BASE}/todo`)
  return res.json()
}
export async function createTodo(data: any) {
  const res = await fetch(`${BASE}/todo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  return res.json()
}
export async function updateTodo(id: string, data: any) {
  const res = await fetch(`${BASE}/todo/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  return res.json()
}
export async function deleteTodo(id: string) {
  const res = await fetch(`${BASE}/todo/${id}`, { method: 'DELETE' })
  return res.json()
}



// TypeScript interfaces matching backend Pydantic models

export interface UserInput {
  session_id: string;
  content?: string;
  lang_hint?: string;
  audio_base64?: string;
  image_base64?: string;
  output_mode?: 'text' | 'audio';
  metadata?: Record<string, any>;
}

export interface Signals {
  text_sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  audio_prosody?: string;
  visual_sentiment?: string;
  mood_fused: 'calm' | 'anxious' | 'sad' | 'angry' | 'neutral' | 'urgent';
  confidence: number;
}

export interface RetrievalRequest {
  embedding: number[];
  top_k: number;
  filters?: Record<string, any>;
}

export interface RetrievedChunk {
  doc_id: string;
  text: string;
  score: number;
  meta: Record<string, any>;
}

export interface RetrievalResult {
  results: RetrievedChunk[];
  total: number;
}

export interface LLMContext {
  system_prompt: string;
  user_turns: Record<string, any>[];
  signals: Signals;
  retrieved: RetrievalResult;
  todo_snapshot: Record<string, any>[];
  lang: string;
}

export interface LLMOutput {
  text: string;
  tokens: number;
  safety_flags: string[];
  language: string;
}

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  due?: string;
  done: boolean;
  priority?: number;
  created_at: string;
  updated_at: string;
}

export interface OutputEnvelope {
  turn_id: string;
  llm_output: LLMOutput;
  todo_advice: TodoItem[];
  audio_ref?: string | null;
  metadata: Record<string, any>;
}

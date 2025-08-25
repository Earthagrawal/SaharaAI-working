from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel


class UserInput(BaseModel):
    session_id: str
    content: Optional[str] = None
    lang_hint: Optional[str] = None
    audio_base64: Optional[str] = None
    image_base64: Optional[str] = None
    output_mode: Literal["text", "audio"] = "text"
    metadata: Optional[Dict[str, Any]] = None


class Signals(BaseModel):
    text_sentiment: Literal["positive", "neutral", "negative", "mixed"]
    audio_prosody: Optional[str] = None
    visual_sentiment: Optional[str] = None
    mood_fused: Literal["calm", "anxious", "sad", "angry", "neutral", "urgent"]
    confidence: float


class RetrievedChunk(BaseModel):
    doc_id: str
    text: str
    score: float
    meta: Dict[str, Any]


class RetrievalResult(BaseModel):
    results: List[RetrievedChunk]
    total: int


class RetrievalRequest(BaseModel):
    embedding: List[float]
    top_k: int
    filters: Optional[Dict[str, Any]] = None


class LLMContext(BaseModel):
    system_prompt: str
    user_turns: List[Dict[str, Any]]
    signals: Signals
    retrieved: RetrievalResult
    todo_snapshot: List[Dict[str, Any]]
    lang: str


class LLMOutput(BaseModel):
    text: str
    tokens: int
    safety_flags: List[str]
    language: str


class TodoItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    due: Optional[datetime] = None
    done: bool
    priority: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class OutputEnvelope(BaseModel):
    turn_id: str
    llm_output: LLMOutput
    todo_advice: List[TodoItem]
    audio_ref: Optional[str]
    metadata: Dict[str, Any]



from __future__ import annotations

import base64
import hashlib
import os
import uuid
from dataclasses import dataclass
from typing import Any, Dict, List, Literal, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field

from ..utils.logging import get_logger, redact_pii
from ..graph.sahara import SaharaConvoGraph
from ..models.schemas import (
    UserInput,
    Signals,
    RetrievedChunk,
    RetrievalResult,
    RetrievalRequest,
    LLMContext,
    LLMOutput,
    TodoItem,
    OutputEnvelope,
)


router = APIRouter()
logger = get_logger()


 


def load_system_prompt() -> str:
    path = os.path.join(os.path.dirname(__file__), "..", "prompt", "system_prompt.txt")
    with open(os.path.abspath(path), "r", encoding="utf-8") as f:
        return f.read()


SYSTEM_PROMPT = load_system_prompt()
GRAPH = SaharaConvoGraph()


def mock_embedding(text: str, dim: int) -> List[float]:
    h = hashlib.sha256(text.encode("utf-8")).digest()
    # Repeat bytes to fill dim deterministically
    arr = (h * ((dim // len(h)) + 1))[:dim]
    return [b / 255.0 for b in arr]


def mock_llm_reply(context: LLMContext) -> str:
    mood = context.signals.mood_fused
    return (
        f"I hear you. Based on your mood ({mood}), here are a few gentle steps you can try: "
        f"take 3 slow breaths, write one thought, and reach out to someone you trust."
    )


def analyze_text_sentiment(text: str) -> str:
    t = text.lower()
    if any(w in t for w in ["sad", "down", "depressed", "lonely", "anxious", "stress"]):
        return "negative"
    if any(w in t for w in ["great", "good", "okay", "fine"]):
        return "positive"
    return "neutral"


def fuse_signals(text: Optional[str]) -> Signals:
    if not text:
        return Signals(text_sentiment="neutral", audio_prosody=None, visual_sentiment=None, mood_fused="neutral", confidence=0.5)
    ts = analyze_text_sentiment(text)
    mood_map = {
        "positive": "calm",
        "neutral": "neutral",
        "negative": "sad",
        "mixed": "neutral",
    }
    return Signals(text_sentiment=ts, audio_prosody=None, visual_sentiment=None, mood_fused=mood_map.get(ts, "neutral"), confidence=0.8)


def get_top_k() -> int:
    try:
        return int(os.getenv("RETRIEVAL_TOP_K", "3"))
    except ValueError:
        return 3


def build_context(user_text: Optional[str], lang: str) -> LLMContext:
    signals = fuse_signals(user_text)
    retrieval = RetrievalResult(results=[], total=0)
    ctx = LLMContext(
        system_prompt=SYSTEM_PROMPT,
        user_turns=[{"role": "user", "content": (user_text or "")}],
        signals=signals,
        retrieved=retrieval,
        todo_snapshot=[],
        lang=lang or "en",
    )
    return ctx


@router.post("/turn", response_model=OutputEnvelope)
async def post_turn(payload: Optional[UserInput] = None,
                    file: Optional[UploadFile] = File(None),
                    session_id: Optional[str] = Form(None),
                    output_mode: Optional[str] = Form(None)) -> OutputEnvelope:
    # Accept JSON or multipart
    if payload is None and session_id is None:
        raise HTTPException(status_code=400, detail="Missing input")

    mock = os.getenv("MOCK_MODE", "true").lower() == "true"

    if payload is None:
        a_bytes = await file.read() if file is not None else None
        ingest = GRAPH.InputIngest(text=None, audio_bytes=a_bytes, image_bytes=None, lang_hint="en")
    else:
        ingest = GRAPH.InputIngest(text=payload.content, audio_bytes=None, image_bytes=None, lang_hint=payload.lang_hint or "en")

    signals = GRAPH.SignalAnalyze(transcript=ingest["transcript"], image_bytes=None)
    req = GRAPH.QueryBuilder(transcript=ingest["transcript"]) 
    retrieved = GRAPH.RetrieveFromRedis(request=req)
    ctx = GRAPH.AssembleLLMContext(system_prompt=SYSTEM_PROMPT, lang=ingest["lang"], transcript=ingest["transcript"], signals=signals, retrieved=retrieved, todo_snapshot=[])
    llm = GRAPH.GemmaResponder(context=ctx)
    turn_id = str(uuid.uuid4())
    audio_ref: Optional[str] = None
    if (payload and payload.output_mode == "audio") or (output_mode == "audio"):
        audio_ref, diag = GRAPH.OutputRouter(output_mode="audio", llm_output=llm, lang=ctx.lang)
    else:
        _, diag = GRAPH.OutputRouter(output_mode="text", llm_output=llm, lang=ctx.lang)

    envelope = OutputEnvelope(
        turn_id=turn_id,
        llm_output=llm,
        todo_advice=[],
        audio_ref=audio_ref,
        metadata={"retrieval_used": len(retrieved.results) > 0, **diag},
    )

    logger.info("turn_completed", extra={"request_id": turn_id, "summary": redact_pii(llm.text)})
    return envelope



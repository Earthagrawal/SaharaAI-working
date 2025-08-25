from __future__ import annotations

import base64
import hashlib
import json
import os
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime, timezone

import redis

from ..models.schemas import (
    LLMContext,
    LLMOutput,
    OutputEnvelope,
    RetrievalRequest,
    RetrievalResult,
    RetrievedChunk,
    Signals,
    TodoItem,
)


def _redis_client() -> Optional[redis.Redis]:
    url = os.getenv("REDIS_URL")
    if not url:
        return None
    try:
        return redis.from_url(url)
    except Exception:
        return None


def _sha_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


class SaharaConvoGraph:
    def __init__(self) -> None:
        self.mock = os.getenv("MOCK_MODE", "true").lower() == "true"
        self.redis = _redis_client()
        self.top_k = int(os.getenv("RETRIEVAL_TOP_K", "3"))
        self.dim = int(os.getenv("REDIS_VECTOR_DIM", "128"))

    # 1. InputIngest
    def InputIngest(self, *, text: Optional[str], audio_bytes: Optional[bytes], image_bytes: Optional[bytes], lang_hint: Optional[str]) -> Dict[str, Any]:
        transcript = text or None
        audio_hash = None
        stt_conf = None
        lang = lang_hint or "en"
        if audio_bytes is not None and transcript is None:
            key = None
            if self.redis is not None:
                audio_hash = _sha_bytes(audio_bytes)
                key = f"stt:{audio_hash}"
                cached = self.redis.get(key)
                if cached:
                    transcript = cached.decode("utf-8")
            if transcript is None:
                transcript = "mock transcript" if self.mock else ""
                stt_conf = 0.9 if self.mock else None
                if key and self.redis is not None:
                    ttl_min = int(os.getenv("STT_CACHE_TTL_MIN", "60"))
                    self.redis.setex(key, ttl_min * 60, transcript)
        return {"transcript": transcript or "", "lang": lang, "audio_hash": audio_hash, "stt_confidence": stt_conf}

    # 2. SignalAnalyze
    def SignalAnalyze(self, *, transcript: str, image_bytes: Optional[bytes]) -> Signals:
        t = transcript.lower()
        if any(w in t for w in ["sad", "down", "lonely", "depressed", "anxious", "stress"]):
            text_sent = "negative"
            fused = "sad"
        elif any(w in t for w in ["great", "good", "okay", "fine"]):
            text_sent = "positive"
            fused = "calm"
        else:
            text_sent = "neutral"
            fused = "neutral"
        return Signals(text_sentiment=text_sent, audio_prosody=None, visual_sentiment=None, mood_fused=fused, confidence=0.8)

    # 3. QueryBuilder
    def QueryBuilder(self, *, transcript: str) -> RetrievalRequest:
        text = transcript
        key = f"emb:{hashlib.sha256((text + 'mock').encode('utf-8')).hexdigest()}"
        vec: Optional[bytes] = None
        if self.redis is not None:
            vec = self.redis.get(key)
        if vec is None:
            # deterministic mock embedding
            h = hashlib.sha256(text.encode("utf-8")).digest()
            arr = (h * ((self.dim // len(h)) + 1))[: self.dim]
            floats = bytes(bytearray(arr))
            if self.redis is not None:
                self.redis.setex(key, 60 * 60, floats)
        else:
            floats = vec
        # Convert bytes to float list in [0,1]
        embedding = [b / 255.0 for b in floats]
        return RetrievalRequest(embedding=embedding, top_k=self.top_k)

    # 4. RetrieveFromRedis
    def RetrieveFromRedis(self, *, request: RetrievalRequest) -> RetrievalResult:
        # graceful continue with empty results if unavailable
        if self.redis is None:
            return RetrievalResult(results=[], total=0)
        # For mock mode we won't run vector KNN; return empty unless seeded logic added
        return RetrievalResult(results=[], total=0)

    # 5. AssembleLLMContext
    def AssembleLLMContext(self, *, system_prompt: str, lang: str, transcript: str, signals: Signals, retrieved: RetrievalResult, todo_snapshot: List[Dict[str, Any]]) -> LLMContext:
        turns = [{"role": "user", "content": transcript}]
        return LLMContext(
            system_prompt=system_prompt,
            user_turns=turns,
            signals=signals,
            retrieved=retrieved,
            todo_snapshot=todo_snapshot,
            lang=lang,
        )

    # 6. GemmaResponder
    def GemmaResponder(self, *, context: LLMContext) -> LLMOutput:
        reply = (
            f"I hear you. Based on your mood ({context.signals.mood_fused}), try a short grounding exercise: "
            f"inhale 4, hold 4, exhale 6. I'm here to listen."
        )
        return LLMOutput(text=reply, tokens=len(reply.split()), safety_flags=[], language=context.lang)

    # 7. TodoAdvisor
    def TodoAdvisor(self, *, llm_output: LLMOutput) -> List[TodoItem]:
        base_id = hashlib.md5(llm_output.text.encode("utf-8")).hexdigest()[:8]
        item = TodoItem(
            id=base_id,
            title="Try 5-minute breathing",
            description="Inhale 4s, hold 4s, exhale 6s",
            due=None,
            done=False,
            priority=1,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        return [item]

    # 8. OutputRouter
    def OutputRouter(self, *, output_mode: str, llm_output: LLMOutput, lang: str) -> Tuple[Optional[str], Dict[str, Any]]:
        if output_mode == "audio":
            if self.mock:
                return "data:audio/mp3;base64," + base64.b64encode(b"mockmp3").decode("utf-8"), {"tts": "mock"}
            return None, {"tts_error": "tts_not_configured"}
        return None, {"tts": "none"}



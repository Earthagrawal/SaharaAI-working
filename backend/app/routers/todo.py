from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid


router = APIRouter()


class TodoItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    due: Optional[datetime] = None
    done: bool
    priority: Optional[int] = None
    created_at: datetime
    updated_at: datetime


# In-memory store keyed by ID
TODO_STORE: Dict[str, TodoItem] = {}


@router.get("/todo", response_model=List[TodoItem])
def list_todos() -> List[TodoItem]:
    return list(TODO_STORE.values())


class TodoCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due: Optional[datetime] = None
    priority: Optional[int] = None


@router.post("/todo", response_model=TodoItem)
def create_todo(payload: TodoCreate) -> TodoItem:
    now = datetime.now(timezone.utc)
    item = TodoItem(
        id=str(uuid.uuid4()),
        title=payload.title,
        description=payload.description,
        due=payload.due,
        done=False,
        priority=payload.priority,
        created_at=now,
        updated_at=now,
    )
    TODO_STORE[item.id] = item
    return item


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due: Optional[datetime] = None
    done: Optional[bool] = None
    priority: Optional[int] = None


@router.patch("/todo/{id}", response_model=TodoItem)
def update_todo(id: str, payload: TodoUpdate) -> TodoItem:
    if id not in TODO_STORE:
        raise HTTPException(status_code=404, detail="Todo not found")
    item = TODO_STORE[id]
    update_data = payload.dict(exclude_unset=True)
    for k, v in update_data.items():
        setattr(item, k, v)
    item.updated_at = datetime.now(timezone.utc)
    TODO_STORE[id] = item
    return item


@router.delete("/todo/{id}")
def delete_todo(id: str) -> Dict[str, str]:
    if id not in TODO_STORE:
        raise HTTPException(status_code=404, detail="Todo not found")
    del TODO_STORE[id]
    return {"status": "deleted"}



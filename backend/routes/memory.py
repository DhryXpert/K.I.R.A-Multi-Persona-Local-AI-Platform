"""FastAPI routes for Long-term and Core Memory Management."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from ..memory.vector_store import (
    add_memory,
    get_all_memories,
    search_memories,
)

router = APIRouter(prefix="/api/memory", tags=["memory"])


class MemoryCreateRequest(BaseModel):
    namespace: str = "user_core"
    content: str
    category: Optional[str] = "general"


class MemorySearchRequest(BaseModel):
    namespaces: List[str]
    query: str
    limit: Optional[int] = 5


@router.get("")
def list_memories(namespace: Optional[str] = None):
    return get_all_memories(namespace)


@router.post("")
def create_memory(req: MemoryCreateRequest):
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")
    add_memory(req.namespace, req.content.strip(), req.category or "general")
    return {"status": "ok", "message": "Memory saved successfully"}


@router.post("/search")
def search_memory_endpoint(req: MemorySearchRequest):
    results = search_memories(req.namespaces, req.query, req.limit or 5)
    return {"results": results}


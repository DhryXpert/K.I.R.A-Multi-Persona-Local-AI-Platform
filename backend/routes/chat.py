"""FastAPI routes for chat and streaming completions."""
import json
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from sse_starlette.sse import EventSourceResponse

from ..personas.loader import get_persona
from ..ollama_client import stream_chat, check_ollama_health
from ..memory.store import (
    get_session,
    create_session,
    save_message,
    get_recent_context,
    get_messages,
    list_sessions,
    delete_session,
    rename_session,
)
from ..memory.vector_store import (
    search_memories,
)

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    persona_id: str
    message: str
    session_id: Optional[str] = None
    model: Optional[str] = None


class RenameRequest(BaseModel):
    title: str


@router.get("/sessions")
def get_user_sessions():
    return list_sessions()


@router.get("/sessions/{session_id}")
def get_session_history(session_id: str):
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    messages = get_messages(session_id)
    return {"session": session, "messages": messages}


@router.delete("/sessions/{session_id}")
def delete_session_endpoint(session_id: str):
    delete_session(session_id)
    return {"status": "ok"}


@router.patch("/sessions/{session_id}")
def rename_session_endpoint(session_id: str, req: RenameRequest):
    if not req.title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty")
    rename_session(session_id, req.title.strip())
    return {"status": "ok", "title": req.title.strip()}


@router.post("")
async def send_message(req: ChatRequest):
    # Verify persona exists
    persona = get_persona(req.persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail=f"Persona '{req.persona_id}' not found")

    # If request specifies a model override, apply it
    if req.model:
        persona = persona.model_copy(update={"model": req.model})

    # Check Ollama status
    if not await check_ollama_health():
        raise HTTPException(
            status_code=503,
            detail="Ollama is not running. Please ensure 'ollama serve' is active."
        )

    # Resolve or create session
    session_id = req.session_id
    if not session_id or not get_session(session_id):
        session_id = session_id or str(uuid.uuid4())
        title = req.message[:30] + ("..." if len(req.message) > 30 else "")
        create_session(session_id, title, persona.id)

    # Save user message to SQLite
    save_message(session_id, "user", req.message)

    # Retrieve relevant memories across persona namespace and shared user_core
    namespaces = [persona.memory_namespace, "user_core"]
    memories = search_memories(namespaces, req.message, limit=4)

    # Get recent conversation context (sliding window)
    context_messages = get_recent_context(session_id, limit=10)

    async def event_generator():
        # First send session meta info
        yield {
            "event": "start",
            "data": json.dumps({
                "session_id": session_id,
                "persona_id": persona.id,
                "model": persona.model
            })
        }

        full_reply = []
        try:
            async for token in stream_chat(persona, context_messages, relevant_memories=memories):
                full_reply.append(token)
                yield {
                    "event": "token",
                    "data": json.dumps({"token": token})
                }

            # Save full assistant message when done
            assistant_response = "".join(full_reply)
            save_message(session_id, "assistant", assistant_response)

            yield {
                "event": "done",
                "data": json.dumps({"done": True})
            }
        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)})
            }

    return EventSourceResponse(event_generator())

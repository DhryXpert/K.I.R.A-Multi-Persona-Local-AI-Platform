"""Persona Pydantic Schema."""
from pydantic import BaseModel, Field
from typing import Optional


class PersonaConfig(BaseModel):
    id: str
    display_name: str
    role: str
    avatar: Optional[str] = "assistant.png"
    accent_color: Optional[str] = "#3b82f6"
    model: str = "llama3:8b"
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_p: float = Field(default=0.9, ge=0.0, le=1.0)
    top_k: int = Field(default=40, ge=1)
    system_prompt: str
    memory_namespace: str


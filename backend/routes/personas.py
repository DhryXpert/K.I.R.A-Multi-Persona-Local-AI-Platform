"""FastAPI routers for personas."""
from fastapi import APIRouter, HTTPException
from typing import List
from ..personas.schema import PersonaConfig
from ..personas.loader import list_personas, get_persona

router = APIRouter(prefix="/api/personas", tags=["personas"])


@router.get("", response_model=List[PersonaConfig])
def get_all_personas():
    return list_personas()


@router.get("/{persona_id}", response_model=PersonaConfig)
def get_single_persona(persona_id: str):
    persona = get_persona(persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail=f"Persona '{persona_id}' not found")
    return persona


"""FastAPI routers for personas and installed Ollama models."""
from fastapi import APIRouter, HTTPException
from typing import List
import ollama
from ..config import OLLAMA_HOST
from ..personas.schema import PersonaConfig
from ..personas.loader import list_personas, get_persona

router = APIRouter(prefix="/api/personas", tags=["personas"])


@router.get("", response_model=List[PersonaConfig])
def get_all_personas():
    return list_personas()


@router.get("/models/installed")
async def list_installed_models():
    try:
        client = ollama.AsyncClient(host=OLLAMA_HOST)
        resp = await client.list()
        model_names = []
        models_list = resp.get("models", []) if isinstance(resp, dict) else getattr(resp, "models", [])
        for m in models_list:
            name = getattr(m, "model", None) or getattr(m, "name", None)
            if not name and isinstance(m, dict):
                name = m.get("model") or m.get("name")
            if name and name not in model_names:
                model_names.append(name)
        if not model_names:
            model_names = ["llama3:8b"]
        return {"models": model_names}
    except Exception as e:
        return {"models": ["llama3:8b"], "error": str(e)}


@router.get("/{persona_id}", response_model=PersonaConfig)
def get_single_persona(persona_id: str):
    persona = get_persona(persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail=f"Persona '{persona_id}' not found")
    return persona

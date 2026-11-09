"""Persona loader and repository."""
import os
import json
from typing import Dict, List, Optional
from .schema import PersonaConfig

PERSONAS_DIR = os.path.dirname(__file__)


def load_personas() -> Dict[str, PersonaConfig]:
    personas = {}
    for filename in os.listdir(PERSONAS_DIR):
        if filename.endswith(".json"):
            file_path = os.path.join(PERSONAS_DIR, filename)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    persona = PersonaConfig(**data)
                    personas[persona.id] = persona
            except Exception as e:
                print(f"Error loading persona from {filename}: {e}")
    return personas


def get_persona(persona_id: str) -> Optional[PersonaConfig]:
    personas = load_personas()
    return personas.get(persona_id)


def list_personas() -> List[PersonaConfig]:
    return list(load_personas().values())


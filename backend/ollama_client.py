"""Ollama streaming client wrapping ollama-python."""
import json
from typing import AsyncGenerator, List, Dict
import ollama
from .personas.schema import PersonaConfig

OLLAMA_HOST = "http://localhost:11434"
client = ollama.AsyncClient(host=OLLAMA_HOST)


async def check_ollama_health() -> bool:
    try:
        await client.list()
        return True
    except Exception:
        return False


async def stream_chat(
    persona: PersonaConfig,
    messages: List[Dict[str, str]],
) -> AsyncGenerator[str, None]:
    """
    Streams response tokens from Ollama for a given persona and message history.
    """
    # System prompt injected as first message
    full_messages = [{"role": "system", "content": persona.system_prompt}]
    full_messages.extend(messages)

    options = {
        "temperature": persona.temperature,
        "top_p": persona.top_p,
        "top_k": persona.top_k,
    }

    response_stream = await client.chat(
        model=persona.model,
        messages=full_messages,
        options=options,
        stream=True
    )

    async for chunk in response_stream:
        content = chunk.get("message", {}).get("content", "")
        if content:
            yield content


"""Ollama streaming client wrapping ollama-python."""
from typing import AsyncGenerator, List, Dict, Optional
import ollama
from .config import OLLAMA_HOST
from .personas.schema import PersonaConfig

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
    relevant_memories: Optional[List[str]] = None,
) -> AsyncGenerator[str, None]:
    """
    Streams response tokens from Ollama for a given persona and message history,
    augmenting system instructions with relevant core and persona memories.
    """
    system_content = persona.system_prompt

    if relevant_memories:
        mem_block = "\n".join(f"- {m}" for m in relevant_memories)
        system_content += f"\n\n[RELEVANT_CONTEXT_ABOUT_USER]\n{mem_block}\nUse the above context naturally when appropriate without explicitly repeating it unless asked."

    full_messages = [{"role": "system", "content": system_content}]
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

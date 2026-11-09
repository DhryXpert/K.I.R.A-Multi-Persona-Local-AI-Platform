"""FastAPI Main Application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import CORS_ORIGINS
from .memory.store import init_db
from .memory.vector_store import init_memory_db
from .routes.chat import router as chat_router
from .routes.personas import router as personas_router
from .routes.memory import router as memory_router

app = FastAPI(
    title="K.I.R.A API",
    description="Multi-Persona Local AI Platform",
    version="1.0.0"
)

# Enable CORS for React frontend from config
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(personas_router)
app.include_router(chat_router)
app.include_router(memory_router)


@app.on_event("startup")
def on_startup():
    init_db()
    init_memory_db()


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "K.I.R.A Backend"}

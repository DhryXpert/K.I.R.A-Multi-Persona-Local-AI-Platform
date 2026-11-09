"""FastAPI Main Application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .memory.store import init_db
from .routes.chat import router as chat_router
from .routes.personas import router as personas_router

app = FastAPI(
    title="K.I.R.A API",
    description="Multi-Persona Local AI Platform",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(personas_router)
app.include_router(chat_router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "K.I.R.A Backend"}


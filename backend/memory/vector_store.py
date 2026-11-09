"""
Long-term and Shared Core Memory Manager using SQLite Full-Text Search (FTS5).
Provides high-performance local memory retrieval without requiring external C++ build chains.
"""
import sqlite3
import os
from typing import List, Dict, Optional
from ..config import MEMORY_DB_PATH

DB_PATH = MEMORY_DB_PATH


def get_mem_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_memory_db():
    conn = get_mem_connection()
    cursor = conn.cursor()
    # FTS5 full-text search table for fast keyword and semantic text retrieval
    cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS memories USING fts5(
            namespace,
            content,
            category,
            tokenize='porter unicode61'
        )
    """)
    # Regular metadata table to track memory timestamps & IDs
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS memory_meta (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            namespace TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT DEFAULT 'general',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()

    # Seed initial user core memory if empty
    cursor.execute("SELECT count(*) as count FROM memory_meta WHERE namespace = 'user_core'")
    row = cursor.fetchone()
    if row["count"] == 0:
        seed_core_memories = [
            ("user_core", "User name is Dhairya. Working on K.I.R.A platform.", "profile"),
            ("user_core", "User stack: Python (FastAPI), React, Vite, TailwindCSS, Ollama.", "tech_stack"),
            ("user_core", "Project goal: Build a multi-persona local AI platform that runs 100% locally.", "goal"),
        ]
        for ns, content, cat in seed_core_memories:
            cursor.execute(
                "INSERT INTO memory_meta (namespace, content, category) VALUES (?, ?, ?)",
                (ns, content, cat)
            )
            cursor.execute(
                "INSERT INTO memories (namespace, content, category) VALUES (?, ?, ?)",
                (ns, content, cat)
            )
        conn.commit()

    conn.close()


def add_memory(namespace: str, content: str, category: str = "general"):
    """Store a long-term fact or summary for a specific persona or user_core."""
    conn = get_mem_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO memory_meta (namespace, content, category) VALUES (?, ?, ?)",
        (namespace, content, category)
    )
    cursor.execute(
        "INSERT INTO memories (namespace, content, category) VALUES (?, ?, ?)",
        (namespace, content, category)
    )
    conn.commit()
    conn.close()


def search_memories(namespaces: List[str], query: str, limit: int = 5) -> List[str]:
    """Search relevant memories matching query across persona and user_core namespaces."""
    conn = get_mem_connection()
    cursor = conn.cursor()

    # Clean query terms for FTS syntax
    words = [w for w in query.replace('"', '').replace("'", '').split() if len(w) > 2]
    if not words:
        placeholders = ",".join("?" for _ in namespaces)
        cursor.execute(
            f"""
            SELECT content FROM memory_meta 
            WHERE namespace IN ({placeholders}) 
            ORDER BY id DESC LIMIT ?
            """,
            (*namespaces, limit)
        )
        rows = cursor.fetchall()
        conn.close()
        return [r["content"] for r in rows]

    fts_query = " OR ".join(f'"{w}"*' for w in words)
    results = []

    for ns in namespaces:
        try:
            cursor.execute(
                """
                SELECT content, rank FROM memories 
                WHERE memories MATCH ? AND namespace = ?
                ORDER BY rank LIMIT ?
                """,
                (fts_query, ns, limit)
            )
            rows = cursor.fetchall()
            for r in rows:
                if r["content"] not in results:
                    results.append(r["content"])
        except Exception:
            pass

    if len(results) < 2 and "user_core" in namespaces:
        cursor.execute("SELECT content FROM memory_meta WHERE namespace = 'user_core' LIMIT 3")
        for r in cursor.fetchall():
            if r["content"] not in results:
                results.append(r["content"])

    conn.close()
    return results[:limit]


def get_all_memories(namespace: Optional[str] = None) -> List[Dict]:
    """Retrieve list of memories (for admin/inspect routes)."""
    conn = get_mem_connection()
    cursor = conn.cursor()
    if namespace:
        cursor.execute("SELECT * FROM memory_meta WHERE namespace = ? ORDER BY id DESC", (namespace,))
    else:
        cursor.execute("SELECT * FROM memory_meta ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

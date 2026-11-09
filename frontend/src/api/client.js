// API service for interacting with K.I.R.A backend
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export async function fetchPersonas() {
  const res = await fetch(`${API_BASE}/personas`);
  if (!res.ok) throw new Error("Failed to load personas");
  return res.json();
}

export async function fetchInstalledModels() {
  try {
    const res = await fetch(`${API_BASE}/personas/models/installed`);
    if (!res.ok) return ["llama3:8b"];
    const data = await res.json();
    return data.models || ["llama3:8b"];
  } catch {
    return ["llama3:8b"];
  }
}

export async function fetchSessions() {
  const res = await fetch(`${API_BASE}/chat/sessions`);
  if (!res.ok) throw new Error("Failed to load sessions");
  return res.json();
}

export async function fetchSessionHistory(sessionId) {
  const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}`);
  if (!res.ok) throw new Error("Failed to load session messages");
  return res.json();
}

export async function deleteSession(sessionId) {
  const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete session");
  return res.json();
}

export async function renameSession(sessionId, title) {
  const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to rename session");
  return res.json();
}

export async function fetchMemories(namespace = null) {
  const url = namespace ? `${API_BASE}/memory?namespace=${encodeURIComponent(namespace)}` : `${API_BASE}/memory`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch memories");
  return res.json();
}

export async function addMemory({ namespace = "user_core", content, category = "general" }) {
  const res = await fetch(`${API_BASE}/memory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ namespace, content, category }),
  });
  if (!res.ok) throw new Error("Failed to add memory");
  return res.json();
}

export async function streamChat({ personaId, message, sessionId, model, onStart, onToken, onDone, onError }) {
  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        persona_id: personaId,
        message: message,
        session_id: sessionId,
        model: model,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Server error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, "\n");
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() || "";

      for (const block of blocks) {
        if (!block.trim()) continue;
        const lines = block.split("\n");
        let event = "message";
        let dataStr = "";

        for (const line of lines) {
          if (line.startsWith("event:")) {
            event = line.replace("event:", "").trim();
          } else if (line.startsWith("data:")) {
            dataStr = line.slice(5).trim();
          }
        }

        if (!dataStr) continue;
        try {
          const parsed = JSON.parse(dataStr);
          if (event === "start" && onStart) onStart(parsed);
          else if (event === "token" && onToken) onToken(parsed.token);
          else if (event === "done" && onDone) onDone();
          else if (event === "error" && onError) onError(parsed.error);
        } catch (e) {
          console.error("Error parsing SSE data chunk:", e, dataStr);
        }
      }
    }

    if (onDone) onDone();
  } catch (err) {
    if (onError) onError(err.message);
  }
}

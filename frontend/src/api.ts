export type ChatRequest = {
  message: string;
  session_id: string | null;
};

export type ChatResponse = {
  session_id: string;
  message: string;
  reply: string;
};

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

export async function sendChatMessage(
  payload: ChatRequest,
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const data: { detail?: string } = await response.json();
      if (data.detail) detail = data.detail;
    } catch {
      // Keep the HTTP status message if the response isn't JSON.
    }
    throw new Error(detail);
  }

  return (await response.json()) as ChatResponse;
}

export type StreamCallbacks = {
  onSession?: (sessionId: string) => void;
  onDelta?: (delta: string) => void;
  onDone?: (sessionId: string) => void;
  onError?: (error: string) => void;
};

export async function streamChatMessage(
  payload: ChatRequest,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<{ sessionId: string; reply: string }> {
  const response = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const data: { detail?: string } = await response.json();
      if (data.detail) detail = data.detail;
    } catch {
      // Keep HTTP status message
    }
    throw new Error(detail);
  }

  if (!response.body) {
    throw new Error("No readable stream available in response.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let currentSessionId = payload.session_id || "";
  let fullReply = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr) continue;

        try {
          const data = JSON.parse(jsonStr) as {
            event?: "session" | "delta" | "done" | "error";
            session_id?: string;
            delta?: string;
            error?: string;
          };

          if (data.event === "session" && data.session_id) {
            currentSessionId = data.session_id;
            callbacks.onSession?.(data.session_id);
          } else if (data.event === "delta" && data.delta) {
            fullReply += data.delta;
            callbacks.onDelta?.(data.delta);
          } else if (data.event === "done") {
            if (data.session_id) currentSessionId = data.session_id;
            callbacks.onDone?.(currentSessionId);
          } else if (data.event === "error") {
            const err = data.error || "Streaming error encountered.";
            callbacks.onError?.(err);
            throw new Error(err);
          }
        } catch (err) {
          if (err instanceof Error && err.message !== "Unexpected end of JSON input") {
            throw err;
          }
        }
      }
    }

    if (buffer.trim()) {
      const trimmed = buffer.trim();
      if (trimmed.startsWith("data:")) {
        const jsonStr = trimmed.slice(5).trim();
        if (jsonStr) {
          try {
            const data = JSON.parse(jsonStr);
            if (data.event === "delta" && data.delta) {
              fullReply += data.delta;
              callbacks.onDelta?.(data.delta);
            } else if (data.event === "done" && data.session_id) {
              currentSessionId = data.session_id;
              callbacks.onDone?.(currentSessionId);
            }
          } catch {
            // Ignore trailing malformed buffer
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { sessionId: currentSessionId, reply: fullReply };
}


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

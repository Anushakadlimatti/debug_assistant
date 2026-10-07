import { IncidentChatSession } from "./chat-session.ts";

export { IncidentChatSession };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/chat" && request.method === "POST") {
      return handleChat(request, env);
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;

async function handleChat(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Request body must be JSON." }, 400);
  }

  const message =
    typeof body === "object" && body !== null && "message" in body
      ? String((body as { message: unknown }).message ?? "").trim()
      : "";

  if (!message) {
    return json({ error: "Please provide a question in the `message` field." }, 400);
  }

  const sessionId = resolveSessionId(
    typeof body === "object" && body !== null && "sessionId" in body
      ? (body as { sessionId: unknown }).sessionId
      : undefined,
  );

  try {
    const stub = env.CHAT_SESSIONS.getByName(sessionId);
    const result = await stub.chat(message);

    if ("error" in result) {
      return json(
        {
          error: result.error,
          ...(result.detail ? { detail: result.detail } : {}),
          sessionId,
        },
        502,
      );
    }

    return json({ reply: result.reply, sessionId });
  } catch {
    return json(
      { error: "Failed to analyze the incident. Please try again.", sessionId },
      502,
    );
  }
}

function resolveSessionId(value: unknown): string {
  if (typeof value === "string") {
    const candidate = value.trim();
    if (UUID_PATTERN.test(candidate)) {
      return candidate.toLowerCase();
    }
  }

  return crypto.randomUUID();
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

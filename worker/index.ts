import { incidentDataset } from "./incident-data.ts";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompt.ts";

const DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

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

  const model = (env.MODEL_ID || DEFAULT_MODEL) as typeof DEFAULT_MODEL;

  try {
    const result = await env.AI.run(model, {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(message, incidentDataset) },
      ],
      max_tokens: 1200,
      temperature: 0.2,
    });

    const reply = extractReply(result);
    if (!reply) {
      return json({ error: "The model returned an empty response." }, 502);
    }

    return json({ reply });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown AI error";
    return json(
      { error: "Failed to analyze the incident. Please try again.", detail },
      502,
    );
  }
}

function extractReply(result: unknown): string {
  if (typeof result === "string") {
    return result.trim();
  }

  if (!result || typeof result !== "object") {
    return "";
  }

  const value = result as {
    response?: unknown;
    choices?: Array<{ message?: { content?: unknown } }>;
  };

  if (typeof value.response === "string") {
    return value.response.trim();
  }

  const content = value.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content.trim();
  }

  return "";
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

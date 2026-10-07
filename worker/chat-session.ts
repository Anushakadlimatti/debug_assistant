import { DurableObject } from "cloudflare:workers";
import { incidentDataset } from "./incident-data.ts";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompt.ts";

const DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const MAX_HISTORY_MESSAGES = 16;
const STATE_KEY = "state";

export type ChatRole = "user" | "assistant";

export type StoredMessage = {
  role: ChatRole;
  content: string;
};

type SessionState = {
  messages: StoredMessage[];
};

type ChatSuccess = {
  reply: string;
};

type ChatFailure = {
  error: string;
  detail?: string;
};

export type ChatResult = ChatSuccess | ChatFailure;

export class IncidentChatSession extends DurableObject<Env> {
  async chat(message: string): Promise<ChatResult> {
    let history: StoredMessage[];
    try {
      history = await this.loadHistory();
    } catch {
      return { error: "Failed to analyze the incident. Please try again." };
    }

    const model = (this.env.MODEL_ID || DEFAULT_MODEL) as typeof DEFAULT_MODEL;
    const question =
      history.length > 0
        ? `${message}\n\nThis is a follow-up. Resolve references such as "that" from the previous messages in this conversation. Use only the incident dataset for facts.`
        : message;

    try {
      const result = await this.env.AI.run(model, {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...history.map((entry) => ({
            role: entry.role,
            content: entry.content,
          })),
          { role: "user", content: buildUserPrompt(question, incidentDataset) },
        ],
        max_tokens: 1200,
        temperature: 0.2,
      });

      const reply = extractReply(result);
      if (!reply) {
        return { error: "The model returned an empty response." };
      }

      try {
        await this.saveTurn(history, message, reply);
      } catch {
        // Keep the reply even if persistence fails for this turn.
      }

      return { reply };
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown AI error";
      return {
        error: "Failed to analyze the incident. Please try again.",
        detail,
      };
    }
  }

  private async loadHistory(): Promise<StoredMessage[]> {
    const state = await this.ctx.storage.get<SessionState>(STATE_KEY);
    if (!state || !Array.isArray(state.messages)) {
      return [];
    }

    return state.messages
      .filter(
        (entry): entry is StoredMessage =>
          !!entry &&
          (entry.role === "user" || entry.role === "assistant") &&
          typeof entry.content === "string" &&
          entry.content.length > 0,
      )
      .slice(-MAX_HISTORY_MESSAGES);
  }

  private async saveTurn(
    history: StoredMessage[],
    userMessage: string,
    assistantReply: string,
  ): Promise<void> {
    const messages = [
      ...history,
      { role: "user" as const, content: userMessage },
      { role: "assistant" as const, content: assistantReply },
    ].slice(-MAX_HISTORY_MESSAGES);

    await this.ctx.storage.put<SessionState>(STATE_KEY, { messages });
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

# Prompt History

## Build a simple chat UI

Create a small chat application where a user can ask questions like:

> "Why is the checkout API failing?"

The app should use Cloudflare Workers AI with Llama 3.3 to analyze mock incident data and explain the likely issue.

Keep it minimal:

- Simple React chat UI
- Worker API `POST /api/chat`
- Mock incident dataset
- Loading and error states
- Return what happened, evidence, likely root cause, and recommended action

## Give some mock data for the incident

Add a small hardcoded incident dataset the Worker can send to Llama 3.3 with the user question.

Include logs, metrics, deployments, and config changes for a checkout API failure so the model can explain what happened, evidence, likely root cause, and a recommended action.

## Make SYSTEM_PROMPT strictly evidence-based

Update only `prompt.ts`. The assistant must use only the provided incident dataset and never invent logs, metrics, database queries, deployments, root causes, or configuration changes.

- If a deployment status is `"success"`, never say that deployment failed.
- Distinguish a deployment failure from an application failure after a successful deploy.
- Correlate timestamps when determining causality.
- Distinguish facts from likely causes. If evidence is insufficient, say so.
- If the user asks about information that is not in the dataset, say that it is unavailable as the entire answer. Do not write a full investigation first and add that note at the end.
- If the question is vague, ask for clarification instead of generating a full investigation.

Keep the existing response format when the dataset can answer the question:

## What happened
## Evidence
## Likely root cause
## Recommended action

## Add Durable Object conversation memory

Extend the existing assistant with per-conversation memory using Cloudflare Durable Objects. Do not rewrite the app, add Vectorize/D1/RAG/auth/voice, or move the incident dataset into Durable Object storage.

Requirements:

- Add an `IncidentChatSession` Durable Object that stores `{ messages: [{ role, content }] }`
- Frontend sends `{ sessionId, message }` to the existing `POST /api/chat` endpoint
- The Worker validates the session ID, loads the Durable Object, and forwards the turn
- The Durable Object loads history, calls Llama 3.3 with the existing system prompt and incident dataset, stores the reply, and returns it
- Bound history to the latest 16 messages
- Follow-ups such as "What changed before that?" should resolve from conversation context
- Conversation history must not become a source of incident facts
- Use the current Wrangler Durable Objects syntax (`CHAT_SESSIONS` binding, SQLite-backed class export)
- Preserve the existing UI, dataset, evidence-based prompting, and AI error handling

### Implementation decisions

- SQLite-backed Durable Object via Wrangler `exports` (current recommended syntax; mutually exclusive with legacy `migrations`)
- RPC `chat()` method instead of a Durable Object `fetch` handler
- Invalid or missing session IDs are replaced with a new UUID rather than used as storage keys
- Incident dataset stays in `worker/incident-data.ts` and is attached to the current user turn only
- Optional **New conversation** control generates a new session ID and clears the visible transcript
- First-question pronouns such as "that" request clarification; later turns in the same session resolve those references from stored history

## Other prompts

- `npm run dev` failed because a `workers.dev` subdomain was required for the remote Workers AI proxy.

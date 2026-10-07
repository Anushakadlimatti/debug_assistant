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

## Other prompts

- `npm run dev` failed because a `workers.dev` subdomain was required for the remote Workers AI proxy.

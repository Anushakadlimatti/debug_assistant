# AI Incident Investigation Assistant

An AI-powered incident investigation assistant built with **React, Cloudflare Workers, and Workers AI**.

The application helps developers investigate production incidents using natural-language questions. It analyzes logs, metrics, deployments, configuration changes, and service health data to provide evidence-based answers.

## 🌐 Live Demo

**[Open the live application](https://incident-investigation-assistant.anushakadlimatti34.workers.dev/)**

---

## ✨ Features

- Natural-language incident investigation
- Meta Llama 3.3 through Cloudflare Workers AI
- Evidence-based incident analysis
- Correlation of logs, metrics, deployments, and configuration changes
- React chat interface
- Cloudflare Workers backend
- Explicitly handles unavailable information instead of inventing data

---

## 🏗️ Architecture

```text
React Chat UI
      ↓
Cloudflare Worker
      ↓
Workers AI (Llama 3.3)
      ↓
Incident Dataset
      ↓
AI Analysis
```

### How it works

1. User asks an incident-related question.
2. React sends the request to the Cloudflare Worker.
3. The Worker provides the incident context to the AI model.
4. Llama 3.3 analyzes the available evidence.
5. The response is returned to the chat interface.

---

## ☁️ Cloudflare Services

- **Cloudflare Workers** — Backend API and application runtime
- **Workers AI** — Llama 3.3 inference
- **Cloudflare Vite Plugin** — Local development and deployment integration

---

## 🔎 Incident Scenario

The demo investigates a production checkout API incident.

A deployment changed:

```text
PAYMENT_GATEWAY_TIMEOUT_MS
10000ms → 2000ms
```

At the same time, the payment gateway experienced elevated latency:

```text
Payment Gateway p95: 2840ms
```

The checkout API error rate increased from:

```text
1.2% → 41%
```

The assistant correlates these signals and identifies the reduced timeout combined with payment-gateway latency as the likely cause.

---

## 💬 Example Questions

Try asking:

```text
Why is the checkout API failing?

What changed before the incident?

Is the payment gateway affected?

Any other service affected?

What database query caused the failure?

What was the latest deployment?
```

The assistant only uses information available in the incident dataset. If requested information is unavailable, it explicitly says so rather than making up an answer.

---

## 🛠️ Tech Stack

- React
- TypeScript
- Vite
- Cloudflare Workers
- Cloudflare Workers AI
- Meta Llama 3.3
- Wrangler

---

## ⚙️ Setup

### Prerequisites

- Node.js
- npm
- Cloudflare account

### Clone and Install

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd incident-investigation-assistant
npm install
```

### Authenticate with Cloudflare

```bash
npx wrangler login
npx wrangler whoami
```

---

## 💻 Run Locally

Start the development server:

```bash
npm run dev
```

Open the local URL shown by Vite.

---

## 🧪 Validate

Run linting:

```bash
npm run lint
```

Build the application:

```bash
npm run build
```

---

## 🚀 Deploy

Deploy the application to Cloudflare Workers:

```bash
npm run deploy
```

The deployed application is available at:

**https://incident-investigation-assistant.anushakadlimatti34.workers.dev/**

---

## 📁 Project Structure

```text
worker/
├── index.ts
├── incident-data.ts
└── prompt.ts

src/
└── ...

prompts/
└── prompt-history.md

wrangler.jsonc
vite.config.ts
package.json
README.md
```

### Important Files

| File | Purpose |
|---|---|
| `worker/index.ts` | Worker API and Workers AI integration |
| `worker/incident-data.ts` | Mock incident dataset |
| `worker/prompt.ts` | AI prompts and response rules |
| `prompts/prompt-history.md` | AI-assisted development history |
| `wrangler.jsonc` | Cloudflare configuration |

---

## 🧠 AI-Assisted Development

AI coding tools were used during development.

The important prompts used during implementation are documented in:

```text
prompts/prompt-history.md
```

---

## 📌 Current Scope

The current version uses a static incident dataset to demonstrate the core AI investigation workflow.

The focus is on:

- Incident analysis
- Evidence correlation
- Root-cause reasoning
- Grounded AI responses

---

## 🔮 Future Improvements

Potential extensions include:

- **Cloudflare Workflows** for multi-step incident investigations
- **Durable Objects / D1** for investigation state and history
- **Vectorize** for historical incidents and runbook retrieval
- Integration with real observability and monitoring systems
- Voice-based incident investigation

---
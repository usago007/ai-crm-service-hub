# AI CRM Service Hub

> AI-powered cross-border e-commerce customer service platform — with RAG pipeline, document ingestion, safety guardrails and full i18n.

## Features

- **AI Suggested Replies** — Draft responses per issue type with confidence scores, source citations, and manual-review flags
- **Risk Detection & Guardrails** — Auto-flag sensitive scenarios (refunds, compensation, complaints) requiring human review before sending
- **Full RAG Pipeline** — 13-step pipeline from document ingestion through chunking, embedding, retrieval, reranking, prompt assembly to generation
- **RAG Test Lab** — Interactive 4-step test: input → retrieved chunks → prompt preview → draft + guardrail check
- **Document Ingestion** — Upload & pipeline simulation (parse → chunk → embed → index → publish)
- **Customer 360** — Unified profile with AI-generated summaries, order/service/task history
- **Three-Panel Workbench** — Conversation list | Message panel | AI context panel
- **Analytics Dashboard** — KPIs, ticket volume, channel distribution, AI adoption trends
- **English / 中文 i18n** — Custom React Context i18n with one-click language switch

## Pages

| Page | Description |
|---|---|
| Overview | KPI dashboard with ticket volume, channel & AI adoption trends |
| Customer Service | Three-panel workbench with AI-assisted reply suggestions |
| Tickets | Ticket management with SLA tracking and status filters |
| Customers | Customer list with 360 detail drawer |
| Orders | Order management with logistics tracking timeline |
| Knowledge Base | FAQs, reply templates, business rules & policy documents |
| AI Assistant | AI capability toggles, permission boundaries, guardrails & model settings |
| AI Operations | RAG pipeline config, document ingestion, evaluation, feedback loop & audit logs |
| Follow-up Tasks | AI-generated and manual task management |
| Analytics | Charts and metrics dashboard |
| Settings | Language, timezone, team, channels & notification preferences |

## Tech Stack

| Category | Tech |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 (Oxc) |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| i18n | Custom React Context |
| Deployment | GitHub Pages via Actions |

## Project Structure

```
src/
├── components/
│   ├── common/       Badge, Button, Card, DataTable, Drawer, Modal, Toast, Toggle
│   ├── layout/       Sidebar, Topbar, PageShell
│   ├── service/      ConversationList, ConversationPanel, CustomerContextPanel
│   └── ai-ops/       RAGTestLab, RAGConfiguration, DocumentIngestion, CapabilityPipeline
├── pages/            11 page components
├── data/             Mock data (customers, orders, tickets, messages, knowledge, tasks, analytics, AI ops)
├── i18n/             English & Chinese translations
├── types/            TypeScript interfaces & type definitions
├── utils/            AI suggestion engine, ticket helpers, formatters
└── styles/           Global CSS + design tokens
```

## Getting Started

```bash
git clone https://github.com/usago007/ai-crm-service-hub.git
cd ai-crm-service-hub
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## License

[MIT](./LICENSE)
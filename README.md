# AI CRM Service Hub

Engineering frontend for CRM / Customer Service / RAG operations workbench. Driven by `mock API + structured fixtures` with no real backend. All core pages work through frontend API contracts instead of scattering static arrays.

## Current Shape

- `RAG + AI Operations` refactored as mock operations console, including:
  - `Knowledge Registry`
  - `Ingestion Jobs`
  - `Retrieval Debugger`
  - `Prompt Assembly Inspector`
  - `Evaluation & Feedback`
- `Customer Service` and `Tickets` share a structured ticket workflow:
  - `triage`
  - `retrieve`
  - `draft`
  - `review`
  - `execute`
  - `follow-up`
  - `resolved`
- `Customers / CRM` upgraded as service decision input layer, including:
  - segment
  - risk flags
  - complaint history
  - refund history
  - promise fulfillment
  - recent service timeline

## Architecture

```text
src/
├── api/
│   ├── adapters/     mock API adapter
│   └── contracts/    request / response contracts
├── app/              reserved app-level structure
├── entities/         shared entity exports
├── mocks/
│   └── fixtures/     structured case graph fixture snapshot
├── modules/          reserved module-level structure
├── pages/            page shells consuming app state
├── shared/
│   ├── hooks/        app state + API orchestration
│   └── lib/          mapping helpers
└── components/       reusable UI components
```

## Mock Data Rules

- Mock data must only exist in `src/mocks` and `src/api/adapters`
- Pages must not directly import `src/data/*.ts`
- All interaction must go through mock API contracts
- Mock fixtures must cover success, failure, and conflict states

## Commands

```bash
npm install
npm run build
npm run lint
npm run dev
```

## Notes

- Legacy `src/data/*.ts` and old components are preserved for incremental migration; the main runtime has switched to the new snapshot + mock API.
- This is a frontend project only, with no real backend, vector store, or model inference; API contracts and state flows are pre-wired for future real service integration.

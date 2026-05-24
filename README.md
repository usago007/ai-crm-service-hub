# AI CRM Service Hub

工程化前端 CRM / 客服 / RAG 运维工作台。当前版本使用 `mock API + 结构化 fixture` 驱动，不接真实后端，但所有核心页面都已通过前端 API 契约工作，不再直接从页面读取散落的静态数组。

## Current Shape

- `RAG + AI Operations` 已重构为 mock 运维台，包含:
  - `Knowledge Registry`
  - `Ingestion Jobs`
  - `Retrieval Debugger`
  - `Prompt Assembly Inspector`
  - `Evaluation & Feedback`
- `Customer Service` 与 `Tickets` 共用结构化 ticket workflow:
  - `triage`
  - `retrieve`
  - `draft`
  - `review`
  - `execute`
  - `follow-up`
  - `resolved`
- `Customers / CRM` 已升级为服务决策输入层，包含:
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

- mock 数据只能存在于 `src/mocks` 和 `src/api/adapters`
- 页面不得直接 import `src/data/*.ts`
- 所有交互必须经过 mock API contract
- mock fixture 必须覆盖成功态、失败态、冲突态

## Commands

```bash
npm install
npm run build
npm run lint
npm run dev
```

## Notes

- 仓库里保留了一些旧的 `src/data/*.ts` 和老组件，便于渐进迁移；运行主链已切换到新的 snapshot + mock API。
- 当前仍是前端工程，不包含真实后端、向量库或模型调用；但接口契约和状态流已预留，便于后续接入真实服务。

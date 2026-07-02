# Operator Proof Demos

Public-safe portfolio demos hosted on Cloudflare Workers:

- Demo 2: Fiscal Reconciliation Copilot
- Demo 1: Opportunity Intelligence OS
- Demo 3: Support Triage HITL Runtime
- Demo 5: Multi-Lens Agent Eval Lab

Live Worker:

- https://operator-proof-demos.liminaught-3fd.workers.dev/demo2
- https://operator-proof-demos.liminaught-3fd.workers.dev/demo1
- https://operator-proof-demos.liminaught-3fd.workers.dev/demo3
- https://operator-proof-demos.liminaught-3fd.workers.dev/demo5

## Shape

This is a no-build Worker app:

- `src/index.js`: Worker API and app-shell routes.
- `src/fixtures.js`: demo fixture composition.
- `src/generated-data.js`: generated public-safe fixture bundle.
- `site/app.js`: browser UI.
- `site/styles.css`: dashboard styling.
- `scripts/generate-fixtures.mjs`: local corpus to public fixture generator.
- `scripts/validate.mjs`: data, leak, and API checks.

## Commands

```bash
npm run generate
npm test
npm run dev
npm run deploy
```

## Data Policy

The deployed bundle contains public-safe anonymous job metadata plus synthetic fiscal, support, and eval cases. It does not include raw private client data, live application data, secrets, or external submission credentials.

The generator strips query strings and fragments from source URLs before export.

## API Routes

- `GET /api/health`
- `GET /api/manifest`
- `GET /api/demo1`
- `POST /api/demo1/incursion`
- `GET /api/export/demo1/:postingId`
- `GET /api/demo2`
- `POST /api/demo2/incursion`
- `GET /api/export/demo2/:caseId`
- `GET /api/demo3`
- `POST /api/demo3/incursion`
- `GET /api/export/demo3/:ticketId`
- `GET /api/demo5`
- `POST /api/demo5/incursion`
- `GET /api/export/demo5/:lensId/:runId`

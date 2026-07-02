# Liminaut Proof Demos

Two public-safe portfolio demos hosted on Cloudflare Workers:

- Demo 1: Opportunity Intelligence OS
- Demo 2: Fiscal Reconciliation Copilot

Live Worker:

- https://liminaut-proof-demos.liminaught-3fd.workers.dev/demo1
- https://liminaut-proof-demos.liminaught-3fd.workers.dev/demo2

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

The deployed bundle contains public job metadata plus synthetic fiscal cases. It does not include raw private client data, live application data, secrets, or external submission credentials.

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

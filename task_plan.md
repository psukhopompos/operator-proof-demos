# Task Plan

## Objective

Keep the public-safe proof suite focused on the first three demos, with Demo 5 deactivated and Demo 4 not started.

Current public ordering:

1. Demo 2: Fiscal Reconciliation Copilot.
2. Demo 1: Opportunity Intelligence OS.
3. Demo 3: Support Triage HITL Runtime.

Demo 4 is intentionally not to be built yet.

## Steps

- [x] Confirm local GitHub and Cloudflare Wrangler access.
- [x] Create a dedicated repo workspace under `/Users/limi/Documents/GitHub/me`.
- [x] Generate public-safe fixtures from local corpus and synthetic case seeds.
- [x] Build Worker API endpoints for Demo 1 and Demo 2.
- [x] Build the operational web UI for Demo 1 and Demo 2.
- [x] Validate data and Worker responses for Demo 1 and Demo 2.
- [x] Run local browser QA for Demo 1 and Demo 2.
- [x] Deploy with Wrangler.
- [x] Initialize git, create GitHub remote, and push.
- [x] Add Demo 3 support triage runtime with synthetic tickets, safe gestures, feedback ledger, and export packets.
- [x] Verify Demo 3 locally and on the deployed Worker, then push.
- [x] Deactivate Demo 5 and keep only the first three demos public.
- [x] Pause before Demo 4 and discuss scope with the user.

## Boundaries

- No real client data in the repo or deployment.
- Demo 1 uses anonymous hiring orgs and synthetic source labels; no real company names or source URLs.
- Demo 2 uses only synthetic notes, suppliers, route names, and evidence.
- Demo 3 must use synthetic ticket/customer/product data only.
- Demo 5 must remain inactive unless explicitly re-enabled later.
- Demo 4 is the next decision point; no Demo 4 code has been started.
- Do not expose the old public name or personal brand in code, UI, URLs, docs, or deployed data.
- The app should be usable immediately, not a landing page.

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| `task_plan.md` had stale pending status from the initial two-demo build | First Demo 3 planning update | Replaced the plan with the current suite objective and accurate completion state |
| Demo 5 no longer fits the desired public suite | User asked to deactivate Demo 5 | Removed Demo 5 from the public routes, manifest, API, validation, and docs |

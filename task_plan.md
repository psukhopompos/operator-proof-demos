# Task Plan

## Objective

Build, verify, deploy, and push the public-safe proof suite through Demo 3 and Demo 5, then pause before Demo 4 for product discussion.

Current public ordering:

1. Demo 2: Fiscal Reconciliation Copilot.
2. Demo 1: Opportunity Intelligence OS.
3. Demo 3: Support Triage HITL Runtime.
4. Demo 5: Multi-Lens Agent Eval Lab.

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
- [ ] Add Demo 5 multi-lens eval lab with corpus, lens runs, frontier, and export packets.
- [ ] Verify Demo 5 locally and on the deployed Worker, then push.
- [ ] Pause before Demo 4 and discuss scope with the user.

## Boundaries

- No real client data in the repo or deployment.
- Demo 1 uses anonymous hiring orgs and synthetic source labels; no real company names or source URLs.
- Demo 2 uses only synthetic notes, suppliers, route names, and evidence.
- Demo 3 must use synthetic ticket/customer/product data only.
- Demo 5 must use synthetic eval/lens data only.
- Do not expose the old public name or personal brand in code, UI, URLs, docs, or deployed data.
- The app should be usable immediately, not a landing page.

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| `task_plan.md` had stale pending status from the initial two-demo build | First Demo 3 planning update | Replaced the plan with the current suite objective and accurate completion state |

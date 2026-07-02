# Findings

- `/Users/limi/Documents/GitHub/me` is an aggregate workspace, not a git repo, so this proof bundle is a new dedicated repo.
- Wrangler 4.24.0 is installed and authenticated with Workers write permissions.
- The GitHub repo name `psukhopompos/operator-proof-demos` is the public control repo.
- Existing local Workers use `[assets]` with an `ASSETS` binding and `run_worker_first = true`; this repo follows that pattern.
- The relevant source artifacts are the career-ops top-50 priority roles, publishable project queue, topology matrix, seed primitives, and synthetic fiscal cases.
- Current app architecture is one Worker plus static assets: `src/fixtures.js` composes `DATA`, `src/index.js` exposes per-demo API routes, and `site/app.js` renders per-demo operational views.
- Demo 3 should mirror Demo 2's operator pattern, but with support-ticket gestures: auto-respond, suggest-with-review, request-evidence, escalate, and reject unsafe automation.

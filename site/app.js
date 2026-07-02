const app = document.querySelector("#app");

function demoFromPath() {
  if (location.pathname.includes("demo1")) return "demo1";
  if (location.pathname.includes("demo3")) return "demo3";
  if (location.pathname.includes("demo5")) return "demo5";
  return "demo2";
}

const state = {
  activeDemo: demoFromPath(),
  manifest: null,
  demo1: null,
  demo2: null,
  demo3: null,
  demo5: null,
  selectedRoleId: null,
  selectedCaseId: null,
  selectedTicketId: null,
  selectedLensId: null,
  selectedRunId: null,
  roleSearch: "",
  demo1Step: "observe",
  demo1Run: null,
  demo2Index: 0,
  demo2Run: null,
  demo2Approved: false,
  demo3Index: 0,
  demo3Run: null,
  demo3Feedback: "pending",
  demo5Index: 0,
  demo5Run: null
};

const escapeMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
};

function h(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => escapeMap[char]);
}

function compact(value, fallback = "unknown") {
  return value === undefined || value === null || value === "" ? fallback : value;
}

function score(value) {
  return Number(value || 0).toFixed(0);
}

function pct(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

async function getJson(path, options = {}) {
  const response = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...options
  });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

function postJson(path, body) {
  return getJson(path, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

async function initialize() {
  try {
    const [manifest, demo1, demo2, demo3, demo5] = await Promise.all([
      getJson("/api/manifest"),
      getJson("/api/demo1"),
      getJson("/api/demo2"),
      getJson("/api/demo3"),
      getJson("/api/demo5")
    ]);
    state.manifest = manifest;
    state.demo1 = demo1;
    state.demo2 = demo2;
    state.demo3 = demo3;
    state.demo5 = demo5;
    state.selectedRoleId = demo1.queue[0]?.postingId;
    state.selectedCaseId = demo2.cases[0]?.case_id;
    state.selectedTicketId = demo3.tickets[0]?.ticketId;
    state.selectedLensId = demo5.lenses[0]?.lensId;
    state.selectedRunId =
      demo5.frontier.find((entry) => entry.lensId === state.selectedLensId)?.selectedRunId ||
      demo5.runs.find((run) => run.lensId === state.selectedLensId)?.runId;
    state.demo1Run = await postJson("/api/demo1/incursion", {
      postingId: state.selectedRoleId,
      step: state.demo1Step
    });
    state.demo2Run = await postJson("/api/demo2/incursion", {
      caseId: state.selectedCaseId,
      index: state.demo2Index
    });
    state.demo3Run = await postJson("/api/demo3/incursion", {
      ticketId: state.selectedTicketId,
      index: state.demo3Index,
      feedback: state.demo3Feedback
    });
    state.demo5Run = await postJson("/api/demo5/incursion", {
      lensId: state.selectedLensId,
      runId: state.selectedRunId,
      index: state.demo5Index
    });
    render();
  } catch (error) {
    app.className = "boot";
    app.innerHTML = `<div class="boot-panel"><div class="mark"></div><p>${h(error.message)}</p></div>`;
  }
}

function activeTitle() {
  if (state.activeDemo === "demo1") return "Opportunity Intelligence OS";
  if (state.activeDemo === "demo3") return "Support Triage HITL Runtime";
  if (state.activeDemo === "demo5") return "Multi-Lens Agent Eval Lab";
  return "Fiscal Reconciliation Copilot";
}

function renderActiveDemo() {
  if (state.activeDemo === "demo1") return renderDemo1();
  if (state.activeDemo === "demo3") return renderDemo3();
  if (state.activeDemo === "demo5") return renderDemo5();
  return renderDemo2();
}

function render() {
  app.className = "app-frame";
  app.innerHTML = `
    <header class="topbar">
      <div class="brand">
        <div class="mark" aria-hidden="true"></div>
        <div>
          <div class="brand-title">Operator Proof Demos</div>
          <div class="brand-subtitle">${h(activeTitle())}</div>
        </div>
      </div>
      <nav class="tabs" aria-label="Demo switcher">
        <button class="tab ${state.activeDemo === "demo2" ? "active" : ""}" data-action="switch-demo" data-demo="demo2">Demo 2</button>
        <button class="tab ${state.activeDemo === "demo1" ? "active" : ""}" data-action="switch-demo" data-demo="demo1">Demo 1</button>
        <button class="tab ${state.activeDemo === "demo3" ? "active" : ""}" data-action="switch-demo" data-demo="demo3">Demo 3</button>
        <button class="tab ${state.activeDemo === "demo5" ? "active" : ""}" data-action="switch-demo" data-demo="demo5">Demo 5</button>
      </nav>
      <div class="status-strip">
        <span>${h(state.manifest?.sourcePolicy || "")}</span>
      </div>
    </header>
    ${renderActiveDemo()}
  `;
  bind();
}

function renderDemo1() {
  const demo = state.demo1;
  const role = selectedRole();
  const filtered = filteredRoles();
  return `
    <section class="workspace">
      <aside class="sidebar">
        <div class="sidebar-head">
          <div class="sidebar-title">Top 50 Role Queue</div>
          <span class="chip">${filtered.length}/${demo.queue.length}</span>
        </div>
        <div class="sidebar-tools">
          <input class="search" value="${h(state.roleSearch)}" data-action="role-search" placeholder="Filter role, company, archetype">
        </div>
        <div class="list">
          ${filtered.map(renderRoleItem).join("")}
        </div>
      </aside>
      <div class="content">
        ${renderDemo1Metrics()}
        <div class="main-grid">
          <div class="content">
            ${renderRolePanel(role)}
            ${renderMarketPanel()}
            ${renderProofProjects()}
          </div>
          <div class="content">
            ${renderApplicationRunner(role)}
            ${renderFormPanel(role)}
            ${renderAnswerUniverse()}
          </div>
        </div>
      </div>
    </section>
  `;
}

function selectedRole() {
  return state.demo1.queue.find((item) => item.postingId === state.selectedRoleId) || state.demo1.queue[0];
}

function filteredRoles() {
  const needle = state.roleSearch.trim().toLowerCase();
  if (!needle) return state.demo1.queue;
  return state.demo1.queue.filter((role) =>
    `${role.company} ${role.jobTitle} ${role.roleArchetype} ${role.workflowArchetype}`.toLowerCase().includes(needle)
  );
}

function renderRoleItem(role) {
  return `
    <button class="queue-item ${role.postingId === state.selectedRoleId ? "active" : ""}" data-action="select-role" data-id="${h(role.postingId)}">
      <div class="queue-line">
        <span class="rank">${h(role.rank)}</span>
        <span>
          <span class="item-title">${h(role.jobTitle)}</span>
          <span class="item-subtitle">${h(role.company)}</span>
        </span>
      </div>
      <div class="score-row">
        <span class="score">P ${score(role.priorityScore)}</span>
        <span class="score">Fit ${score(role.fitScore)}</span>
        <span class="chip">${h(role.applicationFriction)}</span>
      </div>
    </button>
  `;
}

function renderDemo1Metrics() {
  const topology = state.demo1.topology;
  return `
    <section class="panel">
      <div class="panel-body metric-grid">
        <div class="metric">
          <div class="metric-label">Corpus</div>
          <div class="metric-value">${h(topology.postingCount)}</div>
          <div class="metric-note">usable postings</div>
        </div>
        <div class="metric">
          <div class="metric-label">Priority Avg</div>
          <div class="metric-value">${h(topology.averages.priorityScoreTop50)}</div>
          <div class="metric-note">top 50 queue</div>
        </div>
        <div class="metric">
          <div class="metric-label">Proof Fit Avg</div>
          <div class="metric-value">${h(topology.averages.proofFitTop50)}</div>
          <div class="metric-note">current asset match</div>
        </div>
        <div class="metric">
          <div class="metric-label">AI-Native Avg</div>
          <div class="metric-value">${h(topology.averages.aiNativeTop50)}</div>
          <div class="metric-note">role signal</div>
        </div>
      </div>
    </section>
  `;
}

function renderRolePanel(role) {
  return `
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">Selected Opportunity</div>
        <span class="chip">${h(role.sourceLabel || "synthetic source")}</span>
      </div>
      <div class="panel-body">
        <div>
          <div class="section-title">${h(role.company)}</div>
          <h1 class="copy">${h(role.jobTitle)}</h1>
        </div>
        <p class="copy">${h(role.primaryPitchAngle)}</p>
        <div class="metric-grid">
          <div class="metric"><div class="metric-label">Priority</div><div class="metric-value">${score(role.priorityScore)}</div></div>
          <div class="metric"><div class="metric-label">Fit</div><div class="metric-value">${score(role.fitScore)}</div></div>
          <div class="metric"><div class="metric-label">Proof Fit</div><div class="metric-value">${score(role.proofFitScore)}</div></div>
          <div class="metric"><div class="metric-label">AI-Native</div><div class="metric-value">${score(role.aiNativeScore)}</div></div>
        </div>
        <div class="chip-row">
          <span class="chip green">${h(role.roleArchetype)}</span>
          <span class="chip">${h(role.workflowArchetype)}</span>
          <span class="chip amber">${h(role.contractAngle)}</span>
        </div>
        <div>
          <div class="section-title">Proof Blocks</div>
          <div class="chip-row">${role.bestExistingProofBlocks.map((block) => `<span class="chip">${h(block)}</span>`).join("")}</div>
        </div>
        <div>
          <div class="section-title">Gap</div>
          <p class="copy muted">${h(role.proofGap)}</p>
        </div>
        ${role.riskFlags.length ? `<div class="chip-row">${role.riskFlags.map((flag) => `<span class="chip red">${h(flag)}</span>`).join("")}</div>` : ""}
      </div>
    </section>
  `;
}

function renderMarketPanel() {
  const topology = state.demo1.topology;
  return `
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">Market Topology</div>
        <span class="chip">amalgam shape</span>
      </div>
      <div class="panel-body">
        <div class="two-col">
          <div class="card panel-body">
            <div class="section-title">Role Archetypes</div>
            ${topology.roleArchetypes.map((item) => renderCountRow(item)).join("")}
          </div>
          <div class="card panel-body">
            <div class="section-title">Workflow Archetypes</div>
            ${topology.workflowArchetypes.map((item) => renderCountRow(item)).join("")}
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Rank</th><th>Company</th><th>Role</th><th>Archetype</th><th>Why</th></tr></thead>
            <tbody>
              ${state.demo1.queue.slice(0, 12).map((role) => `
                <tr>
                  <td>${h(role.rank)}</td>
                  <td>${h(role.company)}</td>
                  <td>${h(role.jobTitle)}</td>
                  <td>${h(role.roleArchetype)}</td>
                  <td>${h(role.whyRankedHere)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function renderCountRow(item) {
  const max = Math.max(...state.demo1.topology.roleArchetypes.concat(state.demo1.topology.workflowArchetypes).map((entry) => entry.count));
  return `
    <div class="confidence">
      <span class="small">${h(item.name)}</span>
      <span class="small">${h(item.count)}</span>
      <div class="confidence-track"><div class="confidence-fill" style="width: ${Math.round((item.count / max) * 100)}%"></div></div>
      <span></span>
    </div>
  `;
}

function renderApplicationRunner(role) {
  const run = state.demo1Run;
  const script = state.demo1.incursionScript;
  const activeId = run?.activeStep?.id || state.demo1Step;
  return `
    <section class="tool-panel">
      <div class="panel-head">
        <div class="panel-title">Simulated Application Incursion</div>
        <span class="chip green">no live submission</span>
      </div>
      <div class="panel-body">
        <div class="stepper">
          ${script.map((step, index) => {
            const done = run?.completedSteps?.some((item) => item.id === step.id);
            return `
              <div class="step ${step.id === activeId ? "active" : ""} ${done ? "done" : ""}">
                <span class="step-index">${index + 1}</span>
                <span>
                  <strong>${h(step.label)}</strong>
                  <span class="item-subtitle">${h(step.detail)}</span>
                </span>
              </div>
            `;
          }).join("")}
        </div>
        ${run?.operatorGate ? renderGate(run.operatorGate, "demo1") : ""}
        <div class="action-row">
          <button class="primary" data-action="advance-demo1">${run?.nextStep ? "Advance" : "Reset"}</button>
          <a class="button-link" href="/api/export/demo1/${encodeURIComponent(role.postingId)}" target="_blank" rel="noreferrer">
            <button>Export packet</button>
          </a>
        </div>
      </div>
    </section>
  `;
}

function renderFormPanel(role) {
  const form = state.demo1.forms[role.postingId];
  if (!form) return `<section class="panel"><div class="panel-body empty">No extracted form for this role.</div></section>`;
  return `
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">Extracted Form Shape</div>
        <span class="chip">${h(form.platform)}</span>
      </div>
      <div class="panel-body">
        <div class="browser-shell">
          <div class="browser-bar">
            <span class="browser-dot"></span><span class="browser-dot"></span><span class="browser-dot"></span>
            <span>${h(form.company)} synthetic ATS</span>
          </div>
          <div class="browser-content">
            ${form.questions.map((question) => `
              <div class="field-row">
                <span>${h(question.label)}</span>
                <span class="field-value">${h(question.prompt || (question.fields || []).join(", "))}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderProofProjects() {
  return `
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">Proof Project Queue</div>
        <span class="chip">top derived builds</span>
      </div>
      <div class="panel-body project-list">
        ${state.demo1.projectQueue.slice(0, 5).map((project) => `
          <div class="project-card">
            <div class="case-head">
              <strong>${h(project.title)}</strong>
              <span class="rank">${h(project.rank)}</span>
            </div>
            <p class="copy small">${h(project.oneSentence)}</p>
            <div class="chip-row">
              ${project.recommendedStack.slice(0, 5).map((item) => `<span class="chip">${h(item)}</span>`).join("")}
            </div>
            <div class="small muted">${h(project.strongVersionScope)}</div>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderAnswerUniverse() {
  return `
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">Universe Bank Seeds</div>
        <span class="chip">${state.demo1.answerUniverse.length}</span>
      </div>
      <div class="panel-body">
        ${state.demo1.answerUniverse.map((item) => `
          <div class="question-card">
            <strong>${h(item.label)}</strong>
            <p class="copy small">${h(item.evidence)}</p>
            <div class="chip-row">${item.usedFor.map((used) => `<span class="chip">${h(used)}</span>`).join("")}</div>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderDemo2() {
  const selected = selectedCase();
  return `
    <section class="workspace">
      <aside class="sidebar">
        <div class="sidebar-head">
          <div class="sidebar-title">Synthetic Note Queue</div>
          <span class="chip">${state.demo2.cases.length}</span>
        </div>
        <div class="list">
          ${state.demo2.cases.map(renderCaseItem).join("")}
        </div>
      </aside>
      <div class="content">
        ${renderCaseOverview(selected)}
        <div class="main-grid">
          <div class="content">
            ${renderEvidenceConsole(selected)}
            ${renderTimeline(selected)}
          </div>
          <div class="content">
            ${renderOperatorPanel(selected)}
            ${renderDecisionPacket(selected)}
          </div>
        </div>
      </div>
    </section>
  `;
}

function selectedCase() {
  return state.demo2.cases.find((item) => item.case_id === state.selectedCaseId) || state.demo2.cases[0];
}

function renderCaseItem(item) {
  const note = item.synthetic_note;
  return `
    <button class="queue-item ${item.case_id === state.selectedCaseId ? "active" : ""}" data-action="select-case" data-id="${h(item.case_id)}">
      <div class="queue-line">
        <span class="rank">${h(item.case_id.replace("SYN-ERP-", ""))}</span>
        <span>
          <span class="item-title">${h(item.title)}</span>
          <span class="item-subtitle">${h(note.number)} / ${h(note.supplier)}</span>
        </span>
      </div>
      <div class="chip-row">
        <span class="chip">${h(item.initial_state)}</span>
        <span class="chip green">${h(item.final_state)}</span>
      </div>
    </button>
  `;
}

function renderCaseOverview(item) {
  const packet = item.decisionPacket;
  return `
    <section class="panel">
      <div class="panel-body">
        <div class="case-head">
          <div>
            <div class="section-title">${h(item.case_id)}</div>
            <h1 class="copy">${h(item.title)}</h1>
          </div>
          <span class="chip ${packet.irreversibleBoundary ? "amber" : "green"}">${packet.irreversibleBoundary ? "operator gate" : "read/explore"}</span>
        </div>
        <p class="copy">${h(item.scenario)}</p>
        <div class="metric-grid">
          <div class="metric"><div class="metric-label">Note</div><div class="metric-value">${h(item.synthetic_note.number)}</div><div class="metric-note">${h(item.synthetic_note.supplier)}</div></div>
          <div class="metric"><div class="metric-label">State</div><div class="metric-value small">${h(item.initial_state)}</div><div class="metric-note">initial</div></div>
          <div class="metric"><div class="metric-label">Phase</div><div class="metric-value small">${h(item.target_phase)}</div><div class="metric-note">target</div></div>
          <div class="metric"><div class="metric-label">Confidence</div><div class="metric-value">${pct(packet.confidence.afterLateralProbe)}</div><div class="metric-note">after probe</div></div>
        </div>
      </div>
    </section>
  `;
}

function renderEvidenceConsole(item) {
  const surface = item.surface;
  return `
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">Evidence Surface</div>
        <span class="chip">${h(surface.surfaceState)}</span>
      </div>
      <div class="panel-body">
        <div class="erp-shell">
          <div class="erp-bar">synthetic-sql / ${h(item.synthetic_note.number)}</div>
          <div class="erp-content">
            <pre>${h(surface.sqlPreview)}</pre>
            <div class="table-wrap">
              <table>
                <tbody>
                  ${surface.resultRows.map((row) => `<tr>${row.map((cell) => `<td>${h(cell)}</td>`).join("")}</tr>`).join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div>
          <div class="section-title">Staged Clues</div>
          ${item.staged_clues.length ? item.staged_clues.map((clue) => `<pre class="json-shell json-content">${h(JSON.stringify(clue, null, 2))}</pre>`).join("") : `<div class="empty">No staged clues. Surface recovery comes first.</div>`}
        </div>
        <div>
          <div class="section-title">Lateral Probes</div>
          <div class="chip-row">${item.lateral_probes.map((probe) => `<span class="chip">${h(probe)}</span>`).join("")}</div>
        </div>
      </div>
    </section>
  `;
}

function renderTimeline(item) {
  const run = state.demo2Run;
  return `
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">Agent Movement</div>
        <span class="chip">${h(run?.completedEvents?.length || 1)}/${h(item.timeline.length)}</span>
      </div>
      <div class="panel-body">
        ${item.timeline.map((event, index) => `
          <div class="event-card ${index === state.demo2Index ? "active" : ""}">
            <div class="case-head">
              <strong>${h(event.label)}</strong>
              <span class="chip">${h(event.state)}</span>
            </div>
            <p class="copy small">${h(event.detail)}</p>
            <div class="confidence">
              <div class="confidence-track"><div class="confidence-fill" style="width: ${pct(event.confidence)}"></div></div>
              <span class="small">${pct(event.confidence)}</span>
            </div>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderOperatorPanel(item) {
  const gate = state.demo2Run?.operatorGate || item.decisionPacket.operatorGate;
  return `
    <section class="tool-panel">
      <div class="panel-head">
        <div class="panel-title">Operator Console</div>
        <span class="chip">human owns mutation</span>
      </div>
      <div class="panel-body">
        ${gate ? renderGate(gate, "demo2") : `<div class="empty">No write gate for the active event.</div>`}
        <div class="action-row">
          <button class="primary" data-action="advance-demo2">${state.demo2Index >= item.timeline.length - 1 ? "Reset" : "Run next probe"}</button>
          <button data-action="prepare-gate">Prepare gate</button>
          <button class="danger" data-action="reject-gate">Redirect</button>
        </div>
        <a href="/api/export/demo2/${encodeURIComponent(item.case_id)}" target="_blank" rel="noreferrer"><button>Export packet</button></a>
      </div>
    </section>
  `;
}

function renderGate(gate, demo) {
  const approved = demo === "demo2" && state.demo2Approved;
  return `
    <div class="gate ${approved ? "approved" : ""}">
      <div class="section-title">${approved ? "Approved" : "Operator Gate"}</div>
      <strong>${h(gate.question)}</strong>
      <p class="copy small">${h(gate.reason || gate.consequence || "")}</p>
      ${demo === "demo2" ? `<button class="primary" data-action="approve-demo2">${approved ? "Approved" : "Approve simulated gate"}</button>` : ""}
    </div>
  `;
}

function renderDecisionPacket(item) {
  return `
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">Decision Packet</div>
        <span class="chip">${h(item.decisionPacket.expectedPostState)}</span>
      </div>
      <div class="panel-body">
        <div class="json-shell">
          <div class="json-bar">${h(item.exportName)}</div>
          <pre class="json-content">${h(JSON.stringify(item.decisionPacket, null, 2))}</pre>
        </div>
      </div>
    </section>
  `;
}

function renderDemo3() {
  const selected = selectedTicket();
  return `
    <section class="workspace">
      <aside class="sidebar">
        <div class="sidebar-head">
          <div class="sidebar-title">Synthetic Support Queue</div>
          <span class="chip">${state.demo3.tickets.length}</span>
        </div>
        <div class="list">
          ${state.demo3.tickets.map(renderTicketItem).join("")}
        </div>
      </aside>
      <div class="content">
        ${renderSupportMetrics()}
        ${renderTicketOverview(selected)}
        <div class="main-grid">
          <div class="content">
            ${renderSupportEvidence(selected)}
            ${renderSupportTimeline(selected)}
          </div>
          <div class="content">
            ${renderSupportResponse(selected)}
            ${renderSupportOperatorPanel(selected)}
            ${renderSupportPacket(selected)}
          </div>
        </div>
      </div>
    </section>
  `;
}

function selectedTicket() {
  return state.demo3.tickets.find((item) => item.ticketId === state.selectedTicketId) || state.demo3.tickets[0];
}

function renderTicketItem(item) {
  return `
    <button class="queue-item ${item.ticketId === state.selectedTicketId ? "active" : ""}" data-action="select-ticket" data-id="${h(item.ticketId)}">
      <div class="queue-line">
        <span class="rank">${h(item.ticketId.replace("SYN-SUP-", ""))}</span>
        <span>
          <span class="item-title">${h(item.title)}</span>
          <span class="item-subtitle">${h(item.account)} / ${h(item.channel)}</span>
        </span>
      </div>
      <div class="chip-row">
        <span class="chip ${item.severity === "critical" ? "red" : item.severity === "high" ? "amber" : ""}">${h(item.severity)}</span>
        <span class="chip green">${h(item.gesture.label)}</span>
      </div>
    </button>
  `;
}

function renderSupportMetrics() {
  const metrics = state.demo3.metrics;
  return `
    <section class="panel">
      <div class="panel-body metric-grid">
        <div class="metric"><div class="metric-label">Tickets</div><div class="metric-value">${h(metrics.ticketCount)}</div><div class="metric-note">synthetic queue</div></div>
        <div class="metric"><div class="metric-label">Auto Candidates</div><div class="metric-value">${h(metrics.autoCandidates)}</div><div class="metric-note">still gated</div></div>
        <div class="metric"><div class="metric-label">Review</div><div class="metric-value">${h(metrics.reviewRequired)}</div><div class="metric-note">human copy check</div></div>
        <div class="metric"><div class="metric-label">Handoffs</div><div class="metric-value">${h(metrics.handoffs)}</div><div class="metric-note">specialist/commercial</div></div>
      </div>
    </section>
  `;
}

function renderTicketOverview(item) {
  return `
    <section class="panel">
      <div class="panel-body">
        <div class="case-head">
          <div>
            <div class="section-title">${h(item.ticketId)} / ${h(item.account)}</div>
            <h1 class="copy">${h(item.title)}</h1>
          </div>
          <span class="chip ${item.gesture.id === "reject_automation" ? "red" : item.gesture.id === "auto_response_candidate" ? "green" : "amber"}">${h(item.gesture.label)}</span>
        </div>
        <p class="copy">${h(item.customerMessage)}</p>
        <div class="metric-grid">
          <div class="metric"><div class="metric-label">Severity</div><div class="metric-value small">${h(item.severity)}</div><div class="metric-note">${h(item.channel)}</div></div>
          <div class="metric"><div class="metric-label">Confidence</div><div class="metric-value">${pct(item.confidence)}</div><div class="metric-note">gesture fit</div></div>
          <div class="metric"><div class="metric-label">Missing Evidence</div><div class="metric-value">${h(item.missingEvidence.length)}</div><div class="metric-note">before send</div></div>
          <div class="metric"><div class="metric-label">Send</div><div class="metric-value small">blocked</div><div class="metric-note">${h(item.gesture.sendPermission)}</div></div>
        </div>
        <div class="chip-row">${item.tags.map((tag) => `<span class="chip">${h(tag)}</span>`).join("")}</div>
      </div>
    </section>
  `;
}

function renderSupportEvidence(item) {
  return `
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">Evidence And Context</div>
        <span class="chip">${h(item.evidence.length)} evidence items</span>
      </div>
      <div class="panel-body">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Source</th><th>Fact</th><th>Strength</th></tr></thead>
            <tbody>
              ${item.evidence.map((entry) => `
                <tr>
                  <td>${h(entry.source)}</td>
                  <td>${h(entry.fact)}</td>
                  <td>${h(entry.strength)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        <div>
          <div class="section-title">Retrieved Context</div>
          <div class="project-list">
            ${item.retrievedContext.map((context) => `<div class="event-card"><p class="copy small">${h(context)}</p></div>`).join("")}
          </div>
        </div>
        <div>
          <div class="section-title">Missing Before External Send</div>
          ${item.missingEvidence.length ? `<div class="chip-row">${item.missingEvidence.map((evidence) => `<span class="chip amber">${h(evidence)}</span>`).join("")}</div>` : `<div class="empty">No missing evidence, but external send is still operator-gated.</div>`}
        </div>
      </div>
    </section>
  `;
}

function renderSupportTimeline(item) {
  const run = state.demo3Run;
  return `
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">Triage Movement</div>
        <span class="chip">${h(run?.completedEvents?.length || 1)}/${h(item.timeline.length)}</span>
      </div>
      <div class="panel-body">
        ${item.timeline.map((event, index) => `
          <div class="event-card ${index === state.demo3Index ? "active" : ""}">
            <div class="case-head">
              <strong>${h(event.label)}</strong>
              <span class="chip">${h(event.state)}</span>
            </div>
            <p class="copy small">${h(event.detail)}</p>
            <div class="confidence">
              <div class="confidence-track"><div class="confidence-fill" style="width: ${pct(event.confidence)}"></div></div>
              <span class="small">${pct(event.confidence)}</span>
            </div>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderSupportResponse(item) {
  return `
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">Suggested Response</div>
        <span class="chip">${h(item.gesture.sendPermission)}</span>
      </div>
      <div class="panel-body">
        <div class="browser-shell">
          <div class="browser-bar">
            <span class="browser-dot"></span><span class="browser-dot"></span><span class="browser-dot"></span>
            <span>${h(item.account)} synthetic support composer</span>
          </div>
          <div class="browser-content">
            <div class="field-row">
              <span>Gesture</span>
              <span class="field-value">${h(item.gesture.label)}</span>
            </div>
            <div class="field-row">
              <span>Response</span>
              <span class="field-value">${h(item.proposedResponse)}</span>
            </div>
          </div>
        </div>
        <p class="copy small muted">${h(item.gesture.description)}</p>
      </div>
    </section>
  `;
}

function renderSupportOperatorPanel(item) {
  const gate = state.demo3Run?.operatorGate || {
    role: "operator",
    question: item.operatorQuestion,
    reason: "Prepare the support packet before any synthetic external send."
  };
  const approved = state.demo3Feedback === "approve";
  return `
    <section class="tool-panel">
      <div class="panel-head">
        <div class="panel-title">Feedback Console</div>
        <span class="chip">${h(state.demo3Feedback)}</span>
      </div>
      <div class="panel-body">
        <div class="gate ${approved ? "approved" : ""}">
          <div class="section-title">${approved ? "Approved" : "Operator Gate"}</div>
          <strong>${h(gate.question)}</strong>
          <p class="copy small">${h(gate.reason)}</p>
        </div>
        <div class="action-row">
          <button class="primary" data-action="advance-demo3">${state.demo3Index >= item.timeline.length - 1 ? "Reset" : "Run next step"}</button>
          <button data-action="prepare-demo3">Prepare gate</button>
          <a href="/api/export/demo3/${encodeURIComponent(item.ticketId)}" target="_blank" rel="noreferrer"><button>Export packet</button></a>
        </div>
        <div class="project-list">
          ${item.feedbackOptions.map((option) => `
            <button class="queue-item ${state.demo3Feedback === option.id ? "active" : ""}" data-action="feedback-demo3" data-feedback="${h(option.id)}">
              <div class="case-head">
                <strong>${h(option.label)}</strong>
                <span class="chip">${h(option.id)}</span>
              </div>
              <span class="item-subtitle">${h(option.effect)}</span>
            </button>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderSupportPacket(item) {
  const packet = state.demo3Run?.decisionPacket || item.decisionPacket;
  return `
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">Support Packet</div>
        <span class="chip">${h(packet.expectedPostState)}</span>
      </div>
      <div class="panel-body">
        <div class="json-shell">
          <div class="json-bar">${h(item.exportName)}</div>
          <pre class="json-content">${h(JSON.stringify(packet, null, 2))}</pre>
        </div>
      </div>
    </section>
  `;
}

function renderDemo5() {
  const selected = selectedLens();
  return `
    <section class="workspace">
      <aside class="sidebar">
        <div class="sidebar-head">
          <div class="sidebar-title">Lens Groups</div>
          <span class="chip">${state.demo5.lenses.length}</span>
        </div>
        <div class="list">
          ${state.demo5.lenses.map(renderLensItem).join("")}
        </div>
      </aside>
      <div class="content">
        ${renderEvalMetrics()}
        ${renderLensOverview(selected)}
        <div class="main-grid">
          <div class="content">
            ${renderCorpusPanel()}
            ${renderRunMatrix(selected)}
          </div>
          <div class="content">
            ${renderEvalRunner(selected)}
            ${renderFrontierPanel()}
            ${renderEvalPacket()}
          </div>
        </div>
      </div>
    </section>
  `;
}

function selectedLens() {
  return state.demo5.lenses.find((item) => item.lensId === state.selectedLensId) || state.demo5.lenses[0];
}

function selectedEvalRun() {
  const lens = selectedLens();
  return state.demo5.runs.find((item) => item.runId === state.selectedRunId) || state.demo5.runs.find((item) => item.lensId === lens.lensId) || state.demo5.runs[0];
}

function frontierForLens(lensId) {
  return state.demo5.frontier.find((entry) => entry.lensId === lensId);
}

function renderLensItem(item) {
  const frontier = frontierForLens(item.lensId);
  return `
    <button class="queue-item ${item.lensId === state.selectedLensId ? "active" : ""}" data-action="select-lens" data-id="${h(item.lensId)}">
      <div class="queue-line">
        <span class="rank">${h(item.lensId.replace("lens-", "").slice(0, 3))}</span>
        <span>
          <span class="item-title">${h(item.name)}</span>
          <span class="item-subtitle">${h(item.objective)}</span>
        </span>
      </div>
      <div class="chip-row">
        <span class="chip green">frontier ${pct(frontier?.aggregate)}</span>
        <span class="chip">temp ${h(frontier?.temperature)}</span>
      </div>
    </button>
  `;
}

function renderEvalMetrics() {
  const metrics = state.demo5.metrics;
  return `
    <section class="panel">
      <div class="panel-body metric-grid">
        <div class="metric"><div class="metric-label">Corpus</div><div class="metric-value">${h(metrics.corpusCount)}</div><div class="metric-note">synthetic traces</div></div>
        <div class="metric"><div class="metric-label">Lenses</div><div class="metric-value">${h(metrics.lensCount)}</div><div class="metric-note">evaluation groups</div></div>
        <div class="metric"><div class="metric-label">Runs</div><div class="metric-value">${h(metrics.runCount)}</div><div class="metric-note">temperature passes</div></div>
        <div class="metric"><div class="metric-label">Best Frontier</div><div class="metric-value">${pct(metrics.bestAggregate)}</div><div class="metric-note">aggregate score</div></div>
      </div>
    </section>
  `;
}

function renderLensOverview(item) {
  const frontier = frontierForLens(item.lensId);
  return `
    <section class="panel">
      <div class="panel-body">
        <div class="case-head">
          <div>
            <div class="section-title">${h(item.lensId)}</div>
            <h1 class="copy">${h(item.name)}</h1>
          </div>
          <span class="chip green">frontier ${pct(frontier?.aggregate)}</span>
        </div>
        <p class="copy">${h(item.objective)}</p>
        <div class="two-col">
          <div class="project-card">
            <div class="section-title">Best For</div>
            <div class="chip-row">${item.bestFor.map((signal) => `<span class="chip">${h(signal)}</span>`).join("")}</div>
          </div>
          <div class="project-card">
            <div class="section-title">Failure Mode</div>
            <p class="copy small">${h(item.failureMode)}</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderCorpusPanel() {
  return `
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">Synthetic Eval Corpus</div>
        <span class="chip">${state.demo5.corpus.length} traces</span>
      </div>
      <div class="panel-body">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Trace</th><th>Type</th><th>Prompt</th><th>Expected Signal</th></tr></thead>
            <tbody>
              ${state.demo5.corpus.map((trace) => `
                <tr>
                  <td>${h(trace.id)}</td>
                  <td>${h(trace.type)}</td>
                  <td>${h(trace.prompt)}</td>
                  <td>${h(trace.expectedSignal)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function renderRunMatrix(lens) {
  const runs = state.demo5.runs.filter((run) => run.lensId === lens.lensId);
  return `
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">Temperature Runs</div>
        <span class="chip">${h(runs.length)} runs</span>
      </div>
      <div class="panel-body">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Run</th><th>Mode</th><th>Scores</th><th>Risk</th></tr></thead>
            <tbody>
              ${runs.map((run) => `
                <tr>
                  <td>
                    <button class="queue-item ${run.runId === state.selectedRunId ? "active" : ""}" data-action="select-eval-run" data-id="${h(run.runId)}">
                      <span class="item-title">temp ${h(run.temperature)}</span>
                      <span class="item-subtitle">${h(run.runId)}</span>
                    </button>
                  </td>
                  <td>${h(run.mode)}</td>
                  <td>
                    <div class="chip-row">
                      <span class="score">agg ${pct(run.scores.aggregate)}</span>
                      <span class="score">nov ${pct(run.scores.novelty)}</span>
                      <span class="score">stable ${pct(run.scores.stability)}</span>
                    </div>
                  </td>
                  <td>${h(run.risks.join("; "))}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function renderEvalRunner(lens) {
  const run = state.demo5Run;
  const timeline = run?.timeline || [];
  return `
    <section class="tool-panel">
      <div class="panel-head">
        <div class="panel-title">Lens Incursion</div>
        <span class="chip">${h((run?.completedEvents || []).length)}/${h(timeline.length || 5)}</span>
      </div>
      <div class="panel-body">
        <div class="stepper">
          ${timeline.map((event, index) => {
            const done = (run?.completedEvents || []).some((item) => item.state === event.state);
            return `
              <div class="step ${event.state === run?.activeEvent?.state ? "active" : ""} ${done ? "done" : ""}">
                <span class="step-index">${index + 1}</span>
                <div>
                  <strong>${h(event.label)}</strong>
                  <span class="item-subtitle">${h(event.detail)}</span>
                  <div class="confidence">
                    <span class="confidence-track"><span class="confidence-fill" style="width: ${pct(event.confidence)}"></span></span>
                    <span class="small">${pct(event.confidence)}</span>
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
        <div class="action-row">
          <button class="primary" data-action="advance-demo5">${state.demo5Index >= (timeline.length || 5) - 1 ? "Reset" : "Run next stage"}</button>
          <button data-action="prepare-demo5">Prepare packet</button>
          <a href="/api/export/demo5/${encodeURIComponent(lens.lensId)}/${encodeURIComponent(selectedEvalRun().runId)}" target="_blank" rel="noreferrer"><button>Export packet</button></a>
        </div>
      </div>
    </section>
  `;
}

function renderFrontierPanel() {
  return `
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">Frontier Selection</div>
        <span class="chip">${state.demo5.frontier.length}</span>
      </div>
      <div class="panel-body project-list">
        ${state.demo5.frontier.map((entry) => {
          const lens = state.demo5.lenses.find((item) => item.lensId === entry.lensId);
          return `
            <button class="queue-item ${entry.selectedRunId === state.selectedRunId ? "active" : ""}" data-action="select-frontier-run" data-lens="${h(entry.lensId)}" data-run="${h(entry.selectedRunId)}">
              <div class="case-head">
                <strong>${h(lens?.name || entry.lensId)}</strong>
                <span class="chip green">${pct(entry.aggregate)}</span>
              </div>
              <span class="item-subtitle">${h(entry.selectedRunId)} / temp ${h(entry.temperature)}</span>
              <span class="item-subtitle">${h(entry.reason)}</span>
            </button>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderEvalPacket() {
  const packet = state.demo5Run?.decisionPacket || {};
  return `
    <section class="panel">
      <div class="panel-head">
        <div class="panel-title">Eval Packet</div>
        <span class="chip">${h(packet.expectedPostState || "pending")}</span>
      </div>
      <div class="panel-body">
        <div class="json-shell">
          <div class="json-bar">${h(packet.selectedRunId || "no-run-selected")}</div>
          <pre class="json-content">${h(JSON.stringify(packet, null, 2))}</pre>
        </div>
      </div>
    </section>
  `;
}

function bind() {
  document.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("click", handleAction);
    if (element.dataset.action === "role-search") {
      element.addEventListener("input", handleSearch);
    }
  });
}

function switchPath(demo) {
  const nextPath = demo === "demo1" ? "/demo1" : demo === "demo3" ? "/demo3" : demo === "demo5" ? "/demo5" : "/demo2";
  if (location.pathname !== nextPath) history.pushState({}, "", nextPath);
}

async function handleAction(event) {
  const button = event.currentTarget;
  const action = button.dataset.action;

  if (action === "switch-demo") {
    state.activeDemo = button.dataset.demo;
    switchPath(state.activeDemo);
    render();
    return;
  }

  if (action === "select-role") {
    state.selectedRoleId = button.dataset.id;
    state.demo1Step = "observe";
    state.demo1Run = await postJson("/api/demo1/incursion", { postingId: state.selectedRoleId, step: state.demo1Step });
    render();
    return;
  }

  if (action === "advance-demo1") {
    const script = state.demo1.incursionScript;
    const currentIndex = script.findIndex((step) => step.id === state.demo1Step);
    const next = script[currentIndex + 1] || script[0];
    state.demo1Step = next.id;
    state.demo1Run = await postJson("/api/demo1/incursion", { postingId: state.selectedRoleId, step: state.demo1Step });
    render();
    return;
  }

  if (action === "select-case") {
    state.selectedCaseId = button.dataset.id;
    state.demo2Index = 0;
    state.demo2Approved = false;
    state.demo2Run = await postJson("/api/demo2/incursion", { caseId: state.selectedCaseId, index: state.demo2Index });
    render();
    return;
  }

  if (action === "advance-demo2") {
    const selected = selectedCase();
    state.demo2Index = state.demo2Index >= selected.timeline.length - 1 ? 0 : state.demo2Index + 1;
    state.demo2Approved = false;
    state.demo2Run = await postJson("/api/demo2/incursion", { caseId: state.selectedCaseId, index: state.demo2Index });
    render();
    return;
  }

  if (action === "prepare-gate") {
    const selected = selectedCase();
    state.demo2Index = selected.timeline.length - 1;
    state.demo2Approved = false;
    state.demo2Run = await postJson("/api/demo2/incursion", { caseId: state.selectedCaseId, index: state.demo2Index });
    render();
    return;
  }

  if (action === "approve-demo2") {
    state.demo2Approved = true;
    render();
    return;
  }

  if (action === "reject-gate") {
    state.demo2Approved = false;
    state.demo2Index = 0;
    state.demo2Run = await postJson("/api/demo2/incursion", { caseId: state.selectedCaseId, index: state.demo2Index });
    render();
    return;
  }

  if (action === "select-ticket") {
    state.selectedTicketId = button.dataset.id;
    state.demo3Index = 0;
    state.demo3Feedback = "pending";
    state.demo3Run = await postJson("/api/demo3/incursion", {
      ticketId: state.selectedTicketId,
      index: state.demo3Index,
      feedback: state.demo3Feedback
    });
    render();
    return;
  }

  if (action === "advance-demo3") {
    const selected = selectedTicket();
    state.demo3Index = state.demo3Index >= selected.timeline.length - 1 ? 0 : state.demo3Index + 1;
    state.demo3Feedback = "pending";
    state.demo3Run = await postJson("/api/demo3/incursion", {
      ticketId: state.selectedTicketId,
      index: state.demo3Index,
      feedback: state.demo3Feedback
    });
    render();
    return;
  }

  if (action === "prepare-demo3") {
    const selected = selectedTicket();
    state.demo3Index = selected.timeline.length - 1;
    state.demo3Run = await postJson("/api/demo3/incursion", {
      ticketId: state.selectedTicketId,
      index: state.demo3Index,
      feedback: state.demo3Feedback
    });
    render();
    return;
  }

  if (action === "feedback-demo3") {
    state.demo3Index = selectedTicket().timeline.length - 1;
    state.demo3Feedback = button.dataset.feedback || "pending";
    state.demo3Run = await postJson("/api/demo3/incursion", {
      ticketId: state.selectedTicketId,
      index: state.demo3Index,
      feedback: state.demo3Feedback
    });
    render();
    return;
  }

  if (action === "select-lens") {
    state.selectedLensId = button.dataset.id;
    state.selectedRunId =
      frontierForLens(state.selectedLensId)?.selectedRunId ||
      state.demo5.runs.find((run) => run.lensId === state.selectedLensId)?.runId;
    state.demo5Index = 0;
    state.demo5Run = await postJson("/api/demo5/incursion", {
      lensId: state.selectedLensId,
      runId: state.selectedRunId,
      index: state.demo5Index
    });
    render();
    return;
  }

  if (action === "select-eval-run") {
    state.selectedRunId = button.dataset.id;
    state.demo5Index = 0;
    state.demo5Run = await postJson("/api/demo5/incursion", {
      lensId: state.selectedLensId,
      runId: state.selectedRunId,
      index: state.demo5Index
    });
    render();
    return;
  }

  if (action === "select-frontier-run") {
    state.selectedLensId = button.dataset.lens;
    state.selectedRunId = button.dataset.run;
    state.demo5Index = 0;
    state.demo5Run = await postJson("/api/demo5/incursion", {
      lensId: state.selectedLensId,
      runId: state.selectedRunId,
      index: state.demo5Index
    });
    render();
    return;
  }

  if (action === "advance-demo5") {
    const max = state.demo5Run?.timeline?.length || 5;
    state.demo5Index = state.demo5Index >= max - 1 ? 0 : state.demo5Index + 1;
    state.demo5Run = await postJson("/api/demo5/incursion", {
      lensId: state.selectedLensId,
      runId: state.selectedRunId,
      index: state.demo5Index
    });
    render();
    return;
  }

  if (action === "prepare-demo5") {
    const max = state.demo5Run?.timeline?.length || 5;
    state.demo5Index = max - 1;
    state.demo5Run = await postJson("/api/demo5/incursion", {
      lensId: state.selectedLensId,
      runId: state.selectedRunId,
      index: state.demo5Index
    });
    render();
  }
}

function handleSearch(event) {
  state.roleSearch = event.currentTarget.value;
  const cursor = event.currentTarget.selectionStart || state.roleSearch.length;
  render();
  const input = document.querySelector('[data-action="role-search"]');
  if (input) {
    input.focus();
    input.setSelectionRange(cursor, cursor);
  }
}

window.addEventListener("popstate", () => {
  state.activeDemo = demoFromPath();
  render();
});

initialize();

const app = document.querySelector("#app");

const state = {
  activeDemo: location.pathname.includes("demo1") ? "demo1" : "demo2",
  manifest: null,
  demo1: null,
  demo2: null,
  selectedRoleId: null,
  selectedCaseId: null,
  roleSearch: "",
  demo1Step: "observe",
  demo1Run: null,
  demo2Index: 0,
  demo2Run: null,
  demo2Approved: false
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
    const [manifest, demo1, demo2] = await Promise.all([
      getJson("/api/manifest"),
      getJson("/api/demo1"),
      getJson("/api/demo2")
    ]);
    state.manifest = manifest;
    state.demo1 = demo1;
    state.demo2 = demo2;
    state.selectedRoleId = demo1.queue[0]?.postingId;
    state.selectedCaseId = demo2.cases[0]?.case_id;
    state.demo1Run = await postJson("/api/demo1/incursion", {
      postingId: state.selectedRoleId,
      step: state.demo1Step
    });
    state.demo2Run = await postJson("/api/demo2/incursion", {
      caseId: state.selectedCaseId,
      index: state.demo2Index
    });
    render();
  } catch (error) {
    app.className = "boot";
    app.innerHTML = `<div class="boot-panel"><div class="mark"></div><p>${h(error.message)}</p></div>`;
  }
}

function activeTitle() {
  return state.activeDemo === "demo1" ? "Opportunity Intelligence OS" : "Fiscal Reconciliation Copilot";
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
      </nav>
      <div class="status-strip">
        <span>${h(state.manifest?.sourcePolicy || "")}</span>
      </div>
    </header>
    ${state.activeDemo === "demo1" ? renderDemo1() : renderDemo2()}
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

function bind() {
  document.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("click", handleAction);
    if (element.dataset.action === "role-search") {
      element.addEventListener("input", handleSearch);
    }
  });
}

function switchPath(demo) {
  const nextPath = demo === "demo1" ? "/demo1" : "/demo2";
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
  state.activeDemo = location.pathname.includes("demo1") ? "demo1" : "demo2";
  render();
});

initialize();

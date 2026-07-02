import { DATA } from "./fixtures.js";

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

function json(body, init = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers: { ...jsonHeaders, ...(init.headers || {}) }
  });
}

function notFound(pathname) {
  return json({ error: "not_found", pathname }, { status: 404 });
}

function appShell() {
  return new Response(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Operator Proof Demos</title>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <main id="app" class="boot">
      <div class="boot-panel">
        <div class="mark"></div>
        <p>Loading proof demos...</p>
      </div>
    </main>
    <script type="module" src="/app.js"></script>
  </body>
</html>`, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

async function readBody(request) {
  if (request.method === "GET" || request.method === "HEAD") return {};
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function findRole(postingId) {
  return DATA.demo1.queue.find((role) => role.postingId === String(postingId)) || DATA.demo1.queue[0];
}

function findCase(caseId) {
  return DATA.demo2.cases.find((item) => item.case_id === caseId) || DATA.demo2.cases[0];
}

function findTicket(ticketId) {
  return DATA.demo3.tickets.find((item) => item.ticketId === ticketId) || DATA.demo3.tickets[0];
}

function demo1Incursion(postingId, requestedStep = "observe") {
  const role = findRole(postingId);
  const script = DATA.demo1.incursionScript;
  const stepIndex = Math.max(0, script.findIndex((step) => step.id === requestedStep));
  const activeStep = script[stepIndex] || script[0];
  const form = DATA.demo1.forms[role.postingId];
  const packet = DATA.demo1.applicationPackets[role.postingId];
  return {
    demo: "demo1",
    postingId: role.postingId,
    target: `${role.company} - ${role.jobTitle}`,
    activeStep,
    completedSteps: script.slice(0, stepIndex + 1),
    nextStep: script[stepIndex + 1] || null,
    form,
    packet,
    operatorGate:
      activeStep.status === "gate" || activeStep.status === "write-simulated"
        ? {
            role: "operator",
            question: `Approve simulated application packet for ${role.company} without touching the real ATS?`,
            consequence: "synthetic write only",
            stopRule: "real submission remains blocked"
          }
        : null
  };
}

function demo2Incursion(caseId, requestedIndex = 0) {
  const selected = findCase(caseId);
  const index = Math.max(0, Math.min(Number(requestedIndex || 0), selected.timeline.length - 1));
  return {
    demo: "demo2",
    caseId: selected.case_id,
    title: selected.title,
    note: selected.synthetic_note,
    activeEvent: selected.timeline[index],
    completedEvents: selected.timeline.slice(0, index + 1),
    nextEvent: selected.timeline[index + 1] || null,
    surface: selected.surface,
    decisionPacket: selected.decisionPacket,
    operatorGate: index === selected.timeline.length - 1 ? selected.decisionPacket.operatorGate : null
  };
}

function demo3Incursion(ticketId, requestedIndex = 0, feedback = "pending") {
  const selected = findTicket(ticketId);
  const index = Math.max(0, Math.min(Number(requestedIndex || 0), selected.timeline.length - 1));
  const activeEvent = selected.timeline[index];
  const gateReady = index === selected.timeline.length - 1;
  return {
    demo: "demo3",
    ticketId: selected.ticketId,
    title: selected.title,
    account: selected.account,
    activeEvent,
    completedEvents: selected.timeline.slice(0, index + 1),
    nextEvent: selected.timeline[index + 1] || null,
    gesture: selected.gesture,
    evidence: selected.evidence,
    retrievedContext: selected.retrievedContext,
    proposedResponse: selected.proposedResponse,
    missingEvidence: selected.missingEvidence,
    feedback,
    decisionPacket: {
      ...selected.decisionPacket,
      operatorFeedback: feedback
    },
    operatorGate: gateReady
      ? {
          role: "operator",
          question: selected.operatorQuestion,
          reason: `${selected.gesture.label}; external send remains blocked until approval.`
        }
      : null
  };
}

function exportDemo1(postingId) {
  const role = findRole(postingId);
  return {
    exportedAt: new Date().toISOString(),
    kind: "simulated_application_packet",
    sourcePolicy: DATA.sourcePolicy,
    ...demo1Incursion(role.postingId, "simulated_submit")
  };
}

function exportDemo2(caseId) {
  const selected = findCase(caseId);
  return {
    exportedAt: new Date().toISOString(),
    kind: "operator_decision_packet",
    sourcePolicy: DATA.sourcePolicy,
    case: selected
  };
}

function exportDemo3(ticketId) {
  const selected = findTicket(ticketId);
  return {
    exportedAt: new Date().toISOString(),
    kind: "support_triage_packet",
    sourcePolicy: DATA.sourcePolicy,
    ticket: selected
  };
}

async function assetFallback(request, env) {
  const url = new URL(request.url);
  if (url.pathname === "/" || url.pathname === "/demo1" || url.pathname === "/demo2" || url.pathname === "/demo3") {
    return appShell();
  }
  if (!env.ASSETS) return notFound(url.pathname);
  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === "/api/health") {
      return json({
        ok: true,
        generatedAt: DATA.generatedAt,
        demos: DATA.demos.map((demo) => demo.id)
      });
    }

    if (pathname === "/api/manifest") {
      return json({
        generatedAt: DATA.generatedAt,
        sourcePolicy: DATA.sourcePolicy,
        demos: DATA.demos
      });
    }

    if (pathname === "/api/demo1" && request.method === "GET") {
      return json(DATA.demo1);
    }

    if (pathname === "/api/demo1/incursion" && request.method === "POST") {
      const body = await readBody(request);
      return json(demo1Incursion(body.postingId, body.step));
    }

    if (pathname.startsWith("/api/export/demo1/") && request.method === "GET") {
      return json(exportDemo1(decodeURIComponent(pathname.split("/").pop())));
    }

    if (pathname === "/api/demo2" && request.method === "GET") {
      return json(DATA.demo2);
    }

    if (pathname === "/api/demo2/incursion" && request.method === "POST") {
      const body = await readBody(request);
      return json(demo2Incursion(body.caseId, body.index));
    }

    if (pathname.startsWith("/api/export/demo2/") && request.method === "GET") {
      return json(exportDemo2(decodeURIComponent(pathname.split("/").pop())));
    }

    if (pathname === "/api/demo3" && request.method === "GET") {
      return json(DATA.demo3);
    }

    if (pathname === "/api/demo3/incursion" && request.method === "POST") {
      const body = await readBody(request);
      return json(demo3Incursion(body.ticketId, body.index, body.feedback));
    }

    if (pathname.startsWith("/api/export/demo3/") && request.method === "GET") {
      return json(exportDemo3(decodeURIComponent(pathname.split("/").pop())));
    }

    if (pathname.startsWith("/api/")) return notFound(pathname);
    return assetFallback(request, env);
  }
};

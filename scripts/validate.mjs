import worker from "../src/index.js";
import { DATA } from "../src/fixtures.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function checkNoClientLeak(value) {
  const serialized = JSON.stringify(value);
  const forbidden = [
    ["Me", "ga"].join(""),
    ["Movi", "desk"].join(""),
    ["In", "vent"].join(""),
    "168295",
    "125740",
    "172254"
  ];
  for (const token of forbidden) {
    assert(!serialized.includes(token), `forbidden token leaked: ${token}`);
  }
  const queryTokenPattern = new RegExp(["token", "="].join(""), "i");
  assert(!queryTokenPattern.test(serialized), "URL query credential leaked");
  const oldPublicName = new RegExp(["Limi", "naut|limi", "naut"].join(""));
  assert(!oldPublicName.test(serialized), "old public name leaked");
}

async function call(pathname, init = {}) {
  return worker.fetch(new Request(`https://demo.local${pathname}`, init), {});
}

assert(DATA.demo1.queue.length === 50, "Demo 1 should contain top 50 priority roles");
assert(DATA.demo1.queue.every((role) => /^Hiring Org \d{3}$/.test(role.company)), "Demo 1 companies must be anonymous");
assert(DATA.demo1.queue.every((role) => role.sourceUrl === ""), "Demo 1 must not expose source URLs");
assert(DATA.demo1.projectQueue.length >= 5, "Demo 1 should contain project proof queue");
assert(DATA.demo1.topology.postingCount >= 100, "Demo 1 topology should reflect the corpus");
assert(DATA.demo2.cases.length === 5, "Demo 2 should contain five synthetic fiscal cases");
assert(DATA.demo2.cases.every((item) => item.decisionPacket), "Demo 2 cases need decision packets");
assert(DATA.demo2.cases.some((item) => item.decisionPacket.operatorGate), "Demo 2 needs operator gates");
assert(DATA.demo3.tickets.length === 5, "Demo 3 should contain five synthetic support tickets");
assert(DATA.demo3.tickets.every((ticket) => ticket.decisionPacket && ticket.gesture), "Demo 3 tickets need gestures and decision packets");
assert(DATA.demo3.tickets.every((ticket) => ticket.decisionPacket.externalSendBlocked), "Demo 3 external sends must be blocked by default");
assert(DATA.demo3.gestures.length >= 5, "Demo 3 should expose safe support gestures");
assert(DATA.demo5.corpus.length === 6, "Demo 5 should contain six synthetic eval traces");
assert(DATA.demo5.lenses.length === 5, "Demo 5 should contain five lens groups");
assert(DATA.demo5.runs.length === 15, "Demo 5 should contain three temperature runs per lens");
assert(DATA.demo5.frontier.length === DATA.demo5.lenses.length, "Demo 5 should select one frontier run per lens");
assert(DATA.demo5.runs.every((run) => run.scores && run.outputBullets.length && run.risks.length), "Demo 5 runs need scored outputs and risks");
assert(DATA.demo5.frontier.every((entry) => DATA.demo5.runs.some((run) => run.runId === entry.selectedRunId)), "Demo 5 frontier must reference valid runs");
checkNoClientLeak(DATA);

const health = await call("/api/health");
assert(health.ok, "health endpoint should return ok");
const demo1 = await call("/api/demo1");
assert(demo1.ok, "demo1 endpoint should return ok");
const demo2 = await call("/api/demo2");
assert(demo2.ok, "demo2 endpoint should return ok");
const demo3 = await call("/api/demo3");
assert(demo3.ok, "demo3 endpoint should return ok");
const demo5 = await call("/api/demo5");
assert(demo5.ok, "demo5 endpoint should return ok");
const incursion1 = await call("/api/demo1/incursion", {
  method: "POST",
  body: JSON.stringify({ postingId: DATA.demo1.queue[0].postingId, step: "operator_gate" })
});
assert(incursion1.ok, "demo1 incursion should return ok");
const incursion1Json = await incursion1.json();
assert(incursion1Json.operatorGate, "demo1 operator gate should exist at gate step");
const incursion2 = await call("/api/demo2/incursion", {
  method: "POST",
  body: JSON.stringify({ caseId: DATA.demo2.cases[1].case_id, index: 99 })
});
assert(incursion2.ok, "demo2 incursion should return ok");
const incursion2Json = await incursion2.json();
assert(incursion2Json.decisionPacket, "demo2 incursion should return decision packet");
const incursion3 = await call("/api/demo3/incursion", {
  method: "POST",
  body: JSON.stringify({ ticketId: DATA.demo3.tickets[1].ticketId, index: 99, feedback: "approve" })
});
assert(incursion3.ok, "demo3 incursion should return ok");
const incursion3Json = await incursion3.json();
assert(incursion3Json.operatorGate, "demo3 incursion should return operator gate at final step");
assert(incursion3Json.decisionPacket.operatorFeedback === "approve", "demo3 feedback should enter decision packet");
const incursion5 = await call("/api/demo5/incursion", {
  method: "POST",
  body: JSON.stringify({
    lensId: DATA.demo5.lenses[0].lensId,
    runId: DATA.demo5.frontier[0].selectedRunId,
    index: 99
  })
});
assert(incursion5.ok, "demo5 incursion should return ok");
const incursion5Json = await incursion5.json();
assert(incursion5Json.timeline.length === 5, "demo5 incursion should return full timeline");
assert(incursion5Json.decisionPacket.externalMutation === false, "demo5 packet must not mutate external systems");
assert(incursion5Json.decisionPacket.expectedPostState === "frontier_candidate_ready", "demo5 packet should end at frontier candidate state");
assert(incursion5Json.decisionPacket.replayInputs.length === DATA.demo5.corpus.length, "demo5 packet should include replay input ids");
const mismatchedRun = await call("/api/demo5/incursion", {
  method: "POST",
  body: JSON.stringify({
    lensId: DATA.demo5.lenses[0].lensId,
    runId: DATA.demo5.runs.find((run) => run.lensId !== DATA.demo5.lenses[0].lensId).runId,
    index: 0
  })
});
const mismatchedRunJson = await mismatchedRun.json();
assert(mismatchedRunJson.selectedRun.lensId === DATA.demo5.lenses[0].lensId, "demo5 should not mix a run from another lens into the selected lens packet");

console.log("Validated data fixtures and Worker API routes.");

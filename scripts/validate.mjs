import worker from "../src/index.js";
import { DATA } from "../src/fixtures.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function checkNoClientLeak(value) {
  const serialized = JSON.stringify(value);
  const forbidden = [
    "Mega",
    "Movidesk",
    "Invent",
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
checkNoClientLeak(DATA);

const health = await call("/api/health");
assert(health.ok, "health endpoint should return ok");
const demo1 = await call("/api/demo1");
assert(demo1.ok, "demo1 endpoint should return ok");
const demo2 = await call("/api/demo2");
assert(demo2.ok, "demo2 endpoint should return ok");
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

console.log("Validated data fixtures and Worker API routes.");

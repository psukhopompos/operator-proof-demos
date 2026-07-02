import { GENERATED } from "./generated-data.js";

const demo1Script = [
  {
    id: "observe",
    label: "Observe Posting",
    status: "read",
    detail: "Open the target page, classify role/workflow archetype, and compare against the market topology."
  },
  {
    id: "extract_form",
    label: "Extract Form",
    status: "read",
    detail: "Recover visible fields, long-form prompts, upload slots, account gates, and friction points."
  },
  {
    id: "compose_packet",
    label: "Compose Packet",
    status: "suggest",
    detail: "Bind the role to proof blocks, generate answer strategies, and mark unresolved gaps."
  },
  {
    id: "operator_gate",
    label: "Operator Gate",
    status: "gate",
    detail: "Ask for operator approval before any real external account creation or live submission."
  },
  {
    id: "simulated_submit",
    label: "Simulated Submit",
    status: "write-simulated",
    detail: "Execute only against the synthetic page and export the full trace packet."
  }
];

const answerUniverse = [
  {
    id: "ai_native_velocity",
    label: "AI-native velocity",
    evidence: "Daily use of Codex, Claude Code, and Cursor to ship full-stack and automation work.",
    usedFor: ["ai_native_builder", "ai_product_builder", "agentic_workflow_builder"]
  },
  {
    id: "operator_gates",
    label: "Operator gates",
    evidence: "Human-owned approval boundaries, trace packets, confidence shifts, and rollback-aware movement.",
    usedFor: ["ai_automation_engineer", "forward_deployed_ai_engineer", "traditional_engineer_ai_augmented"]
  },
  {
    id: "legacy_incursion",
    label: "Legacy incursion",
    evidence: "Evidence-first exploration inside ERP/support surfaces when the system shape is initially unknown.",
    usedFor: ["ai_application_engineer", "ai_automation_engineer", "legacy_modernization"]
  },
  {
    id: "fullstack_proof",
    label: "Full-stack proof",
    evidence: "Cloudflare Worker demos with real API routes, exported packets, and public-safe synthetic data.",
    usedFor: ["ai_native_builder", "ai_product_builder", "build_full_app_from_prd"]
  }
];

const fiscalStateLegend = [
  "blocked_surface",
  "evidence_ready",
  "candidate_retrieved",
  "candidate_conflict",
  "ready_for_operator_gate",
  "stock_materialized",
  "human_exception",
  "correction_required"
];

export const DATA = {
  generatedAt: GENERATED.generatedAt,
  sourcePolicy: GENERATED.sourcePolicy,
  demos: [
    {
      id: "demo1",
      route: "/demo1",
      name: "Opportunity Intelligence OS",
      promise: "Market topology, proof gaps, and simulated application movement from one corpus."
    },
    {
      id: "demo2",
      route: "/demo2",
      name: "Fiscal Reconciliation Copilot",
      promise: "Synthetic ERP incursion with evidence, lateral probes, operator gates, and exportable packets."
    }
  ],
  demo1: {
    topology: GENERATED.topology,
    queue: GENERATED.priorityRoles,
    projectQueue: GENERATED.projectQueue,
    forms: GENERATED.simulatedForms,
    applicationPackets: GENERATED.applicationPackets,
    incursionScript: demo1Script,
    answerUniverse,
    primitives: GENERATED.seedPrimitives.filter((primitive) =>
      (primitive.demo_relevance || []).includes("opportunity_intelligence_os")
    )
  },
  demo2: {
    cases: GENERATED.fiscalCases,
    stateLegend: fiscalStateLegend,
    primitives: GENERATED.seedPrimitives.filter((primitive) =>
      (primitive.demo_relevance || []).includes("fiscal_reconciliation_copilot")
    )
  }
};

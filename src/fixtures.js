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

const supportGestures = [
  {
    id: "auto_response_candidate",
    label: "Auto-response candidate",
    sendPermission: "operator-gated",
    description: "Low-risk response where evidence and policy match; still gated before any external send."
  },
  {
    id: "suggest_with_review",
    label: "Suggest with review",
    sendPermission: "human-review-required",
    description: "Likely answer, but product/context nuance should be reviewed by an operator."
  },
  {
    id: "request_evidence",
    label: "Request evidence",
    sendPermission: "safe-request",
    description: "The next useful action is asking for logs, timestamps, screenshots, or reproduction details."
  },
  {
    id: "route_to_specialist",
    label: "Route to specialist",
    sendPermission: "handoff-required",
    description: "Evidence shows a specialized queue or human owner is needed."
  },
  {
    id: "reject_automation",
    label: "Reject automation",
    sendPermission: "blocked",
    description: "The ticket asks for something the system should not answer or mutate automatically."
  }
];

const supportTickets = [
  {
    ticketId: "SYN-SUP-301",
    title: "Webhook deliveries delayed after endpoint rotation",
    account: "Tenant 031",
    channel: "email",
    severity: "high",
    receivedAt: "2026-07-02T09:12:00Z",
    customerMessage:
      "We rotated our webhook endpoint this morning and now document events are arriving 20-30 minutes late. Can someone confirm whether the queue is stuck?",
    tags: ["webhook", "latency", "integration"],
    evidence: [
      { source: "delivery ledger", fact: "Recent retries show 429 responses from the customer endpoint.", strength: "strong" },
      { source: "status page", fact: "No platform-wide incident in the synthetic region.", strength: "medium" },
      { source: "runbook", fact: "429 after endpoint rotation maps to backoff explanation plus retry-window guidance.", strength: "strong" }
    ],
    retrievedContext: [
      "Retries are intentionally delayed when the destination returns rate limits.",
      "Support may ask for the new endpoint's rate limit and accepted burst size.",
      "Do not reset delivery state without operator approval."
    ],
    proposedResponse:
      "We found rate-limit responses from the new endpoint, so the delivery queue is backing off rather than stuck. Please confirm the endpoint's current rate limit and accepted burst size; we can then advise whether to widen the limit or adjust delivery pacing.",
    gestureId: "request_evidence",
    confidence: 0.82,
    missingEvidence: ["new endpoint rate limit", "accepted burst size"],
    operatorQuestion: "Approve asking Tenant 031 for endpoint rate-limit details before proposing any queue reset?",
    finalState: "waiting_for_customer_evidence"
  },
  {
    ticketId: "SYN-SUP-302",
    title: "Invoice import appears duplicated in the review queue",
    account: "Tenant 044",
    channel: "portal",
    severity: "medium",
    receivedAt: "2026-07-02T10:04:00Z",
    customerMessage:
      "The same supplier invoice appears twice in review. We are worried the automation created a duplicate payable.",
    tags: ["invoice", "duplicate", "finance"],
    evidence: [
      { source: "queue view", fact: "Two review cards share a supplier and amount but have distinct synthetic document IDs.", strength: "medium" },
      { source: "finance ledger", fact: "No payable row exists for either review card.", strength: "strong" },
      { source: "dedupe policy", fact: "Two review cards should be held until document hash comparison completes.", strength: "strong" }
    ],
    retrievedContext: [
      "A duplicate review card is not a posted payable.",
      "Hash comparison is required before telling the customer this is safe.",
      "Finance mutation is out of scope for automated support response."
    ],
    proposedResponse:
      "The review queue can show duplicate-looking cards before posting. In this case no payable has been created. We are holding the cards for a document-hash check and will confirm whether one card should be closed or both should remain under review.",
    gestureId: "suggest_with_review",
    confidence: 0.76,
    missingEvidence: ["document hash comparison"],
    operatorQuestion: "Approve a reviewed response that confirms no payable exists while the hash check completes?",
    finalState: "suggestion_ready_for_review"
  },
  {
    ticketId: "SYN-SUP-303",
    title: "Password reset email not arriving",
    account: "Tenant 052",
    channel: "chat",
    severity: "low",
    receivedAt: "2026-07-02T11:22:00Z",
    customerMessage:
      "A user requested a password reset twice and has not received an email. What should we check?",
    tags: ["auth", "email", "how-to"],
    evidence: [
      { source: "mail event log", fact: "Reset email was accepted by the recipient mail server.", strength: "strong" },
      { source: "help article", fact: "Accepted delivery with missing inbox maps to spam/quarantine checks.", strength: "strong" },
      { source: "policy", fact: "Support can provide self-serve checks but cannot reveal security tokens.", strength: "strong" }
    ],
    retrievedContext: [
      "Accepted by recipient server means platform delivery succeeded.",
      "Common next steps are spam, quarantine, allowlist, and resend after five minutes."
    ],
    proposedResponse:
      "The reset email was accepted by your mail server, so delivery from the platform completed. Please check spam/quarantine and confirm the sender is allowlisted. If it is still missing after five minutes, trigger one new reset and we can re-check the mail event.",
    gestureId: "auto_response_candidate",
    confidence: 0.91,
    missingEvidence: [],
    operatorQuestion: "Approve this low-risk self-serve response for synthetic send?",
    finalState: "auto_response_ready"
  },
  {
    ticketId: "SYN-SUP-304",
    title: "Admin asks support to disable another user's MFA",
    account: "Tenant 063",
    channel: "email",
    severity: "critical",
    receivedAt: "2026-07-02T12:37:00Z",
    customerMessage:
      "Please disable MFA for one of our admins. They are locked out and we need access restored right away.",
    tags: ["security", "mfa", "account-access"],
    evidence: [
      { source: "security policy", fact: "MFA removal requires verified account owner flow.", strength: "strong" },
      { source: "request identity", fact: "Requester identity is not verified in the ticket body.", strength: "strong" },
      { source: "audit policy", fact: "Support automation must not change authentication state.", strength: "strong" }
    ],
    retrievedContext: [
      "MFA changes are privileged account actions.",
      "The safe response is a verification route, not fulfillment."
    ],
    proposedResponse:
      "We cannot disable MFA from this ticket. Please use the verified account-owner recovery flow so the request can be authenticated and audited. I am routing this to the security queue for manual handling.",
    gestureId: "route_to_specialist",
    confidence: 0.94,
    missingEvidence: ["verified account-owner recovery confirmation"],
    operatorQuestion: "Approve routing this ticket to the security queue with the verification-flow response?",
    finalState: "security_handoff_required"
  },
  {
    ticketId: "SYN-SUP-305",
    title: "Customer requests refund promise in support chat",
    account: "Tenant 077",
    channel: "chat",
    severity: "medium",
    receivedAt: "2026-07-02T14:10:00Z",
    customerMessage:
      "The sync failed yesterday. Promise us a service credit in writing now or escalate this to your manager.",
    tags: ["billing", "commercial", "refund"],
    evidence: [
      { source: "billing policy", fact: "Support cannot promise credits or refunds.", strength: "strong" },
      { source: "incident ledger", fact: "Synthetic sync failure still needs impact confirmation.", strength: "medium" },
      { source: "handoff policy", fact: "Commercial commitments require account-owner review.", strength: "strong" }
    ],
    retrievedContext: [
      "The system can acknowledge impact and route the request.",
      "It must not promise credits, refunds, or legal/commercial remedies."
    ],
    proposedResponse:
      "I can route the impact details for account review, but I cannot promise credits or refunds in support chat. Please share the affected workflow and timeframe; we will attach that to the commercial review handoff.",
    gestureId: "reject_automation",
    confidence: 0.88,
    missingEvidence: ["affected workflow", "impact timeframe"],
    operatorQuestion: "Reject automated commercial commitment and approve a handoff/evidence request instead?",
    finalState: "commercial_handoff_required"
  }
].map((ticket) => {
  const gesture = supportGestures.find((item) => item.id === ticket.gestureId);
  const timeline = [
    {
      state: "ticket_received",
      label: "Capture",
      detail: "Ticket entered the synthetic queue with no mutation permissions.",
      confidence: 0.35
    },
    {
      state: "evidence_retrieved",
      label: "Retrieve Evidence",
      detail: `${ticket.evidence.length} evidence items retrieved across ledger, policy, and runbook surfaces.`,
      confidence: Math.max(0.62, ticket.confidence - 0.16)
    },
    {
      state: "gesture_selected",
      label: "Classify Gesture",
      detail: `${gesture.label}: ${gesture.description}`,
      confidence: ticket.confidence
    },
    {
      state: ticket.finalState,
      label: "Operator Gate",
      detail: ticket.operatorQuestion,
      confidence: ticket.confidence
    }
  ];

  return {
    ...ticket,
    gesture,
    timeline,
    feedbackOptions: [
      { id: "approve", label: "Approve suggestion", effect: "Records operator approval for the synthetic response packet." },
      { id: "edit", label: "Edit response", effect: "Keeps the gesture but marks copy as operator-edited." },
      { id: "ask_more", label: "Ask for evidence", effect: "Moves ticket to waiting-for-evidence state." },
      { id: "escalate", label: "Escalate", effect: "Routes ticket to the named specialist queue." }
    ],
    decisionPacket: {
      ticketId: ticket.ticketId,
      account: ticket.account,
      severity: ticket.severity,
      gesture: gesture.id,
      confidence: ticket.confidence,
      evidence: ticket.evidence,
      missingEvidence: ticket.missingEvidence,
      proposedResponse: ticket.proposedResponse,
      operatorQuestion: ticket.operatorQuestion,
      externalSendBlocked: true,
      expectedPostState: ticket.finalState
    },
    exportName: `${ticket.ticketId.toLowerCase()}-support-packet.json`
  };
});

const supportMetrics = {
  ticketCount: supportTickets.length,
  autoCandidates: supportTickets.filter((ticket) => ticket.gestureId === "auto_response_candidate").length,
  reviewRequired: supportTickets.filter((ticket) => ticket.gestureId === "suggest_with_review").length,
  evidenceRequests: supportTickets.filter((ticket) => ticket.gestureId === "request_evidence").length,
  handoffs: supportTickets.filter((ticket) => ["route_to_specialist", "reject_automation"].includes(ticket.gestureId)).length
};

export const DATA = {
  generatedAt: GENERATED.generatedAt,
  sourcePolicy: GENERATED.sourcePolicy,
  demos: [
    {
      id: "demo2",
      route: "/demo2",
      name: "Fiscal Reconciliation Copilot",
      promise: "Synthetic ERP incursion with evidence, lateral probes, operator gates, and exportable packets."
    },
    {
      id: "demo1",
      route: "/demo1",
      name: "Opportunity Intelligence OS",
      promise: "Market topology, proof gaps, and simulated application movement from one corpus."
    },
    {
      id: "demo3",
      route: "/demo3",
      name: "Support Triage HITL Runtime",
      promise: "Synthetic support queue with evidence retrieval, safe response gestures, human feedback, and exportable packets."
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
  },
  demo3: {
    tickets: supportTickets,
    gestures: supportGestures,
    metrics: supportMetrics,
    primitives: [
      {
        id: "safe_support_gesture",
        kind: "safety_boundary",
        definition: "Classify support work by the safest useful next gesture before generating a response.",
        ui_implication: "Show the gesture, evidence, missing evidence, and send boundary together."
      },
      {
        id: "feedback_ledger",
        kind: "improvement_loop",
        definition: "Every approval, edit, escalation, or evidence request becomes training signal for the next support run.",
        ui_implication: "Feedback controls must write to a visible packet rather than disappear as a button click."
      }
    ]
  }
};

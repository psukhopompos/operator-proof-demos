import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const sourceRoot = path.resolve(projectRoot, "../career-ops/data/ai_builder_jobs_2026-06-30");
const auditDir = (await readdir(sourceRoot, { withFileTypes: true }))
  .find((entry) => entry.isDirectory() && entry.name.endsWith("_reuse_audit_2026-07-01"))?.name;

if (!auditDir) {
  throw new Error("Could not find reuse audit source folder.");
}

const auditRoot = path.join(sourceRoot, auditDir);

const sources = {
  priorityRoles: path.join(sourceRoot, "application_strategy/outputs/priority_roles_top50.jsonl"),
  projectQueue: path.join(sourceRoot, "application_strategy/outputs/publishable_project_queue.jsonl"),
  topologyMatrix: path.join(sourceRoot, "operational_lens_matrix/matrix/posting_lens_matrix.jsonl"),
  seedPrimitives: path.join(auditRoot, "demo_1_2_seed_primitives_2026-07-02.jsonl"),
  fiscalCases: path.join(auditRoot, "mega_demo2_mining_2026-07-02/demo2_synthetic_case_seed_2026-07-02.jsonl")
};

function parseJsonl(text, sourceName) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`${sourceName}:${index + 1}: ${error.message}`);
      }
    });
}

async function readJsonl(filePath, sourceName) {
  return parseJsonl(await readFile(filePath, "utf8"), sourceName);
}

function topCounts(rows, field, limit = 8) {
  const counts = new Map();
  for (const row of rows) {
    const value = row[field] || "unknown";
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function byNumericField(rows, field) {
  return rows.reduce((sum, row) => sum + Number(row[field] || 0), 0) / Math.max(rows.length, 1);
}

function cleanUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return value.split("?")[0].split("#")[0];
  }
}

function titleCaseToken(value) {
  const title = value
    .split("_")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
  return title.replace(/\bAi\b/g, "AI");
}

function anonymousCompany(rank) {
  return `Hiring Org ${String(rank).padStart(3, "0")}`;
}

function anonymousTitle(row) {
  const role = row.role_archetype || row.canonical_role_archetype || "";
  const workflow = row.workflow_archetype || row.primary_workflow_archetype || "";
  const text = `${row.job_title || ""} ${role} ${workflow}`.toLowerCase();

  if (text.includes("forward")) return "Forward-Deployed AI Engineer";
  if (text.includes("automation") || text.includes("n8n") || text.includes("ops")) return "AI Automation Engineer";
  if (text.includes("product")) return "AI Product Builder";
  if (text.includes("platform") || text.includes("developer experience") || text.includes("devex")) return "AI Platform Engineer";
  if (text.includes("full-stack") || text.includes("full stack")) return "AI-Native Full-Stack Builder";
  if (text.includes("agent")) return "Agentic Workflow Engineer";
  if (role) return titleCaseToken(role);
  return "AI-Native Builder";
}

function publicPitch(row) {
  const role = row.role_archetype || "ai_native_builder";
  const workflow = row.workflow_archetype || "applied AI workflow";
  if (role.includes("automation")) return "I build operator-visible automations with evidence trails, gates, and safe handoff points.";
  if (role.includes("product")) return "I turn ambiguous AI product needs into working proof surfaces with full-stack delivery.";
  if (role.includes("forward")) return "I enter unclear operational surfaces, recover the shape, and ship the next bounded proof.";
  if (workflow.includes("prd")) return "I can move from rough product intent to a working app with traceable build decisions.";
  return "I ship AI-native software with fast iteration, visible traces, and practical operator boundaries.";
}

function publicProofGap(row) {
  const flags = row.risk_flags || [];
  if (flags.some((flag) => /onsite|hybrid/i.test(flag))) return "Geography or onsite expectations may need positioning.";
  if (flags.some((flag) => /years|senior/i.test(flag))) return "Seniority framing should be backed by concrete proof assets.";
  if ((row.best_existing_proof_blocks || []).length === 0) return "Needs a small proof artifact before application.";
  return "Needs role-specific packaging, but current proof blocks cover the core workflow.";
}

function publicRankingReason(row) {
  const archetype = row.role_archetype || "AI-native role";
  const workflow = row.workflow_archetype || "applied workflow";
  return `High alignment with ${archetype} / ${workflow}, ranked by fit, proof fit, AI-native signal, and application friction.`;
}

function safeRole(row) {
  return {
    rank: row.rank,
    postingId: String(row.posting_id),
    company: anonymousCompany(row.rank),
    jobTitle: anonymousTitle(row),
    sourceUrl: "",
    sourceLabel: `Synthetic posting ${String(row.rank).padStart(3, "0")}`,
    priorityScore: row.priority_score,
    fitScore: row.fit_score,
    proofFitScore: row.proof_fit_score,
    aiNativeScore: row.ai_native_score,
    applicationFriction: row.application_friction || "unknown",
    roleArchetype: row.role_archetype || "unknown",
    workflowArchetype: row.workflow_archetype || "unknown",
    contractAngle: row.contract_angle || "",
    primaryPitchAngle: publicPitch(row),
    bestExistingProofBlocks: row.best_existing_proof_blocks || [],
    proofGap: publicProofGap(row),
    nextAction: row.next_action || "review",
    whyRankedHere: publicRankingReason(row),
    riskFlags: row.risk_flags || []
  };
}

function safeProject(row) {
  return {
    rank: row.rank,
    slug: row.project_slug,
    title: row.title,
    oneSentence: row.one_sentence,
    marketNeedAnswered: row.market_need_answered,
    targetRoleArchetypes: row.target_role_archetypes || [],
    targetWorkflowArchetypes: row.target_workflow_archetypes || [],
    recommendedStack: row.recommended_stack || [],
    publicArtifacts: row.public_artifacts || [],
    proofClaims: row.proof_claims || [],
    minimumPublishableScope: row.minimum_publishable_scope,
    strongVersionScope: row.strong_version_scope,
    estimatedEffort: row.estimated_effort,
    applicationReuse: row.application_reuse,
    riskOrSensitivity: row.risk_or_sensitivity,
    nextThreeSteps: row.next_three_steps || [],
    buildingBlocksUsed: (row.building_blocks_used || []).map((block) => ({
      id: block.bb_id,
      role: block.role,
      transform: block.how_to_transform_it
    }))
  };
}

function sanitizeText(value) {
  const privateClientA = ["Me", "ga"].join("");
  const privateClientB = ["In", "vent"].join("");
  const privateSurface = ["Movi", "desk"].join("");
  return value
    .replace(new RegExp(`\\b${privateClientA}\\b`, "g"), "Legacy ERP")
    .replace(new RegExp(`\\b${privateClientA.toLowerCase()}\\b`, "g"), "legacy ERP")
    .replace(new RegExp(`\\b${privateClientB}\\b`, "g"), "Support Desk")
    .replace(new RegExp(`\\b${privateClientB.toLowerCase()}\\b`, "g"), "support desk")
    .replace(new RegExp(`\\b${privateSurface}\\b`, "g"), "Support Desk")
    .replace(new RegExp(`\\b${privateSurface.toLowerCase()}\\b`, "g"), "support desk");
}

function sanitizeValue(value) {
  if (typeof value === "string") return sanitizeText(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeValue(item)]));
  }
  return value;
}

function makeForm(role) {
  const lowerTitle = role.jobTitle.toLowerCase();
  const asksLoom = role.riskFlags.some((flag) => /loom/i.test(flag));
  const automationHeavy = /automation|operator|ops/.test(`${lowerTitle} ${role.workflowArchetype}`);
  const productHeavy = /product|builder|full-stack|full stack/.test(`${lowerTitle} ${role.workflowArchetype}`);

  const questions = [
    {
      id: "identity",
      label: "Identity",
      type: "profile",
      fields: ["name", "email", "location", "portfolio_url", "github_url", "linkedin_url"]
    },
    {
      id: "availability",
      label: "Availability",
      type: "select",
      fields: ["start_window", "contract_preference", "timezone_overlap", "weekly_capacity"]
    },
    {
      id: "proof",
      label: "Proof Packet",
      type: "long_text",
      prompt: `Map 2-3 proof assets to ${role.company}'s ${role.jobTitle} needs.`,
      suggestedBlocks: role.bestExistingProofBlocks
    },
    {
      id: "ai_native_workflow",
      label: "AI-Native Workflow",
      type: "long_text",
      prompt: "Describe how you use coding agents to ship production work with operator-visible traces."
    }
  ];

  if (automationHeavy) {
    questions.push({
      id: "automation_case",
      label: "Automation Case",
      type: "long_text",
      prompt: "Describe an internal workflow you made safer or faster with evidence gates."
    });
  }

  if (productHeavy) {
    questions.push({
      id: "build_from_prd",
      label: "Build From Ambiguity",
      type: "long_text",
      prompt: "Describe how you turn an ambiguous product need into a working app."
    });
  }

  if (asksLoom) {
    questions.push({
      id: "loom_demo",
      label: "Video Demo",
      type: "url",
      prompt: "Attach a short demo showing a working proof asset."
    });
  }

  return {
    postingId: role.postingId,
    company: role.company,
    jobTitle: role.jobTitle,
    platform: role.applicationFriction === "low" ? "direct form" : "ATS form",
    estimatedFields: questions.reduce((total, group) => total + group.fields?.length || total + 1, 0),
    questions
  };
}

function makeApplicationPacket(role, form) {
  return {
    postingId: role.postingId,
    target: `${role.company} - ${role.jobTitle}`,
    operatorDecision: "approve simulated submission only",
    fit: {
      priorityScore: role.priorityScore,
      fitScore: role.fitScore,
      proofFitScore: role.proofFitScore,
      aiNativeScore: role.aiNativeScore,
      friction: role.applicationFriction
    },
    thesis: role.primaryPitchAngle,
    proofBlocks: role.bestExistingProofBlocks,
    gapToClose: role.proofGap,
    generatedAnswers: form.questions.map((question) => ({
      questionId: question.id,
      label: question.label,
      answerStrategy:
        question.id === "proof"
          ? "bind top proof blocks to the role's workflow archetype"
          : question.id === "ai_native_workflow"
            ? "show agentic speed with traceability and operator gates"
            : question.id === "availability"
              ? "state contract/full-time openness and timezone overlap clearly"
              : "provide standard profile/resume material"
    })),
    stopRule: "pause before any real external account creation or real submission"
  };
}

function caseSurface(caseRow) {
  const note = caseRow.synthetic_note || {};
  const common = [
    ["document", note.number || "unknown"],
    ["supplier", note.supplier || "synthetic supplier"],
    ["filial", note.filial || "synthetic filial"],
    ["total", String(note.total || "0")]
  ];

  if (caseRow.case_id === "SYN-ERP-001") {
    return {
      surfaceState: "stale frame -> clean evidence panel",
      sqlPreview: "select document_no, supplier, status from synthetic_note_queue where document_no = :note",
      resultRows: common.concat([["surface_ready", "true"], ["evidence_clock", "fresh"]])
    };
  }
  if (caseRow.case_id === "SYN-ERP-002") {
    return {
      surfaceState: "purchase context recovered",
      sqlPreview: "select po_no, parent_alive, open_qty, semantic_score from synthetic_purchase_candidates",
      resultRows: [
        ["PO-OLD-18905", "false", "0", "0.31"],
        ["PO-SURV-109090", "true", "4", "0.88"]
      ]
    };
  }
  if (caseRow.case_id === "SYN-ERP-003") {
    return {
      surfaceState: "evidence exhausted",
      sqlPreview: "select po_no, parent_alive from synthetic_purchase_headers where supplier = :supplier",
      resultRows: [["PO-GHOST-163345", "false"], ["same_supplier_open_parent", "none"]]
    };
  }
  if (caseRow.case_id === "SYN-ERP-004") {
    return {
      surfaceState: "finance preflight hardened",
      sqlPreview: "select due_date, business_day_due, persisted_after_rollback from synthetic_finance_tail",
      resultRows: [
        ["2026-07-18", "2026-07-20", "false"],
        ["2026-08-18", "2026-08-18", "false"]
      ]
    };
  }
  return {
    surfaceState: "semantic mismatch detected",
    sqlPreview: "select receipt_count, stock_count, finance_count, semantic_match from synthetic_route_statecheck",
    resultRows: [["1", "1", "1", "false"]]
  };
}

function makeFiscalPacket(caseRow) {
  const gate = caseRow.operator_gate;
  return {
    caseId: caseRow.case_id,
    note: caseRow.synthetic_note,
    currentState: caseRow.initial_state,
    targetPhase: caseRow.target_phase,
    evidencePacket: {
      stagedClues: caseRow.staged_clues || [],
      lateralProbes: caseRow.lateral_probes || [],
      teaches: caseRow.teaches || []
    },
    confidence: {
      beforeLateralProbe: caseRow.case_id === "SYN-ERP-001" ? 0.24 : 0.62,
      afterLateralProbe: caseRow.final_state.includes("exception") ? 0.48 : 0.86,
      ambiguity: caseRow.final_state.includes("exception") ? "requires operator route choice" : "bounded"
    },
    operatorGate: gate
      ? {
          role: "operator",
          question: gate.question,
          reason: gate.reason,
          consumedApproval: false
        }
      : null,
    expectedPostState: caseRow.final_state,
    irreversibleBoundary: Boolean(gate),
    stopRule: gate ? "stop at operator gate" : "continue only after surface recovery"
  };
}

function enrichFiscalCase(caseRow) {
  const packet = makeFiscalPacket(caseRow);
  const timeline = [
    {
      state: caseRow.initial_state,
      label: "Intent",
      detail: caseRow.scenario,
      confidence: packet.confidence.beforeLateralProbe
    },
    ...caseRow.lateral_probes.map((probe, index) => ({
      state: index === caseRow.lateral_probes.length - 1 ? "probe_closed" : "probing",
      label: `Probe ${index + 1}`,
      detail: probe,
      confidence: Math.min(0.92, packet.confidence.beforeLateralProbe + (index + 1) * 0.1)
    })),
    {
      state: caseRow.final_state,
      label: packet.operatorGate ? "Operator Gate" : "Recovered Evidence",
      detail: packet.operatorGate?.question || "Surface recovered and evidence retrieval can continue.",
      confidence: packet.confidence.afterLateralProbe
    }
  ];

  return {
    ...caseRow,
    synthetic_note: caseRow.synthetic_note,
    surface: caseSurface(caseRow),
    decisionPacket: packet,
    timeline,
    exportName: `${caseRow.case_id.toLowerCase()}-decision-packet.json`
  };
}

const priorityRoles = (await readJsonl(sources.priorityRoles, "priority_roles_top50")).map(safeRole);
const projectQueue = (await readJsonl(sources.projectQueue, "publishable_project_queue")).slice(0, 8).map(safeProject);
const topologyRows = await readJsonl(sources.topologyMatrix, "posting_lens_matrix");
const seedPrimitives = await readJsonl(sources.seedPrimitives, "demo_seed_primitives");
const fiscalCases = (await readJsonl(sources.fiscalCases, "demo2_synthetic_cases")).map(enrichFiscalCase);
const forms = Object.fromEntries(priorityRoles.slice(0, 20).map((role) => {
  const form = makeForm(role);
  return [role.postingId, form];
}));
const packets = Object.fromEntries(priorityRoles.map((role) => {
  const form = forms[role.postingId] || makeForm(role);
  return [role.postingId, makeApplicationPacket(role, form)];
}));

const generated = sanitizeValue({
  generatedAt: new Date().toISOString(),
  sourcePolicy: "Derived public-safe job metadata plus synthetic fiscal and support cases only. No private client data or live external submissions.",
  topology: {
    postingCount: topologyRows.length,
    roleArchetypes: topCounts(topologyRows, "canonical_role_archetype", 10),
    workflowArchetypes: topCounts(topologyRows, "primary_workflow_archetype", 10),
    averages: {
      priorityScoreTop50: Number(byNumericField(priorityRoles, "priorityScore").toFixed(1)),
      fitScoreTop50: Number(byNumericField(priorityRoles, "fitScore").toFixed(1)),
      proofFitTop50: Number(byNumericField(priorityRoles, "proofFitScore").toFixed(1)),
      aiNativeTop50: Number(byNumericField(priorityRoles, "aiNativeScore").toFixed(1))
    }
  },
  priorityRoles,
  projectQueue,
  seedPrimitives,
  simulatedForms: forms,
  applicationPackets: packets,
  fiscalCases
});

await mkdir(path.join(projectRoot, "src"), { recursive: true });
await writeFile(
  path.join(projectRoot, "src/generated-data.js"),
  `// Generated by scripts/generate-fixtures.mjs. Do not edit manually.\nexport const GENERATED = ${JSON.stringify(generated, null, 2)};\n`,
  "utf8"
);

console.log(`Generated ${priorityRoles.length} roles, ${projectQueue.length} project proofs, ${fiscalCases.length} fiscal cases.`);

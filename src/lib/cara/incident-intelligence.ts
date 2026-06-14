// ══════════════════════════════════════════════════════════════════════════════
// Cara INTELLIGENCE — INCIDENT REVIEW PIPELINE
//
// Full intelligence pipeline triggered after an incident is recorded.
// Runs in sequence:
//   1. Post-save intelligence (golden thread + child voice detection)
//   2. Pattern-based signal generation (missing, contact triggers)
//   3. AI-powered incident review (evidence-backed analysis)
//
// Returns a unified response with all intelligence outputs.
// All AI outputs are drafts requiring human review.
// ══════════════════════════════════════════════════════════════════════════════

import { z } from "zod";
import { runPostSaveIntelligence } from "./post-save-intelligence";
import { generateRiskSignals } from "./signals";
import { runCaraIntelligence } from "./engine";
import type { CaraOutput } from "./types";
import { detectUnsafeOutput } from "./guardrails";
import { hasIntelligencePermission } from "./intelligence-permissions";

// ── Input schema ─────────────────────────────────────────────────────────────

export const IncidentIntelligenceInputSchema = z.object({
  actorUserId: z.string().min(1),
  actorRole: z.string().min(1),
  incidentId: z.string().min(1),
  incidentType: z.string().min(1),
  severity: z.enum(["low", "medium", "high", "critical"]),
  description: z.string().min(1),
  immediateAction: z.string().optional().default(""),
  childId: z.string().min(1),
  homeId: z.string().min(1),
  organisationId: z.string().optional(),
  reasoningMode: z.enum([
    "incident_review",
    "pattern_analysis",
    "safeguarding_check",
    "therapeutic_lens",
    "management_oversight",
  ]).default("incident_review"),
  previousIncidentSummaries: z.array(z.string()).default([]),
  suggestionIds: z.array(z.string()).default([]),
});

export type IncidentIntelligenceInput = z.infer<typeof IncidentIntelligenceInputSchema>;

// ── Output types ─────────────────────────────────────────────────────────────

export type IncidentIntelligenceResult = {
  incidentId: string;
  childId: string;
  homeId: string;

  // Post-save intelligence results
  goldenThread: {
    created: boolean;
    childVoiceDetected: boolean;
    childVoiceWarning?: string;
  };

  // Pattern signals
  signals: {
    generated: number;
    patterns: PatternSignal[];
  };

  // AI incident review (if AI is enabled)
  caraReview: {
    enabled: boolean;
    aiRunId: string | null;
    output: CaraOutput | null;
    error?: string;
  };

  // Deterministic alerts (no AI needed)
  deterministicAlerts: DeterministicAlert[];

  // Suggested next actions (deterministic + AI combined)
  nextActions: NextAction[];

  // Safety flags
  safetyFlags: string[];

  // Metadata
  reasoningMode: string;
  processedAt: string;
};

type PatternSignal = {
  type: string;
  riskLevel: string;
  title: string;
  summary: string;
  suggestedAction: string;
};

type DeterministicAlert = {
  severity: "critical" | "high" | "medium" | "info";
  category: string;
  message: string;
  regulatoryRef?: string;
};

type NextAction = {
  title: string;
  ownerRole: string;
  priority: "immediate" | "today" | "this_week" | "this_month";
  rationale: string;
  source: "deterministic" | "pattern" | "cara";
};

// ── Deterministic alert rules ────────────────────────────────────────────────
// These run without AI. Pure conditional logic.

function computeDeterministicAlerts(input: IncidentIntelligenceInput): DeterministicAlert[] {
  const alerts: DeterministicAlert[] = [];
  const type = input.incidentType.toLowerCase();
  const desc = input.description.toLowerCase();
  const severity = input.severity;

  // Missing from care — always requires return interview + strategy discussion
  if (type.includes("missing")) {
    alerts.push({
      severity: "high",
      category: "missing_from_care",
      message: "Missing from care incident requires a return home interview within 72 hours and consideration of a strategy discussion.",
      regulatoryRef: "Reg 34 — Children who go missing",
    });

    if (severity === "high" || severity === "critical") {
      alerts.push({
        severity: "critical",
        category: "missing_high_risk",
        message: "High-severity missing episode. Police notification, placing authority notification and Ofsted notification may be required under Reg 40.",
        regulatoryRef: "Reg 40 — Notification of significant events",
      });
    }
  }

  // Restraint / physical intervention
  if (type.includes("restraint") || type.includes("physical intervention")) {
    alerts.push({
      severity: "high",
      category: "restraint",
      message: "Physical intervention requires a written record within 24 hours, debrief with the child, body map if appropriate, and notification to the placing authority.",
      regulatoryRef: "Reg 35 — Behaviour management",
    });
  }

  // Safeguarding / allegation
  if (type.includes("safeguarding") || type.includes("allegation") || type.includes("disclosure")) {
    alerts.push({
      severity: "critical",
      category: "safeguarding",
      message: "Safeguarding concern requires immediate referral consideration, LADO notification if staff-related, and placing authority notification.",
      regulatoryRef: "Reg 34, KCSIE 2023",
    });
  }

  // Self-harm / mental health
  if (desc.includes("self-harm") || desc.includes("self harm") || desc.includes("suicid")) {
    alerts.push({
      severity: "critical",
      category: "self_harm",
      message: "Self-harm or suicide-related incident. Immediate safety assessment, GP/CAMHS referral review, updated risk assessment and enhanced monitoring required.",
    });
  }

  // Family contact pattern — check previous incidents
  const contactPattern = input.previousIncidentSummaries.filter((s) =>
    s.toLowerCase().includes("contact") || s.toLowerCase().includes("family")
  );
  if (contactPattern.length >= 2 && desc.includes("contact")) {
    alerts.push({
      severity: "medium",
      category: "contact_pattern",
      message: `Pattern detected: ${contactPattern.length + 1} incidents linked to family contact. Review emotional preparation, contact plan and therapeutic support.`,
    });
  }

  // Sleep disruption pattern
  const sleepPattern = input.previousIncidentSummaries.filter((s) =>
    s.toLowerCase().includes("sleep")
  );
  if (sleepPattern.length > 0) {
    alerts.push({
      severity: "medium",
      category: "sleep_pattern",
      message: "Sleep disruption noted in connected records. Consider whether this is an early-warning indicator and update the care plan accordingly.",
    });
  }

  // Management oversight check for high/critical
  if (severity === "high" || severity === "critical") {
    alerts.push({
      severity: "high",
      category: "management_oversight",
      message: "High or critical incident requires registered manager oversight, written analysis and follow-up actions within 24 hours.",
      regulatoryRef: "Reg 13 — Leadership and management",
    });
  }

  return alerts;
}

// ── Deterministic next actions ───────────────────────────────────────────────

function computeNextActions(
  input: IncidentIntelligenceInput,
  alerts: DeterministicAlert[],
): NextAction[] {
  const actions: NextAction[] = [];
  const type = input.incidentType.toLowerCase();

  // Always: manager review
  if (input.severity === "high" || input.severity === "critical") {
    actions.push({
      title: "Registered Manager to review and add oversight commentary",
      ownerRole: "Registered Manager",
      priority: "today",
      rationale: `${input.severity}-severity incident requires management oversight within 24 hours.`,
      source: "deterministic",
    });
  }

  // Missing: return interview
  if (type.includes("missing")) {
    actions.push({
      title: "Complete return home interview",
      ownerRole: "Senior / Key Worker",
      priority: "today",
      rationale: "Statutory requirement within 72 hours of return. Independent interviewer preferred.",
      source: "deterministic",
    });

    actions.push({
      title: "Update missing-from-care risk assessment",
      ownerRole: "Key Worker",
      priority: "this_week",
      rationale: "Risk assessment should reflect the latest missing episode and any emerging patterns.",
      source: "deterministic",
    });
  }

  // Contact pattern
  if (alerts.some((a) => a.category === "contact_pattern")) {
    actions.push({
      title: "Review contact plan and emotional preparation strategy",
      ownerRole: "Key Worker",
      priority: "this_week",
      rationale: "Repeated incidents after family contact suggest the current contact plan may need adjustment.",
      source: "pattern",
    });

    actions.push({
      title: "Consider key work session focused on feelings about contact",
      ownerRole: "Key Worker",
      priority: "this_week",
      rationale: "The child may benefit from therapeutic support around contact — behaviour as communication.",
      source: "pattern",
    });
  }

  // Sleep pattern
  if (alerts.some((a) => a.category === "sleep_pattern")) {
    actions.push({
      title: "Review sleep plan and discuss with the child",
      ownerRole: "Key Worker",
      priority: "this_week",
      rationale: "Sleep disruption can be an early indicator of emotional distress. Worth exploring in key work.",
      source: "pattern",
    });
  }

  // Notify placing authority for high/critical
  if (input.severity === "high" || input.severity === "critical") {
    actions.push({
      title: "Notify placing authority of significant event",
      ownerRole: "Registered Manager",
      priority: "today",
      rationale: "Reg 40 requires notification of significant events without delay.",
      source: "deterministic",
    });
  }

  return actions;
}

// ── Main pipeline ────────────────────────────────────────────────────────────

export async function runIncidentIntelligence(
  rawInput: unknown,
): Promise<IncidentIntelligenceResult> {
  const input = IncidentIntelligenceInputSchema.parse(rawInput);

  // Permission check
  if (!hasIntelligencePermission(input.actorRole, "askCara")) {
    throw new Error(`Role "${input.actorRole}" does not have permission to run incident intelligence.`);
  }

  // ── Step 1: Deterministic alerts (no AI, instant) ──────────────────────
  const deterministicAlerts = computeDeterministicAlerts(input);
  const safetyFlags = detectUnsafeOutput(input.description);

  // ── Step 2: Deterministic next actions ─────────────────────────────────
  const nextActions = computeNextActions(input, deterministicAlerts);

  // ── Step 3: Post-save intelligence (golden thread + child voice) ───────
  const fullSummary = [
    input.description,
    input.immediateAction ? `Immediate action: ${input.immediateAction}` : "",
    ...input.previousIncidentSummaries.map((s, i) => `Previous incident ${i + 1}: ${s}`),
  ]
    .filter(Boolean)
    .join("\n");

  let goldenThread = {
    created: false,
    childVoiceDetected: false,
    childVoiceWarning: undefined as string | undefined,
  };

  try {
    const postSave = await runPostSaveIntelligence({
      homeId: input.homeId,
      childId: input.childId,
      sourceTable: "incidents",
      sourceId: input.incidentId,
      title: `${input.incidentType} — ${input.severity}`,
      summary: fullSummary,
      eventType: input.incidentType,
      createdBy: input.actorUserId,
    });
    goldenThread = {
      created: postSave.goldenThreadCreated,
      childVoiceDetected: postSave.childVoiceDetected,
      childVoiceWarning: postSave.childVoiceWarning,
    };
  } catch {
    // Golden thread failure should not block the pipeline
    goldenThread.created = false;
  }

  // ── Step 4: Pattern signals ────────────────────────────────────────────
  let signalsCreated = 0;
  const patterns: PatternSignal[] = [];

  try {
    const signalResult = await generateRiskSignals({
      homeId: input.homeId,
      childId: input.childId,
    });
    signalsCreated = signalResult.created;
  } catch {
    // Signal failure should not block the pipeline
  }

  // Add local pattern signals from the input data
  if (input.previousIncidentSummaries.length >= 2) {
    const missingPrev = input.previousIncidentSummaries.filter((s) =>
      s.toLowerCase().includes("missing")
    );
    const contactPrev = input.previousIncidentSummaries.filter((s) =>
      s.toLowerCase().includes("contact") || s.toLowerCase().includes("family")
    );

    if (missingPrev.length >= 1 && input.incidentType.toLowerCase().includes("missing")) {
      patterns.push({
        type: "safeguarding_theme",
        riskLevel: missingPrev.length >= 3 ? "high" : "medium",
        title: "Repeated missing-from-care pattern",
        summary: `${missingPrev.length + 1} missing-related incidents including the current one. This is an escalating pattern that requires strategic review.`,
        suggestedAction: "Review missing-from-care protocol, triggers, return interview themes, and whether the placement plan captures the pattern.",
      });
    }

    if (contactPrev.length >= 1) {
      patterns.push({
        type: "therapeutic_opportunity",
        riskLevel: "medium",
        title: "Family contact linked to incident pattern",
        summary: `${contactPrev.length} previous incidents occurred around family contact. The current incident also follows contact.`,
        suggestedAction: "Review emotional preparation before and after contact. Consider whether key work can explore the child's feelings about contact safely.",
      });
    }
  }

  // ── Step 5: Cara AI review (if enabled) ────────────────────────────────
  let caraReview: IncidentIntelligenceResult["caraReview"] = {
    enabled: false,
    aiRunId: null,
    output: null,
  };

  const aiEnabled = (process.env.CARA_AI_ENABLED ?? process.env.CARA_AI_ENABLED) === "true";

  if (aiEnabled) {
    try {
      const question = buildIncidentReviewQuestion(input);

      const result = await runCaraIntelligence(
        {
          homeId: input.homeId,
          childId: input.childId,
          roleMode: mapRoleToCaraMode(input.actorRole),
          featureKey: `incident_review_${input.reasoningMode}`,
          userQuestion: question,
          strictEvidenceMode: true,
          includeTherapeuticLens: input.reasoningMode === "therapeutic_lens" || input.reasoningMode === "incident_review",
          includeOfstedLens: true,
          includeStaffDevelopmentLens: input.reasoningMode === "management_oversight",
        },
        input.actorUserId,
      );

      caraReview = {
        enabled: true,
        aiRunId: result.aiRunId,
        output: result.output,
      };

      // Merge AI next actions into our list
      if (result.output.nextBestActions.length) {
        for (const action of result.output.nextBestActions) {
          nextActions.push({
            title: action.title,
            ownerRole: action.ownerRole,
            priority: mapDuePriority(action.duePriority),
            rationale: action.rationale,
            source: "cara",
          });
        }
      }
    } catch (err) {
      caraReview = {
        enabled: true,
        aiRunId: null,
        output: null,
        error: err instanceof Error ? err.message : "Cara review failed.",
      };
    }
  }

  return {
    incidentId: input.incidentId,
    childId: input.childId,
    homeId: input.homeId,
    goldenThread,
    signals: {
      generated: signalsCreated + patterns.length,
      patterns,
    },
    caraReview,
    deterministicAlerts,
    nextActions,
    safetyFlags,
    reasoningMode: input.reasoningMode,
    processedAt: new Date().toISOString(),
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildIncidentReviewQuestion(input: IncidentIntelligenceInput): string {
  const parts = [
    `Review this ${input.incidentType} incident (severity: ${input.severity}).`,
    "",
    `Description: ${input.description}`,
  ];

  if (input.immediateAction) {
    parts.push(`Immediate action taken: ${input.immediateAction}`);
  }

  if (input.previousIncidentSummaries.length) {
    parts.push("");
    parts.push("Previous connected incidents:");
    for (const [i, summary] of input.previousIncidentSummaries.entries()) {
      parts.push(`  ${i + 1}. ${summary}`);
    }
  }

  parts.push("");

  switch (input.reasoningMode) {
    case "pattern_analysis":
      parts.push("Focus: Identify patterns across these incidents. What themes emerge? What do the patterns suggest about triggers, needs, or risks?");
      break;
    case "safeguarding_check":
      parts.push("Focus: Assess safeguarding implications. Are there concerns that require referral, LADO involvement, or strategy discussion? What regulatory requirements apply?");
      break;
    case "therapeutic_lens":
      parts.push("Focus: Apply a therapeutic lens. What might the behaviour be communicating? What emotional needs might be unmet? What intervention could help?");
      break;
    case "management_oversight":
      parts.push("Focus: Provide management oversight analysis. What should the registered manager consider? What follow-up is needed? Are there systemic issues?");
      break;
    default:
      parts.push("Provide a full incident review covering patterns, safeguarding, therapeutic considerations, and recommended next actions.");
  }

  return parts.join("\n");
}

function mapRoleToCaraMode(role: string): "practitioner" | "senior" | "deputy_manager" | "registered_manager" | "responsible_individual" | "operations" | "director" | "commissioner" | "ofsted_mock" {
  const mapping: Record<string, string> = {
    rsw: "practitioner",
    senior: "senior",
    deputy_manager: "deputy_manager",
    registered_manager: "registered_manager",
    ri: "responsible_individual",
    operations: "operations",
    director: "director",
    commissioner: "commissioner",
  };
  return (mapping[role] ?? "practitioner") as ReturnType<typeof mapRoleToCaraMode>;
}

function mapDuePriority(duePriority: string): "immediate" | "today" | "this_week" | "this_month" {
  if (duePriority === "today") return "today";
  if (duePriority === "this_week") return "this_week";
  if (duePriority === "this_month") return "this_month";
  return "this_week";
}

// ── Testing exports ──────────────────────────────────────────────────────────

export const _testing = {
  computeDeterministicAlerts,
  computeNextActions,
  buildIncidentReviewQuestion,
  mapRoleToCaraMode,
};

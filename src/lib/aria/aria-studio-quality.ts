// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — QUALITY CHECK ENGINE
// Runs 14 checks before commit is allowed. Each check can be overridden
// with a recorded reason. Audit trail captures every check result.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type { AriaArtifact, AriaQualityCheck } from "@/types/aria-studio";

interface QualityCheckResult {
  check: Omit<AriaQualityCheck, "id" | "created_at">;
  issues: string[];
}

export function runQualityCheck(artifact: AriaArtifact): AriaQualityCheck {
  const result = evaluateArtifact(artifact);

  // Persist the check
  const check = db.ariaQualityChecks.create(result.check);

  // Update artifact with quality score and pass/fail
  const score = calculateScore(result.check);
  db.ariaArtifacts.patch(artifact.id, {
    quality_score: score,
    quality_checks_passed: result.check.overall_passed,
  });

  // Write audit log
  db.ariaStudioAuditLog.create({
    home_id: artifact.home_id,
    actor_id: "system_quality_check",
    action_type: "quality_check_completed",
    artifact_id: artifact.id,
    source_ids: artifact.source_ids,
    prompt_summary: result.check.overall_passed
      ? `Quality check passed (score: ${score}/100)`
      : `Quality check failed (score: ${score}/100) — ${result.issues.join(", ")}`,
    model_provider: null,
    model_name: null,
    before_state: null,
    after_state: { overall_passed: result.check.overall_passed, score },
    ip_address: null,
  });

  return check;
}

function evaluateArtifact(artifact: AriaArtifact): QualityCheckResult {
  const content = artifact.generated_content.toLowerCase();
  const issues: string[] = [];

  // Check 1: Evidence cited
  const evidence_cited = content.includes("evidence") ||
    content.includes("record") ||
    content.includes("log") ||
    artifact.source_ids.length > 0;
  if (!evidence_cited) issues.push("No evidence cited in the content");

  // Check 2: Child voice considered
  const child_voice_considered = content.includes("child") ||
    content.includes("young person") ||
    content.includes("said") ||
    content.includes("expressed") ||
    artifact.child_voice_present;
  if (!child_voice_considered && artifact.child_id) {
    issues.push("Child voice not clearly referenced");
  }

  // Check 3: Risk considered
  const risk_considered = content.includes("risk") ||
    content.includes("safe") ||
    content.includes("concern") ||
    ["risk_review", "safeguarding_review", "management_oversight"].includes(artifact.artifact_type);
  if (!risk_considered) issues.push("Risk not discussed — consider whether risk considerations apply");

  // Check 4: Safeguarding considered
  const safeguarding_considered = content.includes("safeguard") ||
    content.includes("welfare") ||
    artifact.safeguarding_level !== "none";
  if (!safeguarding_considered && ["safeguarding_review", "risk_review"].includes(artifact.artifact_type)) {
    issues.push("Safeguarding considerations not clearly addressed");
  }

  // Check 5: Regulation considered (for statutory types)
  const statutoryTypes = ["reg45_summary", "annex_a_update", "management_oversight", "safeguarding_review", "ofsted_readiness_summary"];
  const regulation_considered = !statutoryTypes.includes(artifact.artifact_type) ||
    content.includes("regulation") ||
    content.includes("reg 45") ||
    content.includes("annex a") ||
    artifact.regulation_relevance.length > 0;
  if (!regulation_considered) issues.push("Regulatory relevance not addressed for a statutory document type");

  // Check 6: Actions are clear
  const actions_clear = content.includes("action") ||
    content.includes("next step") ||
    content.includes("required") ||
    content.includes("follow-up");
  if (!actions_clear) issues.push("No clear actions identified");

  // Check 7: Owner assigned (for action-oriented types)
  const actionTypes = ["management_oversight", "risk_review", "safeguarding_review", "incident_learning_review"];
  const owner_assigned = !actionTypes.includes(artifact.artifact_type) ||
    content.includes("assigned to") ||
    content.includes("action:") ||
    content.includes("responsible");
  if (!owner_assigned) issues.push("Actions do not appear to have owners assigned");

  // Check 8: Review date set (for plans and reviews)
  const reviewTypes = ["risk_review", "care_plan_update", "placement_plan_update", "reg45_summary"];
  const review_date_set = !reviewTypes.includes(artifact.artifact_type) ||
    content.includes("review date") ||
    content.includes("next review") ||
    content.includes("due:");
  if (!review_date_set) issues.push("Review date not specified");

  // Check 9: Human approval complete
  const human_approval_complete = artifact.approved_by !== null || artifact.status === "approved" || artifact.status === "committed";
  if (!human_approval_complete) issues.push("Human approval not completed");

  // Check 10: Sensitive language reviewed
  const sensitive_language_reviewed = !content.includes("obviously") &&
    !content.includes("clearly") &&
    !content.includes("it is clear that") &&
    !content.includes("definitely");
  if (!sensitive_language_reviewed) issues.push("Potentially overconfident language detected — review wording");

  // Check 11: No unsupported claims
  const unsupportedPatterns = ["we know that", "it is well established", "always", "never has"];
  const no_unsupported_claims = !unsupportedPatterns.some((p) => content.includes(p));
  if (!no_unsupported_claims) issues.push("Potentially unsupported absolute claims detected — review wording");

  // Check 12: No AI-style filler
  const aiFiller = [
    "in the realm of",
    "it is worth noting",
    "it should be noted that",
    "as an ai",
    "as a language model",
    "certainly!",
    "of course!",
    "absolutely!",
  ];
  const no_ai_style_filler = !aiFiller.some((p) => content.includes(p));
  if (!no_ai_style_filler) issues.push("AI-style filler language detected — revise to professional wording");

  // Check 13: Dignity language passed
  const dignityIssues = [
    "the child is a problem",
    "disruptive child",
    "naughty",
    "attention-seeking behaviour",
    "manipulative",
  ];
  const dignity_language_passed = !dignityIssues.some((p) => content.includes(p));
  if (!dignity_language_passed) issues.push("Language that may undermine child's dignity detected — revise wording");

  // Check 14: Draft watermark present (or approved)
  const hasWatermark = content.includes("draft") || content.includes("aria-generated") ||
    artifact.status === "approved" || artifact.status === "committed";
  // This is checked but doesn't block overall_passed

  // Overall pass: core checks must pass
  const criticalFailed = !evidence_cited ||
    !human_approval_complete ||
    !no_ai_style_filler ||
    !dignity_language_passed ||
    !no_unsupported_claims;

  const overall_passed = !criticalFailed && issues.length === 0;

  return {
    check: {
      artifact_id: artifact.id,
      evidence_cited,
      child_voice_considered,
      risk_considered,
      safeguarding_considered,
      regulation_considered,
      actions_clear,
      owner_assigned,
      review_date_set,
      human_approval_complete,
      sensitive_language_reviewed,
      no_unsupported_claims,
      no_ai_style_filler,
      dignity_language_passed,
      overall_passed,
      issues,
    },
    issues,
  };
}

function calculateScore(check: Omit<AriaQualityCheck, "id" | "created_at">): number {
  const booleanChecks = [
    check.evidence_cited,
    check.child_voice_considered,
    check.risk_considered,
    check.safeguarding_considered,
    check.regulation_considered,
    check.actions_clear,
    check.owner_assigned,
    check.review_date_set,
    check.human_approval_complete,
    check.sensitive_language_reviewed,
    check.no_unsupported_claims,
    check.no_ai_style_filler,
    check.dignity_language_passed,
  ];

  const passed = booleanChecks.filter(Boolean).length;
  return Math.round((passed / booleanChecks.length) * 100);
}

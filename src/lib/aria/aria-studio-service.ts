// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — CORE GENERATION SERVICE
// Builds prompts, calls the provider, persists artifact, writes audit log.
// ARIA drafts. Humans decide. Nothing is committed without approval.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type {
  AriaGenerationRequest, AriaGenerationResult, AriaArtifact,
  AriaStructuredContent, AriaArtifactType, AriaFramework, AriaTone,
} from "@/types/aria-studio";
import { generateAriaStudioContent, getAriaStudioProviderConfig } from "./aria-studio-provider";
import { buildArtifactPrompt } from "./aria-studio-generators";
import { gatherSourcesForRequest } from "./aria-studio-sources";
import { detectGapsForRequest } from "./aria-studio-gaps";
import { fileCommittedArtifact } from "./aria-filing-cabinet";
import { ARIA_PROFESSIONAL_IDENTITY_PROMPT } from "./writingStyleRules";

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(framework: AriaFramework, tone: AriaTone): string {
  return `${ARIA_PROFESSIONAL_IDENTITY_PROMPT}

You are generating content for a children's home using the ${framework === "none" ? "no specific" : framework.toUpperCase()} framework with a ${tone} tone.

CRITICAL RULES:
- You are a drafting tool only. Humans make all final decisions.
- Never fabricate specific facts, dates, names, or events.
- Always mark inferences or suggestions clearly.
- If there is insufficient evidence, say so explicitly rather than guessing.
- Include a clear watermark note that this is an AI-generated draft.
- Safeguarding is paramount — flag concerns, never downplay them.
- Use plain, professional language appropriate to a children's residential home.
- Structure output in clear sections with Markdown headings.
- Always end with: "This is an ARIA-generated draft. A human must review and approve before use."`;
}

// ── Main generation entry point ───────────────────────────────────────────────

export async function generateArtifact(
  request: AriaGenerationRequest
): Promise<AriaGenerationResult> {
  const config = getAriaStudioProviderConfig();

  // 1. Gather sources
  const sources = await gatherSourcesForRequest(request);

  // 2. Detect gaps
  const gaps = await detectGapsForRequest(request);

  // 3. Build prompt
  const sourceContext = sources
    .map((s) => `[${s.source_type.toUpperCase()} — ${s.source_date}] ${s.title}: ${s.content.slice(0, 500)}`)
    .join("\n\n");

  const userPrompt = buildArtifactPrompt({
    artifactType: request.artifact_type,
    title: request.title,
    childId: request.child_id,
    homeId: request.home_id,
    framework: request.framework,
    tone: request.tone,
    creativeMode: request.creative_mode,
    additionalContext: request.additional_context,
    sourceContext,
  });

  // 4. Call AI provider
  const result = await generateAriaStudioContent({
    artifactType: request.artifact_type,
    title: request.title,
    framework: request.framework,
    tone: request.tone,
    creativeMode: request.creative_mode,
    systemPrompt: buildSystemPrompt(request.framework, request.tone),
    userPrompt,
  }, config);

  // 5. Build structured content wrapper
  const structuredContent: AriaStructuredContent = {
    sections: [
      {
        id: "main",
        title: request.title,
        content: result.content,
        confidence: sources.length > 0 ? "medium" : "low",
        requires_human_review: true,
        is_ai_generated: true,
      },
    ],
    known_evidence: sources.length > 0
      ? sources.map((s) => `${s.source_type}: ${s.title}`).join("; ")
      : "No indexed sources — content is based on general practice principles only.",
    analysis: "",
    professional_hypothesis: "",
    suggested_actions: [],
    human_review_required: [
      "All content must be reviewed by a qualified professional before use",
      "Evidence citations must be verified against original records",
      "Safeguarding considerations must be confirmed by manager",
    ],
    framework_used: request.framework,
    framework_rationale: `Output generated using ${request.framework === "none" ? "no specific" : request.framework.toUpperCase()} framework`,
    child_voice_notes: null,
    safeguarding_considerations: null,
    regulation_mapping: detectRegulationRelevance(request.artifact_type),
    confidence_overall: sources.length >= 3 ? "medium" : sources.length > 0 ? "low" : "unverified",
    confidence_rationale: sources.length >= 3
      ? `${sources.length} indexed sources used`
      : sources.length > 0
        ? `Only ${sources.length} source(s) available — confidence limited`
        : "No indexed sources — based on general practice guidance only",
    generated_at: new Date().toISOString(),
    model_used: result.model,
    is_stub: result.isStub,
  };

  // 6. Persist artifact as draft
  const filingPath = buildFilingPath(request);
  const artifact = db.ariaArtifacts.create({
    artifact_type: request.artifact_type,
    title: request.title,
    status: "draft",
    child_id: request.child_id,
    home_id: request.home_id,
    staff_id: request.staff_id,
    incident_id: request.incident_id,
    linked_record_id: request.linked_record_id,
    linked_record_type: request.linked_record_type,
    framework: request.framework,
    tone: request.tone,
    creative_mode: request.creative_mode,
    generated_content: result.content,
    structured_content: structuredContent,
    plain_text_content: result.content.replace(/#+\s/g, "").replace(/\*\*/g, ""),
    quality_score: null,
    evidence_confidence_score: sources.length >= 3 ? 65 : sources.length > 0 ? 40 : 20,
    safeguarding_level: detectSafeguardingLevel(request.artifact_type, result.content),
    regulation_relevance: Object.keys(structuredContent.regulation_mapping),
    source_ids: sources.map((s) => s.id),
    created_by: request.requested_by,
    reviewed_by: null,
    approved_by: null,
    committed_by: null,
    rejected_by: null,
    submitted_for_review_at: null,
    reviewed_at: null,
    approved_at: null,
    committed_at: null,
    rejected_at: null,
    archived_at: null,
    version_number: 1,
    filing_cabinet_path: filingPath,
    official_record_id: null,
    child_voice_present: result.content.toLowerCase().includes("child voice") || result.content.toLowerCase().includes("said"),
    quality_checks_passed: false,
    amendment_reason: null,
  });

  // 7. Persist initial version snapshot
  db.ariaArtifactVersions.create({
    artifact_id: artifact.id,
    version_number: 1,
    title: artifact.title,
    content: result.content,
    structured_content: structuredContent,
    change_summary: "Initial AI generation",
    changed_by: request.requested_by,
    changed_at: new Date().toISOString(),
    previous_version_id: null,
  });

  // 8. Write audit log
  db.ariaStudioAuditLog.create({
    home_id: request.home_id,
    actor_id: request.requested_by,
    action_type: "artifact_generated",
    artifact_id: artifact.id,
    source_ids: sources.map((s) => s.id),
    prompt_summary: `Generated ${request.artifact_type} for ${request.child_id ?? "home"} using ${request.framework}`,
    model_provider: result.provider,
    model_name: result.model,
    before_state: null,
    after_state: { status: "draft", id: artifact.id },
    ip_address: null,
  });

  // 9. Persist gaps
  const persistedGaps = gaps.map((gap) => db.ariaGaps.create({
    home_id: request.home_id,
    child_id: gap.child_id,
    staff_id: null,
    gap_type: gap.gap_type,
    severity: gap.severity,
    title: gap.title,
    description: gap.description,
    recommended_action: gap.recommended_action,
    linked_record_id: null,
    linked_record_type: null,
    status: "open",
    assigned_to: null,
    due_date: null,
    resolved_at: null,
  }));

  return {
    artifact,
    sources_used: sources,
    gaps_detected: persistedGaps,
    model_used: result.model,
    is_stub: result.isStub,
  };
}

// ── Artifact approval / workflow state machine ────────────────────────────────

export function submitArtifactForReview(
  artifactId: string,
  actorId: string
): AriaArtifact | null {
  const artifact = db.ariaArtifacts.findById(artifactId);
  if (!artifact) return null;
  if (artifact.status !== "draft" && artifact.status !== "changes_requested") return null;

  const updated = db.ariaArtifacts.patch(artifactId, {
    status: "in_review",
    submitted_for_review_at: new Date().toISOString(),
  });

  db.ariaStudioAuditLog.create({
    home_id: artifact.home_id,
    actor_id: actorId,
    action_type: "artifact_submitted",
    artifact_id: artifactId,
    source_ids: artifact.source_ids,
    prompt_summary: null,
    model_provider: null,
    model_name: null,
    before_state: { status: artifact.status },
    after_state: { status: "in_review" },
    ip_address: null,
  });

  return updated;
}

export function approveArtifact(
  artifactId: string,
  actorId: string,
  comment?: string
): AriaArtifact | null {
  const artifact = db.ariaArtifacts.findById(artifactId);
  if (!artifact) return null;
  if (artifact.status !== "in_review") return null;

  const now = new Date().toISOString();
  const updated = db.ariaArtifacts.patch(artifactId, {
    status: "approved",
    approved_by: actorId,
    approved_at: now,
    reviewed_at: now,
    reviewed_by: actorId,
  });

  db.ariaArtifactReviews.create({
    artifact_id: artifactId,
    reviewer_id: actorId,
    review_status: "approved",
    review_comment: comment ?? null,
    requested_changes: null,
  });

  db.ariaStudioAuditLog.create({
    home_id: artifact.home_id,
    actor_id: actorId,
    action_type: "artifact_approved",
    artifact_id: artifactId,
    source_ids: artifact.source_ids,
    prompt_summary: comment ?? null,
    model_provider: null,
    model_name: null,
    before_state: { status: artifact.status },
    after_state: { status: "approved" },
    ip_address: null,
  });

  return updated;
}

export function requestChanges(
  artifactId: string,
  actorId: string,
  changes: string
): AriaArtifact | null {
  const artifact = db.ariaArtifacts.findById(artifactId);
  if (!artifact) return null;
  if (artifact.status !== "in_review") return null;

  const updated = db.ariaArtifacts.patch(artifactId, {
    status: "changes_requested",
    reviewed_by: actorId,
    reviewed_at: new Date().toISOString(),
  });

  db.ariaArtifactReviews.create({
    artifact_id: artifactId,
    reviewer_id: actorId,
    review_status: "changes_requested",
    review_comment: null,
    requested_changes: changes,
  });

  db.ariaStudioAuditLog.create({
    home_id: artifact.home_id,
    actor_id: actorId,
    action_type: "changes_requested",
    artifact_id: artifactId,
    source_ids: artifact.source_ids,
    prompt_summary: changes,
    model_provider: null,
    model_name: null,
    before_state: { status: artifact.status },
    after_state: { status: "changes_requested" },
    ip_address: null,
  });

  return updated;
}

export function rejectArtifact(
  artifactId: string,
  actorId: string,
  reason: string
): AriaArtifact | null {
  const artifact = db.ariaArtifacts.findById(artifactId);
  if (!artifact) return null;
  if (artifact.status !== "in_review") return null;

  const now = new Date().toISOString();
  const updated = db.ariaArtifacts.patch(artifactId, {
    status: "rejected",
    rejected_by: actorId,
    rejected_at: now,
    reviewed_by: actorId,
    reviewed_at: now,
  });

  db.ariaArtifactReviews.create({
    artifact_id: artifactId,
    reviewer_id: actorId,
    review_status: "rejected",
    review_comment: reason,
    requested_changes: null,
  });

  db.ariaStudioAuditLog.create({
    home_id: artifact.home_id,
    actor_id: actorId,
    action_type: "artifact_rejected",
    artifact_id: artifactId,
    source_ids: artifact.source_ids,
    prompt_summary: reason,
    model_provider: null,
    model_name: null,
    before_state: { status: artifact.status },
    after_state: { status: "rejected" },
    ip_address: null,
  });

  return updated;
}

export function commitArtifact(
  artifactId: string,
  actorId: string
): AriaArtifact | null {
  const artifact = db.ariaArtifacts.findById(artifactId);
  if (!artifact) return null;
  if (artifact.status !== "approved") return null;

  // Quality checks must pass before commit
  const latestQc = db.ariaQualityChecks.findLatestByArtifact(artifactId);
  if (latestQc && !latestQc.overall_passed) return null;

  const now = new Date().toISOString();
  const committed = db.ariaArtifacts.patch(artifactId, {
    status: "committed",
    committed_by: actorId,
    committed_at: now,
  });
  if (!committed) return null;

  // Push into the filing cabinet so the official record is searchable
  // and inspection-ready alongside every other care-event-derived document.
  const filingResult = fileCommittedArtifact(committed);

  // Persist the canonical filing path back onto the artifact and link the
  // filing cabinet item id as the official record id.
  const updated = db.ariaArtifacts.patch(artifactId, {
    filing_cabinet_path: filingResult.path || committed.filing_cabinet_path,
    official_record_id: filingResult.item?.id ?? committed.official_record_id,
  }) ?? committed;

  db.ariaStudioAuditLog.create({
    home_id: artifact.home_id,
    actor_id: actorId,
    action_type: "artifact_committed",
    artifact_id: artifactId,
    source_ids: artifact.source_ids,
    prompt_summary: filingResult.filed
      ? `Filed at ${filingResult.path}`
      : filingResult.reason ?? null,
    model_provider: null,
    model_name: null,
    before_state: { status: artifact.status },
    after_state: {
      status: "committed",
      filing_path: updated.filing_cabinet_path,
      filing_item_id: updated.official_record_id,
    },
    ip_address: null,
  });

  return updated;
}

export function editArtifact(
  artifactId: string,
  actorId: string,
  newContent: string,
  changeSummary: string
): AriaArtifact | null {
  const artifact = db.ariaArtifacts.findById(artifactId);
  if (!artifact) return null;
  if (artifact.status === "committed" || artifact.status === "archived") return null;

  const newVersion = artifact.version_number + 1;

  // Save version snapshot
  const prevVersions = db.ariaArtifactVersions.findByArtifact(artifactId);
  const prevVersion = prevVersions[0] ?? null;

  db.ariaArtifactVersions.create({
    artifact_id: artifactId,
    version_number: newVersion,
    title: artifact.title,
    content: newContent,
    structured_content: artifact.structured_content,
    change_summary: changeSummary,
    changed_by: actorId,
    changed_at: new Date().toISOString(),
    previous_version_id: prevVersion?.id ?? null,
  });

  const updated = db.ariaArtifacts.patch(artifactId, {
    generated_content: newContent,
    version_number: newVersion,
    quality_checks_passed: false, // Reset QC on edit
  });

  db.ariaStudioAuditLog.create({
    home_id: artifact.home_id,
    actor_id: actorId,
    action_type: "artifact_edited",
    artifact_id: artifactId,
    source_ids: artifact.source_ids,
    prompt_summary: changeSummary,
    model_provider: null,
    model_name: null,
    before_state: { version: artifact.version_number },
    after_state: { version: newVersion },
    ip_address: null,
  });

  return updated;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function detectRegulationRelevance(artifactType: AriaArtifactType): Record<string, string> {
  const mapping: Record<string, Record<string, string>> = {
    reg45_summary: { reg45: "Directly relevant — Regulation 45 quarterly review evidence" },
    annex_a_update: { annex_a: "Directly relevant — Annex A inspection readiness" },
    ofsted_readiness_summary: { annex_a: "Inspection readiness", reg45: "Reg 45 evidence" },
    management_oversight: { reg45: "Management oversight evidence for Regulation 45" },
    incident_learning_review: { reg40: "May require Regulation 40 notification", reg45: "Incident learning for Regulation 45" },
    safeguarding_review: { reg45: "Safeguarding evidence for Regulation 45", annex_a: "Annex A safeguarding section" },
    risk_review: { reg45: "Risk management evidence" },
    ri_briefing: { reg45: "RI oversight evidence", annex_a: "Annex A RI section" },
  };
  return mapping[artifactType] ?? {};
}

function detectSafeguardingLevel(
  artifactType: AriaArtifactType,
  content: string
): "none" | "low" | "medium" | "high" {
  const highTypes: AriaArtifactType[] = ["safeguarding_review", "risk_review", "incident_learning_review"];
  if (highTypes.includes(artifactType)) return "high";

  const lowerContent = content.toLowerCase();
  if (
    lowerContent.includes("exploitation") ||
    lowerContent.includes("cse") ||
    lowerContent.includes("abuse") ||
    lowerContent.includes("safeguarding concern")
  ) return "high";
  if (
    lowerContent.includes("missing") ||
    lowerContent.includes("risk") ||
    lowerContent.includes("safeguarding")
  ) return "medium";
  if (lowerContent.includes("concern") || lowerContent.includes("welfare")) return "low";

  return "none";
}

function buildFilingPath(request: AriaGenerationRequest): string {
  const year = new Date().getFullYear();
  const month = new Date().toLocaleString("en-GB", { month: "long" });
  const category = request.child_id ? `Children/${request.child_id}` : "Home";
  return `${category}/${year}/${month}/${request.artifact_type}`;
}

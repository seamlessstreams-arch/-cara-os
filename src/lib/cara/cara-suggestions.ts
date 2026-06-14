// ══════════════════════════════════════════════════════════════════════════════
// Cara V1 — SUGGESTION SERVICE
//
// The proactive intelligence layer. Given an incident, Cara generates a set
// of suggestions for the manager to review: oversight, risk reviews, plan
// reviews, safeguarding considerations, key work, staff debriefs, and
// notifications. Every suggestion requires human approval.
//
// Deterministic fallback runs when no AI provider is configured, producing
// realistic suggestions based on severity and incident type without calling
// an LLM. Mock mode still creates real suggestions, audit logs and queue items.
// ══════════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import {
  generateText,
  getCaraProviderConfig,
} from "@/lib/cara/cara-provider";
import {
  CARA_PROFESSIONAL_IDENTITY_PROMPT,
  CARA_WRITING_STYLE_PROMPT,
  applyCaraPostprocessor,
} from "@/lib/cara/writingStyleRules";
import { checkCaraAccess, type CaraActor } from "@/lib/cara/cara-permissions";
import type {
  CaraSuggestion,
  CaraSuggestionLink,
  CaraSuggestionType,
  CaraSuggestionRiskLevel,
  CaraSuggestionConfidence,
  CaraSuggestionStatus,
  CaraSuggestionAuditAction,
  CaraSuggestionAuditEntry,
  IncidentInput,
} from "@/lib/cara/cara-suggestions-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = SupabaseClient<any, "public", any>;
function loose(client: ReturnType<typeof createServerClient>): LooseSupabase {
  return client as unknown as LooseSupabase;
}

function uid(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Severity-driven suggestion templates ───────────────────────────────────

const SEVERITY_SUGGESTIONS: Record<string, CaraSuggestionType[]> = {
  critical: [
    "management_oversight", "risk_review", "safeguarding_review",
    "staff_debrief", "notification", "plan_review", "key_work", "handover_update",
  ],
  high: [
    "management_oversight", "risk_review", "safeguarding_review",
    "staff_debrief", "key_work", "notification",
  ],
  medium: [
    "management_oversight", "risk_review", "key_work", "behaviour_support_review",
  ],
  low: ["management_oversight", "key_work"],
};

interface SuggestionTemplate {
  title: string;
  summary: string;
  reason: string;
  suggestedAction: string;
  riskLevel: CaraSuggestionRiskLevel;
  confidenceLevel: CaraSuggestionConfidence;
  linkedRecordType?: string;
}

function templateFor(type: CaraSuggestionType, severity: string, incidentType: string): SuggestionTemplate {
  const sev = severity.toLowerCase();
  const isHighSeverity = sev === "critical" || sev === "high";

  const templates: Record<CaraSuggestionType, SuggestionTemplate> = {
    management_oversight: {
      title: `Management oversight required — ${incidentType} incident`,
      summary: "The Registered Manager should review the incident response, consider whether staff acted safely and proportionately, check the child's voice has been captured, and record oversight.",
      reason: "All incidents require management oversight. The Quality Standards and Regulation 40 require the Registered Manager to review and evidence their oversight of significant events.",
      suggestedAction: "Review the incident record, staff response, and child impact. Record management oversight with reflective commentary and next actions.",
      riskLevel: isHighSeverity ? "urgent" : "medium",
      confidenceLevel: "high",
      linkedRecordType: "management_oversight",
    },
    risk_review: {
      title: "Risk assessment review — incident may indicate changed risk",
      summary: "The incident may indicate that the child's risk profile has changed. The current risk assessment should be reviewed to ensure it reflects the child's present needs.",
      reason: "When an incident occurs that was not anticipated by the current risk assessment, or where the child's behaviour pattern has changed, the risk assessment should be reviewed.",
      suggestedAction: "Review the risk assessment. Consider whether triggers, risk level, and management strategies remain current and proportionate.",
      riskLevel: isHighSeverity ? "high" : "medium",
      confidenceLevel: isHighSeverity ? "high" : "medium",
      linkedRecordType: "risk_assessment",
    },
    safeguarding_review: {
      title: "Safeguarding review — consider whether threshold for escalation is met",
      summary: "The manager should consider whether this incident meets the threshold for safeguarding escalation, LADO consultation, or notification to the placing authority.",
      reason: "Any incident involving potential harm, staff conduct concerns, or a pattern of risk should be considered against the safeguarding threshold.",
      suggestedAction: "Review against the safeguarding threshold. Record the decision and rationale. If in doubt, consult the LADO.",
      riskLevel: isHighSeverity ? "high" : "medium",
      confidenceLevel: "medium",
      linkedRecordType: "safeguarding",
    },
    staff_debrief: {
      title: "Staff debrief recommended",
      summary: "Staff involved in this incident should be offered a structured debrief to reflect on practice, consider what went well, and identify learning.",
      reason: "Staff involved in incidents, particularly those involving emotional distress, physical intervention, or safeguarding concerns, benefit from supported reflection.",
      suggestedAction: "Arrange a debrief with staff involved. Explore what happened, what went well, what could be different, and whether additional support is needed.",
      riskLevel: "medium",
      confidenceLevel: "high",
      linkedRecordType: "staff_debrief",
    },
    notification: {
      title: "Notification consideration — professionals may need updating",
      summary: "Consider whether the social worker, placing authority, or other professionals should be notified of this incident.",
      reason: "Regulation 40 requires notification of significant events. Even where notification is not mandatory, keeping professionals informed strengthens multi-agency working.",
      suggestedAction: "Consider whether the social worker and placing authority should be updated. Record the decision and rationale.",
      riskLevel: isHighSeverity ? "high" : "medium",
      confidenceLevel: "high",
      linkedRecordType: "notification",
    },
    plan_review: {
      title: "Placement plan review — consider whether plan reflects current need",
      summary: "Following this incident, the placement plan should be reviewed to ensure it still reflects the child's current needs and that support arrangements remain appropriate.",
      reason: "When a child's presentation or circumstances change, the placement plan should be reviewed. Drift in care planning is a common finding at inspection.",
      suggestedAction: "Review the placement plan. Check whether objectives, support, and timescales remain current.",
      riskLevel: isHighSeverity ? "high" : "medium",
      confidenceLevel: "medium",
      linkedRecordType: "placement_plan",
    },
    behaviour_support_review: {
      title: "Behaviour support plan review — strategies may need updating",
      summary: "The child's recent behaviour may not be fully reflected in the current behaviour support plan. Strategies and triggers should be reviewed.",
      reason: "When a child's behaviour pattern changes, the behaviour support plan should be reviewed to ensure strategies remain appropriate and trauma-informed.",
      suggestedAction: "Review the behaviour support plan. Check whether triggers, de-escalation strategies, and support approaches remain current.",
      riskLevel: "medium",
      confidenceLevel: "medium",
      linkedRecordType: "behaviour_support_plan",
    },
    key_work: {
      title: "Key work session — capture child's wishes and feelings",
      summary: "A key work session should be offered to the child to explore how they are feeling and what they need following this incident.",
      reason: "The child's voice should be visible in the records following any incident. Key work provides a safe space to capture wishes and feelings.",
      suggestedAction: "Arrange a key work session. Focus on the child's experience, feelings, and what they need. Record the child's voice in their own words where possible.",
      riskLevel: "medium",
      confidenceLevel: "high",
      linkedRecordType: "key_work",
    },
    handover_update: {
      title: "Handover update — next shift needs to be aware",
      summary: "The incoming shift team should be briefed on this incident, the child's current presentation, and any actions required.",
      reason: "Effective handover is essential for continuity of care. Staff need to know what has happened and what is expected of them.",
      suggestedAction: "Update the handover with incident details, child's current presentation, and any immediate actions for the next shift.",
      riskLevel: isHighSeverity ? "high" : "low",
      confidenceLevel: "high",
    },
    task: {
      title: "Follow-up task required",
      summary: "A task should be created to track follow-up actions from this incident.",
      reason: "Actions identified during incident review should be tracked to completion.",
      suggestedAction: "Create a task with clear owner, due date, and description.",
      riskLevel: "medium",
      confidenceLevel: "medium",
    },
    linked_record_review: {
      title: "Related records may need review",
      summary: "This incident may affect other records held for the child.",
      reason: "Changes in a child's circumstances or risk profile may affect multiple records.",
      suggestedAction: "Review related records to ensure they remain current.",
      riskLevel: "medium",
      confidenceLevel: "medium",
    },
    incident_analysis: {
      title: "Incident pattern analysis",
      summary: "This incident should be considered alongside previous incidents to identify patterns.",
      reason: "Pattern recognition across incidents is a key management responsibility.",
      suggestedAction: "Review recent incidents for patterns in behaviour, triggers, timing, or staff involvement.",
      riskLevel: "medium",
      confidenceLevel: "medium",
    },
  };

  return templates[type];
}

// ─── Generate incident suggestions (deterministic fallback) ─────────────────

export async function generateIncidentSuggestions(
  input: IncidentInput,
): Promise<{ suggestions: Omit<CaraSuggestion, "id" | "createdAt" | "updatedAt">[]; mockMode: boolean }> {
  const providerConfig = getCaraProviderConfig();
  const severity = input.severity.toLowerCase();
  const types = SEVERITY_SUGGESTIONS[severity] ?? SEVERITY_SUGGESTIONS.medium;

  const suggestions: Omit<CaraSuggestion, "id" | "createdAt" | "updatedAt">[] = [];

  for (const type of types) {
    const template = templateFor(type, severity, input.incidentType);

    const linkedRecords: Omit<CaraSuggestionLink, "id" | "suggestionId" | "createdAt">[] = [];
    if (template.linkedRecordType) {
      linkedRecords.push({
        linkedRecordType: template.linkedRecordType as CaraSuggestionLink["linkedRecordType"],
        reason: template.reason,
        suggestedAction: template.suggestedAction,
        riskLevel: template.riskLevel,
        requiresApproval: true,
      });
    }

    suggestions.push({
      organisationId: input.organisationId,
      homeId: input.homeId,
      childId: input.childId,
      staffId: input.staffId,
      relatedRecordType: "incident",
      relatedRecordId: input.incidentId,
      suggestionType: type,
      title: template.title,
      summary: template.summary,
      reason: template.reason,
      suggestedAction: template.suggestedAction,
      riskLevel: template.riskLevel,
      confidenceLevel: template.confidenceLevel,
      status: "awaiting_review",
      requiresApproval: true,
      reviewerRole: "registered_manager",
      aiProvider: providerConfig.configured ? providerConfig.providerId : undefined,
      mockMode: !providerConfig.configured,
      linkedRecords: linkedRecords as CaraSuggestionLink[],
    });
  }

  return { suggestions, mockMode: !providerConfig.configured };
}

// ─── Generate management oversight draft ────────────────────────────────────

export async function generateManagementOversightDraft(
  input: IncidentInput & { existingSuggestions?: CaraSuggestion[] },
): Promise<{ draftText: string; mockMode: boolean; llmUsed: boolean }> {
  const providerConfig = getCaraProviderConfig();

  if (providerConfig.configured) {
    const systemPrompt = [
      "You are Cara, the intelligent professional assistant built into Cara, the operating system for UK residential children's homes.",
      "",
      CARA_PROFESSIONAL_IDENTITY_PROMPT,
      "",
      "You are drafting a management oversight comment for an incident. The Registered Manager will review, edit and approve this draft before it is saved.",
      "",
      "The draft must cover:",
      "- What was reviewed",
      "- What happened (factual summary)",
      "- Impact on the child",
      "- Staff response — whether staff acted safely and appropriately",
      "- Whether existing plans were followed",
      "- Whether safeguarding concerns are present",
      "- Whether risk has changed",
      "- Whether the risk assessment requires review",
      "- Whether the placement plan requires review",
      "- Whether behaviour support guidance requires review",
      "- Whether key work is needed",
      "- Whether staff debrief is required",
      "- Whether professionals or placing authority need updating",
      "- Management decision (leave blank for the manager to complete)",
      "- Next actions",
      "- Review timeframe",
      "",
      "Label the output: Cara suggested draft — requires manager review before saving.",
      "",
      CARA_WRITING_STYLE_PROMPT,
    ].join("\n");

    const userPrompt = [
      `INCIDENT TYPE: ${input.incidentType}`,
      `SEVERITY: ${input.severity}`,
      input.childId ? `CHILD REFERENCE: ${input.childId}` : "",
      "",
      "INCIDENT DESCRIPTION:",
      input.description,
      input.immediateAction ? `\nIMMEDIATE ACTION TAKEN:\n${input.immediateAction}` : "",
    ].filter(Boolean).join("\n");

    const result = await generateText({ systemPrompt, userPrompt, expectJson: false });
    if (result.llmUsed) {
      return {
        draftText: applyCaraPostprocessor(result.text),
        mockMode: false,
        llmUsed: true,
      };
    }
  }

  const draft = buildDeterministicOversightDraft(input);
  return { draftText: draft, mockMode: true, llmUsed: false };
}

function buildDeterministicOversightDraft(input: IncidentInput): string {
  const isHighSeverity = input.severity === "critical" || input.severity === "high";

  return applyCaraPostprocessor(`Cara suggested draft — requires manager review before saving.

What was reviewed:
The incident record dated today involving ${input.incidentType}${input.childId ? ` concerning ${input.childId}` : ""}. The description, immediate action, and staff response have been considered.

What happened:
${input.description}

${input.immediateAction ? `Immediate action taken:\n${input.immediateAction}\n` : ""}Impact on the child:
[The manager should record the observed impact on the child, including their emotional state, any distress, and how they were supported afterwards. The child's voice should be captured — what did the child say, feel, or express?]

Staff response:
[The manager should comment on whether staff acted safely, proportionately, and in line with the home's policies and the child's plans. Were de-escalation strategies attempted? Was the response trauma-informed?]

Were existing plans followed:
[The manager should check the risk assessment, behaviour support plan, and placement plan. Were the strategies in those plans followed? If not, why not? If the plans did not anticipate this situation, they may need updating.]

Safeguarding considerations:
${isHighSeverity
    ? "Given the severity of this incident, the manager should explicitly consider whether the safeguarding threshold has been met. If there is any doubt, LADO consultation is recommended. The decision and rationale should be recorded."
    : "The manager should confirm whether any safeguarding considerations arise from this incident and record their reasoning."}

Has risk changed:
[The manager should consider whether this incident indicates a change in the child's risk profile. If the risk assessment does not reflect the child's current presentation, it should be reviewed.]

Management decision:
[To be completed by the Registered Manager]

Next actions:
- ${isHighSeverity ? "Consider whether safeguarding escalation is required" : "Review whether any plan updates are needed"}
- Key work session with the child to capture wishes and feelings
- ${isHighSeverity ? "Staff debrief to reflect on practice and learning" : "Consider whether staff debrief would be beneficial"}
- Review risk assessment if the child's presentation has changed
- ${isHighSeverity ? "Consider notification to social worker and placing authority" : "Consider whether professionals should be updated"}
- Record oversight with clear rationale

Review timeframe:
${isHighSeverity ? "Review within 24 hours to confirm all actions have been progressed." : "Review within 48 hours to confirm actions have been progressed."}`);
}

// ─── Persistence ────────────────────────────────────────────────────────────

export async function persistSuggestions(
  suggestions: Omit<CaraSuggestion, "id" | "createdAt" | "updatedAt">[],
  actor: CaraActor,
): Promise<CaraSuggestion[]> {
  if (!isSupabaseEnabled()) return [];
  const supabaseRaw = createServerClient();
  if (!supabaseRaw) return [];
  const supabase = loose(supabaseRaw);

  const saved: CaraSuggestion[] = [];

  for (const s of suggestions) {
    const id = `as_${uid()}`;
    const { error } = await supabase.from("aria_suggestions").insert({
      id,
      organisation_id: s.organisationId ?? null,
      home_id: s.homeId ?? null,
      child_id: s.childId ?? null,
      staff_id: s.staffId ?? null,
      related_record_type: s.relatedRecordType,
      related_record_id: s.relatedRecordId ?? null,
      suggestion_type: s.suggestionType,
      title: s.title,
      summary: s.summary ?? null,
      reason: s.reason ?? null,
      suggested_action: s.suggestedAction ?? null,
      draft_text: s.draftText ?? null,
      final_text: null,
      risk_level: s.riskLevel,
      confidence_level: s.confidenceLevel,
      status: s.status,
      requires_approval: s.requiresApproval,
      reviewer_role: s.reviewerRole ?? null,
      created_by: actor.userId,
      ai_provider: s.aiProvider ?? null,
      mock_mode: s.mockMode,
    });
    if (error) continue;

    if (s.linkedRecords && s.linkedRecords.length > 0) {
      for (const lr of s.linkedRecords) {
        await supabase.from("aria_suggestion_links").insert({
          id: `asl_${uid()}`,
          suggestion_id: id,
          linked_record_type: lr.linkedRecordType,
          linked_record_id: lr.linkedRecordId ?? null,
          relationship_type: lr.relationshipType ?? null,
          reason: lr.reason ?? null,
          suggested_action: lr.suggestedAction ?? null,
          risk_level: lr.riskLevel ?? null,
          requires_approval: lr.requiresApproval,
        });
      }
    }

    await writeAuditEntry({
      suggestionId: id,
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: "suggestion_created",
      metadata: { suggestionType: s.suggestionType, riskLevel: s.riskLevel, mockMode: s.mockMode },
      homeId: s.homeId,
      organisationId: s.organisationId,
    });

    saved.push({ ...s, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as CaraSuggestion);
  }

  return saved;
}

// ─── Queries ────────────────────────────────────────────────────────────────

export interface SuggestionFilters {
  status?: CaraSuggestionStatus;
  relatedRecordType?: string;
  relatedRecordId?: string;
  childId?: string;
  homeId?: string;
  riskLevel?: CaraSuggestionRiskLevel;
}

export async function getSuggestions(filters: SuggestionFilters): Promise<CaraSuggestion[]> {
  if (!isSupabaseEnabled()) return [];
  const supabaseRaw = createServerClient();
  if (!supabaseRaw) return [];
  const supabase = loose(supabaseRaw);

  let query = supabase.from("aria_suggestions").select("*");
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.relatedRecordType) query = query.eq("related_record_type", filters.relatedRecordType);
  if (filters.relatedRecordId) query = query.eq("related_record_id", filters.relatedRecordId);
  if (filters.childId) query = query.eq("child_id", filters.childId);
  if (filters.homeId) query = query.eq("home_id", filters.homeId);
  if (filters.riskLevel) query = query.eq("risk_level", filters.riskLevel);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error || !data) return [];

  return data.map(rowToSuggestion);
}

export async function getSuggestionById(id: string, actor: CaraActor): Promise<CaraSuggestion | null> {
  if (!isSupabaseEnabled()) return null;
  const supabaseRaw = createServerClient();
  if (!supabaseRaw) return null;
  const supabase = loose(supabaseRaw);

  const { data, error } = await supabase
    .from("aria_suggestions")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;

  const { data: links } = await supabase
    .from("aria_suggestion_links")
    .select("*")
    .eq("suggestion_id", id);

  await writeAuditEntry({
    suggestionId: id,
    actorUserId: actor.userId,
    actorRole: actor.role,
    action: "suggestion_viewed",
    homeId: data.home_id,
    organisationId: data.organisation_id,
  });

  const suggestion = rowToSuggestion(data);
  suggestion.linkedRecords = (links ?? []).map(rowToLink);
  return suggestion;
}

// ─── Approval workflow ──────────────────────────────────────────────────────

export async function approveSuggestion(
  id: string,
  actor: CaraActor,
  finalText?: string,
): Promise<CaraSuggestion | null> {
  if (!isSupabaseEnabled()) return null;
  const supabaseRaw = createServerClient();
  if (!supabaseRaw) return null;
  const supabase = loose(supabaseRaw);

  const { data: existing } = await supabase.from("aria_suggestions").select("draft_text").eq("id", id).single();
  const isAmended = finalText && existing && finalText !== existing.draft_text;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("aria_suggestions")
    .update({
      status: isAmended ? "amended_and_approved" : "approved",
      final_text: finalText ?? existing?.draft_text ?? null,
      approved_by: actor.userId,
      approved_at: now,
      reviewed_by: actor.userId,
      reviewed_at: now,
    })
    .eq("id", id)
    .select()
    .single();
  if (error || !data) return null;

  await writeAuditEntry({
    suggestionId: id,
    actorUserId: actor.userId,
    actorRole: actor.role,
    action: "suggestion_approved",
    afterState: { status: data.status },
    metadata: { amended: isAmended },
  });

  return rowToSuggestion(data);
}

export async function rejectSuggestion(
  id: string,
  actor: CaraActor,
  reason: string,
): Promise<CaraSuggestion | null> {
  if (!reason.trim()) return null;
  if (!isSupabaseEnabled()) return null;
  const supabaseRaw = createServerClient();
  if (!supabaseRaw) return null;
  const supabase = loose(supabaseRaw);

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("aria_suggestions")
    .update({
      status: "rejected",
      rejection_reason: reason,
      rejected_by: actor.userId,
      rejected_at: now,
      reviewed_by: actor.userId,
      reviewed_at: now,
    })
    .eq("id", id)
    .select()
    .single();
  if (error || !data) return null;

  await writeAuditEntry({
    suggestionId: id,
    actorUserId: actor.userId,
    actorRole: actor.role,
    action: "suggestion_rejected",
    afterState: { status: "rejected" },
    metadata: { reason },
  });

  return rowToSuggestion(data);
}

export async function markNoAction(
  id: string,
  actor: CaraActor,
): Promise<CaraSuggestion | null> {
  if (!isSupabaseEnabled()) return null;
  const supabaseRaw = createServerClient();
  if (!supabaseRaw) return null;
  const supabase = loose(supabaseRaw);

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("aria_suggestions")
    .update({
      status: "no_action_required",
      reviewed_by: actor.userId,
      reviewed_at: now,
    })
    .eq("id", id)
    .select()
    .single();
  if (error || !data) return null;

  await writeAuditEntry({
    suggestionId: id,
    actorUserId: actor.userId,
    actorRole: actor.role,
    action: "suggestion_no_action",
    afterState: { status: "no_action_required" },
  });

  return rowToSuggestion(data);
}

export async function commitSuggestion(
  id: string,
  actor: CaraActor,
  committedRecordType?: string,
  committedRecordId?: string,
): Promise<CaraSuggestion | null> {
  if (!isSupabaseEnabled()) return null;
  const supabaseRaw = createServerClient();
  if (!supabaseRaw) return null;
  const supabase = loose(supabaseRaw);

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("aria_suggestions")
    .update({
      status: "committed",
      committed_by: actor.userId,
      committed_at: now,
    })
    .eq("id", id)
    .select()
    .single();
  if (error || !data) return null;

  await writeAuditEntry({
    suggestionId: id,
    actorUserId: actor.userId,
    actorRole: actor.role,
    action: "suggestion_committed",
    afterState: { status: "committed" },
    metadata: { committedRecordType, committedRecordId },
  });

  return rowToSuggestion(data);
}

// ─── Audit ──────────────────────────────────────────────────────────────────

export async function getAuditTimeline(suggestionId: string): Promise<CaraSuggestionAuditEntry[]> {
  if (!isSupabaseEnabled()) return [];
  const supabaseRaw = createServerClient();
  if (!supabaseRaw) return [];
  const supabase = loose(supabaseRaw);

  const { data, error } = await supabase
    .from("aria_suggestion_audit")
    .select("*")
    .eq("suggestion_id", suggestionId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data.map(rowToAudit);
}

interface WriteAuditArgs {
  suggestionId?: string;
  actorUserId: string;
  actorRole: string;
  action: CaraSuggestionAuditAction;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  homeId?: string;
  organisationId?: string;
}

export async function writeAuditEntry(args: WriteAuditArgs): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const supabaseRaw = createServerClient();
  if (!supabaseRaw) return;
  const supabase = loose(supabaseRaw);

  await supabase.from("aria_suggestion_audit").insert({
    id: `asa_${uid()}`,
    organisation_id: args.organisationId ?? null,
    home_id: args.homeId ?? null,
    suggestion_id: args.suggestionId ?? null,
    actor_user_id: args.actorUserId,
    actor_role: args.actorRole,
    action: args.action,
    before_state: args.beforeState ?? null,
    after_state: args.afterState ?? null,
    metadata: args.metadata ?? null,
  });
}

// ─── Row mappers ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSuggestion(row: any): CaraSuggestion {
  return {
    id: row.id,
    organisationId: row.organisation_id ?? undefined,
    homeId: row.home_id ?? undefined,
    childId: row.child_id ?? undefined,
    staffId: row.staff_id ?? undefined,
    relatedRecordType: row.related_record_type,
    relatedRecordId: row.related_record_id ?? undefined,
    suggestionType: row.suggestion_type,
    title: row.title,
    summary: row.summary ?? undefined,
    reason: row.reason ?? undefined,
    suggestedAction: row.suggested_action ?? undefined,
    draftText: row.draft_text ?? undefined,
    finalText: row.final_text ?? undefined,
    riskLevel: row.risk_level,
    confidenceLevel: row.confidence_level,
    status: row.status,
    requiresApproval: row.requires_approval,
    reviewerRole: row.reviewer_role ?? undefined,
    createdBy: row.created_by ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    approvedBy: row.approved_by ?? undefined,
    rejectedBy: row.rejected_by ?? undefined,
    committedBy: row.committed_by ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    aiProvider: row.ai_provider ?? undefined,
    mockMode: row.mock_mode ?? false,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    rejectedAt: row.rejected_at ?? undefined,
    committedAt: row.committed_at ?? undefined,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToLink(row: any): CaraSuggestionLink {
  return {
    id: row.id,
    suggestionId: row.suggestion_id,
    linkedRecordType: row.linked_record_type,
    linkedRecordId: row.linked_record_id ?? undefined,
    relationshipType: row.relationship_type ?? undefined,
    reason: row.reason ?? undefined,
    suggestedAction: row.suggested_action ?? undefined,
    riskLevel: row.risk_level ?? undefined,
    requiresApproval: row.requires_approval ?? true,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAudit(row: any): CaraSuggestionAuditEntry {
  return {
    id: row.id,
    organisationId: row.organisation_id ?? undefined,
    homeId: row.home_id ?? undefined,
    suggestionId: row.suggestion_id ?? undefined,
    actorUserId: row.actor_user_id ?? undefined,
    actorRole: row.actor_role ?? undefined,
    action: row.action,
    beforeState: row.before_state ?? undefined,
    afterState: row.after_state ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
  };
}

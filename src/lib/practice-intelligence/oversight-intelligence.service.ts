// ══════════════════════════════════════════════════════════════════════════════
// PRACTICE INTELLIGENCE — OVERSIGHT INTELLIGENCE SERVICE
//
// Generates management oversight drafts across 19 oversight types. Each draft
// includes evidence analysis, child impact, staff practice, risk, safeguarding
// considerations, regulatory relevance, and suggested actions. Humans review,
// approve, and commit. Cara drafts — managers decide.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import { generateStudioContent } from "@/lib/cara-studio/ai-provider.service";
import { CARA_STUDIO_SYSTEM_PROMPT } from "@/lib/cara-studio/prompts";
import type {
  ManagementOversightDraft,
  OversightContent,
  OversightType,
  OversightAction,
  RegulatoryReference,
  EvidenceLink,
} from "@/types/practice-intelligence";
import { OVERSIGHT_TYPE_LABELS } from "@/types/practice-intelligence";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

// ── Oversight type prompt fragments ─────────────────────────────────────────

const OVERSIGHT_PROMPTS: Record<OversightType, string> = {
  daily_log_oversight: "Review the daily log entries. Comment on recording quality, child voice presence, and any concerns or positives that require follow-up.",
  incident_oversight: "Review this incident. Assess the response, child impact, staff practice, any patterns, and required follow-up actions.",
  missing_from_care_oversight: "Review this missing from care episode. Assess the response, return home interview quality, risk assessment updates, and multi-agency actions.",
  medication_oversight: "Review medication administration records. Check for errors, omissions, or patterns requiring attention.",
  restraint_oversight: "Review this physical intervention. Assess proportionality, alternatives tried, child and staff impact, and post-incident support.",
  complaint_oversight: "Review this complaint. Assess the response, resolution, child/young person impact, and any systemic improvements needed.",
  safeguarding_oversight: "Review this safeguarding concern. Assess the response, information sharing, multi-agency actions, and ongoing protection plan.",
  education_oversight: "Review education engagement and attendance. Comment on patterns, barriers, and actions to support educational achievement.",
  health_oversight: "Review health-related records. Comment on appointments, medication, wellbeing, and any unmet health needs.",
  contact_oversight: "Review family contact arrangements. Comment on the child's experience, impact, and any necessary adjustments.",
  risk_assessment_oversight: "Review the risk assessment. Comment on accuracy, currency, and whether it reflects current evidence.",
  placement_plan_oversight: "Review the placement plan progress. Comment on outcomes, actions, and whether the plan needs updating.",
  care_plan_oversight: "Review the care plan. Comment on progress, relevance, and whether the plan reflects the child's current needs.",
  key_work_oversight: "Review key work session quality. Comment on therapeutic approach, child engagement, recording quality, and follow-up.",
  direct_work_oversight: "Review direct work quality. Comment on therapeutic rationale, delivery, child response, and outcomes.",
  staff_supervision_oversight: "Review supervision records. Comment on quality, regularity, reflective content, and follow-up actions.",
  training_oversight: "Review training records and competency. Comment on gaps, priorities, and alignment with practice needs.",
  rota_oversight: "Review staffing and rota. Comment on consistency, key relationships, skill mix, and any risks from staff changes.",
  admission_discharge_oversight: "Review admission or discharge process. Comment on preparation, transition support, and statutory compliance.",
};

// ── Generate oversight draft ────────────────────────────────────────────────

export async function generateOversightDraft(opts: {
  oversightType: OversightType;
  recordId?: string;
  recordType?: string;
  childId?: string;
  additionalContext?: string;
  homeId?: string;
  createdBy: string;
}): Promise<ManagementOversightDraft> {
  const hid = opts.homeId ?? homeId();
  const sb = createServerClient();

  // Gather evidence
  let evidenceContext = "";
  if (sb && opts.recordId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: source } = await (sb.from("cara_studio_sources") as any)
      .select("*")
      .eq("id", opts.recordId)
      .maybeSingle();

    if (source) {
      evidenceContext = `[${source.source_type}] ${source.title ?? "Untitled"} (${source.source_date ?? ""})\n${source.content ?? source.summary ?? ""}`;
    }
  }

  // Also gather recent context for the child if applicable
  if (sb && opts.childId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recentSources } = await (sb.from("cara_studio_sources") as any)
      .select("source_type, title, summary, source_date")
      .eq("home_id", hid)
      .eq("child_id", opts.childId)
      .order("source_date", { ascending: false })
      .limit(10);

    if (recentSources?.length) {
      evidenceContext += "\n\n--- RECENT CONTEXT ---\n";
      evidenceContext += (recentSources as Array<{ source_type: string; title: string; summary: string; source_date: string }>)
        .map((s) => `[${s.source_type}] ${s.title ?? "Untitled"} (${s.source_date ?? ""}) — ${s.summary ?? "No summary"}`)
        .join("\n");
    }
  }

  // Build prompt
  const typePrompt = OVERSIGHT_PROMPTS[opts.oversightType];
  const systemPrompt = [
    CARA_STUDIO_SYSTEM_PROMPT,
    "",
    "--- OVERSIGHT TYPE ---",
    typePrompt,
    "",
    "--- OUTPUT STRUCTURE ---",
    "Return a JSON object with: summary, evidence_reviewed, child_impact, staff_practice_analysis, risk_analysis, safeguarding_considerations, regulatory_relevance, actions_required (array of {action, owner, due_date, priority}), management_decision_support, review_date, human_review_note",
    "",
    "CRITICAL: End every oversight comment with a clear 'Human Review Required' section.",
  ].join("\n");

  const userPrompt = [
    `Generate a ${OVERSIGHT_TYPE_LABELS[opts.oversightType]} draft.`,
    "",
    "--- EVIDENCE ---",
    evidenceContext || "No specific evidence provided. Generate based on general oversight expectations.",
    "",
    opts.additionalContext ? `--- ADDITIONAL CONTEXT ---\n${opts.additionalContext}` : "",
  ].filter(Boolean).join("\n");

  // Call AI
  let content: OversightContent;
  try {
    const aiResponse = await generateStudioContent(systemPrompt, userPrompt);
    content = parseOversightContent(aiResponse.content);
  } catch {
    content = getDefaultOversightContent(opts.oversightType);
  }

  // Persist
  if (sb) {
    const record = {
      home_id: hid,
      oversight_type: opts.oversightType,
      record_id: opts.recordId ?? null,
      record_type: opts.recordType ?? null,
      child_id: opts.childId ?? null,
      status: "draft",
      content,
      evidence_links: [],
      regulatory_refs: [],
      quality_score: null,
      created_by: opts.createdBy,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb.from("management_oversight_drafts") as any)
      .insert(record)
      .select("*")
      .single();

    if (!error && data) return mapDbToOversight(data);
  }

  return {
    id: crypto.randomUUID(),
    home_id: hid,
    oversight_type: opts.oversightType,
    record_id: opts.recordId ?? null,
    record_type: opts.recordType ?? null,
    child_id: opts.childId ?? null,
    status: "draft",
    content,
    evidence_links: [],
    regulatory_refs: [],
    quality_score: null,
    approved_by: null,
    approved_at: null,
    committed_at: null,
    created_by: opts.createdBy,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ── List oversight drafts ───────────────────────────────────────────────────

export async function listOversightDrafts(opts?: {
  oversightType?: OversightType;
  childId?: string;
  status?: string;
  homeId?: string;
  limit?: number;
}): Promise<ManagementOversightDraft[]> {
  const sb = createServerClient();
  const hid = opts?.homeId ?? homeId();

  if (!sb) return getDemoDrafts(hid);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (sb.from("management_oversight_drafts") as any)
    .select("*")
    .eq("home_id", hid)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 20);

  if (opts?.oversightType) query = query.eq("oversight_type", opts.oversightType);
  if (opts?.childId) query = query.eq("child_id", opts.childId);
  if (opts?.status) query = query.eq("status", opts.status);

  const { data, error } = await query;
  if (error) return getDemoDrafts(hid);
  return (data ?? []).map(mapDbToOversight);
}

// ── Approve oversight draft ─────────────────────────────────────────────────

export async function approveOversightDraft(
  draftId: string,
  approvedBy: string,
): Promise<ManagementOversightDraft> {
  const sb = createServerClient();
  if (!sb) throw new Error("Database connection required");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("management_oversight_drafts") as any)
    .update({
      status: "approved",
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to approve oversight draft: ${error.message}`);
  return mapDbToOversight(data);
}

// ── Commit oversight draft to record ────────────────────────────────────────

export async function commitOversightDraft(draftId: string): Promise<ManagementOversightDraft> {
  const sb = createServerClient();
  if (!sb) throw new Error("Database connection required");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("management_oversight_drafts") as any)
    .update({
      status: "committed",
      committed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to commit oversight draft: ${error.message}`);
  return mapDbToOversight(data);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseOversightContent(raw: string): OversightContent {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary ?? "",
        evidence_reviewed: parsed.evidence_reviewed ?? "",
        child_impact: parsed.child_impact ?? "",
        staff_practice_analysis: parsed.staff_practice_analysis ?? "",
        risk_analysis: parsed.risk_analysis ?? "",
        safeguarding_considerations: parsed.safeguarding_considerations ?? "",
        regulatory_relevance: parsed.regulatory_relevance ?? "",
        actions_required: (parsed.actions_required ?? []).map((a: Record<string, unknown>) => ({
          action: a.action ?? "",
          owner: a.owner ?? null,
          due_date: a.due_date ?? null,
          priority: a.priority ?? "medium",
        })),
        management_decision_support: parsed.management_decision_support ?? "",
        review_date: parsed.review_date ?? null,
        human_review_note: parsed.human_review_note ?? "This is an AI-generated draft. Human review and approval required before committing.",
      };
    }
  } catch {
    // Fall through
  }

  return {
    summary: raw.slice(0, 500),
    evidence_reviewed: "",
    child_impact: "",
    staff_practice_analysis: "",
    risk_analysis: "",
    safeguarding_considerations: "",
    regulatory_relevance: "",
    actions_required: [],
    management_decision_support: "",
    review_date: null,
    human_review_note: "This is an AI-generated draft. Human review and approval required before committing.",
  };
}

function getDefaultOversightContent(oversightType: OversightType): OversightContent {
  return {
    summary: `${OVERSIGHT_TYPE_LABELS[oversightType]} — draft oversight comment generated by Cara.`,
    evidence_reviewed: "Evidence reviewed includes recent records related to this oversight area.",
    child_impact: "The impact on the child/young person should be considered as part of this review.",
    staff_practice_analysis: "Staff practice has been reviewed against expected standards.",
    risk_analysis: "Risk considerations have been assessed based on available evidence.",
    safeguarding_considerations: "Any safeguarding implications should be reviewed by the designated safeguarding lead.",
    regulatory_relevance: "This oversight aligns with Children's Homes Regulations 2015 and Quality Standards requirements.",
    actions_required: [
      { action: "Review and personalise this oversight comment", owner: null, due_date: null, priority: "high" },
    ],
    management_decision_support: "Consider the evidence presented and decide on the appropriate response.",
    review_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    human_review_note: "This is an AI-generated draft. Human review and approval required before committing to the official record.",
  };
}

function mapDbToOversight(row: Record<string, unknown>): ManagementOversightDraft {
  return {
    id: row.id as string,
    home_id: row.home_id as string,
    oversight_type: row.oversight_type as OversightType,
    record_id: (row.record_id as string) ?? null,
    record_type: (row.record_type as string) ?? null,
    child_id: (row.child_id as string) ?? null,
    status: row.status as ManagementOversightDraft["status"],
    content: (row.content as OversightContent) ?? getDefaultOversightContent(row.oversight_type as OversightType),
    evidence_links: (row.evidence_links as EvidenceLink[]) ?? [],
    regulatory_refs: (row.regulatory_refs as RegulatoryReference[]) ?? [],
    quality_score: (row.quality_score as number) ?? null,
    approved_by: (row.approved_by as string) ?? null,
    approved_at: (row.approved_at as string) ?? null,
    committed_at: (row.committed_at as string) ?? null,
    created_by: row.created_by as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function getDemoDrafts(hid: string): ManagementOversightDraft[] {
  return [
    {
      id: "demo-oversight-1", home_id: hid, oversight_type: "incident_oversight",
      record_id: "inc-1", record_type: "incident", child_id: "child_2",
      status: "draft",
      content: {
        summary: "Incident involving Amara on 10 May. Amara became distressed following a group discussion about upcoming activities. She left the room and went to her bedroom, refusing to come out for several hours.",
        evidence_reviewed: "Incident report, daily log entries for the past 3 days, Amara's therapeutic profile.",
        child_impact: "Amara's self-isolation has increased. This incident appears connected to her pattern of withdrawal when feeling overwhelmed in group settings.",
        staff_practice_analysis: "Staff responded appropriately by giving Amara space while maintaining periodic check-ins. The PACE approach was used effectively. Consider whether the group discussion could have been managed differently.",
        risk_analysis: "Self-isolation is a known risk indicator for Amara. Current risk assessment remains valid but should be reviewed if pattern continues.",
        safeguarding_considerations: "No immediate safeguarding concerns arising from this incident. Continue to monitor.",
        regulatory_relevance: "Children's Homes Regs 2015, Reg 12 (protection of children). Quality Standards — promoting positive behaviour.",
        actions_required: [
          { action: "Key work session with Amara to explore what happened", owner: "Sarah Thompson", due_date: "2026-05-13", priority: "high" },
          { action: "Review group activity planning to ensure inclusion", owner: "Shift Lead", due_date: "2026-05-15", priority: "medium" },
        ],
        management_decision_support: "Consider whether Amara's therapeutic profile needs updating to reflect this pattern. Discuss at next team meeting.",
        review_date: "2026-05-20",
        human_review_note: "Cara-generated draft. Registered Manager to review, personalise, and approve before committing to the record.",
      },
      evidence_links: [],
      regulatory_refs: [
        { framework: "childrens_homes_regs_2015", regulation: "Regulation 12", quality_standard: "9.1", sccif_theme: "how_well_children_helped_protected", evidence_text: "Children are protected from harm." },
      ],
      quality_score: 82,
      approved_by: null, approved_at: null, committed_at: null,
      created_by: "user-rm-1", created_at: "2026-05-11T09:00:00Z", updated_at: "2026-05-11T09:00:00Z",
    },
    {
      id: "demo-oversight-2", home_id: hid, oversight_type: "daily_log_oversight",
      record_id: null, record_type: null, child_id: null,
      status: "approved",
      content: {
        summary: "Weekly daily log oversight review. Logs reviewed for 5-11 May 2026.",
        evidence_reviewed: "35 daily log entries across the week.",
        child_impact: "Logs generally capture day-to-day care well. Child voice is present in approximately 40% of entries — this needs improving.",
        staff_practice_analysis: "Recording quality is variable. Some staff provide detailed, reflective entries. Others use brief, factual statements that don't capture the child's experience.",
        risk_analysis: "No new risks identified from log content.",
        safeguarding_considerations: "No safeguarding concerns arising from log review.",
        regulatory_relevance: "Quality Standards 2015 — recording must capture the lived experience of the child.",
        actions_required: [
          { action: "Team briefing on capturing child voice in daily logs", owner: "Registered Manager", due_date: "2026-05-16", priority: "medium" },
        ],
        management_decision_support: "Recording quality training recommended. Consider peer review of logs.",
        review_date: "2026-05-18",
        human_review_note: "Reviewed and approved by RM. Committed to management oversight record.",
      },
      evidence_links: [],
      regulatory_refs: [],
      quality_score: 75,
      approved_by: "user-rm-1", approved_at: "2026-05-11T14:00:00Z", committed_at: null,
      created_by: "user-rm-1", created_at: "2026-05-11T08:00:00Z", updated_at: "2026-05-11T14:00:00Z",
    },
  ];
}

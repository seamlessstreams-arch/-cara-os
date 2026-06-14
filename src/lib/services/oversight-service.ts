// ══════════════════════════════════════════════════════════════════════════════
// CARA — MANAGEMENT OVERSIGHT SERVICE
// Cara-prompted reflective oversight for all record types. Generates quality
// prompts, stores oversight notes, and links to tasks/evidence.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type {
  CsManagementOversightNote, OversightRecordType,
  ServiceResult,
} from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Cara prompt generation ──────────────────────────────────────────────────

export interface OversightPromptContext {
  recordType: OversightRecordType;
  recordSummary: string;
  childName?: string;
  childAge?: number;
  historicalContext?: string;
  regulationRefs?: string[];
}

/**
 * Generate Cara reflective prompts for management oversight.
 * These prompts guide managers through 5 quality dimensions.
 */
export function generateOversightPrompts(ctx: OversightPromptContext): {
  opening: string;
  dimensions: {
    dimension: string;
    prompt: string;
    guidance: string;
  }[];
  closing: string;
} {
  const RECORD_LABELS: Record<OversightRecordType, string> = {
    incident: "incident",
    safeguarding: "safeguarding concern",
    missing_episode: "missing from care episode",
    complaint: "complaint",
    daily_log: "daily log entry",
    medication_error: "medication error",
    restraint: "physical intervention / restraint",
    disclosure: "disclosure",
    risk_assessment: "risk assessment",
    care_plan_review: "care plan review",
    supervision: "supervision session",
    key_work_session: "key work session",
    contact_session: "contact / family time session",
  };

  const label = RECORD_LABELS[ctx.recordType] ?? ctx.recordType;
  const childRef = ctx.childName ? `${ctx.childName}${ctx.childAge ? ` (${ctx.childAge})` : ""}` : "the young person";

  return {
    opening: `You are providing management oversight for a ${label}. Consider the information provided and use the prompts below to structure your reflective analysis. Good oversight demonstrates professional curiosity, child-focus, and clear decision-making.`,

    dimensions: [
      {
        dimension: "Reflective Analysis",
        prompt: `What does this ${label} tell you about what is happening for ${childRef}? What hypotheses can you form? What don't you know yet?`,
        guidance: "Go beyond describing what happened. Analyse why it may have happened, what it means for the child, and what patterns or themes you observe. Show professional curiosity.",
      },
      {
        dimension: "Child Focus",
        prompt: `How has this ${label} been understood from ${childRef}'s perspective? How has their voice been captured? What might they be trying to communicate through their behaviour?`,
        guidance: "Centre the child's experience. Reference their history, developmental stage, and individual needs. Show that you understand the child behind the record.",
      },
      {
        dimension: "Professional Challenge",
        prompt: `Is the response proportionate and appropriate? Are there any aspects of practice you want to challenge, question, or commend? What would you expect to see next?`,
        guidance: "Demonstrate that you are holding practitioners accountable. Challenge poor practice respectfully. Recognise good practice specifically.",
      },
      {
        dimension: "Decision Clarity",
        prompt: `What decisions need to be made? Who needs to make them? What is the rationale for the decisions you are making in response to this ${label}?`,
        guidance: "Be explicit about your decision-making. Name the risks you've weighed. Record your rationale so it can be understood later if scrutinised.",
      },
      {
        dimension: "Action Specificity",
        prompt: `What specific actions arise from this ${label}? Who is responsible? What is the timescale? How will completion be evidenced?`,
        guidance: "Actions should be SMART — specific, measurable, achievable, relevant, and time-bound. Vague actions like 'monitor the situation' are insufficient.",
      },
    ],

    closing: `Remember: your oversight is a regulatory requirement and may be inspected by Ofsted. It should demonstrate that you are actively managing care, challenging practice, and keeping children safe. ${ctx.regulationRefs?.length ? `Relevant regulations: ${ctx.regulationRefs.join(", ")}.` : ""}`,
  };
}

// ── Oversight CRUD ──────────────────────────────────────────────────────────

export async function listOversightNotes(
  homeId: string,
  opts?: {
    recordType?: OversightRecordType;
    recordId?: string;
    oversightBy?: string;
    limit?: number;
  },
): Promise<ServiceResult<CsManagementOversightNote[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_management_oversight_notes") as SB).select("*").eq("home_id", homeId);
  if (opts?.recordType) q = q.eq("record_type", opts.recordType);
  if (opts?.recordId) q = q.eq("record_id", opts.recordId);
  if (opts?.oversightBy) q = q.eq("oversight_by", opts.oversightBy);
  q = q.order("oversight_at", { ascending: false }).limit(opts?.limit ?? 50);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getOversightNote(
  noteId: string,
): Promise<ServiceResult<CsManagementOversightNote>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_management_oversight_notes") as SB)
    .select("*")
    .eq("id", noteId)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createOversightNote(input: {
  homeId: string;
  recordType: OversightRecordType;
  recordId: string;
  recordReference?: string;
  oversightText: string;
  qualityScore?: number;
  qualityDimensions?: {
    reflectiveAnalysis: number;
    childFocus: number;
    professionalChallenge: number;
    decisionClarity: number;
    actionSpecificity: number;
  };
  caraPrompted?: boolean;
  caraPromptUsed?: string;
  caraSuggestions?: Record<string, unknown>;
  actionsIdentified?: string[];
  regulationRefs?: string[];
  oversightBy: string;
}): Promise<ServiceResult<CsManagementOversightNote>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_management_oversight_notes") as SB)
    .insert({
      home_id: input.homeId,
      record_type: input.recordType,
      record_id: input.recordId,
      record_reference: input.recordReference ?? null,
      oversight_text: input.oversightText,
      quality_score: input.qualityScore ?? null,
      quality_dimensions: input.qualityDimensions ?? null,
      aria_prompted: input.caraPrompted ?? false,
      aria_prompt_used: input.caraPromptUsed ?? null,
      aria_suggestions: input.caraSuggestions ?? null,
      actions_identified: input.actionsIdentified ?? [],
      regulation_refs: input.regulationRefs ?? [],
      oversight_by: input.oversightBy,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

/**
 * Get records that need management oversight (no oversight note exists).
 */
export async function getRecordsNeedingOversight(
  homeId: string,
  recordType: OversightRecordType,
): Promise<ServiceResult<{ record_id: string; record_reference: string }[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  // This would ideally be a database view or function
  // For now, we check oversight notes against the relevant record table
  const tableMap: Partial<Record<OversightRecordType, string>> = {
    incident: "incidents",
    safeguarding: "safeguarding_concerns",
    missing_episode: "missing_episodes",
    complaint: "complaints",
    supervision: "supervisions",
  };

  const table = tableMap[recordType];
  if (!table) return { ok: true, data: [] };

  // Get all records of this type
  const { data: records } = await (s.from(table) as SB)
    .select("id, reference")
    .eq("home_id", homeId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!records?.length) return { ok: true, data: [] };

  // Get existing oversight notes
  const { data: notes } = await (s.from("cs_management_oversight_notes") as SB)
    .select("record_id")
    .eq("home_id", homeId)
    .eq("record_type", recordType);

  const notedIds = new Set((notes ?? []).map((n: { record_id: string }) => n.record_id));

  const needsOversight = (records ?? [])
    .filter((r: { id: string }) => !notedIds.has(r.id))
    .map((r: { id: string; reference: string }) => ({
      record_id: r.id,
      record_reference: r.reference ?? r.id,
    }));

  return { ok: true, data: needsOversight };
}

/**
 * Get oversight completion stats for a home.
 */
export async function getOversightStats(
  homeId: string,
): Promise<ServiceResult<{
  total_notes: number;
  by_record_type: Record<string, number>;
  avg_quality_score: number | null;
  aria_prompted_percentage: number;
  records_needing_oversight: number;
}>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data: notes, error } = await (s.from("cs_management_oversight_notes") as SB)
    .select("record_type, quality_score, aria_prompted")
    .eq("home_id", homeId);

  if (error) return { ok: false, error: error.message };

  const allNotes = notes ?? [];
  const byType: Record<string, number> = {};
  let qualitySum = 0;
  let qualityCount = 0;
  let caraCount = 0;

  for (const n of allNotes) {
    byType[n.record_type] = (byType[n.record_type] ?? 0) + 1;
    if (n.quality_score != null) {
      qualitySum += n.quality_score;
      qualityCount++;
    }
    if (n.aria_prompted) caraCount++;
  }

  return {
    ok: true,
    data: {
      total_notes: allNotes.length,
      by_record_type: byType,
      avg_quality_score: qualityCount > 0 ? Math.round((qualitySum / qualityCount) * 10) / 10 : null,
      aria_prompted_percentage: allNotes.length > 0 ? Math.round((caraCount / allNotes.length) * 100) : 0,
      records_needing_oversight: 0, // would need to query each record type
    },
  };
}

// ── Regulation references for each record type ──────────────────────────────

export const OVERSIGHT_REGULATION_REFS: Record<OversightRecordType, string[]> = {
  incident:         ["CHR2015:Reg7", "CHR2015:Reg12", "SCCIF:SafeChildren"],
  safeguarding:     ["CHR2015:Reg7", "SCCIF:SafeChildren", "KCSIE:Part1"],
  missing_episode:  ["CHR2015:Reg14", "CHR2015:Reg7", "SCCIF:SafeChildren"],
  complaint:        ["CHR2015:Reg6", "SCCIF:OverallExperiences"],
  daily_log:        ["CHR2015:Reg5", "SCCIF:OverallExperiences"],
  medication_error: ["CHR2015:Reg10", "SCCIF:SafeChildren"],
  restraint:        ["CHR2015:Reg12", "SCCIF:SafeChildren"],
  disclosure:       ["CHR2015:Reg7", "SCCIF:SafeChildren"],
  risk_assessment:  ["CHR2015:Reg7", "CHR2015:Reg12"],
  care_plan_review: ["CHR2015:Reg5", "CHR2015:Reg9", "SCCIF:OverallExperiences"],
  supervision:      ["CHR2015:Reg8", "SCCIF:Leadership"],
  key_work_session: ["CHR2015:Reg5", "CHR2015:Reg6", "SCCIF:OverallExperiences"],
  contact_session:  ["CHR2015:Reg13", "SCCIF:OverallExperiences"],
};

// ── Testing exports ─────────────────────────────────────────────────────────

export const _testing = {
  generateOversightPrompts,
  OVERSIGHT_REGULATION_REFS,
};

// ══════════════════════════════════════════════════════════════════════════════
// CARA — EVIDENCE MANAGEMENT SERVICE
// Upload, categorise, link, and verify evidence items. Regulation mapping,
// quality assessment, and inspection readiness scoring.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type {
  CsEvidenceItem, CsEvidenceLink, CsRegulationMapping,
  CsInspectionReadinessScan,
  EvidenceType, EvidenceLinkType, RegulatoryFramework,
  ServiceResult,
} from "@/types/operations";
import { todayStr } from "@/lib/utils";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Evidence CRUD ───────────────────────────────────────────────────────────

export async function listEvidence(
  homeId: string,
  opts?: {
    type?: EvidenceType;
    childId?: string;
    staffId?: string;
    regulation_ref?: string;
    tags?: string[];
    limit?: number;
  },
): Promise<ServiceResult<CsEvidenceItem[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_evidence_items") as SB).select("*").eq("home_id", homeId);
  if (opts?.type) q = q.eq("evidence_type", opts.type);
  if (opts?.childId) q = q.eq("linked_child_id", opts.childId);
  if (opts?.staffId) q = q.eq("linked_staff_id", opts.staffId);
  if (opts?.regulation_ref) q = q.contains("regulation_refs", [opts.regulation_ref]);
  if (opts?.tags?.length) q = q.overlaps("tags", opts.tags);
  q = q.order("created_at", { ascending: false }).limit(opts?.limit ?? 50);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getEvidenceItem(
  evidenceId: string,
): Promise<ServiceResult<CsEvidenceItem>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_evidence_items") as SB)
    .select("*")
    .eq("id", evidenceId)
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createEvidenceItem(input: {
  homeId: string;
  title: string;
  description?: string;
  evidence_type: EvidenceType;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  linked_child_id?: string;
  linked_staff_id?: string;
  regulation_refs?: string[];
  sccif_refs?: string[];
  date_of_evidence?: string;
  tags?: string[];
  uploaded_by: string;
}): Promise<ServiceResult<CsEvidenceItem>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_evidence_items") as SB)
    .insert({
      home_id: input.homeId,
      title: input.title,
      description: input.description ?? null,
      evidence_type: input.evidence_type,
      file_url: input.file_url ?? null,
      file_name: input.file_name ?? null,
      file_size: input.file_size ?? null,
      mime_type: input.mime_type ?? null,
      linked_child_id: input.linked_child_id ?? null,
      linked_staff_id: input.linked_staff_id ?? null,
      regulation_refs: input.regulation_refs ?? [],
      sccif_refs: input.sccif_refs ?? [],
      date_of_evidence: input.date_of_evidence ?? todayStr(),
      tags: input.tags ?? [],
      uploaded_by: input.uploaded_by,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateEvidenceItem(
  evidenceId: string,
  updates: Partial<Pick<CsEvidenceItem,
    | "title" | "description" | "regulation_refs" | "sccif_refs"
    | "tags" | "quality_score" | "quality_notes"
  >>,
): Promise<ServiceResult<CsEvidenceItem>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_evidence_items") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", evidenceId)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function verifyEvidence(
  evidenceId: string,
  verifiedBy: string,
  qualityScore?: number,
  qualityNotes?: string,
): Promise<ServiceResult<CsEvidenceItem>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_evidence_items") as SB)
    .update({
      verified_by: verifiedBy,
      verified_at: new Date().toISOString(),
      quality_score: qualityScore ?? null,
      quality_notes: qualityNotes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", evidenceId)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Evidence linking ────────────────────────────────────────────────────────

export async function linkEvidence(
  evidenceId: string,
  entityType: string,
  entityId: string,
  linkType: EvidenceLinkType = "supports",
  createdBy: string,
): Promise<ServiceResult<CsEvidenceLink>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_evidence_links") as SB)
    .insert({
      evidence_id: evidenceId,
      entity_type: entityType,
      entity_id: entityId,
      link_type: linkType,
      created_by: createdBy,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function getEvidenceLinks(
  entityType: string,
  entityId: string,
): Promise<ServiceResult<(CsEvidenceLink & { evidence?: CsEvidenceItem })[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  const { data, error } = await (s.from("cs_evidence_links") as SB)
    .select("*, cs_evidence_items(*)")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getEvidenceForItem(
  evidenceId: string,
): Promise<ServiceResult<CsEvidenceLink[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  const { data, error } = await (s.from("cs_evidence_links") as SB)
    .select("*")
    .eq("evidence_id", evidenceId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

// ── Regulation mappings ─────────────────────────────────────────────────────

export async function getRegulationMappings(
  framework?: RegulatoryFramework,
): Promise<ServiceResult<CsRegulationMapping[]>> {
  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_regulation_mappings") as SB).select("*");
  if (framework) q = q.eq("framework", framework);
  q = q.order("sort_order", { ascending: true });

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

// ── Inspection readiness ────────────────────────────────────────────────────

export interface ReadinessModuleScore {
  module: string;
  label: string;
  score: number;
  maxScore: number;
  percentage: number | null;
  evidenceCount: number;
  gaps: string[];
  strengths: string[];
}

export interface InspectionReadinessResult {
  overallScore: number;
  overallPercentage: number | null;
  grade: "Outstanding" | "Good" | "Requires Improvement" | "Inadequate";
  modules: ReadinessModuleScore[];
  criticalGaps: string[];
  topStrengths: string[];
  recommendations: string[];
}

/**
 * Compute inspection readiness score for a home.
 * Analyses evidence coverage against regulation requirements.
 * This is a pure computation — it doesn't store the result.
 */
export function computeInspectionReadiness(
  evidence: CsEvidenceItem[],
  regulations: CsRegulationMapping[],
): InspectionReadinessResult {
  const MODULES = [
    { key: "safeguarding", label: "Safeguarding & Protection", weight: 25 },
    { key: "daily_logs", label: "Daily Recording", weight: 15 },
    { key: "oversight", label: "Management Oversight", weight: 15 },
    { key: "young_people", label: "Young People Outcomes", weight: 15 },
    { key: "staffing", label: "Staffing & Training", weight: 10 },
    { key: "medication", label: "Medication Management", weight: 5 },
    { key: "compliance", label: "Compliance & Governance", weight: 10 },
    { key: "contact", label: "Contact & Family", weight: 5 },
  ];

  const modules: ReadinessModuleScore[] = [];
  let totalWeightedScore = 0;
  let totalWeight = 0;
  const criticalGaps: string[] = [];
  const topStrengths: string[] = [];
  const recommendations: string[] = [];

  for (const mod of MODULES) {
    // Find regulations relevant to this module
    const relevantRegs = regulations.filter((r) => r.module_links.includes(mod.key));
    // Find evidence matching this module
    const relevantEvidence = evidence.filter((e) =>
      relevantRegs.some((r) => e.regulation_refs.includes(`${r.framework}:${r.reference}`)) ||
      e.tags.includes(mod.key),
    );

    const gaps: string[] = [];
    const strengths: string[] = [];

    // Check each regulation for evidence
    for (const reg of relevantRegs) {
      const regRef = `${reg.framework}:${reg.reference}`;
      const regEvidence = evidence.filter((e) => e.regulation_refs.includes(regRef));

      if (regEvidence.length === 0) {
        gaps.push(`No evidence for ${reg.title} (${regRef})`);
      } else if (regEvidence.length >= 3) {
        strengths.push(`Strong evidence base for ${reg.title} (${regEvidence.length} items)`);
      }

      // Check for verified evidence
      const verified = regEvidence.filter((e) => e.verified_by);
      if (regEvidence.length > 0 && verified.length === 0) {
        gaps.push(`Evidence for ${reg.title} not yet verified`);
      }
    }

    // Calculate module score
    const maxScore = relevantRegs.length * 10;
    let score = 0;
    for (const reg of relevantRegs) {
      const regRef = `${reg.framework}:${reg.reference}`;
      const regEvidence = evidence.filter((e) => e.regulation_refs.includes(regRef));
      if (regEvidence.length === 0) score += 0;
      else if (regEvidence.length === 1) score += 4;
      else if (regEvidence.length === 2) score += 7;
      else score += 10;
    }

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : null;

    modules.push({
      module: mod.key,
      label: mod.label,
      score,
      maxScore,
      percentage,
      evidenceCount: relevantEvidence.length,
      gaps,
      strengths,
    });

    totalWeightedScore += (percentage ?? 0) * mod.weight;
    totalWeight += mod.weight;

    // Populate global gaps/strengths
    if ((percentage ?? 0) < 50) {
      criticalGaps.push(`${mod.label}: ${percentage}% — needs urgent attention`);
      recommendations.push(`Upload evidence for ${mod.label} — currently ${gaps.length} gap(s) identified`);
    }
    if ((percentage ?? 0) >= 80) {
      topStrengths.push(`${mod.label}: Strong at ${percentage}%`);
    }
  }

  const overallPercentage = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : null;
  const overallScore = Math.round((overallPercentage ?? 0) / 10 * 10) / 10;

  const grade: InspectionReadinessResult["grade"] =
    (overallPercentage ?? 0) >= 85 ? "Outstanding" :
    (overallPercentage ?? 0) >= 65 ? "Good" :
    (overallPercentage ?? 0) >= 40 ? "Requires Improvement" : "Inadequate";

  return {
    overallScore,
    overallPercentage,
    grade,
    modules,
    criticalGaps,
    topStrengths,
    recommendations,
  };
}

/**
 * Run and store an inspection readiness scan.
 */
export async function runInspectionReadinessScan(
  homeId: string,
  scanType: "full" | "quick" | "module" | "regulation",
  initiatedBy: string,
): Promise<ServiceResult<CsInspectionReadinessScan>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  // Fetch evidence and regulations
  const { data: evidence } = await (s.from("cs_evidence_items") as SB)
    .select("*")
    .eq("home_id", homeId);
  const { data: regulations } = await (s.from("cs_regulation_mappings") as SB)
    .select("*");

  const result = computeInspectionReadiness(evidence ?? [], regulations ?? []);

  // Store the scan
  const moduleScores: Record<string, { score: number; gaps: string[]; strengths: string[] }> = {};
  for (const m of result.modules) {
    moduleScores[m.module] = { score: m.percentage ?? 0, gaps: m.gaps, strengths: m.strengths };
  }

  const { data, error } = await (s.from("cs_inspection_readiness_scans") as SB)
    .insert({
      home_id: homeId,
      scan_type: scanType,
      overall_score: result.overallPercentage,
      module_scores: moduleScores,
      gaps_identified: { critical: result.criticalGaps },
      strengths_identified: { top: result.topStrengths },
      recommendations: { items: result.recommendations },
      initiated_by: initiatedBy,
      completed_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

/**
 * Get the latest readiness scan for a home.
 */
export async function getLatestReadinessScan(
  homeId: string,
): Promise<ServiceResult<CsInspectionReadinessScan | null>> {
  const s = sb();
  if (!s) return { ok: true, data: null };

  const { data, error } = await (s.from("cs_inspection_readiness_scans") as SB)
    .select("*")
    .eq("home_id", homeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? null };
}

// ── Testing exports ─────────────────────────────────────────────────────────

export const _testing = {
  computeInspectionReadiness,
};

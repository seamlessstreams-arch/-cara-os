// ══════════════════════════════════════════════════════════════════════════════
// Cara — REGULATION 45 EVIDENCE LINKING SERVICE
//
// Links child report content to Regulation 45 evidence categories. Creates
// structured evidence items that feed into the monthly Reg 45 report by
// mapping report sections to Quality Standards and regulatory references.
//
// Regulation 45 of the Children's Homes (England) Regulations 2015 requires
// that the Responsible Individual produces a monthly report evaluating the
// quality of care provided to each child. This service automates evidence
// collection by extracting relevant content from completed child reports.
//
// Also provides getReg45Evidence for retrieving evidence items by home and
// date range.
//
// Server-side only — never import in client components.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type {
  ChildReport,
  ChildReportSection,
  Regulation45EvidenceItem,
  Regulation45EvidenceItemInsert,
} from "@/types/cara-reports";
import { writeCaraAudit } from "@/lib/cara/audit/cara-audit";

// ── Section → Reg 45 Category Mapping ─────────────────────────────────────

interface Reg45Mapping {
  category: string;
  qualityStandard: string;
  regulationReference: string;
  isSafeguarding: boolean;
  isRiskRelated: boolean;
}

const SECTION_REG45_MAP: Record<string, Reg45Mapping> = {
  // Quality of care evidence
  presentation: {
    category: "quality_of_care",
    qualityStandard: "QS 1 — The quality and purpose of care standard",
    regulationReference: "Reg 6",
    isSafeguarding: false,
    isRiskRelated: false,
  },
  positives: {
    category: "quality_of_care",
    qualityStandard: "QS 1 — The quality and purpose of care standard",
    regulationReference: "Reg 6",
    isSafeguarding: false,
    isRiskRelated: false,
  },
  positives_and_achievements: {
    category: "quality_of_care",
    qualityStandard: "QS 1 — The quality and purpose of care standard",
    regulationReference: "Reg 6",
    isSafeguarding: false,
    isRiskRelated: false,
  },
  progress_and_positives: {
    category: "quality_of_care",
    qualityStandard: "QS 1 — The quality and purpose of care standard",
    regulationReference: "Reg 6",
    isSafeguarding: false,
    isRiskRelated: false,
  },

  // Child progress
  overview: {
    category: "child_progress",
    qualityStandard: "QS 1 — The quality and purpose of care standard",
    regulationReference: "Reg 6",
    isSafeguarding: false,
    isRiskRelated: false,
  },
  progress: {
    category: "child_progress",
    qualityStandard: "QS 1 — The quality and purpose of care standard",
    regulationReference: "Reg 6",
    isSafeguarding: false,
    isRiskRelated: false,
  },
  progress_during_placement: {
    category: "child_progress",
    qualityStandard: "QS 1 — The quality and purpose of care standard",
    regulationReference: "Reg 6",
    isSafeguarding: false,
    isRiskRelated: false,
  },

  // Safeguarding
  incidents_concerns: {
    category: "safeguarding",
    qualityStandard: "QS 4 — The protection of children standard",
    regulationReference: "Reg 12",
    isSafeguarding: true,
    isRiskRelated: true,
  },
  incidents_and_concerns: {
    category: "safeguarding",
    qualityStandard: "QS 4 — The protection of children standard",
    regulationReference: "Reg 12",
    isSafeguarding: true,
    isRiskRelated: true,
  },
  concerns_and_risks: {
    category: "safeguarding",
    qualityStandard: "QS 4 — The protection of children standard",
    regulationReference: "Reg 12",
    isSafeguarding: true,
    isRiskRelated: true,
  },
  safeguarding_concerns: {
    category: "safeguarding",
    qualityStandard: "QS 4 — The protection of children standard",
    regulationReference: "Reg 12",
    isSafeguarding: true,
    isRiskRelated: true,
  },
  behaviour_risk_safeguarding: {
    category: "safeguarding",
    qualityStandard: "QS 4 — The protection of children standard",
    regulationReference: "Reg 12",
    isSafeguarding: true,
    isRiskRelated: true,
  },
  risk_assessment: {
    category: "safeguarding",
    qualityStandard: "QS 4 — The protection of children standard",
    regulationReference: "Reg 12",
    isSafeguarding: false,
    isRiskRelated: true,
  },
  risk_and_safeguarding: {
    category: "safeguarding",
    qualityStandard: "QS 4 — The protection of children standard",
    regulationReference: "Reg 12",
    isSafeguarding: true,
    isRiskRelated: true,
  },

  // Education
  education: {
    category: "education",
    qualityStandard: "QS 3 — The education standard",
    regulationReference: "Reg 8",
    isSafeguarding: false,
    isRiskRelated: false,
  },
  education_during_placement: {
    category: "education",
    qualityStandard: "QS 3 — The education standard",
    regulationReference: "Reg 8",
    isSafeguarding: false,
    isRiskRelated: false,
  },
  academic_progress: {
    category: "education",
    qualityStandard: "QS 3 — The education standard",
    regulationReference: "Reg 8",
    isSafeguarding: false,
    isRiskRelated: false,
  },
  attendance_and_engagement: {
    category: "education",
    qualityStandard: "QS 3 — The education standard",
    regulationReference: "Reg 8",
    isSafeguarding: false,
    isRiskRelated: false,
  },

  // Health
  health: {
    category: "health",
    qualityStandard: "QS 2 — The children's views, wishes and feelings standard",
    regulationReference: "Reg 7",
    isSafeguarding: false,
    isRiskRelated: false,
  },
  health_during_placement: {
    category: "health",
    qualityStandard: "QS 2 — The children's views, wishes and feelings standard",
    regulationReference: "Reg 7",
    isSafeguarding: false,
    isRiskRelated: false,
  },
  physical_health: {
    category: "health",
    qualityStandard: "QS 2 — The children's views, wishes and feelings standard",
    regulationReference: "Reg 7",
    isSafeguarding: false,
    isRiskRelated: false,
  },
  emotional_and_mental_health: {
    category: "health",
    qualityStandard: "QS 2 — The children's views, wishes and feelings standard",
    regulationReference: "Reg 7",
    isSafeguarding: false,
    isRiskRelated: false,
  },

  // Leadership & management
  manager_oversight: {
    category: "leadership_and_management",
    qualityStandard: "QS 5 — The leadership and management standard",
    regulationReference: "Reg 13",
    isSafeguarding: false,
    isRiskRelated: false,
  },
  manager_sign_off: {
    category: "leadership_and_management",
    qualityStandard: "QS 5 — The leadership and management standard",
    regulationReference: "Reg 13",
    isSafeguarding: false,
    isRiskRelated: false,
  },
  manager_analysis: {
    category: "leadership_and_management",
    qualityStandard: "QS 5 — The leadership and management standard",
    regulationReference: "Reg 13",
    isSafeguarding: false,
    isRiskRelated: false,
  },

  // Staff practice
  staff_reflection: {
    category: "staff_practice",
    qualityStandard: "QS 5 — The leadership and management standard",
    regulationReference: "Reg 13",
    isSafeguarding: false,
    isRiskRelated: false,
  },

  // Impact of care
  working_well: {
    category: "impact_of_care",
    qualityStandard: "QS 1 — The quality and purpose of care standard",
    regulationReference: "Reg 6",
    isSafeguarding: false,
    isRiskRelated: false,
  },
  what_worked_well: {
    category: "impact_of_care",
    qualityStandard: "QS 1 — The quality and purpose of care standard",
    regulationReference: "Reg 6",
    isSafeguarding: false,
    isRiskRelated: false,
  },

  // Child voice
  childs_voice: {
    category: "child_voice",
    qualityStandard: "QS 2 — The children's views, wishes and feelings standard",
    regulationReference: "Reg 7",
    isSafeguarding: false,
    isRiskRelated: false,
  },
  childs_views: {
    category: "child_voice",
    qualityStandard: "QS 2 — The children's views, wishes and feelings standard",
    regulationReference: "Reg 7",
    isSafeguarding: false,
    isRiskRelated: false,
  },
  childs_views_and_wishes: {
    category: "child_voice",
    qualityStandard: "QS 2 — The children's views, wishes and feelings standard",
    regulationReference: "Reg 7",
    isSafeguarding: false,
    isRiskRelated: false,
  },
  childs_views_on_placement: {
    category: "child_voice",
    qualityStandard: "QS 2 — The children's views, wishes and feelings standard",
    regulationReference: "Reg 7",
    isSafeguarding: false,
    isRiskRelated: false,
  },

  // Family contact
  family_contact: {
    category: "family_relationships",
    qualityStandard: "QS 2 — The children's views, wishes and feelings standard",
    regulationReference: "Reg 7",
    isSafeguarding: false,
    isRiskRelated: false,
  },
  family_relationships: {
    category: "family_relationships",
    qualityStandard: "QS 2 — The children's views, wishes and feelings standard",
    regulationReference: "Reg 7",
    isSafeguarding: false,
    isRiskRelated: false,
  },
  family_contact_and_relationships: {
    category: "family_relationships",
    qualityStandard: "QS 2 — The children's views, wishes and feelings standard",
    regulationReference: "Reg 7",
    isSafeguarding: false,
    isRiskRelated: false,
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// LINK REPORT TO REG 45
// ══════════════════════════════════════════════════════════════════════════════

export async function linkReportToReg45(
  reportId: string,
  createdBy: string,
  qualityStandards?: string[],
): Promise<Regulation45EvidenceItem[]> {
  // Fetch report and sections
  const { report, sections } = await fetchReportAndSections(reportId);
  if (!report) {
    throw new Error(`Report not found: ${reportId}`);
  }

  // Derive month/year from report date range
  const dateEnd = new Date(report.date_range_end);
  const month = dateEnd.toLocaleString("en-GB", { month: "long" }).toLowerCase();
  const year = dateEnd.getFullYear();

  const items: Regulation45EvidenceItem[] = [];
  const now = new Date().toISOString();

  for (const section of sections) {
    const mapping = SECTION_REG45_MAP[section.section_key];
    if (!mapping) continue;

    // Skip if quality standard filter is active and this section doesn't match
    if (
      qualityStandards &&
      qualityStandards.length > 0 &&
      !qualityStandards.some((qs) => mapping.qualityStandard.includes(qs))
    ) {
      continue;
    }

    // Skip sections with no meaningful content
    if (
      !section.content ||
      section.content.trim().length < 20 ||
      section.content.includes("not enough recorded evidence")
    ) {
      continue;
    }

    const evidenceItem: Regulation45EvidenceItem = {
      id: `demo-reg45-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      organisation_id: report.organisation_id,
      home_id: report.home_id,
      child_id: report.child_id,
      month,
      year,
      category: mapping.category,
      title: `${section.title} — ${report.title}`,
      description: section.content.slice(0, 500),
      source_table: "child_report_sections",
      source_record_id: section.id,
      source_date: report.date_range_end,
      quality_score: section.confidence_score,
      is_child_voice: section.child_voice_present,
      is_safeguarding: mapping.isSafeguarding,
      is_risk_related: mapping.isRiskRelated,
      agent_run_id: report.agent_run_id,
      reviewed_by: null,
      reviewed_at: null,
      status: "suggested",
      created_at: now,
    };

    items.push(evidenceItem);
  }

  // Persist to database if available
  const sb = createServerClient();
  if (sb && items.length > 0) {
    try {
      const inserts: Regulation45EvidenceItemInsert[] = items.map((item) => ({
        organisation_id: item.organisation_id,
        home_id: item.home_id,
        child_id: item.child_id,
        month: item.month,
        year: item.year,
        category: item.category,
        title: item.title,
        description: item.description,
        source_table: item.source_table,
        source_record_id: item.source_record_id,
        source_date: item.source_date,
        quality_score: item.quality_score,
        is_child_voice: item.is_child_voice,
        is_safeguarding: item.is_safeguarding,
        is_risk_related: item.is_risk_related,
        agent_run_id: item.agent_run_id,
        reviewed_by: null,
        reviewed_at: null,
        status: "suggested" as const,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (sb.from("regulation45_evidence_items") as any)
        .insert(inserts)
        .select("*");

      if (data) {
        // Map DB IDs back
        for (let i = 0; i < data.length && i < items.length; i++) {
          items[i].id = data[i].id;
          items[i].created_at = data[i].created_at;
        }
      }

      // Audit
      await writeCaraAudit({
        organisationId: report.organisation_id,
        homeId: report.home_id,
        childId: report.child_id,
        actorId: createdBy,
        eventType: "reg45_evidence_linked",
        entityType: "report",
        entityId: reportId,
        summary: `Linked ${items.length} Reg 45 evidence items from report "${report.title}"`,
        metadata: {
          month,
          year,
          itemCount: items.length,
          categories: [...new Set(items.map((i) => i.category))],
        },
      });
    } catch (err) {
      console.error("[cara-reg45] Failed to persist Reg 45 evidence items:", err);
      // Fall through — return in-memory items
    }
  }

  return items;
}

// ══════════════════════════════════════════════════════════════════════════════
// GET REG 45 EVIDENCE
// ══════════════════════════════════════════════════════════════════════════════

export async function getReg45Evidence(
  homeId: string,
  dateStart?: string,
  dateEnd?: string,
): Promise<Regulation45EvidenceItem[]> {
  const sb = createServerClient();

  if (!sb) return getDemoReg45Evidence(homeId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (sb.from("regulation45_evidence_items") as any)
    .select("*")
    .eq("home_id", homeId)
    .order("source_date", { ascending: false });

  if (dateStart) {
    query = query.gte("source_date", dateStart);
  }
  if (dateEnd) {
    query = query.lte("source_date", dateEnd);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[cara-reg45] Failed to fetch Reg 45 evidence:", error);
    return [];
  }

  return (data ?? []) as Regulation45EvidenceItem[];
}

// ══════════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ══════════════════════════════════════════════════════════════════════════════

async function fetchReportAndSections(reportId: string): Promise<{
  report: ChildReport | null;
  sections: ChildReportSection[];
}> {
  const sb = createServerClient();

  if (!sb) {
    return getDemoReportAndSections(reportId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: report, error: reportError } = await (sb.from("child_reports") as any)
    .select("*")
    .eq("id", reportId)
    .single();

  if (reportError || !report) return { report: null, sections: [] };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sections } = await (sb.from("child_report_sections") as any)
    .select("*")
    .eq("report_id", reportId)
    .order("order", { ascending: true });

  return {
    report: report as ChildReport,
    sections: (sections ?? []) as ChildReportSection[],
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// DEMO DATA
// ══════════════════════════════════════════════════════════════════════════════

function getDemoReportAndSections(reportId: string): {
  report: ChildReport;
  sections: ChildReportSection[];
} {
  const now = new Date().toISOString();

  const report: ChildReport = {
    id: reportId,
    organisation_id: "demo-org",
    home_id: "demo-home",
    child_id: "demo-child",
    report_type: "weekly_child_report",
    audience: "internal_manager",
    title: "Jayden Mitchell — Weekly Child Report",
    status: "approved",
    version: 1,
    parent_report_id: null,
    date_range_start: "2026-05-05",
    date_range_end: "2026-05-11",
    overall_summary: "Jayden has had a broadly positive week.",
    overall_confidence_score: 72,
    risk_tier: "low",
    child_voice_included: true,
    evidence_gap_count: 2,
    agent_run_id: null,
    requested_by: "demo-user",
    generated_at: now,
    reviewed_by: "demo-manager",
    reviewed_at: now,
    review_notes: null,
    approved_by: "demo-manager",
    approved_at: now,
    rejection_reason: null,
    locked_by: null,
    locked_at: null,
    created_at: now,
    updated_at: now,
  };

  const sections: ChildReportSection[] = [
    {
      id: "demo-sec-r45-1",
      report_id: reportId,
      section_key: "overview",
      title: "Overview",
      order: 1,
      content:
        "Jayden has had a settled and positive week. He has engaged well with routines, " +
        "achieved a merit certificate at school, and participated in leisure activities.",
      structured_content: null,
      evidence_status: "evidence_supported",
      confidence_score: 80,
      evidence_count: 5,
      child_voice_present: false,
      manager_note: null,
      manager_edited: false,
      last_edited_by: null,
      last_edited_at: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "demo-sec-r45-2",
      report_id: reportId,
      section_key: "education",
      title: "Education",
      order: 6,
      content:
        "Jayden attended school every day this week with 100% attendance. He received a merit " +
        "certificate for his artwork. PEP review showed progress in English and Art.",
      structured_content: null,
      evidence_status: "evidence_supported",
      confidence_score: 85,
      evidence_count: 2,
      child_voice_present: false,
      manager_note: null,
      manager_edited: false,
      last_edited_by: null,
      last_edited_at: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: "demo-sec-r45-3",
      report_id: reportId,
      section_key: "childs_voice",
      title: "Child's Voice",
      order: 4,
      content:
        "Jayden shared that he feels safe and mostly happy at the home. He said he is looking " +
        "forward to seeing his mum but feels a bit nervous about the visit.",
      structured_content: null,
      evidence_status: "evidence_supported",
      confidence_score: 78,
      evidence_count: 2,
      child_voice_present: true,
      manager_note: null,
      manager_edited: false,
      last_edited_by: null,
      last_edited_at: null,
      created_at: now,
      updated_at: now,
    },
  ];

  return { report, sections };
}

function getDemoReg45Evidence(homeId: string): Regulation45EvidenceItem[] {
  const now = new Date().toISOString();

  return [
    {
      id: "demo-reg45-ev-1",
      organisation_id: "demo-org",
      home_id: homeId,
      child_id: "demo-child",
      month: "may",
      year: 2026,
      category: "child_progress",
      title: "Overview — Jayden Mitchell — Weekly Child Report",
      description: "Jayden has had a settled and positive week with engagement in routines and activities.",
      source_table: "child_report_sections",
      source_record_id: "demo-sec-r45-1",
      source_date: "2026-05-11",
      quality_score: 80,
      is_child_voice: false,
      is_safeguarding: false,
      is_risk_related: false,
      agent_run_id: null,
      reviewed_by: null,
      reviewed_at: null,
      status: "suggested",
      created_at: now,
    },
    {
      id: "demo-reg45-ev-2",
      organisation_id: "demo-org",
      home_id: homeId,
      child_id: "demo-child",
      month: "may",
      year: 2026,
      category: "education",
      title: "Education — Jayden Mitchell — Weekly Child Report",
      description: "Full attendance, merit certificate for artwork, PEP review showing progress.",
      source_table: "child_report_sections",
      source_record_id: "demo-sec-r45-2",
      source_date: "2026-05-11",
      quality_score: 85,
      is_child_voice: false,
      is_safeguarding: false,
      is_risk_related: false,
      agent_run_id: null,
      reviewed_by: null,
      reviewed_at: null,
      status: "suggested",
      created_at: now,
    },
    {
      id: "demo-reg45-ev-3",
      organisation_id: "demo-org",
      home_id: homeId,
      child_id: "demo-child",
      month: "may",
      year: 2026,
      category: "child_voice",
      title: "Child's Voice — Jayden Mitchell — Weekly Child Report",
      description: "Jayden shared that he feels safe and mostly happy at the home.",
      source_table: "child_report_sections",
      source_record_id: "demo-sec-r45-3",
      source_date: "2026-05-11",
      quality_score: 78,
      is_child_voice: true,
      is_safeguarding: false,
      is_risk_related: false,
      agent_run_id: null,
      reviewed_by: null,
      reviewed_at: null,
      status: "suggested",
      created_at: now,
    },
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// PRACTICE INTELLIGENCE — REGULATION & QUALITY STANDARDS MAPPING SERVICE
//
// Maps Cara outputs to Children's Homes Regulations 2015, Quality Standards,
// SCCIF themes, and other regulatory frameworks. Supports Ofsted readiness
// and Reg 45/Annex A evidence building by linking practice evidence to
// specific regulations and quality standards.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type {
  FrameworkMapping,
  RegulatoryReference,
  RegulationFramework,
  SCCIFTheme,
} from "@/types/practice-intelligence";

import { seedDay } from "@/lib/seed-date";
function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

// ── Core regulation mappings ────────────────────────────────────────────────
// Structured knowledge of how different record types map to regulations

export interface RegulationLink {
  regulation: string;
  title: string;
  quality_standards: string[];
  sccif_themes: SCCIFTheme[];
}

export const CHILDRENS_HOMES_REGULATIONS: Record<string, RegulationLink> = {
  reg_5: {
    regulation: "Regulation 5",
    title: "Statement of Purpose",
    quality_standards: ["1.1", "1.2", "1.3"],
    sccif_themes: ["effectiveness_leaders_managers"],
  },
  reg_6: {
    regulation: "Regulation 6",
    title: "Quality of Care",
    quality_standards: ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6"],
    sccif_themes: ["overall_experiences_progress"],
  },
  reg_7: {
    regulation: "Regulation 7",
    title: "Children's Plans",
    quality_standards: ["2.1", "2.2", "2.3"],
    sccif_themes: ["overall_experiences_progress"],
  },
  reg_8: {
    regulation: "Regulation 8",
    title: "Enjoyment & Achievement",
    quality_standards: ["3.1", "3.2", "3.3"],
    sccif_themes: ["overall_experiences_progress"],
  },
  reg_9: {
    regulation: "Regulation 9",
    title: "Health & Wellbeing",
    quality_standards: ["3.4", "3.5", "3.6"],
    sccif_themes: ["overall_experiences_progress"],
  },
  reg_10: {
    regulation: "Regulation 10",
    title: "Contact",
    quality_standards: ["4.1", "4.2"],
    sccif_themes: ["overall_experiences_progress"],
  },
  reg_11: {
    regulation: "Regulation 11",
    title: "Consultation",
    quality_standards: ["1.3", "1.4"],
    sccif_themes: ["overall_experiences_progress"],
  },
  reg_12: {
    regulation: "Regulation 12",
    title: "Protection of Children",
    quality_standards: ["5.1", "5.2", "5.3"],
    sccif_themes: ["how_well_children_helped_protected"],
  },
  reg_13: {
    regulation: "Regulation 13",
    title: "Leadership & Management",
    quality_standards: ["6.1", "6.2", "6.3"],
    sccif_themes: ["effectiveness_leaders_managers"],
  },
  reg_14: {
    regulation: "Regulation 14",
    title: "Behaviour Management",
    quality_standards: ["5.4", "5.5"],
    sccif_themes: ["how_well_children_helped_protected"],
  },
  reg_15: {
    regulation: "Regulation 15",
    title: "Privacy and Dignity",
    quality_standards: ["1.5", "1.6"],
    sccif_themes: ["overall_experiences_progress"],
  },
  reg_16: {
    regulation: "Regulation 16",
    title: "Complaints",
    quality_standards: ["1.3"],
    sccif_themes: ["effectiveness_leaders_managers"],
  },
  reg_32: {
    regulation: "Regulation 32",
    title: "Notification of Serious Events",
    quality_standards: ["5.1"],
    sccif_themes: ["how_well_children_helped_protected"],
  },
  reg_33: {
    regulation: "Regulation 33",
    title: "Workforce",
    quality_standards: ["7.1", "7.2", "7.3", "7.4"],
    sccif_themes: ["effectiveness_leaders_managers"],
  },
  reg_34: {
    regulation: "Regulation 34",
    title: "Fitness of Workers",
    quality_standards: ["7.1", "7.2"],
    sccif_themes: ["effectiveness_leaders_managers"],
  },
  reg_35: {
    regulation: "Regulation 35",
    title: "Monitoring & Review of Quality of Care",
    quality_standards: ["6.1", "6.2"],
    sccif_themes: ["effectiveness_leaders_managers"],
  },
  reg_36: {
    regulation: "Regulation 36",
    title: "Financial Viability",
    quality_standards: ["6.3"],
    sccif_themes: ["effectiveness_leaders_managers"],
  },
  reg_44: {
    regulation: "Regulation 44",
    title: "Independent Person: Visits and Reports",
    quality_standards: ["6.2"],
    sccif_themes: ["effectiveness_leaders_managers"],
  },
  reg_45: {
    regulation: "Regulation 45",
    title: "Review of Quality of Care",
    quality_standards: ["6.1", "6.2", "6.3"],
    sccif_themes: ["effectiveness_leaders_managers"],
  },
};

// ── Record type to regulation mapping ───────────────────────────────────────
// Which regulations are relevant for each type of record

export const RECORD_TYPE_REGULATION_MAP: Record<string, string[]> = {
  incident: ["reg_12", "reg_14", "reg_32"],
  missing_from_care: ["reg_12", "reg_32"],
  restraint: ["reg_12", "reg_14", "reg_32"],
  safeguarding: ["reg_12", "reg_32"],
  complaint: ["reg_16"],
  daily_log: ["reg_6", "reg_15"],
  keywork: ["reg_6", "reg_7", "reg_11"],
  direct_work: ["reg_6", "reg_7"],
  risk_assessment: ["reg_12"],
  placement_plan: ["reg_7"],
  care_plan: ["reg_7"],
  education: ["reg_8"],
  health: ["reg_9"],
  medication: ["reg_9"],
  contact: ["reg_10"],
  supervision: ["reg_33", "reg_34"],
  staff_training: ["reg_33", "reg_34"],
  rota: ["reg_33"],
  management_oversight: ["reg_13", "reg_35"],
  reg45: ["reg_45"],
  annex_a: ["reg_44"],
};

// ── Map artifact to regulations ─────────────────────────────────────────────

export function mapArtifactToRegulations(
  artifactType: string,
  content?: string,
): RegulatoryReference[] {
  const regKeys = RECORD_TYPE_REGULATION_MAP[artifactType] ?? [];
  const references: RegulatoryReference[] = [];

  for (const key of regKeys) {
    const reg = CHILDRENS_HOMES_REGULATIONS[key];
    if (!reg) continue;

    for (const sccif of reg.sccif_themes) {
      references.push({
        framework: "childrens_homes_regs_2015",
        regulation: `${reg.regulation}: ${reg.title}`,
        quality_standard: reg.quality_standards[0] ?? null,
        sccif_theme: sccif,
        evidence_text: content ? content.slice(0, 200) : `Evidence from ${artifactType} record`,
      });
    }
  }

  return references;
}

// ── Create framework mapping record ─────────────────────────────────────────

export async function createFrameworkMapping(opts: {
  artifactId?: string;
  artifactType?: string;
  framework: RegulationFramework;
  regulation?: string;
  qualityStandard?: string;
  sccifTheme?: SCCIFTheme;
  evidenceText?: string;
  homeId?: string;
}): Promise<FrameworkMapping> {
  const sb = createServerClient();
  const hid = opts.homeId ?? homeId();

  const record = {
    home_id: hid,
    artifact_id: opts.artifactId ?? null,
    artifact_type: opts.artifactType ?? null,
    framework: opts.framework,
    regulation: opts.regulation ?? null,
    quality_standard: opts.qualityStandard ?? null,
    sccif_theme: opts.sccifTheme ?? null,
    evidence_text: opts.evidenceText ?? null,
  };

  if (!sb) {
    return { id: crypto.randomUUID(), ...record, created_at: new Date().toISOString() };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("framework_mappings") as any)
    .insert(record)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to create framework mapping: ${error.message}`);
  return data as FrameworkMapping;
}

// ── List mappings by regulation ─────────────────────────────────────────────

export async function listFrameworkMappings(opts?: {
  framework?: RegulationFramework;
  sccifTheme?: SCCIFTheme;
  artifactType?: string;
  homeId?: string;
  limit?: number;
}): Promise<FrameworkMapping[]> {
  const sb = createServerClient();
  const hid = opts?.homeId ?? homeId();

  if (!sb) return getDemoMappings(hid);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (sb.from("framework_mappings") as any)
    .select("*")
    .eq("home_id", hid)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 50);

  if (opts?.framework) query = query.eq("framework", opts.framework);
  if (opts?.sccifTheme) query = query.eq("sccif_theme", opts.sccifTheme);
  if (opts?.artifactType) query = query.eq("artifact_type", opts.artifactType);

  const { data, error } = await query;
  if (error) return getDemoMappings(hid);
  return (data ?? []) as FrameworkMapping[];
}

// ── Get regulation coverage summary ─────────────────────────────────────────

export interface RegulationCoverage {
  regulation: string;
  title: string;
  evidenceCount: number;
  lastEvidenceDate: string | null;
  coverage: "strong" | "adequate" | "weak" | "none";
  sccifThemes: SCCIFTheme[];
}

export async function getRegulationCoverage(hId?: string): Promise<RegulationCoverage[]> {
  const sb = createServerClient();
  const hid = hId ?? homeId();

  if (!sb) return getDemoCoverage();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: mappings } = await (sb.from("framework_mappings") as any)
    .select("regulation, sccif_theme, created_at")
    .eq("home_id", hid)
    .eq("framework", "childrens_homes_regs_2015");

  const regCounts: Record<string, { count: number; lastDate: string | null; sccifThemes: Set<SCCIFTheme> }> = {};

  for (const m of (mappings ?? []) as Array<{ regulation: string; sccif_theme: SCCIFTheme; created_at: string }>) {
    const key = m.regulation ?? "Unknown";
    if (!regCounts[key]) regCounts[key] = { count: 0, lastDate: null, sccifThemes: new Set() };
    regCounts[key].count++;
    if (!regCounts[key].lastDate || m.created_at > regCounts[key].lastDate!) {
      regCounts[key].lastDate = m.created_at;
    }
    if (m.sccif_theme) regCounts[key].sccifThemes.add(m.sccif_theme);
  }

  return Object.entries(CHILDRENS_HOMES_REGULATIONS).map(([, reg]) => {
    const key = `${reg.regulation}: ${reg.title}`;
    const data = regCounts[key] ?? { count: 0, lastDate: null, sccifThemes: new Set() };

    return {
      regulation: reg.regulation,
      title: reg.title,
      evidenceCount: data.count,
      lastEvidenceDate: data.lastDate,
      coverage: data.count >= 5 ? "strong" : data.count >= 2 ? "adequate" : data.count >= 1 ? "weak" : "none",
      sccifThemes: reg.sccif_themes,
    };
  });
}

// ── SCCIF readiness summary ─────────────────────────────────────────────────

export interface SCCIFReadiness {
  theme: SCCIFTheme;
  label: string;
  totalEvidence: number;
  strongAreas: string[];
  weakAreas: string[];
  readinessLevel: "strong" | "adequate" | "needs_work" | "insufficient";
}

export async function getSCCIFReadiness(hId?: string): Promise<SCCIFReadiness[]> {
  const coverage = await getRegulationCoverage(hId);

  const themeData: Record<SCCIFTheme, { total: number; strong: string[]; weak: string[] }> = {
    overall_experiences_progress: { total: 0, strong: [], weak: [] },
    how_well_children_helped_protected: { total: 0, strong: [], weak: [] },
    effectiveness_leaders_managers: { total: 0, strong: [], weak: [] },
  };

  for (const reg of coverage) {
    for (const theme of reg.sccifThemes) {
      themeData[theme].total += reg.evidenceCount;
      if (reg.coverage === "strong" || reg.coverage === "adequate") {
        themeData[theme].strong.push(`${reg.regulation}: ${reg.title}`);
      } else {
        themeData[theme].weak.push(`${reg.regulation}: ${reg.title}`);
      }
    }
  }

  const themeLabels: Record<SCCIFTheme, string> = {
    overall_experiences_progress: "Overall Experiences & Progress of Children",
    how_well_children_helped_protected: "How Well Children Are Helped & Protected",
    effectiveness_leaders_managers: "Effectiveness of Leaders & Managers",
  };

  return Object.entries(themeData).map(([theme, data]) => ({
    theme: theme as SCCIFTheme,
    label: themeLabels[theme as SCCIFTheme],
    totalEvidence: data.total,
    strongAreas: data.strong,
    weakAreas: data.weak,
    readinessLevel: data.total >= 20 ? "strong" : data.total >= 10 ? "adequate" : data.total >= 3 ? "needs_work" : "insufficient",
  }));
}

// ── Demo data ───────────────────────────────────────────────────────────────

function getDemoMappings(hid: string): FrameworkMapping[] {
  return [
    {
      id: "demo-fm-1", home_id: hid, artifact_id: "art-1", artifact_type: "incident_learning_review",
      framework: "childrens_homes_regs_2015", regulation: "Regulation 12: Protection of Children",
      quality_standard: "5.1", sccif_theme: "how_well_children_helped_protected",
      evidence_text: "Incident learning review demonstrates thorough analysis of protective measures.",
      created_at: `${seedDay(-1)}T09:00:00Z`,
    },
    {
      id: "demo-fm-2", home_id: hid, artifact_id: "art-2", artifact_type: "management_oversight",
      framework: "childrens_homes_regs_2015", regulation: "Regulation 13: Leadership & Management",
      quality_standard: "6.1", sccif_theme: "effectiveness_leaders_managers",
      evidence_text: "Management oversight demonstrates effective monitoring of quality of care.",
      created_at: `${seedDay(-2)}T14:00:00Z`,
    },
  ];
}

function getDemoCoverage(): RegulationCoverage[] {
  return Object.entries(CHILDRENS_HOMES_REGULATIONS).map(([key, reg]) => {
    const evidenceCounts: Record<string, number> = {
      reg_6: 12, reg_7: 8, reg_8: 5, reg_9: 4, reg_10: 6,
      reg_11: 3, reg_12: 15, reg_13: 10, reg_14: 7, reg_15: 3,
      reg_33: 6, reg_45: 4,
    };
    const count = evidenceCounts[key] ?? 1;

    return {
      regulation: reg.regulation,
      title: reg.title,
      evidenceCount: count,
      lastEvidenceDate: `${seedDay(-1)}T09:00:00Z`,
      coverage: (count >= 5 ? "strong" : count >= 2 ? "adequate" : "weak") as RegulationCoverage["coverage"],
      sccifThemes: reg.sccif_themes,
    };
  });
}

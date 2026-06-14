// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — STAFF LEARNING PATHWAY
//
// Builds personalised learning pathways for staff based on practice themes,
// incident patterns, supervision feedback, and training gaps. Links Cara-
// generated training content to real practice evidence and tracks progress.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

// ── Types ───────────────────────────────────────────────────────────────────

export type LearningPriority = "critical" | "high" | "medium" | "low";
export type LearningStatus = "not_started" | "in_progress" | "completed" | "overdue";

export interface LearningObjective {
  id: string;
  title: string;
  description: string;
  priority: LearningPriority;
  status: LearningStatus;
  sourceEvidence: string[];
  linkedArtifactIds: string[];
  dueDate: string | null;
  completedDate: string | null;
  competencyArea: string;
}

export interface StaffLearningPathway {
  staffId: string;
  staffName: string;
  role: string;
  objectives: LearningObjective[];
  overallProgress: number;
  criticalCount: number;
  overdueCount: number;
  completedCount: number;
  lastUpdated: string;
}

export interface LearningPathwaySummary {
  totalStaff: number;
  averageProgress: number;
  staffWithOverdue: number;
  criticalObjectives: number;
  topCompetencyGaps: { area: string; staffCount: number }[];
  pathways: StaffLearningPathway[];
}

// ── Competency areas ────────────────────────────────────────────────────────

const COMPETENCY_AREAS = [
  "safeguarding",
  "therapeutic_care",
  "behaviour_management",
  "recording_practice",
  "medication_management",
  "key_working",
  "risk_assessment",
  "professional_boundaries",
  "equality_diversity",
  "mental_health_awareness",
  "attachment_theory",
  "trauma_informed_practice",
  "child_development",
  "de_escalation",
  "first_aid",
  "fire_safety",
] as const;

export type CompetencyArea = (typeof COMPETENCY_AREAS)[number];

// ── Generate learning pathway for a staff member ────────────────────────────

export async function generateStaffPathway(staffId: string): Promise<StaffLearningPathway> {
  const sb = createServerClient();
  if (!sb) return getDemoPathway(staffId);

  // Look up staff
  const { data: staff, error: staffErr } = await (sb.from("staff") as any)
    .select("id, full_name, role")
    .eq("id", staffId)
    .single();

  if (staffErr || !staff) return getDemoPathway(staffId);

  // Look up incidents where staff was involved (for practice themes)
  const { data: incidents } = await (sb.from("incidents") as any)
    .select("id, incident_type, description, created_at")
    .eq("home_id", homeId())
    .contains("staff_involved", [staffId])
    .order("created_at", { ascending: false })
    .limit(20);

  // Look up existing training artifacts linked to staff
  const { data: trainingArtifacts } = await (sb.from("cara_studio_artifacts") as any)
    .select("id, title, artifact_type, status, created_at")
    .eq("home_id", homeId())
    .in("artifact_type", ["staff_training", "quiz", "scenario_simulation", "reflective_workbook"])
    .eq("status", "committed")
    .order("created_at", { ascending: false })
    .limit(20);

  // Build objectives from practice themes
  const objectives = buildObjectivesFromEvidence(
    (incidents ?? []) as Array<{ id: string; incident_type: string; description: string; created_at: string }>,
    (trainingArtifacts ?? []) as Array<{ id: string; title: string; artifact_type: string; status: string; created_at: string }>,
  );

  const completed = objectives.filter((o) => o.status === "completed");
  const overdue = objectives.filter((o) => o.status === "overdue");
  const critical = objectives.filter((o) => o.priority === "critical");

  return {
    staffId: staff.id,
    staffName: staff.full_name,
    role: staff.role,
    objectives,
    overallProgress: objectives.length > 0 ? Math.round((completed.length / objectives.length) * 100) : 0,
    criticalCount: critical.length,
    overdueCount: overdue.length,
    completedCount: completed.length,
    lastUpdated: new Date().toISOString(),
  };
}

// ── Get pathway summary for the home ────────────────────────────────────────

export async function getLearningPathwaySummary(): Promise<LearningPathwaySummary> {
  const sb = createServerClient();
  if (!sb) return getDemoSummary();

  const { data: staffList, error } = await (sb.from("staff") as any)
    .select("id, full_name, role")
    .eq("home_id", homeId())
    .eq("status", "active")
    .limit(30);

  if (error || !staffList) return getDemoSummary();

  const pathways: StaffLearningPathway[] = [];
  for (const s of staffList as Array<{ id: string; full_name: string; role: string }>) {
    const pathway = await generateStaffPathway(s.id);
    pathways.push(pathway);
  }

  const totalProgress = pathways.reduce((sum, p) => sum + p.overallProgress, 0);
  const staffWithOverdue = pathways.filter((p) => p.overdueCount > 0).length;
  const totalCritical = pathways.reduce((sum, p) => sum + p.criticalCount, 0);

  // Top competency gaps
  const gapCounts: Record<string, number> = {};
  for (const p of pathways) {
    for (const obj of p.objectives) {
      if (obj.status !== "completed") {
        gapCounts[obj.competencyArea] = (gapCounts[obj.competencyArea] ?? 0) + 1;
      }
    }
  }
  const topCompetencyGaps = Object.entries(gapCounts)
    .map(([area, staffCount]) => ({ area, staffCount }))
    .sort((a, b) => b.staffCount - a.staffCount)
    .slice(0, 5);

  return {
    totalStaff: pathways.length,
    averageProgress: pathways.length > 0 ? Math.round(totalProgress / pathways.length) : 0,
    staffWithOverdue,
    criticalObjectives: totalCritical,
    topCompetencyGaps,
    pathways,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildObjectivesFromEvidence(
  incidents: Array<{ id: string; incident_type: string; description: string; created_at: string }>,
  trainingArtifacts: Array<{ id: string; title: string; artifact_type: string; status: string; created_at: string }>,
): LearningObjective[] {
  const objectives: LearningObjective[] = [];
  const now = new Date();

  // Analyse incident patterns to generate learning needs
  const incidentTypes: Record<string, number> = {};
  for (const inc of incidents) {
    incidentTypes[inc.incident_type] = (incidentTypes[inc.incident_type] ?? 0) + 1;
  }

  if ((incidentTypes["physical_intervention"] ?? 0) >= 2) {
    objectives.push({
      id: `obj-${Date.now()}-de-esc`,
      title: "De-escalation Refresher",
      description: "Multiple physical interventions recorded — refresher training on de-escalation techniques recommended.",
      priority: "high",
      status: "not_started",
      sourceEvidence: incidents.filter((i) => i.incident_type === "physical_intervention").map((i) => i.id),
      linkedArtifactIds: [],
      dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      completedDate: null,
      competencyArea: "de_escalation",
    });
  }

  if ((incidentTypes["safeguarding"] ?? 0) >= 1) {
    objectives.push({
      id: `obj-${Date.now()}-sg`,
      title: "Safeguarding Practice Review",
      description: "Safeguarding incident(s) recorded — review practice understanding and response protocols.",
      priority: "critical",
      status: "not_started",
      sourceEvidence: incidents.filter((i) => i.incident_type === "safeguarding").map((i) => i.id),
      linkedArtifactIds: [],
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      completedDate: null,
      competencyArea: "safeguarding",
    });
  }

  // Check for linked training artifacts
  for (const art of trainingArtifacts) {
    if (art.artifact_type === "staff_training" && art.status === "committed") {
      objectives.push({
        id: `obj-${art.id}`,
        title: art.title,
        description: "Cara-generated training session — complete and evidence understanding.",
        priority: "medium",
        status: "completed",
        sourceEvidence: [],
        linkedArtifactIds: [art.id],
        dueDate: null,
        completedDate: art.created_at,
        competencyArea: "therapeutic_care",
      });
    }
  }

  return objectives;
}

// ── Demo data ───────────────────────────────────────────────────────────────

function getDemoPathway(staffId: string): StaffLearningPathway {
  const now = new Date();
  return {
    staffId,
    staffName: "Demo Staff Member",
    role: "residential_care_worker",
    objectives: [
      {
        id: "obj-demo-1", title: "Trauma-Informed Practice Refresher",
        description: "Recent incidents suggest a refresher on trauma-informed approaches would strengthen practice.",
        priority: "high", status: "in_progress", sourceEvidence: ["inc-1", "inc-2"],
        linkedArtifactIds: ["art-train-1"], dueDate: "2026-05-20",
        completedDate: null, competencyArea: "trauma_informed_practice",
      },
      {
        id: "obj-demo-2", title: "De-escalation Techniques",
        description: "Two physical interventions this month — review de-escalation approach.",
        priority: "critical", status: "not_started", sourceEvidence: ["inc-3"],
        linkedArtifactIds: [], dueDate: "2026-05-15",
        completedDate: null, competencyArea: "de_escalation",
      },
      {
        id: "obj-demo-3", title: "Recording Practice Standards",
        description: "Key work records need more detail and evidence of child voice.",
        priority: "medium", status: "completed", sourceEvidence: [],
        linkedArtifactIds: ["art-train-2"], dueDate: "2026-05-01",
        completedDate: "2026-04-28", competencyArea: "recording_practice",
      },
      {
        id: "obj-demo-4", title: "Attachment Theory Foundations",
        description: "Core training for all residential care workers.",
        priority: "medium", status: "completed", sourceEvidence: [],
        linkedArtifactIds: [], dueDate: "2026-04-15",
        completedDate: "2026-04-10", competencyArea: "attachment_theory",
      },
      {
        id: "obj-demo-5", title: "Safeguarding Level 3 Update",
        description: "Annual safeguarding refresher due.",
        priority: "high", status: "overdue", sourceEvidence: [],
        linkedArtifactIds: [], dueDate: "2026-04-30",
        completedDate: null, competencyArea: "safeguarding",
      },
    ],
    overallProgress: 40,
    criticalCount: 1,
    overdueCount: 1,
    completedCount: 2,
    lastUpdated: now.toISOString(),
  };
}

function getDemoSummary(): LearningPathwaySummary {
  return {
    totalStaff: 6,
    averageProgress: 55,
    staffWithOverdue: 2,
    criticalObjectives: 3,
    topCompetencyGaps: [
      { area: "de_escalation", staffCount: 4 },
      { area: "trauma_informed_practice", staffCount: 3 },
      { area: "safeguarding", staffCount: 2 },
      { area: "recording_practice", staffCount: 2 },
      { area: "attachment_theory", staffCount: 1 },
    ],
    pathways: [
      getDemoPathway("staff-1"),
      { ...getDemoPathway("staff-2"), staffName: "Sarah Thompson", overallProgress: 80, criticalCount: 0, overdueCount: 0, completedCount: 4 },
      { ...getDemoPathway("staff-3"), staffName: "Marcus Williams", overallProgress: 30, criticalCount: 2, overdueCount: 1, completedCount: 1 },
    ],
  };
}

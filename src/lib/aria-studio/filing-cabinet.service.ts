// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — FILING CABINET INTEGRATION
//
// When an artifact is committed, this service files it into the correct
// location in Cornerstone's filing cabinet structure — linking the
// generated record to the child, the regulation area, and the date.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type { AriaStudioArtifact, AriaStudioArtifactType } from "@/types/aria-studio";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

// ── Filing path mapping ─────────────────────────────────────────────────────

const FILING_PATHS: Record<AriaStudioArtifactType, string> = {
  keywork_session: "young-people/{child_id}/key-work",
  direct_work_session: "young-people/{child_id}/direct-work",
  child_friendly_worksheet: "young-people/{child_id}/direct-work/worksheets",
  child_friendly_explanation: "young-people/{child_id}/communication",
  staff_training: "staff/training/{date}",
  quiz: "staff/training/quizzes",
  flashcards: "staff/training/resources",
  management_oversight: "governance/management-oversight/{date}",
  incident_learning_review: "incidents/{date}/learning-reviews",
  risk_review: "young-people/{child_id}/risk-assessments",
  safeguarding_review: "safeguarding/{child_id}/{date}",
  child_plan: "young-people/{child_id}/plans",
  placement_plan_update: "young-people/{child_id}/placement-plan",
  care_plan_update: "young-people/{child_id}/care-plan",
  reg45_summary: "governance/reg45/{date}",
  annex_a_update: "governance/annex-a/{date}",
  ofsted_readiness_summary: "governance/ofsted-readiness/{date}",
  ri_briefing: "governance/ri-briefings/{date}",
  social_worker_update: "young-people/{child_id}/social-worker-updates",
  parent_professional_letter: "young-people/{child_id}/correspondence",
  team_meeting_discussion: "staff/team-meetings/{date}",
  supervision_prompt: "staff/supervision/{date}",
  audio_briefing_script: "resources/audio/{date}",
  video_briefing_script: "resources/video/{date}",
  slide_deck_outline: "resources/presentations/{date}",
  mind_map: "young-people/{child_id}/visual-resources",
  timeline: "young-people/{child_id}/timelines",
  visual_formulation: "young-people/{child_id}/formulations",
  action_plan: "governance/action-plans/{date}",
  reflective_workbook: "staff/training/reflective-workbooks",
  scenario_simulation: "staff/training/scenarios",
};

// ── Build filing path ───────────────────────────────────────────────────────

export function buildFilingPath(artifact: AriaStudioArtifact): string {
  const template = FILING_PATHS[artifact.artifact_type] ?? "aria-studio/other";
  const date = (artifact.committed_at ?? artifact.created_at).slice(0, 10);
  const childId = artifact.child_id ?? "home";

  return template
    .replace("{child_id}", childId)
    .replace("{date}", date);
}

// ── File a committed artifact ───────────────────────────────────────────────

export async function fileCommittedArtifact(
  artifactId: string,
): Promise<{ success: boolean; path: string | null; recordId: string | null }> {
  const sb = createServerClient();
  if (!sb) return { success: false, path: null, recordId: null };

  // Fetch the artifact
  const { data: artifact, error: fetchErr } = await (sb.from("aria_studio_artifacts") as any)
    .select("*")
    .eq("id", artifactId)
    .single();

  if (fetchErr || !artifact) {
    console.error("[aria-studio/filing-cabinet] Fetch artifact error:", fetchErr);
    return { success: false, path: null, recordId: null };
  }

  if (artifact.status !== "committed") {
    console.warn("[aria-studio/filing-cabinet] Artifact not committed, cannot file:", artifactId);
    return { success: false, path: null, recordId: null };
  }

  const path = buildFilingPath(artifact as AriaStudioArtifact);

  // Update the artifact with filing path
  const { error: updateErr } = await (sb.from("aria_studio_artifacts") as any)
    .update({ filing_cabinet_path: path })
    .eq("id", artifactId);

  if (updateErr) {
    console.error("[aria-studio/filing-cabinet] Update filing path error:", updateErr);
    return { success: false, path, recordId: null };
  }

  return { success: true, path, recordId: artifactId };
}

// ── List filed artifacts for a path ─────────────────────────────────────────

export async function listFiledArtifacts(
  pathPrefix: string,
): Promise<AriaStudioArtifact[]> {
  const sb = createServerClient();
  if (!sb) return [];

  const { data, error } = await (sb.from("aria_studio_artifacts") as any)
    .select("*")
    .eq("home_id", homeId())
    .eq("status", "committed")
    .ilike("filing_cabinet_path", `${pathPrefix}%`)
    .order("committed_at", { ascending: false });

  if (error) {
    console.error("[aria-studio/filing-cabinet] List error:", error);
    return [];
  }
  return (data ?? []) as AriaStudioArtifact[];
}

// ── Get filing structure ────────────────────────────────────────────────────

export interface FilingCabinetFolder {
  path: string;
  label: string;
  childId: string | null;
  artifactCount: number;
  children: FilingCabinetFolder[];
}

export async function getFilingStructure(childId?: string): Promise<FilingCabinetFolder[]> {
  const sb = createServerClient();
  if (!sb) return getDemoFilingStructure(childId);

  let query = (sb.from("aria_studio_artifacts") as any)
    .select("filing_cabinet_path")
    .eq("home_id", homeId())
    .eq("status", "committed")
    .not("filing_cabinet_path", "is", null);

  if (childId) {
    query = query.eq("child_id", childId);
  }

  const { data, error } = await query;
  if (error || !data) return getDemoFilingStructure(childId);

  // Build folder tree from paths
  const pathCounts: Record<string, number> = {};
  for (const row of data as Array<{ filing_cabinet_path: string }>) {
    const path = row.filing_cabinet_path;
    if (path) {
      pathCounts[path] = (pathCounts[path] ?? 0) + 1;
      // Also count parent folders
      const parts = path.split("/");
      for (let i = 1; i < parts.length; i++) {
        const parentPath = parts.slice(0, i).join("/");
        pathCounts[parentPath] = pathCounts[parentPath] ?? 0;
      }
    }
  }

  // Convert to folder tree
  const rootFolders: FilingCabinetFolder[] = [];
  const topLevel = new Set<string>();
  for (const path of Object.keys(pathCounts)) {
    const topFolder = path.split("/")[0];
    topLevel.add(topFolder);
  }

  for (const folder of topLevel) {
    rootFolders.push({
      path: folder,
      label: folder.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      childId: null,
      artifactCount: pathCounts[folder] ?? 0,
      children: [],
    });
  }

  return rootFolders;
}

// ── Demo data ───────────────────────────────────────────────────────────────

function getDemoFilingStructure(_childId?: string): FilingCabinetFolder[] {
  return [
    {
      path: "young-people",
      label: "Young People",
      childId: null,
      artifactCount: 0,
      children: [
        { path: "young-people/demo-child-1/key-work", label: "Key Work", childId: "demo-child-1", artifactCount: 3, children: [] },
        { path: "young-people/demo-child-1/risk-assessments", label: "Risk Assessments", childId: "demo-child-1", artifactCount: 1, children: [] },
      ],
    },
    {
      path: "governance",
      label: "Governance",
      childId: null,
      artifactCount: 0,
      children: [
        { path: "governance/management-oversight", label: "Management Oversight", childId: null, artifactCount: 5, children: [] },
        { path: "governance/reg45", label: "Reg 45", childId: null, artifactCount: 2, children: [] },
      ],
    },
    {
      path: "staff",
      label: "Staff",
      childId: null,
      artifactCount: 0,
      children: [
        { path: "staff/training", label: "Training", childId: null, artifactCount: 4, children: [] },
        { path: "staff/supervision", label: "Supervision", childId: null, artifactCount: 3, children: [] },
      ],
    },
  ];
}

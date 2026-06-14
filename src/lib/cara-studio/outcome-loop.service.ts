// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — OUTCOME LOOP CAPTURE
//
// Tracks whether Cara's outputs lead to real outcomes: did the action plan
// get completed? Did the risk review result in an updated assessment?
// Did the key work session plan actually get used? Feeds back into Cara's
// evidence confidence and helps managers see impact over time.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type { CaraStudioArtifact } from "@/types/cara-studio";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface OutcomeLoopRecord {
  artifactId: string;
  artifactType: string;
  artifactTitle: string;
  committedAt: string | null;
  hasLinkedActions: boolean;
  actionsCompleted: number;
  actionsTotal: number;
  completionRate: number;
  followUpRecorded: boolean;
  outcomeStatus: "pending" | "partial" | "completed" | "expired" | "no_actions";
}

export interface OutcomeLoopSummary {
  totalCommitted: number;
  withActions: number;
  actionsCompleted: number;
  actionsTotal: number;
  completionRate: number;
  followUpRate: number;
  byType: { type: string; count: number; completionRate: number }[];
}

// ── Get outcome loop for a single artifact ──────────────────────────────────

export async function getArtifactOutcome(artifactId: string): Promise<OutcomeLoopRecord | null> {
  const sb = createServerClient();
  if (!sb) return getDemoOutcome(artifactId);

  const { data: artifact, error } = await (sb.from("cara_studio_artifacts") as any)
    .select("id, artifact_type, title, committed_at, status")
    .eq("id", artifactId)
    .single();

  if (error || !artifact) return null;

  // Get actions for this artifact
  const { data: actions } = await (sb.from("cara_studio_artifact_actions") as any)
    .select("id, status, completed_at")
    .eq("artifact_id", artifactId);

  const actionsList = (actions ?? []) as Array<{ id: string; status: string; completed_at: string | null }>;
  const completed = actionsList.filter((a) => a.status === "completed" || a.completed_at);

  return {
    artifactId: artifact.id,
    artifactType: artifact.artifact_type,
    artifactTitle: artifact.title,
    committedAt: artifact.committed_at,
    hasLinkedActions: actionsList.length > 0,
    actionsCompleted: completed.length,
    actionsTotal: actionsList.length,
    completionRate: actionsList.length > 0 ? Math.round((completed.length / actionsList.length) * 100) : 0,
    followUpRecorded: artifact.status === "committed",
    outcomeStatus: actionsList.length === 0
      ? "no_actions"
      : completed.length === actionsList.length
        ? "completed"
        : completed.length > 0
          ? "partial"
          : "pending",
  };
}

// ── Get outcome loop summary for the home ───────────────────────────────────

export async function getOutcomeLoopSummary(childId?: string): Promise<OutcomeLoopSummary> {
  const sb = createServerClient();
  if (!sb) return getDemoSummary();

  let query = (sb.from("cara_studio_artifacts") as any)
    .select("id, artifact_type, title, committed_at, status")
    .eq("home_id", homeId())
    .eq("status", "committed")
    .order("committed_at", { ascending: false })
    .limit(100);

  if (childId) query = query.eq("child_id", childId);

  const { data: artifacts, error } = await query;
  if (error || !artifacts) return getDemoSummary();

  const records: OutcomeLoopRecord[] = [];
  for (const art of artifacts as CaraStudioArtifact[]) {
    const outcome = await getArtifactOutcome(art.id);
    if (outcome) records.push(outcome);
  }

  const withActions = records.filter((r) => r.hasLinkedActions);
  const totalActions = withActions.reduce((sum, r) => sum + r.actionsTotal, 0);
  const completedActions = withActions.reduce((sum, r) => sum + r.actionsCompleted, 0);
  const withFollowUp = records.filter((r) => r.followUpRecorded);

  // By type
  const typeCounts: Record<string, { count: number; completed: number; total: number }> = {};
  for (const r of records) {
    if (!typeCounts[r.artifactType]) typeCounts[r.artifactType] = { count: 0, completed: 0, total: 0 };
    typeCounts[r.artifactType].count++;
    typeCounts[r.artifactType].completed += r.actionsCompleted;
    typeCounts[r.artifactType].total += r.actionsTotal;
  }

  return {
    totalCommitted: records.length,
    withActions: withActions.length,
    actionsCompleted: completedActions,
    actionsTotal: totalActions,
    completionRate: totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0,
    followUpRate: records.length > 0 ? Math.round((withFollowUp.length / records.length) * 100) : 0,
    byType: Object.entries(typeCounts).map(([type, data]) => ({
      type,
      count: data.count,
      completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    })),
  };
}

// ── Demo data ───────────────────────────────────────────────────────────────

function getDemoOutcome(artifactId: string): OutcomeLoopRecord {
  return {
    artifactId,
    artifactType: "management_oversight",
    artifactTitle: "Weekly Management Oversight (demo)",
    committedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    hasLinkedActions: true,
    actionsCompleted: 2,
    actionsTotal: 3,
    completionRate: 67,
    followUpRecorded: true,
    outcomeStatus: "partial",
  };
}

function getDemoSummary(): OutcomeLoopSummary {
  return {
    totalCommitted: 12,
    withActions: 8,
    actionsCompleted: 15,
    actionsTotal: 22,
    completionRate: 68,
    followUpRate: 83,
    byType: [
      { type: "management_oversight", count: 5, completionRate: 80 },
      { type: "keywork_session", count: 3, completionRate: 60 },
      { type: "risk_review", count: 2, completionRate: 50 },
      { type: "action_plan", count: 2, completionRate: 75 },
    ],
  };
}

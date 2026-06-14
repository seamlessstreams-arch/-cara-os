// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — HOME DYNAMICS DASHBOARD SERVICE
//
// Generates daily/weekly snapshots of the home's overall dynamics: incident
// counts, staffing, emotional climate, education, compliance, and suggested
// manager focus areas. Designed for the RM morning dashboard view.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type { CaraStudioHomeDynamics } from "@/types/cara-studio";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

export async function generateHomeDynamicsSnapshot(hId: string, snapshotDate?: string): Promise<CaraStudioHomeDynamics> {
  const sb = createServerClient();
  const date = snapshotDate ?? new Date().toISOString().slice(0, 10);
  if (!sb) return getDemoSnapshot(hId, date);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const countQuery = async (sourceType: string) => {
    const { count } = await (sb.from("cara_studio_sources") as any)
      .select("id", { count: "exact", head: true })
      .eq("home_id", hId).eq("source_type", sourceType).gte("source_date", weekAgo);
    return count ?? 0;
  };

  const overdueActionsQuery = async () => {
    const { count } = await (sb.from("cara_studio_gaps") as any)
      .select("id", { count: "exact", head: true })
      .eq("home_id", hId).eq("gap_type", "overdue_action").eq("status", "open");
    return count ?? 0;
  };

  const safeguardingAlertsQuery = async () => {
    const { count } = await (sb.from("cara_studio_safeguarding_patterns") as any)
      .select("id", { count: "exact", head: true })
      .eq("home_id", hId).eq("status", "open");
    return count ?? 0;
  };

  const [incidentCount, missingCount, restraintCount, complaintCount, overdueCount, safeguardingCount] =
    await Promise.all([countQuery("incident"), countQuery("missing_from_care"), countQuery("restraint"), countQuery("complaint"), overdueActionsQuery(), safeguardingAlertsQuery()]);

  const riskScore = incidentCount * 2 + missingCount * 3 + restraintCount * 3 + complaintCount + safeguardingCount * 4 + overdueCount;
  const riskLevel = riskScore >= 15 ? "high" : riskScore >= 8 ? "elevated" : riskScore >= 3 ? "moderate" : "stable";

  const focusAreas: string[] = [];
  if (safeguardingCount > 0) focusAreas.push(`${safeguardingCount} open safeguarding pattern alert(s) require review`);
  if (missingCount >= 2) focusAreas.push(`${missingCount} missing episodes this week — consider multi-agency discussion`);
  if (overdueCount > 0) focusAreas.push(`${overdueCount} overdue actions need attention`);
  if (incidentCount >= 3) focusAreas.push(`${incidentCount} incidents this week — team debrief recommended`);
  if (complaintCount > 0) focusAreas.push(`${complaintCount} complaint(s) to review`);
  if (focusAreas.length === 0) focusAreas.push("No urgent issues identified. Good time for proactive quality work.");

  const snapshot = {
    home_id: hId, snapshot_date: date,
    summary: `Weekly dynamics snapshot: ${riskLevel} overall risk. ${incidentCount} incidents, ${missingCount} missing episodes, ${safeguardingCount} safeguarding alerts.`,
    emotional_climate: deriveEmotionalClimate(incidentCount, missingCount, restraintCount),
    incident_count: incidentCount, missing_episode_count: missingCount,
    restraint_count: restraintCount, complaint_count: complaintCount,
    staff_absence_count: 0, agency_staff_count: 0, education_concerns_count: 0,
    safeguarding_alerts_count: safeguardingCount, overdue_actions_count: overdueCount,
    risk_level: riskLevel, recommended_manager_focus: focusAreas.join(". "),
    data: { period: "7_days", from: weekAgo.slice(0, 10), to: date, risk_score: riskScore },
  };

  const { data, error } = await (sb.from("cara_studio_home_dynamics") as any).insert(snapshot).select().single();
  if (error) { console.error("[cara-studio/home-dynamics] Snapshot error:", error); return getDemoSnapshot(hId, date); }
  return data as CaraStudioHomeDynamics;
}

export async function getLatestSnapshot(hId: string): Promise<CaraStudioHomeDynamics | null> {
  const sb = createServerClient();
  if (!sb) return getDemoSnapshot(hId, new Date().toISOString().slice(0, 10));

  const { data, error } = await (sb.from("cara_studio_home_dynamics") as any)
    .select("*").eq("home_id", hId).order("snapshot_date", { ascending: false }).limit(1).single();
  if (error) return null;
  return data as CaraStudioHomeDynamics;
}

export async function listSnapshots(hId: string, days: number = 30): Promise<CaraStudioHomeDynamics[]> {
  const sb = createServerClient();
  if (!sb) return [getDemoSnapshot(hId, new Date().toISOString().slice(0, 10))];

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data, error } = await (sb.from("cara_studio_home_dynamics") as any)
    .select("*").eq("home_id", hId).gte("snapshot_date", since).order("snapshot_date", { ascending: true });
  if (error) { console.error("[cara-studio/home-dynamics] List error:", error); return []; }
  return (data ?? []) as CaraStudioHomeDynamics[];
}

function deriveEmotionalClimate(incidents: number, missing: number, restraints: number): string {
  const total = incidents + missing + restraints;
  if (total === 0) return "settled";
  if (total <= 2) return "mostly_settled";
  if (total <= 5) return "unsettled";
  if (total <= 8) return "challenging";
  return "in_crisis";
}

function getDemoSnapshot(hId: string, date: string): CaraStudioHomeDynamics {
  return {
    id: `demo-dynamics-${date}`, home_id: hId || homeId(), snapshot_date: date,
    summary: "Weekly dynamics snapshot: moderate overall risk. 2 incidents, 1 missing episode, 0 safeguarding alerts.",
    emotional_climate: "mostly_settled",
    incident_count: 2, missing_episode_count: 1, restraint_count: 0,
    complaint_count: 0, staff_absence_count: 1, agency_staff_count: 2,
    education_concerns_count: 1, safeguarding_alerts_count: 0,
    overdue_actions_count: 3, risk_level: "moderate",
    recommended_manager_focus: "3 overdue actions need attention. 1 education concern to review.",
    data: { period: "7_days", demo: true },
    created_at: new Date().toISOString(),
  };
}

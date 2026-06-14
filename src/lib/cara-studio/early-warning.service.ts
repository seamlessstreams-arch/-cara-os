// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — EARLY WARNING INDICATOR ENGINE
//
// Analyses trends across evidence to surface early warnings before they
// escalate. Covers child risk, home risk, staffing, compliance, safeguarding,
// placement stability, education, and recording quality.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type {
  CaraStudioEarlyWarning,
  CaraStudioWarningType,
} from "@/types/cara-studio";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

interface WarningCheck {
  type: CaraStudioWarningType;
  title: string;
  check: (sb: any, hId: string, childId?: string) => Promise<WarningResult | null>;
}

interface WarningResult {
  description: string;
  riskLevel: string;
  indicators: unknown[];
  confidence: number;
  recommendedAction: string;
}

export async function runEarlyWarningChecks(hId: string, childId?: string): Promise<CaraStudioEarlyWarning[]> {
  const sb = createServerClient();
  if (!sb) return getDemoWarnings();

  const warnings: CaraStudioEarlyWarning[] = [];
  const now = new Date().toISOString();

  for (const check of WARNING_CHECKS) {
    try {
      const result = await check.check(sb, hId, childId);
      if (result) {
        warnings.push({
          id: `warning-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          home_id: hId, child_id: childId ?? null, staff_id: null,
          warning_type: check.type, risk_level: result.riskLevel,
          title: check.title, description: result.description,
          indicators: result.indicators, confidence_score: result.confidence,
          recommended_action: result.recommendedAction,
          status: "open", created_at: now, reviewed_at: null, resolved_at: null,
        });
      }
    } catch (err) {
      console.error(`[cara-studio/early-warning] Check "${check.type}" failed:`, err);
    }
  }

  if (warnings.length > 0) {
    const toInsert = warnings.map((w) => ({
      home_id: w.home_id, child_id: w.child_id, staff_id: w.staff_id,
      warning_type: w.warning_type, risk_level: w.risk_level, title: w.title,
      description: w.description, indicators: w.indicators,
      confidence_score: w.confidence_score, recommended_action: w.recommended_action,
      status: "open",
    }));
    const { error } = await (sb.from("cara_studio_early_warnings") as any).insert(toInsert);
    if (error) console.error("[cara-studio/early-warning] Insert error:", error);
  }

  return warnings;
}

export async function listEarlyWarnings(hId: string, childId?: string, status?: string): Promise<CaraStudioEarlyWarning[]> {
  const sb = createServerClient();
  if (!sb) return getDemoWarnings();

  let query = (sb.from("cara_studio_early_warnings") as any)
    .select("*").eq("home_id", hId).order("created_at", { ascending: false });
  if (childId) query = query.eq("child_id", childId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) { console.error("[cara-studio/early-warning] List error:", error); return []; }
  return (data ?? []) as CaraStudioEarlyWarning[];
}

export async function reviewEarlyWarning(warningId: string, status: "acknowledged" | "escalated" | "dismissed"): Promise<boolean> {
  const sb = createServerClient();
  if (!sb) return false;

  const { error } = await (sb.from("cara_studio_early_warnings") as any)
    .update({ status, reviewed_at: new Date().toISOString() }).eq("id", warningId);

  if (error) { console.error("[cara-studio/early-warning] Review error:", error); return false; }
  return true;
}

// ── Warning check implementations ───────────────────────────────────────────

const WARNING_CHECKS: WarningCheck[] = [
  {
    type: "recording_quality_risk",
    title: "Recording gaps detected",
    check: async (sb, hId) => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await sb.from("cara_studio_sources").select("id", { count: "exact", head: true })
        .eq("home_id", hId).eq("source_type", "daily_log").gte("source_date", weekAgo);
      const logCount = count ?? 0;
      if (logCount < 5) {
        return {
          description: `Only ${logCount} daily logs recorded in the past 7 days. Expected minimum is one per young person per day.`,
          riskLevel: logCount < 3 ? "high" : "medium",
          indicators: [{ metric: "daily_log_count", expected: 7, actual: logCount }],
          confidence: 0.9,
          recommendedAction: "Review daily recording practices with the team.",
        };
      }
      return null;
    },
  },
  {
    type: "compliance_risk",
    title: "Overdue management oversight",
    check: async (sb, hId) => {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await sb.from("cara_studio_sources").select("id", { count: "exact", head: true })
        .eq("home_id", hId).eq("source_type", "management_oversight").gte("source_date", fourteenDaysAgo);
      if ((count ?? 0) === 0) {
        return {
          description: "No management oversight entries recorded in the past 14 days. Regular oversight is a regulatory requirement.",
          riskLevel: "high",
          indicators: [{ metric: "management_oversight_count", period: "14_days", actual: 0 }],
          confidence: 0.95,
          recommendedAction: "Complete a management oversight entry as a priority.",
        };
      }
      return null;
    },
  },
  {
    type: "child_risk",
    title: "Escalating incident frequency",
    check: async (sb, hId, childId) => {
      if (!childId) return null;
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

      const { count: recentCount } = await sb.from("cara_studio_sources").select("id", { count: "exact", head: true })
        .eq("home_id", hId).eq("child_id", childId).eq("source_type", "incident").gte("source_date", weekAgo);
      const { count: priorCount } = await sb.from("cara_studio_sources").select("id", { count: "exact", head: true })
        .eq("home_id", hId).eq("child_id", childId).eq("source_type", "incident").gte("source_date", twoWeeksAgo).lt("source_date", weekAgo);

      const recent = recentCount ?? 0;
      const prior = priorCount ?? 0;
      if (recent > prior && recent >= 3) {
        return {
          description: `Incident frequency increased from ${prior} to ${recent} this week. This warrants professional review.`,
          riskLevel: recent >= 5 ? "high" : "medium",
          indicators: [{ metric: "incidents_this_week", value: recent }, { metric: "incidents_last_week", value: prior }],
          confidence: 0.8,
          recommendedAction: "Review the incidents in context. Consider whether the risk assessment needs updating.",
        };
      }
      return null;
    },
  },
  {
    type: "staffing_risk",
    title: "Supervision overdue",
    check: async (sb, hId) => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await sb.from("cara_studio_sources").select("id", { count: "exact", head: true })
        .eq("home_id", hId).eq("source_type", "supervision").gte("source_date", thirtyDaysAgo);
      if ((count ?? 0) === 0) {
        return {
          description: "No supervision records found in the past 30 days. Regular supervision is a regulatory requirement.",
          riskLevel: "medium",
          indicators: [{ metric: "supervision_count", period: "30_days", actual: 0 }],
          confidence: 0.85,
          recommendedAction: "Schedule supervision sessions as a priority.",
        };
      }
      return null;
    },
  },
];

function getDemoWarnings(): CaraStudioEarlyWarning[] {
  const now = new Date().toISOString();
  return [
    { id: "demo-warning-1", home_id: homeId(), child_id: null, staff_id: null, warning_type: "recording_quality_risk", risk_level: "medium", title: "Recording gaps detected", description: "Only 4 daily logs recorded in the past 7 days.", indicators: [{ metric: "daily_log_count", expected: 7, actual: 4 }], confidence_score: 0.9, recommended_action: "Review daily recording practices with the team.", status: "open", created_at: now, reviewed_at: null, resolved_at: null },
    { id: "demo-warning-2", home_id: homeId(), child_id: null, staff_id: null, warning_type: "compliance_risk", risk_level: "high", title: "Overdue management oversight", description: "No management oversight entries in 14 days.", indicators: [{ metric: "management_oversight_count", period: "14_days", actual: 0 }], confidence_score: 0.95, recommended_action: "Complete a management oversight entry as a priority.", status: "open", created_at: now, reviewed_at: null, resolved_at: null },
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/cara/insights
//
// Returns Cara proactive insights — patterns detected, risk escalations,
// compliance gaps, and positive trends. Query params: homeId, limit, type
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// ── Pure helpers (exported for testing) ────────────────────────────────────

export type InsightType =
  | "behaviour_pattern"
  | "risk_escalation"
  | "compliance_gap"
  | "positive_trend"
  | "staffing_concern"
  | "oversight_gap"
  | "evidence_gap"
  | "wellbeing_alert";

const VALID_TYPES = new Set<string>([
  "behaviour_pattern", "risk_escalation", "compliance_gap", "positive_trend",
  "staffing_concern", "oversight_gap", "evidence_gap", "wellbeing_alert",
]);

export function validateInsightType(type: unknown): type is InsightType {
  return typeof type === "string" && VALID_TYPES.has(type);
}

export function prioritiseInsights<T extends { severity: string; confidence: number }>(
  insights: T[],
): T[] {
  const severityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
    positive: 4,
  };
  return [...insights].sort((a, b) => {
    const sevDiff = (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9);
    if (sevDiff !== 0) return sevDiff;
    return b.confidence - a.confidence;
  });
}

export function getDemoInsights(limit: number) {
  const all = [
    {
      id: "ins_001",
      type: "behaviour_pattern",
      severity: "high",
      title: "Escalating behaviour pattern — Alex W",
      summary: "Three incidents involving similar behaviour within 14 days.",
      recommendation: "Review risk assessment and consider updating behaviour support plan.",
      confidence: 87,
      relatedChildName: "Alex W",
      relatedModule: "incidents",
      detectedAt: "2026-05-12T08:00:00Z",
    },
    {
      id: "ins_002",
      type: "positive_trend",
      severity: "positive",
      title: "Improved engagement — Casey T",
      summary: "Daily logs show increasing education engagement over 21 days.",
      recommendation: "Highlight in next Reg 45 report as evidence of placement stability.",
      confidence: 92,
      relatedChildName: "Casey T",
      relatedModule: "daily_log",
      detectedAt: "2026-05-11T16:00:00Z",
    },
    {
      id: "ins_003",
      type: "oversight_gap",
      severity: "medium",
      title: "3 incidents awaiting management oversight",
      summary: "Regulation 40 requires timely review of all incidents.",
      recommendation: "Review and add management oversight to outstanding incidents.",
      confidence: 95,
      relatedModule: "incidents",
      detectedAt: "2026-05-12T07:30:00Z",
    },
    {
      id: "ins_004",
      type: "compliance_gap",
      severity: "medium",
      title: "Supervision overdue for 2 staff members",
      summary: "Two staff have not had supervision within the 4-week cycle.",
      recommendation: "Schedule supervision within the next 5 working days.",
      confidence: 98,
      relatedModule: "supervision",
      detectedAt: "2026-05-12T06:00:00Z",
    },
    {
      id: "ins_005",
      type: "evidence_gap",
      severity: "low",
      title: "Missing child voice evidence — Jordan M",
      summary: "No key work session or wishes-and-feelings record in 30 days.",
      recommendation: "Schedule key work session with Jordan.",
      confidence: 88,
      relatedChildName: "Jordan M",
      relatedModule: "key_work",
      detectedAt: "2026-05-11T10:00:00Z",
    },
  ];

  return prioritiseInsights(all).slice(0, limit);
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const homeId = url.searchParams.get("homeId");
    const limitStr = url.searchParams.get("limit") ?? "10";
    const typeFilter = url.searchParams.get("type");
    const limit = Math.min(Math.max(parseInt(limitStr, 10) || 10, 1), 50);

    // Try Supabase
    if (isSupabaseEnabled()) {
      const sb = createServerClient();
      if (sb) {
        let query = (sb.from("aria_insights") as any)
          .select("*")
          .order("detected_at", { ascending: false })
          .limit(limit);

        if (homeId) query = query.eq("home_id", homeId);
        if (typeFilter && validateInsightType(typeFilter)) {
          query = query.eq("type", typeFilter);
        }

        const { data, error } = await query;
        if (!error && data) {
          return NextResponse.json({ ok: true, data: prioritiseInsights(data) });
        }
      }
    }

    // Demo fallback
    let insights = getDemoInsights(limit);
    if (typeFilter && validateInsightType(typeFilter)) {
      insights = insights.filter((i) => i.type === typeFilter);
    }

    return NextResponse.json({ ok: true, data: insights });
  } catch (err) {
    console.error("[cara/insights] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch insights" },
      { status: 500 },
    );
  }
}

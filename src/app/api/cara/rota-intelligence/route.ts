// ══════════════════════════════════════════════════════════════════════════════
// GET /api/cara/rota-intelligence
//
// Returns Cara-generated rota analysis alerts: lone-working risk, overtime,
// fatigue patterns, ratio compliance, and staffing gaps.
// Query params: homeId, weekStart
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// ── Pure helpers (exported for testing) ────────────────────────────────────

type AlertSeverity = "critical" | "high" | "medium" | "low" | "info";

interface RotaAlert {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  regulation?: string;
  staffAffected?: string[];
  dateRange?: string;
  suggestion?: string;
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

export function validateWeekStart(dateStr: unknown): boolean {
  if (typeof dateStr !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

export function prioritiseAlerts(alerts: RotaAlert[]): RotaAlert[] {
  return [...alerts].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9),
  );
}

export function computeComplianceScore(alerts: RotaAlert[]): number {
  let score = 100;
  for (const a of alerts) {
    if (a.severity === "critical") score -= 15;
    else if (a.severity === "high") score -= 10;
    else if (a.severity === "medium") score -= 5;
    else if (a.severity === "low") score -= 2;
  }
  return Math.max(0, Math.min(100, score));
}

export function getDemoAlerts(): RotaAlert[] {
  return [
    {
      id: "ra_001",
      type: "lone_working",
      severity: "critical",
      title: "Lone working risk — Wednesday night",
      detail: "Only one waking night staff member rostered.",
      regulation: "Reg 40(2)(c)",
      staffAffected: ["Jordan P"],
      dateRange: "14 May 22:00 – 15 May 07:00",
      suggestion: "Assign a second waking night staff member.",
    },
    {
      id: "ra_002",
      type: "overtime_risk",
      severity: "high",
      title: "Overtime threshold — Sam K (52h rostered)",
      detail: "Exceeds 48-hour Working Time Directive limit.",
      regulation: "Working Time Regulations 1998",
      staffAffected: ["Sam K"],
      suggestion: "Redistribute 4+ hours to available staff.",
    },
    {
      id: "ra_003",
      type: "fatigue_risk",
      severity: "high",
      title: "Insufficient rest — Alex R",
      detail: "Only 30 minutes between shifts on Thursday.",
      regulation: "Working Time Regulations",
      staffAffected: ["Alex R"],
      dateRange: "Thu 15 May",
      suggestion: "Move day shift start to 09:00.",
    },
    {
      id: "ra_004",
      type: "gap_detected",
      severity: "medium",
      title: "Sunday afternoon gap (14:00 – 17:00)",
      detail: "No shifts rostered, below minimum staffing.",
      dateRange: "Sun 18 May 14:00 – 17:00",
      suggestion: "Extend existing day shift or create additional cover.",
    },
  ];
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const homeId = url.searchParams.get("homeId");
    const weekStart = url.searchParams.get("weekStart");

    if (weekStart && !validateWeekStart(weekStart)) {
      return NextResponse.json(
        { ok: false, error: "Invalid weekStart format (expected YYYY-MM-DD)" },
        { status: 400 },
      );
    }

    // Try Supabase
    if (isSupabaseEnabled()) {
      const sb = createServerClient();
      if (sb) {
        let query = (sb.from("aria_rota_alerts") as any)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);

        if (homeId) query = query.eq("home_id", homeId);
        if (weekStart) query = query.eq("week_start", weekStart);

        const { data, error } = await query;
        if (!error && data) {
          const alerts = prioritiseAlerts(data);
          return NextResponse.json({
            ok: true,
            data: {
              alerts,
              complianceScore: computeComplianceScore(alerts),
            },
          });
        }
      }
    }

    // Demo fallback
    const alerts = prioritiseAlerts(getDemoAlerts());
    return NextResponse.json({
      ok: true,
      data: {
        alerts,
        complianceScore: computeComplianceScore(alerts),
      },
    });
  } catch (err) {
    console.error("[cara/rota-intelligence] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch rota intelligence" },
      { status: 500 },
    );
  }
}

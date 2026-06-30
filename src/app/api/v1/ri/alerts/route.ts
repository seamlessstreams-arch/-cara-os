import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import { intelligenceDb } from "@/lib/intelligence/store";
import type { RiAlert, RiAlertType, RiAlertSeverity } from "@/types/extended";

export async function GET(req: NextRequest) {
  const homeId = req.nextUrl.searchParams.get("home_id") ?? "home_oak";
  const alerts = intelligenceDb.riAlerts.findAll(homeId);
  const active = alerts.filter((a) => !a.is_resolved);
  const resolved = alerts.filter((a) => a.is_resolved);

  // Severity breakdown (active only)
  const severityCounts: Record<RiAlertSeverity, number> = {
    critical: 0, high: 0, medium: 0, low: 0,
  };
  active.forEach((a) => { severityCounts[a.severity]++; });

  // Type breakdown (active only)
  const typeCounts: Record<string, number> = {};
  active.forEach((a) => {
    typeCounts[a.alert_type] = (typeCounts[a.alert_type] ?? 0) + 1;
  });

  // Average resolution time in days (resolved only)
  let avgResolutionDays = 0;
  if (resolved.length > 0) {
    const totalDays = resolved.reduce((sum, a) => {
      if (a.resolved_at) {
        const created = new Date(a.created_at).getTime();
        const resolvedAt = new Date(a.resolved_at).getTime();
        return sum + (resolvedAt - created) / (1000 * 60 * 60 * 24);
      }
      return sum;
    }, 0);
    avgResolutionDays = Math.round((totalDays / resolved.length) * 10) / 10;
  }

  // Timeline — alerts created per week (last 12 weeks)
  const now = Date.now();
  const timeline: { week: string; created: number; resolved: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now - (i + 1) * 7 * 86400000);
    const weekEnd = new Date(now - i * 7 * 86400000);
    const label = `${weekStart.toISOString().slice(5, 10)}`;
    const created = alerts.filter((a) => {
      const d = new Date(a.created_at).getTime();
      return d >= weekStart.getTime() && d < weekEnd.getTime();
    }).length;
    const resolvedInWeek = resolved.filter((a) => {
      if (!a.resolved_at) return false;
      const d = new Date(a.resolved_at).getTime();
      return d >= weekStart.getTime() && d < weekEnd.getTime();
    }).length;
    timeline.push({ week: label, created, resolved: resolvedInWeek });
  }

  return NextResponse.json({
    data: alerts,
    meta: {
      total: alerts.length,
      unresolved: active.length,
      critical: severityCounts.critical,
      high: severityCounts.high,
      medium: severityCounts.medium,
      low: severityCounts.low,
      severity_counts: severityCounts,
      type_counts: typeCounts,
      resolved_count: resolved.length,
      avg_resolution_days: avgResolutionDays,
      timeline,
    },
  });
}

export async function POST(req: NextRequest) {
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data;
  const record = intelligenceDb.riAlerts.create({
    home_id: body.home_id ?? "home_oak",
    alert_type: body.alert_type ?? "rising_risk",
    severity: body.severity ?? "medium",
    title: body.title ?? "Alert",
    description: body.description ?? "",
    is_resolved: false,
    auto_generated: body.auto_generated ?? false,
    created_by: body.created_by ?? "staff_darren",
    ...body,
  });
  return NextResponse.json({ data: record }, { status: 201 });
}

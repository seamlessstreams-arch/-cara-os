// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/cross-home
//
// Cross-home intelligence endpoints for multi-home oversight.
// GET: Fetch overview, snapshots, trends, alerts, or comparison data.
// POST: Generate snapshots or trigger Cara cross-home analysis.
// ══════════════════════════════════════════════════════════════════════════════

import { readJsonBody } from "@/lib/http/read-json";
import { NextRequest, NextResponse } from "next/server";
import {
  getLatestSnapshots,
  getOrganisationOverview,
  getHomeTrends,
  getComparisonMatrix,
  generateSnapshot,
  getAlerts,
} from "@/lib/services/cross-home-intelligence-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organisationId = searchParams.get("organisationId");
    const action = searchParams.get("action") ?? "overview";

    if (!organisationId) {
      return NextResponse.json(
        { error: "Missing required parameter: organisationId" },
        { status: 400 },
      );
    }

    switch (action) {
      case "overview": {
        const result = await getOrganisationOverview(organisationId);
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
        return NextResponse.json({ ok: true, data: result.data });
      }

      case "snapshots": {
        const result = await getLatestSnapshots(organisationId);
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
        return NextResponse.json({ ok: true, data: result.data });
      }

      case "trends": {
        const homeId = searchParams.get("homeId");
        const metric = searchParams.get("metric") ?? "recording_compliance_pct";
        const days = parseInt(searchParams.get("days") ?? "30", 10);
        if (!homeId) {
          return NextResponse.json(
            { error: "Missing required parameter: homeId for trends" },
            { status: 400 },
          );
        }
        const result = await getHomeTrends(homeId, metric, days);
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
        return NextResponse.json({ ok: true, data: result.data });
      }

      case "alerts": {
        const result = await getAlerts(organisationId);
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
        return NextResponse.json({ ok: true, data: result.data });
      }

      case "comparison": {
        const result = await getComparisonMatrix(organisationId);
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
        return NextResponse.json({ ok: true, data: result.data });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: overview, snapshots, trends, alerts, comparison` },
          { status: 400 },
        );
    }
  } catch (err) {
    console.error("[api/cara/cross-home] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const __jb0 = await readJsonBody(req); if (!__jb0.ok) return __jb0.response; const body = __jb0.data;
    const { action, organisationId, homeId } = body;

    if (!organisationId) {
      return NextResponse.json(
        { error: "Missing required field: organisationId" },
        { status: 400 },
      );
    }

    switch (action) {
      case "generate_snapshot": {
        const result = await generateSnapshot(organisationId, homeId);
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
        return NextResponse.json({ ok: true, data: result.data });
      }

      case "cara_analyse": {
        const query = body.query ?? "Provide a cross-home analysis for this organisation";
        // Gather context for orchestration
        const snapshots = await getLatestSnapshots(organisationId);
        const alerts = await getAlerts(organisationId);

        // Build a structured context for Cara
        const analysisContext = {
          snapshots: snapshots.data ?? [],
          alerts: alerts.data ?? [],
          query,
        };

        // In production this would route through the orchestrator
        // For now, return a structured analysis based on the data
        const analysis = generateCrossHomeAnalysis(analysisContext);

        return NextResponse.json({
          ok: true,
          data: {
            analysis: analysis.text,
            evidence: analysis.evidence,
            recommendations: analysis.recommendations,
            generated_at: new Date().toISOString(),
          },
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: generate_snapshot, cara_analyse` },
          { status: 400 },
        );
    }
  } catch (err) {
    console.error("[api/cara/cross-home] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── Cara Analysis Helper ─────────────────────────────────────────────────────

interface AnalysisContext {
  snapshots: Array<{
    home_name: string;
    home_id: string;
    risk_level_overall: string;
    recording_compliance_pct: number;
    total_incidents_7d: number;
    safeguarding_concerns_open: number;
    staff_supervision_compliance_pct: number;
    ofsted_readiness_score: number;
    management_oversight_current: boolean;
    key_work_sessions_overdue: number;
    cara_risk_factors: Array<{ factor: string; severity: string; trend: string }>;
  }>;
  alerts: Array<{
    severity: string;
    message: string;
    home_name: string;
    category: string;
  }>;
  query: string;
}

function generateCrossHomeAnalysis(ctx: AnalysisContext) {
  const { snapshots, alerts } = ctx;
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highRiskHomes = snapshots.filter((s) => s.risk_level_overall === "high" || s.risk_level_overall === "critical");

  const lines: string[] = [];
  lines.push("## Cross-home Intelligence Analysis\n");

  if (criticalAlerts.length > 0) {
    lines.push(`**Critical Items (${criticalAlerts.length}):**`);
    for (const alert of criticalAlerts) {
      lines.push(`- ${alert.home_name}: ${alert.message}`);
    }
    lines.push("");
  }

  if (highRiskHomes.length > 0) {
    lines.push(`**Homes Requiring Immediate Attention (${highRiskHomes.length}):**`);
    for (const home of highRiskHomes) {
      lines.push(`- **${home.home_name}** — Risk level: ${home.risk_level_overall}, Compliance: ${home.recording_compliance_pct}%, Incidents (7d): ${home.total_incidents_7d}`);
      if (home.cara_risk_factors.length > 0) {
        for (const rf of home.cara_risk_factors) {
          lines.push(`  - ${rf.factor} (${rf.severity}, ${rf.trend})`);
        }
      }
    }
    lines.push("");
  }

  // Overall assessment
  const avgCompliance = snapshots.length > 0
    ? Math.round(snapshots.reduce((sum, s) => sum + s.recording_compliance_pct, 0) / snapshots.length)
    : 0;
  const avgReadiness = snapshots.length > 0
    ? Math.round(snapshots.reduce((sum, s) => sum + s.ofsted_readiness_score, 0) / snapshots.length)
    : 0;

  lines.push("**Organisation Summary:**");
  lines.push(`- Average recording compliance: ${avgCompliance}%`);
  lines.push(`- Average Ofsted readiness: ${avgReadiness}%`);
  lines.push(`- Homes at elevated risk: ${highRiskHomes.length}/${snapshots.length}`);
  lines.push(`- Total open safeguarding concerns: ${snapshots.reduce((sum, s) => sum + s.safeguarding_concerns_open, 0)}`);

  const recommendations: string[] = [];
  if (highRiskHomes.length > 0) {
    recommendations.push(`Prioritise RI visit to ${highRiskHomes[0].home_name} — highest risk home`);
  }
  if (avgCompliance < 80) {
    recommendations.push("Organisation-wide recording compliance is below 80% — consider targeted training");
  }
  const overdueKW = snapshots.reduce((sum, s) => sum + s.key_work_sessions_overdue, 0);
  if (overdueKW > 0) {
    recommendations.push(`${overdueKW} key work sessions overdue across the organisation — escalate to managers`);
  }

  const evidence = snapshots.map((s) => ({
    source: `${s.home_name} snapshot`,
    risk_level: s.risk_level_overall,
    compliance: s.recording_compliance_pct,
    incidents_7d: s.total_incidents_7d,
  }));

  return {
    text: lines.join("\n"),
    evidence,
    recommendations,
  };
}

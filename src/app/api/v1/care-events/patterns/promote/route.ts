// ══════════════════════════════════════════════════════════════════════════════
// API — Promote Care Event Patterns to Reg 45 Evidence  (Milestone 18)
//
// POST { home_id, lookback_days?, min_cluster?, time_band_hours?,
//        period_start?, period_end? }
//   → PromotionResult
//
// Permission: cara.generate_drafts. Each promoted chip is appended to the
// Cara audit tail as artifact_generated. Chips remain provisional until a
// manager accepts them via the existing Reg 45 evidence workflow.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import { appendCaraAudit } from "@/lib/cara/cara-audit-trail";
import { promoteCareEventPatternsToReg45 } from "@/lib/care-events/pattern-reg45-bridge";

function posInt(value: unknown): number | undefined {
  if (typeof value !== "number") return undefined;
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : undefined;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const homeId = typeof body.home_id === "string" ? body.home_id : null;
  if (!homeId) {
    return NextResponse.json({ error: "home_id is required" }, { status: 400 });
  }

  const guard = requireCaraStudioPermission(req, body, {
    permission: "cara.generate_drafts",
    homeId,
    intent: "promote care event patterns to reg45",
  });
  if (!guard.ok) return guard.response;

  const result = promoteCareEventPatternsToReg45(homeId, {
    lookbackDays: posInt(body.lookback_days),
    minClusterSize: posInt(body.min_cluster),
    timeBandHours: posInt(body.time_band_hours),
    periodStart: typeof body.period_start === "string" ? body.period_start : undefined,
    periodEnd: typeof body.period_end === "string" ? body.period_end : undefined,
  });

  // Audit each newly created chip. Refreshed chips are not re-audited
  // (their first creation already produced an artifact_generated entry).
  for (const item of result.items.slice(0, result.created)) {
    await appendCaraAudit({
      homeId,
      actorId: guard.actor.userId,
      actionType: "artifact_generated",
      artifactId: item.id,
      summary: `Promoted care-event pattern to Reg 45 evidence: ${item.title}`,
      after: { theme: item.theme, severity: item.severity, status: item.status },
    });
  }

  return NextResponse.json({ data: result });
}

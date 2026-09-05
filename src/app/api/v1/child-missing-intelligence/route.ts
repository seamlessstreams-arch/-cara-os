// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD MISSING & RETURN INTELLIGENCE API ROUTE
// GET /api/v1/child-missing-intelligence?childId=yp_alex
// Per-child engine analysing missing episodes: frequency, duration trends,
// risk escalation, return interview compliance, contextual safeguarding.
// CHR 2015 Reg 12, 34. SCCIF: "Safety of children."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";
import { safeList } from "@/lib/api/safe-list";
import { getRequestIdentity, assertChildHomeAccess } from "@/lib/auth-guard";
import { dal } from "@/lib/db/dal";
import {
  computeChildMissing,
  type MissingEpisodeInput,
} from "@/lib/engines/child-missing-intelligence-engine";
import { todayStr } from "@/lib/utils";

// Read a dal collection defensively: a transient query failure degrades to an
// empty list rather than 500-ing the whole route.

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");

  const identity = await getRequestIdentity(request);
  if (identity instanceof NextResponse) return identity;
  const denied = assertChildHomeAccess(identity, childId);
  if (denied) return denied;
  if (!childId) {
    return NextResponse.json({ error: "childId is required" }, { status: 400 });
  }

  const today = todayStr();

  const [youngPeople, missingEpisodes] = await Promise.all([
    safeList(dal.youngPeople.findAll()),
    safeList(dal.missingEpisodes.findAll()),
  ]);

  // ── Child info ─────────────────────────────────────────────────────────
  const child = (youngPeople.find((yp) => yp.id === childId));
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }
  const childName = `${child.first_name ?? ""} ${child.last_name ?? ""}`.trim() || childId;

  // ── Missing Episodes ───────────────────────────────────────────────────
  const episodes: MissingEpisodeInput[] = missingEpisodes
    .filter((ep) => ep.child_id === childId)
    .map((ep) => ({
      id: ep.id,
      date: typeof ep.date_missing === "string" ? ep.date_missing.slice(0, 10) : String(today).slice(0, 10),
      time: ep.time_missing ?? "00:00",
      duration_hours: typeof ep.duration_hours === "number" ? ep.duration_hours : null,
      risk_level: ep.risk_level ?? "medium",
      reported_to_police: !!ep.reported_to_police,
      reported_to_la: !!ep.reported_to_la,
      return_interview_completed: !!ep.return_interview_completed,
      return_interview_date: ep.return_interview_date ?? null,
      contextual_safeguarding_risk: !!ep.contextual_safeguarding_risk,
      status: ep.status ?? "closed",
      pattern_notes: ep.pattern_notes ?? null,
    }));

  // ── Compute ────────────────────────────────────────────────────────────
  const result = computeChildMissing({
    today,
    child_id: childId,
    child_name: childName,
    episodes,
  });

  return NextResponse.json({ data: result });
}

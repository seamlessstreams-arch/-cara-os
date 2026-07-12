import { NextRequest, NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth-guard";
import {
  unifiedAlerts,
  unifiedEscalations,
} from "@/lib/operational-spine/operational-spine-engine";

export const dynamic = "force-dynamic";

// GET /api/v1/operational-spine?view=alerts|escalations
// One severity-ranked feed over the previously-fragmented alert/escalation
// sources. Pure projection — read-only, no source rewritten.
export async function GET(request: NextRequest) {
  const identity = await getRequestIdentity(request);
  if (identity instanceof NextResponse) return identity;

  const view = request.nextUrl.searchParams.get("view") ?? "alerts";
  if (view !== "alerts" && view !== "escalations") {
    return NextResponse.json(
      { error: "view must be 'alerts' or 'escalations'" },
      { status: 400 },
    );
  }
  const now = new Date().toISOString();
  const data = view === "alerts" ? unifiedAlerts(now) : unifiedEscalations(now, identity.homeId ?? "home_oak");
  return NextResponse.json({ data: { view, ...data } });
}

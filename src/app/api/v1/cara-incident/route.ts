// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara INCIDENT MODE API
// GET  /api/v1/cara-incident   → sessions (newest first) + children for selector
// POST /api/v1/cara-incident   → start an incident session
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { INCIDENT_TYPES, INCIDENT_DISCLAIMER, type IncidentSession, type RiskLevel } from "@/lib/cara-incident/cara-incident-engine";
import { startSession, currentUserId, childName, sessionEntries } from "@/lib/cara-incident/incident-service";

const RISKS = new Set(["low", "medium", "high"]);

export async function GET() {
  const store = getStore() as any;
  const sessions = ((store.caraIncidentSessions ?? []) as IncidentSession[])
    .slice()
    .sort((a, b) => String(b.started_at).localeCompare(String(a.started_at)))
    .map((s) => ({
      ...s,
      child_name: childName(s.child_id),
      entry_count: sessionEntries(s.id).length,
      type_label: INCIDENT_TYPES.find((t) => t.key === s.incident_type)?.label ?? s.incident_type,
    }));
  const children = ((store.youngPeople ?? []) as any[])
    .filter((c) => c.status === "current")
    .map((c) => ({ id: c.id, name: c.preferred_name || [c.first_name, c.last_name].filter(Boolean).join(" ") }));
  return NextResponse.json({
    data: { sessions, children, incident_types: INCIDENT_TYPES, active: sessions.find((s) => s.incident_status === "active") ?? null, disclaimer: INCIDENT_DISCLAIMER },
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as any;
  const child_id = String(body.child_id ?? "").trim();
  const incident_type = String(body.incident_type ?? "").trim();
  const risk = String(body.immediate_risk_level ?? "medium");

  if (!child_id) return NextResponse.json({ ok: false, error: "Select the child first." }, { status: 400 });
  if (!INCIDENT_TYPES.some((t) => t.key === incident_type)) {
    return NextResponse.json({ ok: false, error: "Select an incident type." }, { status: 400 });
  }
  const store = getStore() as any;
  if (!((store.youngPeople ?? []) as any[]).some((c) => c.id === child_id)) {
    return NextResponse.json({ ok: false, error: "Unknown child." }, { status: 400 });
  }

  const session = startSession({
    child_id, incident_type,
    immediate_risk_level: (RISKS.has(risk) ? risk : "medium") as RiskLevel,
    user_id: currentUserId(req),
  });
  return NextResponse.json({ ok: true, data: session }, { status: 201 });
}

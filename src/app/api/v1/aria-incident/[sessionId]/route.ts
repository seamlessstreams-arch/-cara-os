// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara INCIDENT MODE · SESSION API
// GET   /api/v1/aria-incident/[sessionId]  → full live bundle (timeline, checklist,
//                                            prompts, quality gate, child voice)
// PATCH /api/v1/aria-incident/[sessionId]  → { action: "end" | "notify_manager" |
//                                            "set_risk" | "toggle_step", ... }
//
// Manager notification records intent and creates a timeline entry — it never
// auto-sends anything externally.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { persistIncidentSessionUpdate } from "@/lib/supabase/incident-persist";
import { NextResponse } from "next/server";
import { findSession, buildSessionBundle, addTimelineEntry, currentUserId, logIncidentAudit } from "@/lib/aria-incident/incident-service";
import type { RiskLevel } from "@/lib/aria-incident/aria-incident-engine";

const RISKS = new Set(["low", "medium", "high"]);

export async function GET(_req: Request, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const session = findSession(sessionId);
  if (!session) return NextResponse.json({ ok: false, error: "Session not found." }, { status: 404 });
  return NextResponse.json({ data: buildSessionBundle(session) });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await ctx.params;
  const session = findSession(sessionId);
  if (!session) return NextResponse.json({ ok: false, error: "Session not found." }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as any;
  const user_id = currentUserId(req);
  const now = new Date().toISOString();
  const action = String(body.action ?? "");

  if (action === "end") {
    if (!session.ended_at) {
      session.ended_at = now;
      session.incident_status = "ended";
      session.updated_at = now;
      logIncidentAudit({ action_type: "incident_ended", user_id, child_id: session.child_id, source_id: session.id });
    }
  } else if (action === "notify_manager") {
    session.manager_notified = true;
    session.manager_notified_at = session.manager_notified_at ?? now;
    session.updated_at = now;
    addTimelineEntry({ session, entry_type: "manager_notification", raw_text: String(body.note ?? "Manager notified."), user_id });
    logIncidentAudit({ action_type: "manager_notified", user_id, child_id: session.child_id, source_id: session.id });
  } else if (action === "set_risk") {
    const risk = String(body.risk ?? "");
    if (!RISKS.has(risk)) return NextResponse.json({ ok: false, error: "Invalid risk level." }, { status: 400 });
    const prev = session.immediate_risk_level;
    session.immediate_risk_level = risk as RiskLevel;
    session.updated_at = now;
    if (prev !== risk) addTimelineEntry({ session, entry_type: "risk_change", raw_text: `Immediate risk reassessed: ${prev} → ${risk}.`, user_id });
  } else if (action === "toggle_step") {
    const step = String(body.step ?? "").trim();
    if (!step) return NextResponse.json({ ok: false, error: "Missing step key." }, { status: 400 });
    session.workflow_progress[step] = !session.workflow_progress[step];
    session.updated_at = now;
  } else {
    return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
  }

  // Durable mirror of whichever mutation just happened (best-effort).
  void persistIncidentSessionUpdate({
    id: session.id,
    ended_at: session.ended_at,
    incident_status: session.incident_status,
    manager_notified: session.manager_notified,
    manager_notified_at: session.manager_notified_at,
    immediate_risk_level: session.immediate_risk_level,
    workflow_progress: session.workflow_progress,
  });

  return NextResponse.json({ ok: true, data: buildSessionBundle(session) });
}

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara MANAGER OVERSIGHT API (slice C)
// GET  /api/v1/cara-manager-oversight
//        → live-derived alerts (with resolve/dismiss state), AI-assisted records
//          awaiting approval, pattern insights, summary
// POST /api/v1/cara-manager-oversight
//        { action: "set_alert_status", key, status: "resolved"|"dismissed"|"open" }
//        { action: "mark_reviewed", review_id }   → manager sign-off on a record
//
// Alerts clear automatically when the practice happens; manager resolve/dismiss
// is a judgement call and is audit-logged. Marking a record reviewed records the
// manager's approval (who + when) on the preserved raw/AI/final versions.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  deriveManagerAlerts, detectPatterns, oversightSummary, OVERSIGHT_DISCLAIMER,
  type AlertStateRecord, type OversightInput,
} from "@/lib/cara-incident/manager-oversight-engine";
import { currentUserId, logIncidentAudit, childName, staffNameOf } from "@/lib/cara-incident/incident-service";
import type { CaraRecordingReview } from "@/lib/cara-incident/cara-incident-engine";
import { readJsonBody } from "@/lib/http/read-json";

function oversightInput(): OversightInput {
  const store = getStore() as any;
  return {
    sessions: store.caraIncidentSessions ?? [],
    entries: store.caraIncidentTimeline ?? [],
    reviews: store.caraRecordingReviews ?? [],
    restoratives: store.caraRestorativeConversations ?? [],
    reflections: store.caraPostIncidentReflections ?? [],
    alertStates: store.caraManagerAlertStates ?? [],
    today: new Date().toISOString().slice(0, 10),
  };
}

export async function GET() {
  const input = oversightInput();
  const alerts = deriveManagerAlerts(input).map((a) => ({
    ...a,
    child_name: a.child_id ? childName(a.child_id) : null,
  }));
  const patterns = detectPatterns(input).map((p) => ({
    ...p,
    child_name: p.child_id ? childName(p.child_id) : null,
  }));
  const awaiting = input.reviews
    .filter((r) => r.manager_review_required && !r.manager_reviewed_at)
    .map((r) => ({ ...r, child_name: childName(r.child_id), staff_name: staffNameOf(r.user_id) }));
  const summary = oversightSummary(alerts, patterns, awaiting.length);

  return NextResponse.json({ data: { summary, alerts, patterns, awaiting_review: awaiting, disclaimer: OVERSIGHT_DISCLAIMER } });
}

export async function POST(req: Request) {
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  const body = __parsed.data as any;
  const user_id = currentUserId(req);
  const store = getStore() as any;
  const now = new Date().toISOString();
  const action = String(body.action ?? "");

  if (action === "set_alert_status") {
    const key = String(body.key ?? "").trim();
    const status = String(body.status ?? "");
    if (!key || !["resolved", "dismissed", "open"].includes(status)) {
      return NextResponse.json({ ok: false, error: "Invalid alert key or status." }, { status: 400 });
    }
    store.caraManagerAlertStates = store.caraManagerAlertStates ?? [];
    const states: AlertStateRecord[] = store.caraManagerAlertStates;
    const existing = states.find((s) => s.id === key);
    if (status === "open") {
      store.caraManagerAlertStates = states.filter((s) => s.id !== key); // reopen = remove the override
    } else if (existing) {
      existing.status = status as AlertStateRecord["status"];
      existing.resolved_by_user_id = user_id;
      existing.resolved_at = now;
    } else {
      states.push({ id: key, status: status as AlertStateRecord["status"], resolved_by_user_id: user_id, resolved_at: now });
    }
    logIncidentAudit({ action_type: "alert_resolved", user_id, source_id: key, note: `status=${status}` });
    return NextResponse.json({ ok: true });
  }

  if (action === "mark_reviewed") {
    const review_id = String(body.review_id ?? "").trim();
    const review = ((store.caraRecordingReviews ?? []) as CaraRecordingReview[]).find((r) => r.id === review_id);
    if (!review) return NextResponse.json({ ok: false, error: "Record not found." }, { status: 404 });
    if (!review.manager_reviewed_at) {
      review.manager_reviewed_by = user_id;
      review.manager_reviewed_at = now;
      review.updated_at = now;
      logIncidentAudit({ action_type: "manager_review_completed", user_id, child_id: review.child_id, source_id: review.id, approval_status: "approved" });
    }
    return NextResponse.json({ ok: true, data: { review_id, manager_reviewed_at: review.manager_reviewed_at } });
  }

  return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
}

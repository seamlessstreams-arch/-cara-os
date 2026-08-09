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
import { dal } from "@/lib/db";
import {
  deriveManagerAlerts, detectPatterns, oversightSummary, OVERSIGHT_DISCLAIMER,
  type AlertStateRecord, type OversightInput,
} from "@/lib/cara-incident/manager-oversight-engine";
import { currentUserId, logIncidentAudit, childName, staffNameOf } from "@/lib/cara-incident/incident-service";
import type { CaraRecordingReview } from "@/lib/cara-incident/cara-incident-engine";
import { readJsonBody } from "@/lib/http/read-json";
import { todayStr } from "@/lib/utils";

async function oversightInput(): Promise<OversightInput> {
  const [sessions, entries, reviews, restoratives, reflections, alertStates] = await Promise.all([
    dal.caraIncidentSessions.findAll(), dal.caraIncidentTimeline.findAll(),
    dal.caraRecordingReviews.findAll(), dal.caraRestorativeConversations.findAll(),
    dal.caraPostIncidentReflections.findAll(), dal.caraManagerAlertStates.findAll(),
  ]);
  return {
    sessions: sessions ?? [],
    entries: entries ?? [],
    reviews: reviews ?? [],
    restoratives: restoratives ?? [],
    reflections: reflections ?? [],
    alertStates: alertStates ?? [],
    today: todayStr(),
  };
}

export async function GET() {
  const input = await oversightInput();
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
  const now = new Date().toISOString();
  const action = String(body.action ?? "");

  if (action === "set_alert_status") {
    const key = String(body.key ?? "").trim();
    const status = String(body.status ?? "");
    if (!key || !["resolved", "dismissed", "open"].includes(status)) {
      return NextResponse.json({ ok: false, error: "Invalid alert key or status." }, { status: 400 });
    }
    if (status === "open") {
      await dal.caraManagerAlertStates.removeById(key); // reopen = remove the override
    } else {
      await dal.caraManagerAlertStates.save({
        id: key, status: status as AlertStateRecord["status"], resolved_by_user_id: user_id, resolved_at: now,
      });
    }
    logIncidentAudit({ action_type: "alert_resolved", user_id, source_id: key, note: `status=${status}` });
    return NextResponse.json({ ok: true });
  }

  if (action === "mark_reviewed") {
    const review_id = String(body.review_id ?? "").trim();
    const existing = (await dal.caraRecordingReviews.findById(review_id)) as CaraRecordingReview | null;
    if (!existing) return NextResponse.json({ ok: false, error: "Record not found." }, { status: 404 });
    let review = existing;
    if (!existing.manager_reviewed_at) {
      review = (await dal.caraRecordingReviews.update(review_id, {
        manager_reviewed_by: user_id, manager_reviewed_at: now, updated_at: now,
      })) as CaraRecordingReview;
      logIncidentAudit({ action_type: "manager_review_completed", user_id, child_id: existing.child_id, source_id: existing.id, approval_status: "approved" });
    }
    return NextResponse.json({ ok: true, data: { review_id, manager_reviewed_at: review.manager_reviewed_at } });
  }

  return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
}

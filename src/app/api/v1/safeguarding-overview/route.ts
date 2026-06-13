// CARA — GET /api/v1/safeguarding-overview
// The home's open safeguarding picture, computed deterministically from the
// live store (incidents, missing, risk, LADO, notifiable events).
import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { computeSafeguardingOverview } from "@/lib/engines/safeguarding-overview-engine";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const store = getStore() as any;
  const today = new Date().toISOString().slice(0, 10);
  // Optional child scope: ?childId=X narrows every section to one child.
  const childId = new URL(req.url).searchParams.get("childId");
  const forChild = (cid: any) => !childId || String(cid) === childId;
  const ladoForChild = (ids: any[]) => !childId || (Array.isArray(ids) && ids.map(String).includes(childId));

  const ypById = new Map<string, string>(
    (store.youngPeople ?? []).map((y: any) => [String(y.id), y.preferred_name || y.first_name || "Unknown"]),
  );
  const resolveChild = (id: string | null) => (id ? ypById.get(String(id)) ?? null : null);

  const result = computeSafeguardingOverview({
    today,
    incidents: (store.incidents ?? []).filter((i: any) => forChild(i.child_id)).map((i: any) => ({
      id: String(i.id),
      child_id: String(i.child_id),
      type: String(i.type ?? "incident"),
      severity: String(i.severity ?? "low"),
      date: String(i.date ?? "").slice(0, 10),
      status: String(i.status ?? "open"),
      requires_oversight: !!i.requires_oversight,
      oversight_at: i.oversight_at ?? null,
    })),
    missing: (store.missingEpisodes ?? []).filter((m: any) => forChild(m.child_id)).map((m: any) => ({
      id: String(m.id),
      child_id: String(m.child_id),
      date_missing: String(m.date_missing ?? "").slice(0, 10),
      date_returned: m.date_returned ? String(m.date_returned).slice(0, 10) : null,
      risk_level: String(m.risk_level ?? "medium"),
      return_interview_completed: !!m.return_interview_completed,
    })),
    risk: (store.riskAssessments ?? []).filter((r: any) => forChild(r.child_id)).map((r: any) => ({
      id: String(r.id),
      child_id: String(r.child_id),
      domain: String(r.domain ?? "general"),
      current_level: String(r.current_level ?? "medium"),
      status: String(r.status ?? "current"),
      review_date: r.review_date ? String(r.review_date).slice(0, 10) : "",
    })),
    lado: (store.ladoReferrals ?? []).filter((l: any) => ladoForChild(l.child_ids)).map((l: any) => ({
      id: String(l.id),
      child_ids: Array.isArray(l.child_ids) ? l.child_ids.map(String) : [],
      status: String(l.status ?? "initial_assessment"),
      date_referred: String(l.date_referred ?? "").slice(0, 10),
      closed_date: l.closed_date ? String(l.closed_date).slice(0, 10) : null,
      allegation_type: String(l.allegation_type ?? "allegation"),
    })),
    notifiable: (store.notifiableEvents ?? []).filter((n: any) => forChild(n.child_id)).map((n: any) => ({
      id: String(n.id),
      child_id: n.child_id ? String(n.child_id) : null,
      date: String(n.date ?? "").slice(0, 10),
      event_type: String(n.event_type ?? "event"),
      ofsted_status: String(n.ofsted_status ?? "pending"),
    })),
    resolveChild,
  });

  return NextResponse.json({ data: result });
}

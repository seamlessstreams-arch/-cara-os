// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME CARE EVENT QUALITY INTELLIGENCE API ROUTE
// GET /api/v1/home-care-event-quality-intelligence
// Synthesises care events, routes, and audit logs to assess recording quality,
// verification compliance, routing effectiveness, and audit trail completeness.
// CHR 2015 Reg 12, 36. SCCIF: "Experiences and progress of children."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeCareEventQuality,
  type CareEventRecordInput,
} from "@/lib/engines/home-care-event-quality-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const youngPeople = (store.youngPeople ?? []) as any[];
    const total_children = youngPeople.length;
    const staff = (store.staff ?? []) as any[];
    const total_staff = staff.filter((s: any) => s.is_active !== false).length;

    const rawEvents = (store.careEvents ?? []) as any[];
    const rawRoutes = (store.careEventRoutes ?? []) as any[];
    const rawAudit = (store.careEventAuditLog ?? []) as any[];

    // Group routes and audit entries by care_event_id
    const routesByEvent = new Map<string, any[]>();
    for (const r of rawRoutes) {
      const eid = r.care_event_id ?? "";
      if (!routesByEvent.has(eid)) routesByEvent.set(eid, []);
      routesByEvent.get(eid)!.push(r);
    }
    const auditByEvent = new Map<string, any[]>();
    for (const a of rawAudit) {
      const eid = a.care_event_id ?? "";
      if (!auditByEvent.has(eid)) auditByEvent.set(eid, []);
      auditByEvent.get(eid)!.push(a);
    }

    const events: CareEventRecordInput[] = rawEvents.map((e: any) => {
      const routes = routesByEvent.get(e.id) ?? [];
      const audits = auditByEvent.get(e.id) ?? [];
      const routesCompleted = routes.filter((r: any) => r.status === "completed").length;
      const routesFailed = routes.filter((r: any) => r.status === "failed" || (r.error_message && r.error_message.trim().length > 0)).length;
      const timeSaved = routes.reduce((sum: number, r: any) => sum + (r.time_saved_minutes ?? 0), 0);

      return {
        id: e.id ?? "",
        child_id: e.child_id ?? "",
        staff_id: e.staff_id ?? "",
        date: (e.created_at ?? today).toString().slice(0, 10),
        category: e.category ?? "general",
        has_content: !!(e.content && e.content.trim().length > 0),
        is_verified: !!(e.verified_by && e.verified_by.trim().length > 0),
        is_locked: !!(e.locked_by && e.locked_by.trim().length > 0),
        has_return_note: !!(e.returned_by && e.returned_by.trim().length > 0),
        route_count: routes.length,
        routes_completed: routesCompleted,
        routes_failed: routesFailed,
        audit_trail_count: audits.length,
        time_saved_minutes: timeSaved,
      };
    });

    const result = computeHomeCareEventQuality({ today, total_children, total_staff, events });
    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}

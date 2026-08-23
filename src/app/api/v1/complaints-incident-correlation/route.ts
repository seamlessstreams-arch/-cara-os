// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMPLAINTS ↔ INCIDENT CORRELATION API ROUTE
// GET /api/v1/complaints-incident-correlation
//
// Cross-dataset early-warning intelligence: correlates each child's complaints
// with their incidents to surface where complaints were a leading indicator,
// where the two converge, and where incidents occur without any complaint
// (a children's-voice concern).
//
// CHR 2015 Reg 22 (complaints), Reg 12 (protection), Reg 7 (wishes & feelings),
// Reg 34 (notifications). SCCIF: "How well children are helped and protected".
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import {
  computeComplaintsIncidentCorrelation,
  type ChildRef,
  type ComplaintCorrInput,
  type IncidentCorrInput,
} from "@/lib/complaints-incident-correlation/complaints-incident-correlation-engine";

const d = (v: unknown, fallback = ""): string => (v == null ? fallback : v.toString().slice(0, 10));

export async function GET() {
  const [complaintsList, incidentsList, youngPeopleList] = await Promise.all([
      dal.complaints.findAll(),
      dal.incidents.findAll(),
      dal.youngPeople.findAll(),
    ]);

  const children: ChildRef[] = ((youngPeopleList ?? []) as any[]).map((yp) => ({
    id: yp.id,
    name: yp.preferred_name || `${yp.first_name ?? ""} ${yp.last_name ?? ""}`.trim() || yp.id,
  }));

  const complaints: ComplaintCorrInput[] = ((complaintsList ?? []) as any[])
    .filter((c) => c.child_id)
    .map((c) => ({
      child_id: c.child_id,
      date: d(c.date_received ?? c.created_at),
      category: c.category ?? "other",
      includes_safeguarding_element: !!c.includes_safeguarding_element,
      status: c.status ?? "received",
    }));

  const incidents: IncidentCorrInput[] = ((incidentsList ?? []) as any[])
    .filter((i) => i.child_id)
    .map((i) => ({
      child_id: i.child_id,
      date: d(i.date ?? i.created_at),
      type: i.type ?? "other",
      severity: i.severity ?? "low",
    }));

  const result = computeComplaintsIncidentCorrelation({ children, complaints, incidents });

  return NextResponse.json({ data: result });
}

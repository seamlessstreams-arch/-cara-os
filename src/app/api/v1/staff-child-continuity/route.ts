// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF–CHILD CONTINUITY OF CARE API ROUTE
// GET /api/v1/staff-child-continuity
//
// Measures the relational continuity of each child's care: is an active key
// worker assigned, are they actually delivering the key-working sessions, and
// how concentrated/recent is the relationship?
//
// CHR 2015 Reg 11 (positive relationships), Reg 12, Reg 6. SCCIF: consistent,
// trusted adults who know the child well.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeStaffChildContinuity,
  type ContinuityChildInput,
  type ContinuityStaffInput,
  type ContinuitySessionInput,
} from "@/lib/staff-child-continuity/staff-child-continuity-engine";

const d = (v: unknown, fallback = ""): string => (v == null ? fallback : v.toString().slice(0, 10));

export async function GET() {
  const store = getStore();

  const children: ContinuityChildInput[] = ((store.youngPeople ?? []) as any[])
    .filter((yp: any) => yp.status === "current")
    .map((yp: any) => ({
      id: yp.id,
      name: yp.preferred_name || `${yp.first_name ?? ""} ${yp.last_name ?? ""}`.trim() || yp.id,
      key_worker_id: yp.key_worker_id ?? null,
      secondary_worker_id: yp.secondary_worker_id ?? null,
    }));

  const staff: ContinuityStaffInput[] = ((store.staff ?? []) as any[]).map((s: any) => ({
    id: s.id,
    name: s.full_name || `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.id,
    active: s.is_active ?? (s.employment_status ? s.employment_status === "active" : true),
  }));

  const sessions: ContinuitySessionInput[] = ((store.keyWorkingSessions ?? []) as any[])
    .filter((k: any) => k.child_id && k.staff_id)
    .map((k: any) => ({
      child_id: k.child_id,
      staff_id: k.staff_id,
      date: d(k.date ?? k.created_at),
    }));

  const result = computeStaffChildContinuity({ children, staff, sessions });

  return NextResponse.json({ data: result });
}

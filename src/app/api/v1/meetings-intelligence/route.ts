// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MEETINGS & CHILDREN'S VOICE INTELLIGENCE API ROUTE
// GET /api/v1/meetings-intelligence
// Returns children's participation analysis: meeting attendance, action
// tracking, child voice engagement, and ARIA intelligence.
// Reg 7, Reg 16, SCCIF.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeMeetingsIntelligence,
  type HouseMeetingInput,
  type ChildRef,
  type StaffRef,
} from "@/lib/engines/meetings-intelligence-engine";

export async function GET() {
  const store = getStore();

  const meetings: HouseMeetingInput[] = (store.houseMeetings ?? []).map((m: any) => ({
    id: m.id,
    date: typeof m.date === "string" ? m.date.slice(0, 10) : m.date,
    meeting_type: m.meeting_type,
    chair_person: m.chair_person,
    children_present: m.children_present ?? [],
    children_absent: m.children_absent ?? [],
    staff_present: m.staff_present ?? [],
    child_feedback: m.child_feedback ?? [],
    actions_from_previous: (m.actions_from_previous ?? []).map((a: any) => ({
      action: a.action,
      owner: a.owner,
      completed: a.completed ?? false,
    })),
    new_actions: (m.new_actions ?? []).map((a: any) => ({
      action: a.action,
      owner: a.owner,
      due_date: typeof a.due_date === "string" ? a.due_date.slice(0, 10) : a.due_date,
    })),
    duration: m.duration ?? 0,
  }));

  const children: ChildRef[] = (store.youngPeople ?? []).map((yp: any) => ({
    id: yp.id,
    name: yp.preferred_name ?? `${yp.first_name} ${yp.last_name}`,
  }));

  const staff: StaffRef[] = (store.staff ?? [])
    .filter((s: any) => s.is_active)
    .map((s: any) => ({
      id: s.id,
      name: s.full_name ?? `${s.first_name} ${s.last_name}`,
    }));

  const result = computeMeetingsIntelligence({ meetings, children, staff });

  return NextResponse.json({ data: result });
}

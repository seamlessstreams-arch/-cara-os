// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RESTRAINT INTELLIGENCE API ROUTE
// GET /api/v1/restraint-intelligence
// Returns physical intervention frequency, duration, patterns, compliance,
// injury tracking, and ARIA restraint reduction intelligence.
// Reg 20/35 — restraint as last resort, positive behaviour management.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeRestraintIntelligence,
  type ChildInput,
  type RestraintInput,
} from "@/lib/engines/restraint-intelligence-engine";

export async function GET() {
  const store = getStore();

  // ── Map children ────────────────────────────────────────────────────────────
  const children: ChildInput[] = store.youngPeople.map((yp) => ({
    id: yp.id,
    name: yp.preferred_name ?? yp.first_name,
  }));

  // ── Map restraints ──────────────────────────────────────────────────────────
  const restraints: RestraintInput[] = store.restraints.map((r) => ({
    id: r.id,
    date: r.date,
    start_time: r.start_time,
    end_time: r.end_time,
    duration_minutes: r.duration,
    child_id: r.child_id,
    staff_involved: r.staff_involved.map((s) => ({
      staff_id: s.staff_id,
      role: (s.role ?? "support") as "lead" | "support" | "witness",
      team_teach_trained: (s as Record<string, unknown>).team_teach_trained !== false,
    })),
    reason: r.reason as RestraintInput["reason"],
    restraint_type: r.restraint_type as RestraintInput["restraint_type"],
    de_escalation_attempts: r.de_escalation_attempts,
    injuries: r.injuries.map((inj) => ({
      person: inj.person,
      description: (inj as Record<string, unknown>).description as string ?? (inj as Record<string, unknown>).injury as string ?? "",
    })),
    child_debriefed: r.child_debriefed,
    staff_debriefed: r.staff_debriefed,
    review_status: r.review_status === "reviewed" ? "reviewed" :
                   r.review_status === "referred_lado" ? "referred" : "pending",
    body_map_completed: r.body_map_completed,
    medical_check_completed: r.medical_check_completed,
    notifications_sent: r.notifications_sent.length,
  }));

  // ── Run engine ──────────────────────────────────────────────────────────────
  const result = computeRestraintIntelligence({ children, restraints });

  return NextResponse.json({ data: result });
}

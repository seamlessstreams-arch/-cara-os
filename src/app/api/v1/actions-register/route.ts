// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — UNIFIED ACTIONS REGISTER API ROUTE
// GET /api/v1/actions-register
//
// Harvests AGREED ACTIONS from every forum (supervisions, LAC reviews, multi-
// agency meetings, house meetings, Reg 44 visits, QA audits, medication-error
// remedial actions, key-work follow-ups) into one normalised register, then
// ranks/rolls them up via the pure engine. CHR 2015 Reg 13 / SCCIF — leaders
// follow through on what was agreed.
//
// `done` is taken from each source's own status — never inferred.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { getStaffName } from "@/lib/seed-data";
import { computeActionsRegister, type ActionInput } from "@/lib/engines/actions-register-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  const yp = (store.youngPeople ?? []) as any[];
  const childName = (id?: string | null): string | undefined => {
    if (!id) return undefined;
    const c = yp.find((c) => c.id === id);
    return c ? (c.preferred_name || [c.first_name, c.last_name].filter(Boolean).join(" ") || id) : id;
  };
  // Resolve a staff_id → name; pass non-staff_id owner strings (roles/names) through verbatim.
  const ownerName = (v?: string | null): string | undefined => {
    if (!v) return undefined;
    return typeof v === "string" && v.startsWith("staff_") ? getStaffName(v) : v;
  };
  const iso = (v: any): string | undefined => (v ? String(v).slice(0, 10) : undefined);
  const arr = (v: any): any[] => (Array.isArray(v) ? v : []);

  const actions: ActionInput[] = [];

  // 1. Medication errors → remedial_actions[] (owner = staff_id) ──────────────
  for (const e of arr(store.medicationErrors)) {
    arr(e.remedial_actions).forEach((a: any, i: number) => {
      actions.push({
        id: `mederr-${e.id}-${i}`, text: String(a.action ?? "").trim(),
        source: "Medication error", source_key: "medication_error", source_href: "/medication-errors",
        owner: ownerName(a.owner), child_id: e.child_id ?? undefined, child_name: childName(e.child_id),
        due_date: iso(a.due_date), status_raw: a.status, done: a.status === "completed",
      });
    });
  }

  // 2. QA audits → actions[] (owner = staff_id, due = `deadline`) ──────────────
  for (const q of arr(store.qaAuditRecords)) {
    arr(q.actions).forEach((a: any, i: number) => {
      actions.push({
        id: `qa-${q.id}-${i}`, text: String(a.action ?? "").trim(),
        source: "QA audit", source_key: "qa_audit", source_href: "/audits",
        owner: ownerName(a.owner), due_date: iso(a.deadline), status_raw: a.status, done: a.status === "completed",
      });
    });
  }

  // 3. Multi-agency meetings → action_items[] (owner = name/role string) ───────
  for (const m of arr(store.multiAgencyMeetings)) {
    arr(m.action_items).forEach((a: any, i: number) => {
      actions.push({
        id: `mam-${m.id}-${i}`, text: String(a.action ?? "").trim(),
        source: "Multi-agency meeting", source_key: "multi_agency_meeting", source_href: "/multi-agency-meetings",
        owner: ownerName(a.owner), child_id: m.child_id ?? undefined, child_name: childName(m.child_id),
        due_date: iso(a.due_date), status_raw: a.status, done: a.status === "completed",
      });
    });
  }

  // 4. LAC reviews → actions_agreed[] (owner = role string, done = completed bool)
  for (const r of arr(store.lacReviews)) {
    arr(r.actions_agreed).forEach((a: any, i: number) => {
      actions.push({
        id: `lac-${r.id}-${i}`, text: String(a.action ?? "").trim(),
        source: "LAC review", source_key: "lac_review", source_href: "/lac-reviews",
        owner: ownerName(a.owner), child_id: r.child_id ?? undefined, child_name: childName(r.child_id),
        due_date: iso(a.due_date), status_raw: a.completed ? "completed" : "open", done: a.completed === true,
      });
    });
  }

  // 5. Reg 44 visit reports → recommendations[] (owner = RM, due = completed_at)
  const rmName = getStaffName("staff_darren");
  for (const v of arr(store.reg44VisitReports)) {
    arr(v.recommendations).forEach((a: any, i: number) => {
      actions.push({
        id: `reg44-${v.id}-${a.id ?? i}`, text: String(a.recommendation ?? "").trim(),
        source: "Reg 44 visit", source_key: "reg44_visit", source_href: "/reg44-visitor-reports",
        owner: rmName, due_date: iso(a.completed_at), status_raw: a.status, done: a.status === "completed",
      });
    });
  }

  // 6. Supervisions → actions_agreed[] (owner = staff_id) ─────────────────────
  for (const s of arr(store.supervisions)) {
    arr(s.actions_agreed).forEach((a: any, i: number) => {
      actions.push({
        id: `sup-${s.id}-${a.id ?? i}`, text: String(a.description ?? "").trim(),
        source: "Supervision", source_key: "supervision", source_href: "/supervisions",
        owner: ownerName(a.owner), due_date: iso(a.due_date), status_raw: a.status, done: a.status === "completed",
      });
    });
  }

  // 7. House meetings → new_actions[] (no done signal → false) + actions_from_previous[] (done = completed)
  for (const h of arr(store.houseMeetings)) {
    arr(h.new_actions).forEach((a: any, i: number) => {
      actions.push({
        id: `house-${h.id}-new-${i}`, text: String(a.action ?? "").trim(),
        source: "House meeting", source_key: "house_meeting", source_href: "/house-meetings",
        owner: ownerName(a.owner), due_date: iso(a.due_date), status_raw: "open", done: false,
      });
    });
    arr(h.actions_from_previous).forEach((a: any, i: number) => {
      actions.push({
        id: `house-${h.id}-prev-${i}`, text: String(a.action ?? "").trim(),
        source: "House meeting", source_key: "house_meeting", source_href: "/house-meetings",
        owner: ownerName(a.owner), status_raw: a.completed ? "completed" : "open", done: a.completed === true,
      });
    });
  }

  // 8. Key-work sessions → follow_up (owner = staff_id, done = follow_up_completed)
  for (const k of arr(store.keyWorkingSessions)) {
    if (k.follow_up && String(k.follow_up).trim()) {
      actions.push({
        id: `keywork-${k.id}`, text: String(k.follow_up).trim(),
        source: "Key-work follow-up", source_key: "keywork", source_href: "/key-working",
        owner: ownerName(k.staff_id), child_id: k.child_id ?? undefined, child_name: childName(k.child_id),
        due_date: iso(k.follow_up_date), status_raw: k.follow_up_completed ? "completed" : "open",
        done: k.follow_up_completed === true,
      });
    }
  }

  const result = computeActionsRegister({ today, actions: actions.filter((a) => a.text) });
  return NextResponse.json({ data: result });
}

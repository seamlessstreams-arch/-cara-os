// ══════════════════════════════════════════════════════════════════════════════
// CARA — SHIFT LIFECYCLE (doctrine 2.1.1)
//
// GET   /api/v1/shift-lifecycle             → the caller's current/most-recent shift
// GET   /api/v1/shift-lifecycle?shift_id=…  → a specific shift
// POST                                       → attest a check only you can answer
// PATCH                                      → sign the shift off
//
// This route's real job is assembling EVIDENCE honestly. Each derived check
// carries `visible` — whether THIS HOME records that kind of thing at all.
// Scope every visibility test to the shift's own home: another home's handover
// records are no evidence that this one keeps any, and on a freshly provisioned
// home the honest answer is "Cara can't see this yet" rather than a wall of red
// for a shift that was worked properly.
//
// Reads are always on. WRITES are gated behind the opt-in flag
// shift_lifecycle_write (default OFF) — the surface ships visible, the pen
// ships dark. Even enabled, sign-off is never REFUSED: with handover or records
// outstanding it asks for a reason and records it (the soft gate).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { readJsonBody } from "@/lib/http/read-json";
import { getRequestIdentity } from "@/lib/auth-guard";
import { getStore } from "@/lib/db/store";
import { generateId } from "@/lib/utils";
import { isFeatureEnabled } from "@/lib/config/feature-flags";
import {
  buildShiftLifecycle,
  validateSignOff,
  LIFECYCLE_CHECKS,
  type CheckEvidence,
  type CheckId,
  type ShiftLifecycleRecord,
} from "@/lib/shift-lifecycle/shift-lifecycle-engine";

export const dynamic = "force-dynamic";

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const OPEN_TASK = (s: string) => s !== "completed" && s !== "cancelled";

/** The shift this person is on now, or the last one they worked. */
function resolveShift(staffId: string, shiftId: string | null) {
  const shifts = (getStore().shifts ?? []).filter((s) => s.staff_id === staffId);
  if (shiftId) return shifts.find((s) => s.id === shiftId) ?? null;
  const today = new Date().toISOString().slice(0, 10);
  return (
    shifts.find((s) => s.date === today && (s.status === "in_progress" || s.status === "confirmed")) ??
    [...shifts].sort((a, b) => b.date.localeCompare(a.date))[0] ??
    null
  );
}

/** Assemble what Cara can actually see for one shift.
 *
 *  `visible` asks "does this home keep records of this kind?", NOT "was it done
 *  this shift" — the difference between an honest gap in Cara and a false
 *  accusation against a team. */
function assembleEvidence(shift: {
  id: string;
  staff_id: string;
  date: string;
  home_id: string;
}): Partial<Record<CheckId, CheckEvidence>> {
  const store = getStore();
  // Scope to this home before asking "can Cara see this?" — another home's
  // records prove nothing about this one, and conflating them would let a busy
  // neighbour make a brand-new home look negligent.
  const inHome = <T extends { home_id?: string }>(rows: T[]): T[] =>
    shift.home_id ? rows.filter((r) => r.home_id === shift.home_id) : rows;

  const handovers = inHome(store.handovers ?? []);
  const dailyLog = inHome(store.dailyLog ?? []);
  const tasks = inHome(store.tasks ?? []);

  // ── Handovers. No records of them in this home ⇒ it may hand over verbally
  // or on paper. Cara has no standing to call that a gap.
  const homeKeepsHandovers = handovers.length > 0;
  const handoverIn = handovers.filter(
    (h) => h.shift_date === shift.date && (h.incoming_staff ?? []).includes(shift.staff_id),
  );
  const handoverOut = handovers.filter(
    (h) => h.shift_date === shift.date && (h.outgoing_staff ?? []).includes(shift.staff_id),
  );

  // ── Daily records. Every child living here should have their day written.
  const homeKeepsDailyLogs = dailyLog.length > 0;
  const children = (store.youngPeople ?? []).filter(
    (c) => c.status === "current" && (!shift.home_id || c.home_id === shift.home_id),
  );
  const logsToday = dailyLog.filter((l) => l.date === shift.date);
  const childName = (c: { first_name: string; preferred_name: string | null }) =>
    c.preferred_name || c.first_name;

  const missingLogs = children
    .filter((c) => !logsToday.some((l) => l.child_id === c.id))
    .map((c) => `${childName(c)} — nothing written for today yet`);
  const writtenLogs = children
    .filter((c) => logsToday.some((l) => l.child_id === c.id))
    .map((c) => `${childName(c)} — written up`);

  // ── Actions. Open and due by the end of this shift.
  const homeKeepsTasks = tasks.length > 0;
  const openDue = tasks
    .filter(
      (t) =>
        t.assigned_to === shift.staff_id &&
        OPEN_TASK(t.status) &&
        !!t.due_date &&
        t.due_date <= shift.date,
    )
    .map((t) => t.title);

  const myLogsThisShift = logsToday.filter((l) => l.staff_id === shift.staff_id);

  return {
    handover_read: {
      visible: homeKeepsHandovers,
      found: handoverIn.map((h) => `Handover at ${h.handover_time} from the ${h.shift_from} shift`),
      outstanding: [],
    },
    handover_written: {
      visible: homeKeepsHandovers,
      found: handoverOut
        .filter((h) => h.completed_at)
        .map((h) => `Handover to the ${h.shift_to} shift, completed`),
      // Only an outstanding item where a handover was started and left unfinished.
      // No record at all, in a home Cara can see handovers for, is still not
      // proof of absence mid-shift — it becomes visible at the end.
      outstanding: handoverOut.filter((h) => !h.completed_at).map((h) => `Handover to the ${h.shift_to} shift started, not completed`),
    },
    records_complete: {
      visible: homeKeepsDailyLogs,
      found: writtenLogs,
      outstanding: missingLogs,
    },
    records_current: {
      visible: homeKeepsDailyLogs,
      found:
        myLogsThisShift.length > 0
          ? [`${myLogsThisShift.length} entr${myLogsThisShift.length === 1 ? "y" : "ies"} written on this shift`]
          : [],
      outstanding: [], // never an accusation mid-shift
    },
    outstanding_actions: {
      visible: homeKeepsTasks,
      found: [],
      outstanding: openDue,
    },
    // Context for the checks only a human can answer — Cara offers what it knows
    // to help them think, and still takes their word for the answer.
    children_needs_reviewed: {
      visible: children.length > 0,
      found: children.map((c) => childName(c)),
      outstanding: [],
    },
  };
}

function findRecord(shiftId: string): ShiftLifecycleRecord | null {
  return (getStore().shiftLifecycleRecords ?? []).find((r) => r.shift_id === shiftId) ?? null;
}

function buildFor(staffId: string, shiftId: string | null) {
  const shift = resolveShift(staffId, shiftId);
  if (!shift) return null;
  const record = findRecord(shift.id);
  const lifecycle = buildShiftLifecycle({
    shift: {
      id: shift.id,
      staff_id: shift.staff_id,
      date: shift.date,
      shift_type: shift.shift_type,
      start_time: shift.start_time,
      end_time: shift.end_time,
    },
    evidence: assembleEvidence(shift),
    attested: (record?.attestations ?? []).map((a) => a.check_id),
    signedOffAt: record?.signed_off_at ?? null,
    overrideReason: record?.override_reason ?? null,
  });
  return { shift, lifecycle, record };
}

export async function GET(req: NextRequest) {
  try {
    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const url = new URL(req.url);
    const asked = url.searchParams.get("staff_id");
    const staffId = asked ?? identity.userId;

    if (
      asked &&
      asked !== identity.userId &&
      identity.role !== "registered_manager" &&
      identity.role !== "deputy_manager"
    ) {
      return NextResponse.json(
        { error: "Only a manager can look at someone else's shift lifecycle." },
        { status: 403 },
      );
    }

    const built = buildFor(staffId, url.searchParams.get("shift_id"));
    const staff = (getStore().staff ?? []).find((s) => s.id === staffId);

    if (!built) {
      return NextResponse.json({
        data: {
          staffId,
          staffName: staff?.full_name ?? staffId,
          shift: null,
          lifecycle: null,
          writeEnabled: isFeatureEnabled("shift_lifecycle_write"),
          message: "No shift on record for this person yet.",
        },
      });
    }

    return NextResponse.json({
      data: {
        staffId,
        staffName: staff?.full_name ?? staffId,
        shift: built.shift,
        lifecycle: built.lifecycle,
        writeEnabled: isFeatureEnabled("shift_lifecycle_write"),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Attest one of the checks only the person who was there can answer. */
export async function POST(req: NextRequest) {
  try {
    if (!isFeatureEnabled("shift_lifecycle_write")) {
      return NextResponse.json(
        { error: "Shift lifecycle writing is not enabled (shift_lifecycle_write)." },
        { status: 403 },
      );
    }
    const parsed = await readJsonBody(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const checkId = str(body.check_id);
    const check = LIFECYCLE_CHECKS.find((c) => c.id === checkId);
    if (!check) return NextResponse.json({ error: `Unknown check "${checkId}".` }, { status: 400 });
    if (check.kind !== "attested") {
      return NextResponse.json(
        { error: `"${check.label}" is derived from records — Cara reads it rather than asking you to tick it.` },
        { status: 400 },
      );
    }

    const built = buildFor(identity.userId, str(body.shift_id) || null);
    if (!built) return NextResponse.json({ error: "No shift found to record against." }, { status: 404 });

    const store = getStore();
    const now = new Date().toISOString();
    let record = findRecord(built.shift.id);
    if (!record) {
      record = {
        id: generateId("slc"),
        home_id: built.shift.home_id,
        shift_id: built.shift.id,
        staff_id: built.shift.staff_id,
        attestations: [],
        signed_off_by: null,
        signed_off_at: null,
        override_reason: null,
        overridden_blockers: [],
        created_at: now,
        updated_at: now,
      };
      store.shiftLifecycleRecords.push(record);
    }

    // A person's word, kept as theirs: who said it, and when.
    if (!record.attestations.some((a) => a.check_id === checkId)) {
      record.attestations.push({ check_id: checkId, attested_by: identity.userId, attested_at: now });
    }
    record.updated_at = now;

    const after = buildFor(identity.userId, built.shift.id);
    return NextResponse.json({ data: { lifecycle: after?.lifecycle ?? null } }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Sign the shift off. Never refused — with handover or records outstanding it
 *  asks for a reason, and that reason becomes the record. */
export async function PATCH(req: NextRequest) {
  try {
    if (!isFeatureEnabled("shift_lifecycle_write")) {
      return NextResponse.json(
        { error: "Shift lifecycle writing is not enabled (shift_lifecycle_write)." },
        { status: 403 },
      );
    }
    const parsed = await readJsonBody(req);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const identity = await getRequestIdentity(req);
    if (identity instanceof NextResponse) return identity;

    const built = buildFor(identity.userId, str(body.shift_id) || null);
    if (!built) return NextResponse.json({ error: "No shift found to sign off." }, { status: 404 });
    if (built.lifecycle.signedOffAt) {
      return NextResponse.json({ error: "This shift is already signed off." }, { status: 409 });
    }

    const reason = str(body.override_reason);
    const problem = validateSignOff(built.lifecycle.signOff, reason);
    if (problem) {
      // 422, not 403: this is a conversation, not a refusal — the same request
      // with a reason attached will be accepted.
      return NextResponse.json(
        { error: problem, requiresReason: true, blockers: built.lifecycle.signOff.blockers },
        { status: 422 },
      );
    }

    const store = getStore();
    const now = new Date().toISOString();
    let record = findRecord(built.shift.id);
    if (!record) {
      record = {
        id: generateId("slc"),
        home_id: built.shift.home_id,
        shift_id: built.shift.id,
        staff_id: built.shift.staff_id,
        attestations: [],
        signed_off_by: null,
        signed_off_at: null,
        override_reason: null,
        overridden_blockers: [],
        created_at: now,
        updated_at: now,
      };
      store.shiftLifecycleRecords.push(record);
    }
    record.signed_off_by = identity.userId;
    record.signed_off_at = now;
    record.override_reason = built.lifecycle.signOff.clear ? null : reason;
    record.overridden_blockers = built.lifecycle.signOff.blockers.map((b) => b.checkId);
    record.updated_at = now;

    const after = buildFor(identity.userId, built.shift.id);
    return NextResponse.json({ data: { lifecycle: after?.lifecycle ?? null } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

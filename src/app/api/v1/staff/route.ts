// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF BULK ENDPOINT (enriched)
//
// Returns all staff with computed fields matching StaffEnriched interface:
// supervision status, training counts, shift status, leave, tasks.
// Replaces catch-all which returned raw StaffMember without enrichment.
//
// GET /api/v1/staff?status=active&role=...&employment_type=...
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import { readJsonBody } from "@/lib/http/read-json";
import { requireFields } from "@/lib/http/require-fields";
import { requirePermissionAsync } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { todayStr } from "@/lib/utils";

export const dynamic = "force-dynamic";


function daysBetween(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const today = new Date(todayStr() + "T00:00:00Z").getTime();
  const target = new Date(dateStr + "T00:00:00Z").getTime();
  return Math.round((target - today) / 86_400_000);
}

export async function GET(req: NextRequest) {
  const today = todayStr();
  const { searchParams } = new URL(req.url);
  const filterStatus = searchParams.get("status");
  const filterRole = searchParams.get("role");
  const filterType = searchParams.get("employment_type");

  // ── Base staff list ────────────────────────────────────────────────────────
  let staffList = await dal.staff.findAll();

  if (filterStatus) {
    staffList = staffList.filter((s) => s.employment_status === filterStatus);
  }
  if (filterRole) {
    staffList = staffList.filter((s) => s.role === filterRole);
  }
  if (filterType) {
    staffList = staffList.filter((s) => s.employment_type === filterType);
  }

  // ── Pre-fetch shared collections once (avoid N+1) ─────────────────────────
  const todayShifts = await dal.shifts.findToday();
  const onLeaveToday = await dal.leave.findOnLeaveToday();
  const allTraining = await dal.training.findAll();
  const allTasks = await dal.tasks.findAll();

  // Index by staff_id for O(1) lookups
  const trainingByStaff = new Map<string, typeof allTraining>();
  for (const tr of allTraining) {
    const arr = trainingByStaff.get(tr.staff_id) ?? [];
    arr.push(tr);
    trainingByStaff.set(tr.staff_id, arr);
  }

  const tasksByStaff = new Map<string, typeof allTasks>();
  for (const t of allTasks) {
    if (!t.assigned_to) continue;
    const arr = tasksByStaff.get(t.assigned_to) ?? [];
    arr.push(t);
    tasksByStaff.set(t.assigned_to, arr);
  }

  const shiftByStaff = new Map<string, (typeof todayShifts)[0]>();
  for (const sh of todayShifts) {
    if (sh.staff_id) shiftByStaff.set(sh.staff_id, sh);
  }

  const onLeaveSet = new Set(onLeaveToday.map((l) => l.staff_id));

  // ── Enrich each staff member ──────────────────────────────────────────────
  const enriched = staffList.map((s) => {
    const todayShift = shiftByStaff.get(s.id) ?? null;
    const training = trainingByStaff.get(s.id) ?? [];
    const tasks = tasksByStaff.get(s.id) ?? [];

    const supervisionDaysUntilDue = daysBetween(s.next_supervision_due);
    const supervisionOverdue = supervisionDaysUntilDue !== null && supervisionDaysUntilDue < 0;

    const activeTasks = tasks.filter(
      (t) => t.status !== "completed" && t.status !== "cancelled"
    );

    return {
      ...s,
      is_on_shift_today: !!todayShift,
      today_shift_type: todayShift?.shift_type ?? null,
      today_shift_status: todayShift?.status ?? null,
      is_on_leave_today: onLeaveSet.has(s.id),
      supervision_overdue: supervisionOverdue,
      supervision_days_until_due: supervisionDaysUntilDue,
      training_total_count: training.length,
      training_expired_count: training.filter((t) => t.status === "expired").length,
      training_expiring_count: training.filter((t) => t.status === "expiring_soon").length,
      active_tasks: activeTasks.length,
      overdue_tasks: activeTasks.filter(
        (t) => t.due_date && t.due_date < today
      ).length,
      notifications_unread: 0, // placeholder — would be from notification store
    };
  });

  // ── Meta stats ────────────────────────────────────────────────────────────
  const meta = {
    total: enriched.length,
    on_shift: enriched.filter((s) => s.is_on_shift_today).length,
    on_leave: enriched.filter((s) => s.is_on_leave_today).length,
    bank: enriched.filter((s) => s.employment_type === "bank").length,
    supervision_overdue: enriched.filter((s) => s.supervision_overdue).length,
    training_expired: enriched.filter((s) => s.training_expired_count > 0).length,
  };

  return NextResponse.json({ data: enriched, meta });
}

// POST /api/v1/staff — create a staff member.
// This dedicated route shadows the catch-all dispatcher for /staff, so without
// a POST here "Add staff member" 405s before any create logic can run. Persists
// via the dual-mode dal (staff_members on a live tenant, the store in demo);
// createStaffMember strips the GENERATED full_name column and fills NOT NULL
// defaults so a minimal form can create a seat.
export async function POST(req: NextRequest) {
  // Creating a staff member is a MANAGE_STAFF action, exactly as editing one is
  // in the sibling [id] PATCH route. This handler had no check of any kind —
  // not a session, not a role — while `role` and `auth_user_id` were both
  // settable from the request body. Any signed-in user could therefore mint a
  // staff row with role "super_admin" bound to a second auth account they
  // controlled, sign in on it, and be an administrator. Middleware requires a
  // session for /api/v1/*, so this was never open to the world — it was open to
  // everyone who had a login, which is the same thing from inside.
  const auth = await requirePermissionAsync(req, PERMISSIONS.MANAGE_STAFF);
  if (auth instanceof NextResponse) return auth;

  const parsed = await readJsonBody(req);
  if (!parsed.ok) return parsed.response;
  const __missing = requireFields(parsed.data, ["full_name"]);
  if (__missing) return __missing;

  // Strip the login binding at the boundary, not just in the column allowlist.
  // The allowlist governs the SUPABASE writer only; the in-memory store used in
  // demo takes the body verbatim, so without this the two modes would disagree
  // about whether a request can grant itself an identity. They must not.
  const { auth_user_id: _ignoredAuthUserId, ...body } =
    parsed.data as Record<string, unknown>;

  try {
    const created = await dal.staff.create(body);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    console.error("[api/staff] create failed:", err);
    return NextResponse.json({ error: "Could not create the staff member" }, { status: 500 });
  }
}

// CARA — /api/v1/rota/patterns
//   GET            → list shift patterns (with staff names) + staff for the picker
//   POST   {body}  → create a pattern
//   PATCH  {id,…}  → update a pattern (incl. activate / deactivate)
//   DELETE ?id=…   → remove a pattern
// Lets a manager SET each staff member's working pattern in-app (RM Mon–Fri, a
// deputy 2-on/4-off, waking nights, …). Patterns drive the cover view and the
// generate-&-publish flow, so editing here flows straight through.
import { NextResponse } from "next/server";
import { dal } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { describePattern, type ShiftPattern, type ShiftPatternKind } from "@/lib/rota/shift-patterns";
import { readJsonBody } from "@/lib/http/read-json";

export const dynamic = "force-dynamic";

const SHIFT_TYPES = new Set(["day", "sleep_in", "waking_night", "short", "handover", "on_call", "training_day"]);
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

function staffNameMap(staffList: any[]): Map<string, string> {
  return new Map<string, string>(
    (staffList ?? []).map((m: any) => [String(m.id), m.full_name || `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || "Unknown"]),
  );
}

function withName(p: ShiftPattern, names: Map<string, string>) {
  return { ...p, staff_name: names.get(p.staff_id) ?? p.staff_id, description: describePattern(p) };
}

/** Validate + normalise an incoming pattern body. Returns {pattern} or {error}. */
function buildPattern(body: any, staffList: any[], existing?: ShiftPattern): { pattern?: ShiftPattern; error?: string } {
  const staff_id = String(body.staff_id ?? existing?.staff_id ?? "");
  if (!staff_id) return { error: "A staff member is required." };
  if (!(staffList ?? []).some((m: any) => String(m.id) === staff_id)) return { error: "Unknown staff member." };

  const kind: ShiftPatternKind = body.kind === "rotating" ? "rotating" : body.kind === "weekly" ? "weekly" : (existing?.kind ?? "weekly");

  const shift_type = String(body.shift_type ?? existing?.shift_type ?? "day");
  if (!SHIFT_TYPES.has(shift_type)) return { error: "Unrecognised shift type." };

  const start_time = String(body.start_time ?? existing?.start_time ?? "08:00");
  const end_time = String(body.end_time ?? existing?.end_time ?? "20:00");
  if (!TIME_RE.test(start_time) || !TIME_RE.test(end_time)) return { error: "Times must be HH:MM." };

  let weekdays: number[] | undefined;
  let cycle_on: number | undefined;
  let cycle_off: number | undefined;
  let anchor_date: string | null | undefined;

  if (kind === "weekly") {
    const raw = Array.isArray(body.weekdays) ? body.weekdays : existing?.weekdays ?? [];
    weekdays = [...new Set(raw.map((n: any) => Math.trunc(Number(n))).filter((n: number) => n >= 0 && n <= 6))].sort((a, b) => (a as number) - (b as number)) as number[];
    if (weekdays.length === 0) return { error: "Pick at least one weekday." };
  } else {
    cycle_on = Math.max(1, Math.trunc(Number(body.cycle_on ?? existing?.cycle_on ?? 2)));
    cycle_off = Math.max(0, Math.trunc(Number(body.cycle_off ?? existing?.cycle_off ?? 4)));
    anchor_date = String(body.anchor_date ?? existing?.anchor_date ?? "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(anchor_date)) return { error: "A valid cycle start date (YYYY-MM-DD) is required for a rotating pattern." };
  }

  const names = staffNameMap(staffList);
  const name = String(body.name ?? existing?.name ?? "").trim() || `${names.get(staff_id) ?? "Staff"} — pattern`;
  const active = typeof body.active === "boolean" ? body.active : existing?.active ?? true;

  const pattern: ShiftPattern = {
    id: existing?.id ?? generateId("sp"),
    staff_id,
    name,
    kind,
    ...(kind === "weekly" ? { weekdays } : { cycle_on, cycle_off, anchor_date }),
    shift_type,
    start_time,
    end_time,
    active,
    home_id: existing?.home_id ?? String(body.home_id ?? "home_oak"),
    notes: body.notes != null ? String(body.notes).slice(0, 300) : existing?.notes,
  };
  return { pattern };
}

export async function GET() {
  const [staffList, shiftPatternsList] = await Promise.all([dal.staff.findAll(), dal.shiftPatterns.findAll()]);
  const names = staffNameMap(staffList);
  const patterns = (shiftPatternsList ?? []).map((p: ShiftPattern) => withName(p, names));
  const staff = (staffList ?? [])
    .map((m: any) => ({ id: String(m.id), name: names.get(String(m.id)) ?? "Unknown", role: m.role ?? null }))
    .sort((a: any, b: any) => a.name.localeCompare(b.name));
  return NextResponse.json({ data: { patterns, staff } });
}

export async function POST(req: Request) {
  const staffList = ((await dal.staff.findAll()) ?? []) as any[];
  let body: any = {};
  const __parsed2 = await readJsonBody(req);
  if (!__parsed2.ok) return __parsed2.response;
  try { body = __parsed2.data; } catch { body = {}; }
  const { pattern, error } = buildPattern(body, staffList);
  if (error || !pattern) return NextResponse.json({ error: error ?? "Invalid pattern" }, { status: 400 });
  await dal.shiftPatterns.create(pattern);
  return NextResponse.json({ data: withName(pattern, staffNameMap(staffList)) }, { status: 201 });
}

export async function PATCH(req: Request) {
  const [staffList, list] = await Promise.all([dal.staff.findAll(), dal.shiftPatterns.findAll()]) as [any[], ShiftPattern[]];
  let body: any = {};
  const __parsed = await readJsonBody(req);
  if (!__parsed.ok) return __parsed.response;
  try { body = __parsed.data; } catch { body = {}; }
  const id = String(body.id ?? "");
  const existing = (list ?? []).find((p) => p.id === id);
  if (!existing) return NextResponse.json({ error: "Pattern not found." }, { status: 404 });
  const { pattern, error } = buildPattern(body, staffList, existing);
  if (error || !pattern) return NextResponse.json({ error: error ?? "Invalid pattern" }, { status: 400 });
  await dal.shiftPatterns.update(id, pattern);
  return NextResponse.json({ data: withName(pattern, staffNameMap(staffList)) });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const list: ShiftPattern[] = ((await dal.shiftPatterns.findAll()) ?? []) as ShiftPattern[];
  if (!list.some((p) => p.id === id)) return NextResponse.json({ error: "Pattern not found." }, { status: 404 });
  await dal.shiftPatterns.remove(id);
  return NextResponse.json({ data: { id, deleted: true } });
}

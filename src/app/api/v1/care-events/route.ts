import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { careEventsDb } from "@/lib/db";
import { classifyCareEvent } from "@/lib/care-events/routing-engine";
import { getUserIdFromRequest } from "@/lib/auth-guard";
import { todayStr } from "@/lib/utils";
import type { CareEvent, CareEventCategory } from "@/types/care-events";
import { readJsonBody } from "@/lib/http/read-json";

// ─────────────────────────────────────────────────────────────────────────────
// Base care-events collection endpoint.
//
// IMPORTANT: this dedicated route exists because the generic catch-all
// (`/api/v1/[...slug]`) (a) mis-mapped the `care-events` slug to the `staff`
// collection and (b) performs a dumb insert that never runs the care-event
// classification pipeline. Care-event create MUST classify the event so the
// stored record carries the correct routing flags (Reg 40 triage, manager
// review, Reg 45 / Annex A contribution, safeguarding) and evidence prompts,
// and so the UI can show a routing preview before submission.
// ─────────────────────────────────────────────────────────────────────────────

function dayKey(d: string | null | undefined): string {
  return (d ?? "").slice(0, 10);
}

// ── GET /api/v1/care-events ──────────────────────────────────────────────────
// Query: child_id, status, category, date (YYYY-MM-DD), days (window), page, limit
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const date = searchParams.get("date");
  const fromDate = searchParams.get("from_date");
  const toDate = searchParams.get("to_date");
  const daysParam = searchParams.get("days");
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");

  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  // limit <= 0 (or absent) means "return everything" — the page renders all
  // recent events without pagination controls, so we must not silently truncate.
  const limit = limitParam ? Math.max(1, Number.parseInt(limitParam, 10) || 0) : 0;

  // Current versions only (amendments supersede their predecessors).
  let list = await careEventsDb.careEvents.findCurrent();

  // Rolling day window — inclusive, date-only prefix compare (consistent with the
  // platform-wide date-boundary hardening; safe for both date-only and timestamptz).
  if (daysParam) {
    const days = Number.parseInt(daysParam, 10);
    if (Number.isFinite(days) && days > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffKey = cutoff.toISOString().slice(0, 10);
      list = list.filter((e) => dayKey(e.event_date) >= cutoffKey);
    }
  }
  // Explicit date range (used by the inspection-readiness summary).
  if (fromDate) list = list.filter((e) => dayKey(e.event_date) >= dayKey(fromDate));
  if (toDate) list = list.filter((e) => dayKey(e.event_date) <= dayKey(toDate));
  if (childId) list = list.filter((e) => e.child_id === childId);
  if (category) list = list.filter((e) => e.category === category);
  if (date) list = list.filter((e) => dayKey(e.event_date) === dayKey(date));

  // status_counts is computed BEFORE applying the status filter so the UI's
  // filter pills/stat tiles stay stable regardless of the active filter.
  const statusCounts: Record<string, number> = {};
  for (const e of list) statusCounts[e.status] = (statusCounts[e.status] ?? 0) + 1;

  if (status) list = list.filter((e) => e.status === status);

  // Newest first (by event date+time, then created_at as a tiebreaker).
  list = [...list].sort((a, b) => {
    const ak = `${dayKey(a.event_date)} ${a.event_time ?? ""}`;
    const bk = `${dayKey(b.event_date)} ${b.event_time ?? ""}`;
    if (ak !== bk) return ak < bk ? 1 : -1;
    return (a.created_at ?? "") < (b.created_at ?? "") ? 1 : -1;
  });

  const total = list.length;
  const effLimit = limit > 0 ? limit : Math.max(total, 1);
  const pages = Math.max(1, Math.ceil(total / effLimit));
  const start = (page - 1) * effLimit;
  const paged = limit > 0 ? list.slice(start, start + effLimit) : list;

  // Enrich with display names (the card falls back to raw ids otherwise).
  const data = paged.map((e) => {
    const staffMember = e.staff_id ? db.staff.findById(e.staff_id) : null;
    const youngPerson = e.child_id ? db.youngPeople.findById(e.child_id) : null;
    return {
      ...e,
      staff_name: staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : e.staff_id,
      child_name: youngPerson ? `${youngPerson.first_name} ${youngPerson.last_name}` : e.child_id ?? null,
    };
  });

  return NextResponse.json({
    data,
    meta: {
      total,
      page,
      limit: limit > 0 ? limit : total,
      pages,
      status_counts: statusCounts,
    },
  });
}

// ── POST /api/v1/care-events ─────────────────────────────────────────────────
// Creates a draft care event, classified so it routes correctly on submission.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!content) return NextResponse.json({ error: "content is required" }, { status: 400 });

  const category = (typeof body.category === "string" ? body.category : "general") as CareEventCategory;
  const event_date = typeof body.event_date === "string" && body.event_date ? body.event_date : todayStr();
  const event_time = typeof body.event_time === "string" && body.event_time ? body.event_time : null;
  const is_significant = body.is_significant === true;

  // "none" is the sentinel the UI uses for "not specific to a child".
  const child_id = typeof body.child_id === "string" && body.child_id && body.child_id !== "none"
    ? body.child_id
    : null;

  const moodRaw = body.mood_score;
  const moodNum = moodRaw === undefined || moodRaw === null || moodRaw === "" ? null : Number(moodRaw);
  const mood_score = moodNum === null || Number.isNaN(moodNum) ? null : moodNum;

  // Classify ONCE — drives routing flags, evidence prompts, Reg-40 triage and the
  // preview the UI shows before submission. processCareEvent (on submit) reads
  // these stored flags for routing priority/oversight, so they must be set now.
  const classification = classifyCareEvent({ category, title, content, event_date, is_significant });

  const created: CareEvent = await careEventsDb.careEvents.create({
    staff_id: getUserIdFromRequest(req) || undefined,
    title,
    content,
    category,
    child_id,
    event_date,
    event_time,
    mood_score,
    is_significant,
    status: "draft",
    requires_manager_review: classification.requires_manager_review,
    requires_reg40_triage: classification.requires_reg40_triage,
    contributes_to_reg45: classification.contributes_to_reg45,
    contributes_to_annex_a: classification.contributes_to_annex_a,
    is_safeguarding: classification.is_safeguarding,
    evidence_prompts: classification.evidence_prompts,
  });

  return NextResponse.json({ data: created, routing_preview: classification }, { status: 201 });
}

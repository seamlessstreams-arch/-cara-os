import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { careEventsDb } from "@/lib/db";
import { classifyCareEvent } from "@/lib/care-events/routing-engine";
import { generateId, todayStr } from "@/lib/utils";
import type { CreateCareEventPayload, CareEventCategory } from "@/types/care-events";

// ── GET /api/v1/care-events ───────────────────────────────────────────────────
// Query params: ?child_id= &status= &category= &date= &days= &page= &limit=

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const child_id = searchParams.get("child_id");
  const status = searchParams.get("status");
  const category = searchParams.get("category") as CareEventCategory | null;
  const date = searchParams.get("date");
  const days = searchParams.has("days") ? parseInt(searchParams.get("days")!, 10) : null;
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  let events = await careEventsDb.careEvents.findCurrent();

  if (child_id) events = events.filter((e) => e.child_id === child_id);
  if (status) events = events.filter((e) => e.status === status);
  if (category) events = events.filter((e) => e.category === category);
  if (date) events = events.filter((e) => e.event_date === date);
  if (days !== null && !date) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    events = events.filter((e) => e.event_date >= cutoffStr);
  }

  // Sort newest first
  const sorted = [...events].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const total = sorted.length;
  const offset = (page - 1) * limit;
  const paged = sorted.slice(offset, offset + limit);

  // Enrich with resolved names
  const enriched = paged.map((e) => {
    const staffMember = e.staff_id ? db.staff.findById(e.staff_id) : null;
    const youngPerson = e.child_id ? db.youngPeople.findById(e.child_id) : null;
    return {
      ...e,
      staff_name: staffMember ? `${staffMember.first_name} ${staffMember.last_name}` : e.staff_id,
      child_name: youngPerson ? `${youngPerson.first_name} ${youngPerson.last_name}` : e.child_id ?? null,
    };
  });

  // Status counts for dashboard
  const statusCounts: Record<string, number> = {};
  for (const e of sorted) {
    statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
  }

  return NextResponse.json({
    data: enriched,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      status_counts: statusCounts,
    },
  });
}

// ── POST /api/v1/care-events ──────────────────────────────────────────────────
// Creates a new Care Event in draft status.
// Immediately classifies and returns the routing preview.

export async function POST(req: NextRequest) {
  let body: CreateCareEventPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── Server-side validation ────────────────────────────────────────────────
  if (!body.category) {
    return NextResponse.json({ error: "category is required" }, { status: 400 });
  }
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!body.content?.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const validCategories: CareEventCategory[] = [
    "general", "behaviour", "health", "medication", "education",
    "family_contact", "professional_contact", "safeguarding",
    "missing_episode", "physical_intervention", "restraint", "complaint",
    "activity", "wellbeing", "sleep", "food", "finance", "other",
  ];
  if (!validCategories.includes(body.category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  if (body.mood_score !== undefined && body.mood_score !== null) {
    const score = Number(body.mood_score);
    if (!Number.isInteger(score) || score < 1 || score > 10) {
      return NextResponse.json({ error: "mood_score must be an integer 1–10" }, { status: 400 });
    }
  }

  // ── Classify immediately ──────────────────────────────────────────────────
  const classification = classifyCareEvent({
    category: body.category,
    title: body.title,
    content: body.content,
    event_date: body.event_date ?? todayStr(),
    is_significant: body.is_significant ?? false,
  });

  // ── Create the event ──────────────────────────────────────────────────────
  // TODO: in production, extract staff_id from verified session cookie/JWT
  const staffId = "staff_darren"; // placeholder; replace with auth session lookup

  const event = await careEventsDb.careEvents.create({
    child_id: body.child_id ?? null,
    shift_id: body.shift_id ?? null,
    staff_id: staffId,
    category: body.category,
    title: body.title.trim(),
    content: body.content.trim(),
    mood_score: body.mood_score ?? null,
    is_significant: body.is_significant ?? false,
    event_date: body.event_date ?? todayStr(),
    event_time: body.event_time ?? null,
    status: "draft",
    // Apply classification flags immediately
    requires_manager_review: classification.requires_manager_review,
    requires_reg40_triage: classification.requires_reg40_triage,
    contributes_to_reg45: classification.contributes_to_reg45,
    contributes_to_annex_a: classification.contributes_to_annex_a,
    is_safeguarding: classification.is_safeguarding,
    evidence_prompts: classification.evidence_prompts,
  });

  // ── Audit ─────────────────────────────────────────────────────────────────
  await careEventsDb.careEventAuditLog.append({
    care_event_id: event.id,
    home_id: "home_oak",
    action: "care_event_created",
    actor_staff_id: staffId,
    actor_role: null,
    detail: { category: event.category, title: event.title },
    ip_address: null,
  });

  return NextResponse.json(
    {
      data: event,
      routing_preview: {
        routes: classification.routes,
        requires_manager_review: classification.requires_manager_review,
        requires_reg40_triage: classification.requires_reg40_triage,
        contributes_to_reg45: classification.contributes_to_reg45,
        contributes_to_annex_a: classification.contributes_to_annex_a,
        evidence_prompts: classification.evidence_prompts,
        background_jobs: classification.background_jobs,
      },
    },
    { status: 201 }
  );
}

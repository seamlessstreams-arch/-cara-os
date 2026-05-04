// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE API — /api/v1/outcomes
// Outcomes Tracker: targets and reviews for young people's care plan goals.
// GET  — list targets + reviews + summary stats
// POST — create target or review
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import type { OutcomeDomain, OutcomeDirection, OutcomeRating } from "@/types/extended";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("child_id");
  const domain  = searchParams.get("domain") as OutcomeDomain | null;
  const homeId  = searchParams.get("home_id") ?? "home_oak";

  let targets = db.outcomeTargets.findAll().filter((t) => t.home_id === homeId);
  if (childId) targets = targets.filter((t) => t.child_id === childId);
  if (domain)  targets = targets.filter((t) => t.domain === domain);

  const reviews = db.outcomeReviews.findAll().filter((r) => r.home_id === homeId);
  const childReviews = childId ? reviews.filter((r) => r.child_id === childId) : reviews;

  // Summary statistics
  const activeTargets  = targets.filter((t) => t.status === "active");
  const improving      = activeTargets.filter((t) => t.direction === "improving").length;
  const stable         = activeTargets.filter((t) => t.direction === "stable").length;
  const declining      = activeTargets.filter((t) => t.direction === "declining").length;
  const achieved       = targets.filter((t) => t.status === "achieved").length;

  // Average rating across all active targets
  const avgRating = activeTargets.length > 0
    ? Math.round((activeTargets.reduce((sum, t) => sum + t.current_rating, 0) / activeTargets.length) * 10) / 10
    : 0;

  // Reviews due soon (next 14 days)
  const today = new Date();
  const twoWeeks = new Date(today.getTime() + 14 * 86400000);
  const reviewsDueSoon = activeTargets.filter((t) => {
    const rd = new Date(t.review_date);
    return rd <= twoWeeks;
  }).length;

  // Per-child summary
  const childIds = [...new Set(targets.map((t) => t.child_id))];
  const perChild = childIds.map((cid) => {
    const ct = targets.filter((t) => t.child_id === cid && t.status === "active");
    const avgR = ct.length > 0
      ? Math.round((ct.reduce((s, t) => s + t.current_rating, 0) / ct.length) * 10) / 10
      : 0;
    return {
      child_id: cid,
      active_targets: ct.length,
      avg_rating: avgR,
      improving: ct.filter((t) => t.direction === "improving").length,
      stable: ct.filter((t) => t.direction === "stable").length,
      declining: ct.filter((t) => t.direction === "declining").length,
    };
  });

  // Per-domain summary
  const domains = [...new Set(targets.map((t) => t.domain))];
  const perDomain = domains.map((d) => {
    const dt = activeTargets.filter((t) => t.domain === d);
    const avgR = dt.length > 0
      ? Math.round((dt.reduce((s, t) => s + t.current_rating, 0) / dt.length) * 10) / 10
      : 0;
    return {
      domain: d,
      count: dt.length,
      avg_rating: avgR,
      improving: dt.filter((t) => t.direction === "improving").length,
      declining: dt.filter((t) => t.direction === "declining").length,
    };
  });

  return NextResponse.json({
    data: targets,
    reviews: childReviews,
    meta: {
      total_targets: targets.length,
      active_targets: activeTargets.length,
      improving,
      stable,
      declining,
      achieved,
      avg_rating: avgRating,
      reviews_due_soon: reviewsDueSoon,
      total_reviews: childReviews.length,
    },
    per_child: perChild,
    per_domain: perDomain,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, ...data } = body;

  if (type === "review") {
    // Create a progress review
    if (!data.target_id || !data.new_rating || !data.progress_notes) {
      return NextResponse.json({ error: "Missing required fields: target_id, new_rating, progress_notes" }, { status: 400 });
    }

    const target = db.outcomeTargets.findById(data.target_id);
    if (!target) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    const previousRating = target.current_rating;
    const direction: OutcomeDirection =
      data.new_rating > previousRating ? "improving"
      : data.new_rating < previousRating ? "declining"
      : "stable";

    const review = db.outcomeReviews.create({
      target_id:       data.target_id,
      child_id:        target.child_id,
      home_id:         target.home_id,
      review_date:     data.review_date || new Date().toISOString().slice(0, 10),
      previous_rating: previousRating,
      new_rating:      data.new_rating as OutcomeRating,
      direction,
      reviewer_id:     data.reviewer_id || "staff_darren",
      reviewer_role:   data.reviewer_role || "Registered Manager",
      yp_participated: data.yp_participated ?? false,
      yp_voice:        data.yp_voice || null,
      progress_notes:  data.progress_notes,
      barriers:        data.barriers || null,
      next_steps:      data.next_steps || null,
    });

    // Check if target is now achieved
    if (data.new_rating >= target.target_rating) {
      db.outcomeTargets.update(target.id, { status: "achieved" });
    }

    return NextResponse.json({ data: review }, { status: 201 });
  }

  // Default: create a new outcome target
  if (!data.child_id || !data.domain || !data.target_description) {
    return NextResponse.json({ error: "Missing required fields: child_id, domain, target_description" }, { status: 400 });
  }

  const target = db.outcomeTargets.create({
    child_id:            data.child_id,
    home_id:             data.home_id || "home_oak",
    domain:              data.domain as OutcomeDomain,
    target_description:  data.target_description,
    success_criteria:    data.success_criteria || "",
    baseline_rating:     data.baseline_rating || 2,
    current_rating:      data.baseline_rating || 2,
    target_rating:       data.target_rating || 4,
    direction:           "stable" as OutcomeDirection,
    status:              "active",
    review_date:         data.review_date || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    set_by:              data.set_by || "staff_darren",
    set_date:            new Date().toISOString().slice(0, 10),
    yp_voice:            data.yp_voice || null,
    notes:               data.notes || null,
    evidence_notes:      null,
    linked_care_plan_id: data.linked_care_plan_id || null,
  });

  return NextResponse.json({ data: target }, { status: 201 });
}

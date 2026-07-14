// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S GUIDE SERVICE
// Manages the children's guide document, its versions, accessibility formats,
// distribution to children, and feedback tracking. CHR 2015 Reg 16(2) requires
// the registered person to prepare a children's guide covering:
//   (a) a summary of the Statement of Purpose
//   (b) a summary of what the home sets out to do for children
//   (c) how a child can find out their rights
//   (d) how a child can contact Ofsted, the Children's Commissioner, IRO,
//       independent visitor, advocacy services, and local authority
//   (e) the home's procedure for dealing with complaints
//
// Reg 16(3) — the guide must be appropriate to the age and understanding of
// each child, and kept under review. It must be made available to each child
// before or at the time of their admission.
//
// SCCIF: Children's Experiences — Ofsted assesses whether children receive
// a guide that is child-friendly, accessible, and helps them understand their
// rights and how to raise concerns.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type GuideStatus =
  | "draft"
  | "active"
  | "under_review"
  | "archived"
  | "superseded";

export type AccessibilityFormat =
  | "standard_print"
  | "large_print"
  | "easy_read"
  | "pictorial"
  | "translated"
  | "braille"
  | "audio"
  | "digital"
  | "video";

export type GuideSection =
  | "welcome"
  | "about_the_home"
  | "your_rights"
  | "daily_routines"
  | "who_to_talk_to"
  | "contact_ofsted"
  | "contact_childrens_commissioner"
  | "contact_iro"
  | "contact_advocate"
  | "contact_independent_visitor"
  | "how_to_complain"
  | "house_rules"
  | "leaving_the_home";

export type FeedbackRating =
  | "very_helpful"
  | "helpful"
  | "okay"
  | "not_helpful"
  | "confusing";

export interface ChildrensGuide {
  id: string;
  home_id: string;
  version: string;
  title: string;
  effective_date: string;
  review_date: string;
  last_reviewed_date: string | null;
  reviewed_by: string | null;
  approved_by: string | null;
  approval_date: string | null;
  status: GuideStatus;
  sections_included: GuideSection[];
  formats_available: AccessibilityFormat[];
  languages_available: string[];
  age_range_minimum: number | null;
  age_range_maximum: number | null;
  key_contacts: { role: string; name: string; phone: string }[];
  ofsted_contact: string;
  childrens_commissioner_contact: string;
  advocacy_service_contact: string;
  complaints_summary: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuideDistribution {
  id: string;
  home_id: string;
  guide_id: string;
  child_id: string;
  child_name: string;
  distribution_date: string;
  format_provided: AccessibilityFormat;
  language_provided: string;
  distributed_by: string;
  child_confirmed_receipt: boolean;
  child_confirmed_understanding: boolean;
  discussed_with_child: boolean;
  discussion_date: string | null;
  discussed_by: string | null;
  follow_up_needed: boolean;
  follow_up_notes: string | null;
  notes: string | null;
  created_at: string;
}

export interface GuideFeedback {
  id: string;
  home_id: string;
  guide_id: string;
  child_id: string;
  child_name: string;
  feedback_date: string;
  rating: FeedbackRating;
  what_was_helpful: string | null;
  what_could_improve: string | null;
  sections_found_confusing: GuideSection[];
  suggestions: string | null;
  collected_by: string;
  action_taken: string | null;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const GUIDE_STATUSES: { status: GuideStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "active", label: "Active" },
  { status: "under_review", label: "Under Review" },
  { status: "archived", label: "Archived" },
  { status: "superseded", label: "Superseded" },
];

export const ACCESSIBILITY_FORMATS: { format: AccessibilityFormat; label: string }[] = [
  { format: "standard_print", label: "Standard Print" },
  { format: "large_print", label: "Large Print" },
  { format: "easy_read", label: "Easy Read" },
  { format: "pictorial", label: "Pictorial" },
  { format: "translated", label: "Translated" },
  { format: "braille", label: "Braille" },
  { format: "audio", label: "Audio" },
  { format: "digital", label: "Digital" },
  { format: "video", label: "Video" },
];

export const GUIDE_SECTIONS: { section: GuideSection; label: string }[] = [
  { section: "welcome", label: "Welcome" },
  { section: "about_the_home", label: "About the Home" },
  { section: "your_rights", label: "Your Rights" },
  { section: "daily_routines", label: "Daily Routines" },
  { section: "who_to_talk_to", label: "Who to Talk To" },
  { section: "contact_ofsted", label: "Contact Ofsted" },
  { section: "contact_childrens_commissioner", label: "Contact Children's Commissioner" },
  { section: "contact_iro", label: "Contact Your IRO" },
  { section: "contact_advocate", label: "Contact an Advocate" },
  { section: "contact_independent_visitor", label: "Contact Your Independent Visitor" },
  { section: "how_to_complain", label: "How to Complain" },
  { section: "house_rules", label: "House Rules" },
  { section: "leaving_the_home", label: "When You Leave" },
];

export const FEEDBACK_RATINGS: { rating: FeedbackRating; label: string }[] = [
  { rating: "very_helpful", label: "Very Helpful" },
  { rating: "helpful", label: "Helpful" },
  { rating: "okay", label: "Okay" },
  { rating: "not_helpful", label: "Not Helpful" },
  { rating: "confusing", label: "Confusing" },
];

export const REQUIRED_SECTIONS: GuideSection[] = [
  "about_the_home",
  "your_rights",
  "who_to_talk_to",
  "contact_ofsted",
  "contact_childrens_commissioner",
  "contact_advocate",
  "how_to_complain",
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute summary metrics for children's guide management.
 */
export function computeGuideMetrics(
  guides: ChildrensGuide[],
  distributions: GuideDistribution[],
  feedbacks: GuideFeedback[],
  totalChildren: number,
): {
  active_guides: number;
  formats_available: number;
  children_received: number;
  children_total: number;
  distribution_rate: number;
  understanding_confirmed_rate: number;
  avg_feedback_score: number;
  overdue_reviews: number;
  sections_coverage: Record<string, boolean>;
  by_feedback_rating: Record<string, number>;
} {
  const now = new Date();

  // Active guides
  const activeGuides = guides.filter((g) => g.status === "active");

  // Formats available across all active guides
  const allFormats = new Set<string>();
  for (const g of activeGuides) {
    for (const f of g.formats_available) {
      allFormats.add(f);
    }
  }

  // Unique children who have received the guide
  const childrenReceived = new Set<string>();
  for (const d of distributions) {
    childrenReceived.add(d.child_id);
  }

  // Distribution rate
  const distributionRate =
    totalChildren > 0
      ? Math.round((childrenReceived.size / totalChildren) * 1000) / 10
      : 0;

  // Understanding confirmed rate
  let confirmedUnderstanding = 0;
  for (const d of distributions) {
    if (d.child_confirmed_understanding) confirmedUnderstanding++;
  }
  const understandingConfirmedRate =
    distributions.length > 0
      ? Math.round((confirmedUnderstanding / distributions.length) * 1000) / 10
      : 0;

  // Average feedback score (very_helpful=5, helpful=4, okay=3, not_helpful=2, confusing=1)
  const ratingValues: Record<string, number> = {
    very_helpful: 5,
    helpful: 4,
    okay: 3,
    not_helpful: 2,
    confusing: 1,
  };
  let totalScore = 0;
  let feedbackCount = 0;
  for (const f of feedbacks) {
    if (ratingValues[f.rating] != null) {
      totalScore += ratingValues[f.rating];
      feedbackCount++;
    }
  }
  const avgFeedbackScore =
    feedbackCount > 0
      ? Math.round((totalScore / feedbackCount) * 10) / 10
      : 0;

  // Overdue reviews
  let overdueReviews = 0;
  for (const g of activeGuides) {
    if (new Date(g.review_date) < now) {
      overdueReviews++;
    }
  }

  // Sections coverage (from latest active guide)
  const sectionsCoverage: Record<string, boolean> = {};
  const latestActive = activeGuides.sort(
    (a, b) =>
      new Date(b.effective_date).getTime() -
      new Date(a.effective_date).getTime(),
  )[0];
  for (const s of REQUIRED_SECTIONS) {
    sectionsCoverage[s] = latestActive
      ? latestActive.sections_included.includes(s)
      : false;
  }

  // By feedback rating
  const byFeedbackRating: Record<string, number> = {};
  for (const f of feedbacks) {
    byFeedbackRating[f.rating] = (byFeedbackRating[f.rating] ?? 0) + 1;
  }

  return {
    active_guides: activeGuides.length,
    formats_available: allFormats.size,
    children_received: childrenReceived.size,
    children_total: totalChildren,
    distribution_rate: distributionRate,
    understanding_confirmed_rate: understandingConfirmedRate,
    avg_feedback_score: avgFeedbackScore,
    overdue_reviews: overdueReviews,
    sections_coverage: sectionsCoverage,
    by_feedback_rating: byFeedbackRating,
  };
}

/**
 * Identify children's guide alerts requiring management attention.
 */
export function identifyGuideAlerts(
  guides: ChildrensGuide[],
  distributions: GuideDistribution[],
  feedbacks: GuideFeedback[],
  totalChildren: number,
  now: Date = new Date(),
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  id: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    id: string;
  }[] = [];

  const activeGuides = guides.filter((g) => g.status === "active");

  // ── No active guide (critical) ──────────────────────────────────────
  if (activeGuides.length === 0 && guides.length > 0) {
    alerts.push({
      type: "no_active_guide",
      severity: "critical",
      message: "No active children's guide — Reg 16(2) requires a current guide available to all children",
      id: guides[0].id,
    });
  }

  for (const g of activeGuides) {
    // ── Review overdue (high) ───────────────────────────────────────
    if (new Date(g.review_date) < now) {
      const daysOverdue = Math.round(
        (now.getTime() - new Date(g.review_date).getTime()) / 86400000,
      );
      alerts.push({
        type: "review_overdue",
        severity: "high",
        message: `Children's guide review is ${daysOverdue} days overdue — Reg 16(3) requires the guide to be kept under review`,
        id: g.id,
      });
    }

    // ── Missing required sections (high) ──────────────────────────
    const missingSections = REQUIRED_SECTIONS.filter(
      (s) => !g.sections_included.includes(s),
    );
    if (missingSections.length > 0) {
      alerts.push({
        type: "missing_required_sections",
        severity: "high",
        message: `Children's guide is missing ${missingSections.length} required section(s) — Reg 16(2) requires specific content including complaints, rights, and contact details`,
        id: g.id,
      });
    }

    // ── No accessibility formats beyond standard (medium) ─────────
    if (
      g.formats_available.length === 1 &&
      g.formats_available[0] === "standard_print"
    ) {
      alerts.push({
        type: "limited_accessibility",
        severity: "medium",
        message: "Children's guide only available in standard print — consider easy-read, pictorial, or translated versions for accessibility",
        id: g.id,
      });
    }

    // ── Not approved (medium) ─────────────────────────────────────
    if (!g.approved_by) {
      alerts.push({
        type: "not_approved",
        severity: "medium",
        message: "Active children's guide has not been formally approved — governance requires documented approval",
        id: g.id,
      });
    }
  }

  // ── Distribution gaps ────────────────────────────────────────────────

  // Children who haven't received the guide
  const childrenWithGuide = new Set(distributions.map((d) => d.child_id));
  if (totalChildren > 0 && childrenWithGuide.size < totalChildren) {
    const missing = totalChildren - childrenWithGuide.size;
    alerts.push({
      type: "distribution_gap",
      severity: "high",
      message: `${missing} child(ren) have not received the children's guide — Reg 16(3) requires the guide to be given before or at admission`,
      id: activeGuides.length > 0 ? activeGuides[0].id : "system",
    });
  }

  // Distributions without confirmed understanding
  for (const d of distributions) {
    if (!d.child_confirmed_understanding && !d.follow_up_needed) {
      alerts.push({
        type: "understanding_not_confirmed",
        severity: "medium",
        message: `${d.child_name} received the guide but understanding not confirmed and no follow-up flagged — ensure the child understands the guide's content`,
        id: d.id,
      });
    }
  }

  // ── Feedback concerns ────────────────────────────────────────────────

  // Negative feedback patterns
  const negativeFeedback = feedbacks.filter(
    (f) => f.rating === "not_helpful" || f.rating === "confusing",
  );
  if (negativeFeedback.length >= 2) {
    alerts.push({
      type: "negative_feedback_pattern",
      severity: "medium",
      message: `${negativeFeedback.length} children rated the guide as unhelpful or confusing — review and improve the guide content and format`,
      id: negativeFeedback[0].id,
    });
  }

  return alerts;
}

// ── CRUD — Children's Guides ─────────────────────────────────────────────

export async function listGuides(
  homeId: string,
  filters?: {
    status?: GuideStatus;
    limit?: number;
  },
): Promise<ServiceResult<ChildrensGuide[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_childrens_guides") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.status) q = q.eq("status", filters.status);
  q = q.order("effective_date", { ascending: false }).limit(filters?.limit ?? 50);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createGuide(
  input: {
    homeId: string;
    version: string;
    title: string;
    effectiveDate: string;
    reviewDate: string;
    sectionsIncluded?: GuideSection[];
    formatsAvailable?: AccessibilityFormat[];
    languagesAvailable?: string[];
    ageRangeMinimum?: number;
    ageRangeMaximum?: number;
    keyContacts?: { role: string; name: string; phone: string }[];
    ofstedContact?: string;
    childrensCommissionerContact?: string;
    advocacyServiceContact?: string;
    complaintsSummary?: string;
    notes?: string;
  },
): Promise<ServiceResult<ChildrensGuide>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_childrens_guides") as SB)
    .insert({
      home_id: input.homeId,
      version: input.version,
      title: input.title,
      effective_date: input.effectiveDate,
      review_date: input.reviewDate,
      last_reviewed_date: null,
      reviewed_by: null,
      approved_by: null,
      approval_date: null,
      status: "draft",
      sections_included: input.sectionsIncluded ?? [],
      formats_available: input.formatsAvailable ?? ["standard_print"],
      languages_available: input.languagesAvailable ?? ["English"],
      age_range_minimum: input.ageRangeMinimum ?? null,
      age_range_maximum: input.ageRangeMaximum ?? null,
      key_contacts: input.keyContacts ?? [],
      ofsted_contact: input.ofstedContact ?? "",
      childrens_commissioner_contact: input.childrensCommissionerContact ?? "",
      advocacy_service_contact: input.advocacyServiceContact ?? "",
      complaints_summary: input.complaintsSummary ?? "",
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateGuide(
  id: string,
  updates: Partial<ChildrensGuide>,
): Promise<ServiceResult<ChildrensGuide>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_childrens_guides") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };

  // Auto-supersession (Doc-Version-Workflow M4): activating a guide marks every
  // OTHER active guide for the home superseded — mirrors updateStatement.
  // Best-effort: a failure here never fails the activation itself.
  if (updates.status === "active" && data?.home_id) {
    try {
      await (s.from("cs_childrens_guides") as SB)
        .update({ status: "superseded", updated_at: new Date().toISOString() })
        .eq("home_id", data.home_id)
        .eq("status", "active")
        .neq("id", id);
    } catch {
      /* activation stands; supersession is retried on the next activate */
    }
  }

  return { ok: true, data };
}

// ── CRUD — Guide Distributions ───────────────────────────────────────────

export async function listDistributions(
  homeId: string,
  filters?: {
    guideId?: string;
    childId?: string;
    limit?: number;
  },
): Promise<ServiceResult<GuideDistribution[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_guide_distributions") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.guideId) q = q.eq("guide_id", filters.guideId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  q = q.order("distribution_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createDistribution(
  input: {
    homeId: string;
    guideId: string;
    childId: string;
    childName: string;
    distributionDate?: string;
    formatProvided?: AccessibilityFormat;
    languageProvided?: string;
    distributedBy: string;
    childConfirmedReceipt?: boolean;
    childConfirmedUnderstanding?: boolean;
    discussedWithChild?: boolean;
    discussionDate?: string;
    discussedBy?: string;
    followUpNeeded?: boolean;
    followUpNotes?: string;
    notes?: string;
  },
): Promise<ServiceResult<GuideDistribution>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_guide_distributions") as SB)
    .insert({
      home_id: input.homeId,
      guide_id: input.guideId,
      child_id: input.childId,
      child_name: input.childName,
      distribution_date: input.distributionDate ?? new Date().toISOString().split("T")[0],
      format_provided: input.formatProvided ?? "standard_print",
      language_provided: input.languageProvided ?? "English",
      distributed_by: input.distributedBy,
      child_confirmed_receipt: input.childConfirmedReceipt ?? false,
      child_confirmed_understanding: input.childConfirmedUnderstanding ?? false,
      discussed_with_child: input.discussedWithChild ?? false,
      discussion_date: input.discussionDate ?? null,
      discussed_by: input.discussedBy ?? null,
      follow_up_needed: input.followUpNeeded ?? false,
      follow_up_notes: input.followUpNotes ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Guide Feedback ────────────────────────────────────────────────

export async function listFeedback(
  homeId: string,
  filters?: {
    guideId?: string;
    childId?: string;
    rating?: FeedbackRating;
    limit?: number;
  },
): Promise<ServiceResult<GuideFeedback[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_guide_feedback") as SB)
    .select("*")
    .eq("home_id", homeId);
  if (filters?.guideId) q = q.eq("guide_id", filters.guideId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.rating) q = q.eq("rating", filters.rating);
  q = q.order("feedback_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createFeedback(
  input: {
    homeId: string;
    guideId: string;
    childId: string;
    childName: string;
    feedbackDate?: string;
    rating: FeedbackRating;
    whatWasHelpful?: string;
    whatCouldImprove?: string;
    sectionsFoundConfusing?: GuideSection[];
    suggestions?: string;
    collectedBy: string;
    actionTaken?: string;
  },
): Promise<ServiceResult<GuideFeedback>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_guide_feedback") as SB)
    .insert({
      home_id: input.homeId,
      guide_id: input.guideId,
      child_id: input.childId,
      child_name: input.childName,
      feedback_date: input.feedbackDate ?? new Date().toISOString().split("T")[0],
      rating: input.rating,
      what_was_helpful: input.whatWasHelpful ?? null,
      what_could_improve: input.whatCouldImprove ?? null,
      sections_found_confusing: input.sectionsFoundConfusing ?? [],
      suggestions: input.suggestions ?? null,
      collected_by: input.collectedBy,
      action_taken: input.actionTaken ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeGuideMetrics,
  identifyGuideAlerts,
  REQUIRED_SECTIONS,
};

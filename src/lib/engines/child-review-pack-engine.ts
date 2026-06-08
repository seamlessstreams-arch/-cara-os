// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD REVIEW PACK ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
//
// Re-frames a child's existing child-360 intelligence + demographics into a
// single, shareable, print-ready REVIEW PACK for a Looked-After-Child review.
// Fills a verified gap: lac-review-prep tracks the prep WORKFLOW (is the report
// submitted? what actions are outstanding?) but the pack itself is still made by
// hand in Word. The data already exists in child-360; this packages it.
//
// The route maps child-360's output + the child's profile into ChildReviewPackInput
// (decoupled from child-360's exact types); this engine organises it into review
// sections, a narrative summary, talking points and recommendations.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input (route maps child-360 + demographics into this) ─────────────────────

export interface ReviewDomainScore {
  domain_label: string;
  rag: string; // green | amber | red
  score: number;
  trend: string; // improving | stable | declining
  summary: string;
}

export interface ChildReviewPackInput {
  child_id: string;
  child_name: string;
  date_of_birth: string;
  age_years: number;
  legal_status: string;
  placement_start: string;
  days_in_placement: number;
  key_worker: string;
  social_worker: string;
  iro: string;

  overall_wellbeing: string; // thriving | stable | needs_attention | concerning | critical
  headline: string;
  domain_scores: ReviewDomainScore[];

  voice_captured: boolean;
  recent_themes: string[];
  mood_trend: string;

  risk_level: string;
  active_risk_flags: string[];
  open_incidents: number;
  missing_90d: number;

  school_name: string | null;
  attendance_rate_30d: number | null;

  active_medications: number;
  allergies: string[];
  overdue_appointments: number;

  contact_consistency: string;
  yp_voice_on_contact: boolean;

  total_active_targets: number;
  targets_on_track: number;
  average_progress_pct: number;

  strengths: string[];
  concerns: string[];
  priority_actions: { action: string; severity: string }[];
  key_dates: { label: string; date: string }[];

  today?: string;
}

// ── Output ────────────────────────────────────────────────────────────────────

export type PackRag = "green" | "amber" | "red" | "no_data";

export interface ReviewSection {
  key: string;
  title: string;
  rag: PackRag;
  facts: { label: string; value: string }[];
  narrative: string;
}

export interface ChildReviewPackResult {
  title: string;
  generated_for: string;
  child_name: string;
  age_years: number;
  demographics: { label: string; value: string }[];
  overall_wellbeing: string;
  headline: string;
  review_summary: string;
  domain_scores: ReviewDomainScore[];
  wishes_and_feelings: { captured: boolean; themes: string[]; narrative: string };
  sections: ReviewSection[];
  strengths: string[];
  recommendations: string[];
  key_dates: { label: string; date: string }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ragFor(rag: string): PackRag {
  const r = (rag || "").toLowerCase().trim();
  return r === "green" || r === "amber" || r === "red" ? (r as PackRag) : "no_data";
}

function pct(n: number | null | undefined): string {
  return typeof n === "number" ? `${Math.round(n)}%` : "—";
}

const WELLBEING_LABEL: Record<string, string> = {
  thriving: "Thriving",
  stable: "Stable",
  needs_attention: "Needs attention",
  concerning: "Concerning",
  critical: "Critical",
};

// ── Engine ────────────────────────────────────────────────────────────────────

export function buildChildReviewPack(input: ChildReviewPackInput): ChildReviewPackResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const months = Math.round(input.days_in_placement / 30);

  const demographics = [
    { label: "Date of birth", value: input.date_of_birth },
    { label: "Age", value: `${input.age_years}` },
    { label: "Legal status", value: input.legal_status || "—" },
    { label: "In placement since", value: `${input.placement_start} (${months} month${months === 1 ? "" : "s"})` },
    { label: "Key worker", value: input.key_worker || "—" },
    { label: "Social worker", value: input.social_worker || "—" },
    { label: "IRO", value: input.iro || "—" },
  ];

  // ── Wishes & feelings ──
  const wf_narrative = input.voice_captured
    ? input.recent_themes.length
      ? `${input.child_name}'s voice has been captured recently. Key themes: ${input.recent_themes.join("; ")}.`
      : `${input.child_name}'s voice has been captured recently, with no specific recurring themes recorded.`
    : `No recent record of ${input.child_name}'s wishes and feelings — capturing the child's voice ahead of the review is a priority.`;

  // ── Sections (each a review heading) ──
  const sections: ReviewSection[] = [];

  // Safety
  const safetyRag: PackRag = input.risk_level && /high|very_high|critical/i.test(input.risk_level)
    ? "red"
    : input.open_incidents > 0 || input.missing_90d > 0
      ? "amber"
      : "green";
  sections.push({
    key: "safety",
    title: "Safety & risk",
    rag: safetyRag,
    facts: [
      { label: "Risk level", value: input.risk_level || "—" },
      { label: "Open incidents", value: `${input.open_incidents}` },
      { label: "Missing episodes (90d)", value: `${input.missing_90d}` },
    ],
    narrative: input.active_risk_flags.length
      ? `Active risk factors: ${input.active_risk_flags.join(", ")}.`
      : "No active risk flags recorded.",
  });

  // Health
  const healthRag: PackRag = input.overdue_appointments > 0 ? "amber" : "green";
  sections.push({
    key: "health",
    title: "Health",
    rag: healthRag,
    facts: [
      { label: "Active medications", value: `${input.active_medications}` },
      { label: "Overdue appointments", value: `${input.overdue_appointments}` },
      { label: "Allergies", value: input.allergies.length ? input.allergies.join(", ") : "None recorded" },
    ],
    narrative: input.overdue_appointments > 0
      ? `${input.overdue_appointments} health appointment(s) overdue — to be picked up at the review.`
      : "Health appointments are up to date.",
  });

  // Education
  const eduRag: PackRag = input.attendance_rate_30d == null
    ? "no_data"
    : input.attendance_rate_30d >= 90
      ? "green"
      : input.attendance_rate_30d >= 75
        ? "amber"
        : "red";
  sections.push({
    key: "education",
    title: "Education",
    rag: eduRag,
    facts: [
      { label: "School", value: input.school_name || "—" },
      { label: "Attendance (30d)", value: pct(input.attendance_rate_30d) },
    ],
    narrative: input.attendance_rate_30d == null
      ? "No recent attendance data recorded."
      : input.attendance_rate_30d >= 90
        ? "Attendance is strong."
        : "Attendance needs attention and a support plan at the review.",
  });

  // Contact & relationships
  sections.push({
    key: "contact",
    title: "Family time & relationships",
    rag: input.contact_consistency === "consistent" ? "green" : input.contact_consistency === "no_data" ? "no_data" : "amber",
    facts: [
      { label: "Contact consistency", value: input.contact_consistency || "—" },
      { label: "Child's view on contact captured", value: input.yp_voice_on_contact ? "Yes" : "No" },
    ],
    narrative: input.contact_consistency === "consistent"
      ? "Family time is happening consistently."
      : "Family time arrangements should be reviewed.",
  });

  // Progress & outcomes
  const outRag: PackRag = input.total_active_targets === 0
    ? "no_data"
    : input.average_progress_pct >= 70
      ? "green"
      : input.average_progress_pct >= 50
        ? "amber"
        : "red";
  sections.push({
    key: "outcomes",
    title: "Progress & outcomes",
    rag: outRag,
    facts: [
      { label: "Active targets", value: `${input.total_active_targets}` },
      { label: "On track", value: `${input.targets_on_track}/${input.total_active_targets}` },
      { label: "Average progress", value: input.total_active_targets ? pct(input.average_progress_pct) : "—" },
    ],
    narrative: input.total_active_targets === 0
      ? "No active outcome targets recorded — agree targets at the review."
      : `${input.targets_on_track} of ${input.total_active_targets} targets on track, averaging ${Math.round(input.average_progress_pct)}% progress.`,
  });

  // ── Review summary (narrative) ──
  const wellbeingLabel = WELLBEING_LABEL[(input.overall_wellbeing || "").toLowerCase()] ?? input.overall_wellbeing;
  const reds = sections.filter((s) => s.rag === "red").map((s) => s.title);
  const ambers = sections.filter((s) => s.rag === "amber").map((s) => s.title);
  const flagged = [...reds, ...ambers];
  const review_summary =
    `${input.child_name} (age ${input.age_years}) has been at the home ${months} month${months === 1 ? "" : "s"} and is currently assessed as ${wellbeingLabel.toLowerCase()}. ` +
    (input.headline ? `${input.headline} ` : "") +
    (flagged.length
      ? `For this review, focus on: ${flagged.join(", ")}.`
      : `All areas are settled; the review can focus on sustaining progress.`);

  // ── Recommendations (from priority actions, highest severity first) ──
  const sevRank: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const recommendations = [...(input.priority_actions ?? [])]
    .sort((a, b) => (sevRank[a.severity?.toLowerCase()] ?? 9) - (sevRank[b.severity?.toLowerCase()] ?? 9))
    .map((a) => a.action)
    .filter((a) => a && a.trim())
    .slice(0, 8);

  return {
    title: `LAC Review Pack — ${input.child_name}`,
    generated_for: today,
    child_name: input.child_name,
    age_years: input.age_years,
    demographics,
    overall_wellbeing: wellbeingLabel,
    headline: input.headline,
    review_summary,
    domain_scores: input.domain_scores ?? [],
    wishes_and_feelings: { captured: input.voice_captured, themes: input.recent_themes ?? [], narrative: wf_narrative },
    sections,
    strengths: (input.strengths ?? []).slice(0, 6),
    recommendations,
    key_dates: (input.key_dates ?? []).filter((d) => d && d.label && d.date).slice(0, 8),
  };
}

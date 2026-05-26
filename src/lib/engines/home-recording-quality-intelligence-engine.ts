// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME RECORDING QUALITY INTELLIGENCE ENGINE
// Home-level: analyses care form completion, review workflows, approval rates,
// timeliness, and form diversity to assess recording quality.
// CHR 2015 Reg 36 (Record Keeping). SCCIF: "Well-Led."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface CareFormInput {
  id: string;
  form_type: string;
  status: string;                    // draft | submitted | pending_review | approved
  priority: string;                  // urgent | high | medium | low
  has_linked_child: boolean;
  has_linked_incident: boolean;
  submitted_at: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  due_date: string;
  created_date: string;
}

export interface HomeRecordingInput {
  today: string;
  care_forms: CareFormInput[];
  lookback_days?: number;            // default 90
}

// ── Output Types ────────────────────────────────────────────────────────────

export type RecordingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface SubmissionProfile {
  total_forms: number;
  submitted_count: number;
  draft_count: number;
  submission_rate: number;
  overdue_count: number;             // past due_date and not approved
}

export interface ReviewProfile {
  pending_review_count: number;
  reviewed_count: number;
  review_rate: number;               // % of submitted forms that have been reviewed
  avg_review_days: number;           // avg days from submission to review
}

export interface ApprovalProfile {
  approved_count: number;
  approval_rate: number;             // % of reviewed forms approved
  avg_approval_days: number;         // avg days from submission to approval
}

export interface QualityProfile {
  urgent_count: number;
  high_priority_count: number;
  child_linked_rate: number;
  incident_linked_rate: number;
  form_type_count: number;
  urgent_unreviewed_count: number;
}

export interface RecordingInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface RecordingRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HomeRecordingResult {
  recording_rating: RecordingRating;
  recording_score: number;
  headline: string;
  submission_profile: SubmissionProfile;
  review_profile: ReviewProfile;
  approval_profile: ApprovalProfile;
  quality_profile: QualityProfile;
  strengths: string[];
  concerns: string[];
  recommendations: RecordingRecommendation[];
  insights: RecordingInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): RecordingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHomeRecordingQuality(
  input: HomeRecordingInput,
): HomeRecordingResult {
  const { today, care_forms: allForms, lookback_days = 90 } = input;

  // Filter to lookback window
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - lookback_days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const forms = allForms.filter(f => f.created_date >= cutoffStr && f.created_date <= today);

  // Insufficient data
  if (forms.length === 0) {
    return {
      recording_rating: "insufficient_data",
      recording_score: 0,
      headline: "No care form records found — recording quality data not available.",
      submission_profile: emptySubmissionProfile(),
      review_profile: emptyReviewProfile(),
      approval_profile: emptyApprovalProfile(),
      quality_profile: emptyQualityProfile(),
      strengths: [],
      concerns: ["No care form records — Ofsted expects comprehensive, well-maintained records that evidence the quality of care."],
      recommendations: [{ rank: 1, recommendation: "Establish a care form system with structured submission, review, and approval workflows.", urgency: "immediate", regulatory_ref: "Reg 36" }],
      insights: [{ text: "No care form records found. Without recording systems, the home cannot evidence safeguarding decisions, risk assessments, or daily care. Ofsted will assess recording quality as a core element of leadership and management.", severity: "critical" }],
    };
  }

  // ── Submission Profile ────────────────────────────────────────────
  const submitted = forms.filter(f => f.submitted_at !== null);
  const drafts = forms.filter(f => f.status === "draft");
  const submissionRate = pct(submitted.length, forms.length);
  const overdue = forms.filter(f =>
    f.due_date < today && f.status !== "approved"
  );

  const submissionProfile: SubmissionProfile = {
    total_forms: forms.length,
    submitted_count: submitted.length,
    draft_count: drafts.length,
    submission_rate: submissionRate,
    overdue_count: overdue.length,
  };

  // ── Review Profile ────────────────────────────────────────────────
  const reviewed = forms.filter(f => f.reviewed_at !== null);
  const pendingReview = forms.filter(f =>
    f.submitted_at !== null && f.reviewed_at === null && f.status !== "draft"
  );
  const reviewRate = pct(reviewed.length, submitted.length);

  // Average review days for reviewed forms
  const reviewDays: number[] = [];
  for (const f of reviewed) {
    if (f.submitted_at) {
      reviewDays.push(daysBetween(f.submitted_at.slice(0, 10), f.reviewed_at!.slice(0, 10)));
    }
  }
  const avgReviewDays = reviewDays.length > 0
    ? Math.round((reviewDays.reduce((a, b) => a + b, 0) / reviewDays.length) * 10) / 10
    : 0;

  const reviewProfile: ReviewProfile = {
    pending_review_count: pendingReview.length,
    reviewed_count: reviewed.length,
    review_rate: reviewRate,
    avg_review_days: avgReviewDays,
  };

  // ── Approval Profile ──────────────────────────────────────────────
  const approved = forms.filter(f => f.approved_at !== null);
  const approvalRate = pct(approved.length, reviewed.length);

  const approvalDays: number[] = [];
  for (const f of approved) {
    if (f.submitted_at) {
      approvalDays.push(daysBetween(f.submitted_at.slice(0, 10), f.approved_at!.slice(0, 10)));
    }
  }
  const avgApprovalDays = approvalDays.length > 0
    ? Math.round((approvalDays.reduce((a, b) => a + b, 0) / approvalDays.length) * 10) / 10
    : 0;

  const approvalProfile: ApprovalProfile = {
    approved_count: approved.length,
    approval_rate: approvalRate,
    avg_approval_days: avgApprovalDays,
  };

  // ── Quality Profile ───────────────────────────────────────────────
  const urgent = forms.filter(f => f.priority === "urgent");
  const highPriority = forms.filter(f => f.priority === "high");
  const childLinked = forms.filter(f => f.has_linked_child);
  const incidentLinked = forms.filter(f => f.has_linked_incident);
  const formTypes = new Set(forms.map(f => f.form_type));
  const urgentUnreviewed = urgent.filter(f => f.reviewed_at === null && f.submitted_at !== null);

  const qualityProfile: QualityProfile = {
    urgent_count: urgent.length,
    high_priority_count: highPriority.length,
    child_linked_rate: pct(childLinked.length, forms.length),
    incident_linked_rate: pct(incidentLinked.length, forms.length),
    form_type_count: formTypes.size,
    urgent_unreviewed_count: urgentUnreviewed.length,
  };

  // ── Scoring ───────────────────────────────────────────────────────
  // Base 52, max bonuses = 28, 52+28 = 80
  let score = 52;

  // 1. Submission rate (±5)
  if (submissionRate >= 90) score += 5;
  else if (submissionRate >= 70) score += 2;
  else if (submissionRate >= 50) score -= 1;
  else score -= 4;

  // 2. Review rate (±4)
  if (submitted.length > 0) {
    if (reviewRate >= 80) score += 4;
    else if (reviewRate >= 60) score += 1;
    else if (reviewRate >= 30) score -= 1;
    else score -= 3;
  }

  // 3. Review timeliness (±3)
  if (reviewDays.length > 0) {
    if (avgReviewDays <= 1) score += 3;
    else if (avgReviewDays <= 3) score += 1;
    else if (avgReviewDays <= 7) score -= 1;
    else score -= 2;
  }

  // 4. Approval rate (±4)
  if (reviewed.length > 0) {
    if (approvalRate >= 80) score += 4;
    else if (approvalRate >= 50) score += 1;
    else score -= 2;
  }

  // 5. Overdue forms (±3)
  if (overdue.length === 0) score += 3;
  else if (overdue.length <= 1) score += 1;
  else if (overdue.length <= 3) score -= 1;
  else score -= 2;

  // 6. Draft backlog (±3)
  const draftRate = pct(drafts.length, forms.length);
  if (draftRate <= 10) score += 3;
  else if (draftRate <= 25) score += 1;
  else if (draftRate <= 50) score -= 1;
  else score -= 2;

  // 7. Urgent handling (±3)
  if (urgent.length > 0) {
    if (urgentUnreviewed.length === 0) score += 3;
    else if (urgentUnreviewed.length === 1) score += 1;
    else score -= 2;
  } else {
    score += 1; // No urgent forms — neutral bonus
  }

  // 8. Form diversity (±3)
  if (formTypes.size >= 4) score += 3;
  else if (formTypes.size >= 2) score += 1;
  else score -= 1;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (submissionRate >= 90) strengths.push(`${submissionRate}% submission rate — comprehensive recording practice with minimal drafts.`);
  if (reviewRate >= 80 && submitted.length > 0) strengths.push(`${reviewRate}% review rate — consistent management oversight of recordings.`);
  if (avgReviewDays <= 1 && reviewDays.length > 0) strengths.push(`Average review within ${avgReviewDays} days — rapid management response to submissions.`);
  if (approvalRate >= 80 && reviewed.length > 0) strengths.push(`${approvalRate}% approval rate — strong quality assurance workflow.`);
  if (overdue.length === 0) strengths.push("No overdue forms — all recording deadlines met.");
  if (urgentUnreviewed.length === 0 && urgent.length > 0) strengths.push("All urgent forms reviewed — critical recordings prioritised appropriately.");
  if (formTypes.size >= 4) strengths.push(`${formTypes.size} form types in use — comprehensive recording across different care domains.`);

  // ── Concerns ──────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (drafts.length > 0 && draftRate > 25) concerns.push(`${drafts.length} forms still in draft (${draftRate}%) — incomplete recordings represent a governance gap.`);
  if (overdue.length > 0) concerns.push(`${overdue.length} form${overdue.length > 1 ? "s" : ""} overdue — recording deadlines not being met.`);
  if (reviewRate < 50 && submitted.length > 0) concerns.push(`Only ${reviewRate}% review rate — most submitted forms lack management oversight.`);
  if (pendingReview.length > 0) concerns.push(`${pendingReview.length} form${pendingReview.length > 1 ? "s" : ""} awaiting review — management review backlog.`);
  if (urgentUnreviewed.length > 0) concerns.push(`${urgentUnreviewed.length} urgent form${urgentUnreviewed.length > 1 ? "s" : ""} not yet reviewed — critical recordings need immediate attention.`);
  if (avgReviewDays > 7 && reviewDays.length > 0) concerns.push(`Average review taking ${avgReviewDays} days — significant delay in management oversight.`);
  if (submissionRate < 50) concerns.push("Fewer than half of forms have been submitted — significant recording gap.");

  // ── Recommendations ───────────────────────────────────────────────
  const recs: RecordingRecommendation[] = [];
  let rank = 1;

  if (urgentUnreviewed.length > 0) {
    recs.push({ rank: rank++, recommendation: `Review ${urgentUnreviewed.length} urgent form${urgentUnreviewed.length > 1 ? "s" : ""} immediately — urgent recordings must be reviewed on the day of submission.`, urgency: "immediate", regulatory_ref: "Reg 36" });
  }
  if (overdue.length > 2) {
    recs.push({ rank: rank++, recommendation: `Clear ${overdue.length} overdue forms — assign responsibility and set completion deadlines within 48 hours.`, urgency: "immediate", regulatory_ref: "Reg 36" });
  }
  if (reviewRate < 50 && submitted.length > 0) {
    recs.push({ rank: rank++, recommendation: "Implement daily review of submitted forms — management must evidence oversight of all recordings.", urgency: "soon", regulatory_ref: "Reg 36" });
  }
  if (draftRate > 25) {
    recs.push({ rank: rank++, recommendation: `Complete ${drafts.length} draft forms — staff should be supported to finish recordings promptly.`, urgency: "soon", regulatory_ref: "Reg 36" });
  }
  if (formTypes.size < 3) {
    recs.push({ rank: rank++, recommendation: "Diversify recording types — ensure forms cover risk assessments, safeguarding referrals, and daily observations.", urgency: "planned", regulatory_ref: "Reg 36" });
  }

  // ── Insights ──────────────────────────────────────────────────────
  const insights: RecordingInsight[] = [];

  if (submissionRate >= 90 && reviewRate >= 80 && overdue.length === 0) {
    insights.push({ text: `Recording quality is exemplary — ${submissionRate}% submitted, ${reviewRate}% reviewed, and no overdue forms. Ofsted will see a home where recording practice is embedded in daily work, with management providing consistent oversight and quality assurance.`, severity: "positive" });
  }
  if (urgentUnreviewed.length > 0) {
    insights.push({ text: `${urgentUnreviewed.length} urgent form${urgentUnreviewed.length > 1 ? "s" : ""} unreviewed. Urgent recordings — safeguarding referrals, serious incidents — require same-day management review. Delays risk key information being missed and undermine the home's safeguarding response.`, severity: "critical" });
  }
  if (reviewRate < 30 && submitted.length > 0) {
    insights.push({ text: `Review rate is only ${reviewRate}%. When management does not review recordings, there is no quality check on the accuracy and completeness of what staff document. Ofsted expects evidence that the registered manager maintains active oversight of all significant records.`, severity: "critical" });
  }
  if (overdue.length > 0 && drafts.length > 0) {
    insights.push({ text: `${overdue.length} overdue and ${drafts.length} draft forms. This combination suggests recording is seen as an administrative burden rather than a safeguarding tool. Children's safety depends on timely, accurate recording — the home needs to reframe recording as a core care activity.`, severity: "warning" });
  }
  if (formTypes.size >= 4 && submissionRate >= 80) {
    insights.push({ text: `${formTypes.size} form types in use with ${submissionRate}% submission rate. This shows a well-developed recording culture spanning risk assessments, safeguarding, supervision, and daily care — exactly what Ofsted wants to see in a well-led home.`, severity: "positive" });
  }

  // ── Headline ──────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding recording quality — ${submissionRate}% submitted, ${reviewRate}% reviewed, and ${formTypes.size} form types in use.`;
  } else if (rating === "good") {
    headline = `Good recording practice — consistent submissions with minor gaps in review or approval.`;
  } else if (rating === "adequate") {
    headline = "Adequate recording quality — submission and review rates need improvement to evidence quality care.";
  } else {
    headline = "Recording quality is inadequate — low submission, review gaps, or overdue forms undermine governance.";
  }

  return {
    recording_rating: rating,
    recording_score: score,
    headline,
    submission_profile: submissionProfile,
    review_profile: reviewProfile,
    approval_profile: approvalProfile,
    quality_profile: qualityProfile,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

// ── Empty Profiles ──────────────────────────────────────────────────────────

function emptySubmissionProfile(): SubmissionProfile {
  return { total_forms: 0, submitted_count: 0, draft_count: 0, submission_rate: 0, overdue_count: 0 };
}

function emptyReviewProfile(): ReviewProfile {
  return { pending_review_count: 0, reviewed_count: 0, review_rate: 0, avg_review_days: 0 };
}

function emptyApprovalProfile(): ApprovalProfile {
  return { approved_count: 0, approval_rate: 0, avg_approval_days: 0 };
}

function emptyQualityProfile(): QualityProfile {
  return { urgent_count: 0, high_priority_count: 0, child_linked_rate: 0, incident_linked_rate: 0, form_type_count: 0, urgent_unreviewed_count: 0 };
}

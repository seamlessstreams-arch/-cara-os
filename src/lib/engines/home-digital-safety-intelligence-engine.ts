// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME DIGITAL SAFETY INTELLIGENCE ENGINE
// Home-level: aggregates online safety incidents, agreements, photo consents,
// media consents, and digital safeguarding posture across all children.
// KCSIE 2024: "Online safety — schools/settings must have appropriate systems."
// CHR 2015 Reg 12/13: "Protection of children — safeguarding arrangements."
// ══════════════════════════════════════════════════════════════════════════════

// ── Input types ─────────────────────────────────────────────────────────────

export const ALL_INCIDENT_CATEGORIES = [
  "cyberbullying", "inappropriate_content", "contact_risk", "sharing_images",
  "gaming_risk", "social_media", "radicalisation", "financial_scam",
  "data_privacy", "excessive_use",
] as const;

export interface OnlineSafetyIncidentInput {
  id: string;
  child_id: string;
  date: string;
  category: string;
  severity: string;           // low | medium | high | critical
  status: string;             // open | monitoring | resolved | escalated
  platform: string;
  safeguarding_referral: boolean;
  parent_carer_notified: boolean;
  actions_taken: string[];
}

export interface OnlineSafetyAgreementInput {
  id: string;
  child_id: string;
  agreement_date: string;
  review_date: string;
  child_signature: boolean;
  devices: string[];
  restrictions: string[];
  parental_controls: string;
}

export interface PhotoConsentInput {
  id: string;
  child_id: string;
  last_review_date: string;
  next_review_date: string;
  social_worker_consent: boolean;
  permissions_count: number;
}

export interface MediaConsentInput {
  id: string;
  child_id: string;
  consent_requested_date: string;
  expiry_of_consent: string;
  child_gave_consent: string;   // yes_explicit | yes_assenting | declined | unsure_withdrawn | conditional | not_asked_inappropriate
  parental_responsibility_consent: boolean;
  la_consent: boolean;
}

export interface HomeDigitalSafetyInput {
  today: string;
  incidents: OnlineSafetyIncidentInput[];
  agreements: OnlineSafetyAgreementInput[];
  photo_consents: PhotoConsentInput[];
  media_consents: MediaConsentInput[];
  total_children: number;
}

// ── Output types ────────────────────────────────────────────────────────────

export type DigitalSafetyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface IncidentProfile {
  total_incidents_90d: number;
  open_incidents: number;
  escalated_incidents: number;
  high_severity_count: number;
  by_category: Record<string, number>;
  safeguarding_referral_rate: number | null;
  parent_notification_rate: number | null;
  resolution_rate: number | null;
}

export interface AgreementProfile {
  children_with_agreements: number;
  agreement_coverage_rate: number | null;
  signed_rate: number | null;
  overdue_reviews: number;
  with_parental_controls: number;
  avg_devices_per_child: number | null;
}

export interface ConsentProfile {
  children_with_photo_consent: number;
  photo_consent_coverage_rate: number | null;
  overdue_photo_reviews: number;
  media_consents_active: number;
  expired_media_consents: number;
  child_consent_rate: number | null;
}

export interface HomeDigitalSafetyResult {
  digital_safety_rating: DigitalSafetyRating;
  digital_safety_score: number | null;
  headline: string;
  incidents: IncidentProfile;
  agreements: AgreementProfile;
  consents: ConsentProfile;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[];
  insights: { text: string; severity: string }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeHomeDigitalSafety(
  input: HomeDigitalSafetyInput,
): HomeDigitalSafetyResult {
  const { today, incidents, agreements, photo_consents, media_consents, total_children } = input;

  // ── Insufficient data guard ───────────────────────────────────────────
  if (total_children === 0) {
    return {
      digital_safety_rating: "insufficient_data",
      digital_safety_score: 0,
      headline: "No children in placement — digital safety cannot be assessed.",
      incidents: { total_incidents_90d: 0, open_incidents: 0, escalated_incidents: 0, high_severity_count: 0, by_category: {}, safeguarding_referral_rate: null, parent_notification_rate: null, resolution_rate: null },
      agreements: { children_with_agreements: 0, agreement_coverage_rate: null, signed_rate: null, overdue_reviews: 0, with_parental_controls: 0, avg_devices_per_child: 0 },
      consents: { children_with_photo_consent: 0, photo_consent_coverage_rate: null, overdue_photo_reviews: 0, media_consents_active: 0, expired_media_consents: 0, child_consent_rate: null },
      strengths: [],
      concerns: ["No children in placement — digital safety analysis unavailable."],
      recommendations: [],
      insights: [],
    };
  }

  // ── Incidents (90-day window) ─────────────────────────────────────────
  const incidents90d = incidents.filter(i => {
    const d = daysBetween(i.date, today);
    return d >= 0 && d <= 90;
  });

  const openIncidents = incidents90d.filter(i => i.status === "open" || i.status === "monitoring").length;
  const escalatedIncidents = incidents90d.filter(i => i.status === "escalated").length;
  const resolvedIncidents = incidents90d.filter(i => i.status === "resolved").length;
  const highSeverity = incidents90d.filter(i => i.severity === "high" || i.severity === "critical").length;

  const byCategory: Record<string, number> = {};
  for (const inc of incidents90d) {
    byCategory[inc.category] = (byCategory[inc.category] ?? 0) + 1;
  }

  const withActions = incidents90d.filter(i => i.actions_taken.length > 0);
  const safeguardingReferralRate = pct(incidents90d.filter(i => i.safeguarding_referral).length, incidents90d.length);
  const parentNotificationRate = pct(incidents90d.filter(i => i.parent_carer_notified).length, incidents90d.length);
  const resolutionRate = pct(resolvedIncidents, incidents90d.length);

  const incidentProfile: IncidentProfile = {
    total_incidents_90d: incidents90d.length,
    open_incidents: openIncidents,
    escalated_incidents: escalatedIncidents,
    high_severity_count: highSeverity,
    by_category: byCategory,
    safeguarding_referral_rate: safeguardingReferralRate,
    parent_notification_rate: parentNotificationRate,
    resolution_rate: resolutionRate,
  };

  // ── Agreements ────────────────────────────────────────────────────────
  const childrenWithAgreements = new Set(agreements.map(a => a.child_id)).size;
  const agreementCoverageRate = pct(childrenWithAgreements, total_children);
  const signedAgreements = agreements.filter(a => a.child_signature);
  const signedRate = pct(signedAgreements.length, agreements.length);
  const overdueAgreementReviews = agreements.filter(a => daysBetween(a.review_date, today) > 0).length;
  const withParentalControls = agreements.filter(a => a.parental_controls !== "" && a.parental_controls !== "none").length;
  const totalDevices = agreements.reduce((sum, a) => sum + a.devices.length, 0);
  const avgDevicesPerChild = agreements.length > 0
    ? Math.round((totalDevices / agreements.length) * 10) / 10
    : null;

  const agreementProfile: AgreementProfile = {
    children_with_agreements: childrenWithAgreements,
    agreement_coverage_rate: agreementCoverageRate,
    signed_rate: signedRate,
    overdue_reviews: overdueAgreementReviews,
    with_parental_controls: withParentalControls,
    avg_devices_per_child: avgDevicesPerChild,
  };

  // ── Photo & Media Consents ────────────────────────────────────────────
  const childrenWithPhotoConsent = new Set(photo_consents.map(p => p.child_id)).size;
  const photoConsentCoverageRate = pct(childrenWithPhotoConsent, total_children);
  const overduePhotoReviews = photo_consents.filter(p => daysBetween(p.next_review_date, today) > 0).length;

  const activeMediaConsents = media_consents.filter(m => daysBetween(today, m.expiry_of_consent) >= 0).length;
  const expiredMediaConsents = media_consents.filter(m => daysBetween(today, m.expiry_of_consent) < 0).length;
  const consentedMedia = media_consents.filter(m =>
    m.child_gave_consent === "yes_explicit" || m.child_gave_consent === "yes_assenting",
  );
  const childConsentRate = pct(consentedMedia.length, media_consents.length);

  const consentProfile: ConsentProfile = {
    children_with_photo_consent: childrenWithPhotoConsent,
    photo_consent_coverage_rate: photoConsentCoverageRate,
    overdue_photo_reviews: overduePhotoReviews,
    media_consents_active: activeMediaConsents,
    expired_media_consents: expiredMediaConsents,
    child_consent_rate: childConsentRate,
  };

  // ── Scoring ───────────────────────────────────────────────────────────
  // Base 52 + max bonuses 28 = 80 (outstanding threshold)
  let score = 52;

  // mod1: Agreement coverage (±5) — every child should have an online safety agreement
  if (agreementCoverageRate >= 100) score += 5;
  else if (agreementCoverageRate >= 75) score += 3;
  else if (agreementCoverageRate >= 50) score += 0;
  else if (agreementCoverageRate >= 25) score -= 2;
  else score -= 5;

  // mod2: Photo consent coverage (±4) — GDPR compliance
  if (photoConsentCoverageRate >= 100) score += 4;
  else if (photoConsentCoverageRate >= 75) score += 2;
  else if (photoConsentCoverageRate >= 50) score += 0;
  else score -= 4;

  // mod3: Incident response quality (±4) — actions taken on incidents
  if (incidents90d.length === 0) {
    score += 3; // No incidents with good agreements = proactive prevention
  } else {
    const actionRate = pct(withActions.length, incidents90d.length);
    if (actionRate >= 100 && parentNotificationRate >= 80) score += 4;
    else if (actionRate >= 80) score += 2;
    else if (actionRate >= 50) score += 0;
    else score -= 4;
  }

  // mod4: Agreement signing (±3) — child participation in digital safety
  if (agreements.length === 0) {
    score -= 3;
  } else {
    if (signedRate >= 100) score += 3;
    else if (signedRate >= 75) score += 1;
    else if (signedRate >= 50) score += 0;
    else score -= 3;
  }

  // mod5: Overdue reviews (±4) — keeping agreements and consents current
  const totalOverdue = overdueAgreementReviews + overduePhotoReviews;
  if (totalOverdue === 0) score += 4;
  else if (totalOverdue <= 2) score += 1;
  else if (totalOverdue <= 4) score -= 1;
  else score -= 4;

  // mod6: Open high-severity incidents (±3) — unresolved risks
  if (highSeverity === 0) score += 3;
  else if (highSeverity === 1 && openIncidents === 0) score += 1;
  else if (highSeverity <= 2) score += 0;
  else score -= 3;

  // mod7: Parental controls configured (±3) — technical safeguards
  if (agreements.length === 0) {
    score -= 2;
  } else {
    const controlRate = pct(withParentalControls, agreements.length);
    if (controlRate >= 80) score += 3;
    else if (controlRate >= 50) score += 1;
    else if (controlRate >= 25) score += 0;
    else score -= 3;
  }

  // mod8: Media consent governance (±2) — expired consents and child voice
  if (media_consents.length === 0 && photo_consents.length === 0) {
    score -= 1;
  } else if (expiredMediaConsents === 0 && childConsentRate >= 80) {
    score += 2;
  } else if (expiredMediaConsents <= 1) {
    score += 1;
  } else {
    score -= 2;
  }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // ── Rating ────────────────────────────────────────────────────────────
  let digital_safety_rating: DigitalSafetyRating;
  if (score >= 80) digital_safety_rating = "outstanding";
  else if (score >= 65) digital_safety_rating = "good";
  else if (score >= 45) digital_safety_rating = "adequate";
  else digital_safety_rating = "inadequate";

  // ── Strengths / Concerns / Recommendations / Insights ─────────────────
  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendations: { rank: number; recommendation: string; urgency: string; regulatory_ref: string | null }[] = [];
  const insights: { text: string; severity: string }[] = [];
  let rank = 0;

  // Strengths
  if (agreementCoverageRate >= 100) strengths.push("Every child has an online safety agreement — proactive digital safeguarding embedded in practice.");
  if (signedRate >= 100 && agreements.length > 0) strengths.push("All online safety agreements signed by children — strong child participation in digital safety.");
  if (photoConsentCoverageRate >= 100) strengths.push("Photo consent records in place for all children — GDPR-compliant image management.");
  if (incidents90d.length > 0 && resolutionRate >= 80) strengths.push(`${resolutionRate}% of online safety incidents resolved — effective incident response.`);
  if (incidents90d.length === 0 && agreementCoverageRate >= 75) strengths.push("No online safety incidents in 90 days with good agreement coverage — preventive approach working.");
  if (totalOverdue === 0 && agreements.length > 0) strengths.push("All agreements and consents reviewed on schedule — governance is current.");

  // Concerns
  if (agreementCoverageRate < 100 && total_children > childrenWithAgreements) {
    concerns.push(`${total_children - childrenWithAgreements} child${(total_children - childrenWithAgreements) > 1 ? "ren" : ""} without online safety agreements.`);
  }
  if (openIncidents >= 3) concerns.push(`${openIncidents} online safety incidents remain open — timely resolution is essential.`);
  if (highSeverity >= 2) concerns.push(`${highSeverity} high/critical severity online safety incidents in 90 days — escalation patterns require review.`);
  if (overdueAgreementReviews > 0) concerns.push(`${overdueAgreementReviews} online safety agreement review${overdueAgreementReviews > 1 ? "s" : ""} overdue.`);
  if (overduePhotoReviews > 0) concerns.push(`${overduePhotoReviews} photo consent review${overduePhotoReviews > 1 ? "s" : ""} overdue — GDPR compliance risk.`);
  if (expiredMediaConsents > 0) concerns.push(`${expiredMediaConsents} expired media consent${expiredMediaConsents > 1 ? "s" : ""} — may need renewal or archiving.`);
  if (parentNotificationRate < 50 && incidents90d.length > 0) concerns.push(`Parent/carer notification rate only ${parentNotificationRate}% for online safety incidents.`);

  // Recommendations
  if (agreementCoverageRate < 100) {
    recommendations.push({ rank: ++rank, recommendation: "Create online safety agreements for all children — each child needs an individualised digital safety plan.", urgency: agreementCoverageRate < 50 ? "immediate" : "soon", regulatory_ref: "KCSIE" });
  }
  if (overdueAgreementReviews > 0 || overduePhotoReviews > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Complete overdue agreement and consent reviews to maintain governance compliance.", urgency: totalOverdue > 3 ? "immediate" : "soon", regulatory_ref: "Reg 13" });
  }
  if (openIncidents >= 2) {
    recommendations.push({ rank: ++rank, recommendation: "Prioritise resolution of open online safety incidents — assign owners and set target dates.", urgency: "soon", regulatory_ref: "Reg 12" });
  }
  if (signedRate < 75 && agreements.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Ensure children sign their online safety agreements — use direct work to discuss digital safety.", urgency: "planned", regulatory_ref: "KCSIE" });
  }
  if (parentNotificationRate < 80 && incidents90d.length > 0) {
    recommendations.push({ rank: ++rank, recommendation: "Improve parent/carer notification when online safety incidents occur — partnership working is essential.", urgency: "soon", regulatory_ref: "Reg 12" });
  }

  // Cara Insights
  if (agreementCoverageRate >= 100 && photoConsentCoverageRate >= 100 && signedRate >= 100 && totalOverdue === 0) {
    insights.push({ text: "Digital safety governance is exemplary. Every child has a signed agreement, consents are current, and reviews are on schedule. This demonstrates proactive digital safeguarding that Ofsted will recognise as outstanding.", severity: "positive" });
  }
  if (highSeverity >= 3) {
    insights.push({ text: `${highSeverity} high/critical online safety incidents in 90 days. This pattern suggests systemic digital safety vulnerabilities — consider reviewing parental controls, monitoring tools, and direct work programmes.`, severity: "critical" });
  }
  if (escalatedIncidents >= 2) {
    insights.push({ text: `${escalatedIncidents} incidents escalated — this may indicate that initial response is insufficient or that risk assessment at first report needs strengthening.`, severity: "warning" });
  }
  if (agreements.length > 0 && signedRate < 50) {
    insights.push({ text: `Only ${signedRate}% of agreements signed by children. The child's voice in digital safety is weak — Article 12 UNCRC requires their informed participation.`, severity: "warning" });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (digital_safety_rating === "outstanding") {
    headline = `Outstanding digital safety — ${childrenWithAgreements} children covered with ${incidents90d.length === 0 ? "no incidents" : "all incidents managed"}.`;
  } else if (digital_safety_rating === "good") {
    headline = `Good digital safeguarding — ${agreementCoverageRate}% agreement coverage. ${concerns.length > 0 ? concerns.length + " area" + (concerns.length > 1 ? "s" : "") + " for improvement." : ""}`;
  } else if (digital_safety_rating === "adequate") {
    headline = `Digital safety requires improvement — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified.`;
  } else {
    headline = `Digital safety is inadequate — significant gaps in agreements, consents, or incident response.`;
  }

  return {
    digital_safety_rating,
    digital_safety_score: score,
    headline,
    incidents: incidentProfile,
    agreements: agreementProfile,
    consents: consentProfile,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}

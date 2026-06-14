// ==============================================================================
// CARA -- HOLIDAY & TRIP PLANNING SERVICE
// Tracks day trips, overnight stays, holidays, educational visits, cultural outings,
// sporting events, and other trips for looked-after children. Covers risk assessments,
// parental/social worker consent, passport checks, insurance, emergency contacts,
// medication, dietary needs, staffing ratios, transport, budgets, child choice,
// and enjoyment ratings.
//
// UK Regulatory Framework:
// CHR 2015 Reg 9 (quality of care — enjoyment/activities),
// Reg 12 (risk assessment for trips),
// SCCIF: Experiences — "Children enjoy holidays and outings."
// Reg 40 (notification for holidays abroad).
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const TRIP_TYPES = [
  "Day Trip",
  "Overnight Stay",
  "Weekend Away",
  "UK Holiday",
  "International Holiday",
  "Educational Visit",
  "Cultural Visit",
  "Theme Park",
  "Beach/Seaside",
  "Countryside",
  "City Break",
  "Sporting Event",
  "Concert/Show",
  "Family Contact Trip",
  "Respite Break",
] as const;
export type TripType = (typeof TRIP_TYPES)[number];

export const ENJOYMENT_RATINGS = [
  "Really Enjoyed",
  "Enjoyed",
  "OK",
  "Didn't Enjoy",
  "Refused to Go",
] as const;
export type EnjoymentRating = (typeof ENJOYMENT_RATINGS)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const INTERNATIONAL_TRIPS: TripType[] = [
  "International Holiday",
];

export const OVERNIGHT_TRIPS: TripType[] = [
  "Overnight Stay",
  "Weekend Away",
  "UK Holiday",
  "International Holiday",
  "City Break",
  "Respite Break",
];

export const EDUCATIONAL_TRIPS: TripType[] = [
  "Educational Visit",
  "Cultural Visit",
];

export const LEISURE_TRIPS: TripType[] = [
  "Day Trip",
  "Theme Park",
  "Beach/Seaside",
  "Countryside",
  "Sporting Event",
  "Concert/Show",
];

export const POSITIVE_ENJOYMENT: EnjoymentRating[] = [
  "Really Enjoyed",
  "Enjoyed",
];

export const NEGATIVE_ENJOYMENT: EnjoymentRating[] = [
  "Didn't Enjoy",
  "Refused to Go",
];

// -- Label maps ---------------------------------------------------------------

export const TRIP_TYPE_LABELS: { type: TripType; label: string }[] = [
  { type: "Day Trip", label: "Day Trip" },
  { type: "Overnight Stay", label: "Overnight Stay" },
  { type: "Weekend Away", label: "Weekend Away" },
  { type: "UK Holiday", label: "UK Holiday" },
  { type: "International Holiday", label: "International Holiday" },
  { type: "Educational Visit", label: "Educational Visit" },
  { type: "Cultural Visit", label: "Cultural Visit" },
  { type: "Theme Park", label: "Theme Park" },
  { type: "Beach/Seaside", label: "Beach / Seaside" },
  { type: "Countryside", label: "Countryside" },
  { type: "City Break", label: "City Break" },
  { type: "Sporting Event", label: "Sporting Event" },
  { type: "Concert/Show", label: "Concert / Show" },
  { type: "Family Contact Trip", label: "Family Contact Trip" },
  { type: "Respite Break", label: "Respite Break" },
];

export const ENJOYMENT_RATING_LABELS: { rating: EnjoymentRating; label: string }[] = [
  { rating: "Really Enjoyed", label: "Really Enjoyed" },
  { rating: "Enjoyed", label: "Enjoyed" },
  { rating: "OK", label: "OK" },
  { rating: "Didn't Enjoy", label: "Didn't Enjoy" },
  { rating: "Refused to Go", label: "Refused to Go" },
];

// -- Row type -----------------------------------------------------------------

export interface HolidayTripPlanningRow {
  id: string;
  home_id: string;
  child_name: string;
  trip_date: string;
  return_date: string | null;
  organiser_name: string;
  trip_type: TripType;
  destination: string;
  risk_assessment_completed: boolean;
  parental_consent: boolean;
  social_worker_consent: boolean | null;
  passport_checked: boolean | null;
  insurance_arranged: boolean;
  emergency_contacts_provided: boolean;
  medication_packed: boolean | null;
  dietary_needs_catered: boolean;
  staffing_ratio_met: boolean;
  transport_arranged: string | null;
  budget: number | null;
  actual_cost: number | null;
  child_choice: boolean;
  child_enjoyment_rating: EnjoymentRating | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateHolidayTripPlanning(input: {
  childName?: string;
  tripDate?: string;
  returnDate?: string | null;
  organiserName?: string;
  tripType?: string;
  destination?: string;
  riskAssessmentCompleted?: boolean;
  parentalConsent?: boolean;
  socialWorkerConsent?: boolean | null;
  passportChecked?: boolean | null;
  insuranceArranged?: boolean;
  emergencyContactsProvided?: boolean;
  staffingRatioMet?: boolean;
  childEnjoymentRating?: string | null;
  budget?: number | null;
  actualCost?: number | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }

  if (!input.tripDate) {
    errors.push("Trip date is required");
  } else {
    const dateObj = new Date(input.tripDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Trip date must be a valid date");
    }
  }

  if (input.returnDate) {
    const retObj = new Date(input.returnDate);
    if (isNaN(retObj.getTime())) {
      errors.push("Return date must be a valid date");
    } else if (input.tripDate && new Date(input.returnDate) < new Date(input.tripDate)) {
      errors.push("Return date cannot be before trip date");
    }
  }

  if (!input.organiserName || input.organiserName.trim().length === 0) {
    errors.push("Organiser name is required");
  }

  if (
    !input.tripType ||
    !(TRIP_TYPES as readonly string[]).includes(input.tripType)
  ) {
    errors.push(`Trip type must be one of: ${TRIP_TYPES.join(", ")}`);
  }

  if (!input.destination || input.destination.trim().length === 0) {
    errors.push("Destination is required");
  }

  if (
    input.childEnjoymentRating &&
    !(ENJOYMENT_RATINGS as readonly string[]).includes(input.childEnjoymentRating)
  ) {
    errors.push(`Enjoyment rating must be one of: ${ENJOYMENT_RATINGS.join(", ")}`);
  }

  if (input.budget !== undefined && input.budget !== null && input.budget < 0) {
    errors.push("Budget cannot be negative");
  }

  if (input.actualCost !== undefined && input.actualCost !== null && input.actualCost < 0) {
    errors.push("Actual cost cannot be negative");
  }

  // Business rule: Risk assessment is mandatory for all trips
  if (input.riskAssessmentCompleted === false) {
    errors.push(
      "Risk assessment not completed — CHR 2015 Reg 12 requires a documented risk assessment for all trips and outings. This must cover travel risks, activity-specific hazards, individual child risks (including health needs, emotional triggers, absconding risk), emergency procedures, and supervision arrangements. No trip should proceed without a completed risk assessment signed off by the Registered Manager or delegated senior staff member",
    );
  }

  // Business rule: International trips must have social worker consent and passport check
  if (input.tripType === "International Holiday") {
    if (input.socialWorkerConsent === false || input.socialWorkerConsent === null) {
      errors.push(
        "Social worker consent not obtained for international holiday — CHR 2015 Reg 40 requires notification to Ofsted for holidays abroad, and the placing authority (social worker/IRO) must approve international travel. For children subject to care orders, the local authority holds parental responsibility and must consent. For section 20 accommodated children, parents retain full parental responsibility and their consent is essential. International travel without proper authorisation may constitute a criminal offence",
      );
    }
    if (input.passportChecked === false || input.passportChecked === null) {
      errors.push(
        "Passport not checked for international holiday — the home must verify that the child has a valid passport before any international travel is planned. For looked-after children, passport applications require the consent of those with parental responsibility and may take several weeks. The passport should be checked well in advance of the trip date",
      );
    }
  }

  // Business rule: Overnight trips require additional safety
  if (
    input.tripType &&
    (OVERNIGHT_TRIPS as string[]).includes(input.tripType)
  ) {
    if (input.emergencyContactsProvided === false) {
      errors.push(
        `Emergency contacts not provided for ${input.tripType} — overnight stays away from the home require comprehensive emergency contact arrangements including: the home's on-call number, the child's social worker, the child's parents (where appropriate), local emergency services at the destination, and the nearest hospital to the accommodation`,
      );
    }
    if (input.insuranceArranged === false) {
      errors.push(
        `Insurance not arranged for ${input.tripType} — the home should ensure appropriate insurance cover is in place for overnight trips, including public liability, personal accident, and for international trips, comprehensive travel insurance covering medical expenses and repatriation`,
      );
    }
  }

  // Business rule: Staffing ratio must be met
  if (input.staffingRatioMet === false) {
    errors.push(
      "Staffing ratio not met — CHR 2015 Reg 15 requires sufficient staffing at all times. For trips and outings, staffing ratios must account for the activity being undertaken, the needs of individual children, any specific risk factors, and the environment. Higher-risk activities (water-based, adventure, busy urban environments) typically require lower child-to-staff ratios. The ratio should be determined as part of the risk assessment",
    );
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: HolidayTripPlanningRow[],
): {
  total_trips: number;
  unique_children: number;
  by_trip_type: Record<string, number>;
  by_enjoyment_rating: Record<string, number>;
  risk_assessment_rate: number;
  parental_consent_rate: number;
  insurance_rate: number;
  emergency_contacts_rate: number;
  staffing_ratio_rate: number;
  child_choice_rate: number;
  dietary_needs_rate: number;
  positive_enjoyment_rate: number;
  negative_enjoyment_rate: number;
  overnight_count: number;
  international_count: number;
  educational_count: number;
  leisure_count: number;
  total_budget: number;
  total_actual_cost: number;
  average_trip_cost: number;
  average_trips_per_child: number;
  budget_variance: number;
} {
  const total = rows.length;

  const uniqueChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));

  // Trip type breakdown
  const byTripType: Record<string, number> = {};
  for (const tt of TRIP_TYPES) byTripType[tt] = 0;
  for (const r of rows) byTripType[r.trip_type] = (byTripType[r.trip_type] || 0) + 1;

  // Enjoyment breakdown
  const byEnjoyment: Record<string, number> = {};
  for (const er of ENJOYMENT_RATINGS) byEnjoyment[er] = 0;
  const ratedRows = rows.filter((r) => r.child_enjoyment_rating !== null);
  for (const r of ratedRows) byEnjoyment[r.child_enjoyment_rating!] = (byEnjoyment[r.child_enjoyment_rating!] || 0) + 1;

  // Boolean rates
  const pct = (filter: (r: HolidayTripPlanningRow) => boolean) =>
    total > 0 ? Math.round((rows.filter(filter).length / total) * 1000) / 10 : 0;

  const riskAssessmentRate = pct((r) => r.risk_assessment_completed);
  const parentalConsentRate = pct((r) => r.parental_consent);
  const insuranceRate = pct((r) => r.insurance_arranged);
  const emergencyContactsRate = pct((r) => r.emergency_contacts_provided);
  const staffingRatioRate = pct((r) => r.staffing_ratio_met);
  const childChoiceRate = pct((r) => r.child_choice);
  const dietaryNeedsRate = pct((r) => r.dietary_needs_catered);

  // Enjoyment rates (only from rated rows)
  const positiveEnjoymentRate = ratedRows.length > 0
    ? Math.round(
        (ratedRows.filter((r) => (POSITIVE_ENJOYMENT as string[]).includes(r.child_enjoyment_rating!)).length /
          ratedRows.length) *
          1000,
      ) / 10
    : 0;

  const negativeEnjoymentRate = ratedRows.length > 0
    ? Math.round(
        (ratedRows.filter((r) => (NEGATIVE_ENJOYMENT as string[]).includes(r.child_enjoyment_rating!)).length /
          ratedRows.length) *
          1000,
      ) / 10
    : 0;

  // Category counts
  const overnightCount = rows.filter((r) => (OVERNIGHT_TRIPS as string[]).includes(r.trip_type)).length;
  const internationalCount = rows.filter((r) => (INTERNATIONAL_TRIPS as string[]).includes(r.trip_type)).length;
  const educationalCount = rows.filter((r) => (EDUCATIONAL_TRIPS as string[]).includes(r.trip_type)).length;
  const leisureCount = rows.filter((r) => (LEISURE_TRIPS as string[]).includes(r.trip_type)).length;

  // Financial metrics
  const totalBudget = rows.reduce((sum, r) => sum + (Number(r.budget) || 0), 0);
  const totalActualCost = rows.reduce((sum, r) => sum + (Number(r.actual_cost) || 0), 0);
  const costedRows = rows.filter((r) => r.actual_cost !== null);
  const avgCost = costedRows.length > 0
    ? Math.round((totalActualCost / costedRows.length) * 100) / 100
    : 0;
  const budgetVariance = totalBudget > 0
    ? Math.round(((totalActualCost - totalBudget) / totalBudget) * 1000) / 10
    : 0;

  const avgPerChild = uniqueChildren.size > 0
    ? Math.round((total / uniqueChildren.size) * 10) / 10
    : 0;

  return {
    total_trips: total,
    unique_children: uniqueChildren.size,
    by_trip_type: byTripType,
    by_enjoyment_rating: byEnjoyment,
    risk_assessment_rate: riskAssessmentRate,
    parental_consent_rate: parentalConsentRate,
    insurance_rate: insuranceRate,
    emergency_contacts_rate: emergencyContactsRate,
    staffing_ratio_rate: staffingRatioRate,
    child_choice_rate: childChoiceRate,
    dietary_needs_rate: dietaryNeedsRate,
    positive_enjoyment_rate: positiveEnjoymentRate,
    negative_enjoyment_rate: negativeEnjoymentRate,
    overnight_count: overnightCount,
    international_count: internationalCount,
    educational_count: educationalCount,
    leisure_count: leisureCount,
    total_budget: Math.round(totalBudget * 100) / 100,
    total_actual_cost: Math.round(totalActualCost * 100) / 100,
    average_trip_cost: avgCost,
    average_trips_per_child: avgPerChild,
    budget_variance: budgetVariance,
  };
}

export function computeAlerts(
  rows: HolidayTripPlanningRow[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    record_id?: string;
  }[] = [];

  // Critical: Trip without risk assessment
  for (const r of rows) {
    if (!r.risk_assessment_completed) {
      alerts.push({
        type: "no_risk_assessment",
        severity: "critical",
        message: `${r.trip_type} to ${r.destination} for ${r.child_name} on ${r.trip_date} has no completed risk assessment — CHR 2015 Reg 12 mandates documented risk assessments for all trips. This assessment must cover travel hazards, activity risks, individual child needs (health, emotional triggers, absconding risk), supervision arrangements, and emergency procedures. No trip should proceed without this. The Registered Manager must ensure this is completed and signed off before the trip takes place`,
        record_id: r.id,
      });
    }
  }

  // Critical: International trip without social worker consent
  for (const r of rows) {
    if (r.trip_type === "International Holiday" && (r.social_worker_consent === false || r.social_worker_consent === null)) {
      alerts.push({
        type: "international_no_sw_consent",
        severity: "critical",
        message: `International holiday to ${r.destination} for ${r.child_name} on ${r.trip_date} without social worker consent — CHR 2015 Reg 40 requires Ofsted notification for overseas holidays. The placing authority must approve international travel. For children on care orders, the local authority holds parental responsibility; for s20 children, parental consent is required. Taking a looked-after child abroad without proper authorisation has serious legal implications including potential criminal offences under the Child Abduction Act 1984`,
        record_id: r.id,
      });
    }
  }

  // Critical: International trip without passport check
  for (const r of rows) {
    if (r.trip_type === "International Holiday" && (r.passport_checked === false || r.passport_checked === null)) {
      alerts.push({
        type: "international_no_passport",
        severity: "critical",
        message: `International holiday to ${r.destination} for ${r.child_name} on ${r.trip_date} without passport verification — a valid passport is a legal requirement for international travel. Passport applications for looked-after children require the consent of those with parental responsibility and can take several weeks. This must be verified well before the trip`,
        record_id: r.id,
      });
    }
  }

  // Critical: Staffing ratio not met
  for (const r of rows) {
    if (!r.staffing_ratio_met) {
      alerts.push({
        type: "staffing_ratio_not_met",
        severity: "critical",
        message: `Staffing ratio not met for ${r.trip_type} to ${r.destination} for ${r.child_name} on ${r.trip_date} — CHR 2015 Reg 15 requires sufficient staffing at all times. Inadequate staffing on trips puts children at risk. The ratio must account for the activity, environment, and individual child needs. The trip should not proceed until adequate staffing is confirmed`,
        record_id: r.id,
      });
    }
  }

  // High: Overnight trip without emergency contacts
  for (const r of rows) {
    if ((OVERNIGHT_TRIPS as string[]).includes(r.trip_type) && !r.emergency_contacts_provided) {
      alerts.push({
        type: "overnight_no_emergency_contacts",
        severity: "high",
        message: `${r.trip_type} to ${r.destination} for ${r.child_name} on ${r.trip_date} without emergency contacts provided — overnight stays away from the home require comprehensive emergency contact arrangements. Staff must have immediate access to the home's on-call number, the child's social worker, parents (where appropriate), local emergency services at the destination, and the nearest hospital`,
        record_id: r.id,
      });
    }
  }

  // High: Overnight trip without insurance
  for (const r of rows) {
    if ((OVERNIGHT_TRIPS as string[]).includes(r.trip_type) && !r.insurance_arranged) {
      alerts.push({
        type: "overnight_no_insurance",
        severity: "high",
        message: `${r.trip_type} to ${r.destination} for ${r.child_name} on ${r.trip_date} without insurance arranged — appropriate insurance cover (public liability, personal accident, and for international trips comprehensive travel insurance) must be in place before overnight trips proceed`,
        record_id: r.id,
      });
    }
  }

  // High: Child repeatedly not enjoying trips
  const childEnjoymentMap = new Map<string, HolidayTripPlanningRow[]>();
  for (const r of rows) {
    if (r.child_enjoyment_rating && (NEGATIVE_ENJOYMENT as string[]).includes(r.child_enjoyment_rating)) {
      const key = r.child_name.toLowerCase().trim();
      if (!childEnjoymentMap.has(key)) childEnjoymentMap.set(key, []);
      childEnjoymentMap.get(key)!.push(r);
    }
  }
  for (const [, childRows] of childEnjoymentMap) {
    if (childRows.length >= 2) {
      alerts.push({
        type: "child_not_enjoying_trips",
        severity: "high",
        message: `${childRows[0].child_name} has not enjoyed ${childRows.length} trips — repeated negative experiences suggest the trips are not matching this child's interests or needs. CHR 2015 Reg 9 requires child-centred care. Is the home consulting this child about what activities they would enjoy? Are there underlying issues (anxiety, sensory needs, peer difficulties) that make trips challenging? The child's views must be sought and alternative activities considered`,
      });
    }
  }

  // High: Low parental consent rate
  const consentCount = rows.filter((r) => r.parental_consent).length;
  if (rows.length >= 5 && consentCount / rows.length < 0.5) {
    alerts.push({
      type: "low_parental_consent",
      severity: "high",
      message: `Parental consent obtained for only ${Math.round((consentCount / rows.length) * 100)}% of trips — while consent arrangements vary by legal status, best practice is to seek parental involvement in trip decisions where possible. This supports family relationships and demonstrates respect for parental rights. The home should have clear consent processes for different types of trips`,
    });
  }

  // Medium: Low child choice rate
  const choiceCount = rows.filter((r) => r.child_choice).length;
  if (rows.length >= 5 && choiceCount / rows.length < 0.4) {
    alerts.push({
      type: "low_child_choice",
      severity: "medium",
      message: `Child choice recorded in only ${Math.round((choiceCount / rows.length) * 100)}% of trips — SCCIF expects children to enjoy holidays and outings that they have helped choose. CHR 2015 Reg 9 requires child-centred care. Are children being consulted about destinations, activities, and timing? Trips that children have chosen are more likely to be enjoyed and to contribute positively to their wellbeing`,
    });
  }

  // Medium: Budget significantly exceeded
  const overBudgetTrips = rows.filter(
    (r) => r.budget !== null && r.actual_cost !== null && Number(r.actual_cost) > Number(r.budget) * 1.3,
  );
  if (overBudgetTrips.length >= 2) {
    alerts.push({
      type: "budget_exceeded",
      severity: "medium",
      message: `${overBudgetTrips.length} trips have exceeded their budget by more than 30% — while flexibility is important for children's enjoyment, consistent budget overruns suggest trip planning needs improvement. Are budgets set realistically? Are incidental costs being accounted for? The home has a duty of financial accountability`,
    });
  }

  // Medium: No dietary needs catering
  const dietaryCount = rows.filter((r) => r.dietary_needs_catered).length;
  if (rows.length >= 5 && dietaryCount / rows.length < 0.5) {
    alerts.push({
      type: "low_dietary_needs",
      severity: "medium",
      message: `Dietary needs catered for only ${Math.round((dietaryCount / rows.length) * 100)}% of trips — children's dietary requirements (including cultural, religious, medical, and preference-based needs) must be considered for all trips involving meals. Failure to cater for dietary needs can cause physical harm (allergies), emotional distress, and cultural insensitivity`,
    });
  }

  // Medium: Low trip variety
  const activeTypes = Object.entries(
    rows.reduce((acc, r) => { acc[r.trip_type] = (acc[r.trip_type] || 0) + 1; return acc; }, {} as Record<string, number>),
  ).filter(([, count]) => count > 0);
  if (rows.length >= 8 && activeTypes.length <= 2) {
    alerts.push({
      type: "low_trip_variety",
      severity: "medium",
      message: `Only ${activeTypes.length} different trip type${activeTypes.length === 1 ? " is" : "s are"} being offered — SCCIF expects children to enjoy a range of experiences. Are children being offered educational, cultural, sporting, and leisure activities? Different children have different interests, and a varied programme demonstrates child-centred planning`,
    });
  }

  return alerts;
}

export function generateCaraInsights(
  rows: HolidayTripPlanningRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const tripBreakdown = Object.entries(metrics.by_trip_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const enjoymentBreakdown = Object.entries(metrics.by_enjoyment_rating)
    .filter(([, count]) => count > 0)
    .map(([rating, count]) => `${rating}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_trips} ${metrics.total_trips === 1 ? "trip" : "trips"} ` +
      `for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Trip types: ${tripBreakdown || "none recorded"}. ` +
      `Enjoyment ratings: ${enjoymentBreakdown || "none rated yet"}. ` +
      `Overnight: ${metrics.overnight_count}. International: ${metrics.international_count}. ` +
      `Educational: ${metrics.educational_count}. Leisure: ${metrics.leisure_count}. ` +
      `Average trips per child: ${metrics.average_trips_per_child}. ` +
      `Total budget: £${metrics.total_budget}. Total actual cost: £${metrics.total_actual_cost}. ` +
      `Average trip cost: £${metrics.average_trip_cost}. ` +
      `Budget variance: ${metrics.budget_variance}%. ` +
      `Child choice rate: ${metrics.child_choice_rate}%. ` +
      `Positive enjoyment rate: ${metrics.positive_enjoyment_rate}%.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Risk assessment rate: ${metrics.risk_assessment_rate}%. ` +
        `Parental consent rate: ${metrics.parental_consent_rate}%. ` +
        `Insurance rate: ${metrics.insurance_rate}%. ` +
        `Emergency contacts rate: ${metrics.emergency_contacts_rate}%. ` +
        `Staffing ratio rate: ${metrics.staffing_ratio_rate}%. ` +
        `Dietary needs rate: ${metrics.dietary_needs_rate}%. ` +
        `Negative enjoyment rate: ${metrics.negative_enjoyment_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority trip alerts. ` +
        `Risk assessment rate: ${metrics.risk_assessment_rate}%. ` +
        `Parental consent rate: ${metrics.parental_consent_rate}%. ` +
        `Insurance rate: ${metrics.insurance_rate}%. ` +
        `Emergency contacts rate: ${metrics.emergency_contacts_rate}%. ` +
        `Staffing ratio rate: ${metrics.staffing_ratio_rate}%. ` +
        `Dietary needs rate: ${metrics.dietary_needs_rate}%. ` +
        `Continue providing quality trips per CHR 2015 Reg 9.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.child_choice_rate < 40 && metrics.total_trips > 5) {
    insights.push(
      `[reflect] Child choice is recorded in only ${metrics.child_choice_rate}% of trips. ` +
        `SCCIF inspectors expect to see that children help choose their ` +
        `outings and holidays. For looked-after children, many of whom have ` +
        `had little control over their lives, the opportunity to choose where ` +
        `to go and what to do is empowering. CHR 2015 Reg 9 requires ` +
        `child-centred care. Is the home holding trip-planning sessions with ` +
        `children? Are wish lists being collected? Are children offered a ` +
        `choice between different activities? Corporate Parenting Principles ` +
        `require that looked-after children have the same quality of ` +
        `experiences as their peers — and most children in family settings ` +
        `help choose family outings.`,
    );
  } else if (metrics.negative_enjoyment_rate > 20 && metrics.total_trips > 5) {
    insights.push(
      `[reflect] ${metrics.negative_enjoyment_rate}% of rated trips received negative ` +
        `enjoyment ratings. Trips should be positive experiences that ` +
        `enrich children's lives and create happy memories. A high rate of ` +
        `negative experiences may indicate poor matching of activities to ` +
        `individual children's interests, insufficient preparation, peer ` +
        `conflict during trips, or anxiety-related difficulties. Are pre-trip ` +
        `conversations happening with each child? Are children being ` +
        `adequately prepared for new environments? Are post-trip debriefs ` +
        `being used to learn and improve future trips?`,
    );
  } else if (metrics.educational_count === 0 && metrics.total_trips > 5) {
    insights.push(
      `[reflect] No educational or cultural visits recorded among ${metrics.total_trips} trips. ` +
        `While leisure trips are valuable, SCCIF also expects that children ` +
        `benefit from educational and cultural experiences — museum visits, ` +
        `gallery trips, historical sites, nature reserves, and cultural ` +
        `events broaden horizons and support learning. Many looked-after ` +
        `children have had limited access to cultural capital. Corporate ` +
        `Parenting Principles require that children have the same ` +
        `opportunities as their peers. Is the home including educational and ` +
        `cultural experiences in its activities programme?`,
    );
  } else {
    insights.push(
      `[reflect] How does the home balance planned trips with spontaneous ` +
        `outings? While risk assessments and planning are essential (CHR ` +
        `2015 Reg 12), overly rigid planning can make trips feel ` +
        `institutional rather than family-like. In family settings, children ` +
        `experience both planned holidays and spontaneous day trips. Is ` +
        `the home able to respond to children's requests for impromptu ` +
        `outings (e.g., a sunny day prompting a beach trip)? Are standing ` +
        `risk assessments in place for frequently visited locations to ` +
        `enable more spontaneous experiences?`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    tripType?: TripType;
    enjoymentRating?: EnjoymentRating;
    limit?: number;
  },
): Promise<ServiceResult<HolidayTripPlanningRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_holiday_trip_planning") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.tripType) q = q.eq("trip_type", filters.tripType);
  if (filters?.enjoymentRating) q = q.eq("child_enjoyment_rating", filters.enjoymentRating);

  q = q.order("trip_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<HolidayTripPlanningRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_holiday_trip_planning") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  childName: string;
  tripDate: string;
  returnDate?: string | null;
  organiserName: string;
  tripType: TripType;
  destination: string;
  riskAssessmentCompleted?: boolean;
  parentalConsent?: boolean;
  socialWorkerConsent?: boolean | null;
  passportChecked?: boolean | null;
  insuranceArranged?: boolean;
  emergencyContactsProvided?: boolean;
  medicationPacked?: boolean | null;
  dietaryNeedsCatered?: boolean;
  staffingRatioMet?: boolean;
  transportArranged?: string | null;
  budget?: number | null;
  actualCost?: number | null;
  childChoice?: boolean;
  childEnjoymentRating?: EnjoymentRating | null;
  notes?: string | null;
}): Promise<ServiceResult<HolidayTripPlanningRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateHolidayTripPlanning({
    childName: input.childName,
    tripDate: input.tripDate,
    returnDate: input.returnDate,
    organiserName: input.organiserName,
    tripType: input.tripType,
    destination: input.destination,
    riskAssessmentCompleted: input.riskAssessmentCompleted,
    parentalConsent: input.parentalConsent,
    socialWorkerConsent: input.socialWorkerConsent,
    passportChecked: input.passportChecked,
    insuranceArranged: input.insuranceArranged,
    emergencyContactsProvided: input.emergencyContactsProvided,
    staffingRatioMet: input.staffingRatioMet,
    childEnjoymentRating: input.childEnjoymentRating,
    budget: input.budget,
    actualCost: input.actualCost,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_holiday_trip_planning") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      trip_date: input.tripDate,
      return_date: input.returnDate ?? null,
      organiser_name: input.organiserName,
      trip_type: input.tripType,
      destination: input.destination,
      risk_assessment_completed: input.riskAssessmentCompleted ?? false,
      parental_consent: input.parentalConsent ?? false,
      social_worker_consent: input.socialWorkerConsent ?? null,
      passport_checked: input.passportChecked ?? null,
      insurance_arranged: input.insuranceArranged ?? false,
      emergency_contacts_provided: input.emergencyContactsProvided ?? false,
      medication_packed: input.medicationPacked ?? null,
      dietary_needs_catered: input.dietaryNeedsCatered ?? false,
      staffing_ratio_met: input.staffingRatioMet ?? false,
      transport_arranged: input.transportArranged ?? null,
      budget: input.budget ?? null,
      actual_cost: input.actualCost ?? null,
      child_choice: input.childChoice ?? false,
      child_enjoyment_rating: input.childEnjoymentRating ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    childName: string;
    tripDate: string;
    returnDate: string | null;
    organiserName: string;
    tripType: TripType;
    destination: string;
    riskAssessmentCompleted: boolean;
    parentalConsent: boolean;
    socialWorkerConsent: boolean | null;
    passportChecked: boolean | null;
    insuranceArranged: boolean;
    emergencyContactsProvided: boolean;
    medicationPacked: boolean | null;
    dietaryNeedsCatered: boolean;
    staffingRatioMet: boolean;
    transportArranged: string | null;
    budget: number | null;
    actualCost: number | null;
    childChoice: boolean;
    childEnjoymentRating: EnjoymentRating | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<HolidayTripPlanningRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.tripDate !== undefined) mapped.trip_date = updates.tripDate;
  if (updates.returnDate !== undefined) mapped.return_date = updates.returnDate;
  if (updates.organiserName !== undefined) mapped.organiser_name = updates.organiserName;
  if (updates.tripType !== undefined) mapped.trip_type = updates.tripType;
  if (updates.destination !== undefined) mapped.destination = updates.destination;
  if (updates.riskAssessmentCompleted !== undefined) mapped.risk_assessment_completed = updates.riskAssessmentCompleted;
  if (updates.parentalConsent !== undefined) mapped.parental_consent = updates.parentalConsent;
  if (updates.socialWorkerConsent !== undefined) mapped.social_worker_consent = updates.socialWorkerConsent;
  if (updates.passportChecked !== undefined) mapped.passport_checked = updates.passportChecked;
  if (updates.insuranceArranged !== undefined) mapped.insurance_arranged = updates.insuranceArranged;
  if (updates.emergencyContactsProvided !== undefined) mapped.emergency_contacts_provided = updates.emergencyContactsProvided;
  if (updates.medicationPacked !== undefined) mapped.medication_packed = updates.medicationPacked;
  if (updates.dietaryNeedsCatered !== undefined) mapped.dietary_needs_catered = updates.dietaryNeedsCatered;
  if (updates.staffingRatioMet !== undefined) mapped.staffing_ratio_met = updates.staffingRatioMet;
  if (updates.transportArranged !== undefined) mapped.transport_arranged = updates.transportArranged;
  if (updates.budget !== undefined) mapped.budget = updates.budget;
  if (updates.actualCost !== undefined) mapped.actual_cost = updates.actualCost;
  if (updates.childChoice !== undefined) mapped.child_choice = updates.childChoice;
  if (updates.childEnjoymentRating !== undefined) mapped.child_enjoyment_rating = updates.childEnjoymentRating;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_holiday_trip_planning") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteRecord(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_holiday_trip_planning") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

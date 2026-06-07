// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME MEDICATION ADMINISTRATION INTELLIGENCE ENGINE
// Home-level engine analysing medication administration compliance,
// timeliness, witness governance, refusal management, PRN documentation,
// and overall medicines management quality.
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Injectable `today` parameter for deterministic testing.
//
// Regulatory: CHR 2015 Reg 12 (Protection), Reg 31 (Medicines).
// SCCIF: "Health and wellbeing", "Leadership and management."
// NICE Medicines Management Guidelines.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface MedicationAdministrationRecordInput {
  id: string;
  child_id: string;
  medication_id: string;
  scheduled_date: string;                // ISO date
  status: string;                        // AdministrationStatus: given|late|refused|withheld|not_available|self_administered|missed|scheduled
  is_prn: boolean;
  has_witness: boolean;
  has_reason_not_given: boolean;         // for refused/withheld
  has_prn_reason: boolean;              // for PRN meds
  has_prn_effectiveness: boolean;       // for PRN meds
  has_notes: boolean;
  time_variance_minutes: number;        // 0 = on time, positive = late
}

export interface MedicationAdministrationInput {
  today: string;
  total_children: number;
  children_on_medication: number;
  total_active_medications: number;
  administrations: MedicationAdministrationRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type MedicationAdministrationRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface MedicationAdministrationRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface MedicationAdministrationInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface MedicationAdministrationResult {
  medication_rating: MedicationAdministrationRating;
  medication_score: number;
  headline: string;
  total_administrations: number;
  administration_rate: number;
  on_time_rate: number;
  refusal_rate: number;
  witness_rate: number;
  prn_documentation_rate: number;
  reason_documented_rate: number;
  children_on_medication: number;
  total_active_medications: number;
  strengths: string[];
  concerns: string[];
  recommendations: MedicationAdministrationRecommendation[];
  insights: MedicationAdministrationInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const pct = (n: number, d: number): number =>
  d === 0 ? 0 : Math.round((n / d) * 100);

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): MedicationAdministrationRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeMedicationAdministration(
  input: MedicationAdministrationInput,
): MedicationAdministrationResult {
  const {
    today,
    total_children,
    children_on_medication,
    total_active_medications,
    administrations,
  } = input;

  // ── Filter out "scheduled" (future) records ─────────────────────────
  const records = administrations.filter(r => r.status !== "scheduled");

  // ── Guard: insufficient data ────────────────────────────────────────
  if (total_children === 0 || records.length === 0) {
    // If children exist but no records, modifiers will subtract from base
    // but if total_children === 0 → truly insufficient
    if (total_children === 0) {
      return {
        medication_rating: "insufficient_data",
        medication_score: 0,
        headline: "No children in the home — medication administration cannot be assessed.",
        total_administrations: 0,
        administration_rate: 0,
        on_time_rate: 0,
        refusal_rate: 0,
        witness_rate: 0,
        prn_documentation_rate: 0,
        reason_documented_rate: 0,
        children_on_medication: 0,
        total_active_medications: 0,
        strengths: [],
        concerns: ["No children are placed in the home — medication administration analysis requires active placements."],
        recommendations: [],
        insights: [{ text: "No children in the home. Medication administration intelligence will activate when children are placed and medication records are created.", severity: "warning" }],
      };
    }

    // Children exist but no non-scheduled records
    if (children_on_medication === 0) {
      return {
        medication_rating: "insufficient_data",
        medication_score: 0,
        headline: "No children currently on medication — no administration data to assess.",
        total_administrations: 0,
        administration_rate: 0,
        on_time_rate: 0,
        refusal_rate: 0,
        witness_rate: 0,
        prn_documentation_rate: 0,
        reason_documented_rate: 0,
        children_on_medication: 0,
        total_active_medications: 0,
        strengths: [],
        concerns: [],
        recommendations: [],
        insights: [{ text: "No children are currently prescribed medication. The engine will provide analysis once medication administration records are available.", severity: "positive" }],
      };
    }

    // Children on medication but no completed administration records yet
    // Apply modifiers to base 52 — all penalties for 0 records
    let emptyScore = 52;
    emptyScore -= 3; // modifier 1: 0 records with children → -3
    emptyScore -= 1; // modifier 2: 0 → -1
    emptyScore -= 1; // modifier 3: 0 → -1
    // modifier 4: no refusals, no reason → 0
    emptyScore += 1; // modifier 5: 0 PRN → +1
    emptyScore -= 2; // modifier 6: 0 → -2
    emptyScore = clamp(emptyScore, 0, 100);

    return {
      medication_rating: toRating(emptyScore),
      medication_score: emptyScore,
      headline: `${children_on_medication} child${children_on_medication !== 1 ? "ren" : ""} on medication but no administration records found — compliance cannot be verified.`,
      total_administrations: 0,
      administration_rate: 0,
      on_time_rate: 0,
      refusal_rate: 0,
      witness_rate: 0,
      prn_documentation_rate: 0,
      reason_documented_rate: 0,
      children_on_medication,
      total_active_medications,
      strengths: [],
      concerns: [
        "Children are prescribed medication but no administration records exist. This is a serious medicines management gap — every dose must be recorded.",
        "Without administration records, the home cannot demonstrate compliance with Reg 31 (Medicines) or NICE guidelines.",
      ],
      recommendations: [
        { rank: 1, recommendation: "Immediately begin recording all medication administrations. Every dose given, refused, withheld, or omitted must be documented with timestamps and signatures.", urgency: "immediate", regulatory_ref: "Reg 31" },
        { rank: 2, recommendation: "Audit current medication stocks against prescriptions to identify any unrecorded administrations or discrepancies.", urgency: "immediate", regulatory_ref: "Reg 12" },
      ],
      insights: [{ text: "Children are on prescribed medication but the home has no administration records. This represents a critical medicines management failure. Ofsted would view this as a safeguarding concern — without records, the home cannot demonstrate that children are receiving their medication as prescribed. Immediate action is required.", severity: "critical" }],
    };
  }

  // ── Core Metrics ────────────────────────────────────────────────────

  const given = records.filter(r => r.status === "given");
  const late = records.filter(r => r.status === "late");
  const refused = records.filter(r => r.status === "refused");
  const withheld = records.filter(r => r.status === "withheld");
  // "missed" (dose not given at all) and "not_available" (stock-out) are canonical
  // AdministrationStatus values that staff can record on the MAR; the engine
  // previously checked a non-existent "omitted" and so never surfaced them.
  const missed = records.filter(r => r.status === "missed");
  const notAvailable = records.filter(r => r.status === "not_available");
  const selfAdministered = records.filter(r => r.status === "self_administered");

  const totalNonScheduled = records.length;
  // A self-administered dose IS a dose taken — count it as administered, not a failure.
  const staffGivenLate = given.length + late.length;
  const administered = staffGivenLate + selfAdministered.length;

  // administration_rate: doses actually taken / all non-scheduled doses * 100
  const adminRate = pct(administered, totalNonScheduled);

  // on_time_rate: given / given+late * 100 (among staff-administered doses)
  const onTimeRate = pct(given.length, staffGivenLate);

  // refusal_rate: refused / total non-scheduled * 100
  const refusalRate = pct(refused.length, totalNonScheduled);

  // witness_rate: has_witness among doses actually administered (incl. self-administered —
  // a self-administered controlled drug still requires witnessing)
  const administeredRecords = records.filter(r => r.status === "given" || r.status === "late" || r.status === "self_administered");
  const witnessed = administeredRecords.filter(r => r.has_witness);
  const witnessRate = pct(witnessed.length, administeredRecords.length);

  // prn_documentation_rate: has_prn_reason && has_prn_effectiveness among PRN given
  const prnGiven = records.filter(r => r.is_prn && (r.status === "given" || r.status === "late"));
  const prnDocumented = prnGiven.filter(r => r.has_prn_reason && r.has_prn_effectiveness);
  const prnDocRate = pct(prnDocumented.length, prnGiven.length);

  // reason_documented_rate: has_reason_not_given among refused+withheld
  const refusedWithheld = records.filter(r => r.status === "refused" || r.status === "withheld");
  const reasonDocumented = refusedWithheld.filter(r => r.has_reason_not_given);
  const reasonRate = pct(reasonDocumented.length, refusedWithheld.length);

  // ── Scoring: Base 52 + 6 Modifiers ─────────────────────────────────
  let score = 52;

  // 1. Administration compliance (+6/+3/0/-5, 0 records with children → -3)
  if (adminRate >= 98) score += 6;
  else if (adminRate >= 90) score += 3;
  else if (adminRate < 70) score -= 5;
  // else 0

  // 2. Timeliness (+5/+2/0/-5, 0 → -1)
  if (administered === 0) {
    score -= 1;
  } else if (onTimeRate >= 95) {
    score += 5;
  } else if (onTimeRate >= 80) {
    score += 2;
  } else if (onTimeRate < 60) {
    score -= 5;
  }

  // 3. Witness compliance (+5/+2/0/-4, 0 → -1)
  if (administeredRecords.length === 0) {
    score -= 1;
  } else if (witnessRate >= 95) {
    score += 5;
  } else if (witnessRate >= 80) {
    score += 2;
  } else if (witnessRate < 50) {
    score -= 4;
  }

  // 4. Refusal management (+5/+2/0/-4)
  if (refusalRate <= 5 && reasonRate >= 90) {
    score += 5;
  } else if (refusalRate <= 15 || reasonRate >= 70) {
    score += 2;
  } else if (refusalRate > 30 && reasonRate < 50) {
    score -= 4;
  }

  // 5. PRN documentation (+4/+2/0/-4, 0 PRN → +1)
  if (prnGiven.length === 0) {
    score += 1; // No PRN needed
  } else if (prnDocRate >= 90) {
    score += 4;
  } else if (prnDocRate >= 70) {
    score += 2;
  } else if (prnDocRate < 40) {
    score -= 4;
  }

  // 6. Overall quality (+5/+2/0/-3, 0 → -2)
  if (administeredRecords.length === 0) {
    score -= 2;
  } else if (adminRate >= 95 && onTimeRate >= 90 && witnessRate >= 90) {
    score += 5;
  } else {
    const aboveEighty = [adminRate >= 80, onTimeRate >= 80, witnessRate >= 80].filter(Boolean).length;
    if (aboveEighty >= 2) {
      score += 2;
    } else if (adminRate < 70 && onTimeRate < 70 && witnessRate < 70) {
      score -= 3;
    }
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding medication management — ${adminRate}% administration rate, ${onTimeRate}% on time, ${witnessRate}% witnessed across ${totalNonScheduled} administrations.`;
  } else if (rating === "good") {
    headline = `Good medication management — ${adminRate}% administration rate with minor gaps in timeliness or documentation.`;
  } else if (rating === "adequate") {
    headline = `Adequate medication management — administration, timeliness, or governance needs improvement (${adminRate}% given, ${onTimeRate}% on time).`;
  } else {
    headline = `Inadequate medication management — significant compliance, timeliness, or governance failures require immediate attention.`;
  }

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (adminRate >= 98) {
    strengths.push(`${adminRate}% medication administration rate — near-perfect compliance demonstrates robust medicines management and safeguards children's health.`);
  } else if (adminRate >= 90) {
    strengths.push(`${adminRate}% medication administration rate — strong compliance with prescribed medication regimes.`);
  }

  if (onTimeRate >= 95 && administered > 0) {
    strengths.push(`${onTimeRate}% of medications administered on time — excellent timeliness ensures therapeutic effectiveness and consistent care.`);
  } else if (onTimeRate >= 80 && administered > 0) {
    strengths.push(`${onTimeRate}% on-time administration rate — good timeliness across medication rounds.`);
  }

  if (witnessRate >= 95 && administeredRecords.length > 0) {
    strengths.push(`${witnessRate}% witness rate — strong governance with dual-signature verification for medication administration.`);
  } else if (witnessRate >= 80 && administeredRecords.length > 0) {
    strengths.push(`${witnessRate}% of administrations witnessed — good oversight and accountability in medicines management.`);
  }

  if (refusalRate <= 5 && totalNonScheduled >= 5) {
    strengths.push(`Very low refusal rate (${refusalRate}%) — children are generally accepting their medication, indicating good therapeutic relationships and effective explanation of medication benefits.`);
  }

  if (reasonRate >= 90 && refusedWithheld.length > 0) {
    strengths.push(`${reasonRate}% of refusals/withholdings have documented reasons — staff are properly recording why medication was not given, supporting clinical oversight.`);
  }

  if (prnDocRate >= 90 && prnGiven.length > 0) {
    strengths.push(`${prnDocRate}% PRN documentation rate — reason for administration and effectiveness are consistently recorded, supporting informed clinical decisions.`);
  }

  if (adminRate >= 95 && onTimeRate >= 90 && witnessRate >= 90) {
    strengths.push("Administration rate, timeliness, and witness governance all exceed 90% — this demonstrates an embedded culture of safe medicines management.");
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (adminRate < 70) {
    concerns.push(`Only ${adminRate}% of medications were administered — children may not be receiving their prescribed treatment. This is a serious medicines management failure requiring immediate review.`);
  } else if (adminRate < 90) {
    concerns.push(`${adminRate}% administration rate is below expected standards — ${totalNonScheduled - administered} administrations were missed, refused, or withheld.`);
  }

  // Missed doses — a prescribed dose not given at all (distinct from a refusal,
  // where the child declined). Each is a medication error and a potential
  // Regulation 31 notifiable event; surface it explicitly rather than letting it
  // disappear into the aggregate administration rate.
  if (missed.length > 0) {
    concerns.push(`${missed.length} prescribed medication dose${missed.length !== 1 ? "s were" : " was"} MISSED entirely (not given) — each missed dose is a medication error requiring investigation and may be a Regulation 31 notifiable event.`);
  }
  if (notAvailable.length > 0) {
    concerns.push(`${notAvailable.length} dose${notAvailable.length !== 1 ? "s" : ""} could not be given because the medication was not available (stock-out) — review ordering and stock control to prevent gaps in treatment.`);
  }

  if (onTimeRate < 60 && administered > 0) {
    concerns.push(`Only ${onTimeRate}% of medications given on time — poor timeliness can reduce medication effectiveness and indicates weak medication round management.`);
  } else if (onTimeRate < 80 && administered > 0) {
    concerns.push(`${onTimeRate}% on-time rate — ${late.length} late administration${late.length !== 1 ? "s" : ""} identified. Review medication round scheduling and staffing.`);
  }

  // Refusal pattern concern: if refusal_rate > 20%
  if (refusalRate > 20) {
    concerns.push(`${refusalRate}% medication refusal rate — a significant pattern of refusal that requires clinical review. Consider whether children understand their medication, whether there are side effects, or whether administration approach needs adapting.`);
  }

  // Witness governance concern: if witness_rate < 80%
  if (witnessRate < 80 && administeredRecords.length > 0) {
    concerns.push(`Only ${witnessRate}% of administrations were witnessed — medication governance requires dual signatures to prevent errors and safeguard both children and staff. This is a governance gap that Ofsted would identify.`);
  }

  if (refusedWithheld.length > 0 && reasonRate < 50) {
    concerns.push(`Only ${reasonRate}% of refusals/withholdings have documented reasons — without clear rationale, the home cannot demonstrate safe decision-making around non-administration.`);
  }

  if (prnGiven.length > 0 && prnDocRate < 40) {
    concerns.push(`Only ${prnDocRate}% PRN documentation rate — PRN medication requires documented reason for giving and recorded effectiveness to justify continued use.`);
  }

  // Concern: any child has multiple late administrations
  const childLateCounts = new Map<string, number>();
  for (const r of late) {
    childLateCounts.set(r.child_id, (childLateCounts.get(r.child_id) || 0) + 1);
  }
  const childrenWithMultipleLate: Array<[string, number]> = [];
  childLateCounts.forEach((count, childId) => {
    if (count >= 3) childrenWithMultipleLate.push([childId, count]);
  });
  if (childrenWithMultipleLate.length > 0) {
    concerns.push(`${childrenWithMultipleLate.length} child${childrenWithMultipleLate.length !== 1 ? "ren" : ""} ha${childrenWithMultipleLate.length !== 1 ? "ve" : "s"} 3 or more late administrations — repeated late dosing for the same child may indicate systemic scheduling or staffing issues affecting their care.`);
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations: MedicationAdministrationRecommendation[] = [];
  let rank = 0;

  if (adminRate < 70) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Conduct an urgent medicines management audit. Review all missed administrations, verify stock levels, and ensure every child is receiving their prescribed medication. Brief all staff on Reg 31 obligations.",
      urgency: "immediate",
      regulatory_ref: "Reg 31",
    });
  } else if (adminRate < 90) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Improve administration compliance from ${adminRate}% toward 98%+. Review reasons for non-administration and implement a daily medication round checklist to ensure no doses are missed.`,
      urgency: "soon",
      regulatory_ref: "Reg 31",
    });
  }

  if (onTimeRate < 60 && administered > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Review medication round scheduling and staffing. Late administration affects therapeutic effectiveness. Ensure designated medication times are realistic and that trained staff are available at each round.",
      urgency: "immediate",
      regulatory_ref: "Reg 31",
    });
  } else if (onTimeRate < 80 && administered > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Improve on-time administration from ${onTimeRate}% — review medication round timings and identify recurring causes of delay. Set alert reminders for approaching medication times.`,
      urgency: "soon",
      regulatory_ref: "Reg 31",
    });
  }

  if (witnessRate < 80 && administeredRecords.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Increase witness rate from ${witnessRate}% to 95%+. All medication administration should be witnessed by a second trained staff member. Review rota to ensure two trained staff are on shift during medication rounds.`,
      urgency: "soon",
      regulatory_ref: "Reg 12",
    });
  }

  if (refusalRate > 20) {
    recommendations.push({
      rank: ++rank,
      recommendation: "High refusal rate requires clinical review. Arrange a medication review with the prescribing clinician for each child with repeated refusals. Explore alternative formulations, timing, or therapeutic approaches to support compliance.",
      urgency: "immediate",
      regulatory_ref: "Reg 31",
    });
  }

  if (refusedWithheld.length > 0 && reasonRate < 70) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Improve documentation of reasons for refusal/withholding from ${reasonRate}% to 90%+. Every non-administration must have a clear, recorded rationale. Train staff on the importance of documenting why medication was not given.`,
      urgency: "soon",
      regulatory_ref: "Reg 31",
    });
  }

  if (prnGiven.length > 0 && prnDocRate < 70) {
    recommendations.push({
      rank: ++rank,
      recommendation: `Improve PRN documentation from ${prnDocRate}% to 90%+. Every PRN administration must record why it was given and whether it was effective. This is essential for prescriber reviews and NICE compliance.`,
      urgency: "soon",
      regulatory_ref: "Reg 31",
    });
  }

  if (childrenWithMultipleLate.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation: "Investigate repeated late administrations for specific children. Review whether medication round times clash with activities, school transport, or other routines, and adjust scheduling accordingly.",
      urgency: "planned",
      regulatory_ref: "Reg 31",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: MedicationAdministrationInsight[] = [];

  if (rating === "outstanding") {
    insights.push({
      text: `Medication management is outstanding (score: ${score}%). Administration compliance, timeliness, and governance are all at high levels. Ofsted would recognise this as evidence of a well-led home where children's health needs are prioritised and medicines are managed safely in line with Reg 31 and NICE guidelines.`,
      severity: "positive",
    });
  }

  if (adminRate >= 98 && onTimeRate >= 95 && witnessRate >= 95) {
    insights.push({
      text: `Near-perfect medication management — ${adminRate}% administered, ${onTimeRate}% on time, ${witnessRate}% witnessed. This level of consistency demonstrates embedded safe practice and a team culture that takes medicines management seriously.`,
      severity: "positive",
    });
  }

  if (adminRate < 70) {
    insights.push({
      text: `Only ${adminRate}% of medications were administered. This is a critical safeguarding concern under Reg 12 (Protection) and Reg 31 (Medicines). Children may not be receiving medication essential to their physical or mental health. An Ofsted inspector would view this as evidence of inadequate care. Immediate remedial action and clinical review are required.`,
      severity: "critical",
    });
  }

  if (refusalRate > 30) {
    insights.push({
      text: `${refusalRate}% medication refusal rate is exceptionally high. This may indicate that children do not understand their medication, are experiencing side effects, or are using refusal as a means of exercising control. A multi-disciplinary review involving prescribers, social workers, and the child's key worker is essential. NICE guidelines require proactive refusal management.`,
      severity: "critical",
    });
  } else if (refusalRate > 20) {
    insights.push({
      text: `${refusalRate}% medication refusal rate indicates a concerning pattern. Repeated refusal should trigger a clinical review and exploration of the child's understanding of their medication. Consider involving the pharmacist or prescriber for alternative approaches.`,
      severity: "warning",
    });
  }

  if (witnessRate < 50 && administeredRecords.length > 0) {
    insights.push({
      text: `Only ${witnessRate}% of administrations were witnessed. Unwitnessed medication administration is a significant governance risk — it increases the chance of errors going undetected and leaves staff without protection if concerns are raised. Ofsted expects robust dual-verification for controlled and regular medication.`,
      severity: "critical",
    });
  } else if (witnessRate < 80 && administeredRecords.length > 0) {
    insights.push({
      text: `${witnessRate}% witness rate falls below the expected 95%+ standard. Medication witnessing protects both children and staff. Review staffing during medication rounds to ensure a second trained person is always available.`,
      severity: "warning",
    });
  }

  if (onTimeRate < 60 && administered > 0) {
    insights.push({
      text: `Only ${onTimeRate}% of medications given on time. Consistently late administration can reduce the therapeutic effectiveness of time-sensitive medications and may indicate wider organisational issues with medication round management.`,
      severity: "warning",
    });
  }

  if (prnGiven.length > 0 && prnDocRate < 40) {
    insights.push({
      text: `PRN documentation is critically low at ${prnDocRate}%. PRN medication is given on an as-needed basis, making documentation of the reason and effectiveness essential for clinical oversight. Without this, prescribers cannot make informed decisions about ongoing PRN prescriptions.`,
      severity: "warning",
    });
  }

  if (refusalRate <= 5 && adminRate >= 95 && prnGiven.length > 0 && prnDocRate >= 90) {
    insights.push({
      text: "Low refusal rate combined with high administration compliance and thorough PRN documentation. Children are accepting their medication and PRN use is well-justified and monitored. This supports effective health outcomes and demonstrates compliance with NICE Medicines Management Guidelines.",
      severity: "positive",
    });
  }

  return {
    medication_rating: rating,
    medication_score: score,
    headline,
    total_administrations: totalNonScheduled,
    administration_rate: adminRate,
    on_time_rate: onTimeRate,
    refusal_rate: refusalRate,
    witness_rate: witnessRate,
    prn_documentation_rate: prnDocRate,
    reason_documented_rate: reasonRate,
    children_on_medication,
    total_active_medications,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}

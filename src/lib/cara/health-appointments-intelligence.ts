// ══════════════════════════════════════════════════════════════════════════════
// Cara Intelligence Engine — Health Appointments Tracker
//
// Pure deterministic analysis of health appointments for looked-after children.
// Tracks:
//   - Statutory health assessments (IHA within 20 days, RHA annual)
//   - Dental (6-monthly), optical (annual), immunisations
//   - SDQ completion (annually for LAC)
//   - Appointment attendance and DNA patterns
//   - Outstanding/overdue appointments
//
// Regulatory alignment:
//   - CHR 2015 Reg 6(2)(b) — Health needs
//   - Promoting the Health of Looked After Children (DfE/DH 2015)
//   - NICE PH28 — Oral health
//   - SCCIF — Health & well-being judgement
//
// No AI calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

import { weightedMeanOf } from "@/lib/metrics/rate";

export type AppointmentType =
  | "initial_health_assessment"  // IHA — within 20 working days of entering care
  | "review_health_assessment"   // RHA — annually
  | "dental"                     // 6-monthly
  | "optical"                    // annually (or as prescribed)
  | "immunisation"               // per schedule
  | "gp"                         // routine GP
  | "camhs"                      // mental health
  | "specialist"                 // hospital/specialist
  | "sdq"                        // Strengths & Difficulties Questionnaire
  | "other";

export type AppointmentStatus =
  | "attended"
  | "dna"         // Did Not Attend
  | "cancelled_by_service"
  | "cancelled_by_carer"
  | "cancelled_by_child"
  | "rescheduled"
  | "pending"     // future appointment
  | "overdue";    // should have happened but didn't

export interface HealthAppointment {
  id: string;
  type: AppointmentType;
  date: string; // ISO date
  status: AppointmentStatus;
  provider?: string;
  outcome?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  notes?: string;
}

export interface HealthInput {
  childId: string;
  childName: string;
  age: number;
  dateEnteredCare: string; // ISO date
  hasIHA: boolean;
  ihaDate?: string;
  ihaWithin20Days?: boolean;
  lastRHADate?: string;
  lastDentalDate?: string;
  lastOpticalDate?: string;
  lastSDQDate?: string;
  sdqScore?: number;
  immunisationsUpToDate: boolean;
  appointments: HealthAppointment[];
  registeredWithGP: boolean;
  registeredWithDentist: boolean;
  hasHealthPlan: boolean;
  healthPlanUpToDate: boolean;
  consentFormsComplete: boolean;
}

export interface HealthAssessment {
  childName: string;
  overallScore: number | null;
  overallRating: "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate" | null;
  statutoryComplianceScore: number;
  attendanceScore: number | null;
  timelinessScore: number;
  coverageScore: number;
  statutoryChecks: StatutoryCheck[];
  overdueAppointments: OverdueItem[];
  upcomingAppointments: UpcomingItem[];
  dnaPattern: DNAPattern;
  concerns: HealthConcern[];
  strengths: HealthStrength[];
  regulatoryFlags: RegulatoryFlag[];
  recommendations: string[];
  summary: string;
}

export interface StatutoryCheck {
  type: string;
  description: string;
  status: "met" | "overdue" | "not_applicable" | "due_soon";
  lastDate?: string;
  nextDue?: string;
  daysOverdue?: number;
}

export interface OverdueItem {
  type: AppointmentType;
  description: string;
  daysOverdue: number;
  severity: "critical" | "significant" | "moderate";
}

export interface UpcomingItem {
  type: AppointmentType;
  date: string;
  provider?: string;
  daysUntil: number;
}

export interface DNAPattern {
  totalAppointments: number;
  dnaCount: number;
  dnaRate: number; // 0-1
  trend: "improving" | "stable" | "worsening";
  types: string[]; // appointment types most commonly DNA'd
}

export interface HealthConcern {
  severity: "critical" | "significant" | "moderate" | "low";
  category: string;
  description: string;
}

export interface HealthStrength {
  category: string;
  description: string;
}

export interface RegulatoryFlag {
  regulation: string;
  area: string;
  status: "met" | "partially_met" | "not_met";
  detail: string;
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function analyseHealthAppointments(input: HealthInput): HealthAssessment {
  const { childName } = input;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  // ── Statutory checks ──────────────────────────────────────────────────
  const statutoryChecks = assessStatutoryChecks(input, today);

  // ── Overdue appointments ──────────────────────────────────────────────
  const overdueAppointments = findOverdueAppointments(input, today);

  // ── Upcoming appointments ─────────────────────────────────────────────
  const upcomingAppointments = findUpcomingAppointments(input, today);

  // ── DNA pattern ───────────────────────────────────────────────────────
  const dnaPattern = analyseDNAPattern(input.appointments);

  // ── Scores ────────────────────────────────────────────────────────────
  const statutoryComplianceScore = scoreStatutoryCompliance(statutoryChecks);
  const attendanceScore = scoreAttendance(dnaPattern, input.appointments);
  const timelinessScore = scoreTimeliness(overdueAppointments, statutoryChecks);
  const coverageScore = scoreCoverage(input);

  // ── Overall score ─────────────────────────────────────────────────────
  const overallScore = weightedMeanOf([
    { score: statutoryComplianceScore, weight: 0.35 },
    { score: attendanceScore, weight: 0.20 },
    { score: timelinessScore, weight: 0.25 },
    { score: coverageScore, weight: 0.20 },
  ]);

  const overallRating = scoreToRating(overallScore);

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns = identifyConcerns(input, statutoryChecks, overdueAppointments, dnaPattern);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths = identifyStrengths(input, statutoryChecks, dnaPattern);

  // ── Regulatory flags ──────────────────────────────────────────────────
  const regulatoryFlags = assessRegulatory(input, statutoryChecks, overdueAppointments, dnaPattern);

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations = buildRecommendations(input, statutoryChecks, overdueAppointments, dnaPattern);

  // ── Summary ───────────────────────────────────────────────────────────
  const summary = buildSummary(childName, overallRating, overdueAppointments.length, concerns.length);

  return {
    childName,
    overallScore,
    overallRating,
    statutoryComplianceScore,
    attendanceScore,
    timelinessScore,
    coverageScore,
    statutoryChecks,
    overdueAppointments,
    upcomingAppointments,
    dnaPattern,
    concerns,
    strengths,
    regulatoryFlags,
    recommendations,
    summary,
  };
}

// ── Statutory Checks ────────────────────────────────────────────────────────

function assessStatutoryChecks(input: HealthInput, today: string): StatutoryCheck[] {
  const checks: StatutoryCheck[] = [];
  const todayMs = new Date(today).getTime();

  // IHA — Initial Health Assessment (within 20 working days of entering care)
  if (input.hasIHA) {
    checks.push({
      type: "IHA",
      description: "Initial Health Assessment",
      status: input.ihaWithin20Days ? "met" : "met", // done but possibly late
      lastDate: input.ihaDate,
    });
  } else {
    const enteredCareMs = new Date(input.dateEnteredCare).getTime();
    const daysSinceEntry = Math.floor((todayMs - enteredCareMs) / 86400000);
    if (daysSinceEntry > 28) {
      checks.push({
        type: "IHA",
        description: "Initial Health Assessment",
        status: "overdue",
        daysOverdue: daysSinceEntry - 28,
      });
    } else {
      checks.push({
        type: "IHA",
        description: "Initial Health Assessment",
        status: "due_soon",
        nextDue: new Date(enteredCareMs + 28 * 86400000).toISOString().slice(0, 10),
      });
    }
  }

  // RHA — Review Health Assessment (annual)
  if (input.lastRHADate) {
    const rhaMs = new Date(input.lastRHADate).getTime();
    const daysSinceRHA = Math.floor((todayMs - rhaMs) / 86400000);
    if (daysSinceRHA > 365) {
      checks.push({
        type: "RHA",
        description: "Review Health Assessment (annual)",
        status: "overdue",
        lastDate: input.lastRHADate,
        daysOverdue: daysSinceRHA - 365,
      });
    } else if (daysSinceRHA > 335) {
      checks.push({
        type: "RHA",
        description: "Review Health Assessment (annual)",
        status: "due_soon",
        lastDate: input.lastRHADate,
        nextDue: new Date(rhaMs + 365 * 86400000).toISOString().slice(0, 10),
      });
    } else {
      checks.push({
        type: "RHA",
        description: "Review Health Assessment (annual)",
        status: "met",
        lastDate: input.lastRHADate,
        nextDue: new Date(rhaMs + 365 * 86400000).toISOString().slice(0, 10),
      });
    }
  } else if (input.hasIHA) {
    // Has IHA but no RHA — check if it's been over a year since IHA
    const ihaMs = input.ihaDate ? new Date(input.ihaDate).getTime() : 0;
    if (ihaMs > 0) {
      const daysSinceIHA = Math.floor((todayMs - ihaMs) / 86400000);
      if (daysSinceIHA > 365) {
        checks.push({
          type: "RHA",
          description: "Review Health Assessment (annual)",
          status: "overdue",
          daysOverdue: daysSinceIHA - 365,
        });
      }
    }
  }

  // Dental — 6-monthly
  if (input.lastDentalDate) {
    const dentalMs = new Date(input.lastDentalDate).getTime();
    const daysSince = Math.floor((todayMs - dentalMs) / 86400000);
    if (daysSince > 183) {
      checks.push({
        type: "Dental",
        description: "Dental check-up (6-monthly)",
        status: "overdue",
        lastDate: input.lastDentalDate,
        daysOverdue: daysSince - 183,
      });
    } else if (daysSince > 160) {
      checks.push({
        type: "Dental",
        description: "Dental check-up (6-monthly)",
        status: "due_soon",
        lastDate: input.lastDentalDate,
        nextDue: new Date(dentalMs + 183 * 86400000).toISOString().slice(0, 10),
      });
    } else {
      checks.push({
        type: "Dental",
        description: "Dental check-up (6-monthly)",
        status: "met",
        lastDate: input.lastDentalDate,
      });
    }
  } else {
    checks.push({
      type: "Dental",
      description: "Dental check-up (6-monthly)",
      status: "overdue",
      daysOverdue: 0,
    });
  }

  // Optical — annual
  if (input.lastOpticalDate) {
    const optMs = new Date(input.lastOpticalDate).getTime();
    const daysSince = Math.floor((todayMs - optMs) / 86400000);
    if (daysSince > 365) {
      checks.push({
        type: "Optical",
        description: "Eye test (annual)",
        status: "overdue",
        lastDate: input.lastOpticalDate,
        daysOverdue: daysSince - 365,
      });
    } else {
      checks.push({
        type: "Optical",
        description: "Eye test (annual)",
        status: "met",
        lastDate: input.lastOpticalDate,
      });
    }
  } else {
    checks.push({
      type: "Optical",
      description: "Eye test (annual)",
      status: "overdue",
      daysOverdue: 0,
    });
  }

  // SDQ — annual for LAC
  if (input.lastSDQDate) {
    const sdqMs = new Date(input.lastSDQDate).getTime();
    const daysSince = Math.floor((todayMs - sdqMs) / 86400000);
    if (daysSince > 365) {
      checks.push({
        type: "SDQ",
        description: "Strengths & Difficulties Questionnaire (annual)",
        status: "overdue",
        lastDate: input.lastSDQDate,
        daysOverdue: daysSince - 365,
      });
    } else {
      checks.push({
        type: "SDQ",
        description: "Strengths & Difficulties Questionnaire (annual)",
        status: "met",
        lastDate: input.lastSDQDate,
      });
    }
  } else {
    checks.push({
      type: "SDQ",
      description: "Strengths & Difficulties Questionnaire (annual)",
      status: "overdue",
      daysOverdue: 0,
    });
  }

  // Immunisations
  checks.push({
    type: "Immunisations",
    description: "Immunisations up to date",
    status: input.immunisationsUpToDate ? "met" : "overdue",
  });

  return checks;
}

// ── Overdue Appointments ────────────────────────────────────────────────────

function findOverdueAppointments(input: HealthInput, today: string): OverdueItem[] {
  const items: OverdueItem[] = [];
  const todayMs = new Date(today).getTime();

  // From statutory checks
  const ihaCheck = input.hasIHA ? null : (() => {
    const enteredMs = new Date(input.dateEnteredCare).getTime();
    const days = Math.floor((todayMs - enteredMs) / 86400000);
    return days > 28 ? days - 28 : 0;
  })();

  if (ihaCheck && ihaCheck > 0) {
    items.push({
      type: "initial_health_assessment",
      description: "Initial Health Assessment overdue",
      daysOverdue: ihaCheck,
      severity: ihaCheck > 60 ? "critical" : ihaCheck > 30 ? "significant" : "moderate",
    });
  }

  // RHA
  if (input.lastRHADate) {
    const days = Math.floor((todayMs - new Date(input.lastRHADate).getTime()) / 86400000);
    if (days > 365) {
      const overdue = days - 365;
      items.push({
        type: "review_health_assessment",
        description: "Review Health Assessment overdue",
        daysOverdue: overdue,
        severity: overdue > 90 ? "critical" : overdue > 30 ? "significant" : "moderate",
      });
    }
  }

  // Dental
  if (input.lastDentalDate) {
    const days = Math.floor((todayMs - new Date(input.lastDentalDate).getTime()) / 86400000);
    if (days > 183) {
      const overdue = days - 183;
      items.push({
        type: "dental",
        description: "Dental check-up overdue",
        daysOverdue: overdue,
        severity: overdue > 120 ? "significant" : "moderate",
      });
    }
  } else if (!input.registeredWithDentist) {
    items.push({
      type: "dental",
      description: "Not registered with dentist",
      daysOverdue: 0,
      severity: "significant",
    });
  }

  // Optical
  if (input.lastOpticalDate) {
    const days = Math.floor((todayMs - new Date(input.lastOpticalDate).getTime()) / 86400000);
    if (days > 365) {
      items.push({
        type: "optical",
        description: "Eye test overdue",
        daysOverdue: days - 365,
        severity: "moderate",
      });
    }
  }

  return items;
}

// ── Upcoming Appointments ───────────────────────────────────────────────────

function findUpcomingAppointments(input: HealthInput, today: string): UpcomingItem[] {
  const todayMs = new Date(today).getTime();
  return input.appointments
    .filter(a => a.status === "pending" && new Date(a.date).getTime() >= todayMs)
    .map(a => ({
      type: a.type,
      date: a.date,
      provider: a.provider,
      daysUntil: Math.floor((new Date(a.date).getTime() - todayMs) / 86400000),
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);
}

// ── DNA Pattern Analysis ────────────────────────────────────────────────────

function analyseDNAPattern(appointments: HealthAppointment[]): DNAPattern {
  const completed = appointments.filter(a =>
    ["attended", "dna", "cancelled_by_child"].includes(a.status)
  );

  const dnaAppts = completed.filter(a => a.status === "dna");
  const dnaCount = dnaAppts.length;
  const totalAppointments = completed.length;
  const dnaRate = totalAppointments > 0 ? dnaCount / totalAppointments : 0;

  // DNA types
  const typeCounts: Record<string, number> = {};
  dnaAppts.forEach(a => {
    typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
  });
  const types = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t);

  // Trend: compare first half vs second half
  let trend: "improving" | "stable" | "worsening" = "stable";
  if (completed.length >= 6) {
    const half = Math.floor(completed.length / 2);
    const firstDNA = completed.slice(0, half).filter(a => a.status === "dna").length / half;
    const secondDNA = completed.slice(half).filter(a => a.status === "dna").length / (completed.length - half);
    if (secondDNA - firstDNA > 0.15) trend = "worsening";
    else if (firstDNA - secondDNA > 0.15) trend = "improving";
  }

  return { totalAppointments, dnaCount, dnaRate, trend, types };
}

// ── Scoring ─────────────────────────────────────────────────────────────────

function scoreStatutoryCompliance(checks: StatutoryCheck[]): number {
  if (checks.length === 0) return 50;
  let score = 0;
  const weights: Record<string, number> = {
    IHA: 25, RHA: 25, Dental: 15, Optical: 10, SDQ: 15, Immunisations: 10,
  };

  for (const check of checks) {
    const weight = weights[check.type] ?? 10;
    if (check.status === "met") score += weight;
    else if (check.status === "due_soon") score += weight * 0.7;
    else if (check.status === "not_applicable") score += weight;
    // overdue = 0
  }

  return Math.min(100, Math.round(score));
}

function scoreAttendance(dna: DNAPattern, appointments: HealthAppointment[]): number | null {
  if (dna.totalAppointments === 0) return null; // no appointments — attendance is unmeasured, not 75
  const attendedRate = 1 - dna.dnaRate;
  return Math.round(attendedRate * 100);
}

function scoreTimeliness(overdue: OverdueItem[], checks: StatutoryCheck[]): number {
  if (overdue.length === 0) return 100;
  let deductions = 0;
  for (const item of overdue) {
    if (item.severity === "critical") deductions += 30;
    else if (item.severity === "significant") deductions += 20;
    else deductions += 10;
  }
  return Math.max(0, 100 - deductions);
}

function scoreCoverage(input: HealthInput): number {
  let score = 0;
  const max = 100;

  if (input.registeredWithGP) score += 20;
  if (input.registeredWithDentist) score += 15;
  if (input.hasHealthPlan) score += 20;
  if (input.healthPlanUpToDate) score += 15;
  if (input.consentFormsComplete) score += 15;
  if (input.immunisationsUpToDate) score += 15;

  return Math.min(max, score);
}

// ── Concerns ────────────────────────────────────────────────────────────────

function identifyConcerns(
  input: HealthInput,
  checks: StatutoryCheck[],
  overdue: OverdueItem[],
  dna: DNAPattern,
): HealthConcern[] {
  const concerns: HealthConcern[] = [];

  // Overdue IHA
  const ihaCheck = checks.find(c => c.type === "IHA");
  if (ihaCheck?.status === "overdue") {
    concerns.push({
      severity: "critical",
      category: "statutory_assessment",
      description: `Initial Health Assessment overdue by ${ihaCheck.daysOverdue} days — statutory requirement`,
    });
  }

  // Overdue RHA
  const rhaCheck = checks.find(c => c.type === "RHA");
  if (rhaCheck?.status === "overdue") {
    concerns.push({
      severity: rhaCheck.daysOverdue && rhaCheck.daysOverdue > 90 ? "critical" : "significant",
      category: "statutory_assessment",
      description: `Review Health Assessment overdue${rhaCheck.daysOverdue ? ` by ${rhaCheck.daysOverdue} days` : ""}`,
    });
  }

  // Not registered with GP
  if (!input.registeredWithGP) {
    concerns.push({
      severity: "critical",
      category: "registration",
      description: "Not registered with a GP — immediate action required",
    });
  }

  // Not registered with dentist
  if (!input.registeredWithDentist) {
    concerns.push({
      severity: "significant",
      category: "registration",
      description: "Not registered with a dentist",
    });
  }

  // High DNA rate
  if (dna.dnaRate > 0.3 && dna.totalAppointments >= 4) {
    concerns.push({
      severity: "significant",
      category: "attendance",
      description: `High DNA rate: ${Math.round(dna.dnaRate * 100)}% of appointments missed`,
    });
  } else if (dna.dnaRate > 0.15 && dna.totalAppointments >= 4) {
    concerns.push({
      severity: "moderate",
      category: "attendance",
      description: `Elevated DNA rate: ${Math.round(dna.dnaRate * 100)}% of appointments missed`,
    });
  }

  // No health plan
  if (!input.hasHealthPlan) {
    concerns.push({
      severity: "significant",
      category: "care_planning",
      description: "No health plan in place",
    });
  } else if (!input.healthPlanUpToDate) {
    concerns.push({
      severity: "moderate",
      category: "care_planning",
      description: "Health plan not up to date",
    });
  }

  // Immunisations
  if (!input.immunisationsUpToDate) {
    concerns.push({
      severity: "significant",
      category: "immunisations",
      description: "Immunisations not up to date",
    });
  }

  // Consent forms
  if (!input.consentFormsComplete) {
    concerns.push({
      severity: "moderate",
      category: "consent",
      description: "Health consent forms incomplete — may delay treatment",
    });
  }

  // Dental overdue
  const dentalOverdue = overdue.find(o => o.type === "dental");
  if (dentalOverdue && dentalOverdue.daysOverdue > 120) {
    concerns.push({
      severity: "significant",
      category: "dental",
      description: `Dental check-up significantly overdue (${dentalOverdue.daysOverdue} days)`,
    });
  }

  return concerns;
}

// ── Strengths ───────────────────────────────────────────────────────────────

function identifyStrengths(
  input: HealthInput,
  checks: StatutoryCheck[],
  dna: DNAPattern,
): HealthStrength[] {
  const strengths: HealthStrength[] = [];

  const allMet = checks.every(c => c.status === "met" || c.status === "not_applicable");
  if (allMet) {
    strengths.push({
      category: "compliance",
      description: "All statutory health assessments up to date",
    });
  }

  if (dna.totalAppointments > 0 && dna.dnaRate === 0) {
    strengths.push({
      category: "attendance",
      description: "100% appointment attendance — no DNAs",
    });
  } else if (dna.dnaRate < 0.1 && dna.totalAppointments >= 5) {
    strengths.push({
      category: "attendance",
      description: "Excellent appointment attendance",
    });
  }

  if (input.registeredWithGP && input.registeredWithDentist) {
    strengths.push({
      category: "registration",
      description: "Registered with GP and dentist",
    });
  }

  if (input.hasHealthPlan && input.healthPlanUpToDate) {
    strengths.push({
      category: "care_planning",
      description: "Health plan in place and up to date",
    });
  }

  if (input.immunisationsUpToDate) {
    strengths.push({
      category: "immunisations",
      description: "Immunisations fully up to date",
    });
  }

  if (input.consentFormsComplete) {
    strengths.push({
      category: "consent",
      description: "All health consent forms complete",
    });
  }

  return strengths;
}

// ── Regulatory Flags ────────────────────────────────────────────────────────

function assessRegulatory(
  input: HealthInput,
  checks: StatutoryCheck[],
  overdue: OverdueItem[],
  dna: DNAPattern,
): RegulatoryFlag[] {
  const flags: RegulatoryFlag[] = [];

  // CHR 2015 Reg 6(2)(b) — Health needs
  const hasCritical = overdue.some(o => o.severity === "critical") || !input.registeredWithGP;
  const hasSignificant = overdue.some(o => o.severity === "significant") || !input.hasHealthPlan;
  flags.push({
    regulation: "CHR 2015 Reg 6(2)(b)",
    area: "Health Needs",
    status: hasCritical ? "not_met" : hasSignificant ? "partially_met" : "met",
    detail: hasCritical
      ? "Critical health requirements not met — statutory assessments overdue or not registered with GP"
      : hasSignificant
      ? "Some health requirements outstanding"
      : "Health needs being appropriately met",
  });

  // Promoting Health of LAC (DfE/DH 2015) — IHA/RHA
  const ihaOk = checks.find(c => c.type === "IHA")?.status !== "overdue";
  const rhaOk = checks.find(c => c.type === "RHA")?.status !== "overdue";
  flags.push({
    regulation: "Promoting Health of LAC 2015",
    area: "Statutory Assessments",
    status: (ihaOk && rhaOk) ? "met" : (!ihaOk || (checks.find(c => c.type === "RHA")?.daysOverdue ?? 0) > 90) ? "not_met" : "partially_met",
    detail: (ihaOk && rhaOk)
      ? "IHA and RHA completed within statutory timescales"
      : "Statutory health assessments overdue",
  });

  // NICE PH28 — Oral health
  const dentalOk = checks.find(c => c.type === "Dental")?.status !== "overdue";
  flags.push({
    regulation: "NICE PH28",
    area: "Oral Health",
    status: dentalOk && input.registeredWithDentist ? "met" : !input.registeredWithDentist ? "not_met" : "partially_met",
    detail: dentalOk && input.registeredWithDentist
      ? "Dental care arrangements in place"
      : !input.registeredWithDentist
      ? "Not registered with dentist — oral health needs not being met"
      : "Dental check-up overdue",
  });

  // SCCIF — Health & well-being
  const sccifMet = !hasCritical && !hasSignificant && dna.dnaRate < 0.2;
  flags.push({
    regulation: "SCCIF",
    area: "Health & Well-being",
    status: sccifMet ? "met" : hasCritical ? "not_met" : "partially_met",
    detail: sccifMet
      ? "Health outcomes being effectively promoted"
      : "Gaps in health provision require attention",
  });

  return flags;
}

// ── Recommendations ─────────────────────────────────────────────────────────

function buildRecommendations(
  input: HealthInput,
  checks: StatutoryCheck[],
  overdue: OverdueItem[],
  dna: DNAPattern,
): string[] {
  const recs: string[] = [];

  const ihaOverdue = checks.find(c => c.type === "IHA" && c.status === "overdue");
  if (ihaOverdue) {
    recs.push("URGENT: Arrange Initial Health Assessment immediately — statutory requirement");
  }

  const rhaOverdue = checks.find(c => c.type === "RHA" && c.status === "overdue");
  if (rhaOverdue) {
    recs.push("Schedule Review Health Assessment — annual requirement overdue");
  }

  if (!input.registeredWithGP) {
    recs.push("URGENT: Register with GP immediately");
  }

  if (!input.registeredWithDentist) {
    recs.push("Register with NHS dentist");
  }

  if (!input.hasHealthPlan) {
    recs.push("Develop health plan in consultation with LAC nurse");
  } else if (!input.healthPlanUpToDate) {
    recs.push("Update health plan at next statutory review");
  }

  if (!input.immunisationsUpToDate) {
    recs.push("Arrange catch-up immunisation appointment with GP");
  }

  if (dna.dnaRate > 0.2 && dna.totalAppointments >= 4) {
    recs.push("Address DNA pattern — consider barriers to attendance and support needs");
  }

  if (!input.consentFormsComplete) {
    recs.push("Complete outstanding health consent forms with social worker");
  }

  const sdqOverdue = checks.find(c => c.type === "SDQ" && c.status === "overdue");
  if (sdqOverdue) {
    recs.push("Complete annual SDQ assessment");
  }

  const dentalOverdue = overdue.find(o => o.type === "dental");
  if (dentalOverdue) {
    recs.push("Book dental check-up — 6-monthly requirement overdue");
  }

  return recs;
}

// ── Summary ─────────────────────────────────────────────────────────────────

function buildSummary(
  childName: string,
  rating: string | null,
  overdueCount: number,
  concernCount: number,
): string {
  const overdueDesc = overdueCount === 0
    ? "No overdue appointments."
    : `${overdueCount} overdue appointment${overdueCount > 1 ? "s" : ""} requiring action.`;

  const concernDesc = concernCount === 0
    ? "No significant concerns."
    : `${concernCount} concern${concernCount > 1 ? "s" : ""} identified.`;

  const ratingLabel = rating ? rating.replace(/_/g, " ") : "not yet rated";
  return `${childName}: Health appointments rated ${ratingLabel}. ${overdueDesc} ${concernDesc}`;
}

// ── Utility ─────────────────────────────────────────────────────────────────

function scoreToRating(score: number | null): "excellent" | "good" | "adequate" | "requires_improvement" | "inadequate" | null {
  if (score === null) return null;
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "adequate";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ═══════��══════════════════════════════════════════════════════════════════════
// Cornerstone Daily Log & Key Events — Intelligence Engine
//
// Deterministic engine for managing daily records, shift handovers, key
// events, and child wellbeing monitoring across the home.
//
// Aligned to:
//   - CHR 2015 Reg 36/Schedule 3 — Records to be maintained
//   - CHR 2015 Reg 34 — Quality of care (daily routines, activities)
//   - Ofsted SCCIF — "Children experience positive routines and relationships"
//   - DfE Guide to Children's Homes Regulations — Daily logs
//
// Daily records must capture:
//   1. Children's general wellbeing and mood
//   2. Activities and engagement
//   3. Significant events (positive and negative)
//   4. Medication administered
//   5. Visitors and contacts
//   6. Staff on shift and handover notes
//   7. Health and appointments
//   8. Education attendance
//   9. Consequences and rewards
//  10. Night checks and sleep patterns
//
// No AI. No external calls. Pure input → output.
// ���═════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type ShiftType = "morning" | "afternoon" | "evening" | "waking_night" | "sleep_in";

export type EventCategory =
  | "wellbeing"           // mood, engagement, general state
  | "activity"            // sports, trips, hobbies, screen time
  | "education"           // school attendance, homework, tutoring
  | "health"              // medication, appointments, illness
  | "contact"             // family calls, social worker visits
  | "behaviour"           // positive or negative behaviour of note
  | "safeguarding"        // concern, disclosure, escalation
  | "achievement"         // positive milestone, reward, praise
  | "consequence"         // sanction applied (no corporal punishment)
  | "night_check"         // waking night observation
  | "visitor"             // professionals, family, friends visiting
  | "handover"            // shift handover notes
  | "maintenance"         // home maintenance, repairs
  | "other";

export type MoodRating = 1 | 2 | 3 | 4 | 5;
// 1 = Very low/distressed, 2 = Low/withdrawn, 3 = Neutral/okay,
// 4 = Good/engaged, 5 = Excellent/thriving

export type EventPriority = "routine" | "notable" | "significant" | "critical";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface DailyLogEntry {
  id: string;
  homeId: string;
  date: string;              // ISO date (YYYY-MM-DD)
  shift: ShiftType;
  staffOnShift: string[];
  shiftLeader: string;

  // Child entries for this shift
  childEntries: ChildShiftEntry[];

  // General home notes
  homeNotes: string;
  maintenanceIssues: string[];
  visitorsToHome: VisitorRecord[];

  // Handover
  handoverNotes: string;
  handoverPriorities: string[];
  handoverCompletedAt?: string;
  handoverReceivedBy?: string;

  // Metadata
  createdBy: string;
  createdAt: string;
  signedOffBy?: string;
  signedOffAt?: string;
}

export interface ChildShiftEntry {
  childId: string;
  childName: string;
  moodRating: MoodRating;
  moodNotes: string;
  presentInHome: boolean;
  schoolAttended?: boolean;
  keyEvents: KeyEvent[];
  medicationAdministered: MedicationEntry[];
  mealsEaten: MealRecord[];
  nightChecks?: NightCheck[];
}

export interface KeyEvent {
  id: string;
  category: EventCategory;
  priority: EventPriority;
  time: string;
  description: string;
  staffInvolved: string[];
  childResponse?: string;       // child's voice about the event
  actionRequired?: string;
  followUpDate?: string;
  linkedIncidentId?: string;    // cross-reference to incident
  linkedMissingId?: string;     // cross-reference to missing episode
}

export interface MedicationEntry {
  medicationName: string;
  dose: string;
  time: string;
  administeredBy: string;
  witnessed: boolean;
  witnessedBy?: string;
  refused: boolean;
  refusalNotes?: string;
}

export interface MealRecord {
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  eaten: "full" | "partial" | "refused" | "not_offered";
  notes?: string;
}

export interface NightCheck {
  time: string;
  checkedBy: string;
  childPresent: boolean;
  awake: boolean;
  notes?: string;
}

export interface VisitorRecord {
  visitorName: string;
  role: string;               // e.g., "Social Worker", "Family", "Therapist"
  arrivedAt: string;
  departedAt?: string;
  purpose: string;
  childrenSeen: string[];
  idChecked: boolean;
}

// ── Result Interfaces ──��───────────────────────────────────────────────────

export interface DailyComplianceResult {
  date: string;
  shift: ShiftType;
  isCompliant: boolean;
  issues: string[];
  childEntriesComplete: boolean;
  handoverComplete: boolean;
  medicationDocumented: boolean;
  nightChecksComplete: boolean;    // for night shifts
  signedOff: boolean;
}

export interface ChildWellbeingTrend {
  childId: string;
  childName: string;
  periodDays: number;
  averageMood: number;
  moodTrend: "improving" | "stable" | "declining";
  lowestDay: string | null;
  highestDay: string | null;
  schoolAttendanceRate: number;     // %
  significantEvents: number;
  positiveEvents: number;
  concernEvents: number;
  mealRefusals: number;
  medicationRefusals: number;
  nightDisturbances: number;
  recommendations: string[];
}

export interface ShiftHandoverSummary {
  homeId: string;
  date: string;
  shift: ShiftType;
  priorities: string[];
  childSummaries: { childId: string; childName: string; mood: MoodRating; keyInfo: string }[];
  outstandingActions: string[];
  staffNotes: string;
}

export interface HomeActivityMetrics {
  homeId: string;
  periodDays: number;
  totalEntries: number;
  entriesPerDay: number;
  complianceRate: number;            // %
  averageHomeMood: number;
  eventsByCategory: { category: EventCategory; count: number }[];
  eventsByPriority: { priority: EventPriority; count: number }[];
  schoolAttendanceRate: number;      // %
  medicationComplianceRate: number;  // %
  nightCheckComplianceRate: number;  // %
  handoverCompletionRate: number;    // %
  childEngagementScores: { childId: string; childName: string; score: number }[];
}

// ── Configuration ──────────────────────────────────────────────────────────

const NIGHT_CHECK_INTERVAL_MINUTES = 30;    // every 30 minutes
const NIGHT_SHIFT_START_HOUR = 22;
const NIGHT_SHIFT_END_HOUR = 7;
const EXPECTED_NIGHT_CHECKS = 18;           // ~9 hours / 30 min intervals

// ── Core: Evaluate Daily Compliance ──────────────────────────────────────

export function evaluateDailyCompliance(
  entry: DailyLogEntry,
): DailyComplianceResult {
  const issues: string[] = [];

  // Check all children have entries
  const childEntriesComplete = entry.childEntries.length > 0 &&
    entry.childEntries.every(ce => ce.moodRating > 0 && ce.moodNotes.length > 0);
  if (!childEntriesComplete) {
    issues.push("Not all children have complete wellbeing entries for this shift.");
  }

  // Handover
  const handoverComplete = !!(entry.handoverNotes && entry.handoverNotes.length > 0 &&
    entry.handoverCompletedAt && entry.handoverReceivedBy);
  if (!handoverComplete) {
    issues.push("Shift handover not completed or not received by incoming staff.");
  }

  // Medication documentation
  const allMeds = entry.childEntries.flatMap(ce => ce.medicationAdministered);
  const medicationDocumented = allMeds.length === 0 || allMeds.every(m =>
    m.administeredBy && m.time && (m.refused || m.witnessed),
  );
  if (!medicationDocumented) {
    issues.push("Medication administration not fully documented (missing witness or details).");
  }

  // Night checks (only for waking_night/sleep_in shifts)
  let nightChecksComplete = true;
  if (entry.shift === "waking_night" || entry.shift === "sleep_in") {
    const totalNightChecks = entry.childEntries.reduce(
      (sum, ce) => sum + (ce.nightChecks?.length ?? 0), 0,
    );
    const childCount = entry.childEntries.length;
    const expectedTotal = childCount * EXPECTED_NIGHT_CHECKS;
    nightChecksComplete = totalNightChecks >= expectedTotal * 0.8; // 80% threshold
    if (!nightChecksComplete) {
      issues.push(`Night checks incomplete: ${totalNightChecks}/${expectedTotal} recorded (minimum 80%).`);
    }
  }

  // Signed off
  const signedOff = !!(entry.signedOffBy && entry.signedOffAt);
  if (!signedOff) {
    issues.push("Daily log not signed off by shift leader or manager.");
  }

  return {
    date: entry.date,
    shift: entry.shift,
    isCompliant: issues.length === 0,
    issues,
    childEntriesComplete,
    handoverComplete,
    medicationDocumented,
    nightChecksComplete,
    signedOff,
  };
}

// ── Core: Child Wellbeing Trend ──────────────────────────────────────────

export function analyzeChildWellbeing(
  entries: DailyLogEntry[],
  childId: string,
  childName: string,
  periodDays: number = 30,
  now?: string,
): ChildWellbeingTrend {
  const currentDate = now ? new Date(now) : new Date();
  const startDate = new Date(currentDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

  const relevantEntries = entries.filter(e =>
    new Date(e.date) >= startDate && new Date(e.date) <= currentDate,
  );

  // Mood data
  const childMoods: { date: string; mood: MoodRating }[] = [];
  for (const entry of relevantEntries) {
    const childEntry = entry.childEntries.find(ce => ce.childId === childId);
    if (childEntry) {
      childMoods.push({ date: entry.date, mood: childEntry.moodRating });
    }
  }

  const averageMood = childMoods.length > 0
    ? Math.round((childMoods.reduce((sum, m) => sum + m.mood, 0) / childMoods.length) * 10) / 10
    : 3;

  // Mood trend (compare first half vs second half)
  let moodTrend: ChildWellbeingTrend["moodTrend"] = "stable";
  if (childMoods.length >= 4) {
    const midpoint = Math.floor(childMoods.length / 2);
    const firstHalf = childMoods.slice(0, midpoint);
    const secondHalf = childMoods.slice(midpoint);
    const firstAvg = firstHalf.reduce((s, m) => s + m.mood, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, m) => s + m.mood, 0) / secondHalf.length;
    if (secondAvg - firstAvg >= 0.5) moodTrend = "improving";
    else if (firstAvg - secondAvg >= 0.5) moodTrend = "declining";
  }

  // Extremes
  const sorted = [...childMoods].sort((a, b) => a.mood - b.mood);
  const lowestDay = sorted.length > 0 ? sorted[0].date : null;
  const highestDay = sorted.length > 0 ? sorted[sorted.length - 1].date : null;

  // School attendance
  const schoolDays = relevantEntries.flatMap(e =>
    e.childEntries.filter(ce => ce.childId === childId && ce.schoolAttended !== undefined),
  );
  const attendedDays = schoolDays.filter(ce => ce.schoolAttended === true).length;
  const schoolAttendanceRate = schoolDays.length > 0
    ? Math.round((attendedDays / schoolDays.length) * 100)
    : 100;

  // Events
  const allEvents = relevantEntries.flatMap(e =>
    e.childEntries
      .filter(ce => ce.childId === childId)
      .flatMap(ce => ce.keyEvents),
  );
  const significantEvents = allEvents.filter(ev =>
    ev.priority === "significant" || ev.priority === "critical",
  ).length;
  const positiveEvents = allEvents.filter(ev =>
    ev.category === "achievement" || ev.category === "activity",
  ).length;
  const concernEvents = allEvents.filter(ev =>
    ev.category === "safeguarding" || ev.category === "behaviour",
  ).length;

  // Meal refusals
  const mealRefusals = relevantEntries.flatMap(e =>
    e.childEntries.filter(ce => ce.childId === childId).flatMap(ce => ce.mealsEaten),
  ).filter(m => m.eaten === "refused").length;

  // Medication refusals
  const medicationRefusals = relevantEntries.flatMap(e =>
    e.childEntries.filter(ce => ce.childId === childId).flatMap(ce => ce.medicationAdministered),
  ).filter(m => m.refused).length;

  // Night disturbances
  const nightDisturbances = relevantEntries.flatMap(e =>
    e.childEntries.filter(ce => ce.childId === childId).flatMap(ce => ce.nightChecks ?? []),
  ).filter(nc => nc.awake).length;

  // Recommendations
  const recommendations = generateWellbeingRecommendations(
    averageMood,
    moodTrend,
    schoolAttendanceRate,
    mealRefusals,
    medicationRefusals,
    nightDisturbances,
    periodDays,
  );

  return {
    childId,
    childName,
    periodDays,
    averageMood,
    moodTrend,
    lowestDay,
    highestDay,
    schoolAttendanceRate,
    significantEvents,
    positiveEvents,
    concernEvents,
    mealRefusals,
    medicationRefusals,
    nightDisturbances,
    recommendations,
  };
}

// ── Core: Generate Handover Summary ──────────────────────────────────────

export function generateHandoverSummary(
  entry: DailyLogEntry,
): ShiftHandoverSummary {
  const childSummaries = entry.childEntries.map(ce => {
    const criticalEvents = ce.keyEvents.filter(ev =>
      ev.priority === "critical" || ev.priority === "significant",
    );
    const keyInfo = criticalEvents.length > 0
      ? criticalEvents.map(ev => ev.description).join("; ")
      : ce.moodNotes;

    return {
      childId: ce.childId,
      childName: ce.childName,
      mood: ce.moodRating,
      keyInfo,
    };
  });

  const outstandingActions = entry.childEntries.flatMap(ce =>
    ce.keyEvents
      .filter(ev => ev.actionRequired)
      .map(ev => `${ce.childName}: ${ev.actionRequired}`),
  );

  return {
    homeId: entry.homeId,
    date: entry.date,
    shift: entry.shift,
    priorities: entry.handoverPriorities,
    childSummaries,
    outstandingActions,
    staffNotes: entry.handoverNotes,
  };
}

// ── Core: Home Activity Metrics ──────────────────────────────────────────

export function calculateHomeActivityMetrics(
  entries: DailyLogEntry[],
  homeId: string,
  periodDays: number = 30,
  now?: string,
): HomeActivityMetrics {
  const currentDate = now ? new Date(now) : new Date();
  const startDate = new Date(currentDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

  const homeEntries = entries.filter(e =>
    e.homeId === homeId && new Date(e.date) >= startDate,
  );

  // Entries per day
  const uniqueDays = new Set(homeEntries.map(e => e.date));
  const entriesPerDay = uniqueDays.size > 0
    ? Math.round((homeEntries.length / uniqueDays.size) * 10) / 10
    : 0;

  // Compliance
  const complianceResults = homeEntries.map(evaluateDailyCompliance);
  const compliantCount = complianceResults.filter(r => r.isCompliant).length;
  const complianceRate = homeEntries.length > 0
    ? Math.round((compliantCount / homeEntries.length) * 100)
    : 100;

  // Average mood
  const allMoods = homeEntries.flatMap(e => e.childEntries.map(ce => ce.moodRating));
  const averageHomeMood = allMoods.length > 0
    ? Math.round((allMoods.reduce((a, b) => a + b, 0) / allMoods.length) * 10) / 10
    : 3;

  // Events by category
  const allEvents = homeEntries.flatMap(e => e.childEntries.flatMap(ce => ce.keyEvents));
  const categoryCounts = new Map<EventCategory, number>();
  for (const ev of allEvents) {
    categoryCounts.set(ev.category, (categoryCounts.get(ev.category) ?? 0) + 1);
  }
  const eventsByCategory = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Events by priority
  const priorityCounts = new Map<EventPriority, number>();
  for (const ev of allEvents) {
    priorityCounts.set(ev.priority, (priorityCounts.get(ev.priority) ?? 0) + 1);
  }
  const eventsByPriority = Array.from(priorityCounts.entries())
    .map(([priority, count]) => ({ priority, count }))
    .sort((a, b) => b.count - a.count);

  // School attendance
  const schoolRecords = homeEntries.flatMap(e =>
    e.childEntries.filter(ce => ce.schoolAttended !== undefined),
  );
  const attended = schoolRecords.filter(ce => ce.schoolAttended === true).length;
  const schoolAttendanceRate = schoolRecords.length > 0
    ? Math.round((attended / schoolRecords.length) * 100)
    : 100;

  // Medication compliance
  const allMeds = homeEntries.flatMap(e => e.childEntries.flatMap(ce => ce.medicationAdministered));
  const medsGiven = allMeds.filter(m => !m.refused).length;
  const medicationComplianceRate = allMeds.length > 0
    ? Math.round((medsGiven / allMeds.length) * 100)
    : 100;

  // Night check compliance
  const nightEntries = homeEntries.filter(e => e.shift === "waking_night" || e.shift === "sleep_in");
  const nightCompliant = nightEntries.filter(e => {
    const totalChecks = e.childEntries.reduce((s, ce) => s + (ce.nightChecks?.length ?? 0), 0);
    const expected = e.childEntries.length * EXPECTED_NIGHT_CHECKS;
    return totalChecks >= expected * 0.8;
  }).length;
  const nightCheckComplianceRate = nightEntries.length > 0
    ? Math.round((nightCompliant / nightEntries.length) * 100)
    : 100;

  // Handover completion
  const withHandover = homeEntries.filter(e => e.handoverCompletedAt && e.handoverReceivedBy).length;
  const handoverCompletionRate = homeEntries.length > 0
    ? Math.round((withHandover / homeEntries.length) * 100)
    : 100;

  // Child engagement scores (mood average per child)
  const childMoodMap = new Map<string, { name: string; moods: number[] }>();
  for (const entry of homeEntries) {
    for (const ce of entry.childEntries) {
      const existing = childMoodMap.get(ce.childId);
      if (existing) existing.moods.push(ce.moodRating);
      else childMoodMap.set(ce.childId, { name: ce.childName, moods: [ce.moodRating] });
    }
  }
  const childEngagementScores = Array.from(childMoodMap.entries())
    .map(([childId, { name, moods }]) => ({
      childId,
      childName: name,
      score: Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10,
    }))
    .sort((a, b) => b.score - a.score);

  return {
    homeId,
    periodDays,
    totalEntries: homeEntries.length,
    entriesPerDay,
    complianceRate,
    averageHomeMood,
    eventsByCategory,
    eventsByPriority,
    schoolAttendanceRate,
    medicationComplianceRate,
    nightCheckComplianceRate,
    handoverCompletionRate,
    childEngagementScores,
  };
}

// ── Helpers ───────���───────────────────────────────────────────────────────

function generateWellbeingRecommendations(
  avgMood: number,
  trend: string,
  schoolRate: number,
  mealRefusals: number,
  medRefusals: number,
  nightDisturbances: number,
  days: number,
): string[] {
  const recs: string[] = [];

  if (avgMood <= 2) {
    recs.push("Persistent low mood — consider CAMHS referral or therapeutic intervention review.");
  } else if (trend === "declining") {
    recs.push("Mood declining — schedule keyworker session to explore contributing factors.");
  }

  if (schoolRate < 80) {
    recs.push(`School attendance ${schoolRate}% — PEP review needed. Liaise with school.`);
  }

  if (mealRefusals >= 5) {
    recs.push("Multiple meal refusals — discuss preferences. Consider health check if persistent.");
  }

  if (medRefusals >= 3) {
    recs.push("Medication refusals noted — discuss with prescriber. Review administration approach.");
  }

  if (nightDisturbances >= days * 0.5) {
    recs.push("Frequent night waking — review bedtime routine. Consider sleep hygiene plan.");
  }

  if (avgMood >= 4 && trend !== "declining" && schoolRate >= 90) {
    recs.push("Strong engagement — consider increasing independence and personal goals.");
  }

  return recs;
}

export function getShiftLabel(shift: ShiftType): string {
  const labels: Record<ShiftType, string> = {
    morning: "Morning (7am–2pm)",
    afternoon: "Afternoon (2pm–9pm)",
    evening: "Evening (5pm–10pm)",
    waking_night: "Waking Night (10pm–7am)",
    sleep_in: "Sleep-In (10pm–7am)",
  };
  return labels[shift];
}

export function getEventCategoryLabel(category: EventCategory): string {
  const labels: Record<EventCategory, string> = {
    wellbeing: "Wellbeing",
    activity: "Activity",
    education: "Education",
    health: "Health",
    contact: "Contact",
    behaviour: "Behaviour",
    safeguarding: "Safeguarding",
    achievement: "Achievement",
    consequence: "Consequence",
    night_check: "Night Check",
    visitor: "Visitor",
    handover: "Handover",
    maintenance: "Maintenance",
    other: "Other",
  };
  return labels[category];
}

export function getMoodLabel(mood: MoodRating): string {
  const labels: Record<MoodRating, string> = {
    1: "Very Low / Distressed",
    2: "Low / Withdrawn",
    3: "Neutral / Okay",
    4: "Good / Engaged",
    5: "Excellent / Thriving",
  };
  return labels[mood];
}

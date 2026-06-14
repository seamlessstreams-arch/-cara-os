// ══════════════════════════════════════════════════════════════════════════════
// Cara — PATTERN DETECTION ENGINE
//
// Analyses time-series event data to surface behavioural patterns in young
// people's lives. Runs deterministically (no AI call) — just statistical
// analysis across timestamps, categories, and frequencies.
//
// Pattern types detected:
//   - Temporal: recurring events at specific times/days
//   - Sequential: events that commonly follow other events
//   - Escalation: increasing frequency/severity over time
//   - Correlation: two event types co-occurring
//   - Absence: expected events not happening (missed school, skipped meals)
//   - Cyclical: weekly/monthly behavioural cycles
//
// Pure function. No side effects. No API calls.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export interface TimelineEvent {
  id: string;
  date: string;           // YYYY-MM-DD
  time?: string;          // HH:MM
  category: EventCategory;
  severity?: number;      // 1-5
  childId: string;
  tags?: string[];
  moodBefore?: number;    // 1-5
  moodAfter?: number;     // 1-5
  duration?: number;      // minutes
  context?: string;       // free text for keyword matching
}

export type EventCategory =
  | "incident"
  | "restraint"
  | "missing"
  | "self_harm"
  | "family_contact"
  | "school_absence"
  | "school_exclusion"
  | "sleep_disruption"
  | "meal_refusal"
  | "positive_activity"
  | "key_work"
  | "medication_refusal"
  | "mood_low"
  | "mood_high"
  | "aggression"
  | "property_damage"
  | "police_involvement"
  | "withdrawal"
  | "peer_conflict";

export interface DetectedPattern {
  id: string;
  type: PatternType;
  confidence: number;     // 0-100
  significance: "high" | "medium" | "low";
  childId: string;
  title: string;
  description: string;
  evidence: PatternEvidence[];
  suggestedActions: string[];
  firstDetected: string;
  lastOccurrence: string;
  frequency: number;      // occurrences in analysis window
}

export type PatternType =
  | "temporal"
  | "sequential"
  | "escalation"
  | "correlation"
  | "absence"
  | "cyclical"
  | "improvement";

export interface PatternEvidence {
  eventIds: string[];
  dates: string[];
  summary: string;
}

export interface PatternAnalysis {
  childId: string;
  analysisDate: string;
  windowDays: number;
  totalEvents: number;
  patternsDetected: DetectedPattern[];
  riskIndicators: RiskIndicator[];
  positivePatterns: DetectedPattern[];
  summary: string;
}

export interface RiskIndicator {
  category: string;
  trend: "increasing" | "stable" | "decreasing";
  currentRate: number;    // events per week
  previousRate: number;   // events per week in prior period
  percentChange: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIME_SLOTS = [
  { label: "Early morning (6-8am)", start: 6, end: 8 },
  { label: "Morning (8-12pm)", start: 8, end: 12 },
  { label: "Afternoon (12-5pm)", start: 12, end: 17 },
  { label: "Evening (5-9pm)", start: 17, end: 21 },
  { label: "Night (9pm-12am)", start: 21, end: 24 },
  { label: "Late night (12-6am)", start: 0, end: 6 },
];

const NEGATIVE_CATEGORIES: EventCategory[] = [
  "incident", "restraint", "missing", "self_harm", "aggression",
  "property_damage", "police_involvement", "peer_conflict",
];

const POSITIVE_CATEGORIES: EventCategory[] = [
  "positive_activity", "key_work", "mood_high",
];

// ── Core Analyser ───────────────────────────────────────────────────────────

export function analysePatterns(
  events: TimelineEvent[],
  childId: string,
  windowDays: number = 28
): PatternAnalysis {
  if (events.length === 0) {
    return {
      childId,
      analysisDate: new Date().toISOString().slice(0, 10),
      windowDays,
      totalEvents: 0,
      patternsDetected: [],
      riskIndicators: [],
      positivePatterns: [],
      summary: "No events recorded in the analysis window.",
    };
  }

  const childEvents = events.filter((e) => e.childId === childId);
  const patterns: DetectedPattern[] = [];

  // Run each detection algorithm
  patterns.push(...detectTemporalPatterns(childEvents, childId));
  patterns.push(...detectSequentialPatterns(childEvents, childId));
  patterns.push(...detectEscalation(childEvents, childId, windowDays));
  patterns.push(...detectCorrelations(childEvents, childId));
  patterns.push(...detectCyclicalPatterns(childEvents, childId));
  patterns.push(...detectImprovements(childEvents, childId, windowDays));

  // Filter low-confidence patterns
  const significantPatterns = patterns.filter((p) => p.confidence >= 40);

  // Compute risk indicators
  const riskIndicators = computeRiskIndicators(childEvents, windowDays);

  // Separate positive patterns
  const positivePatterns = significantPatterns.filter((p) => p.type === "improvement");
  const otherPatterns = significantPatterns.filter((p) => p.type !== "improvement");

  // Generate summary
  const summary = generateSummary(otherPatterns, positivePatterns, riskIndicators);

  return {
    childId,
    analysisDate: new Date().toISOString().slice(0, 10),
    windowDays,
    totalEvents: childEvents.length,
    patternsDetected: otherPatterns.sort((a, b) => b.confidence - a.confidence),
    riskIndicators,
    positivePatterns,
    summary,
  };
}

// ── Temporal Patterns ───────────────────────────────────────────────────────

function detectTemporalPatterns(events: TimelineEvent[], childId: string): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  // Day-of-week patterns for negative events
  const negativeEvents = events.filter((e) => NEGATIVE_CATEGORIES.includes(e.category));

  if (negativeEvents.length >= 3) {
    const dayCount: number[] = [0, 0, 0, 0, 0, 0, 0];
    for (const event of negativeEvents) {
      const day = new Date(event.date).getDay();
      dayCount[day]++;
    }

    const maxDay = dayCount.indexOf(Math.max(...dayCount));
    const maxCount = dayCount[maxDay];
    const avgCount = negativeEvents.length / 7;

    // Significant if one day has 2x+ the average
    if (maxCount >= 3 && maxCount >= avgCount * 2) {
      const confidence = Math.min(90, 40 + maxCount * 10);
      patterns.push({
        id: `temporal_day_${childId}_${maxDay}`,
        type: "temporal",
        confidence,
        significance: confidence >= 70 ? "high" : "medium",
        childId,
        title: `${DAY_NAMES[maxDay]} pattern detected`,
        description: `${maxCount} incidents/concerns occurred on ${DAY_NAMES[maxDay]}s — significantly higher than other days.`,
        evidence: [{
          eventIds: negativeEvents.filter((e) => new Date(e.date).getDay() === maxDay).map((e) => e.id),
          dates: negativeEvents.filter((e) => new Date(e.date).getDay() === maxDay).map((e) => e.date),
          summary: `${maxCount} events on ${DAY_NAMES[maxDay]}s vs avg ${avgCount.toFixed(1)} per day`,
        }],
        suggestedActions: [
          `Review care plan for ${DAY_NAMES[maxDay]}-specific triggers`,
          `Consider additional staffing or support on ${DAY_NAMES[maxDay]}s`,
          `Discuss pattern with young person in key work session`,
        ],
        firstDetected: negativeEvents.filter((e) => new Date(e.date).getDay() === maxDay)[0]?.date ?? "",
        lastOccurrence: negativeEvents.filter((e) => new Date(e.date).getDay() === maxDay).slice(-1)[0]?.date ?? "",
        frequency: maxCount,
      });
    }
  }

  // Time-of-day patterns
  const timedEvents = negativeEvents.filter((e) => e.time);
  if (timedEvents.length >= 3) {
    const slotCounts = TIME_SLOTS.map((slot) => ({
      slot,
      count: timedEvents.filter((e) => {
        const hour = parseInt(e.time!.split(":")[0], 10);
        return hour >= slot.start && hour < slot.end;
      }).length,
    }));

    const maxSlot = slotCounts.reduce((a, b) => (a.count > b.count ? a : b));
    const avgSlotCount = timedEvents.length / TIME_SLOTS.length;

    if (maxSlot.count >= 3 && maxSlot.count >= avgSlotCount * 2) {
      const confidence = Math.min(85, 35 + maxSlot.count * 10);
      patterns.push({
        id: `temporal_time_${childId}_${maxSlot.slot.start}`,
        type: "temporal",
        confidence,
        significance: confidence >= 70 ? "high" : "medium",
        childId,
        title: `${maxSlot.slot.label} — high-risk period`,
        description: `${maxSlot.count} incidents/concerns occurred during ${maxSlot.slot.label.toLowerCase()} — disproportionately high.`,
        evidence: [{
          eventIds: timedEvents.filter((e) => {
            const hour = parseInt(e.time!.split(":")[0], 10);
            return hour >= maxSlot.slot.start && hour < maxSlot.slot.end;
          }).map((e) => e.id),
          dates: timedEvents.filter((e) => {
            const hour = parseInt(e.time!.split(":")[0], 10);
            return hour >= maxSlot.slot.start && hour < maxSlot.slot.end;
          }).map((e) => e.date),
          summary: `${maxSlot.count} events during ${maxSlot.slot.label}`,
        }],
        suggestedActions: [
          `Plan proactive support during ${maxSlot.slot.label.toLowerCase()}`,
          `Review what typically happens before this time period`,
          `Consider adjusting routine or increasing engagement activities`,
        ],
        firstDetected: timedEvents[0]?.date ?? "",
        lastOccurrence: timedEvents.slice(-1)[0]?.date ?? "",
        frequency: maxSlot.count,
      });
    }
  }

  return patterns;
}

// ── Sequential Patterns ─────────────────────────────────────────────────────

function detectSequentialPatterns(events: TimelineEvent[], childId: string): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  // Check for "event A commonly followed by event B within 48 hours"
  const sequences = new Map<string, { count: number; pairs: [TimelineEvent, TimelineEvent][] }>();

  for (let i = 0; i < sorted.length - 1; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const daysBetween = dateDiff(sorted[i].date, sorted[j].date);
      if (daysBetween > 2) break; // Only look within 48 hours
      if (daysBetween < 0) continue;

      const key = `${sorted[i].category} → ${sorted[j].category}`;
      if (!sequences.has(key)) sequences.set(key, { count: 0, pairs: [] });
      const seq = sequences.get(key)!;
      seq.count++;
      seq.pairs.push([sorted[i], sorted[j]]);
    }
  }

  // Only report sequences that occur 3+ times
  for (const [key, { count, pairs }] of sequences) {
    if (count >= 3) {
      const [catA, catB] = key.split(" → ");
      // Don't flag same-category sequences
      if (catA === catB) continue;
      // Only flag if at least one is negative
      if (!NEGATIVE_CATEGORIES.includes(catA as EventCategory) && !NEGATIVE_CATEGORIES.includes(catB as EventCategory)) continue;

      const confidence = Math.min(80, 30 + count * 12);
      patterns.push({
        id: `sequential_${childId}_${catA}_${catB}`,
        type: "sequential",
        confidence,
        significance: confidence >= 65 ? "high" : "medium",
        childId,
        title: `${formatCategory(catA)} often followed by ${formatCategory(catB)}`,
        description: `On ${count} occasions, ${formatCategory(catA).toLowerCase()} was followed by ${formatCategory(catB).toLowerCase()} within 48 hours.`,
        evidence: [{
          eventIds: pairs.flatMap(([a, b]) => [a.id, b.id]),
          dates: pairs.map(([a]) => a.date),
          summary: `${count} sequential occurrences detected`,
        }],
        suggestedActions: [
          `After ${formatCategory(catA).toLowerCase()} events, proactively monitor for ${formatCategory(catB).toLowerCase()}`,
          `Consider preventive strategies when ${formatCategory(catA).toLowerCase()} occurs`,
          `Update risk assessment to reflect this pattern`,
        ],
        firstDetected: pairs[0]?.[0]?.date ?? "",
        lastOccurrence: pairs.slice(-1)[0]?.[0]?.date ?? "",
        frequency: count,
      });
    }
  }

  return patterns;
}

// ── Escalation Detection ────────────────────────────────────────────────────

function detectEscalation(events: TimelineEvent[], childId: string, windowDays: number): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  const negativeEvents = events.filter((e) => NEGATIVE_CATEGORIES.includes(e.category));

  if (negativeEvents.length < 4) return patterns;

  // Split into two halves of the analysis window
  const sorted = [...negativeEvents].sort((a, b) => a.date.localeCompare(b.date));
  const midpoint = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, midpoint);
  const secondHalf = sorted.slice(midpoint);

  // Check if second half has noticeably more events
  const firstHalfDays = firstHalf.length > 0 ? dateDiff(firstHalf[0].date, firstHalf[firstHalf.length - 1].date) + 1 : 1;
  const secondHalfDays = secondHalf.length > 0 ? dateDiff(secondHalf[0].date, secondHalf[secondHalf.length - 1].date) + 1 : 1;

  const firstRate = firstHalf.length / Math.max(firstHalfDays, 1);
  const secondRate = secondHalf.length / Math.max(secondHalfDays, 1);

  if (secondRate > firstRate * 1.5 && secondHalf.length >= 3) {
    const confidence = Math.min(85, 40 + Math.round((secondRate / firstRate - 1) * 30));
    patterns.push({
      id: `escalation_${childId}_negative`,
      type: "escalation",
      confidence,
      significance: "high",
      childId,
      title: "Escalating pattern of concern",
      description: `Negative events have increased from ${firstRate.toFixed(1)}/day to ${secondRate.toFixed(1)}/day in the recent period.`,
      evidence: [{
        eventIds: secondHalf.map((e) => e.id),
        dates: secondHalf.map((e) => e.date),
        summary: `Rate increased by ${Math.round((secondRate / firstRate - 1) * 100)}% in recent period`,
      }],
      suggestedActions: [
        "Convene a professionals meeting to review placement stability",
        "Review and update behaviour support plan",
        "Consider additional therapeutic support referral",
        "Increase management oversight frequency",
      ],
      firstDetected: secondHalf[0]?.date ?? "",
      lastOccurrence: secondHalf.slice(-1)[0]?.date ?? "",
      frequency: secondHalf.length,
    });
  }

  // Check for severity escalation
  const severedEvents = sorted.filter((e) => e.severity !== undefined);
  if (severedEvents.length >= 4) {
    const midSev = Math.floor(severedEvents.length / 2);
    const firstSev = severedEvents.slice(0, midSev).reduce((s, e) => s + (e.severity ?? 0), 0) / midSev;
    const secondSev = severedEvents.slice(midSev).reduce((s, e) => s + (e.severity ?? 0), 0) / (severedEvents.length - midSev);

    if (secondSev > firstSev + 0.5) {
      const confidence = Math.min(80, 35 + Math.round((secondSev - firstSev) * 20));
      patterns.push({
        id: `escalation_severity_${childId}`,
        type: "escalation",
        confidence,
        significance: "high",
        childId,
        title: "Severity of incidents increasing",
        description: `Average incident severity has risen from ${firstSev.toFixed(1)} to ${secondSev.toFixed(1)} (scale 1-5).`,
        evidence: [{
          eventIds: severedEvents.slice(midSev).map((e) => e.id),
          dates: severedEvents.slice(midSev).map((e) => e.date),
          summary: `Severity trend: ${firstSev.toFixed(1)} → ${secondSev.toFixed(1)}`,
        }],
        suggestedActions: [
          "Urgent review of behaviour support plan required",
          "Consider risk assessment update — threshold may need adjusting",
          "Discuss with placing authority if severity continues to increase",
        ],
        firstDetected: severedEvents[midSev]?.date ?? "",
        lastOccurrence: severedEvents.slice(-1)[0]?.date ?? "",
        frequency: severedEvents.length - midSev,
      });
    }
  }

  return patterns;
}

// ── Correlation Detection ───────────────────────────────────────────────────

function detectCorrelations(events: TimelineEvent[], childId: string): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  // Check: family contact → negative event within 24 hours
  const contactEvents = events.filter((e) => e.category === "family_contact");
  const negativeEvents = events.filter((e) => NEGATIVE_CATEGORIES.includes(e.category));

  if (contactEvents.length >= 2 && negativeEvents.length >= 2) {
    let followedByNegative = 0;
    const evidence: [TimelineEvent, TimelineEvent][] = [];

    for (const contact of contactEvents) {
      const following = negativeEvents.find((neg) => {
        const diff = dateDiff(contact.date, neg.date);
        return diff >= 0 && diff <= 1;
      });
      if (following) {
        followedByNegative++;
        evidence.push([contact, following]);
      }
    }

    const ratio = followedByNegative / contactEvents.length;
    if (ratio >= 0.5 && followedByNegative >= 2) {
      const confidence = Math.min(85, 30 + Math.round(ratio * 50));
      patterns.push({
        id: `correlation_contact_negative_${childId}`,
        type: "correlation",
        confidence,
        significance: "high",
        childId,
        title: "Family contact linked to increased distress",
        description: `${followedByNegative} of ${contactEvents.length} family contacts were followed by a negative event within 24 hours (${Math.round(ratio * 100)}%).`,
        evidence: [{
          eventIds: evidence.flatMap(([a, b]) => [a.id, b.id]),
          dates: evidence.map(([a]) => a.date),
          summary: `${Math.round(ratio * 100)}% of contacts followed by negative event`,
        }],
        suggestedActions: [
          "Review family contact plan with social worker",
          "Plan additional support before and after contact",
          "Discuss with young person what makes contact difficult",
          "Consider whether contact arrangement needs reviewing",
        ],
        firstDetected: evidence[0]?.[0]?.date ?? "",
        lastOccurrence: evidence.slice(-1)[0]?.[0]?.date ?? "",
        frequency: followedByNegative,
      });
    }
  }

  // Check: mood drop correlating with specific events
  const moodEvents = events.filter((e) => e.moodBefore !== undefined && e.moodAfter !== undefined);
  const moodDrops = moodEvents.filter((e) => (e.moodBefore! - e.moodAfter!) >= 2);

  if (moodDrops.length >= 3) {
    // Check what categories precede mood drops
    const precedingCategories = new Map<string, number>();
    for (const drop of moodDrops) {
      const preceding = events.find((e) =>
        e.id !== drop.id && e.date === drop.date && e.category !== drop.category
      );
      if (preceding) {
        precedingCategories.set(preceding.category, (precedingCategories.get(preceding.category) ?? 0) + 1);
      }
    }

    for (const [cat, count] of precedingCategories) {
      if (count >= 2) {
        const confidence = Math.min(75, 30 + count * 15);
        patterns.push({
          id: `correlation_mood_${childId}_${cat}`,
          type: "correlation",
          confidence,
          significance: "medium",
          childId,
          title: `${formatCategory(cat)} correlates with mood drops`,
          description: `${count} significant mood drops occurred on the same day as ${formatCategory(cat).toLowerCase()} events.`,
          evidence: [{
            eventIds: moodDrops.map((e) => e.id),
            dates: moodDrops.map((e) => e.date),
            summary: `${count} mood drops linked to ${formatCategory(cat).toLowerCase()}`,
          }],
          suggestedActions: [
            `Monitor mood closely around ${formatCategory(cat).toLowerCase()} events`,
            `Prepare coping strategies in advance`,
          ],
          firstDetected: moodDrops[0]?.date ?? "",
          lastOccurrence: moodDrops.slice(-1)[0]?.date ?? "",
          frequency: count,
        });
      }
    }
  }

  return patterns;
}

// ── Cyclical Patterns ───────────────────────────────────────────────────────

function detectCyclicalPatterns(events: TimelineEvent[], childId: string): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  const negativeEvents = events.filter((e) => NEGATIVE_CATEGORIES.includes(e.category));

  if (negativeEvents.length < 4) return patterns;

  // Check for weekly cycles (same day each week)
  const sorted = [...negativeEvents].sort((a, b) => a.date.localeCompare(b.date));
  const dayGroups = new Map<number, string[]>();

  for (const event of sorted) {
    const day = new Date(event.date).getDay();
    if (!dayGroups.has(day)) dayGroups.set(day, []);
    dayGroups.get(day)!.push(event.date);
  }

  for (const [day, dates] of dayGroups) {
    if (dates.length < 3) continue;

    // Check if events are roughly weekly (5-9 day gaps)
    let weeklyCount = 0;
    for (let i = 1; i < dates.length; i++) {
      const gap = dateDiff(dates[i - 1], dates[i]);
      if (gap >= 5 && gap <= 9) weeklyCount++;
    }

    const weeklyRatio = weeklyCount / (dates.length - 1);
    if (weeklyRatio >= 0.5 && weeklyCount >= 2) {
      const confidence = Math.min(80, 35 + Math.round(weeklyRatio * 40));
      patterns.push({
        id: `cyclical_weekly_${childId}_${day}`,
        type: "cyclical",
        confidence,
        significance: "medium",
        childId,
        title: `Weekly cycle — ${DAY_NAMES[day]} concerns`,
        description: `Negative events recur on ${DAY_NAMES[day]}s with weekly regularity (${weeklyCount} weekly recurrences detected).`,
        evidence: [{
          eventIds: sorted.filter((e) => new Date(e.date).getDay() === day).map((e) => e.id),
          dates,
          summary: `${weeklyCount} weekly recurrences on ${DAY_NAMES[day]}s`,
        }],
        suggestedActions: [
          `Anticipate and prepare for ${DAY_NAMES[day]} difficulties`,
          `Explore what happens on or before ${DAY_NAMES[day]}s that may be triggering`,
          `Build positive ${DAY_NAMES[day]} routines as preventive strategy`,
        ],
        firstDetected: dates[0],
        lastOccurrence: dates[dates.length - 1],
        frequency: dates.length,
      });
    }
  }

  return patterns;
}

// ── Improvement Detection ───────────────────────────────────────────────────

function detectImprovements(events: TimelineEvent[], childId: string, windowDays: number): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  // Check for decreasing negative events
  const negativeEvents = events.filter((e) => NEGATIVE_CATEGORIES.includes(e.category));
  if (negativeEvents.length >= 4) {
    const sorted = [...negativeEvents].sort((a, b) => a.date.localeCompare(b.date));
    const midpoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midpoint);
    const secondHalf = sorted.slice(midpoint);

    const firstDays = firstHalf.length > 0 ? dateDiff(firstHalf[0].date, firstHalf[firstHalf.length - 1].date) + 1 : 1;
    const secondDays = secondHalf.length > 0 ? dateDiff(secondHalf[0].date, secondHalf[secondHalf.length - 1].date) + 1 : 1;

    const firstRate = firstHalf.length / Math.max(firstDays, 1);
    const secondRate = secondHalf.length / Math.max(secondDays, 1);

    if (secondRate < firstRate * 0.6 && firstHalf.length >= 3) {
      const decrease = Math.round((1 - secondRate / firstRate) * 100);
      const confidence = Math.min(80, 35 + decrease);
      patterns.push({
        id: `improvement_frequency_${childId}`,
        type: "improvement",
        confidence,
        significance: "medium",
        childId,
        title: "Reducing frequency of concerns",
        description: `Negative events have decreased by ${decrease}% in the recent period — from ${firstRate.toFixed(1)}/day to ${secondRate.toFixed(1)}/day.`,
        evidence: [{
          eventIds: secondHalf.map((e) => e.id),
          dates: secondHalf.map((e) => e.date),
          summary: `${decrease}% reduction in negative events`,
        }],
        suggestedActions: [
          "Document what strategies are working in the care plan",
          "Celebrate progress with the young person",
          "Share positive trends at next review",
        ],
        firstDetected: secondHalf[0]?.date ?? "",
        lastOccurrence: secondHalf.slice(-1)[0]?.date ?? "",
        frequency: secondHalf.length,
      });
    }
  }

  // Check for increasing positive events
  const positiveEvents = events.filter((e) => POSITIVE_CATEGORIES.includes(e.category));
  if (positiveEvents.length >= 4) {
    const sorted = [...positiveEvents].sort((a, b) => a.date.localeCompare(b.date));
    const midpoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midpoint);
    const secondHalf = sorted.slice(midpoint);

    const firstDays = firstHalf.length > 0 ? dateDiff(firstHalf[0].date, firstHalf[firstHalf.length - 1].date) + 1 : 1;
    const secondDays = secondHalf.length > 0 ? dateDiff(secondHalf[0].date, secondHalf[secondHalf.length - 1].date) + 1 : 1;

    const firstRate = firstHalf.length / Math.max(firstDays, 1);
    const secondRate = secondHalf.length / Math.max(secondDays, 1);

    if (secondRate > firstRate * 1.4 && secondHalf.length >= 3) {
      const increase = Math.round((secondRate / firstRate - 1) * 100);
      const confidence = Math.min(75, 30 + Math.round(increase / 3));
      patterns.push({
        id: `improvement_positive_${childId}`,
        type: "improvement",
        confidence,
        significance: "medium",
        childId,
        title: "Increasing positive engagement",
        description: `Positive activities and engagement have increased by ${increase}% in the recent period.`,
        evidence: [{
          eventIds: secondHalf.map((e) => e.id),
          dates: secondHalf.map((e) => e.date),
          summary: `${increase}% increase in positive events`,
        }],
        suggestedActions: [
          "Continue current approach — positive momentum building",
          "Record what is working to inform care plan",
          "Share with the young person that staff have noticed their progress",
        ],
        firstDetected: secondHalf[0]?.date ?? "",
        lastOccurrence: secondHalf.slice(-1)[0]?.date ?? "",
        frequency: secondHalf.length,
      });
    }
  }

  return patterns;
}

// ── Risk Indicators ─────────────────────────────────────────────────────────

function computeRiskIndicators(events: TimelineEvent[], windowDays: number): RiskIndicator[] {
  const indicators: RiskIndicator[] = [];
  const halfWindow = Math.floor(windowDays / 2);
  const today = new Date().toISOString().slice(0, 10);
  const midDate = new Date(Date.now() - halfWindow * 86400000).toISOString().slice(0, 10);

  const categories = [...new Set(events.map((e) => e.category))];

  for (const cat of categories) {
    if (!NEGATIVE_CATEGORIES.includes(cat)) continue;

    const catEvents = events.filter((e) => e.category === cat);
    const recentEvents = catEvents.filter((e) => e.date >= midDate);
    const olderEvents = catEvents.filter((e) => e.date < midDate);

    const currentRate = (recentEvents.length / Math.max(halfWindow, 1)) * 7; // per week
    const previousRate = (olderEvents.length / Math.max(halfWindow, 1)) * 7; // per week

    if (catEvents.length >= 2) {
      let trend: "increasing" | "stable" | "decreasing";
      if (currentRate > previousRate * 1.3) trend = "increasing";
      else if (currentRate < previousRate * 0.7) trend = "decreasing";
      else trend = "stable";

      const percentChange = previousRate > 0
        ? Math.round(((currentRate - previousRate) / previousRate) * 100)
        : currentRate > 0 ? 100 : 0;

      indicators.push({
        category: cat,
        trend,
        currentRate: Math.round(currentRate * 10) / 10,
        previousRate: Math.round(previousRate * 10) / 10,
        percentChange,
      });
    }
  }

  return indicators.sort((a, b) => b.currentRate - a.currentRate);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function dateDiff(dateA: string, dateB: string): number {
  return Math.round((new Date(dateB).getTime() - new Date(dateA).getTime()) / 86400000);
}

function formatCategory(cat: string): string {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function generateSummary(
  concerns: DetectedPattern[],
  positives: DetectedPattern[],
  risks: RiskIndicator[]
): string {
  const parts: string[] = [];

  const highConcerns = concerns.filter((p) => p.significance === "high");
  if (highConcerns.length > 0) {
    parts.push(`${highConcerns.length} high-significance pattern${highConcerns.length > 1 ? "s" : ""} detected requiring attention.`);
  }

  const escalating = risks.filter((r) => r.trend === "increasing");
  if (escalating.length > 0) {
    parts.push(`${escalating.length} risk category${escalating.length > 1 ? "ies are" : " is"} trending upward.`);
  }

  if (positives.length > 0) {
    parts.push(`${positives.length} positive pattern${positives.length > 1 ? "s" : ""} identified — evidence of progress.`);
  }

  const decreasing = risks.filter((r) => r.trend === "decreasing");
  if (decreasing.length > 0) {
    parts.push(`${decreasing.length} concern area${decreasing.length > 1 ? "s" : ""} showing improvement.`);
  }

  if (parts.length === 0) {
    parts.push("No significant patterns detected in the current analysis window.");
  }

  return parts.join(" ");
}

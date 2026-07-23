// ══════════════════════════════════════════════════════════════════════════════
// CARA — HANDOVER CONTINUITY INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses shift handover quality: completion rates, sign-off compliance,
// child mood trends, escalation flags, and incident linkage.
//
// Regulatory: Reg 34(1)(b) — the registered person must ensure staff
// understand their responsibilities at handover. SCCIF: "Do staff share
// information effectively at handover?" Children's Homes Quality Standards:
// continuity of care across shifts.
// ══════════════════════════════════════════════════════════════════════════════

import { below, formatRate, meets, rateOf } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export type ShiftType = "day" | "sleep_in" | "waking_night" | "night" | "morning";

export interface ChildUpdateInput {
  child_id: string;
  mood_score: number | null;
  key_notes: string;
  alerts: string[];
}

export interface SignOffInput {
  staff_id: string;
  acknowledged_at: string;
  notes: string | null;
}

export interface HandoverInput {
  id: string;
  shift_date: string;
  shift_from: ShiftType;
  shift_to: ShiftType;
  handover_time: string;
  completed_at: string | null;
  outgoing_staff: string[];
  incoming_staff: string[];
  created_by: string;
  signed_off_by: string | null;
  sign_offs: SignOffInput[];
  child_updates: ChildUpdateInput[];
  general_notes: string;
  flags: string[];
  linked_incident_ids: string[];
  created_at: string;
}

export interface StaffRef {
  id: string;
  name: string;
}

export interface ChildRef {
  id: string;
  name: string;
}

export interface HandoverContinuityIntelligenceInput {
  handovers: HandoverInput[];
  staff: StaffRef[];
  children: ChildRef[];
  today?: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface HandoverOverview {
  total_handovers: number;
  completed_count: number;
  incomplete_count: number;
  completion_rate: number | null;     // pct completed; null = no handover recorded
  fully_signed_off_count: number;     // where all incoming staff signed
  sign_off_rate: number | null;       // pct of handovers fully signed
  avg_mood_score: number | null;      // avg across all child mood scores; null = none logged
  total_child_updates: number;
  total_child_alerts: number;
  total_flags: number;
  total_incident_links: number;
  children_covered: number;           // unique children with updates
}

export interface HandoverProfile {
  handover_id: string;
  shift_label: string;                // e.g. "Day → Sleep-in"
  shift_date: string;
  handover_time: string;
  is_completed: boolean;
  is_fully_signed: boolean;
  outgoing_staff_names: string[];
  incoming_staff_names: string[];
  signed_off_by_name: string | null;
  sign_off_count: number;
  incoming_count: number;
  child_update_count: number;
  child_alert_count: number;
  flag_count: number;
  incident_link_count: number;
  avg_mood: number | null;           // null = no mood was logged in this handover
  low_mood_children: string[];        // children with mood <= 4
  risk_flags: string[];
}

export interface ChildMoodSummary {
  child_id: string;
  child_name: string;
  mood_entries: number;
  avg_mood: number | null;           // null = no mood logged for this child
  latest_mood: number | null;
  total_alerts: number;
  alert_themes: string[];             // unique alert strings
}

export interface HandoverAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraHandoverInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface HandoverContinuityIntelligenceResult {
  overview: HandoverOverview;
  handover_profiles: HandoverProfile[];
  child_mood_summary: ChildMoodSummary[];
  alerts: HandoverAlert[];
  insights: CaraHandoverInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function formatShiftType(t: ShiftType): string {
  const labels: Record<ShiftType, string> = {
    day: "Day",
    sleep_in: "Sleep-in",
    waking_night: "Waking Night",
    night: "Night",
    morning: "Morning",
  };
  return labels[t] ?? t;
}

// ── Main Computation ────────────────────────────────────────────────────────

export function computeHandoverContinuityIntelligence(
  input: HandoverContinuityIntelligenceInput,
): HandoverContinuityIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { handovers, staff, children } = input;

  const staffMap = new Map(staff.map((s) => [s.id, s.name]));
  const childMap = new Map(children.map((c) => [c.id, c.name]));

  // ── Completion ──────────────────────────────────────────────────────────
  const completed = handovers.filter((h) => h.completed_at !== null);
  const incomplete = handovers.filter((h) => h.completed_at === null);
  const completionRate = rateOf(completed, handovers);

  // ── Sign-offs ─────────────────────────────────────────────────────────
  const fullySigned = handovers.filter(
    (h) => h.incoming_staff.length > 0 && h.sign_offs.length >= h.incoming_staff.length,
  );
  const signOffRate = rateOf(fullySigned, handovers);

  // ── Child mood ────────────────────────────────────────────────────────
  const allMoodScores = handovers
    .flatMap((h) => h.child_updates)
    .map((u) => u.mood_score)
    .filter((s): s is number => s !== null);
  const avgMood = allMoodScores.length > 0 ? round1(average(allMoodScores)) : null;

  const totalChildUpdates = handovers.reduce((s, h) => s + h.child_updates.length, 0);
  const totalChildAlerts = handovers.reduce(
    (s, h) => s + h.child_updates.reduce((as, u) => as + u.alerts.length, 0),
    0,
  );
  const totalFlags = handovers.reduce((s, h) => s + h.flags.length, 0);
  const totalIncidentLinks = handovers.reduce((s, h) => s + h.linked_incident_ids.length, 0);

  const childIdSet = new Set(
    handovers.flatMap((h) => h.child_updates.map((u) => u.child_id)),
  );

  const overview: HandoverOverview = {
    total_handovers: handovers.length,
    completed_count: completed.length,
    incomplete_count: incomplete.length,
    completion_rate: completionRate,
    fully_signed_off_count: fullySigned.length,
    sign_off_rate: signOffRate,
    avg_mood_score: avgMood,
    total_child_updates: totalChildUpdates,
    total_child_alerts: totalChildAlerts,
    total_flags: totalFlags,
    total_incident_links: totalIncidentLinks,
    children_covered: childIdSet.size,
  };

  // ── Handover Profiles ──────────────────────────────────────────────────
  const handover_profiles: HandoverProfile[] = handovers.map((h) => {
    const isCompleted = h.completed_at !== null;
    const isFullySigned = h.incoming_staff.length > 0 && h.sign_offs.length >= h.incoming_staff.length;
    const childAlerts = h.child_updates.reduce((s, u) => s + u.alerts.length, 0);
    const moodScores = h.child_updates.map((u) => u.mood_score).filter((s): s is number => s !== null);
    const handoverAvgMood = moodScores.length > 0 ? round1(average(moodScores)) : null;
    const lowMoodChildren = h.child_updates
      .filter((u) => u.mood_score !== null && u.mood_score <= 4)
      .map((u) => childMap.get(u.child_id) ?? u.child_id);

    const riskFlags: string[] = [];
    if (!isCompleted) riskFlags.push("incomplete");
    if (!isFullySigned && h.incoming_staff.length > 0) riskFlags.push("missing_sign_offs");
    if (lowMoodChildren.length > 0) riskFlags.push("low_mood_child");
    if (childAlerts > 0) riskFlags.push("child_alerts");
    if (h.flags.length > 0) riskFlags.push("escalation_flags");
    if (h.linked_incident_ids.length > 0) riskFlags.push("incident_linked");

    return {
      handover_id: h.id,
      shift_label: `${formatShiftType(h.shift_from as ShiftType)} → ${formatShiftType(h.shift_to as ShiftType)}`,
      shift_date: h.shift_date,
      handover_time: h.handover_time,
      is_completed: isCompleted,
      is_fully_signed: isFullySigned,
      outgoing_staff_names: h.outgoing_staff.map((id) => staffMap.get(id) ?? id),
      incoming_staff_names: h.incoming_staff.map((id) => staffMap.get(id) ?? id),
      signed_off_by_name: h.signed_off_by ? (staffMap.get(h.signed_off_by) ?? h.signed_off_by) : null,
      sign_off_count: h.sign_offs.length,
      incoming_count: h.incoming_staff.length,
      child_update_count: h.child_updates.length,
      child_alert_count: childAlerts,
      flag_count: h.flags.length,
      incident_link_count: h.linked_incident_ids.length,
      avg_mood: handoverAvgMood,
      low_mood_children: lowMoodChildren,
      risk_flags: riskFlags,
    };
  });

  // ── Child Mood Summary ─────────────────────────────────────────────────
  const childUpdatesMap = new Map<string, ChildUpdateInput[]>();
  for (const h of handovers) {
    for (const u of h.child_updates) {
      const arr = childUpdatesMap.get(u.child_id) ?? [];
      arr.push(u);
      childUpdatesMap.set(u.child_id, arr);
    }
  }

  const child_mood_summary: ChildMoodSummary[] = [...childUpdatesMap.entries()]
    .map(([child_id, updates]) => {
      const moods = updates.map((u) => u.mood_score).filter((s): s is number => s !== null);
      const allAlerts = updates.flatMap((u) => u.alerts);
      const uniqueAlerts = [...new Set(allAlerts)];
      const latestMood = moods.length > 0 ? moods[moods.length - 1] : null;

      return {
        child_id,
        child_name: childMap.get(child_id) ?? child_id,
        mood_entries: moods.length,
        avg_mood: moods.length > 0 ? round1(average(moods)) : null,
        latest_mood: latestMood,
        total_alerts: allAlerts.length,
        alert_themes: uniqueAlerts,
      };
    })
    // lowest mood first; children with no mood logged sort last — unmeasured is
    // not the same as unhappy.
    .sort((a, b) => (a.avg_mood ?? Infinity) - (b.avg_mood ?? Infinity));

  // ── Alerts ────────────────────────────────────────────────────────────
  const alerts: HandoverAlert[] = [];

  // Critical: incomplete handovers
  if (incomplete.length > 0) {
    alerts.push({
      severity: "critical",
      message: `${incomplete.length} handover(s) not completed. Staff must confirm handover receipt to ensure continuity of care under Reg 34(1)(b).`,
    });
  }

  // High: missing sign-offs
  const missingSigns = handovers.filter(
    (h) => h.incoming_staff.length > 0 && h.sign_offs.length < h.incoming_staff.length,
  );
  if (missingSigns.length > 0) {
    const totalMissing = missingSigns.reduce(
      (s, h) => s + (h.incoming_staff.length - h.sign_offs.length),
      0,
    );
    alerts.push({
      severity: "high",
      message: `${totalMissing} incoming staff sign-off(s) missing across ${missingSigns.length} handover(s). All incoming staff should acknowledge receipt of handover information.`,
    });
  }

  // High: low mood children (<=4)
  const lowMoodEntries = child_mood_summary.filter((c) => c.avg_mood !== null && c.avg_mood <= 5);
  if (lowMoodEntries.length > 0) {
    const names = lowMoodEntries.map((c) => `${c.child_name} (avg ${c.avg_mood})`).join(", ");
    alerts.push({
      severity: "high",
      message: `${lowMoodEntries.length} child(ren) with low average mood: ${names}. Low mood requires key worker follow-up and potential wellbeing intervention.`,
    });
  }

  // Medium: child alerts raised
  if (totalChildAlerts > 0) {
    alerts.push({
      severity: "medium",
      message: `${totalChildAlerts} child alert(s) raised across handovers. Review and ensure all alerts have been actioned by incoming staff.`,
    });
  }

  // Medium: escalation flags
  if (totalFlags > 0) {
    alerts.push({
      severity: "medium",
      message: `${totalFlags} escalation flag(s) raised across handovers. Flags may indicate maintenance, safeguarding, or welfare issues requiring management action.`,
    });
  }

  // Low: no child updates in handovers
  if (totalChildUpdates === 0 && handovers.length > 0) {
    alerts.push({
      severity: "low",
      message: `No child updates recorded in handovers. Effective handovers should include individual child updates covering mood, behaviour, and significant events.`,
    });
  }

  // ── Cara Insights ─────────────────────────────────────────────────────
  const insights: CaraHandoverInsight[] = [];

  // Critical: incomplete handovers
  if (incomplete.length > 0) {
    insights.push({
      severity: "critical",
      text: `${incomplete.length} handover(s) remain incomplete. Incomplete handovers create continuity gaps — inspectors expect documented evidence that shift-to-shift communication is reliable and consistent.`,
    });
  }

  // Warning: missing sign-offs
  if (below(signOffRate, 100)) {
    insights.push({
      severity: "warning",
      text: `Sign-off rate is ${formatRate(signOffRate)}. Not all incoming staff have acknowledged handover receipt. Full sign-off demonstrates accountability and is an indicator of professional practice.`,
    });
  }

  // Warning: low mood children
  if (lowMoodEntries.length > 0) {
    insights.push({
      severity: "warning",
      text: `${lowMoodEntries.length} child(ren) show low average mood scores (≤5/10). Persistent low mood should be discussed in key work sessions and may indicate a need for therapeutic or CAMHS referral.`,
    });
  }

  // Positive: all handovers complete
  if (incomplete.length === 0 && handovers.length > 0) {
    insights.push({
      severity: "positive",
      text: `All ${handovers.length} handover(s) are complete. Consistent completion demonstrates reliable shift-to-shift communication and supports continuity of care.`,
    });
  }

  // Positive: full sign-off compliance
  if (meets(signOffRate, 100)) {
    insights.push({
      severity: "positive",
      text: `All handovers are fully signed off by incoming staff. 100% sign-off compliance is a strong governance indicator under Reg 34.`,
    });
  }

  // Positive: good average mood (>=7)
  if (avgMood !== null && avgMood >= 7) {
    insights.push({
      severity: "positive",
      text: `Average child mood score is ${avgMood}/10. High overall mood indicates children feel settled and supported — a positive wellbeing indicator for SCCIF.`,
    });
  }

  // Positive: comprehensive child coverage
  if (childIdSet.size >= 3) {
    insights.push({
      severity: "positive",
      text: `Handovers include updates for ${childIdSet.size} children. Individual child updates in every handover demonstrate person-centred care and attention to each young person's needs.`,
    });
  }

  // Positive: incident linkage
  if (totalIncidentLinks > 0) {
    insights.push({
      severity: "positive",
      text: `${totalIncidentLinks} incident(s) linked to handovers. Linking incidents to handover records provides clear audit trails and supports Reg 37 notification requirements.`,
    });
  }

  return {
    overview,
    handover_profiles,
    child_mood_summary,
    alerts,
    insights,
  };
}

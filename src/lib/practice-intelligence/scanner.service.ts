// ══════════════════════════════════════════════════════════════════════════════
// PRACTICE INTELLIGENCE — SCANNER SERVICE
//
// Runs daily/weekly/on-demand scans of the home. Analyses incidents, daily logs,
// key work, risk assessments, staffing patterns, and therapeutic profiles to
// surface: risk patterns, practice drift, training needs, oversight prompts,
// suggested plan updates, suggested sessions, repeated triggers, and more.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type {
  PracticeIntelligenceScan,
  HomeDynamicsSummary,
  ChildScanSummary,
  RiskPattern,
  PracticeDriftAlert,
  TrainingNeedAlert,
  OversightPrompt,
  PlanUpdateSuggestion,
  SuggestedSession,
  RepeatedTrigger,
  TherapeuticPattern,
} from "@/types/practice-intelligence";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

// ── Run a practice intelligence scan ────────────────────────────────────────

export async function runPracticeIntelligenceScan(
  hId?: string,
  scanType: PracticeIntelligenceScan["scan_type"] = "on_demand",
): Promise<PracticeIntelligenceScan> {
  const sb = createServerClient();
  const hid = hId ?? homeId();

  if (!sb) return getDemoScan(hid, scanType);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const today = now.toISOString().slice(0, 10);

  // Gather data from multiple tables
  const [incidentsResult, dailyLogsResult, gapsResult, safeguardingResult, warningsResult] =
    await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sb.from("cara_studio_sources") as any)
        .select("id, child_id, content, summary, source_type, source_date")
        .eq("home_id", hid)
        .eq("source_type", "incident")
        .gte("source_date", weekAgo)
        .order("source_date", { ascending: false }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sb.from("cara_studio_sources") as any)
        .select("id, child_id, content, summary, source_type, source_date")
        .eq("home_id", hid)
        .eq("source_type", "daily_log")
        .gte("source_date", weekAgo)
        .order("source_date", { ascending: false }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sb.from("cara_studio_gaps") as any)
        .select("*")
        .eq("home_id", hid)
        .eq("status", "open"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sb.from("cara_studio_safeguarding_patterns") as any)
        .select("*")
        .eq("home_id", hid)
        .eq("status", "open"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sb.from("cara_studio_early_warnings") as any)
        .select("*")
        .eq("home_id", hid)
        .eq("status", "open"),
    ]);

  const incidents = incidentsResult.data ?? [];
  const dailyLogs = dailyLogsResult.data ?? [];
  const gaps = gapsResult.data ?? [];
  const safeguardingPatterns = safeguardingResult.data ?? [];
  const warnings = warningsResult.data ?? [];

  // Analyse
  const homeDynamics = analyseHomeDynamics(incidents, dailyLogs, gaps, safeguardingPatterns);
  const childSummaries = buildChildSummaries(incidents, dailyLogs);
  const riskPatterns = detectRiskPatterns(incidents, safeguardingPatterns, warnings);
  const practiceDrift = detectPracticeDrift(dailyLogs, gaps);
  const trainingNeeds = identifyTrainingNeeds(incidents, gaps);
  const oversightPrompts = generateOversightPrompts(incidents, gaps);
  const planUpdates = suggestPlanUpdates(incidents, dailyLogs);
  const suggestedKeywork = suggestKeyworkSessions(childSummaries);
  const suggestedReflective = suggestReflectiveSessions(incidents);
  const repeatedTriggers = findRepeatedTriggers(incidents);
  const therapeuticPatterns = identifyTherapeuticPatterns(dailyLogs, incidents);

  const scan: Omit<PracticeIntelligenceScan, "id" | "created_at"> = {
    home_id: hid,
    scan_type: scanType,
    scan_date: today,
    status: "completed",
    home_dynamics_summary: homeDynamics,
    child_summaries: childSummaries,
    risk_patterns: riskPatterns,
    practice_drift_alerts: practiceDrift,
    training_need_alerts: trainingNeeds,
    oversight_prompts: oversightPrompts,
    suggested_plan_updates: planUpdates,
    suggested_keywork: suggestedKeywork,
    suggested_reflective: suggestedReflective,
    relationship_mapping: {},
    rota_impact_analysis: {},
    staff_consistency: {},
    repeated_triggers: repeatedTriggers,
    therapeutic_patterns: therapeuticPatterns,
    created_by: null,
  };

  // Persist
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("practice_intelligence_scans") as any)
    .insert(scan)
    .select("*")
    .single();

  if (error) {
    console.error("[practice-intelligence/scanner] Persist error:", error);
    return getDemoScan(hid, scanType);
  }

  return data as PracticeIntelligenceScan;
}

// ── Get latest scan ─────────────────────────────────────────────────────────

export async function getLatestScan(hId?: string): Promise<PracticeIntelligenceScan | null> {
  const sb = createServerClient();
  const hid = hId ?? homeId();

  if (!sb) return getDemoScan(hid, "daily");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("practice_intelligence_scans") as any)
    .select("*")
    .eq("home_id", hid)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return data as PracticeIntelligenceScan | null;
}

// ── List recent scans ───────────────────────────────────────────────────────

export async function listScans(hId?: string, limit: number = 10): Promise<PracticeIntelligenceScan[]> {
  const sb = createServerClient();
  const hid = hId ?? homeId();

  if (!sb) return [getDemoScan(hid, "daily")];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("practice_intelligence_scans") as any)
    .select("*")
    .eq("home_id", hid)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as PracticeIntelligenceScan[];
}

// ── Analysis helpers ────────────────────────────────────────────────────────

function analyseHomeDynamics(
  incidents: Array<Record<string, unknown>>,
  dailyLogs: Array<Record<string, unknown>>,
  gaps: Array<Record<string, unknown>>,
  safeguarding: Array<Record<string, unknown>>,
): HomeDynamicsSummary {
  const incidentCount = incidents.length;
  const missingCount = incidents.filter((i) =>
    String(i.content ?? i.summary ?? "").toLowerCase().includes("missing"),
  ).length;
  const restraintCount = incidents.filter((i) =>
    String(i.content ?? i.summary ?? "").toLowerCase().includes("restraint"),
  ).length;
  const complaintCount = incidents.filter((i) =>
    String(i.content ?? i.summary ?? "").toLowerCase().includes("complaint"),
  ).length;

  const riskScore = incidentCount * 2 + missingCount * 3 + restraintCount * 3 +
    complaintCount + safeguarding.length * 4 + gaps.length;
  const riskLevel = riskScore >= 15 ? "critical" : riskScore >= 10 ? "high" : riskScore >= 5 ? "medium" : "low";

  const emotionalClimate =
    riskScore === 0 ? "settled" :
    riskScore <= 3 ? "mostly_settled" :
    riskScore <= 7 ? "unsettled" :
    riskScore <= 12 ? "challenging" : "in_crisis";

  const themes: string[] = [];
  if (missingCount > 0) themes.push("Missing episodes");
  if (restraintCount > 0) themes.push("Physical interventions");
  if (safeguarding.length > 0) themes.push("Safeguarding concerns");
  if (gaps.length > 3) themes.push("Recording gaps");

  return {
    emotional_climate: emotionalClimate,
    risk_level: riskLevel,
    risk_score: riskScore,
    incident_count: incidentCount,
    missing_count: missingCount,
    restraint_count: restraintCount,
    complaint_count: complaintCount,
    safeguarding_alerts: safeguarding.length,
    overdue_actions: gaps.filter((g) => (g.gap_type as string) === "overdue_action").length,
    key_themes: themes,
  };
}

function buildChildSummaries(
  incidents: Array<Record<string, unknown>>,
  dailyLogs: Array<Record<string, unknown>>,
): ChildScanSummary[] {
  const childIds = new Set<string>();
  for (const item of [...incidents, ...dailyLogs]) {
    if (item.child_id) childIds.add(item.child_id as string);
  }

  return Array.from(childIds).map((childId) => {
    const childIncidents = incidents.filter((i) => i.child_id === childId);
    const childLogs = dailyLogs.filter((l) => l.child_id === childId);

    const positives: string[] = [];
    const concerns: string[] = [];

    for (const log of childLogs) {
      const text = String(log.content ?? log.summary ?? "").toLowerCase();
      if (/positive|good|progress|settled|calm|engaged/.test(text)) {
        positives.push(String(log.summary ?? "").slice(0, 100));
      }
      if (/concern|worry|upset|difficult|challenging/.test(text)) {
        concerns.push(String(log.summary ?? "").slice(0, 100));
      }
    }

    return {
      child_id: childId,
      child_name: `Child ${childId.slice(-4)}`,
      overall_presentation: childIncidents.length > 2 ? "unsettled" : "mostly_settled",
      risk_level: childIncidents.length > 3 ? "high" : childIncidents.length > 1 ? "medium" : "low",
      recent_incidents: childIncidents.length,
      recent_positives: positives.slice(0, 3),
      concerns: concerns.slice(0, 3),
      suggested_actions: childIncidents.length > 2
        ? ["Consider team formulation", "Review risk assessment"]
        : [],
    };
  });
}

function detectRiskPatterns(
  incidents: Array<Record<string, unknown>>,
  safeguarding: Array<Record<string, unknown>>,
  warnings: Array<Record<string, unknown>>,
): RiskPattern[] {
  const patterns: RiskPattern[] = [];

  if (incidents.length >= 5) {
    patterns.push({
      type: "high_incident_volume",
      severity: "high",
      description: `${incidents.length} incidents in the past week — this is above the expected baseline.`,
      evidence: incidents.slice(0, 3).map((i) => i.id as string),
      suggested_response: "Urgent team meeting to review incident themes and staffing alignment.",
    });
  }

  if (safeguarding.length > 0) {
    patterns.push({
      type: "active_safeguarding",
      severity: "critical",
      description: `${safeguarding.length} open safeguarding pattern(s) require management review.`,
      evidence: safeguarding.map((s) => s.id as string),
      suggested_response: "Priority review by Registered Manager with multi-agency consideration.",
    });
  }

  if (warnings.length >= 3) {
    patterns.push({
      type: "multiple_early_warnings",
      severity: "high",
      description: `${warnings.length} active early warning indicators across the home.`,
      evidence: warnings.map((w) => w.id as string),
      suggested_response: "Comprehensive risk review and manager oversight of each warning.",
    });
  }

  return patterns;
}

function detectPracticeDrift(
  dailyLogs: Array<Record<string, unknown>>,
  gaps: Array<Record<string, unknown>>,
): PracticeDriftAlert[] {
  const alerts: PracticeDriftAlert[] = [];

  const recordingGaps = gaps.filter((g) =>
    ["incomplete_recording", "missing_child_voice", "missing_management_oversight"].includes(g.gap_type as string),
  );

  if (recordingGaps.length >= 3) {
    alerts.push({
      area: "Recording quality",
      description: `${recordingGaps.length} recording quality gaps detected — practice may be drifting from expected standards.`,
      severity: "medium",
      evidence: recordingGaps.map((g) => g.id as string),
      recommended_action: "Team discussion on recording expectations. Consider refresher training.",
    });
  }

  const logsWithoutChildVoice = dailyLogs.filter((l) => {
    const text = String(l.content ?? "").toLowerCase();
    return !(/said|told|expressed|voice|wish|feel|want|quote/.test(text));
  });

  if (logsWithoutChildVoice.length > dailyLogs.length * 0.6 && dailyLogs.length >= 5) {
    alerts.push({
      area: "Child voice in recording",
      description: "Over 60% of recent daily logs do not contain identifiable child voice. This is a key quality indicator.",
      severity: "high",
      evidence: logsWithoutChildVoice.slice(0, 5).map((l) => l.id as string),
      recommended_action: "Staff training on capturing child voice. Add to next supervision agenda.",
    });
  }

  return alerts;
}

function identifyTrainingNeeds(
  incidents: Array<Record<string, unknown>>,
  gaps: Array<Record<string, unknown>>,
): TrainingNeedAlert[] {
  const needs: TrainingNeedAlert[] = [];

  const deEscalationIncidents = incidents.filter((i) =>
    /restrain|physical|intervention|escalat/i.test(String(i.content ?? i.summary ?? "")),
  );

  if (deEscalationIncidents.length >= 2) {
    needs.push({
      topic: "De-escalation and Physical Intervention",
      reason: `${deEscalationIncidents.length} incidents involving physical intervention or escalation in the past week.`,
      priority: "high",
      suggested_resource_type: "role_play_scenario",
      staff_ids: [],
    });
  }

  const recordingGaps = gaps.filter((g) => (g.gap_type as string) === "incomplete_recording");
  if (recordingGaps.length >= 3) {
    needs.push({
      topic: "Recording Practice Standards",
      reason: `${recordingGaps.length} incomplete recording gaps identified.`,
      priority: "medium",
      suggested_resource_type: "quick_reference_card",
      staff_ids: [],
    });
  }

  return needs;
}

function generateOversightPrompts(
  incidents: Array<Record<string, unknown>>,
  gaps: Array<Record<string, unknown>>,
): OversightPrompt[] {
  const prompts: OversightPrompt[] = [];

  for (const incident of incidents.slice(0, 5)) {
    prompts.push({
      oversight_type: "incident_oversight",
      record_id: incident.id as string,
      child_id: (incident.child_id as string) ?? null,
      reason: "Incident requires management oversight comment.",
      priority: "high",
    });
  }

  const overdueActions = gaps.filter((g) => (g.gap_type as string) === "overdue_action");
  if (overdueActions.length > 0) {
    prompts.push({
      oversight_type: "daily_log_oversight",
      record_id: null,
      child_id: null,
      reason: `${overdueActions.length} overdue actions require management review.`,
      priority: "urgent",
    });
  }

  return prompts;
}

function suggestPlanUpdates(
  incidents: Array<Record<string, unknown>>,
  _dailyLogs: Array<Record<string, unknown>>,
): PlanUpdateSuggestion[] {
  const suggestions: PlanUpdateSuggestion[] = [];

  // Group incidents by child
  const byChild: Record<string, Array<Record<string, unknown>>> = {};
  for (const inc of incidents) {
    const cid = inc.child_id as string;
    if (cid) {
      if (!byChild[cid]) byChild[cid] = [];
      byChild[cid].push(inc);
    }
  }

  for (const [childId, childIncidents] of Object.entries(byChild)) {
    if (childIncidents.length >= 3) {
      suggestions.push({
        child_id: childId,
        plan_type: "risk_assessment",
        suggestion: "Risk assessment review recommended due to multiple recent incidents.",
        rationale: `${childIncidents.length} incidents recorded in the past week.`,
        evidence: childIncidents.map((i) => i.id as string),
        priority: "high",
      });
    }
  }

  return suggestions;
}

function suggestKeyworkSessions(childSummaries: ChildScanSummary[]): SuggestedSession[] {
  return childSummaries
    .filter((cs) => cs.concerns.length > 0 || cs.recent_incidents > 0)
    .map((cs) => ({
      child_id: cs.child_id,
      session_type: "feelings_exploration" as const,
      title: `Feelings Check-In — ${cs.child_name}`,
      rationale: cs.recent_incidents > 0
        ? `${cs.recent_incidents} recent incidents suggest feelings exploration would be beneficial.`
        : "Recent concerns identified in daily logs.",
      framework: "pace" as const,
      priority: cs.recent_incidents >= 3 ? "high" as const : "medium" as const,
    }));
}

function suggestReflectiveSessions(incidents: Array<Record<string, unknown>>): SuggestedSession[] {
  if (incidents.length >= 3) {
    return [{
      child_id: null,
      session_type: "reflective_practice" as const,
      title: "Team Reflective Practice — Incident Patterns",
      rationale: `${incidents.length} incidents this week — team reflective session to explore themes and staff wellbeing.`,
      framework: "psychologically_informed" as const,
      priority: "high" as const,
    }];
  }
  return [];
}

function findRepeatedTriggers(incidents: Array<Record<string, unknown>>): RepeatedTrigger[] {
  const triggers: Record<string, { childId: string; count: number; lastDate: string }> = {};

  for (const inc of incidents) {
    const text = String(inc.content ?? inc.summary ?? "").toLowerCase();
    const childId = (inc.child_id as string) ?? "unknown";
    const date = (inc.source_date as string) ?? "";

    const triggerPatterns = [
      { pattern: /family contact|phone call|contact visit/i, label: "Family contact" },
      { pattern: /routine change|unexpected change|change of plan/i, label: "Routine change" },
      { pattern: /peer conflict|argument with|fell out with/i, label: "Peer conflict" },
      { pattern: /school|education|teacher/i, label: "School-related" },
      { pattern: /bedtime|night|sleep/i, label: "Bedtime/night" },
    ];

    for (const { pattern, label } of triggerPatterns) {
      if (pattern.test(text)) {
        const key = `${childId}:${label}`;
        if (!triggers[key]) triggers[key] = { childId, count: 0, lastDate: date };
        triggers[key].count++;
        if (date > triggers[key].lastDate) triggers[key].lastDate = date;
      }
    }
  }

  return Object.entries(triggers)
    .filter(([, v]) => v.count >= 2)
    .map(([key, v]) => ({
      child_id: v.childId,
      trigger: key.split(":")[1],
      frequency: v.count,
      period: "7_days",
      last_occurrence: v.lastDate,
      suggested_response: `Repeated trigger identified (${v.count} times). Consider adding to therapeutic profile and planning a targeted session.`,
    }));
}

function identifyTherapeuticPatterns(
  dailyLogs: Array<Record<string, unknown>>,
  incidents: Array<Record<string, unknown>>,
): TherapeuticPattern[] {
  const patterns: TherapeuticPattern[] = [];
  const allContent = [...dailyLogs, ...incidents];

  // Check for withdrawal patterns
  const withdrawalMentions = allContent.filter((item) =>
    /withdraw|isolat|room|alone|won't come out|refused to engage/i.test(
      String(item.content ?? item.summary ?? ""),
    ),
  );

  if (withdrawalMentions.length >= 3) {
    patterns.push({
      child_id: null,
      pattern_type: "withdrawal_increase",
      description: "Increasing references to withdrawal or self-isolation in recent records.",
      evidence: withdrawalMentions.slice(0, 5).map((i) => i.id as string),
      clinical_hypothesis: "This may indicate emotional overwhelm, depression, or a response to an unidentified stressor. Professional consideration recommended.",
      suggested_approach: "Gentle, non-intrusive check-ins using PACE. Consider whether the environment feels safe enough.",
    });
  }

  // Check for positive engagement patterns
  const positiveMentions = allContent.filter((item) =>
    /engaged well|positive|progress|achievement|proud|happy|enjoying/i.test(
      String(item.content ?? item.summary ?? ""),
    ),
  );

  if (positiveMentions.length >= 5) {
    patterns.push({
      child_id: null,
      pattern_type: "positive_engagement",
      description: "Strong positive engagement patterns emerging across the home.",
      evidence: positiveMentions.slice(0, 5).map((i) => i.id as string),
      clinical_hypothesis: "The home environment appears to be supporting wellbeing. Current approaches are likely effective.",
      suggested_approach: "Reinforce current practices. Document what is working well for use in Reg 45 evidence.",
    });
  }

  return patterns;
}

// ── Demo data ───────────────────────────────────────────────────────────────

function getDemoScan(hid: string, scanType: PracticeIntelligenceScan["scan_type"]): PracticeIntelligenceScan {
  const now = new Date();
  return {
    id: `demo-scan-${now.toISOString().slice(0, 10)}`,
    home_id: hid,
    scan_type: scanType,
    scan_date: now.toISOString().slice(0, 10),
    status: "completed",
    home_dynamics_summary: {
      emotional_climate: "mostly_settled",
      risk_level: "medium",
      risk_score: 7,
      incident_count: 3,
      missing_count: 1,
      restraint_count: 0,
      complaint_count: 0,
      safeguarding_alerts: 0,
      overdue_actions: 2,
      key_themes: ["Missing episodes", "Recording gaps"],
    },
    child_summaries: [
      {
        child_id: "child_1", child_name: "Jayden",
        overall_presentation: "mostly_settled", risk_level: "low",
        recent_incidents: 1,
        recent_positives: ["Good school attendance this week", "Positive key work session"],
        concerns: ["Slight withdrawal after cancelled family contact"],
        suggested_actions: ["Key work session focused on family feelings"],
      },
      {
        child_id: "child_2", child_name: "Amara",
        overall_presentation: "unsettled", risk_level: "medium",
        recent_incidents: 2,
        recent_positives: ["Engaged well in art session"],
        concerns: ["Self-isolating more in room", "Not eating with others"],
        suggested_actions: ["Review therapeutic profile", "Consider team formulation"],
      },
      {
        child_id: "child_3", child_name: "Reuben",
        overall_presentation: "mostly_settled", risk_level: "low",
        recent_incidents: 0,
        recent_positives: ["Helping younger children", "Good peer relationships", "Attended all education sessions"],
        concerns: [],
        suggested_actions: [],
      },
    ],
    risk_patterns: [
      {
        type: "missing_after_contact",
        severity: "medium",
        description: "Pattern of missing episodes following family contact for one young person.",
        evidence: ["inc-1", "inc-5"],
        suggested_response: "Review contact arrangements and add pre/post contact support plan.",
      },
    ],
    practice_drift_alerts: [
      {
        area: "Child voice in recording",
        description: "65% of daily logs this week do not contain identifiable child voice.",
        severity: "medium",
        evidence: ["log-1", "log-3", "log-5"],
        recommended_action: "Team briefing on capturing child voice. Add to next supervision.",
      },
    ],
    training_need_alerts: [
      {
        topic: "Trauma-Informed Recording",
        reason: "Multiple daily logs use deficit-based language when describing behaviour.",
        priority: "medium",
        suggested_resource_type: "quick_reference_card",
        staff_ids: [],
      },
    ],
    oversight_prompts: [
      {
        oversight_type: "incident_oversight",
        record_id: "inc-1",
        child_id: "child_2",
        reason: "Incident involving Amara requires management oversight comment.",
        priority: "high",
      },
      {
        oversight_type: "missing_from_care_oversight",
        record_id: "inc-5",
        child_id: "child_1",
        reason: "Missing episode requires return home interview and management oversight.",
        priority: "high",
      },
    ],
    suggested_plan_updates: [
      {
        child_id: "child_2",
        plan_type: "risk_assessment",
        suggestion: "Review self-harm risk rating in light of recent self-isolation and two incidents.",
        rationale: "Change in presentation plus incident frequency increase.",
        evidence: ["inc-2", "inc-3", "log-7"],
        priority: "high",
      },
    ],
    suggested_keywork: [
      {
        child_id: "child_1",
        session_type: "contact_debrief",
        title: "Family Contact Feelings — Jayden",
        rationale: "Cancelled contact visit last week. Jayden has been quieter since.",
        framework: "pace",
        priority: "medium",
      },
      {
        child_id: "child_2",
        session_type: "feelings_exploration",
        title: "Check-In — How Amara Is Feeling",
        rationale: "Increasing self-isolation and reduced appetite. Gentle check-in recommended.",
        framework: "ddp",
        priority: "high",
      },
    ],
    suggested_reflective: [
      {
        child_id: null,
        session_type: "reflective_practice",
        title: "Team Reflective Practice — Supporting Children Through Contact",
        rationale: "Several children showing distress around family contact. Team session to share approaches.",
        framework: "psychologically_informed",
        priority: "medium",
      },
    ],
    relationship_mapping: {},
    rota_impact_analysis: {},
    staff_consistency: {},
    repeated_triggers: [
      {
        child_id: "child_1",
        trigger: "Family contact",
        frequency: 3,
        period: "30_days",
        last_occurrence: "2026-05-10",
        suggested_response: "Repeated trigger. Add structured pre/post contact support to care plan.",
      },
    ],
    therapeutic_patterns: [
      {
        child_id: "child_2",
        pattern_type: "withdrawal_increase",
        description: "Amara's self-isolation has increased over the past 2 weeks. She is spending more time alone in her room and declining group meals.",
        evidence: ["log-7", "log-9", "log-12"],
        clinical_hypothesis: "This may indicate emotional overwhelm or a response to an unidentified stressor. The timing coincides with discussions about a potential placement move.",
        suggested_approach: "Gentle, non-intrusive check-ins using PACE. Ensure art materials are available. Do not pressure group participation.",
      },
    ],
    created_by: null,
    created_at: now.toISOString(),
  };
}

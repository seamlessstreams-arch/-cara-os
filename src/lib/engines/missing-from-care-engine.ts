// ══════════════════════════════════════════════════════════════════════════════
// CARA — MISSING FROM CARE INTELLIGENCE ENGINE
//
// Pure deterministic engine that aggregates missing episodes and computes:
// - Profile summary (total, active, avg duration, return interview rate)
// - Recent episodes with risk levels and statuses
// - Push/pull factor analysis from pattern notes
// - Contextual safeguarding risk flags
// - Auto-generated Cara intelligence insights (deterministic, no LLM)
//
// Key regulatory requirement: Reg 34 (missing children), Children's Homes
// Regulations 2015. Ofsted always examines missing patterns, return
// interviews, and exploitation screening.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export interface MissingEpisodeInput {
  id: string;
  reference?: string;
  child_id: string;
  date_missing: string;
  time_missing?: string | null;
  date_returned?: string | null;
  time_returned?: string | null;
  duration_hours?: number | null;
  risk_level: string;
  location_last_seen?: string | null;
  return_location?: string | null;
  reported_to_police?: boolean;
  police_reference?: string | null;
  reported_to_la?: boolean;
  return_interview_completed?: boolean;
  return_interview_by?: string | null;
  return_interview_date?: string | null;
  return_interview_notes?: string | null;
  contextual_safeguarding_risk?: boolean;
  linked_incident_id?: string | null;
  pattern_notes?: string | null;
  status: string;
}

export interface MissingProfile {
  total_episodes: number;
  active_episodes: number;
  resolved_this_month: number;
  avg_duration_minutes: number;
  police_notification_rate: number; // percentage
  return_interview_completion_rate: number; // percentage
  contextual_safeguarding_flagged: number;
  children_with_episodes: number;
  repeat_missing_children: string[]; // child IDs with 3+ episodes
}

export interface RecentEpisode {
  id: string;
  child_id: string;
  child_name: string;
  type: "missing" | "absent";
  risk_level: string;
  status: string;
  date: string;
  duration: string;
  return_interview: "completed" | "pending" | "refused" | "n/a";
  trigger: string;
  contextual_safeguarding: boolean;
}

export interface PushPullFactor {
  factor: string;
  count: number;
}

export interface PushPullAnalysis {
  push: PushPullFactor[];
  pull: PushPullFactor[];
  risk: PushPullFactor[];
}

export interface CaraInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface MissingIntelligenceResult {
  profile: MissingProfile;
  recent_episodes: RecentEpisode[];
  push_pull: PushPullAnalysis;
  insights: CaraInsight[];
}

export interface MissingEngineInput {
  episodes: MissingEpisodeInput[];
  childNameLookup?: (id: string) => string;
  today?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthStart(today: string): string {
  return today.slice(0, 7) + "-01";
}

function formatDuration(hours: number | null | undefined): string {
  if (hours == null || hours <= 0) return "Unknown";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Classify episode type based on duration and risk */
export function classifyEpisodeType(
  durationHours: number | null | undefined,
  riskLevel: string,
): "missing" | "absent" {
  // Absent = voluntary, low risk, short duration
  // Missing = involuntary, medium/high risk, or longer duration
  if (riskLevel === "low" && (durationHours ?? 0) < 3) return "absent";
  return "missing";
}

/** Extract push/pull/risk factors from episode notes */
export function extractFactors(episode: MissingEpisodeInput): {
  push: string[];
  pull: string[];
  risk: string[];
} {
  const push: string[] = [];
  const pull: string[] = [];
  const risk: string[] = [];
  const notes = ((episode.pattern_notes ?? "") + " " + (episode.return_interview_notes ?? "")).toLowerCase();

  // Pull factors (external attractions drawing the child away)
  if (notes.includes("peer") || notes.includes("mate") || notes.includes("friend")) {
    pull.push("peer_influence");
  }
  if (notes.includes("online") || notes.includes("social media") || notes.includes("internet")) {
    pull.push("online_contact");
  }
  if (notes.includes("romantic") || notes.includes("partner") || notes.includes("boyfriend") || notes.includes("girlfriend")) {
    pull.push("romantic_relationship");
  }
  if (notes.includes("drugs") || notes.includes("alcohol") || notes.includes("substance")) {
    pull.push("substance_use");
  }
  if (notes.includes("community") || notes.includes("park") || notes.includes("town")) {
    pull.push("community_attraction");
  }
  if (notes.includes("family") || notes.includes("birth parent") || notes.includes("mum") || notes.includes("dad")) {
    pull.push("family_contact");
  }

  // Push factors (things at the home driving the child away)
  if (notes.includes("conflict") || notes.includes("argument") || notes.includes("disagreement")) {
    push.push("conflict_with_staff");
  }
  if (notes.includes("boredom") || notes.includes("nothing to do") || notes.includes("boring")) {
    push.push("boredom");
  }
  if (notes.includes("upset") || notes.includes("distress") || notes.includes("angry") || notes.includes("frustrated")) {
    push.push("emotional_distress");
  }
  if (notes.includes("bullying") || notes.includes("bullied")) {
    push.push("peer_bullying");
  }
  if (notes.includes("restricted") || notes.includes("grounded") || notes.includes("consequence")) {
    push.push("restrictions_perceived");
  }

  // Risk factors (exploitation indicators)
  if (notes.includes("older") || notes.includes("unknown male") || notes.includes("unknown adult")) {
    risk.push("unknown_adults");
  }
  if (notes.includes("exploit") || notes.includes("groom") || notes.includes("trafficking")) {
    risk.push("exploitation_indicators");
  }
  if (notes.includes("phone") || notes.includes("new device") || notes.includes("mobile")) {
    risk.push("new_device_observed");
  }
  if (notes.includes("money") || notes.includes("cash") || notes.includes("brand new")) {
    risk.push("unexplained_gifts_money");
  }
  if (notes.includes("evasive") || notes.includes("secretive") || notes.includes("wouldn't")) {
    risk.push("secretive_behaviour");
  }
  if (episode.contextual_safeguarding_risk) {
    if (!risk.includes("exploitation_indicators")) {
      risk.push("contextual_safeguarding_flagged");
    }
  }

  return { push, pull, risk };
}

/** Classify return interview status */
function classifyInterview(ep: MissingEpisodeInput): "completed" | "pending" | "refused" | "n/a" {
  if (ep.status === "active" || ep.status === "open") return "n/a";
  if (ep.return_interview_completed) return "completed";
  const notes = (ep.return_interview_notes ?? "").toLowerCase();
  if (notes.includes("refused") || notes.includes("declined")) return "refused";
  return "pending";
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function computeMissingIntelligence(input: MissingEngineInput): MissingIntelligenceResult {
  const today = input.today ?? todayStr();
  const episodes = input.episodes;
  const childName = input.childNameLookup ?? ((id: string) =>
    id.replace("yp_", "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );

  // ── Profile ─────────────────────────────────────────────────────────────
  const active = episodes.filter((e) => e.status === "active" || e.status === "open");
  const closed = episodes.filter((e) => e.status === "closed" || e.status === "resolved");
  const thisMonth = monthStart(today);
  const resolvedThisMonth = closed.filter((e) =>
    (e.date_returned ?? e.date_missing) >= thisMonth
  ).length;

  const durations = episodes
    .filter((e) => e.duration_hours != null && e.duration_hours > 0)
    .map((e) => e.duration_hours!);
  const avgDurationMinutes = durations.length > 0
    ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 60)
    : 0;

  const policeReported = episodes.filter((e) => e.reported_to_police).length;
  const policeNotificationRate = episodes.length > 0
    ? Math.round((policeReported / episodes.length) * 100)
    : 0;

  const closedEpisodes = closed.length;
  const interviewsCompleted = closed.filter((e) => e.return_interview_completed).length;
  const returnInterviewRate = closedEpisodes > 0
    ? Math.round((interviewsCompleted / closedEpisodes) * 100)
    : 100; // no episodes = 100% compliance

  const csRiskCount = episodes.filter((e) => e.contextual_safeguarding_risk).length;

  // Children with episodes
  const childEpisodeCounts = new Map<string, number>();
  for (const ep of episodes) {
    childEpisodeCounts.set(ep.child_id, (childEpisodeCounts.get(ep.child_id) ?? 0) + 1);
  }
  const repeatChildren = [...childEpisodeCounts.entries()]
    .filter(([, count]) => count >= 3)
    .map(([id]) => id);

  const profile: MissingProfile = {
    total_episodes: episodes.length,
    active_episodes: active.length,
    resolved_this_month: resolvedThisMonth,
    avg_duration_minutes: avgDurationMinutes,
    police_notification_rate: policeNotificationRate,
    return_interview_completion_rate: returnInterviewRate,
    contextual_safeguarding_flagged: csRiskCount,
    children_with_episodes: childEpisodeCounts.size,
    repeat_missing_children: repeatChildren,
  };

  // ── Recent Episodes (last 10, sorted by date desc) ──────────────────────
  const sorted = [...episodes].sort((a, b) => b.date_missing.localeCompare(a.date_missing));
  const recent: RecentEpisode[] = sorted.slice(0, 10).map((ep) => {
    const factors = extractFactors(ep);
    const primaryTrigger = factors.pull[0] ?? factors.push[0] ?? factors.risk[0] ?? "unknown";

    return {
      id: ep.id,
      child_id: ep.child_id,
      child_name: childName(ep.child_id),
      type: classifyEpisodeType(ep.duration_hours, ep.risk_level),
      risk_level: ep.risk_level,
      status: ep.status,
      date: ep.date_missing,
      duration: formatDuration(ep.duration_hours),
      return_interview: classifyInterview(ep),
      trigger: primaryTrigger,
      contextual_safeguarding: ep.contextual_safeguarding_risk ?? false,
    };
  });

  // ── Push/Pull Analysis ──────────────────────────────────────────────────
  const pushCounts = new Map<string, number>();
  const pullCounts = new Map<string, number>();
  const riskCounts = new Map<string, number>();

  for (const ep of episodes) {
    const factors = extractFactors(ep);
    for (const f of factors.push) pushCounts.set(f, (pushCounts.get(f) ?? 0) + 1);
    for (const f of factors.pull) pullCounts.set(f, (pullCounts.get(f) ?? 0) + 1);
    for (const f of factors.risk) riskCounts.set(f, (riskCounts.get(f) ?? 0) + 1);
  }

  const toSorted = (map: Map<string, number>): PushPullFactor[] =>
    [...map.entries()]
      .map(([factor, count]) => ({ factor, count }))
      .sort((a, b) => b.count - a.count);

  const pushPull: PushPullAnalysis = {
    push: toSorted(pushCounts),
    pull: toSorted(pullCounts),
    risk: toSorted(riskCounts),
  };

  // ── Cara Intelligence Insights (deterministic) ──────────────────────────
  const insights: CaraInsight[] = [];

  // No episodes at all — clean record
  if (episodes.length === 0) {
    insights.push({
      severity: "positive",
      text: "No missing from care episodes recorded. All young people accounted for.",
    });
    return { profile, recent_episodes: recent, push_pull: pushPull, insights };
  }

  // Active episode alert
  if (active.length > 0) {
    const activeNames = [...new Set(active.map((e) => childName(e.child_id)))].join(", ");
    insights.push({
      severity: "critical",
      text: `${active.length} active missing episode(s): ${activeNames}. Ensure police notification, placing authority contact, and risk assessment are current. Check Cara dashboard for live updates.`,
    });
  }

  // Repeat missing pattern
  for (const childId of repeatChildren) {
    const childEps = episodes.filter((e) => e.child_id === childId);
    const name = childName(childId);
    const csRisk = childEps.some((e) => e.contextual_safeguarding_risk);
    const recentCount = childEps.filter((e) => {
      const daysDiff = Math.round(
        (new Date(today + "T00:00:00Z").getTime() - new Date(e.date_missing + "T00:00:00Z").getTime()) / 86_400_000
      );
      return daysDiff <= 90;
    }).length;

    if (recentCount >= 3) {
      insights.push({
        severity: "critical",
        text: `${name} has had ${recentCount} missing episodes in the past 90 days${csRisk ? ", with contextual safeguarding risk flagged" : ""}. Consider whether exploitation screening is required and discuss at next strategy meeting.`,
      });
    } else {
      insights.push({
        severity: "warning",
        text: `${name} has ${childEps.length} total episodes. Monitor for emerging patterns. ${csRisk ? "Contextual safeguarding risk previously flagged — maintain heightened awareness." : ""}`,
      });
    }
  }

  // Return interview compliance
  if (returnInterviewRate < 100 && closedEpisodes > 0) {
    const missed = closedEpisodes - interviewsCompleted;
    insights.push({
      severity: "warning",
      text: `Return interview completion rate at ${returnInterviewRate}% — ${missed} interview(s) outstanding or refused. Ensure independent person availability is maintained and children are supported to engage.`,
    });
  }

  // Risk factor alerts
  if (riskCounts.size > 0) {
    const topRisk = toSorted(riskCounts)[0];
    insights.push({
      severity: "warning",
      text: `Risk indicator "${topRisk.factor.replace(/_/g, " ")}" identified across ${topRisk.count} episode(s). Cross-reference with NRM referral pathway and local exploitation risk assessments.`,
    });
  }

  // Positive insights
  if (active.length === 0) {
    const parts: string[] = ["Zero active missing episodes"];
    if (durations.length >= 2) {
      const recentDurations = sorted.slice(0, 3).map((e) => e.duration_hours ?? 0);
      const olderDurations = sorted.slice(-3).map((e) => e.duration_hours ?? 0);
      const recentAvg = recentDurations.reduce((a, b) => a + b, 0) / (recentDurations.length || 1);
      const olderAvg = olderDurations.reduce((a, b) => a + b, 0) / (olderDurations.length || 1);
      if (recentAvg < olderAvg) {
        parts.push(`average duration reducing (from ${formatDuration(olderAvg)} to ${formatDuration(recentAvg)})`);
      }
    }
    if (pushCounts.size === 0) {
      parts.push("no push factors identified — placement itself is not a driver");
    }
    if (returnInterviewRate === 100 && closedEpisodes > 0) {
      parts.push("100% return interview completion rate");
    }
    if (parts.length > 1) {
      insights.push({
        severity: "positive",
        text: `Positive: ${parts.join(". ")}.`,
      });
    }
  }

  // Ensure at least one insight
  if (insights.length === 0) {
    insights.push({
      severity: "positive",
      text: `${episodes.length} episode(s) on record, all resolved. Continue monitoring and maintaining protective factors.`,
    });
  }

  return {
    profile,
    recent_episodes: recent,
    push_pull: pushPull,
    insights,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — SAFEGUARDING PATTERN ENGINE
//
// Scans evidence for escalation patterns, exploitation indicators, and
// concerning trends. Generates alerts that require human review — Cara never
// makes safeguarding decisions, only surfaces possible indicators.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type {
  CaraStudioSafeguardingPattern,
  CaraStudioSafeguardingPatternType,
} from "@/types/cara-studio";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

interface SourceRow {
  id: string;
  source_type: string;
  title: string | null;
  content: string | null;
  summary: string | null;
  source_date: string | null;
  child_id: string | null;
}

const PATTERN_KEYWORDS: Record<CaraStudioSafeguardingPatternType, string[]> = {
  missing_episode_escalation: ["missing", "absent", "awol", "whereabouts unknown", "not returned", "failed to return", "breach of curfew", "late return"],
  exploitation_indicator: ["new phone", "unexplained money", "new clothing", "older friends", "secretive", "county lines", "exploitation", "grooming", "unexplained gifts", "unknown adults"],
  online_safety_risk: ["online", "social media", "catfish", "nude", "image", "sext", "inappropriate content", "dark web", "gaming", "stranger online"],
  peer_on_peer_concern: ["bullying", "peer", "fight", "intimidation", "aggression towards", "targeting", "power imbalance", "coercion", "peer pressure"],
  self_harm_escalation: ["self-harm", "self harm", "cutting", "overdose", "suicidal", "not wanting to be here", "hurting myself", "marks on"],
  substance_misuse_pattern: ["cannabis", "alcohol", "drunk", "drugs", "substance", "intoxicated", "smoking", "vaping", "nitrous oxide", "nos canisters"],
  concerning_contact: ["concerning adult", "inappropriate contact", "unknown male", "unknown female", "unvetted", "unauthorised contact"],
  isolation_increase: ["withdrawn", "isolated", "refusing to leave room", "not engaging", "no friends", "lost friendships", "stopped attending"],
  emotional_deterioration: ["deteriorating mood", "low mood", "crying", "angry outbursts", "escalating behaviour", "emotional dysregulation", "meltdown"],
  allegation_pattern: ["allegation", "disclosed", "complaint against staff", "inappropriate behaviour", "boundary breach", "professional boundary"],
  staff_practice_drift: ["practice drift", "inconsistent approach", "not following plan", "skipped supervision", "missed key work", "not updated"],
  education_refusal_escalation: ["school refusal", "not attending", "excluded", "suspension", "education breakdown", "refusing education", "part-time timetable"],
};

const HIGH_SEVERITY_PATTERNS: CaraStudioSafeguardingPatternType[] = [
  "exploitation_indicator", "self_harm_escalation", "allegation_pattern", "missing_episode_escalation",
];

export async function scanSafeguardingPatterns(hId: string, childId?: string): Promise<CaraStudioSafeguardingPattern[]> {
  const sb = createServerClient();
  if (!sb) return getDemoPatterns();

  let query = (sb.from("aria_studio_sources") as any)
    .select("id, source_type, title, content, summary, source_date, child_id")
    .eq("home_id", hId).order("source_date", { ascending: false }).limit(200);
  if (childId) query = query.eq("child_id", childId);

  const { data: sources, error } = await query;
  if (error || !sources) return [];

  const rows = sources as SourceRow[];
  const patterns: CaraStudioSafeguardingPattern[] = [];
  const patternCounts: Record<string, { count: number; sourceIds: string[]; titles: string[] }> = {};

  for (const src of rows) {
    const text = `${src.title ?? ""} ${src.content ?? ""} ${src.summary ?? ""}`.toLowerCase();
    const srcChildId = src.child_id ?? childId ?? null;

    for (const [patternType, keywords] of Object.entries(PATTERN_KEYWORDS)) {
      const matched = keywords.filter((kw) => text.includes(kw));
      if (matched.length > 0) {
        const key = `${patternType}:${srcChildId ?? "home"}`;
        if (!patternCounts[key]) patternCounts[key] = { count: 0, sourceIds: [], titles: [] };
        patternCounts[key].count++;
        patternCounts[key].sourceIds.push(src.id);
        patternCounts[key].titles.push(src.title ?? src.source_type);
      }
    }
  }

  for (const [key, data] of Object.entries(patternCounts)) {
    if (data.count < 2) continue;
    const [patternType, targetChildId] = key.split(":");
    const isHigh = HIGH_SEVERITY_PATTERNS.includes(patternType as CaraStudioSafeguardingPatternType);
    const severity = isHigh && data.count >= 3 ? "critical" : isHigh || data.count >= 4 ? "high" : data.count >= 3 ? "medium" : "low";

    patterns.push(buildPattern({
      home_id: hId, child_id: targetChildId !== "home" ? targetChildId : null,
      pattern_type: patternType as CaraStudioSafeguardingPatternType,
      risk_level: severity,
      title: `Possible ${patternType.replace(/_/g, " ")} detected`,
      description: `${data.count} records contain indicators of ${patternType.replace(/_/g, " ")}. This requires professional review.`,
      indicators: data.titles.slice(0, 5).map((t) => ({ source: t })),
      evidence_source_ids: data.sourceIds.slice(0, 10),
      recommended_actions: [
        { action: "Review the identified records in context" },
        { action: "Discuss with the designated safeguarding lead" },
        { action: "Consider whether a multi-agency referral is needed" },
        { action: "Ensure the young person's voice is captured" },
      ],
    }));
  }

  if (patterns.length > 0) {
    const { error: insertErr } = await (sb.from("aria_studio_safeguarding_patterns") as any)
      .insert(patterns.map((p) => ({
        home_id: p.home_id, child_id: p.child_id, pattern_type: p.pattern_type,
        risk_level: p.risk_level, title: p.title, description: p.description,
        indicators: p.indicators, evidence_source_ids: p.evidence_source_ids,
        recommended_actions: p.recommended_actions, status: "open",
      })));
    if (insertErr) console.error("[cara-studio/safeguarding] Insert error:", insertErr);
  }

  return patterns;
}

export async function listSafeguardingPatterns(hId: string, childId?: string, status?: string): Promise<CaraStudioSafeguardingPattern[]> {
  const sb = createServerClient();
  if (!sb) return getDemoPatterns();

  let query = (sb.from("aria_studio_safeguarding_patterns") as any)
    .select("*").eq("home_id", hId).order("created_at", { ascending: false });
  if (childId) query = query.eq("child_id", childId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) { console.error("[cara-studio/safeguarding] List error:", error); return []; }
  return (data ?? []) as CaraStudioSafeguardingPattern[];
}

export async function reviewSafeguardingPattern(patternId: string, _reviewedBy: string, status: "acknowledged" | "escalated" | "dismissed"): Promise<boolean> {
  const sb = createServerClient();
  if (!sb) return false;

  const { error } = await (sb.from("aria_studio_safeguarding_patterns") as any)
    .update({ status, reviewed_at: new Date().toISOString() }).eq("id", patternId);

  if (error) { console.error("[cara-studio/safeguarding] Review error:", error); return false; }
  return true;
}

function buildPattern(partial: Partial<CaraStudioSafeguardingPattern> & { home_id: string; pattern_type: CaraStudioSafeguardingPatternType; risk_level: string; title: string }): CaraStudioSafeguardingPattern {
  const now = new Date().toISOString();
  return {
    id: `pattern-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    home_id: partial.home_id, child_id: partial.child_id ?? null,
    pattern_type: partial.pattern_type, risk_level: partial.risk_level,
    title: partial.title, description: partial.description ?? null,
    indicators: partial.indicators ?? [], evidence_source_ids: partial.evidence_source_ids ?? [],
    recommended_actions: partial.recommended_actions ?? [], status: "open",
    created_at: now, reviewed_at: null, resolved_at: null,
  };
}

function getDemoPatterns(): CaraStudioSafeguardingPattern[] {
  return [
    buildPattern({ home_id: homeId(), child_id: "demo-child-1", pattern_type: "missing_episode_escalation", risk_level: "high", title: "Possible missing episode escalation detected", description: "3 records in the past 14 days contain indicators of missing episodes.", indicators: [{ source: "Daily log — 5 May" }, { source: "Missing from care — 7 May" }, { source: "Daily log — 9 May" }], evidence_source_ids: ["demo-src-1", "demo-src-2", "demo-src-3"] }),
    buildPattern({ home_id: homeId(), child_id: "demo-child-1", pattern_type: "isolation_increase", risk_level: "medium", title: "Possible isolation increase detected", description: "2 records describe increased withdrawal.", indicators: [{ source: "Key work — 4 May" }, { source: "Daily log — 8 May" }], evidence_source_ids: ["demo-src-4", "demo-src-5"] }),
  ];
}

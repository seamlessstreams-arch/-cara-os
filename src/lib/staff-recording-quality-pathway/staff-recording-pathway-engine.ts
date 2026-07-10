// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF RECORDING QUALITY PATHWAY — pure engine
//
// Maps each active staff member's writing-assistant engagement (accept/ignore
// patterns from WAUD) onto KB practice-framework skill domains. Returns per-
// staff development signals, supervision prompts, and team summary — all
// grounded in the 21 Skills and PACE Model frameworks.
//
// No LLM calls. Fully deterministic from store data. Pure — the store is passed
// IN, so this is fully unit-testable and never touches NextResponse or
// getStore() itself.
// ══════════════════════════════════════════════════════════════════════════════

import type { getStore } from "@/lib/db/store";

// ── KB framework stubs (inline — no dep on feat/cara-knowledge-base) ─────────

export const KB_FRAMEWORKS = {
  skills_21_residential: {
    id: "skills_21_residential",
    title: "21 Skills for Residential Childcare",
    shortDesc: "Outcomes change through skills practised under pressure, not policies.",
  },
  model_pace: {
    id: "model_pace",
    title: "PACE Model",
    shortDesc: "Playfulness, Acceptance, Curiosity, Empathy — developed by Dan Hughes.",
  },
  concept_psychological_safety: {
    id: "concept_psychological_safety",
    title: "Psychological Safety",
    shortDesc: "Amy Edmondson: teams that can speak up without fear learn and improve.",
  },
} as const;

export type FrameworkId = keyof typeof KB_FRAMEWORKS;

export type KBFramework = (typeof KB_FRAMEWORKS)[FrameworkId];

// ── Issue-type → KB framework mapping ────────────────────────────────────────

export const ISSUE_TO_FRAMEWORK: Record<string, FrameworkId> = {
  "safeguarding-quality": "skills_21_residential",
  "chronology":           "skills_21_residential",
  "writing-to-child":     "skills_21_residential",
  "tone":                 "model_pace",
  "professional-language":"model_pace",
  "clarity":              "skills_21_residential",
};

// Issue types that carry the most practice-quality significance.
export const PRACTICE_ISSUE_TYPES = new Set([
  "safeguarding-quality",
  "tone",
  "writing-to-child",
  "chronology",
  "clarity",
  "professional-language",
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

export type IssueType = string;

export interface IssueStat {
  type: IssueType;
  total: number;
  accepted: number;
  ignored: number;
}

export function buildIssueStats(entries: Array<{ issue_type: string; action: string }>): IssueStat[] {
  const map = new Map<string, IssueStat>();
  for (const e of entries) {
    const existing = map.get(e.issue_type) ?? { type: e.issue_type, total: 0, accepted: 0, ignored: 0 };
    existing.total += 1;
    if (e.action === "accepted") existing.accepted += 1;
    if (e.action === "ignored") existing.ignored += 1;
    map.set(e.issue_type, existing);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export type KBSignal = "progressing" | "developing" | "needs_support";

export interface KBAlignment {
  frameworkId: FrameworkId;
  frameworkTitle: string;
  signal: KBSignal;
  reason: string;
  supervisionPrompt: string;
}

export function deriveKBAlignment(issueStats: IssueStat[], staffName: string): KBAlignment[] {
  const byFramework = new Map<FrameworkId, IssueStat[]>();

  for (const stat of issueStats) {
    const fId = ISSUE_TO_FRAMEWORK[stat.type];
    if (!fId) continue;
    const group = byFramework.get(fId) ?? [];
    group.push(stat);
    byFramework.set(fId, group);
  }

  const alignments: KBAlignment[] = [];

  for (const [fId, stats] of byFramework.entries()) {
    const fw = KB_FRAMEWORKS[fId];
    const total = stats.reduce((s, x) => s + x.total, 0);
    const ignored = stats.reduce((s, x) => s + x.ignored, 0);
    const accepted = stats.reduce((s, x) => s + x.accepted, 0);
    const ignoreRate = total > 0 ? ignored / total : 0;

    let signal: KBSignal;
    let reason: string;
    let supervisionPrompt: string;

    if (ignoreRate >= 0.5) {
      signal = "needs_support";
      reason = `${ignored} of ${total} Cara suggestions in this area were dismissed — may need discussion.`;
      supervisionPrompt = `${staffName} has dismissed over half the Cara feedback in ${fw.title} areas. Explore: what feels unhelpful about Cara's suggestions here, and what support would land better?`;
    } else if (accepted > 0 && ignoreRate < 0.3) {
      signal = "progressing";
      reason = `${accepted} of ${total} suggestions accepted — actively engaging with ${fw.title} guidance.`;
      supervisionPrompt = `${staffName} is consistently accepting Cara's ${fw.title}-aligned guidance. Build on this: what specific insight has been most useful?`;
    } else {
      signal = "developing";
      reason = `${accepted} accepted, ${ignored} dismissed from ${total} ${fw.title} suggestions — engagement is mixed.`;
      supervisionPrompt = `${staffName} has a mixed pattern with ${fw.title}-aligned suggestions (${accepted} accepted, ${ignored} dismissed). Explore what's landing well and what's creating friction.`;
    }

    alignments.push({ frameworkId: fId, frameworkTitle: fw.title, signal, reason, supervisionPrompt });
  }

  return alignments.sort((a, b) => {
    const rank: Record<KBSignal, number> = { needs_support: 0, developing: 1, progressing: 2 };
    return rank[a.signal] - rank[b.signal];
  });
}

export function overallSignal(alignments: KBAlignment[]): KBSignal {
  if (alignments.some((a) => a.signal === "needs_support")) return "needs_support";
  if (alignments.some((a) => a.signal === "developing")) return "developing";
  if (alignments.length === 0) return "developing";
  return "progressing";
}

// ── Builder output shape ──────────────────────────────────────────────────────

export interface StaffRecordingProfile {
  staffId: string;
  name: string;
  jobTitle: string | null;
  role: string | null;
  totalFlagged: number;
  accepted: number;
  ignored: number;
  acceptanceRate: number | null;
  firstEntry: string | null;
  latestEntry: string | null;
  hasData: boolean;
  issueBreakdown: IssueStat[];
  topIssueType: string | null;
  kbAlignment: KBAlignment[];
  overallSignal: KBSignal;
}

export interface StaffRecordingPathwaySummary {
  totalStaff: number;
  staffWithData: number;
  progressing: number;
  developing: number;
  needsSupport: number;
  topTeamIssueType: string | null;
  avgAcceptanceRate: number | null;
  frameworks: KBFramework[];
}

export interface StaffRecordingPathwayData {
  profiles: StaffRecordingProfile[];
  summary: StaffRecordingPathwaySummary;
}

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildStaffRecordingPathway(store: ReturnType<typeof getStore>): StaffRecordingPathwayData {
  const activeStaff = ((store.staff ?? []) as Array<{
    id: string; full_name?: string; first_name?: string; last_name?: string;
    job_title?: string; role?: string; employment_status?: string;
  }>).filter((s) => s.employment_status === "active");

  const waud = (store.writingAssistantAuditEvents ?? []) as Array<{
    id: string; user_id: string; issue_type: string; action: string;
    record_type?: string; child_id?: string; created_at: string;
  }>;

  const profiles = activeStaff.map((s) => {
    const entries = waud.filter((e) => e.user_id === s.id);
    const practiceEntries = entries.filter((e) => PRACTICE_ISSUE_TYPES.has(e.issue_type));

    const totalFlagged = practiceEntries.length;
    const accepted = practiceEntries.filter((e) => e.action === "accepted").length;
    const ignored = practiceEntries.filter((e) => e.action === "ignored").length;
    const acceptanceRate = totalFlagged > 0 ? Math.round((accepted / totalFlagged) * 100) : null;

    const dates = entries.map((e) => e.created_at).sort();
    const firstEntry = dates[0] ?? null;
    const latestEntry = dates[dates.length - 1] ?? null;

    const issueBreakdown = buildIssueStats(practiceEntries);

    const nameParts = `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim();
    const name = s.full_name ?? (nameParts || s.id);
    const kbAlignment = deriveKBAlignment(issueBreakdown, name);

    const topIssueType = issueBreakdown[0]?.type ?? null;

    return {
      staffId: s.id,
      name,
      jobTitle: s.job_title ?? null,
      role: s.role ?? null,
      totalFlagged,
      accepted,
      ignored,
      acceptanceRate,
      firstEntry,
      latestEntry,
      hasData: totalFlagged > 0,
      issueBreakdown,
      topIssueType,
      kbAlignment,
      overallSignal: overallSignal(kbAlignment),
    };
  });

  // Team summary
  const withData = profiles.filter((p) => p.hasData);
  const signalCounts = {
    progressing: withData.filter((p) => p.overallSignal === "progressing").length,
    developing:  withData.filter((p) => p.overallSignal === "developing").length,
    needsSupport: withData.filter((p) => p.overallSignal === "needs_support").length,
  };

  const allIssueTypes = profiles.flatMap((p) => p.issueBreakdown);
  const issueTypeTotals = new Map<string, number>();
  for (const stat of allIssueTypes) {
    issueTypeTotals.set(stat.type, (issueTypeTotals.get(stat.type) ?? 0) + stat.total);
  }
  const topTeamIssueType = [...issueTypeTotals.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const avgAcceptanceRate =
    withData.length > 0 && withData.some((p) => p.acceptanceRate !== null)
      ? Math.round(
          withData.filter((p) => p.acceptanceRate !== null).reduce((s, p) => s + (p.acceptanceRate ?? 0), 0) /
            withData.filter((p) => p.acceptanceRate !== null).length,
        )
      : null;

  return {
    profiles,
    summary: {
      totalStaff: profiles.length,
      staffWithData: withData.length,
      ...signalCounts,
      topTeamIssueType,
      avgAcceptanceRate,
      frameworks: Object.values(KB_FRAMEWORKS),
    },
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// ARIA V2 — CHILD VOICE GAP ANALYSIS
//
// Analyses records to identify children whose voice is missing, thin, or
// at risk of becoming invisible. Ofsted expects "the voice of the child
// is evident throughout the records." This engine surfaces where it is not.
//
// Gap types:
//   - No key work in N days
//   - No direct quotes in recent records
//   - Post-incident voice not captured
//   - No wishes and feelings in placement plan period
//   - Voice present but single-theme (not covering wellbeing holistically)
//   - Child not asked about recent changes/events
//
// All outputs are "Aria identified gap — requires manager review."
// ══════════════════════════════════════════════════════════════════════════════

export interface ChildRecord {
  id: string;
  childId: string;
  childName: string;
  recordType: string;
  date: string;
  hasDirectQuote: boolean;
  themes: string[];
  wordCount: number;
}

export interface IncidentSummary {
  id: string;
  childId: string;
  date: string;
  severity: string;
  type: string;
  hasPostIncidentVoice: boolean;
}

export interface VoiceGap {
  childId: string;
  childName: string;
  gapType: string;
  title: string;
  description: string;
  severity: "urgent" | "high" | "medium" | "low";
  recommendation: string;
  evidenceSummary: string;
  lastVoiceDate?: string;
  daysSinceVoice?: number;
}

export interface VoiceGapScanConfig {
  keyWorkMaxDaysBetween?: number;
  directQuoteMinPerMonth?: number;
  postIncidentVoiceMaxDays?: number;
  minThemeCoverage?: number;
}

const VOICE_THEMES = [
  "safety",
  "belonging",
  "identity",
  "family_relationships",
  "friendships",
  "education",
  "health_wellbeing",
  "future_aspirations",
  "fears_concerns",
  "things_they_love",
] as const;

// ── Main scan ─────────────────────────────────────────────────────────────────

export function scanVoiceGaps(
  records: ChildRecord[],
  incidents: IncidentSummary[],
  childIds: { id: string; name: string }[],
  config?: VoiceGapScanConfig,
): VoiceGap[] {
  const keyWorkMaxDays = config?.keyWorkMaxDaysBetween ?? 14;
  const quoteMinPerMonth = config?.directQuoteMinPerMonth ?? 2;
  const postIncidentMaxDays = config?.postIncidentVoiceMaxDays ?? 3;
  const minThemes = config?.minThemeCoverage ?? 4;

  const today = new Date().toISOString().split("T")[0];
  const gaps: VoiceGap[] = [];

  for (const child of childIds) {
    const childRecords = records
      .filter((r) => r.childId === child.id)
      .sort((a, b) => b.date.localeCompare(a.date));

    const childIncidents = incidents
      .filter((i) => i.childId === child.id)
      .sort((a, b) => b.date.localeCompare(a.date));

    // ── 1. Key work frequency gap ─────────────────────────────────────
    const keyWorkRecords = childRecords.filter(
      (r) => r.recordType === "key_work" || r.recordType === "one_to_one",
    );

    if (keyWorkRecords.length === 0) {
      gaps.push({
        childId: child.id,
        childName: child.name,
        gapType: "no_key_work",
        title: `No key work sessions recorded — ${child.name}`,
        description: `There are no key work or one-to-one session records for ${child.name}. Key work is the primary mechanism for capturing the child's voice, building the relationship, and understanding their wishes and feelings.`,
        severity: "high",
        recommendation: "Arrange a key work session with the child's key worker. Focus on building rapport and understanding what the child needs. Record the child's voice in their own words.",
        evidenceSummary: "No key work or one-to-one records found in the system.",
      });
    } else {
      const lastKeyWork = keyWorkRecords[0];
      const daysSince = daysBetween(lastKeyWork.date, today);

      if (daysSince > keyWorkMaxDays) {
        gaps.push({
          childId: child.id,
          childName: child.name,
          gapType: "key_work_overdue",
          title: `Key work overdue by ${daysSince - keyWorkMaxDays} days — ${child.name}`,
          description: `The last key work session for ${child.name} was ${daysSince} days ago (${lastKeyWork.date}). Key work should take place at least every ${keyWorkMaxDays} days to ensure the child's voice remains current in the records.`,
          severity: daysSince > keyWorkMaxDays * 2 ? "high" : "medium",
          recommendation: "Schedule a key work session. Consider whether the child has been through any changes or events since the last session that should be explored.",
          evidenceSummary: `Last key work: ${lastKeyWork.date}. ${daysSince} days ago.`,
          lastVoiceDate: lastKeyWork.date,
          daysSinceVoice: daysSince,
        });
      }
    }

    // ── 2. Direct quote gap ───────────────────────────────────────────
    const last30Days = childRecords.filter(
      (r) => daysBetween(r.date, today) <= 30,
    );
    const recentQuotes = last30Days.filter((r) => r.hasDirectQuote);

    if (recentQuotes.length < quoteMinPerMonth) {
      gaps.push({
        childId: child.id,
        childName: child.name,
        gapType: "missing_direct_quotes",
        title: `Child's own words not captured — ${child.name}`,
        description: `Only ${recentQuotes.length} record(s) in the last 30 days contain the child's direct words. Ofsted expects to see the child's voice in their own words — not just staff interpretation of what the child might be feeling. Direct quotes demonstrate that the child has been listened to.`,
        severity: recentQuotes.length === 0 ? "high" : "medium",
        recommendation: "When recording daily logs, key work, and incidents, capture what the child actually said. Use quotation marks for direct speech. Ask open questions and record the child's responses.",
        evidenceSummary: `${recentQuotes.length} of ${last30Days.length} records in 30 days contain direct quotes.`,
      });
    }

    // ── 3. Post-incident voice gap ────────────────────────────────────
    for (const incident of childIncidents) {
      if (incident.severity === "low") continue;

      const postIncidentRecords = childRecords.filter(
        (r) =>
          r.date >= incident.date &&
          daysBetween(r.date, incident.date) <= postIncidentMaxDays &&
          (r.recordType === "key_work" || r.recordType === "one_to_one" || r.recordType === "daily_log"),
      );

      const hasVoice = postIncidentRecords.some((r) => r.hasDirectQuote);

      if (!hasVoice && !incident.hasPostIncidentVoice) {
        const daysSinceIncident = daysBetween(incident.date, today);
        if (daysSinceIncident <= 14) {
          gaps.push({
            childId: child.id,
            childName: child.name,
            gapType: "post_incident_voice_missing",
            title: `Child's voice not captured after ${incident.type.replace(/_/g, " ")} — ${child.name}`,
            description: `A ${incident.severity} severity ${incident.type.replace(/_/g, " ")} incident occurred on ${incident.date}. The child's experience, feelings, and wishes have not been recorded within ${postIncidentMaxDays} days. After any significant incident, the child should be given a safe space to express how they feel.`,
            severity: incident.severity === "critical" ? "urgent" : "high",
            recommendation: "Arrange a key work session focused on the incident. Ask the child how they felt, what they need, and whether they feel safe. Record their words directly. Do not lead the conversation — let the child share at their own pace.",
            evidenceSummary: `Incident ${incident.id} on ${incident.date} (${incident.severity} ${incident.type}). No post-incident voice record found within ${postIncidentMaxDays} days.`,
          });
        }
      }
    }

    // ── 4. Theme coverage gap ─────────────────────────────────────────
    const last90Days = childRecords.filter(
      (r) => daysBetween(r.date, today) <= 90,
    );
    const coveredThemes = new Set<string>();
    for (const r of last90Days) {
      for (const t of r.themes) {
        coveredThemes.add(t);
      }
    }

    const missingThemes = VOICE_THEMES.filter((t) => !coveredThemes.has(t));
    if (missingThemes.length > VOICE_THEMES.length - minThemes && last90Days.length > 0) {
      gaps.push({
        childId: child.id,
        childName: child.name,
        gapType: "narrow_voice_coverage",
        title: `Voice coverage gaps — ${child.name}`,
        description: `Records for ${child.name} in the last 90 days cover ${coveredThemes.size} of ${VOICE_THEMES.length} key wellbeing themes. Missing themes: ${missingThemes.map((t) => t.replace(/_/g, " ")).join(", ")}. A holistic picture of the child's experience requires capturing their views across all areas of their life.`,
        severity: coveredThemes.size <= 2 ? "high" : "medium",
        recommendation: `Plan key work sessions that explore the missing themes: ${missingThemes.map((t) => t.replace(/_/g, " ")).join(", ")}. Use age-appropriate tools and approaches to help the child express their views on these topics.`,
        evidenceSummary: `${coveredThemes.size}/${VOICE_THEMES.length} themes covered. Missing: ${missingThemes.join(", ")}.`,
      });
    }

    // ── 5. Silent child — no voice records at all in 30 days ──────────
    const voiceRecords = last30Days.filter(
      (r) => r.hasDirectQuote || r.recordType === "key_work" || r.recordType === "one_to_one",
    );
    if (voiceRecords.length === 0 && last30Days.length > 0) {
      gaps.push({
        childId: child.id,
        childName: child.name,
        gapType: "silent_child",
        title: `No voice presence in 30 days — ${child.name}`,
        description: `${child.name} has ${last30Days.length} records in the last 30 days, but none contain the child's voice — no key work, no direct quotes, no one-to-one sessions. The child is present in the records but invisible as a person. This is a significant gap that would be identified at inspection.`,
        severity: "urgent",
        recommendation: "This is a priority. The child's key worker should arrange dedicated time with the child. Explore how the child is feeling about their placement, their relationships, their future. Record what the child says, not what staff think the child feels.",
        evidenceSummary: `${last30Days.length} records in 30 days, 0 containing child's voice.`,
      });
    }
  }

  return deduplicateGaps(gaps);
}

// ── Summary for dashboard ─────────────────────────────────────────────────────

export interface VoiceGapSummary {
  totalChildren: number;
  childrenWithGaps: number;
  urgentGaps: number;
  highGaps: number;
  mediumGaps: number;
  gapsByType: Record<string, number>;
  worstGap: VoiceGap | null;
}

export function summariseVoiceGaps(gaps: VoiceGap[], totalChildren: number): VoiceGapSummary {
  const childrenWithGaps = new Set(gaps.map((g) => g.childId)).size;
  const gapsByType: Record<string, number> = {};
  for (const g of gaps) {
    gapsByType[g.gapType] = (gapsByType[g.gapType] ?? 0) + 1;
  }

  const urgentGaps = gaps.filter((g) => g.severity === "urgent").length;
  const highGaps = gaps.filter((g) => g.severity === "high").length;

  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...gaps].sort((a, b) => (priorityOrder[a.severity] ?? 3) - (priorityOrder[b.severity] ?? 3));

  return {
    totalChildren,
    childrenWithGaps,
    urgentGaps,
    highGaps,
    mediumGaps: gaps.filter((g) => g.severity === "medium").length,
    gapsByType,
    worstGap: sorted[0] ?? null,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.abs((new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24));
}

function deduplicateGaps(gaps: VoiceGap[]): VoiceGap[] {
  const seen = new Set<string>();
  return gaps.filter((g) => {
    const key = `${g.gapType}:${g.childId}:${g.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

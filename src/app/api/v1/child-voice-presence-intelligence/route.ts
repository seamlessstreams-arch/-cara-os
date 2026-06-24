// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD VOICE PRESENCE INTELLIGENCE
// GET /api/v1/child-voice-presence-intelligence
//
// Analyses how consistently children's own perspectives are captured across
// five recording types: Incidents, Daily Log, Key Working Sessions, YP
// Feedback, and LAC Reviews.
//
// Voice presence = child's words, views, or choices appear in the record.
// Not just records ABOUT the child, but records HEARING the child.
//
// Grounds supervision prompts in UN CRC Article 12 and the "Children as
// Experts" principle from the Cara Knowledge Base.
//
// All deterministic. No LLM calls.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";

// ── Voice detection ───────────────────────────────────────────────────────────

// Phrases that strongly indicate the CHILD's voice is present in a record.
// Removed the bare /\bvoice\b/ ("raised his voice") and /according to/ ("according
// to policy"); "expressed"/"described" are now guarded so a staff subject ("Staff
// expressed concern") doesn't read as the child's voice. Quote pattern accepts
// smart quotes (pasted/Word text).
const VOICE_PATTERNS = [
  /\bsaid\b/i,
  /\btold me\b/i,
  /\btold (staff|worker|carer|me)\b/i,
  /\bexplained\b/i,
  /\bmentioned\b/i,
  /\bfelt that\b/i,
  /\bwanted to\b/i,
  /\bwished\b/i,
  /\bchose to\b/i,
  /\bdecided to\b/i,
  /\bagreed to\b/i,
  /["“”'‘’]([^"“”'‘’]{5,})["“”'‘’]/,     // any quoted speech ≥5 chars (straight or smart quotes)
  /child(['’]s)? (view|perspective|voice|opinion|words)/i,
  /young person(['’]s)? (view|perspective|voice|opinion|words)/i,
  /\bfeedback from\b/i,
  // "expressed"/"described" only when NOT attributed to staff/worker/I/we, etc.
  /(?<!\b(?:staff|worker|carer|keyworker|colleague|police|manager|i|we)\s)(?:expressed|described)\b/i,
];

function hasVoice(text: string): boolean {
  if (!text || text.trim().length < 10) return false;
  return VOICE_PATTERNS.some((p) => p.test(text));
}

// For the key-working child_voice field — is it substantively the child's voice,
// or just a note that they didn't engage? Patterns are NOT ^-anchored (real text
// starts with a subject: "Alex was quiet…"), and a field mentioning non-engagement
// is still substantive if genuine voice markers are also present.
const EMPTY_VOICE_PATTERNS = [
  /^n\/?a\.?$/i,
  /\bno (voice|comment|views?|response)\b/i,
  /\b(was|were|seemed|remained|stayed|appeared|kept) (very )?(quiet|silent|reluctant|withdrawn|unresponsive)\b/i,
  /\bnon.?verbal\b/i,
  /\b(did|would|could)(n'?t| not) (want|wish|engage|talk|speak|share|participate|comment)\b/i,
  /\b(declined|refused|unwilling) to (share|comment|engage|talk|speak|participate|give)/i,
];

function isSubstantiveVoice(text: string): boolean {
  if (!text || text.trim().length < 15) return false;
  const t = text.trim();
  // A note that is only about non-engagement is not the child's voice — unless
  // genuine voice markers are also present in the same field.
  if (EMPTY_VOICE_PATTERNS.some((p) => p.test(t))) return hasVoice(t);
  return true;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type RecordType = "incidents" | "dailyLog" | "keyWorkingSessions" | "ypFeedback" | "lacReviews";
type VoiceTrend = "improving" | "stable" | "declining";

interface RecordTypeStats {
  type: RecordType;
  label: string;
  total: number;
  withVoice: number;
  presenceRate: number | null;
  recentRate: number | null;
  priorRate: number | null;
  trend: VoiceTrend;
  supervisionPrompt: string;
}

interface ChildVoiceProfile {
  childId: string;
  name: string;
  overallScore: number | null;
  totalRecords: number;
  recordsWithVoice: number;
  byType: Partial<Record<RecordType, { total: number; withVoice: number; rate: number | null }>>;
  topGapType: RecordType | null;
  topStrengthType: RecordType | null;
  hasData: boolean;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET() {
  const store = getStore();
  const NOW_MS = Date.now();
  const MS_30D = 30 * 24 * 60 * 60 * 1000;

  // ── Per-type global stats ─────────────────────────────────────────────────

  const typeStats: Record<RecordType, { total: number; withVoice: number; recent: number; recentVoice: number; prior: number; priorVoice: number }> = {
    incidents:         { total: 0, withVoice: 0, recent: 0, recentVoice: 0, prior: 0, priorVoice: 0 },
    dailyLog:          { total: 0, withVoice: 0, recent: 0, recentVoice: 0, prior: 0, priorVoice: 0 },
    keyWorkingSessions:{ total: 0, withVoice: 0, recent: 0, recentVoice: 0, prior: 0, priorVoice: 0 },
    ypFeedback:        { total: 0, withVoice: 0, recent: 0, recentVoice: 0, prior: 0, priorVoice: 0 },
    lacReviews:        { total: 0, withVoice: 0, recent: 0, recentVoice: 0, prior: 0, priorVoice: 0 },
  };

  // Per-child accumulator
  type ChildStats = {
    byType: Partial<Record<RecordType, { total: number; withVoice: number }>>;
  };
  const childMap = new Map<string, ChildStats>();

  function ensureChild(childId: string): ChildStats {
    let c = childMap.get(childId);
    if (!c) { c = { byType: {} }; childMap.set(childId, c); }
    return c;
  }

  function record(childId: string, type: RecordType, dateStr: string, voice: boolean) {
    const t = typeStats[type];
    t.total += 1;
    if (voice) t.withVoice += 1;
    const ms = new Date(dateStr).getTime();
    if (!isNaN(ms)) {
      const age = NOW_MS - ms;
      if (age >= 0 && age <= MS_30D) {
        t.recent += 1;
        if (voice) t.recentVoice += 1;
      } else if (age > MS_30D && age <= MS_30D * 2) {
        t.prior += 1;
        if (voice) t.priorVoice += 1;
      }
    }
    const c = ensureChild(childId);
    const existing = c.byType[type] ?? { total: 0, withVoice: 0 };
    existing.total += 1;
    if (voice) existing.withVoice += 1;
    c.byType[type] = existing;
  }

  // ── 1. Incidents ─────────────────────────────────────────────────────────
  const incidents = (store.incidents ?? []) as Array<{
    id: string; child_id: string; date: string; description: string; immediate_action: string;
  }>;
  for (const inc of incidents) {
    const voice = hasVoice(inc.description) || hasVoice(inc.immediate_action ?? "");
    record(inc.child_id, "incidents", inc.date, voice);
  }

  // ── 2. Daily Log ─────────────────────────────────────────────────────────
  const dailyLog = (store.dailyLog ?? []) as Array<{
    id: string; child_id: string; date: string; content: string;
  }>;
  for (const entry of dailyLog) {
    record(entry.child_id, "dailyLog", entry.date, hasVoice(entry.content));
  }

  // ── 3. Key Working Sessions ───────────────────────────────────────────────
  const keyWorkingSessions = (store.keyWorkingSessions ?? []) as Array<{
    id: string; child_id: string; date: string; child_voice: string;
  }>;
  for (const s of keyWorkingSessions) {
    record(s.child_id, "keyWorkingSessions", s.date, isSubstantiveVoice(s.child_voice ?? ""));
  }

  // ── 4. YP Feedback ────────────────────────────────────────────────────────
  const ypFeedback = (store.ypFeedback ?? []) as Array<{
    id: string; child_id: string; date: string; feedback: string; response_given_to_child: boolean;
  }>;
  for (const f of ypFeedback) {
    // YP feedback is inherently a voice record — score by quality of feedback captured
    record(f.child_id, "ypFeedback", f.date, f.feedback != null && f.feedback.trim().length > 10);
  }

  // ── 5. LAC Reviews ────────────────────────────────────────────────────────
  const lacReviews = (store.lacReviews ?? []) as Array<{
    id: string; child_id: string; date: string; child_participation: string; child_views: string;
  }>;
  for (const r of lacReviews) {
    const voice = r.child_participation !== "did_not_participate" && isSubstantiveVoice(r.child_views ?? "");
    record(r.child_id, "lacReviews", r.date, voice);
  }

  // ── Build per-type results ────────────────────────────────────────────────

  const TYPE_LABELS: Record<RecordType, string> = {
    incidents:          "Incidents",
    dailyLog:           "Daily Log",
    keyWorkingSessions: "Key Working",
    ypFeedback:         "YP Feedback",
    lacReviews:         "LAC Reviews",
  };

  const SUPERVISION_PROMPTS: Record<RecordType, string> = {
    incidents:
      "Incident records rarely mention how the child experienced the event. In supervision, ask: 'After incidents, do we go back and ask the young person what they were feeling — and do we write it down?'",
    dailyLog:
      "Daily logs describe observations but less often the child's own voice. Ask: 'If Jamie read this entry, would they recognise themselves in it — or would it feel written about them rather than with them?'",
    keyWorkingSessions:
      "Key working sessions have a dedicated child-voice field, but it's often left blank or completed minimally. Ask: 'What's getting in the way of capturing what the young person actually said or chose in these sessions?'",
    ypFeedback:
      "YP feedback collects voice well. Deepen: 'Are we giving young people enough different methods to share their views — not just a form?'",
    lacReviews:
      "Child participation in LAC reviews is tracked but child views aren't always fully recorded. Ask: 'Is the young person's perspective the first thing in the review record, or an afterthought?'",
  };

  function deriveTrend(recent: number, recentVoice: number, prior: number, priorVoice: number): VoiceTrend {
    if (recent === 0 || prior === 0) return "stable";
    const recentRate = recentVoice / recent;
    const priorRate  = priorVoice / prior;
    if (recentRate > priorRate + 0.05) return "improving";
    if (recentRate < priorRate - 0.05) return "declining";
    return "stable";
  }

  const typeResults: RecordTypeStats[] = (Object.keys(typeStats) as RecordType[]).map((type) => {
    const t = typeStats[type];
    const presenceRate = t.total > 0 ? Math.round((t.withVoice / t.total) * 100) : null;
    const recentRate   = t.recent > 0 ? Math.round((t.recentVoice / t.recent) * 100) : null;
    const priorRate    = t.prior  > 0 ? Math.round((t.priorVoice  / t.prior)  * 100) : null;
    return {
      type,
      label: TYPE_LABELS[type],
      total: t.total,
      withVoice: t.withVoice,
      presenceRate,
      recentRate,
      priorRate,
      trend: deriveTrend(t.recent, t.recentVoice, t.prior, t.priorVoice),
      supervisionPrompt: SUPERVISION_PROMPTS[type],
    };
  });

  // ── Per-child profiles ────────────────────────────────────────────────────

  const youngPeople = (store.youngPeople ?? []) as Array<{
    id: string; full_name?: string; first_name?: string; last_name?: string;
  }>;

  function childName(id: string): string {
    const c = youngPeople.find((y) => y.id === id);
    if (!c) return id;
    if (c.full_name) return c.full_name;
    return `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim() || id;
  }

  const childProfiles: ChildVoiceProfile[] = youngPeople.map((yp) => {
    const cs = childMap.get(yp.id);
    if (!cs) {
      return {
        childId: yp.id, name: childName(yp.id),
        overallScore: null, totalRecords: 0, recordsWithVoice: 0,
        byType: {}, topGapType: null, topStrengthType: null, hasData: false,
      };
    }

    const totalRecords   = Object.values(cs.byType).reduce((s, v) => s + v.total, 0);
    const recordsWithVoice = Object.values(cs.byType).reduce((s, v) => s + v.withVoice, 0);
    const overallScore = totalRecords > 0 ? Math.round((recordsWithVoice / totalRecords) * 100) : null;

    const byType: ChildVoiceProfile["byType"] = {};
    for (const [type, stats] of Object.entries(cs.byType) as Array<[RecordType, { total: number; withVoice: number }]>) {
      byType[type] = { ...stats, rate: stats.total > 0 ? Math.round((stats.withVoice / stats.total) * 100) : null };
    }

    // Top gap: lowest rate type
    const typesWithData = (Object.entries(byType) as Array<[RecordType, { total: number; withVoice: number; rate: number | null }]>)
      .filter(([, v]) => v.total >= 2 && v.rate !== null);
    const topGapType    = typesWithData.sort((a, b) => (a[1].rate ?? 0) - (b[1].rate ?? 0))[0]?.[0] ?? null;
    const topStrengthType = typesWithData.sort((a, b) => (b[1].rate ?? 0) - (a[1].rate ?? 0))[0]?.[0] ?? null;

    return {
      childId: yp.id, name: childName(yp.id),
      overallScore, totalRecords, recordsWithVoice,
      byType, topGapType, topStrengthType, hasData: totalRecords > 0,
    };
  });

  // ── Team summary ──────────────────────────────────────────────────────────

  const allRates = typeResults.filter((t) => t.presenceRate !== null);
  const worstType  = allRates.sort((a, b) => (a.presenceRate ?? 0) - (b.presenceRate ?? 0))[0] ?? null;
  const bestType   = allRates.sort((a, b) => (b.presenceRate ?? 0) - (a.presenceRate ?? 0))[0] ?? null;
  const totalRecords = typeResults.reduce((s, t) => s + t.total, 0);
  const totalWithVoice = typeResults.reduce((s, t) => s + t.withVoice, 0);
  const overallPresenceRate = totalRecords > 0 ? Math.round((totalWithVoice / totalRecords) * 100) : null;
  const childrenWithData = childProfiles.filter((c) => c.hasData).length;
  const lacParticipationRate = lacReviews.length > 0
    ? Math.round((lacReviews.filter((r) => r.child_participation !== "did_not_participate").length / lacReviews.length) * 100)
    : null;

  return NextResponse.json({
    data: {
      typeStats: typeResults,
      childProfiles,
      summary: {
        overallPresenceRate,
        totalRecords,
        totalWithVoice,
        childrenWithData,
        worstType: worstType ? { type: worstType.type, label: worstType.label, rate: worstType.presenceRate } : null,
        bestType:  bestType  ? { type: bestType.type,  label: bestType.label,  rate: bestType.presenceRate  } : null,
        lacParticipationRate,
      },
    },
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// CARA — KEY WORKER EFFECTIVENESS INTELLIGENCE
// GET /api/v1/key-worker-effectiveness-intelligence
//
// A management-support view of each key worker's relational effectiveness
// with their assigned key children. Tracks session frequency, child voice
// quality, mood change, follow-up completion, and therapeutic approach rate.
//
// This is NOT a performance-management tool. It is a safeguarding and
// support instrument: a low-performing score prompts a supportive
// supervision conversation, not a disciplinary process.
//
// "The quality of the key worker relationship is the single most
//  significant protective factor in a child's residential placement."
// — DfE Children's Home Guidance; DDP Practice Principles
//
// All deterministic. No LLM calls.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { below, formatRate, meanOf, meets, rateOf } from "@/lib/metrics/rate";

// ── Types ─────────────────────────────────────────────────────────────────────

type EffectivenessSignal = "exemplary" | "strong" | "developing" | "needs_support";

interface KeyChildSnapshot {
  childId: string;
  childName: string;
  sessionsLast30d: number;
  daysSinceLastSession: number | null;
  notSeenIn30d: boolean;
}

interface StaffKeyWorkerProfile {
  staffId: string;
  staffName: string;
  jobTitle: string;
  keyChildCount: number;
  keyChildren: KeyChildSnapshot[];
  totalSessionsLast30d: number;
  avgSessionsPerKeyChildLast30d: number;
  // Each rate is null when its population is empty — no sessions, no follow-ups
  // agreed, no behaviour entries. Nothing recorded is not the same as done well.
  childVoiceScore: number | null;         // 0–100: richness of child_voice across sessions
  childVoicePresenceRate: number | null;  // 0–100: % sessions with non-trivial child_voice
  moodImprovementRate: number | null;     // 0–100: % sessions with mood_after > mood_before
  followUpCompletionRate: number | null;  // 0–100: % completed follow-ups
  therapeuticApproachRate: number | null; // 0–100: % behaviour entries using therapeutic language
  keyChildrenNotSeen: number;
  effectivenessSignal: EffectivenessSignal;
  supervisionPrompt: string;
}

interface KeyWorkerEffectivenessSummary {
  totalKeyWorkers: number;
  exemplary: number;
  strong: number;
  developing: number;
  needs_support: number;
  keyChildrenNotSeenIn30d: number;
  homeFollowUpCompletionRate: number | null;
  homeChildVoicePresenceRate: number | null;
  managerNote: string;
}

// ── Therapeutic phrase classifier (mirrors team-approach-consistency) ─────────

const THERAPEUTIC_PHRASES = [
  "calm", "de-escalat", "co-regulat", "pace", "empathy", "empathetic",
  "grounding", "regulation", "self-regulation", "therapeutic", "reflect",
  "curiosity", "curiosity-led", "acceptance", "playful", "nurture",
  "warm", "attune", "connection", "relational", "reassur", "validate",
  "contain", "safe", "trust", "repair",
];

function isTherapeutic(strategy: string): boolean {
  if (!strategy) return false;
  const lower = strategy.toLowerCase();
  return THERAPEUTIC_PHRASES.some((p) => lower.includes(p));
}

// ── Child voice richness score (0–100) ────────────────────────────────────────

function childVoiceRichness(text: string): number {
  if (!text || text.trim().length < 5) return 0;
  const len = text.trim().length;
  if (len >= 100) return 100;
  if (len >= 50) return 70;
  if (len >= 20) return 40;
  return 15;
}

// ── Effectiveness signal ──────────────────────────────────────────────────────

function effectivenessSignal(
  keyChildCount: number,
  keyChildrenNotSeen: number,
  followUpCompletion: number | null,
  childVoicePresence: number | null,
  moodImprovement: number | null,
): EffectivenessSignal {
  if (keyChildCount === 0) return "developing";

  const allSeen = keyChildrenNotSeen === 0;
  const goodFollowUp = meets(followUpCompletion, 75);
  const goodVoice = meets(childVoicePresence, 60);
  const goodMood = meets(moodImprovement, 50);

  const strengths = [allSeen, goodFollowUp, goodVoice, goodMood].filter(Boolean).length;

  if (strengths === 4) return "exemplary";
  if (strengths >= 3) return "strong";
  if (strengths >= 1 && !allSeen) return "needs_support";
  if (strengths >= 1) return "developing";
  return "needs_support";
}

// ── Supervision prompt ────────────────────────────────────────────────────────

function buildSupervisionPrompt(
  name: string,
  signal: EffectivenessSignal,
  keyChildrenNotSeen: number,
  followUpRate: number | null,
  childVoiceRate: number | null,
  moodRate: number | null,
): string {
  if (signal === "exemplary") {
    return `${name} is showing exemplary key worker practice — regular contact, strong child voice, and excellent follow-through. In supervision, celebrate this and explore: what does ${name} do that creates this quality? What can the team learn from their approach?`;
  }
  if (keyChildrenNotSeen > 0) {
    return `${name} has ${keyChildrenNotSeen} key child${keyChildrenNotSeen > 1 ? "ren" : ""} not seen in the last 30 days. This is a safeguarding concern. In supervision, explore: what's the barrier? Is the relationship struggling, or are there practical reasons? A key worker who isn't connecting with a key child needs immediate support.`;
  }
  if (below(followUpRate, 50)) {
    return `${name}'s follow-up completion rate is low (${formatRate(followUpRate)}). Agreed actions in key work sessions are commitments to the child. Explore in supervision: are sessions too aspirational? Does ${name} need help prioritising, or is there a capacity issue to address?`;
  }
  if (below(childVoiceRate, 40)) {
    return `Child voice is underdeveloped in ${name}'s key work sessions. In supervision, explore what the children are saying, and support ${name} to record it more richly — the child's own words are evidence of their experience and rights in care.`;
  }
  if (below(moodRate, 30)) {
    return `Mood scores in ${name}'s sessions suggest children are not consistently feeling better after key work. Explore in supervision: what's the tone of the sessions? Does the child feel they have a genuine say, or is key work feeling transactional?`;
  }
  return `${name}'s key worker practice is developing. In supervision, review their recent sessions together and explore what would help build their confidence and consistency with their key children.`;
}

// ── Route ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const store = getStore();
  const now = new Date();
  const cutoff30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const staff = (store.staff ?? []) as Array<{
    id: string; first_name: string; last_name: string; full_name: string;
    job_title: string; employment_status: string;
  }>;

  const youngPeople = (store.youngPeople ?? []) as Array<{
    id: string; first_name: string; last_name: string;
    key_worker_id: string | null; status: string;
  }>;

  const sessions = (store.keyWorkingSessions ?? []) as Array<{
    id: string; child_id: string; staff_id: string; date: string;
    child_voice: string; mood_before: number; mood_after: number;
    follow_up: string; follow_up_completed: boolean;
    actions_agreed: string[];
  }>;

  const behaviourLog = (store.behaviourLog ?? []) as Array<{
    id: string; child_id: string; recorded_by: string; strategy_used: string; date: string;
  }>;

  // Active staff only
  const activeStaff = staff.filter((s) => s.employment_status === "active");

  // Current children
  const currentChildren = youngPeople.filter((yp) => yp.status === "current");

  // Index sessions by staff
  const sessionsByStaff = new Map<string, typeof sessions>();
  for (const sess of sessions) {
    const arr = sessionsByStaff.get(sess.staff_id) ?? [];
    arr.push(sess);
    sessionsByStaff.set(sess.staff_id, arr);
  }

  // Index behaviour log entries by staff
  const behaviourByStaff = new Map<string, typeof behaviourLog>();
  for (const entry of behaviourLog) {
    const arr = behaviourByStaff.get(entry.recorded_by) ?? [];
    arr.push(entry);
    behaviourByStaff.set(entry.recorded_by, arr);
  }

  // Build per-staff profiles — only for staff who are key workers for ≥1 current child
  const staffProfiles: StaffKeyWorkerProfile[] = [];

  for (const member of activeStaff) {
    const keyChildren = currentChildren.filter((yp) => yp.key_worker_id === member.id);
    if (keyChildren.length === 0) continue;

    const staffSessions = sessionsByStaff.get(member.id) ?? [];
    const sessions30d = staffSessions.filter((s) => new Date(s.date) >= cutoff30d);

    // Per-key-child snapshots
    const keyChildSnapshots: KeyChildSnapshot[] = keyChildren.map((yp) => {
      const childSessions30d = sessions30d.filter((s) => s.child_id === yp.id);
      const allChildSessions = staffSessions.filter((s) => s.child_id === yp.id);

      const lastSession = allChildSessions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const daysSince = lastSession
        ? Math.floor((now.getTime() - new Date(lastSession.date).getTime()) / (24 * 60 * 60 * 1000))
        : null;

      return {
        childId: yp.id,
        childName: `${yp.first_name} ${yp.last_name}`,
        sessionsLast30d: childSessions30d.length,
        daysSinceLastSession: daysSince,
        notSeenIn30d: childSessions30d.length === 0,
      };
    });

    const keyChildrenNotSeen = keyChildSnapshots.filter((c) => c.notSeenIn30d).length;

    // Child voice metrics — unmeasured when no sessions have been recorded
    const voiceScores = sessions30d.map((s) => childVoiceRichness(s.child_voice));
    const avgVoiceScore = meanOf(voiceScores);
    const voicePresenceRate = rateOf(voiceScores.filter((s) => s >= 15), sessions30d);

    // Mood improvement
    const moodSessions = sessions30d.filter((s) => s.mood_before != null && s.mood_after != null);
    const moodImprovementRate = rateOf(
      moodSessions.filter((s) => s.mood_after > s.mood_before), moodSessions,
    );

    // Follow-up completion (all sessions, not just 30d — represents track record).
    // No follow-ups agreed is nothing applicable, so there is no track record to
    // report either way.
    const sessionsWithFollowUp = staffSessions.filter((s) => s.follow_up && s.follow_up.trim().length > 0);
    const followUpCompletionRate = rateOf(
      sessionsWithFollowUp.filter((s) => s.follow_up_completed), sessionsWithFollowUp,
    );

    // Therapeutic approach rate in behaviour log
    const behaviourEntries = behaviourByStaff.get(member.id) ?? [];
    const entriesWithStrategy = behaviourEntries.filter((e) => e.strategy_used && e.strategy_used.trim().length > 0);
    const therapeuticApproachRate = rateOf(
      entriesWithStrategy.filter((e) => isTherapeutic(e.strategy_used)), entriesWithStrategy,
    );

    const signal = effectivenessSignal(
      keyChildren.length, keyChildrenNotSeen, followUpCompletionRate, voicePresenceRate, moodImprovementRate,
    );

    staffProfiles.push({
      staffId: member.id,
      staffName: member.full_name || `${member.first_name} ${member.last_name}`,
      jobTitle: member.job_title,
      keyChildCount: keyChildren.length,
      keyChildren: keyChildSnapshots,
      totalSessionsLast30d: sessions30d.length,
      avgSessionsPerKeyChildLast30d: keyChildren.length > 0
        ? Math.round((sessions30d.length / keyChildren.length) * 10) / 10
        : 0,
      childVoiceScore: avgVoiceScore,
      childVoicePresenceRate: voicePresenceRate,
      moodImprovementRate,
      followUpCompletionRate,
      therapeuticApproachRate,
      keyChildrenNotSeen,
      effectivenessSignal: signal,
      supervisionPrompt: buildSupervisionPrompt(
        member.first_name, signal, keyChildrenNotSeen,
        followUpCompletionRate, voicePresenceRate, moodImprovementRate,
      ),
    });
  }

  // Sort: needs_support → developing → strong → exemplary
  const SIGNAL_ORDER: Record<EffectivenessSignal, number> = {
    needs_support: 0, developing: 1, strong: 2, exemplary: 3,
  };
  staffProfiles.sort((a, b) => SIGNAL_ORDER[a.effectivenessSignal] - SIGNAL_ORDER[b.effectivenessSignal]);

  // ── Summary ────────────────────────────────────────────────────────────────

  const allKeyChildrenNotSeen = staffProfiles.reduce((s, p) => s + p.keyChildrenNotSeen, 0);

  const totalSessionsWithFollowUp = sessions.filter((s) => s.follow_up && s.follow_up.trim().length > 0);
  const homeFollowUpRate = rateOf(
    totalSessionsWithFollowUp.filter((s) => s.follow_up_completed), totalSessionsWithFollowUp,
  );

  const sessions30dAll = sessions.filter((s) => new Date(s.date) >= cutoff30d);
  const allVoiceScores = sessions30dAll.map((s) => childVoiceRichness(s.child_voice));
  const homeVoicePresenceRate = rateOf(allVoiceScores.filter((v) => v >= 15), sessions30dAll);

  const signalCounts = staffProfiles.reduce(
    (acc, p) => { acc[p.effectivenessSignal]++; return acc; },
    { exemplary: 0, strong: 0, developing: 0, needs_support: 0 } as Record<EffectivenessSignal, number>,
  );

  const managerNote =
    staffProfiles.length === 0
      ? "No current child has an allocated key worker on record. Key worker effectiveness cannot be assessed until allocations are recorded — this is itself the finding."
      : allKeyChildrenNotSeen > 0
      ? `${allKeyChildrenNotSeen} key child${allKeyChildrenNotSeen > 1 ? "ren" : ""} have not had a key work session in 30 days. This is a safeguarding and relational safety concern — review immediately in supervision.`
      : signalCounts.needs_support > 0
      ? `${signalCounts.needs_support} key worker${signalCounts.needs_support > 1 ? "s" : ""} may need supervision support. Review their session patterns this week.`
      : signalCounts.exemplary + signalCounts.strong >= staffProfiles.length - 1
      ? `Key worker practice is strong across the home. ${formatRate(homeVoicePresenceRate)} of sessions have meaningful child voice documented.`
      : `Key worker practice is developing. Focus supervision on child voice quality and follow-up completion (currently ${formatRate(homeFollowUpRate)}).`;

  const summary: KeyWorkerEffectivenessSummary = {
    totalKeyWorkers: staffProfiles.length,
    ...signalCounts,
    keyChildrenNotSeenIn30d: allKeyChildrenNotSeen,
    homeFollowUpCompletionRate: homeFollowUpRate,
    homeChildVoicePresenceRate: homeVoicePresenceRate,
    managerNote,
  };

  return NextResponse.json({ data: { staffProfiles, summary } });
}

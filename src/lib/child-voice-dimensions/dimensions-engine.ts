// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD VOICE INTELLIGENCE: DIMENSIONS & TRENDS (pure engine)
//
// computeChildVoiceDimensions(input) reads a child's voice-bearing records over a
// sliding window and reports, per dimension:
//   • a score (0–100) or null when there isn't enough to score honestly,
//   • a trend (recent half vs prior half of the window),
//   • a plain, child-safe note,
//   • the records it drew on.
// Then cross-dimension HIGHLIGHT rules surface the things a manager should act on
// — above all the honest dissonance "we record the voice but the child says they
// aren't heard". No model calls, no store access, no wall-clock.
// ══════════════════════════════════════════════════════════════════════════════

import {
  VOICE_DIMENSIONS_VERSION,
  type ChildVoiceDimensionInput,
  type ChildVoiceDimensionProfile,
  type VoiceDimension,
  type VoiceDimensionKey,
  type VoiceEvidenceRef,
  type VoiceHighlight,
  type VoiceTrend,
} from "./types";

const REGULATORY_LINKS = [
  "UN Convention on the Rights of the Child, Article 12 — the child's right to be heard and taken seriously.",
  "Children's Homes (England) Regulations 2015, Reg 7 — understanding and acting on the child's wishes and feelings.",
  "Ofsted SCCIF — how well the home listens to children and acts on what they say.",
];

// ── Small pure helpers ────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round((db - da) / 86_400_000);
}

const nonEmpty = (s?: string | null): boolean => !!s && s.trim().length > 0;

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

/** Map the child's expressed sentiment word to a 1–5 score, or null. */
function sentimentScore(s: string): number | null {
  switch (s) {
    case "very_unhappy":
      return 1;
    case "unhappy":
      return 2;
    case "ok":
      return 3;
    case "happy":
      return 4;
    case "very_happy":
      return 5;
    default:
      return null;
  }
}

/** A 0–100 score back to a plain, non-clinical word for a note. */
function scoreWord(score: number): string {
  if (score >= 80) return "very positive";
  if (score >= 60) return "mostly positive";
  if (score >= 45) return "mixed";
  if (score >= 25) return "mostly unhappy";
  return "very unhappy";
}

/**
 * Split records into the recent half and the prior half of the window.
 * recent = [asOf-half, asOf]; prior = [asOf-window, asOf-half).
 */
function windowSplit<T>(
  items: T[],
  dateOf: (t: T) => string,
  asOf: string,
  windowDays: number,
): { recent: T[]; prior: T[]; all: T[] } {
  const half = windowDays / 2;
  const all: T[] = [];
  const recent: T[] = [];
  const prior: T[] = [];
  for (const it of items) {
    const d = dateOf(it);
    if (!nonEmpty(d)) continue;
    const age = daysBetween(d, asOf);
    if (age < 0 || age > windowDays) continue; // outside the window (or future-dated)
    all.push(it);
    if (age <= half) recent.push(it);
    else prior.push(it);
  }
  return { recent, prior, all };
}

/** Trend from two averaged halves (higher = better for every voice dimension). */
function trendFromAverages(
  recentAvg: number | null,
  priorAvg: number | null,
  recentN: number,
  priorN: number,
  delta = 10,
): VoiceTrend {
  if (recentAvg === null || priorAvg === null || recentN < 2 || priorN < 2) return "insufficient_data";
  const diff = recentAvg - priorAvg;
  if (diff >= delta) return "improving";
  if (diff <= -delta) return "declining";
  return "steady";
}

/** Trend from two counts (more recent activity = improving). */
function trendFromCounts(recentN: number, priorN: number): VoiceTrend {
  if (recentN === 0 && priorN === 0) return "insufficient_data";
  if (recentN > priorN) return "improving";
  if (recentN < priorN) return "declining";
  return "steady";
}

// ── Child-expressed dimension (from the child's OWN sentiment) ────────────────

function buildExpressedDimension(
  key: VoiceDimensionKey,
  label: string,
  childName: string,
  entries: ChildVoiceDimensionInput["feedback"],
  asOf: string,
  windowDays: number,
): VoiceDimension {
  const { recent, prior, all } = windowSplit(entries, (e) => e.date, asOf, windowDays);
  const scored = all.map((e) => ({ e, s: sentimentScore(e.sentiment) })).filter((x) => x.s !== null) as Array<{
    e: ChildVoiceDimensionInput["feedback"][number];
    s: number;
  }>;

  const sources: VoiceEvidenceRef[] = scored.map((x) => ({ recordType: "ypFeedback", recordId: x.e.id }));

  if (scored.length === 0) {
    return {
      key,
      label,
      kind: "child_expressed",
      score: null,
      status: "not_asked",
      trend: "insufficient_data",
      recentCount: recent.length,
      priorCount: prior.length,
      note: `${childName} hasn't shared a view on ${label.toLowerCase()} in the last ${windowDays} days — worth asking directly.`,
      sources,
    };
  }

  // 1–5 → 0–100
  const to100 = (s: number) => ((s - 1) / 4) * 100;
  const recentAvg = avg(
    scored.filter((x) => daysBetween(x.e.date, asOf) <= windowDays / 2).map((x) => to100(x.s)),
  );
  const priorAvg = avg(
    scored.filter((x) => daysBetween(x.e.date, asOf) > windowDays / 2).map((x) => to100(x.s)),
  );
  const recentN = scored.filter((x) => daysBetween(x.e.date, asOf) <= windowDays / 2).length;
  const priorN = scored.filter((x) => daysBetween(x.e.date, asOf) > windowDays / 2).length;
  const trend = trendFromAverages(recentAvg, priorAvg, recentN, priorN);

  // The headline score reflects how the child is expressing themselves NOW —
  // the recent half when there's enough of it — so a recent crash isn't masked
  // by an older happy period. Falls back to the whole-window average otherwise.
  const overallAvg = to100(avg(scored.map((x) => x.s))!);
  const score = Math.round(recentN >= 2 && recentAvg !== null ? recentAvg : overallAvg);

  // A declining child voice always needs attention, whatever the average.
  const status =
    trend === "declining" ? "needs_attention" : score >= 65 ? "strong" : score >= 45 ? "developing" : "needs_attention";
  const note =
    `Across ${scored.length} record(s) in the last ${windowDays} days, ${childName} has expressed a ${scoreWord(
      score,
    )} view on ${label.toLowerCase()}` +
    (trend === "declining"
      ? " — and it has been getting more negative. Follow this up."
      : trend === "improving"
        ? " — and it has been improving."
        : ".");

  return {
    key,
    label,
    kind: "child_expressed",
    score,
    status,
    trend,
    recentCount: recentN,
    priorCount: priorN,
    note,
    sources,
  };
}

// ── The engine ────────────────────────────────────────────────────────────────

export function computeChildVoiceDimensions(input: ChildVoiceDimensionInput): ChildVoiceDimensionProfile {
  const windowDays = input.windowDays ?? 90;
  const { childName, asOf } = input;

  const feedback = input.feedback.filter((f) => f.child_id === input.childId);
  const keyWork = input.keyWork.filter((k) => k.child_id === input.childId);
  const lacReviews = input.lacReviews.filter((l) => l.child_id === input.childId);
  const feedbackLoops = input.feedbackLoops.filter((f) => f.child_id === input.childId);
  const advocacy = input.advocacy.filter((a) => a.child_id === input.childId);
  // input.houseMeetings is home-wide (not attributable to one child) — kept in
  // the input shape for a future home-level view, but intentionally not read
  // into any per-child dimension here.

  const dimensions: VoiceDimension[] = [];

  // ── child_expressed: feeling safe, feeling listened to, overall sentiment ──
  dimensions.push(
    buildExpressedDimension(
      "feeling_safe",
      "Feeling safe",
      childName,
      feedback.filter((f) => f.category === "feeling_safe"),
      asOf,
      windowDays,
    ),
  );
  dimensions.push(
    buildExpressedDimension(
      "feeling_listened_to",
      "Feeling listened to",
      childName,
      feedback.filter((f) => f.category === "being_listened_to"),
      asOf,
      windowDays,
    ),
  );
  dimensions.push(
    buildExpressedDimension("expressed_sentiment", "Overall expressed feeling", childName, feedback, asOf, windowDays),
  );

  // ── practice: voice captured (breadth × frequency) ────────────────────────
  const kwWindow = windowSplit(
    keyWork.filter((k) => nonEmpty(k.child_voice)),
    (k) => k.date,
    asOf,
    windowDays,
  );
  const lacWindow = windowSplit(
    lacReviews.filter((l) => l.child_participation !== "did_not_participate"),
    (l) => l.date,
    asOf,
    windowDays,
  );
  const loopWindow = windowSplit(
    feedbackLoops.filter((f) => nonEmpty(f.child_words)),
    (f) => f.feedback_date,
    asOf,
    windowDays,
  );
  const fbWindow = windowSplit(feedback, (f) => f.date, asOf, windowDays);
  const advVoiceWindow = windowSplit(
    advocacy.flatMap((a) => (a.visits ?? []).map((v) => ({ id: a.id, date: v.date ?? a.referral_date }))),
    (v) => v.date,
    asOf,
    windowDays,
  );
  // NOTE: home-wide house meetings are deliberately NOT credited to an
  // individual child's capture — we can't attribute a collective meeting to one
  // child, and doing so would mask a genuinely silent child (a false green).
  // The five attributable channels below are what count per child.

  const channels = [kwWindow, lacWindow, loopWindow, fbWindow, advVoiceWindow];
  const channelsActive = channels.filter((c) => c.all.length > 0).length; // 0–5
  const totalCaptures =
    kwWindow.all.length +
    lacWindow.all.length +
    loopWindow.all.length +
    fbWindow.all.length +
    advVoiceWindow.all.length;
  const recentCaptures =
    kwWindow.recent.length +
    lacWindow.recent.length +
    loopWindow.recent.length +
    fbWindow.recent.length +
    advVoiceWindow.recent.length;
  const priorCaptures = totalCaptures - recentCaptures;

  const captureSources: VoiceEvidenceRef[] = [
    ...kwWindow.all.map((k) => ({ recordType: "keyWorkingSessions", recordId: k.id })),
    ...lacWindow.all.map((l) => ({ recordType: "lacReviews", recordId: l.id })),
    ...loopWindow.all.map((f) => ({ recordType: "childFeedbackLoops", recordId: f.id })),
    ...fbWindow.all.map((f) => ({ recordType: "ypFeedback", recordId: f.id })),
    ...advVoiceWindow.all.map((v) => ({ recordType: "advocacyRecords", recordId: v.id })),
  ];
  const captureScore =
    totalCaptures === 0
      ? 0
      : Math.min(100, Math.round((channelsActive / 5) * 60 + (Math.min(totalCaptures, 8) / 8) * 40));
  dimensions.push({
    key: "voice_captured",
    label: "Voice captured",
    kind: "practice",
    score: captureScore,
    status: totalCaptures === 0 ? "needs_attention" : captureScore >= 65 ? "strong" : captureScore >= 35 ? "developing" : "needs_attention",
    trend: trendFromCounts(recentCaptures, priorCaptures),
    recentCount: recentCaptures,
    priorCount: priorCaptures,
    note:
      totalCaptures === 0
        ? `No voice was recorded for ${childName} in the last ${windowDays} days across key work, reviews, meetings, feedback or advocacy.`
        : `${childName}'s voice was recorded ${totalCaptures} time(s) across ${channelsActive} channel(s) in the last ${windowDays} days.`,
    sources: captureSources,
  });

  // ── practice: voice influence (loops closed + responses given) ────────────
  const loopOpps = loopWindow.all; // feedback-loop items with the child's words
  const loopsClosed = loopOpps.filter((f) => f.decision_made !== "pending_consideration");
  const fbOpps = fbWindow.all;
  const fbResponded = fbOpps.filter((f) => f.response_given_to_child);
  const influenceOpps = loopOpps.length + fbOpps.length;
  const influenceClosed = loopsClosed.length + fbResponded.length;
  const openLoops = loopOpps.length - loopsClosed.length;

  const recentClosedRate = (() => {
    const opps = loopWindow.recent.length + fbWindow.recent.length;
    if (opps === 0) return null;
    const closed =
      loopWindow.recent.filter((f) => f.decision_made !== "pending_consideration").length +
      fbWindow.recent.filter((f) => f.response_given_to_child).length;
    return (closed / opps) * 100;
  })();
  const priorClosedRate = (() => {
    const opps = loopWindow.prior.length + fbWindow.prior.length;
    if (opps === 0) return null;
    const closed =
      loopWindow.prior.filter((f) => f.decision_made !== "pending_consideration").length +
      fbWindow.prior.filter((f) => f.response_given_to_child).length;
    return (closed / opps) * 100;
  })();

  const influenceSources: VoiceEvidenceRef[] = [
    ...loopOpps.map((f) => ({ recordType: "childFeedbackLoops", recordId: f.id })),
    ...fbResponded.map((f) => ({ recordType: "ypFeedback", recordId: f.id })),
  ];
  dimensions.push({
    key: "voice_influence",
    label: "Voice acted on",
    kind: "practice",
    score: influenceOpps === 0 ? null : Math.round((influenceClosed / influenceOpps) * 100),
    status:
      influenceOpps === 0
        ? "insufficient_data"
        : influenceClosed / influenceOpps >= 0.7
          ? "strong"
          : influenceClosed / influenceOpps >= 0.4
            ? "developing"
            : "needs_attention",
    trend: trendFromAverages(
      recentClosedRate,
      priorClosedRate,
      loopWindow.recent.length + fbWindow.recent.length >= 2 ? 2 : 0,
      loopWindow.prior.length + fbWindow.prior.length >= 2 ? 2 : 0,
    ),
    recentCount: loopWindow.recent.length + fbWindow.recent.length,
    priorCount: loopWindow.prior.length + fbWindow.prior.length,
    note:
      influenceOpps === 0
        ? `No feedback from ${childName} has needed a response in the last ${windowDays} days.`
        : openLoops > 0
          ? `${influenceClosed} of ${influenceOpps} thing(s) ${childName} raised have had a response — ${openLoops} still open.`
          : `Every one of the ${influenceOpps} thing(s) ${childName} raised has had a response back to them.`,
    sources: influenceSources,
  });

  // ── practice: advocacy access ─────────────────────────────────────────────
  const activeAdvocacy = advocacy.filter((a) => a.status === "active" || a.status === "open" || a.status === "ongoing");
  const advVisitsInWindow = advVoiceWindow.all.length;
  const advSources: VoiceEvidenceRef[] = advocacy.map((a) => ({ recordType: "advocacyRecords", recordId: a.id }));
  dimensions.push({
    key: "advocacy_access",
    label: "Advocacy access",
    kind: "practice",
    score: advocacy.length === 0 ? 0 : activeAdvocacy.length > 0 ? Math.min(100, 60 + advVisitsInWindow * 20) : 30,
    status:
      advocacy.length === 0
        ? "needs_attention"
        : activeAdvocacy.length > 0 && advVisitsInWindow > 0
          ? "strong"
          : activeAdvocacy.length > 0
            ? "developing"
            : "needs_attention",
    trend: "insufficient_data",
    recentCount: advVisitsInWindow,
    priorCount: 0,
    note:
      advocacy.length === 0
        ? `No independent advocacy is on record for ${childName}.`
        : activeAdvocacy.length > 0
          ? `${childName} has independent advocacy in place${advVisitsInWindow > 0 ? ` with ${advVisitsInWindow} visit(s) in the last ${windowDays} days` : " (no recent visit recorded)"}.`
          : `${childName} has had advocacy in the past but nothing active is recorded now.`,
    sources: advSources,
  });

  // ── Highlights (cross-dimension, critical-friend, most severe first) ───────
  const dim = (k: VoiceDimensionKey) => dimensions.find((d) => d.key === k)!;
  const highlights: VoiceHighlight[] = [];

  const listened = dim("feeling_listened_to");
  const safe = dim("feeling_safe");
  const captured = dim("voice_captured");
  const influence = dim("voice_influence");
  const advocacyDim = dim("advocacy_access");

  // 1. The child's own words say they don't feel safe — highest priority.
  if (safe.score !== null && (safe.status === "needs_attention" || safe.trend === "declining")) {
    highlights.push({
      id: "safety_voice_concern",
      severity: "priority",
      title: `${childName} has told us something about feeling safe`,
      detail: `${safe.note} This is ${childName}'s own voice — have a direct conversation and review their safety plan alongside it.`,
      dimensions: ["feeling_safe"],
      sources: safe.sources,
    });
  }

  // 2. We record the voice but the child says they aren't heard — the dissonance.
  if (listened.score !== null && (listened.status === "needs_attention" || listened.trend === "declining") && captured.score !== null && captured.score >= 55) {
    highlights.push({
      id: "listened_to_gap",
      severity: "priority",
      title: `${childName}'s voice is recorded, but they don't feel heard`,
      detail: `Cara can see ${childName}'s voice is being captured (${captured.note.replace(/\.$/, "")}), yet ${childName} tells us they don't feel listened to. Recording a view isn't the same as acting on it — check what actually changed for them.`,
      dimensions: ["feeling_listened_to", "voice_captured"],
      sources: [...listened.sources, ...captured.sources].slice(0, 12),
    });
  }

  // 3. Voice captured but loops aren't closing.
  if (captured.score !== null && captured.score >= 50 && influence.status === "needs_attention") {
    highlights.push({
      id: "influence_gap",
      severity: "priority",
      title: `Feedback loops aren't closing for ${childName}`,
      detail: `${influence.note} When children don't hear back, they stop telling us things. Close the loop and let ${childName} see what changed.`,
      dimensions: ["voice_influence", "voice_captured"],
      sources: influence.sources,
    });
  }

  // 4. No voice recorded at all in-window.
  if (captured.recentCount === 0 && captured.priorCount === 0) {
    highlights.push({
      id: "silent_child",
      severity: "watch",
      title: `No voice recorded for ${childName}`,
      detail: `Nothing from ${childName} has been captured in the last ${windowDays} days across any channel. That is itself a finding — plan a key-work session or use their advocate.`,
      dimensions: ["voice_captured"],
      sources: [],
    });
  }

  // 5. Advocacy gap that matters — no advocacy AND another signal needs attention.
  const otherConcern = [listened, safe, influence].some((d) => d.status === "needs_attention");
  if (advocacyDim.status === "needs_attention" && advocacy.length === 0 && otherConcern) {
    highlights.push({
      id: "advocacy_gap",
      severity: "watch",
      title: `Consider independent advocacy for ${childName}`,
      detail: `No advocacy is on record for ${childName}, and other voice signals need attention. An independent advocate gives ${childName} a route that isn't the staff team.`,
      dimensions: ["advocacy_access"],
      sources: [],
    });
  }

  // 6. Strength — loops closing and the child feels more heard.
  if (influence.status === "strong" && (listened.status === "strong" || listened.trend === "improving")) {
    highlights.push({
      id: "loops_closing_strength",
      severity: "strength",
      title: `${childName} is being heard and it shows`,
      detail: `Feedback loops are closing for ${childName}, and they're telling us they feel more listened to. Keep making the "you said / we did" visible to them.`,
      dimensions: ["voice_influence", "feeling_listened_to"],
      sources: [...influence.sources, ...listened.sources].slice(0, 12),
    });
  }

  // 7. Strength — broad capture (only when nothing higher fired, to avoid noise).
  if (captured.status === "strong" && !highlights.some((h) => h.severity === "priority")) {
    highlights.push({
      id: "broad_capture_strength",
      severity: "strength",
      title: `${childName}'s voice is well evidenced`,
      detail: `${childName}'s voice is captured across ${channelsActive} channel(s) — a strong evidence base for reviews and inspection.`,
      dimensions: ["voice_captured"],
      sources: captured.sources.slice(0, 12),
    });
  }

  const severityRank = { priority: 0, watch: 1, strength: 2 } as const;
  highlights.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  // hasData reflects whether this child actually has voice records — not the
  // "absence-as-finding" zeros (a silent child scores 0 on capture, but that's
  // the finding, not data). House meetings are home-wide, so excluded here.
  const hasData = [feedback, keyWork, lacReviews, feedbackLoops, advocacy].some((arr) => arr.length > 0);

  return {
    childId: input.childId,
    childName,
    asOf,
    windowDays,
    dimensions,
    highlights,
    hasData,
    regulatoryLinks: REGULATORY_LINKS,
    disclaimer: `These signals show what the records reveal about how ${childName}'s voice is being heard and acted on. They do not measure how ${childName} feels inside — only ${childName} can tell you that. Use this to prompt a conversation, not to replace one.`,
    engineVersion: VOICE_DIMENSIONS_VERSION,
  };
}

export { VOICE_DIMENSIONS_VERSION };

// ─────────────────────────────────────────────────────────────────────────────
// Silent Struggle Engine (Practice Intelligence OS / doctrine 1.5, 2.2.2)
//
// The incident-driven engines notice children whose distress is loud. This one
// notices the OPPOSITE — the child going quiet. The doctrine's insight, encoded
// as the engine's core logic: "Withdrawn children generate fewer incidents and
// therefore less signal — Cara should notice the ABSENCE of signal." So a near-
// zero incident count paired with declining engagement is treated as MORE worth
// a look, not less.
//
// It reads existing daily logs (volume, mood, entry mix, language) and key-work
// mood. What it produces is never a label or a diagnosis — it is a gentle
// "worth a check-in" with the evidence, paired with PACE- and neurodiversity-
// aware ways in (some children genuinely cannot answer "how are you feeling?" —
// alexithymia is common — so the suggestions offer body-state, scales and
// choices alongside, never instead of, words).
//
// Absence of data is NOT withdrawal: a child with almost nothing recorded (a new
// placement) is "not enough to tell", never "concern". Silence is not evidence.
//
// Pure and deterministic: caller supplies `now`; no store, no AI.
// ─────────────────────────────────────────────────────────────────────────────

export interface SilentStruggleLogEntry {
  child_id: string;
  date: string;
  entry_type: string; // general | behaviour | mood | activity | contact | sleep | food | …
  content: string;
  mood_score: number | null;
}

export interface SilentStruggleInput {
  childId: string;
  childName: string;
  now: string;
  logs: SilentStruggleLogEntry[];
  /** Incident dates for this child — used to read the ABSENCE of loud signal. */
  incidentDates: string[];
  /** Optional key-work mood_after readings, newest-agnostic (date + score). */
  keyWorkMoods?: { date: string; score: number | null }[];
}

export type WithdrawalStatus = "settled" | "watch" | "concern" | "insufficient";

export interface WithdrawalSignal {
  key:
    | "log_volume_falling"
    | "mood_falling"
    | "engagement_narrowing"
    | "withdrawal_language"
    | "quiet_and_unseen";
  label: string;
  /** The numbers behind it — recent window vs prior window. */
  evidence: string;
}

export interface WithdrawalRead {
  childId: string;
  childName: string;
  status: WithdrawalStatus;
  statusReason: string;
  signals: WithdrawalSignal[];
  /** PACE / neurodiversity-aware ways in — practice response, not a verdict. */
  waysIn: string[];
  windowDays: number;
}

// Withdrawal-language markers. Word-boundary matched (mentionsAny) to avoid the
// substring false-positives this repo has been bitten by. Describes what was
// observed — never a judgement of the child.
const WITHDRAWAL_MARKERS = [
  "withdrawn", "kept to themselves", "kept to himself", "kept to herself",
  "stayed in their room", "stayed in his room", "stayed in her room",
  "in room all", "declined to join", "declined to come", "did not want to talk",
  "didn't want to talk", "isolated", "isolating", "quiet and", "very quiet",
  "unusually quiet", "flat affect", "low mood", "seemed low", "withdrew",
  "not engaging", "disengaged", "off their food", "not eating", "not sleeping",
  "no eye contact", "one word answers", "monosyllabic",
];

const DAY = 86_400_000;
const WINDOW = 21; // recent vs prior 21-day windows

function inWindow(now: number, iso: string, startDaysAgo: number, endDaysAgo: number): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  const age = (now - t) / DAY;
  return age >= endDaysAgo && age < startDaysAgo;
}

function mean(nums: number[]): number | null {
  const v = nums.filter((n) => Number.isFinite(n));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

// Local word-boundary check (keeps the engine dependency-free / pure).
function mentionsAny(text: string, words: string[]): boolean {
  const hay = text.toLowerCase();
  return words.some((w) => {
    const needle = w.toLowerCase();
    if (/\s/.test(needle)) return hay.includes(needle);
    return new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(hay);
  });
}

const ENGAGEMENT_TYPES = new Set(["activity", "contact", "education"]);

export function readSilentStruggle(input: SilentStruggleInput): WithdrawalRead {
  const now = Date.parse(input.now);
  const mine = input.logs.filter((l) => l.child_id === input.childId);

  const recent = mine.filter((l) => inWindow(now, l.date, WINDOW, 0));
  const prior = mine.filter((l) => inWindow(now, l.date, WINDOW * 2, WINDOW));

  // Too little recorded to reason about a change → say so, do not alarm.
  if (mine.length < 3 || (recent.length === 0 && prior.length === 0)) {
    return {
      childId: input.childId, childName: input.childName,
      status: "insufficient",
      statusReason: "Not enough recorded over the last six weeks to read a trend. This is a recording gap, not a finding about the child.",
      signals: [], waysIn: [], windowDays: WINDOW,
    };
  }

  const signals: WithdrawalSignal[] = [];

  // 1. Falling log volume — the child is being written about less, i.e. noticed
  //    less. Only meaningful once there WAS a baseline to fall from.
  if (prior.length >= 3 && recent.length < prior.length * 0.6) {
    signals.push({
      key: "log_volume_falling",
      label: "Being recorded about less often",
      evidence: `${recent.length} entries in the last ${WINDOW} days vs ${prior.length} in the ${WINDOW} before.`,
    });
  }

  // 2. Falling mood where recorded.
  const recentMood = mean(recent.map((l) => l.mood_score).filter((m): m is number => m !== null));
  const priorMood = mean(prior.map((l) => l.mood_score).filter((m): m is number => m !== null));
  if (recentMood !== null && priorMood !== null && recentMood <= priorMood - 1) {
    signals.push({
      key: "mood_falling",
      label: "Recorded mood is trending down",
      evidence: `Average mood ${recentMood.toFixed(1)} recently vs ${priorMood.toFixed(1)} before.`,
    });
  }

  // 3. Engagement narrowing — fewer activity/contact/education entries.
  const recentEng = recent.filter((l) => ENGAGEMENT_TYPES.has(l.entry_type)).length;
  const priorEng = prior.filter((l) => ENGAGEMENT_TYPES.has(l.entry_type)).length;
  if (priorEng >= 2 && recentEng < priorEng * 0.5) {
    signals.push({
      key: "engagement_narrowing",
      label: "Doing fewer of the things they used to",
      evidence: `${recentEng} activity / contact / education entries recently vs ${priorEng} before.`,
    });
  }

  // 4. Withdrawal language appearing in recent entries.
  const withdrawalEntries = recent.filter((l) => mentionsAny(l.content, WITHDRAWAL_MARKERS));
  if (withdrawalEntries.length >= 2) {
    signals.push({
      key: "withdrawal_language",
      label: "Staff are describing withdrawal",
      evidence: `${withdrawalEntries.length} recent entries describe quiet, withdrawn or disengaged presentation.`,
    });
  }

  // 5. THE core signal — quiet AND unseen. Near-zero incidents is usually read
  //    as "settled". Paired with any withdrawal signal it flips meaning: this is
  //    the child generating no alarm precisely because they have gone quiet.
  const recentIncidents = input.incidentDates.filter((d) => inWindow(now, d, WINDOW, 0)).length;
  const hasWithdrawalSignal = signals.length > 0;
  if (recentIncidents === 0 && hasWithdrawalSignal) {
    signals.push({
      key: "quiet_and_unseen",
      label: "Quiet — and easy to miss",
      evidence:
        "No incidents in the last " + WINDOW + " days, alongside the signs above. A child who has gone " +
        "quiet generates less signal, not less need — this is exactly the presentation that gets overlooked.",
    });
  }

  // Status: the quiet-and-unseen combination, or three signals, is a concern; one
  // or two signals is watch; none is settled.
  let status: WithdrawalStatus;
  let statusReason: string;
  const hasQuietUnseen = signals.some((s) => s.key === "quiet_and_unseen");
  if (hasQuietUnseen || signals.length >= 3) {
    status = "concern";
    statusReason = "Several signs point the same way, and this child is easy to overlook. Worth a gentle, unhurried check-in.";
  } else if (signals.length >= 1) {
    status = "watch";
    statusReason = "One or two early signs. Not alarming on its own — worth keeping a warm eye and noticing what helps.";
  } else {
    status = "settled";
    statusReason = "No withdrawal signals in the recorded picture over the last six weeks.";
  }

  // "insufficient" already returned early, so status is concern | watch | settled here.
  const waysIn = status === "settled" ? [] : [
    "Show up alongside without an agenda — presence before questions (PACE: acceptance, low pressure).",
    "If “how are you feeling?” draws a blank, try the body: “what does it feel like in your body today — tired, tight, heavy, fine?” Some young people genuinely can’t name feelings (alexithymia).",
    "Offer a way in that isn’t words: a 1–10 or colour scale, a shared activity, or “show me” rather than “tell me”.",
    "Make it easy to say nothing and come back — “no rush, I’m around later” keeps the door open.",
  ];

  return { childId: input.childId, childName: input.childName, status, statusReason, signals, waysIn, windowDays: WINDOW };
}

// ── Whole-home rollup — who is going quiet ────────────────────────────────────

export interface SilentStruggleOverview {
  reads: WithdrawalRead[];
  counts: { concern: number; watch: number; settled: number; insufficient: number };
  /** Concern + watch first — the children most worth a check-in surfaced up top. */
  needsAttention: WithdrawalRead[];
}

const RANK: Record<WithdrawalStatus, number> = { concern: 0, watch: 1, insufficient: 2, settled: 3 };

export function buildSilentStruggleOverview(reads: WithdrawalRead[]): SilentStruggleOverview {
  const sorted = [...reads].sort((a, b) => RANK[a.status] - RANK[b.status] || b.signals.length - a.signals.length);
  return {
    reads: sorted,
    counts: {
      concern: reads.filter((r) => r.status === "concern").length,
      watch: reads.filter((r) => r.status === "watch").length,
      settled: reads.filter((r) => r.status === "settled").length,
      insufficient: reads.filter((r) => r.status === "insufficient").length,
    },
    needsAttention: sorted.filter((r) => r.status === "concern" || r.status === "watch"),
  };
}

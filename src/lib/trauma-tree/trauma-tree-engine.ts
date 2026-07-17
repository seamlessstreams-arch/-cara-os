// ─────────────────────────────────────────────────────────────────────────────
// Root-Cause Formulation Engine — trauma tree logic (doctrine 2.2.8)
//
// "Distinguish leaves from roots… flag leaf-only patterns — repeated
// symptom-level responses with no root hypothesis on record — as a prompt for
// formulation review with clinical support. Also watch what feeds the tree:
// labelling language in records, and support that lapsed or never arrived."
//
// THE ONE RULE THAT DEFINES THIS ENGINE: CARA NEVER AUTHORS A ROOT.
//
// The roots of a trauma tree are a clinical formulation about a child's history
// — why this child, why now, what happened to them. That is a psychologist's
// work, done with the child, and a computer guessing at it would be amateur
// diagnosis of a traumatised young person. So this engine has no function that
// produces a hypothesis, no field to put one in, and nothing that could grow
// into one. Every root string it shows was typed by a human into a formulation
// record, and it is quoted, never generated. (PHILOSOPHY.md; Part 3.5: never
// clinical labels, diagnoses, or child-facing judgements.)
//
// What it CAN see is structural, and that turns out to be exactly what the
// doctrine asked for:
//   · are there leaves? (behaviours and incidents cluster)
//   · is there a root hypothesis ON RECORD at all? — leaf-only is the absence,
//     and absence is something you can check without understanding trauma;
//   · has anyone looked at the roots lately, and how much has grown since?
//   · what feeds the tree: labelling language, and support that lapsed or never
//     arrived.
//
// WHY THERE IS NO "YOUR FORMULATION DOESN'T MENTION THIS" DETECTION. The obvious
// next feature is to match current behaviours against the formulation's
// presenting_difficulties and flag drift. It is not built, deliberately: doing
// it deterministically means word-overlap on clinical free text, and a
// word-overlap heuristic making claims about a psychologist's formulation would
// be confidently wrong about the most sensitive document in the child's file.
// Instead Cara COUNTS what has happened since the roots were last looked at and
// asks whether the map still fits. Counting is honest; matching would not be.
//
// Pure and deterministic: caller supplies `now` and the records; no store; no AI.
// ─────────────────────────────────────────────────────────────────────────────

export type TreeFindingKey =
  | "leaf_only"
  | "roots_without_hypothesis"
  | "roots_unreviewed"
  | "leaves_since_roots"
  | "support_lapsed"
  | "support_never_arrived"
  | "labelling_feeding_the_tree"
  | "roots_tended";

export interface TreeFinding {
  key: TreeFindingKey;
  tone: "prompt" | "positive";
  headline: string;
  whyShown: string;
  /** Where more than one reading is honest, all of them ship. */
  readings: string[];
  question: string;
  /** Every id traces to a record a human wrote. */
  evidenceIds: string[];
  /** The doctrine asks for formulation review WITH CLINICAL SUPPORT — this says
   *  when that is what is being suggested, so it is never a lone-worker task. */
  needsClinicalSupport: boolean;
}

/** A presenting behaviour or incident — a leaf. */
export interface Leaf {
  id: string;
  child_id: string;
  date: string;
  kind: "behaviour" | "incident";
}

/** The roots, exactly as a human recorded them. Quoted, never generated. */
export interface RootsRecord {
  id: string;
  child_id: string;
  version: number;
  formulation_date: string;
  next_review_date: string | null;
  /** The root hypotheses. Cara reads this field; it never writes to it. */
  key_hypotheses: string[];
  presenting_difficulties: string[];
  agreed_interventions: string[];
  participants_attended: string[];
}

export interface SupportSession {
  id: string;
  child_id: string;
  date: string;
  attended: boolean;
  modality: string;
}

export interface LabellingSummary {
  childId: string;
  totalHits: number;
  mostAffectedCategory: string | null;
}

export interface ChildTree {
  childId: string;
  childName: string;
  /** Null when no formulation exists — the leaf-only case. */
  roots: {
    id: string;
    version: number;
    formulatedOn: string;
    daysOld: number;
    reviewDue: string | null;
    hypotheses: string[];
    interventions: string[];
    participants: string[];
  } | null;
  leaves: number;
  leavesSinceRoots: number;
  findings: TreeFinding[];
}

export interface TraumaTreeView {
  children: ChildTree[];
  /** Children Cara has too little on to say anything about. */
  tooLittleToSay: string[];
  summary: string;
  caveat: string;
}

export const TRAUMA_TREE_CAVEAT =
  "Cara does not work out why a child does what they do, and it never will — that thinking belongs to the child, the people who know them, and clinical colleagues. All it can see is whether that thinking is written down anywhere, when it was last looked at, and what has happened since. Everything below is a prompt to have the conversation, never a substitute for it.";

const DAY = 86_400_000;
const MIN_LEAVES = 3;

const daysBetween = (a: string, b: string): number =>
  Math.round((Date.parse(b) - Date.parse(a)) / DAY);

const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

export function buildTraumaTree(input: {
  children: readonly { id: string; name: string }[];
  leaves: readonly Leaf[];
  roots: readonly RootsRecord[];
  support: readonly SupportSession[];
  labelling: readonly LabellingSummary[];
  now: Date;
  windowDays?: number;
}): TraumaTreeView {
  const { children, leaves, roots, support, labelling, now } = input;
  const windowDays = input.windowDays ?? 90;
  const nowIso = now.toISOString().slice(0, 10);
  const since = new Date(now.getTime() - windowDays * DAY).toISOString().slice(0, 10);

  const trees: ChildTree[] = [];
  const tooLittleToSay: string[] = [];

  for (const child of children) {
    const myLeaves = leaves.filter((l) => l.date >= since && l.child_id === child.id);
    const myRootsAll = roots.filter((r) => r.child_id === child.id);
    // Latest version wins — a formulation is a living document, not a log.
    const myRoots = [...myRootsAll].sort(
      (a, b) => b.version - a.version || b.formulation_date.localeCompare(a.formulation_date),
    )[0];
    const mySupport = support.filter((s) => s.child_id === child.id);
    const myLabelling = labelling.find((l) => l.childId === child.id);

    const findings: TreeFinding[] = [];

    const leavesSinceRoots = myRoots
      ? leaves.filter((l) => l.child_id === child.id && l.date >= myRoots.formulation_date.slice(0, 10)).length
      : 0;

    // ── Not enough to say anything. Silence is not a finding.
    if (myLeaves.length < MIN_LEAVES && !myRoots) {
      tooLittleToSay.push(child.name);
      continue;
    }

    // ── THE DOCTRINE'S NAMED CASE: leaves, and no root hypothesis on record.
    if (myLeaves.length >= MIN_LEAVES && !myRoots) {
      findings.push({
        key: "leaf_only",
        tone: "prompt",
        headline: `${myLeaves.length} recorded responses in ${windowDays} days, and no formulation on record`,
        whyShown:
          "Cara can see the home responding, again and again, to what is happening. It cannot find anywhere that anyone has written down what the team thinks is underneath it.",
        readings: [
          "The thinking may well exist — in people's heads, in a meeting, in a document Cara cannot see. Absence here is absence from the record, not from the team.",
          "But a formulation that only lives in heads leaves with the people who hold it.",
        ],
        question: "Is it time to sit down with clinical colleagues and put the thinking on paper?",
        evidenceIds: myLeaves.map((l) => l.id).slice(0, 10),
        needsClinicalSupport: true,
      });
    }

    if (myRoots && myRoots.key_hypotheses.filter((h) => h.trim()).length === 0) {
      findings.push({
        key: "roots_without_hypothesis",
        tone: "prompt",
        headline: "There is a formulation, but no hypotheses recorded in it",
        whyShown:
          "The record describes what is happening. The part that says what the team thinks is underneath it is empty.",
        readings: ["It may have been discussed and not written down — which is the same problem in a different place."],
        question: "What did the team conclude, and who can add it with clinical support?",
        evidenceIds: [myRoots.id],
        needsClinicalSupport: true,
      });
    }

    if (myRoots) {
      const overdue = myRoots.next_review_date && myRoots.next_review_date.slice(0, 10) < nowIso;
      const noDate = !myRoots.next_review_date;
      if (overdue || noDate) {
        findings.push({
          key: "roots_unreviewed",
          tone: "prompt",
          headline: noDate
            ? "The formulation has no review date"
            : `The formulation's review was due ${Math.abs(daysBetween(myRoots.next_review_date!, nowIso))} days ago`,
          whyShown: noDate
            ? "Nothing says when the team will look at this thinking again. A formulation is a working hypothesis, and hypotheses go out of date."
            : "The date the team set for revisiting this has passed.",
          readings: ["It may have been reviewed in a meeting without the record being updated."],
          question: "When is the next formulation meeting, and who needs to be in it?",
          evidenceIds: [myRoots.id],
          needsClinicalSupport: true,
        });
      }

      // The honest proxy for drift: count what has grown since anyone last
      // looked at the roots. Cara counts; the team judges whether the map fits.
      if (leavesSinceRoots >= MIN_LEAVES) {
        const age = daysBetween(myRoots.formulation_date.slice(0, 10), nowIso);
        findings.push({
          key: "leaves_since_roots",
          tone: "prompt",
          headline: `${leavesSinceRoots} things recorded since the formulation was written ${age} days ago`,
          whyShown:
            "Cara has not read them against the formulation — it cannot, and would be guessing if it tried. It can only tell you how much has happened since anyone last looked at the roots.",
          readings: [
            "The formulation may hold all of this perfectly well.",
            "Or the child may have moved on from the map the team is working to.",
            "Only the people who know them can tell which.",
          ],
          question: "Read alongside the formulation, does it still describe this child?",
          evidenceIds: [myRoots.id],
          needsClinicalSupport: false,
        });
      }
    }

    // ── What feeds the tree, part 1: support that lapsed or never arrived.
    const attended = mySupport.filter((s) => s.attended).sort((a, b) => a.date.localeCompare(b.date));
    if (myRoots && myRoots.agreed_interventions.length > 0 && mySupport.length === 0) {
      findings.push({
        key: "support_never_arrived",
        tone: "prompt",
        headline: `${myRoots.agreed_interventions.length} intervention${myRoots.agreed_interventions.length === 1 ? "" : "s"} agreed, and no sessions on record`,
        whyShown:
          "The formulation records what was agreed. Cara can find no record of any of it happening yet.",
        readings: [
          "It may be waiting on a referral, a waiting list, or a service that has not come back.",
          "It may be happening and not being recorded here.",
        ],
        question: "Where is this stuck, and who is chasing it?",
        evidenceIds: [myRoots.id],
        needsClinicalSupport: false,
      });
    } else if (attended.length >= 2) {
      // Cadence is the CHILD'S OWN rhythm, not a fixed weekly assumption — a
      // fortnightly therapy is not "overdue" because a rule said weekly.
      const gaps: number[] = [];
      for (let i = 1; i < attended.length; i++) gaps.push(daysBetween(attended[i - 1].date, attended[i].date));
      const cadence = median(gaps);
      const last = attended[attended.length - 1];
      const silent = daysBetween(last.date, nowIso);
      if (cadence !== null && cadence > 0 && silent > cadence * 2) {
        findings.push({
          key: "support_lapsed",
          tone: "prompt",
          headline: `${silent} days since the last ${last.modality.replace(/_/g, " ")} session — about ${Math.round(silent / cadence)}× the usual gap`,
          whyShown: `Sessions had been running roughly every ${cadence} days. The last one Cara can see was ${last.date}.`,
          readings: [
            "It may have ended by agreement, or the work may be complete — Cara cannot see that from a log of sessions.",
            "It may have quietly stopped.",
          ],
          question: "Is this still running? If it has ended, is that written down anywhere?",
          evidenceIds: [last.id],
          needsClinicalSupport: false,
        });
      }
    }

    // ── What feeds the tree, part 2: labelling language. Reuses the
    // care-language audit's own count — one vocabulary, not two.
    if (myLabelling && myLabelling.totalHits > 0) {
      findings.push({
        key: "labelling_feeding_the_tree",
        tone: "prompt",
        headline: `${myLabelling.totalHits} piece${myLabelling.totalHits === 1 ? "" : "s"} of labelling language in this child's records`,
        whyShown:
          "How a child is written about becomes how they are seen, and then how they are treated. Language is one of the things that feeds the tree.",
        readings: [
          myLabelling.mostAffectedCategory
            ? `Most of it sits in one area: ${myLabelling.mostAffectedCategory.replace(/_/g, " ")}.`
            : "It is spread across the records.",
          "The Care Language Audit has the phrases and what to say instead.",
        ],
        question: "Worth a look together — would this child recognise themselves in their own file?",
        evidenceIds: [],
        needsClinicalSupport: false,
      });
    }

    // ── Catch people doing it right (2.2.6).
    const rootsHealthy =
      myRoots &&
      myRoots.key_hypotheses.some((h) => h.trim()) &&
      myRoots.next_review_date &&
      myRoots.next_review_date.slice(0, 10) >= nowIso;
    if (rootsHealthy && findings.every((f) => f.tone !== "prompt" || f.key === "leaves_since_roots")) {
      findings.push({
        key: "roots_tended",
        tone: "positive",
        headline: "The thinking about this child is written down, and there is a date to look at it again",
        whyShown: `Formulation v${myRoots.version} with ${myRoots.key_hypotheses.length} hypothes${myRoots.key_hypotheses.length === 1 ? "is" : "es"} on record, reviewed with ${myRoots.participants_attended.length} people, next review ${myRoots.next_review_date}.`,
        readings: [],
        question: "This is the hard part of the work, and it is being done.",
        evidenceIds: [myRoots.id],
        needsClinicalSupport: false,
      });
    }

    trees.push({
      childId: child.id,
      childName: child.name,
      roots: myRoots
        ? {
            id: myRoots.id,
            version: myRoots.version,
            formulatedOn: myRoots.formulation_date.slice(0, 10),
            daysOld: daysBetween(myRoots.formulation_date.slice(0, 10), nowIso),
            reviewDue: myRoots.next_review_date?.slice(0, 10) ?? null,
            // Quoted from the record. Cara wrote none of this.
            hypotheses: myRoots.key_hypotheses,
            interventions: myRoots.agreed_interventions,
            participants: myRoots.participants_attended,
          }
        : null,
      leaves: myLeaves.length,
      leavesSinceRoots,
      findings,
    });
  }

  const leafOnly = trees.filter((t) => t.findings.some((f) => f.key === "leaf_only")).length;
  const prompts = trees.reduce((n, t) => n + t.findings.filter((f) => f.tone === "prompt").length, 0);

  const summary =
    trees.length === 0
      ? "Nothing here yet — no child has enough on record for this view to say anything useful."
      : leafOnly > 0
        ? `${leafOnly} child${leafOnly === 1 ? "" : "ren"} where the home is responding and no formulation is on record${prompts > leafOnly ? `, and ${prompts - leafOnly} other thing${prompts - leafOnly === 1 ? "" : "s"} worth a look` : ""}.`
        : prompts > 0
          ? `${prompts} thing${prompts === 1 ? "" : "s"} worth a look across ${trees.length} child${trees.length === 1 ? "" : "ren"}. No leaf-only patterns — every child has thinking on record.`
          : `Every child here has a formulation on record with hypotheses and a review date.`;

  return { children: trees, tooLittleToSay, summary, caveat: TRAUMA_TREE_CAVEAT };
}

// ─────────────────────────────────────────────────────────────────────────────
// Professional Challenge Engine (Practice Intelligence OS §5.15 / doctrine 1.11)
//
// The OUTWARD counterpart to the whistleblowing engine (which is inward — staff
// raising concerns within their own organisation, PIDA 1998). This is for
// challenging ANOTHER agency's decision when it does not appear to protect the
// child: a referral declined, a case closed too soon, risk minimised, an agreed
// action not done, thresholds applied inconsistently.
//
// The doctrine's non-negotiable, encoded here: the measure of success is the
// CHILD'S SITUATION IMPROVING — not the challenge being sent. A challenge that
// was escalated, answered, and closed while the child's circumstances did not
// change is a FAILURE the engine surfaces, not a success it congratulates.
//
// The discipline of the challenge, also encoded: names, job titles, dates,
// everything followed up in writing. A communication with no written follow-up
// is a gap the engine flags.
//
// Pure and deterministic: caller supplies `now`; no store, no AI.
// ─────────────────────────────────────────────────────────────────────────────

// The escalation ladder, in order. Configurable ladders are a later concern;
// this is the statutory-guidance default (challenge the professional → their
// manager → joint challenge → IRO → the LA's formal resolution procedure →
// a professional helpline when stuck).
export const CHALLENGE_LADDER = [
  "professional",
  "their_manager",
  "joint_challenge",
  "iro",
  "formal_la_escalation",
  "helpline",
] as const;
export type ChallengeRung = (typeof CHALLENGE_LADDER)[number];

export const RUNG_LABEL: Record<ChallengeRung, string> = {
  professional: "Raised with the professional",
  their_manager: "Escalated to their manager",
  joint_challenge: "Joint challenge with other professionals",
  iro: "Involved the IRO",
  formal_la_escalation: "Formal LA resolution / escalation procedure",
  helpline: "Professional helpline",
};

export type ChallengeStatus =
  | "open"
  | "resolved_child_improved"
  | "resolved_no_change"
  | "withdrawn";

export interface ChallengeCommunication {
  id: string;
  at: string;
  rung: ChallengeRung;
  /** Names, job titles, dates — the discipline. */
  person_name: string;
  person_role: string;
  agency: string;
  method: "call" | "email" | "meeting" | "letter" | "other";
  summary: string;
  /** Everything is followed up in writing; false is a discipline gap. */
  written_followup: boolean;
}

export interface ProfessionalChallenge {
  id: string;
  child_id: string;
  home_id: string;

  // The decision being challenged.
  decision_challenged: string;
  decision_maker_name: string;
  decision_maker_role: string;
  agency: string;
  decision_date: string;

  // The concern.
  reason: string;
  evidence: string;
  /** LA thresholds document / statutory guidance the challenge rests on. */
  threshold_basis: string;
  current_risk: string;
  desired_resolution: string;

  // The ladder.
  current_rung: ChallengeRung;
  communications: ChallengeCommunication[];
  /** Formal escalation procedures are time-sensitive. */
  next_action_due: string | null;

  // The outcome — measured on the CHILD, not the challenge.
  status: ChallengeStatus;
  /** What actually changed for the child. Required to close as improved. */
  child_situation_outcome: string;
  closed_at: string | null;
  management_review: string;

  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export type ChallengeDetectionKey =
  | "response_overdue"
  | "stalled_escalate_further"
  | "resolved_but_child_no_better"
  | "communication_not_in_writing"
  | "resolved_child_improved";

export interface ChallengeDetection {
  key: ChallengeDetectionKey;
  tone: "prompt" | "positive";
  challengeId: string;
  childId: string;
  headline: string;
  whyShown: string;
  suggestedNextRung?: ChallengeRung;
  suggestedQuestions: string[];
}

export interface ChallengeSummary {
  challenges: (ProfessionalChallenge & {
    daysOpen: number;
    daysAtRung: number;
    nextRung: ChallengeRung | null;
  })[];
  detections: ChallengeDetection[];
  counts: { open: number; resolvedImproved: number; resolvedNoChange: number };
}

const DAY = 86_400_000;
const STALL_AT_RUNG_DAYS = 14;

function days(now: Date, iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.floor((now.getTime() - t) / DAY);
}

/** The rung after this one, or null at the top of the ladder. */
export function nextRung(rung: ChallengeRung): ChallengeRung | null {
  const i = CHALLENGE_LADDER.indexOf(rung);
  return i >= 0 && i < CHALLENGE_LADDER.length - 1 ? CHALLENGE_LADDER[i + 1] : null;
}

/** When the current rung last changed — the latest communication at that rung,
 *  else the challenge's creation. */
function rungSince(c: ProfessionalChallenge): string {
  const atRung = c.communications.filter((m) => m.rung === c.current_rung);
  return atRung.length ? atRung[atRung.length - 1].at : c.created_at;
}

export function summariseProfessionalChallenges(
  challenges: ProfessionalChallenge[],
  now: Date,
): ChallengeSummary {
  const enriched = challenges.map((c) => ({
    ...c,
    daysOpen: days(now, c.created_at) ?? 0,
    daysAtRung: days(now, rungSince(c)) ?? 0,
    nextRung: nextRung(c.current_rung),
  }));

  const detections: ChallengeDetection[] = [];

  for (const c of enriched) {
    if (c.status === "open") {
      const overdue = c.next_action_due !== null && (days(now, c.next_action_due) ?? -1) > 0;
      if (overdue) {
        detections.push({
          key: "response_overdue",
          tone: "prompt",
          challengeId: c.id,
          childId: c.child_id,
          headline: `Response overdue: "${c.decision_challenged}"`,
          whyShown:
            `The next action was due ${c.next_action_due} and the challenge is still open at ` +
            `"${RUNG_LABEL[c.current_rung]}". Formal escalation procedures are time-sensitive; ` +
            `advocacy does not stop at the front door.`,
          suggestedNextRung: c.nextRung ?? undefined,
          suggestedQuestions: [
            "Has the agency been chased, in writing?",
            c.nextRung ? `Is it time to move to: ${RUNG_LABEL[c.nextRung]}?` : "Has every ladder rung been exhausted?",
          ],
        });
      } else if (c.daysAtRung > STALL_AT_RUNG_DAYS && c.nextRung) {
        detections.push({
          key: "stalled_escalate_further",
          tone: "prompt",
          challengeId: c.id,
          childId: c.child_id,
          headline: `No movement for ${c.daysAtRung} days — consider escalating further`,
          whyShown:
            `The challenge has sat at "${RUNG_LABEL[c.current_rung]}" for ${c.daysAtRung} days ` +
            `(threshold ${STALL_AT_RUNG_DAYS}). If the child is no safer, the ladder has a next rung.`,
          suggestedNextRung: c.nextRung,
          suggestedQuestions: [
            `Would ${RUNG_LABEL[c.nextRung]} move this forward?`,
            "Are there other professionals who share the concern for a joint challenge?",
          ],
        });
      }

      // Discipline gap: any communication with no written follow-up.
      const noWritten = c.communications.filter((m) => !m.written_followup);
      if (noWritten.length > 0) {
        detections.push({
          key: "communication_not_in_writing",
          tone: "prompt",
          challengeId: c.id,
          childId: c.child_id,
          headline: `${noWritten.length} challenge conversation(s) not yet followed up in writing`,
          whyShown:
            "The discipline of professional challenge is names, job titles, dates and a written record " +
            "of every communication. A verbal challenge with no written trail is hard to escalate on.",
          suggestedQuestions: ["Which conversations still need a confirming email or note?"],
        });
      }
    }

    // The doctrine's core alert: a challenge closed as answered but the child's
    // situation did not change is NOT a success.
    if (c.status === "resolved_no_change") {
      detections.push({
        key: "resolved_but_child_no_better",
        tone: "prompt",
        challengeId: c.id,
        childId: c.child_id,
        headline: `Challenge closed, but the child's situation did not improve`,
        whyShown:
          "The challenge ran its course and was answered, yet the child is no better off. The measure of " +
          "success is the child's situation improving — not the challenge being made. This is worth reopening " +
          "or taking higher, not filing as done.",
        suggestedNextRung: c.nextRung ?? undefined,
        suggestedQuestions: [
          "Is the original concern actually resolved for the child, or just closed on paper?",
          "Should this be reopened at a higher rung, or taken to the IRO / formal procedure?",
        ],
      });
    }

    if (c.status === "resolved_child_improved") {
      detections.push({
        key: "resolved_child_improved",
        tone: "positive",
        challengeId: c.id,
        childId: c.child_id,
        headline: `Challenge succeeded — the child's situation improved`,
        whyShown:
          `${c.child_situation_outcome || "The child's circumstances changed for the better."} ` +
          "Advocacy that changed the outcome, not just the paperwork — worth recording as learning.",
        suggestedQuestions: [],
      });
    }
  }

  return {
    challenges: enriched,
    detections,
    counts: {
      open: enriched.filter((c) => c.status === "open").length,
      resolvedImproved: enriched.filter((c) => c.status === "resolved_child_improved").length,
      resolvedNoChange: enriched.filter((c) => c.status === "resolved_no_change").length,
    },
  };
}

/** Guard for closing a challenge: closing as "improved" requires recording what
 *  actually changed for the child — otherwise the doctrine's measure is unmet.
 *  Returns the reason a close is invalid, or null to proceed. */
export function validateClose(status: ChallengeStatus, childSituationOutcome: string): string | null {
  if (status === "resolved_child_improved" && !childSituationOutcome.trim()) {
    return "To close as improved, record what actually changed for the child — the measure of success is the child, not the challenge.";
  }
  return null;
}

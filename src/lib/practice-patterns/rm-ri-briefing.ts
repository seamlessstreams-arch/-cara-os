// ══════════════════════════════════════════════════════════════════════════════
// CARA — RM→RI ONE-PAGE BRIEFING  (pure · deterministic)
//
// Practice-patterns brief B3 / pattern pp_rm_ri_briefing:
// A monthly registered-manager → responsible-individual briefing in FOUR blocks:
//   1. the home this month
//   2. risks needing challenge
//   3. decisions and resources needed (options, cost, consequence of delay)
//   4. the RI's response and follow-up
// It must close the two-way loop (capture the RI response), and record
// disagreement + the escalation taken. Test question it must answer:
// "could you show what was decided last month and what happened next?"
//
// The existing `ri_briefing` (cara-studio) generates blocks 1-3 one-directionally;
// the `professional-challenge-engine` records disagreement/escalation but pointed
// OUTWARD (other agencies). This is the structure + validator that joins them for
// the internal RM↔RI loop. Pure: no store, no AI, no imports.
// ══════════════════════════════════════════════════════════════════════════════

export interface HomeThisMonth {
  summary: string;
}

export interface RiskNeedingChallenge {
  description: string;
  challenge: string; // the challenge the RM is putting to the RI
}

export interface DecisionNeeded {
  ref: string;
  description: string;
  options: string[];
  cost?: string;
  consequenceOfDelay: string;
}

export type RiOutcome = "agreed" | "declined" | "deferred" | "amended";

export interface RiDecision {
  decisionRef: string; // links to a DecisionNeeded.ref
  outcome: RiOutcome;
  disagreement?: string | null; // where RM and RI disagreed
  escalation?: string | null; // the escalation taken where they disagreed
}

export interface FollowUp {
  decisionRef: string;
  whatHappened: string;
}

export interface RiResponse {
  respondedBy?: string | null; // the responsible individual
  respondedAt?: string | null;
  decisions: RiDecision[];
  followUp: FollowUp[];
}

export interface RmRiBriefing {
  homeRef: string;
  month: string;
  homeThisMonth: HomeThisMonth;
  risksNeedingChallenge: RiskNeedingChallenge[];
  decisionsNeeded: DecisionNeeded[];
  riResponse?: RiResponse | null; // block 4 — the two-way part
}

export type BriefingSeverity = "red" | "amber";

export interface BriefingFinding {
  severity: BriefingSeverity;
  code:
    | "no_ri_response"
    | "decision_without_ri_outcome"
    | "disagreement_without_escalation"
    | "decision_without_follow_up";
  message: string;
}

export interface BriefingValidation {
  complete: boolean; // true only when no red findings remain
  findings: BriefingFinding[];
}

/**
 * Validate that an RM→RI briefing closes the loop: every decision has an RI
 * outcome, every disagreement records its escalation, and every acted-on
 * decision has follow-up evidence of what happened next.
 */
export function validateRmRiBriefing(briefing: RmRiBriefing): BriefingValidation {
  const findings: BriefingFinding[] = [];
  const resp = briefing.riResponse;

  if (!resp || resp.decisions.length === 0) {
    findings.push({
      severity: "red",
      code: "no_ri_response",
      message:
        "No RI response captured — the briefing is one-directional. Record the RI's decision on each item and the follow-up (what happened next).",
    });
    // Without a response there is nothing further to check item-by-item.
    return { complete: false, findings };
  }

  const outcomeByRef = new Map(resp.decisions.map((d) => [d.decisionRef, d]));
  const followUpRefs = new Set(resp.followUp.map((f) => f.decisionRef));

  for (const d of briefing.decisionsNeeded) {
    const outcome = outcomeByRef.get(d.ref);
    if (!outcome) {
      findings.push({
        severity: "amber",
        code: "decision_without_ri_outcome",
        message: `Decision "${d.description}" has no recorded RI outcome.`,
      });
      continue;
    }
    // An acted-on decision needs evidence of what happened next.
    if ((outcome.outcome === "agreed" || outcome.outcome === "amended") && !followUpRefs.has(d.ref)) {
      findings.push({
        severity: "amber",
        code: "decision_without_follow_up",
        message: `Decision "${d.description}" was ${outcome.outcome} but has no follow-up recording what happened next.`,
      });
    }
  }

  // Any recorded disagreement MUST record the escalation taken.
  for (const dec of resp.decisions) {
    if (dec.disagreement && dec.disagreement.trim() && !(dec.escalation && dec.escalation.trim())) {
      findings.push({
        severity: "red",
        code: "disagreement_without_escalation",
        message: `A disagreement is recorded on decision "${dec.decisionRef}" but no escalation is recorded.`,
      });
    }
  }

  const complete = !findings.some((f) => f.severity === "red");
  return { complete, findings };
}

// ─────────────────────────────────────────────────────────────────────────────
// Shift Lifecycle Engine (doctrine 2.1.1, discipline from 1.7)
//
// The team leader's before/during/end-of-shift discipline, made checkable.
// Existing modules already score handovers (`handover`, `handover-communication
// -quality`) and model fatigue/coverage (`shift-intelligence`) — none of them
// walk a leader THROUGH a shift. This engine is that workflow; it does not
// re-score anything those engines own.
//
// TWO RULES DECIDE THE WHOLE DESIGN.
//
// 1. CARA ONLY COUNTS WHAT IT CAN ACTUALLY SEE.
//    Every derived check carries `visible` — does this home record this kind of
//    thing AT ALL? Handovers may be verbal, on paper, or in a book on the
//    office desk. If Cara has no record of them anywhere, "no handover for this
//    shift" is CARA'S BLINDNESS, NOT THE HOME'S FAILURE, and the check reads
//    "not visible to me" — never a red, never a blocker. Absence of a record is
//    only a finding where records of that kind demonstrably exist. Silence is
//    not evidence.
//
//    This matters most on day one. A newly provisioned home has no records of
//    anything; without this rule its first team leader would open Cara to a
//    wall of red for a shift they had just worked properly. The rule is proven
//    by the tests rather than by the demo seed — the demo does record handovers
//    and daily logs, so every check there is genuinely visible.
//
// 2. NOT EVERY PART OF THE DISCIPLINE SHOULD BE A CHECKBOX.
//    1.7 also asks a leader to lead by example, be visible, stay solution-
//    focused. Those are real practice and they are NOT in this checklist. A
//    tickbox for a stance produces a tick, not the stance — it manufactures the
//    empty compliance record this system exists to replace. Cara asks only
//    about concrete acts a person genuinely did (keys, medication, briefing) or
//    things it can evidence itself.
//
// THE SIGN-OFF GATE IS SOFT, BY DESIGN. A leader at the end of a thirteen-hour
// shift must always be able to go home. A hard block would either trap them or
// teach them to tick a lie — so sign-off is never refused. Where handover or
// records are outstanding it asks for a reason and records it. The override IS
// the record: "signed off with two logs outstanding, Priya picking them up"
// tells the manager and the next shift far more than a button that could not
// be pressed.
//
// SAFEGUARDING IS NEVER GATED. Nothing here delays, softens or blocks raising a
// concern, and no safeguarding check can ever hold up a sign-off (PHILOSOPHY.md).
//
// Pure and deterministic: caller supplies `now` and the evidence; no store
// import; no AI.
// ─────────────────────────────────────────────────────────────────────────────

/** Where in the shift a check belongs (doctrine 1.7's four groupings). */
export type LifecycleStage = "before" | "during" | "end" | "throughout";

/** Who can know the answer.
 *  - `evidenced`: Cara derives it from records it can read.
 *  - `attested`:  only the human who was there knows. Cara asks; it never infers. */
export type CheckKind = "evidenced" | "attested";

export type CheckStatus =
  | "confirmed" // evidence found, or the person attested it
  | "outstanding" // Cara can see the records AND can see this is genuinely not done
  | "not_visible" // Cara has no way to see this — an honest gap in Cara, not in the home
  | "awaiting"; // an attestation the person hasn't answered yet — NOT a failure

export interface LifecycleCheck {
  id: CheckId;
  stage: LifecycleStage;
  /** Practice language: an invitation, never an accusation (language covenant). */
  label: string;
  /** Why this matters — the doctrine line it comes from. */
  why: string;
  kind: CheckKind;
  /** Only handover and records may hold up a sign-off (doctrine 2.1.1). */
  blocksSignOff: boolean;
}

export type CheckId =
  | "handover_read"
  | "rota_appointments_reviewed"
  | "home_safe_prepared"
  | "medication_keys_equipment"
  | "children_needs_reviewed"
  | "team_briefed"
  | "records_current"
  | "handover_written"
  | "records_complete"
  | "outstanding_actions"
  | "home_ready_next_shift"
  | "team_debrief"
  | "safeguarding_prompt";

/** The discipline, in order. Each line traces to doctrine 1.7. */
export const LIFECYCLE_CHECKS: readonly LifecycleCheck[] = [
  {
    id: "handover_read",
    stage: "before",
    label: "Read the handover from the shift before",
    why: "You cannot hold the thread of a child's day if it breaks at the door.",
    kind: "evidenced",
    blocksSignOff: false,
  },
  {
    id: "rota_appointments_reviewed",
    stage: "before",
    label: "Looked over today's rota, appointments and activities",
    why: "A missed appointment is a missed promise to a child.",
    kind: "attested",
    blocksSignOff: false,
  },
  {
    id: "home_safe_prepared",
    stage: "before",
    label: "Walked the home — safe, clean, ready for the children",
    why: "The environment is the first thing a child reads when they walk in.",
    kind: "attested",
    blocksSignOff: false,
  },
  {
    id: "medication_keys_equipment",
    stage: "before",
    label: "Checked medication, keys, alarm codes and equipment",
    why: "These are the checks that only matter on the day they were missed.",
    kind: "attested",
    blocksSignOff: false,
  },
  {
    id: "children_needs_reviewed",
    stage: "before",
    label: "Refreshed yourself on each child's needs and strategies",
    why: "The plan only works if the adults on shift are holding the same one.",
    kind: "attested",
    blocksSignOff: false,
  },
  {
    id: "team_briefed",
    stage: "before",
    label: "Brought the team together and set out the shift",
    why: "Consistency between adults is what makes a home feel predictable.",
    kind: "attested",
    blocksSignOff: false,
  },
  {
    id: "records_current",
    stage: "during",
    label: "Recording as you go",
    why: "Written in the moment, it is a record. Written at 10pm, it is a memory.",
    kind: "evidenced",
    blocksSignOff: false,
  },
  {
    id: "outstanding_actions",
    stage: "throughout",
    label: "Actions picked up, or handed to someone by name",
    why: "Tasks allocated fairly and followed through — an action with no name is an action with no owner.",
    kind: "evidenced",
    blocksSignOff: false,
  },
  {
    id: "handover_written",
    stage: "end",
    label: "Handover ready for the next shift",
    why: "The next adult through the door inherits everything you know — or doesn't.",
    kind: "evidenced",
    blocksSignOff: true,
  },
  {
    id: "records_complete",
    stage: "end",
    label: "The day's records finished",
    why: "Records are the story of impact. Unwritten, the work still happened — but nobody can see it, least of all the child reading their file in ten years.",
    kind: "evidenced",
    blocksSignOff: true,
  },
  {
    id: "home_ready_next_shift",
    stage: "end",
    label: "Home left calm, organised and ready",
    why: "You are setting up someone else's shift, and the children's evening.",
    kind: "attested",
    blocksSignOff: false,
  },
  {
    id: "team_debrief",
    stage: "end",
    label: "Debriefed the team — what went well, what we'd do differently",
    why: "The shift is where the learning is; it goes home with people unless it's spoken.",
    kind: "attested",
    blocksSignOff: false,
  },
  {
    id: "safeguarding_prompt",
    stage: "end",
    label: "Anything that needs logging as a concern?",
    why: "A prompt, never a gate. Raising a concern is never held up by anything on this page — not this checklist, not a sign-off, not the hour.",
    kind: "attested",
    blocksSignOff: false,
  },
] as const;

/** What Cara found for one derived check.
 *
 *  `visible` is the load-bearing field. It answers "does this home record this
 *  kind of thing at all?" — NOT "did they do it this shift". When it is false,
 *  the engine reports that Cara cannot see, and never that the home failed. */
export interface CheckEvidence {
  visible: boolean;
  /** Proof Cara found for this shift (evidenced), or helpful context (attested). */
  found: string[];
  /** Things Cara can positively see are still outstanding. */
  outstanding: string[];
}

export interface ShiftLifecycleInput {
  shift: {
    id: string;
    staff_id: string;
    date: string;
    shift_type: string;
    start_time: string;
    end_time: string;
  };
  /** Evidence per derived check, assembled by the caller from the store. */
  evidence: Partial<Record<CheckId, CheckEvidence>>;
  /** Check ids this person has attested. An id absent from here is UNANSWERED,
   *  which is not the same as answered "no" — Cara never reads it as a failure. */
  attested: readonly string[];
  signedOffAt?: string | null;
  overrideReason?: string | null;
}

export interface ResolvedCheck extends LifecycleCheck {
  status: CheckStatus;
  /** What Cara found, or the context it can offer. */
  evidence: string[];
  /** Present only when status is `outstanding`. */
  outstanding: string[];
  /** Why the status is what it is — always shown, so no state is mysterious. */
  reason: string;
}

export interface SignOffAssessment {
  /** True when nothing Cara can see is outstanding. */
  clear: boolean;
  blockers: { checkId: CheckId; label: string; outstanding: string[] }[];
  /** Sign-off is always possible; this says whether it needs a reason first. */
  requiresReason: boolean;
  message: string;
}

export interface ShiftLifecycle {
  shiftId: string;
  staffId: string;
  date: string;
  checks: ResolvedCheck[];
  counts: {
    confirmed: number;
    outstanding: number;
    notVisible: number;
    awaiting: number;
  };
  signOff: SignOffAssessment;
  signedOffAt: string | null;
  overrideReason: string | null;
  /** Plain-language summary for the top of the page. */
  summary: string;
}

const resolveCheck = (
  check: LifecycleCheck,
  input: ShiftLifecycleInput,
): ResolvedCheck => {
  const attested = input.attested.includes(check.id);

  if (check.kind === "attested") {
    // An attestation Cara cannot verify. It says so, either way — a tick here
    // is a person's word, and Cara must not dress it up as proof.
    const ev = input.evidence[check.id];
    return {
      ...check,
      status: attested ? "confirmed" : "awaiting",
      evidence: ev?.found ?? [],
      outstanding: [],
      reason: attested
        ? "You confirmed this — Cara takes your word for it; it has no way to see this itself."
        : "Not answered yet. Cara can't see this one, so it's yours to say.",
    };
  }

  const ev = input.evidence[check.id];

  // THE HONESTY RULE. No source records of this kind anywhere in the home ⇒
  // Cara is blind, not the home negligent. Never a red, never a blocker.
  if (!ev || !ev.visible) {
    return {
      ...check,
      status: "not_visible",
      evidence: [],
      outstanding: [],
      reason:
        "Cara has no records of this kind for this home, so it can't tell either way. It may well be happening on paper or face to face — absence here is a gap in what Cara can see, not a finding about your practice.",
    };
  }

  if (ev.outstanding.length > 0) {
    return {
      ...check,
      status: "outstanding",
      evidence: ev.found,
      outstanding: ev.outstanding,
      reason: `Cara can see ${ev.outstanding.length} still open.`,
    };
  }

  if (ev.found.length > 0 || attested) {
    return {
      ...check,
      status: "confirmed",
      evidence: ev.found,
      outstanding: [],
      reason: ev.found.length > 0 ? "Cara can see this in the records." : "You confirmed this.",
    };
  }

  // Visible source, nothing found, nothing identifiably outstanding: still not
  // something to accuse anyone of.
  return {
    ...check,
    status: "awaiting",
    evidence: [],
    outstanding: [],
    reason: "Nothing recorded against this yet.",
  };
};

/** The soft gate. It never returns "no" — only "not yet, and tell me why." */
export function assessSignOff(checks: readonly ResolvedCheck[]): SignOffAssessment {
  const blockers = checks
    .filter((c) => c.blocksSignOff && c.status === "outstanding")
    .map((c) => ({ checkId: c.id, label: c.label, outstanding: c.outstanding }));

  if (blockers.length === 0) {
    return {
      clear: true,
      blockers: [],
      requiresReason: false,
      message: "Nothing Cara can see is outstanding. Ready to sign off.",
    };
  }

  return {
    clear: false,
    blockers,
    requiresReason: true,
    message:
      blockers.length === 1
        ? `${blockers[0].label.toLowerCase()} is still open. You can still sign off — just say what's outstanding and who's picking it up.`
        : "Handover and the day's records are still open. You can still sign off — just say what's outstanding and who's picking it up.",
  };
}

/** Write law for sign-off. Returns an error sentence, or null to allow.
 *
 *  It ALLOWS sign-off with blockers outstanding, provided a real reason is
 *  given. That is the doctrine's soft block: a leader is never trapped, and the
 *  reason they give is more useful than the refusal would have been. */
export function validateSignOff(
  assessment: SignOffAssessment,
  overrideReason: string | null | undefined,
): string | null {
  if (!assessment.requiresReason) return null;

  const reason = (overrideReason ?? "").trim();
  if (!reason) {
    return "Handover and records are the story of this shift. You can sign off with them outstanding — record what's left and who's picking it up.";
  }
  if (reason.length < 12) {
    return "A little more, please — enough that the next shift and your manager know what's outstanding and who has it.";
  }
  return null;
}

const shortStage = (s: LifecycleStage): string =>
  s === "before" ? "before" : s === "during" ? "during" : s === "end" ? "end of" : "through";

export function buildShiftLifecycle(input: ShiftLifecycleInput): ShiftLifecycle {
  const checks = LIFECYCLE_CHECKS.map((c) => resolveCheck(c, input));
  const counts = {
    confirmed: checks.filter((c) => c.status === "confirmed").length,
    outstanding: checks.filter((c) => c.status === "outstanding").length,
    notVisible: checks.filter((c) => c.status === "not_visible").length,
    awaiting: checks.filter((c) => c.status === "awaiting").length,
  };
  const signOff = assessSignOff(checks);

  const signedOffAt = input.signedOffAt ?? null;
  const summary = signedOffAt
    ? input.overrideReason
      ? `Signed off with items outstanding — the reason is recorded below.`
      : `Signed off. Nothing Cara could see was outstanding.`
    : signOff.clear
      ? `Nothing Cara can see is outstanding${counts.awaiting > 0 ? `; ${counts.awaiting} check${counts.awaiting === 1 ? "" : "s"} only you can answer` : ""}.`
      : signOff.message;

  return {
    shiftId: input.shift.id,
    staffId: input.shift.staff_id,
    date: input.shift.date,
    checks,
    counts,
    signOff,
    signedOffAt,
    overrideReason: input.overrideReason ?? null,
    summary,
  };
}

/** What a leader recorded against one shift: the things only they could
 *  answer, and the sign-off. Attestations are a person's word, kept as such —
 *  each carries who said it and when, and nothing here is ever back-filled by
 *  Cara on someone's behalf. */
export interface ShiftLifecycleRecord {
  id: string;
  home_id: string;
  shift_id: string;
  /** The team leader whose shift this is. */
  staff_id: string;
  attestations: {
    check_id: string;
    attested_by: string;
    attested_at: string;
  }[];
  signed_off_by: string | null;
  signed_off_at: string | null;
  /** Recorded when sign-off happened with handover or records still open. The
   *  reason is the point: it tells the next shift what is outstanding. */
  override_reason: string | null;
  overridden_blockers: string[];
  created_at: string;
  updated_at: string;
}

export function checksForStage(
  lifecycle: ShiftLifecycle,
  stage: LifecycleStage,
): ResolvedCheck[] {
  return lifecycle.checks.filter((c) => c.stage === stage);
}

export const stageLabel = (s: LifecycleStage): string =>
  ({
    before: "Before the shift",
    during: "During the shift",
    end: "End of shift",
    throughout: "Throughout",
  })[s];

export const stageSubtitle = (s: LifecycleStage): string =>
  ({
    before: "Arriving prepared",
    during: "Holding the shift",
    end: "Leaving it well",
    throughout: "Leadership and oversight",
  })[s] ?? shortStage(s);

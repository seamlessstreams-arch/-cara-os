// ══════════════════════════════════════════════════════════════════════════════
// CARA INTELLIGENCE — PACE practice engine · GUIDANCE
//
// For any context/scenario, generates PACE-informed practice guidance: what may
// be underneath the behaviour, how to respond, what to say / not say, how to hold
// the boundary safely, how to record it, what the manager should check, and when
// to escalate. Pure data assembly — Cara advises; staff decide. Boundaries and
// safeguarding always sit alongside PACE, never replaced by it.
// ══════════════════════════════════════════════════════════════════════════════

import { PACE_DISCLAIMER, PACE_SCRIPTS } from "./pace.constants";
import type { PACEContext, PACEGuidance } from "./pace.types";

const SAY = [PACE_SCRIPTS.ACCEPTANCE.use[0], PACE_SCRIPTS.CURIOSITY.use[0], PACE_SCRIPTS.EMPATHY.use[0]];
const DONT_SAY = [
  ...(PACE_SCRIPTS.CURIOSITY.avoid ?? []),
  ...(PACE_SCRIPTS.ACCEPTANCE.avoid ?? []),
  "Naming/shaming the behaviour ('you're being naughty/attention-seeking').",
];

const BASE: Omit<PACEGuidance, "context" | "scenario" | "disclaimer"> = {
  whatMayBeUnderneath: [
    "An unmet need — for safety, connection, control, or to be understood.",
    "A trauma response (fight/flight/freeze/appease), not a deliberate choice.",
    "A feeling too big to put into words — the behaviour is the communication.",
  ],
  howToRespond: [
    "Regulate yourself first — your calm is the child's co-regulation.",
    "Connect before correct: attend to the feeling and relationship, then the boundary.",
    "Stay alongside; reduce demands and stimulation; offer time and space.",
    "Hold the boundary calmly and proportionately while accepting the feeling.",
  ],
  whatToSay: SAY,
  whatNotToSay: DONT_SAY,
  holdBoundarySafely: [
    "Acceptance of the feeling does NOT mean accepting unsafe behaviour.",
    "State the limit simply and calmly; keep everyone safe; avoid power struggles.",
    "Follow the child's behaviour-support / safety plan and risk assessment.",
  ],
  howToRecord: [
    "Describe what was observed objectively; separate fact from interpretation.",
    "Capture the child's voice, the possible trigger, your response and the outcome.",
    "Record de-escalation, any boundary held, and the repair/follow-up planned.",
  ],
  managerShouldCheck: [
    "Is the child's lived experience and voice present?",
    "Was the response proportionate, trauma-informed and safeguarding-aware?",
    "Is repair planned, and does anything need escalation?",
  ],
  whenToEscalate: [
    "Any safeguarding concern or disclosure — follow the home's procedure the same day.",
    "Injury, restraint/physical intervention, or risk to life — notify the manager/on-call.",
    "Where Regulation 40 may apply, the manager should consider whether notification is required.",
  ],
};

const CONTEXT: Partial<Record<PACEContext, Partial<PACEGuidance>>> = {
  INCIDENT: {
    whatMayBeUnderneath: [
      "The incident is the surface; ask what the child was trying to communicate or survive.",
      "A specific trigger may have touched an earlier experience or fear.",
    ],
    whenToEscalate: [
      "If anyone was hurt, restraint was used, or risk to safety — notify the manager now.",
      "Safeguarding disclosures during/after — follow procedure the same day; do not probe.",
      "Manager to consider Regulation 40 notification where the threshold may be met.",
    ],
  },
  PHYSICAL_INTERVENTION: {
    whatToSay: [PACE_SCRIPTS.EMPATHY.use[2], "You're safe. I'm here. We'll get through this together."],
    holdBoundarySafely: [
      "Use only the agreed, trained, last-resort techniques in the positive-handling plan.",
      "Restraint is to keep safe, never to punish; stop as soon as it is safe to.",
      "No playfulness during restraint or immediate risk.",
    ],
    whenToEscalate: [
      "Always notify the manager; record on the body map; complete child AND staff debrief.",
      "Manager to consider Regulation 40 notification and review proportionality.",
    ],
  },
  MISSING_FROM_CARE: {
    whatMayBeUnderneath: [
      "Going missing is communication — pull towards something, or push away from distress/risk.",
      "The return is a relationship moment, not an interrogation.",
    ],
    whatToSay: ["I'm really glad you're back and safe.", PACE_SCRIPTS.CURIOSITY.use[0], PACE_SCRIPTS.EMPATHY.use[1]],
    whatNotToSay: ["Where have you been?! Do you know how much trouble you caused?", "Why did you run off?"],
    howToRecord: [
      "Offer (don't force) a return conversation; record the child's wishes and feelings.",
      "Note push/pull factors, any exploitation indicators, and actions to reduce future risk.",
    ],
    whenToEscalate: [
      "Complete the independent return interview per procedure; flag any exploitation/CSE/CCE risk.",
      "Update the missing/risk plan with the social worker.",
    ],
  },
  SANCTION: {
    whatMayBeUnderneath: ["Sanctions rarely reach the need; the behaviour is communicating something."],
    howToRespond: [
      "Favour natural consequences and repair over punitive sanctions.",
      "Connect first; a consequence without connection breeds shame, not learning.",
    ],
    holdBoundarySafely: [
      "Consequences must be proportionate, relational, and never humiliating or blanket.",
      "Avoid removing relationship, food, contact, or basic entitlements as punishment.",
    ],
  },
  DEBRIEF: {
    howToRespond: [
      "Debrief is reflective, not disciplinary — for the child AND the staff.",
      "Explore what the moment asked of everyone and what would help next time.",
    ],
    managerShouldCheck: ["Was a child debrief and a staff debrief completed and recorded?", "What is the relational repair plan?"],
  },
  STAFF_SUPERVISION: {
    whatMayBeUnderneath: ["Staff blocked care / burnout can reduce PACE capacity — this is normal and supportable."],
    howToRespond: ["Notice the staff member's own triggers with compassion; plan self-regulation and support."],
  },
};

export function getPACEGuidance(context: PACEContext, scenario = ""): PACEGuidance {
  const o = CONTEXT[context] ?? {};
  return {
    context,
    scenario,
    whatMayBeUnderneath: o.whatMayBeUnderneath ?? BASE.whatMayBeUnderneath,
    howToRespond: o.howToRespond ?? BASE.howToRespond,
    whatToSay: o.whatToSay ?? BASE.whatToSay,
    whatNotToSay: o.whatNotToSay ?? BASE.whatNotToSay,
    holdBoundarySafely: o.holdBoundarySafely ?? BASE.holdBoundarySafely,
    howToRecord: o.howToRecord ?? BASE.howToRecord,
    managerShouldCheck: o.managerShouldCheck ?? BASE.managerShouldCheck,
    whenToEscalate: o.whenToEscalate ?? BASE.whenToEscalate,
    disclaimer: PACE_DISCLAIMER,
  };
}

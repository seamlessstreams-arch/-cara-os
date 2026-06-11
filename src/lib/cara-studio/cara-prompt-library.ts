// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — PROMPT LIBRARY
//
// The central Cara Intelligence system prompt, curriculum domains, seeded
// session themes, PACE-informed phrase banks and per-module recording prompts.
// Deterministic generators draw from these banks; the LLM enrichment path uses
// the system prompt. One source of truth for Cara's voice and boundaries.
// ══════════════════════════════════════════════════════════════════════════════

export const CARA_STUDIO_SYSTEM_PROMPT = `You are Cara Intelligence, the creative problem-solving and learning design assistant inside Cara OS.

You support residential childcare staff to create therapeutic, relational, safeguarding-aware and SEND-adapted learning resources for children living in residential care.

You must always be: child-centred, trauma-informed, PACE-informed (Playfulness, Acceptance, Curiosity, Empathy), restorative, strengths-based, emotionally literate, contextual-safeguarding-aware, practical, clear, non-shaming, non-punitive, developmentally appropriate, SEND-aware and communication-aware.

You must never: blame or shame the child; make assumptions without evidence; diagnose; replace therapy or safeguarding procedures; encourage secrecy or unsafe practice; produce generic content that ignores the child's learning style, sensory, communication or emotional needs; overload the child with text; create content that could escalate distress; or minimise exploitation, abuse, neglect or risk.

When creating resources, always consider: age, developmental stage, communication needs, SEND, literacy, emotional state, attention span, sensory profile, trauma history, culture and identity, relationship with staff, current risk themes, placement goals, the complexity of living with other children, the staff member's confidence, and the safest time and way to approach the work.

Your output is always a draft for a professional to review. You support staff to think, plan, prepare and reflect — you never make the decision.`;

// ── Curriculum domains ────────────────────────────────────────────────────────

export const CARA_CURRICULUM_DOMAINS = [
  "Emotional literacy",
  "Relational literacy",
  "Situational literacy",
  "Safety literacy",
  "Exploitation awareness",
  "Digital safety",
  "Conflict and repair",
  "Living with others",
  "Personal routines",
  "Health and wellbeing",
  "Identity and belonging",
  "Education and aspiration",
  "Independence skills",
  "Community safety",
  "Rights and responsibilities",
  "Self-advocacy",
  "Consequences and decision-making",
  "Managing rejection and disappointment",
  "Trust and safe adults",
  "Understanding risk",
  "Processing incidents",
  "Restorative reflection",
] as const;
export type CaraCurriculumDomain = (typeof CARA_CURRICULUM_DOMAINS)[number];

// Risk-theme → domain hints used by the curriculum generator.
export const RISK_TO_DOMAINS: Record<string, CaraCurriculumDomain[]> = {
  missing: ["Safety literacy", "Understanding risk", "Trust and safe adults", "Community safety"],
  exploitation: ["Exploitation awareness", "Safety literacy", "Trust and safe adults", "Understanding risk"],
  cse: ["Exploitation awareness", "Safety literacy", "Trust and safe adults"],
  cce: ["Exploitation awareness", "Community safety", "Consequences and decision-making"],
  online: ["Digital safety", "Exploitation awareness", "Understanding risk"],
  "self-harm": ["Emotional literacy", "Health and wellbeing", "Trust and safe adults"],
  aggression: ["Emotional literacy", "Conflict and repair", "Living with others"],
  violence: ["Emotional literacy", "Conflict and repair", "Consequences and decision-making"],
  peer_conflict: ["Living with others", "Conflict and repair", "Relational literacy"],
  substance: ["Health and wellbeing", "Understanding risk", "Consequences and decision-making"],
  cannabis: ["Health and wellbeing", "Understanding risk", "Consequences and decision-making"],
  isolation: ["Identity and belonging", "Relational literacy", "Trust and safe adults"],
  education: ["Education and aspiration", "Self-advocacy", "Personal routines"],
  independence: ["Independence skills", "Personal routines", "Self-advocacy"],
  rejection: ["Managing rejection and disappointment", "Emotional literacy", "Identity and belonging"],
  family: ["Identity and belonging", "Managing rejection and disappointment", "Emotional literacy"],
};

// ── Seeded session themes ─────────────────────────────────────────────────────

export const CARA_SESSION_THEMES = [
  "Understanding my feelings",
  "What happens in my body when I get angry",
  "Living with other children",
  "Sharing space",
  "Noise, stress and taking space safely",
  "Trusting adults",
  "Safe adults and unsafe adults",
  "Going missing and staying safe",
  "Understanding exploitation and pressure",
  "Online safety",
  "Cannabis, vaping and health choices",
  "Curfew and safety planning",
  "Repairing relationships",
  "Saying sorry without shame",
  "Managing disappointment",
  "Managing rejection",
  "Asking for help",
  "Understanding consequences",
  "My future self",
  "Education and aspiration",
  "Daily routines",
  "Sleep and emotional regulation",
  "Hygiene and self-care",
  "Money and independence",
  "Identity and belonging",
  "Family time and mixed feelings",
  "Contact with parents",
  "Police, professionals and trust",
  "Court, YOT or social worker meetings",
  "My rights",
  "My voice in meetings",
  "How to complain safely",
  "Preparing for therapy",
  "Understanding patterns in my behaviour",
] as const;

// ── PACE-informed phrase banks ────────────────────────────────────────────────

export const PACE_OPENINGS = [
  "I'm not here to have a go at you. I'm trying to understand what was happening for you.",
  "There's nothing you could say right now that would make me think less of you.",
  "We don't have to talk about all of it. Even a little bit helps me understand.",
  "I've been thinking about you, and I wanted to check in — no pressure to get it right.",
  "You don't have to look at me while we talk. We can do this side by side.",
];

export const PACE_VALIDATIONS = [
  "That sounds really hard. It makes sense you felt that way.",
  "A lot of people would have found that overwhelming.",
  "I know being told what to do can feel frustrating. Help me understand what made it hard.",
  "It's okay to feel two things at once — angry and sad can sit together.",
  "You handled some of that better than you're giving yourself credit for.",
];

export const PACE_CURIOSITY = [
  "What was the hardest part of that for you?",
  "If your feelings had a volume dial, where was it at that moment?",
  "What do you wish the adults around you had done differently?",
  "What did your body feel like just before it happened?",
  "If a friend was in the same spot, what would you tell them?",
];

export const PACE_REPAIR = [
  "What's one small thing that might make tomorrow a bit easier?",
  "Is there anything you'd like to put right — in your own way, in your own time?",
  "What would feel fair to you as a next step?",
  "Who would you want with you when you sort this out?",
];

export const PACE_SAFETY = [
  "Is there anything happening that's making you feel unsafe — here or anywhere else?",
  "Is anyone asking you to keep secrets or do things you don't want to do?",
  "Who's the first person you'd go to if something felt wrong?",
];

export const AVOID_PHRASES = [
  "Why did you do that?",
  "You know the rules.",
  "You should know better.",
  "After everything we do for you…",
  "You're old enough to know.",
  "If you do that again, there will be consequences.",
  "Calm down.",
  "You're overreacting.",
];

export const STAFF_REGULATION_REMINDERS = [
  "Regulate yourself first — slow breath, soft shoulders, low voice.",
  "Connection before correction: the relationship does the work.",
  "Their behaviour is communication, not a personal attack.",
  "Silence is allowed. Don't rush to fill it.",
  "If you feel yourself escalating, it is good practice to pause and come back.",
];

export const SHUTDOWN_RESPONSES = {
  shutsDown:
    "Drop the agenda, keep the connection: \"We don't have to talk. I'll stay here with you, or I can come back later — you choose.\" Leave the door open and follow up gently within 24 hours.",
  becomesAngry:
    "Lower your voice and slow down. Name it without judgement: \"This feels big. We can stop.\" Give space and a way back that doesn't lose face. Do not block exits or follow closely.",
  becomesUpset:
    "Stay close and calm. \"It's okay — you don't have to explain. I'm here.\" Offer comfort the child accepts (drink, blanket, quiet). Pick the thread up only when they're regulated.",
  walksAway:
    "Let them go safely — walking away is often self-regulation, not defiance. Check sightlines and safety, then re-offer later: \"I'm glad you took space. Want to try again after food?\"",
} as const;

// ── Recording prompts (per module) ────────────────────────────────────────────

export const RECORDING_PROMPTS: Record<string, string> = {
  session_plan:
    "After the session, record: what was offered, how the child responded, what worked well, any signs of distress, what the child communicated verbally or non-verbally, any safeguarding concerns, and the agreed follow-up actions.",
  conversation:
    "After the conversation, record: when and where it happened, what was discussed in the child's words where possible, the child's emotional state before and after, anything that needs passing on, any safeguarding concerns, and what you agreed together.",
  incident_learning:
    "Record: the learning offered, how it was framed (non-shaming), the child's engagement, any repair that took place, outstanding safeguarding actions, and when the follow-up session is planned.",
  material:
    "Record: which material was used, how it was adapted in the moment, what the child made or said, whether it helped or overwhelmed, and whether to reuse, adapt or retire it.",
  debrief:
    "Record in supervision notes: the reflective summary, what will change in practice, any support the staff member needs, and any relational repair planned with the child.",
  curriculum:
    "Record at each review point: which sessions happened, what the child engaged with, what was skipped and why, emerging themes, and any change to the priority needs.",
  adaptation:
    "Record: which adaptation was used, whether it lowered the barrier as intended, and what the child's response suggests for future materials.",
};

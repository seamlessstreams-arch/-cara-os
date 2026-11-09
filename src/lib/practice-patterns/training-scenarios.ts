// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD'S-POINT-OF-VIEW TRAINING SCENARIO OPENERS  (pure · content type)
//
// Practice-patterns brief D / pattern pp_learning_changes_practice:
// training scenarios opened from the CHILD'S point of view (e.g. a child told
// about a school visit tomorrow with nobody asking what it means to him).
// Cara's existing child-POV first-person framing is used for child-FACING
// materials; staff training scenarios are framed from the staff decision-point.
// This is the content type + seeded fictional openers for the gap.
//
// SAFETY: every opener is FICTIONAL — no child-identifiable data. First-person,
// the child's lived experience, to open a staff training discussion. Pure: no
// store, no AI, no imports.
// ══════════════════════════════════════════════════════════════════════════════

export type ScenarioTheme =
  | "pace"
  | "safeguarding"
  | "autism"
  | "adhd"
  | "boundaries"
  | "transitions"
  | "attachment";

export interface ChildPovOpener {
  id: string;
  theme: ScenarioTheme;
  /** First-person, the child's point of view. FICTIONAL. */
  opener: string;
  /** The reflective question this opener puts to staff. */
  staffPrompt: string;
  /** Always true — a fictional composite, never a real child. */
  fictional: true;
}

export const CHILD_POV_OPENERS: readonly ChildPovOpener[] = [
  {
    id: "cpo_transitions_school_visit",
    theme: "transitions",
    opener:
      "I found out this morning that I'm visiting a new school tomorrow. Someone wrote it on the whiteboard. Nobody asked me how I feel about it, or what I'm scared of.",
    staffPrompt: "What would it take, before tomorrow, for this child to feel asked rather than told?",
    fictional: true,
  },
  {
    id: "cpo_pace_after_blow_up",
    theme: "pace",
    opener:
      "I kicked off at tea and smashed a plate. Everyone went quiet. I think they're waiting for me to be punished. I just want to know we're still okay.",
    staffPrompt: "How do we lead with playfulness, acceptance, curiosity and empathy here before we address the behaviour?",
    fictional: true,
  },
  {
    id: "cpo_safeguarding_new_friend",
    theme: "safeguarding",
    opener:
      "My new friend is older and buys me things. He says the staff here don't really care about me like he does. I don't want to get him in trouble.",
    staffPrompt: "What are we noticing, and how do we stay curious and connected rather than confrontational?",
    fictional: true,
  },
  {
    id: "cpo_autism_change_of_plan",
    theme: "autism",
    opener:
      "The plan was pizza on Friday. It's Friday and now we're having something else because the car broke. The words are going fast and the lights are too bright and I can't make it make sense.",
    staffPrompt: "What did the change cost this child, and what would have made it survivable?",
    fictional: true,
  },
  {
    id: "cpo_adhd_homework_table",
    theme: "adhd",
    opener:
      "They keep telling me to sit still and finish my work. My body won't do it. By the time I've been told off twice I've forgotten what I was even meant to do.",
    staffPrompt: "What are we expecting of this child's body and attention, and is it fair?",
    fictional: true,
  },
  {
    id: "cpo_boundaries_bedtime",
    theme: "boundaries",
    opener:
      "The rule is lights out at nine. But some nights I'm not tired and some nights I'm scared. The rule is the same every night even when I'm not.",
    staffPrompt: "Where is the boundary keeping this child safe, and where is it just easier for us?",
    fictional: true,
  },
  {
    id: "cpo_attachment_new_keyworker",
    theme: "attachment",
    opener:
      "My key worker left. They told me on her last day. People always leave. I'm not going to bother getting to know the new one.",
    staffPrompt: "How do we honour the loss and earn trust without rushing this child to 'move on'?",
    fictional: true,
  },
];

export function getOpenersByTheme(theme: ScenarioTheme): ChildPovOpener[] {
  return CHILD_POV_OPENERS.filter((o) => o.theme === theme);
}

export function listScenarioThemes(): ScenarioTheme[] {
  return Array.from(new Set(CHILD_POV_OPENERS.map((o) => o.theme)));
}

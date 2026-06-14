// ══════════════════════════════════════════════════════════════════════════════
// CARA INTELLIGENCE — PACE practice engine · TRAINING (micro-learning)
//
// Short, scenario-based PACE modules for residential childcare staff. Each module
// pairs a good and a poor response with a reflection question and a manager
// discussion prompt. Content is faithful to DDP/PACE (Dan Hughes). Pure data +
// simple selectors.
// ══════════════════════════════════════════════════════════════════════════════

import type { PACEContext, PACETrainingModule } from "./pace.types";

export const PACE_TRAINING_MODULES: PACETrainingModule[] = [
  {
    id: "pace-101",
    title: "What is PACE?",
    explanation:
      "PACE — Playfulness, Acceptance, Curiosity, Empathy — is a relational stance from Dr Dan Hughes's Dyadic Developmental Practice (DDP). It is a way of thinking, feeling, communicating and behaving that helps a child feel safe, understood and less defensive, so they can begin to trust adults. PACE sits alongside boundaries and safeguarding; it does not replace them.",
    scenario: "A child snaps 'leave me alone' and slams a door.",
    goodResponse: "Stay calm, give a little space, and later wonder aloud: 'It seemed like something felt too much earlier — I'm here when you're ready.'",
    poorResponse: "Follow them, demand they apologise for the door, and warn of a consequence.",
    reflectionQuestion: "Which PACE element do I find hardest to hold when a child pushes me away?",
    managerDiscussionPrompt: "How do we keep PACE alongside clear, safe boundaries on the team?",
    relatedContexts: ["DAILY_LOG", "KEY_WORK"],
  },
  {
    id: "pace-residential",
    title: "PACE in residential children's homes",
    explanation:
      "Children in residential care have often experienced relational trauma. Behaviour is communication about unmet needs and survival. PACE helps staff respond to the need beneath the behaviour while keeping everyone safe.",
    scenario: "A young person repeatedly tests rules in their first weeks in the home.",
    goodResponse: "Hold consistent, warm boundaries; name that it makes sense to test whether adults are safe; stay regulated and predictable.",
    poorResponse: "Escalate sanctions each time to 'show who's in charge'.",
    reflectionQuestion: "What might this child be checking out about whether I am safe and will stay?",
    managerDiscussionPrompt: "Are our boundaries consistent and relational across all staff and shifts?",
    relatedContexts: ["DAILY_LOG", "SANCTION", "KEY_WORK"],
  },
  {
    id: "pace-incidents",
    title: "PACE during incidents",
    explanation:
      "In the heat of an incident, the priority is safety and co-regulation. Connect before correct: your calm regulates the child. Curiosity and meaning-making come once everyone is safe — never as an interrogation in the moment.",
    scenario: "A young person is shouting and throwing objects.",
    goodResponse: "Lower your voice, reduce demands, move others to safety, stay alongside calmly, and keep the boundary on safety without shaming.",
    poorResponse: "Raise your voice, list consequences, and ask 'why are you doing this?' mid-incident.",
    reflectionQuestion: "How do I keep myself regulated when an incident is escalating?",
    managerDiscussionPrompt: "Does our recording capture de-escalation, co-regulation and the child's voice — not just the behaviour?",
    relatedContexts: ["INCIDENT", "PHYSICAL_INTERVENTION"],
  },
  {
    id: "pace-after-restraint",
    title: "PACE after restraint / physical intervention",
    explanation:
      "Restraint is a last resort to keep safe, never a punishment. Afterwards, repair is essential: the relationship has been ruptured. Complete both a child and a staff debrief and plan reconnection.",
    scenario: "A physical intervention has just ended and the young person is tearful.",
    goodResponse: "Once safe, offer warmth and empathy: 'That was really hard. I'm still here. You're not on your own.' Plan repair and debrief.",
    poorResponse: "Send them to their room and move straight to a sanction with no repair.",
    reflectionQuestion: "What helps this child feel safe again after a rupture?",
    managerDiscussionPrompt: "Were child and staff debriefs completed, the body map done, and repair planned?",
    relatedContexts: ["PHYSICAL_INTERVENTION", "DEBRIEF"],
  },
  {
    id: "pace-boundaries",
    title: "PACE and boundaries",
    explanation:
      "Acceptance is of the FEELING, never of unsafe behaviour. PACE and boundaries work together: you can fully accept how a child feels while calmly holding a clear, safe limit.",
    scenario: "A child is furious that screen time has ended and refuses to hand over the console.",
    goodResponse: "'I can see how annoying this feels — it makes sense. The screen still needs to go off now; I'll help you find something else.'",
    poorResponse: "'Stop being difficult — that's another sanction.'",
    reflectionQuestion: "Do I sometimes drop the boundary to avoid conflict, or drop the empathy to enforce it?",
    managerDiscussionPrompt: "How do we coach staff to hold both empathy and the boundary at once?",
    relatedContexts: ["SANCTION", "DAILY_LOG"],
  },
  {
    id: "pace-missing-return",
    title: "PACE and missing-from-care return interviews",
    explanation:
      "Going missing is communication. The return is a relationship moment, not an interrogation. Lead with relief and empathy; explore push/pull factors and exploitation risk gently and per procedure.",
    scenario: "A young person returns after being missing overnight.",
    goodResponse: "'I'm so glad you're back and safe. When you're ready, I'd like to understand what made being away feel better than being here.'",
    poorResponse: "'Where have you been? Do you realise the trouble you caused?'",
    reflectionQuestion: "How do I show relief and care before any questions?",
    managerDiscussionPrompt: "Is the independent return interview offered and exploitation risk reviewed with the social worker?",
    relatedContexts: ["MISSING_FROM_CARE"],
  },
  {
    id: "pace-sanctions",
    title: "PACE and sanctions / consequences",
    explanation:
      "Punitive sanctions rarely reach the need and often deepen shame. Favour natural consequences and repair, always with connection first. Never remove relationship, food, contact or basic entitlements as punishment.",
    scenario: "A child breaks something during an outburst.",
    goodResponse: "Connect first, then involve them in putting it right (repair) as a natural consequence.",
    poorResponse: "Issue a blanket sanction with no connection or repair.",
    reflectionQuestion: "Is this consequence relational and proportionate, or just punitive?",
    managerDiscussionPrompt: "Do our consequences build learning and repair, or shame?",
    relatedContexts: ["SANCTION", "INCIDENT"],
  },
  {
    id: "pace-recording",
    title: "PACE and recording",
    explanation:
      "Records should be objective and child-centred: what was observed, the child's voice, the possible trigger, the PACE-informed response, the boundary held, the outcome and the repair. Avoid labels and blame.",
    scenario: "Writing up a difficult afternoon.",
    goodResponse: "'Sam appeared overwhelmed after the phone call; I gave space and stayed nearby. Sam said he felt let down. We agreed to talk again at tea.'",
    poorResponse: "'Sam kicked off for no reason and was non-compliant all afternoon.'",
    reflectionQuestion: "Would the child recognise themselves in how I've written this?",
    managerDiscussionPrompt: "Do our records evidence trauma-informed practice and the child's lived experience?",
    relatedContexts: ["DAILY_LOG", "INCIDENT", "DEBRIEF"],
  },
  {
    id: "pace-self-regulation",
    title: "PACE and staff self-regulation / blocked care",
    explanation:
      "Caring for traumatised children can lead to 'blocked care' — where stress reduces our capacity for warmth and empathy. This is normal and supportable. Noticing our own triggers and looking after ourselves protects our PACE capacity.",
    scenario: "A staff member notices they feel cold and irritable towards a particular child.",
    goodResponse: "Name it without shame, seek support and reflective supervision, and plan self-regulation strategies.",
    poorResponse: "Push through while becoming increasingly reactive in interactions.",
    reflectionQuestion: "Where is my own capacity for PACE right now, and what do I need?",
    managerDiscussionPrompt: "How do we spot and support blocked care before it affects children?",
    relatedContexts: ["STAFF_SUPERVISION"],
  },
];

/** All modules. */
export function getPACETrainingModules(): PACETrainingModule[] {
  return PACE_TRAINING_MODULES;
}

/** Modules relevant to a given practice context. */
export function getPACETrainingForContext(context: PACEContext): PACETrainingModule[] {
  return PACE_TRAINING_MODULES.filter((m) => m.relatedContexts.includes(context));
}

/** A single module by id. */
export function getPACETrainingModule(id: string): PACETrainingModule | null {
  return PACE_TRAINING_MODULES.find((m) => m.id === id) ?? null;
}

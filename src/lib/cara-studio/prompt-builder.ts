// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — Prompt Builder
//
// Constructs system + user prompts for generation based on:
//   - Generation type
//   - Child profile (if applicable)
//   - Tone and audience
//   - User's brief
//
// All prompts enforce:
//   - Trauma-informed language
//   - Strengths-based approach
//   - Child-centred perspective
//   - Regulatory awareness
//   - Professional boundaries
// ══════════════════════════════════════════════════════════════════════════════

import type { CaraChildProfile, GenerationType, Tone, Audience, GroundingSource } from "./types";

// ── Main Builder ─────────────────────────────────────────────────────────────

export interface BuiltPrompt {
  system: string;
  user: string;
}

export function buildPrompt(params: {
  generationType: GenerationType;
  profile?: CaraChildProfile;
  title: string;
  brief: string;
  tone: Tone;
  audience: Audience;
  additionalContext?: string;
  sources?: GroundingSource[];
}): BuiltPrompt {
  const { generationType, profile, title, brief, tone, audience, additionalContext, sources } = params;

  const system = buildSystemPrompt(generationType, tone, audience);
  const user = buildUserPrompt(generationType, profile, title, brief, additionalContext, sources);

  return { system, user };
}

// ── System Prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(type: GenerationType, tone: Tone, audience: Audience): string {
  const toneInstruction = TONE_INSTRUCTIONS[tone];
  const audienceInstruction = AUDIENCE_INSTRUCTIONS[audience];
  const typeInstruction = TYPE_INSTRUCTIONS[type] ?? "";

  return `You are Cara Studio, an AI content creation assistant embedded within Cara OS — a platform for UK children's residential care homes.

## Your Role
You create personalised, trauma-informed, child-centred resources for care professionals working with looked-after children. Everything you produce must be:
- **Trauma-informed**: Acknowledge the impact of adverse experiences without re-traumatising
- **Strengths-based**: Lead with what the child CAN do, their interests, and their progress
- **Child-centred**: The child's voice, wishes, and feelings are paramount
- **Developmentally appropriate**: Match the child's age, understanding, and communication style
- **Culturally sensitive**: Respect identity, heritage, and individual needs
- **Professionally bounded**: You assist but NEVER replace professional judgement

## Critical Rules
1. NEVER include identifying information that could be shared outside the care team without consent
2. NEVER diagnose, prescribe, or make clinical recommendations — defer to professionals
3. NEVER minimise risk �� if risk flags are present, acknowledge and signpost appropriately
4. NEVER use punitive or blaming language toward the child
5. NEVER fabricate evidence — only reference information from the provided profile and the care records supplied
6. Always use the child's preferred name if provided
7. Use language that a ${audience === "young_person" ? "young person aged 13-17" : "care professional"} would understand

## Tone
${toneInstruction}

## Audience
${audienceInstruction}

## Content Type
${typeInstruction}

## Output Format
Return structured content with clear sections. Use markdown formatting:
- Use ## for section headings
- Use bullet points for lists
- Use > for direct quotes or child voice
- Use **bold** for key points
- Include practical, actionable content
- For sessions: include timing suggestions, materials needed, and debrief prompts

## Regulatory Context
You operate within the framework of:
- Children's Homes (England) Regulations 2015
- SCCIF (Social Care Common Inspection Framework)
- Working Together to Safeguard Children
- The Children Act 1989 & 2004
Reference specific regulations where relevant but don't overload with citations.`;
}

// ── User Prompt ──────────────────────────────────────────────────────────────

function buildUserPrompt(
  type: GenerationType,
  profile?: CaraChildProfile,
  title?: string,
  brief?: string,
  additionalContext?: string,
  sources?: GroundingSource[],
): string {
  let prompt = "";

  // Profile section
  if (profile) {
    prompt += `## Child Profile\n`;
    prompt += `**Name**: ${profile.preferredName ?? profile.childName}\n`;
    prompt += `**Age**: ${profile.age}\n`;
    if (profile.pronouns) prompt += `**Pronouns**: ${profile.pronouns}\n`;
    prompt += `\n`;

    if (profile.strengths.length > 0) {
      prompt += `**Strengths**: ${profile.strengths.join("; ")}\n`;
    }
    if (profile.needs.length > 0) {
      prompt += `**Needs**: ${profile.needs.join("; ")}\n`;
    }
    if (profile.interests.length > 0) {
      prompt += `**Interests**: ${profile.interests.join("; ")}\n`;
    }
    if (profile.triggers.length > 0) {
      prompt += `**Known Triggers**: ${profile.triggers.join("; ")}\n`;
    }
    if (profile.copingStrategies.length > 0) {
      prompt += `**Coping Strategies**: ${profile.copingStrategies.join("; ")}\n`;
    }
    if (profile.communicationPreferences) {
      prompt += `**Communication**: ${profile.communicationPreferences}\n`;
    }
    if (profile.riskFlags.length > 0) {
      prompt += `\n**Risk Flags**: ${profile.riskFlags.join("; ")}\n`;
    }

    if (profile.carePlanObjectives.length > 0) {
      prompt += `\n**Care Plan Objectives**:\n`;
      for (const obj of profile.carePlanObjectives) {
        prompt += `- ${obj.title} (${obj.status})\n`;
      }
    }

    if (profile.recentProgress) {
      prompt += `\n**Recent Progress**: ${profile.recentProgress}\n`;
    }

    if (profile.familyContext) {
      prompt += `\n**Family Context**: ${profile.familyContext}\n`;
    }

    prompt += `\n---\n\n`;
  }

  // Care records the user is working FROM — the grounding evidence. Base the
  // content on these (and the profile); never invent beyond them.
  if (sources && sources.length > 0) {
    prompt += `## Care Records (work from these — do not invent beyond them)\n`;
    for (const s of sources) {
      const body = s.content && s.content.length > 600 ? `${s.content.slice(0, 600)}…` : (s.content ?? "");
      prompt += `\n### ${s.type} — ${s.title}${s.date ? ` (${s.date})` : ""}\n${body}\n`;
    }
    prompt += `\n---\n\n`;
  }

  // Request section
  prompt += `## Request\n`;
  prompt += `**Title**: ${title}\n`;
  prompt += `**Brief**: ${brief}\n`;

  if (additionalContext) {
    prompt += `\n**Additional Context**: ${additionalContext}\n`;
  }

  prompt += `\nPlease generate the requested ${TYPE_LABELS[type]} content. Structure it with clear sections, practical guidance, and ensure it is immediately usable by the care team.`;

  return prompt;
}

// ── Instruction Maps ─────────────────────────────────────────────────────────

const TONE_INSTRUCTIONS: Record<Tone, string> = {
  warm_professional: "Write in a warm but professional tone. Compassionate, clear, and solution-focused. Like a skilled senior practitioner briefing a colleague.",
  playful: "Write in a playful, engaging tone suitable for creative activities with young people. Use accessible language, humour where appropriate, and keep energy positive.",
  calm_reassuring: "Write in a calm, reassuring tone. Measured pace, validating language, grounding. Like a trusted adult providing comfort during uncertainty.",
  direct: "Write in a direct, clear tone. No unnecessary padding. Get to the point while remaining respectful and professional.",
  nurturing: "Write in a nurturing, emotionally attuned tone. Focus on connection, safety, and belonging. Acknowledge feelings before problem-solving.",
  coaching: "Write in a coaching tone. Motivational, empowering, and focused on building the reader's confidence and skills. Ask reflective questions.",
  formal: "Write in a formal, report-appropriate tone suitable for statutory documents, panel reports, and multi-agency communications.",
};

const AUDIENCE_INSTRUCTIONS: Record<Audience, string> = {
  staff: "The audience is residential care staff (Level 3/4 qualified). They understand care terminology but benefit from practical, step-by-step guidance.",
  young_person: "The audience is a young person aged 13-17 in residential care. Use age-appropriate language, avoid jargon, be respectful and empowering. Never patronise.",
  social_worker: "The audience is a qualified social worker. Use professional language, reference frameworks and regulations, be concise and evidence-focused.",
  manager: "The audience is a Registered Manager (Level 5). They need strategic overview, regulatory alignment, and actionable governance information.",
  multi_agency: "The audience is multi-agency professionals (health, education, social care). Use shared professional language, be clear about roles and recommendations.",
  family: "The audience is a family member. Use plain English, avoid jargon, be warm and inclusive. Acknowledge the family's perspective.",
};

const TYPE_INSTRUCTIONS: Record<GenerationType, string> = {
  KEYWORK_SESSION: "Generate a structured key work session plan. Include: aim, warm-up, main activity (with prompts/questions), wind-down, and follow-up actions. Duration: 20-40 minutes. Link to care plan objectives.",
  DIRECT_WORK_SESSION: "Generate a therapeutic direct work session. Include: therapeutic aim, materials needed, step-by-step facilitation guide, potential responses and how to handle them, and recording prompts.",
  LIFE_STORY_SESSION: "Generate a life story work session. Be extremely sensitive to trauma. Include: session aim, preparation checklist, activity steps, potential emotional responses and support strategies, and next-session links.",
  MISSING_RETURN_HOME_SUPPORT: "Generate a return home conversation guide for when a young person returns after being missing. Follow the 'safe and well' approach. Include: initial welcome script, conversation prompts (not interrogation), risk indicators to note, and recording template.",
  STAFF_BRIEFING: "Generate a concise staff briefing document. Include: key points, individual child updates, risk reminders, shift priorities, and handover actions.",
  FLASHCARDS: "Generate a set of 6-10 flashcards for the young person. Each card has a front (question/prompt) and back (answer/guidance). Make them practical and memorable.",
  YOUNG_PERSON_EXPLAINER: "Generate a young-person-friendly explainer document. Use simple language, short sentences, and relatable examples. Include visuals suggestions.",
  BEHAVIOUR_SUPPORT_IDEAS: "Generate practical behaviour support strategies. Include: proactive strategies, reactive responses, de-escalation techniques, and reward/reinforcement ideas. All must be non-punitive.",
  PLACEMENT_PLAN_DRAFT: "Generate a placement plan draft section. Use formal language, reference the child's assessed needs, and include measurable outcomes. This is a DRAFT requiring professional review.",
  RISK_ASSESSMENT_DRAFT: "Generate a risk assessment draft. Include: identified risks, likelihood/impact, current controls, additional mitigations needed. This is a DRAFT requiring professional sign-off.",
  CARE_PLAN_DRAFT: "Generate a care plan draft section. Include: identified need, desired outcome, actions/interventions, responsible person, review date. This is a DRAFT requiring IRO/SW approval.",
  STAFF_MICRO_TRAINING: "Generate a 10-15 minute micro-training session for staff. Include: learning objective, key theory (brief), practical scenario, discussion questions, and take-away action.",
  TEAM_MEETING_PACK: "Generate a team meeting discussion pack. Include: agenda items, key data points, discussion prompts, decision items, and action tracking template.",
  TEAM_DISCUSSION_GUIDE: "Generate a facilitated team discussion guide on the given practice theme, designed like a practitioner-researcher: purpose and intended practice shift; the theory in two short paragraphs (name the framework — attachment, PACE, social pedagogy, restorative practice — and what the evidence says); a realistic vignette drawn ONLY from the source material; 6-8 open discussion questions moving from noticing → interpreting → responding → team culture; common pitfalls and judgemental-language traps; agreed-practice commitments template; and a 5-minute follow-up check for the next meeting. Reflective, not tick-box; 30-45 minutes; usable by a deputy with no preparation time.",
  REG44_EVIDENCE_PREP: "Generate Regulation 44 evidence preparation notes. Structure around the Reg 44 visit areas: children's views, safety, leadership, health, education, and any concerns. Include suggested evidence sources.",
  REG45_EVIDENCE_PREP: "Generate Regulation 45 (quality of care) evidence preparation. Structure around Reg 45 requirements: review of quality of care, consultation with children, and improvement actions.",
  EDUCATION_SUPPORT_SESSION: "Generate an education support session plan. Include: learning objective, engagement hooks based on interests, activities, and extension ideas. Consider any SEN needs.",
  INDEPENDENCE_SESSION: "Generate an independence/life skills session. Include: skill focus, preparation, step-by-step guide, success criteria, and ways to build on this.",
  FAMILY_TIME_PREPARATION: "Generate a family time preparation resource. Include: pre-visit preparation (for child), during-visit support strategies, post-visit debrief prompts, and contingency plans.",
  EMOTIONAL_REGULATION_SESSION: "Generate an emotional regulation session. Include: check-in activity, psychoeducation (age-appropriate), practice activity, coping toolkit addition, and wind-down.",
  RELATIONSHIP_REPAIR_SESSION: "Generate a relationship repair session guide. Include: timing considerations, opening approach, acknowledgement framework, repair conversation structure, and follow-up plan.",
  MANAGER_OVERSIGHT_PROMPTS: "Generate manager oversight prompts and questions. Include: areas to review, critical questions to ask, red flags to look for, and documentation reminders.",
};

const TYPE_LABELS: Record<GenerationType, string> = {
  KEYWORK_SESSION: "Key Work Session",
  DIRECT_WORK_SESSION: "Direct Work Session",
  LIFE_STORY_SESSION: "Life Story Work Session",
  MISSING_RETURN_HOME_SUPPORT: "Missing Return Home Support",
  STAFF_BRIEFING: "Staff Briefing",
  FLASHCARDS: "Flashcards",
  YOUNG_PERSON_EXPLAINER: "Young Person Explainer",
  BEHAVIOUR_SUPPORT_IDEAS: "Behaviour Support Ideas",
  PLACEMENT_PLAN_DRAFT: "Placement Plan Draft",
  RISK_ASSESSMENT_DRAFT: "Risk Assessment Draft",
  CARE_PLAN_DRAFT: "Care Plan Draft",
  STAFF_MICRO_TRAINING: "Staff Micro-Training",
  TEAM_MEETING_PACK: "Team Meeting Pack",
  TEAM_DISCUSSION_GUIDE: "Team Discussion Guide",
  REG44_EVIDENCE_PREP: "Reg 44 Evidence Prep",
  REG45_EVIDENCE_PREP: "Reg 45 Evidence Prep",
  EDUCATION_SUPPORT_SESSION: "Education Support Session",
  INDEPENDENCE_SESSION: "Independence Session",
  FAMILY_TIME_PREPARATION: "Family Time Preparation",
  EMOTIONAL_REGULATION_SESSION: "Emotional Regulation Session",
  RELATIONSHIP_REPAIR_SESSION: "Relationship Repair Session",
  MANAGER_OVERSIGHT_PROMPTS: "Manager Oversight Prompts",
};

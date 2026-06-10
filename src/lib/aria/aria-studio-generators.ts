// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — PROMPT GENERATORS
// Builds the specific user prompt for each artifact type.
// ══════════════════════════════════════════════════════════════════════════════

import type { AriaArtifactType, AriaFramework, AriaTone, AriaCreativeMode } from "@/types/aria-studio";

interface PromptInput {
  artifactType: AriaArtifactType;
  title: string;
  childId: string | null;
  homeId: string;
  framework: AriaFramework;
  tone: AriaTone;
  creativeMode: AriaCreativeMode;
  additionalContext: string;
  sourceContext: string;
}

export function buildArtifactPrompt(input: PromptInput): string {
  const base = buildBaseContext(input);
  const specific = buildTypeSpecificPrompt(input);
  return `${base}\n\n${specific}`;
}

function buildBaseContext(input: PromptInput): string {
  const parts: string[] = [];

  parts.push(`## Generation request`);
  parts.push(`**Output type:** ${input.artifactType.replace(/_/g, " ")}`);
  parts.push(`**Title:** ${input.title}`);
  parts.push(`**Framework:** ${input.framework}`);
  parts.push(`**Tone:** ${input.tone}`);
  parts.push(`**Mode:** ${input.creativeMode}`);

  if (input.childId) {
    parts.push(`**Child:** ${input.childId}`);
  }

  if (input.additionalContext) {
    parts.push(`\n**Additional context from staff:**\n${input.additionalContext}`);
  }

  if (input.sourceContext) {
    parts.push(`\n## Evidence sources available\n${input.sourceContext}`);
  } else {
    parts.push(`\n## Evidence sources available\nNo indexed sources provided. Base output on general good practice and clearly state that specific evidence is not available.`);
  }

  return parts.join("\n");
}

function buildTypeSpecificPrompt(input: PromptInput): string {
  switch (input.artifactType) {
    case "keywork_session":
      return `## Instructions — Keywork Session Plan

Generate a structured keywork session plan. Include:

1. **Purpose of session** — what are we trying to understand or achieve?
2. **Evidence used** — what do we know from the child's record?
3. **Child voice currently known** — what has the child already expressed?
4. **Therapeutic rationale** — why this approach, using ${input.framework}?
5. **Suggested opening question** — something curious, not interrogating
6. **Activities or tools** — if relevant to the session type
7. **Scaling question** — e.g. emotional temperature check
8. **Follow-up actions** — concrete, assigned, time-bound
9. **What success looks like** — how will we know this session helped?

Keep language ${input.tone}. Use ${input.framework} principles throughout.
Mark all content clearly as a draft requiring human review.`;

    case "direct_work_session":
      return `## Instructions — Direct Work Session Plan

Generate a direct work session plan. Include:

1. **Session purpose and therapeutic goal**
2. **Evidence and background from the child's record**
3. **What the child has expressed so far**
4. **Proposed activities** — age-appropriate, engagement-focused
5. **Materials needed** — practical list
6. **How to introduce the session** — scripted opening suggestion
7. **What to look for** — emotional cues, themes emerging
8. **Recording what happens** — what to capture during and after
9. **Follow-up and next session notes**

Use ${input.framework} principles. Tone: ${input.tone}.`;

    case "management_oversight":
      return `## Instructions — Management Oversight Note

Generate a structured management oversight note. Include:

1. **Period covered** — dates and context
2. **Evidence reviewed** — what records, how many, what type
3. **Child-by-child or thematic analysis** — key patterns and concerns
4. **Risk analysis** — current risk level, any escalation concerns
5. **Regulatory relevance** — Reg 40, Reg 45, Annex A implications
6. **Management decisions taken** — clearly attributed, with rationale
7. **Actions required** — owner, deadline, priority
8. **Quality of care themes** — strengths and areas for improvement
9. **Next oversight due date**

This must read as a genuine management oversight document, inspection-ready if needed.
Tone: ${input.tone}. Use ${input.framework} principles.`;

    case "incident_learning_review":
      return `## Instructions — Incident Learning Review

Generate a structured learning review following an incident. Include:

1. **Incident summary** — what happened, who was involved, date/time
2. **Immediate response** — what was done at the time
3. **Children affected** — impact on each child involved
4. **Staff involved** — roles and responses (no blame, learning focus)
5. **Root cause analysis** — what factors contributed?
6. **What worked well** — strengths in the response
7. **Learning points** — what needs to change?
8. **Actions required** — specific, assigned, time-bound
9. **Regulatory review** — Reg 40 implications, Reg 45 evidence
10. **Review and sign-off date**

This is a learning document, not a disciplinary one. Tone: ${input.tone}.`;

    case "risk_review":
      return `## Instructions — Risk Review

Generate a structured risk review. Include:

1. **Current risk summary** — child, home, or specific concern
2. **Evidence from the past 30 days** — incidents, daily logs, patterns
3. **Risk indicators present** — what are the warning signs?
4. **Protective factors** — what is working?
5. **Escalation triggers** — what would change the risk level?
6. **Recommended actions** — for manager review and approval
7. **Regulatory relevance** — Reg 45 evidence implications
8. **Review date** — when should this be revisited?

Be factual. Do not speculate beyond available evidence. Flag all limitations.
Tone: ${input.tone}. Framework: ${input.framework}.`;

    case "safeguarding_review":
      return `## Instructions — Safeguarding Review

Generate a structured safeguarding review. Include:

1. **Safeguarding concern summary** — nature, date, child(ren) affected
2. **Evidence gathered** — records reviewed, staff accounts
3. **Child voice** — what has the child said, disclosed, or indicated?
4. **Current protective factors**
5. **Risk assessment** — severity, immediacy, pattern
6. **Actions already taken** — referrals, notifications, responses
7. **Actions required** — with owner and deadline
8. **Section 47 / Reg 40 / Ofsted notification consideration**
9. **Review and monitoring plan**

Use ${input.framework}. Tone: ${input.tone}. This is a serious statutory document.`;

    case "reg45_summary":
      return `## Instructions — Regulation 45 Evidence Summary

Generate a Regulation 45 evidence summary. Include:

1. **Period covered**
2. **Quality of care overview** — positive indicators and concerns
3. **Children's outcomes** — progress, wellbeing, voice, rights
4. **Incidents and patterns** — what they show about quality
5. **Safeguarding** — summary of concerns, referrals, outcomes
6. **Missing from care** — episodes, patterns, responses
7. **Regulatory compliance** — Reg 40, Annex A readiness
8. **Management and oversight** — quality of oversight demonstrated
9. **Key themes for the Regulation 45 report**
10. **Suggested report sections**

This is evidence for the RI, not the final report. Tone: ${input.tone}.`;

    case "staff_training":
      return `## Instructions — Staff Training Resource

Generate a staff training resource. Include:

1. **Learning objective** — what staff will understand or be able to do
2. **Target audience** — e.g. all staff, managers, night staff
3. **Background and context** — why this training is needed
4. **Core content** — key learning points, structured into sections
5. **Case study or scenario** — practical application (anonymised)
6. **Reflection questions** — for individual or group use
7. **Key takeaways** — three to five key messages
8. **Further reading or guidance** — signpost to relevant policy

Use ${input.framework} principles. Tone: ${input.tone}. Mode: ${input.creativeMode}.`;

    case "child_friendly_explanation":
      return `## Instructions — Child-Friendly Explanation

Generate a child-friendly explanation or resource. Include:

1. **What this is about** — in simple, accessible language
2. **Key message** — the one thing the child needs to understand
3. **What this means for me** — personal, relatable
4. **What happens next** — clear, honest
5. **My rights** — what the child can expect and ask for
6. **Who can help me** — specific, trusted people
7. **How to share my view** — child's voice section

Use age-appropriate language. Avoid jargon. Warm, honest, respectful tone.
Framework: ${input.framework}. Never use language that could be frightening.`;

    case "child_friendly_worksheet":
      return `## Instructions — Child-Friendly Worksheet

Generate an interactive worksheet for a child. Include:

1. **Title** — engaging, age-appropriate
2. **Introduction** — why we're doing this together
3. **Section 1: About me** — self-expression prompts
4. **Section 2: My feelings** — emotional literacy prompts
5. **Section 3: What I like / what's hard** — strengths and challenges
6. **Section 4: What I want** — aspirations and wishes
7. **Section 5: My plan** — simple, achievable steps

Use drawings prompts if relevant. Keep language simple. Framework: ${input.framework}.`;

    case "social_worker_update":
      return `## Instructions — Social Worker Update

Generate a structured update for the child's social worker. Include:

1. **Period covered**
2. **Child's general welfare and wellbeing** — honest, evidence-based
3. **Key events** — incidents, health, education, family contact
4. **Child's progress** — measurable, positive where real
5. **Concerns and risks** — current, emerging
6. **Placement stability** — strengths and challenges
7. **Placement plan compliance** — what's being met, what isn't
8. **Actions requested from social worker** — specific asks
9. **Upcoming reviews and meetings**

Professional, factual, fair tone. Framework: ${input.framework}.`;

    case "supervision_prompt":
      return `## Instructions — Supervision Prompt

Generate a structured supervision discussion prompt. Include:

1. **Staff member's recent experience** — key events to discuss
2. **Case discussion prompts** — children and situations to review
3. **Professional development** — skills, learning, training needs
4. **Wellbeing check** — how is the staff member doing?
5. **Performance discussion** — strengths and development areas
6. **Actions from last supervision** — review progress
7. **New actions** — agreed, time-bound
8. **Next supervision date**

Framework: ${input.framework}. Tone: ${input.tone}. Supportive and developmental.`;

    case "scenario_simulation":
      return `## Instructions — Scenario Simulation

Generate a realistic practice scenario for training or reflective practice. Include:

1. **Scenario title and overview**
2. **Background** — setting, characters (anonymised), context
3. **The situation** — what happens, in stages
4. **Prompts for participants** — what would you do? What are you noticing?
5. **Common responses** — what might staff typically do?
6. **Better practice response** — what does good look like?
7. **Framework application** — how does ${input.framework} apply here?
8. **Discussion questions** — for group debrief
9. **Key learning points**

Framework: ${input.framework}. Mode: ${input.creativeMode}.`;

    case "team_meeting_discussion":
      return `## Instructions — Team Discussion Guide

Generate a facilitated team practice discussion, designed the way a practitioner-researcher would. Include:

1. **Purpose** — the practice shift this discussion is for, in one sentence
2. **The theory, briefly** — two short paragraphs naming the framework (${input.framework}) and what the evidence says
3. **A realistic vignette** — drawn ONLY from the source material provided; if none, a clearly-labelled generic example
4. **Discussion questions (6–8)** — moving from noticing → interpreting (what might the behaviour communicate?) → responding → team culture
5. **Common pitfalls** — including judgemental-language traps and quick-fix thinking
6. **Agreed practice commitments** — a short template the team completes together
7. **Five-minute follow-up** — how to check the commitments at the next meeting

Reflective, not tick-box. Runnable in 30–45 minutes by a deputy with no preparation time. Tone: ${input.tone}. Mode: ${input.creativeMode}.`;

    default:
      return `## Instructions — ${input.artifactType.replace(/_/g, " ")}

Generate a high-quality, professional ${input.artifactType.replace(/_/g, " ")} appropriate for a children's residential home.

Use clear Markdown headings to structure the output. Include:
- A clear purpose statement
- Evidence summary (what is known)
- Main content appropriate to the type
- Any safeguarding considerations
- Suggested actions (for human review and approval)
- Review date / next steps

Framework: ${input.framework}. Tone: ${input.tone}. Mode: ${input.creativeMode}.

Mark all content as an AI draft requiring human review.`;
  }
}

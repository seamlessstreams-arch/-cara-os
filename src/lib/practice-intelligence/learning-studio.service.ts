// ══════════════════════════════════════════════════════════════════════════════
// PRACTICE INTELLIGENCE — LEARNING STUDIO SERVICE
//
// Generates learning resources across 21+ formats: training sessions, quizzes,
// flashcards, questionnaires, infographics, competency checklists, role-play
// scenarios, case studies, PACE language alternatives, ARC formulation cards,
// reflective workbooks, micro-learning modules, and more.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import { generateStudioContent } from "@/lib/cara-studio/ai-provider.service";
import { EXTENDED_FRAMEWORK_PROMPTS, TONE_PROMPTS, CARA_STUDIO_SYSTEM_PROMPT } from "@/lib/cara-studio/prompts";
import type {
  LearningResource,
  LearningResourceType,
  PracticeIntelligenceFramework,
} from "@/types/practice-intelligence";
import { LEARNING_RESOURCE_TYPE_LABELS } from "@/types/practice-intelligence";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

// ── Resource type prompt fragments ──────────────────────────────────────────

const RESOURCE_TYPE_PROMPTS: Record<LearningResourceType, { instruction: string; outputFields: string[] }> = {
  staff_training: {
    instruction: "Generate a full staff training session with learning objectives, activities, discussion prompts, and assessment.",
    outputFields: ["title", "learning_objectives", "trainer_notes", "case_study", "discussion_prompts", "reflective_questions", "knowledge_check", "expected_standards", "supervision_follow_up", "competency_check"],
  },
  quiz: {
    instruction: "Generate a knowledge-check quiz. Include questions with multiple choice answers, correct answer markers, and explanations.",
    outputFields: ["title", "context", "questions (question, options, correct_answer, explanation)", "pass_mark", "further_reading"],
  },
  flashcards: {
    instruction: "Generate flashcard content for learning. Each card has a front (question/prompt) and back (answer/explanation).",
    outputFields: ["topic", "cards (front, back)", "usage_guidance"],
  },
  questionnaire: {
    instruction: "Generate a professional questionnaire or self-assessment tool.",
    outputFields: ["title", "purpose", "instructions", "questions (text, type, options)", "scoring", "interpretation_guide"],
  },
  infographic: {
    instruction: "Generate content for an infographic — key facts, statistics, and visual callouts in a structured format.",
    outputFields: ["title", "headline", "key_facts", "statistics", "visual_sections", "call_to_action", "sources"],
  },
  competency_checklist: {
    instruction: "Generate a competency checklist for staff self-assessment or supervisor assessment.",
    outputFields: ["title", "competency_area", "items (description, indicators, evidence_expected)", "rating_scale", "action_planning"],
  },
  role_play_scenario: {
    instruction: "Generate a role-play scenario from anonymised practice themes for staff training.",
    outputFields: ["title", "context", "characters", "scenario_setup", "staff_decision_points", "good_practice", "poor_practice_risks", "debrief_questions", "learning_points"],
  },
  case_study_exercise: {
    instruction: "Generate a case study exercise based on anonymised practice themes for staff development.",
    outputFields: ["title", "scenario", "background", "current_situation", "questions_for_discussion", "key_learning_points", "regulatory_links", "model_answers"],
  },
  pace_language_alternatives: {
    instruction: "Generate a PACE language alternatives resource. Show common staff phrases and their PACE-informed alternatives.",
    outputFields: ["title", "introduction", "alternatives (instead_of, try_this, why_it_works)", "practice_tips", "further_reading"],
  },
  arc_formulation_cards: {
    instruction: "Generate ARC formulation cards — portable reference cards covering Attachment, Regulation, and Competency domains.",
    outputFields: ["title", "attachment_cards", "regulation_cards", "competency_cards", "how_to_use", "quick_reference"],
  },
  reflective_workbook: {
    instruction: "Generate a reflective practice workbook with scenarios, questions, and action planning spaces.",
    outputFields: ["title", "sections (topic, scenario, reflective_questions, theory_links, practice_application, action_planning)"],
  },
  micro_learning: {
    instruction: "Generate a micro-learning module — short, focused, 5-minute learning on one specific topic.",
    outputFields: ["title", "learning_point", "key_content", "example", "reflection_prompt", "quick_check"],
  },
  video_briefing_script: {
    instruction: "Generate a script for a short video briefing suitable for staff viewing.",
    outputFields: ["title", "intro", "key_messages", "visual_cues", "call_to_action", "closing"],
  },
  audio_briefing_script: {
    instruction: "Generate a script for an audio briefing or podcast-style learning.",
    outputFields: ["title", "opening", "key_points", "actions", "closing"],
  },
  slide_deck: {
    instruction: "Generate a slide deck outline with content for each slide.",
    outputFields: ["title", "slides (title, content, speaker_notes)", "summary_slide"],
  },
  poster: {
    instruction: "Generate content for a wall poster or visual display for the staff room or young person's space.",
    outputFields: ["title", "headline", "key_messages", "visual_elements", "call_to_action"],
  },
  quick_reference_card: {
    instruction: "Generate a quick reference card — a pocket-sized summary of key information for daily use.",
    outputFields: ["title", "key_points", "dos", "donts", "emergency_contacts_placeholder", "further_info"],
  },
  policy_summary: {
    instruction: "Generate a plain English policy summary accessible to all staff.",
    outputFields: ["title", "policy_name", "summary", "key_requirements", "staff_responsibilities", "where_to_find_full_policy", "review_date"],
  },
  supervision_prompt_pack: {
    instruction: "Generate a pack of supervision discussion prompts based on practice themes.",
    outputFields: ["title", "context", "prompts (topic, question, follow_up)", "wellbeing_check", "action_template"],
  },
  team_meeting_pack: {
    instruction: "Generate a team meeting discussion pack with agenda items and discussion prompts.",
    outputFields: ["title", "agenda_items", "discussion_prompts", "practice_themes", "actions_template", "reflection_prompt"],
  },
  induction_guide: {
    instruction: "Generate an induction guide section for new staff joining the home.",
    outputFields: ["title", "welcome", "key_information", "children_overview", "home_values", "daily_routines", "key_policies", "who_to_ask", "first_week_checklist"],
  },
};

// ── Generate resource ───────────────────────────────────────────────────────

export async function generateLearningResource(opts: {
  resourceType: LearningResourceType;
  topic: string;
  framework?: PracticeIntelligenceFramework;
  tone?: string;
  targetAudience?: LearningResource["target_audience"];
  readingLevel?: string;
  additionalContext?: string;
  homeId?: string;
  createdBy: string;
}): Promise<LearningResource> {
  const hid = opts.homeId ?? homeId();
  const sb = createServerClient();

  const typeConfig = RESOURCE_TYPE_PROMPTS[opts.resourceType];
  const frameworkPrompt = opts.framework ? (EXTENDED_FRAMEWORK_PROMPTS[opts.framework] ?? "") : "";
  const tonePrompt = opts.tone ? (TONE_PROMPTS[opts.tone as keyof typeof TONE_PROMPTS] ?? "") : TONE_PROMPTS.training_focused;

  const systemPrompt = [
    CARA_STUDIO_SYSTEM_PROMPT,
    "",
    "--- RESOURCE TYPE ---",
    typeConfig.instruction,
    "",
    `--- OUTPUT FIELDS ---\n${typeConfig.outputFields.join(", ")}`,
    "",
    frameworkPrompt ? `--- THERAPEUTIC FRAMEWORK ---\n${frameworkPrompt}` : "",
    `--- TONE ---\n${tonePrompt}`,
    opts.readingLevel ? `\n--- READING LEVEL ---\nTarget reading level: ${opts.readingLevel}` : "",
    opts.targetAudience === "child" ? "\n--- AUDIENCE ---\nThis resource is for children/young people. Use age-appropriate, simple language." : "",
  ].filter(Boolean).join("\n");

  const userPrompt = [
    `Generate a ${LEARNING_RESOURCE_TYPE_LABELS[opts.resourceType]} on the topic: "${opts.topic}"`,
    opts.additionalContext ? `\n--- ADDITIONAL CONTEXT ---\n${opts.additionalContext}` : "",
  ].filter(Boolean).join("\n");

  let content: Record<string, unknown> = {};
  try {
    const aiResponse = await generateStudioContent(systemPrompt, userPrompt);
    try {
      const jsonMatch = aiResponse.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) content = JSON.parse(jsonMatch[0]);
      else content = { raw_content: aiResponse.content };
    } catch {
      content = { raw_content: aiResponse.content };
    }
  } catch {
    content = getDefaultContent(opts.resourceType, opts.topic);
  }

  const title = `${LEARNING_RESOURCE_TYPE_LABELS[opts.resourceType]} — ${opts.topic}`;

  if (sb) {
    const record = {
      home_id: hid,
      resource_type: opts.resourceType,
      title,
      description: `Generated ${LEARNING_RESOURCE_TYPE_LABELS[opts.resourceType]} on "${opts.topic}"`,
      target_audience: opts.targetAudience ?? "staff",
      format: opts.resourceType,
      content,
      preferences: {},
      tags: [opts.topic, opts.framework ?? "general"].filter(Boolean),
      framework: opts.framework ?? null,
      reading_level: opts.readingLevel ?? null,
      communication_needs: [],
      neurodiversity_adaptations: [],
      status: "draft",
      use_count: 0,
      created_by: opts.createdBy,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb.from("learning_resources") as any)
      .insert(record)
      .select("*")
      .single();

    if (!error && data) return mapDbToResource(data);
  }

  return {
    id: crypto.randomUUID(),
    home_id: hid,
    resource_type: opts.resourceType,
    title,
    description: `Generated ${LEARNING_RESOURCE_TYPE_LABELS[opts.resourceType]} on "${opts.topic}"`,
    target_audience: opts.targetAudience ?? "staff",
    format: opts.resourceType,
    content,
    preferences: {},
    tags: [opts.topic, opts.framework ?? "general"].filter(Boolean),
    framework: opts.framework ?? null,
    reading_level: opts.readingLevel ?? null,
    communication_needs: [],
    neurodiversity_adaptations: [],
    status: "draft",
    use_count: 0,
    created_by: opts.createdBy,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ── List resources ──────────────────────────────────────────────────────────

export async function listLearningResources(opts?: {
  resourceType?: LearningResourceType;
  targetAudience?: string;
  framework?: string;
  status?: string;
  homeId?: string;
  limit?: number;
}): Promise<LearningResource[]> {
  const sb = createServerClient();
  const hid = opts?.homeId ?? homeId();

  if (!sb) return getDemoResources(hid);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (sb.from("learning_resources") as any)
    .select("*")
    .eq("home_id", hid)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 20);

  if (opts?.resourceType) query = query.eq("resource_type", opts.resourceType);
  if (opts?.targetAudience) query = query.eq("target_audience", opts.targetAudience);
  if (opts?.status) query = query.eq("status", opts.status);

  const { data, error } = await query;
  if (error) return getDemoResources(hid);
  return (data ?? []).map(mapDbToResource);
}

// ── Publish resource ────────────────────────────────────────────────────────

export async function publishLearningResource(resourceId: string): Promise<LearningResource> {
  const sb = createServerClient();
  if (!sb) throw new Error("Database connection required");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("learning_resources") as any)
    .update({ status: "published", updated_at: new Date().toISOString() })
    .eq("id", resourceId)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to publish resource: ${error.message}`);
  return mapDbToResource(data);
}

// ── Get resource type groups ────────────────────────────────────────────────

export interface ResourceTypeGroup {
  group: string;
  types: { type: LearningResourceType; label: string }[];
}

export function getResourceTypeGroups(): ResourceTypeGroup[] {
  return [
    {
      group: "Training Sessions",
      types: [
        { type: "staff_training", label: "Staff Training Session" },
        { type: "role_play_scenario", label: "Role-Play Scenario" },
        { type: "case_study_exercise", label: "Case Study Exercise" },
      ],
    },
    {
      group: "Knowledge Checks",
      types: [
        { type: "quiz", label: "Knowledge Quiz" },
        { type: "flashcards", label: "Flashcard Set" },
        { type: "questionnaire", label: "Questionnaire" },
        { type: "competency_checklist", label: "Competency Checklist" },
      ],
    },
    {
      group: "Therapeutic Tools",
      types: [
        { type: "pace_language_alternatives", label: "PACE Language Alternatives" },
        { type: "arc_formulation_cards", label: "ARC Formulation Cards" },
        { type: "reflective_workbook", label: "Reflective Workbook" },
      ],
    },
    {
      group: "Quick Reference",
      types: [
        { type: "quick_reference_card", label: "Quick Reference Card" },
        { type: "infographic", label: "Infographic" },
        { type: "poster", label: "Poster / Wall Display" },
        { type: "policy_summary", label: "Policy Summary" },
      ],
    },
    {
      group: "Briefings & Packs",
      types: [
        { type: "micro_learning", label: "Micro-Learning Module" },
        { type: "video_briefing_script", label: "Video Briefing Script" },
        { type: "audio_briefing_script", label: "Audio Briefing Script" },
        { type: "slide_deck", label: "Slide Deck" },
        { type: "supervision_prompt_pack", label: "Supervision Prompt Pack" },
        { type: "team_meeting_pack", label: "Team Meeting Pack" },
        { type: "induction_guide", label: "Induction Guide" },
      ],
    },
  ];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDefaultContent(resourceType: LearningResourceType, topic: string): Record<string, unknown> {
  const base = { title: `${LEARNING_RESOURCE_TYPE_LABELS[resourceType]} — ${topic}`, topic, generated: false };

  if (resourceType === "quiz") {
    return {
      ...base,
      questions: [
        { question: `What is the key principle of ${topic}?`, options: ["Option A", "Option B", "Option C", "Option D"], correct_answer: "Option A", explanation: "Explanation here" },
      ],
      pass_mark: 80,
    };
  }

  if (resourceType === "flashcards") {
    return { ...base, cards: [{ front: `What is ${topic}?`, back: `${topic} is a key concept in therapeutic care practice.` }] };
  }

  return base;
}

function mapDbToResource(row: Record<string, unknown>): LearningResource {
  return {
    id: row.id as string,
    home_id: row.home_id as string,
    resource_type: row.resource_type as LearningResourceType,
    title: row.title as string,
    description: (row.description as string) ?? null,
    target_audience: (row.target_audience as LearningResource["target_audience"]) ?? "staff",
    format: (row.format as string) ?? "document",
    content: (row.content as Record<string, unknown>) ?? {},
    preferences: (row.preferences as Record<string, unknown>) ?? {},
    tags: (row.tags as string[]) ?? [],
    framework: (row.framework as PracticeIntelligenceFramework) ?? null,
    reading_level: (row.reading_level as string) ?? null,
    communication_needs: (row.communication_needs as string[]) ?? [],
    neurodiversity_adaptations: (row.neurodiversity_adaptations as string[]) ?? [],
    status: (row.status as LearningResource["status"]) ?? "draft",
    use_count: (row.use_count as number) ?? 0,
    created_by: row.created_by as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function getDemoResources(hid: string): LearningResource[] {
  return [
    {
      id: "demo-lr-1", home_id: hid, resource_type: "staff_training", title: "De-escalation Techniques — Trauma-Informed Approach",
      description: "Training session generated from recent incident patterns.", target_audience: "staff", format: "staff_training",
      content: { learning_objectives: ["Understand de-escalation stages", "Apply PACE in crisis moments", "Recognise early warning signs"], trainer_notes: "Use the recent anonymised scenarios for discussion." },
      preferences: {}, tags: ["de-escalation", "trauma-informed"], framework: "trauma_informed",
      reading_level: null, communication_needs: [], neurodiversity_adaptations: [],
      status: "published", use_count: 4, created_by: "user-rm-1", created_at: "2026-05-05T09:00:00Z", updated_at: "2026-05-05T09:00:00Z",
    },
    {
      id: "demo-lr-2", home_id: hid, resource_type: "quick_reference_card", title: "PACE Language — Quick Reference",
      description: "Pocket card for staff with PACE language alternatives.", target_audience: "staff", format: "quick_reference_card",
      content: {
        alternatives: [
          { instead_of: "Stop doing that!", try_this: "I can see something is really bothering you. Can we figure it out together?", why_it_works: "Curiosity over command reduces shame and defensiveness." },
          { instead_of: "You need to calm down", try_this: "This feels really big right now. I'm going to stay right here with you.", why_it_works: "Empathy and presence support co-regulation." },
          { instead_of: "Why did you do that?", try_this: "I'm curious about what was going on for you when that happened.", why_it_works: "Curiosity without accusation opens dialogue." },
        ],
      },
      preferences: {}, tags: ["PACE", "language"], framework: "pace",
      reading_level: null, communication_needs: [], neurodiversity_adaptations: [],
      status: "published", use_count: 12, created_by: "user-rm-1", created_at: "2026-04-20T10:00:00Z", updated_at: "2026-04-20T10:00:00Z",
    },
    {
      id: "demo-lr-3", home_id: hid, resource_type: "quiz", title: "Safeguarding Level 3 — Knowledge Check",
      description: "Quick quiz on safeguarding responsibilities.", target_audience: "staff", format: "quiz",
      content: {
        questions: [
          { question: "What is the first thing you should do if a child makes a disclosure?", options: ["Write it down immediately", "Listen, reassure, record", "Tell the child's parents", "Call the police"], correct_answer: "Listen, reassure, record", explanation: "The priority is to listen, reassure the child, and record what they say as soon as possible after the conversation." },
          { question: "Who is the designated safeguarding lead in your home?", options: ["The Registered Manager", "Any senior staff", "The most experienced worker", "It depends on the rota"], correct_answer: "The Registered Manager", explanation: "The RM is the designated safeguarding lead. Deputies should be identified for when they are unavailable." },
        ],
        pass_mark: 80,
      },
      preferences: {}, tags: ["safeguarding", "quiz"], framework: null,
      reading_level: null, communication_needs: [], neurodiversity_adaptations: [],
      status: "published", use_count: 8, created_by: "user-rm-1", created_at: "2026-04-25T14:00:00Z", updated_at: "2026-04-25T14:00:00Z",
    },
  ];
}

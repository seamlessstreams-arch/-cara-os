// ══════════════════════════════════════════════════════════════════════════════
// PRACTICE INTELLIGENCE — SESSION BUILDER SERVICE
//
// Generates therapeutic session plans for 35+ session types. Each session is
// built from evidence, shaped by the chosen framework & tone, and includes
// full delivery content: purpose, rationale, activities, reflective questions,
// risk considerations, recording template, and follow-up actions.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import { generateStudioContent } from "@/lib/cara-studio/ai-provider.service";
import { EXTENDED_FRAMEWORK_PROMPTS, TONE_PROMPTS, CARA_STUDIO_SYSTEM_PROMPT } from "@/lib/cara-studio/prompts";
import type {
  GeneratedSession,
  SessionContent,
  SessionType,
  PracticeIntelligenceFramework,
  EvidenceLink,
  SessionAction,
  PlanUpdateSuggestion,
  SESSION_TYPE_LABELS,
} from "@/types/practice-intelligence";
import { SESSION_TYPE_LABELS as LABELS } from "@/types/practice-intelligence";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

// ── Session type prompt fragments ───────────────────────────────────────────

const SESSION_TYPE_PROMPTS: Record<SessionType, string> = {
  keywork_session: "Generate a key work session plan. Include therapeutic rationale, child-friendly opening, reflective questions, creative activity options, and follow-up actions.",
  direct_work_session: "Generate a direct work session plan focused on therapeutic activities and structured engagement.",
  life_story_work: "Generate a life story work session. Handle with extreme sensitivity — this explores the child's history, identity, and journey. Use age-appropriate creative tools.",
  identity_work: "Generate an identity work session. Explore who the child is, their heritage, culture, strengths, and aspirations. Be affirming and celebratory.",
  feelings_exploration: "Generate a feelings exploration session. Help the child identify, name, and understand their emotions in a safe, non-threatening way.",
  anger_management: "Generate an anger management session. Avoid pathologising anger — it's a valid emotion. Focus on understanding triggers and developing healthy expression strategies.",
  anxiety_support: "Generate an anxiety support session. Normalise anxiety as a protective response. Teach grounding techniques and coping strategies.",
  bereavement_grief: "Generate a bereavement and grief session. This includes grief for lost relationships, lost childhoods, and ambiguous loss. Handle with deep sensitivity.",
  self_esteem_building: "Generate a self-esteem building session. Focus on recognising strengths, achievements, and positive qualities. Be genuine — avoid empty praise.",
  social_skills: "Generate a social skills session. Use practical, fun activities. Consider the child's developmental age and communication needs.",
  healthy_relationships: "Generate a healthy relationships session. Cover trust, boundaries, consent, and what healthy friendships and adult relationships look like.",
  emotional_regulation: "Generate an emotional regulation session. Teach co-regulation strategies, window of tolerance concepts (age-appropriately), and practical calming techniques.",
  mindfulness_grounding: "Generate a mindfulness and grounding session. Use sensory-based activities. Make it accessible — avoid jargon. Consider neurodivergent adaptations.",
  resilience_building: "Generate a resilience building session. Recognise existing resilience. Build on what's already working rather than implying the child needs to be 'tougher'.",
  transition_preparation: "Generate a transition preparation session. Whether moving placement, school, or approaching independence — prepare practically and emotionally.",
  independence_skills: "Generate an independence skills session. Make it practical, fun, and age-appropriate. Cover real-world skills the child will need.",
  leaving_care_prep: "Generate a leaving care preparation session. Cover housing, finances, health, education, social networks, and emotional readiness. Be realistic but hopeful.",
  contact_preparation: "Generate a contact preparation session. Help the child prepare emotionally for family contact. Include coping strategies for before, during, and after.",
  contact_debrief: "Generate a contact debrief session. Process what happened during contact. Validate emotions. Check what support is needed.",
  family_work: "Generate a family work session plan. Consider the complexity of family relationships for looked-after children. Be non-judgemental about birth family.",
  safety_planning: "Generate a safety planning session. Cover specific risks identified for this child. Include 'who I can talk to', 'what I can do', and 'my safe places'.",
  return_from_missing: "Generate a return from missing conversation plan. Follow statutory guidance. Be warm, non-judgemental, and focused on safety and understanding.",
  exploitation_awareness: "Generate an exploitation awareness session. Age-appropriate education on criminal and sexual exploitation. Empower without frightening.",
  online_safety: "Generate an online safety session. Cover social media, gaming, sharing images, online relationships. Be realistic about how young people use technology.",
  substance_awareness: "Generate a substance awareness session. Be factual, non-judgemental. Use harm reduction principles alongside education.",
  consent_boundaries: "Generate a consent and boundaries session. Cover bodily autonomy, personal boundaries, consent in relationships, and the right to say no.",
  education_motivation: "Generate an education motivation session. Explore barriers to engagement. Connect education to the child's interests and aspirations.",
  aspiration_building: "Generate an aspiration building session. Help the child dream about their future. Challenge limiting beliefs. Provide practical pathways.",
  career_exploration: "Generate a career exploration session. Connect interests and strengths to potential careers. Make it exciting and achievable.",
  cultural_identity: "Generate a cultural identity session. Celebrate the child's heritage and culture. Address any experiences of racism or discrimination sensitively.",
  gender_identity_support: "Generate a gender identity support session. Be affirming, informed, and respectful. Follow the child's lead on language and identity.",
  faith_spirituality: "Generate a faith and spirituality session. Respect the child's beliefs or exploration. Be inclusive and non-prescriptive.",
  reflective_practice: "Generate a staff reflective practice session. Support the team to reflect on recent practice themes, emotional impact, and learning.",
  team_formulation: "Generate a team formulation session. Bring the team together to build a shared understanding of a child's needs using a formulation model.",
  debrief_session: "Generate a staff debrief session following a significant event. Process emotional impact, identify learning, and plan support.",
};

// ── Generate session ────────────────────────────────────────────────────────

export async function generateSession(opts: {
  sessionType: SessionType;
  childId?: string;
  framework?: PracticeIntelligenceFramework;
  tone?: string;
  additionalContext?: string;
  homeId?: string;
  createdBy: string;
}): Promise<GeneratedSession> {
  const hid = opts.homeId ?? homeId();
  const sb = createServerClient();

  // Gather child evidence if available
  let evidenceContext = "";
  if (sb && opts.childId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sources } = await (sb.from("cara_studio_sources") as any)
      .select("source_type, title, summary, content, source_date")
      .eq("home_id", hid)
      .eq("child_id", opts.childId)
      .order("source_date", { ascending: false })
      .limit(15);

    if (sources?.length) {
      evidenceContext = (sources as Array<{ source_type: string; title: string; summary: string; content: string; source_date: string }>)
        .map((s) => `[${s.source_type}] ${s.title ?? "Untitled"} (${s.source_date ?? ""})\n${s.summary ?? s.content ?? ""}`)
        .join("\n\n---\n\n");
    }

    // Also fetch therapeutic profile if exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (sb.from("therapeutic_profiles") as any)
      .select("known_triggers, known_soothing_strategies, what_helps, what_does_not_help, communication_style, current_presentation")
      .eq("home_id", hid)
      .eq("child_id", opts.childId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (profile) {
      evidenceContext += "\n\n--- THERAPEUTIC PROFILE ---\n";
      evidenceContext += `Triggers: ${JSON.stringify(profile.known_triggers)}\n`;
      evidenceContext += `Soothing: ${JSON.stringify(profile.known_soothing_strategies)}\n`;
      evidenceContext += `What helps: ${JSON.stringify(profile.what_helps)}\n`;
      evidenceContext += `What doesn't help: ${JSON.stringify(profile.what_does_not_help)}\n`;
      evidenceContext += `Communication style: ${profile.communication_style ?? "Not recorded"}\n`;
      evidenceContext += `Current presentation: ${profile.current_presentation ?? "Not recorded"}`;
    }
  }

  // Build prompt
  const typePrompt = SESSION_TYPE_PROMPTS[opts.sessionType];
  const frameworkPrompt = opts.framework ? (EXTENDED_FRAMEWORK_PROMPTS[opts.framework] ?? "") : "";
  const tonePrompt = opts.tone ? (TONE_PROMPTS[opts.tone as keyof typeof TONE_PROMPTS] ?? "") : TONE_PROMPTS.therapeutic;

  const systemPrompt = [
    CARA_STUDIO_SYSTEM_PROMPT,
    "",
    "--- SESSION TYPE ---",
    typePrompt,
    "",
    "--- OUTPUT STRUCTURE ---",
    "Return a JSON object with the following fields:",
    "purpose, therapeutic_rationale, staff_preparation, emotional_safety, opening, main_activity, reflective_questions (array), creative_option, scaling_question, risk_considerations, what_to_avoid, recording_template, materials_needed (array), estimated_duration, age_appropriateness, adaptations (array)",
    "",
    frameworkPrompt ? `--- THERAPEUTIC FRAMEWORK ---\n${frameworkPrompt}` : "",
    "",
    `--- TONE ---\n${tonePrompt}`,
  ].filter(Boolean).join("\n");

  const userPrompt = [
    `Generate a ${LABELS[opts.sessionType]} session plan.`,
    "",
    "--- EVIDENCE ---",
    evidenceContext || "No specific evidence available. Generate based on general therapeutic best practice.",
    "",
    opts.additionalContext ? `--- ADDITIONAL CONTEXT ---\n${opts.additionalContext}` : "",
  ].filter(Boolean).join("\n");

  // Call AI
  let sessionContent: SessionContent;
  try {
    const aiResponse = await generateStudioContent(systemPrompt, userPrompt);
    sessionContent = parseSessionContent(aiResponse.content);
  } catch {
    sessionContent = getDefaultSessionContent(opts.sessionType);
  }

  const title = `${LABELS[opts.sessionType]} — ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`;

  // Persist if DB available
  if (sb) {
    const record = {
      home_id: hid,
      child_id: opts.childId ?? null,
      session_type: opts.sessionType,
      title,
      framework: opts.framework ?? null,
      tone: opts.tone ?? "therapeutic",
      status: "draft",
      content: sessionContent,
      evidence_links: [],
      quality_score: null,
      scheduled_date: null,
      delivered_at: null,
      delivered_by: null,
      recording_notes: null,
      follow_up_actions: [],
      plan_update_suggestions: [],
      created_by: opts.createdBy,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb.from("generated_sessions") as any)
      .insert(record)
      .select("*")
      .single();

    if (!error && data) {
      return mapDbToSession(data);
    }
  }

  // Demo/fallback
  return {
    id: crypto.randomUUID(),
    home_id: hid,
    child_id: opts.childId ?? null,
    session_type: opts.sessionType,
    title,
    framework: opts.framework ?? null,
    tone: opts.tone ?? "therapeutic",
    status: "draft",
    content: sessionContent,
    evidence_links: [],
    quality_score: null,
    scheduled_date: null,
    delivered_at: null,
    delivered_by: null,
    recording_notes: null,
    follow_up_actions: [],
    plan_update_suggestions: [],
    approved_by: null,
    approved_at: null,
    created_by: opts.createdBy,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ── List sessions ───────────────────────────────────────────────────────────

export async function listGeneratedSessions(opts?: {
  childId?: string;
  sessionType?: SessionType;
  status?: string;
  homeId?: string;
  limit?: number;
}): Promise<GeneratedSession[]> {
  const sb = createServerClient();
  const hid = opts?.homeId ?? homeId();

  if (!sb) return getDemoSessions(hid);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (sb.from("generated_sessions") as any)
    .select("*")
    .eq("home_id", hid)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 20);

  if (opts?.childId) query = query.eq("child_id", opts.childId);
  if (opts?.sessionType) query = query.eq("session_type", opts.sessionType);
  if (opts?.status) query = query.eq("status", opts.status);

  const { data, error } = await query;
  if (error) return getDemoSessions(hid);
  return (data ?? []).map(mapDbToSession);
}

// ── Approve session ─────────────────────────────────────────────────────────

export async function approveSession(sessionId: string, approvedBy: string): Promise<GeneratedSession> {
  const sb = createServerClient();
  if (!sb) throw new Error("Database connection required");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("generated_sessions") as any)
    .update({
      status: "approved",
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to approve session: ${error.message}`);
  return mapDbToSession(data);
}

// ── Record delivery ─────────────────────────────────────────────────────────

export async function recordSessionDelivery(
  sessionId: string,
  deliveredBy: string,
  notes?: string,
  followUpActions?: SessionAction[],
): Promise<GeneratedSession> {
  const sb = createServerClient();
  if (!sb) throw new Error("Database connection required");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("generated_sessions") as any)
    .update({
      status: "delivered",
      delivered_by: deliveredBy,
      delivered_at: new Date().toISOString(),
      recording_notes: notes ?? null,
      follow_up_actions: followUpActions ?? [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to record delivery: ${error.message}`);
  return mapDbToSession(data);
}

// ── Get available session types with grouping ───────────────────────────────

export interface SessionTypeGroup {
  group: string;
  types: { type: SessionType; label: string }[];
}

export function getSessionTypeGroups(): SessionTypeGroup[] {
  return [
    {
      group: "Therapeutic Work",
      types: [
        { type: "keywork_session", label: "Key Work Session" },
        { type: "direct_work_session", label: "Direct Work Session" },
        { type: "life_story_work", label: "Life Story Work" },
        { type: "identity_work", label: "Identity Work" },
        { type: "feelings_exploration", label: "Feelings Exploration" },
      ],
    },
    {
      group: "Emotional Support",
      types: [
        { type: "anger_management", label: "Anger Management" },
        { type: "anxiety_support", label: "Anxiety Support" },
        { type: "bereavement_grief", label: "Bereavement & Grief" },
        { type: "self_esteem_building", label: "Self-Esteem Building" },
        { type: "emotional_regulation", label: "Emotional Regulation" },
        { type: "mindfulness_grounding", label: "Mindfulness & Grounding" },
        { type: "resilience_building", label: "Resilience Building" },
      ],
    },
    {
      group: "Relationships & Social",
      types: [
        { type: "social_skills", label: "Social Skills" },
        { type: "healthy_relationships", label: "Healthy Relationships" },
        { type: "consent_boundaries", label: "Consent & Boundaries" },
      ],
    },
    {
      group: "Contact & Family",
      types: [
        { type: "contact_preparation", label: "Contact Preparation" },
        { type: "contact_debrief", label: "Contact Debrief" },
        { type: "family_work", label: "Family Work" },
      ],
    },
    {
      group: "Safety & Wellbeing",
      types: [
        { type: "safety_planning", label: "Safety Planning" },
        { type: "return_from_missing", label: "Return from Missing" },
        { type: "exploitation_awareness", label: "Exploitation Awareness" },
        { type: "online_safety", label: "Online Safety" },
        { type: "substance_awareness", label: "Substance Awareness" },
      ],
    },
    {
      group: "Transitions & Independence",
      types: [
        { type: "transition_preparation", label: "Transition Preparation" },
        { type: "independence_skills", label: "Independence Skills" },
        { type: "leaving_care_prep", label: "Leaving Care Preparation" },
      ],
    },
    {
      group: "Education & Aspiration",
      types: [
        { type: "education_motivation", label: "Education Motivation" },
        { type: "aspiration_building", label: "Aspiration Building" },
        { type: "career_exploration", label: "Career Exploration" },
      ],
    },
    {
      group: "Identity",
      types: [
        { type: "cultural_identity", label: "Cultural Identity" },
        { type: "gender_identity_support", label: "Gender Identity Support" },
        { type: "faith_spirituality", label: "Faith & Spirituality" },
      ],
    },
    {
      group: "Staff & Team",
      types: [
        { type: "reflective_practice", label: "Reflective Practice" },
        { type: "team_formulation", label: "Team Formulation" },
        { type: "debrief_session", label: "Debrief Session" },
      ],
    },
  ];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseSessionContent(raw: string): SessionContent {
  try {
    // Try JSON parse first
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        purpose: parsed.purpose ?? "",
        therapeutic_rationale: parsed.therapeutic_rationale ?? "",
        staff_preparation: parsed.staff_preparation ?? "",
        emotional_safety: parsed.emotional_safety ?? "",
        opening: parsed.opening ?? "",
        main_activity: parsed.main_activity ?? "",
        reflective_questions: parsed.reflective_questions ?? [],
        creative_option: parsed.creative_option ?? null,
        scaling_question: parsed.scaling_question ?? null,
        risk_considerations: parsed.risk_considerations ?? "",
        what_to_avoid: parsed.what_to_avoid ?? "",
        recording_template: parsed.recording_template ?? "",
        materials_needed: parsed.materials_needed ?? [],
        estimated_duration: parsed.estimated_duration ?? "30-45 minutes",
        age_appropriateness: parsed.age_appropriateness ?? "",
        adaptations: parsed.adaptations ?? [],
      };
    }
  } catch {
    // Fall through to text parsing
  }

  // Text-based parsing fallback
  return {
    purpose: extractSection(raw, "purpose") || "See generated content",
    therapeutic_rationale: extractSection(raw, "therapeutic_rationale") || extractSection(raw, "rationale") || "",
    staff_preparation: extractSection(raw, "staff_preparation") || "",
    emotional_safety: extractSection(raw, "emotional_safety") || "",
    opening: extractSection(raw, "opening") || "",
    main_activity: extractSection(raw, "main_activity") || extractSection(raw, "activity") || raw,
    reflective_questions: [],
    creative_option: null,
    scaling_question: null,
    risk_considerations: extractSection(raw, "risk") || "",
    what_to_avoid: extractSection(raw, "avoid") || "",
    recording_template: extractSection(raw, "recording") || "",
    materials_needed: [],
    estimated_duration: "30-45 minutes",
    age_appropriateness: "",
    adaptations: [],
  };
}

function extractSection(text: string, key: string): string {
  const regex = new RegExp(`(?:^|\\n)\\s*(?:#+\\s*)?${key}[:\\s]*([\\s\\S]*?)(?=\\n(?:#+\\s*)?\\w|$)`, "i");
  const match = text.match(regex);
  return match?.[1]?.trim() ?? "";
}

function getDefaultSessionContent(sessionType: SessionType): SessionContent {
  return {
    purpose: `A ${LABELS[sessionType]} session designed to support the child's therapeutic needs.`,
    therapeutic_rationale: "This session is informed by the child's therapeutic profile and recent evidence. It aims to provide a safe space for exploration and growth.",
    staff_preparation: "Review the child's therapeutic profile before the session. Ensure you are in a calm, regulated state. Prepare the environment to feel safe and welcoming.",
    emotional_safety: "Check in with the child at the start. Give them permission to stop or take a break at any time. Have soothing strategies ready.",
    opening: "Start with a brief check-in: 'How are you feeling right now? If your feelings were a weather forecast, what would today's weather be?'",
    main_activity: "The main activity should be adapted to the child's preferences, communication style, and emotional readiness on the day.",
    reflective_questions: [
      "What was that like for you?",
      "Is there anything you'd like to talk about more next time?",
      "On a scale of 1-10, how comfortable did you feel today?",
    ],
    creative_option: "Offer a creative alternative: drawing, writing, role play, or using emotion cards.",
    scaling_question: "On a scale of 1-10, where 10 is the best you could feel, where are you right now?",
    risk_considerations: "Be aware of the child's known triggers. Have a de-escalation plan ready. If safeguarding concerns arise, follow your safeguarding procedures.",
    what_to_avoid: "Don't push the child to talk about things they're not ready for. Don't promise confidentiality you can't keep. Don't rush the ending.",
    recording_template: "Record: the child's engagement, any significant statements (in their words), emotional presentation, any concerns, follow-up actions.",
    materials_needed: ["Emotion cards or wheel", "Paper and pens", "Quiet space with comfortable seating"],
    estimated_duration: "30-45 minutes",
    age_appropriateness: "Adapt language and activities to the child's developmental age.",
    adaptations: [
      "For younger children: use puppets, drawing, or play-based approaches",
      "For neurodivergent children: provide visual supports, allow movement breaks, use clear concrete language",
      "For children with communication needs: use visual aids, simplified language, or alternative communication methods",
    ],
  };
}

function mapDbToSession(row: Record<string, unknown>): GeneratedSession {
  return {
    id: row.id as string,
    home_id: row.home_id as string,
    child_id: (row.child_id as string) ?? null,
    session_type: row.session_type as SessionType,
    title: row.title as string,
    framework: (row.framework as PracticeIntelligenceFramework) ?? null,
    tone: (row.tone as string) ?? null,
    status: row.status as GeneratedSession["status"],
    content: (row.content as SessionContent) ?? getDefaultSessionContent(row.session_type as SessionType),
    evidence_links: (row.evidence_links as EvidenceLink[]) ?? [],
    quality_score: (row.quality_score as number) ?? null,
    scheduled_date: (row.scheduled_date as string) ?? null,
    delivered_at: (row.delivered_at as string) ?? null,
    delivered_by: (row.delivered_by as string) ?? null,
    recording_notes: (row.recording_notes as string) ?? null,
    follow_up_actions: (row.follow_up_actions as SessionAction[]) ?? [],
    plan_update_suggestions: (row.plan_update_suggestions as PlanUpdateSuggestion[]) ?? [],
    approved_by: (row.approved_by as string) ?? null,
    approved_at: (row.approved_at as string) ?? null,
    created_by: row.created_by as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

// ── Demo data ───────────────────────────────────────────────────────────────

function getDemoSessions(hid: string): GeneratedSession[] {
  return [
    {
      id: "demo-session-1",
      home_id: hid,
      child_id: "child_1",
      session_type: "feelings_exploration",
      title: "Feelings Exploration — Jayden — 10 May 2026",
      framework: "pace",
      tone: "therapeutic",
      status: "approved",
      content: getDefaultSessionContent("feelings_exploration"),
      evidence_links: [],
      quality_score: 85,
      scheduled_date: "2026-05-12",
      delivered_at: null,
      delivered_by: null,
      recording_notes: null,
      follow_up_actions: [],
      plan_update_suggestions: [],
      approved_by: "user-rm-1",
      approved_at: "2026-05-10T14:00:00Z",
      created_by: "user-rm-1",
      created_at: "2026-05-10T09:00:00Z",
      updated_at: "2026-05-10T14:00:00Z",
    },
    {
      id: "demo-session-2",
      home_id: hid,
      child_id: "child_2",
      session_type: "contact_debrief",
      title: "Contact Debrief — Amara — 9 May 2026",
      framework: "ddp",
      tone: "therapeutic",
      status: "delivered",
      content: {
        ...getDefaultSessionContent("contact_debrief"),
        purpose: "Support Amara to process her feelings following this week's family contact. Create a safe space for her to share what the contact was like for her.",
        therapeutic_rationale: "Amara has been quieter since her contact visit. Her therapeutic profile notes that discussions about family can be a trigger. A gentle debrief using DDP principles will help her feel heard.",
      },
      evidence_links: [],
      quality_score: 90,
      scheduled_date: "2026-05-09",
      delivered_at: "2026-05-09T14:30:00Z",
      delivered_by: "staff-1",
      recording_notes: "Amara was initially reluctant but opened up when drawing. Expressed mixed feelings about seeing mum. Said she felt 'happy but also sad'. Wants to go again.",
      follow_up_actions: [
        { action: "Update therapeutic profile with Amara's voice from this session", owner: "staff-1", due_date: "2026-05-12", priority: "medium", status: "pending" },
        { action: "Discuss contact frequency at next review", owner: "user-rm-1", due_date: "2026-05-15", priority: "medium", status: "pending" },
      ],
      plan_update_suggestions: [],
      approved_by: "user-rm-1",
      approved_at: "2026-05-09T10:00:00Z",
      created_by: "user-rm-1",
      created_at: "2026-05-08T16:00:00Z",
      updated_at: "2026-05-09T14:30:00Z",
    },
    {
      id: "demo-session-3",
      home_id: hid,
      child_id: null,
      session_type: "reflective_practice",
      title: "Reflective Practice — Team — 12 May 2026",
      framework: "psychologically_informed",
      tone: "reflective",
      status: "draft",
      content: getDefaultSessionContent("reflective_practice"),
      evidence_links: [],
      quality_score: null,
      scheduled_date: "2026-05-14",
      delivered_at: null,
      delivered_by: null,
      recording_notes: null,
      follow_up_actions: [],
      plan_update_suggestions: [],
      approved_by: null,
      approved_at: null,
      created_by: "user-rm-1",
      created_at: "2026-05-12T08:00:00Z",
      updated_at: "2026-05-12T08:00:00Z",
    },
  ];
}

// ══════════════════════════════════════════════════════════════════════════════
// PRACTICE INTELLIGENCE — THERAPEUTIC PROFILE SERVICE
//
// Manages child therapeutic profiles: creation, updates, versioning, approval,
// and AI-assisted profile building from existing evidence sources. Each child
// has one active profile at a time with full version history.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type {
  TherapeuticProfile,
  StaffRelationship,
  ProgressEntry,
  ChildVoiceEntry,
  TherapeuticPriority,
  PracticeIntelligenceFramework,
} from "@/types/practice-intelligence";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

// ── Get active profile for a child ──────────────────────────────────────────

export async function getTherapeuticProfile(
  childId: string,
  hId?: string,
): Promise<TherapeuticProfile | null> {
  const sb = createServerClient();
  const hid = hId ?? homeId();

  if (!sb) return getDemoProfile(childId, hid);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("therapeutic_profiles") as any)
    .select("*")
    .eq("home_id", hid)
    .eq("child_id", childId)
    .eq("status", "active")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[practice-intelligence/therapeutic-profile] Fetch error:", error);
    return getDemoProfile(childId, hid);
  }

  return data ? mapDbToProfile(data) : null;
}

// ── List all profiles for a home ────────────────────────────────────────────

export async function listTherapeuticProfiles(
  hId?: string,
): Promise<TherapeuticProfile[]> {
  const sb = createServerClient();
  const hid = hId ?? homeId();

  if (!sb) return getDemoProfiles(hid);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("therapeutic_profiles") as any)
    .select("*")
    .eq("home_id", hid)
    .in("status", ["draft", "active"])
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[practice-intelligence/therapeutic-profile] List error:", error);
    return getDemoProfiles(hid);
  }

  return (data ?? []).map(mapDbToProfile);
}

// ── Create new profile ──────────────────────────────────────────────────────

export async function createTherapeuticProfile(
  input: {
    childId: string;
    createdBy: string;
    homeId?: string;
    data?: Partial<TherapeuticProfile>;
  },
): Promise<TherapeuticProfile> {
  const sb = createServerClient();
  const hid = input.homeId ?? homeId();

  const record = {
    home_id: hid,
    child_id: input.childId,
    status: "draft",
    version: 1,
    pre_placement_history: input.data?.pre_placement_history ?? null,
    known_trauma_themes: input.data?.known_trauma_themes ?? [],
    attachment_presentation: input.data?.attachment_presentation ?? null,
    emotional_regulation_needs: input.data?.emotional_regulation_needs ?? [],
    known_triggers: input.data?.known_triggers ?? [],
    known_soothing_strategies: input.data?.known_soothing_strategies ?? [],
    relational_strengths: input.data?.relational_strengths ?? [],
    staff_relationships: input.data?.staff_relationships ?? [],
    family_contact_themes: input.data?.family_contact_themes ?? [],
    education_themes: input.data?.education_themes ?? [],
    identity_culture_belonging: input.data?.identity_culture_belonging ?? [],
    communication_style: input.data?.communication_style ?? null,
    neurodiversity_considerations: input.data?.neurodiversity_considerations ?? [],
    risk_themes: input.data?.risk_themes ?? [],
    protective_factors: input.data?.protective_factors ?? [],
    current_presentation: input.data?.current_presentation ?? null,
    progress_over_time: input.data?.progress_over_time ?? [],
    child_voice_entries: input.data?.child_voice_entries ?? [],
    what_staff_need_to_remember: input.data?.what_staff_need_to_remember ?? [],
    what_helps: input.data?.what_helps ?? [],
    what_does_not_help: input.data?.what_does_not_help ?? [],
    current_therapeutic_priorities: input.data?.current_therapeutic_priorities ?? [],
    created_by: input.createdBy,
  };

  if (!sb) {
    return {
      ...mapDbToProfile({ ...record, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), approved_by: null, approved_at: null }),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("therapeutic_profiles") as any)
    .insert(record)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to create therapeutic profile: ${error.message}`);
  return mapDbToProfile(data);
}

// ── Update profile ──────────────────────────────────────────────────────────

export async function updateTherapeuticProfile(
  profileId: string,
  updates: Partial<TherapeuticProfile>,
): Promise<TherapeuticProfile> {
  const sb = createServerClient();
  if (!sb) throw new Error("Database connection required for updates");

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  const allowedFields = [
    "pre_placement_history", "known_trauma_themes", "attachment_presentation",
    "emotional_regulation_needs", "known_triggers", "known_soothing_strategies",
    "relational_strengths", "staff_relationships", "family_contact_themes",
    "education_themes", "identity_culture_belonging", "communication_style",
    "neurodiversity_considerations", "risk_themes", "protective_factors",
    "current_presentation", "progress_over_time", "child_voice_entries",
    "what_staff_need_to_remember", "what_helps", "what_does_not_help",
    "current_therapeutic_priorities",
  ];

  for (const field of allowedFields) {
    if (field in updates) {
      updateData[field] = (updates as Record<string, unknown>)[field];
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("therapeutic_profiles") as any)
    .update(updateData)
    .eq("id", profileId)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to update therapeutic profile: ${error.message}`);
  return mapDbToProfile(data);
}

// ── Approve and activate profile ────────────────────────────────────────────

export async function approveTherapeuticProfile(
  profileId: string,
  approvedBy: string,
): Promise<TherapeuticProfile> {
  const sb = createServerClient();
  if (!sb) throw new Error("Database connection required for approval");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error: fetchErr } = await (sb.from("therapeutic_profiles") as any)
    .select("child_id, home_id")
    .eq("id", profileId)
    .single();

  if (fetchErr || !profile) throw new Error("Profile not found");

  // Archive any existing active profile for this child
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (sb.from("therapeutic_profiles") as any)
    .update({ status: "archived" })
    .eq("home_id", profile.home_id)
    .eq("child_id", profile.child_id)
    .eq("status", "active");

  // Activate the new one
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from("therapeutic_profiles") as any)
    .update({
      status: "active",
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to approve therapeutic profile: ${error.message}`);
  return mapDbToProfile(data);
}

// ── Build profile from evidence (AI-assisted) ───────────────────────────────

export async function buildProfileFromEvidence(
  childId: string,
  hId?: string,
): Promise<Partial<TherapeuticProfile>> {
  const sb = createServerClient();
  const hid = hId ?? homeId();

  if (!sb) return extractDemoEvidence(childId);

  // Gather evidence from multiple tables
  const [incidents, dailyLogs, keywork, riskAssessments] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sb.from("cara_studio_sources") as any)
      .select("content, summary, source_type, source_date")
      .eq("home_id", hid)
      .eq("child_id", childId)
      .eq("source_type", "incident")
      .order("source_date", { ascending: false })
      .limit(20),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sb.from("cara_studio_sources") as any)
      .select("content, summary, source_type, source_date")
      .eq("home_id", hid)
      .eq("child_id", childId)
      .eq("source_type", "daily_log")
      .order("source_date", { ascending: false })
      .limit(30),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sb.from("cara_studio_sources") as any)
      .select("content, summary, source_type, source_date")
      .eq("home_id", hid)
      .eq("child_id", childId)
      .in("source_type", ["keywork", "direct_work"])
      .order("source_date", { ascending: false })
      .limit(20),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sb.from("cara_studio_sources") as any)
      .select("content, summary, source_type, source_date")
      .eq("home_id", hid)
      .eq("child_id", childId)
      .eq("source_type", "risk_assessment")
      .order("source_date", { ascending: false })
      .limit(5),
  ]);

  // Extract themes from gathered evidence
  const allContent = [
    ...(incidents.data ?? []),
    ...(dailyLogs.data ?? []),
    ...(keywork.data ?? []),
    ...(riskAssessments.data ?? []),
  ].map((s: { content: string; summary: string }) => s.content || s.summary || "").filter(Boolean);

  return extractThemesFromContent(allContent);
}

// ── Theme extraction helpers ────────────────────────────────────────────────

const TRIGGER_INDICATORS = [
  /trigger(?:ed|s)?/i, /escalat(?:ed|es|ing)/i, /dysregulat(?:ed|ion)/i,
  /distress(?:ed)?/i, /upset by/i, /became agitated/i, /led to/i,
  /resulted in/i, /caused by/i, /following (?:a |the )?/i,
];

const SOOTHING_INDICATORS = [
  /calm(?:ed|s|ing)/i, /sooth(?:ed|ing)/i, /regulated/i, /helped by/i,
  /responded well to/i, /settled (?:after|when|with)/i, /de-escalat/i,
  /comforted by/i, /benefits from/i,
];

const STRENGTH_INDICATORS = [
  /strength/i, /positive/i, /good (?:at|with)/i, /enjoys/i,
  /skilled/i, /talented/i, /excels/i, /protective factor/i,
  /progress(?:ed|ing)?/i, /improved/i, /achieved/i,
];

function extractThemesFromContent(contents: string[]): Partial<TherapeuticProfile> {
  const triggers: string[] = [];
  const soothingStrategies: string[] = [];
  const strengths: string[] = [];
  const riskThemes: string[] = [];

  for (const content of contents) {
    const sentences = content.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);

    for (const sentence of sentences) {
      if (TRIGGER_INDICATORS.some((r) => r.test(sentence)) && sentence.length < 200) {
        triggers.push(sentence);
      }
      if (SOOTHING_INDICATORS.some((r) => r.test(sentence)) && sentence.length < 200) {
        soothingStrategies.push(sentence);
      }
      if (STRENGTH_INDICATORS.some((r) => r.test(sentence)) && sentence.length < 200) {
        strengths.push(sentence);
      }
      if (/risk|safeguard|concern|harm|danger/i.test(sentence) && sentence.length < 200) {
        riskThemes.push(sentence);
      }
    }
  }

  return {
    known_triggers: [...new Set(triggers)].slice(0, 10),
    known_soothing_strategies: [...new Set(soothingStrategies)].slice(0, 10),
    relational_strengths: [...new Set(strengths)].slice(0, 10),
    risk_themes: [...new Set(riskThemes)].slice(0, 10),
  };
}

// ── DB mapping ──────────────────────────────────────────────────────────────

function mapDbToProfile(row: Record<string, unknown>): TherapeuticProfile {
  return {
    id: row.id as string,
    home_id: row.home_id as string,
    child_id: row.child_id as string,
    status: row.status as TherapeuticProfile["status"],
    version: row.version as number,
    pre_placement_history: (row.pre_placement_history as string) ?? null,
    known_trauma_themes: (row.known_trauma_themes as string[]) ?? [],
    attachment_presentation: (row.attachment_presentation as string) ?? null,
    emotional_regulation_needs: (row.emotional_regulation_needs as string[]) ?? [],
    known_triggers: (row.known_triggers as string[]) ?? [],
    known_soothing_strategies: (row.known_soothing_strategies as string[]) ?? [],
    relational_strengths: (row.relational_strengths as string[]) ?? [],
    staff_relationships: (row.staff_relationships as StaffRelationship[]) ?? [],
    family_contact_themes: (row.family_contact_themes as string[]) ?? [],
    education_themes: (row.education_themes as string[]) ?? [],
    identity_culture_belonging: (row.identity_culture_belonging as string[]) ?? [],
    communication_style: (row.communication_style as string) ?? null,
    neurodiversity_considerations: (row.neurodiversity_considerations as string[]) ?? [],
    risk_themes: (row.risk_themes as string[]) ?? [],
    protective_factors: (row.protective_factors as string[]) ?? [],
    current_presentation: (row.current_presentation as string) ?? null,
    progress_over_time: (row.progress_over_time as ProgressEntry[]) ?? [],
    child_voice_entries: (row.child_voice_entries as ChildVoiceEntry[]) ?? [],
    what_staff_need_to_remember: (row.what_staff_need_to_remember as string[]) ?? [],
    what_helps: (row.what_helps as string[]) ?? [],
    what_does_not_help: (row.what_does_not_help as string[]) ?? [],
    current_therapeutic_priorities: (row.current_therapeutic_priorities as TherapeuticPriority[]) ?? [],
    approved_by: (row.approved_by as string) ?? null,
    approved_at: (row.approved_at as string) ?? null,
    created_by: row.created_by as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

// ── Demo data ───────────────────────────────────────────────────────────────

function extractDemoEvidence(_childId: string): Partial<TherapeuticProfile> {
  return {
    known_triggers: [
      "Unpredictable changes to routine",
      "Broken promises from adults",
      "Discussions about family contact",
      "Feeling excluded from group activities",
    ],
    known_soothing_strategies: [
      "Quiet time with music",
      "Drawing and creative activities",
      "1:1 time with trusted adult",
      "Going for a walk",
    ],
    relational_strengths: [
      "Can articulate feelings when calm",
      "Shows empathy towards younger children",
      "Responds well to PACE approach",
    ],
    risk_themes: [
      "Self-harm following family contact",
      "Missing episodes linked to peer influence",
    ],
  };
}

function getDemoProfile(childId: string, hid: string): TherapeuticProfile {
  return {
    id: `demo-profile-${childId}`,
    home_id: hid,
    child_id: childId,
    status: "active",
    version: 1,
    pre_placement_history: "Jayden experienced early neglect and inconsistent parenting before entering care at age 7. Multiple placement moves before arriving at the current home.",
    known_trauma_themes: ["Early neglect", "Multiple placement moves", "Inconsistent caregiving", "Loss of significant relationships"],
    attachment_presentation: "Insecure-avoidant presentation with some ambivalent features. Struggles to trust adults initially but can form strong bonds once trust is established.",
    emotional_regulation_needs: ["Support with emotional vocabulary", "Co-regulation with trusted adults", "Predictable routines", "Advance warning of changes"],
    known_triggers: ["Unpredictable changes to routine", "Broken promises from adults", "Discussions about family contact", "Being told rather than asked", "Feeling excluded"],
    known_soothing_strategies: ["5 minutes quiet time", "Music during activities", "Choice of where to sit", "Drawing", "1:1 time with key worker"],
    relational_strengths: ["Responds well to PACE approach", "Can articulate feelings when calm", "Shows empathy towards peers", "Good sense of humour"],
    staff_relationships: [
      { staffId: "staff-1", staffName: "Sarah Thompson", quality: "strong", notes: "Primary key worker. Jayden trusts Sarah and can be open about feelings." },
      { staffId: "staff-2", staffName: "Marcus Williams", quality: "developing", notes: "New to the team. Building relationship through shared football interest." },
    ],
    family_contact_themes: ["Complex relationship with mum — wants contact but finds it emotionally difficult", "No contact with dad — expresses curiosity but also anger"],
    education_themes: ["Attendance improved to 92%", "Enjoys science and PE", "Struggles with literacy — possible undiagnosed dyslexia"],
    identity_culture_belonging: ["Mixed heritage — exploring identity", "Enjoys cooking cultural foods with staff", "Values friendships at school"],
    communication_style: "Prefers 1:1 conversations. Can feel overwhelmed in group discussions. Uses humour to deflect when uncomfortable.",
    neurodiversity_considerations: ["Possible ADHD traits — referral in progress", "Sensory sensitivity to loud noises"],
    risk_themes: ["Self-harm following difficult family contact", "Missing episodes linked to peer influence", "Online vulnerability"],
    protective_factors: ["Strong relationship with key worker", "Good peer relationships at school", "Enjoys sports", "Can identify feelings when supported"],
    current_presentation: "Generally settled over the past 3 months. Some regression following a cancelled contact visit last week. Engaging well in key work sessions.",
    progress_over_time: [
      { date: "2026-03-01", area: "School attendance", direction: "improving", note: "Up from 75% to 92%" },
      { date: "2026-04-01", area: "Emotional regulation", direction: "improving", note: "Fewer incidents of dysregulation" },
      { date: "2026-05-01", area: "Family contact", direction: "stable", note: "Still finding contact difficult but coping better with support" },
    ],
    child_voice_entries: [
      { date: "2026-05-01", context: "Key work session", quote: "I like it here. I feel safe most of the time.", theme: "belonging", sentiment: "positive" },
      { date: "2026-04-20", context: "After family contact", quote: "I don't know why she didn't come. Maybe she doesn't care.", theme: "family", sentiment: "negative" },
      { date: "2026-04-15", context: "School review", quote: "Science is my thing. I want to be an engineer.", theme: "aspiration", sentiment: "positive" },
    ],
    what_staff_need_to_remember: [
      "Always give Jayden a choice — never tell him what to do",
      "Let him have 5 minutes before key work — he needs transition time",
      "Don't mention family contact without warning",
      "Music helps him regulate — keep headphones available",
    ],
    what_helps: ["PACE approach", "Advance warning of changes", "Choices", "Music", "1:1 time", "Humour", "Sports"],
    what_does_not_help: ["Being told rather than asked", "Sudden topic changes", "Staff showing frustration", "Group confrontation", "Rushing conversations"],
    current_therapeutic_priorities: [
      { title: "Strengthen emotional vocabulary", description: "Support Jayden to identify and name a wider range of emotions", framework: "pace" as PracticeIntelligenceFramework, targetDate: "2026-07-01", status: "active" },
      { title: "Process family contact feelings", description: "Gentle life story and feelings work around family relationships", framework: "ddp" as PracticeIntelligenceFramework, targetDate: "2026-08-01", status: "active" },
      { title: "Build independence skills", description: "Age-appropriate independence work aligned with pathway plan", framework: "therapeutic_parenting" as PracticeIntelligenceFramework, targetDate: "2026-09-01", status: "active" },
    ],
    approved_by: "user-rm-1",
    approved_at: "2026-04-15T10:00:00Z",
    created_by: "user-rm-1",
    created_at: "2026-03-01T09:00:00Z",
    updated_at: "2026-05-08T14:30:00Z",
  };
}

function getDemoProfiles(hid: string): TherapeuticProfile[] {
  return [
    getDemoProfile("child_1", hid),
    {
      ...getDemoProfile("child_2", hid),
      id: "demo-profile-child_2",
      child_id: "child_2",
      status: "draft" as const,
      pre_placement_history: "Amara witnessed domestic abuse before entering care. Separated from extended family and cultural community.",
      known_trauma_themes: ["Domestic abuse witnessed", "Cultural displacement", "Loss of extended family network"],
      attachment_presentation: "Anxious-ambivalent presentation. Seeks closeness but finds it difficult to trust.",
      known_triggers: ["Raised voices", "Feeling excluded", "Discussions about going home"],
      known_soothing_strategies: ["Art and drawing", "Quiet space", "Cultural food and music", "1:1 with trusted female staff"],
      current_presentation: "Quieter in recent weeks. Self-isolating more in room. Engaging well in art therapy.",
      approved_by: null,
      approved_at: null,
    },
  ];
}

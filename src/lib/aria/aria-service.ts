// ══════════════════════════════════════════════════════════════════════════════
// ARIA — UNIVERSAL SERVICE LAYER
//
// The orchestrator that every Aria-driven feature can route through. It
// authenticates, checks Aria permissions, builds safe context, calls the
// provider, validates the response, persists a draft, and writes the audit
// event. Domain engines (oversight, voice-of-child, HR Process Guardian)
// remain authoritative for their own deep checks; this service is the
// thin universal layer that makes Aria available across the rest of the
// platform with the same lifecycle.
//
// All output is "Aria suggested draft" until a human approves and commits.
// ══════════════════════════════════════════════════════════════════════════════

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import {
  ARIA_PROFESSIONAL_IDENTITY_PROMPT,
  ARIA_WRITING_STYLE_PROMPT,
  applyAriaPostprocessor,
} from "@/lib/aria/writingStyleRules";
import {
  checkAriaAccess,
  type AriaActor,
  type AriaPermission,
} from "@/lib/aria/aria-permissions";
import {
  generateText,
  getAriaProviderConfig,
  type AriaProviderConfig,
} from "@/lib/aria/aria-provider";
import type {
  AriaCommandId,
  AriaCommandSpec,
  AriaConfidence,
  AriaGenerationResult,
  AriaInvocationInput,
} from "@/lib/aria/aria-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = SupabaseClient<any, "public", any>;
function loose(client: ReturnType<typeof createServerClient>): LooseSupabase {
  return client as unknown as LooseSupabase;
}

// ─── Command registry ───────────────────────────────────────────────────────
// Every AriaCommandId is wired here. Domain-specific engines (management
// oversight, voice of child, HR Process Guardian) keep their own deeper
// analysis and are not duplicated — they write results back into aria_outputs.

export const ARIA_COMMANDS: Record<AriaCommandId, AriaCommandSpec> = {
  improve_writing: {
    id: "improve_writing",
    label: "Improve writing",
    description: "Lift the wording into a clear, calm, professional tone without changing meaning.",
    modules: [],
    requiredPermission: "aria.rewrite",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Improve the wording of the source text. Preserve every fact. Do not add facts. Do not soften safeguarding language. Keep the child's voice if present.",
  },
  professionalise_record: {
    id: "professionalise_record",
    label: "Professionalise record",
    description: "Re-cast the record in a UK children's-home professional tone, evidenced and child-centred.",
    modules: ["daily_log", "shift_summary", "key_work", "incident", "complaint"],
    requiredPermission: "aria.rewrite",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Re-write the record in a UK residential childcare professional tone. Evidence-led, calm, warm, child-centred. Preserve every fact in the source. Make the child's voice and the staff response visible where the source supports it.",
  },
  simplify_language: {
    id: "simplify_language",
    label: "Simplify language",
    description: "Plain-English version that a young person, family member, or non-specialist could read.",
    modules: [],
    requiredPermission: "aria.rewrite",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Re-write the source in plain English. Keep the meaning. Avoid jargon. Use short sentences. Preserve safeguarding-relevant detail accurately.",
  },
  summarise_text: {
    id: "summarise_text",
    label: "Summarise",
    description: "Concise professional summary of the source text.",
    modules: [],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Summarise the source text in a calm, professional tone. Preserve significant facts and any safeguarding-relevant detail. Flag what is missing.",
  },
  extract_actions: {
    id: "extract_actions",
    label: "Extract actions",
    description: "Pull a list of suggested actions out of the source. The manager confirms before any task is created.",
    modules: [],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: true,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Extract suggested actions from the source as a numbered list. Each action should have a short title, a one-sentence description, a sensible priority (urgent/high/medium/low), and a suggested role to assign it to. Mark any safeguarding-touching actions as urgent. Do not invent actions that the source does not support.",
  },
  check_missing_information: {
    id: "check_missing_information",
    label: "Check missing information",
    description: "Flag what a manager would expect to see that the record does not yet contain.",
    modules: [],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Review the source and list what a UK Registered Manager would expect to see that is not yet captured. Examples to consider: child voice, dates, who was present, what was done, what was decided, what the next step is, plan linkage. Be specific. Do not pad the list.",
  },
  draft_handover: {
    id: "draft_handover",
    label: "Draft shift handover",
    description: "Produce a shift handover ready for review.",
    modules: ["shift", "shift_summary"],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Produce a UK children's-home shift handover. Keep it tight and useful for the next shift. Cover each child's mood/presentation, anything significant since the last handover, anything that needs to happen next shift, and any safeguarding considerations. Use the source only.",
  },
  convert_to_email: {
    id: "convert_to_email",
    label: "Draft email",
    description: "Convert source text into a professional email draft.",
    modules: [],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Convert the source text into a professional email draft suitable for a children's-home manager. Include subject line, greeting, body, and sign-off. Preserve every fact. Use plain English.",
  },
  convert_to_letter: {
    id: "convert_to_letter",
    label: "Draft letter",
    description: "Convert source text into a formal letter draft. The manager remains the author.",
    modules: [],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Convert the source into a formal letter. Use the home name, recipient name, and date if supplied. Plain professional UK English. Preserve every fact. Do not include any wording the source does not support.",
  },
  extract_key_points: {
    id: "extract_key_points",
    label: "Extract key points",
    description: "List the key points an experienced manager would pick out from the source.",
    modules: [],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "List the key points from the source as short bullet points. Each point should be a fact or a clear observation that would matter to a Registered Manager reading the record. Do not invent.",
  },
  check_tone: {
    id: "check_tone",
    label: "Check tone",
    description: "Review the wording for tone and language risk. Flag anything that reads as judgemental, blame-based, or AI-generic.",
    modules: [],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Review the source for tone and language. Flag anything that reads as judgemental, blame-based, prejudgemental, exaggerated, or AI-generic. Suggest a more neutral wording for each issue. Preserve the substance.",
  },
  check_factuality: {
    id: "check_factuality",
    label: "Check factuality",
    description: "Highlight statements that read as fact but may not be supported by the source.",
    modules: [],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Review the source for statements that are presented as fact but may be opinion, assumption, or interpretation. Flag each one and propose neutral wording. Do not assert that anything is or is not factually correct beyond what the source supports.",
  },
  create_task_list: {
    id: "create_task_list",
    label: "Create task list",
    description: "Turn the source into a task list. Each task is a draft until the manager confirms.",
    modules: [],
    requiredPermission: "aria.create_tasks",
    approvalRequired: true,
    canCreateTasks: true,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Produce a task list from the source. Each task: short title, one-sentence description, suggested priority (urgent/high/medium/low), suggested role to own it, and a sensible due-day count. Tasks must be derived from what the source explicitly raises. Do not invent.",
  },
  create_meeting_minutes: {
    id: "create_meeting_minutes",
    label: "Draft meeting minutes",
    description: "Convert raw notes into structured meeting minutes ready for review.",
    modules: ["calendar", "supervision", "team_meeting"],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Turn the source notes into meeting minutes. Sections: attendees, apologies, items discussed, decisions, actions (with owner, due date, priority where the source supports it), next meeting. Stay close to the source. Do not invent attendees or decisions.",
  },
  create_agenda: {
    id: "create_agenda",
    label: "Draft agenda",
    description: "Build a meeting agenda from the source.",
    modules: ["calendar", "supervision", "team_meeting"],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Build a meeting agenda from the source. Items should be specific, with brief notes for each item and a suggested time allocation. Include AOB at the end. Do not invent agenda items the source does not raise.",
  },

  // ── Children's home recording ──────────────────────────────────────────────
  draft_daily_log: {
    id: "draft_daily_log",
    label: "Draft daily log",
    description: "Produce a daily log entry from the source notes.",
    modules: ["daily_log", "shift"],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Produce a daily log entry suitable for a UK children's home. Cover what happened, mood and presentation, who was present, the child's voice if captured in the source, and anything that needs follow-up. Do not invent.",
  },
  draft_shift_summary: {
    id: "draft_shift_summary",
    label: "Draft shift summary",
    description: "Produce a shift summary suitable for handover.",
    modules: ["shift_summary", "shift"],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Produce a UK children's-home shift summary. Cover staff on shift, children present, mood and presentation per child, significant events, decisions made, anything outstanding, and anything for the next shift to be aware of. Use the source only.",
  },
  draft_keywork_session: {
    id: "draft_keywork_session",
    label: "Draft key-work session",
    description: "Produce a key-work session record.",
    modules: ["key_work"],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Produce a UK children's-home key-work session record. Cover the session aim, what was discussed, the child's voice in their own words where the source provides it, agreed actions, follow-up date, and any safeguarding considerations.",
  },
  draft_child_voice_summary: {
    id: "draft_child_voice_summary",
    label: "Draft child voice summary",
    description: "Surface the child's voice from the source records.",
    modules: ["child_record", "child_review"],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Surface the child's voice from the source. Quote their words where the source provides them. Paraphrase only where the source clearly supports it. Foreground anything they have expressed as wanting, needing, fearing, or feeling unmet. Name voice absence as a finding rather than papering over it.",
  },
  draft_placement_plan_update: {
    id: "draft_placement_plan_update",
    label: "Draft placement plan update",
    description: "Draft an update to the placement plan based on the source.",
    modules: ["placement_plan"],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Draft an update to the placement plan. Stay grounded in the source. Cover what has changed, the child's voice on the change, supports in place, risks, and review timeline. Do not propose changes the source does not support.",
  },
  draft_risk_assessment_update: {
    id: "draft_risk_assessment_update",
    label: "Draft risk assessment update",
    description: "Draft a risk-assessment update based on the source.",
    modules: ["risk_assessment"],
    requiredPermission: "aria.analyse_risk",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Draft a risk-assessment update for a UK children's home. Be proportionate, not alarmist. Cover what has changed, current risk level on the source's evidence, contextual factors, mitigations in place, and review date. Always recommend professional review. Do not declare absolute conclusions on risk.",
  },
  draft_behaviour_support_update: {
    id: "draft_behaviour_support_update",
    label: "Draft behaviour support plan update",
    description: "Draft an update to the behaviour support plan.",
    modules: ["behaviour_support_plan"],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Draft an update to the behaviour support plan. Use trauma-informed and relational language. Separate the child from the behaviour. Always consider what the behaviour is communicating, the function it serves, and what unmet need sits beneath it. Use the source only.",
  },
  draft_contact_summary: {
    id: "draft_contact_summary",
    label: "Draft family time / contact summary",
    description: "Summarise a family-time / contact session.",
    modules: ["family_time", "contact"],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Summarise a family-time / contact session for a UK children's home. Cover purpose, location, supervision arrangements, the child's experience before/during/after, quality of relationship, any concerns observed, and next steps. Stay grounded in the source.",
  },
  draft_education_summary: {
    id: "draft_education_summary",
    label: "Draft education summary",
    description: "Summarise the child's education position.",
    modules: ["education"],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Summarise the child's current education position from the source. Cover attendance, attainment, engagement, PEP linkage and Virtual School involvement where the source mentions them, the child's voice on their education, and any concerns.",
  },
  draft_health_summary: {
    id: "draft_health_summary",
    label: "Draft health summary",
    description: "Summarise the child's current health position.",
    modules: ["health"],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Summarise the child's current health position from the source. Cover presenting issues, clinical action, consent and child's voice where present, health plan / LAC health assessment linkage, and any concerns. Recommend professional review for any flagged concern.",
  },
  draft_independence_summary: {
    id: "draft_independence_summary",
    label: "Draft independence summary",
    description: "Summarise progress on independence skills.",
    modules: ["independence", "pathway_plan"],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Summarise the young person's progress on independence skills (cooking, laundry, money, travel, study, health, identity). Stay grounded in the source. Surface the child's voice on what they want next.",
  },

  // ── Incidents ───────────────────────────────────────────────────────────────
  draft_incident_record: {
    id: "draft_incident_record",
    label: "Draft incident record",
    description: "Draft an incident record from the notes provided.",
    modules: ["incident"],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Draft a UK children's-home incident record. Use ABC structure (antecedent, behaviour, consequence) where the source supports it. Capture child voice during and after the incident, de-escalation strategies attempted, and notifications considered. Be factual, calm, non-judgemental. Separate the child from the behaviour.",
  },
  check_incident_chronology: {
    id: "check_incident_chronology",
    label: "Check incident chronology",
    description: "Review the chronology of an incident record for gaps and inconsistencies.",
    modules: ["incident"],
    requiredPermission: "aria.analyse_risk",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Review the chronology in the source. Flag missing dates and times, ordering issues, inconsistencies between accounts, and missing actions taken. Do not invent timeline entries the source does not support.",
  },
  incident_risk_analysis: {
    id: "incident_risk_analysis",
    label: "Incident risk analysis",
    description: "Surface risk patterns and safeguarding considerations from an incident.",
    modules: ["incident"],
    requiredPermission: "aria.analyse_risk",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Surface risk patterns from the source incident. Cover immediate and cumulative risk, function of the behaviour, environmental factors, relational drivers, and sustainability of safety. Be proportionate. Recommend professional review on every output. Never declare anything as definitely abuse or definitely safe.",
  },
  identify_missing_incident_information: {
    id: "identify_missing_incident_information",
    label: "Identify missing incident information",
    description: "List what an inspector would expect to see that is not yet captured.",
    modules: ["incident"],
    requiredPermission: "aria.analyse_risk",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "List what a Registered Manager or inspector would expect to see in this incident record that is not yet captured. Cover ABC, child voice, de-escalation, notifications (SW, parents, Ofsted under Reg 34), post-incident review, and plan updates.",
  },
  suggest_incident_follow_up_tasks: {
    id: "suggest_incident_follow_up_tasks",
    label: "Suggest incident follow-up tasks",
    description: "Draft a follow-up task list for the incident, for the manager to confirm.",
    modules: ["incident"],
    requiredPermission: "aria.create_tasks",
    approvalRequired: true,
    canCreateTasks: true,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Draft follow-up tasks from the source incident. Each task: title, description, priority, role to own, due-day count. Mark safeguarding follow-ups as urgent. Do not invent. Recommend manager review on every output.",
  },
  draft_social_worker_update: {
    id: "draft_social_worker_update",
    label: "Draft social worker update",
    description: "Draft a professional update to the social worker / IRO.",
    modules: ["incident", "child_record"],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Draft a professional update to a social worker or IRO. Factual, objective, outcome-focused. Cover placement stability, wellbeing, risk factors, and care plan progress. Stay grounded in the source.",
  },
  draft_parent_carer_update: {
    id: "draft_parent_carer_update",
    label: "Draft parent / carer update",
    description: "Draft a sensitive, plain-English update for parents or carers.",
    modules: ["incident", "child_record"],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Draft a plain-English update for parents or carers. Warm, informative, transparent. Avoid jargon. Acknowledge their perspective. Stay grounded in the source. Do not include detail the manager would want to keep confidential.",
  },
  draft_strategy_discussion_notes: {
    id: "draft_strategy_discussion_notes",
    label: "Draft strategy discussion notes",
    description: "Structure notes for a strategy discussion.",
    modules: ["incident", "safeguarding"],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Structure notes for a multi-agency strategy discussion. Cover concern summary, risk grading, immediate safeguarding action, attendees, decisions, agreed actions with owner and timescale, and next review. Recommend safeguarding lead review on every output.",
  },
  draft_safeguarding_referral_support: {
    id: "draft_safeguarding_referral_support",
    label: "Support safeguarding referral",
    description: "Draft supporting wording for a safeguarding referral. Manager confirms before submission.",
    modules: ["safeguarding"],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Draft supporting wording for a safeguarding referral. Be factual, proportionate, and child-centred. Include what is known, what is not yet known, what action has been taken, and the support being requested. Recommend safeguarding lead review on every output.",
  },

  // ── Management oversight ───────────────────────────────────────────────────
  draft_management_oversight: {
    id: "draft_management_oversight",
    label: "Draft management oversight",
    description: "Draft a Registered Manager oversight comment on the source record.",
    modules: ["management_oversight"],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Draft a Registered Manager oversight comment. Reflective, evidence-based, accountable. Show what you have read, what it tells you, what action is being taken, and what is expected next. Comment on the source rather than restating it.",
  },
  improve_management_oversight: {
    id: "improve_management_oversight",
    label: "Improve management oversight",
    description: "Improve an existing oversight comment for tone, depth and evidence.",
    modules: ["management_oversight"],
    requiredPermission: "aria.rewrite",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Improve the existing oversight comment. Keep every fact. Add specificity, evidence linkage, and a clear next step where the source supports it. Remove vague closure phrases such as 'Reviewed, no concerns' if the source does not support them.",
  },
  review_management_oversight_quality: {
    id: "review_management_oversight_quality",
    label: "Review oversight quality",
    description: "Quality-assure an existing oversight comment.",
    modules: ["management_oversight"],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Review the oversight for quality. Score it across reflection, child focus, professional challenge, evidence linkage, action focus, and tone. List specific issues and what would improve each one.",
  },
  identify_management_actions: {
    id: "identify_management_actions",
    label: "Identify management actions",
    description: "Surface management actions implied by the source.",
    modules: ["management_oversight"],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: true,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Surface management actions implied by the source. Each action: title, brief rationale grounded in the source, suggested role, suggested due-day count. Do not invent actions the source does not raise.",
  },
  check_oversight_reflection: {
    id: "check_oversight_reflection",
    label: "Check oversight reflection",
    description: "Score how reflective the oversight is and suggest improvements.",
    modules: ["management_oversight"],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Assess the oversight for reflection: does it engage with what the record actually shows, what helped, what didn't, and what the manager has learned? List specific issues and propose better wording.",
  },
  check_oversight_challenge: {
    id: "check_oversight_challenge",
    label: "Check oversight challenge",
    description: "Score how much professional challenge the oversight contains.",
    modules: ["management_oversight"],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Assess the oversight for professional challenge: does it ask hard questions, hold staff to account fairly, identify gaps, and set clear expectations? Suggest stronger wording where appropriate.",
  },
  check_oversight_child_focus: {
    id: "check_oversight_child_focus",
    label: "Check oversight child focus",
    description: "Score how visibly child-centred the oversight is.",
    modules: ["management_oversight"],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Assess the oversight for child focus: is the child's experience visible? Is their voice present? Does the oversight separate the child from the behaviour? Suggest where to add child voice from the source.",
  },
  create_management_action_plan: {
    id: "create_management_action_plan",
    label: "Create management action plan",
    description: "Build an action plan from the source.",
    modules: ["management_oversight", "audit"],
    requiredPermission: "aria.create_tasks",
    approvalRequired: true,
    canCreateTasks: true,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Build a management action plan from the source. Each action: title, rationale grounded in the source, owner role, due-day count, priority, and what done looks like. Group by theme where useful.",
  },

  // ── Documents ──────────────────────────────────────────────────────────────
  summarise_uploaded_document: {
    id: "summarise_uploaded_document",
    label: "Summarise uploaded document",
    description: "Produce a professional summary of the uploaded document.",
    modules: ["documents"],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Produce a 2-4 sentence professional summary of the document text. Then list 3-6 key facts, dates, or actions identified. Stay grounded in the document.",
  },
  extract_document_actions: {
    id: "extract_document_actions",
    label: "Extract document actions",
    description: "Pull explicit and implicit actions out of a document.",
    modules: ["documents"],
    requiredPermission: "aria.create_tasks",
    approvalRequired: true,
    canCreateTasks: true,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Pull actions from the document. Each action: title, brief description, suggested owner role, suggested due-day count, priority. Mark anything safeguarding-touching as urgent.",
  },
  identify_document_links: {
    id: "identify_document_links",
    label: "Identify document links",
    description: "Suggest where the document should be linked across the platform.",
    modules: ["documents"],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Suggest which records or modules the document should be linked to (child, home, incident, audit, recruitment, HR, policy). Be specific. Avoid duplication. Use links rather than copies.",
  },
  identify_document_risks: {
    id: "identify_document_risks",
    label: "Identify document risks",
    description: "Surface safeguarding, compliance or HR risks in the document.",
    modules: ["documents"],
    requiredPermission: "aria.analyse_risk",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Surface risks identified in the document. For each: short description, severity (low/medium/high/critical), suggested action, and whether the manager should escalate. Recommend professional review on every output.",
  },
  suggest_where_document_should_link: {
    id: "suggest_where_document_should_link",
    label: "Suggest filing location",
    description: "Suggest the right place in Cornerstone for the document.",
    modules: ["documents"],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Suggest the most appropriate Cornerstone module(s) and confidentiality level for the document. Stay grounded in the document content.",
  },
  create_document_summary_for_record: {
    id: "create_document_summary_for_record",
    label: "Document summary for record",
    description: "Produce a record-ready summary of an uploaded document.",
    modules: ["documents"],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Produce a record-ready summary that can be saved alongside the document on the linked record. Tight, professional, factual. Identify key dates, attendees, and decisions.",
  },

  // ── Tasks ──────────────────────────────────────────────────────────────────
  create_task_from_text: {
    id: "create_task_from_text",
    label: "Create task from text",
    description: "Convert a free-text note into a structured task. Manager confirms before saving.",
    modules: [],
    requiredPermission: "aria.create_tasks",
    approvalRequired: true,
    canCreateTasks: true,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Convert the note into a structured task. Title, description, suggested owner role, suggested due-day count, priority. Be conservative on priority where the source doesn't support urgency.",
  },
  suggest_task_owner: {
    id: "suggest_task_owner",
    label: "Suggest task owner",
    description: "Suggest who should own a task, by role.",
    modules: [],
    requiredPermission: "aria.create_tasks",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Suggest the most appropriate role to own the task based on the source. If the source names a person, use the person; otherwise use the role.",
  },
  suggest_due_date: {
    id: "suggest_due_date",
    label: "Suggest due date",
    description: "Suggest a sensible due date based on the risk in the source.",
    modules: [],
    requiredPermission: "aria.create_tasks",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Suggest a due-day count based on the risk in the source. Safeguarding-touching: 1-2 days. High but non-urgent: 3-7 days. Routine: 14-30 days. Justify the choice in one sentence.",
  },

  // ── Audits ─────────────────────────────────────────────────────────────────
  analyse_audit_findings: {
    id: "analyse_audit_findings",
    label: "Analyse audit findings",
    description: "Pull themes and risk patterns out of an audit.",
    modules: ["audit"],
    requiredPermission: "aria.analyse_risk",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Analyse the audit findings. Pull themes, repeated shortfalls, and risk patterns. Be specific. Stay grounded in the audit.",
  },
  create_audit_action_plan: {
    id: "create_audit_action_plan",
    label: "Create audit action plan",
    description: "Build an action plan from audit findings.",
    modules: ["audit"],
    requiredPermission: "aria.create_tasks",
    approvalRequired: true,
    canCreateTasks: true,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Build an action plan from the audit findings. Each action: title, rationale, owner role, due-day count, priority. Group by quality area or finding theme.",
  },
  prioritise_audit_risks: {
    id: "prioritise_audit_risks",
    label: "Prioritise audit risks",
    description: "Order audit risks by severity and impact on children.",
    modules: ["audit"],
    requiredPermission: "aria.analyse_risk",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Order the audit risks by severity and impact on children. Justify each placement against the audit evidence.",
  },
  draft_manager_audit_response: {
    id: "draft_manager_audit_response",
    label: "Draft manager audit response",
    description: "Draft the manager's response to an audit.",
    modules: ["audit"],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Draft a Registered Manager response to the audit. Acknowledge findings honestly, set out actions, owners and timescales, and what improvement looks like. Avoid defensiveness. Stay grounded in the audit.",
  },
  check_overdue_audit_actions: {
    id: "check_overdue_audit_actions",
    label: "Check overdue audit actions",
    description: "List overdue audit actions and what is blocking them.",
    modules: ["audit"],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "List actions from the source audit plan that are overdue, what is blocking each one (where the source says), and a suggested next step.",
  },
  create_delegated_audit_tasks: {
    id: "create_delegated_audit_tasks",
    label: "Create delegated audit tasks",
    description: "Break audit findings into delegated tasks.",
    modules: ["audit"],
    requiredPermission: "aria.create_tasks",
    approvalRequired: true,
    canCreateTasks: true,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Break the audit findings into delegated tasks. Each task: title, description, owner role, due-day count, priority, and what done looks like.",
  },

  // ── HR ────────────────────────────────────────────────────────────────────
  draft_supervision_notes: {
    id: "draft_supervision_notes",
    label: "Draft supervision notes",
    description: "Draft a supervision record from the conversation notes.",
    modules: ["supervision"],
    requiredPermission: "aria.hr",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Draft a UK residential childcare supervision record. Cover wellbeing, workload, professional development, reflective practice, child-specific work, training needs, and agreed actions. Stay grounded in the source. Do not invent.",
  },
  draft_team_meeting_minutes: {
    id: "draft_team_meeting_minutes",
    label: "Draft team meeting minutes",
    description: "Convert team meeting notes into minutes.",
    modules: ["team_meeting"],
    requiredPermission: "aria.hr",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Turn the source notes into team meeting minutes. Sections: attendees, items discussed, decisions, actions with owners and due dates, next meeting. Stay grounded in the source.",
  },
  draft_return_to_work_note: {
    id: "draft_return_to_work_note",
    label: "Draft return-to-work note",
    description: "Draft a return-to-work meeting note.",
    modules: ["sickness", "hr"],
    requiredPermission: "aria.hr",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Draft a return-to-work meeting note. Cover the reason for absence (only what the source supports sharing), wellbeing, fitness for duties, reasonable adjustments considered, phased return where appropriate, and the agreed plan. Be supportive in tone.",
  },
  draft_investigation_questions: {
    id: "draft_investigation_questions",
    label: "Draft investigation questions",
    description: "Draft neutral, fact-finding investigation questions.",
    modules: ["hr_investigation"],
    requiredPermission: "aria.hr",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Draft neutral investigation questions for an HR fact-finding meeting. Open-ended, non-leading, evidence-led. Avoid prejudgemental wording. Recommend professional review on every output.",
  },
  draft_investigation_plan: {
    id: "draft_investigation_plan",
    label: "Draft investigation plan",
    description: "Draft an HR investigation plan.",
    modules: ["hr_investigation"],
    requiredPermission: "aria.hr",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Draft an HR investigation plan. Cover terms of reference, investigator, witnesses, evidence, child impact, safeguarding considerations, timescale, and recommendation that any findings of fact remain investigator-only and not disciplinary outcomes.",
  },
  draft_outcome_letter: {
    id: "draft_outcome_letter",
    label: "Draft HR outcome letter",
    description: "Draft an HR outcome letter. Run through the HR Process Guardian before sending.",
    modules: ["hr"],
    requiredPermission: "aria.hr",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Draft an HR outcome letter. Include the basis for the decision, any sanction, expectations going forward, support offered, and the right of appeal where applicable. Strongly recommend running this draft through the HR Process Guardian before approval.",
  },
  draft_performance_support_plan: {
    id: "draft_performance_support_plan",
    label: "Draft performance support plan",
    description: "Draft a performance support / improvement plan.",
    modules: ["hr"],
    requiredPermission: "aria.hr",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Draft a performance support plan. Cover areas to develop, standards expected, support available, review schedule, and what success looks like. Be supportive and specific.",
  },
  check_hr_fairness_and_tone: {
    id: "check_hr_fairness_and_tone",
    label: "Check HR fairness and tone",
    description: "Review HR wording for fairness and tone risk.",
    modules: ["hr"],
    requiredPermission: "aria.hr",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Review the source HR wording for fairness and tone. Flag prejudgement, blame, emotional language, exaggeration, and any signal that the process is not ACAS-aligned. Recommend running the draft through the HR Process Guardian.",
  },
  check_union_sensitive_wording: {
    id: "check_union_sensitive_wording",
    label: "Check union-sensitive wording",
    description: "Review HR wording for union-sensitive language.",
    modules: ["hr"],
    requiredPermission: "aria.hr",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Review the source HR wording for union-sensitive language. Confirm the right to be accompanied is stated. Flag anything that could prejudice union or representation involvement.",
  },
  draft_training_need_summary: {
    id: "draft_training_need_summary",
    label: "Draft training needs summary",
    description: "Surface training needs from the source.",
    modules: ["hr", "supervision"],
    requiredPermission: "aria.hr",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Surface training needs from the source. Group by theme (safeguarding, behaviour support, recording, medication, etc.). For each need: who is affected, why, and a suggested approach.",
  },

  // ── Safer recruitment ─────────────────────────────────────────────────────
  draft_interview_questions: {
    id: "draft_interview_questions",
    label: "Draft interview questions",
    description: "Draft values-based interview questions.",
    modules: ["safer_recruitment"],
    requiredPermission: "aria.recruitment",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Draft values-based interview questions for a UK children's-home role. Cover safeguarding, child voice, trauma-informed practice, reflection, working with diversity, and motivation. Provide ideal-answer indicators.",
  },
  check_employment_gaps: {
    id: "check_employment_gaps",
    label: "Check employment gaps",
    description: "Surface employment gaps in an application.",
    modules: ["safer_recruitment"],
    requiredPermission: "aria.recruitment",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Identify employment gaps in the source. List each gap with start and end dates, the candidate's explanation if given, and what should be explored at interview. Do not draw conclusions on suitability.",
  },
  draft_reference_request: {
    id: "draft_reference_request",
    label: "Draft reference request",
    description: "Draft a reference request to a previous employer.",
    modules: ["safer_recruitment"],
    requiredPermission: "aria.recruitment",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Draft a reference request for a candidate applying to a UK children's-home role. Cover dates of employment, role, performance, conduct, safeguarding concerns, and any reason not to re-employ. Polite, professional, and explicit on safeguarding.",
  },
  draft_reference_chaser: {
    id: "draft_reference_chaser",
    label: "Draft reference chaser",
    description: "Draft a polite reference chaser email.",
    modules: ["safer_recruitment"],
    requiredPermission: "aria.recruitment",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Draft a polite reference chaser. Reference the original request date. Offer a phone call or alternative format. Maintain a professional tone.",
  },
  draft_conditional_offer: {
    id: "draft_conditional_offer",
    label: "Draft conditional offer",
    description: "Draft a conditional offer letter.",
    modules: ["safer_recruitment"],
    requiredPermission: "aria.recruitment",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Draft a conditional offer letter for a UK children's-home role. State that the offer is conditional on satisfactory references, enhanced DBS, barred-list check where applicable, right-to-work evidence, qualification verification, health declaration, and probation. Warm and professional.",
  },
  draft_recruitment_decision_record: {
    id: "draft_recruitment_decision_record",
    label: "Draft recruitment decision record",
    description: "Draft the safer-recruitment decision record.",
    modules: ["safer_recruitment"],
    requiredPermission: "aria.recruitment",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Draft a safer-recruitment decision record. Cover panel members, evidence reviewed, scoring, decision, rationale, and what conditions remain to be satisfied before the role can be confirmed for unsupervised work.",
  },
  create_onboarding_tasks: {
    id: "create_onboarding_tasks",
    label: "Create onboarding tasks",
    description: "Build an onboarding task list for a new starter.",
    modules: ["safer_recruitment"],
    requiredPermission: "aria.create_tasks",
    approvalRequired: true,
    canCreateTasks: true,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Build an onboarding task list for a new UK children's-home starter. Cover induction, safer recruitment evidence still to gather, training, shadow shifts, supervision schedule, and probation milestones.",
  },
  check_missing_recruitment_evidence: {
    id: "check_missing_recruitment_evidence",
    label: "Check missing recruitment evidence",
    description: "List missing safer-recruitment evidence on a candidate.",
    modules: ["safer_recruitment"],
    requiredPermission: "aria.recruitment",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "List missing safer-recruitment evidence on the source. Cover application form completeness, employment history, gaps explored, identity, right to work, enhanced DBS, barred list where applicable, references received and verified, interview notes, qualification check, health declaration, induction plan, manager sign-off. Do not declare a candidate as safe; only identify what is missing.",
  },
  safer_recruitment_checklist_review: {
    id: "safer_recruitment_checklist_review",
    label: "Review safer recruitment checklist",
    description: "Review the full safer-recruitment checklist and summarise the gate position.",
    modules: ["safer_recruitment"],
    requiredPermission: "aria.recruitment",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Review the safer-recruitment checklist against Regulation 32/33 requirements. Summarise which checks are satisfied, which are outstanding, and whether a senior risk acceptance would be appropriate. Do not declare a candidate safe or unsafe; present the evidence position.",
  },

  // ── RI / QA ──────────────────────────────────────────────────────────────
  responsible_individual_qa_summary: {
    id: "responsible_individual_qa_summary",
    label: "RI quality assurance summary",
    description: "Draft a Responsible Individual quality-assurance summary across the home.",
    modules: ["ri_dashboard", "quality_assurance"],
    requiredPermission: "aria.analyse_risk",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Draft a Responsible Individual quality-assurance summary. Cover staffing, safeguarding, child voice, management oversight quality, incident themes, complaints, compliance position, and areas of concern. Stay grounded in the source. Recommend RI review on every output.",
  },
  regulation_44_summary: {
    id: "regulation_44_summary",
    label: "Draft Regulation 44 summary",
    description: "Draft a Regulation 44 independent visitor report summary.",
    modules: ["ri_dashboard", "quality_assurance", "regulation_44"],
    requiredPermission: "aria.analyse_risk",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Draft a Regulation 44 independent visitor report summary. Cover the visit date, children spoken to, staff spoken to, environment, records reviewed, findings, recommendations, and the visitor's overall assessment. Stay grounded in the source. This is a draft for the RI to review and finalise.",
  },
  regulation_45_summary: {
    id: "regulation_45_summary",
    label: "Draft Regulation 45 summary",
    description: "Draft a Regulation 45 quality-of-care review summary.",
    modules: ["ri_dashboard", "quality_assurance", "regulation_45"],
    requiredPermission: "aria.analyse_risk",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Draft a Regulation 45 quality-of-care review summary covering the six-monthly period. Aggregate Regulation 44 findings, incident trends, complaint themes, child voice, staffing stability, training compliance, and improvement trajectory. Stay grounded in the source. Recommend RI review on every output.",
  },
  monthly_quality_summary: {
    id: "monthly_quality_summary",
    label: "Draft monthly quality summary",
    description: "Draft a monthly quality summary for the home.",
    modules: ["ri_dashboard", "quality_assurance"],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Draft a monthly quality summary. Cover incidents, complaints, safeguarding, child voice, staffing, management oversight, training, and any themes or patterns. Stay grounded in the source. Present data, not opinions.",
  },
  identify_home_wide_themes: {
    id: "identify_home_wide_themes",
    label: "Identify home-wide themes",
    description: "Surface recurring themes across the home's records.",
    modules: ["ri_dashboard", "quality_assurance", "management_oversight"],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Surface recurring themes across the source records. Group by category (safeguarding, behaviour, staffing, recording quality, child voice, environment). For each theme: what the pattern is, how many records support it, and what it might mean for practice. Stay grounded in the source.",
  },
  identify_repeated_shortfalls: {
    id: "identify_repeated_shortfalls",
    label: "Identify repeated shortfalls",
    description: "Flag shortfalls that recur across records or audits.",
    modules: ["ri_dashboard", "quality_assurance", "audit"],
    requiredPermission: "aria.analyse_risk",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Identify shortfalls that recur across the source. For each: what the shortfall is, how many times it appears, the records that evidence it, and what action has or has not been taken. Flag any shortfall that has been raised before and not resolved.",
  },
  create_service_improvement_plan: {
    id: "create_service_improvement_plan",
    label: "Create service improvement plan",
    description: "Build a service improvement plan from the source findings.",
    modules: ["ri_dashboard", "quality_assurance", "audit"],
    requiredPermission: "aria.create_tasks",
    approvalRequired: true,
    canCreateTasks: true,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Build a service improvement plan. Each action: quality area, finding, action, owner role, due-day count, priority, and what success looks like. Group by Quality Standard where possible. Stay grounded in the source.",
  },
  prepare_ofsted_readiness_summary: {
    id: "prepare_ofsted_readiness_summary",
    label: "Prepare Ofsted readiness summary",
    description: "Draft a summary of the home's readiness position against the SCCIF.",
    modules: ["ri_dashboard", "quality_assurance"],
    requiredPermission: "aria.analyse_risk",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Draft an Ofsted readiness summary against the SCCIF judgement areas: overall experiences and progress of children, how well children are helped and protected, and the effectiveness of leaders and managers. For each area: strengths evidenced in the source, areas for development, and critical gaps. Recommend RM/RI review on every output.",
  },
  audit_evidence_summary: {
    id: "audit_evidence_summary",
    label: "Summarise audit evidence",
    description: "Compile an evidence summary suitable for an auditor or inspector.",
    modules: ["ri_dashboard", "quality_assurance", "audit"],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Compile an evidence summary suitable for an auditor or inspector. Cover what evidence exists, where it is held, key dates, and any gaps. Stay grounded in the source. Present evidence, not opinion.",
  },

  // ── Tasks (domain-specific creators) ──────────────────────────────────────
  create_task_from_incident: {
    id: "create_task_from_incident",
    label: "Create task from incident",
    description: "Create a structured task from an incident record.",
    modules: ["incident"],
    requiredPermission: "aria.create_tasks",
    approvalRequired: true,
    canCreateTasks: true,
    canCommit: false,
    riskLevel: "high",
    systemPromptFragment:
      "Create a structured task from the incident. Title, description, owner role, due-day count, priority. Mark safeguarding follow-ups as urgent. Link back to the incident record. Do not invent actions the incident does not raise.",
  },
  create_task_from_audit: {
    id: "create_task_from_audit",
    label: "Create task from audit",
    description: "Create a structured task from an audit finding.",
    modules: ["audit"],
    requiredPermission: "aria.create_tasks",
    approvalRequired: true,
    canCreateTasks: true,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Create a structured task from the audit finding. Title, description, quality area, owner role, due-day count, priority, and what done looks like. Link back to the audit finding.",
  },
  create_task_from_oversight: {
    id: "create_task_from_oversight",
    label: "Create task from oversight",
    description: "Create a structured task from a management oversight comment.",
    modules: ["management_oversight"],
    requiredPermission: "aria.create_tasks",
    approvalRequired: true,
    canCreateTasks: true,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Create a structured task from the oversight comment. Title, description, owner role, due-day count, priority. Link back to the oversight record. Do not invent actions the oversight does not raise.",
  },
  escalate_overdue_task: {
    id: "escalate_overdue_task",
    label: "Draft overdue task escalation",
    description: "Draft an escalation note for an overdue task.",
    modules: [],
    requiredPermission: "aria.create_tasks",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Draft an escalation note for the overdue task. Cover: original task, who it was assigned to, original due date, days overdue, impact of the delay, and recommended next step. Be factual and professional.",
  },

  // ── Calendar ─────────────────────────────────────────────────────────────
  prepare_meeting_agenda: {
    id: "prepare_meeting_agenda",
    label: "Prepare meeting agenda",
    description: "Build a meeting agenda from the source context.",
    modules: ["calendar", "supervision", "team_meeting"],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Build a meeting agenda. Items should be specific, with brief context notes for each item and a suggested time allocation. Include standing items relevant to children's homes (safeguarding updates, child voice, staffing, training, maintenance). Include AOB.",
  },
  draft_meeting_minutes: {
    id: "draft_meeting_minutes",
    label: "Draft meeting minutes",
    description: "Convert meeting notes into structured minutes.",
    modules: ["calendar", "supervision", "team_meeting"],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Turn the source notes into meeting minutes. Sections: meeting title, date, attendees, apologies, items discussed, decisions, actions with owner and due date, next meeting date. Stay grounded in the source.",
  },
  create_calendar_follow_up_tasks: {
    id: "create_calendar_follow_up_tasks",
    label: "Create follow-up tasks from meeting",
    description: "Extract follow-up tasks from meeting notes or minutes.",
    modules: ["calendar", "supervision", "team_meeting"],
    requiredPermission: "aria.create_tasks",
    approvalRequired: true,
    canCreateTasks: true,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Extract follow-up tasks from the meeting notes. Each task: title, description, owner (name or role from the source), due-day count, priority. Mark safeguarding-touching actions as urgent. Do not invent tasks the source does not raise.",
  },
  identify_upcoming_compliance_dates: {
    id: "identify_upcoming_compliance_dates",
    label: "Identify upcoming compliance dates",
    description: "Surface upcoming regulatory and compliance deadlines.",
    modules: ["calendar", "ri_dashboard", "quality_assurance"],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Surface upcoming compliance and regulatory deadlines from the source. Cover DBS renewals, training expiry, Regulation 44 visit due dates, Regulation 45 review periods, probation milestones, supervision due dates, and any home-specific compliance requirements. Order by date.",
  },
  equality_diversity_calendar_prompt: {
    id: "equality_diversity_calendar_prompt",
    label: "Equality and diversity calendar prompt",
    description: "Suggest equality and diversity awareness activities for the upcoming period.",
    modules: ["calendar", "team_meeting"],
    requiredPermission: "aria.generate_drafts",
    approvalRequired: true,
    canCreateTasks: false,
    canCommit: false,
    riskLevel: "low",
    systemPromptFragment:
      "Suggest equality and diversity awareness activities for the children's home for the upcoming period. Consider cultural celebrations, awareness days, and opportunities to support children's identity development. Be age-appropriate and relevant to residential childcare. Stay grounded in any context provided.",
  },
  trigger_related_document_update: {
    id: "trigger_related_document_update",
    label: "Trigger related document update",
    description: "Identify documents that may need updating following a change.",
    modules: ["documents"],
    requiredPermission: "aria.summarise",
    approvalRequired: true,
    canCreateTasks: true,
    canCommit: false,
    riskLevel: "medium",
    systemPromptFragment:
      "Identify documents, plans, or records that may need updating following the change described in the source. For each: document type, why it may need updating, and suggested action. Stay grounded in the source.",
  },
};

// ─── Public service entry points ────────────────────────────────────────────

export interface AriaInvokeArgs extends AriaInvocationInput {
  actor: AriaActor;
}

export interface AriaInvokeOutcome {
  ok: boolean;
  result?: AriaGenerationResult;
  errorReason?: string;
  status: number;
  providerConfig: AriaProviderConfig;
}

export async function invokeAriaCommand(
  args: AriaInvokeArgs,
): Promise<AriaInvokeOutcome> {
  const providerConfig = getAriaProviderConfig();
  const command = ARIA_COMMANDS[args.commandId];
  if (!command) {
    return {
      ok: false,
      errorReason: `Unknown or unsupported command: ${args.commandId}`,
      status: 400,
      providerConfig,
    };
  }

  // Permission check
  const access = checkAriaAccess(args.actor, {
    permission: command.requiredPermission,
    organisationId: args.organisationId,
    homeId: args.homeId,
    childId: args.childId,
    staffId: args.staffId,
    isSafeguardingSensitive: command.riskLevel === "high",
  });
  if (!access.allowed) {
    await writeAuditEvent({
      requestId: null,
      outputId: null,
      actorUserId: args.actor.userId,
      actorRole: args.actor.role,
      eventType: "permission_denied",
      eventDetail: { reason: access.reason, commandId: command.id },
    });
    return {
      ok: false,
      errorReason: access.reason ?? "Access denied",
      status: 403,
      providerConfig,
    };
  }

  // Build the prompts
  const systemPrompt = buildSystemPrompt(command);
  const userPrompt = buildUserPrompt(args);

  // Persist the request (best effort — if Supabase is not configured, we
  // still call the provider and return the draft, but with persisted=false).
  const requestId = `aria_req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const supabaseRaw = createServerClient();
  const supabase = supabaseRaw ? loose(supabaseRaw) : null;

  if (supabase) {
    await supabase.from("aria_requests").insert({
      id: requestId,
      organisation_id: args.organisationId ?? null,
      home_id: args.homeId ?? null,
      child_id: args.childId ?? null,
      staff_id: args.staffId ?? null,
      source_module: args.sourceModule ?? null,
      source_record_type: args.sourceRecordType ?? null,
      source_record_id: args.sourceRecordId ?? null,
      command_id: command.id,
      user_id: args.actor.userId,
      user_role: args.actor.role,
      input_text: args.inputText ?? null,
      input_metadata: args.inputMetadata ?? {},
      status: "context_built",
      llm_used: false,
      provider_id: providerConfig.providerId,
      model_id: providerConfig.textModel,
    });
  }

  // Provider call
  const generation = await generateText({
    systemPrompt,
    userPrompt,
    expectJson: false,
  });

  const cleanedText = applyAriaPostprocessor(generation.text);
  const confidence = inferConfidence(command, cleanedText);
  const outputId = `aria_out_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  if (supabase) {
    await supabase
      .from("aria_requests")
      .update({
        status: generation.llmUsed ? "complete" : "provider_failed",
        llm_used: generation.llmUsed,
      })
      .eq("id", requestId);

    await supabase.from("aria_outputs").insert({
      id: outputId,
      request_id: requestId,
      generated_text: cleanedText,
      structured_output: {},
      approval_required: command.approvalRequired,
      status: "draft",
      confidence,
      redacted_context_summary: redactedContextSummaryFor(args),
      context_record_ids: contextRecordIdsFor(args),
    });

    await writeAuditEvent({
      requestId,
      outputId,
      actorUserId: args.actor.userId,
      actorRole: args.actor.role,
      eventType: generation.llmUsed ? "generated" : "failed",
      eventDetail: {
        commandId: command.id,
        providerId: generation.providerId,
        modelId: generation.modelId,
        configured: providerConfig.configured,
      },
    });
  }

  return {
    ok: true,
    result: {
      requestId,
      outputId: supabase ? outputId : undefined,
      generatedText: cleanedText,
      structuredOutput: {},
      confidence,
      redactedContextSummary: redactedContextSummaryFor(args),
      contextRecordIds: contextRecordIdsFor(args),
      ariaLabel: "Aria suggested draft",
      llmUsed: generation.llmUsed,
      providerId: generation.providerId,
      modelId: generation.modelId,
      approvalRequired: command.approvalRequired,
      persisted: !!supabase,
    },
    status: 200,
    providerConfig,
  };
}

// ─── Audit helper ────────────────────────────────────────────────────────────

export interface WriteAuditEventArgs {
  requestId: string | null;
  outputId: string | null;
  actorUserId: string;
  actorRole?: string;
  eventType:
    | "generated"
    | "edited"
    | "submitted_for_approval"
    | "approved"
    | "rejected"
    | "committed"
    | "transcribed"
    | "copied_to_field"
    | "task_created"
    | "context_viewed"
    | "failed"
    | "permission_denied"
    | "withdrawn";
  eventDetail?: Record<string, unknown>;
}

export async function writeAuditEvent(args: WriteAuditEventArgs): Promise<void> {
  if (!isSupabaseEnabled()) return;
  const supabaseRaw = createServerClient();
  if (!supabaseRaw) return;
  const supabase = loose(supabaseRaw);
  await supabase.from("aria_audit_events").insert({
    id: `aria_aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    request_id: args.requestId,
    output_id: args.outputId,
    actor_user_id: args.actorUserId,
    actor_role: args.actorRole ?? null,
    event_type: args.eventType,
    event_detail: args.eventDetail ?? {},
  });
}

// ─── Approval lifecycle ────────────────────────────────────────────────────

export type AriaApprovalDecision = "approve" | "reject" | "request_changes" | "commit" | "withdraw";

export interface ApplyApprovalArgs {
  outputId: string;
  decision: AriaApprovalDecision;
  decisionText?: string;
  editedText?: string;
  committedRecordType?: string;
  committedRecordId?: string;
  actor: AriaActor;
  requiredPermission: AriaPermission;
}

export async function applyApprovalDecision(args: ApplyApprovalArgs): Promise<{
  ok: boolean;
  status: number;
  errorReason?: string;
}> {
  const access = checkAriaAccess(args.actor, { permission: args.requiredPermission });
  if (!access.allowed) {
    return { ok: false, status: 403, errorReason: access.reason ?? "Access denied" };
  }

  if (!isSupabaseEnabled()) {
    return { ok: false, status: 501, errorReason: "Persistence not configured" };
  }
  const supabaseRaw = createServerClient();
  if (!supabaseRaw) {
    return { ok: false, status: 501, errorReason: "Persistence not configured" };
  }
  const supabase = loose(supabaseRaw);

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updated_at: now };

  switch (args.decision) {
    case "approve":
      updates.status = "approved";
      updates.approved_by = args.actor.userId;
      updates.approved_at = now;
      if (args.editedText) updates.edited_text = args.editedText;
      break;
    case "reject":
      updates.status = "rejected";
      updates.rejected_by = args.actor.userId;
      updates.rejected_at = now;
      updates.rejection_reason = args.decisionText ?? "";
      break;
    case "request_changes":
      updates.status = "edited";
      if (args.editedText) updates.edited_text = args.editedText;
      break;
    case "commit":
      updates.status = "committed";
      updates.committed_record_type = args.committedRecordType ?? null;
      updates.committed_record_id = args.committedRecordId ?? null;
      break;
    case "withdraw":
      updates.status = "archived";
      break;
  }

  const { data: updated, error: updateError } = await supabase
    .from("aria_outputs")
    .update(updates)
    .eq("id", args.outputId)
    .select()
    .single();
  if (updateError) {
    return { ok: false, status: 500, errorReason: updateError.message };
  }

  await supabase.from("aria_approvals").insert({
    id: `aria_appr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    output_id: args.outputId,
    decision: args.decision,
    decided_by: args.actor.userId,
    decided_role: args.actor.role,
    decision_text: args.decisionText ?? null,
  });

  await writeAuditEvent({
    requestId: updated?.request_id ?? null,
    outputId: args.outputId,
    actorUserId: args.actor.userId,
    actorRole: args.actor.role,
    eventType:
      args.decision === "approve"
        ? "approved"
        : args.decision === "reject"
          ? "rejected"
          : args.decision === "request_changes"
            ? "edited"
            : args.decision === "commit"
              ? "committed"
              : "withdrawn",
    eventDetail: { decisionText: args.decisionText },
  });

  return { ok: true, status: 200 };
}

// ─── Internals ──────────────────────────────────────────────────────────────

function buildSystemPrompt(command: AriaCommandSpec): string {
  return [
    "You are Aria, the intelligent professional assistant built into Cornerstone, the operating system for UK residential children's homes.",
    "",
    ARIA_PROFESSIONAL_IDENTITY_PROMPT,
    "",
    "Universal rules:",
    "- Output is always labelled as an Aria suggested draft. The Registered Manager remains the decision-maker and the author.",
    "- Use only the source provided. Do not invent facts. Do not invent chronology. Do not invent quotes from children or staff.",
    "- Never declare high confidence on safeguarding-, HR-, or legal-sensitive content unless the source evidence is unambiguous.",
    "",
    "Command-specific guidance:",
    command.systemPromptFragment,
    "",
    ARIA_WRITING_STYLE_PROMPT,
  ].join("\n");
}

function buildUserPrompt(args: AriaInvokeArgs): string {
  const lines: string[] = [];
  lines.push(`COMMAND: ${args.commandId}`);
  if (args.homeId) lines.push(`HOME: ${args.homeId}`);
  if (args.childId) lines.push(`CHILD REFERENCE: ${args.childId}`);
  if (args.sourceModule) lines.push(`SOURCE MODULE: ${args.sourceModule}`);
  if (args.sourceRecordId) lines.push(`SOURCE RECORD: ${args.sourceRecordType ?? ""} ${args.sourceRecordId}`);
  lines.push("");
  lines.push("USER INPUT (the source text Aria should work from):");
  lines.push(args.inputText ?? "(no input text provided)");
  if (args.inputMetadata && Object.keys(args.inputMetadata).length > 0) {
    lines.push("");
    lines.push("ADDITIONAL CONTEXT (metadata, do not invent beyond this):");
    lines.push(JSON.stringify(args.inputMetadata, null, 2));
  }
  return lines.join("\n");
}

function inferConfidence(command: AriaCommandSpec, text: string): AriaConfidence {
  if (command.riskLevel === "high") return "low";
  if (command.riskLevel === "medium") return "medium";
  if (text.length < 60) return "low";
  return "medium";
}

function redactedContextSummaryFor(args: AriaInvokeArgs): string {
  const parts: string[] = [];
  if (args.homeId) parts.push(`home=${args.homeId}`);
  if (args.childId) parts.push(`child=${args.childId}`);
  if (args.sourceModule) parts.push(`module=${args.sourceModule}`);
  if (args.sourceRecordId) parts.push(`record=${args.sourceRecordId}`);
  if (args.inputText) parts.push(`inputText=${args.inputText.length}_chars`);
  return parts.join("; ");
}

function contextRecordIdsFor(args: AriaInvokeArgs): string[] {
  const ids: string[] = [];
  if (args.sourceRecordId) ids.push(args.sourceRecordId);
  return ids;
}

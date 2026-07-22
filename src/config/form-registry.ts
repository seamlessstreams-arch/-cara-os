// ══════════════════════════════════════════════════════════════════════════════
// CARA — FORM REGISTRY
// Single source of truth for every form/record type in the system.
// Replaces the scattered GLOBAL_CREATE_ITEMS approach with a structured,
// domain-aware, searchable registry.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export type FormDomain = "young_person" | "employee" | "home";
export type FormCategory = string;
export type FormUrgency = "routine" | "urgent" | "emergency";

export interface FormDefinition {
  id: string;
  label: string;
  domain: FormDomain;
  category: FormCategory;
  icon: string;
  description: string;
  href: string;
  module?: string;
  urgency?: FormUrgency;
  requiresChild?: boolean;
  requiresStaff?: boolean;
  schedulable?: boolean;
  tags?: string[];
}

// ── Domain configuration ─────────────────────────────────────────────────────

export const DOMAIN_CONFIG: Record<
  FormDomain,
  { label: string; icon: string; color: string; description: string }
> = {
  young_person: {
    label: "Young Person",
    icon: "HeartHandshake",
    color: "text-rose-600",
    description: "Care records, plans, and assessments",
  },
  employee: {
    label: "Employees",
    icon: "Users",
    color: "text-blue-600",
    description: "Staff supervision, training, and development",
  },
  home: {
    label: "Home",
    icon: "Building2",
    color: "text-amber-600",
    description: "Safety, premises, compliance, and operations",
  },
};

// ── Category labels ──────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  // Young Person categories
  daily_care:     { label: "Daily Care",     icon: "BookOpen"       },
  safeguarding:   { label: "Safeguarding",   icon: "Shield"         },
  health:         { label: "Health",         icon: "Stethoscope"    },
  education:      { label: "Education",      icon: "GraduationCap"  },
  relationships:  { label: "Relationships",  icon: "Heart"          },
  planning:       { label: "Planning",       icon: "ClipboardList"  },
  voice:          { label: "Voice of Child", icon: "Mic"            },
  documents:      { label: "Documents",      icon: "FileText"       },

  // Employee categories
  supervision:    { label: "Supervision",    icon: "MessageSquare"  },
  development:    { label: "Development",    icon: "TrendingUp"     },
  performance:    { label: "Performance",    icon: "Target"         },
  wellbeing:      { label: "Wellbeing",      icon: "HeartPulse"     },
  compliance:     { label: "Compliance",     icon: "ShieldCheck"    },
  operations:     { label: "Operations",     icon: "Settings"       },

  // Home categories
  safety:         { label: "Safety",         icon: "Flame"          },
  premises:       { label: "Premises",       icon: "Building2"      },
  governance:     { label: "Governance",     icon: "Gavel"          },

  // Shared
  custom:         { label: "Custom",         icon: "Sparkles"       },
};

// ══════════════════════════════════════════════════════════════════════════════
// FORM REGISTRY
// ══════════════════════════════════════════════════════════════════════════════

export const FORM_REGISTRY: FormDefinition[] = [
  // ────────────────────────────────────────────────────────────────────────────
  // YOUNG PERSON DOMAIN
  // ────────────────────────────────────────────────────────────────────────────

  // ── daily_care ─────────────────────────────────────────────────────────────

  {
    id: "daily_log",
    label: "Daily Log",
    domain: "young_person",
    category: "daily_care",
    icon: "BookOpen",
    description: "Record daily activities, observations, and notable events for a child",
    href: "/forms/new?formId=daily_log",
    module: "daily-log",
    urgency: "routine",
    requiresChild: true,
    schedulable: true,
    tags: ["daily", "log", "record", "observation", "notes"],
  },
  {
    id: "night_log",
    label: "Night Log",
    domain: "young_person",
    category: "daily_care",
    icon: "Moon",
    description: "Record overnight observations and events during waking night shifts",
    href: "/forms/new?formId=night_log",
    module: "dashboard",
    urgency: "routine",
    requiresChild: false,
    schedulable: true,
    tags: ["night", "waking", "overnight", "sleep"],
  },
  {
    id: "sleep_log",
    label: "Sleep Log",
    domain: "young_person",
    category: "daily_care",
    icon: "Moon",
    description: "Log a child's sleep patterns, quality, and any disturbances",
    href: "/forms/new?formId=sleep_log",
    module: "dashboard",
    urgency: "routine",
    requiresChild: true,
    schedulable: true,
    tags: ["sleep", "bedtime", "rest", "night"],
  },
  {
    id: "welfare_check",
    label: "Welfare Check",
    domain: "young_person",
    category: "daily_care",
    icon: "Eye",
    description: "Record a welfare check on a young person",
    href: "/forms/new?formId=welfare_check",
    module: "safeguarding",
    urgency: "routine",
    requiresChild: true,
    schedulable: true,
    tags: ["welfare", "check", "safety", "monitoring"],
  },
  {
    id: "night_check",
    label: "Night Check",
    domain: "young_person",
    category: "daily_care",
    icon: "CloudMoon",
    description: "Record scheduled overnight checks on young people",
    href: "/forms/new?formId=night_check",
    module: "safeguarding",
    urgency: "routine",
    requiresChild: true,
    schedulable: true,
    tags: ["night", "check", "overnight", "monitoring"],
  },
  {
    id: "meal_record",
    label: "Meal Record",
    domain: "young_person",
    category: "daily_care",
    icon: "UtensilsCrossed",
    description: "Log meals eaten, dietary observations, and food preferences",
    href: "/forms/new?formId=meal_record",
    module: "buildings",
    urgency: "routine",
    requiresChild: true,
    schedulable: true,
    tags: ["meal", "food", "diet", "eating", "nutrition"],
  },

  // ── safeguarding ───────────────────────────────────────────────────────────

  {
    id: "incident",
    label: "Incident",
    domain: "young_person",
    category: "safeguarding",
    icon: "AlertTriangle",
    description: "Report a significant incident involving a young person",
    href: "/incidents/new",
    module: "incidents",
    urgency: "urgent",
    requiresChild: true,
    tags: ["incident", "report", "event", "significant"],
  },
  {
    id: "safeguarding_concern",
    label: "Safeguarding Concern",
    domain: "young_person",
    category: "safeguarding",
    icon: "Shield",
    description: "Raise a safeguarding concern about a young person",
    href: "/safeguarding/new",
    module: "safeguarding",
    urgency: "emergency",
    requiresChild: true,
    tags: ["safeguarding", "concern", "protection", "welfare", "abuse"],
  },
  {
    id: "risk_assessment_yp",
    label: "Risk Assessment",
    domain: "young_person",
    category: "safeguarding",
    icon: "ShieldAlert",
    description: "Complete a risk assessment for a young person",
    href: "/forms/new?formId=risk_assessment_yp",
    module: "safeguarding",
    urgency: "urgent",
    requiresChild: true,
    tags: ["risk", "assessment", "safety", "hazard"],
  },
  {
    id: "missing_from_home",
    label: "Missing From Home",
    domain: "young_person",
    category: "safeguarding",
    icon: "MapPin",
    description: "Report a young person as missing from the home",
    href: "/forms/new?formId=missing_from_home",
    module: "safeguarding",
    urgency: "emergency",
    requiresChild: true,
    tags: ["missing", "absent", "unauthorised", "awol"],
  },
  {
    id: "return_interview",
    label: "Return Interview",
    domain: "young_person",
    category: "safeguarding",
    icon: "MapPin",
    description: "Conduct a return interview after a missing episode",
    href: "/forms/new?formId=return_interview",
    module: "young-people",
    urgency: "urgent",
    requiresChild: true,
    tags: ["return", "interview", "missing", "debrief"],
  },
  {
    id: "restraint_record",
    label: "Restraint Record",
    domain: "young_person",
    category: "safeguarding",
    icon: "ShieldAlert",
    description: "Record a physical intervention or restraint event",
    href: "/forms/new?formId=restraint_record",
    module: "safeguarding",
    urgency: "urgent",
    requiresChild: true,
    tags: ["restraint", "physical", "intervention", "pi", "positive handling"],
  },
  {
    id: "body_map",
    label: "Body Map",
    domain: "young_person",
    category: "safeguarding",
    icon: "PersonStanding",
    description: "Record and map injuries or marks on a young person's body",
    href: "/forms/new?formId=body_map",
    module: "safeguarding",
    urgency: "urgent",
    requiresChild: true,
    tags: ["body", "map", "injury", "mark", "bruise"],
  },

  // ── health ─────────────────────────────────────────────────────────────────

  {
    id: "health_update",
    label: "Health Update",
    domain: "young_person",
    category: "health",
    icon: "Stethoscope",
    description: "Record a general health update for a young person",
    href: "/forms/new?formId=health_update",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    tags: ["health", "medical", "update", "condition"],
  },
  {
    id: "medication_entry",
    label: "Medication Entry",
    domain: "young_person",
    category: "health",
    icon: "Pill",
    description: "Log medication administration for a young person",
    href: "/forms/new?formId=medication_entry",
    module: "medication",
    urgency: "routine",
    requiresChild: true,
    schedulable: true,
    tags: ["medication", "medicine", "dose", "prescription", "MAR"],
  },
  {
    id: "gp_appointment",
    label: "GP Appointment",
    domain: "young_person",
    category: "health",
    icon: "Stethoscope",
    description: "Record a GP visit and outcomes",
    href: "/forms/new?formId=gp_appointment",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    schedulable: true,
    tags: ["gp", "doctor", "appointment", "visit", "medical"],
  },
  {
    id: "dental_record",
    label: "Dental Record",
    domain: "young_person",
    category: "health",
    icon: "Smile",
    description: "Record a dental appointment and outcomes",
    href: "/forms/new?formId=dental_record",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    schedulable: true,
    tags: ["dental", "dentist", "teeth", "orthodontic"],
  },
  {
    id: "eye_test",
    label: "Eye Test",
    domain: "young_person",
    category: "health",
    icon: "Eye",
    description: "Record an optician appointment and results",
    href: "/forms/new?formId=eye_test",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    schedulable: true,
    tags: ["eye", "optician", "vision", "sight", "glasses"],
  },
  {
    id: "mental_health_screening",
    label: "Mental Health Screening",
    domain: "young_person",
    category: "health",
    icon: "Brain",
    description: "Complete a mental health screening or check-in for a young person",
    href: "/forms/new?formId=mental_health_screening",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    schedulable: true,
    tags: ["mental", "health", "wellbeing", "screening", "emotional"],
  },
  {
    id: "immunisation_record",
    label: "Immunisation Record",
    domain: "young_person",
    category: "health",
    icon: "Syringe",
    description: "Log an immunisation or vaccination for a young person",
    href: "/forms/new?formId=immunisation_record",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    tags: ["immunisation", "vaccination", "jab", "vaccine"],
  },

  // ── education ──────────────────────────────────────────────────────────────

  {
    id: "education_update",
    label: "Education Update",
    domain: "young_person",
    category: "education",
    icon: "GraduationCap",
    description: "Record an education-related update or progress note",
    href: "/forms/new?formId=education_update",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    tags: ["education", "school", "learning", "progress"],
  },
  {
    id: "school_liaison",
    label: "School Liaison",
    domain: "young_person",
    category: "education",
    icon: "GraduationCap",
    description: "Log contact with the child's school or educational setting",
    href: "/forms/new?formId=school_liaison",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    tags: ["school", "liaison", "teacher", "education", "contact"],
  },
  {
    id: "homework_support",
    label: "Homework Support",
    domain: "young_person",
    category: "education",
    icon: "BookOpen",
    description: "Record homework support provided to a young person",
    href: "/forms/new?formId=homework_support",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    tags: ["homework", "support", "study", "learning"],
  },
  {
    id: "pep_review",
    label: "PEP Review",
    domain: "young_person",
    category: "education",
    icon: "GraduationCap",
    description: "Record a Personal Education Plan review",
    href: "/forms/new?formId=pep_review",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    schedulable: true,
    tags: ["PEP", "education", "plan", "review", "personal"],
  },
  {
    id: "attendance_record",
    label: "Attendance Record",
    domain: "young_person",
    category: "education",
    icon: "CalendarDays",
    description: "Log school attendance or absence for a young person",
    href: "/forms/new?formId=attendance_record",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    schedulable: true,
    tags: ["attendance", "absence", "school", "truancy"],
  },

  // ── relationships ──────────────────────────────────────────────────────────

  {
    id: "family_contact",
    label: "Family Contact",
    domain: "young_person",
    category: "relationships",
    icon: "PhoneCall",
    description: "Record contact between a young person and their family",
    href: "/forms/new?formId=family_contact",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    tags: ["family", "contact", "parent", "relative", "phone", "visit"],
  },
  {
    id: "professional_contact",
    label: "Professional Contact",
    domain: "young_person",
    category: "relationships",
    icon: "Stethoscope",
    description: "Log contact with a professional involved in the child's care",
    href: "/forms/new?formId=professional_contact",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    tags: ["professional", "contact", "social worker", "CAMHS", "consultation"],
  },
  {
    id: "key_work_session",
    label: "Key Work Session",
    domain: "young_person",
    category: "relationships",
    icon: "MessageSquare",
    description: "Record a key working session with a young person",
    href: "/forms/new?formId=key_work_session",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    schedulable: true,
    tags: ["key work", "session", "1:1", "keyworker"],
  },
  {
    id: "direct_work_session",
    label: "Direct Work Session",
    domain: "young_person",
    category: "relationships",
    icon: "Heart",
    description: "Record a direct work session or therapeutic activity",
    href: "/forms/new?formId=direct_work_session",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    tags: ["direct work", "therapeutic", "activity", "session"],
  },
  {
    id: "advocacy_visit",
    label: "Advocacy Visit",
    domain: "young_person",
    category: "relationships",
    icon: "Scale",
    description: "Record an advocacy visit or advocacy support",
    href: "/forms/new?formId=advocacy_visit",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    tags: ["advocacy", "visit", "independent", "rights"],
  },
  {
    id: "sibling_contact",
    label: "Sibling Contact",
    domain: "young_person",
    category: "relationships",
    icon: "Users",
    description: "Log contact between siblings",
    href: "/forms/new?formId=sibling_contact",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    tags: ["sibling", "brother", "sister", "contact", "family"],
  },

  // ── planning ───────────────────────────────────────────────────────────────

  {
    id: "care_plan",
    label: "Care Plan",
    domain: "young_person",
    category: "planning",
    icon: "ClipboardList",
    description: "Create or update a young person's care plan",
    href: "/care-plans/new",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    schedulable: true,
    tags: ["care", "plan", "goals", "objectives"],
  },
  {
    id: "pathway_plan",
    label: "Pathway Plan",
    domain: "young_person",
    category: "planning",
    icon: "Milestone",
    description: "Create or review a pathway plan for a young person aged 16+",
    href: "/forms/new?formId=pathway_plan",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    schedulable: true,
    tags: ["pathway", "plan", "16+", "leaving care", "independence"],
  },
  {
    id: "placement_plan",
    label: "Placement Plan",
    domain: "young_person",
    category: "planning",
    icon: "ListChecks",
    description: "Create or update a young person's placement plan",
    href: "/forms/new?formId=placement_plan",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    tags: ["placement", "plan", "objectives", "arrangements"],
  },
  {
    id: "transition_plan",
    label: "Transition Plan",
    domain: "young_person",
    category: "planning",
    icon: "ArrowRightLeft",
    description: "Plan for a young person's transition (placement move, leaving care, etc.)",
    href: "/forms/new?formId=transition_plan",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    tags: ["transition", "plan", "move", "leaving", "independence"],
  },
  {
    id: "behaviour_support_plan",
    label: "Behaviour Support Plan",
    domain: "young_person",
    category: "planning",
    icon: "Shield",
    description: "Create or review a behaviour support plan",
    href: "/forms/new?formId=behaviour_support_plan",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    tags: ["behaviour", "support", "plan", "strategies", "positive"],
  },

  // ── voice ──────────────────────────────────────────────────────────────────

  {
    id: "child_consultation",
    label: "Child Consultation",
    domain: "young_person",
    category: "voice",
    icon: "Mic",
    description: "Record a consultation capturing the child's views",
    href: "/forms/new?formId=child_consultation",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    tags: ["consultation", "voice", "views", "participation"],
  },
  {
    id: "wishes_and_feelings",
    label: "Wishes & Feelings",
    domain: "young_person",
    category: "voice",
    icon: "Heart",
    description: "Capture a young person's wishes and feelings",
    href: "/forms/new?formId=wishes_and_feelings",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    tags: ["wishes", "feelings", "voice", "views", "child"],
  },
  {
    id: "complaint_yp",
    label: "Complaint",
    domain: "young_person",
    category: "voice",
    icon: "MessageCircle",
    description: "Record a complaint raised by or on behalf of a young person",
    href: "/forms/new?formId=complaint_yp",
    module: "incidents",
    urgency: "urgent",
    requiresChild: true,
    tags: ["complaint", "concern", "feedback", "dissatisfaction"],
  },
  {
    id: "achievement_record",
    label: "Achievement Record",
    domain: "young_person",
    category: "voice",
    icon: "Award",
    description: "Celebrate and record a young person's achievement",
    href: "/forms/new?formId=achievement_record",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    tags: ["achievement", "award", "success", "celebration", "positive"],
  },
  {
    id: "life_story_work",
    label: "Life Story Work",
    domain: "young_person",
    category: "voice",
    icon: "BookHeart",
    description: "Record a life story work session with a young person",
    href: "/forms/new?formId=life_story_work",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    tags: ["life story", "history", "identity", "memory", "narrative"],
  },

  // ── documents ──────────────────────────────────────────────────────────────

  {
    id: "document_upload_yp",
    label: "Document Upload",
    domain: "young_person",
    category: "documents",
    icon: "Upload",
    description: "Upload a document to a young person's file",
    href: "/forms/new?formId=document_upload_yp",
    module: "documents",
    urgency: "routine",
    requiresChild: true,
    tags: ["document", "upload", "file", "attachment"],
  },
  {
    id: "court_report",
    label: "Court Report",
    domain: "young_person",
    category: "documents",
    icon: "Gavel",
    description: "Record or upload a court report",
    href: "/forms/new?formId=court_report",
    module: "young-people",
    urgency: "urgent",
    requiresChild: true,
    tags: ["court", "report", "legal", "hearing"],
  },
  {
    id: "review_meeting_notes",
    label: "Review Meeting Notes",
    domain: "young_person",
    category: "documents",
    icon: "FileText",
    description: "Record notes from a review meeting",
    href: "/forms/new?formId=review_meeting_notes",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    tags: ["review", "meeting", "notes", "minutes"],
  },
  {
    id: "lac_review",
    label: "LAC Review",
    domain: "young_person",
    category: "documents",
    icon: "Gavel",
    description: "Record outcomes from a LAC review",
    href: "/forms/new?formId=lac_review",
    module: "young-people",
    urgency: "routine",
    requiresChild: true,
    schedulable: true,
    tags: ["LAC", "review", "looked after", "statutory"],
  },

  // ── custom (young person) ──────────────────────────────────────────────────

  {
    id: "custom_form_yp",
    label: "Custom Form",
    domain: "young_person",
    category: "custom",
    icon: "Sparkles",
    description: "Create a custom record for a young person",
    href: "/forms/new?domain=young_person",
    module: "forms",
    urgency: "routine",
    requiresChild: true,
    tags: ["custom", "form", "bespoke", "other"],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // EMPLOYEE DOMAIN
  // ────────────────────────────────────────────────────────────────────────────

  // ── supervision ────────────────────────────────────────────────────────────

  {
    id: "supervision",
    label: "Supervision",
    domain: "employee",
    category: "supervision",
    icon: "MessageSquare",
    description: "Record a formal supervision session with a staff member",
    href: "/supervision/new",
    module: "supervision",
    urgency: "routine",
    requiresStaff: true,
    schedulable: true,
    tags: ["supervision", "1:1", "support", "management"],
  },
  {
    id: "observation",
    label: "Observation",
    domain: "employee",
    category: "supervision",
    icon: "Eye",
    description: "Record a practice observation of a staff member",
    href: "/forms/new?formId=observation",
    module: "staff",
    urgency: "routine",
    requiresStaff: true,
    schedulable: true,
    tags: ["observation", "practice", "watch", "assess"],
  },
  {
    id: "practice_assessment",
    label: "Practice Assessment",
    domain: "employee",
    category: "supervision",
    icon: "ClipboardCheck",
    description: "Complete a practice assessment for a staff member",
    href: "/forms/new?formId=practice_assessment",
    module: "staff",
    urgency: "routine",
    requiresStaff: true,
    tags: ["practice", "assessment", "competency", "skills"],
  },

  // ── development ────────────────────────────────────────────────────────────

  {
    id: "training_record",
    label: "Training Record",
    domain: "employee",
    category: "development",
    icon: "GraduationCap",
    description: "Log a training course completed by a staff member",
    href: "/forms/new?formId=training_record",
    module: "training",
    urgency: "routine",
    requiresStaff: true,
    tags: ["training", "course", "learning", "certificate"],
  },
  {
    id: "development_plan",
    label: "Development Plan",
    domain: "employee",
    category: "development",
    icon: "TrendingUp",
    description: "Create or update a professional development plan",
    href: "/forms/new?formId=development_plan",
    module: "staff",
    urgency: "routine",
    requiresStaff: true,
    schedulable: true,
    tags: ["development", "plan", "goals", "career", "growth"],
  },
  {
    id: "cpd_record",
    label: "CPD Record",
    domain: "employee",
    category: "development",
    icon: "BookOpen",
    description: "Record a continuing professional development activity",
    href: "/forms/new?formId=cpd_record",
    module: "staff",
    urgency: "routine",
    requiresStaff: true,
    tags: ["CPD", "development", "professional", "learning"],
  },
  {
    id: "qualification_record",
    label: "Qualification Record",
    domain: "employee",
    category: "development",
    icon: "Award",
    description: "Record a qualification achieved by a staff member",
    href: "/forms/new?formId=qualification_record",
    module: "staff",
    urgency: "routine",
    requiresStaff: true,
    tags: ["qualification", "certificate", "diploma", "NVQ", "degree"],
  },

  // ── performance ────────────────────────────────────────────────────────────

  {
    id: "performance_support_plan",
    label: "Performance Support Plan",
    domain: "employee",
    category: "performance",
    icon: "Target",
    description: "Create a performance improvement or support plan",
    href: "/forms/new?formId=performance_support_plan",
    module: "staff",
    urgency: "routine",
    requiresStaff: true,
    tags: ["performance", "improvement", "support", "capability"],
  },
  {
    id: "appraisal",
    label: "Appraisal",
    domain: "employee",
    category: "performance",
    icon: "UserCheck",
    description: "Complete an annual appraisal for a staff member",
    href: "/forms/new?formId=appraisal",
    module: "staff",
    urgency: "routine",
    requiresStaff: true,
    schedulable: true,
    tags: ["appraisal", "annual", "review", "performance"],
  },
  {
    id: "competency_assessment",
    label: "Competency Assessment",
    domain: "employee",
    category: "performance",
    icon: "CheckSquare",
    description: "Assess staff competencies against role requirements",
    href: "/forms/new?formId=competency_assessment",
    module: "staff",
    urgency: "routine",
    requiresStaff: true,
    tags: ["competency", "assessment", "skills", "capability"],
  },

  // ── wellbeing ──────────────────────────────────────────────────────────────

  {
    id: "wellbeing_check_in",
    label: "Wellbeing Check-In",
    domain: "employee",
    category: "wellbeing",
    icon: "HeartPulse",
    description: "Record a wellbeing check-in with a staff member",
    href: "/forms/new?formId=wellbeing_check_in",
    module: "staff",
    urgency: "routine",
    requiresStaff: true,
    schedulable: true,
    tags: ["wellbeing", "welfare", "health", "support"],
  },
  {
    id: "staff_debrief",
    label: "Staff Debrief",
    domain: "employee",
    category: "wellbeing",
    icon: "Heart",
    description: "Record a debrief session with a staff member following an incident",
    href: "/forms/new?formId=staff_debrief",
    module: "staff",
    urgency: "urgent",
    requiresStaff: true,
    tags: ["debrief", "incident", "support", "reflection"],
  },
  {
    id: "return_to_work",
    label: "Return to Work",
    domain: "employee",
    category: "wellbeing",
    icon: "UserCheck",
    description: "Complete a return-to-work interview after sickness absence",
    href: "/forms/new?formId=return_to_work",
    module: "staff",
    urgency: "routine",
    requiresStaff: true,
    tags: ["return", "work", "sickness", "absence", "interview"],
  },

  // ── compliance (employee) ──────────────────────────────────────────────────

  {
    id: "dbs_check",
    label: "DBS Check",
    domain: "employee",
    category: "compliance",
    icon: "Fingerprint",
    description: "Record a DBS check status or update for a staff member",
    href: "/forms/new?formId=dbs_check",
    module: "recruitment",
    urgency: "routine",
    requiresStaff: true,
    schedulable: true,
    tags: ["DBS", "check", "disclosure", "barring", "criminal"],
  },
  {
    id: "mandatory_training",
    label: "Mandatory Training",
    domain: "employee",
    category: "compliance",
    icon: "GraduationCap",
    description: "Log completion of mandatory training",
    href: "/forms/new?formId=mandatory_training",
    module: "training",
    urgency: "routine",
    requiresStaff: true,
    schedulable: true,
    tags: ["mandatory", "training", "compliance", "required"],
  },
  {
    id: "policy_acknowledgement",
    label: "Policy Acknowledgement",
    domain: "employee",
    category: "compliance",
    icon: "FileCheck",
    description: "Record a staff member's acknowledgement of a policy",
    href: "/forms/new?formId=policy_acknowledgement",
    module: "staff",
    urgency: "routine",
    requiresStaff: true,
    tags: ["policy", "acknowledgement", "handbook", "sign-off"],
  },

  // ── operations (employee) ──────────────────────────────────────────────────

  {
    id: "task",
    label: "Task",
    domain: "employee",
    category: "operations",
    icon: "CheckSquare",
    description: "Create a task for a staff member",
    href: "/tasks/new",
    module: "tasks",
    urgency: "routine",
    requiresStaff: false,
    tags: ["task", "action", "todo", "assign"],
  },
  {
    id: "meeting_note",
    label: "Meeting Note",
    domain: "employee",
    category: "operations",
    icon: "MessageSquare",
    description: "Record minutes or notes from a team meeting",
    href: "/forms/new?formId=meeting_note",
    module: "staff",
    urgency: "routine",
    tags: ["meeting", "minutes", "notes", "team"],
  },
  {
    id: "shift_handover_employee",
    label: "Shift Handover",
    domain: "employee",
    category: "operations",
    icon: "ArrowRightLeft",
    description: "Complete a shift handover to the incoming team",
    href: "/forms/new?formId=shift_handover_employee",
    module: "handover",
    urgency: "routine",
    schedulable: true,
    tags: ["handover", "shift", "change", "transition"],
  },
  {
    id: "staff_review",
    label: "Staff Review",
    domain: "employee",
    category: "operations",
    icon: "UserCheck",
    description: "Record a staff review or probation check-in",
    href: "/forms/new?formId=staff_review",
    module: "staff",
    urgency: "routine",
    requiresStaff: true,
    schedulable: true,
    tags: ["review", "probation", "annual", "check-in"],
  },

  // ── custom (employee) ──────────────────────────────────────────────────────

  {
    id: "custom_form_employee",
    label: "Custom Form",
    domain: "employee",
    category: "custom",
    icon: "Sparkles",
    description: "Create a custom record relating to a staff member",
    href: "/forms/new?domain=employee",
    module: "forms",
    urgency: "routine",
    tags: ["custom", "form", "bespoke", "other"],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // HOME DOMAIN
  // ────────────────────────────────────────────────────────────────────────────

  // ── safety ─────────────────────────────────────────────────────────────────

  {
    id: "fire_drill",
    label: "Fire Drill",
    domain: "home",
    category: "safety",
    icon: "Flame",
    description: "Record a fire drill and its outcomes",
    href: "/forms/new?formId=fire_drill",
    module: "buildings",
    urgency: "routine",
    schedulable: true,
    tags: ["fire", "drill", "evacuation", "safety"],
  },
  {
    id: "health_and_safety_check",
    label: "Health & Safety Check",
    domain: "home",
    category: "safety",
    icon: "ShieldCheck",
    description: "Complete a health and safety check of the premises",
    href: "/forms/new?formId=health_and_safety_check",
    module: "buildings",
    urgency: "routine",
    schedulable: true,
    tags: ["health", "safety", "check", "inspection", "premises"],
  },
  {
    id: "risk_assessment_home",
    label: "Risk Assessment",
    domain: "home",
    category: "safety",
    icon: "ShieldAlert",
    description: "Complete a risk assessment for the home environment",
    href: "/forms/new?formId=risk_assessment_home",
    module: "buildings",
    urgency: "routine",
    tags: ["risk", "assessment", "environment", "hazard"],
  },
  {
    id: "hazard_report",
    label: "Hazard Report",
    domain: "home",
    category: "safety",
    icon: "AlertTriangle",
    description: "Report a hazard identified in the home",
    href: "/forms/new?formId=hazard_report",
    module: "buildings",
    urgency: "urgent",
    tags: ["hazard", "danger", "report", "safety"],
  },
  {
    id: "near_miss_report",
    label: "Near Miss Report",
    domain: "home",
    category: "safety",
    icon: "AlertOctagon",
    description: "Record a near miss event in the home",
    href: "/forms/new?formId=near_miss_report",
    module: "buildings",
    urgency: "urgent",
    tags: ["near miss", "accident", "incident", "safety"],
  },

  // ── premises ───────────────────────────────────────────────────────────────

  {
    id: "maintenance_request",
    label: "Maintenance Request",
    domain: "home",
    category: "premises",
    icon: "Wrench",
    description: "Submit a maintenance or repair request",
    href: "/forms/new?formId=maintenance_request",
    module: "maintenance",
    urgency: "routine",
    tags: ["maintenance", "repair", "fix", "broken", "request"],
  },
  {
    id: "vehicle_check",
    label: "Vehicle Check",
    domain: "home",
    category: "premises",
    icon: "Car",
    description: "Complete a vehicle pre-use inspection check",
    href: "/forms/new?formId=vehicle_check",
    module: "vehicles",
    urgency: "routine",
    schedulable: true,
    tags: ["vehicle", "car", "check", "inspection", "MOT"],
  },
  {
    id: "room_inspection",
    label: "Room Inspection",
    domain: "home",
    category: "premises",
    icon: "Home",
    description: "Complete a bedroom or room inspection",
    href: "/forms/new?formId=room_inspection",
    module: "buildings",
    urgency: "routine",
    schedulable: true,
    tags: ["room", "bedroom", "inspection", "check"],
  },
  {
    id: "garden_check",
    label: "Garden Check",
    domain: "home",
    category: "premises",
    icon: "Sprout",
    description: "Complete a garden safety and condition check",
    href: "/forms/new?formId=garden_check",
    module: "buildings",
    urgency: "routine",
    schedulable: true,
    tags: ["garden", "outdoor", "grounds", "check"],
  },
  {
    id: "equipment_check",
    label: "Equipment Check",
    domain: "home",
    category: "premises",
    icon: "Package",
    description: "Inspect and log the condition of equipment",
    href: "/forms/new?formId=equipment_check",
    module: "buildings",
    urgency: "routine",
    schedulable: true,
    tags: ["equipment", "check", "inventory", "condition"],
  },

  // ── compliance (home) ──────────────────────────────────────────────────────

  {
    id: "home_audit",
    label: "Home Audit",
    domain: "home",
    category: "compliance",
    icon: "ClipboardCheck",
    description: "Complete an internal home audit",
    href: "/audits/new",
    module: "audits",
    urgency: "routine",
    schedulable: true,
    tags: ["audit", "internal", "quality", "compliance"],
  },
  {
    id: "reg_44_report",
    label: "Reg 44 Report",
    domain: "home",
    category: "compliance",
    icon: "Eye",
    description: "Record a Regulation 44 independent visitor report",
    href: "/forms/new?formId=reg_44_report",
    module: "ri",
    urgency: "routine",
    schedulable: true,
    tags: ["reg 44", "regulation", "visitor", "independent", "monthly"],
  },
  {
    id: "reg_45_review",
    label: "Reg 45 Review",
    domain: "home",
    category: "compliance",
    icon: "FileText",
    description: "Complete a Regulation 45 quality-of-care review",
    href: "/forms/new?formId=reg_45_review",
    module: "ri",
    urgency: "routine",
    schedulable: true,
    tags: ["reg 45", "regulation", "quality", "review", "six-monthly"],
  },
  {
    id: "policy_review",
    label: "Policy Review",
    domain: "home",
    category: "compliance",
    icon: "FileText",
    description: "Review and update a home policy",
    href: "/forms/new?formId=policy_review",
    module: "ri",
    urgency: "routine",
    schedulable: true,
    tags: ["policy", "review", "update", "procedure"],
  },
  {
    id: "compliance_check",
    label: "Compliance Check",
    domain: "home",
    category: "compliance",
    icon: "ShieldCheck",
    description: "Run a compliance check against regulatory standards",
    href: "/forms/new?formId=compliance_check",
    module: "ri",
    urgency: "routine",
    schedulable: true,
    tags: ["compliance", "check", "standards", "regulatory"],
  },
  {
    id: "ofsted_notification",
    label: "Ofsted Notification",
    domain: "home",
    category: "compliance",
    icon: "Bell",
    description: "Record a notification sent to Ofsted",
    href: "/forms/new?formId=ofsted_notification",
    module: "ri",
    urgency: "urgent",
    tags: ["Ofsted", "notification", "regulatory", "event"],
  },

  // ── governance ─────────────────────────────────────────────────────────────

  {
    id: "manager_review",
    label: "Manager Review",
    domain: "home",
    category: "governance",
    icon: "UserCheck",
    description: "Complete a manager's oversight review",
    href: "/forms/new?formId=manager_review",
    module: "ri",
    urgency: "routine",
    schedulable: true,
    tags: ["manager", "review", "oversight", "walkround"],
  },
  {
    id: "action_plan",
    label: "Action Plan",
    domain: "home",
    category: "governance",
    icon: "ListChecks",
    description: "Create an action plan to address identified improvements",
    href: "/forms/new?formId=action_plan",
    module: "ri",
    urgency: "routine",
    tags: ["action", "plan", "improvement", "follow-up"],
  },
  {
    id: "improvement_plan",
    label: "Improvement Plan",
    domain: "home",
    category: "governance",
    icon: "TrendingUp",
    description: "Create a service improvement plan",
    href: "/forms/new?formId=improvement_plan",
    module: "ri",
    urgency: "routine",
    tags: ["improvement", "plan", "service", "quality"],
  },
  {
    id: "quality_assurance_review",
    label: "Quality Assurance Review",
    domain: "home",
    category: "governance",
    icon: "Star",
    description: "Complete a quality assurance review of the home",
    href: "/forms/new?formId=quality_assurance_review",
    module: "ri",
    urgency: "routine",
    schedulable: true,
    tags: ["quality", "assurance", "review", "QA"],
  },

  // ── operations (home) ──────────────────────────────────────────────────────

  {
    id: "shift_handover_home",
    label: "Shift Handover",
    domain: "home",
    category: "operations",
    icon: "ArrowRightLeft",
    description: "Complete a shift handover for the home",
    href: "/forms/new?formId=shift_handover_home",
    module: "handover",
    urgency: "routine",
    schedulable: true,
    tags: ["handover", "shift", "transition", "notes"],
  },
  {
    id: "meeting",
    label: "Meeting",
    domain: "home",
    category: "operations",
    icon: "Users",
    description: "Record a house meeting or team meeting",
    href: "/forms/new?formId=meeting",
    module: "buildings",
    urgency: "routine",
    schedulable: true,
    tags: ["meeting", "house", "team", "minutes"],
  },
  {
    id: "visitor_log",
    label: "Visitor Log",
    domain: "home",
    category: "operations",
    icon: "ClipboardList",
    description: "Log a visitor to the home",
    href: "/forms/new?formId=visitor_log",
    module: "buildings",
    urgency: "routine",
    tags: ["visitor", "log", "guest", "entry"],
  },
  {
    id: "meal_plan",
    label: "Meal Plan",
    domain: "home",
    category: "operations",
    icon: "UtensilsCrossed",
    description: "Create or update the weekly meal plan",
    href: "/forms/new?formId=meal_plan",
    module: "buildings",
    urgency: "routine",
    schedulable: true,
    tags: ["meal", "plan", "menu", "food", "nutrition"],
  },

  // ── documents (home) ───────────────────────────────────────────────────────

  {
    id: "inspection_preparation",
    label: "Inspection Preparation",
    domain: "home",
    category: "documents",
    icon: "FileSearch",
    description: "Prepare documentation ahead of a regulatory inspection",
    href: "/forms/new?formId=inspection_preparation",
    module: "ri",
    urgency: "routine",
    tags: ["inspection", "preparation", "Ofsted", "readiness"],
  },
  {
    id: "document_upload_home",
    label: "Document Upload",
    domain: "home",
    category: "documents",
    icon: "Upload",
    description: "Upload a document to the home's records",
    href: "/forms/new?formId=document_upload_home",
    module: "documents",
    urgency: "routine",
    tags: ["document", "upload", "file", "attachment"],
  },

  // ── custom (home) ──────────────────────────────────────────────────────────

  {
    id: "custom_form_home",
    label: "Custom Form",
    domain: "home",
    category: "custom",
    icon: "Sparkles",
    description: "Create a custom record for the home",
    href: "/forms/new?domain=home",
    module: "forms",
    urgency: "routine",
    tags: ["custom", "form", "bespoke", "other"],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get all form definitions for a given domain.
 */
export function getFormsByDomain(domain: FormDomain): FormDefinition[] {
  return FORM_REGISTRY.filter((f) => f.domain === domain);
}

/**
 * Get all form definitions for a domain + category pair.
 */
export function getFormsByCategory(
  domain: FormDomain,
  category: string,
): FormDefinition[] {
  return FORM_REGISTRY.filter(
    (f) => f.domain === domain && f.category === category,
  );
}

/**
 * Get all categories within a domain, each with its label, icon, and forms.
 * Categories are returned in the order they first appear in the registry.
 */
export function getFormCategories(
  domain: FormDomain,
): { category: string; label: string; icon: string; forms: FormDefinition[] }[] {
  const domainForms = getFormsByDomain(domain);
  const seen = new Map<string, FormDefinition[]>();

  for (const form of domainForms) {
    if (!seen.has(form.category)) {
      seen.set(form.category, []);
    }
    seen.get(form.category)!.push(form);
  }

  return Array.from(seen.entries()).map(([category, forms]) => {
    const meta = CATEGORY_LABELS[category] ?? {
      label: category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      icon: "FileText",
    };
    return { category, label: meta.label, icon: meta.icon, forms };
  });
}

/**
 * Search all forms by a free-text query.
 * Matches against label, description, tags, category, and id.
 */
export function searchForms(query: string): FormDefinition[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return FORM_REGISTRY.filter((f) => {
    const haystack = [
      f.id,
      f.label,
      f.description,
      f.category,
      ...(f.tags ?? []),
    ]
      .join(" ")
      .toLowerCase();
    return q.split(/\s+/).every((term) => haystack.includes(term));
  });
}

/**
 * Look up a single form definition by its unique id.
 */
export function getFormById(id: string): FormDefinition | undefined {
  return FORM_REGISTRY.find((f) => f.id === id);
}

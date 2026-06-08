// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INTELLIGENCE ENGINE → ACTION PAGE LINKS
//
// Maps a `home-*-intelligence` engine route slug to the platform page where a
// manager would go to ACT on its signals. Used by the Manager Priority Briefing
// to make each ranked signal click-through to the relevant records.
//
// All targets are verified-existing routes under src/app/(platform)/. Anything
// not explicitly mapped falls back to its domain landing page (also verified),
// so every signal always resolves to a real page — never a 404.
// ══════════════════════════════════════════════════════════════════════════════

/** Domain → landing page fallback (all verified to exist). */
const DOMAIN_HREF: Record<string, string> = {
  protection: "/safeguarding",
  experiences: "/young-people",
  leadership: "/compliance",
  workforce: "/workforce-oversight",
};

/** Engine slug → its most relevant action page (all verified to exist). */
const ENGINE_HREF: Record<string, string> = {
  // ── Protection ──
  "home-safeguarding-intelligence": "/safeguarding",
  "home-safeguarding-depth-intelligence": "/safeguarding",
  "home-safeguarding-prevention-intelligence": "/safeguarding",
  "home-self-harm-safety-plan-intelligence": "/self-harm-safety-plan",
  "home-risk-management-plan-intelligence": "/risk-management-plans",
  "home-contextual-safeguarding-risk-intelligence": "/contextual-safeguarding",
  "home-exploitation-screening-intelligence": "/exploitation-screening",
  "home-substance-misuse-screening-intelligence": "/drug-and-alcohol-screening",
  "home-missing-episodes-intelligence": "/missing-from-care",
  "home-incident-safety-intelligence": "/incidents",
  "home-post-incident-child-debrief-intelligence": "/post-incident-debrief-with-child",
  "home-behaviour-intelligence": "/behaviour-log",
  "home-bsp-effectiveness-intelligence": "/behaviour-support-plans",
  "home-restrictive-practice-intelligence": "/restraint-log",
  "home-risk-assessment-intelligence": "/risk-assessments",
  "home-risk-landscape-intelligence": "/risk-register",
  "home-strategic-risk-intelligence": "/risk-register",
  "home-notifiable-events-intelligence": "/notifiable-events",
  "home-emergency-preparedness-intelligence": "/emergency-planning",
  "home-fire-safety-intelligence": "/fire-drills",
  "home-premises-safety-intelligence": "/buildings",
  "home-medication-governance-intelligence": "/medication",
  "home-medication-management-intelligence": "/medication",
  "home-complaints-intelligence": "/complaints",
  "home-night-safety-intelligence": "/night-checks",
  // ── Experiences / wellbeing ──
  "home-health-wellbeing-intelligence": "/health",
  "home-health-monitoring-intelligence": "/health-monitoring",
  "home-mental-health-intelligence": "/health-records",
  "home-annual-health-assessment-intelligence": "/annual-health-assessment",
  "home-attachment-profile-intelligence": "/attachment-profiles",
  "home-trauma-therapy-intelligence": "/therapeutic-input",
  "home-multidisciplinary-formulation-intelligence": "/multi-disciplinary-formulation",
  "home-sleep-quality-intelligence": "/sleep-log",
  "home-nutrition-catering-intelligence": "/menu-planning",
  "home-education-engagement-intelligence": "/education",
  "home-education-achievement-intelligence": "/education",
  "home-pep-education-quality-intelligence": "/pep-tracker",
  "home-therapeutic-progress-intelligence": "/therapeutic-input",
  "home-enrichment-achievement-intelligence": "/activities",
  "home-activity-enrichment-intelligence": "/activities",
  "home-wellbeing-intelligence": "/young-people",
  "home-outcomes-progress-intelligence": "/outcomes",
  "home-outcome-star-assessment-intelligence": "/outcome-star",
  "home-independence-intelligence": "/independence-skills",
  "home-placement-stability-intelligence": "/placement-stability",
  "home-placement-impact-assessment-intelligence": "/placement-impact-assessment",
  "home-cultural-identity-intelligence": "/cultural-identity",
  "home-child-voice-intelligence": "/voice",
  "home-family-engagement-intelligence": "/family-contact",
  "home-social-worker-contact-intelligence": "/social-worker-contact",
  "home-sibling-contact-protocol-intelligence": "/siblings-contact-protocol",
  "home-transition-planning-intelligence": "/transition-planning",
  "home-key-working-intelligence": "/key-working",
  "home-digital-safety-intelligence": "/online-safety",
  // ── Leadership / management ──
  "home-regulatory-compliance-intelligence": "/compliance",
  "home-policy-compliance-intelligence": "/policies",
  "home-quality-assurance-intelligence": "/quality",
  "home-reg44-intelligence": "/regulation-44",
  "home-reg4445-evidence-intelligence": "/regulation-44",
  "home-data-governance-intelligence": "/data-protection",
  "home-document-governance-intelligence": "/documents",
  "home-recording-quality-intelligence": "/recording-quality",
  "home-organizational-learning-intelligence": "/lessons-learned-register",
  "home-meeting-governance-intelligence": "/operational-meetings",
  "home-multi-agency-intelligence": "/multi-agency-meetings",
  "home-delegated-authority-intelligence": "/delegated-authority",
  "home-lac-review-intelligence": "/lac-reviews",
  "home-management-walkround-oversight-intelligence": "/management-walkround",
  // ── Workforce ──
  "home-workforce-planning-intelligence": "/workforce-oversight",
  "home-staff-lifecycle-intelligence": "/staff",
  "home-staff-development-intelligence": "/staff-development",
  "home-staff-wellbeing-intelligence": "/staff-wellbeing",
  "home-supervision-intelligence": "/supervision",
  "home-competency-landscape-intelligence": "/staff-competency",
  "home-safer-recruitment-intelligence": "/safer-recruitment-tracker",
  "home-shift-pattern-intelligence": "/safe-staffing",
  "home-staff-recognition-morale-intelligence": "/staff-recognition-log",
};

/** Resolve an engine slug (+ its domain) to the page a manager acts on. Always a real route. */
export function engineHref(engineKey: string, domain?: string): string {
  return ENGINE_HREF[engineKey] ?? (domain ? DOMAIN_HREF[domain] : undefined) ?? "/dashboard";
}

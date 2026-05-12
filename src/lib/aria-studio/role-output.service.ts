// ══════════════════════════════════════════════════════════════════════════════
// ARIA STUDIO — ROLE-BASED OUTPUT VERSIONS
//
// Generates different versions of the same content tailored to the reader:
// a manager sees full detail + regulatory references; a care worker sees
// practical guidance; a young person sees child-friendly language; a social
// worker sees a professional summary with key concerns.
// ══════════════════════════════════════════════════════════════════════════════

import type { AriaStudioArtifact } from "@/types/aria-studio";

// ── Types ───────────────────────────────────────────────────────────────────

export type OutputRole =
  | "registered_manager"
  | "deputy_manager"
  | "team_leader"
  | "residential_care_worker"
  | "young_person"
  | "social_worker"
  | "parent_carer"
  | "responsible_individual"
  | "inspector";

export interface RoleOutputVersion {
  role: OutputRole;
  label: string;
  content: string;
  redactions: string[];
  addedContext: string[];
}

// ── Role output configuration ───────────────────────────────────────────────

interface RoleConfig {
  label: string;
  includeSections: string[];
  excludeSections: string[];
  toneOverride: string | null;
  addDisclaimer: string | null;
  redactSensitive: boolean;
  simplifyLanguage: boolean;
}

const ROLE_CONFIGS: Record<OutputRole, RoleConfig> = {
  registered_manager: {
    label: "Registered Manager",
    includeSections: ["all"],
    excludeSections: [],
    toneOverride: null,
    addDisclaimer: null,
    redactSensitive: false,
    simplifyLanguage: false,
  },
  deputy_manager: {
    label: "Deputy Manager",
    includeSections: ["all"],
    excludeSections: ["financial_impact"],
    toneOverride: null,
    addDisclaimer: null,
    redactSensitive: false,
    simplifyLanguage: false,
  },
  team_leader: {
    label: "Team Leader",
    includeSections: ["summary", "actions", "staff_guidance", "risk", "safeguarding"],
    excludeSections: ["regulatory_detail", "financial_impact", "ri_commentary"],
    toneOverride: null,
    addDisclaimer: null,
    redactSensitive: false,
    simplifyLanguage: false,
  },
  residential_care_worker: {
    label: "Care Worker",
    includeSections: ["summary", "actions", "staff_guidance", "what_helps", "what_escalates"],
    excludeSections: ["regulatory_detail", "financial_impact", "ri_commentary", "detailed_analysis"],
    toneOverride: "plain_english",
    addDisclaimer: "This is a summary version. Speak to your manager for the full detail.",
    redactSensitive: true,
    simplifyLanguage: true,
  },
  young_person: {
    label: "Young Person",
    includeSections: ["child_friendly_summary", "what_happens_next", "your_rights", "who_to_talk_to"],
    excludeSections: ["regulatory_detail", "risk_detail", "safeguarding_detail", "staff_guidance", "financial_impact"],
    toneOverride: "child_friendly",
    addDisclaimer: "This has been written to help you understand what is happening. You can ask your key worker or an advocate if you have any questions.",
    redactSensitive: true,
    simplifyLanguage: true,
  },
  social_worker: {
    label: "Social Worker",
    includeSections: ["summary", "risk", "safeguarding", "child_voice", "actions", "regulatory_relevance"],
    excludeSections: ["staff_guidance", "internal_notes", "financial_impact"],
    toneOverride: "professional_legal",
    addDisclaimer: null,
    redactSensitive: false,
    simplifyLanguage: false,
  },
  parent_carer: {
    label: "Parent / Carer",
    includeSections: ["summary", "what_happens_next", "contact_information"],
    excludeSections: ["regulatory_detail", "risk_detail", "safeguarding_detail", "staff_guidance", "internal_notes"],
    toneOverride: "plain_english",
    addDisclaimer: "If you have any questions about this information, please contact the home manager.",
    redactSensitive: true,
    simplifyLanguage: true,
  },
  responsible_individual: {
    label: "Responsible Individual",
    includeSections: ["all"],
    excludeSections: [],
    toneOverride: "inspection_ready",
    addDisclaimer: null,
    redactSensitive: false,
    simplifyLanguage: false,
  },
  inspector: {
    label: "Inspector View",
    includeSections: ["all"],
    excludeSections: ["internal_notes"],
    toneOverride: "inspection_ready",
    addDisclaimer: "This document was generated with AI assistance and has been reviewed and approved by the Registered Manager.",
    redactSensitive: false,
    simplifyLanguage: false,
  },
};

// ── Generate role-based version ─────────────────────────────────────────────

export function generateRoleVersion(
  artifact: AriaStudioArtifact,
  role: OutputRole,
): RoleOutputVersion {
  const config = ROLE_CONFIGS[role];
  const content = artifact.generated_content ?? artifact.plain_text_content ?? "";
  const redactions: string[] = [];
  const addedContext: string[] = [];

  let output = content;

  // Apply redactions for sensitive content
  if (config.redactSensitive) {
    const sensitivePatterns = [
      { pattern: /(?:allegation|complaint against staff|professional boundary)[^.]*\./gi, label: "Staff-sensitive content" },
      { pattern: /(?:police|criminal|court|legal proceedings)[^.]*\./gi, label: "Legal content" },
      { pattern: /(?:medication\s+\w+\s+\d+\s*mg)[^.]*\./gi, label: "Medication details" },
    ];
    for (const { pattern, label } of sensitivePatterns) {
      if (pattern.test(output)) {
        output = output.replace(pattern, `[${label} — speak to your manager for details]`);
        redactions.push(label);
      }
    }
  }

  // Simplify language
  if (config.simplifyLanguage) {
    const simplifications: [RegExp, string][] = [
      [/\bplacement\b/gi, "where you live"],
      [/\bde-escalation\b/gi, "calming things down"],
      [/\bescalation\b/gi, "things getting worse"],
      [/\bdysregulation\b/gi, "finding it hard to manage feelings"],
      [/\btherapeutic\b/gi, "helpful"],
      [/\bpresenting behaviour\b/gi, "how you're feeling and acting"],
      [/\bintervention\b/gi, "support"],
      [/\bmulti-agency\b/gi, "different professionals working together"],
      [/\bsafeguarding\b/gi, "keeping you safe"],
      [/\bcompliance\b/gi, "following the rules"],
    ];

    if (role === "young_person") {
      for (const [pattern, replacement] of simplifications) {
        output = output.replace(pattern, replacement);
      }
      addedContext.push("Language simplified for young person");
    }
  }

  // Add disclaimer
  if (config.addDisclaimer) {
    output = `${output}\n\n---\n${config.addDisclaimer}`;
    addedContext.push("Disclaimer added");
  }

  // Add tone indicator
  if (config.toneOverride) {
    addedContext.push(`Tone: ${config.toneOverride}`);
  }

  return {
    role,
    label: config.label,
    content: output,
    redactions,
    addedContext,
  };
}

// ── Generate all role versions ──────────────────────────────────────────────

export function generateAllRoleVersions(
  artifact: AriaStudioArtifact,
  roles?: OutputRole[],
): RoleOutputVersion[] {
  const targetRoles = roles ?? (Object.keys(ROLE_CONFIGS) as OutputRole[]);
  return targetRoles.map((role) => generateRoleVersion(artifact, role));
}

// ── Get available roles for an artifact type ────────────────────────────────

export function getAvailableRoles(artifactType: string): OutputRole[] {
  const childFacing: OutputRole[] = ["registered_manager", "deputy_manager", "team_leader", "residential_care_worker", "young_person", "social_worker"];
  const staffFacing: OutputRole[] = ["registered_manager", "deputy_manager", "team_leader", "residential_care_worker"];
  const governance: OutputRole[] = ["registered_manager", "deputy_manager", "responsible_individual", "inspector"];

  const map: Record<string, OutputRole[]> = {
    keywork_session: childFacing,
    direct_work_session: childFacing,
    child_friendly_explanation: ["young_person", "registered_manager", "social_worker"],
    child_friendly_worksheet: ["young_person", "registered_manager"],
    management_oversight: governance,
    risk_review: [...childFacing, "responsible_individual"],
    safeguarding_review: ["registered_manager", "deputy_manager", "social_worker", "responsible_individual"],
    reg45_summary: governance,
    ofsted_readiness_summary: governance,
    staff_training: staffFacing,
    supervision_prompt: ["registered_manager", "deputy_manager", "team_leader"],
    action_plan: [...staffFacing, "social_worker"],
    incident_learning_review: staffFacing,
    social_worker_update: ["registered_manager", "social_worker"],
    parent_professional_letter: ["registered_manager", "parent_carer"],
    ri_briefing: ["registered_manager", "responsible_individual"],
  };

  return map[artifactType] ?? ["registered_manager", "deputy_manager"];
}

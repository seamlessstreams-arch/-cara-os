// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BRANDING TYPES
// Dual-branding system: Cornerstone platform brand + client organisation brand
// ══════════════════════════════════════════════════════════════════════════════

// ── System branding (Cornerstone product) ─────────────────────────────────────

export interface SystemBranding {
  id: "cornerstone_system";
  logo_url: string | null;
  icon_url: string | null;
  wordmark_url: string | null;
  primary_colour: string;
  secondary_colour: string;
  accent_colour: string;
  background_colour: string;
  default_footer_text: string;
  support_email: string;
  created_at: string;
  updated_at: string;
}

// ── Organisation branding (client/provider) ───────────────────────────────────

export interface OrganisationBranding {
  id: string;
  organisation_id: string;
  company_name: string;
  trading_name: string | null;
  registered_provider_name: string | null;
  company_registration_number: string | null;
  ofsted_provider_reference: string | null;
  logo_url: string | null;
  document_logo_url: string | null;
  email_logo_url: string | null;
  primary_colour: string | null;
  secondary_colour: string | null;
  accent_colour: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  responsible_individual_name: string | null;
  default_footer_text: string | null;
  confidentiality_notice: string;
  created_at: string;
  updated_at: string;
}

// ── Home branding (home-level detail overrides) ───────────────────────────────

export interface HomeBranding {
  id: string;
  home_id: string;
  organisation_id: string;
  home_name: string;
  home_address: string | null;
  ofsted_urn: string | null;
  registered_manager_name: string | null;
  responsible_individual_name: string | null;
  emergency_contact: string | null;
  safeguarding_contact: string | null;
  lado_contact: string | null;
  local_authority_contact: string | null;
  police_contact: string | null;
  logo_override_url: string | null;
  created_at: string;
  updated_at: string;
}

// ── Document branding snapshot ────────────────────────────────────────────────
// Captures exact branding at generation time so historical PDFs stay accurate.

export interface DocumentBrandingSnapshot {
  id: string;
  document_id: string;
  document_type: string;
  organisation_id: string | null;
  home_id: string | null;
  branding_json: ResolvedBranding;
  generated_by: string | null;
  created_at: string;
}

// ── Branding audit log ────────────────────────────────────────────────────────

export interface BrandingAuditEntry {
  id: string;
  changed_by: string;
  changed_by_name: string | null;
  target_type: "system" | "organisation" | "home";
  target_id: string;
  field_name: string;
  previous_value: string | null;
  new_value: string | null;
  session_info: string | null;
  created_at: string;
}

// ── Resolved branding (output of the branding resolver) ───────────────────────
// This is what documents, PDFs, emails and previews consume.

export interface ResolvedBranding {
  // Logos
  logo_url: string | null;
  document_logo_url: string | null;
  email_logo_url: string | null;

  // Colours
  primary_colour: string;
  secondary_colour: string;
  accent_colour: string;

  // Organisation details
  company_name: string;
  trading_name: string | null;
  registered_provider_name: string | null;
  ofsted_provider_reference: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  responsible_individual_name: string | null;

  // Home details
  home_name: string | null;
  home_address: string | null;
  ofsted_urn: string | null;
  registered_manager_name: string | null;

  // Contact details
  emergency_contact: string | null;
  safeguarding_contact: string | null;
  lado_contact: string | null;
  local_authority_contact: string | null;
  police_contact: string | null;

  // Document footer
  footer_text: string;
  confidentiality_notice: string;
  powered_by_mark: string;

  // Metadata
  resolved_at: string;
  source: "home" | "organisation" | "system";
}

// ── Branding update payload types ─────────────────────────────────────────────

export type SystemBrandingUpdate = Partial<
  Omit<SystemBranding, "id" | "created_at" | "updated_at">
>;

export type OrganisationBrandingUpdate = Partial<
  Omit<OrganisationBranding, "id" | "organisation_id" | "created_at" | "updated_at">
>;

export type HomeBrandingUpdate = Partial<
  Omit<HomeBranding, "id" | "home_id" | "organisation_id" | "created_at" | "updated_at">
>;

// ── Logo upload result ────────────────────────────────────────────────────────

export interface LogoUploadResult {
  url: string;
  file_name: string;
  size_bytes: number;
  mime_type: string;
  uploaded_at: string;
}

// ── Document types that support branding ──────────────────────────────────────

export const BRANDABLE_DOCUMENT_TYPES = [
  "regulation_45_report",
  "annex_a",
  "incident_report",
  "missing_from_care_report",
  "risk_assessment",
  "placement_plan",
  "care_plan",
  "keywork_session",
  "supervision_record",
  "hr_document",
  "safer_recruitment_document",
  "staff_file_document",
  "young_person_file_document",
] as const;

export type BrandableDocumentType = (typeof BRANDABLE_DOCUMENT_TYPES)[number];

export const BRANDABLE_DOCUMENT_TYPE_LABELS: Record<BrandableDocumentType, string> = {
  regulation_45_report: "Regulation 45 Report",
  annex_a: "Annex A",
  incident_report: "Incident Report",
  missing_from_care_report: "Missing From Care Report",
  risk_assessment: "Risk Assessment",
  placement_plan: "Placement Plan",
  care_plan: "Care Plan",
  keywork_session: "Keywork Session",
  supervision_record: "Supervision Record",
  hr_document: "HR Document",
  safer_recruitment_document: "Safer Recruitment Document",
  staff_file_document: "Staff File Document",
  young_person_file_document: "Young Person File Document",
};

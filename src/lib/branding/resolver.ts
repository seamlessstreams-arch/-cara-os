// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BRANDING RESOLVER
// Resolves the correct branding for any document or export.
//
// Priority (highest wins):
//   1. Home-level override (home_branding)
//   2. Organisation/client branding (organisation_branding)
//   3. Cornerstone system default branding (system_branding)
//
// This runs server-side only. Never expose raw branding secrets client-side.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type { ResolvedBranding } from "@/types/branding";

// ── Default Cornerstone system branding ───────────────────────────────────────

const CORNERSTONE_DEFAULTS: Omit<
  ResolvedBranding,
  | "logo_url"
  | "document_logo_url"
  | "email_logo_url"
  | "company_name"
  | "trading_name"
  | "registered_provider_name"
  | "ofsted_provider_reference"
  | "address"
  | "phone"
  | "email"
  | "website"
  | "responsible_individual_name"
  | "home_name"
  | "home_address"
  | "ofsted_urn"
  | "registered_manager_name"
  | "emergency_contact"
  | "safeguarding_contact"
  | "lado_contact"
  | "local_authority_contact"
  | "police_contact"
  | "confidentiality_notice"
> = {
  primary_colour: "#1e3a5f",
  secondary_colour: "#2dd4bf",
  accent_colour: "#3b82f6",
  footer_text: "Generated securely through Cornerstone",
  powered_by_mark: "Generated securely through Cornerstone · cornerstone.care",
  resolved_at: "",
  source: "system",
};

export interface BrandingResolverInput {
  organisation_id?: string;
  home_id?: string;
  document_type?: string;
  document_id?: string;
  user_id?: string;
}

/**
 * Resolve the correct branding for a document, PDF or export.
 *
 * Returns a complete ResolvedBranding object. Missing fields fall through to
 * the next tier (organisation → system defaults).
 */
export function resolveBranding(input: BrandingResolverInput): ResolvedBranding {
  const systemBranding = db.branding.getSystem();
  const orgBranding = input.organisation_id
    ? db.branding.getOrganisation(input.organisation_id)
    : null;
  const homeBranding = input.home_id
    ? db.branding.getHome(input.home_id)
    : null;

  const now = new Date().toISOString();

  // ── Logos: home override → org → null ─────────────────────────────────────
  const logoUrl =
    (homeBranding?.logo_override_url as string | null) ??
    (orgBranding?.document_logo_url as string | null) ??
    (orgBranding?.logo_url as string | null) ??
    (systemBranding.logo_url);

  const documentLogoUrl =
    (orgBranding?.document_logo_url as string | null) ??
    (orgBranding?.logo_url as string | null) ??
    logoUrl;

  const emailLogoUrl =
    (orgBranding?.email_logo_url as string | null) ??
    documentLogoUrl;

  // ── Colours: org → system defaults ────────────────────────────────────────
  const primaryColour =
    (orgBranding?.primary_colour as string | null) ??
    systemBranding.primary_colour;

  const secondaryColour =
    (orgBranding?.secondary_colour as string | null) ??
    systemBranding.secondary_colour;

  const accentColour =
    (orgBranding?.accent_colour as string | null) ??
    systemBranding.accent_colour;

  // ── Organisation details ───────────────────────────────────────────────────
  const companyName =
    (orgBranding?.company_name as string | null) ?? "Cornerstone";

  const tradingName =
    (orgBranding?.trading_name as string | null) ?? null;

  const registeredProviderName =
    (orgBranding?.registered_provider_name as string | null) ?? null;

  const ofstedProviderReference =
    (orgBranding?.ofsted_provider_reference as string | null) ?? null;

  const address = (orgBranding?.address as string | null) ?? null;
  const phone   = (orgBranding?.phone as string | null)   ?? null;
  const email   = (orgBranding?.email as string | null)   ?? null;
  const website = (orgBranding?.website as string | null) ?? null;

  const responsibleIndividualName =
    (homeBranding?.responsible_individual_name as string | null) ??
    (orgBranding?.responsible_individual_name as string | null) ??
    null;

  // ── Home details ───────────────────────────────────────────────────────────
  const homeName              = (homeBranding?.home_name as string | null) ?? null;
  const homeAddress           = (homeBranding?.home_address as string | null) ?? null;
  const ofstedUrn             = (homeBranding?.ofsted_urn as string | null) ?? null;
  const registeredManagerName = (homeBranding?.registered_manager_name as string | null) ?? null;
  const emergencyContact      = (homeBranding?.emergency_contact as string | null) ?? null;
  const safeguardingContact   = (homeBranding?.safeguarding_contact as string | null) ?? null;
  const ladoContact           = (homeBranding?.lado_contact as string | null) ?? null;
  const localAuthorityContact = (homeBranding?.local_authority_contact as string | null) ?? null;
  const policeContact         = (homeBranding?.police_contact as string | null) ?? null;

  // ── Footer and notices ─────────────────────────────────────────────────────
  const footerText =
    (orgBranding?.default_footer_text as string | null) ??
    systemBranding.default_footer_text;

  const confidentialityNotice =
    (orgBranding?.confidentiality_notice as string | null) ??
    "This document is confidential. It contains sensitive information about children in care and must not be shared without authorisation.";

  const poweredByMark = `Generated securely through Cornerstone · cornerstone.care`;

  // ── Determine source ───────────────────────────────────────────────────────
  const source: ResolvedBranding["source"] = homeBranding
    ? "home"
    : orgBranding
    ? "organisation"
    : "system";

  return {
    logo_url: logoUrl,
    document_logo_url: documentLogoUrl,
    email_logo_url: emailLogoUrl,
    primary_colour: primaryColour,
    secondary_colour: secondaryColour,
    accent_colour: accentColour,
    company_name: companyName,
    trading_name: tradingName,
    registered_provider_name: registeredProviderName,
    ofsted_provider_reference: ofstedProviderReference,
    address,
    phone,
    email,
    website,
    responsible_individual_name: responsibleIndividualName,
    home_name: homeName,
    home_address: homeAddress,
    ofsted_urn: ofstedUrn,
    registered_manager_name: registeredManagerName,
    emergency_contact: emergencyContact,
    safeguarding_contact: safeguardingContact,
    lado_contact: ladoContact,
    local_authority_contact: localAuthorityContact,
    police_contact: policeContact,
    footer_text: footerText,
    confidentiality_notice: confidentialityNotice,
    powered_by_mark: poweredByMark,
    resolved_at: now,
    source,
  };
}

/**
 * Check whether key regulatory details are complete.
 * ARIA uses this to flag missing branding before finalising documents.
 */
export interface BrandingCompleteness {
  is_complete: boolean;
  missing_fields: string[];
  warnings: string[];
}

export function checkBrandingCompleteness(
  branding: ResolvedBranding
): BrandingCompleteness {
  const missing: string[] = [];
  const warnings: string[] = [];

  if (!branding.company_name || branding.company_name === "Cornerstone") {
    missing.push("Organisation name");
  }
  if (!branding.registered_provider_name) {
    missing.push("Registered provider name");
  }
  if (!branding.ofsted_provider_reference) {
    missing.push("Ofsted provider reference");
  }
  if (!branding.responsible_individual_name) {
    missing.push("Responsible Individual name");
  }
  if (!branding.address) {
    warnings.push("Organisation address not set");
  }
  if (!branding.home_name) {
    warnings.push("Home name not set");
  }
  if (!branding.ofsted_urn) {
    missing.push("Home Ofsted URN");
  }
  if (!branding.registered_manager_name) {
    missing.push("Registered Manager name");
  }
  if (!branding.document_logo_url) {
    warnings.push("No document logo uploaded — documents will use text-only header");
  }
  if (!branding.safeguarding_contact) {
    warnings.push("Safeguarding contact not set — add to home details");
  }

  return {
    is_complete: missing.length === 0,
    missing_fields: missing,
    warnings,
  };
}

/**
 * Create a branding snapshot for a document being generated.
 * Call this whenever a document or PDF is created to preserve historical accuracy.
 */
export function snapshotBranding(params: {
  document_id: string;
  document_type: string;
  organisation_id?: string;
  home_id?: string;
  generated_by?: string;
}): ResolvedBranding {
  const branding = resolveBranding({
    organisation_id: params.organisation_id,
    home_id: params.home_id,
    document_type: params.document_type,
    document_id: params.document_id,
    user_id: params.generated_by,
  });

  db.branding.createSnapshot({
    document_id: params.document_id,
    document_type: params.document_type,
    organisation_id: params.organisation_id,
    home_id: params.home_id,
    branding_json: branding,
    generated_by: params.generated_by,
  });

  return branding;
}

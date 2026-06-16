// ══════════════════════════════════════════════════════════════════════════════
// CARA — CV-to-Profile Scaffolding Engine
// Pure deterministic extraction from CV/application text → candidate profile
// draft. AI can enhance when available; deterministic layer always runs first.
// ══════════════════════════════════════════════════════════════════════════════

export const CV_PROFILE_DISCLAIMER =
  "This is an AI-assisted draft only. All information must be verified directly with the candidate using safer recruitment standards. Never substitute automated extraction for thorough identity and employment verification.";

export interface CandidateProfileDraft {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  role_applied: string | null;
  years_experience: number | null;
  work_history_notes: string;
  skills_noted: string[];
  qualifications_noted: string[];
  safeguarding_experience: boolean;
  residential_care_experience: boolean;
  missing_fields: string[];
  quality_score: number;
  quality_band: "complete" | "mostly_complete" | "partial" | "sparse";
  ai_note: string;
  disclaimer: string;
}

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const UK_PHONE_RE = /(?:(?:\+44|0044|0)(?:\s*\d){10})/;
const YEARS_EXP_RE = /(\d+)\s*(?:\+\s*)?years?(?:\s+of)?\s+(?:experience|exp)/i;

const CARE_KEYWORDS = [
  "children", "young people", "residential", "care home", "safeguarding",
  "looked after", "lac", "therapeutic", "key work", "keywork",
];
const SAFEGUARDING_KEYWORDS = [
  "safeguarding", "child protection", "dbs", "disclosure", "barring",
  "prevent", "mash", "referral",
];
const QUALIFICATION_PATTERNS = [
  /NVQ\s*(?:level\s*)?\d/i,
  /QCF\s*(?:level\s*)?\d/i,
  /\bHSC\b/,
  /\bHND\b/,
  /\bBSc\b/,
  /\bBA\b/,
  /\bMSc\b/,
  /\bMA\b/,
  /\bDipSW\b/,
  /social work degree/i,
  /first aid/i,
  /Makaton/i,
  /Team Teach/i,
  /CPI/i,
  /PRICE/i,
  /physical intervention/i,
];

function extractEmail(text: string): string | null {
  return text.match(EMAIL_RE)?.[0] ?? null;
}

function extractPhone(text: string): string | null {
  return text.match(UK_PHONE_RE)?.[0]?.replace(/\s+/g, " ").trim() ?? null;
}

function extractName(text: string): { first: string | null; last: string | null } {
  // Heuristic: look for a line near the top that looks like a name (2-3 words, no numbers)
  const lines = text.split(/\r?\n/).slice(0, 10).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$/.test(line) && line.split(/\s+/).length <= 3) {
      const parts = line.split(/\s+/);
      return { first: parts[0], last: parts[parts.length - 1] };
    }
  }
  return { first: null, last: null };
}

function extractYearsExperience(text: string): number | null {
  const m = text.match(YEARS_EXP_RE);
  return m ? parseInt(m[1], 10) : null;
}

function extractQualifications(text: string): string[] {
  const found: string[] = [];
  for (const re of QUALIFICATION_PATTERNS) {
    const m = text.match(re);
    if (m) found.push(m[0]);
  }
  return [...new Set(found)];
}

function extractSkills(text: string): string[] {
  const skills: string[] = [];
  const lower = text.toLowerCase();
  const careMatches = CARE_KEYWORDS.filter(k => lower.includes(k));
  if (careMatches.length > 0) skills.push("Residential childcare experience");
  if (lower.includes("de-escalat")) skills.push("De-escalation techniques");
  if (lower.includes("risk assess")) skills.push("Risk assessment");
  if (lower.includes("care plan")) skills.push("Care planning");
  if (lower.includes("report writ") || lower.includes("recording")) skills.push("Care recording");
  if (lower.includes("key work") || lower.includes("keywork")) skills.push("Key working");
  if (lower.includes("pace") || lower.includes("theraputic") || lower.includes("therapeutic")) skills.push("Therapeutic approaches");
  if (lower.includes("driver") || lower.includes("drivin")) skills.push("Full UK driving licence");
  return [...new Set(skills)];
}

function buildWorkHistoryNotes(text: string): string {
  // Extract job title / employer lines as a rough summary
  const jobPattern = /(?:(?:January|February|March|April|May|June|July|August|September|October|November|December|\d{4})\s*[-–—]\s*(?:Present|Current|\d{4}))/gi;
  const matches = text.match(jobPattern);
  if (!matches || matches.length === 0) {
    return "Employment history not clearly structured in text — verify directly with candidate.";
  }
  return `${matches.length} date range(s) detected. Verify all employment dates, roles, and reasons for leaving with candidate directly.`;
}

export function buildCandidateProfileFromText(
  cvText: string,
  targetRole?: string,
): CandidateProfileDraft {
  const text = cvText.trim();

  const { first, last } = extractName(text);
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const yearsExp = extractYearsExperience(text);
  const qualifications = extractQualifications(text);
  const skills = extractSkills(text);
  const workNotes = buildWorkHistoryNotes(text);
  const lower = text.toLowerCase();
  const hasSafeguarding = SAFEGUARDING_KEYWORDS.some(k => lower.includes(k));
  const hasResidential = CARE_KEYWORDS.some(k => lower.includes(k));

  const missing: string[] = [];
  if (!first || !last) missing.push("Full name");
  if (!email) missing.push("Email address");
  if (!phone) missing.push("Phone number");
  if (!yearsExp) missing.push("Years of experience");
  if (qualifications.length === 0) missing.push("Qualifications");

  // Score: 5 fields × 20 points each
  let score = 100 - missing.length * 18;
  if (skills.length === 0) score -= 10;
  score = Math.max(10, Math.min(100, score));

  const band: CandidateProfileDraft["quality_band"] =
    score >= 80 ? "complete"
    : score >= 60 ? "mostly_complete"
    : score >= 35 ? "partial"
    : "sparse";

  return {
    first_name: first,
    last_name: last,
    email,
    phone,
    role_applied: targetRole ?? null,
    years_experience: yearsExp,
    work_history_notes: workNotes,
    skills_noted: skills,
    qualifications_noted: qualifications,
    safeguarding_experience: hasSafeguarding,
    residential_care_experience: hasResidential,
    missing_fields: missing,
    quality_score: score,
    quality_band: band,
    ai_note:
      band === "sparse"
        ? "Very little structured information found. Ask the candidate to resubmit in a standard CV format, or complete the profile manually."
        : band === "partial"
        ? "Some key fields could not be extracted automatically. Review and complete the missing fields before proceeding."
        : "Profile scaffold generated. Verify all details directly with the candidate before creating a formal record.",
    disclaimer: CV_PROFILE_DISCLAIMER,
  };
}

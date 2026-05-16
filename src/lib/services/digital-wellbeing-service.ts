// ==============================================================================
// CORNERSTONE -- SOCIAL MEDIA & DIGITAL WELLBEING MANAGEMENT SERVICE
// Tracks social media risk assessments, screen time reviews, privacy settings
// checks, age verification reviews, content filtering reviews, online friendship
// audits, gaming risk assessments, social media account setup and deactivation,
// digital literacy sessions, online bullying responses, image sharing and live
// streaming risk assessments, dark web awareness, digital footprint reviews, and
// positive digital use celebrations for looked-after children.
//
// Covers: Platform-specific risk tracking, risk level assessment (No Identified
// Risk/Low/Medium/High/Critical), age-appropriate use verification, privacy
// settings review, contact with strangers identification, harmful content exposure,
// cyberbullying identification, image sharing concerns, excessive use monitoring,
// parental controls status, agreed vs actual screen time, action taken recording,
// education provision, child views, social worker notification, and review scheduling.
//
// UK Regulatory Framework:
// CHR 2015 Reg 12 (online safety),
// KCSIE 2023 (online safety),
// UK Age Appropriate Design Code (Children's Code),
// Online Safety Act 2023,
// SCCIF: Safety — "The home manages online risks."
// Ofcom guidance on children's media use.
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const RECORD_TYPES = [
  "Social Media Risk Assessment",
  "Screen Time Review",
  "Privacy Settings Check",
  "Age Verification Review",
  "Content Filtering Review",
  "Online Friendship Audit",
  "Gaming Risk Assessment",
  "Social Media Account Setup",
  "Account Deactivation Support",
  "Digital Literacy Session",
  "Online Bullying Response",
  "Image Sharing Risk Assessment",
  "Live Streaming Risk Assessment",
  "Dark Web Awareness",
  "Digital Footprint Review",
  "Positive Digital Use Celebration",
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

export const RISK_LEVELS = [
  "No Identified Risk",
  "Low",
  "Medium",
  "High",
  "Critical",
] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const SAFEGUARDING_RECORD_TYPES: RecordType[] = [
  "Online Bullying Response",
  "Image Sharing Risk Assessment",
  "Live Streaming Risk Assessment",
  "Dark Web Awareness",
  "Online Friendship Audit",
];

export const ASSESSMENT_RECORD_TYPES: RecordType[] = [
  "Social Media Risk Assessment",
  "Gaming Risk Assessment",
  "Image Sharing Risk Assessment",
  "Live Streaming Risk Assessment",
  "Digital Footprint Review",
];

export const EDUCATION_RECORD_TYPES: RecordType[] = [
  "Digital Literacy Session",
  "Dark Web Awareness",
  "Privacy Settings Check",
  "Age Verification Review",
  "Content Filtering Review",
];

export const POSITIVE_RECORD_TYPES: RecordType[] = [
  "Positive Digital Use Celebration",
  "Social Media Account Setup",
  "Digital Literacy Session",
];

export const HIGH_RISK_PLATFORMS = [
  "TikTok",
  "Snapchat",
  "Omegle",
  "Discord",
  "Telegram",
  "Kik",
  "Whisper",
  "Chatroulette",
];

// Risk level numeric mapping for analysis
const RISK_NUMERIC: Record<string, number> = {
  "No Identified Risk": 0,
  "Low": 1,
  "Medium": 2,
  "High": 3,
  "Critical": 4,
};

// -- Label maps ---------------------------------------------------------------

export const RECORD_TYPE_LABELS: { type: RecordType; label: string }[] = [
  { type: "Social Media Risk Assessment", label: "Social Media Risk Assessment" },
  { type: "Screen Time Review", label: "Screen Time Review" },
  { type: "Privacy Settings Check", label: "Privacy Settings Check" },
  { type: "Age Verification Review", label: "Age Verification Review" },
  { type: "Content Filtering Review", label: "Content Filtering Review" },
  { type: "Online Friendship Audit", label: "Online Friendship Audit" },
  { type: "Gaming Risk Assessment", label: "Gaming Risk Assessment" },
  { type: "Social Media Account Setup", label: "Social Media Account Setup" },
  { type: "Account Deactivation Support", label: "Account Deactivation Support" },
  { type: "Digital Literacy Session", label: "Digital Literacy Session" },
  { type: "Online Bullying Response", label: "Online Bullying Response" },
  { type: "Image Sharing Risk Assessment", label: "Image Sharing Risk Assessment" },
  { type: "Live Streaming Risk Assessment", label: "Live Streaming Risk Assessment" },
  { type: "Dark Web Awareness", label: "Dark Web Awareness" },
  { type: "Digital Footprint Review", label: "Digital Footprint Review" },
  { type: "Positive Digital Use Celebration", label: "Positive Digital Use Celebration" },
];

export const RISK_LEVEL_LABELS: { level: RiskLevel; label: string }[] = [
  { level: "No Identified Risk", label: "No Identified Risk" },
  { level: "Low", label: "Low Risk" },
  { level: "Medium", label: "Medium Risk" },
  { level: "High", label: "High Risk" },
  { level: "Critical", label: "Critical Risk" },
];

// -- Row type -----------------------------------------------------------------

export interface DigitalWellbeingRow {
  id: string;
  home_id: string;
  child_name: string;
  record_date: string;
  recorded_by: string;
  record_type: RecordType;
  platform_involved: string | null;
  risk_level: RiskLevel;
  age_appropriate_use: boolean;
  privacy_settings_reviewed: boolean;
  contact_with_strangers_identified: boolean;
  harmful_content_exposure: boolean;
  cyberbullying_identified: boolean;
  image_sharing_concerns: boolean;
  excessive_use_identified: boolean;
  parental_controls_active: boolean;
  agreed_screen_time_hours: number | null;
  actual_screen_time_hours: number | null;
  action_taken: string | null;
  education_provided: boolean;
  child_views_obtained: boolean;
  social_worker_informed: boolean | null;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validateDigitalWellbeing(input: {
  childName?: string;
  recordDate?: string;
  recordedBy?: string;
  recordType?: string;
  riskLevel?: string;
  contactWithStrangersIdentified?: boolean;
  harmfulContentExposure?: boolean;
  cyberbullyingIdentified?: boolean;
  imageSharingConcerns?: boolean;
  socialWorkerInformed?: boolean | null;
  actionTaken?: string | null;
  agreedScreenTimeHours?: number | null;
  actualScreenTimeHours?: number | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }

  if (!input.recordDate) {
    errors.push("Record date is required");
  } else {
    const dateObj = new Date(input.recordDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Record date must be a valid date");
    } else if (dateObj > new Date()) {
      errors.push("Record date cannot be in the future");
    }
  }

  if (!input.recordedBy || input.recordedBy.trim().length === 0) {
    errors.push("Recorded by (staff name) is required");
  }

  if (!input.recordType || !(RECORD_TYPES as readonly string[]).includes(input.recordType)) {
    errors.push(`Record type must be one of: ${RECORD_TYPES.join(", ")}`);
  }

  if (input.riskLevel && !(RISK_LEVELS as readonly string[]).includes(input.riskLevel)) {
    errors.push(`Risk level must be one of: ${RISK_LEVELS.join(", ")}`);
  }

  // Business rule: Contact with strangers must trigger social worker notification
  if (input.contactWithStrangersIdentified === true && input.socialWorkerInformed === false) {
    errors.push(
      "Social worker must be informed when contact with strangers is identified — KCSIE 2023 requires that any safeguarding concern, including online contact with unknown adults, is reported through the home's safeguarding procedures. Contact with strangers may indicate grooming or CSE risk",
    );
  }

  // Business rule: Harmful content or cyberbullying must have action taken
  if (
    (input.harmfulContentExposure === true || input.cyberbullyingIdentified === true) &&
    (!input.actionTaken || input.actionTaken.trim().length === 0)
  ) {
    errors.push(
      "Action taken must be recorded when harmful content exposure or cyberbullying is identified — Online Safety Act 2023 places duties on providers, but the home must also take protective action and record its response for regulatory compliance",
    );
  }

  // Business rule: Image sharing concerns must trigger social worker notification
  if (input.imageSharingConcerns === true && input.socialWorkerInformed === false) {
    errors.push(
      "Social worker must be informed when image sharing concerns are identified — sharing of intimate or indecent images of children is a criminal offence and a serious safeguarding matter. Follow KCSIE 2023 guidance on sexting/youth-produced sexual imagery",
    );
  }

  // Business rule: Screen time validation
  if (input.agreedScreenTimeHours !== null && input.agreedScreenTimeHours !== undefined) {
    if (input.agreedScreenTimeHours < 0) {
      errors.push("Agreed screen time hours cannot be negative");
    }
    if (input.agreedScreenTimeHours > 24) {
      errors.push("Agreed screen time hours cannot exceed 24 hours per day");
    }
  }

  if (input.actualScreenTimeHours !== null && input.actualScreenTimeHours !== undefined) {
    if (input.actualScreenTimeHours < 0) {
      errors.push("Actual screen time hours cannot be negative");
    }
    if (input.actualScreenTimeHours > 24) {
      errors.push("Actual screen time hours cannot exceed 24 hours per day");
    }
  }

  // Business rule: High/Critical risk must have action taken
  if (
    input.riskLevel &&
    (input.riskLevel === "High" || input.riskLevel === "Critical") &&
    (!input.actionTaken || input.actionTaken.trim().length === 0)
  ) {
    errors.push(
      `Risk level is ${input.riskLevel} but no action has been recorded — CHR 2015 Reg 12 requires the home to take reasonable steps to protect children from online harm. High and Critical risk assessments must result in documented protective action`,
    );
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: DigitalWellbeingRow[],
): {
  total_records: number;
  unique_children: number;
  by_record_type: Record<string, number>;
  by_risk_level: Record<string, number>;
  stranger_contact_rate: number;
  harmful_content_rate: number;
  cyberbullying_rate: number;
  image_sharing_concern_rate: number;
  excessive_use_rate: number;
  parental_controls_rate: number;
  education_rate: number;
  child_views_rate: number;
  average_screen_time: number;
  age_appropriate_rate: number;
  high_critical_risk_count: number;
  privacy_reviewed_rate: number;
  social_worker_informed_rate: number;
  safeguarding_record_count: number;
  positive_record_count: number;
  average_risk_score: number;
} {
  const total = rows.length;

  // Unique children
  const uniqueChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));

  // Record type breakdown
  const byRecordType: Record<string, number> = {};
  for (const rt of RECORD_TYPES) byRecordType[rt] = 0;
  for (const r of rows) byRecordType[r.record_type] = (byRecordType[r.record_type] || 0) + 1;

  // Risk level breakdown
  const byRiskLevel: Record<string, number> = {};
  for (const rl of RISK_LEVELS) byRiskLevel[rl] = 0;
  for (const r of rows) byRiskLevel[r.risk_level] = (byRiskLevel[r.risk_level] || 0) + 1;

  // Boolean rates
  const strangerContactRate = total > 0
    ? Math.round((rows.filter((r) => r.contact_with_strangers_identified).length / total) * 1000) / 10
    : 0;

  const harmfulContentRate = total > 0
    ? Math.round((rows.filter((r) => r.harmful_content_exposure).length / total) * 1000) / 10
    : 0;

  const cyberbullyingRate = total > 0
    ? Math.round((rows.filter((r) => r.cyberbullying_identified).length / total) * 1000) / 10
    : 0;

  const imageSharingConcernRate = total > 0
    ? Math.round((rows.filter((r) => r.image_sharing_concerns).length / total) * 1000) / 10
    : 0;

  const excessiveUseRate = total > 0
    ? Math.round((rows.filter((r) => r.excessive_use_identified).length / total) * 1000) / 10
    : 0;

  const parentalControlsRate = total > 0
    ? Math.round((rows.filter((r) => r.parental_controls_active).length / total) * 1000) / 10
    : 0;

  const educationRate = total > 0
    ? Math.round((rows.filter((r) => r.education_provided).length / total) * 1000) / 10
    : 0;

  const childViewsRate = total > 0
    ? Math.round((rows.filter((r) => r.child_views_obtained).length / total) * 1000) / 10
    : 0;

  const ageAppropriateRate = total > 0
    ? Math.round((rows.filter((r) => r.age_appropriate_use).length / total) * 1000) / 10
    : 0;

  const privacyReviewedRate = total > 0
    ? Math.round((rows.filter((r) => r.privacy_settings_reviewed).length / total) * 1000) / 10
    : 0;

  const socialWorkerInformedRate = total > 0
    ? Math.round(
        (rows.filter((r) => r.social_worker_informed === true).length / total) * 1000,
      ) / 10
    : 0;

  // Average screen time (from records that have actual_screen_time_hours)
  const screenTimeRows = rows.filter(
    (r) => r.actual_screen_time_hours !== null && r.actual_screen_time_hours !== undefined,
  );
  const avgScreenTime = screenTimeRows.length > 0
    ? Math.round(
        (screenTimeRows.reduce((sum, r) => sum + (r.actual_screen_time_hours ?? 0), 0) /
          screenTimeRows.length) * 10,
      ) / 10
    : 0;

  // High/Critical risk count
  const highCriticalCount = rows.filter(
    (r) => r.risk_level === "High" || r.risk_level === "Critical",
  ).length;

  // Safeguarding record count
  const safeguardingCount = rows.filter(
    (r) => (SAFEGUARDING_RECORD_TYPES as string[]).includes(r.record_type),
  ).length;

  // Positive record count
  const positiveCount = rows.filter(
    (r) => (POSITIVE_RECORD_TYPES as string[]).includes(r.record_type),
  ).length;

  // Average risk score
  const avgRiskScore = total > 0
    ? Math.round(
        (rows.reduce((sum, r) => sum + (RISK_NUMERIC[r.risk_level] ?? 0), 0) / total) * 10,
      ) / 10
    : 0;

  return {
    total_records: total,
    unique_children: uniqueChildren.size,
    by_record_type: byRecordType,
    by_risk_level: byRiskLevel,
    stranger_contact_rate: strangerContactRate,
    harmful_content_rate: harmfulContentRate,
    cyberbullying_rate: cyberbullyingRate,
    image_sharing_concern_rate: imageSharingConcernRate,
    excessive_use_rate: excessiveUseRate,
    parental_controls_rate: parentalControlsRate,
    education_rate: educationRate,
    child_views_rate: childViewsRate,
    average_screen_time: avgScreenTime,
    age_appropriate_rate: ageAppropriateRate,
    high_critical_risk_count: highCriticalCount,
    privacy_reviewed_rate: privacyReviewedRate,
    social_worker_informed_rate: socialWorkerInformedRate,
    safeguarding_record_count: safeguardingCount,
    positive_record_count: positiveCount,
    average_risk_score: avgRiskScore,
  };
}

export function computeAlerts(
  rows: DigitalWellbeingRow[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    record_id?: string;
  }[] = [];

  // Critical: Contact with strangers identified
  for (const r of rows) {
    if (r.contact_with_strangers_identified) {
      alerts.push({
        type: "stranger_contact",
        severity: "critical",
        message: `Contact with strangers identified for ${r.child_name} on ${r.record_date}${r.platform_involved ? ` on ${r.platform_involved}` : ""} — this is a potential grooming or CSE indicator. KCSIE 2023 requires immediate safeguarding action. Follow the home's safeguarding procedures, inform the designated safeguarding lead, and consider referral to CEOP (Child Exploitation and Online Protection Command)`,
        record_id: r.id,
      });
    }
  }

  // Critical: Image sharing concerns
  for (const r of rows) {
    if (r.image_sharing_concerns) {
      alerts.push({
        type: "image_sharing_concern",
        severity: "critical",
        message: `Image sharing concerns identified for ${r.child_name} on ${r.record_date}${r.platform_involved ? ` on ${r.platform_involved}` : ""} — sharing of intimate or indecent images of children is a criminal offence. Follow KCSIE 2023 guidance on sexting/youth-produced sexual imagery. Do not confiscate the device or view the images. Report to the designated safeguarding lead and consider referral to police`,
        record_id: r.id,
      });
    }
  }

  // Critical: Critical risk level
  for (const r of rows) {
    if (r.risk_level === "Critical") {
      alerts.push({
        type: "critical_risk",
        severity: "critical",
        message: `Critical digital risk identified for ${r.child_name} on ${r.record_date} (${r.record_type})${r.platform_involved ? ` involving ${r.platform_involved}` : ""} — immediate safeguarding action required under CHR 2015 Reg 12. Online Safety Act 2023 places duties on providers, but the home must take immediate protective steps for the child`,
        record_id: r.id,
      });
    }
  }

  // Critical: Cyberbullying identified
  for (const r of rows) {
    if (r.cyberbullying_identified) {
      alerts.push({
        type: "cyberbullying",
        severity: "critical",
        message: `Cyberbullying identified for ${r.child_name} on ${r.record_date}${r.platform_involved ? ` on ${r.platform_involved}` : ""} — cyberbullying can have severe emotional and psychological impact on looked-after children who may already be vulnerable. KCSIE 2023 requires schools and homes to address bullying including cyberbullying. Document evidence, support the child, and consider reporting to the platform and police if criminal`,
        record_id: r.id,
      });
    }
  }

  // Critical: Harmful content exposure
  for (const r of rows) {
    if (r.harmful_content_exposure) {
      alerts.push({
        type: "harmful_content",
        severity: "critical",
        message: `Harmful content exposure identified for ${r.child_name} on ${r.record_date}${r.platform_involved ? ` on ${r.platform_involved}` : ""} — exposure to harmful content (violence, self-harm, radicalisation, pornography) is a safeguarding matter under KCSIE 2023. Review content filtering, parental controls, and provide age-appropriate support. Consider whether Prevent referral is needed if radicalisation content`,
        record_id: r.id,
      });
    }
  }

  // High: High risk level without action taken
  for (const r of rows) {
    if (r.risk_level === "High" && (!r.action_taken || r.action_taken.trim().length === 0)) {
      alerts.push({
        type: "high_risk_no_action",
        severity: "high",
        message: `High digital risk identified for ${r.child_name} on ${r.record_date} (${r.record_type}) but no action has been recorded — CHR 2015 Reg 12 requires the home to take reasonable steps to protect children from online harm. Document the protective action taken`,
        record_id: r.id,
      });
    }
  }

  // High: Age-inappropriate use identified
  for (const r of rows) {
    if (!r.age_appropriate_use) {
      alerts.push({
        type: "age_inappropriate_use",
        severity: "high",
        message: `Age-inappropriate digital use identified for ${r.child_name} on ${r.record_date}${r.platform_involved ? ` on ${r.platform_involved}` : ""} — UK Age Appropriate Design Code (Children's Code) requires services to provide age-appropriate experiences. Many social media platforms have minimum age requirements (typically 13). Ensure the child is not accessing platforms below the minimum age or viewing age-inappropriate content`,
        record_id: r.id,
      });
    }
  }

  // High: No parental controls for child with identified concerns
  for (const r of rows) {
    if (
      !r.parental_controls_active &&
      (r.contact_with_strangers_identified ||
        r.harmful_content_exposure ||
        r.cyberbullying_identified ||
        r.excessive_use_identified)
    ) {
      alerts.push({
        type: "no_controls_with_concerns",
        severity: "high",
        message: `Digital safety concerns identified for ${r.child_name} on ${r.record_date} but parental controls are not active — when online risks have been identified, CHR 2015 Reg 12 requires the home to put protective measures in place. Activate age-appropriate content filtering, time limits, and monitoring proportionate to the identified risks`,
        record_id: r.id,
      });
    }
  }

  // High: Social worker not informed for safeguarding records
  for (const r of rows) {
    if (
      (SAFEGUARDING_RECORD_TYPES as string[]).includes(r.record_type) &&
      r.social_worker_informed === false
    ) {
      alerts.push({
        type: "social_worker_not_informed_safeguarding",
        severity: "high",
        message: `Social worker not informed about ${r.record_type} for ${r.child_name} on ${r.record_date} — safeguarding-related digital concerns must be communicated to the allocated social worker as part of the multi-agency safeguarding response`,
        record_id: r.id,
      });
    }
  }

  // High: Excessive screen time (actual significantly exceeds agreed)
  for (const r of rows) {
    if (
      r.agreed_screen_time_hours !== null &&
      r.actual_screen_time_hours !== null &&
      r.agreed_screen_time_hours > 0 &&
      r.actual_screen_time_hours > r.agreed_screen_time_hours * 1.5
    ) {
      alerts.push({
        type: "excessive_screen_time",
        severity: "high",
        message: `${r.child_name} had ${r.actual_screen_time_hours} hours screen time against an agreed ${r.agreed_screen_time_hours} hours on ${r.record_date} — excessive screen time can impact sleep, physical health, and emotional wellbeing. Ofcom research links excessive screen time in children to negative outcomes. Review the agreed limits and discuss with the child`,
        record_id: r.id,
      });
    }
  }

  // Medium: Repeated excessive use by same child
  const childExcessiveMap = new Map<string, DigitalWellbeingRow[]>();
  for (const r of rows) {
    if (r.excessive_use_identified) {
      const key = r.child_name.toLowerCase().trim();
      if (!childExcessiveMap.has(key)) childExcessiveMap.set(key, []);
      childExcessiveMap.get(key)!.push(r);
    }
  }
  for (const [, childRows] of childExcessiveMap) {
    if (childRows.length >= 3) {
      alerts.push({
        type: "repeated_excessive_use",
        severity: "medium",
        message: `${childRows[0].child_name} has had excessive digital use identified ${childRows.length} times — persistent excessive screen time may indicate underlying emotional needs, social isolation, or lack of alternative activities. Consider whether a digital wellbeing plan is needed as part of the child's care plan`,
      });
    }
  }

  // Medium: Low child views rate
  const childViewsCount = rows.filter((r) => r.child_views_obtained).length;
  if (rows.length >= 5 && childViewsCount / rows.length < 0.3) {
    alerts.push({
      type: "low_child_views",
      severity: "medium",
      message: `Child views obtained in only ${Math.round((childViewsCount / rows.length) * 100)}% of digital wellbeing records — UNCRC Article 12 and CHR 2015 require that children's views are sought and considered. Digital boundaries should be agreed collaboratively with children, not imposed without discussion. Children who feel heard are more likely to engage with safety measures`,
    });
  }

  // Medium: Low education rate
  const educationCount = rows.filter((r) => r.education_provided).length;
  if (rows.length >= 5 && educationCount / rows.length < 0.3) {
    alerts.push({
      type: "low_education_rate",
      severity: "medium",
      message: `Digital education provided in only ${Math.round((educationCount / rows.length) * 100)}% of records — KCSIE 2023 emphasises the importance of educating children about online safety. Restrictive measures alone are insufficient; children need to understand risks and develop their own digital resilience and critical thinking skills`,
    });
  }

  // Medium: Low privacy settings review rate
  const privacyReviewed = rows.filter((r) => r.privacy_settings_reviewed).length;
  if (rows.length >= 5 && privacyReviewed / rows.length < 0.4) {
    alerts.push({
      type: "low_privacy_review",
      severity: "medium",
      message: `Privacy settings reviewed in only ${Math.round((privacyReviewed / rows.length) * 100)}% of digital wellbeing records — UK Age Appropriate Design Code requires that children's privacy is protected by default. Regular review of privacy settings across all platforms is essential to minimise data exposure and contact from unknown users`,
    });
  }

  // Medium: No positive digital use celebrations
  const positiveCount = rows.filter(
    (r) => r.record_type === "Positive Digital Use Celebration",
  ).length;
  if (rows.length >= 8 && positiveCount === 0) {
    alerts.push({
      type: "no_positive_celebrations",
      severity: "medium",
      message: "No positive digital use has been celebrated — a solely risk-focused approach to digital wellbeing can feel punitive and disengaging for children. SCCIF inspectors expect a balanced approach that recognises and encourages positive digital skills, creativity, and healthy online relationships alongside risk management",
    });
  }

  return alerts;
}

export function generateAriaInsights(
  rows: DigitalWellbeingRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_record_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  const riskBreakdown = Object.entries(metrics.by_risk_level)
    .filter(([, count]) => count > 0)
    .map(([level, count]) => `${level}: ${count}`)
    .join(", ");

  // Platform breakdown
  const platformCounts: Record<string, number> = {};
  for (const r of rows) {
    if (r.platform_involved) {
      platformCounts[r.platform_involved] = (platformCounts[r.platform_involved] || 0) + 1;
    }
  }
  const platformBreakdown = Object.entries(platformCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([p, c]) => `${p}: ${c}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_records} digital wellbeing ${metrics.total_records === 1 ? "record" : "records"} ` +
      `for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Record types: ${typeBreakdown || "none recorded"}. ` +
      `Risk levels: ${riskBreakdown || "none"}. ` +
      `Platforms: ${platformBreakdown || "none specified"}. ` +
      `Average risk score: ${metrics.average_risk_score}/4. ` +
      `High/Critical risk records: ${metrics.high_critical_risk_count}. ` +
      `Average screen time: ${metrics.average_screen_time} hours. ` +
      `Age appropriate use: ${metrics.age_appropriate_rate}%.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority digital safety alerts. ` +
        `Stranger contact rate: ${metrics.stranger_contact_rate}%. ` +
        `Harmful content rate: ${metrics.harmful_content_rate}%. ` +
        `Cyberbullying rate: ${metrics.cyberbullying_rate}%. ` +
        `Image sharing concerns: ${metrics.image_sharing_concern_rate}%. ` +
        `Excessive use: ${metrics.excessive_use_rate}%. ` +
        `Parental controls active: ${metrics.parental_controls_rate}%. ` +
        `Privacy reviewed: ${metrics.privacy_reviewed_rate}%. ` +
        `Education provided: ${metrics.education_rate}%. ` +
        `Child views obtained: ${metrics.child_views_rate}%.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority digital safety alerts. ` +
        `Stranger contact rate: ${metrics.stranger_contact_rate}%. ` +
        `Harmful content rate: ${metrics.harmful_content_rate}%. ` +
        `Cyberbullying rate: ${metrics.cyberbullying_rate}%. ` +
        `Image sharing concerns: ${metrics.image_sharing_concern_rate}%. ` +
        `Parental controls active: ${metrics.parental_controls_rate}%. ` +
        `Privacy reviewed: ${metrics.privacy_reviewed_rate}%. ` +
        `Education provided: ${metrics.education_rate}%. ` +
        `Child views obtained: ${metrics.child_views_rate}%. ` +
        `Continue monitoring digital safety under CHR 2015 Reg 12 and KCSIE 2023.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.stranger_contact_rate > 15 || metrics.image_sharing_concern_rate > 10) {
    insights.push(
      `[reflect] Stranger contact rate is ${metrics.stranger_contact_rate}% and image sharing ` +
        `concern rate is ${metrics.image_sharing_concern_rate}%. These are significant safeguarding ` +
        `indicators. Is the home's approach to online safety sufficiently robust? KCSIE 2023 ` +
        `requires a whole-setting approach to online safety that includes education, monitoring, ` +
        `and protective technology. Are privacy settings being reviewed regularly across all ` +
        `platforms? Are children being educated about the risks of sharing personal information ` +
        `and images online? For looked-after children, who may be more vulnerable to online ` +
        `exploitation due to their care experiences, proactive monitoring and open conversations ` +
        `about online relationships are essential.`,
    );
  } else if (metrics.education_rate < 40 && metrics.total_records > 5) {
    insights.push(
      `[reflect] Digital education is provided in only ${metrics.education_rate}% of records. ` +
        `The Online Safety Act 2023 and KCSIE 2023 emphasise that children need to develop ` +
        `digital resilience and critical thinking skills, not just be shielded from risk. ` +
        `Is the home investing enough in proactive digital literacy education? Are sessions ` +
        `covering topics like privacy, digital footprints, recognising grooming, consent in ` +
        `image sharing, and healthy screen habits? Children who understand online risks are ` +
        `better equipped to protect themselves — this is particularly important for ` +
        `looked-after children who will need these skills in independent living.`,
    );
  } else if (metrics.child_views_rate < 40 && metrics.total_records > 5) {
    insights.push(
      `[reflect] Child views are obtained in only ${metrics.child_views_rate}% of digital ` +
        `wellbeing records. UNCRC Article 12 and CHR 2015 require that children's views ` +
        `are sought and considered in decisions affecting them. Digital boundaries imposed ` +
        `without the child's input can feel punitive and may damage trust. Are digital ` +
        `agreements being developed collaboratively? Are children given age-appropriate ` +
        `autonomy in their digital lives? The UK Age Appropriate Design Code recognises ` +
        `that children's digital capabilities develop with age — restrictions should be ` +
        `proportionate and regularly reviewed with the child's involvement.`,
    );
  } else {
    insights.push(
      `[reflect] How does the home balance online safety with children's right to privacy ` +
        `and digital participation? The Online Safety Act 2023 and UK Age Appropriate ` +
        `Design Code set clear expectations, but UNCRC Article 16 also protects children's ` +
        `right to privacy. Overly restrictive approaches can isolate looked-after children ` +
        `from their peers and hinder the development of digital skills needed for ` +
        `independent living. Is the home taking a proportionate, child-centred approach ` +
        `that manages risk while promoting positive digital engagement? Are staff ` +
        `confident in their own digital knowledge to guide children effectively? ` +
        `SCCIF inspectors expect to see that the home manages online risks while ` +
        `supporting children to benefit from technology.`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    recordType?: RecordType;
    riskLevel?: RiskLevel;
    limit?: number;
  },
): Promise<ServiceResult<DigitalWellbeingRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_digital_wellbeing") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.recordType) q = q.eq("record_type", filters.recordType);
  if (filters?.riskLevel) q = q.eq("risk_level", filters.riskLevel);

  q = q.order("record_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<DigitalWellbeingRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_digital_wellbeing") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  childName: string;
  recordDate: string;
  recordedBy: string;
  recordType: RecordType;
  platformInvolved?: string | null;
  riskLevel?: RiskLevel;
  ageAppropriateUse?: boolean;
  privacySettingsReviewed?: boolean;
  contactWithStrangersIdentified?: boolean;
  harmfulContentExposure?: boolean;
  cyberbullyingIdentified?: boolean;
  imageSharingConcerns?: boolean;
  excessiveUseIdentified?: boolean;
  parentalControlsActive?: boolean;
  agreedScreenTimeHours?: number | null;
  actualScreenTimeHours?: number | null;
  actionTaken?: string | null;
  educationProvided?: boolean;
  childViewsObtained?: boolean;
  socialWorkerInformed?: boolean | null;
  nextReviewDate?: string | null;
  notes?: string | null;
}): Promise<ServiceResult<DigitalWellbeingRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validateDigitalWellbeing({
    childName: input.childName,
    recordDate: input.recordDate,
    recordedBy: input.recordedBy,
    recordType: input.recordType,
    riskLevel: input.riskLevel,
    contactWithStrangersIdentified: input.contactWithStrangersIdentified,
    harmfulContentExposure: input.harmfulContentExposure,
    cyberbullyingIdentified: input.cyberbullyingIdentified,
    imageSharingConcerns: input.imageSharingConcerns,
    socialWorkerInformed: input.socialWorkerInformed,
    actionTaken: input.actionTaken,
    agreedScreenTimeHours: input.agreedScreenTimeHours,
    actualScreenTimeHours: input.actualScreenTimeHours,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_digital_wellbeing") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      record_date: input.recordDate,
      recorded_by: input.recordedBy,
      record_type: input.recordType,
      platform_involved: input.platformInvolved ?? null,
      risk_level: input.riskLevel ?? "No Identified Risk",
      age_appropriate_use: input.ageAppropriateUse ?? true,
      privacy_settings_reviewed: input.privacySettingsReviewed ?? false,
      contact_with_strangers_identified: input.contactWithStrangersIdentified ?? false,
      harmful_content_exposure: input.harmfulContentExposure ?? false,
      cyberbullying_identified: input.cyberbullyingIdentified ?? false,
      image_sharing_concerns: input.imageSharingConcerns ?? false,
      excessive_use_identified: input.excessiveUseIdentified ?? false,
      parental_controls_active: input.parentalControlsActive ?? false,
      agreed_screen_time_hours: input.agreedScreenTimeHours ?? null,
      actual_screen_time_hours: input.actualScreenTimeHours ?? null,
      action_taken: input.actionTaken ?? null,
      education_provided: input.educationProvided ?? false,
      child_views_obtained: input.childViewsObtained ?? false,
      social_worker_informed: input.socialWorkerInformed ?? null,
      next_review_date: input.nextReviewDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    childName: string;
    recordDate: string;
    recordedBy: string;
    recordType: RecordType;
    platformInvolved: string | null;
    riskLevel: RiskLevel;
    ageAppropriateUse: boolean;
    privacySettingsReviewed: boolean;
    contactWithStrangersIdentified: boolean;
    harmfulContentExposure: boolean;
    cyberbullyingIdentified: boolean;
    imageSharingConcerns: boolean;
    excessiveUseIdentified: boolean;
    parentalControlsActive: boolean;
    agreedScreenTimeHours: number | null;
    actualScreenTimeHours: number | null;
    actionTaken: string | null;
    educationProvided: boolean;
    childViewsObtained: boolean;
    socialWorkerInformed: boolean | null;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<DigitalWellbeingRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.recordDate !== undefined) mapped.record_date = updates.recordDate;
  if (updates.recordedBy !== undefined) mapped.recorded_by = updates.recordedBy;
  if (updates.recordType !== undefined) mapped.record_type = updates.recordType;
  if (updates.platformInvolved !== undefined) mapped.platform_involved = updates.platformInvolved;
  if (updates.riskLevel !== undefined) mapped.risk_level = updates.riskLevel;
  if (updates.ageAppropriateUse !== undefined) mapped.age_appropriate_use = updates.ageAppropriateUse;
  if (updates.privacySettingsReviewed !== undefined) mapped.privacy_settings_reviewed = updates.privacySettingsReviewed;
  if (updates.contactWithStrangersIdentified !== undefined) mapped.contact_with_strangers_identified = updates.contactWithStrangersIdentified;
  if (updates.harmfulContentExposure !== undefined) mapped.harmful_content_exposure = updates.harmfulContentExposure;
  if (updates.cyberbullyingIdentified !== undefined) mapped.cyberbullying_identified = updates.cyberbullyingIdentified;
  if (updates.imageSharingConcerns !== undefined) mapped.image_sharing_concerns = updates.imageSharingConcerns;
  if (updates.excessiveUseIdentified !== undefined) mapped.excessive_use_identified = updates.excessiveUseIdentified;
  if (updates.parentalControlsActive !== undefined) mapped.parental_controls_active = updates.parentalControlsActive;
  if (updates.agreedScreenTimeHours !== undefined) mapped.agreed_screen_time_hours = updates.agreedScreenTimeHours;
  if (updates.actualScreenTimeHours !== undefined) mapped.actual_screen_time_hours = updates.actualScreenTimeHours;
  if (updates.actionTaken !== undefined) mapped.action_taken = updates.actionTaken;
  if (updates.educationProvided !== undefined) mapped.education_provided = updates.educationProvided;
  if (updates.childViewsObtained !== undefined) mapped.child_views_obtained = updates.childViewsObtained;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  mapped.updated_at = new Date().toISOString();

  const { data, error } = await (client.from("cs_digital_wellbeing") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteRecord(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_digital_wellbeing") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

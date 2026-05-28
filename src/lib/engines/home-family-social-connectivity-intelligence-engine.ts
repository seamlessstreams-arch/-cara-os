// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME FAMILY & SOCIAL CONNECTIVITY INTELLIGENCE ENGINE
// Cross-domain composite engine: analyses family contact, social connections,
// and partnership quality for children in the home. Aggregates data from
// familyTimeSessions, contactPlans, parentPartnershipRecords,
// socialWorkerContactRecords, and siblingContactProtocolRecords to assess how
// well the home facilitates and maintains children's family and social
// relationships.
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface FamilyTimeSessionInput {
  id: string;
  child_id: string;
  session_date: string;
  session_type: string; // "face_to_face" | "phone" | "video" | "letter" | "supervised" | "unsupervised"
  family_member: string;
  duration_minutes: number;
  quality_rating: number; // 1-5
  child_voice_captured: boolean;
  child_enjoyed: boolean;
  post_contact_distress: boolean;
  follow_up_actions: string | null;
  staff_id: string;
  created_at: string;
}

export interface ContactPlanInput {
  id: string;
  child_id: string;
  contact_type: string;
  frequency: string; // "weekly" | "fortnightly" | "monthly" | "as_needed"
  status: string; // "active" | "suspended" | "under_review"
  last_reviewed: string | null;
  created_at: string;
}

export interface ParentPartnershipRecordInput {
  id: string;
  child_id: string;
  parent_name: string;
  engagement_level: string; // "high" | "medium" | "low" | "none"
  communication_method: string;
  last_contact_date: string;
  partnership_quality: string; // "positive" | "neutral" | "challenging" | "hostile"
  created_at: string;
}

export interface SocialWorkerContactInput {
  id: string;
  child_id: string;
  contact_date: string;
  contact_type: string; // "visit" | "phone" | "email" | "meeting"
  purpose: string;
  child_seen: boolean;
  outcome_recorded: boolean;
  created_at: string;
}

export interface SiblingContactProtocolInput {
  id: string;
  child_id: string;
  sibling_name: string;
  contact_frequency: string;
  last_contact_date: string | null;
  protocol_status: string; // "active" | "suspended" | "not_applicable"
  contact_maintained: boolean;
  created_at: string;
}

export interface FamilySocialConnectivityInput {
  today: string;
  total_children: number;
  total_staff: number;
  family_time_sessions: FamilyTimeSessionInput[];
  contact_plans: ContactPlanInput[];
  parent_partnership_records: ParentPartnershipRecordInput[];
  social_worker_contacts: SocialWorkerContactInput[];
  sibling_contact_protocols: SiblingContactProtocolInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type FamilySocialConnectivityRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface FamilySocialConnectivityResult {
  connectivity_rating: FamilySocialConnectivityRating;
  connectivity_score: number; // 0-100
  headline: string;
  total_sessions: number;
  sessions_per_child: number;
  session_quality_avg: number;
  contact_plan_coverage: number; // % of children with active plan
  parent_engagement_rate: number; // % with high/medium engagement
  social_worker_contact_rate: number; // % of children seen by SW recently
  sibling_contact_compliance: number; // % where contact maintained
  child_voice_capture_rate: number;
  post_contact_distress_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: { rank: number; recommendation: string; urgency: "immediate" | "soon" | "planned"; regulatory_ref?: string }[];
  insights: { text: string; severity: "critical" | "warning" | "positive" }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): FamilySocialConnectivityRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(a: string, b: string): number {
  const ms = Math.abs(new Date(b).getTime() - new Date(a).getTime());
  return Math.round(ms / 86_400_000);
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeFamilySocialConnectivity(
  input: FamilySocialConnectivityInput,
): FamilySocialConnectivityResult {
  const {
    today,
    total_children,
    total_staff,
    family_time_sessions,
    contact_plans,
    parent_partnership_records,
    social_worker_contacts,
    sibling_contact_protocols,
  } = input;

  const allEmpty =
    family_time_sessions.length === 0 &&
    contact_plans.length === 0 &&
    parent_partnership_records.length === 0 &&
    social_worker_contacts.length === 0 &&
    sibling_contact_protocols.length === 0;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  if (allEmpty && total_children === 0) {
    return {
      connectivity_rating: "insufficient_data",
      connectivity_score: 0,
      headline: "Insufficient data — no children placed and no family contact records.",
      total_sessions: 0,
      sessions_per_child: 0,
      session_quality_avg: 0,
      contact_plan_coverage: 0,
      parent_engagement_rate: 0,
      social_worker_contact_rate: 0,
      sibling_contact_compliance: 0,
      child_voice_capture_rate: 0,
      post_contact_distress_rate: 0,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Special case: all empty + children > 0 → inadequate (score 15) ────
  if (allEmpty && total_children > 0) {
    return {
      connectivity_rating: "inadequate",
      connectivity_score: 15,
      headline: "Inadequate — no family contact, partnership, or social worker records for any child in placement.",
      total_sessions: 0,
      sessions_per_child: 0,
      session_quality_avg: 0,
      contact_plan_coverage: 0,
      parent_engagement_rate: 0,
      social_worker_contact_rate: 0,
      sibling_contact_compliance: 0,
      child_voice_capture_rate: 0,
      post_contact_distress_rate: 0,
      strengths: [],
      concerns: [
        "No family time sessions have been recorded for any child in the home.",
        "No contact plans are in place — children's right to family life may not be being facilitated.",
        "No parent partnership records exist — engagement with birth families is not evidenced.",
        "No social worker contact records found — statutory visiting may not be being tracked.",
        "No sibling contact protocols established — sibling relationships may be at risk of breakdown.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation: "Establish contact plans for every child immediately — each child must have a documented plan for maintaining family relationships.",
          urgency: "immediate",
          regulatory_ref: "Reg 45",
        },
        {
          rank: 2,
          recommendation: "Begin recording family time sessions to evidence that children's contact with family members is being facilitated and supported.",
          urgency: "immediate",
          regulatory_ref: "Reg 45",
        },
        {
          rank: 3,
          recommendation: "Set up parent partnership records to document engagement with birth parents and evidence collaborative working.",
          urgency: "immediate",
          regulatory_ref: "Reg 7",
        },
        {
          rank: 4,
          recommendation: "Ensure social worker visits are being recorded — statutory visiting compliance must be evidenced for each child.",
          urgency: "immediate",
          regulatory_ref: "Reg 40",
        },
        {
          rank: 5,
          recommendation: "Establish sibling contact protocols for children with siblings placed elsewhere to protect sibling relationships.",
          urgency: "soon",
          regulatory_ref: "Reg 45",
        },
      ],
      insights: [
        {
          text: "No family or social connectivity data exists for any child. This represents a critical gap in evidencing that the home facilitates children's relationships. Ofsted inspectors will expect to see robust contact plans, family time records, and multi-agency engagement.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Core metrics: Family Time Sessions ────────────────────────────────
  const totalSessions = family_time_sessions.length;
  const sessionsPerChild = total_children > 0
    ? Math.round((totalSessions / total_children) * 10) / 10
    : 0;

  const qualityRatings = family_time_sessions.map((s) => s.quality_rating);
  const sessionQualityAvg = qualityRatings.length > 0
    ? Math.round((qualityRatings.reduce((a, b) => a + b, 0) / qualityRatings.length) * 10) / 10
    : 0;

  const childVoiceCaptured = family_time_sessions.filter((s) => s.child_voice_captured).length;
  const childVoiceCaptureRate = pct(childVoiceCaptured, totalSessions);

  const postDistressSessions = family_time_sessions.filter((s) => s.post_contact_distress).length;
  const postContactDistressRate = pct(postDistressSessions, totalSessions);

  const distinctSessionTypes = new Set(family_time_sessions.map((s) => s.session_type));
  const diverseSessionTypes = distinctSessionTypes.size;

  // ── Core metrics: Contact Plans ───────────────────────────────────────
  const activePlans = contact_plans.filter((p) => p.status === "active");
  const childrenWithActivePlan = new Set(activePlans.map((p) => p.child_id));
  const contactPlanCoverage = pct(childrenWithActivePlan.size, total_children);

  const stalePlans = activePlans.filter((p) => {
    if (!p.last_reviewed) return true;
    return daysBetween(p.last_reviewed, today) > 90;
  });
  const stalePlanCount = stalePlans.length;

  // ── Core metrics: Parent Partnership ──────────────────────────────────
  const totalPartnerships = parent_partnership_records.length;
  const highMediumEngagement = parent_partnership_records.filter(
    (p) => p.engagement_level === "high" || p.engagement_level === "medium",
  );
  const parentEngagementRate = pct(highMediumEngagement.length, totalPartnerships);

  const hostileOrChallenging = parent_partnership_records.filter(
    (p) => p.partnership_quality === "hostile" || p.partnership_quality === "challenging",
  );
  const hostileChallenging = hostileOrChallenging.length;

  const positivePartnerships = parent_partnership_records.filter(
    (p) => p.partnership_quality === "positive",
  );

  const noEngagement = parent_partnership_records.filter(
    (p) => p.engagement_level === "none",
  );

  // ── Core metrics: Social Worker Contact ───────────────────────────────
  const recentSwThreshold = 42; // 6 weeks in days
  const childrenSeenBySw = new Set<string>();
  for (const sw of social_worker_contacts) {
    if (daysBetween(sw.contact_date, today) <= recentSwThreshold && sw.child_seen) {
      childrenSeenBySw.add(sw.child_id);
    }
  }
  const socialWorkerContactRate = pct(childrenSeenBySw.size, total_children);

  const totalSwContacts = social_worker_contacts.length;
  const swWithOutcomes = social_worker_contacts.filter((sw) => sw.outcome_recorded).length;
  const swOutcomeRate = pct(swWithOutcomes, totalSwContacts);

  const swChildNotSeen = social_worker_contacts.filter((sw) => !sw.child_seen).length;
  const swChildNotSeenRate = pct(swChildNotSeen, totalSwContacts);

  // ── Core metrics: Sibling Contact ─────────────────────────────────────
  const activeProtocols = sibling_contact_protocols.filter(
    (p) => p.protocol_status === "active",
  );
  const maintainedContact = activeProtocols.filter((p) => p.contact_maintained);
  const siblingContactCompliance = pct(maintainedContact.length, activeProtocols.length);

  const suspendedProtocols = sibling_contact_protocols.filter(
    (p) => p.protocol_status === "suspended",
  );

  const staleProtocols = activeProtocols.filter((p) => {
    if (!p.last_contact_date) return true;
    return daysBetween(p.last_contact_date, today) > 60;
  });

  // ── Scoring (Base 52) ────────────────────────────────────────────────
  let score = 52;

  // Session quality bonus
  if (sessionQualityAvg >= 4.0) score += 4;
  else if (sessionQualityAvg >= 3.0) score += 2;

  // Contact plan coverage bonus
  if (contactPlanCoverage >= 95) score += 4;
  else if (contactPlanCoverage >= 80) score += 2;

  // Parent engagement bonus
  if (parentEngagementRate >= 80) score += 4;
  else if (parentEngagementRate >= 60) score += 2;

  // Social worker contact rate bonus
  if (socialWorkerContactRate >= 100) score += 3;
  else if (socialWorkerContactRate >= 80) score += 1;

  // Sibling compliance bonus
  if (siblingContactCompliance >= 90) score += 3;
  else if (siblingContactCompliance >= 70) score += 1;

  // Child voice capture rate bonus
  if (childVoiceCaptureRate >= 90) score += 3;
  else if (childVoiceCaptureRate >= 70) score += 1;

  // Sessions per child bonus
  if (sessionsPerChild >= 4) score += 3;
  else if (sessionsPerChild >= 2) score += 1;

  // Post-contact distress (lower is better)
  if (postContactDistressRate <= 10) score += 2;
  else if (postContactDistressRate <= 25) score += 1;

  // Diverse session types bonus
  if (diverseSessionTypes >= 3) score += 2;
  else if (diverseSessionTypes >= 2) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────
  if (contactPlanCoverage < 50) score -= 5;
  if (parentEngagementRate < 30) score -= 5;
  if (postContactDistressRate > 50) score -= 5;
  if (socialWorkerContactRate < 50) score -= 3;

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (sessionQualityAvg >= 4.0 && totalSessions > 0) {
    strengths.push(`Average family time quality rating of ${sessionQualityAvg}/5 — sessions are consistently positive and well-facilitated.`);
  } else if (sessionQualityAvg >= 3.0 && totalSessions > 0) {
    strengths.push(`Average family time quality rating of ${sessionQualityAvg}/5 — sessions are generally positive.`);
  }

  if (contactPlanCoverage >= 95) {
    strengths.push(`${contactPlanCoverage}% of children have an active contact plan — comprehensive coverage demonstrates proactive planning.`);
  } else if (contactPlanCoverage >= 80) {
    strengths.push(`${contactPlanCoverage}% contact plan coverage — the majority of children have active, documented contact arrangements.`);
  }

  if (parentEngagementRate >= 80 && totalPartnerships > 0) {
    strengths.push(`${parentEngagementRate}% of parent partnerships show high or medium engagement — strong collaborative working with birth families.`);
  } else if (parentEngagementRate >= 60 && totalPartnerships > 0) {
    strengths.push(`${parentEngagementRate}% parent engagement rate — positive partnership working with the majority of families.`);
  }

  if (socialWorkerContactRate >= 100 && total_children > 0) {
    strengths.push("Every child has been seen by their social worker within the last 6 weeks — statutory visiting compliance is excellent.");
  } else if (socialWorkerContactRate >= 80 && total_children > 0) {
    strengths.push(`${socialWorkerContactRate}% of children seen by their social worker recently — strong multi-agency engagement.`);
  }

  if (siblingContactCompliance >= 90 && activeProtocols.length > 0) {
    strengths.push(`${siblingContactCompliance}% sibling contact compliance — sibling relationships are being actively maintained.`);
  } else if (siblingContactCompliance >= 70 && activeProtocols.length > 0) {
    strengths.push(`${siblingContactCompliance}% sibling contact compliance — the majority of sibling contact arrangements are being upheld.`);
  }

  if (childVoiceCaptureRate >= 90 && totalSessions > 0) {
    strengths.push(`Child's voice captured in ${childVoiceCaptureRate}% of sessions — children's views on family contact are being recorded consistently.`);
  } else if (childVoiceCaptureRate >= 70 && totalSessions > 0) {
    strengths.push(`Child's voice captured in ${childVoiceCaptureRate}% of sessions — good practice in recording children's views.`);
  }

  if (sessionsPerChild >= 4) {
    strengths.push(`${sessionsPerChild} sessions per child on average — frequent, regular family contact is being facilitated.`);
  } else if (sessionsPerChild >= 2) {
    strengths.push(`${sessionsPerChild} sessions per child on average — reasonable family contact frequency.`);
  }

  if (postContactDistressRate <= 10 && totalSessions > 0) {
    strengths.push(`Post-contact distress rate is only ${postContactDistressRate}% — children are coping well with family contact.`);
  }

  if (diverseSessionTypes >= 3) {
    strengths.push(`Family time delivered across ${diverseSessionTypes} different formats — varied contact methods support different relationship needs.`);
  }

  if (positivePartnerships.length > 0 && totalPartnerships > 0) {
    const posRate = pct(positivePartnerships.length, totalPartnerships);
    if (posRate >= 70) {
      strengths.push(`${posRate}% of parent partnerships rated as positive — constructive relationships with birth families.`);
    }
  }

  if (swOutcomeRate >= 90 && totalSwContacts > 0) {
    strengths.push(`${swOutcomeRate}% of social worker contacts have recorded outcomes — excellent documentation of professional engagement.`);
  }

  // ── Concerns ──────────────────────────────────────────────────────────
  const concerns: string[] = [];

  if (contactPlanCoverage < 50 && total_children > 0) {
    concerns.push(`Only ${contactPlanCoverage}% of children have an active contact plan — more than half lack documented arrangements for maintaining family relationships.`);
  } else if (contactPlanCoverage < 80 && total_children > 0) {
    concerns.push(`${contactPlanCoverage}% contact plan coverage — some children do not have active, documented contact arrangements.`);
  }

  if (parentEngagementRate < 30 && totalPartnerships > 0) {
    concerns.push(`Only ${parentEngagementRate}% of parent partnerships show meaningful engagement — the home is not evidencing sufficient work with birth families.`);
  } else if (parentEngagementRate < 60 && totalPartnerships > 0) {
    concerns.push(`${parentEngagementRate}% parent engagement rate — fewer than expected families are actively engaged.`);
  }

  if (postContactDistressRate > 50 && totalSessions > 0) {
    concerns.push(`${postContactDistressRate}% of family time sessions result in post-contact distress — this pattern requires urgent clinical review.`);
  } else if (postContactDistressRate > 25 && totalSessions > 0) {
    concerns.push(`${postContactDistressRate}% post-contact distress rate — a significant proportion of children are experiencing distress following family contact.`);
  }

  if (socialWorkerContactRate < 50 && total_children > 0) {
    concerns.push(`Only ${socialWorkerContactRate}% of children have been seen by their social worker in the last 6 weeks — statutory visiting may not be taking place as required.`);
  } else if (socialWorkerContactRate < 80 && total_children > 0) {
    concerns.push(`${socialWorkerContactRate}% social worker contact rate — some children have not been seen by their social worker within the expected 6-week window.`);
  }

  if (siblingContactCompliance < 50 && activeProtocols.length > 0) {
    concerns.push(`Only ${siblingContactCompliance}% of sibling contact protocols are being maintained — sibling relationships are at significant risk of breakdown.`);
  } else if (siblingContactCompliance < 70 && activeProtocols.length > 0) {
    concerns.push(`${siblingContactCompliance}% sibling contact compliance — some sibling relationships are not being maintained as agreed.`);
  }

  if (childVoiceCaptureRate < 50 && totalSessions > 0) {
    concerns.push(`Child's voice captured in only ${childVoiceCaptureRate}% of sessions — children's views on family contact are not being recorded consistently.`);
  }

  if (stalePlanCount > 0) {
    concerns.push(`${stalePlanCount} active contact plan${stalePlanCount > 1 ? "s have" : " has"} not been reviewed in over 90 days — plans may not reflect current circumstances.`);
  }

  if (hostileChallenging > 0 && totalPartnerships > 0) {
    const hcRate = pct(hostileChallenging, totalPartnerships);
    if (hcRate >= 50) {
      concerns.push(`${hcRate}% of parent partnerships are rated as challenging or hostile — this impacts the home's ability to facilitate positive family contact.`);
    }
  }

  if (noEngagement.length > 0 && totalPartnerships > 0) {
    concerns.push(`${noEngagement.length} parent partnership record${noEngagement.length > 1 ? "s show" : " shows"} no engagement — birth family involvement is absent for some children.`);
  }

  if (staleProtocols.length > 0) {
    concerns.push(`${staleProtocols.length} active sibling contact protocol${staleProtocols.length > 1 ? "s have" : " has"} had no recorded contact in over 60 days.`);
  }

  if (swChildNotSeenRate > 30 && totalSwContacts > 0) {
    concerns.push(`In ${swChildNotSeenRate}% of social worker contacts, the child was not seen — this undermines the purpose of statutory visiting.`);
  }

  if (sessionsPerChild < 1 && total_children > 0 && totalSessions > 0) {
    concerns.push(`Only ${sessionsPerChild} sessions per child on average — family contact frequency is below expectations.`);
  }

  if (totalSessions === 0 && total_children > 0) {
    concerns.push("No family time sessions recorded — there is no evidence that the home is facilitating contact with family members.");
  }

  // ── Recommendations ───────────────────────────────────────────────────
  const recs: FamilySocialConnectivityResult["recommendations"] = [];
  let rank = 1;

  if (contactPlanCoverage < 50 && total_children > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Establish active contact plans for every child — fewer than half currently have documented contact arrangements. Each child's plan should detail who they have contact with, how often, and in what format.",
      urgency: "immediate",
      regulatory_ref: "Reg 45",
    });
  } else if (contactPlanCoverage < 80 && total_children > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Increase contact plan coverage to at least 95% — ensure every child has a documented, active plan for maintaining family relationships.",
      urgency: "soon",
      regulatory_ref: "Reg 45",
    });
  }

  if (postContactDistressRate > 50 && totalSessions > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Conduct an urgent review of family contact arrangements — over half of sessions are causing post-contact distress. Consider clinical consultation and safeguarding review for affected children.",
      urgency: "immediate",
      regulatory_ref: "Reg 45",
    });
  } else if (postContactDistressRate > 25 && totalSessions > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Review contact arrangements for children experiencing post-contact distress — consider adjusting session formats, supervision levels, or involving therapeutic support.",
      urgency: "soon",
      regulatory_ref: "Reg 45",
    });
  }

  if (parentEngagementRate < 30 && totalPartnerships > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Develop a parent engagement strategy to improve partnership working with birth families — the current engagement level is insufficient for supporting children's family relationships.",
      urgency: "immediate",
      regulatory_ref: "Reg 45",
    });
  } else if (parentEngagementRate < 60 && totalPartnerships > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Increase efforts to engage birth parents — use varied communication methods and consider whether barriers to engagement can be addressed.",
      urgency: "soon",
      regulatory_ref: "Reg 7",
    });
  }

  if (socialWorkerContactRate < 50 && total_children > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Escalate to placing authorities — fewer than half of children have been seen by their social worker in the last 6 weeks. Record and report non-compliance with statutory visiting requirements.",
      urgency: "immediate",
      regulatory_ref: "Reg 40",
    });
  } else if (socialWorkerContactRate < 80 && total_children > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Follow up with placing authorities for children whose social worker has not visited within the 6-week statutory window.",
      urgency: "soon",
      regulatory_ref: "Reg 40",
    });
  }

  if (siblingContactCompliance < 50 && activeProtocols.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Urgently review sibling contact arrangements — fewer than half of active protocols are being maintained. Assess barriers and consider escalation to placing authorities.",
      urgency: "immediate",
      regulatory_ref: "Reg 45",
    });
  } else if (siblingContactCompliance < 70 && activeProtocols.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Improve sibling contact compliance to at least 90% — ensure protocols are realistic, resourced, and reviewed regularly.",
      urgency: "soon",
      regulatory_ref: "Reg 45",
    });
  }

  if (childVoiceCaptureRate < 50 && totalSessions > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Ensure children's views are captured after every family time session — staff should record how the child felt before, during, and after contact.",
      urgency: "soon",
      regulatory_ref: "Reg 7",
    });
  } else if (childVoiceCaptureRate < 70 && totalSessions > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Improve child voice capture to at least 90% of sessions — children's wishes and feelings about family contact should be documented routinely.",
      urgency: "planned",
      regulatory_ref: "Reg 7",
    });
  }

  if (stalePlanCount > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Review ${stalePlanCount} stale contact plan${stalePlanCount > 1 ? "s" : ""} — plans not reviewed within 90 days may not reflect children's current needs or circumstances.`,
      urgency: "soon",
      regulatory_ref: "Reg 45",
    });
  }

  if (totalSessions === 0 && total_children > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Begin recording all family time sessions — there is currently no evidence of facilitated family contact for any child in the home.",
      urgency: "immediate",
      regulatory_ref: "Reg 45",
    });
  }

  if (sessionsPerChild < 2 && sessionsPerChild > 0 && total_children > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Increase family contact frequency — aim for at least 2 sessions per child to ensure regular, sustained family involvement.",
      urgency: "planned",
      regulatory_ref: "Reg 45",
    });
  }

  if (hostileChallenging > 0) {
    const hcRate = pct(hostileChallenging, totalPartnerships);
    if (hcRate >= 50) {
      recs.push({
        rank: rank++,
        recommendation: "Seek professional mediation or specialist support for challenging parent partnerships — over half are rated as hostile or challenging, which may impact children's wellbeing.",
        urgency: "soon",
        regulatory_ref: "Reg 45",
      });
    }
  }

  if (swChildNotSeenRate > 30 && totalSwContacts > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Raise concerns with placing authorities where social workers are not seeing children during visits — the child must be observed and spoken with during statutory visits.",
      urgency: "soon",
      regulatory_ref: "Reg 40",
    });
  }

  if (staleProtocols.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Follow up on ${staleProtocols.length} sibling contact protocol${staleProtocols.length > 1 ? "s" : ""} with no recorded contact in over 60 days — assess whether contact is happening but not being recorded, or whether arrangements have broken down.`,
      urgency: "soon",
      regulatory_ref: "Reg 45",
    });
  }

  if (diverseSessionTypes < 2 && totalSessions > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Diversify family contact formats — consider offering phone calls, video calls, letters, and unsupervised visits alongside face-to-face sessions to meet varied family needs.",
      urgency: "planned",
    });
  }

  if (suspendedProtocols.length > 0) {
    recs.push({
      rank: rank++,
      recommendation: `Review ${suspendedProtocols.length} suspended sibling contact protocol${suspendedProtocols.length > 1 ? "s" : ""} — assess whether conditions have changed and contact can be safely reinstated.`,
      urgency: "planned",
      regulatory_ref: "Reg 45",
    });
  }

  if (swOutcomeRate < 70 && totalSwContacts > 0) {
    recs.push({
      rank: rank++,
      recommendation: "Ensure outcomes are recorded for all social worker contacts — this evidences that visits are purposeful and that agreed actions are being tracked.",
      urgency: "planned",
      regulatory_ref: "Reg 40",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: FamilySocialConnectivityResult["insights"] = [];

  if (contactPlanCoverage < 50 && total_children > 0) {
    insights.push({
      text: `Only ${contactPlanCoverage}% of children have an active contact plan. Ofsted inspectors will expect every child to have a clear, documented plan for maintaining family relationships as part of their care planning.`,
      severity: "critical",
    });
  }

  if (postContactDistressRate > 50 && totalSessions > 0) {
    insights.push({
      text: `${postContactDistressRate}% of family time sessions result in post-contact distress. This pattern suggests contact arrangements may be causing harm and should be reviewed urgently with the child's social worker and any therapeutic professionals involved.`,
      severity: "critical",
    });
  }

  if (parentEngagementRate < 30 && totalPartnerships > 0) {
    insights.push({
      text: `Parent engagement is at ${parentEngagementRate}%. Low partnership working with birth families can undermine placement stability and children's sense of identity. Ofsted will assess whether the home actively promotes family relationships.`,
      severity: "critical",
    });
  }

  if (socialWorkerContactRate < 50 && total_children > 0) {
    insights.push({
      text: `Only ${socialWorkerContactRate}% of children have been seen by their social worker recently. This is a regulatory concern — the home should be escalating non-compliance with statutory visiting to the relevant placing authority.`,
      severity: "critical",
    });
  }

  if (siblingContactCompliance < 50 && activeProtocols.length > 0) {
    insights.push({
      text: `Sibling contact compliance is at ${siblingContactCompliance}%. Children's right to maintain sibling relationships is a key Ofsted consideration. Where protocols have broken down, the reasons must be documented and escalated.`,
      severity: "critical",
    });
  }

  if (totalSessions === 0 && total_children > 0) {
    insights.push({
      text: "No family time sessions are recorded. Without documented evidence of facilitated family contact, the home cannot demonstrate that it is meeting children's needs in this critical area.",
      severity: "critical",
    });
  }

  if (contactPlanCoverage >= 95 && total_children > 0) {
    insights.push({
      text: `${contactPlanCoverage}% contact plan coverage demonstrates that the home takes a proactive and structured approach to maintaining children's family relationships.`,
      severity: "positive",
    });
  }

  if (parentEngagementRate >= 80 && totalPartnerships > 0) {
    insights.push({
      text: `${parentEngagementRate}% parent engagement rate is evidence of strong collaborative working with birth families. This supports children's sense of identity, belonging, and placement stability.`,
      severity: "positive",
    });
  }

  if (socialWorkerContactRate >= 100 && total_children > 0) {
    insights.push({
      text: "All children have been seen by their social worker within the last 6 weeks. This demonstrates excellent multi-agency partnership and compliance with statutory visiting requirements.",
      severity: "positive",
    });
  } else if (socialWorkerContactRate >= 80 && total_children > 0) {
    insights.push({
      text: `${socialWorkerContactRate}% of children have been seen by their social worker recently. This indicates strong multi-agency engagement, though follow-up is needed for the remaining children.`,
      severity: "positive",
    });
  }

  if (siblingContactCompliance >= 90 && activeProtocols.length > 0) {
    insights.push({
      text: `${siblingContactCompliance}% sibling contact compliance demonstrates the home's commitment to maintaining sibling relationships — a key indicator of quality care.`,
      severity: "positive",
    });
  }

  if (childVoiceCaptureRate >= 90 && totalSessions > 0) {
    insights.push({
      text: `Child's voice is captured in ${childVoiceCaptureRate}% of family time sessions. This evidences that children's wishes and feelings about contact are being heard and recorded, supporting child-centred practice.`,
      severity: "positive",
    });
  }

  if (childVoiceCaptureRate < 50 && totalSessions > 0) {
    insights.push({
      text: `Child's voice is captured in only ${childVoiceCaptureRate}% of sessions. Ofsted will expect to see that children's views are routinely recorded as part of contact arrangements.`,
      severity: "warning",
    });
  }

  if (postContactDistressRate > 25 && postContactDistressRate <= 50 && totalSessions > 0) {
    insights.push({
      text: `${postContactDistressRate}% of sessions result in post-contact distress. While some distress is expected, this rate warrants monitoring and may indicate a need to review supervision levels or therapeutic support.`,
      severity: "warning",
    });
  }

  if (sessionsPerChild >= 4) {
    insights.push({
      text: `${sessionsPerChild} sessions per child indicates frequent, regular family contact — this supports relationship continuity and demonstrates the home actively facilitates contact.`,
      severity: "positive",
    });
  }

  if (sessionsPerChild < 1 && totalSessions > 0 && total_children > 0) {
    insights.push({
      text: `Family time sessions average less than 1 per child. This may indicate that contact is infrequent or not being recorded consistently. Contact frequency should be aligned with each child's care plan.`,
      severity: "warning",
    });
  }

  if (stalePlanCount > 0) {
    insights.push({
      text: `${stalePlanCount} contact plan${stalePlanCount > 1 ? "s have" : " has"} not been reviewed in over 90 days. Regular review ensures plans remain aligned with children's changing needs and court-directed arrangements.`,
      severity: "warning",
    });
  }

  if (noEngagement.length > 0 && totalPartnerships > 0) {
    insights.push({
      text: `${noEngagement.length} parent partnership record${noEngagement.length > 1 ? "s show" : " shows"} no engagement. Where parents are not engaging, the home should document all attempts and efforts to involve them.`,
      severity: "warning",
    });
  }

  if (swOutcomeRate >= 90 && totalSwContacts > 0) {
    insights.push({
      text: `${swOutcomeRate}% of social worker contacts have recorded outcomes — this demonstrates purposeful, well-documented multi-agency working.`,
      severity: "positive",
    });
  } else if (swOutcomeRate < 70 && totalSwContacts > 0) {
    insights.push({
      text: `Only ${swOutcomeRate}% of social worker contacts have recorded outcomes. Without documented outcomes, it is difficult to evidence that visits are purposeful and leading to agreed actions.`,
      severity: "warning",
    });
  }

  if (diverseSessionTypes >= 3 && totalSessions > 0) {
    insights.push({
      text: `Family time is delivered across ${diverseSessionTypes} different formats, including ${Array.from(distinctSessionTypes).join(", ")}. This variety allows contact to be tailored to individual family circumstances and children's preferences.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────
  let headline: string;
  if (rating === "outstanding") {
    headline = `Outstanding family and social connectivity — ${contactPlanCoverage}% contact plan coverage, ${parentEngagementRate}% parent engagement, ${sessionQualityAvg}/5 session quality.`;
  } else if (rating === "good") {
    headline = `Good family and social connectivity — ${totalSessions} sessions across ${total_children} child${total_children !== 1 ? "ren" : ""} with ${contactPlanCoverage}% contact plan coverage.`;
  } else if (rating === "adequate") {
    headline = `Adequate family and social connectivity — improvements needed in contact planning, parent engagement, or social worker involvement.`;
  } else {
    headline = `Inadequate family and social connectivity — significant gaps in family contact, partnership working, or multi-agency engagement.`;
  }

  return {
    connectivity_rating: rating,
    connectivity_score: score,
    headline,
    total_sessions: totalSessions,
    sessions_per_child: sessionsPerChild,
    session_quality_avg: sessionQualityAvg,
    contact_plan_coverage: contactPlanCoverage,
    parent_engagement_rate: parentEngagementRate,
    social_worker_contact_rate: socialWorkerContactRate,
    sibling_contact_compliance: siblingContactCompliance,
    child_voice_capture_rate: childVoiceCaptureRate,
    post_contact_distress_rate: postContactDistressRate,
    strengths,
    concerns,
    recommendations: recs,
    insights,
  };
}

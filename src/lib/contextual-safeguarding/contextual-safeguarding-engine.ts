// ══════════════════════════════════════════════════════════════════════════════
// CONTEXTUAL SAFEGUARDING INTELLIGENCE ENGINE
//
// Pure deterministic engine for analysing extra-familial harm risks,
// environmental threat mapping, peer network analysis, and location-based
// risk scoring.
//
// Contextual Safeguarding (Firmin, 2017) recognises that young people's
// experiences of harm extend beyond the family into peer groups, schools,
// neighbourhoods, and online spaces. Ofsted increasingly expects homes to
// demonstrate contextual awareness in their safeguarding practice.
//
// Regulatory basis:
//   - CHR 2015, Reg 12 — Protection of children
//   - CHR 2015, Reg 13 — Child's placement plan: risk assessment
//   - Working Together 2023 — Contextual safeguarding approach
//   - SCCIF — "How well children are helped and protected"
//   - Keeping Children Safe in Education 2024
//   - Tackling Child Exploitation: Resources Pack (2023)
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type HarmDomain =
  | "criminal_exploitation"
  | "sexual_exploitation"
  | "county_lines"
  | "gang_affiliation"
  | "peer_on_peer_abuse"
  | "online_exploitation"
  | "radicalisation"
  | "trafficking"
  | "modern_slavery"
  | "harmful_sexual_behaviour"
  | "substance_supply"
  | "financial_exploitation";

export type EnvironmentType =
  | "location"
  | "peer_group"
  | "online_space"
  | "school"
  | "community_setting"
  | "transport_route"
  | "accommodation";

export type RiskLevel = "low" | "moderate" | "significant" | "serious";

export type ProtectiveFactorType =
  | "trusted_adult"
  | "positive_peer"
  | "structured_activity"
  | "therapeutic_support"
  | "education_engagement"
  | "family_connection"
  | "professional_network"
  | "community_resource"
  | "placement_stability"
  | "safety_plan";

export type InterventionStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "effective"
  | "ineffective"
  | "withdrawn";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface EnvironmentalRisk {
  id: string;
  type: EnvironmentType;
  name: string;
  description: string;
  harmDomains: HarmDomain[];
  riskLevel: RiskLevel;
  lastAssessed: string; // ISO date
  associatedChildren: string[]; // child IDs
  knownPerpetrators?: string[];
  locationCoordinates?: { lat: number; lng: number };
  isActive: boolean;
  mitigationsInPlace: string[];
}

export interface PeerAssociation {
  id: string;
  childId: string;
  peerName: string;
  peerType: "positive" | "concerning" | "high_risk" | "unknown";
  harmDomains: HarmDomain[];
  context: string; // where they associate
  frequency: "daily" | "weekly" | "occasional" | "online_only";
  isMonitored: boolean;
  lastContact?: string; // ISO date
  notes?: string;
}

export interface OnlineRisk {
  id: string;
  childId: string;
  platform: string;
  riskType: HarmDomain;
  riskLevel: RiskLevel;
  description: string;
  identifiedDate: string;
  isActive: boolean;
  actionTaken?: string;
}

export interface ProtectiveFactor {
  id: string;
  childId: string;
  type: ProtectiveFactorType;
  description: string;
  strength: "strong" | "moderate" | "emerging" | "fragile";
  lastEvidenced: string; // ISO date
}

export interface Intervention {
  id: string;
  childId: string;
  harmDomain: HarmDomain;
  description: string;
  status: InterventionStatus;
  startDate: string;
  reviewDate?: string;
  assignedTo: string;
  multiAgencyInvolved: boolean;
  partners?: string[];
  impactEvidence?: string;
}

export interface MappingEvent {
  id: string;
  childId: string;
  date: string;
  harmDomain: HarmDomain;
  description: string;
  environmentId?: string;
  peerAssociationId?: string;
  severity: 1 | 2 | 3 | 4 | 5;
  wasEscalated: boolean;
  responseAdequate: boolean;
}

// ── Child Contextual Profile ───────────────────────────────────────────────

export interface ChildContextualProfile {
  childId: string;
  childName: string;
  overallRiskLevel: RiskLevel;
  riskScore: number; // 0-100
  activeHarmDomains: HarmDomain[];
  environmentalRisks: EnvironmentalRisk[];
  peerAssociations: PeerAssociation[];
  onlineRisks: OnlineRisk[];
  protectiveFactors: ProtectiveFactor[];
  interventions: Intervention[];
  events: MappingEvent[];
  protectiveScore: number; // 0-100
  vulnerabilityScore: number; // 0-100
  netRiskScore: number; // vulnerability minus protective (clamped 0-100)
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ContextualSafeguardingResult {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  // Overall
  overallScore: number; // 0-100 (higher = better safeguarding practice)
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";

  // Children at risk
  totalChildren: number;
  childrenAtSignificantRisk: number;
  childrenAtSeriousRisk: number;

  // Risk landscape
  totalEnvironmentalRisks: number;
  activeEnvironmentalRisks: number;
  harmDomainBreakdown: { domain: HarmDomain; count: number; riskLevel: RiskLevel }[];

  // Peer network analysis
  totalPeerAssociations: number;
  highRiskPeers: number;
  monitoredPeerRate: number;

  // Online safety
  totalOnlineRisks: number;
  activeOnlineRisks: number;

  // Protective factors
  averageProtectiveScore: number;
  protectiveFactorGaps: string[];

  // Intervention effectiveness
  totalInterventions: number;
  effectiveInterventions: number;
  interventionEffectivenessRate: number;
  multiAgencyRate: number;

  // Child profiles
  childProfiles: ChildContextualProfile[];

  // Insights
  strengths: string[];
  concerns: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Core: Calculate child risk score ───────────────────────────────────────

export function calculateChildRiskScore(
  environmentalRisks: EnvironmentalRisk[],
  peerAssociations: PeerAssociation[],
  onlineRisks: OnlineRisk[],
  events: MappingEvent[],
): number {
  let score = 0;

  // Environmental risk contribution
  for (const risk of environmentalRisks.filter((r) => r.isActive)) {
    switch (risk.riskLevel) {
      case "serious": score += 20; break;
      case "significant": score += 12; break;
      case "moderate": score += 6; break;
      case "low": score += 2; break;
    }
  }

  // Peer association contribution
  for (const peer of peerAssociations) {
    switch (peer.peerType) {
      case "high_risk": score += 15; break;
      case "concerning": score += 8; break;
      case "unknown": score += 3; break;
      case "positive": score -= 2; break; // protective
    }
  }

  // Online risk contribution
  for (const risk of onlineRisks.filter((r) => r.isActive)) {
    switch (risk.riskLevel) {
      case "serious": score += 18; break;
      case "significant": score += 10; break;
      case "moderate": score += 5; break;
      case "low": score += 2; break;
    }
  }

  // Recent events amplify risk
  const recentHighSeverity = events.filter((e) => e.severity >= 4);
  score += recentHighSeverity.length * 8;

  // Unescalated events indicate gap
  const unescalated = events.filter((e) => !e.wasEscalated && e.severity >= 3);
  score += unescalated.length * 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ── Core: Calculate protective score ───────────────────────────────────────

export function calculateProtectiveScore(
  protectiveFactors: ProtectiveFactor[],
): number {
  if (protectiveFactors.length === 0) return 0;

  let score = 0;
  const maxPerFactor = 12;

  for (const factor of protectiveFactors) {
    switch (factor.strength) {
      case "strong": score += maxPerFactor; break;
      case "moderate": score += maxPerFactor * 0.7; break;
      case "emerging": score += maxPerFactor * 0.4; break;
      case "fragile": score += maxPerFactor * 0.15; break;
    }
  }

  // Diversity bonus: more varied protective factors = more resilient
  const uniqueTypes = new Set(protectiveFactors.map((f) => f.type));
  if (uniqueTypes.size >= 5) score += 10;
  else if (uniqueTypes.size >= 3) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ── Core: Determine risk level ─────────────────────────────────────────────

export function determineRiskLevel(riskScore: number): RiskLevel {
  if (riskScore >= 70) return "serious";
  if (riskScore >= 45) return "significant";
  if (riskScore >= 20) return "moderate";
  return "low";
}

// ── Core: Build child contextual profile ───────────────────────────────────

export function buildChildProfile(
  childId: string,
  childName: string,
  environmentalRisks: EnvironmentalRisk[],
  peerAssociations: PeerAssociation[],
  onlineRisks: OnlineRisk[],
  protectiveFactors: ProtectiveFactor[],
  interventions: Intervention[],
  events: MappingEvent[],
): ChildContextualProfile {
  const childEnvRisks = environmentalRisks.filter((r) =>
    r.associatedChildren.includes(childId),
  );
  const childPeers = peerAssociations.filter((p) => p.childId === childId);
  const childOnline = onlineRisks.filter((r) => r.childId === childId);
  const childProtective = protectiveFactors.filter((f) => f.childId === childId);
  const childInterventions = interventions.filter((i) => i.childId === childId);
  const childEvents = events.filter((e) => e.childId === childId);

  const riskScore = calculateChildRiskScore(childEnvRisks, childPeers, childOnline, childEvents);
  const protectiveScore = calculateProtectiveScore(childProtective);
  const vulnerabilityScore = riskScore;
  const netRiskScore = Math.max(0, Math.min(100, Math.round(vulnerabilityScore - protectiveScore * 0.5)));
  const overallRiskLevel = determineRiskLevel(netRiskScore);

  // Active harm domains
  const activeHarmDomains = new Set<HarmDomain>();
  for (const risk of childEnvRisks.filter((r) => r.isActive)) {
    for (const domain of risk.harmDomains) activeHarmDomains.add(domain);
  }
  for (const peer of childPeers.filter((p) => p.peerType === "high_risk" || p.peerType === "concerning")) {
    for (const domain of peer.harmDomains) activeHarmDomains.add(domain);
  }
  for (const risk of childOnline.filter((r) => r.isActive)) {
    activeHarmDomains.add(risk.riskType);
  }

  return {
    childId,
    childName,
    overallRiskLevel,
    riskScore,
    activeHarmDomains: [...activeHarmDomains],
    environmentalRisks: childEnvRisks,
    peerAssociations: childPeers,
    onlineRisks: childOnline,
    protectiveFactors: childProtective,
    interventions: childInterventions,
    events: childEvents,
    protectiveScore,
    vulnerabilityScore,
    netRiskScore,
  };
}

// ── Core: Identify protective factor gaps ──────────────────────────────────

export function identifyProtectiveGaps(
  profiles: ChildContextualProfile[],
): string[] {
  const gaps: string[] = [];

  const criticalTypes: ProtectiveFactorType[] = [
    "trusted_adult",
    "safety_plan",
    "therapeutic_support",
    "education_engagement",
  ];

  for (const profile of profiles) {
    if (profile.overallRiskLevel === "serious" || profile.overallRiskLevel === "significant") {
      const existingTypes = new Set(profile.protectiveFactors.map((f) => f.type));

      for (const required of criticalTypes) {
        if (!existingTypes.has(required)) {
          gaps.push(
            `${profile.childName}: Missing "${getProtectiveFactorLabel(required)}" — critical for children at ${profile.overallRiskLevel} risk`,
          );
        }
      }

      if (profile.protectiveFactors.length < 3) {
        gaps.push(
          `${profile.childName}: Only ${profile.protectiveFactors.length} protective factor(s) identified — insufficient resilience for current risk level`,
        );
      }

      const fragile = profile.protectiveFactors.filter((f) => f.strength === "fragile");
      if (fragile.length > 0 && fragile.length === profile.protectiveFactors.length) {
        gaps.push(
          `${profile.childName}: All protective factors rated as "fragile" — urgent strengthening required`,
        );
      }
    }
  }

  return gaps;
}

// ── Main: Generate Contextual Safeguarding Assessment ──────────────────────

export function generateContextualAssessment(
  children: { id: string; name: string }[],
  environmentalRisks: EnvironmentalRisk[],
  peerAssociations: PeerAssociation[],
  onlineRisks: OnlineRisk[],
  protectiveFactors: ProtectiveFactor[],
  interventions: Intervention[],
  events: MappingEvent[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): ContextualSafeguardingResult {
  const assessedAt = new Date().toISOString();

  // Build per-child profiles
  const childProfiles = children.map((c) =>
    buildChildProfile(
      c.id, c.name,
      environmentalRisks, peerAssociations, onlineRisks,
      protectiveFactors, interventions, events,
    ),
  );

  // Risk landscape
  const activeEnvRisks = environmentalRisks.filter((r) => r.isActive);
  const harmDomainMap = new Map<HarmDomain, { count: number; maxLevel: RiskLevel }>();
  for (const risk of activeEnvRisks) {
    for (const domain of risk.harmDomains) {
      const existing = harmDomainMap.get(domain);
      if (!existing) {
        harmDomainMap.set(domain, { count: 1, maxLevel: risk.riskLevel });
      } else {
        existing.count++;
        if (riskLevelValue(risk.riskLevel) > riskLevelValue(existing.maxLevel)) {
          existing.maxLevel = risk.riskLevel;
        }
      }
    }
  }

  const harmDomainBreakdown = [...harmDomainMap.entries()].map(([domain, data]) => ({
    domain,
    count: data.count,
    riskLevel: data.maxLevel,
  }));

  // Peer analysis
  const highRiskPeers = peerAssociations.filter((p) => p.peerType === "high_risk").length;
  const monitoredPeers = peerAssociations.filter((p) => p.isMonitored).length;
  const concerningOrHighRiskPeers = peerAssociations.filter(
    (p) => p.peerType === "high_risk" || p.peerType === "concerning",
  );
  const monitoredPeerRate = concerningOrHighRiskPeers.length > 0
    ? Math.round((peerAssociations.filter((p) =>
        (p.peerType === "high_risk" || p.peerType === "concerning") && p.isMonitored,
      ).length / concerningOrHighRiskPeers.length) * 100)
    : 100;

  // Online safety
  const activeOnlineRisks = onlineRisks.filter((r) => r.isActive).length;

  // Protective factors
  const avgProtective = childProfiles.length > 0
    ? Math.round(childProfiles.reduce((s, p) => s + p.protectiveScore, 0) / childProfiles.length)
    : 0;
  const protectiveFactorGaps = identifyProtectiveGaps(childProfiles);

  // Intervention effectiveness
  const completedInterventions = interventions.filter(
    (i) => i.status === "completed" || i.status === "effective" || i.status === "ineffective",
  );
  const effectiveInterventions = interventions.filter((i) => i.status === "effective").length;
  const interventionEffectivenessRate = completedInterventions.length > 0
    ? Math.round((effectiveInterventions / completedInterventions.length) * 100)
    : 0;
  const multiAgencyInterventions = interventions.filter((i) => i.multiAgencyInvolved);
  const multiAgencyRate = interventions.length > 0
    ? Math.round((multiAgencyInterventions.length / interventions.length) * 100)
    : 0;

  // Children at risk counts
  const childrenAtSignificantRisk = childProfiles.filter(
    (p) => p.overallRiskLevel === "significant",
  ).length;
  const childrenAtSeriousRisk = childProfiles.filter(
    (p) => p.overallRiskLevel === "serious",
  ).length;

  // Calculate overall score
  const overallScore = calculateOverallScore(
    childProfiles, monitoredPeerRate, avgProtective,
    interventionEffectivenessRate, multiAgencyRate,
    activeOnlineRisks, protectiveFactorGaps,
  );
  const rating = getOverallRating(overallScore);

  // Insights
  const strengths = generateStrengths(
    monitoredPeerRate, avgProtective, interventionEffectivenessRate,
    multiAgencyRate, childProfiles, protectiveFactorGaps,
  );
  const concerns = generateConcerns(
    childProfiles, monitoredPeerRate, activeOnlineRisks,
    protectiveFactorGaps, interventionEffectivenessRate,
  );
  const immediateActions = generateActions(childProfiles, protectiveFactorGaps, peerAssociations, onlineRisks);
  const regulatoryLinks = generateRegulatoryLinks(childProfiles, harmDomainBreakdown);

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    totalChildren: children.length,
    childrenAtSignificantRisk,
    childrenAtSeriousRisk,
    totalEnvironmentalRisks: environmentalRisks.length,
    activeEnvironmentalRisks: activeEnvRisks.length,
    harmDomainBreakdown,
    totalPeerAssociations: peerAssociations.length,
    highRiskPeers,
    monitoredPeerRate,
    totalOnlineRisks: onlineRisks.length,
    activeOnlineRisks,
    averageProtectiveScore: avgProtective,
    protectiveFactorGaps,
    totalInterventions: interventions.length,
    effectiveInterventions,
    interventionEffectivenessRate,
    multiAgencyRate,
    childProfiles,
    strengths,
    concerns,
    immediateActions,
    regulatoryLinks,
  };
}

// ── Scoring ────────────────────────────────────────────────────────────────

function riskLevelValue(level: RiskLevel): number {
  switch (level) {
    case "low": return 1;
    case "moderate": return 2;
    case "significant": return 3;
    case "serious": return 4;
  }
}

function calculateOverallScore(
  profiles: ChildContextualProfile[],
  monitoredPeerRate: number,
  avgProtective: number,
  interventionEffectiveness: number,
  multiAgencyRate: number,
  activeOnlineRisks: number,
  protectiveGaps: string[],
): number {
  let score = 100;

  // Children at serious risk penalise heavily
  const serious = profiles.filter((p) => p.overallRiskLevel === "serious").length;
  score -= serious * 12;

  // Children at significant risk
  const significant = profiles.filter((p) => p.overallRiskLevel === "significant").length;
  score -= significant * 6;

  // Poor peer monitoring
  score -= Math.max(0, 100 - monitoredPeerRate) * 0.15;

  // Low protective factors
  score -= Math.max(0, 50 - avgProtective) * 0.3;

  // Intervention effectiveness bonus
  score += (interventionEffectiveness / 100) * 10;

  // Multi-agency engagement bonus
  score += (multiAgencyRate / 100) * 10;

  // Active online risks penalty
  score -= activeOnlineRisks * 3;

  // Protective gaps penalty
  score -= protectiveGaps.length * 2;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getOverallRating(score: number): "outstanding" | "good" | "requires_improvement" | "inadequate" {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Insight Generation ─────────────────────────────────────────────────────

function generateStrengths(
  monitoredPeerRate: number,
  avgProtective: number,
  interventionEffectiveness: number,
  multiAgencyRate: number,
  profiles: ChildContextualProfile[],
  gaps: string[],
): string[] {
  const strengths: string[] = [];

  if (monitoredPeerRate >= 90) {
    strengths.push("Excellent peer monitoring: concerning associations are actively tracked and reviewed");
  }
  if (avgProtective >= 50) {
    strengths.push("Strong protective factors across the cohort support resilience building");
  }
  if (interventionEffectiveness >= 70) {
    strengths.push("High intervention effectiveness rate demonstrates responsive safeguarding practice");
  }
  if (multiAgencyRate >= 80) {
    strengths.push("Strong multi-agency involvement in contextual safeguarding interventions");
  }
  if (gaps.length === 0) {
    strengths.push("No critical protective factor gaps identified — all children have baseline resilience");
  }
  if (profiles.every((p) => p.overallRiskLevel === "low" || p.overallRiskLevel === "moderate")) {
    strengths.push("No children at serious or significant contextual risk — effective prevention and early intervention");
  }

  return strengths;
}

function generateConcerns(
  profiles: ChildContextualProfile[],
  monitoredPeerRate: number,
  activeOnlineRisks: number,
  gaps: string[],
  interventionEffectiveness: number,
): string[] {
  const concerns: string[] = [];

  const serious = profiles.filter((p) => p.overallRiskLevel === "serious");
  if (serious.length > 0) {
    concerns.push(
      `${serious.length} child(ren) at serious contextual risk: ${serious.map((p) => p.childName).join(", ")}`,
    );
  }

  if (monitoredPeerRate < 70) {
    concerns.push(`Peer monitoring rate at ${monitoredPeerRate}%: concerning associations may go untracked`);
  }

  if (activeOnlineRisks > 0) {
    concerns.push(`${activeOnlineRisks} active online risk(s) require ongoing monitoring and intervention`);
  }

  if (gaps.length > 3) {
    concerns.push(`${gaps.length} protective factor gaps identified — resilience building capacity insufficient`);
  }

  if (interventionEffectiveness < 50 && interventionEffectiveness > 0) {
    concerns.push(`Intervention effectiveness at ${interventionEffectiveness}%: review intervention approaches`);
  }

  const multiDomain = profiles.filter((p) => p.activeHarmDomains.length >= 3);
  if (multiDomain.length > 0) {
    concerns.push(
      `${multiDomain.length} child(ren) exposed to 3+ harm domains: ${multiDomain.map((p) => p.childName).join(", ")}`,
    );
  }

  return concerns;
}

function generateActions(
  profiles: ChildContextualProfile[],
  gaps: string[],
  peers: PeerAssociation[],
  onlineRisks: OnlineRisk[],
): string[] {
  const actions: string[] = [];

  const seriousChildren = profiles.filter((p) => p.overallRiskLevel === "serious");
  for (const child of seriousChildren) {
    actions.push(
      `URGENT: ${child.childName} at serious contextual risk (score ${child.riskScore}). Convene multi-agency strategy meeting and review safety plan.`,
    );
  }

  const unmonitoredHighRisk = peers.filter((p) => p.peerType === "high_risk" && !p.isMonitored);
  if (unmonitoredHighRisk.length > 0) {
    actions.push(
      `HIGH: ${unmonitoredHighRisk.length} high-risk peer association(s) not being monitored. Add to monitoring log and share with placing authority.`,
    );
  }

  const activeOnline = onlineRisks.filter((r) => r.isActive && (r.riskLevel === "serious" || r.riskLevel === "significant"));
  if (activeOnline.length > 0) {
    actions.push(
      `HIGH: ${activeOnline.length} significant/serious online risk(s) active. Review device monitoring, update e-safety plan, consider multi-agency referral.`,
    );
  }

  const noSafetyPlan = profiles.filter(
    (p) =>
      (p.overallRiskLevel === "serious" || p.overallRiskLevel === "significant") &&
      !p.protectiveFactors.some((f) => f.type === "safety_plan"),
  );
  if (noSafetyPlan.length > 0) {
    actions.push(
      `MEDIUM: ${noSafetyPlan.length} at-risk child(ren) without a safety plan: ${noSafetyPlan.map((p) => p.childName).join(", ")}. Develop contextual safety plan with child.`,
    );
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Contextual safeguarding practice is effective. Continue monitoring and reviewing environmental risks.");
  }

  return actions;
}

function generateRegulatoryLinks(
  profiles: ChildContextualProfile[],
  harmBreakdown: { domain: HarmDomain; count: number; riskLevel: RiskLevel }[],
): string[] {
  const links = new Set<string>();

  links.add("CHR 2015, Reg 12 — Protection of children: contextual safeguarding");
  links.add("SCCIF: How well children are helped and protected — awareness of extra-familial harm");
  links.add("Working Together 2023 — Contextual safeguarding approach");

  const exploitationDomains: HarmDomain[] = [
    "criminal_exploitation", "sexual_exploitation", "county_lines", "trafficking", "modern_slavery",
  ];
  const hasExploitation = harmBreakdown.some((h) => exploitationDomains.includes(h.domain));
  if (hasExploitation) {
    links.add("Tackling Child Exploitation: Resources Pack (HM Government, 2023)");
    links.add("CHR 2015, Reg 12(2)(a) — Protection from exploitation and trafficking");
  }

  const hasOnline = harmBreakdown.some((h) => h.domain === "online_exploitation");
  if (hasOnline) {
    links.add("Keeping Children Safe in Education 2024 — Online safety");
    links.add("Online Safety Act 2023 — Duty of care for child protection online");
  }

  const hasRadicalisation = harmBreakdown.some((h) => h.domain === "radicalisation");
  if (hasRadicalisation) {
    links.add("Counter-Terrorism and Security Act 2015 — Prevent Duty");
  }

  const hasHSB = harmBreakdown.some((h) => h.domain === "harmful_sexual_behaviour");
  if (hasHSB) {
    links.add("Hackett continuum — Harmful Sexual Behaviour assessment framework");
  }

  if (profiles.some((p) => p.overallRiskLevel === "serious")) {
    links.add("CHR 2015, Reg 34(1) — Review quality of care when serious risks identified");
    links.add("CHR 2015, Reg 40 — Notification obligations for serious safeguarding concerns");
  }

  return [...links];
}

// ── Utility: Labels ────────────────────────────────────────────────────────

export function getHarmDomainLabel(domain: HarmDomain): string {
  const labels: Record<HarmDomain, string> = {
    criminal_exploitation: "Criminal Exploitation",
    sexual_exploitation: "Sexual Exploitation (CSE)",
    county_lines: "County Lines",
    gang_affiliation: "Gang Affiliation",
    peer_on_peer_abuse: "Peer-on-Peer Abuse",
    online_exploitation: "Online Exploitation",
    radicalisation: "Radicalisation",
    trafficking: "Trafficking",
    modern_slavery: "Modern Slavery",
    harmful_sexual_behaviour: "Harmful Sexual Behaviour",
    substance_supply: "Substance Supply",
    financial_exploitation: "Financial Exploitation",
  };
  return labels[domain];
}

export function getEnvironmentTypeLabel(type: EnvironmentType): string {
  const labels: Record<EnvironmentType, string> = {
    location: "Location",
    peer_group: "Peer Group",
    online_space: "Online Space",
    school: "School",
    community_setting: "Community Setting",
    transport_route: "Transport Route",
    accommodation: "Accommodation",
  };
  return labels[type];
}

export function getRiskLevelLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    low: "Low",
    moderate: "Moderate",
    significant: "Significant",
    serious: "Serious",
  };
  return labels[level];
}

export function getProtectiveFactorLabel(type: ProtectiveFactorType): string {
  const labels: Record<ProtectiveFactorType, string> = {
    trusted_adult: "Trusted Adult Relationship",
    positive_peer: "Positive Peer Network",
    structured_activity: "Structured Activity",
    therapeutic_support: "Therapeutic Support",
    education_engagement: "Education Engagement",
    family_connection: "Family Connection",
    professional_network: "Professional Network",
    community_resource: "Community Resource",
    placement_stability: "Placement Stability",
    safety_plan: "Safety Plan",
  };
  return labels[type];
}

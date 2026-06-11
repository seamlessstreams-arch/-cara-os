// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO — CHILD CONTEXT BUILDER
//
// Capture once, surface everywhere: assembles the child's learning context
// from records the home already keeps (profile, learning profile, recent
// incidents, key-work themes) plus any APPROVED library resources matching
// the theme — Cara prefers approved internal resources; anything generated
// without one is marked as an AI/deterministic draft for professional review.
//
// Pure assembly from injected collections — the route layer does the store IO.
// ══════════════════════════════════════════════════════════════════════════════

import type { CaraChildLearningProfile, CaraLibraryResource } from "./cara-types";

export interface ChildContextInput {
  child: { id: string; first_name: string; preferred_name: string | null; date_of_birth: string } | null;
  profile: CaraChildLearningProfile | null;
  recentIncidents: { date: string; type: string; severity: string; description: string }[];
  keyworkThemes: string[];
  approvedResources: CaraLibraryResource[];
  theme: string;
  today: string;
}

export interface CaraChildContext {
  childId: string | null;
  name: string;
  age: number | null;
  profile: CaraChildLearningProfile | null;
  riskThemes: string[];
  triggerMatch: boolean;
  avoidedTopicMatch: boolean;
  recentIncidentSummaries: string[];
  keyworkThemes: string[];
  matchedResources: { id: string; title: string; domain: string }[];
  usedApprovedResource: boolean;
  contextText: string;
}

function ageFromDob(dob: string, today: string): number | null {
  const b = new Date(dob).getTime();
  if (Number.isNaN(b)) return null;
  return Math.floor((new Date(today).getTime() - b) / (365.25 * 86_400_000));
}

function overlaps(theme: string, listText: string | null | undefined): boolean {
  if (!listText) return false;
  const themeWords = theme.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3);
  const hay = listText.toLowerCase();
  return themeWords.some((w) => hay.includes(w));
}

export function buildChildContext(input: ChildContextInput): CaraChildContext {
  const name = input.child ? (input.child.preferred_name || input.child.first_name) : "the child";
  const age = input.child ? (input.profile?.age ?? ageFromDob(input.child.date_of_birth, input.today)) : null;
  const riskThemes = input.profile?.risk_themes ?? [];

  const matched = input.approvedResources
    .filter((r) => r.approved && (overlaps(input.theme, r.domain) || overlaps(input.theme, r.title)))
    .slice(0, 3)
    .map((r) => ({ id: r.id, title: r.title, domain: r.domain }));

  const lines: string[] = [];
  lines.push(`Child: ${name}${age != null ? `, age ${age}` : ""}.`);
  if (input.profile) {
    const p = input.profile;
    if (p.communication_needs) lines.push(`Communication: ${p.communication_needs}`);
    if (p.send_needs) lines.push(`SEND: ${p.send_needs}`);
    if (p.literacy_level) lines.push(`Literacy: ${p.literacy_level}`);
    if (p.attention_profile) lines.push(`Attention: ${p.attention_profile}`);
    if (p.sensory_profile) lines.push(`Sensory: ${p.sensory_profile}`);
    if (p.emotional_triggers) lines.push(`Known triggers: ${p.emotional_triggers}`);
    if (p.calming_strategies) lines.push(`What calms: ${p.calming_strategies}`);
    if (p.known_strengths) lines.push(`Strengths: ${p.known_strengths}`);
    if (p.preferred_activities) lines.push(`Enjoys: ${p.preferred_activities}`);
    if (p.trusted_adults) lines.push(`Trusted adults: ${p.trusted_adults}`);
    if (riskThemes.length) lines.push(`Risk themes: ${riskThemes.join(", ")}`);
    const styles = Object.entries(p.learning_style).filter(([, v]) => v).map(([k]) => k.replace(/_/g, " "));
    if (styles.length) lines.push(`Learning style: ${styles.join(", ")}`);
  }
  const incidentSummaries = input.recentIncidents.slice(0, 3).map((i) => `${i.date} ${i.type} (${i.severity}): ${i.description.slice(0, 100)}`);
  if (incidentSummaries.length) lines.push(`Recent incidents: ${incidentSummaries.join(" | ")}`);
  if (input.keyworkThemes.length) lines.push(`Key-work themes: ${input.keyworkThemes.join(", ")}`);
  if (matched.length) lines.push(`Approved library resources to prefer: ${matched.map((m) => m.title).join("; ")}`);

  return {
    childId: input.child?.id ?? null,
    name,
    age,
    profile: input.profile,
    riskThemes,
    triggerMatch: overlaps(input.theme, input.profile?.emotional_triggers),
    avoidedTopicMatch: overlaps(input.theme, input.profile?.avoided_topics),
    recentIncidentSummaries: incidentSummaries,
    keyworkThemes: input.keyworkThemes,
    matchedResources: matched,
    usedApprovedResource: matched.length > 0,
    contextText: lines.join("\n"),
  };
}

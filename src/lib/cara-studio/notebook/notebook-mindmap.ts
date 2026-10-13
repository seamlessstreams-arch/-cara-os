// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO NOTEBOOK — mind map of the child's world (pure)
//
// A deterministic map of the people, risks, strengths and services around a
// child — composed from records the child already has (gather.ts reads them
// LIVE-SAFELY). getChildKnowledgeGraph reads a separate stored graph table that
// is unpopulated on a live tenant, so the notebook composes its own map from
// the live-safe spine instead. Nothing invented — an empty group means no such
// record is on file.
// ══════════════════════════════════════════════════════════════════════════════

export interface MindMapNode { label: string; sub?: string }
export type MindMapGroupKey = "people" | "risks" | "strengths" | "services";
export interface MindMapGroup { key: MindMapGroupKey; label: string; nodes: MindMapNode[] }
export interface NotebookMindMap { childName: string; groups: MindMapGroup[]; note: string }

export interface MindMapInput {
  childName: string;
  services: { school?: string; gp?: string; socialWorker?: string; iro?: string; legalStatus?: string };
  keyConnectors: { name: string; connections: number }[];
  trustedAdults: string[];
  riskThemes: string[];
  strengths: string[];
}

function dedupe(xs: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs) {
    const k = x.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(x.trim());
  }
  return out;
}

export function buildNotebookMindMap(input: MindMapInput): NotebookMindMap {
  // People — key connectors (with a connection count) then trusted adults,
  // de-duplicated by name so a trusted adult who is also a key connector shows once.
  const people: MindMapNode[] = [];
  const seen = new Set<string>();
  for (const kc of input.keyConnectors.slice(0, 5)) {
    const k = kc.name.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    people.push({ label: kc.name.trim(), sub: `${kc.connections} connection${kc.connections === 1 ? "" : "s"}` });
  }
  for (const ta of input.trustedAdults) {
    const k = ta.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    people.push({ label: ta.trim(), sub: "trusted adult" });
  }

  const services: MindMapNode[] = [];
  if (input.services.school) services.push({ label: input.services.school, sub: "school" });
  if (input.services.gp) services.push({ label: input.services.gp, sub: "GP" });
  if (input.services.socialWorker) services.push({ label: input.services.socialWorker, sub: "social worker" });
  if (input.services.iro) services.push({ label: input.services.iro, sub: "IRO" });
  if (input.services.legalStatus) services.push({ label: input.services.legalStatus, sub: "legal status" });

  const groups: MindMapGroup[] = [
    { key: "people", label: "People", nodes: people },
    { key: "risks", label: "Risks", nodes: dedupe(input.riskThemes).slice(0, 6).map((r) => ({ label: r })) },
    { key: "strengths", label: "Strengths", nodes: dedupe(input.strengths).slice(0, 6).map((s) => ({ label: s })) },
    { key: "services", label: "Services", nodes: services },
  ];

  const total = groups.reduce((n, g) => n + g.nodes.length, 0);
  const note = total === 0
    ? "Nothing to map yet — as people, risks, strengths and services are recorded, they appear here."
    : "Every node is drawn from a record already on file — the child's world, not a guess.";

  return { childName: input.childName, groups, note };
}

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CARE LANGUAGE AUDIT — pure engine
//
// Batch-scans historical incident records, behaviour logs, and daily logs for
// language patterns that can pathologise, criminalise, or moralise — language
// that frames children as problems rather than communicating unmet needs.
//
// Distinct from the Writing Assistant (real-time, per-record) — this audits
// the entire archive, shows trends, and identifies development priorities.
//
// Grounded in the PACE Model and 21 Skills KB frameworks.
// All deterministic. No LLM calls. Pure — the store is passed IN, so this is
// fully unit-testable and never touches NextResponse or getStore() itself.
// ══════════════════════════════════════════════════════════════════════════════

import type { getStore } from "@/lib/db/store";

// ── Language pattern library ──────────────────────────────────────────────────

export type PatternCategory =
  | "criminalising"
  | "moralising"
  | "power_control"
  | "minimising_trauma"
  | "character_labelling";

export interface LanguagePattern {
  phrase: string;
  category: PatternCategory;
  therapeuticAlternative: string;
  kbFramework: "model_pace" | "skills_21_residential";
}

const PATTERNS: LanguagePattern[] = [
  // Criminalising
  { phrase: "assaulted staff",        category: "criminalising",      therapeuticAlternative: "hurt a member of staff",                kbFramework: "model_pace" },
  { phrase: "assaulted",              category: "criminalising",      therapeuticAlternative: "hurt / struck",                          kbFramework: "model_pace" },
  { phrase: "criminal damage",        category: "criminalising",      therapeuticAlternative: "damaged property",                       kbFramework: "model_pace" },
  { phrase: "theft",                  category: "criminalising",      therapeuticAlternative: "took without permission",                kbFramework: "model_pace" },
  { phrase: "perpetrator",            category: "criminalising",      therapeuticAlternative: "the young person who caused harm",       kbFramework: "model_pace" },
  { phrase: "threatened staff",       category: "criminalising",      therapeuticAlternative: "communicated distress toward staff",     kbFramework: "model_pace" },
  { phrase: "threatened to",          category: "criminalising",      therapeuticAlternative: "communicated that they wanted to",       kbFramework: "model_pace" },
  // Moralising / character-labelling
  { phrase: "manipulative",           category: "moralising",         therapeuticAlternative: "communicating an unmet need",            kbFramework: "model_pace" },
  { phrase: "attention seeking",      category: "character_labelling", therapeuticAlternative: "seeking connection or reassurance",     kbFramework: "model_pace" },
  { phrase: "attention-seeking",      category: "character_labelling", therapeuticAlternative: "seeking connection or reassurance",     kbFramework: "model_pace" },
  { phrase: "defiant",                category: "character_labelling", therapeuticAlternative: "expressing distress or need for control", kbFramework: "model_pace" },
  { phrase: "naughty",                category: "moralising",         therapeuticAlternative: "struggling / communicating distress",    kbFramework: "model_pace" },
  { phrase: "bad behaviour",          category: "moralising",         therapeuticAlternative: "distressed behaviour",                   kbFramework: "model_pace" },
  { phrase: "challenging behaviour",  category: "moralising",         therapeuticAlternative: "distressed or communicative behaviour",  kbFramework: "model_pace" },
  { phrase: "being difficult",        category: "character_labelling", therapeuticAlternative: "communicating unmet need",              kbFramework: "model_pace" },
  { phrase: "tantrum",                category: "moralising",         therapeuticAlternative: "became very distressed",                 kbFramework: "model_pace" },
  { phrase: "meltdown",               category: "moralising",         therapeuticAlternative: "became very distressed",                 kbFramework: "model_pace" },
  // Power / control framing
  { phrase: "refused to comply",      category: "power_control",      therapeuticAlternative: "was not able to follow this at this time", kbFramework: "skills_21_residential" },
  { phrase: "non-compliant",          category: "power_control",      therapeuticAlternative: "has not been able to follow this expectation", kbFramework: "skills_21_residential" },
  { phrase: "non compliant",          category: "power_control",      therapeuticAlternative: "has not been able to follow this expectation", kbFramework: "skills_21_residential" },
  { phrase: "refused to engage",      category: "power_control",      therapeuticAlternative: "was not able to engage at this time",    kbFramework: "skills_21_residential" },
  { phrase: "failed to follow",       category: "power_control",      therapeuticAlternative: "was not able to follow",                 kbFramework: "skills_21_residential" },
  { phrase: "failed to comply",       category: "power_control",      therapeuticAlternative: "was not able to comply",                 kbFramework: "skills_21_residential" },
  { phrase: "won't do",               category: "power_control",      therapeuticAlternative: "was not willing to / wasn't able to",   kbFramework: "skills_21_residential" },
  { phrase: "wouldn't listen",        category: "power_control",      therapeuticAlternative: "was not able to engage with guidance",  kbFramework: "skills_21_residential" },
  // Minimising trauma
  { phrase: "being silly",            category: "minimising_trauma",  therapeuticAlternative: "became distressed / was struggling",    kbFramework: "model_pace" },
  { phrase: "crocodile tears",        category: "minimising_trauma",  therapeuticAlternative: "was expressing distress",               kbFramework: "model_pace" },
  { phrase: "overreacting",           category: "minimising_trauma",  therapeuticAlternative: "responding to a perceived threat",      kbFramework: "model_pace" },
  { phrase: "making a fuss",          category: "minimising_trauma",  therapeuticAlternative: "was struggling to manage their feelings", kbFramework: "model_pace" },
  { phrase: "drama",                  category: "minimising_trauma",  therapeuticAlternative: "distress / strong emotional response",  kbFramework: "model_pace" },
  { phrase: "winding up",             category: "minimising_trauma",  therapeuticAlternative: "expressing distress through behaviour", kbFramework: "model_pace" },
];

const CATEGORY_LABELS: Record<PatternCategory, string> = {
  criminalising:      "Criminalising",
  moralising:         "Moralising",
  power_control:      "Power / Control",
  minimising_trauma:  "Minimising Trauma",
  character_labelling:"Character Labelling",
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PatternHit {
  phrase: string;
  category: PatternCategory;
  therapeuticAlternative: string;
  kbFramework: "model_pace" | "skills_21_residential";
  count: number;
  recordType: "incident" | "behaviourLog" | "dailyLog";
  childId: string;
  staffId: string;
  recordDate: string;
}

export interface StaffLanguageProfile {
  staffId: string;
  name: string;
  totalHits: number;
  hitsByCategory: Partial<Record<PatternCategory, number>>;
  mostCommonPhrase: string | null;
  supervisionNote: string;
}

export interface ChildLanguageProfile {
  childId: string;
  name: string;
  totalHits: number;
  hitsByCategory: Partial<Record<PatternCategory, number>>;
  mostAffectedCategory: PatternCategory | null;
}

export interface CategorySummary {
  category: PatternCategory;
  label: string;
  totalHits: number;
  topPhrase: string | null;
  topStaffId: string | null;
}

export interface CareLanguageAuditSummary {
  totalHits: number;
  totalRecordsScanned: number;
  hitRate: number;
  categoryCounts: Record<string, number>;
  staffWithHits: number;
  childrenAffected: number;
  mostFlaggedPhrase: string | null;
}

export interface CareLanguageAuditData {
  staffProfiles: StaffLanguageProfile[];
  childProfiles: ChildLanguageProfile[];
  categorySummary: CategorySummary[];
  summary: CareLanguageAuditSummary;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Negation cues — a phrase preceded by one of these in the SAME clause is being
// negated or denied, not used to describe the child, so it must not flag. Covers
// "no challenging behaviour", "not a meltdown", "denied being manipulative", and
// any "…n't" contraction (wasn't/isn't/didn't…) with a straight or smart apostrophe.
const NEGATION_RE = /\b(no|not|never|without|denies|denied|cannot)\b|n['’]t\b/;

function isNegated(lower: string, matchIndex: number): boolean {
  // Only the current clause, up to ~25 chars before the phrase — so a negation in
  // an earlier clause ("not calm; he was aggressive and manipulative") can't
  // wrongly suppress a real hit in the next.
  let preceding = lower.slice(Math.max(0, matchIndex - 25), matchIndex);
  const stop = Math.max(
    preceding.lastIndexOf("."), preceding.lastIndexOf("!"), preceding.lastIndexOf("?"),
    preceding.lastIndexOf(";"), preceding.lastIndexOf(","),
  );
  if (stop >= 0) preceding = preceding.slice(stop + 1);
  return NEGATION_RE.test(preceding);
}

function scanText(text: string): Array<Pick<LanguagePattern, "phrase" | "category" | "therapeuticAlternative" | "kbFramework">> {
  if (!text) return [];
  const lower = text.toLowerCase();
  // Whole-word match (not substring) so "drama" doesn't fire inside "dramatic"
  // and "manipulative" not inside "manipulatives"; and skip negated occurrences
  // so we never flag a staff member for recording the absence of a behaviour.
  return PATTERNS.filter((p) => {
    const escaped = p.phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(lower)) !== null) {
      if (!isNegated(lower, m.index)) return true; // a real, non-negated occurrence
    }
    return false;
  });
}

// ── Public entry point — pure ────────────────────────────────────────────────

export function buildCareLanguageAudit(store: ReturnType<typeof getStore>): CareLanguageAuditData {
  const hits: PatternHit[] = [];

  // Helper to push a hit
  function hit(
    match: Pick<LanguagePattern, "phrase" | "category" | "therapeuticAlternative" | "kbFramework">,
    recordType: PatternHit["recordType"],
    childId: string,
    staffId: string,
    date: string,
  ) {
    hits.push({ ...match, count: 1, recordType, childId, staffId, recordDate: date });
  }

  // ── 1. Incidents ────────────────────────────────────────────────────────────
  const incidents = (store.incidents ?? []) as Array<{
    id: string; child_id: string; date: string; reported_by: string;
    description: string; immediate_action: string | null; lessons_learned: string | null;
  }>;
  for (const inc of incidents) {
    const fields = [inc.description, inc.immediate_action, inc.lessons_learned].join(" ");
    for (const match of scanText(fields)) {
      hit(match, "incident", inc.child_id, inc.reported_by, inc.date);
    }
  }

  // ── 2. Behaviour Log ────────────────────────────────────────────────────────
  const behaviourLog = (store.behaviourLog ?? []) as Array<{
    id: string; child_id: string; date: string; recorded_by: string;
    behaviour: string; antecedent: string; consequence: string; strategy_used: string;
  }>;
  for (const entry of behaviourLog) {
    const fields = [entry.behaviour, entry.antecedent, entry.consequence, entry.strategy_used].join(" ");
    for (const match of scanText(fields)) {
      hit(match, "behaviourLog", entry.child_id, entry.recorded_by, entry.date);
    }
  }

  // ── 3. Daily Log ────────────────────────────────────────────────────────────
  const dailyLog = (store.dailyLog ?? []) as Array<{
    id: string; child_id: string; date: string; staff_id: string; content: string;
  }>;
  for (const entry of dailyLog) {
    for (const match of scanText(entry.content)) {
      hit(match, "dailyLog", entry.child_id, entry.staff_id, entry.date);
    }
  }

  // ── Build profiles ──────────────────────────────────────────────────────────

  const staffArr = (store.staff ?? []) as Array<{
    id: string; full_name?: string; first_name?: string; last_name?: string;
  }>;
  const ypArr = (store.youngPeople ?? []) as Array<{
    id: string; full_name?: string; first_name?: string; last_name?: string;
  }>;

  function personName(arr: typeof staffArr, id: string): string {
    const p = arr.find((x) => x.id === id);
    if (!p) return id;
    if (p.full_name) return p.full_name;
    return `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || id;
  }

  // Per-staff
  const staffMap = new Map<string, { total: number; byCategory: Map<PatternCategory, number>; phrases: Map<string, number> }>();
  for (const h of hits) {
    let s = staffMap.get(h.staffId);
    if (!s) { s = { total: 0, byCategory: new Map(), phrases: new Map() }; staffMap.set(h.staffId, s); }
    s.total += 1;
    s.byCategory.set(h.category, (s.byCategory.get(h.category) ?? 0) + 1);
    s.phrases.set(h.phrase, (s.phrases.get(h.phrase) ?? 0) + 1);
  }
  const staffProfiles: StaffLanguageProfile[] = [...staffMap.entries()].map(([staffId, s]) => {
    const mostCommonPhrase = [...s.phrases.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const hitsByCategory: Partial<Record<PatternCategory, number>> = {};
    for (const [cat, n] of s.byCategory.entries()) hitsByCategory[cat] = n;
    const topCat = [...s.byCategory.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const supervisionNote = topCat === "criminalising"
      ? `Most flags relate to criminalising language. Explore: how can we describe behaviour in a way that doesn't suggest criminal intent?`
      : topCat === "moralising" || topCat === "character_labelling"
      ? `Most flags relate to character-labelling. Explore: what does PACE tell us about why behaviour communicates need, not character?`
      : topCat === "power_control"
      ? `Most flags relate to compliance framing. Explore: what would it mean to describe this child as 'not yet able to' rather than 'refusing to'?`
      : topCat === "minimising_trauma"
      ? `Some flags minimise distress. Explore: how does this child's history help us understand why small things can feel very big?`
      : `Review recording language in supervision and discuss which phrases feel most natural to change.`;
    return { staffId, name: personName(staffArr, staffId), totalHits: s.total, hitsByCategory, mostCommonPhrase, supervisionNote };
  }).sort((a, b) => b.totalHits - a.totalHits);

  // Per-child
  const childMap = new Map<string, { total: number; byCategory: Map<PatternCategory, number> }>();
  for (const h of hits) {
    let c = childMap.get(h.childId);
    if (!c) { c = { total: 0, byCategory: new Map() }; childMap.set(h.childId, c); }
    c.total += 1;
    c.byCategory.set(h.category, (c.byCategory.get(h.category) ?? 0) + 1);
  }
  const childProfiles: ChildLanguageProfile[] = [...childMap.entries()].map(([childId, c]) => {
    const hitsByCategory: Partial<Record<PatternCategory, number>> = {};
    for (const [cat, n] of c.byCategory.entries()) hitsByCategory[cat] = n;
    const mostAffectedCategory = ([...c.byCategory.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null) as PatternCategory | null;
    return { childId, name: personName(ypArr, childId), totalHits: c.total, hitsByCategory, mostAffectedCategory };
  }).sort((a, b) => b.totalHits - a.totalHits);

  // Category summary
  const catMap = new Map<PatternCategory, { total: number; phrases: Map<string, number>; staffCounts: Map<string, number> }>();
  for (const h of hits) {
    let c = catMap.get(h.category);
    if (!c) { c = { total: 0, phrases: new Map(), staffCounts: new Map() }; catMap.set(h.category, c); }
    c.total += 1;
    c.phrases.set(h.phrase, (c.phrases.get(h.phrase) ?? 0) + 1);
    c.staffCounts.set(h.staffId, (c.staffCounts.get(h.staffId) ?? 0) + 1);
  }
  const categorySummary: CategorySummary[] = (Object.keys(CATEGORY_LABELS) as PatternCategory[]).map((category) => {
    const c = catMap.get(category);
    return {
      category,
      label: CATEGORY_LABELS[category],
      totalHits: c?.total ?? 0,
      topPhrase: c ? ([...c.phrases.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null) : null,
      topStaffId: c ? ([...c.staffCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null) : null,
    };
  }).sort((a, b) => b.totalHits - a.totalHits);

  const totalHits = hits.length;
  const totalRecordsScanned = incidents.length + behaviourLog.length + dailyLog.length;
  const hitRate = totalRecordsScanned > 0 ? Math.round((totalHits / totalRecordsScanned) * 100) : 0;

  return {
    staffProfiles,
    childProfiles,
    categorySummary,
    summary: {
      totalHits,
      totalRecordsScanned,
      hitRate,
      categoryCounts: Object.fromEntries([...catMap.entries()].map(([k, v]) => [k, v.total])),
      staffWithHits: staffProfiles.length,
      childrenAffected: childProfiles.length,
      mostFlaggedPhrase: hits.length > 0
        ? [...hits.reduce((m, h) => { m.set(h.phrase, (m.get(h.phrase) ?? 0) + 1); return m; }, new Map<string, number>()).entries()]
            .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
        : null,
    },
  };
}

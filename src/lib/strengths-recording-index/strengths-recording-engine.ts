// ══════════════════════════════════════════════════════════════════════════════
// CARA — STRENGTHS-BASED RECORDING INDEX — pure engine
//
// Positive complement to the Care Language Audit: measures how often records
// celebrate what children CAN do, ARE achieving, and HOW they connect —
// rather than only documenting problems and deficits.
//
// Strengths-based recording is a practice skill as much as a language choice.
// Grounded in the 21 Skills for Residential Childcare framework and the
// PACE Model (celebrating small victories builds connection).
//
// All deterministic. No LLM calls. Pure — the store is passed IN, so this is
// fully unit-testable and never touches NextResponse or getStore() itself.
// ══════════════════════════════════════════════════════════════════════════════

import type { getStore } from "@/lib/db/store";

// ── Strengths pattern library ──────────────────────────────────────────────────

export type StrengthCategory =
  | "achievement"
  | "positive_connection"
  | "resilience_coping"
  | "voice_agency"
  | "positive_mood";

const STRENGTH_PATTERNS: Array<{ phrase: string; category: StrengthCategory }> = [
  // Achievement
  { phrase: "managed to",       category: "achievement" },
  { phrase: "achieved",         category: "achievement" },
  { phrase: "accomplished",     category: "achievement" },
  { phrase: "succeeded",        category: "achievement" },
  { phrase: "made progress",    category: "achievement" },
  { phrase: "improved",         category: "achievement" },
  { phrase: "did well",         category: "achievement" },
  { phrase: "great job",        category: "achievement" },
  { phrase: "well done",        category: "achievement" },
  { phrase: "completed",        category: "achievement" },
  { phrase: "progressed",       category: "achievement" },
  // Positive connection
  { phrase: "connected with",   category: "positive_connection" },
  { phrase: "responded well",   category: "positive_connection" },
  { phrase: "engaged with",     category: "positive_connection" },
  { phrase: "engaged positively",category:"positive_connection" },
  { phrase: "positive interaction", category: "positive_connection" },
  { phrase: "enjoyed",          category: "positive_connection" },
  { phrase: "laughed",          category: "positive_connection" },
  { phrase: "smiled",           category: "positive_connection" },
  { phrase: "joined in",        category: "positive_connection" },
  { phrase: "participated",     category: "positive_connection" },
  { phrase: "seemed settled",   category: "positive_connection" },
  { phrase: "seemed relaxed",   category: "positive_connection" },
  // Resilience / coping
  { phrase: "coped",            category: "resilience_coping" },
  { phrase: "regulated",        category: "resilience_coping" },
  { phrase: "de-escalated",     category: "resilience_coping" },
  { phrase: "calmed down",      category: "resilience_coping" },
  { phrase: "self-soothed",     category: "resilience_coping" },
  { phrase: "bounced back",     category: "resilience_coping" },
  { phrase: "asked for help",   category: "resilience_coping" },
  { phrase: "used their strategy",category:"resilience_coping" },
  { phrase: "grounded themselves",category:"resilience_coping"},
  // Voice & agency
  { phrase: "chose to",         category: "voice_agency" },
  { phrase: "decided to",       category: "voice_agency" },
  { phrase: "asked for",        category: "voice_agency" },
  { phrase: "said they wanted", category: "voice_agency" },
  { phrase: "expressed their wish",category:"voice_agency"  },
  { phrase: "told me they",     category: "voice_agency" },
  { phrase: "made it clear",    category: "voice_agency" },
  { phrase: "own terms",        category: "voice_agency" },
  // Positive mood
  { phrase: "seemed happy",     category: "positive_mood" },
  { phrase: "was happy",        category: "positive_mood" },
  { phrase: "in good spirits",  category: "positive_mood" },
  { phrase: "appeared calm",    category: "positive_mood" },
  { phrase: "appeared content", category: "positive_mood" },
  { phrase: "was settled",      category: "positive_mood" },
  { phrase: "positive mood",    category: "positive_mood" },
  { phrase: "proud",            category: "positive_mood" },
  { phrase: "excited",          category: "positive_mood" },
  { phrase: "celebrated",       category: "positive_mood" },
];

const CATEGORY_LABELS: Record<StrengthCategory, string> = {
  achievement:        "Achievement",
  positive_connection:"Positive Connection",
  resilience_coping:  "Resilience & Coping",
  voice_agency:       "Voice & Agency",
  positive_mood:      "Positive Mood",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

// A positive word preceded by a negation in the same clause is not a strength
// ("has not improved", "struggled to cope", "didn't settle").
const STRENGTH_NEGATION_RE = /\b(not|never|unable|struggled|struggling|failed|cannot)\b|n['’]t\b/;

function strengthNegated(lower: string, matchIndex: number): boolean {
  let preceding = lower.slice(Math.max(0, matchIndex - 25), matchIndex);
  const stop = Math.max(
    preceding.lastIndexOf("."), preceding.lastIndexOf("!"), preceding.lastIndexOf("?"),
    preceding.lastIndexOf(";"), preceding.lastIndexOf(","),
  );
  if (stop >= 0) preceding = preceding.slice(stop + 1);
  return STRENGTH_NEGATION_RE.test(preceding);
}

function detectStrengths(text: string): Array<{ phrase: string; category: StrengthCategory }> {
  if (!text || text.trim().length < 5) return [];
  const lower = text.toLowerCase();
  // Whole-word match (so "regulated" doesn't fire inside "dysregulated") and skip
  // negated occurrences (so "has not improved" isn't counted as achievement).
  return STRENGTH_PATTERNS.filter((p) => {
    const escaped = p.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "g");
    let m: RegExpExecArray | null;
    while ((m = re.exec(lower)) !== null) {
      if (!strengthNegated(lower, m.index)) return true;
    }
    return false;
  });
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface StaffStrengthsProfile {
  staffId: string;
  name: string;
  totalRecords: number;
  recordsWithStrengths: number;
  strengthsRate: number | null;
  markerCount: number;
  topCategory: StrengthCategory | null;
  topCategoryLabel: string | null;
  recognitionNote: string;
}

export interface ChildStrengthsProfile {
  childId: string;
  name: string;
  totalRecords: number;
  recordsWithStrengths: number;
  strengthsRate: number | null;
  topStrengthPhrase: string | null;
}

export interface CategoryResult {
  category: StrengthCategory;
  label: string;
  totalCount: number;
  topPhrase: string | null;
}

export interface StrengthsRecordingSummary {
  overallRate: number;
  totalRecords: number;
  totalWithStrengths: number;
  topPractitioner: { staffId: string; name: string; rate: number | null } | null;
  mostDocumentedChild: { childId: string; name: string; rate: number | null } | null;
  topStrengthsCategory: StrengthCategory | null;
  topStrengthsCategoryLabel: string | null;
}

export interface StrengthsRecordingData {
  staffProfiles: StaffStrengthsProfile[];
  childProfiles: ChildStrengthsProfile[];
  categoryResults: CategoryResult[];
  summary: StrengthsRecordingSummary;
}

// ── Public entry point — pure ────────────────────────────────────────────────

export function buildStrengthsRecordingIndex(store: ReturnType<typeof getStore>): StrengthsRecordingData {
  type Acc = {
    total: number;
    withStrengths: number;
    markers: number;
    byCat: Map<StrengthCategory, number>;
    byPhrase: Map<string, number>;
  };

  const staffAcc  = new Map<string, Acc>();
  const childAcc  = new Map<string, Acc>();
  const globalCat = new Map<StrengthCategory, { count: number; phrases: Map<string, number> }>();

  function acc(): Acc {
    return { total: 0, withStrengths: 0, markers: 0, byCat: new Map(), byPhrase: new Map() };
  }

  function addRecord(staffId: string, childId: string, text: string) {
    const s = staffAcc.get(staffId) ?? acc();
    const c = childAcc.get(childId) ?? acc();
    const hits = detectStrengths(text);
    const hasStr = hits.length > 0;

    s.total += 1; c.total += 1;
    if (hasStr) { s.withStrengths += 1; c.withStrengths += 1; }
    s.markers += hits.length;

    for (const { phrase, category } of hits) {
      s.byCat.set(category, (s.byCat.get(category) ?? 0) + 1);
      s.byPhrase.set(phrase, (s.byPhrase.get(phrase) ?? 0) + 1);
      c.byPhrase.set(phrase, (c.byPhrase.get(phrase) ?? 0) + 1);
      const g = globalCat.get(category) ?? { count: 0, phrases: new Map() };
      g.count += 1;
      g.phrases.set(phrase, (g.phrases.get(phrase) ?? 0) + 1);
      globalCat.set(category, g);
    }

    staffAcc.set(staffId, s);
    childAcc.set(childId, c);
  }

  // ── Incidents ─────────────────────────────────────────────────────────────
  const incidents = (store.incidents ?? []) as Array<{
    child_id: string; reported_by: string; description: string;
    outcome: string | null; lessons_learned: string | null;
  }>;
  for (const inc of incidents) {
    addRecord(inc.reported_by, inc.child_id,
      [inc.description, inc.outcome, inc.lessons_learned].join(" "));
  }

  // ── Daily Log ─────────────────────────────────────────────────────────────
  const dailyLog = (store.dailyLog ?? []) as Array<{
    child_id: string; staff_id: string; content: string;
  }>;
  for (const e of dailyLog) {
    addRecord(e.staff_id, e.child_id, e.content);
  }

  // ── Behaviour Log ─────────────────────────────────────────────────────────
  const behaviourLog = (store.behaviourLog ?? []) as Array<{
    child_id: string; recorded_by: string; behaviour: string;
    consequence: string; strategy_used: string; outcome: string;
  }>;
  for (const e of behaviourLog) {
    addRecord(e.recorded_by, e.child_id,
      [e.behaviour, e.consequence, e.strategy_used, e.outcome].join(" "));
  }

  // ── Name helpers ──────────────────────────────────────────────────────────
  const staffArr = (store.staff ?? []) as Array<{
    id: string; full_name?: string; first_name?: string; last_name?: string;
  }>;
  const ypArr = (store.youngPeople ?? []) as Array<{
    id: string; full_name?: string; first_name?: string; last_name?: string;
  }>;

  function nameFrom(arr: typeof staffArr, id: string): string {
    const p = arr.find((x) => x.id === id);
    if (!p) return id;
    if (p.full_name) return p.full_name;
    return `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || id;
  }

  // ── Build staff profiles ──────────────────────────────────────────────────
  const staffProfiles: StaffStrengthsProfile[] = [...staffAcc.entries()].map(([staffId, s]) => {
    const strengthsRate = s.total > 0 ? Math.round((s.withStrengths / s.total) * 100) : null;
    const topCatEntry = [...s.byCat.entries()].sort((a, b) => b[1] - a[1])[0];
    const topCategory = (topCatEntry?.[0] ?? null) as StrengthCategory | null;

    const recognitionNote = (strengthsRate ?? 0) >= 60
      ? "This staff member consistently documents children's achievements, connections, and resilience. Share their recording approach as a model in supervision."
      : (strengthsRate ?? 0) >= 30
      ? "Strengths-based language is appearing. Build on this: ask them to deliberately note one achievement or positive moment per shift."
      : "Records focus mainly on challenges. In supervision, explore: 'What were the moments this week when a child showed their strength — even briefly?'";

    return {
      staffId,
      name: nameFrom(staffArr, staffId),
      totalRecords: s.total,
      recordsWithStrengths: s.withStrengths,
      strengthsRate,
      markerCount: s.markers,
      topCategory,
      topCategoryLabel: topCategory ? CATEGORY_LABELS[topCategory] : null,
      recognitionNote,
    };
  }).sort((a, b) => (b.strengthsRate ?? 0) - (a.strengthsRate ?? 0));

  // ── Build child profiles ──────────────────────────────────────────────────
  const childProfiles: ChildStrengthsProfile[] = [...childAcc.entries()].map(([childId, c]) => {
    const strengthsRate = c.total > 0 ? Math.round((c.withStrengths / c.total) * 100) : null;
    const topStrengthPhrase = [...c.byPhrase.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    return {
      childId,
      name: nameFrom(ypArr, childId),
      totalRecords: c.total,
      recordsWithStrengths: c.withStrengths,
      strengthsRate,
      topStrengthPhrase,
    };
  }).sort((a, b) => (b.strengthsRate ?? 0) - (a.strengthsRate ?? 0));

  // ── Category results ──────────────────────────────────────────────────────
  const categoryResults: CategoryResult[] = (Object.keys(CATEGORY_LABELS) as StrengthCategory[]).map((cat) => {
    const g = globalCat.get(cat);
    return {
      category: cat,
      label: CATEGORY_LABELS[cat],
      totalCount: g?.count ?? 0,
      topPhrase: g ? ([...g.phrases.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null) : null,
    };
  }).sort((a, b) => b.totalCount - a.totalCount);

  const totalRecords = incidents.length + dailyLog.length + behaviourLog.length;
  const totalWithStrengths = [...staffAcc.values()].reduce((s, a) => s + a.withStrengths, 0);
  const overallRate = totalRecords > 0 ? Math.round((totalWithStrengths / totalRecords) * 100) : 0;
  const topPractitioner = staffProfiles[0] ?? null;
  const mostDocumentedChild = childProfiles[0] ?? null;

  return {
    staffProfiles,
    childProfiles,
    categoryResults,
    summary: {
      overallRate,
      totalRecords,
      totalWithStrengths,
      topPractitioner: topPractitioner
        ? { staffId: topPractitioner.staffId, name: topPractitioner.name, rate: topPractitioner.strengthsRate }
        : null,
      mostDocumentedChild: mostDocumentedChild
        ? { childId: mostDocumentedChild.childId, name: mostDocumentedChild.name, rate: mostDocumentedChild.strengthsRate }
        : null,
      topStrengthsCategory: categoryResults[0]?.category ?? null,
      topStrengthsCategoryLabel: categoryResults[0]?.label ?? null,
    },
  };
}

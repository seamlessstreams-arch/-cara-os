// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PREMISES & SAFETY COMPLIANCE ENGINE (pure / deterministic)
//
// "Are all our statutory building-safety checks and certificates in date?" — the
// single board that answers the classic inspector question (CHR 2015 Reg 31 /
// health & safety). Consolidates the siloed premises records — gas & electrical
// certificates, fire risk assessment, routine safety checks, fire/emergency
// drills, planned servicing — into one RAG currency view, and surfaces statutory
// checks with NO record on file as their own (honest) compliance prompt.
//
// Pure: every date decision is made against an injected `today`. The route owns
// the (data-specific) source mapping; the engine owns classification + rollup so
// it stays unit-testable.
// ══════════════════════════════════════════════════════════════════════════════

export type ComplianceStatus = "overdue" | "action" | "due_soon" | "current" | "no_record";

export interface ComplianceItemInput {
  key: string;
  label: string;
  category: string;            // "Certificates" | "Routine safety checks" | "Drills" | "Servicing & maintenance"
  due_date?: string | null;    // next due / expiry / next review; null ⇒ no record
  completed?: boolean;         // latest instance is done (recurring checks)
  failed?: boolean;            // latest result was a fail / outstanding action
  detail?: string | null;      // e.g. "EICR · 5-yearly" or check notes
  owner?: string | null;
  source_href?: string | null; // deep-link to the source page
}

export interface ComplianceItem extends Required<Omit<ComplianceItemInput, "due_date" | "detail" | "owner" | "source_href">> {
  due_date: string | null;
  detail: string | null;
  owner: string | null;
  source_href: string | null;
  status: ComplianceStatus;
  days_to_due: number | null;  // negative = overdue
}

export interface CategoryRollup {
  category: string;
  total: number;
  overdue: number;
  action: number;
  due_soon: number;
  current: number;
  no_record: number;
  worst: ComplianceStatus;
}

export interface PremisesComplianceResult {
  date: string;
  summary: {
    total: number;
    overdue: number;
    action: number;
    due_soon: number;
    current: number;
    no_record: number;
    compliance_rate: number | null; // % of RECORDED checks that are current
  };
  by_category: CategoryRollup[];
  items: ComplianceItem[];          // all, worst-first
  attention: ComplianceItem[];      // overdue + action + due_soon, worst-first
  no_record_items: ComplianceItem[];
  headline: string;
}

export interface PremisesComplianceInput {
  today: string;
  items: ComplianceItemInput[];
  due_soon_days?: number; // default 30
}

const SEVERITY: Record<ComplianceStatus, number> = {
  overdue: 0, action: 1, due_soon: 2, no_record: 3, current: 4,
};

function iso(d: string | null | undefined): string | null {
  if (!d) return null;
  const s = String(d).trim();
  return s ? s.slice(0, 10) : null;
}
function dayDiff(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(ay, (am || 1) - 1, ad || 1) - Date.UTC(by, (bm || 1) - 1, bd || 1)) / 86_400_000);
}

function classify(item: ComplianceItemInput, today: string, dueSoon: number): { status: ComplianceStatus; days: number | null } {
  if (item.failed) return { status: "action", days: item.due_date ? dayDiff(iso(item.due_date)!, today) : null };
  const due = iso(item.due_date);
  if (!due) return { status: item.completed ? "current" : "no_record", days: null };
  const diff = dayDiff(due, today);
  if (!item.completed && diff < 0) return { status: "overdue", days: diff };
  if (!item.completed && diff <= dueSoon) return { status: "due_soon", days: diff };
  return { status: "current", days: diff };
}

function worstOf(items: { status: ComplianceStatus }[]): ComplianceStatus {
  return items.reduce<ComplianceStatus>((w, i) => (SEVERITY[i.status] < SEVERITY[w] ? i.status : w), "current");
}

export function computePremisesCompliance(input: PremisesComplianceInput): PremisesComplianceResult {
  const today = iso(input.today)!;
  const dueSoon = input.due_soon_days ?? 30;

  const items: ComplianceItem[] = input.items.map((it) => {
    const { status, days } = classify(it, today, dueSoon);
    return {
      key: it.key,
      label: it.label,
      category: it.category,
      completed: !!it.completed,
      failed: !!it.failed,
      due_date: iso(it.due_date),
      detail: it.detail ?? null,
      owner: it.owner ?? null,
      source_href: it.source_href ?? null,
      status,
      days_to_due: days,
    };
  });

  // sort worst-first, then most-overdue, then label
  items.sort((a, b) =>
    SEVERITY[a.status] - SEVERITY[b.status] ||
    (a.days_to_due ?? 99999) - (b.days_to_due ?? 99999) ||
    a.label.localeCompare(b.label),
  );

  const count = (s: ComplianceStatus) => items.filter((i) => i.status === s).length;
  const overdue = count("overdue");
  const action = count("action");
  const due_soon = count("due_soon");
  const current = count("current");
  const no_record = count("no_record");
  const total = items.length;
  const recorded = total - no_record;
  const compliance_rate = recorded > 0 ? Math.round((current / recorded) * 100) : null;

  // category rollups (stable order of first appearance)
  const catOrder: string[] = [];
  const catMap = new Map<string, ComplianceItem[]>();
  for (const it of items) {
    if (!catMap.has(it.category)) { catMap.set(it.category, []); catOrder.push(it.category); }
    catMap.get(it.category)!.push(it);
  }
  const by_category: CategoryRollup[] = catOrder.map((category) => {
    const group = catMap.get(category)!;
    const c = (s: ComplianceStatus) => group.filter((i) => i.status === s).length;
    return {
      category, total: group.length,
      overdue: c("overdue"), action: c("action"), due_soon: c("due_soon"), current: c("current"), no_record: c("no_record"),
      worst: worstOf(group),
    };
  });

  const attention = items.filter((i) => i.status === "overdue" || i.status === "action" || i.status === "due_soon");
  const no_record_items = items.filter((i) => i.status === "no_record");

  // headline
  let headline: string;
  if (total === 0) {
    headline = "No premises safety records to assess.";
  } else if (overdue === 0 && action === 0) {
    const tail = no_record > 0 ? ` ${no_record} statutory check${no_record === 1 ? " has" : "s have"} no record on file.` : "";
    headline = `All recorded safety checks are in date${compliance_rate != null ? ` (${compliance_rate}% current)` : ""}.${tail}`;
  } else {
    const bits: string[] = [];
    if (overdue > 0) bits.push(`${overdue} overdue`);
    if (action > 0) bits.push(`${action} failed/needing action`);
    if (due_soon > 0) bits.push(`${due_soon} due soon`);
    const tail = no_record > 0 ? ` · ${no_record} with no record` : "";
    headline = `${bits.join(", ")} across premises safety checks${tail}.`;
  }

  return {
    date: today,
    summary: { total, overdue, action, due_soon, current, no_record, compliance_rate },
    by_category,
    items,
    attention,
    no_record_items,
    headline,
  };
}

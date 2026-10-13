// ══════════════════════════════════════════════════════════════════════════════
// CARA STUDIO NOTEBOOK — whole-child briefing (pure, deterministic)
//
// Composes a "this fortnight" whole-child briefing from a child's own records.
// Pure: it takes already-gathered records (see gather.ts, which reads them
// LIVE-SAFELY via dal) and returns a sectioned briefing. It never invents a
// signal — every line cites the record it came from, and where the record is
// absent it says so (a gap is intelligence, not something to smooth over).
// ══════════════════════════════════════════════════════════════════════════════

export interface NotebookSourceRow { id: string; date?: string; }
export interface NotebookIncidentRow extends NotebookSourceRow { type: string; severity: string; status?: string; }
export interface NotebookMissingRow extends NotebookSourceRow { status?: string; hasReturnInterview?: boolean; }
export interface NotebookDailyLogRow extends NotebookSourceRow { content: string; significant?: boolean; }
export interface NotebookKeyworkRow extends NotebookSourceRow { topic?: string; }
export interface NotebookReviewRow extends NotebookSourceRow { nextReviewDate?: string; }

export interface NotebookInput {
  child: { id: string; name: string; firstName: string; dob?: string };
  todayIso: string; // yyyy-mm-dd, London date, from the gather layer
  incidents: NotebookIncidentRow[];
  missing: NotebookMissingRow[];
  dailyLogs: NotebookDailyLogRow[];
  keywork: NotebookKeyworkRow[];
  education: NotebookSourceRow[];
  lacReviews: NotebookReviewRow[];
  riskAssessments: NotebookReviewRow[];
}

export interface Provenance { recordType: string; date?: string; }
export interface BriefingSignal { severity: "good" | "warn" | "crit"; text: string; provenance: Provenance[]; }
export interface NotebookSourceCount { label: string; count: number; }

export interface NotebookBriefing {
  childName: string;
  firstName: string;
  windowLabel: string;
  headline: string;
  sources: NotebookSourceCount[];
  needsYou: BriefingSignal[];
  working: BriefingSignal[];
  gaps: string[];
  generatedAtLabel: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** UTC-based date-only arithmetic — deterministic and timezone-stable for
 *  yyyy-mm-dd strings (prod runs UTC; date-only math never needs local parts). */
function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso.slice(0, 10);
  const t = Date.UTC(y, m - 1, d) + days * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}
function shortDate(iso?: string): string {
  if (!iso || iso.length < 10) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "";
  return `${d} ${MONTHS[m - 1] ?? ""}`.trim();
}
function inWindow(iso: string | undefined, startIso: string, todayIso: string): boolean {
  if (!iso || iso.length < 10) return false;
  const d = iso.slice(0, 10);
  return d >= startIso && d <= todayIso;
}
function ageFrom(dob: string | undefined, todayIso: string): number | null {
  if (!dob || dob.length < 10) return null;
  const by = Number(dob.slice(0, 4));
  const ty = Number(todayIso.slice(0, 4));
  if (!by || !ty) return null;
  let age = ty - by;
  if (dob.slice(5, 10) > todayIso.slice(5, 10)) age -= 1;
  return age >= 0 && age <= 30 ? age : null; // guard against bad source DOBs
}

const WINDOW_DAYS = 14;

export function buildNotebookBriefing(input: NotebookInput): NotebookBriefing {
  const { todayIso } = input;
  const start = addDaysIso(todayIso, -WINDOW_DAYS);
  const name = input.child.name;
  const first = input.child.firstName || name;
  const age = ageFrom(input.child.dob, todayIso);

  const sources: NotebookSourceCount[] = [
    { label: "Daily logs", count: input.dailyLogs.length },
    { label: "Incidents", count: input.incidents.length },
    { label: "Key-work sessions", count: input.keywork.length },
    { label: "Missing episodes", count: input.missing.length },
    { label: "Risk assessments", count: input.riskAssessments.length },
    { label: "LAC reviews", count: input.lacReviews.length },
    { label: "Education records", count: input.education.length },
  ].filter((s) => s.count > 0);

  const needsYou: BriefingSignal[] = [];
  const working: BriefingSignal[] = [];
  const gaps: string[] = [];

  // ── Overdue statutory reviews (crit if overdue, warn if due within the window ahead) ──
  const soon = addDaysIso(todayIso, WINDOW_DAYS);
  for (const ra of input.riskAssessments) {
    const due = ra.nextReviewDate;
    if (due && due < todayIso) needsYou.push({ severity: "crit", text: `Risk assessment review is overdue (was due ${shortDate(due)}).`, provenance: [{ recordType: "Risk assessment", date: due }] });
    else if (due && due <= soon) needsYou.push({ severity: "warn", text: `Risk assessment review is due by ${shortDate(due)}.`, provenance: [{ recordType: "Risk assessment", date: due }] });
  }
  for (const lac of input.lacReviews) {
    const due = lac.nextReviewDate;
    if (due && due < todayIso) needsYou.push({ severity: "warn", text: `LAC review date has passed (${shortDate(due)}) — confirm it was held.`, provenance: [{ recordType: "LAC review", date: due }] });
  }

  // ── Recent missing episodes (window) ──
  const recentMissing = input.missing.filter((m) => inWindow(m.date, start, todayIso));
  for (const m of recentMissing) {
    const open = (m.status ?? "").toLowerCase() === "active" || (m.status ?? "").toLowerCase() === "open";
    needsYou.push({
      severity: open ? "crit" : "warn",
      text: open ? `Open missing episode from ${shortDate(m.date)}.` : `Missing episode on ${shortDate(m.date)}${m.hasReturnInterview === false ? " — return interview not yet recorded" : ""}.`,
      provenance: [{ recordType: "Missing episode", date: m.date }],
    });
  }

  // ── Recent serious incidents (window) ──
  const serious = new Set(["high", "critical", "major"]);
  const recentIncidents = input.incidents.filter((i) => inWindow(i.date, start, todayIso));
  for (const i of recentIncidents.filter((i) => serious.has((i.severity ?? "").toLowerCase()))) {
    needsYou.push({ severity: "warn", text: `${i.severity} incident recorded (${i.type.replace(/_/g, " ")}) on ${shortDate(i.date)}.`, provenance: [{ recordType: "Incident", date: i.date }] });
  }

  // ── What's working ──
  const recentKeywork = input.keywork.filter((k) => inWindow(k.date, start, todayIso));
  if (recentKeywork.length > 0) {
    working.push({ severity: "good", text: `${recentKeywork.length} key-work ${recentKeywork.length === 1 ? "session" : "sessions"} with ${first} in the last fortnight — the relationship is being invested in.`, provenance: recentKeywork.slice(0, 3).map((k) => ({ recordType: "Keywork", date: k.date })) });
  }
  if (recentIncidents.length === 0 && input.incidents.length > 0) {
    working.push({ severity: "good", text: "No incidents recorded in the last fortnight.", provenance: [] });
  }
  const sig = input.dailyLogs.filter((l) => l.significant && inWindow(l.date, start, todayIso));
  if (sig.length > 0) {
    working.push({ severity: "good", text: `${sig.length} significant ${sig.length === 1 ? "moment" : "moments"} logged this fortnight — worth naming to ${first}.`, provenance: sig.slice(0, 3).map((l) => ({ recordType: "Daily log", date: l.date })) });
  }

  // ── Honest gaps (the determinism / refusal thesis) ──
  if (input.riskAssessments.length === 0) gaps.push("No risk assessment on file.");
  if (recentKeywork.length === 0) gaps.push("No key-work session recorded in the last 14 days.");
  if (input.dailyLogs.length === 0) gaps.push("No daily logs on file for this child.");
  if (input.lacReviews.length === 0) gaps.push("No LAC review recorded.");

  // ── Headline (deterministic, honest) ──
  const attn = needsYou.length;
  const headline = attn === 0
    ? `${first} — a settled picture this fortnight, nothing flagged for your attention.`
    : `${first} — ${attn} ${attn === 1 ? "thing needs" : "things need"} your attention this fortnight.`;

  return {
    childName: name,
    firstName: first,
    windowLabel: `Last ${WINDOW_DAYS} days to ${shortDate(todayIso)}${age != null ? ` · age ${age}` : ""}`,
    headline,
    sources,
    needsYou,
    working,
    gaps,
    generatedAtLabel: shortDate(todayIso),
  };
}

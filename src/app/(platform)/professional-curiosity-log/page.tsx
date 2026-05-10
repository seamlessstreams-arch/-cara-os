"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Eye,
  Brain,
  Lightbulb,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useCuriosityLogEntries } from "@/hooks/use-curiosity-log-entries";
import type { CuriosityLogEntry, CuriosityFocusArea } from "@/types/extended";
import { CURIOSITY_FOCUS_AREA_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── local colour/icon maps ───────────────────────────────────────────────── */

const FOCUS_CLR: Record<CuriosityFocusArea, string> = {
  child_presentation: "bg-blue-100 text-blue-800",
  family_dynamics: "bg-purple-100 text-purple-800",
  multi_agency_working: "bg-indigo-100 text-indigo-800",
  own_assumptions: "bg-amber-100 text-amber-800",
  risk_assessment: "bg-red-100 text-red-800",
  cultural_awareness: "bg-teal-100 text-teal-800",
  child_voice: "bg-pink-100 text-pink-800",
};

const FOCUS_ICON: Record<CuriosityFocusArea, typeof Eye> = {
  child_presentation: Eye,
  family_dynamics: Brain,
  multi_agency_working: Sparkles,
  own_assumptions: HelpCircle,
  risk_assessment: ShieldAlert,
  cultural_awareness: Lightbulb,
  child_voice: HelpCircle,
};

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── component ─────────────────────────────────────────────────────────────── */

export default function ProfessionalCuriosityLogPage() {
  const { data: records = [], isLoading } = useCuriosityLogEntries();
  const [search, setSearch] = useState("");
  const [focusFilter, setFocusFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);
  const staffIds = useMemo(() => [...new Set(records.map((r) => r.raised_by))], [records]);

  const filtered = useMemo(() => {
    let out = [...records];
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(
        (r) =>
          r.assumption_challenged.toLowerCase().includes(s) ||
          r.curious_question_raised.toLowerCase().includes(s) ||
          getStaffName(r.raised_by).toLowerCase().includes(s) ||
          (r.about_child && getYPName(r.about_child).toLowerCase().includes(s))
      );
    }
    if (focusFilter !== "all") out = out.filter((r) => r.focus_area === focusFilter);
    if (staffFilter !== "all") out = out.filter((r) => r.raised_by === staffFilter);
    out.sort((a, b) =>
      sortBy === "oldest" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
    );
    return out;
  }, [records, search, focusFilter, staffFilter, sortBy]);

  const quarterStart = d(-90);
  const entriesThisQuarter = records.filter((r) => r.date >= quarterStart).length;
  const assumptionsRevised = records.filter((r) => r.was_initial_assumption_wrong).length;
  const outcomesImproved = records.filter((r) => r.child_outcome_impact.trim().length > 0).length;
  const embeddedLearnings = records.filter((r) => r.embedded_in_practice.trim().length > 0).length;

  const exportCols: ExportColumn<CuriosityLogEntry>[] = useMemo(
    () => [
      { header: "Date", accessor: (r) => r.date },
      { header: "Raised By", accessor: (r) => getStaffName(r.raised_by) },
      { header: "Focus Area", accessor: (r) => CURIOSITY_FOCUS_AREA_LABEL[r.focus_area] },
      { header: "About Child", accessor: (r) => (r.about_child ? getYPName(r.about_child) : "General / team") },
      { header: "Assumption Challenged", accessor: (r) => r.assumption_challenged },
      { header: "Curious Question", accessor: (r) => r.curious_question_raised },
      { header: "Initial Assumption Wrong?", accessor: (r) => (r.was_initial_assumption_wrong ? "Yes" : "No") },
      { header: "Revised Understanding", accessor: (r) => r.revised_understanding },
      { header: "Actions Taken", accessor: (r) => r.actions_taken.join("; ") },
      { header: "Outcome Impact", accessor: (r) => r.outcome_impact },
      { header: "Child Outcome Impact", accessor: (r) => r.child_outcome_impact },
      { header: "Wider Learning", accessor: (r) => r.wider_learning },
      { header: "Supervision", accessor: (r) => (r.discussed_in_supervision ? "Yes" : "No") },
      { header: "Team Meeting", accessor: (r) => (r.discussed_in_team_meeting ? "Yes" : "No") },
      { header: "Embedded In Practice", accessor: (r) => r.embedded_in_practice },
      { header: "Reflection Pattern", accessor: (r) => r.reflection_pattern },
    ],
    []
  );

  if (isLoading) {
    return (
      <PageShell title="Professional Curiosity Log" subtitle="Reflective practice — challenging our assumptions about children, families, professionals and ourselves">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Professional Curiosity Log"
      subtitle="Reflective practice — challenging our assumptions about children, families, professionals and ourselves"
      ariaContext={{ pageTitle: "Professional Curiosity Log", sourceType: "general" }}
      actions={[
        <PrintButton key="p" title="Professional Curiosity Log" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="professional-curiosity-log" />,
        <AriaStudioQuickActionButton key="a" context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />,
      ]}
    >
      <div id="print-area" className="space-y-6">
        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Entries this quarter", value: entriesThisQuarter, icon: Brain, colour: "text-blue-600" },
            { label: "Assumptions revised", value: assumptionsRevised, icon: HelpCircle, colour: "text-amber-600" },
            { label: "Outcomes improved", value: outcomesImproved, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Embedded learnings", value: embeddedLearnings, icon: Lightbulb, colour: "text-purple-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 flex items-center gap-3">
                <s.icon className={cn("h-8 w-8", s.colour)} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* philosophy banner */}
        <div className="rounded-lg border border-indigo-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="h-6 w-6 text-indigo-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-base md:text-lg font-semibold text-indigo-900">
                &ldquo;Professional curiosity is the most powerful safeguarding tool we have.&rdquo;
              </p>
              <p className="text-xs text-indigo-800/80">
                Named in Working Together 2023 and Quality Standard 5. Repeatedly identified in
                serious case reviews as the practice that, when missing, costs children dearly —
                and when present, changes lives.
              </p>
            </div>
          </div>
        </div>

        {/* filters / sort */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Assumption, question, staff, child…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="w-52">
                <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Focus area</Label>
                <Select value={focusFilter} onValueChange={setFocusFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All focus areas</SelectItem>
                    {(Object.entries(CURIOSITY_FOCUS_AREA_LABEL) as [CuriosityFocusArea, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <Label className="text-xs">Raised by</Label>
                <Select value={staffFilter} onValueChange={setStaffFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All staff</SelectItem>
                    {staffIds.map((id) => (
                      <SelectItem key={id} value={id}>{getStaffName(id)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-36">
                <Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* expandable card list */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expandedId === r.id;
            const Icon = FOCUS_ICON[r.focus_area];
            return (
              <Card key={r.id}>
                <button className="w-full text-left" onClick={() => toggle(r.id)} aria-expanded={open}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-wrap">
                        <Icon className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                          <CardTitle className="text-base leading-snug">{r.assumption_challenged}</CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={cn("text-xs", FOCUS_CLR[r.focus_area])}>
                              {CURIOSITY_FOCUS_AREA_LABEL[r.focus_area]}
                            </Badge>
                            {r.about_child ? (
                              <Badge variant="outline" className="text-xs">{getYPName(r.about_child)}</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">General / team</Badge>
                            )}
                            {r.was_initial_assumption_wrong && (
                              <Badge className="text-xs bg-amber-100 text-amber-800">Assumption revised</Badge>
                            )}
                            {r.discussed_in_supervision && (
                              <Badge className="text-xs bg-purple-100 text-purple-800">Supervision</Badge>
                            )}
                            {r.discussed_in_team_meeting && (
                              <Badge className="text-xs bg-indigo-100 text-indigo-800">Team meeting</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {r.date} · {getStaffName(r.raised_by)}
                        </span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-3 pt-0">
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                      <p className="text-xs font-semibold text-slate-700 mb-1">Original narrative</p>
                      <p className="text-sm text-slate-900">{r.original_narrative}</p>
                    </div>
                    <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                      <p className="text-xs font-semibold text-indigo-800 mb-1">The curious question raised</p>
                      <p className="text-sm text-indigo-900 italic">&ldquo;{r.curious_question_raised}&rdquo;</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-semibold text-blue-800 mb-1">Evidence considered</p>
                        <ul className="list-disc list-inside text-sm text-blue-900 space-y-0.5">
                          {r.evidence_considered.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-semibold text-amber-800 mb-1">Alternative explanations</p>
                        <ul className="list-disc list-inside text-sm text-amber-900 space-y-0.5">
                          {r.alternative_explanations.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      </div>
                    </div>
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                      <p className="text-xs font-semibold text-emerald-800 mb-1">Revised understanding</p>
                      <p className="text-sm text-emerald-900">{r.revised_understanding}</p>
                    </div>
                    <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                      <p className="text-xs font-semibold text-purple-800 mb-1">Actions taken</p>
                      <ul className="list-disc list-inside text-sm text-purple-900 space-y-0.5">
                        {r.actions_taken.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-teal-50 border border-teal-200 p-3">
                        <p className="text-xs font-semibold text-teal-800 mb-1">Outcome / impact (system)</p>
                        <p className="text-sm text-teal-900">{r.outcome_impact}</p>
                      </div>
                      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                        <p className="text-xs font-semibold text-pink-800 mb-1">Child outcome / impact</p>
                        <p className="text-sm text-pink-900">{r.child_outcome_impact}</p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                      <p className="text-xs font-semibold text-yellow-800 mb-1">Wider learning</p>
                      <p className="text-sm text-yellow-900">{r.wider_learning}</p>
                    </div>
                    <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                      <p className="text-xs font-semibold text-indigo-800 mb-1">Embedded in practice</p>
                      <p className="text-sm text-indigo-900">{r.embedded_in_practice}</p>
                    </div>
                    <div className="text-xs text-muted-foreground pt-1 flex flex-wrap gap-x-4 gap-y-1">
                      <span><span className="font-medium">Reflection pattern:</span> {r.reflection_pattern}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No curiosity entries match the current filters.
              </CardContent>
            </Card>
          )}
        </div>

        {/* regulatory note */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory framework</p>
          <p>
            Professional curiosity is a named requirement under Working Together to Safeguard
            Children 2023 and Quality Standard 5 (Care planning) of the Children&apos;s Homes
            (England) Regulations. It is repeatedly identified in serious case reviews and Local
            Child Safeguarding Practice Reviews as a practice whose absence contributed to harm.
            This log evidences how the home actively challenges its own assumptions and embeds the
            resulting learning in day-to-day practice, supervision and team meetings.
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Safeguarding"
        category={["safeguarding", "professional_contact"]}
        days={90}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Professional Curiosity Log — professional curiosity practice, staff observations, concerns raised, follow-up actions, multi-agency information sharing, safeguarding vigilance, Reg 45"
        recordType="management_oversight"
        className="mt-6"
      />
    </PageShell>
  );
}

"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn, todayStr } from "@/lib/utils";
import { useWindowChecks } from "@/hooks/use-window-checks";
import type { WindowCheck } from "@/types/extended";
import {
  WINDOW_TYPE_LABEL,
  WINDOW_FLOOR_LEVEL_LABEL,
  RESTRICTOR_TYPE_LABEL,
  WINDOW_CHECK_OUTCOME_LABEL,
} from "@/types/extended";
import {
  ShieldCheck,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  CheckCircle,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const outcomeColour: Record<string, string> = {
  pass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  pass_with_advisory: "bg-amber-100 text-amber-800 border-amber-200",
  remedial_required: "bg-orange-100 text-orange-900 border-orange-200",
  failed_restrict_immediately: "bg-red-100 text-red-900 border-red-300",
};

const restrictorColour: Record<string, string> = {
  cable_key: "bg-sky-100 text-sky-800 border-sky-200",
  permanent_fixed: "bg-teal-100 text-teal-800 border-teal-200",
  pin_lock: "bg-indigo-100 text-indigo-800 border-indigo-200",
  combination: "bg-violet-100 text-violet-800 border-violet-200",
  standard_window_lock: "bg-slate-100 text-slate-800 border-slate-200",
  none_child_accessible: "bg-red-100 text-red-900 border-red-300",
};

const exportCols: ExportColumn<WindowCheck>[] = [
  { header: "Date", accessor: (r) => r.inspection_date },
  { header: "Location", accessor: (r) => r.window_location },
  { header: "Window Type", accessor: (r) => WINDOW_TYPE_LABEL[r.window_type] },
  { header: "Floor", accessor: (r) => WINDOW_FLOOR_LEVEL_LABEL[r.floor_level] },
  { header: "Restrictor Present", accessor: (r) => (r.restrictor_present ? "Yes" : "No") },
  { header: "Restrictor Type", accessor: (r) => RESTRICTOR_TYPE_LABEL[r.restrictor_type] },
  { header: "Restrictor Working", accessor: (r) => (r.restrictor_working ? "Yes" : "No") },
  { header: "Key Location", accessor: (r) => r.key_location ?? "—" },
  { header: "Opening Max (cm)", accessor: (r) => r.opening_maximum_cm.toFixed(1) },
  { header: "100mm Rule Compliance", accessor: (r) => (r.opening_compliance_with_100mm_rule ? "Yes" : "No") },
  { header: "Signage In Place", accessor: (r) => (r.signage_in_place ? "Yes" : "No") },
  { header: "Child Aware", accessor: (r) => (r.child_aware ? "Yes" : "No") },
  { header: "Damage Noted", accessor: (r) => r.damage_noted.join("; ") },
  { header: "Remedial Actions", accessor: (r) => r.remedial_actions.join("; ") },
  { header: "Outcome", accessor: (r) => WINDOW_CHECK_OUTCOME_LABEL[r.outcome] },
  { header: "Inspected By", accessor: (r) => getStaffName(r.inspected_by) },
  { header: "Flags / Concerns", accessor: (r) => r.flags_concerns.join("; ") },
  { header: "Next Due", accessor: (r) => r.next_due_date },
];

export default function BuildingWindowRestrictorChecksPage() {
  const { data: res, isLoading } = useWindowChecks();
  const data = useMemo(() => res?.data ?? [], [res]);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "location" | "outcome" | "nextdue">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <PageShell title="Building — Window Restrictor & High-Window Safety Checks" subtitle="Quarterly inspection of all upstairs and at-height windows">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  const today = todayStr();
  const thirtyDaysFromNow = (() => { const dt = new Date(); dt.setDate(dt.getDate() + 30); return dt.toISOString().slice(0, 10); })();
  const ninetyDaysAgo = (() => { const dt = new Date(); dt.setDate(dt.getDate() - 90); return dt.toISOString().slice(0, 10); })();

  const locations = Array.from(new Set(data.map((r) => r.window_location))).sort();

  const filtered = (() => {
    let r = data.filter((rec) => {
      const matchesSearch =
        !search ||
        rec.window_location.toLowerCase().includes(search.toLowerCase()) ||
        WINDOW_TYPE_LABEL[rec.window_type].toLowerCase().includes(search.toLowerCase()) ||
        RESTRICTOR_TYPE_LABEL[rec.restrictor_type].toLowerCase().includes(search.toLowerCase());
      const matchesLocation = locationFilter === "all" || rec.window_location === locationFilter;
      return matchesSearch && matchesLocation;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "location") return a.window_location.localeCompare(b.window_location);
      if (sortBy === "outcome") return a.outcome.localeCompare(b.outcome);
      if (sortBy === "nextdue") return a.next_due_date.localeCompare(b.next_due_date);
      return b.inspection_date.localeCompare(a.inspection_date);
    });
    return r;
  })();

  const stats = (() => {
    const checkedThisQuarter = data.filter((r) => r.inspection_date >= ninetyDaysAgo).length;
    const allPass = data.filter((r) => r.outcome === "pass").length;
    const remedialOpen = data.filter((r) => r.outcome === "remedial_required" || r.outcome === "failed_restrict_immediately").length;
    const dueSoon = data.filter((r) => r.next_due_date >= today && r.next_due_date <= thirtyDaysFromNow).length;
    return { checkedThisQuarter, allPass, remedialOpen, dueSoon };
  })();

  return (
    <PageShell
      title="Building — Window Restrictor & High-Window Safety Checks"
      subtitle="Quarterly inspection of all upstairs and at-height windows. Restrictor functioning, key location, child awareness, no-tampering signage, school-age-appropriate locks. RoSPA falls-from-windows guidance and the 100mm aperture rule applied throughout."
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="building-window-restrictor-checks" />
          <PrintButton title="Window Restrictor Checks" />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
          <div className="flex items-center gap-2 text-sky-800 text-sm mb-1"><ShieldCheck className="h-4 w-4" /><span>Windows checked (quarter)</span></div>
          <div className="text-2xl font-semibold text-sky-900">{stats.checkedThisQuarter}</div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-800 text-sm mb-1"><CheckCircle className="h-4 w-4" /><span>All-pass count</span></div>
          <div className="text-2xl font-semibold text-emerald-900">{stats.allPass}</div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-800 text-sm mb-1"><AlertTriangle className="h-4 w-4" /><span>Remedial open</span></div>
          <div className="text-2xl font-semibold text-red-900">{stats.remedialOpen}</div>
        </div>
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
          <div className="flex items-center gap-2 text-teal-800 text-sm mb-1"><Calendar className="h-4 w-4" /><span>Next due (30d)</span></div>
          <div className="text-2xl font-semibold text-teal-900">{stats.dueSoon}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search location, window type or restrictor..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="Window location" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All window locations</SelectItem>
            {locations.map((loc) => (<SelectItem key={loc} value={loc}>{loc}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-48"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Most recent</SelectItem>
            <SelectItem value="location">Location</SelectItem>
            <SelectItem value="outcome">Outcome</SelectItem>
            <SelectItem value="nextdue">Next due</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isOpen = expandedId === r.id;
          const failed = r.outcome === "failed_restrict_immediately";
          const dueSoon = r.next_due_date >= today && r.next_due_date <= thirtyDaysFromNow;
          const overdue = r.next_due_date < today;
          return (
            <div key={r.id} className={cn("rounded-lg border bg-white overflow-hidden", failed ? "border-red-300 ring-1 ring-red-200" : "border-slate-200")}>
              <button onClick={() => setExpandedId(isOpen ? null : r.id)} className={cn("w-full p-4 flex items-start justify-between gap-3 text-left", failed ? "hover:bg-red-50/40" : "hover:bg-sky-50/40")}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {failed ? <AlertTriangle className="h-4 w-4 text-red-600" /> : <ShieldCheck className="h-4 w-4 text-sky-600" />}
                    <span className="font-semibold text-slate-900">{r.inspection_date}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", outcomeColour[r.outcome])}>{WINDOW_CHECK_OUTCOME_LABEL[r.outcome]}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", restrictorColour[r.restrictor_type])}>{RESTRICTOR_TYPE_LABEL[r.restrictor_type]}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", r.opening_compliance_with_100mm_rule ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-red-100 text-red-900 border-red-300")}>
                      Opening {r.opening_maximum_cm.toFixed(1)} cm
                    </span>
                    {r.child_aware ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-teal-100 text-teal-800 border-teal-200">Child aware</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-200">Child not yet briefed</span>
                    )}
                    {overdue ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-red-100 text-red-800 border-red-200">Re-check overdue · {r.next_due_date}</span>
                    ) : dueSoon ? (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-200">Re-check {r.next_due_date}</span>
                    ) : null}
                  </div>
                  <div className="text-sm text-slate-600">{r.window_location} · {WINDOW_TYPE_LABEL[r.window_type]} · {WINDOW_FLOOR_LEVEL_LABEL[r.floor_level]} floor</div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
              </button>
              {isOpen && (
                <div className={cn("px-4 pb-4 border-t", failed ? "border-red-100 bg-red-50/30" : "border-slate-100 bg-sky-50/20")}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Inspection details</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-slate-700">
                        <div><span className="text-slate-500">Location:</span> {r.window_location}</div>
                        <div><span className="text-slate-500">Window type:</span> {WINDOW_TYPE_LABEL[r.window_type]}</div>
                        <div><span className="text-slate-500">Floor level:</span> {WINDOW_FLOOR_LEVEL_LABEL[r.floor_level]}</div>
                        <div><span className="text-slate-500">Inspected:</span> {r.inspection_date}</div>
                        <div><span className="text-slate-500">Inspected by:</span> {getStaffName(r.inspected_by)}</div>
                        <div><span className="text-slate-500">Outcome:</span> {WINDOW_CHECK_OUTCOME_LABEL[r.outcome]}</div>
                      </div>
                    </div>
                    <div className="rounded-md border border-sky-200 bg-sky-50 p-3">
                      <div className="text-xs font-semibold text-sky-800 uppercase mb-2">Restrictor</div>
                      <div className="text-sm text-sky-900 space-y-1">
                        <div><span className="text-sky-700">Present:</span> {r.restrictor_present ? "Yes" : "No"}</div>
                        <div><span className="text-sky-700">Type:</span> {RESTRICTOR_TYPE_LABEL[r.restrictor_type]}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-sky-700">Working:</span>
                          {r.restrictor_working ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle className="h-3.5 w-3.5" /> Yes — tested</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-700"><AlertTriangle className="h-3.5 w-3.5" /> No — failed under test</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3">
                      <div className="text-xs font-semibold text-indigo-800 uppercase mb-2">Key location</div>
                      <div className="text-sm text-indigo-900">{r.key_location ?? "—"}</div>
                      <div className="text-xs text-indigo-700 mt-2">Keys held only by manager and deputy. Never on the window, frame or accessible to children.</div>
                    </div>
                    <div className={cn("rounded-md border p-3 lg:col-span-2", r.opening_compliance_with_100mm_rule ? "border-emerald-200 bg-emerald-50" : "border-red-300 bg-red-50")}>
                      <div className={cn("text-xs font-semibold uppercase mb-2", r.opening_compliance_with_100mm_rule ? "text-emerald-800" : "text-red-800")}>Opening aperture vs 100mm rule</div>
                      <div className={cn("text-sm", r.opening_compliance_with_100mm_rule ? "text-emerald-900" : "text-red-900")}>
                        Maximum opening measured: <span className="font-semibold">{r.opening_maximum_cm.toFixed(1)} cm</span>{" "}
                        ({r.opening_maximum_cm <= 10 ? "within" : "exceeds"} the 100mm / 10cm industry standard for children&rsquo;s settings).{" "}
                        {r.opening_compliance_with_100mm_rule ? "Compliant." : "NON-COMPLIANT — restrict immediately."}
                      </div>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Signage in place</div>
                      <div className="text-sm text-slate-700">
                        {r.signage_in_place ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle className="h-3.5 w-3.5" /> Yes — &lsquo;Do not tamper&rsquo; notice present</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700"><AlertTriangle className="h-3.5 w-3.5" /> No — to be added</span>
                        )}
                      </div>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Child awareness</div>
                      <div className="text-sm text-slate-700">
                        {r.child_aware ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle className="h-3.5 w-3.5" /> Briefed age-appropriately — knows not to tamper</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700"><AlertTriangle className="h-3.5 w-3.5" /> Brief outstanding</span>
                        )}
                      </div>
                    </div>
                    {r.damage_noted.length > 0 && (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-amber-800 uppercase mb-2">Damage noted</div>
                        <ul className="text-sm text-amber-900 space-y-1">{r.damage_noted.map((dmg, i) => (<li key={i} className="flex gap-2"><span>·</span><span>{dmg}</span></li>))}</ul>
                      </div>
                    )}
                    {r.remedial_actions.length > 0 && (
                      <div className={cn("rounded-md border p-3 lg:col-span-2", failed ? "border-red-300 bg-red-50" : "border-orange-200 bg-orange-50")}>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className={cn("h-4 w-4", failed ? "text-red-700" : "text-orange-700")} />
                          <div className={cn("text-xs font-semibold uppercase", failed ? "text-red-800" : "text-orange-800")}>Remedial actions</div>
                        </div>
                        <ul className={cn("text-sm space-y-1", failed ? "text-red-900" : "text-orange-900")}>{r.remedial_actions.map((a, i) => (<li key={i} className="flex gap-2"><span>·</span><span>{a}</span></li>))}</ul>
                      </div>
                    )}
                    {r.flags_concerns.length > 0 && (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-red-700" /><div className="text-xs font-semibold text-red-800 uppercase">Flags / concerns</div></div>
                        <ul className="text-sm text-red-900 space-y-1">{r.flags_concerns.map((f, i) => (<li key={i} className="flex gap-2"><span>!</span><span>{f}</span></li>))}</ul>
                      </div>
                    )}
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Next due</div>
                      <div className="text-sm text-slate-700">
                        Re-check by <span className="font-medium">{r.next_due_date}</span>{" "}
                        {failed ? "(emergency re-test post-repair)" : "(quarterly cycle — RoSPA guidance for child-occupied premises)"}
                      </div>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3 lg:col-span-2 text-xs text-slate-500">
                      Inspected by {getStaffName(r.inspected_by)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Children&rsquo;s Homes (England) Regulations 2015 Reg 25 (premises and grounds). RoSPA falls-from-windows guidance
          and the 100mm / 10cm aperture rule. Health &amp; Safety at Work etc. Act 1974. Building Regulations Approved
          Document K (protection from falling). Restrictor keys are held only by manager and deputy in the office safe.
          Quarterly inspection of every upstairs and at-height window is recorded; any failure restricts the window
          immediately and is repaired within 24 hours. Records retained 7+ years and available to Ofsted on request.
        </p>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}

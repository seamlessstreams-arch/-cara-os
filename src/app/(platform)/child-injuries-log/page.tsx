"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, ShieldAlert, Activity, MapPin, Bandage, Stethoscope, Eye, Camera,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import type { ChildInjuryRecord, ChildInjuryType, InjurySeverity } from "@/types/extended";
import { CHILD_INJURY_TYPE_LABEL, INJURY_SEVERITY_LABEL } from "@/types/extended";
import { useChildInjuryRecords } from "@/hooks/use-child-injury-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const SEVERITY_CLR: Record<InjurySeverity, string> = {
  minor: "bg-green-100 text-green-800",
  moderate: "bg-yellow-100 text-yellow-800",
  required_medical: "bg-red-100 text-red-800",
};

const BORDER_SEV: Record<InjurySeverity, string> = {
  minor: "border-l-green-400",
  moderate: "border-l-yellow-400",
  required_medical: "border-l-red-600",
};

const TYPE_CLR: Record<ChildInjuryType, string> = {
  bruise: "bg-purple-100 text-purple-800",
  graze: "bg-orange-100 text-orange-800",
  cut: "bg-red-100 text-red-800",
  bump: "bg-blue-100 text-blue-800",
  burn: "bg-rose-100 text-rose-800",
  sprain: "bg-amber-100 text-amber-800",
  other: "bg-slate-100 text-[var(--cs-navy)]",
};

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function ChildInjuriesLogPage() {
  const { data: queryData, isLoading } = useChildInjuryRecords();
  const items = queryData?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((p) => (p === id ? null : id));

  /* ── derived ─────────────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let rows = items.filter((r) => {
      if (filterType !== "all" && r.injury_type !== filterType) return false;
      if (filterSeverity !== "all" && r.severity !== filterSeverity) return false;
      if (filterYP !== "all" && r.child_id !== filterYP) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.body_location.toLowerCase().includes(q) ||
          r.how_it_happened.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q) ||
          getYPName(r.child_id).toLowerCase().includes(q)
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.date.localeCompare(a.date);
        case "date-asc": return a.date.localeCompare(b.date);
        case "severity": {
          const order: InjurySeverity[] = ["minor", "moderate", "required_medical"];
          return order.indexOf(b.severity) - order.indexOf(a.severity);
        }
        case "yp": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default: return 0;
      }
    });
    return rows;
  }, [items, search, filterType, filterSeverity, filterYP, sortBy]);

  /* ── stats ───────────────────────────────────────────────────────────────── */

  const thisWeekCount = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    return items.filter((r) => {
      const rd = new Date(r.date);
      return rd >= sevenDaysAgo && rd <= now;
    }).length;
  }, [items]);

  const requiredMedicalCount = items.filter((r) => r.severity === "required_medical").length;
  const safeguardingFlaggedCount = items.filter((r) => r.safeguarding_flag).length;

  const mostCommonLocation = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((r) => {
      // group by broad area (first word)
      const area = r.body_location.split(" ")[0];
      counts[area] = (counts[area] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : "—";
  }, [items]);

  const yps = Array.from(new Set(items.map((r) => r.child_id)));

  /* ── export ──────────────────────────────────────────────────────────────── */

  const exportCols: ExportColumn<ChildInjuryRecord>[] = [
    { header: "Date", accessor: (r: ChildInjuryRecord) => r.date },
    { header: "Time", accessor: (r: ChildInjuryRecord) => r.time },
    { header: "Young Person", accessor: (r: ChildInjuryRecord) => getYPName(r.child_id) },
    { header: "Body Location", accessor: (r: ChildInjuryRecord) => r.body_location },
    { header: "Injury Type", accessor: (r: ChildInjuryRecord) => CHILD_INJURY_TYPE_LABEL[r.injury_type] },
    { header: "Severity", accessor: (r: ChildInjuryRecord) => INJURY_SEVERITY_LABEL[r.severity] },
    { header: "How It Happened", accessor: (r: ChildInjuryRecord) => r.how_it_happened },
    { header: "Account Consistent", accessor: (r: ChildInjuryRecord) => r.child_account_consistent ? "Yes" : "No" },
    { header: "Witnessed", accessor: (r: ChildInjuryRecord) => r.witnessed ? "Yes" : "No" },
    { header: "Witnesses", accessor: (r: ChildInjuryRecord) => r.witnesses.map((w) => getStaffName(w)).join("; ") },
    { header: "First Aid Given", accessor: (r: ChildInjuryRecord) => r.first_aid_given },
    { header: "Body Map Photo", accessor: (r: ChildInjuryRecord) => r.photographed_to_body_map ? "Yes" : "No" },
    { header: "GP Required", accessor: (r: ChildInjuryRecord) => r.gp_required ? "Yes" : "No" },
    { header: "GP Attended", accessor: (r: ChildInjuryRecord) => r.gp_attended ? "Yes" : "No" },
    { header: "Parents Informed", accessor: (r: ChildInjuryRecord) => r.parents_informed ? `Yes (${r.parents_informed_time})` : "No" },
    { header: "SW Informed", accessor: (r: ChildInjuryRecord) => r.social_worker_informed ? "Yes" : "No" },
    { header: "Staff On Duty", accessor: (r: ChildInjuryRecord) => r.staff_on_duty.map((s) => getStaffName(s)).join("; ") },
    { header: "Recorded By", accessor: (r: ChildInjuryRecord) => getStaffName(r.recorded_by) },
    { header: "Safeguarding Flag", accessor: (r: ChildInjuryRecord) => r.safeguarding_flag ? "Yes" : "No" },
    { header: "Notes", accessor: (r: ChildInjuryRecord) => r.notes },
  ];

  /* ── render ──────────────────────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <PageShell title="Child Injuries Log" subtitle="Quality Standard 7 (Health) · Children's Homes Regulations 2015, Reg 22">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Child Injuries Log"
      subtitle="Quality Standard 7 (Health) · Children's Homes Regulations 2015, Reg 22"
      ariaContext={{ pageTitle: "Child Injuries Log", sourceType: "incident" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Child Injuries Log" />
          <ExportButton data={filtered} columns={exportCols} filename="child-injuries-log" />
          <AriaStudioQuickActionButton context={{ record_type: "incident", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        {/* ── stat strip ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "This Week", value: thisWeekCount, icon: Activity, clr: "text-blue-600" },
            { label: "Required Medical", value: requiredMedicalCount, icon: Stethoscope, clr: "text-red-600" },
            { label: "Safeguarding Flagged", value: safeguardingFlaggedCount, icon: ShieldAlert, clr: "text-amber-600" },
            { label: "Most Common Area", value: mostCommonLocation, icon: MapPin, clr: "text-purple-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── safeguarding alert ───────────────────────────────────────────── */}
        {safeguardingFlaggedCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">{safeguardingFlaggedCount} injury / injuries flagged for safeguarding review</p>
              <p className="text-amber-700">Where a child&apos;s account is inconsistent or pattern of injury raises concern, RM must review and consider referral. Linked to behaviour log and contextual safeguarding entries.</p>
            </div>
          </div>
        )}

        {/* ── medical alert ────────────────────────────────────────────────── */}
        {requiredMedicalCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">{requiredMedicalCount} injury / injuries required medical attention</p>
              <p className="text-red-700">Cross-check entries with the Accident Book and GP correspondence. Notify placing authority within 24 hrs (Reg 40).</p>
            </div>
          </div>
        )}

        {/* ── body map link ────────────────────────────────────────────────── */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-start gap-2">
          <Camera className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="font-semibold text-blue-800">Body Map Integration</p>
            <p className="text-blue-700">All injuries should be marked on the child&apos;s body map. <a href="/body-map" className="underline font-medium">Open Body Map →</a></p>
          </div>
        </div>

        {/* ── filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search location, child, description…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {yps.map((y) => (<SelectItem key={y} value={y}>{getYPName(y)}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(CHILD_INJURY_TYPE_LABEL).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              {Object.entries(INJURY_SEVERITY_LABEL).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="severity">By Severity</SelectItem>
              <SelectItem value="yp">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── records ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expandedId === r.id;
            return (
              <Card
                key={r.id}
                className={cn(
                  "border-l-4",
                  BORDER_SEV[r.severity],
                  r.safeguarding_flag && "ring-1 ring-amber-300",
                )}
              >
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.child_id)}
                        <Badge variant="outline" className={TYPE_CLR[r.injury_type]}>{CHILD_INJURY_TYPE_LABEL[r.injury_type]}</Badge>
                        <Badge variant="outline" className={SEVERITY_CLR[r.severity]}>{INJURY_SEVERITY_LABEL[r.severity]}</Badge>
                        {r.safeguarding_flag && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                            <ShieldAlert className="h-3 w-3 mr-1" /> Safeguarding Review
                          </Badge>
                        )}
                        {!r.child_account_consistent && (
                          <Badge variant="outline" className="bg-orange-100 text-orange-800">
                            Account Inconsistent
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.body_location} · {r.date} at {r.time}
                      </p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* concern banner */}
                    {(r.safeguarding_flag || !r.child_account_consistent) && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="font-semibold text-amber-800 flex items-center gap-1">
                          <ShieldAlert className="h-4 w-4" /> Concerns to review
                        </p>
                        <ul className="list-disc list-inside text-amber-700 text-xs mt-1 space-y-0.5">
                          {!r.child_account_consistent && <li>Child&apos;s account is not consistent with the injury observed.</li>}
                          {r.safeguarding_flag && <li>Flagged for safeguarding review by RM. Linked to contextual safeguarding considerations.</li>}
                          {r.social_worker_informed && <li>Social Worker has been informed.</li>}
                        </ul>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium mb-1">How It Happened</p>
                        <p className="text-muted-foreground">{r.how_it_happened}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1 flex items-center gap-1"><Bandage className="h-4 w-4" /> First Aid Given</p>
                        <p className="text-muted-foreground">{r.first_aid_given}</p>
                      </div>
                    </div>

                    {/* witness / consistency strip */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs flex items-center gap-1"><Eye className="h-3 w-3" /> Witnessed</p>
                        <p className="text-xs text-muted-foreground">{r.witnessed ? "Yes" : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Account Consistent</p>
                        <p className="text-xs text-muted-foreground">{r.child_account_consistent ? "Yes" : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">GP Required</p>
                        <p className="text-xs text-muted-foreground">{r.gp_required ? (r.gp_attended ? "Yes — Attended" : "Yes — Pending") : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">SW Informed</p>
                        <p className="text-xs text-muted-foreground">{r.social_worker_informed ? "Yes" : "No"}</p>
                      </div>
                    </div>

                    {/* tags */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {r.photographed_to_body_map && (
                        <Badge variant="outline" className="bg-blue-50">
                          <Camera className="h-3 w-3 mr-1" /> Marked on Body Map
                        </Badge>
                      )}
                      {r.parents_informed && (
                        <Badge variant="outline" className="bg-green-50">
                          Parents informed {r.parents_informed_time && `(${r.parents_informed_time})`}
                        </Badge>
                      )}
                      {r.witnesses.length > 0 && (
                        <span className="text-muted-foreground">
                          Witnesses: {r.witnesses.map((w) => getStaffName(w)).join(", ")}
                        </span>
                      )}
                    </div>

                    {/* notes */}
                    {r.notes && (
                      <div>
                        <p className="font-medium mb-1">Notes</p>
                        <p className="text-muted-foreground">{r.notes}</p>
                      </div>
                    )}

                    {/* footer */}
                    <div className="flex flex-wrap justify-between items-center pt-2 border-t text-xs text-muted-foreground gap-2">
                      <span>Recorded by: {getStaffName(r.recorded_by)}</span>
                      <span>On duty: {r.staff_on_duty.map((s) => getStaffName(s)).join(", ")}</span>
                      <a href="/body-map" className="text-blue-600 hover:underline">View body map →</a>
                    </div>

                    {/* smart link panel */}
                    <SmartLinkPanel sourceType="child_injury" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── regulatory note ────────────────────────────────────────────── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Children&apos;s Homes (England) Regulations 2015, Reg 22 — duty to keep records of any accident or injury to a child. Quality Standard 7 (Health and well-being) — children must receive timely first aid, and the home must monitor patterns of injury. This log captures minor injuries (bruises, scrapes, falls, sport-related) and is distinct from the Accident Book (workplace H&amp;S record, RIDDOR), Incident Log (significant events) and Body Map (visual injury record). Any injury that is unexplained, inconsistent with account, or part of a pattern must be reviewed by the Registered Manager and may trigger a safeguarding referral under Working Together to Safeguard Children 2018. Records retained until the child&apos;s 25th birthday (or 75 years for looked-after children, per Reg 37).</p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Health"
        category="health"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Child Injuries Log — bruises, marks, cuts, burns, injury location, body map, cause, explanation, medical attention, safeguarding review, police referral, Reg 40 trigger, Annex A"
        recordType="incident"
        className="mt-6"
      />
    </PageShell>
  );
}

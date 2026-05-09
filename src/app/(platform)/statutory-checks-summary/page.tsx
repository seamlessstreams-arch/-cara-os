"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  ShieldCheck, AlertTriangle, Clock, CheckCircle2, FileText, Users,
  Calendar, Eye, Flame, Building2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useStatutoryCheckRecords } from "@/hooks/use-statutory-check-records";
import type {
  StatutoryCheckRecord,
  StatutoryCheckComplianceStatus,
  StatutoryCheckCategory,
} from "@/types/extended";
import {
  STATUTORY_CHECK_COMPLIANCE_STATUS_LABEL,
  STATUTORY_CHECK_CATEGORY_LABEL,
  STATUTORY_CHECK_FREQUENCY_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local config (colours / icons not serializable) ────────────────────── */

const STATUS_CLR: Record<StatutoryCheckComplianceStatus, string> = {
  compliant: "bg-green-100 text-green-800",
  due_soon: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800",
  in_progress: "bg-blue-100 text-blue-800",
};

const STATUS_BORDER: Record<StatutoryCheckComplianceStatus, string> = {
  compliant: "border-green-400 bg-green-50",
  due_soon: "border-amber-400 bg-amber-50",
  overdue: "border-red-500 bg-red-50",
  in_progress: "border-blue-400 bg-blue-50",
};

const CATEGORY_ICON: Record<StatutoryCheckCategory, React.ComponentType<{ className?: string }>> = {
  per_child: Users,
  home_wide: Building2,
  workforce: ShieldCheck,
  environmental: Flame,
  financial: FileText,
};

const CATEGORY_CLR: Record<StatutoryCheckCategory, string> = {
  per_child: "bg-purple-100 text-purple-800",
  home_wide: "bg-blue-100 text-blue-800",
  workforce: "bg-teal-100 text-teal-800",
  environmental: "bg-orange-100 text-orange-800",
  financial: "bg-slate-100 text-slate-800",
};

/* ── component ─────────────────────────────────────────────────────────────── */

export default function StatutoryChecksSummaryPage() {
  const { data: records = [], isLoading } = useStatutoryCheckRecords();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const filtered = useMemo(() => {
    let out = [...records];
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(r =>
        r.check_name.toLowerCase().includes(s) ||
        r.regulatory_basis.toLowerCase().includes(s) ||
        r.evidence_location.toLowerCase().includes(s) ||
        r.summary.toLowerCase().includes(s)
      );
    }
    if (statusFilter !== "all") out = out.filter(r => r.compliance_status === statusFilter);
    if (categoryFilter !== "all") out = out.filter(r => r.category === categoryFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "name": return a.check_name.localeCompare(b.check_name);
        case "due": return a.next_due_date.localeCompare(b.next_due_date);
        case "frequency": return a.frequency.localeCompare(b.frequency);
        case "category": return a.category.localeCompare(b.category);
        default: {
          const ord: StatutoryCheckComplianceStatus[] = ["overdue", "due_soon", "in_progress", "compliant"];
          return ord.indexOf(a.compliance_status) - ord.indexOf(b.compliance_status);
        }
      }
    });
    return out;
  }, [records, search, statusFilter, categoryFilter, sortBy]);

  const totalChecks = records.length;
  const compliantCount = records.filter(r => r.compliance_status === "compliant").length;
  const compliantPct = totalChecks > 0 ? Math.round((compliantCount / totalChecks) * 100) : 0;
  const dueSoonCount = records.filter(r => {
    const days = Math.ceil((new Date(r.next_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 30;
  }).length;
  const overdueCount = records.filter(r => r.compliance_status === "overdue").length;

  const exportCols: ExportColumn<StatutoryCheckRecord>[] = useMemo(() => [
    { header: "Check Name", accessor: (r: StatutoryCheckRecord) => r.check_name },
    { header: "Regulatory Basis", accessor: (r: StatutoryCheckRecord) => r.regulatory_basis },
    { header: "Category", accessor: (r: StatutoryCheckRecord) => STATUTORY_CHECK_CATEGORY_LABEL[r.category] },
    { header: "Frequency", accessor: (r: StatutoryCheckRecord) => STATUTORY_CHECK_FREQUENCY_LABEL[r.frequency] },
    { header: "Last Completed", accessor: (r: StatutoryCheckRecord) => r.last_completed_date },
    { header: "Next Due", accessor: (r: StatutoryCheckRecord) => r.next_due_date },
    { header: "Compliance Status", accessor: (r: StatutoryCheckRecord) => STATUTORY_CHECK_COMPLIANCE_STATUS_LABEL[r.compliance_status] },
    { header: "Responsible Owner", accessor: (r: StatutoryCheckRecord) => getStaffName(r.responsible_owner) },
    { header: "Evidence Location", accessor: (r: StatutoryCheckRecord) => r.evidence_location },
    { header: "Children Covered", accessor: (r: StatutoryCheckRecord) => r.children_covered },
    { header: "External Reviewer", accessor: (r: StatutoryCheckRecord) => r.external_reviewer },
    { header: "Summary", accessor: (r: StatutoryCheckRecord) => r.summary },
    { header: "Recent Observation", accessor: (r: StatutoryCheckRecord) => r.recent_observation },
    { header: "Escalation Criteria", accessor: (r: StatutoryCheckRecord) => r.escalation_criteria },
  ], []);

  if (isLoading) {
    return (
      <PageShell title="Statutory Checks Summary" subtitle="Compliance overview at a glance — required by Quality Standard 13 and Reg 45">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Statutory Checks Summary"
      subtitle="Compliance overview at a glance — required by Quality Standard 13 and Reg 45"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={[
        <PrintButton key="p" title="Statutory Checks Summary" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="statutory-checks-summary" />,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* compliance overview banner */}
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-indigo-600 mt-0.5" />
          <div>
            <p className="font-semibold">A single-page compliance dashboard</p>
            <p className="text-xs mt-1">
              This page brings together every statutory and regulatory check the home is required to evidence — Reg 44 and Reg 45 reviews,
              statutory child-level reviews and visits, fire safety, water safety, training and records audits — so the manager and
              Responsible Individual can see compliance at a glance. Every item links to the page where the underlying evidence is held;
              no information is duplicated. Required by Quality Standard 13 (leadership and management) and Reg 45.
            </p>
          </div>
        </div>

        {/* overdue alert */}
        {overdueCount > 0 && (
          <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 text-sm text-red-900 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">{overdueCount} statutory check{overdueCount === 1 ? " is" : "s are"} overdue</p>
              <p className="text-xs mt-1">
                Overdue items must be remediated and the cause analysed in the next Reg 45 review.
                Where statutory windows have lapsed, escalation to the Responsible Individual is required immediately.
              </p>
            </div>
          </div>
        )}

        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Checks Tracked", value: totalChecks, icon: ShieldCheck, colour: "text-indigo-600" },
            { label: "Compliant", value: `${compliantPct}%`, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Due Within 30 Days", value: dueSoonCount, icon: Clock, colour: "text-amber-600" },
            { label: "Overdue", value: overdueCount, icon: AlertTriangle, colour: overdueCount > 0 ? "text-red-600" : "text-slate-400" },
          ].map(s => (
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

        {/* filters / sort */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Check name, regulation, evidence…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="w-44">
                <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {(Object.entries(STATUTORY_CHECK_COMPLIANCE_STATUS_LABEL) as [StatutoryCheckComplianceStatus, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {(Object.entries(STATUTORY_CHECK_CATEGORY_LABEL) as [StatutoryCheckCategory, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">Compliance priority</SelectItem>
                    <SelectItem value="due">Next due date</SelectItem>
                    <SelectItem value="name">Check name</SelectItem>
                    <SelectItem value="frequency">Frequency</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* expandable cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expandedId === r.id;
            const CategoryIcon = CATEGORY_ICON[r.category];
            const isOverdue = r.compliance_status === "overdue";
            return (
              <Card
                key={r.id}
                className={cn(
                  "border-l-4",
                  STATUS_BORDER[r.compliance_status],
                  isOverdue && "ring-2 ring-red-200 shadow-sm"
                )}
              >
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-wrap flex-1 min-w-0">
                        <CategoryIcon className="h-5 w-5 text-slate-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base">{r.check_name}</CardTitle>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            <Badge className={cn("text-xs", STATUS_CLR[r.compliance_status])}>{STATUTORY_CHECK_COMPLIANCE_STATUS_LABEL[r.compliance_status]}</Badge>
                            <Badge variant="outline" className="text-xs">{r.regulatory_basis}</Badge>
                            <Badge className={cn("text-xs", CATEGORY_CLR[r.category])}>{STATUTORY_CHECK_CATEGORY_LABEL[r.category]}</Badge>
                            <Badge variant="outline" className="text-xs">{STATUTORY_CHECK_FREQUENCY_LABEL[r.frequency]}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Next due</p>
                          <p className={cn("text-xs font-semibold", isOverdue ? "text-red-700" : "text-slate-700")}>{r.next_due_date}</p>
                        </div>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-4 pt-0">
                    {/* summary */}
                    <p className="text-sm text-slate-700">{r.summary}</p>

                    {/* key facts grid */}
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" />Schedule</p>
                        <ul className="text-xs space-y-0.5">
                          <li><span className="text-muted-foreground">Frequency:</span> <strong>{STATUTORY_CHECK_FREQUENCY_LABEL[r.frequency]}</strong></li>
                          <li><span className="text-muted-foreground">Last completed:</span> <strong>{r.last_completed_date}</strong></li>
                          <li><span className="text-muted-foreground">Next due:</span> <strong className={isOverdue ? "text-red-700" : ""}>{r.next_due_date}</strong></li>
                          <li><span className="text-muted-foreground">Children covered:</span> <strong>{r.children_covered}</strong></li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1"><Users className="h-3 w-3" />Ownership</p>
                        <ul className="text-xs space-y-0.5">
                          <li><span className="text-muted-foreground">Responsible owner:</span> <strong>{getStaffName(r.responsible_owner)}</strong></li>
                          <li><span className="text-muted-foreground">External reviewer:</span> <strong>{r.external_reviewer || "—"}</strong></li>
                          <li><span className="text-muted-foreground">Evidence held in:</span> <strong>{r.evidence_location}</strong></li>
                          <li><span className="text-muted-foreground">Regulation:</span> <strong>{r.regulatory_basis}</strong></li>
                        </ul>
                      </div>
                    </div>

                    {/* recent observation */}
                    <div className={cn(
                      "rounded-lg p-3 border",
                      isOverdue ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
                    )}>
                      <p className={cn(
                        "text-xs font-semibold mb-1 flex items-center gap-1",
                        isOverdue ? "text-red-800" : "text-blue-800"
                      )}>
                        <Eye className="h-3 w-3" />Most recent observation
                      </p>
                      <p className={cn("text-sm", isOverdue ? "text-red-900" : "text-blue-900")}>
                        {r.recent_observation}
                      </p>
                    </div>

                    {/* escalation criteria */}
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />Escalation criteria
                      </p>
                      <p className="text-sm text-amber-900">{r.escalation_criteria}</p>
                    </div>

                    {/* meta */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Owner: <strong>{getStaffName(r.responsible_owner)}</strong></span>
                      <span>Evidence: <strong>{r.evidence_location}</strong></span>
                      <span>Last completed: <strong>{r.last_completed_date}</strong></span>
                      <span>Next due: <strong>{r.next_due_date}</strong></span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No statutory checks match your filters.
              </CardContent>
            </Card>
          )}
        </div>

        {/* regulatory note */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory Framework</p>
          <p>
            Children&apos;s Homes (England) Regulations 2015 — Reg 44 (independent person visits, monthly), Reg 45 (six-monthly review of quality of care),
            Reg 22 (records of children) and Reg 36 (other records to be kept) require structured monitoring and audit. Quality Standard 13 (leadership
            and management) requires leaders to have effective oversight of compliance. Care Planning, Placement and Case Review (England) Regulations 2010
            set the cadence of statutory LAC reviews and visits. The Children and Families Act 2014 governs EHCP review timescales. Health and safety
            checks are governed by the Regulatory Reform (Fire Safety) Order 2005, ACOP L8 (Legionella) and the Electricity at Work Regulations 1989.
            Workforce checks (DBS, mandatory training) are required under Reg 32 and Schedule 2. This summary surfaces the underlying records held
            elsewhere on the platform; it does not duplicate them.
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}

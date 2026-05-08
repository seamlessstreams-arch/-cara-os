"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown, ChevronUp, ArrowUpDown,
  Wrench, Flame, Zap, Shield, Droplets, Bug, Home, TreePine, Cable, ArrowUpFromLine,
  CheckCircle, AlertTriangle, Clock, Calendar, FileText, PoundSterling, Loader2,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useMaintenanceScheduleItems } from "@/hooks/use-maintenance-schedule-items";
import type { MaintenanceScheduleItem, MaintenanceScheduleCategory, MaintenanceComplianceStatus, MaintenanceDefect } from "@/types/extended";
import { MAINTENANCE_SCHEDULE_CATEGORY_LABEL, MAINTENANCE_FREQUENCY_LABEL, MAINTENANCE_COMPLIANCE_STATUS_LABEL } from "@/types/extended";

/* ── UI metadata ──────────────────────────────────────────────────────── */

const CATEGORY_ICON: Record<MaintenanceScheduleCategory, typeof Wrench> = {
  heating_boilers: Flame,
  electrical: Zap,
  gas_safety: Flame,
  fire_safety: Shield,
  water_hygiene: Droplets,
  pest_control: Bug,
  roof_guttering: Home,
  windows_doors: Home,
  external_grounds: TreePine,
  plumbing: Droplets,
  pat_testing: Cable,
  lifts_access: ArrowUpFromLine,
};

const STATUS_COLOUR: Record<MaintenanceComplianceStatus, string> = {
  in_date: "bg-green-100 text-green-800",
  due_now: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800",
  booked: "bg-blue-100 text-blue-800",
};

const STATUS_ICON: Record<MaintenanceComplianceStatus, typeof CheckCircle> = {
  in_date: CheckCircle,
  due_now: Clock,
  overdue: AlertTriangle,
  booked: Calendar,
};

const CATEGORIES: MaintenanceScheduleCategory[] = [
  "heating_boilers", "electrical", "gas_safety", "fire_safety",
  "water_hygiene", "pest_control", "roof_guttering", "windows_doors",
  "external_grounds", "plumbing", "pat_testing", "lifts_access",
];

export default function MaintenanceSchedulePage() {
  const { data: res, isLoading } = useMaintenanceScheduleItems();
  const data: MaintenanceScheduleItem[] = res?.data ?? [];

  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("nextDue");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = useMemo(() => {
    let list = [...data];
    if (filterCategory !== "all") list = list.filter((m) => m.category === filterCategory);
    if (filterStatus !== "all") list = list.filter((m) => m.compliance_status === filterStatus);

    const statusOrder: Record<MaintenanceComplianceStatus, number> = {
      overdue: 0, due_now: 1, booked: 2, in_date: 3,
    };

    return list.sort((a, b) => {
      switch (sortBy) {
        case "nextDue": return a.next_due.localeCompare(b.next_due);
        case "status": return statusOrder[a.compliance_status] - statusOrder[b.compliance_status];
        case "category": return a.category.localeCompare(b.category);
        case "cost": return b.cost_annual - a.cost_annual;
        default: return 0;
      }
    });
  }, [data, filterCategory, filterStatus, sortBy]);

  const total = data.length;
  const inDateCount = data.filter((m) => m.compliance_status === "in_date" || m.compliance_status === "booked").length;
  const inDatePct = total > 0 ? Math.round((inDateCount / total) * 100) : 0;
  const due30 = data.filter((m) => {
    const due = new Date(m.next_due);
    const days = Math.floor((due.getTime() - today.getTime()) / 86400000);
    return days >= 0 && days <= 30 && m.compliance_status !== "overdue";
  }).length;
  const overdue = data.filter((m) => m.compliance_status === "overdue").length;
  const annualCost = data.reduce((sum, m) => sum + m.cost_annual, 0);

  const exportCols: ExportColumn<MaintenanceScheduleItem>[] = [
    { header: "Item", accessor: (r) => r.item_name },
    { header: "Category", accessor: (r) => MAINTENANCE_SCHEDULE_CATEGORY_LABEL[r.category] },
    { header: "Frequency", accessor: (r) => MAINTENANCE_FREQUENCY_LABEL[r.frequency] },
    { header: "Contractor", accessor: (r) => r.contractor },
    { header: "Last completed", accessor: (r) => r.last_completed },
    { header: "Certificate ref", accessor: (r) => r.last_certificate_ref },
    { header: "Next due", accessor: (r) => r.next_due },
    { header: "Status", accessor: (r) => MAINTENANCE_COMPLIANCE_STATUS_LABEL[r.compliance_status] },
    { header: "Booked date", accessor: (r) => r.booked_date },
    { header: "Owner", accessor: (r) => getStaffName(r.responsible_owner) },
    { header: "Annual cost", accessor: (r) => `£${r.cost_annual}` },
    { header: "Regulatory basis", accessor: (r) => r.regulatory_requirement },
    { header: "Notes", accessor: (r) => r.notes },
  ];

  if (isLoading) return <PageShell title="Maintenance Schedule" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Maintenance Schedule"
      subtitle="Planned maintenance — boilers, electrical, gas, fire safety, water hygiene, pest control. Quality Standard 25 evidence trail."
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="maintenance-schedule" />
          <PrintButton title="Maintenance Schedule" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Scheduled items</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", inDatePct >= 90 ? "text-green-600" : inDatePct >= 75 ? "text-amber-600" : "text-red-600")}>
            {inDatePct}%
          </p>
          <p className="text-xs text-muted-foreground">In date / booked</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", due30 > 0 ? "text-amber-600" : "text-green-600")}>{due30}</p>
          <p className="text-xs text-muted-foreground">Due next 30 days</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", overdue > 0 ? "text-red-600" : "text-green-600")}>{overdue}</p>
          <p className="text-xs text-muted-foreground">Overdue</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <Wrench className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          Planned maintenance schedule covering statutory and good-practice items. Indicative annual spend
          on contracted maintenance: <strong>£{annualCost.toLocaleString()}</strong>. Certificates and reports
          held in the Documents module; weekly fire alarm and monthly emergency-light flick tests are recorded
          in the in-house fire log.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{MAINTENANCE_SCHEDULE_CATEGORY_LABEL[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="in_date">In date</SelectItem>
            <SelectItem value="due_now">Due now</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nextDue">Next due (soonest)</SelectItem>
              <SelectItem value="status">Compliance status</SelectItem>
              <SelectItem value="category">Category A–Z</SelectItem>
              <SelectItem value="cost">Annual cost (high→low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((m) => {
          const isExpanded = expandedId === m.id;
          const Icon = CATEGORY_ICON[m.category];
          const StatusIcon = STATUS_ICON[m.compliance_status];
          const isAlert = m.compliance_status === "overdue" || m.compliance_status === "due_now";

          return (
            <div
              key={m.id}
              className={cn(
                "rounded-xl border bg-white overflow-hidden",
                m.compliance_status === "overdue" && "border-l-4 border-l-red-500",
                m.compliance_status === "due_now" && "border-l-4 border-l-amber-500",
              )}
            >
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : m.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Icon className={cn("h-5 w-5 shrink-0", isAlert ? "text-red-600" : "text-slate-600")} />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{m.item_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {MAINTENANCE_SCHEDULE_CATEGORY_LABEL[m.category]} &middot; {MAINTENANCE_FREQUENCY_LABEL[m.frequency]} &middot; Next due {m.next_due} &middot; Owner: {getStaffName(m.responsible_owner)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1", STATUS_COLOUR[m.compliance_status])}>
                    <StatusIcon className="h-3 w-3" />
                    {MAINTENANCE_COMPLIANCE_STATUS_LABEL[m.compliance_status]}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border space-y-1 text-sm">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Regulatory basis</p>
                      <p>{m.regulatory_requirement}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border space-y-1 text-sm">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Contractor</p>
                      <p className="font-medium">{m.contractor}</p>
                      <p className="text-xs text-muted-foreground">{m.contractor_contact}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Last completed</p>
                      <p className="font-medium">{m.last_completed || "—"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Certificate ref</p>
                      <p className="font-medium flex items-center justify-center gap-1">
                        <FileText className="h-3 w-3" />{m.last_certificate_ref || "—"}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Next due</p>
                      <p className="font-medium">{m.next_due}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-center text-sm">
                      <p className="text-xs text-muted-foreground">Annual cost</p>
                      <p className="font-medium flex items-center justify-center gap-1">
                        <PoundSterling className="h-3 w-3" />{m.cost_annual.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {m.booked_date && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                        <Calendar className="h-3 w-3 inline mr-1" />Booked
                      </p>
                      <p className="text-sm text-blue-900">Visit booked for {m.booked_date}</p>
                    </div>
                  )}

                  <div className="bg-white rounded-lg p-3 border text-sm">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes from last visit</p>
                    <p>{m.notes}</p>
                  </div>

                  {m.defects_history.length > 0 && (
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Defects history</p>
                      <div className="space-y-2">
                        {m.defects_history.map((d: MaintenanceDefect, i: number) => (
                          <div key={i} className="text-sm border-l-2 border-amber-400 pl-3">
                            <p className="font-medium">{d.date} — {d.defect}</p>
                            <p className="text-xs text-muted-foreground">Action: {d.action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Escalation contact</p>
                    <p className="text-sm text-amber-900">{m.escalation_contact}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600">
        <p className="font-semibold text-slate-800 mb-1">Regulatory framework</p>
        <p>
          Children&apos;s Homes (England) Regulations 2015 Quality Standard 25 (premises) requires the home is
          maintained to a standard appropriate for the care of children. Fire Safety Order 2005, Gas Safety
          (Installation and Use) Regulations 1998, Electricity at Work Regulations 1989, HSE ACoP L8 (Legionella)
          and BS 5839/5266/5306 set the technical baseline. Certificates retained for the duration of the
          home&apos;s registration; defect histories evidence responsive landlord behaviour during Ofsted inspection.
        </p>
      </div>
    </PageShell>
  );
}

"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Flame,
  CheckCircle,
  AlertTriangle,
  Clock,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  FireEquipmentCheck,
  FireEquipmentType,
  FireInspectionType,
  FireCheckResult,
  FireComplianceStatus,
} from "@/types/extended";
import {
  FIRE_EQUIPMENT_TYPE_LABEL,
  FIRE_INSPECTION_TYPE_LABEL,
  FIRE_CHECK_RESULT_LABEL,
  FIRE_COMPLIANCE_STATUS_LABEL,
} from "@/types/extended";
import { useFireEquipmentChecks } from "@/hooks/use-fire-equipment-checks";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const statusColour: Record<FireComplianceStatus, string> = {
  compliant: "bg-green-100 text-green-800",
  due_now: "bg-blue-100 text-blue-800",
  overdue: "bg-red-100 text-red-800",
  booked: "bg-amber-100 text-amber-800",
};

const exportCols: ExportColumn<FireEquipmentCheck>[] = [
  { header: "Type", accessor: (r: FireEquipmentCheck) => FIRE_EQUIPMENT_TYPE_LABEL[r.equipment_type] },
  { header: "Location", accessor: (r: FireEquipmentCheck) => r.location },
  { header: "Tag", accessor: (r: FireEquipmentCheck) => r.identifier_tag },
  { header: "Last Inspected", accessor: (r: FireEquipmentCheck) => r.last_inspected_date },
  { header: "Inspection Type", accessor: (r: FireEquipmentCheck) => FIRE_INSPECTION_TYPE_LABEL[r.inspection_type] },
  { header: "Result", accessor: (r: FireEquipmentCheck) => FIRE_CHECK_RESULT_LABEL[r.result] },
  { header: "Next Due", accessor: (r: FireEquipmentCheck) => r.next_inspection_due },
  { header: "Status", accessor: (r: FireEquipmentCheck) => FIRE_COMPLIANCE_STATUS_LABEL[r.compliance_status] },
];

export default function FireSafetyEquipmentChecksPage() {
  const { data: res, isLoading } = useFireEquipmentChecks();
  const records = res?.data ?? [];

  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("status");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterType !== "all") items = items.filter((c) => c.equipment_type === filterType);
    if (filterStatus !== "all") items = items.filter((c) => c.compliance_status === filterStatus);
    items.sort((a, b) => {
      switch (sortBy) {
        case "status":
          const ord: Record<FireComplianceStatus, number> = { overdue: 0, due_now: 1, booked: 2, compliant: 3 };
          return ord[a.compliance_status] - ord[b.compliance_status];
        case "date":
          return a.next_inspection_due.localeCompare(b.next_inspection_due);
        default:
          return 0;
      }
    });
    return items;
  }, [records, filterType, filterStatus, sortBy]);

  const total = records.length;
  const compliant = records.filter((c) => c.compliance_status === "compliant").length;
  const due = records.filter((c) => c.compliance_status === "due_now").length;
  const overdue = records.filter((c) => c.compliance_status === "overdue").length;

  if (isLoading) {
    return (
      <PageShell
        title="Fire Safety Equipment Checks"
        subtitle="Detailed inspection records — extinguishers, alarms, doors, lighting, and signage"
      >
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Fire Safety Equipment Checks"
      subtitle="Detailed inspection records — extinguishers, alarms, doors, lighting, and signage"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={records} columns={exportCols} filename="fire-safety-equipment-checks" />
          <PrintButton title="Fire Safety Equipment Checks" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Items</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{compliant}</p>
          <p className="text-xs text-muted-foreground">Compliant</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{due}</p>
          <p className="text-xs text-muted-foreground">Due Now</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", overdue > 0 ? "text-red-600" : "text-green-600")}>{overdue}</p>
          <p className="text-xs text-muted-foreground">Overdue</p>
        </div>
      </div>

      <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-6 flex items-start gap-2">
        <Flame className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
        <p className="text-sm text-red-800">
          Fire safety equipment is checked weekly (visual), monthly (test), quarterly (service), and annually
          (certified). Defects addressed same-day. All checks signed off and logged. Compliance is non-negotiable.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Equipment Types</SelectItem>
            <SelectItem value="fire_extinguisher">Fire Extinguisher</SelectItem>
            <SelectItem value="smoke_detector">Smoke Detector</SelectItem>
            <SelectItem value="heat_detector">Heat Detector</SelectItem>
            <SelectItem value="carbon_monoxide_detector">CO Detector</SelectItem>
            <SelectItem value="fire_alarm_panel">Alarm Panel</SelectItem>
            <SelectItem value="emergency_lighting">Emergency Lighting</SelectItem>
            <SelectItem value="fire_door">Fire Door</SelectItem>
            <SelectItem value="fire_blanket">Fire Blanket</SelectItem>
            <SelectItem value="fire_exit_signage">Exit Signage</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="compliant">Compliant</SelectItem>
            <SelectItem value="due_now">Due Now</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="booked">Booked</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="status">By Status</SelectItem>
              <SelectItem value="date">Earliest Due</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((c) => {
          const isExpanded = expandedId === c.id;

          return (
            <div key={c.id} className={cn("rounded-xl border bg-white overflow-hidden",
              c.compliance_status === "overdue" && "border-l-4 border-l-red-500"
            )}>
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Flame className="h-5 w-5 text-red-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{FIRE_EQUIPMENT_TYPE_LABEL[c.equipment_type]} — {c.location}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.identifier_tag} &middot; Last {c.last_inspected_date} &middot; {FIRE_INSPECTION_TYPE_LABEL[c.inspection_type]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColour[c.compliance_status])}>{FIRE_COMPLIANCE_STATUS_LABEL[c.compliance_status]}</span>
                  {c.result === "pass" ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-3 text-sm">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <div className="bg-white rounded-lg p-2 border">
                      <p className="text-xs text-muted-foreground">Inspector</p>
                      <p>{c.inspector.startsWith("staff_") ? getStaffName(c.inspector) : c.inspector}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                      <p className="text-xs text-muted-foreground">Result</p>
                      <p>{FIRE_CHECK_RESULT_LABEL[c.result]}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                      <p className="text-xs text-muted-foreground">Next Due</p>
                      <p>{c.next_inspection_due}</p>
                    </div>
                  </div>

                  {c.defect_noted && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Defect Noted</p>
                      <p>{c.defect_noted}</p>
                      <p className="text-xs text-blue-700 mt-1">Action: {c.action_taken}</p>
                    </div>
                  )}

                  {c.certificate_ref && <p className="text-xs text-muted-foreground">Certificate: {c.certificate_ref}</p>}
                  {c.last_battery_change_date && <p className="text-xs text-muted-foreground">Last battery: {c.last_battery_change_date}</p>}
                  {c.notes && <p className="text-xs italic">{c.notes}</p>}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Clock className="h-3 w-3 inline mr-1" />{FIRE_INSPECTION_TYPE_LABEL[c.inspection_type]}</span>
                    {c.external_contractor && <span>Contractor: {c.external_contractor}</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Fire equipment checks support Regulatory Reform (Fire Safety)
          Order 2005, BS 5306 (extinguishers), BS 5839 (alarms), BS 5266 (emergency lighting), and Quality
          Standard 25. Linked to Fire Risk Assessment, Fire Drills, and Emergency Evacuation Plan.
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

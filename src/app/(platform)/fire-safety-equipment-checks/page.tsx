"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
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
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FireEquipmentCheck {
  id: string;
  equipmentType: "Fire extinguisher" | "Smoke detector" | "Heat detector" | "Carbon monoxide detector" | "Fire alarm panel" | "Emergency lighting" | "Fire door" | "Fire blanket" | "Fire exit signage" | "Sprinkler";
  location: string;
  identifierTag: string;
  lastInspectedDate: string;
  inspectionType: "Weekly visual" | "Monthly test" | "Quarterly service" | "Annual certified" | "5-year hydraulic test";
  inspector: string;
  externalContractor: string;
  result: "Pass" | "Pass with notes" | "Fail - repaired" | "Fail - replaced";
  defectNoted: string;
  actionTaken: string;
  certificateRef: string;
  nextInspectionDue: string;
  complianceStatus: "Compliant" | "Due now" | "Overdue" | "Booked";
  lastBatteryChangeDate: string;
  notes: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: FireEquipmentCheck[] = [
  { id: "fe-001", equipmentType: "Fire extinguisher", location: "Kitchen", identifierTag: "EXT-K-01", lastInspectedDate: d(-30), inspectionType: "Annual certified", inspector: "Fire Safety Services Ltd", externalContractor: "Fire Safety Services Ltd", result: "Pass", defectNoted: "", actionTaken: "Standard service", certificateRef: "FSS-2025-001", nextInspectionDue: d(335), complianceStatus: "Compliant", lastBatteryChangeDate: "", notes: "CO2 type — kitchen appropriate" },
  { id: "fe-002", equipmentType: "Fire extinguisher", location: "Hallway", identifierTag: "EXT-H-01", lastInspectedDate: d(-30), inspectionType: "Annual certified", inspector: "Fire Safety Services Ltd", externalContractor: "Fire Safety Services Ltd", result: "Pass", defectNoted: "", actionTaken: "Standard service", certificateRef: "FSS-2025-002", nextInspectionDue: d(335), complianceStatus: "Compliant", lastBatteryChangeDate: "", notes: "Foam type — corridor placement" },
  { id: "fe-003", equipmentType: "Smoke detector", location: "Kitchen ceiling", identifierTag: "SD-K-01", lastInspectedDate: d(-7), inspectionType: "Weekly visual", inspector: "staff_ryan", externalContractor: "", result: "Pass", defectNoted: "", actionTaken: "Test button cleared", certificateRef: "", nextInspectionDue: d(0), complianceStatus: "Due now", lastBatteryChangeDate: d(-180), notes: "Weekly check — within tolerance" },
  { id: "fe-004", equipmentType: "Smoke detector", location: "Lounge ceiling", identifierTag: "SD-L-01", lastInspectedDate: d(-7), inspectionType: "Weekly visual", inspector: "staff_ryan", externalContractor: "", result: "Pass", defectNoted: "", actionTaken: "", certificateRef: "", nextInspectionDue: d(0), complianceStatus: "Due now", lastBatteryChangeDate: d(-180), notes: "" },
  { id: "fe-005", equipmentType: "Smoke detector", location: "Hallway ground floor", identifierTag: "SD-HG-01", lastInspectedDate: d(-7), inspectionType: "Weekly visual", inspector: "staff_ryan", externalContractor: "", result: "Pass", defectNoted: "", actionTaken: "", certificateRef: "", nextInspectionDue: d(0), complianceStatus: "Due now", lastBatteryChangeDate: d(-180), notes: "" },
  { id: "fe-006", equipmentType: "Heat detector", location: "Boiler cupboard", identifierTag: "HD-B-01", lastInspectedDate: d(-30), inspectionType: "Monthly test", inspector: "staff_darren", externalContractor: "", result: "Pass", defectNoted: "", actionTaken: "Tested with simulator", certificateRef: "", nextInspectionDue: d(0), complianceStatus: "Due now", lastBatteryChangeDate: d(-180), notes: "Heat detector appropriate for boiler space" },
  { id: "fe-007", equipmentType: "Carbon monoxide detector", location: "Boiler cupboard", identifierTag: "CO-B-01", lastInspectedDate: d(-30), inspectionType: "Monthly test", inspector: "staff_darren", externalContractor: "", result: "Pass", defectNoted: "", actionTaken: "", certificateRef: "", nextInspectionDue: d(0), complianceStatus: "Due now", lastBatteryChangeDate: d(-90), notes: "" },
  { id: "fe-008", equipmentType: "Fire alarm panel", location: "Hallway main", identifierTag: "PANEL-01", lastInspectedDate: d(-90), inspectionType: "Quarterly service", inspector: "Fire Safety Services Ltd", externalContractor: "Fire Safety Services Ltd", result: "Pass", defectNoted: "", actionTaken: "All zones tested", certificateRef: "FSS-2025-Q4-PANEL", nextInspectionDue: d(0), complianceStatus: "Due now", lastBatteryChangeDate: "", notes: "Backup battery within spec" },
  { id: "fe-009", equipmentType: "Emergency lighting", location: "Stairs and exits", identifierTag: "EML-01", lastInspectedDate: d(-180), inspectionType: "Annual certified", inspector: "Electrical Contractor", externalContractor: "Pat Test Pro Ltd", result: "Pass", defectNoted: "", actionTaken: "3-hour duration test passed", certificateRef: "PT-2024-EML", nextInspectionDue: d(185), complianceStatus: "Compliant", lastBatteryChangeDate: "", notes: "" },
  { id: "fe-010", equipmentType: "Fire door", location: "Kitchen door", identifierTag: "FD-K-01", lastInspectedDate: d(-90), inspectionType: "Quarterly service", inspector: "staff_darren", externalContractor: "", result: "Pass", defectNoted: "", actionTaken: "Self-closer tested", certificateRef: "", nextInspectionDue: d(0), complianceStatus: "Due now", lastBatteryChangeDate: "", notes: "FD30 rated; intumescent strips intact" },
  { id: "fe-011", equipmentType: "Fire door", location: "Children's bedrooms", identifierTag: "FD-BR-01", lastInspectedDate: d(-90), inspectionType: "Quarterly service", inspector: "staff_darren", externalContractor: "", result: "Pass with notes", defectNoted: "Intumescent strip lifting on Casey's door — minor", actionTaken: "Repaired same day", certificateRef: "", nextInspectionDue: d(0), complianceStatus: "Due now", lastBatteryChangeDate: "", notes: "Quickly addressed" },
  { id: "fe-012", equipmentType: "Fire blanket", location: "Kitchen", identifierTag: "FB-K-01", lastInspectedDate: d(-30), inspectionType: "Monthly test", inspector: "staff_anna", externalContractor: "", result: "Pass", defectNoted: "", actionTaken: "Visual check — clean and accessible", certificateRef: "", nextInspectionDue: d(0), complianceStatus: "Due now", lastBatteryChangeDate: "", notes: "" },
  { id: "fe-013", equipmentType: "Fire exit signage", location: "All exits + stairs", identifierTag: "SIG-ALL", lastInspectedDate: d(-30), inspectionType: "Monthly test", inspector: "staff_darren", externalContractor: "", result: "Pass", defectNoted: "", actionTaken: "All visible and unobstructed", certificateRef: "", nextInspectionDue: d(0), complianceStatus: "Due now", lastBatteryChangeDate: "", notes: "Photoluminescent signage" },
  { id: "fe-014", equipmentType: "Smoke detector", location: "Casey's bedroom", identifierTag: "SD-C-01", lastInspectedDate: d(-7), inspectionType: "Weekly visual", inspector: "staff_ryan", externalContractor: "", result: "Pass", defectNoted: "", actionTaken: "", certificateRef: "", nextInspectionDue: d(0), complianceStatus: "Due now", lastBatteryChangeDate: d(-180), notes: "Sensory-aware: detector positioned to minimise visual stim while maintaining coverage" },
];

const statusColour: Record<string, string> = {
  Compliant: "bg-green-100 text-green-800",
  "Due now": "bg-blue-100 text-blue-800",
  Overdue: "bg-red-100 text-red-800",
  Booked: "bg-amber-100 text-amber-800",
};

const exportCols: ExportColumn<FireEquipmentCheck>[] = [
  { header: "Type", accessor: (r: FireEquipmentCheck) => r.equipmentType },
  { header: "Location", accessor: (r: FireEquipmentCheck) => r.location },
  { header: "Tag", accessor: (r: FireEquipmentCheck) => r.identifierTag },
  { header: "Last Inspected", accessor: (r: FireEquipmentCheck) => r.lastInspectedDate },
  { header: "Inspection Type", accessor: (r: FireEquipmentCheck) => r.inspectionType },
  { header: "Result", accessor: (r: FireEquipmentCheck) => r.result },
  { header: "Next Due", accessor: (r: FireEquipmentCheck) => r.nextInspectionDue },
  { header: "Status", accessor: (r: FireEquipmentCheck) => r.complianceStatus },
];

export default function FireSafetyEquipmentChecksPage() {
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("status");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterType !== "all") items = items.filter((c) => c.equipmentType === filterType);
    if (filterStatus !== "all") items = items.filter((c) => c.complianceStatus === filterStatus);
    items.sort((a, b) => {
      switch (sortBy) {
        case "status":
          const ord = { Overdue: 0, "Due now": 1, Booked: 2, Compliant: 3 };
          return ord[a.complianceStatus] - ord[b.complianceStatus];
        case "date":
          return a.nextInspectionDue.localeCompare(b.nextInspectionDue);
        default:
          return 0;
      }
    });
    return items;
  }, [filterType, filterStatus, sortBy]);

  const total = data.length;
  const compliant = data.filter((c) => c.complianceStatus === "Compliant").length;
  const due = data.filter((c) => c.complianceStatus === "Due now").length;
  const overdue = data.filter((c) => c.complianceStatus === "Overdue").length;

  return (
    <PageShell
      title="Fire Safety Equipment Checks"
      subtitle="Detailed inspection records — extinguishers, alarms, doors, lighting, and signage"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="fire-safety-equipment-checks" />
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
            <SelectItem value="Fire extinguisher">Fire Extinguisher</SelectItem>
            <SelectItem value="Smoke detector">Smoke Detector</SelectItem>
            <SelectItem value="Heat detector">Heat Detector</SelectItem>
            <SelectItem value="Carbon monoxide detector">CO Detector</SelectItem>
            <SelectItem value="Fire alarm panel">Alarm Panel</SelectItem>
            <SelectItem value="Emergency lighting">Emergency Lighting</SelectItem>
            <SelectItem value="Fire door">Fire Door</SelectItem>
            <SelectItem value="Fire blanket">Fire Blanket</SelectItem>
            <SelectItem value="Fire exit signage">Exit Signage</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Compliant">Compliant</SelectItem>
            <SelectItem value="Due now">Due Now</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
            <SelectItem value="Booked">Booked</SelectItem>
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
              c.complianceStatus === "Overdue" && "border-l-4 border-l-red-500"
            )}>
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Flame className="h-5 w-5 text-red-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{c.equipmentType} — {c.location}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.identifierTag} &middot; Last {c.lastInspectedDate} &middot; {c.inspectionType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColour[c.complianceStatus])}>{c.complianceStatus}</span>
                  {c.result === "Pass" ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
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
                      <p>{c.result}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                      <p className="text-xs text-muted-foreground">Next Due</p>
                      <p>{c.nextInspectionDue}</p>
                    </div>
                  </div>

                  {c.defectNoted && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">Defect Noted</p>
                      <p>{c.defectNoted}</p>
                      <p className="text-xs text-blue-700 mt-1">Action: {c.actionTaken}</p>
                    </div>
                  )}

                  {c.certificateRef && <p className="text-xs text-muted-foreground">Certificate: {c.certificateRef}</p>}
                  {c.lastBatteryChangeDate && <p className="text-xs text-muted-foreground">Last battery: {c.lastBatteryChangeDate}</p>}
                  {c.notes && <p className="text-xs italic">{c.notes}</p>}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Clock className="h-3 w-3 inline mr-1" />{c.inspectionType}</span>
                    {c.externalContractor && <span>Contractor: {c.externalContractor}</span>}
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
    </PageShell>
  );
}

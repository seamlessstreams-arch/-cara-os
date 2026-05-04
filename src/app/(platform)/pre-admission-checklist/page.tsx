"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  FileCheck,
  Home,
  Shield,
  Users,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── types ─────────────────────────��────────────────���────────────────────────
interface ChecklistItem {
  task: string;
  completed: boolean;
  completedDate?: string;
  completedBy?: string;
  notes?: string;
}

interface PreAdmissionChecklist {
  id: string;
  youngPerson: string;
  referralDate: string;
  targetAdmissionDate: string;
  socialWorker: string;
  localAuthority: string;
  status: "Not Started" | "In Progress" | "Complete" | "On Hold";
  assignedTo: string;
  impactAssessmentDone: boolean;
  matchingPanelDate?: string;
  items: ChecklistItem[];
  riskConsiderations: string[];
  specialRequirements: string[];
}

// ── seed data ────────────────────────────────────────────���──────────────────
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: PreAdmissionChecklist[] = [
  {
    id: "pac-001",
    youngPerson: "yp_alex",
    referralDate: d(-90),
    targetAdmissionDate: d(-80),
    socialWorker: "Sarah Mitchell — Riverside LA",
    localAuthority: "Riverside County Council",
    status: "Complete",
    assignedTo: "staff_darren",
    impactAssessmentDone: true,
    matchingPanelDate: d(-85),
    items: [
      { task: "Referral paperwork received and reviewed", completed: true, completedDate: d(-89), completedBy: "staff_darren" },
      { task: "Initial information sharing meeting with SW", completed: true, completedDate: d(-88), completedBy: "staff_darren" },
      { task: "Impact assessment completed (Reg 14)", completed: true, completedDate: d(-86), completedBy: "staff_darren" },
      { task: "Matching panel convened", completed: true, completedDate: d(-85), completedBy: "staff_darren" },
      { task: "Risk assessment reviewed and accepted", completed: true, completedDate: d(-84), completedBy: "staff_ryan" },
      { task: "Bedroom prepared and personalised", completed: true, completedDate: d(-82), completedBy: "staff_anna" },
      { task: "Welcome pack created", completed: true, completedDate: d(-82), completedBy: "staff_chervelle" },
      { task: "Existing children consulted about new admission", completed: true, completedDate: d(-83), completedBy: "staff_ryan" },
      { task: "Staff briefing completed", completed: true, completedDate: d(-81), completedBy: "staff_darren" },
      { task: "Introduction visit arranged", completed: true, completedDate: d(-81), completedBy: "staff_darren" },
      { task: "GP, dentist, optician registration initiated", completed: true, completedDate: d(-80), completedBy: "staff_anna" },
      { task: "Education provision confirmed", completed: true, completedDate: d(-80), completedBy: "staff_edward" },
      { task: "Medication requirements clarified", completed: true, completedDate: d(-82), completedBy: "staff_anna" },
      { task: "Delegated authority matrix agreed with SW", completed: true, completedDate: d(-81), completedBy: "staff_darren" },
      { task: "Placement plan drafted", completed: true, completedDate: d(-80), completedBy: "staff_darren" },
    ],
    riskConsiderations: [
      "History of placement disruption — additional support in first 6 weeks",
      "Peer conflict potential with existing resident — proactive matching work",
      "ADHD medication needs — pharmacy confirmed before admission",
    ],
    specialRequirements: [
      "Quiet introduction — not all staff present initially",
      "Familiar item from previous placement to be brought",
      "Evening admission preferred (avoids school-day disruption)",
    ],
  },
  {
    id: "pac-002",
    youngPerson: "yp_jordan",
    referralDate: d(-60),
    targetAdmissionDate: d(-50),
    socialWorker: "Tom Richards — Valley Borough",
    localAuthority: "Valley Borough Council",
    status: "Complete",
    assignedTo: "staff_darren",
    impactAssessmentDone: true,
    matchingPanelDate: d(-55),
    items: [
      { task: "Referral paperwork received and reviewed", completed: true, completedDate: d(-59), completedBy: "staff_darren" },
      { task: "Initial information sharing meeting with SW", completed: true, completedDate: d(-57), completedBy: "staff_darren" },
      { task: "Impact assessment completed (Reg 14)", completed: true, completedDate: d(-56), completedBy: "staff_darren" },
      { task: "Matching panel convened", completed: true, completedDate: d(-55), completedBy: "staff_darren" },
      { task: "Risk assessment reviewed and accepted", completed: true, completedDate: d(-54), completedBy: "staff_ryan" },
      { task: "Bedroom prepared and personalised", completed: true, completedDate: d(-52), completedBy: "staff_lackson" },
      { task: "Welcome pack created", completed: true, completedDate: d(-52), completedBy: "staff_mirela" },
      { task: "Existing children consulted about new admission", completed: true, completedDate: d(-53), completedBy: "staff_ryan" },
      { task: "Staff briefing completed", completed: true, completedDate: d(-51), completedBy: "staff_darren" },
      { task: "Introduction visit arranged", completed: true, completedDate: d(-51), completedBy: "staff_darren" },
      { task: "GP, dentist, optician registration initiated", completed: true, completedDate: d(-50), completedBy: "staff_anna" },
      { task: "Education provision confirmed", completed: true, completedDate: d(-50), completedBy: "staff_edward" },
      { task: "Medication requirements clarified", completed: true, completedDate: d(-52), completedBy: "staff_anna", notes: "No current medication" },
      { task: "Delegated authority matrix agreed with SW", completed: true, completedDate: d(-51), completedBy: "staff_darren" },
      { task: "Placement plan drafted", completed: true, completedDate: d(-50), completedBy: "staff_darren" },
    ],
    riskConsiderations: [
      "Missing from care history — location safety plan needed day one",
      "Peer exploitation concerns — contextual safeguarding mapped",
      "Mother in prison — complex contact arrangements",
    ],
    specialRequirements: [
      "Football kit purchased before arrival (known interest)",
      "Phone access maintained — friend connections important",
      "Afternoon admission to allow settling before bedtime",
    ],
  },
  {
    id: "pac-003",
    youngPerson: "yp_casey",
    referralDate: d(-45),
    targetAdmissionDate: d(-35),
    socialWorker: "Lisa Chen — Hillside LA",
    localAuthority: "Hillside County Council",
    status: "Complete",
    assignedTo: "staff_darren",
    impactAssessmentDone: true,
    matchingPanelDate: d(-40),
    items: [
      { task: "Referral paperwork received and reviewed", completed: true, completedDate: d(-44), completedBy: "staff_darren" },
      { task: "Initial information sharing meeting with SW", completed: true, completedDate: d(-43), completedBy: "staff_darren" },
      { task: "Impact assessment completed (Reg 14)", completed: true, completedDate: d(-41), completedBy: "staff_darren" },
      { task: "Matching panel convened", completed: true, completedDate: d(-40), completedBy: "staff_darren" },
      { task: "Risk assessment reviewed and accepted", completed: true, completedDate: d(-39), completedBy: "staff_ryan" },
      { task: "Bedroom prepared and personalised", completed: true, completedDate: d(-37), completedBy: "staff_anna", notes: "Sensory-friendly: low lighting, weighted blanket, minimal clutter" },
      { task: "Welcome pack created", completed: true, completedDate: d(-37), completedBy: "staff_chervelle", notes: "Visual/accessible format" },
      { task: "Existing children consulted about new admission", completed: true, completedDate: d(-38), completedBy: "staff_ryan" },
      { task: "Staff briefing completed", completed: true, completedDate: d(-36), completedBy: "staff_darren", notes: "ASD awareness refresher included" },
      { task: "Introduction visit arranged", completed: true, completedDate: d(-36), completedBy: "staff_darren", notes: "Two short visits rather than one long one" },
      { task: "GP, dentist, optician registration initiated", completed: true, completedDate: d(-35), completedBy: "staff_anna" },
      { task: "Education provision confirmed", completed: true, completedDate: d(-36), completedBy: "staff_edward", notes: "Specialist provision confirmed" },
      { task: "Medication requirements clarified", completed: true, completedDate: d(-37), completedBy: "staff_anna", notes: "Melatonin for sleep" },
      { task: "Delegated authority matrix agreed with SW", completed: true, completedDate: d(-36), completedBy: "staff_darren" },
      { task: "Placement plan drafted", completed: true, completedDate: d(-35), completedBy: "staff_darren" },
      { task: "Sensory profile obtained from previous placement", completed: true, completedDate: d(-38), completedBy: "staff_anna" },
      { task: "SALT recommendations obtained", completed: true, completedDate: d(-38), completedBy: "staff_anna" },
      { task: "Visual timetable prepared", completed: true, completedDate: d(-36), completedBy: "staff_anna" },
    ],
    riskConsiderations: [
      "Meltdowns during transitions — structured, predictable approach needed",
      "Food anxieties — familiar foods available from day one",
      "Noise sensitivity — ensure quiet admission process",
    ],
    specialRequirements: [
      "Sensory-friendly bedroom setup (low stimulation)",
      "Two introduction visits before actual admission",
      "Familiar transition object from previous placement",
      "Visual social story about Oak House prepared",
      "Staff trained in ASD-specific approaches before admission",
    ],
  },
];

// ── export columns ─────────────────────────���────────────────────────────────
const exportCols: ExportColumn<PreAdmissionChecklist>[] = [
  { header: "Young Person", accessor: (r: PreAdmissionChecklist) => getYPName(r.youngPerson) },
  { header: "Referral Date", accessor: (r: PreAdmissionChecklist) => r.referralDate },
  { header: "Target Admission", accessor: (r: PreAdmissionChecklist) => r.targetAdmissionDate },
  { header: "Status", accessor: (r: PreAdmissionChecklist) => r.status },
  { header: "Local Authority", accessor: (r: PreAdmissionChecklist) => r.localAuthority },
  { header: "Social Worker", accessor: (r: PreAdmissionChecklist) => r.socialWorker },
  { header: "Completion", accessor: (r: PreAdmissionChecklist) => `${r.items.filter((i) => i.completed).length}/${r.items.length}` },
  { header: "Assigned To", accessor: (r: PreAdmissionChecklist) => getStaffName(r.assignedTo) },
];

// ── component ───────────────────────────────────────────────────────────────
export default function PreAdmissionChecklistPage() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterStatus !== "all") items = items.filter((c) => c.status === filterStatus);

    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.referralDate.localeCompare(a.referralDate);
        case "completion":
          const pctA = a.items.filter((i) => i.completed).length / a.items.length;
          const pctB = b.items.filter((i) => i.completed).length / b.items.length;
          return pctA - pctB;
        case "child":
          return a.youngPerson.localeCompare(b.youngPerson);
        default:
          return 0;
      }
    });
    return items;
  }, [filterStatus, sortBy]);

  // ── stats ─────────────────────────────────────────────────────���───────────
  const totalChecklists = data.length;
  const complete = data.filter((c) => c.status === "Complete").length;
  const totalTasks = data.reduce((sum, c) => sum + c.items.length, 0);
  const completedTasks = data.reduce((sum, c) => sum + c.items.filter((i) => i.completed).length, 0);

  return (
    <PageShell
      title="Pre-Admission Checklist"
      subtitle="Structured preparation for every admission — ensuring safe, planned, and child-centred transitions"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="pre-admission-checklists" />
          <PrintButton title="Pre-Admission Checklists" />
        </div>
      }
    >
      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{totalChecklists}</p>
          <p className="text-xs text-muted-foreground">Total Admissions</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{complete}</p>
          <p className="text-xs text-muted-foreground">Fully Complete</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{completedTasks}/{totalTasks}</p>
          <p className="text-xs text-muted-foreground">Tasks Done</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">100%</p>
          <p className="text-xs text-muted-foreground">Impact Assessed</p>
        </div>
      </div>

      {/* ── filters/sort ────────────────���──────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Not Started">Not Started</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Complete">Complete</SelectItem>
            <SelectItem value="On Hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="completion">Completion %</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── checklist cards ────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No checklists match your filters.</div>
        )}
        {filtered.map((checklist) => {
          const isExpanded = expandedId === checklist.id;
          const completedCount = checklist.items.filter((i) => i.completed).length;
          const totalCount = checklist.items.length;
          const pct = Math.round((completedCount / totalCount) * 100);

          return (
            <div key={checklist.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : checklist.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileCheck className={cn("h-5 w-5 shrink-0",
                    checklist.status === "Complete" ? "text-green-600" : "text-blue-600"
                  )} />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(checklist.youngPerson)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Referred: {checklist.referralDate} &middot; {checklist.localAuthority} &middot; {checklist.socialWorker}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">{pct}%</p>
                    <p className="text-xs text-muted-foreground">{completedCount}/{totalCount}</p>
                  </div>
                  <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", pct === 100 ? "bg-green-500" : "bg-blue-500")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* task checklist */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Admission Tasks</p>
                    <div className="space-y-1.5">
                      {checklist.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          {item.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 text-slate-300 mt-0.5 shrink-0" />
                          )}
                          <div className="flex-1">
                            <span className={cn(item.completed ? "text-slate-700" : "text-slate-500")}>{item.task}</span>
                            {item.notes && <span className="text-xs text-muted-foreground ml-2">({item.notes})</span>}
                            {item.completedDate && (
                              <span className="text-xs text-muted-foreground ml-2">
                                — {item.completedDate} by {getStaffName(item.completedBy || "")}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* risk considerations */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />Risk Considerations
                    </p>
                    <ul className="space-y-1">
                      {checklist.riskConsiderations.map((risk, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Shield className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* special requirements */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <Home className="h-3 w-3 inline mr-1" />Special Requirements
                    </p>
                    <ul className="space-y-1">
                      {checklist.specialRequirements.map((req, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Clock className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* metadata */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Users className="h-3 w-3 inline mr-1" />Assigned: {getStaffName(checklist.assignedTo)}</span>
                    <span>Target admission: {checklist.targetAdmissionDate}</span>
                    {checklist.matchingPanelDate && <span>Matching panel: {checklist.matchingPanelDate}</span>}
                    <span className={cn(
                      "px-2 py-0.5 rounded-full font-medium",
                      checklist.impactAssessmentDone ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    )}>
                      Impact Assessment: {checklist.impactAssessmentDone ? "Complete" : "Pending"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ─────────────────────���──────────────────────── */}
      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Pre-admission checklists support Regulation 14 (assessment of children
          proposed to be looked after), Regulation 5 (engagement with placing authority), and Quality Standard 4
          (the child&apos;s plan). Every admission must include an impact assessment on existing residents and a
          matching consideration per Quality Standard 14 guidance.
        </p>
      </div>
    </PageShell>
  );
}

"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  TrendingUp,
  ArrowUp,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Shield,
  Phone,
} from "lucide-react";

/* ─── date helper ─── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ─── types ─── */
interface Escalation {
  id: string;
  title: string;
  date: string;
  escalatedBy: string;
  escalatedTo: string;
  category: "safeguarding" | "behaviour" | "health" | "placement" | "staffing" | "compliance";
  priority: "urgent" | "high" | "medium";
  youngPersonId: string | null;
  description: string;
  reason: string;
  actionTaken: string;
  outcome: string;
  status: "resolved" | "open" | "monitoring";
  resolvedDate: string | null;
  timeToResolve: string | null;
  linkedDocuments: string[];
  notes: string;
}

/* ─── seed data ─── */
const escalations: Escalation[] = [
  {
    id: "esc_001",
    title: "Casey — Exploitation Concerns Following Missing Episode",
    date: d(-21),
    escalatedBy: "staff_chervelle",
    escalatedTo: "staff_darren",
    category: "safeguarding",
    priority: "urgent",
    youngPersonId: "yp_casey",
    description: "Casey returned from missing episode having been with Mark (19, known exploitation concerns). Casey minimising relationship. Return interview identified exploitation indicators.",
    reason: "Meets threshold for immediate RM notification and multi-agency response. NRM referral consideration. Cannot be managed at RCW level alone.",
    actionTaken: "RM notified immediately. Strategy discussion with MASH same day. Multi-agency meeting convened within 48 hours. NRM referral submitted. Casey's risk assessment updated. Enhanced supervision plan implemented. Police intelligence shared.",
    outcome: "Multi-agency plan in place. Casey under enhanced monitoring. Mark identified to police. NRM accepted — reasonable grounds decision pending. Casey engaged with Chervelle about safety (at their pace). No further missing episodes since.",
    status: "monitoring",
    resolvedDate: null,
    timeToResolve: null,
    linkedDocuments: ["Missing episode record", "Return interview", "Exploitation screening", "NRM referral", "Strategy discussion minutes"],
    notes: "This escalation was handled well — Chervelle's immediate recognition of indicators and escalation within 30 minutes was exemplary. Multi-agency response was swift. Casey remains at risk but the protective measures are in place.",
  },
  {
    id: "esc_002",
    title: "Jordan — Sleep Deterioration & CAMHS Wait",
    date: d(-14),
    escalatedBy: "staff_anna",
    escalatedTo: "staff_darren",
    category: "health",
    priority: "high",
    youngPersonId: "yp_jordan",
    description: "Jordan sleeping only 4-5 hours per night for 2 weeks. Night wakings increasing. Daytime functioning significantly impaired. CAMHS waiting list 6 weeks. Current strategies insufficient.",
    reason: "Sleep deterioration is impacting all areas of Jordan's life — education, emotional regulation, peer relationships. Standard strategies exhausted. Requires RM-level decision on whether to escalate to GP for interim medication and/or private referral.",
    actionTaken: "RM contacted CAMHS to request urgent prioritisation. GP appointment booked for interim melatonin assessment. Private sleep clinic consultation approved (£180 — agreed with placing LA). Staffing adjusted to ensure Jordan's preferred night staff available. Therapist session frequency increased to weekly.",
    outcome: "GP prescribed melatonin 2mg trial. CAMHS brought appointment forward by 3 weeks following RM's call. Jordan sleeping slightly better (6 hours) since melatonin started. Full CAMHS assessment in 3 weeks.",
    status: "open",
    resolvedDate: null,
    timeToResolve: null,
    linkedDocuments: ["Sleep assessment", "GP letter", "CAMHS referral", "Health passport"],
    notes: "Escalation appropriate — Anna correctly identified that the deterioration exceeded what RCW-level interventions could address. The financial decision (private consult) required RM authorisation. Good example of advocacy for a child's health needs.",
  },
  {
    id: "esc_003",
    title: "Staffing — TCI Certification Lapse (Lackson)",
    date: d(-7),
    escalatedBy: "staff_ryan",
    escalatedTo: "staff_darren",
    category: "staffing",
    priority: "medium",
    youngPersonId: null,
    description: "Lackson's TCI certification expired 7 days ago. Refresher training not yet completed. Lackson currently deployed on shifts but technically cannot use physical intervention if needed.",
    reason: "Compliance issue — staff member cannot lawfully use TCI without valid certification. Risk if incident occurs and Lackson is only staff member present. Requires RM decision on deployment restrictions.",
    actionTaken: "Lackson temporarily restricted from lone working or sole staff on shift until TCI refresher completed. Emergency TCI refresher session booked for next available date (d(7)). Rota adjusted to ensure TCI-certified staff on all Lackson's shifts. Lackson informed — understands and accepts restriction.",
    outcome: "TCI refresher booked for next week. Rota adjusted in interim. No incidents during gap period. Lackson acknowledges need to maintain certification proactively.",
    status: "open",
    resolvedDate: null,
    timeToResolve: null,
    linkedDocuments: ["Document expiry tracker", "Rota", "Staff competency record"],
    notes: "This should have been caught earlier by document expiry monitoring. Process improvement: reminders now set at 30 days and 14 days before expiry. Deputy to own training compliance monitoring going forward.",
  },
  {
    id: "esc_004",
    title: "Alex — School Refusal Pattern Emerging",
    date: d(-30),
    escalatedBy: "staff_anna",
    escalatedTo: "staff_ryan",
    category: "behaviour",
    priority: "medium",
    youngPersonId: "yp_alex",
    description: "Alex refused school 3 times in 2 weeks. Previously excellent attendance. Citing stomach aches but no medical cause. Anxiety about friendship group changes identified in key work.",
    reason: "Pattern emerging that could become entrenched if not addressed quickly. Virtual School Head needs informing. May need school-based intervention or alternative timetable. Exceeds key worker's ability to resolve alone.",
    actionTaken: "Deputy met with Alex to understand fully. Virtual School Head contacted — agreed monitoring period. School SENCO meeting arranged. Alex offered choice: full attendance with support, or phased return. Alex chose phased return (mornings only for 1 week, then full days). Key work sessions focused on friendship strategies.",
    outcome: "Phased return successful. Alex back to full attendance after 5 days. Friendship issue resolved with SENCO support — Alex moved to a different table group. Attendance now 100% for 3 consecutive weeks. No medication needed — stomach aches resolved once anxiety addressed.",
    status: "resolved",
    resolvedDate: d(-14),
    timeToResolve: "16 days",
    linkedDocuments: ["Education record", "Key work notes", "Virtual School Head email"],
    notes: "Good early identification by Anna. Quick escalation prevented the pattern becoming entrenched. Alex's choice in the solution (phased return) was key to success. Evidence of 'capture once, link intelligently' — the education record, key work notes, and this escalation all cross-reference.",
  },
  {
    id: "esc_005",
    title: "Notification to Ofsted — Serious Incident (Historical)",
    date: d(-97),
    escalatedBy: "staff_darren",
    escalatedTo: "Ofsted / Placing Authority",
    category: "compliance",
    priority: "urgent",
    youngPersonId: "yp_casey",
    description: "Casey involved in police-reported incident outside the home. Required Regulation 40 notification to Ofsted within 24 hours. Placing authority also required immediate notification.",
    reason: "Statutory notification requirement. Reg 40 mandates notification within specified timeframe. RM must personally notify.",
    actionTaken: "Ofsted notified via online portal within 6 hours of incident. Placing authority SW called immediately. Written notification followed within 24 hours. Reg 44 visitor informed at next visit. Internal incident report completed. Staff debrief conducted.",
    outcome: "Notifications completed within timeframe. Ofsted acknowledged receipt. No further action required by Ofsted. Placing authority satisfied with response. Incident managed appropriately — no regulatory concern.",
    status: "resolved",
    resolvedDate: d(-95),
    timeToResolve: "2 days",
    linkedDocuments: ["Ofsted notification", "Incident report", "Staff debrief", "Reg 44 report"],
    notes: "This was the notification that was delayed by 2 days on a previous occasion (identified in Reg 44 visit). Process has since been tightened — notification now completed same day wherever possible. Alert system added to incident form.",
  },
];

/* ─── export columns ─── */
const exportCols: ExportColumn<Escalation>[] = [
  { header: "Title", accessor: (r: Escalation) => r.title },
  { header: "Date", accessor: (r: Escalation) => r.date },
  { header: "Escalated By", accessor: (r: Escalation) => getStaffName(r.escalatedBy) },
  { header: "Escalated To", accessor: (r: Escalation) => r.escalatedTo.startsWith("staff_") ? getStaffName(r.escalatedTo) : r.escalatedTo },
  { header: "Category", accessor: (r: Escalation) => r.category },
  { header: "Priority", accessor: (r: Escalation) => r.priority },
  { header: "Young Person", accessor: (r: Escalation) => r.youngPersonId ? getYPName(r.youngPersonId) : "N/A" },
  { header: "Status", accessor: (r: Escalation) => r.status },
  { header: "Time to Resolve", accessor: (r: Escalation) => r.timeToResolve ?? "Open" },
  { header: "Action Taken", accessor: (r: Escalation) => r.actionTaken },
];

/* ─── component ─── */
export default function EscalationTrackerPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const filtered = useMemo(() => {
    let list = [...escalations];
    if (filterCategory !== "all") list = list.filter((r) => r.category === filterCategory);
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "priority": {
          const pOrder = { urgent: 0, high: 1, medium: 2 };
          return pOrder[a.priority] - pOrder[b.priority];
        }
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });
    return list;
  }, [filterCategory, filterStatus, sortBy]);

  const stats = useMemo(() => {
    const total = escalations.length;
    const open = escalations.filter((e) => e.status === "open" || e.status === "monitoring").length;
    const resolved = escalations.filter((e) => e.status === "resolved").length;
    const urgent = escalations.filter((e) => e.priority === "urgent" && e.status !== "resolved").length;
    return { total, open, resolved, urgent };
  }, []);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case "medium":
        return <Badge className="bg-amber-100 text-amber-800">Medium</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
      case "open":
        return <Badge className="bg-blue-100 text-blue-800">Open</Badge>;
      case "monitoring":
        return <Badge className="bg-purple-100 text-purple-800">Monitoring</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <PageShell
      title="Escalation Tracker"
      subtitle="Recording when concerns are escalated, to whom, actions taken, and outcomes"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={escalations} columns={exportCols} filename="escalation-tracker" />
          <PrintButton title="Escalation Tracker" />
        </div>
      }
    >
      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Escalations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.open}</p>
            <p className="text-xs text-muted-foreground">Open / Monitoring</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.resolved}</p>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className={cn("text-2xl font-bold", stats.urgent > 0 ? "text-red-700" : "text-green-700")}>
              {stats.urgent}
            </p>
            <p className="text-xs text-muted-foreground">Urgent Active</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── urgent alert ─── */}
      {stats.urgent > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Urgent Escalation Active</p>
              <p className="text-xs text-red-700 mt-1">
                {escalations
                  .filter((e) => e.priority === "urgent" && e.status !== "resolved")
                  .map((e) => e.title)
                  .join("; ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── filters ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="safeguarding">Safeguarding</option>
          <option value="behaviour">Behaviour</option>
          <option value="health">Health</option>
          <option value="placement">Placement</option>
          <option value="staffing">Staffing</option>
          <option value="compliance">Compliance</option>
        </select>

        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="monitoring">Monitoring</option>
          <option value="resolved">Resolved</option>
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Most Recent</option>
            <option value="priority">Priority</option>
            <option value="category">Category</option>
          </select>
        </div>
      </div>

      {/* ─── escalation cards ─── */}
      <div className="space-y-3">
        {filtered.map((esc) => {
          const expanded = expandedId === esc.id;

          return (
            <Card key={esc.id} className={cn(
              "overflow-hidden",
              esc.priority === "urgent" && esc.status !== "resolved" && "border-red-200"
            )}>
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(esc.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      esc.priority === "urgent" ? "bg-red-100" :
                      esc.priority === "high" ? "bg-orange-100" : "bg-amber-100"
                    )}>
                      <ArrowUp className={cn(
                        "h-5 w-5",
                        esc.priority === "urgent" ? "text-red-600" :
                        esc.priority === "high" ? "text-orange-600" : "text-amber-600"
                      )} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{esc.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {priorityBadge(esc.priority)}
                        {statusBadge(esc.status)}
                        <Badge variant="outline" className="text-xs capitalize">{esc.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">{esc.date}</p>
                    </div>
                    {expanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-4 space-y-4">
                  {/* description */}
                  <div>
                    <p className="text-sm font-medium mb-1">What Happened</p>
                    <p className="text-sm text-muted-foreground">{esc.description}</p>
                  </div>

                  {/* reason for escalation */}
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                    <p className="text-sm font-medium text-amber-800 mb-1">Why Escalated</p>
                    <p className="text-sm text-amber-700">{esc.reason}</p>
                  </div>

                  {/* action taken */}
                  <div>
                    <p className="text-sm font-medium mb-1 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600" /> Action Taken
                    </p>
                    <p className="text-sm text-muted-foreground">{esc.actionTaken}</p>
                  </div>

                  {/* outcome */}
                  <div className={cn(
                    "rounded-md p-3 border",
                    esc.status === "resolved" ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"
                  )}>
                    <p className={cn(
                      "text-sm font-medium mb-1",
                      esc.status === "resolved" ? "text-green-800" : "text-blue-800"
                    )}>Outcome</p>
                    <p className={cn(
                      "text-sm",
                      esc.status === "resolved" ? "text-green-700" : "text-blue-700"
                    )}>{esc.outcome}</p>
                  </div>

                  {/* linked documents */}
                  {esc.linkedDocuments.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Linked Records</p>
                      <div className="flex flex-wrap gap-1">
                        {esc.linkedDocuments.map((doc, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{doc}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* notes */}
                  {esc.notes && (
                    <div className="bg-muted/30 rounded-md p-3">
                      <p className="text-sm font-medium mb-1">Notes</p>
                      <p className="text-sm text-muted-foreground">{esc.notes}</p>
                    </div>
                  )}

                  {/* footer */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Escalated By</p>
                      <p className="text-sm font-medium">{getStaffName(esc.escalatedBy)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Escalated To</p>
                      <p className="text-sm font-medium">
                        {esc.escalatedTo.startsWith("staff_") ? getStaffName(esc.escalatedTo) : esc.escalatedTo}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Resolved</p>
                      <p className="text-sm font-medium">{esc.resolvedDate ?? "Ongoing"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Resolution Time</p>
                      <p className="text-sm font-medium">{esc.timeToResolve ?? "—"}</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── regulatory note ─── */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm font-medium text-slate-700 mb-1">Regulatory Context</p>
        <p className="text-xs text-slate-600">
          Effective escalation demonstrates professional accountability and safeguarding culture.
          Regulation 13 (Leadership and Management) requires clear lines of accountability.
          The SCCIF examines whether staff escalate concerns appropriately and whether managers
          respond effectively. Quality Standard 3 (Protection) requires that safeguarding
          concerns are escalated without delay. This tracker provides an audit trail showing
          that escalation pathways work — concerns are raised, heard, and acted upon.
        </p>
      </div>
    </PageShell>
  );
}

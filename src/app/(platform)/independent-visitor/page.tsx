"use client";

import { useState, useMemo } from "react";
import {
  Eye, Plus, Search, ArrowUpDown,
  AlertTriangle, CheckCircle2, Clock,
  ChevronDown, ChevronUp, MessageSquare, FileText,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
const VISIT_TYPES = ["scheduled", "unannounced", "follow_up"] as const;
type VisitType = typeof VISIT_TYPES[number];
const TYPE_LABELS: Record<VisitType, string> = {
  scheduled: "Scheduled", unannounced: "Unannounced", follow_up: "Follow-Up",
};

interface Recommendation {
  recommendation: string;
  priority: "high" | "medium" | "low";
  response: string | null;
  responseDate: string | null;
  status: "open" | "actioned" | "noted";
}

interface ChildView {
  youngPersonId: string;
  spokenTo: boolean;
  privateConversation: boolean;
  summary: string;
  concerns: boolean;
}

interface VisitorReport {
  id: string;
  date: string;
  visitorName: string;
  visitType: VisitType;
  arrivalTime: string;
  departureTime: string;
  areasInspected: string[];
  childViews: ChildView[];
  staffOnDuty: string[];
  overallFindings: string;
  recommendations: Recommendation[];
  positiveObservations: string[];
  rmResponse: string | null;
  rmResponseDate: string | null;
  reportReceived: boolean;
  reportDate: string | null;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: VisitorReport[] = [
  {
    id: "iv_1", date: d(-5), visitorName: "Margaret Chen",
    visitType: "scheduled", arrivalTime: "10:00", departureTime: "13:30",
    areasInspected: ["Communal areas", "Bedrooms", "Kitchen", "Garden", "Office records", "Fire safety equipment"],
    childViews: [
      { youngPersonId: "yp_alex", spokenTo: true, privateConversation: true, summary: "Alex said they feel safe and happy. Mentioned enjoying cooking sessions. Asked about getting a games console for the lounge.", concerns: false },
      { youngPersonId: "yp_jordan", spokenTo: true, privateConversation: true, summary: "Jordan was very positive. Said this is the best home they've lived in. Mentioned staff are kind and listen to them.", concerns: false },
      { youngPersonId: "yp_casey", spokenTo: true, privateConversation: true, summary: "Casey was at college during part of the visit. Spoke briefly on return. Happy overall. Would like more vegetarian meal options.", concerns: false },
    ],
    staffOnDuty: ["staff_anna", "staff_edward"],
    overallFindings: "Oak House continues to provide a high standard of care. The home is clean, warm, and welcoming with a genuinely homely atmosphere. Staff were professional, warm, and child-focused. All three young people expressed positive views about their placement. Records were well-organised and accessible.",
    recommendations: [
      { recommendation: "Bathroom extractor fan repair — noted as outstanding from previous visit.", priority: "medium", response: "Repair scheduled for next week. Contractor confirmed.", responseDate: d(-3), status: "actioned" },
      { recommendation: "Consider reviewing pocket money rates in line with current guidance.", priority: "low", response: "Added to agenda for next team meeting.", responseDate: d(-4), status: "noted" },
    ],
    positiveObservations: [
      "Bedrooms were personalised and reflected each child's identity",
      "Kitchen was clean and well-stocked with healthy options",
      "All three children spoke positively about feeling safe and cared for",
      "Staff demonstrated genuine warmth and knowledge of each child",
      "Records were well-maintained and up to date",
      "Fire safety equipment checked and in date",
    ],
    rmResponse: "Thank you for another positive visit. Both recommendations are being addressed. The bathroom extractor fan repair was delayed due to contractor availability but is now confirmed. Pocket money rates will be discussed at the next team meeting and benchmarked against current guidance.",
    rmResponseDate: d(-3),
    reportReceived: true, reportDate: d(-3),
  },
  {
    id: "iv_2", date: d(-35), visitorName: "Margaret Chen",
    visitType: "scheduled", arrivalTime: "14:00", departureTime: "17:00",
    areasInspected: ["Communal areas", "Bedrooms", "Garden", "Office records", "Medication storage"],
    childViews: [
      { youngPersonId: "yp_alex", spokenTo: true, privateConversation: true, summary: "Alex was in a good mood. Talked about enjoying Friday movie nights. No concerns raised.", concerns: false },
      { youngPersonId: "yp_jordan", spokenTo: true, privateConversation: false, summary: "Jordan was doing homework with staff support. Brief conversation — seemed settled and content.", concerns: false },
      { youngPersonId: "yp_casey", spokenTo: true, privateConversation: true, summary: "Casey shared artwork from college. Clearly proud of their progress. Mentioned occasional difficulty sleeping.", concerns: false },
    ],
    staffOnDuty: ["staff_chervelle", "staff_lackson"],
    overallFindings: "Good visit. Home maintains high standards. Garden furniture showing wear — parasol damaged. Casey's sleep concerns noted — staff are aware and managing with appropriate strategies. Medication storage compliant.",
    recommendations: [
      { recommendation: "Replace damaged garden furniture parasol before summer.", priority: "low", response: "Ordered — arriving next week.", responseDate: d(-33), status: "actioned" },
      { recommendation: "Bathroom extractor fan in main bathroom is noisy — consider repair.", priority: "medium", response: "Maintenance request submitted.", responseDate: d(-33), status: "actioned" },
      { recommendation: "Casey's sleep difficulties — ensure CAMHS is aware and supporting.", priority: "medium", response: "CAMHS aware. Sleep hygiene programme in place. Next CAMHS review will focus on this.", responseDate: d(-33), status: "actioned" },
    ],
    positiveObservations: [
      "Strong staff-child relationships evident throughout the visit",
      "Homework support being provided during the visit — normalised routine",
      "Casey's college work displayed in the home — celebrating achievement",
      "Medication storage well-managed and audited",
    ],
    rmResponse: "Thank you for the visit and helpful recommendations. All three items are being addressed. Garden parasol ordered. Extractor fan repair requested. CAMHS is fully engaged with Casey's sleep programme.",
    rmResponseDate: d(-33),
    reportReceived: true, reportDate: d(-32),
  },
  {
    id: "iv_3", date: d(-65), visitorName: "Margaret Chen",
    visitType: "unannounced", arrivalTime: "18:30", departureTime: "20:00",
    areasInspected: ["Communal areas", "Kitchen during meal prep", "Bedrooms (with permission)"],
    childViews: [
      { youngPersonId: "yp_alex", spokenTo: true, privateConversation: false, summary: "Alex was helping prepare dinner. Seemed happy and engaged. Quick chat — no concerns.", concerns: false },
      { youngPersonId: "yp_jordan", spokenTo: true, privateConversation: false, summary: "Jordan was watching TV. Welcomed the visitor warmly. No issues raised.", concerns: false },
      { youngPersonId: "yp_casey", spokenTo: false, privateConversation: false, summary: "Casey was in their room listening to music. Staff asked if they wanted to come down — Casey said they were fine and said hello from the door.", concerns: false },
    ],
    staffOnDuty: ["staff_mirela", "staff_diane"],
    overallFindings: "Unannounced evening visit. Home was relaxed and functioning well in the evening routine. Young people were settled in age-appropriate activities. Staff were managing the evening transition smoothly. Dinner preparation involved Alex — good independence skill development.",
    recommendations: [],
    positiveObservations: [
      "Evening routine was calm and well-structured",
      "Young people involved in meal preparation — normalised home life",
      "Staff were attentive but not intrusive",
      "Home felt genuinely lived-in and comfortable",
    ],
    rmResponse: "Pleased with the positive unannounced visit. Good to receive confirmation that evening routines are running well.",
    rmResponseDate: d(-63),
    reportReceived: true, reportDate: d(-62),
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function IndependentVisitorPage() {
  const [reports] = useState<VisitorReport[]>(SEED);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...reports];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.overallFindings.toLowerCase().includes(q) ||
          r.visitorName.toLowerCase().includes(q) ||
          r.positiveObservations.some((p) => p.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "type": return a.visitType.localeCompare(b.visitType);
        default: return 0;
      }
    });
    return list;
  }, [reports, search, sortBy]);

  const total = reports.length;
  const openRecs = reports.reduce((s, r) => s + r.recommendations.filter((rec: Recommendation) => rec.status === "open").length, 0);
  const lastVisit = reports.length > 0 ? reports.sort((a, b) => b.date.localeCompare(a.date))[0].date : "—";

  const exportCols: ExportColumn<VisitorReport>[] = [
    { header: "ID", accessor: (r: VisitorReport) => r.id },
    { header: "Date", accessor: (r: VisitorReport) => r.date },
    { header: "Visitor", accessor: (r: VisitorReport) => r.visitorName },
    { header: "Type", accessor: (r: VisitorReport) => TYPE_LABELS[r.visitType] },
    { header: "Time", accessor: (r: VisitorReport) => `${r.arrivalTime}–${r.departureTime}` },
    { header: "Areas Inspected", accessor: (r: VisitorReport) => r.areasInspected.join(", ") },
    { header: "Children Spoken To", accessor: (r: VisitorReport) => r.childViews.filter((c: ChildView) => c.spokenTo).length.toString() },
    { header: "Overall Findings", accessor: (r: VisitorReport) => r.overallFindings },
    { header: "Positive Observations", accessor: (r: VisitorReport) => r.positiveObservations.join("; ") },
    { header: "Recommendations", accessor: (r: VisitorReport) => r.recommendations.map((rec: Recommendation) => `${rec.recommendation} (${rec.status})`).join("; ") },
    { header: "RM Response", accessor: (r: VisitorReport) => r.rmResponse ?? "" },
    { header: "RM Response Date", accessor: (r: VisitorReport) => r.rmResponseDate ?? "" },
  ];

  return (
    <PageShell
      title="Independent Visitor Reports"
      subtitle="Regulation 44 — monthly independent person's visits and reports"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Independent Visitor Reports" />
          <ExportButton data={filtered} columns={exportCols} filename="independent-visitor" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Visits", value: total, icon: Eye, colour: "text-blue-600" },
            { label: "Last Visit", value: lastVisit, icon: Clock, colour: "text-green-600" },
            { label: "Open Recommendations", value: openRecs, icon: AlertTriangle, colour: openRecs > 0 ? "text-orange-600" : "text-green-600" },
            { label: "Reports Received", value: reports.filter((r) => r.reportReceived).length, icon: FileText, colour: "text-blue-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search findings, observations…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="type">Visit Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── list ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((report) => {
            const isExpanded = expanded === report.id;
            const openCount = report.recommendations.filter((r: Recommendation) => r.status === "open").length;

            return (
              <div key={report.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : report.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Eye className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">{report.date} — {report.visitorName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {TYPE_LABELS[report.visitType]} · {report.arrivalTime}–{report.departureTime} · {report.recommendations.length} recommendation(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {openCount > 0 && <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">{openCount} open</Badge>}
                    <Badge variant="outline" className="text-xs">{TYPE_LABELS[report.visitType]}</Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* areas inspected */}
                    <div className="flex flex-wrap gap-1">
                      {report.areasInspected.map((area: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{area}</Badge>
                      ))}
                    </div>

                    {/* overall findings */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Overall Findings</p>
                      <p className="text-sm">{report.overallFindings}</p>
                    </div>

                    {/* children's views */}
                    <div>
                      <p className="text-sm font-medium mb-2">Children&apos;s Views</p>
                      <div className="space-y-2">
                        {report.childViews.map((cv: ChildView, idx: number) => (
                          <div key={idx} className="rounded-lg border bg-pink-50 border-pink-200 p-3 text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <MessageSquare className="h-3 w-3 text-pink-600" />
                              <span className="font-medium">{getYPName(cv.youngPersonId)}</span>
                              {cv.privateConversation && <Badge variant="outline" className="text-[10px]">Private</Badge>}
                              {cv.concerns && <Badge variant="outline" className="text-[10px] border-red-300 text-red-700">Concerns</Badge>}
                            </div>
                            <p className="text-xs">{cv.summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* positive observations */}
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <p className="text-xs font-medium text-green-700 mb-2">Positive Observations</p>
                      <ul className="space-y-1">
                        {report.positiveObservations.map((obs: string, i: number) => (
                          <li key={i} className="flex items-start gap-1 text-sm">
                            <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                            <span>{obs}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* recommendations */}
                    {report.recommendations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Recommendations</p>
                        <div className="space-y-2">
                          {report.recommendations.map((rec: Recommendation, idx: number) => (
                            <div key={idx} className={cn("rounded-lg border p-3 text-sm",
                              rec.status === "open" ? "bg-orange-50 border-orange-200" : "bg-white"
                            )}>
                              <div className="flex items-center gap-2 mb-1">
                                {rec.status === "actioned" ? <CheckCircle2 className="h-3 w-3 text-green-600" /> :
                                 rec.status === "noted" ? <CheckCircle2 className="h-3 w-3 text-blue-600" /> :
                                 <Clock className="h-3 w-3 text-orange-600" />}
                                <span className="font-medium">{rec.recommendation}</span>
                                <Badge variant="outline" className={cn("text-xs ml-auto",
                                  rec.priority === "high" ? "border-red-300 text-red-700" :
                                  rec.priority === "medium" ? "border-orange-300 text-orange-700" :
                                  "border-slate-300"
                                )}>{rec.priority}</Badge>
                              </div>
                              {rec.response && (
                                <div className="mt-1 pl-5">
                                  <p className="text-xs"><strong>Response:</strong> {rec.response}</p>
                                  {rec.responseDate && <p className="text-xs text-muted-foreground">Responded: {rec.responseDate}</p>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* RM response */}
                    {report.rmResponse && (
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-medium text-blue-700 mb-1">RM Response ({report.rmResponseDate})</p>
                        <p className="text-sm">{report.rmResponse}</p>
                      </div>
                    )}

                    {/* staff on duty */}
                    <div className="text-sm text-muted-foreground">
                      Staff on duty: {report.staffOnDuty.map((s: string) => getStaffName(s)).join(", ")}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Regulation 44:</strong> An independent person must visit the home at least once a month.
          They must interview children (in private if requested), inspect the premises, and produce a
          written report. The registered person must respond to any recommendations and make the report
          available to Ofsted, the placing authority, and HMCI. At least one visit per year must be
          unannounced.
        </div>
      </div>
    </PageShell>
  );
}

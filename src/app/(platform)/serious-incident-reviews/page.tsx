"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type ReviewType = "serious_incident" | "near_miss" | "safeguarding_practice" | "complaint_learning" | "external_review" | "thematic";
type ReviewStatus = "initiated" | "under_review" | "draft_report" | "final_report" | "actions_in_progress" | "closed" | "monitoring";

interface LessonLearned { lesson: string; category: string; impactLevel: "high" | "medium" | "low" }
interface Action { action: string; owner: string; dueDate: string; status: "pending" | "in_progress" | "completed" | "overdue"; evidence: string }

interface SeriousIncidentReview {
  id: string;
  title: string;
  reviewType: ReviewType;
  incidentDate: string;
  reviewCommencedDate: string;
  reviewCompletedDate: string | null;
  linkedIncidents: string[];
  youngPeopleInvolved: string[];
  staffInvolved: string[];
  reviewLead: string;
  panelMembers: { name: string; role: string }[];
  backgroundSummary: string;
  keyFindings: string[];
  lessonsLearned: LessonLearned[];
  recommendations: string[];
  actions: Action[];
  externalNotifications: { body: string; date: string; reference: string }[];
  practiceChanges: string[];
  trainingImplications: string[];
  policyChanges: string[];
  status: ReviewStatus;
  nextReviewDate: string | null;
  confidentiality: "standard" | "restricted" | "highly_restricted";
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const RT_LABEL: Record<ReviewType, string> = { serious_incident: "Serious Incident", near_miss: "Near Miss", safeguarding_practice: "Safeguarding Practice", complaint_learning: "Complaint Learning", external_review: "External Review", thematic: "Thematic Review" };
const RT_CLR: Record<ReviewType, string> = { serious_incident: "bg-red-100 text-red-800", near_miss: "bg-amber-100 text-amber-800", safeguarding_practice: "bg-purple-100 text-purple-800", complaint_learning: "bg-orange-100 text-orange-800", external_review: "bg-blue-100 text-blue-800", thematic: "bg-indigo-100 text-indigo-800" };
const RS_LABEL: Record<ReviewStatus, string> = { initiated: "Initiated", under_review: "Under Review", draft_report: "Draft Report", final_report: "Final Report", actions_in_progress: "Actions In Progress", closed: "Closed", monitoring: "Monitoring" };
const RS_CLR: Record<ReviewStatus, string> = { initiated: "bg-blue-100 text-blue-800", under_review: "bg-amber-100 text-amber-800", draft_report: "bg-purple-100 text-purple-800", final_report: "bg-indigo-100 text-indigo-800", actions_in_progress: "bg-orange-100 text-orange-800", closed: "bg-green-100 text-green-800", monitoring: "bg-teal-100 text-teal-800" };
const CONF_CLR: Record<string, string> = { standard: "bg-gray-100 text-gray-800", restricted: "bg-amber-100 text-amber-800", highly_restricted: "bg-red-900 text-white" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: SeriousIncidentReview[] = [
  {
    id: "sir1", title: "Review: Medication Error — Wrong Dose Administered",
    reviewType: "near_miss", incidentDate: d(-42), reviewCommencedDate: d(-35), reviewCompletedDate: d(-21),
    linkedIncidents: ["ME-001"], youngPeopleInvolved: ["yp_alex"], staffInvolved: ["staff_anna"],
    reviewLead: "staff_darren",
    panelMembers: [
      { name: "Darren Laville", role: "Registered Manager" },
      { name: "Karen Holding", role: "Social Worker" },
      { name: "Pharmacy Lead", role: "Community Pharmacist" },
    ],
    backgroundSummary: "Alex was administered 5mg Melatonin instead of prescribed 3mg due to a pharmacy dispensing error. The blister pack was labelled 3mg but contained 5mg tablets. Staff did not notice the tablet size difference. Alex experienced drowsiness the following morning but no lasting harm.",
    keyFindings: [
      "Pharmacy dispensing error was the root cause",
      "No double-check system existed for medication against prescription",
      "Staff training on medication identification was insufficient",
      "Response to the error was appropriate and timely",
    ],
    lessonsLearned: [
      { lesson: "All medication must be visually verified against the prescription label, not just the blister pack label", category: "Medication Safety", impactLevel: "high" },
      { lesson: "Staff need to recognise different tablet strengths by appearance", category: "Training", impactLevel: "medium" },
      { lesson: "Two-person verification for all medication administration adds a critical safety layer", category: "Procedure", impactLevel: "high" },
    ],
    recommendations: [
      "Implement mandatory two-person medication check",
      "Staff medication refresher training within 30 days",
      "Formal complaint to dispensing pharmacy",
      "Monthly medication audit to include visual check of tablet vs prescription",
    ],
    actions: [
      { action: "Two-person medication check procedure implemented", owner: "staff_darren", dueDate: d(-28), status: "completed", evidence: "Updated medication policy signed by all staff" },
      { action: "Medication refresher training delivered", owner: "staff_ryan", dueDate: d(-14), status: "completed", evidence: "Training certificates on file" },
      { action: "Formal complaint to pharmacy", owner: "staff_darren", dueDate: d(-30), status: "completed", evidence: "Written complaint and pharmacy response on file" },
      { action: "Monthly medication audit schedule created", owner: "staff_anna", dueDate: d(-21), status: "completed", evidence: "Audit template and schedule in place" },
    ],
    externalNotifications: [
      { body: "Ofsted", date: d(-41), reference: "NE-2025-0412" },
    ],
    practiceChanges: ["Two-person medication check now standard", "Visual verification against prescription mandatory"],
    trainingImplications: ["Medication safety refresher added to annual training plan", "New staff induction includes medication identification exercise"],
    policyChanges: ["Medication Administration Policy updated v3.2"],
    status: "closed", nextReviewDate: null, confidentiality: "standard",
  },
  {
    id: "sir2", title: "Review: Casey — Safeguarding Concerns During Contact",
    reviewType: "safeguarding_practice", incidentDate: d(-20), reviewCommencedDate: d(-15), reviewCompletedDate: null,
    linkedIncidents: ["INC-2301", "SAF-0089"], youngPeopleInvolved: ["yp_casey"], staffInvolved: ["staff_darren", "staff_ryan"],
    reviewLead: "staff_darren",
    panelMembers: [
      { name: "Darren Laville", role: "Registered Manager" },
      { name: "Fiona Brennan", role: "Social Worker" },
      { name: "Dr Patel", role: "CAMHS Psychiatrist" },
    ],
    backgroundSummary: "Following Casey's birth mother making threats towards grandmother during a supervised contact session, all direct contact was suspended. Casey attempted to contact birth mother via Facebook using her phone. This review examines the safeguarding response, the effectiveness of online safety monitoring, and the emotional support provided to Casey during the contact suspension.",
    keyFindings: [
      "Online safety monitoring (Bark) correctly flagged the Facebook contact attempt",
      "Response time from alert to staff intervention was within target (under 1 hour)",
      "Casey's emotional distress following contact suspension was significant and required enhanced therapeutic support",
      "The device policy did not explicitly cover social media contact with restricted individuals",
    ],
    lessonsLearned: [
      { lesson: "Device policies must explicitly name restricted contacts, not just restricted platforms", category: "Online Safety", impactLevel: "high" },
      { lesson: "Contact suspension decisions need parallel emotional support plans for the child", category: "Emotional Wellbeing", impactLevel: "high" },
    ],
    recommendations: [
      "Update device agreements to include named restricted contacts",
      "Create emotional support plan template for contact suspension scenarios",
      "Increase art therapy to twice weekly during contact suspension period",
    ],
    actions: [
      { action: "Device agreement updated with restricted contacts section", owner: "staff_darren", dueDate: d(-5), status: "completed", evidence: "Updated agreement signed by Casey" },
      { action: "Emotional support plan template created", owner: "staff_darren", dueDate: d(3), status: "in_progress", evidence: "" },
      { action: "Art therapy increased to twice weekly", owner: "staff_anna", dueDate: d(-10), status: "completed", evidence: "Therapy schedule updated" },
    ],
    externalNotifications: [
      { body: "Ofsted", date: d(-19), reference: "NE-2025-0518" },
      { body: "LADO", date: d(-18), reference: "LADO-2025-0312" },
    ],
    practiceChanges: ["Contact supervision checklist updated", "Real-time monitoring of restricted contact attempts"],
    trainingImplications: ["Online safety training to include restricted contacts scenario"],
    policyChanges: ["Device & Online Safety Policy under review"],
    status: "actions_in_progress", nextReviewDate: d(14), confidentiality: "restricted",
  },
  {
    id: "sir3", title: "Thematic Review: Sleep-In Disturbance Patterns",
    reviewType: "thematic", incidentDate: d(-30), reviewCommencedDate: d(-21), reviewCompletedDate: d(-7),
    linkedIncidents: ["SI-003", "SI-005"], youngPeopleInvolved: ["yp_alex", "yp_jordan", "yp_casey"], staffInvolved: ["staff_diane", "staff_chervelle"],
    reviewLead: "staff_darren",
    panelMembers: [
      { name: "Darren Laville", role: "Registered Manager" },
      { name: "Ryan Mitchell", role: "Deputy Manager" },
    ],
    backgroundSummary: "Analysis of sleep-in logs over the past quarter revealed that 40% of sleep-in shifts were significantly disturbed. Two shifts were abandoned due to multiple disturbances. All three children had disturbed nights on the same evening on one occasion, suggesting a home-wide emotional trigger. This thematic review examines patterns, causes, and interventions.",
    keyFindings: [
      "Disturbances correlate with specific days: Sundays (pre-school anxiety) and Fridays (transition from school routine)",
      "Jordan's nightmares about previous placement are recurring — needs therapeutic attention",
      "Casey's night terrors are linked to trauma dates",
      "Alex's nighttime distress increases after phone contact with birth mother in the evening",
      "Staff sleep-in room is on the ground floor — some disturbances are caused by kitchen noise (dishwasher on timer)",
    ],
    lessonsLearned: [
      { lesson: "Nighttime routines need to be differentiated per child based on their specific needs", category: "Care Planning", impactLevel: "medium" },
      { lesson: "Contact calls with family should be completed by 19:00 to allow processing time before bed", category: "Contact Planning", impactLevel: "high" },
      { lesson: "Environmental factors (kitchen appliance timers) contribute to disturbance", category: "Environment", impactLevel: "low" },
    ],
    recommendations: [
      "Individualised bedtime plans for each child",
      "Contact calls moved to 17:00–19:00 window only",
      "Kitchen appliance timers disabled overnight",
      "Jordan referred for therapeutic support around previous placement",
      "Compensatory rest policy reviewed to ensure compliance",
    ],
    actions: [
      { action: "Individual bedtime plans created", owner: "staff_ryan", dueDate: d(-3), status: "completed", evidence: "Plans in each child's care plan" },
      { action: "Contact call window agreed with social workers", owner: "staff_darren", dueDate: d(-5), status: "completed", evidence: "Email confirmation from all SWs" },
      { action: "Appliance timers disabled overnight", owner: "staff_edward", dueDate: d(-7), status: "completed", evidence: "Maintenance log updated" },
      { action: "Jordan therapy referral for previous placement trauma", owner: "staff_ryan", dueDate: d(7), status: "pending", evidence: "" },
    ],
    externalNotifications: [],
    practiceChanges: ["Individualised bedtime routines", "Contact call timing standardised"],
    trainingImplications: ["Sleep and attachment training for night staff"],
    policyChanges: [],
    status: "monitoring", nextReviewDate: d(30), confidentiality: "standard",
  },
];

/* ── component ─────────────────────────────────────────────────────────────── */

export default function SeriousIncidentReviewsPage() {
  const [data] = useState<SeriousIncidentReview[]>(SEED);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);
  const today = d(0);

  const filtered = useMemo(() => {
    let out = [...data];
    if (search) { const s = search.toLowerCase(); out = out.filter(r => r.title.toLowerCase().includes(s) || r.backgroundSummary.toLowerCase().includes(s)); }
    if (typeFilter !== "all") out = out.filter(r => r.reviewType === typeFilter);
    if (statusFilter !== "all") out = out.filter(r => r.status === statusFilter);
    out.sort((a, b) => sortBy === "oldest" ? a.incidentDate.localeCompare(b.incidentDate) : b.incidentDate.localeCompare(a.incidentDate));
    return out;
  }, [data, search, typeFilter, statusFilter, sortBy]);

  const openReviews = data.filter(r => r.status !== "closed").length;
  const pendingActions = data.reduce((s, r) => s + r.actions.filter(a => a.status !== "completed").length, 0);
  const lessonsTotal = data.reduce((s, r) => s + r.lessonsLearned.length, 0);

  const exportCols: ExportColumn<SeriousIncidentReview>[] = useMemo(() => [
    { header: "Title", accessor: (r: SeriousIncidentReview) => r.title },
    { header: "Type", accessor: (r: SeriousIncidentReview) => RT_LABEL[r.reviewType] },
    { header: "Incident Date", accessor: (r: SeriousIncidentReview) => r.incidentDate },
    { header: "Status", accessor: (r: SeriousIncidentReview) => RS_LABEL[r.status] },
    { header: "Review Lead", accessor: (r: SeriousIncidentReview) => getStaffName(r.reviewLead) },
    { header: "YP Involved", accessor: (r: SeriousIncidentReview) => r.youngPeopleInvolved.map(id => getYPName(id)).join(", ") },
    { header: "Key Findings", accessor: (r: SeriousIncidentReview) => r.keyFindings.join("; ") },
    { header: "Lessons", accessor: (r: SeriousIncidentReview) => r.lessonsLearned.map(l => l.lesson).join("; ") },
    { header: "Actions Pending", accessor: (r: SeriousIncidentReview) => String(r.actions.filter(a => a.status !== "completed").length) },
    { header: "Confidentiality", accessor: (r: SeriousIncidentReview) => r.confidentiality },
  ], []);

  return (
    <PageShell
      title="Serious Incident Reviews"
      subtitle="Learning reviews, practice analysis, and lessons implemented"
      actions={[
        <PrintButton key="p" title="Serious Incident Reviews" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="serious-incident-reviews" />,
        <Button key="n" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />New Review</Button>,
      ]}
    >
      <div id="print-area" className="space-y-6">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Reviews", value: data.length, icon: FileText, colour: "text-blue-600" },
            { label: "Open Reviews", value: openReviews, icon: Clock, colour: "text-amber-600" },
            { label: "Pending Actions", value: pendingActions, icon: AlertTriangle, colour: "text-red-600" },
            { label: "Lessons Captured", value: lessonsTotal, icon: CheckCircle2, colour: "text-green-600" },
          ].map(s => (
            <Card key={s.label}><CardContent className="pt-4 flex items-center gap-3"><s.icon className={cn("h-8 w-8", s.colour)} /><div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></CardContent></Card>
          ))}
        </div>

        <Card><CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]"><Label className="text-xs">Search</Label><div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Title, summary…" value={search} onChange={e => setSearch(e.target.value)} /></div></div>
            <div className="w-44"><Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Type</Label><Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(Object.entries(RT_LABEL) as [ReviewType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-44"><Label className="text-xs">Status</Label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(Object.entries(RS_LABEL) as [ReviewStatus, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-36"><Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">Newest</SelectItem><SelectItem value="oldest">Oldest</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent></Card>

        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            const pendAct = r.actions.filter(a => a.status !== "completed").length;
            return (
              <Card key={r.id} className={cn(r.confidentiality === "highly_restricted" && "border-red-400")}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{r.title}</CardTitle>
                        <Badge className={cn("text-xs", RT_CLR[r.reviewType])}>{RT_LABEL[r.reviewType]}</Badge>
                        <Badge className={cn("text-xs", RS_CLR[r.status])}>{RS_LABEL[r.status]}</Badge>
                        <Badge className={cn("text-xs", CONF_CLR[r.confidentiality])}>{r.confidentiality.replace("_", " ")}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {pendAct > 0 && <Badge className="text-xs bg-red-100 text-red-800">{pendAct} actions pending</Badge>}
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Incident: {r.incidentDate} · Lead: {getStaffName(r.reviewLead)} · YP: {r.youngPeopleInvolved.map(id => getYPName(id)).join(", ")}</p>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-1">Background Summary</p>
                      <p className="text-sm text-blue-900">{r.backgroundSummary}</p>
                    </div>

                    <div><p className="text-xs font-semibold mb-1">Review Panel</p>
                      <div className="flex gap-2 flex-wrap">{r.panelMembers.map((m, i) => <Badge key={i} variant="outline" className="text-xs">{m.name} ({m.role})</Badge>)}</div>
                    </div>

                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-xs font-semibold text-amber-800 mb-1">Key Findings</p>
                      <ol className="text-sm text-amber-900 list-decimal list-inside space-y-0.5">{r.keyFindings.map((f, i) => <li key={i}>{f}</li>)}</ol>
                    </div>

                    <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                      <p className="text-xs font-semibold text-purple-800 mb-1">Lessons Learned</p>
                      {r.lessonsLearned.map((l, i) => (
                        <div key={i} className="flex items-start gap-2 mb-1 last:mb-0">
                          <Badge className={cn("text-xs shrink-0", l.impactLevel === "high" ? "bg-red-100 text-red-800" : l.impactLevel === "medium" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800")}>{l.impactLevel}</Badge>
                          <span className="text-sm text-purple-900">{l.lesson} <span className="text-xs text-muted-foreground">({l.category})</span></span>
                        </div>
                      ))}
                    </div>

                    <div><p className="text-xs font-semibold mb-2">Action Plan</p>
                      <table className="w-full text-sm border"><thead className="bg-muted/50"><tr><th className="text-left p-2 font-medium">Action</th><th className="text-left p-2 font-medium">Owner</th><th className="text-left p-2 font-medium">Due</th><th className="text-left p-2 font-medium">Status</th></tr></thead>
                        <tbody>{r.actions.map((a, i) => {
                          const od = a.status !== "completed" && a.dueDate < today;
                          return (
                            <tr key={i} className={cn("border-t", od && "bg-red-50")}>
                              <td className="p-2">{a.action}</td><td className="p-2">{getStaffName(a.owner)}</td>
                              <td className={cn("p-2", od && "text-red-600 font-medium")}>{a.dueDate}</td>
                              <td className="p-2"><Badge className={cn("text-xs", a.status === "completed" ? "bg-green-100 text-green-800" : a.status === "in_progress" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800")}>{a.status.replace("_", " ")}</Badge></td>
                            </tr>
                          );
                        })}</tbody>
                      </table>
                    </div>

                    {r.externalNotifications.length > 0 && (
                      <div><p className="text-xs font-semibold mb-1">External Notifications</p>
                        <div className="flex gap-2 flex-wrap">{r.externalNotifications.map((n, i) => <Badge key={i} variant="outline" className="text-xs">{n.body} — {n.date} (Ref: {n.reference})</Badge>)}</div>
                      </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-3">
                      {r.practiceChanges.length > 0 && (
                        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                          <p className="text-xs font-semibold text-green-800 mb-1">Practice Changes</p>
                          <ul className="text-xs text-green-900 list-disc list-inside">{r.practiceChanges.map((p, i) => <li key={i}>{p}</li>)}</ul>
                        </div>
                      )}
                      {r.trainingImplications.length > 0 && (
                        <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                          <p className="text-xs font-semibold text-indigo-800 mb-1">Training Implications</p>
                          <ul className="text-xs text-indigo-900 list-disc list-inside">{r.trainingImplications.map((t, i) => <li key={i}>{t}</li>)}</ul>
                        </div>
                      )}
                      {r.policyChanges.length > 0 && (
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                          <p className="text-xs font-semibold text-slate-800 mb-1">Policy Changes</p>
                          <ul className="text-xs text-slate-900 list-disc list-inside">{r.policyChanges.map((p, i) => <li key={i}>{p}</li>)}</ul>
                        </div>
                      )}
                    </div>

                    {r.nextReviewDate && <p className="text-xs text-muted-foreground">Next review: <strong>{r.nextReviewDate}</strong></p>}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory Framework</p>
          <p>Children&apos;s Homes Regulations 2015, Reg 40 — Notification of serious events. All serious incidents must be reviewed with lessons learned documented and actions implemented. Ofsted must be notified of serious events. Reviews must consider multi-agency input and result in measurable improvements to practice.</p>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Initiate Review</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input placeholder="Review title" /></div>
            <div><Label>Review Type</Label><Select><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(RT_LABEL) as [ReviewType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Incident Date</Label><Input type="date" /></div><div><Label>Review Start</Label><Input type="date" defaultValue={today} /></div></div>
            <div><Label>Background Summary</Label><Textarea rows={3} placeholder="Background and context…" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={() => setDialogOpen(false)}>Initiate</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

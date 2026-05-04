"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Clock, Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type AppointmentType = "dental" | "optician" | "immunisation" | "gp_registration" | "annual_health" | "hearing" | "growth" | "sexual_health";
type Status = "completed" | "scheduled" | "overdue" | "declined" | "cancelled" | "not_due";

interface HealthMonitoringEntry {
  id: string;
  youngPersonId: string;
  type: AppointmentType;
  provider: string;
  date: string;
  nextDue: string;
  status: Status;
  attendedBy: string | null;
  outcome: string;
  recommendations: string[];
  followUp: string;
  consentObtained: boolean;
  consentFrom: string;
  childViews: string;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const TYPE_LABEL: Record<AppointmentType, string> = {
  dental: "Dental", optician: "Optician", immunisation: "Immunisation", gp_registration: "GP Registration",
  annual_health: "Annual Health Assessment", hearing: "Hearing Test", growth: "Growth / BMI", sexual_health: "Sexual Health",
};
const TYPE_CLR: Record<AppointmentType, string> = {
  dental: "bg-blue-100 text-blue-800", optician: "bg-purple-100 text-purple-800",
  immunisation: "bg-green-100 text-green-800", gp_registration: "bg-teal-100 text-teal-800",
  annual_health: "bg-indigo-100 text-indigo-800", hearing: "bg-amber-100 text-amber-800",
  growth: "bg-pink-100 text-pink-800", sexual_health: "bg-slate-100 text-slate-800",
};
const STAT_LABEL: Record<Status, string> = { completed: "Completed", scheduled: "Scheduled", overdue: "Overdue", declined: "Declined", cancelled: "Cancelled", not_due: "Not Due" };
const STAT_CLR: Record<Status, string> = { completed: "bg-green-100 text-green-800", scheduled: "bg-blue-100 text-blue-800", overdue: "bg-red-100 text-red-800", declined: "bg-amber-100 text-amber-800", cancelled: "bg-gray-100 text-gray-800", not_due: "bg-slate-100 text-slate-800" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: HealthMonitoringEntry[] = [
  // Alex
  { id: "hm1", youngPersonId: "yp_alex", type: "dental", provider: "Millbrook Dental Practice", date: d(-60), nextDue: d(120), status: "completed", attendedBy: "staff_anna", outcome: "No cavities. Good oral hygiene. One small filling due at next visit.", recommendations: ["Continue fluoride toothpaste", "Reduce sugary snacks"], followUp: "Filling booked for next appointment", consentObtained: true, consentFrom: "Karen Holding (SW)", childViews: "Alex doesn't like the dentist but was brave. Asked for a sticker.", notes: "" },
  { id: "hm2", youngPersonId: "yp_alex", type: "optician", provider: "Specsavers Millbrook", date: d(-45), nextDue: d(320), status: "completed", attendedBy: "staff_anna", outcome: "Slight short-sightedness detected. Glasses prescribed for classroom use.", recommendations: ["Glasses for reading/whiteboard", "Re-test in 12 months"], followUp: "Glasses collected and labelled", consentObtained: true, consentFrom: "Karen Holding (SW)", childViews: "Alex chose blue frames. Quite pleased with them.", notes: "School notified about glasses." },
  { id: "hm3", youngPersonId: "yp_alex", type: "immunisation", provider: "Millbrook GP Surgery", date: d(-30), nextDue: d(335), status: "completed", attendedBy: "staff_darren", outcome: "HPV vaccination dose 1 administered. No adverse reaction.", recommendations: ["Monitor for 48 hours", "Dose 2 due in 12 months"], followUp: "Dose 2 booked", consentObtained: true, consentFrom: "Karen Holding (SW)", childViews: "Alex was nervous but coped well.", notes: "" },
  // Jordan
  { id: "hm4", youngPersonId: "yp_jordan", type: "dental", provider: "Fairfield Dental Care", date: d(-90), nextDue: d(90), status: "completed", attendedBy: "staff_ryan", outcome: "Teeth healthy. Jordan tolerated the check-up well despite sensory sensitivity to dental tools. Shorter appointment arranged for next time.", recommendations: ["Sensory-friendly appointment (first of day)", "Electric toothbrush recommended"], followUp: "Next check-up booked with sensory accommodations", consentObtained: true, consentFrom: "Michael Osei (SW)", childViews: "Jordan found it uncomfortable but said it was better than last time.", notes: "Dentist aware of ASD." },
  { id: "hm5", youngPersonId: "yp_jordan", type: "optician", provider: "Specsavers Fairfield", date: d(-180), nextDue: d(14), status: "scheduled", attendedBy: null, outcome: "", recommendations: [], followUp: "", consentObtained: true, consentFrom: "Michael Osei (SW)", childViews: "", notes: "Due for annual eye test." },
  { id: "hm6", youngPersonId: "yp_jordan", type: "hearing", provider: "Fairfield Audiology", date: d(-120), nextDue: d(245), status: "completed", attendedBy: "staff_ryan", outcome: "Hearing within normal range. No concerns. Jordan's sensitivity to sound is sensory processing related, not auditory.", recommendations: ["No further audiology review needed", "Continue noise-cancelling headphones provision"], followUp: "None — discharged from audiology", consentObtained: true, consentFrom: "Michael Osei (SW)", childViews: "Jordan was relieved there's nothing wrong with his ears.", notes: "" },
  // Casey
  { id: "hm7", youngPersonId: "yp_casey", type: "dental", provider: "Southgate Community Dental", date: d(-200), nextDue: d(-20), status: "overdue", attendedBy: null, outcome: "", recommendations: [], followUp: "Appointment to be rebooked — Casey refused last appointment due to anxiety", consentObtained: true, consentFrom: "Fiona Brennan (SW)", childViews: "Casey is very anxious about dental visits. Previous negative experience.", notes: "Exploring sedation dentistry options. Discussed with Fiona." },
  { id: "hm8", youngPersonId: "yp_casey", type: "annual_health", provider: "LAC Nurse — Dr Kapoor", date: d(-150), nextDue: d(215), status: "completed", attendedBy: "staff_darren", outcome: "Overall health good. BMI slightly low — monitoring required. Emotional wellbeing flagged as concern. CAMHS referral recommended.", recommendations: ["Monitor weight monthly", "Encourage balanced diet", "CAMHS referral for PTSD assessment"], followUp: "CAMHS referral submitted. Weight monitoring in progress.", consentObtained: true, consentFrom: "Fiona Brennan (SW)", childViews: "Casey engaged well with the nurse. Appreciated being asked for her views.", notes: "" },
  { id: "hm9", youngPersonId: "yp_casey", type: "immunisation", provider: "Southgate GP", date: d(7), nextDue: d(7), status: "scheduled", attendedBy: null, outcome: "", recommendations: [], followUp: "", consentObtained: true, consentFrom: "Fiona Brennan (SW)", childViews: "Casey is nervous but willing.", notes: "Catch-up immunisations — missed due to placement moves." },
  { id: "hm10", youngPersonId: "yp_casey", type: "growth", provider: "School Nurse", date: d(-30), nextDue: d(60), status: "completed", attendedBy: "staff_chervelle", outcome: "Height: 152cm. Weight: 38kg. BMI: 16.4 (underweight). Growth tracking shows steady height gain but weight has plateaued.", recommendations: ["High-calorie healthy snacks", "Meal plan review", "Reweigh in 3 months"], followUp: "Menu plan updated with nutritionist input", consentObtained: true, consentFrom: "Fiona Brennan (SW)", childViews: "Casey doesn't like being weighed. Handled sensitively.", notes: "Linked to menu planning and health records." },
];

/* ── component ─────────────────────────────────────────────────────────────── */

export default function HealthMonitoringPage() {
  const [data] = useState<HealthMonitoringEntry[]>(SEED);
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("overdue");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);
  const today = d(0);

  const filtered = useMemo(() => {
    let out = [...data];
    if (search) { const s = search.toLowerCase(); out = out.filter(r => getYPName(r.youngPersonId).toLowerCase().includes(s) || r.provider.toLowerCase().includes(s)); }
    if (childFilter !== "all") out = out.filter(r => r.youngPersonId === childFilter);
    if (typeFilter !== "all") out = out.filter(r => r.type === typeFilter);
    if (statusFilter !== "all") out = out.filter(r => r.status === statusFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "type": return a.type.localeCompare(b.type);
        default: { /* overdue first */ const od = (r: HealthMonitoringEntry) => r.status === "overdue" ? 0 : r.status === "scheduled" ? 1 : 2; return od(a) - od(b); }
      }
    });
    return out;
  }, [data, search, childFilter, typeFilter, statusFilter, sortBy]);

  const childIds = ["yp_alex", "yp_jordan", "yp_casey"];
  const overdue = data.filter(r => r.status === "overdue").length;
  const scheduled = data.filter(r => r.status === "scheduled").length;
  const completed = data.filter(r => r.status === "completed").length;

  const exportCols: ExportColumn<HealthMonitoringEntry>[] = useMemo(() => [
    { header: "Young Person", accessor: (r: HealthMonitoringEntry) => getYPName(r.youngPersonId) },
    { header: "Type", accessor: (r: HealthMonitoringEntry) => TYPE_LABEL[r.type] },
    { header: "Provider", accessor: (r: HealthMonitoringEntry) => r.provider },
    { header: "Date", accessor: (r: HealthMonitoringEntry) => r.date },
    { header: "Next Due", accessor: (r: HealthMonitoringEntry) => r.nextDue },
    { header: "Status", accessor: (r: HealthMonitoringEntry) => STAT_LABEL[r.status] },
    { header: "Attended By", accessor: (r: HealthMonitoringEntry) => r.attendedBy ? getStaffName(r.attendedBy) : "—" },
    { header: "Outcome", accessor: (r: HealthMonitoringEntry) => r.outcome || "—" },
    { header: "Consent From", accessor: (r: HealthMonitoringEntry) => r.consentFrom },
    { header: "Follow-Up", accessor: (r: HealthMonitoringEntry) => r.followUp || "None" },
  ], []);

  return (
    <PageShell
      title="Health Monitoring"
      subtitle="Dental, optician, immunisation, and routine health checks — Regulation 23"
      actions={[
        <PrintButton key="p" title="Health Monitoring" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="health-monitoring" />,
        <Button key="n" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Add Record</Button>,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Records", value: data.length, icon: Stethoscope, colour: "text-blue-600" },
            { label: "Completed", value: completed, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Scheduled", value: scheduled, icon: Clock, colour: "text-blue-600" },
            { label: "Overdue", value: overdue, icon: AlertTriangle, colour: "text-red-600" },
          ].map(s => (
            <Card key={s.label}><CardContent className="pt-4 flex items-center gap-3"><s.icon className={cn("h-8 w-8", s.colour)} /><div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></CardContent></Card>
          ))}
        </div>

        {/* overdue alert */}
        {overdue > 0 && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">{overdue} overdue appointment{overdue > 1 ? "s" : ""}</p>
              <ul className="text-sm text-red-800 mt-1 list-disc list-inside">{data.filter(r => r.status === "overdue").map(r => <li key={r.id}>{getYPName(r.youngPersonId)} — {TYPE_LABEL[r.type]} (due {r.nextDue})</li>)}</ul>
            </div>
          </div>
        )}

        {/* per-child health matrix */}
        <Card>
          <CardHeader><CardTitle className="text-base">Health Check Matrix</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-muted/50">
                  <tr><th className="text-left p-2 font-medium">Young Person</th>
                  {(Object.entries(TYPE_LABEL) as [AppointmentType, string][]).map(([k, v]) => <th key={k} className="text-center p-2 font-medium text-xs">{v}</th>)}</tr>
                </thead>
                <tbody>
                  {childIds.map(cid => (
                    <tr key={cid} className="border-t">
                      <td className="p-2 font-medium">{getYPName(cid)}</td>
                      {(Object.keys(TYPE_LABEL) as AppointmentType[]).map(t => {
                        const rec = data.filter(r => r.youngPersonId === cid && r.type === t).sort((a, b) => b.date.localeCompare(a.date))[0];
                        return (
                          <td key={t} className="p-2 text-center">
                            {rec ? <Badge className={cn("text-xs", STAT_CLR[rec.status])}>{STAT_LABEL[rec.status]}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* filter */}
        <Card><CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]"><Label className="text-xs">Search</Label><div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Name, provider…" value={search} onChange={e => setSearch(e.target.value)} /></div></div>
            <div className="w-36"><Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Child</Label><Select value={childFilter} onValueChange={setChildFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{childIds.map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-44"><Label className="text-xs">Type</Label><Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(Object.entries(TYPE_LABEL) as [AppointmentType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-36"><Label className="text-xs">Status</Label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(Object.entries(STAT_LABEL) as [Status, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-36"><Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="overdue">Overdue First</SelectItem><SelectItem value="date">Date</SelectItem><SelectItem value="type">Type</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent></Card>

        {/* record cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            return (
              <Card key={r.id} className={cn(r.status === "overdue" && "border-red-300")}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{getYPName(r.youngPersonId)}</CardTitle>
                        <Badge className={cn("text-xs", TYPE_CLR[r.type])}>{TYPE_LABEL[r.type]}</Badge>
                        <Badge className={cn("text-xs", STAT_CLR[r.status])}>{STAT_LABEL[r.status]}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{r.date}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.provider}</p>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-3 pt-0">
                    {r.attendedBy && <p className="text-sm"><strong>Attended by:</strong> {getStaffName(r.attendedBy)}</p>}
                    {r.outcome && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-semibold text-green-800 mb-1">Outcome</p>
                        <p className="text-sm text-green-900">{r.outcome}</p>
                      </div>
                    )}
                    {r.recommendations.length > 0 && (
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-semibold text-blue-800 mb-1">Recommendations</p>
                        <ul className="text-sm text-blue-900 list-disc list-inside">{r.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}</ul>
                      </div>
                    )}
                    {r.followUp && <p className="text-sm"><strong>Follow-up:</strong> {r.followUp}</p>}
                    {r.childViews && (
                      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                        <p className="text-xs font-semibold text-pink-800 mb-1">Child&apos;s Views</p>
                        <p className="text-sm text-pink-900">{r.childViews}</p>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      <span>Consent: {r.consentFrom}</span> · <span>Next due: <strong className={cn(r.nextDue < today && "text-red-600")}>{r.nextDue}</strong></span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory Framework</p>
          <p>Children&apos;s Homes Regulations 2015, Reg 23 — Health of children. Looked-after children must have access to dental check-ups every 6 months, annual eye tests, up-to-date immunisations, and statutory health assessments. All health appointments must be tracked, consented by the appropriate person, and outcomes documented.</p>
        </div>
      </div>

      {/* dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Health Record</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Young Person</Label><Select><SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger><SelectContent>{childIds.map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Type</Label><Select><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(TYPE_LABEL) as [AppointmentType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Provider</Label><Input placeholder="e.g. Millbrook Dental Practice" /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Date</Label><Input type="date" /></div><div><Label>Next Due</Label><Input type="date" /></div></div>
            <div><Label>Outcome</Label><Textarea rows={2} placeholder="Appointment outcome…" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setDialogOpen(false)}>Save Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

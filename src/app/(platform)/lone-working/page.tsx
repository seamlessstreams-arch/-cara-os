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
  AlertTriangle, CheckCircle2, Clock, Shield, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type Scenario = "waking_night" | "sleep_in_cover" | "transport" | "community_outing" | "office_admin" | "home_visit" | "on_call" | "building_check";
type RiskLevel = "low" | "medium" | "high";
type AssessmentStatus = "current" | "due_review" | "expired";

interface LoneWorkingRecord {
  id: string;
  staffId: string;
  scenario: Scenario;
  riskLevel: RiskLevel;
  status: AssessmentStatus;
  assessmentDate: string;
  reviewDate: string;
  assessedBy: string;
  hazards: string[];
  controlMeasures: string[];
  checkInProtocol: string;
  personalAlarmIssued: boolean;
  emergencyProcedure: string;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SCENARIO_LABEL: Record<Scenario, string> = {
  waking_night: "Waking Night Shift", sleep_in_cover: "Sleep-In (Cover Role)",
  transport: "Transport / Driving", community_outing: "Community Outing (1:1)",
  office_admin: "Office / Admin (alone in office)", home_visit: "Home Visit / Meeting Off-Site",
  on_call: "On-Call Manager", building_check: "Building / Premises Check",
};
const RISK_LABEL: Record<RiskLevel, string> = { low: "Low", medium: "Medium", high: "High" };
const RISK_CLR: Record<RiskLevel, string> = { low: "bg-green-100 text-green-800", medium: "bg-yellow-100 text-yellow-800", high: "bg-red-100 text-red-800" };
const STATUS_LABEL: Record<AssessmentStatus, string> = { current: "Current", due_review: "Due Review", expired: "Expired" };
const STATUS_CLR: Record<AssessmentStatus, string> = { current: "bg-green-100 text-green-800", due_review: "bg-amber-100 text-amber-800", expired: "bg-red-100 text-red-800" };
const BORDER_RISK: Record<RiskLevel, string> = { low: "border-l-green-400", medium: "border-l-yellow-400", high: "border-l-red-500" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: LoneWorkingRecord[] = [
  {
    id: "lw_1", staffId: "staff_lackson", scenario: "waking_night", riskLevel: "medium",
    status: "current", assessmentDate: d(-30), reviewDate: d(152), assessedBy: "staff_darren",
    hazards: [
      "Physical isolation — sole waking staff member in building",
      "Young person disturbance — potential for violence or absconding",
      "Medical emergency — sole first aider on duty",
      "Fire — evacuation of sleeping YP with single staff",
      "Intruder — lone worker confrontation risk",
      "Personal health emergency — no colleague immediately available",
    ],
    controlMeasures: [
      "Sleep-in staff always present as backup (not lone working in isolation)",
      "Buddy check system: text on-call manager at 00:00 and 04:00",
      "Personal alarm carried at all times",
      "CCTV monitoring of external areas and communal areas",
      "All external doors locked and alarmed from 22:00",
      "Emergency contact numbers displayed in office",
      "Mobile phone carried at all times with full charge",
      "Night staff guidance document read and signed",
    ],
    checkInProtocol: "Text check-in to on-call manager at midnight and 4am. Content: 'All settled / [number] disturbances / any concerns.' If on-call receives no check-in within 15 minutes of scheduled time, on-call will call the home. If no answer after 2 attempts, on-call will attend the home.",
    personalAlarmIssued: true,
    emergencyProcedure: "Activate personal alarm to wake sleep-in staff. Call 999 for emergency services. Call on-call manager. Follow specific emergency procedures (fire, missing, medical) as per night staff guidance.",
    notes: "Lackson has completed lone working training. Personal alarm tested monthly. Last test: " + d(-5) + " — functioning correctly.",
  },
  {
    id: "lw_2", staffId: "staff_anna", scenario: "community_outing", riskLevel: "medium",
    status: "current", assessmentDate: d(-14), reviewDate: d(168), assessedBy: "staff_darren",
    hazards: [
      "1:1 with young person in community — allegation risk",
      "Young person absconding during outing",
      "Road safety — crossing busy roads",
      "Public confrontation or challenging behaviour in public space",
      "Medical emergency away from home",
    ],
    controlMeasures: [
      "Dynamic risk assessment completed before each outing",
      "Route and destination agreed and communicated to home before departure",
      "Mobile phone carried with full charge",
      "First aid kit in vehicle / bag",
      "Young person's emergency medication (if applicable) carried",
      "Check-in call/text to home at agreed intervals (hourly for standard outings)",
      "Pre-outing briefing with YP about expectations",
      "Allegation-aware practice: public spaces preferred, avoid isolated locations",
    ],
    checkInProtocol: "Text home on departure, arrival at destination, and departure from destination. Hourly check-in for outings over 2 hours. Immediate call if any incident or concern.",
    personalAlarmIssued: false,
    emergencyProcedure: "Call 999 if emergency. Call home immediately. If YP absconds, do not chase into unsafe areas — call police (missing from care) and then call home.",
    notes: "Anna regularly takes Casey on 1:1 outings (art supplies, café visits). Dynamic risk assessment template in Anna's work folder.",
  },
  {
    id: "lw_3", staffId: "staff_darren", scenario: "on_call", riskLevel: "low",
    status: "current", assessmentDate: d(-60), reviewDate: d(122), assessedBy: "staff_darren",
    hazards: [
      "Attending home during emergency — potential for confrontation",
      "Fatigue — on-call during off-duty periods",
      "Driving to home at unsocial hours",
      "Decision-making in isolation during crisis",
    ],
    controlMeasures: [
      "On-call phone fully charged with emergency numbers saved",
      "RI available as escalation contact",
      "On-call guidance document available on phone",
      "If attending home, notify RI of attendance",
      "Do not attend home alone if violence risk identified — request police attendance",
      "On-call rota ensures adequate rest between on-call periods",
    ],
    checkInProtocol: "On-call manager receives buddy checks from night staff at 00:00 and 04:00. If attending home, text RI on arrival and departure.",
    personalAlarmIssued: false,
    emergencyProcedure: "If attending an emergency at the home, park in a safe location. Assess before entering. If violence suspected, wait for police. Contact RI immediately for any Ofsted-notifiable event.",
    notes: "Darren and Ryan share on-call rota. On-call guidance document reviewed quarterly.",
  },
  {
    id: "lw_4", staffId: "staff_ryan", scenario: "building_check", riskLevel: "low",
    status: "current", assessmentDate: d(-45), reviewDate: d(137), assessedBy: "staff_darren",
    hazards: [
      "Slips, trips, falls during external checks (especially in dark/wet conditions)",
      "Encountering intruder during perimeter check",
      "Working at height — checking gutters, external lights",
    ],
    controlMeasures: [
      "Building checks conducted during daylight where possible",
      "Torch carried for any checks in poor light",
      "Mobile phone carried",
      "No working at height without a second person present",
      "External checks — walk perimeter, do not enter any suspicious areas alone",
      "Report any concerns to RM before investigating further",
    ],
    checkInProtocol: "Inform a colleague before starting external building check. Estimated time of 15 minutes. If not returned in 20 minutes, colleague to check.",
    personalAlarmIssued: false,
    emergencyProcedure: "Call for assistance from inside the home. If encountering an intruder, retreat to the home, lock doors, call 999.",
    notes: "Weekly building checks conducted by Ryan as part of H&S duties.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function LoneWorkingPage() {
  const [data] = useState(SEED);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [sortBy, setSortBy] = useState("risk");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterRisk !== "all" && r.riskLevel !== filterRisk) return false;
      if (search) {
        const q = search.toLowerCase();
        return getStaffName(r.staffId).toLowerCase().includes(q) || SCENARIO_LABEL[r.scenario].toLowerCase().includes(q);
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "risk": { const o = ["high", "medium", "low"]; return o.indexOf(a.riskLevel) - o.indexOf(b.riskLevel); }
        case "date": return b.assessmentDate.localeCompare(a.assessmentDate);
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterRisk, sortBy]);

  const current = data.filter((r) => r.status === "current").length;
  const dueReview = data.filter((r) => r.status === "due_review").length;
  const expired = data.filter((r) => r.status === "expired").length;

  const exportCols: ExportColumn<LoneWorkingRecord>[] = [
    { header: "Staff", accessor: (r: LoneWorkingRecord) => getStaffName(r.staffId) },
    { header: "Scenario", accessor: (r: LoneWorkingRecord) => SCENARIO_LABEL[r.scenario] },
    { header: "Risk Level", accessor: (r: LoneWorkingRecord) => RISK_LABEL[r.riskLevel] },
    { header: "Status", accessor: (r: LoneWorkingRecord) => STATUS_LABEL[r.status] },
    { header: "Assessment Date", accessor: (r: LoneWorkingRecord) => r.assessmentDate },
    { header: "Review Date", accessor: (r: LoneWorkingRecord) => r.reviewDate },
    { header: "Hazards", accessor: (r: LoneWorkingRecord) => r.hazards.join("; ") },
    { header: "Controls", accessor: (r: LoneWorkingRecord) => r.controlMeasures.join("; ") },
    { header: "Check-In Protocol", accessor: (r: LoneWorkingRecord) => r.checkInProtocol },
    { header: "Personal Alarm", accessor: (r: LoneWorkingRecord) => r.personalAlarmIssued ? "Yes" : "No" },
  ];

  return (
    <PageShell title="Lone Working Assessments" subtitle="Health & Safety at Work Act 1974 · Management of H&S at Work Regs 1999" actions={<div className="flex items-center gap-2"><PrintButton title="Lone Working" /><ExportButton data={filtered} columns={exportCols} filename="lone-working" /><Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Assessment</Button></div>}>
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Assessments", value: data.length, icon: Shield, clr: "text-blue-600" },
            { label: "Current", value: current, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Due Review", value: dueReview, icon: Clock, clr: "text-amber-600" },
            { label: "Expired", value: expired, icon: AlertTriangle, clr: "text-red-600" },
          ].map((s) => (
            <Card key={s.label}><CardContent className="pt-4 pb-3 text-center"><s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} /><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search staff, scenario…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={filterRisk} onValueChange={setFilterRisk}><SelectTrigger className="w-[140px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Risk</SelectItem>{(Object.keys(RISK_LABEL) as RiskLevel[]).map((k) => (<SelectItem key={k} value={k}>{RISK_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="risk">By Risk</SelectItem><SelectItem value="date">By Date</SelectItem></SelectContent></Select>
        </div>

        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_RISK[r.riskLevel])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> {getStaffName(r.staffId)} — {SCENARIO_LABEL[r.scenario]}<Badge variant="outline" className={RISK_CLR[r.riskLevel]}>{RISK_LABEL[r.riskLevel]}</Badge><Badge variant="outline" className={STATUS_CLR[r.status]}>{STATUS_LABEL[r.status]}</Badge></CardTitle>
                      <p className="text-sm text-muted-foreground">Assessed: {r.assessmentDate} · Review: {r.reviewDate} · By: {getStaffName(r.assessedBy)}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    <div className="bg-red-50 rounded-lg p-3"><p className="font-medium text-red-800 mb-2">Hazards Identified</p><ul className="space-y-1">{r.hazards.map((h, i) => (<li key={i} className="text-xs text-red-700 flex items-start gap-1"><AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" /> {h}</li>))}</ul></div>
                    <div className="bg-green-50 rounded-lg p-3"><p className="font-medium text-green-800 mb-2">Control Measures</p><ul className="space-y-1">{r.controlMeasures.map((cm, i) => (<li key={i} className="text-xs text-green-700 flex items-start gap-1"><CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" /> {cm}</li>))}</ul></div>
                    <div className="bg-blue-50 rounded-lg p-3"><p className="font-medium text-blue-800 mb-1">Check-In Protocol</p><p className="text-blue-700 text-xs">{r.checkInProtocol}</p></div>
                    <div className="bg-amber-50 rounded-lg p-3"><p className="font-medium text-amber-800 mb-1">Emergency Procedure</p><p className="text-amber-700 text-xs">{r.emergencyProcedure}</p></div>
                    <div className="flex gap-4 text-xs">{r.personalAlarmIssued && <Badge variant="outline" className="bg-purple-50">Personal Alarm Issued</Badge>}</div>
                    {r.notes && <div><p className="font-medium mb-1">Notes</p><p className="text-muted-foreground text-xs">{r.notes}</p></div>}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Health and Safety at Work Act 1974 — duty to assess and mitigate risks for lone workers. Management of Health and Safety at Work Regulations 1999 — specific risk assessments required. HSE guidance on lone working. Children&apos;s Homes (England) Regulations 2015 — safe staffing. Working Time Regulations 1998 — rest periods. All lone working scenarios must have a documented risk assessment reviewed annually or when circumstances change.</p>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Lone Working Assessment</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Staff Member</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{["staff_darren","staff_ryan","staff_anna","staff_edward","staff_chervelle","staff_lackson","staff_mirela"].map((s) => (<SelectItem key={s} value={s}>{getStaffName(s)}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Scenario</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(SCENARIO_LABEL) as Scenario[]).map((k) => (<SelectItem key={k} value={k}>{SCENARIO_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Risk Level</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(RISK_LABEL) as RiskLevel[]).map((k) => (<SelectItem key={k} value={k}>{RISK_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Review Date</Label><Input type="date" /></div>
            <div className="col-span-2"><Label>Hazards</Label><Textarea rows={3} placeholder="Identified hazards…" /></div>
            <div className="col-span-2"><Label>Control Measures</Label><Textarea rows={3} placeholder="How risks are managed…" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button onClick={() => setShowNew(false)}>Save Assessment</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
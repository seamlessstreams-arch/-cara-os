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
  AlertTriangle, CheckCircle2, Clock, Heart, Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type LeftReason = "age_18" | "moved_placement" | "reunification" | "semi_independent" | "adoption" | "other";
type AccomStatus = "stable" | "at_risk" | "homeless" | "sofa_surfing" | "supported_housing";
type EETStatus = "education" | "employment" | "training" | "neet" | "unknown";
type RAG = "green" | "amber" | "red";
type Wellbeing = "good" | "fair" | "poor" | "concern";

interface ContactLog { date: string; type: string; staffId: string; summary: string; wellbeing: Wellbeing }
interface SupportPkg { area: string; provider: string; frequency: string; status: "active" | "ended" | "pending" }

interface AfterCareRecord {
  id: string;
  youngPersonId: string;
  leftDate: string;
  leftReason: LeftReason;
  currentAccommodation: string;
  accommodationStatus: AccomStatus;
  educationEmployment: string;
  eetStatus: EETStatus;
  stayingCloseEligible: boolean;
  supportPackage: SupportPkg[];
  contactLog: ContactLog[];
  keyWorker: string;
  personalAdviser: string;
  pathwayPlan: boolean;
  pathwayPlanReviewDate: string | null;
  emergencyContact: string;
  currentConcerns: string[];
  positives: string[];
  overallRag: RAG;
  nextContactDue: string;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const LR_LABEL: Record<LeftReason, string> = { age_18: "Turned 18", moved_placement: "Moved Placement", reunification: "Reunification", semi_independent: "Semi-Independent", adoption: "Adoption", other: "Other" };
const LR_CLR: Record<LeftReason, string> = { age_18: "bg-blue-100 text-blue-800", moved_placement: "bg-purple-100 text-purple-800", reunification: "bg-green-100 text-green-800", semi_independent: "bg-teal-100 text-teal-800", adoption: "bg-indigo-100 text-indigo-800", other: "bg-gray-100 text-gray-800" };

const AS_LABEL: Record<AccomStatus, string> = { stable: "Stable", at_risk: "At Risk", homeless: "Homeless", sofa_surfing: "Sofa Surfing", supported_housing: "Supported Housing" };
const AS_CLR: Record<AccomStatus, string> = { stable: "bg-green-100 text-green-800", at_risk: "bg-amber-100 text-amber-800", homeless: "bg-red-100 text-red-800", sofa_surfing: "bg-orange-100 text-orange-800", supported_housing: "bg-blue-100 text-blue-800" };

const EET_LABEL: Record<EETStatus, string> = { education: "Education", employment: "Employment", training: "Training", neet: "NEET", unknown: "Unknown" };
const EET_CLR: Record<EETStatus, string> = { education: "bg-blue-100 text-blue-800", employment: "bg-green-100 text-green-800", training: "bg-teal-100 text-teal-800", neet: "bg-red-100 text-red-800", unknown: "bg-gray-100 text-gray-800" };

const RAG_CLR: Record<RAG, string> = { green: "border-green-400 bg-green-50", amber: "border-amber-400 bg-amber-50", red: "border-red-400 bg-red-50" };
const RAG_BADGE: Record<RAG, string> = { green: "bg-green-100 text-green-800", amber: "bg-amber-100 text-amber-800", red: "bg-red-100 text-red-800" };

const WB_CLR: Record<Wellbeing, string> = { good: "text-green-600", fair: "text-blue-600", poor: "text-amber-600", concern: "text-red-600" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: AfterCareRecord[] = [
  {
    id: "ac1", youngPersonId: "yp_alex", leftDate: d(-180), leftReason: "semi_independent",
    currentAccommodation: "Supported flat — 12b Elm Close, managed by Fresh Start Housing",
    accommodationStatus: "stable", educationEmployment: "Level 2 Electrical Installation at Millbrook College", eetStatus: "education",
    stayingCloseEligible: true,
    supportPackage: [
      { area: "Mentoring", provider: "Oak House (Darren)", frequency: "Fortnightly", status: "active" },
      { area: "Housing Support", provider: "Fresh Start Housing", frequency: "Weekly", status: "active" },
      { area: "College Support", provider: "Millbrook College Student Services", frequency: "As needed", status: "active" },
    ],
    contactLog: [
      { date: d(-7), type: "Phone call", staffId: "staff_darren", summary: "Alex sounding positive. College going well — passed first unit. Flat is tidy. Cooking for himself most nights. Misses Jordan and Casey.", wellbeing: "good" },
      { date: d(-35), type: "Visit", staffId: "staff_darren", summary: "Visited Alex at his flat. Place is well-maintained. Alex showed his college work proudly. Discussed budgeting — managing well with support from Fresh Start.", wellbeing: "good" },
      { date: d(-63), type: "Phone call", staffId: "staff_anna", summary: "Quick check-in. Alex was a bit down — missed Christmas at Oak House. Invited him for New Year dinner.", wellbeing: "fair" },
      { date: d(-91), type: "Phone call", staffId: "staff_darren", summary: "Monthly call. Alex settled well into flat. Some initial struggles with cooking and cleaning routines but improving.", wellbeing: "fair" },
    ],
    keyWorker: "staff_darren", personalAdviser: "Gemma Woodford — Millbrook Leaving Care Team",
    pathwayPlan: true, pathwayPlanReviewDate: d(14),
    emergencyContact: "Darren Laville (RM, Oak House) — 07700 900123",
    currentConcerns: [],
    positives: ["Stable accommodation", "Engaged in education", "Good budgeting skills", "Maintaining positive relationships with Oak House", "Cooking independently"],
    overallRag: "green", nextContactDue: d(7), notes: "Alex is doing well. One of our best transition outcomes. Staying Close visits are valued and should continue.",
  },
  {
    id: "ac2", youngPersonId: "yp_jordan", leftDate: d(-90), leftReason: "moved_placement",
    currentAccommodation: "Birchwood House residential children's home — Fairfield",
    accommodationStatus: "stable", educationEmployment: "Year 10 at Fairfield Academy — attending regularly", eetStatus: "education",
    stayingCloseEligible: false,
    supportPackage: [
      { area: "Transition Support", provider: "Oak House (Ryan)", frequency: "Monthly call", status: "active" },
    ],
    contactLog: [
      { date: d(-14), type: "Phone call", staffId: "staff_ryan", summary: "Spoke with Jordan. Initial weeks at Birchwood were very difficult — wanted to come back to Oak House. Now settling better. Has made one friend. Key worker is supportive. Still struggles with sensory issues at new placement but they are aware of his profile.", wellbeing: "fair" },
      { date: d(-45), type: "Phone call", staffId: "staff_ryan", summary: "Jordan was upset on call. Said new staff don't understand his autism like we did. Shared sensory profile and BSP with Birchwood manager at Jordan's request.", wellbeing: "poor" },
    ],
    keyWorker: "staff_ryan", personalAdviser: "N/A (under 16)",
    pathwayPlan: false, pathwayPlanReviewDate: null,
    emergencyContact: "Michael Osei (Social Worker) — 01onal 445 9821",
    currentConcerns: ["Struggled with transition to new placement", "Sensory environment at Birchwood not yet fully adapted", "Emotional regulation setback during move"],
    positives: ["Now attending school regularly", "Made a friend at new placement", "Key worker relationship developing", "Maintaining contact with Oak House"],
    overallRag: "amber", nextContactDue: d(7), notes: "Jordan's move was difficult but he is stabilising. Important to maintain contact as he values the relationship with Oak House staff.",
  },
  {
    id: "ac3", youngPersonId: "yp_casey", leftDate: d(-30), leftReason: "reunification",
    currentAccommodation: "Grandmother's house — 45 Hawthorn Avenue, Southgate",
    accommodationStatus: "at_risk", educationEmployment: "Part-time Level 1 Hair & Beauty at Southgate College", eetStatus: "education",
    stayingCloseEligible: true,
    supportPackage: [
      { area: "Family Support", provider: "Southgate Family Services", frequency: "Weekly", status: "active" },
      { area: "Counselling", provider: "CAMHS Southgate", frequency: "Fortnightly", status: "active" },
      { area: "Mentoring", provider: "Oak House (Darren)", frequency: "Weekly phone + monthly visit", status: "active" },
    ],
    contactLog: [
      { date: d(-3), type: "Phone call", staffId: "staff_darren", summary: "Casey sounded tired. Grandmother has been unwell — Casey doing a lot of household chores. Enjoying college but finding the commute tiring. Missing the structure of Oak House. Asked about coming back for a visit.", wellbeing: "fair" },
      { date: d(-10), type: "Visit", staffId: "staff_darren", summary: "Visited Casey and grandmother. House is clean but grandmother visibly frail. Casey managing well domestically but emotionally burdened. Discussed respite options with Fiona.", wellbeing: "concern" },
      { date: d(-18), type: "Phone call", staffId: "staff_chervelle", summary: "Casey called us — upset after argument with grandmother about going out. De-escalated over phone. Casey calmed down. Grandmother apologised. Typical boundary-testing but in fragile family context.", wellbeing: "poor" },
    ],
    keyWorker: "staff_darren", personalAdviser: "N/A (under 16)",
    pathwayPlan: false, pathwayPlanReviewDate: null,
    emergencyContact: "Fiona Brennan (Social Worker) — 01onal 332 7765",
    currentConcerns: ["Grandmother's health declining", "Casey taking on carer role — inappropriate for her age", "Accommodation at risk if grandmother's health worsens", "Emotional burden of reunification"],
    positives: ["Enrolled in college", "Maintaining relationship with Oak House", "Engaging with counselling", "Showing resilience and maturity"],
    overallRag: "amber", nextContactDue: d(4), notes: "High contact frequency due to concerns about grandmother's health. Contingency plan needed if grandmother can no longer care for Casey. Fiona aware.",
  },
];

/* ── component ─────────────────────────────────────────────────────────────── */

export default function AfterCarePage() {
  const [data] = useState<AfterCareRecord[]>(SEED);
  const [search, setSearch] = useState("");
  const [ragFilter, setRagFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rag");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);
  const today = d(0);

  const filtered = useMemo(() => {
    let out = [...data];
    if (search) { const s = search.toLowerCase(); out = out.filter(r => getYPName(r.youngPersonId).toLowerCase().includes(s) || r.currentAccommodation.toLowerCase().includes(s)); }
    if (ragFilter !== "all") out = out.filter(r => r.overallRag === ragFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "name": return getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId));
        case "left": return a.leftDate.localeCompare(b.leftDate);
        default: { const ord: RAG[] = ["red", "amber", "green"]; return ord.indexOf(a.overallRag) - ord.indexOf(b.overallRag); }
      }
    });
    return out;
  }, [data, search, ragFilter, sortBy]);

  const stayingClose = data.filter(r => r.stayingCloseEligible).length;
  const eetRate = Math.round(data.filter(r => r.eetStatus !== "neet" && r.eetStatus !== "unknown").length / data.length * 100);
  const contactOverdue = data.filter(r => r.nextContactDue < today).length;

  const exportCols: ExportColumn<AfterCareRecord>[] = useMemo(() => [
    { header: "Young Person", accessor: (r: AfterCareRecord) => getYPName(r.youngPersonId) },
    { header: "Left Date", accessor: (r: AfterCareRecord) => r.leftDate },
    { header: "Left Reason", accessor: (r: AfterCareRecord) => LR_LABEL[r.leftReason] },
    { header: "Accommodation", accessor: (r: AfterCareRecord) => r.currentAccommodation },
    { header: "Accommodation Status", accessor: (r: AfterCareRecord) => AS_LABEL[r.accommodationStatus] },
    { header: "EET", accessor: (r: AfterCareRecord) => r.educationEmployment },
    { header: "EET Status", accessor: (r: AfterCareRecord) => EET_LABEL[r.eetStatus] },
    { header: "RAG", accessor: (r: AfterCareRecord) => r.overallRag.toUpperCase() },
    { header: "Key Worker", accessor: (r: AfterCareRecord) => getStaffName(r.keyWorker) },
    { header: "Next Contact", accessor: (r: AfterCareRecord) => r.nextContactDue },
    { header: "Concerns", accessor: (r: AfterCareRecord) => r.currentConcerns.join("; ") },
    { header: "Positives", accessor: (r: AfterCareRecord) => r.positives.join("; ") },
  ], []);

  return (
    <PageShell
      title="After-Care & Staying Close"
      subtitle="Post-placement support and outcomes tracking — Children Act 1989"
      actions={[
        <PrintButton key="p" title="After-Care & Staying Close" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="after-care" />,
        <Button key="n" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Add Record</Button>,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Cases", value: data.length, icon: Heart, colour: "text-blue-600" },
            { label: "Staying Close", value: stayingClose, icon: Home, colour: "text-teal-600" },
            { label: "EET Rate", value: `${eetRate}%`, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Contact Overdue", value: contactOverdue, icon: AlertTriangle, colour: "text-red-600" },
          ].map(s => (
            <Card key={s.label}><CardContent className="pt-4 flex items-center gap-3"><s.icon className={cn("h-8 w-8", s.colour)} /><div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></CardContent></Card>
          ))}
        </div>

        {/* RAG overview cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {data.map(r => {
            const daysSince = r.contactLog.length ? Math.round((Date.now() - new Date(r.contactLog[0].date).getTime()) / 86400000) : 999;
            return (
              <Card key={r.id} className={cn("border-l-4", RAG_CLR[r.overallRag])}>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2">{getYPName(r.youngPersonId)} <Badge className={cn("text-xs", RAG_BADGE[r.overallRag])}>{r.overallRag.toUpperCase()}</Badge></CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Accommodation</span><Badge className={cn("text-xs", AS_CLR[r.accommodationStatus])}>{AS_LABEL[r.accommodationStatus]}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">EET</span><Badge className={cn("text-xs", EET_CLR[r.eetStatus])}>{EET_LABEL[r.eetStatus]}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Last Contact</span><span>{daysSince} days ago</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Next Due</span><span className={cn(r.nextContactDue < today && "text-red-600 font-medium")}>{r.nextContactDue}</span></div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* alert */}
        {contactOverdue > 0 && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div><p className="font-semibold text-red-900">{contactOverdue} overdue contact(s)</p>
              <ul className="text-sm text-red-800 mt-1 list-disc list-inside">{data.filter(r => r.nextContactDue < today).map(r => <li key={r.id}>{getYPName(r.youngPersonId)} — due {r.nextContactDue}</li>)}</ul>
            </div>
          </div>
        )}

        {/* filter */}
        <Card><CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]"><Label className="text-xs">Search</Label><div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Name, accommodation…" value={search} onChange={e => setSearch(e.target.value)} /></div></div>
            <div className="w-36"><Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />RAG</Label><Select value={ragFilter} onValueChange={setRagFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="red">Red</SelectItem><SelectItem value="amber">Amber</SelectItem><SelectItem value="green">Green</SelectItem></SelectContent></Select></div>
            <div className="w-36"><Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="rag">RAG Priority</SelectItem><SelectItem value="name">Name</SelectItem><SelectItem value="left">Left Date</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent></Card>

        {/* case cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", RAG_CLR[r.overallRag])}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{getYPName(r.youngPersonId)}</CardTitle>
                        <Badge className={cn("text-xs", RAG_BADGE[r.overallRag])}>{r.overallRag.toUpperCase()}</Badge>
                        <Badge className={cn("text-xs", LR_CLR[r.leftReason])}>{LR_LABEL[r.leftReason]}</Badge>
                        {r.stayingCloseEligible && <Badge className="text-xs bg-teal-100 text-teal-800">Staying Close</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Left: {r.leftDate}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1"><Home className="h-3 w-3" />Accommodation</p>
                        <p>{r.currentAccommodation}</p>
                        <Badge className={cn("text-xs mt-1", AS_CLR[r.accommodationStatus])}>{AS_LABEL[r.accommodationStatus]}</Badge>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1">Education / Employment</p>
                        <p>{r.educationEmployment}</p>
                        <Badge className={cn("text-xs mt-1", EET_CLR[r.eetStatus])}>{EET_LABEL[r.eetStatus]}</Badge>
                      </div>
                    </div>

                    {/* support package */}
                    {r.supportPackage.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2">Support Package</p>
                        <table className="w-full text-sm border">
                          <thead className="bg-muted/50"><tr><th className="text-left p-2 font-medium">Area</th><th className="text-left p-2 font-medium">Provider</th><th className="text-left p-2 font-medium">Frequency</th><th className="text-left p-2 font-medium">Status</th></tr></thead>
                          <tbody>{r.supportPackage.map((sp, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2">{sp.area}</td><td className="p-2">{sp.provider}</td><td className="p-2">{sp.frequency}</td>
                              <td className="p-2"><Badge className={cn("text-xs", sp.status === "active" ? "bg-green-100 text-green-800" : sp.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800")}>{sp.status}</Badge></td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    )}

                    {/* contact log */}
                    <div>
                      <p className="text-xs font-semibold mb-2">Contact Log</p>
                      <div className="space-y-2 border-l-2 border-blue-200 pl-4">
                        {r.contactLog.map((c, i) => (
                          <div key={i} className="relative">
                            <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-400" />
                            <div className="text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{c.date}</span>
                                <Badge variant="outline" className="text-xs">{c.type}</Badge>
                                <span className="text-xs text-muted-foreground">{getStaffName(c.staffId)}</span>
                                <span className={cn("text-xs font-medium", WB_CLR[c.wellbeing])}>{c.wellbeing}</span>
                              </div>
                              <p className="text-muted-foreground mt-0.5">{c.summary}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* concerns / positives */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {r.currentConcerns.length > 0 && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                          <p className="text-xs font-semibold text-red-800 mb-1">Current Concerns</p>
                          <ul className="text-sm text-red-900 list-disc list-inside space-y-0.5">{r.currentConcerns.map((c, i) => <li key={i}>{c}</li>)}</ul>
                        </div>
                      )}
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-semibold text-green-800 mb-1">Positives</p>
                        <ul className="text-sm text-green-900 list-disc list-inside space-y-0.5">{r.positives.map((p, i) => <li key={i}>{p}</li>)}</ul>
                      </div>
                    </div>

                    {/* meta */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Key Worker: <strong>{getStaffName(r.keyWorker)}</strong></span>
                      <span>Personal Adviser: <strong>{r.personalAdviser}</strong></span>
                      {r.pathwayPlan && <span>Pathway Plan Review: <strong>{r.pathwayPlanReviewDate}</strong></span>}
                      <span>Emergency Contact: <strong>{r.emergencyContact}</strong></span>
                    </div>

                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Next contact due: <strong className={cn(r.nextContactDue < today && "text-red-600")}>{r.nextContactDue}</strong></p>

                    {r.notes && <p className="text-xs text-muted-foreground italic">{r.notes}</p>}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* outcomes */}
        <Card>
          <CardHeader><CardTitle className="text-base">Outcomes Dashboard</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-3xl font-bold text-green-600">{eetRate}%</p><p className="text-xs text-muted-foreground">In Education, Employment or Training</p></div>
              <div><p className="text-3xl font-bold text-blue-600">{Math.round(data.filter(r => r.accommodationStatus === "stable" || r.accommodationStatus === "supported_housing").length / data.length * 100)}%</p><p className="text-xs text-muted-foreground">Stable Accommodation</p></div>
              <div>
                <div className="flex justify-center gap-2">
                  {(["green", "amber", "red"] as RAG[]).map(r => (
                    <Badge key={r} className={cn("text-xs", RAG_BADGE[r])}>{r.toUpperCase()}: {data.filter(d => d.overallRag === r).length}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">RAG Distribution</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* regulatory note */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory Framework</p>
          <p>Children Act 1989 (as amended by Children and Social Work Act 2017) — local authorities have a duty to support care leavers up to age 25. Staying Close provision enables continued support from children&apos;s homes. Pathway Plans must be reviewed at least every 6 months. Regular contact with former looked-after children must be maintained and documented.</p>
        </div>
      </div>

      {/* dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add After-Care Record</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Young Person</Label><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{["yp_alex", "yp_jordan", "yp_casey"].map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Left Date</Label><Input type="date" /></div>
            <div><Label>Left Reason</Label><Select><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(LR_LABEL) as [LeftReason, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Current Accommodation</Label><Input placeholder="Address and provider" /></div>
            <div><Label>Education / Employment</Label><Input placeholder="Current EET details" /></div>
            <div><Label>Notes</Label><Textarea rows={2} placeholder="Additional notes…" /></div>
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

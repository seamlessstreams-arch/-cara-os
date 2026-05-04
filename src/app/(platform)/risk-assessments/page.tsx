"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  ShieldAlert, AlertTriangle, CheckCircle2, Clock, Calendar,
  Shield, ArrowUp, ArrowDown, Minus
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type RiskDomain = "self_harm" | "absconding" | "aggression" | "exploitation" | "substance_use" | "online_safety" | "fire_setting" | "sexual_behaviour" | "self_neglect" | "emotional_harm";
type RiskLevel = "low" | "medium" | "high" | "very_high";
type AssessmentStatus = "current" | "under_review" | "superseded" | "draft";
type Trend = "increasing" | "stable" | "decreasing";

interface RiskMitigation {
  strategy: string;
  responsible: string;
  effectiveness: "effective" | "partially_effective" | "not_effective" | "not_yet_assessed";
}

interface RiskAssessment {
  id: string;
  youngPersonId: string;
  domain: RiskDomain;
  currentLevel: RiskLevel;
  previousLevel: RiskLevel;
  trend: Trend;
  status: AssessmentStatus;
  assessedBy: string;
  assessedDate: string;
  reviewDate: string;
  triggers: string[];
  indicators: string[];
  mitigations: RiskMitigation[];
  contingencyPlan: string;
  childViews: string;
  historyNotes: string;
  linkedIncidents: string[];
  createdAt: string;
}

const DOMAIN_META: Record<RiskDomain, { label: string; color: string }> = {
  self_harm:         { label: "Self-Harm",           color: "bg-red-100 text-red-800" },
  absconding:        { label: "Absconding / Missing", color: "bg-orange-100 text-orange-800" },
  aggression:        { label: "Aggression / Violence", color: "bg-red-100 text-red-800" },
  exploitation:      { label: "Exploitation (CSE/CCE)", color: "bg-purple-100 text-purple-800" },
  substance_use:     { label: "Substance Use",        color: "bg-amber-100 text-amber-800" },
  online_safety:     { label: "Online Safety",        color: "bg-blue-100 text-blue-800" },
  fire_setting:      { label: "Fire Setting",         color: "bg-rose-100 text-rose-800" },
  sexual_behaviour:  { label: "Harmful Sexual Behaviour", color: "bg-pink-100 text-pink-800" },
  self_neglect:      { label: "Self-Neglect",          color: "bg-teal-100 text-teal-800" },
  emotional_harm:    { label: "Emotional Harm",       color: "bg-indigo-100 text-indigo-800" },
};

const LEVEL_META: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  low:       { label: "Low",       color: "text-green-700",  bg: "bg-green-100" },
  medium:    { label: "Medium",    color: "text-amber-700",  bg: "bg-amber-100" },
  high:      { label: "High",      color: "text-orange-700", bg: "bg-orange-100" },
  very_high: { label: "Very High", color: "text-red-700",    bg: "bg-red-100" },
};

const TREND_ICON: Record<Trend, React.ReactNode> = {
  increasing: <ArrowUp className="h-3.5 w-3.5 text-red-600" />,
  stable:     <Minus className="h-3.5 w-3.5 text-amber-600" />,
  decreasing: <ArrowDown className="h-3.5 w-3.5 text-green-600" />,
};

// ── Seed data ────────────────────────────────────────────────────────────────
const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: RiskAssessment[] = [
  {
    id: "ra_001", youngPersonId: "yp_alex", domain: "aggression", currentLevel: "medium", previousLevel: "high",
    trend: "decreasing", status: "current", assessedBy: "staff_darren", assessedDate: d(-7), reviewDate: d(23),
    triggers: ["Perceived injustice or unfairness", "Transition times (morning routine)", "Unexpected changes to plans", "Feeling not listened to"],
    indicators: ["Raised voice", "Pacing", "Clenched fists", "Verbal threats"],
    mitigations: [
      { strategy: "Use PACE approach — playful, accepting, curious, empathic", responsible: "All staff", effectiveness: "effective" },
      { strategy: "Offer choices rather than directives", responsible: "All staff", effectiveness: "effective" },
      { strategy: "Grounding techniques taught in key work", responsible: "staff_darren", effectiveness: "effective" },
      { strategy: "Avoid cornering or blocking — allow space", responsible: "All staff", effectiveness: "effective" },
    ],
    contingencyPlan: "If Alex escalates: give space, remove other YP from area, use calm voice, offer time-out in quiet room. Call RM if physical intervention seems likely. Never use physical intervention for property damage alone.",
    childViews: "Alex says: 'I know I get angry sometimes but I'm getting better at controlling it. The breathing thing helps.'",
    historyNotes: "Previously high risk due to regular physical aggression. Significant improvement over last 3 months — only one low-level incident in that period. School also reports improvement.",
    linkedIncidents: ["inc_001"], createdAt: d(-7),
  },
  {
    id: "ra_002", youngPersonId: "yp_jordan", domain: "self_harm", currentLevel: "medium", previousLevel: "medium",
    trend: "stable", status: "current", assessedBy: "staff_anna", assessedDate: d(-5), reviewDate: d(25),
    triggers: ["Cancelled contact with mother", "Sleep deprivation", "Perceived rejection", "Anniversary dates"],
    indicators: ["Withdrawal to bedroom", "Refusal to eat", "Wearing long sleeves in warm weather", "Increased emotional dysregulation"],
    mitigations: [
      { strategy: "Daily wellbeing check-ins", responsible: "Key worker (Anna)", effectiveness: "effective" },
      { strategy: "Predictable bedtime routine with relaxation", responsible: "All staff", effectiveness: "partially_effective" },
      { strategy: "CAMHS sessions weekly", responsible: "CAMHS clinician", effectiveness: "not_yet_assessed" },
      { strategy: "Ensure sharps are secured", responsible: "All staff", effectiveness: "effective" },
    ],
    contingencyPlan: "If self-harm suspected: gentle approach, don't panic, offer first aid if needed. Complete body map. Inform RM immediately. Contact CAMHS crisis line if acute risk. Never use sanctions for self-harm.",
    childViews: "Jordan says: 'Sometimes things feel really heavy. Football helps. I don't want to talk about it all the time though.'",
    historyNotes: "Historical self-harm (scratching/cutting) in previous placement. No confirmed incidents at Oak House but some concerning indicators observed linked to contact cancellations.",
    linkedIncidents: [], createdAt: d(-5),
  },
  {
    id: "ra_003", youngPersonId: "yp_jordan", domain: "absconding", currentLevel: "low", previousLevel: "medium",
    trend: "decreasing", status: "current", assessedBy: "staff_ryan", assessedDate: d(-10), reviewDate: d(20),
    triggers: ["Arguments with peers", "Feeling overwhelmed", "After difficult phone calls"],
    indicators: ["Putting on shoes/coat at unusual times", "Checking front door", "Restlessness", "Making excuses to go outside"],
    mitigations: [
      { strategy: "Ensure Jordan knows where staff are at all times", responsible: "All staff", effectiveness: "effective" },
      { strategy: "Offer supervised outdoor time when restless", responsible: "All staff", effectiveness: "effective" },
      { strategy: "Positive relationships reduce flight risk", responsible: "All staff", effectiveness: "effective" },
    ],
    contingencyPlan: "If Jordan leaves without permission: attempt verbal de-escalation first. Do not physically prevent unless immediate danger. Note time, clothing, direction of travel. Contact police after 30 minutes if under 16 (immediately if safeguarding concerns). Inform RM and SW.",
    childViews: "Jordan says: 'I don't want to run away. I just need fresh air sometimes.'",
    historyNotes: "Two missing episodes in previous placement. None at Oak House. Risk has reduced with placement stability.",
    linkedIncidents: [], createdAt: d(-10),
  },
  {
    id: "ra_004", youngPersonId: "yp_casey", domain: "exploitation", currentLevel: "low", previousLevel: "low",
    trend: "stable", status: "current", assessedBy: "staff_darren", assessedDate: d(-3), reviewDate: d(27),
    triggers: ["Contact from unknown adults", "Social media approaches", "Peer pressure"],
    indicators: ["New possessions without explanation", "Secretive phone use", "New older contacts", "Changes in presentation"],
    mitigations: [
      { strategy: "Age-appropriate online safety discussions in key work", responsible: "staff_chervelle", effectiveness: "effective" },
      { strategy: "Monitor social media consent (currently refused by SW)", responsible: "All staff", effectiveness: "effective" },
      { strategy: "Build trusted relationships to encourage disclosure", responsible: "Key worker", effectiveness: "effective" },
    ],
    contingencyPlan: "If exploitation indicators identified: do not confront child directly. Record observations. Inform RM immediately. RM to contact SW and consider MASH referral. Complete CSE/CCE screening tool.",
    childViews: "Casey says: 'I don't really use social media much. I prefer drawing and writing.'",
    historyNotes: "No history of exploitation. Low risk assessment based on age, presentation, and limited online activity. Maintain awareness due to placement history and vulnerability.",
    linkedIncidents: [], createdAt: d(-3),
  },
  {
    id: "ra_005", youngPersonId: "yp_alex", domain: "substance_use", currentLevel: "low", previousLevel: "low",
    trend: "stable", status: "current", assessedBy: "staff_darren", assessedDate: d(-14), reviewDate: d(16),
    triggers: ["Peer influence at school", "Stress or anxiety"],
    indicators: ["Unusual smells on clothing", "Glazed eyes", "Secretive behaviour", "New peer group"],
    mitigations: [
      { strategy: "Open conversations about substances in key work", responsible: "staff_darren", effectiveness: "effective" },
      { strategy: "Positive activities to reduce boredom", responsible: "All staff", effectiveness: "effective" },
    ],
    contingencyPlan: "If substance use suspected: calm conversation, do not accuse. Secure any substances found. Record and inform RM. Consider health assessment. No punitive response — use as educational opportunity.",
    childViews: "Alex says: 'I don't do drugs. Some kids at school do but I think it's stupid.'",
    historyNotes: "No known substance use. Age-appropriate curiosity discussed in key work. Low risk.",
    linkedIncidents: [], createdAt: d(-14),
  },
];

// ── Export ────────────────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<RiskAssessment>[] = [
  { header: "ID",             accessor: (r: RiskAssessment) => r.id },
  { header: "Young Person",   accessor: (r: RiskAssessment) => getYPName(r.youngPersonId) },
  { header: "Domain",         accessor: (r: RiskAssessment) => DOMAIN_META[r.domain].label },
  { header: "Current Level",  accessor: (r: RiskAssessment) => LEVEL_META[r.currentLevel].label },
  { header: "Previous Level", accessor: (r: RiskAssessment) => LEVEL_META[r.previousLevel].label },
  { header: "Trend",          accessor: (r: RiskAssessment) => r.trend },
  { header: "Assessed By",    accessor: (r: RiskAssessment) => getStaffName(r.assessedBy) },
  { header: "Assessed Date",  accessor: (r: RiskAssessment) => r.assessedDate },
  { header: "Review Date",    accessor: (r: RiskAssessment) => r.reviewDate },
  { header: "Triggers",       accessor: (r: RiskAssessment) => r.triggers.join("; ") },
  { header: "Mitigations",    accessor: (r: RiskAssessment) => r.mitigations.map((m: RiskMitigation) => m.strategy).join("; ") },
  { header: "Contingency",    accessor: (r: RiskAssessment) => r.contingencyPlan },
  { header: "Child Views",    accessor: (r: RiskAssessment) => r.childViews },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function RiskAssessmentsPage() {
  const [assessments, setAssessments] = useState<RiskAssessment[]>(SEED);
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sortBy, setSortBy] = useState("level");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const children = useMemo(() => {
    const ids = [...new Set(assessments.map((a) => a.youngPersonId))];
    return ids.map((id) => ({ id, name: getYPName(id) }));
  }, [assessments]);

  const filtered = useMemo(() => {
    let list = [...assessments];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((a) => a.triggers.some((t) => t.toLowerCase().includes(s)) || a.contingencyPlan.toLowerCase().includes(s));
    }
    if (childFilter !== "all") list = list.filter((a) => a.youngPersonId === childFilter);
    if (levelFilter !== "all") list = list.filter((a) => a.currentLevel === levelFilter);

    const levelOrder: Record<string, number> = { very_high: 0, high: 1, medium: 2, low: 3 };
    list.sort((a, b) => {
      switch (sortBy) {
        case "level":  return levelOrder[a.currentLevel] - levelOrder[b.currentLevel];
        case "domain": return DOMAIN_META[a.domain].label.localeCompare(DOMAIN_META[b.domain].label);
        case "review": return a.reviewDate.localeCompare(b.reviewDate);
        case "child":  return getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId));
        default:       return 0;
      }
    });
    return list;
  }, [assessments, search, childFilter, levelFilter, sortBy]);

  const stats = useMemo(() => {
    const total = assessments.length;
    const highRisk = assessments.filter((a) => a.currentLevel === "high" || a.currentLevel === "very_high").length;
    const dueReview = assessments.filter((a) => a.reviewDate <= d(7)).length;
    const improving = assessments.filter((a) => a.trend === "decreasing").length;
    return { total, highRisk, dueReview, improving };
  }, [assessments]);

  // Per-child risk summary
  const childRiskSummary = useMemo(() => {
    return children.map((c) => {
      const ca = assessments.filter((a) => a.youngPersonId === c.id);
      const levelOrder: Record<string, number> = { very_high: 3, high: 2, medium: 1, low: 0 };
      const highest = ca.reduce((max, a) => levelOrder[a.currentLevel] > max ? levelOrder[a.currentLevel] : max, 0);
      const highestLabel = (["low", "medium", "high", "very_high"] as RiskLevel[])[highest];
      return { ...c, count: ca.length, highest: highestLabel };
    });
  }, [children, assessments]);

  return (
    <PageShell
      title="Risk Assessments"
      subtitle="Individual risk assessments — triggers, mitigations, and contingency plans"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Risk Assessments" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="risk-assessments" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Assessment</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Assessments", value: stats.total,     icon: <ShieldAlert className="h-4 w-4" />,    color: "text-blue-600" },
            { label: "High / Very High",  value: stats.highRisk,  icon: <AlertTriangle className="h-4 w-4" />,  color: "text-red-600" },
            { label: "Review Due (7d)",   value: stats.dueReview, icon: <Clock className="h-4 w-4" />,          color: "text-amber-600" },
            { label: "Improving",         value: stats.improving, icon: <ArrowDown className="h-4 w-4" />,      color: "text-green-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", s.color)}>{s.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Per-child summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {childRiskSummary.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setChildFilter(childFilter === c.id ? "all" : c.id)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.count} risk domains assessed</p>
                </div>
                <Badge className={cn("text-xs", LEVEL_META[c.highest].bg, LEVEL_META[c.highest].color)}>Highest: {LEVEL_META[c.highest].label}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search risk assessments…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={childFilter} onValueChange={setChildFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Child" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {Object.entries(LEVEL_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="level">Risk Level</SelectItem>
                <SelectItem value="domain">Domain</SelectItem>
                <SelectItem value="review">Review Date</SelectItem>
                <SelectItem value="child">Child</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No assessments match your filters.</p>}
          {filtered.map((a) => {
            const open = !!expanded[a.id];
            const domainM = DOMAIN_META[a.domain];
            const levelM = LEVEL_META[a.currentLevel];
            const reviewDue = a.reviewDate <= d(7);
            return (
              <Card key={a.id} className={cn("border-l-4", a.currentLevel === "very_high" || a.currentLevel === "high" ? "border-l-red-500" : a.currentLevel === "medium" ? "border-l-amber-400" : "border-l-green-400")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(a.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", domainM.color)}>{domainM.label}</Badge>
                        <Badge className={cn("text-xs", levelM.bg, levelM.color)}>{levelM.label}</Badge>
                        <span className="flex items-center gap-0.5 text-xs">{TREND_ICON[a.trend]} <span className="text-muted-foreground">{a.trend}</span></span>
                        {reviewDue && <Badge variant="destructive" className="text-xs">Review due</Badge>}
                      </div>
                      <p className="font-semibold">{getYPName(a.youngPersonId)} — {domainM.label}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>Assessed: {a.assessedDate}</span>
                        <span>By {getStaffName(a.assessedBy)}</span>
                        <span>Review: {a.reviewDate}</span>
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-3 border-t pt-3 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Known Triggers</p>
                        <div className="flex flex-wrap gap-1">{a.triggers.map((t, i) => <Badge key={i} variant="outline" className="text-xs text-red-600 border-red-200">{t}</Badge>)}</div>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Warning Indicators</p>
                        <div className="flex flex-wrap gap-1">{a.indicators.map((ind, i) => <Badge key={i} variant="outline" className="text-xs text-amber-600 border-amber-200">{ind}</Badge>)}</div>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Mitigation Strategies</p>
                        <div className="space-y-1">
                          {a.mitigations.map((m, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs bg-muted/40 p-2 rounded">
                              {m.effectiveness === "effective" ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5" /> : m.effectiveness === "partially_effective" ? <Clock className="h-3.5 w-3.5 text-amber-600 mt-0.5" /> : <AlertTriangle className="h-3.5 w-3.5 text-gray-400 mt-0.5" />}
                              <div>
                                <p>{m.strategy}</p>
                                <p className="text-muted-foreground">Owner: {m.responsible}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Contingency Plan</p>
                        <p className="bg-red-50 p-2 rounded text-xs text-red-900 border border-red-200">{a.contingencyPlan}</p>
                      </div>
                      {a.childViews && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Child&apos;s Views</p>
                          <div className="bg-pink-50 p-2 rounded border border-pink-200 italic text-pink-900 text-xs">{a.childViews}</div>
                        </div>
                      )}
                      {a.historyNotes && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">History / Context</p>
                          <p className="text-xs text-muted-foreground italic">{a.historyNotes}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Previous level: <span className={LEVEL_META[a.previousLevel].color}>{LEVEL_META[a.previousLevel].label}</span></span>
                        <span>→ Current: <span className={levelM.color}>{levelM.label}</span></span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Risk assessments must be reviewed at least monthly, or immediately following any incident or change in circumstances. All staff must be familiar with each child&apos;s risk assessments and contingency plans. The child&apos;s views must be incorporated. Risk assessments inform placement matching and are a key Ofsted requirement.
            </span>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Risk Assessment</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); setShowNew(false); }} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Young Person</label>
              <Select><SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>{children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Risk Domain</label>
                <Select><SelectTrigger><SelectValue placeholder="Domain" /></SelectTrigger>
                  <SelectContent>{Object.entries(DOMAIN_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Risk Level</label>
                <Select><SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
                  <SelectContent>{Object.entries(LEVEL_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Triggers</label><Textarea placeholder="Known triggers (one per line)" rows={2} /></div>
            <div><label className="text-sm font-medium">Mitigation Strategies</label><Textarea placeholder="Key strategies (one per line)" rows={3} /></div>
            <div><label className="text-sm font-medium">Contingency Plan</label><Textarea placeholder="What to do if risk escalates…" rows={3} /></div>
            <div><label className="text-sm font-medium">Child&apos;s Views</label><Textarea placeholder="Child's perspective on this risk…" rows={2} /></div>
            <div><label className="text-sm font-medium">Review Date</label><Input type="date" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit">Save Assessment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

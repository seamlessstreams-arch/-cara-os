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
import { Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Clock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type RiskCategory = "self_harm" | "absconding" | "aggression" | "exploitation" | "substance_misuse" | "sexualised_behaviour" | "online_risk" | "radicalisation" | "trafficking" | "other";
type RiskLevel = "low" | "medium" | "high" | "very_high";
type PlanStatus = "active" | "under_review" | "archived" | "draft";

interface Strategy { strategy: string; owner: string; frequency: string; effectiveness: "effective" | "partially_effective" | "not_assessed" | "not_effective" }
interface Trigger { trigger: string; likelihood: "high" | "medium" | "low"; context: string }

interface RiskManagementPlan {
  id: string;
  youngPersonId: string;
  riskCategory: RiskCategory;
  currentRiskLevel: RiskLevel;
  previousRiskLevel: RiskLevel;
  riskDescription: string;
  triggers: Trigger[];
  warningSignals: string[];
  managementStrategies: Strategy[];
  emergencyPlan: string;
  protectiveFactors: string[];
  escalationProcedure: string;
  reviewDate: string;
  lastReviewed: string;
  createdBy: string;
  approvedBy: string;
  multiAgencyInput: { professional: string; role: string; input: string }[];
  childViews: string;
  status: PlanStatus;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const RC_LABEL: Record<RiskCategory, string> = { self_harm: "Self-Harm", absconding: "Absconding", aggression: "Aggression", exploitation: "Exploitation", substance_misuse: "Substance Misuse", sexualised_behaviour: "Sexualised Behaviour", online_risk: "Online Risk", radicalisation: "Radicalisation", trafficking: "Trafficking", other: "Other" };
const RC_CLR: Record<RiskCategory, string> = { self_harm: "bg-red-100 text-red-800", absconding: "bg-purple-100 text-purple-800", aggression: "bg-orange-100 text-orange-800", exploitation: "bg-red-200 text-red-900", substance_misuse: "bg-amber-100 text-amber-800", sexualised_behaviour: "bg-pink-100 text-pink-800", online_risk: "bg-blue-100 text-blue-800", radicalisation: "bg-slate-100 text-slate-800", trafficking: "bg-red-200 text-red-900", other: "bg-gray-100 text-gray-800" };
const RL_CLR: Record<RiskLevel, string> = { low: "bg-green-100 text-green-800", medium: "bg-amber-100 text-amber-800", high: "bg-red-100 text-red-800", very_high: "bg-red-900 text-white" };
const PS_CLR: Record<PlanStatus, string> = { active: "bg-green-100 text-green-800", under_review: "bg-amber-100 text-amber-800", archived: "bg-gray-100 text-gray-800", draft: "bg-blue-100 text-blue-800" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: RiskManagementPlan[] = [
  {
    id: "rmp1", youngPersonId: "yp_alex", riskCategory: "absconding",
    currentRiskLevel: "medium", previousRiskLevel: "high",
    riskDescription: "Alex has a history of attempting to leave the home without permission, particularly at night. Linked to attachment needs — wants to go to birth mother's house. Recent attempt at 2am.",
    triggers: [
      { trigger: "Contact with birth mother", likelihood: "high", context: "After phone calls or cancelled visits" },
      { trigger: "Conflict with peers", likelihood: "medium", context: "Arguments with Jordan" },
      { trigger: "Nighttime — particularly weekends", likelihood: "high", context: "When feeling lonely/missing family" },
    ],
    warningSignals: ["Talking about mum repeatedly", "Collecting outdoor clothing in room", "Refusing to hand in phone at bedtime", "Becoming withdrawn in evening"],
    managementStrategies: [
      { strategy: "Door alarm activated at all times overnight", owner: "staff_darren", frequency: "Continuous", effectiveness: "effective" },
      { strategy: "Pre-bedtime check-in about feelings", owner: "staff_darren", frequency: "Nightly", effectiveness: "effective" },
      { strategy: "Comfort box with family photos and mum's letter available", owner: "staff_chervelle", frequency: "As needed", effectiveness: "partially_effective" },
      { strategy: "Post-contact debrief within 30 minutes", owner: "staff_darren", frequency: "After every contact", effectiveness: "effective" },
    ],
    emergencyPlan: "1. Do not physically restrain unless immediate danger. 2. Follow at safe distance. 3. Engage verbally — name, acknowledge feelings, offer alternatives. 4. If Alex leaves building: activate Missing from Care protocol. 5. Call police after 30 minutes if not returned. 6. Contact manager immediately.",
    protectiveFactors: ["Strong relationship with Darren", "Likes his bedroom and PS5", "School attendance improving", "Understands consequences"],
    escalationProcedure: "If two attempts within 7 days: emergency review with social worker. If actual missing episode: police, SW, and LADO notification within 1 hour.",
    reviewDate: d(14), lastReviewed: d(-14), createdBy: "staff_darren", approvedBy: "staff_darren",
    multiAgencyInput: [
      { professional: "Karen Holding", role: "Social Worker", input: "Support increased phone contact with mum to reduce nighttime distress" },
      { professional: "Dr Sarah Thompson", role: "CAMHS", input: "Attachment-focused therapy to address separation anxiety at night" },
    ],
    childViews: "Alex says he understands the rules. He doesn't want to get in trouble. He just misses his mum so much at bedtime. Agreed the comfort box helps a bit.",
    status: "active",
  },
  {
    id: "rmp2", youngPersonId: "yp_casey", riskCategory: "self_harm",
    currentRiskLevel: "high", previousRiskLevel: "high",
    riskDescription: "Casey has a history of self-harm including cutting (forearms) and scratching. Last known incident 6 weeks ago. Linked to trauma responses, particularly around specific dates and contact with birth mother.",
    triggers: [
      { trigger: "Specific dates (birthdays, anniversary of removal)", likelihood: "high", context: "Calendar dates linked to trauma" },
      { trigger: "Contact with birth mother", likelihood: "high", context: "Direct or indirect — including seeing online posts" },
      { trigger: "Feeling out of control", likelihood: "medium", context: "Changes to routine, staff changes" },
      { trigger: "Bedtime / alone time", likelihood: "medium", context: "Reduced stimulation increases rumination" },
    ],
    warningSignals: ["Wearing long sleeves in warm weather", "Withdrawing to bedroom", "Refusing to eat", "Dissociative episodes — staring blankly", "Asking for sharps (art supplies etc)", "Sleep disturbance increasing"],
    managementStrategies: [
      { strategy: "Room search for sharps (with Casey's knowledge and consent)", owner: "staff_darren", frequency: "Weekly", effectiveness: "effective" },
      { strategy: "Distraction toolkit in Casey's room (ice cubes, elastic bands, art supplies)", owner: "staff_anna", frequency: "Always available", effectiveness: "partially_effective" },
      { strategy: "Safety plan co-created with Casey — 5 steps to follow when urges arise", owner: "staff_darren", frequency: "Reviewed monthly", effectiveness: "effective" },
      { strategy: "Body map check (with consent) during key work sessions", owner: "staff_darren", frequency: "Fortnightly", effectiveness: "effective" },
      { strategy: "Trauma calendar — flag high-risk dates proactively", owner: "staff_darren", frequency: "Monthly review", effectiveness: "effective" },
    ],
    emergencyPlan: "1. If fresh injury found: assess severity. 2. Administer first aid if needed. 3. Do not show shock or anger — remain calm and empathetic. 4. If medical attention needed: call 111 or attend A&E. 5. Notify manager immediately. 6. Complete body map and incident report within 1 hour. 7. CAMHS crisis team if Casey expresses suicidal ideation.",
    protectiveFactors: ["Engaged in therapy", "Strong relationship with art therapist", "College attendance", "Relationship with grandmother", "Wants to get better — articulates this"],
    escalationProcedure: "Any active self-harm: immediate notification to SW + CAMHS. Two incidents within a month: multi-agency strategy meeting. Suicidal ideation: CAMHS crisis team, SW, and manager within the hour.",
    reviewDate: d(7), lastReviewed: d(-7), createdBy: "staff_darren", approvedBy: "staff_darren",
    multiAgencyInput: [
      { professional: "Fiona Brennan", role: "Social Worker", input: "Supports weekly room checks. Wants early notification of any incident." },
      { professional: "Dr Patel", role: "CAMHS Psychiatrist", input: "Continue Fluoxetine 20mg. Therapeutic intervention via art therapy. Safety plan reviewed and approved." },
      { professional: "Sarah", role: "Art Therapist", input: "Casey uses art as primary emotional outlet. Increase to twice weekly during high-risk periods." },
    ],
    childViews: "Casey knows about the plan and helped create the safety steps. She says ice cubes work better than elastic bands. She doesn't like room searches but understands why. She wants to stop hurting herself.",
    status: "active",
  },
  {
    id: "rmp3", youngPersonId: "yp_jordan", riskCategory: "aggression",
    currentRiskLevel: "low", previousRiskLevel: "medium",
    riskDescription: "Jordan can display physical aggression when overwhelmed by sensory input or when routines are disrupted. Previously damaged property (broke a window) but has not been aggressive towards people. Risk has reduced with better environmental management.",
    triggers: [
      { trigger: "Sensory overload (noise, smells, crowding)", likelihood: "high", context: "Multiple stimuli simultaneously" },
      { trigger: "Unexpected changes to routine", likelihood: "medium", context: "Unplanned events, cancelled activities" },
      { trigger: "Demand overload", likelihood: "medium", context: "Too many instructions at once" },
    ],
    warningSignals: ["Covering ears", "Pacing", "Verbal repetition of phrases", "Increased vocal volume", "Rocking or stimming"],
    managementStrategies: [
      { strategy: "Sensory diet planned into daily routine", owner: "staff_ryan", frequency: "Daily", effectiveness: "effective" },
      { strategy: "Visual schedule displayed in Jordan's room", owner: "staff_ryan", frequency: "Updated daily", effectiveness: "effective" },
      { strategy: "Noise-cancelling headphones available at all times", owner: "staff_ryan", frequency: "Always available", effectiveness: "effective" },
      { strategy: "One instruction at a time, with processing time", owner: "staff_ryan", frequency: "All interactions", effectiveness: "effective" },
    ],
    emergencyPlan: "1. Remove other children from area. 2. Reduce stimuli — turn off music, lower lights. 3. Offer noise-cancelling headphones and safe space. 4. Do not physically intervene unless risk to others. 5. Wait at safe distance. 6. Once calm, offer drink and quiet activity.",
    protectiveFactors: ["Responds well to predictability", "Strong bond with Ryan", "Self-aware — can sometimes identify early warnings", "Likes routine and structure"],
    escalationProcedure: "Property damage: incident report + manager. Aggression towards person: incident report + manager + SW within 24 hours.",
    reviewDate: d(21), lastReviewed: d(-14), createdBy: "staff_ryan", approvedBy: "staff_darren",
    multiAgencyInput: [
      { professional: "Michael Osei", role: "Social Worker", input: "Satisfied with current management approach. Risk reducing." },
    ],
    childViews: "Jordan knows about his sensory needs. He says the headphones are 'the best thing ever.' He knows to ask for help when things feel too much.",
    status: "active",
  },
];

/* ── component ─────────────────────────────────────────────────────────────── */

export default function RiskManagementPlansPage() {
  const [data] = useState<RiskManagementPlan[]>(SEED);
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortBy, setSortBy] = useState("risk");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);
  const today = d(0);
  const childIds = ["yp_alex", "yp_jordan", "yp_casey"];

  const filtered = useMemo(() => {
    let out = [...data];
    if (search) { const s = search.toLowerCase(); out = out.filter(r => getYPName(r.youngPersonId).toLowerCase().includes(s) || r.riskDescription.toLowerCase().includes(s)); }
    if (childFilter !== "all") out = out.filter(r => r.youngPersonId === childFilter);
    if (riskFilter !== "all") out = out.filter(r => r.currentRiskLevel === riskFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "review": return a.reviewDate.localeCompare(b.reviewDate);
        case "category": return a.riskCategory.localeCompare(b.riskCategory);
        default: { const ord: RiskLevel[] = ["very_high", "high", "medium", "low"]; return ord.indexOf(a.currentRiskLevel) - ord.indexOf(b.currentRiskLevel); }
      }
    });
    return out;
  }, [data, search, childFilter, riskFilter, sortBy]);

  const highRisk = data.filter(r => r.currentRiskLevel === "high" || r.currentRiskLevel === "very_high").length;
  const reviewDue = data.filter(r => r.reviewDate <= today).length;

  const exportCols: ExportColumn<RiskManagementPlan>[] = useMemo(() => [
    { header: "Young Person", accessor: (r: RiskManagementPlan) => getYPName(r.youngPersonId) },
    { header: "Risk Category", accessor: (r: RiskManagementPlan) => RC_LABEL[r.riskCategory] },
    { header: "Current Level", accessor: (r: RiskManagementPlan) => r.currentRiskLevel },
    { header: "Previous Level", accessor: (r: RiskManagementPlan) => r.previousRiskLevel },
    { header: "Description", accessor: (r: RiskManagementPlan) => r.riskDescription },
    { header: "Strategies", accessor: (r: RiskManagementPlan) => r.managementStrategies.map(s => s.strategy).join("; ") },
    { header: "Protective Factors", accessor: (r: RiskManagementPlan) => r.protectiveFactors.join("; ") },
    { header: "Status", accessor: (r: RiskManagementPlan) => r.status },
    { header: "Review Date", accessor: (r: RiskManagementPlan) => r.reviewDate },
    { header: "Created By", accessor: (r: RiskManagementPlan) => getStaffName(r.createdBy) },
  ], []);

  return (
    <PageShell
      title="Risk Management Plans"
      subtitle="Individual child risk management strategies — Regulation 12"
      actions={[
        <PrintButton key="p" title="Risk Management Plans" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="risk-management-plans" />,
        <Button key="n" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />New Plan</Button>,
      ]}
    >
      <div id="print-area" className="space-y-6">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Plans", value: data.filter(r => r.status === "active").length, icon: Shield, colour: "text-blue-600" },
            { label: "High / Very High", value: highRisk, icon: AlertTriangle, colour: "text-red-600" },
            { label: "Review Due", value: reviewDue, icon: Clock, colour: "text-amber-600" },
            { label: "Risk Reducing", value: data.filter(r => { const ord: RiskLevel[] = ["low", "medium", "high", "very_high"]; return ord.indexOf(r.currentRiskLevel) < ord.indexOf(r.previousRiskLevel); }).length, icon: CheckCircle2, colour: "text-green-600" },
          ].map(s => (
            <Card key={s.label}><CardContent className="pt-4 flex items-center gap-3"><s.icon className={cn("h-8 w-8", s.colour)} /><div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></CardContent></Card>
          ))}
        </div>

        {reviewDue > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div><p className="font-semibold text-amber-900">{reviewDue} plan(s) due for review</p></div>
          </div>
        )}

        <Card><CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]"><Label className="text-xs">Search</Label><div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Name, description…" value={search} onChange={e => setSearch(e.target.value)} /></div></div>
            <div className="w-36"><Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Child</Label><Select value={childFilter} onValueChange={setChildFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{childIds.map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-36"><Label className="text-xs">Risk Level</Label><Select value={riskFilter} onValueChange={setRiskFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(["low", "medium", "high", "very_high"] as RiskLevel[]).map(r => <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-36"><Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="risk">Risk Level</SelectItem><SelectItem value="review">Review Due</SelectItem><SelectItem value="category">Category</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent></Card>

        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            const rDue = r.reviewDate <= today;
            const riskDown = (["low", "medium", "high", "very_high"] as RiskLevel[]).indexOf(r.currentRiskLevel) < (["low", "medium", "high", "very_high"] as RiskLevel[]).indexOf(r.previousRiskLevel);
            return (
              <Card key={r.id} className={cn("border-l-4", r.currentRiskLevel === "very_high" ? "border-red-600" : r.currentRiskLevel === "high" ? "border-red-400" : r.currentRiskLevel === "medium" ? "border-amber-400" : "border-green-400")}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{getYPName(r.youngPersonId)}</CardTitle>
                        <Badge className={cn("text-xs", RC_CLR[r.riskCategory])}>{RC_LABEL[r.riskCategory]}</Badge>
                        <Badge className={cn("text-xs", RL_CLR[r.currentRiskLevel])}>{r.currentRiskLevel.replace("_", " ").toUpperCase()}</Badge>
                        {riskDown && <span className="text-green-600 text-xs font-medium">↓ from {r.previousRiskLevel}</span>}
                        <Badge className={cn("text-xs", PS_CLR[r.status])}>{r.status.replace("_", " ")}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {rDue && <Badge className="text-xs bg-red-100 text-red-800">Review Due</Badge>}
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-4 pt-0">
                    <p className="text-sm">{r.riskDescription}</p>

                    <div><p className="text-xs font-semibold mb-2">Known Triggers</p>
                      <div className="space-y-1">{r.triggers.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Badge className={cn("text-xs", t.likelihood === "high" ? "bg-red-100 text-red-800" : t.likelihood === "medium" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800")}>{t.likelihood}</Badge>
                          <span>{t.trigger}</span><span className="text-xs text-muted-foreground">({t.context})</span>
                        </div>
                      ))}</div>
                    </div>

                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-xs font-semibold text-amber-800 mb-1">Warning Signals</p>
                      <ul className="text-sm text-amber-900 list-disc list-inside">{r.warningSignals.map((w, i) => <li key={i}>{w}</li>)}</ul>
                    </div>

                    <div><p className="text-xs font-semibold mb-2">Management Strategies</p>
                      <table className="w-full text-sm border"><thead className="bg-muted/50"><tr><th className="text-left p-2 font-medium">Strategy</th><th className="text-left p-2 font-medium">Owner</th><th className="text-left p-2 font-medium">Frequency</th><th className="text-left p-2 font-medium">Effectiveness</th></tr></thead>
                        <tbody>{r.managementStrategies.map((s, i) => (
                          <tr key={i} className="border-t"><td className="p-2">{s.strategy}</td><td className="p-2">{getStaffName(s.owner)}</td><td className="p-2">{s.frequency}</td>
                            <td className="p-2"><Badge className={cn("text-xs", s.effectiveness === "effective" ? "bg-green-100 text-green-800" : s.effectiveness === "partially_effective" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800")}>{s.effectiveness.replace("_", " ")}</Badge></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>

                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="text-xs font-semibold text-red-800 mb-1">Emergency Plan</p>
                      <p className="text-sm text-red-900 whitespace-pre-line">{r.emergencyPlan}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-semibold text-green-800 mb-1">Protective Factors</p>
                        <ul className="text-sm text-green-900 list-disc list-inside">{r.protectiveFactors.map((p, i) => <li key={i}>{p}</li>)}</ul>
                      </div>
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-semibold text-blue-800 mb-1">Escalation Procedure</p>
                        <p className="text-sm text-blue-900">{r.escalationProcedure}</p>
                      </div>
                    </div>

                    {r.childViews && (
                      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                        <p className="text-xs font-semibold text-pink-800 mb-1">Child&apos;s Views</p>
                        <p className="text-sm text-pink-900">{r.childViews}</p>
                      </div>
                    )}

                    {r.multiAgencyInput.length > 0 && (
                      <div><p className="text-xs font-semibold mb-2">Multi-Agency Input</p>
                        <table className="w-full text-sm border"><thead className="bg-muted/50"><tr><th className="text-left p-2 font-medium">Professional</th><th className="text-left p-2 font-medium">Role</th><th className="text-left p-2 font-medium">Input</th></tr></thead>
                          <tbody>{r.multiAgencyInput.map((m, i) => <tr key={i} className="border-t"><td className="p-2">{m.professional}</td><td className="p-2">{m.role}</td><td className="p-2">{m.input}</td></tr>)}</tbody>
                        </table>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground flex flex-wrap gap-4">
                      <span>Created: {getStaffName(r.createdBy)}</span>
                      <span>Approved: {getStaffName(r.approvedBy)}</span>
                      <span>Last reviewed: {r.lastReviewed}</span>
                      <span className={cn(rDue && "text-red-600 font-medium")}>Next review: {r.reviewDate}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory Framework</p>
          <p>Children&apos;s Homes Regulations 2015, Reg 12 — Protection of children. Individual risk management plans must be in place for identified risks, reviewed regularly, and informed by multi-agency professional input. Plans must include the child&apos;s voice and be accessible to all staff.</p>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Risk Management Plan</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Young Person</Label><Select><SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger><SelectContent>{childIds.map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Risk Category</Label><Select><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(RC_LABEL) as [RiskCategory, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Risk Level</Label><Select><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["low", "medium", "high", "very_high"] as RiskLevel[]).map(r => <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Risk Description</Label><Textarea rows={3} placeholder="Describe the risk…" /></div>
            <div><Label>Emergency Plan</Label><Textarea rows={3} placeholder="Emergency procedure…" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={() => setDialogOpen(false)}>Create Plan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

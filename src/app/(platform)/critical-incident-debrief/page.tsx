"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, ChevronDown, ChevronUp, ArrowUpDown, AlertTriangle, CheckCircle2,
  Clock, Search, Shield, Brain, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type IncidentCategory = "restraint" | "self_harm" | "missing" | "violence" | "property_damage" | "safeguarding" | "medical_emergency" | "fire" | "near_miss" | "other";
type DebriefStatus = "scheduled" | "completed" | "deferred" | "not_required";
type ImpactLevel = "low" | "medium" | "high" | "critical";

interface CriticalIncidentDebrief {
  id: string;
  incidentDate: string;
  debriefDate: string;
  incidentCategory: IncidentCategory;
  incidentSummary: string;
  impactLevel: ImpactLevel;
  youngPersonIds: string[];
  staffInvolvedIds: string[];
  facilitatorId: string;
  attendees: string[];
  status: DebriefStatus;
  whatHappened: string;
  whatWorkedWell: string[];
  whatCouldImprove: string[];
  rootCauses: string[];
  emotionalImpact: string;
  actionsAgreed: string[];
  actionsCompleted: number;
  policyChanges: string;
  trainingNeeds: string[];
  sharedWith: string[];
  followUpDate: string | null;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const CAT_LABEL: Record<IncidentCategory, string> = {
  restraint: "Physical Intervention", self_harm: "Self-Harm", missing: "Missing from Care",
  violence: "Violence/Aggression", property_damage: "Property Damage", safeguarding: "Safeguarding Concern",
  medical_emergency: "Medical Emergency", fire: "Fire/Evacuation", near_miss: "Near Miss", other: "Other",
};

const IMPACT_LABEL: Record<ImpactLevel, string> = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
const IMPACT_CLR: Record<ImpactLevel, string> = { low: "bg-green-100 text-green-800", medium: "bg-amber-100 text-amber-800", high: "bg-red-100 text-red-800", critical: "bg-red-200 text-red-900" };
const IMPACT_BORDER: Record<ImpactLevel, string> = { low: "border-l-green-400", medium: "border-l-amber-400", high: "border-l-red-500", critical: "border-l-red-700" };

const STATUS_LABEL: Record<DebriefStatus, string> = { scheduled: "Scheduled", completed: "Completed", deferred: "Deferred", not_required: "Not Required" };
const STATUS_CLR: Record<DebriefStatus, string> = { scheduled: "bg-blue-100 text-blue-800", completed: "bg-green-100 text-green-800", deferred: "bg-amber-100 text-amber-800", not_required: "bg-slate-100 text-slate-700" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: CriticalIncidentDebrief[] = [
  {
    id: "cid_001", incidentDate: d(-45), debriefDate: d(-42),
    incidentCategory: "restraint", impactLevel: "high",
    incidentSummary: "Physical intervention (PRICE hold) on Casey after she picked up a glass object and moved towards Jordan. Two-person hold by Ryan and Chervelle lasting 4 minutes.",
    youngPersonIds: ["yp_casey", "yp_jordan"], staffInvolvedIds: ["staff_ryan", "staff_chervelle"],
    facilitatorId: "staff_darren", status: "completed",
    attendees: ["Darren Laville (RM)", "Ryan (Deputy)", "Chervelle", "Anna"],
    whatHappened: "Casey had been escalating throughout the evening following a difficult phone call with her social worker about contact arrangements. Staff attempted verbal de-escalation for 12 minutes. Casey picked up a glass vase from the hallway table and moved towards Jordan who was in the living room doorway. Ryan and Chervelle intervened with a two-person PRICE hold. Jordan was moved to a safe area by Anna. The hold lasted 4 minutes until Casey was calm. No injuries to anyone.",
    whatWorkedWell: [
      "De-escalation was attempted thoroughly before intervention (12 minutes)",
      "Two-person hold was executed correctly and safely",
      "Jordan was removed from the situation quickly by Anna",
      "Body map completed within 1 hour — no marks",
      "Casey was debriefed the following day and given a voice",
      "Incident report was comprehensive and timely",
    ],
    whatCouldImprove: [
      "Glass vase should not have been accessible — environmental risk assessment needed",
      "Earlier intervention possible when Casey first began picking up objects",
      "Jordan's exit route could have been planned better — he was in the doorway",
      "Night staff handover could include more detail about Casey's earlier presentation",
    ],
    rootCauses: [
      "Casey's frustration about contact arrangements — ongoing issue with SW",
      "Environmental risk: glass objects accessible in communal areas",
      "Transition from phone call to evening routine not adequately supported",
    ],
    emotionalImpact: "Ryan reported feeling anxious about the hold — it was his first intervention in 6 months. Chervelle felt confident in the hold but was upset seeing Casey distressed. Anna was concerned about Jordan's emotional response — he was visibly shaken. Staff wellbeing check-ins scheduled for all involved within 48 hours. Casey expressed in debrief that she 'didn't want to hurt anyone' and felt bad about frightening Jordan.",
    actionsAgreed: [
      "Remove all glass objects from communal areas — replace with shatter-proof alternatives",
      "Update Casey's behaviour support plan with additional de-escalation strategies for post-phone-call situations",
      "Brief all staff on the updated BSP at next team meeting",
      "Arrange a restorative conversation between Casey and Jordan (if both agree)",
      "Ryan to receive reflective supervision session about the incident",
      "Environmental risk assessment of all communal areas within 7 days",
    ],
    actionsCompleted: 5,
    policyChanges: "Environmental risk assessment policy updated to include quarterly checks for accessible hazardous items in communal areas.",
    trainingNeeds: ["PRICE refresher for all staff (scheduled for " + d(14) + ")", "De-escalation advanced techniques workshop"],
    sharedWith: ["RI (Richard Holt)", "Casey's Social Worker", "Team meeting (anonymised learning points)"],
    followUpDate: d(-21),
    notes: "This was a well-managed incident overall. The debrief identified important environmental risks that have been addressed. Casey and Jordan had a restorative conversation 5 days later — both reported feeling better. The learning from this debrief has been shared with the wider team. PRICE refresher training booked. RI was satisfied with the debrief process and outcomes.",
  },
  {
    id: "cid_002", incidentDate: d(-14), debriefDate: d(-11),
    incidentCategory: "self_harm", impactLevel: "high",
    incidentSummary: "Casey was found in her bedroom with superficial scratches on her left forearm. Staff (Anna) responded, provided first aid, and completed body map. Casey disclosed she had been feeling overwhelmed about the upcoming LADO outcome.",
    youngPersonIds: ["yp_casey"], staffInvolvedIds: ["staff_anna", "staff_chervelle"],
    facilitatorId: "staff_darren", status: "completed",
    attendees: ["Darren Laville (RM)", "Anna", "Chervelle", "Ryan"],
    whatHappened: "During a routine bedroom check at 21:15, Anna noticed Casey sitting on her bed with fresh scratches on her forearm. Casey had used a broken pencil sharpener blade. Anna calmly engaged Casey, removed the blade, and provided first aid. Chervelle was called as second responder. Casey disclosed she had been thinking about the LADO investigation and felt 'everything is my fault.' Body map completed. GP consulted by phone — advised monitoring, no A&E required. Casey's SW and CAMHS notified next day.",
    whatWorkedWell: [
      "Anna responded calmly and compassionately — didn't panic",
      "Immediate safety actions (blade removed, first aid provided)",
      "Casey felt able to talk to Anna about her feelings",
      "Body map completed thoroughly and promptly",
      "GP consulted appropriately for professional medical advice",
      "CAMHS and SW notified within 24 hours",
    ],
    whatCouldImprove: [
      "Room search protocol — pencil sharpener blade was not identified as a risk item",
      "Casey's self-harm risk assessment needs updating — current level may be underrated",
      "Earlier emotional check-in after Casey learned about LADO timeline could have been offered",
      "Night staff need additional training on self-harm response and emotional first aid",
    ],
    rootCauses: [
      "Casey's anxiety about the LADO investigation outcome",
      "Feelings of guilt and self-blame",
      "Access to sharp items in her bedroom (pencil sharpener)",
      "Lack of proactive emotional support following LADO timeline update",
    ],
    emotionalImpact: "Anna was emotionally affected — she has a strong bond with Casey and felt she should have noticed earlier signs. Reflective supervision session arranged within 48 hours. Chervelle provided peer support to Anna after the shift. Casey's emotional state: distressed during the incident but calmer after talking to Anna. Casey said talking to Anna helped and she 'didn't really want to hurt herself badly.'",
    actionsAgreed: [
      "Update Casey's self-harm risk assessment — increase risk level to HIGH",
      "Room safety check for all YP — remove or secure sharp items",
      "Increase Casey's check frequency to 30 minutes during elevated risk periods",
      "Arrange CAMHS urgent review of Casey's safety plan",
      "Develop a distress tolerance toolkit with Casey (direct work session)",
      "Ensure Anna receives reflective supervision within 48 hours",
      "Brief all staff on updated risk level and check frequency",
    ],
    actionsCompleted: 6,
    policyChanges: "Self-harm risk assessment protocol updated to include automatic review when children are involved in LADO or police investigations.",
    trainingNeeds: ["Self-harm awareness and response (all staff)", "Emotional first aid for night staff"],
    sharedWith: ["CAMHS (Dr Patterson)", "Casey's Social Worker (Lisa Green)", "RI (Richard Holt)"],
    followUpDate: d(-4),
    notes: "Casey's CAMHS appointment brought forward. New safety plan co-produced with Casey. Distress tolerance kit created (stress ball, colouring, music, phone list of trusted people). Casey engaged well in direct work session with Chervelle about coping strategies. No further self-harm incidents since. Anna completed reflective supervision and reported feeling more confident in her response. All room safety checks completed — 3 additional items removed across the home.",
  },
  {
    id: "cid_003", incidentDate: d(-7), debriefDate: d(3),
    incidentCategory: "missing", impactLevel: "medium",
    incidentSummary: "Alex left the home without permission during an argument about screen time. He was gone for 45 minutes and returned voluntarily. Found at the local park. No safeguarding concerns identified during return interview.",
    youngPersonIds: ["yp_alex"], staffInvolvedIds: ["staff_edward", "staff_ryan"],
    facilitatorId: "staff_darren", status: "scheduled",
    attendees: [],
    whatHappened: "Alex became angry when Edward asked him to turn off his Xbox at 21:00 (agreed bedtime routine). Alex shouted, put on his trainers, and left through the front door at 21:10. Edward followed standard missing protocol — informed Ryan (on-call), called Alex's mobile. Police were not called initially as low risk (known destination). Ryan attended and drove to local park — found Alex sitting on a bench at 21:45. Alex returned voluntarily at 21:55. Return interview completed the next morning by Anna.",
    whatWorkedWell: [],
    whatCouldImprove: [],
    rootCauses: [],
    emotionalImpact: "",
    actionsAgreed: [],
    actionsCompleted: 0,
    policyChanges: "",
    trainingNeeds: [],
    sharedWith: [],
    followUpDate: null,
    notes: "Debrief scheduled for " + d(3) + ". Initial observations: Edward's approach to the screen time boundary may have been too abrupt — need to explore this in debrief. Alex's pattern of leaving when frustrated should be considered alongside his BSP. Return interview was positive — Alex said he 'just needed air' and wasn't running away. No exploitation or safeguarding concerns.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function CriticalIncidentDebriefPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterImpact, setFilterImpact] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r.incidentSummary.toLowerCase().includes(q) ||
        r.youngPersonIds.some((id) => getYPName(id).toLowerCase().includes(q)) ||
        r.staffInvolvedIds.some((id) => getStaffName(id).toLowerCase().includes(q))
      );
    }
    if (filterCategory !== "all") rows = rows.filter((r) => r.incidentCategory === filterCategory);
    if (filterImpact !== "all") rows = rows.filter((r) => r.impactLevel === filterImpact);
    rows.sort((a, b) => sortBy === "newest" ? b.incidentDate.localeCompare(a.incidentDate) : a.incidentDate.localeCompare(b.incidentDate));
    return rows;
  }, [data, search, filterCategory, filterImpact, sortBy]);

  const total = data.length;
  const completed = data.filter((r) => r.status === "completed").length;
  const scheduled = data.filter((r) => r.status === "scheduled").length;
  const totalActions = data.reduce((s, r) => s + r.actionsAgreed.length, 0);
  const completedActions = data.reduce((s, r) => s + r.actionsCompleted, 0);

  const exportCols: ExportColumn<CriticalIncidentDebrief>[] = [
    { header: "Incident Date", accessor: (r: CriticalIncidentDebrief) => r.incidentDate },
    { header: "Debrief Date", accessor: (r: CriticalIncidentDebrief) => r.debriefDate },
    { header: "Category", accessor: (r: CriticalIncidentDebrief) => CAT_LABEL[r.incidentCategory] },
    { header: "Impact", accessor: (r: CriticalIncidentDebrief) => IMPACT_LABEL[r.impactLevel] },
    { header: "YP", accessor: (r: CriticalIncidentDebrief) => r.youngPersonIds.map(getYPName).join(", ") },
    { header: "Staff", accessor: (r: CriticalIncidentDebrief) => r.staffInvolvedIds.map(getStaffName).join(", ") },
    { header: "Status", accessor: (r: CriticalIncidentDebrief) => STATUS_LABEL[r.status] },
    { header: "Actions", accessor: (r: CriticalIncidentDebrief) => `${r.actionsCompleted}/${r.actionsAgreed.length}` },
  ];

  return (
    <PageShell
      title="Critical Incident Debriefs"
      subtitle="Post-Incident Learning · Reflective Practice · Continuous Improvement"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Critical Incident Debriefs" />
          <ExportButton data={data} columns={exportCols} filename="critical-incident-debriefs" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Schedule Debrief</Button>
        </div>
      }
    >
      <div id="print-area">
        {/* stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Debriefs", value: total, icon: Brain, clr: "text-blue-600" },
            { label: "Completed", value: completed, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Scheduled", value: scheduled, icon: Clock, clr: "text-amber-600" },
            { label: "Actions", value: `${completedActions}/${totalActions}`, icon: Shield, clr: "text-purple-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search debriefs..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {(Object.entries(CAT_LABEL) as [IncidentCategory, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterImpact} onValueChange={setFilterImpact}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Impact" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Impact</SelectItem>
              {(Object.entries(IMPACT_LABEL) as [ImpactLevel, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}>
            <ArrowUpDown className="h-4 w-4 mr-1" />{sortBy === "newest" ? "Newest" : "Oldest"}
          </Button>
        </div>

        {/* scheduled alert */}
        {scheduled > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-800">{scheduled} debrief(s) scheduled</p>
              <p className="text-blue-700">Critical incident debriefs should be conducted within 72 hours of the incident where possible. All staff involved should attend. The debrief should focus on learning, not blame.</p>
            </div>
          </div>
        )}

        {/* debrief cards */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", IMPACT_BORDER[r.impactLevel])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {CAT_LABEL[r.incidentCategory]}
                        <Badge variant="outline" className={IMPACT_CLR[r.impactLevel]}>{IMPACT_LABEL[r.impactLevel]}</Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Incident: {r.incidentDate} · Debrief: {r.debriefDate}
                        {" "}· YP: {r.youngPersonIds.map(getYPName).join(", ")}
                        {" "}· Staff: {r.staffInvolvedIds.map(getStaffName).join(", ")}
                        {" "}· Facilitator: {getStaffName(r.facilitatorId)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.actionsAgreed.length > 0 && (
                        <Badge variant="outline" className="bg-muted/50">{r.actionsCompleted}/{r.actionsAgreed.length}</Badge>
                      )}
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* incident summary */}
                    <div>
                      <p className="font-medium mb-1">Incident Summary</p>
                      <p className="text-muted-foreground text-xs">{r.incidentSummary}</p>
                    </div>

                    {/* what happened */}
                    {r.whatHappened && (
                      <div>
                        <p className="font-medium mb-1">What Happened (Debrief Account)</p>
                        <p className="text-muted-foreground text-xs">{r.whatHappened}</p>
                      </div>
                    )}

                    {/* what worked well */}
                    {r.whatWorkedWell.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-green-700">What Worked Well</p>
                        <ul className="space-y-1">
                          {r.whatWorkedWell.map((w, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* what could improve */}
                    {r.whatCouldImprove.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-amber-700">What Could Improve</p>
                        <ul className="space-y-1">
                          {r.whatCouldImprove.map((w, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* root causes */}
                    {r.rootCauses.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Root Causes Identified</p>
                        <div className="flex flex-wrap gap-1">
                          {r.rootCauses.map((c, i) => (
                            <Badge key={i} variant="outline" className="bg-red-50 text-red-700 text-xs">{c}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* emotional impact */}
                    {r.emotionalImpact && (
                      <div className="bg-purple-50 border border-purple-200 rounded p-2">
                        <p className="font-medium text-xs text-purple-800 mb-1">Emotional Impact on Staff & YP</p>
                        <p className="text-xs text-purple-700">{r.emotionalImpact}</p>
                      </div>
                    )}

                    {/* actions */}
                    {r.actionsAgreed.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Actions Agreed ({r.actionsCompleted}/{r.actionsAgreed.length})</p>
                        <ul className="space-y-1">
                          {r.actionsAgreed.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              {i < r.actionsCompleted
                                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                                : <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                              }
                              <span className={i < r.actionsCompleted ? "line-through text-muted-foreground" : ""}>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* training needs */}
                    {r.trainingNeeds.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Training Needs Identified</p>
                        <div className="flex flex-wrap gap-1">
                          {r.trainingNeeds.map((t, i) => (
                            <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 text-xs">{t}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* shared with */}
                    {r.sharedWith.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Learning Shared With</p>
                        <div className="flex flex-wrap gap-1">
                          {r.sharedWith.map((s, i) => (
                            <Badge key={i} variant="outline" className="bg-muted/50 text-xs"><Users className="h-3 w-3 mr-1" />{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* notes */}
                    {r.notes && (
                      <div><p className="font-medium mb-1">Manager Notes</p><p className="text-muted-foreground text-xs">{r.notes}</p></div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Best Practice Framework</p>
          <p>Critical incident debriefs should be conducted within 72 hours of any significant incident. The debrief process must be non-punitive and focused on learning. All staff involved should attend where possible. Debriefs should address: factual account, what worked well, what could improve, root causes, emotional impact, and agreed actions. Learning should be shared with the wider team (anonymised where appropriate) and inform policy/procedure updates. Debriefs are monitored through Reg 44/45 reporting and form part of the home&apos;s continuous improvement cycle. Staff wellbeing must be considered throughout — any staff member can request additional support following a debrief.</p>
        </div>
      </div>

      {/* new debrief dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Schedule Debrief</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Incident Date</Label><Input type="date" /></div>
            <div><Label>Debrief Date</Label><Input type="date" /></div>
            <div>
              <Label>Category</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(CAT_LABEL) as [IncidentCategory, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Impact Level</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select impact" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(IMPACT_LABEL) as [ImpactLevel, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Incident Summary</Label><Textarea placeholder="Brief description of the incident..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={() => setShowNew(false)}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

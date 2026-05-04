"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Clock,
  ShieldAlert, Users, ArrowUpDown, Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type DebriefType = "post_incident" | "post_restraint" | "post_missing" | "critical_event" | "emotional_support" | "tci_reflection";
type DebriefStatus = "completed" | "scheduled" | "overdue" | "declined";

interface StaffDebrief {
  id: string;
  date: string;
  type: DebriefType;
  triggerEvent: string;
  triggerDate: string;
  staffInvolved: string[];
  facilitatedBy: string;
  status: DebriefStatus;
  emotionalImpact: "low" | "moderate" | "high" | "significant";
  keyThemes: string[];
  whatWentWell: string[];
  whatCouldImprove: string[];
  staffFeelings: string;
  supportOffered: string[];
  followUpNeeded: boolean;
  followUpDetails: string | null;
  learningPoints: string[];
  confidential: boolean;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const TYPE_META: Record<DebriefType, { label: string; color: string }> = {
  post_incident: { label: "Post-Incident", color: "bg-amber-100 text-amber-800" },
  post_restraint: { label: "Post-Restraint", color: "bg-red-100 text-red-800" },
  post_missing: { label: "Post-Missing", color: "bg-orange-100 text-orange-800" },
  critical_event: { label: "Critical Event", color: "bg-red-100 text-red-800" },
  emotional_support: { label: "Emotional Support", color: "bg-blue-100 text-blue-800" },
  tci_reflection: { label: "TCI Reflection", color: "bg-purple-100 text-purple-800" },
};

const STATUS_META: Record<DebriefStatus, { label: string; color: string }> = {
  completed: { label: "Completed", color: "bg-green-100 text-green-800" },
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-800" },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-800" },
  declined: { label: "Declined", color: "bg-slate-100 text-slate-700" },
};

const IMPACT_META: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "text-green-700" },
  moderate: { label: "Moderate", color: "text-amber-700" },
  high: { label: "High", color: "text-orange-700" },
  significant: { label: "Significant", color: "text-red-700" },
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: StaffDebrief[] = [
  {
    id: "sd_001", date: d(-3), type: "post_restraint",
    triggerEvent: "Physical restraint of Casey following self-harm attempt — Casey attempted to use a broken pen to scratch her forearms. Staff intervened using TCI techniques. Restraint lasted 4 minutes.",
    triggerDate: d(-4),
    staffInvolved: ["staff_ryan", "staff_chervelle"],
    facilitatedBy: "staff_darren",
    status: "completed",
    emotionalImpact: "high",
    keyThemes: ["emotional toll of restraint", "self-harm response", "TCI techniques", "team support"],
    whatWentWell: [
      "TCI techniques applied correctly — minimum force, minimum time",
      "Staff communicated clearly during the restraint ('I'm going to hold your hands to keep you safe')",
      "Casey was given space immediately after and offered comfort",
      "Both staff supported each other during the incident",
      "Post-incident, Casey accepted a warm drink and brief conversation with Chervelle",
    ],
    whatCouldImprove: [
      "Earlier recognition of Casey's escalating distress — she had been quiet for 2 hours before the incident",
      "The broken pen should have been identified as a risk item — environmental check needed",
      "Chervelle felt she should have offered distress toolkit earlier in the evening",
    ],
    staffFeelings: "Ryan described feeling 'gutted' that it came to restraint. He said he always questions whether there was something he could have done differently. Chervelle was tearful during the debrief — she said Casey's distress is 'heartbreaking' and that she worries about Casey constantly. Both staff expressed feeling supported by the team. Neither felt they needed external counselling at this point but know it's available.",
    supportOffered: [
      "Verbal debrief with RM (this session)",
      "Offer of external counselling — both declined for now",
      "Reduced caseload for Chervelle the following day",
      "Ryan given an extended break during next shift",
      "Both staff reminded of EAP (Employee Assistance Programme)",
    ],
    followUpNeeded: true,
    followUpDetails: "Check in with both staff at their next supervision. Monitor for signs of secondary trauma. Chervelle in particular — she carries a lot emotionally for Casey.",
    learningPoints: [
      "Environmental safety check — remove or secure potential self-harm implements",
      "Develop a 'quiet withdrawal' protocol — when Casey goes unusually quiet, proactively offer connection",
      "Review distress tolerance toolkit — add new sensory items Casey has requested",
    ],
    confidential: false,
    notes: "Both staff handled this incident with professionalism and genuine care. The restraint was proportionate, necessary, and well-executed. Staff welfare is a priority — this team consistently puts the children first, but they need to be supported too.",
  },
  {
    id: "sd_002", date: d(-10), type: "post_missing",
    triggerEvent: "Casey missing from home for 3 hours (18:00-21:00). Located by police at a bus stop. Returned safely. No disclosure of harm.",
    triggerDate: d(-11),
    staffInvolved: ["staff_anna", "staff_edward"],
    facilitatedBy: "staff_darren",
    status: "completed",
    emotionalImpact: "moderate",
    keyThemes: ["missing protocols", "police liaison", "waiting anxiety", "return home interview"],
    whatWentWell: [
      "Missing protocol activated within 15 minutes of Casey not returning from garden",
      "Police called at the 30-minute mark as per high-risk protocol",
      "All professionals notified promptly (SW, on-call RM, police)",
      "Casey's return was handled calmly — no interrogation, warm welcome back",
      "Anna conducted return home interview the next day — sensitively",
    ],
    whatCouldImprove: [
      "CCTV review showed Casey left via the back gate — gate should have been checked during shift",
      "Edward initially thought Casey was in her room — a physical check would have identified the absence sooner",
      "Communication between staff could have been quicker — 10 minutes passed before both staff were aware",
    ],
    staffFeelings: "Anna described the 3 hours as 'the longest wait.' She said she kept thinking about Casey's exploitation risk and felt sick with worry. Edward said he felt guilty for not checking sooner and was hard on himself. Both staff were reassured that the missing protocol was followed correctly overall.",
    supportOffered: [
      "Verbal debrief with RM",
      "Team discussion at next staff meeting about missing protocols",
      "Edward given reassurance that his response was appropriate once the absence was identified",
    ],
    followUpNeeded: false,
    followUpDetails: null,
    learningPoints: [
      "Physical check of all children at shift handover — don't assume from door position",
      "Back gate to be added to security check routine",
      "Review CCTV coverage of garden gate area",
    ],
    confidential: false,
    notes: "Both staff handled the situation well once the absence was identified. The learning points have been shared with all staff. Gate security has been reviewed.",
  },
  {
    id: "sd_003", date: d(2), type: "emotional_support",
    triggerEvent: "Anna requesting emotional support following the LADO investigation — Anna is on restricted duties and finding the situation emotionally challenging.",
    triggerDate: d(-30),
    staffInvolved: ["staff_anna"],
    facilitatedBy: "staff_darren",
    status: "scheduled",
    emotionalImpact: "significant",
    keyThemes: ["LADO impact on staff", "restricted duties", "professional identity", "emotional welfare"],
    whatWentWell: [],
    whatCouldImprove: [],
    staffFeelings: "",
    supportOffered: [
      "Scheduled 1:1 with RM",
      "External counselling offered via EAP",
      "Union representative involved for support",
      "Adjusted duties to reduce stress",
    ],
    followUpNeeded: true,
    followUpDetails: "This is an ongoing support need. Anna requires regular check-ins throughout the LADO process. Supervision to include explicit welfare discussion.",
    learningPoints: [],
    confidential: true,
    notes: "CONFIDENTIAL. Anna's welfare is a priority during the LADO investigation. RM to ensure Anna feels supported and valued as a team member.",
  },
  {
    id: "sd_004", date: d(-45), type: "tci_reflection",
    triggerEvent: "Quarterly TCI (Therapeutic Crisis Intervention) team reflection — reviewing the home's use of TCI principles over the past quarter.",
    triggerDate: d(-45),
    staffInvolved: ["staff_ryan", "staff_anna", "staff_chervelle", "staff_edward", "staff_lackson"],
    facilitatedBy: "staff_darren",
    status: "completed",
    emotionalImpact: "low",
    keyThemes: ["TCI principles", "de-escalation", "team consistency", "managing feelings"],
    whatWentWell: [
      "Team demonstrates strong understanding of TCI principles",
      "De-escalation is consistently used as the first response",
      "Only 1 restraint in the quarter — proportionate and well-managed",
      "Staff report feeling confident in managing challenging situations",
      "Good use of co-regulation techniques with Casey",
    ],
    whatCouldImprove: [
      "Some inconsistency in language used during de-escalation — agree on key phrases",
      "Night staff (Mirela, Lackson) could benefit from additional TCI practice scenarios",
      "Need to ensure agency staff understand TCI approach before working with Casey",
    ],
    staffFeelings: "Team reflective and engaged. Staff expressed pride in the low restraint rate. Chervelle shared that she finds the 'managing the moment' framework helpful for her own emotional regulation. Edward noted he'd like more practice with verbal de-escalation for situations involving property damage.",
    supportOffered: [
      "Team training session on consistent de-escalation language",
      "Night staff TCI refresher arranged",
      "Agency staff briefing template created",
    ],
    followUpNeeded: false,
    followUpDetails: null,
    learningPoints: [
      "Agree on consistent de-escalation phrases for the team to use",
      "Create TCI prompt cards for quick reference during incidents",
      "Include TCI approach in agency staff induction pack",
    ],
    confidential: false,
    notes: "Positive session. The team's commitment to therapeutic care is evident. TCI is well-embedded in the home's culture.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function StaffDebriefLogPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "impact" | "type">("date");
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = useMemo(() => {
    let result = [...data];
    if (filterType !== "all") result = result.filter((d) => d.type === filterType);
    return result.sort((a, b) => {
      switch (sortBy) {
        case "impact": {
          const order = { significant: 0, high: 1, moderate: 2, low: 3 };
          return (order[a.emotionalImpact] ?? 4) - (order[b.emotionalImpact] ?? 4);
        }
        case "type": return a.type.localeCompare(b.type);
        default: return b.date.localeCompare(a.date);
      }
    });
  }, [data, sortBy, filterType]);

  const exportData = useMemo(() => {
    return data.map((d) => ({
      date: d.date,
      type: TYPE_META[d.type].label,
      triggerEvent: d.triggerEvent,
      triggerDate: d.triggerDate,
      staffInvolved: d.staffInvolved.map((s) => getStaffName(s)).join(", "),
      facilitatedBy: getStaffName(d.facilitatedBy),
      status: STATUS_META[d.status].label,
      emotionalImpact: IMPACT_META[d.emotionalImpact].label,
      followUpNeeded: d.followUpNeeded ? "Yes" : "No",
    }));
  }, [data]);

  type ExportRow = (typeof exportData)[number];

  const exportCols: ExportColumn<ExportRow>[] = [
    { header: "Date", accessor: (r: ExportRow) => r.date },
    { header: "Type", accessor: (r: ExportRow) => r.type },
    { header: "Trigger", accessor: (r: ExportRow) => r.triggerEvent },
    { header: "Staff Involved", accessor: (r: ExportRow) => r.staffInvolved },
    { header: "Facilitated By", accessor: (r: ExportRow) => r.facilitatedBy },
    { header: "Status", accessor: (r: ExportRow) => r.status },
    { header: "Impact", accessor: (r: ExportRow) => r.emotionalImpact },
    { header: "Follow-Up", accessor: (r: ExportRow) => r.followUpNeeded },
  ];

  const completedCount = data.filter((d) => d.status === "completed").length;
  const highImpactCount = data.filter((d) => d.emotionalImpact === "high" || d.emotionalImpact === "significant").length;
  const followUpCount = data.filter((d) => d.followUpNeeded).length;

  return (
    <PageShell
      title="Staff Debrief Log"
      subtitle="Post-Incident · Emotional Support · TCI Reflections · Staff Welfare"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Staff Debrief Log" />
          <ExportButton data={exportData} columns={exportCols} filename="staff-debrief-log" />
        </div>
      }
    >
      <div id="print-area">
        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{data.length}</p>
              <p className="text-xs text-muted-foreground">Total Debriefs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className={cn("text-2xl font-bold", highImpactCount > 0 ? "text-red-600" : "text-green-600")}>{highImpactCount}</p>
              <p className="text-xs text-muted-foreground">High / Significant Impact</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className={cn("text-2xl font-bold", followUpCount > 0 ? "text-amber-600" : "text-green-600")}>{followUpCount}</p>
              <p className="text-xs text-muted-foreground">Follow-Up Needed</p>
            </CardContent>
          </Card>
        </div>

        {/* filter + sort */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select className="text-sm border rounded px-2 py-1" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
              <option value="date">Date (newest)</option>
              <option value="impact">Impact (highest)</option>
              <option value="type">Type</option>
            </select>
          </div>
          <select className="text-sm border rounded px-2 py-1" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            {(Object.entries(TYPE_META) as [DebriefType, { label: string }][]).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </select>
        </div>

        {/* debrief cards */}
        <div className="space-y-3">
          {filtered.map((debrief) => {
            const isOpen = expandedId === debrief.id;
            return (
              <Card key={debrief.id} className={cn(
                "border-l-4",
                debrief.emotionalImpact === "significant" || debrief.emotionalImpact === "high" ? "border-l-red-500" :
                debrief.emotionalImpact === "moderate" ? "border-l-amber-400" : "border-l-green-400"
              )}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : debrief.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-600" />
                        {TYPE_META[debrief.type].label}
                        <Badge variant="outline" className={STATUS_META[debrief.status].color}>{STATUS_META[debrief.status].label}</Badge>
                        <Badge variant="outline" className={cn("text-xs", debrief.emotionalImpact === "significant" || debrief.emotionalImpact === "high" ? "bg-red-100 text-red-800" : debrief.emotionalImpact === "moderate" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800")}>
                          {IMPACT_META[debrief.emotionalImpact].label} Impact
                        </Badge>
                        {debrief.confidential && <Badge variant="outline" className="bg-slate-100 text-slate-700">Confidential</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {debrief.date} · Staff: {debrief.staffInvolved.map((s) => getStaffName(s)).join(", ")} · Facilitated by: {getStaffName(debrief.facilitatedBy)}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* trigger event */}
                    <div className="bg-muted/40 rounded p-2">
                      <p className="font-medium text-xs mb-1">Trigger Event ({debrief.triggerDate})</p>
                      <p className="text-xs text-muted-foreground">{debrief.triggerEvent}</p>
                    </div>

                    {/* what went well / improve */}
                    {(debrief.whatWentWell.length > 0 || debrief.whatCouldImprove.length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {debrief.whatWentWell.length > 0 && (
                          <div className="bg-green-50 border border-green-200 rounded p-2">
                            <p className="font-medium text-xs text-green-800 mb-1">What Went Well</p>
                            <ul className="space-y-0.5">
                              {debrief.whatWentWell.map((item, i) => (
                                <li key={i} className="text-xs text-green-700 flex items-start gap-1">
                                  <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {debrief.whatCouldImprove.length > 0 && (
                          <div className="bg-amber-50 border border-amber-200 rounded p-2">
                            <p className="font-medium text-xs text-amber-800 mb-1">Areas for Improvement</p>
                            <ul className="space-y-0.5">
                              {debrief.whatCouldImprove.map((item, i) => (
                                <li key={i} className="text-xs text-amber-700 flex items-start gap-1">
                                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* staff feelings */}
                    {debrief.staffFeelings && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="font-medium text-xs text-blue-800 mb-1 flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> Staff Feelings</p>
                        <p className="text-xs text-blue-700">{debrief.staffFeelings}</p>
                      </div>
                    )}

                    {/* support offered */}
                    {debrief.supportOffered.length > 0 && (
                      <div>
                        <p className="font-medium text-xs mb-1 flex items-center gap-1"><Users className="h-3.5 w-3.5 text-purple-600" /> Support Offered</p>
                        <ul className="space-y-0.5">
                          {debrief.supportOffered.map((s, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                              <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5 text-purple-600" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* learning points */}
                    {debrief.learningPoints.length > 0 && (
                      <div>
                        <p className="font-medium text-xs mb-1 flex items-center gap-1"><Brain className="h-3.5 w-3.5 text-blue-600" /> Learning Points</p>
                        <ul className="space-y-0.5">
                          {debrief.learningPoints.map((lp, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                              <span className="text-blue-600 shrink-0">•</span>
                              <span>{lp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* follow-up */}
                    {debrief.followUpNeeded && debrief.followUpDetails && (
                      <div className="bg-amber-50 border border-amber-200 rounded p-2">
                        <p className="font-medium text-xs text-amber-800 mb-1 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Follow-Up Required</p>
                        <p className="text-xs text-amber-700">{debrief.followUpDetails}</p>
                      </div>
                    )}

                    {/* notes */}
                    {debrief.notes && (
                      <div>
                        <p className="font-medium text-xs mb-1">RM Notes</p>
                        <p className="text-xs text-muted-foreground">{debrief.notes}</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Staff Debrief & Welfare</p>
          <p>Staff debriefs are an essential part of post-incident learning and staff welfare. The Children&apos;s Homes Regulations 2015 and Quality Standards require that staff are supported following incidents and that learning is used to improve practice. All staff involved in restraints must be offered a debrief within 24 hours. Emotional debriefs should be offered after any distressing event. TCI (Therapeutic Crisis Intervention) reflections should be conducted quarterly to review the home&apos;s use of therapeutic approaches. Staff wellbeing is a leadership responsibility — the RM must ensure that debriefs are conducted sensitively and that staff have access to external support (EAP, counselling) when needed. Debrief records are confidential where marked.</p>
        </div>
      </div>
    </PageShell>
  );
}

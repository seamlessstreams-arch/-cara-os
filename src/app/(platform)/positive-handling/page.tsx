"use client";

import { useState, useMemo } from "react";
import {
  HandMetal, Plus, Search, ArrowUpDown,
  AlertTriangle, CheckCircle2, Clock,
  ChevronDown, ChevronUp, Shield, Heart,
  RefreshCw,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
interface DeEscalation {
  technique: string;
  effectiveness: "usually_effective" | "sometimes_effective" | "rarely_effective";
}

interface PhysicalResponse {
  scenario: string;
  approvedTechniques: string[];
  contraindicated: string[];
  maxDuration: string;
  medicalConsiderations: string;
}

interface PositiveHandlingPlan {
  id: string;
  youngPersonId: string;
  version: string;
  createdDate: string;
  lastReviewed: string;
  nextReview: string;
  reviewedBy: string;
  triggers: string[];
  earlyWarning: string[];
  deEscalation: DeEscalation[];
  physicalResponses: PhysicalResponse[];
  postIncidentSupport: string[];
  childPreferences: string;
  medicalFactors: string;
  staffAuthorised: string[];
  consentObtained: boolean;
  swConsulted: boolean;
  parentNotified: boolean;
  notes: string;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: PositiveHandlingPlan[] = [
  {
    id: "php_1", youngPersonId: "yp_alex", version: "3.1",
    createdDate: d(-365), lastReviewed: d(-14), nextReview: d(76),
    reviewedBy: "staff_darren",
    triggers: [
      "Social media distress — receiving upsetting messages",
      "Feeling controlled or restricted (e.g. phone boundaries)",
      "Arguments with peers — particularly if feeling excluded",
      "Tiredness / poor sleep exacerbating emotional dysregulation",
      "Perceived unfairness — especially around rules",
    ],
    earlyWarning: [
      "Withdrawal to bedroom — refusing to engage",
      "Raised voice — tone becomes sharp and confrontational",
      "Pacing — physically restless, unable to sit still",
      "Verbal threats — 'I'm leaving', 'You can't stop me'",
      "Door slamming — increasing physical expression",
    ],
    deEscalation: [
      { technique: "Give space — allow Alex to go to their room with door open", effectiveness: "usually_effective" },
      { technique: "Calm, low voice — acknowledge feelings before addressing behaviour", effectiveness: "usually_effective" },
      { technique: "Offer choices — 'Would you like to talk here or in the garden?'", effectiveness: "sometimes_effective" },
      { technique: "Distraction — suggest a walk, a snack, or a preferred activity", effectiveness: "sometimes_effective" },
      { technique: "Key worker check-in — Anna is Alex's preferred adult when distressed", effectiveness: "usually_effective" },
      { technique: "Remove the trigger — if phone-related, gently agree to pause and return to it later", effectiveness: "sometimes_effective" },
    ],
    physicalResponses: [
      {
        scenario: "Alex attempting to leave the building at night in a distressed/unsafe state",
        approvedTechniques: ["Team-teach standing hold", "Guide away from door"],
        contraindicated: ["Prone restraint", "Any hold involving chest compression", "Seated hold"],
        maxDuration: "5 minutes — review at 2 minutes. If not calming, adjust approach.",
        medicalConsiderations: "No medical contraindications. Alex does not take medication that affects physical response.",
      },
      {
        scenario: "Alex becoming physically aggressive towards a staff member or peer",
        approvedTechniques: ["Team-teach single elbow hold", "Standing wrap (last resort)"],
        contraindicated: ["Prone restraint", "Floor holds", "Pain compliance"],
        maxDuration: "Minimum time necessary. Target: under 3 minutes.",
        medicalConsiderations: "None identified.",
      },
    ],
    postIncidentSupport: [
      "Allow Alex time to calm — minimum 30 minutes before debrief",
      "Offer a drink and a quiet activity",
      "Debrief using 'what happened, what helped, what would you like to change' framework",
      "Body map check — offer this sensitively",
      "Record in restraint log immediately",
      "Key worker session within 24 hours to process",
      "Contact parent/SW to inform as per notification protocol",
    ],
    childPreferences: "Alex has said they prefer to be spoken to calmly and not crowded. If being held, they want to be told what's happening and why. After an incident, they prefer to be left alone for a bit before anyone talks to them. Alex wants Anna (key worker) to debrief with them whenever possible.",
    medicalFactors: "No current medical factors affecting physical intervention. No injuries, conditions, or medications that would contraindicate approved techniques.",
    staffAuthorised: ["staff_darren", "staff_ryan", "staff_anna", "staff_edward", "staff_lackson"],
    consentObtained: true, swConsulted: true, parentNotified: true,
    notes: "Plan updated following recent restraint incident. De-escalation remains the primary focus. Physical intervention is genuinely a last resort — Alex's history of trauma means physical contact during distress can be re-traumatising. The team manages well with de-escalation in the vast majority of situations.",
  },
  {
    id: "php_2", youngPersonId: "yp_jordan", version: "2.0",
    createdDate: d(-150), lastReviewed: d(-30), nextReview: d(60),
    reviewedBy: "staff_darren",
    triggers: [
      "Anxiety before paternal contact — anticipatory distress",
      "Unexpected changes to routine",
      "Feeling overwhelmed in social situations",
    ],
    earlyWarning: [
      "Becoming very quiet — retreating from interaction",
      "Tearfulness — eyes filling up, lip trembling",
      "Stomach ache complaints — often anxiety-related",
      "Seeking reassurance repeatedly — 'Is everything okay?'",
    ],
    deEscalation: [
      { technique: "Quiet one-to-one conversation — validating feelings", effectiveness: "usually_effective" },
      { technique: "Offering a warm drink and sitting together in the lounge", effectiveness: "usually_effective" },
      { technique: "Breathing exercises — Jordan has learned 4-7-8 technique", effectiveness: "sometimes_effective" },
      { technique: "Grounding activities — naming 5 things they can see/hear", effectiveness: "sometimes_effective" },
      { technique: "Physical comfort — Jordan may want a blanket or to sit close to staff", effectiveness: "usually_effective" },
    ],
    physicalResponses: [
      {
        scenario: "Jordan has not required physical intervention at Oak House. Plan is precautionary.",
        approvedTechniques: ["Team-teach friendly hold only", "Guide away from danger"],
        contraindicated: ["Any restrictive hold", "Prone/supine positions", "Any hold involving upper body compression"],
        maxDuration: "Absolute minimum. Target: under 1 minute.",
        medicalConsiderations: "Jordan has reported previous negative experiences with physical intervention in a former placement. Any physical contact during distress must be extremely carefully considered.",
      },
    ],
    postIncidentSupport: [
      "Immediate reassurance — 'You are safe, I'm here'",
      "Allow Jordan to choose where they want to be",
      "Key worker or preferred adult to remain available",
      "Debrief only when Jordan is ready — may be the following day",
      "SW and parent notified as per protocol",
    ],
    childPreferences: "Jordan has clearly stated they do not want to be physically held. They find it frightening due to past experiences. If Jordan is in distress, they prefer staff to sit near them but not touch them unless they ask. Jordan wants to be spoken to gently and reassured that they are not in trouble.",
    medicalFactors: "No medical contraindications. However, previous trauma responses to physical intervention must be considered primary. Jordan's emotional response to being held would likely escalate rather than reduce distress.",
    staffAuthorised: ["staff_darren", "staff_ryan", "staff_anna"],
    consentObtained: true, swConsulted: true, parentNotified: true,
    notes: "Jordan's plan emphasises that physical intervention is extremely unlikely to be needed and should only be used if there is imminent risk of serious harm. De-escalation is always the approach. Jordan's previous negative experience with restraint in another home is central to this plan.",
  },
  {
    id: "php_3", youngPersonId: "yp_casey", version: "1.2",
    createdDate: d(-310), lastReviewed: d(-45), nextReview: d(45),
    reviewedBy: "staff_darren",
    triggers: [
      "Acute anxiety episodes — can escalate rapidly",
      "Sensory overwhelm — noise, crowds",
      "Perceived rejection or criticism",
    ],
    earlyWarning: [
      "Rapid breathing — hyperventilation beginning",
      "Chest clutching — reporting chest pain",
      "Inability to communicate — speech becomes fragmented",
      "Seeking a small, quiet space — hiding in room or bathroom",
    ],
    deEscalation: [
      { technique: "Guide to a quiet, familiar space", effectiveness: "usually_effective" },
      { technique: "Grounding techniques — 5-4-3-2-1 sensory exercise", effectiveness: "usually_effective" },
      { technique: "Key worker presence — Chervelle is Casey's anchor", effectiveness: "usually_effective" },
      { technique: "Breathing together — staff breathes slowly, Casey mirrors", effectiveness: "sometimes_effective" },
      { technique: "Cold water on wrists — Casey finds this calming", effectiveness: "usually_effective" },
    ],
    physicalResponses: [
      {
        scenario: "Casey has never required physical intervention. Anxiety responses are internalised, not externalised.",
        approvedTechniques: ["Supportive hold only if Casey is at risk of self-harm", "Guide to safety"],
        contraindicated: ["Any restrictive hold", "Any technique that increases sensory input"],
        maxDuration: "Supportive contact only — not restraint.",
        medicalConsiderations: "Casey's anxiety can cause hyperventilation and chest pain. If episode does not resolve within 20 minutes, seek medical assessment (as per recent A&E guidance).",
      },
    ],
    postIncidentSupport: [
      "Remain with Casey until fully calm",
      "Offer water and a quiet activity (art supplies, music)",
      "Key worker debrief when ready",
      "Record in daily log",
      "Inform CAMHS if episode is significant",
    ],
    childPreferences: "Casey prefers to be guided to their room where they can use their own coping strategies (art, music, breathing exercises). Casey wants Chervelle specifically when they're having an anxiety episode. Casey does NOT want lots of people around — one calm person is best.",
    medicalFactors: "Anxiety disorder managed by CAMHS. No medication that affects physical responses. A&E guidance: if hyperventilation/chest pain does not resolve within 20 minutes, take to A&E for assessment (recent episode protocol).",
    staffAuthorised: ["staff_darren", "staff_chervelle"],
    consentObtained: true, swConsulted: true, parentNotified: true,
    notes: "Casey's plan is fundamentally about anxiety management, not behaviour management. Physical intervention is essentially not applicable. The plan exists as a safeguard and to document the de-escalation approach. CAMHS is actively involved in Casey's support.",
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function PositiveHandlingPage() {
  const [plans] = useState<PositiveHandlingPlan[]>(SEED);
  const [expanded, setExpanded] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const reviewsDue = plans.filter((p) => p.nextReview < today).length;

  const EFFECT_COLORS: Record<string, string> = {
    usually_effective: "bg-green-100 text-green-800",
    sometimes_effective: "bg-yellow-100 text-yellow-800",
    rarely_effective: "bg-red-100 text-red-800",
  };

  const exportData = useMemo(() => plans, [plans]);

  const exportCols: ExportColumn<PositiveHandlingPlan>[] = [
    { header: "Young Person", accessor: (r: PositiveHandlingPlan) => getYPName(r.youngPersonId) },
    { header: "Version", accessor: (r: PositiveHandlingPlan) => r.version },
    { header: "Last Reviewed", accessor: (r: PositiveHandlingPlan) => r.lastReviewed },
    { header: "Next Review", accessor: (r: PositiveHandlingPlan) => r.nextReview },
    { header: "Triggers", accessor: (r: PositiveHandlingPlan) => r.triggers.join("; ") },
    { header: "Early Warning Signs", accessor: (r: PositiveHandlingPlan) => r.earlyWarning.join("; ") },
    { header: "De-escalation", accessor: (r: PositiveHandlingPlan) => r.deEscalation.map((de: DeEscalation) => `${de.technique} (${de.effectiveness})`).join("; ") },
    { header: "Child Preferences", accessor: (r: PositiveHandlingPlan) => r.childPreferences },
    { header: "Medical Factors", accessor: (r: PositiveHandlingPlan) => r.medicalFactors },
    { header: "Authorised Staff", accessor: (r: PositiveHandlingPlan) => r.staffAuthorised.map((s: string) => getStaffName(s)).join(", ") },
    { header: "Reviewed By", accessor: (r: PositiveHandlingPlan) => getStaffName(r.reviewedBy) },
    { header: "Notes", accessor: (r: PositiveHandlingPlan) => r.notes },
  ];

  return (
    <PageShell
      title="Positive Handling Plans"
      subtitle="Individual behaviour support and physical intervention plans for each young person"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Positive Handling Plans" />
          <ExportButton data={exportData} columns={exportCols} filename="positive-handling" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Plans", value: plans.length, icon: HandMetal, colour: "text-blue-600" },
            { label: "Reviews Due", value: reviewsDue, icon: Clock, colour: reviewsDue > 0 ? "text-orange-600" : "text-green-600" },
            { label: "SW Consulted", value: plans.filter((p) => p.swConsulted).length, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Consent Obtained", value: plans.filter((p) => p.consentObtained).length, icon: Shield, colour: "text-green-600" },
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

        {/* ── plans ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          {plans.map((plan) => {
            const isExpanded = expanded === plan.id;
            const overdue = plan.nextReview < today;

            return (
              <div key={plan.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : plan.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <HandMetal className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">{getYPName(plan.youngPersonId)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        v{plan.version} · Reviewed: {plan.lastReviewed} · Next: {plan.nextReview}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {overdue && <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">Review Due</Badge>}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* triggers */}
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="text-xs font-medium text-red-700 mb-2">Known Triggers</p>
                      <ul className="space-y-1">
                        {plan.triggers.map((t, i) => (
                          <li key={i} className="flex items-start gap-1 text-sm">
                            <AlertTriangle className="h-3 w-3 text-red-600 mt-0.5 shrink-0" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* early warning */}
                    <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
                      <p className="text-xs font-medium text-orange-700 mb-2">Early Warning Signs</p>
                      <ul className="space-y-1">
                        {plan.earlyWarning.map((e, i) => (
                          <li key={i} className="flex items-start gap-1 text-sm">
                            <Clock className="h-3 w-3 text-orange-600 mt-0.5 shrink-0" />
                            <span>{e}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* de-escalation */}
                    <div>
                      <p className="text-sm font-medium mb-2">De-escalation Strategies</p>
                      <div className="space-y-1">
                        {plan.deEscalation.map((de: DeEscalation, i: number) => (
                          <div key={i} className="flex items-start gap-2 rounded-lg border bg-white p-2.5 text-sm">
                            <CheckCircle2 className={cn("h-4 w-4 mt-0.5 shrink-0",
                              de.effectiveness === "usually_effective" ? "text-green-600" :
                              de.effectiveness === "sometimes_effective" ? "text-yellow-600" : "text-red-600"
                            )} />
                            <span className="flex-1">{de.technique}</span>
                            <Badge className={cn("text-xs", EFFECT_COLORS[de.effectiveness])}>
                              {de.effectiveness.replace(/_/g, " ")}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* physical responses */}
                    {plan.physicalResponses.map((pr: PhysicalResponse, idx: number) => (
                      <div key={idx} className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-medium text-blue-700 mb-2">Physical Response Scenario {idx + 1}</p>
                        <p className="text-sm mb-2"><strong>Scenario:</strong> {pr.scenario}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs font-medium text-green-700 mb-1">Approved Techniques</p>
                            {pr.approvedTechniques.map((t, i) => (
                              <p key={i} className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" />{t}</p>
                            ))}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-red-700 mb-1">Contraindicated</p>
                            {pr.contraindicated.map((t, i) => (
                              <p key={i} className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-red-600" />{t}</p>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs mt-2"><strong>Max Duration:</strong> {pr.maxDuration}</p>
                        <p className="text-xs"><strong>Medical:</strong> {pr.medicalConsiderations}</p>
                      </div>
                    ))}

                    {/* child's voice */}
                    <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <Heart className="h-4 w-4 text-pink-600" />
                        <p className="text-xs font-medium text-pink-700">Child&apos;s Preferences & Voice</p>
                      </div>
                      <p className="text-sm">{plan.childPreferences}</p>
                    </div>

                    {/* post-incident */}
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <p className="text-xs font-medium text-green-700 mb-2">Post-Incident Support</p>
                      <ul className="space-y-1">
                        {plan.postIncidentSupport.map((p, i) => (
                          <li key={i} className="flex items-start gap-1 text-sm">
                            <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* meta */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className={cn("h-3 w-3", plan.consentObtained ? "text-green-600" : "text-red-600")} />
                        <span>Consent: {plan.consentObtained ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className={cn("h-3 w-3", plan.swConsulted ? "text-green-600" : "text-red-600")} />
                        <span>SW Consulted: {plan.swConsulted ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className={cn("h-3 w-3", plan.parentNotified ? "text-green-600" : "text-red-600")} />
                        <span>Parent Notified: {plan.parentNotified ? "Yes" : "No"}</span>
                      </div>
                      <div><span className="text-muted-foreground">Reviewed By:</span> <span className="font-medium">{getStaffName(plan.reviewedBy)}</span></div>
                    </div>

                    {/* authorised staff */}
                    <div className="text-sm">
                      <span className="text-muted-foreground">Authorised Staff: </span>
                      {plan.staffAuthorised.map((s: string) => getStaffName(s)).join(", ")}
                    </div>

                    {/* notes */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Notes</p>
                      <p className="text-sm">{plan.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Regulation 19 & 20:</strong> Physical intervention must only be used as a last resort
          and must be proportionate, necessary, and for the shortest possible time. Each child must have
          a behaviour support plan that prioritises de-escalation. Plans must be developed with the child&apos;s
          input, agreed with the placing authority, and reviewed regularly. Staff must be trained in approved
          techniques (Team-Teach or equivalent). All incidents of physical intervention must be recorded
          in the restraint log.
        </div>
      </div>
    </PageShell>
  );
}

"use client";

// ══════════════════════════════════════════════════════════════════════════════
// HR — SAFEGUARDING / LADO PATHWAY TOOL
//
// Structured pathway for managing allegations against staff under the LADO
// framework. Guides the manager through:
//   1. Initial concern — nature, source, child involved
//   2. LADO consultation — decision, agreed actions, timescales
//   3. Strategy meeting — multi-agency decisions, investigation plan
//   4. Investigation progress — tracking against agreed actions
//   5. Outcome — LADO categories, DBS referral, Ofsted notification
//
// Aria provides professional guidance at each stage but the Registered Manager
// and LADO are the decision-makers.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Users,
  FileText,
  Clock,
  ChevronRight,
  ChevronLeft,
  Scale,
  Bell,
  UserCheck,
  Gavel,
  Target,
  BookOpen,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type PathwayStage = "initial_concern" | "lado_consultation" | "strategy_meeting" | "investigation" | "outcome";

type AllegationCategory =
  | "behaved_in_way_that_harmed"
  | "possibly_committed_criminal_offence"
  | "behaved_towards_child_indicating_unsuitable"
  | "created_risk_to_children";

type LADOOutcome =
  | "substantiated"
  | "malicious"
  | "false"
  | "unsubstantiated"
  | "unfounded";

const STAGES: { key: PathwayStage; label: string; icon: React.ElementType }[] = [
  { key: "initial_concern", label: "Initial Concern", icon: AlertTriangle },
  { key: "lado_consultation", label: "LADO Consultation", icon: Phone },
  { key: "strategy_meeting", label: "Strategy Meeting", icon: Users },
  { key: "investigation", label: "Investigation", icon: FileText },
  { key: "outcome", label: "Outcome", icon: Scale },
];

const ALLEGATION_CATEGORIES: { value: AllegationCategory; label: string }[] = [
  { value: "behaved_in_way_that_harmed", label: "Behaved in a way that has harmed or may have harmed a child" },
  { value: "possibly_committed_criminal_offence", label: "Possibly committed a criminal offence against or related to a child" },
  { value: "behaved_towards_child_indicating_unsuitable", label: "Behaved towards a child in a way that indicates they may pose a risk" },
  { value: "created_risk_to_children", label: "Created a risk or may have created a risk to children (transferable risk)" },
];

const LADO_OUTCOMES: { value: LADOOutcome; label: string; colour: string }[] = [
  { value: "substantiated", label: "Substantiated", colour: "bg-red-100 text-red-800" },
  { value: "malicious", label: "Malicious", colour: "bg-orange-100 text-orange-800" },
  { value: "false", label: "False", colour: "bg-amber-100 text-amber-800" },
  { value: "unsubstantiated", label: "Unsubstantiated", colour: "bg-slate-100 text-slate-700" },
  { value: "unfounded", label: "Unfounded", colour: "bg-emerald-100 text-emerald-800" },
];

const CONCERN_SOURCES = [
  { value: "child_disclosure", label: "Child disclosure" },
  { value: "staff_report", label: "Staff report / whistleblowing" },
  { value: "parent_complaint", label: "Parent / carer complaint" },
  { value: "professional_concern", label: "Professional concern (SW, health, police)" },
  { value: "observation", label: "Manager observation" },
  { value: "allegation", label: "Direct allegation" },
  { value: "pattern_identified", label: "Pattern identified from records" },
  { value: "other", label: "Other" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function SafeguardingLADOPage() {
  const [stage, setStage] = useState<PathwayStage>("initial_concern");

  // Stage 1: Initial concern
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [childName, setChildName] = useState("");
  const [dateOfConcern, setDateOfConcern] = useState("");
  const [concernSource, setConcernSource] = useState("");
  const [allegationCategory, setAllegationCategory] = useState<AllegationCategory | "">("");
  const [concernDescription, setConcernDescription] = useState("");
  const [immediateActions, setImmediateActions] = useState("");
  const [childSafe, setChildSafe] = useState<"yes" | "no" | "">("");

  // Stage 2: LADO consultation
  const [ladoName, setLadoName] = useState("");
  const [ladoContactDate, setLadoContactDate] = useState("");
  const [ladoContactTime, setLadoContactTime] = useState("");
  const [ladoReferenceNumber, setLadoReferenceNumber] = useState("");
  const [ladoAdvice, setLadoAdvice] = useState("");
  const [ladoAgreedActions, setLadoAgreedActions] = useState("");
  const [policeInvolved, setPoliceInvolved] = useState<"yes" | "no" | "">("");
  const [policeDetails, setPoliceDetails] = useState("");

  // Stage 3: Strategy meeting
  const [strategyDate, setStrategyDate] = useState("");
  const [attendees, setAttendees] = useState("");
  const [strategyDecisions, setStrategyDecisions] = useState("");
  const [investigationPlan, setInvestigationPlan] = useState("");
  const [interimMeasures, setInterimMeasures] = useState("");

  // Stage 4: Investigation
  const [investigationProgress, setInvestigationProgress] = useState("");
  const [evidenceGathered, setEvidenceGathered] = useState("");
  const [interviewsConducted, setInterviewsConducted] = useState("");
  const [ladoUpdates, setLadoUpdates] = useState("");

  // Stage 5: Outcome
  const [ladoOutcome, setLadoOutcome] = useState<LADOOutcome | "">("");
  const [outcomeRationale, setOutcomeRationale] = useState("");
  const [dbsReferral, setDbsReferral] = useState<"yes" | "no" | "not_applicable" | "">("");
  const [dbsRationale, setDbsRationale] = useState("");
  const [ofstedNotified, setOfstedNotified] = useState<"yes" | "no" | "">("");
  const [disciplinaryAction, setDisciplinaryAction] = useState("");
  const [learningPoints, setLearningPoints] = useState("");

  // ── Navigation ──────────────────────────────────────────────────────────

  const stageIdx = STAGES.findIndex((s) => s.key === stage);

  const completionStatus = useMemo(() => {
    return {
      initial_concern: !!staffName && !!concernDescription && !!allegationCategory,
      lado_consultation: !!ladoName && !!ladoAdvice,
      strategy_meeting: !!strategyDecisions,
      investigation: !!investigationProgress,
      outcome: !!ladoOutcome,
    };
  }, [staffName, concernDescription, allegationCategory, ladoName, ladoAdvice, strategyDecisions, investigationProgress, ladoOutcome]);

  const completedStages = Object.values(completionStatus).filter(Boolean).length;

  function renderStageNav() {
    return (
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          const isActive = s.key === stage;
          const isDone = completionStatus[s.key];
          return (
            <button
              key={s.key}
              onClick={() => setStage(s.key)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-red-700 text-white"
                  : isDone
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {isDone && !isActive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // ── Stage renders ───────────────────────────────────────────────────────

  function renderInitialConcern() {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3 text-sm text-red-800">
          <Shield className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
          <div>
            <strong>Safeguarding allegation pathway.</strong> Do not investigate before consulting the LADO.
            Do not inform the subject of the allegation until the LADO and, where applicable, the police
            have confirmed it is safe to do so. Ensure the child is safe.
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-slate-500" />Concern Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Staff member</label>
                <Input value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Role</label>
                <Input value={staffRole} onChange={(e) => setStaffRole(e.target.value)} placeholder="e.g. Residential Support Worker" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Child concerned</label>
                <Input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Child's name" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Date of concern</label>
                <Input type="date" value={dateOfConcern} onChange={(e) => setDateOfConcern(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Source of concern</label>
                <Select value={concernSource} onValueChange={setConcernSource}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    {CONCERN_SOURCES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Is the child safe now?</label>
                <Select value={childSafe} onValueChange={(v) => setChildSafe(v as "yes" | "no")}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes — child is safe</SelectItem>
                    <SelectItem value="no">No — immediate safeguarding action needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {childSafe === "no" && (
          <div className="rounded-2xl bg-red-100 border border-red-300 px-4 py-3 flex items-start gap-3 text-sm text-red-900 font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              The child&apos;s safety is the immediate priority. Take whatever steps are necessary to ensure the child
              is safe before proceeding with any process. Contact children&apos;s social care and the police if there is
              an immediate risk.
            </div>
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />Allegation Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={allegationCategory} onValueChange={(v) => setAllegationCategory(v as AllegationCategory)}>
              <SelectTrigger><SelectValue placeholder="Select the allegation category" /></SelectTrigger>
              <SelectContent>
                {ALLEGATION_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Description of concern</label>
              <Textarea
                value={concernDescription}
                onChange={(e) => setConcernDescription(e.target.value)}
                placeholder="Describe the concern factually — what is alleged to have happened, when, where, and what is the evidence or basis for the concern..."
                rows={5}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Immediate actions taken</label>
              <Textarea
                value={immediateActions}
                onChange={(e) => setImmediateActions(e.target.value)}
                placeholder="What immediate actions have been taken to safeguard the child? Has the staff member been removed from contact with children? Has suspension been considered?"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderLADOConsultation() {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-start gap-3 text-sm text-blue-800">
          <Phone className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
          <div>
            <strong>LADO consultation.</strong> Contact the LADO within one working day of the concern being
            raised. Record the date, time, and advice given. The LADO will advise on the appropriate course
            of action including whether a strategy meeting is needed.
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-slate-500" />LADO Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">LADO name</label>
                <Input value={ladoName} onChange={(e) => setLadoName(e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Reference number</label>
                <Input value={ladoReferenceNumber} onChange={(e) => setLadoReferenceNumber(e.target.value)} placeholder="LADO reference" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Date of contact</label>
                <Input type="date" value={ladoContactDate} onChange={(e) => setLadoContactDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Time of contact</label>
                <Input type="time" value={ladoContactTime} onChange={(e) => setLadoContactTime(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-500" />LADO Advice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Advice given by LADO</label>
              <Textarea
                value={ladoAdvice}
                onChange={(e) => setLadoAdvice(e.target.value)}
                placeholder="Record the LADO's advice — does this meet the threshold? What actions are agreed? Is a strategy meeting needed? Can the employer investigate?"
                rows={5}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Agreed actions</label>
              <Textarea
                value={ladoAgreedActions}
                onChange={(e) => setLadoAgreedActions(e.target.value)}
                placeholder="List the agreed actions with owners and timescales..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Police involvement</label>
                <Select value={policeInvolved} onValueChange={(v) => setPoliceInvolved(v as "yes" | "no")}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes — police are involved</SelectItem>
                    <SelectItem value="no">No — police not involved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {policeInvolved === "yes" && (
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Police details</label>
                  <Input value={policeDetails} onChange={(e) => setPoliceDetails(e.target.value)} placeholder="Officer name, reference number" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderStrategyMeeting() {
    return (
      <div className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-500" />Strategy Meeting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Date of strategy meeting</label>
              <Input type="date" value={strategyDate} onChange={(e) => setStrategyDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Attendees</label>
              <Textarea
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="List attendees — LADO, police, social worker, RM, RI, HR..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Decisions and agreed actions</label>
              <Textarea
                value={strategyDecisions}
                onChange={(e) => setStrategyDecisions(e.target.value)}
                placeholder="Record the decisions — who will investigate, what type of investigation (criminal, s47, employer), timescales, information sharing agreements..."
                rows={5}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Investigation plan</label>
              <Textarea
                value={investigationPlan}
                onChange={(e) => setInvestigationPlan(e.target.value)}
                placeholder="What is the agreed investigation plan? Who will be interviewed? What evidence will be gathered? Can the employer proceed or must they wait for the police?"
                rows={4}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Interim measures</label>
              <Textarea
                value={interimMeasures}
                onChange={(e) => setInterimMeasures(e.target.value)}
                placeholder="What interim measures are in place? Suspension, adjusted duties, increased supervision? Who is supporting the child and the staff member?"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderInvestigation() {
    return (
      <div className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />Investigation Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Progress summary</label>
              <Textarea
                value={investigationProgress}
                onChange={(e) => setInvestigationProgress(e.target.value)}
                placeholder="Record investigation progress — what has been done, what is outstanding, are timescales being met?"
                rows={5}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Evidence gathered</label>
              <Textarea
                value={evidenceGathered}
                onChange={(e) => setEvidenceGathered(e.target.value)}
                placeholder="List evidence gathered — statements, CCTV, records, documents..."
                rows={4}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Interviews conducted</label>
              <Textarea
                value={interviewsConducted}
                onChange={(e) => setInterviewsConducted(e.target.value)}
                placeholder="Who has been interviewed? Summarise key points from each interview..."
                rows={4}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">LADO updates</label>
              <Textarea
                value={ladoUpdates}
                onChange={(e) => setLadoUpdates(e.target.value)}
                placeholder="Record any updates to/from the LADO during the investigation..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="rounded-2xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-start gap-3 text-sm text-blue-800">
          <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
          <div>
            <strong>Aria guidance.</strong> Keep the LADO updated throughout the investigation. If the investigation
            reveals new information that changes the nature or seriousness of the allegation, reconvene the strategy
            meeting. The employer&apos;s investigation should not prejudice the police investigation.
          </div>
        </div>
      </div>
    );
  }

  function renderOutcome() {
    return (
      <div className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4 text-slate-500" />LADO Outcome
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">LADO outcome category</label>
              <Select value={ladoOutcome} onValueChange={(v) => setLadoOutcome(v as LADOOutcome)}>
                <SelectTrigger><SelectValue placeholder="Select outcome" /></SelectTrigger>
                <SelectContent>
                  {LADO_OUTCOMES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {ladoOutcome && (
              <Badge className={cn("text-xs", LADO_OUTCOMES.find((o) => o.value === ladoOutcome)?.colour)}>
                {LADO_OUTCOMES.find((o) => o.value === ladoOutcome)?.label}
              </Badge>
            )}
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Outcome rationale</label>
              <Textarea
                value={outcomeRationale}
                onChange={(e) => setOutcomeRationale(e.target.value)}
                placeholder="Record the basis for the outcome — the evidence considered, the standard of proof applied, and the reasoning..."
                rows={5}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-500" />Regulatory Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">DBS referral required?</label>
                <Select value={dbsReferral} onValueChange={(v) => setDbsReferral(v as "yes" | "no" | "not_applicable")}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes — DBS referral required</SelectItem>
                    <SelectItem value="no">No — DBS referral not required</SelectItem>
                    <SelectItem value="not_applicable">Not applicable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Ofsted notified?</label>
                <Select value={ofstedNotified} onValueChange={(v) => setOfstedNotified(v as "yes" | "no")}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes — Ofsted notified (Reg 40)</SelectItem>
                    <SelectItem value="no">No — notification not required</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {dbsReferral === "yes" && (
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">DBS referral rationale</label>
                <Textarea
                  value={dbsRationale}
                  onChange={(e) => setDbsRationale(e.target.value)}
                  placeholder="Record the rationale for the DBS referral — was the person removed from regulated activity, or would they have been removed had they not resigned?"
                  rows={3}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Gavel className="h-4 w-4 text-slate-500" />Employer Action
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Disciplinary or HR action</label>
              <Textarea
                value={disciplinaryAction}
                onChange={(e) => setDisciplinaryAction(e.target.value)}
                placeholder="What HR or disciplinary action will the employer take? If the allegation was substantiated, what is the outcome? If the person has resigned, what records will be kept?"
                rows={4}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Learning points</label>
              <Textarea
                value={learningPoints}
                onChange={(e) => setLearningPoints(e.target.value)}
                placeholder="What has been learned? Are there practice changes, training needs, policy updates, or recruitment improvements to consider?"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {dbsReferral === "yes" && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3 text-sm text-red-800">
            <Shield className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
            <div>
              <strong>DBS referral duty.</strong> If a person is removed from regulated activity (or would have
              been removed had they not resigned) because they posed a risk to children, a DBS referral is a
              legal duty. Failure to refer is a criminal offence. The referral must be made even if the person resigns.
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────

  return (
    <PageShell
      title="Safeguarding / LADO Pathway"
      subtitle="Allegations against staff — structured LADO pathway"
      actions={
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <Shield className="h-3 w-3 mr-1" />Safeguarding
        </Badge>
      }
    >
      <div className="max-w-4xl space-y-5 animate-fade-in">

        {/* Progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-600">Pathway progress</span>
            <span className="text-xs text-slate-500">{completedStages} of {STAGES.length} stages started</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-red-500 transition-all duration-500"
              style={{ width: `${(completedStages / STAGES.length) * 100}%` }}
            />
          </div>
        </div>

        {renderStageNav()}

        {stage === "initial_concern" && renderInitialConcern()}
        {stage === "lado_consultation" && renderLADOConsultation()}
        {stage === "strategy_meeting" && renderStrategyMeeting()}
        {stage === "investigation" && renderInvestigation()}
        {stage === "outcome" && renderOutcome()}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={stageIdx === 0}
            onClick={() => setStage(STAGES[stageIdx - 1].key)}
            className="gap-1.5"
          >
            <ChevronLeft className="h-3.5 w-3.5" />Previous
          </Button>
          <Button
            size="sm"
            disabled={stageIdx >= STAGES.length - 1}
            onClick={() => setStage(STAGES[stageIdx + 1].key)}
            className="gap-1.5"
          >
            Next<ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </PageShell>
  );
}

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
  AlertTriangle, CheckCircle2, Clock, Shield, UserX, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type AllegationType = "physical_abuse" | "emotional_abuse" | "sexual_abuse" | "neglect" | "inappropriate_behaviour" | "inappropriate_relationship" | "boundary_violation" | "other";
type Outcome = "substantiated" | "unsubstantiated" | "unfounded" | "malicious" | "pending";
type ReferralStatus = "initial_assessment" | "lado_contacted" | "strategy_meeting" | "investigation" | "outcome_reached" | "closed" | "nfa";
type StaffAction = "suspended" | "restricted_duties" | "normal_duties" | "resigned" | "dismissed" | "cleared";

interface LADOReferral {
  id: string;
  dateReferred: string;
  dateAllegation: string;
  referredBy: string;
  subjectStaffId: string;
  subjectStaffRole: string;
  allegationType: AllegationType;
  status: ReferralStatus;
  outcome: Outcome;
  staffAction: StaffAction;
  childIds: string[];
  ladoName: string;
  ladoContact: string;
  allegationSummary: string;
  evidenceSummary: string;
  strategyMeetingDate: string | null;
  strategyMeetingAttendees: string[];
  investigationFindings: string;
  ofstedNotified: boolean;
  ofstedNotifiedDate: string | null;
  dBSReferral: boolean;
  policeInvolved: boolean;
  policeRef: string | null;
  supportForStaff: string;
  supportForChild: string;
  lessonLearned: string;
  confidentialityLevel: "restricted" | "highly_restricted";
  reviewDates: string[];
  closedDate: string | null;
  closedBy: string | null;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const ALLG_LABEL: Record<AllegationType, string> = {
  physical_abuse: "Physical Abuse", emotional_abuse: "Emotional Abuse",
  sexual_abuse: "Sexual Abuse", neglect: "Neglect",
  inappropriate_behaviour: "Inappropriate Behaviour", inappropriate_relationship: "Inappropriate Relationship",
  boundary_violation: "Boundary Violation", other: "Other",
};
const ALLG_CLR: Record<AllegationType, string> = {
  physical_abuse: "bg-red-100 text-red-800", emotional_abuse: "bg-orange-100 text-orange-800",
  sexual_abuse: "bg-red-100 text-red-800", neglect: "bg-amber-100 text-amber-800",
  inappropriate_behaviour: "bg-yellow-100 text-yellow-800", inappropriate_relationship: "bg-purple-100 text-purple-800",
  boundary_violation: "bg-blue-100 text-blue-800", other: "bg-slate-100 text-slate-800",
};

const OUTCOME_LABEL: Record<Outcome, string> = { substantiated: "Substantiated", unsubstantiated: "Unsubstantiated", unfounded: "Unfounded", malicious: "Malicious", pending: "Pending" };
const OUTCOME_CLR: Record<Outcome, string> = { substantiated: "bg-red-100 text-red-800", unsubstantiated: "bg-amber-100 text-amber-800", unfounded: "bg-green-100 text-green-800", malicious: "bg-purple-100 text-purple-800", pending: "bg-blue-100 text-blue-800" };

const STATUS_LABEL: Record<ReferralStatus, string> = {
  initial_assessment: "Initial Assessment", lado_contacted: "LADO Contacted",
  strategy_meeting: "Strategy Meeting", investigation: "Investigation",
  outcome_reached: "Outcome Reached", closed: "Closed", nfa: "No Further Action",
};
const STATUS_CLR: Record<ReferralStatus, string> = {
  initial_assessment: "bg-blue-100 text-blue-800", lado_contacted: "bg-indigo-100 text-indigo-800",
  strategy_meeting: "bg-yellow-100 text-yellow-800", investigation: "bg-orange-100 text-orange-800",
  outcome_reached: "bg-purple-100 text-purple-800", closed: "bg-slate-100 text-slate-800",
  nfa: "bg-green-100 text-green-800",
};

const STAFF_ACTION_LABEL: Record<StaffAction, string> = { suspended: "Suspended", restricted_duties: "Restricted Duties", normal_duties: "Normal Duties", resigned: "Resigned", dismissed: "Dismissed", cleared: "Cleared" };
const STAFF_ACTION_CLR: Record<StaffAction, string> = { suspended: "bg-red-100 text-red-800", restricted_duties: "bg-orange-100 text-orange-800", normal_duties: "bg-green-100 text-green-800", resigned: "bg-slate-100 text-slate-800", dismissed: "bg-red-100 text-red-800", cleared: "bg-green-100 text-green-800" };

const BORDER_OUTCOME: Record<Outcome, string> = { substantiated: "border-l-red-600", unsubstantiated: "border-l-amber-400", unfounded: "border-l-green-400", malicious: "border-l-purple-500", pending: "border-l-blue-400" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: LADOReferral[] = [
  {
    id: "lado_1", dateReferred: d(-45), dateAllegation: d(-46),
    referredBy: "staff_darren", subjectStaffId: "staff_edward", subjectStaffRole: "Residential Care Worker",
    allegationType: "inappropriate_behaviour", status: "closed", outcome: "unsubstantiated",
    staffAction: "cleared", childIds: ["yp_alex"],
    ladoName: "Sarah Thornton", ladoContact: "s.thornton@localauthority.gov.uk",
    allegationSummary: "Alex alleged that Edward shouted aggressively during an incident on the evening shift. Alex stated he felt frightened. Edward acknowledged raising his voice but denies aggression — states he was trying to be heard over Alex who was shouting. Two witnesses present.",
    evidenceSummary: "CCTV reviewed — shows both Edward and Alex in living room. Audio not available. Body language does not indicate aggression from Edward. Two staff witnesses (Anna, Chervelle) state Edward raised voice to be heard but was not aggressive. Alex spoke to independently — acknowledged Edward did not threaten or intimidate, but 'it was loud'. Previous PI debrief shows Edward used de-escalation appropriately.",
    strategyMeetingDate: d(-42), strategyMeetingAttendees: ["Sarah Thornton (LADO)", "Darren Laville (RM)", "Karen Holding (SW for Alex)"],
    investigationFindings: "Investigation concluded Edward's actions were proportionate to the situation. Voice was raised but not aggressive. No threatening or intimidating behaviour identified. De-escalation techniques were used. Recommendation: refresher training on low-arousal approaches for Edward.",
    ofstedNotified: true, ofstedNotifiedDate: d(-45),
    dBSReferral: false, policeInvolved: false, policeRef: null,
    supportForStaff: "Edward offered EAP support. Supervision session held to discuss impact. Edward expressed relief at outcome but acknowledged learning about voice modulation.",
    supportForChild: "Alex given opportunity to discuss feelings. Key work session focused on understanding different communication styles. Alex accepted Edward's explanation.",
    lessonLearned: "Team training refresher on low-arousal approaches booked. Reminder that all raised voice incidents should be documented in daily log regardless of context.",
    confidentialityLevel: "restricted",
    reviewDates: [d(-42), d(-35), d(-28)],
    closedDate: d(-28), closedBy: "staff_darren",
  },
  {
    id: "lado_2", dateReferred: d(-120), dateAllegation: d(-121),
    referredBy: "staff_darren", subjectStaffId: "staff_diane", subjectStaffRole: "Residential Care Worker (Bank)",
    allegationType: "boundary_violation", status: "closed", outcome: "substantiated",
    staffAction: "dismissed", childIds: ["yp_casey"],
    ladoName: "Sarah Thornton", ladoContact: "s.thornton@localauthority.gov.uk",
    allegationSummary: "Diane shared personal mobile number with Casey and exchanged text messages outside of work hours. Messages discovered during routine phone check. Content included personal life discussion and arrangements to meet outside of the home context. No safeguarding concerns within message content but clear boundary violation.",
    evidenceSummary: "Phone check revealed 14 text messages between Diane's personal number and Casey's phone over 5 days. Messages were friendly in nature — discussing personal interests, sharing music links, and one message suggesting meeting for coffee 'off the record'. No grooming indicators identified but persistent boundary violation. Diane admitted to exchanging messages when interviewed — stated she 'felt sorry for Casey' and 'wanted to be a friend'. Diane had completed safeguarding training 4 months prior which explicitly covered professional boundaries.",
    strategyMeetingDate: d(-118), strategyMeetingAttendees: ["Sarah Thornton (LADO)", "Darren Laville (RM)", "Fiona Brennan (SW for Casey)", "HR Representative"],
    investigationFindings: "Substantiated boundary violation. While no evidence of grooming or malicious intent, Diane's actions placed Casey at risk by creating a dual relationship outside professional context. Diane's training records confirm she received clear guidance on boundaries. Decision: dismissal for gross misconduct (breach of professional boundaries with a vulnerable child).",
    ofstedNotified: true, ofstedNotifiedDate: d(-120),
    dBSReferral: true, policeInvolved: false, policeRef: null,
    supportForStaff: "Diane offered EAP support. Written notification of dismissal process. Right of appeal communicated.",
    supportForChild: "Casey received direct work session about healthy adult-child relationships. Therapeutic input referral made. Casey expressed confusion and some guilt — reassured this was not their fault. Risk assessment updated.",
    lessonLearned: "Annual boundaries refresher added to mandatory training calendar. Phone check procedure strengthened — quarterly spot checks rather than 6-monthly. New staff induction pack updated with explicit social media and personal contact policy. Case used anonymously in team training with consent.",
    confidentialityLevel: "highly_restricted",
    reviewDates: [d(-118), d(-110), d(-100), d(-90)],
    closedDate: d(-90), closedBy: "staff_darren",
  },
  {
    id: "lado_3", dateReferred: d(-7), dateAllegation: d(-7),
    referredBy: "staff_darren", subjectStaffId: "staff_anna", subjectStaffRole: "Senior Residential Care Worker",
    allegationType: "physical_abuse", status: "investigation",
    outcome: "pending", staffAction: "restricted_duties", childIds: ["yp_jordan"],
    ladoName: "Sarah Thornton", ladoContact: "s.thornton@localauthority.gov.uk",
    allegationSummary: "Jordan alleged that Anna grabbed their arm 'too hard' during a corridor incident when Jordan was running towards the stairs in a heightened state. Jordan showed a red mark on their upper left arm. Anna states she used a guided touch to redirect Jordan away from the stairs for safety. Restraint log completed. Body map completed showing red mark consistent with gripping.",
    evidenceSummary: "Body map shows red mark on upper left arm — two finger-width marks visible. Consistent with gripping. CCTV shows corridor incident but angle does not clearly show the arm contact. Anna's account states she placed her hand on Jordan's arm to guide them away from stairs. PI debrief form completed. Jordan's account describes 'being grabbed and pushed'. Witness (Chervelle) states she saw Anna place her hand on Jordan's arm but did not see the level of force used. Mark photographed — GP appointment booked.",
    strategyMeetingDate: d(-5), strategyMeetingAttendees: ["Sarah Thornton (LADO)", "Darren Laville (RM)", "Michael Osei (SW for Jordan)"],
    investigationFindings: "Investigation ongoing. LADO has requested additional witness statements and review of Anna's PRICE training records. GP report pending on injury assessment. Anna placed on restricted duties (no lone working with Jordan) as precautionary measure — not a disciplinary sanction.",
    ofstedNotified: true, ofstedNotifiedDate: d(-7),
    dBSReferral: false, policeInvolved: false, policeRef: null,
    supportForStaff: "Anna offered EAP support. Informed this is a precautionary investigation. Union rep involved. Supervision brought forward.",
    supportForChild: "Jordan given opportunity to speak with independent advocate. Additional 1:1 support offered. Jordan's SW informed and visited within 24 hours. Jordan continuing to attend school as normal.",
    lessonLearned: "Pending investigation outcome — lessons to be identified at closure. Initial observation: corridor CCTV angle needs adjusting to capture full width of corridor.",
    confidentialityLevel: "highly_restricted",
    reviewDates: [d(-5)],
    closedDate: null, closedBy: null,
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function LADOReferralsPage() {
  const [data] = useState(SEED);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterOutcome, setFilterOutcome] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── derived ─────────────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterOutcome !== "all" && r.outcome !== filterOutcome) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          getStaffName(r.subjectStaffId).toLowerCase().includes(q) ||
          r.allegationSummary.toLowerCase().includes(q) ||
          ALLG_LABEL[r.allegationType].toLowerCase().includes(q) ||
          r.childIds.some((c) => getYPName(c).toLowerCase().includes(q))
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.dateReferred.localeCompare(a.dateReferred);
        case "date-asc": return a.dateReferred.localeCompare(b.dateReferred);
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterStatus, filterOutcome, sortBy]);

  /* ── stats ───────────────────────────────────────────────────────────────── */

  const activeReferrals = data.filter((r) => r.status !== "closed" && r.status !== "nfa").length;
  const totalReferrals = data.length;
  const substantiated = data.filter((r) => r.outcome === "substantiated").length;
  const pending = data.filter((r) => r.outcome === "pending").length;

  /* ── export ──────────────────────────────────────────────────────────────── */

  const exportCols: ExportColumn<LADOReferral>[] = [
    { header: "Date Referred", accessor: (r: LADOReferral) => r.dateReferred },
    { header: "Date of Allegation", accessor: (r: LADOReferral) => r.dateAllegation },
    { header: "Subject Staff", accessor: (r: LADOReferral) => getStaffName(r.subjectStaffId) },
    { header: "Role", accessor: (r: LADOReferral) => r.subjectStaffRole },
    { header: "Allegation Type", accessor: (r: LADOReferral) => ALLG_LABEL[r.allegationType] },
    { header: "Children Involved", accessor: (r: LADOReferral) => r.childIds.map(getYPName).join(", ") },
    { header: "Status", accessor: (r: LADOReferral) => STATUS_LABEL[r.status] },
    { header: "Outcome", accessor: (r: LADOReferral) => OUTCOME_LABEL[r.outcome] },
    { header: "Staff Action", accessor: (r: LADOReferral) => STAFF_ACTION_LABEL[r.staffAction] },
    { header: "LADO", accessor: (r: LADOReferral) => r.ladoName },
    { header: "Ofsted Notified", accessor: (r: LADOReferral) => r.ofstedNotified ? "Yes" : "No" },
    { header: "Police", accessor: (r: LADOReferral) => r.policeInvolved ? `Yes (${r.policeRef})` : "No" },
    { header: "DBS Referral", accessor: (r: LADOReferral) => r.dBSReferral ? "Yes" : "No" },
    { header: "Referred By", accessor: (r: LADOReferral) => getStaffName(r.referredBy) },
  ];

  /* ── render ──────────────────────────────────────────────────────────────── */

  return (
    <PageShell
      title="LADO Referrals"
      subtitle="Working Together to Safeguard Children 2023 · Reg 33 · Allegations Management"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="LADO Referrals" />
          <ExportButton data={filtered} columns={exportCols} filename="lado-referrals" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Referral</Button>
        </div>
      }
    >
      <div id="print-area">
        {/* ── confidentiality banner ───────────────────────────────────────── */}
        <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-6 flex items-start gap-2">
          <Lock className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-red-800">HIGHLY RESTRICTED — Confidential Personnel Information</p>
            <p className="text-red-700">Access to LADO referral records is restricted to the Registered Manager, Responsible Individual, and authorised HR personnel. Do not discuss details with staff members not directly involved.</p>
          </div>
        </div>

        {/* ── stat strip ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Referrals", value: totalReferrals, icon: Shield, clr: "text-blue-600" },
            { label: "Active / Open", value: activeReferrals, icon: AlertTriangle, clr: "text-amber-600" },
            { label: "Substantiated", value: substantiated, icon: UserX, clr: "text-red-600" },
            { label: "Pending Outcome", value: pending, icon: Clock, clr: "text-indigo-600" },
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

        {/* ── active alert ─────────────────────────────────────────────────── */}
        {activeReferrals > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">{activeReferrals} active LADO referral(s)</p>
              <p className="text-amber-700">Ensure regular review meetings are scheduled and all actions are progressed in a timely manner.</p>
            </div>
          </div>
        )}

        {/* ── filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search staff, child, allegation…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{(Object.keys(STATUS_LABEL) as ReferralStatus[]).map((k) => (<SelectItem key={k} value={k}>{STATUS_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterOutcome} onValueChange={setFilterOutcome}><SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Outcomes</SelectItem>{(Object.keys(OUTCOME_LABEL) as Outcome[]).map((k) => (<SelectItem key={k} value={k}>{OUTCOME_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date-desc">Newest First</SelectItem><SelectItem value="date-asc">Oldest First</SelectItem></SelectContent></Select>
        </div>

        {/* ── records ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_OUTCOME[r.outcome])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getStaffName(r.subjectStaffId)} — {r.subjectStaffRole}
                        <Badge variant="outline" className={ALLG_CLR[r.allegationType]}>{ALLG_LABEL[r.allegationType]}</Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Referred: {r.dateReferred} · Children: {r.childIds.map(getYPName).join(", ")} · Outcome: <span className="font-medium">{OUTCOME_LABEL[r.outcome]}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={STAFF_ACTION_CLR[r.staffAction]}>{STAFF_ACTION_LABEL[r.staffAction]}</Badge>
                      {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* allegation & evidence */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium mb-1">Allegation Summary</p>
                        <p className="text-muted-foreground">{r.allegationSummary}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Evidence Summary</p>
                        <p className="text-muted-foreground">{r.evidenceSummary}</p>
                      </div>
                    </div>

                    {/* LADO details */}
                    <div className="bg-indigo-50 rounded-lg p-3">
                      <p className="font-medium text-indigo-800 mb-1">LADO Details</p>
                      <p className="text-indigo-700 text-xs">{r.ladoName} — {r.ladoContact}</p>
                      {r.strategyMeetingDate && (
                        <div className="mt-2">
                          <p className="text-indigo-700 text-xs font-medium">Strategy Meeting: {r.strategyMeetingDate}</p>
                          <p className="text-indigo-600 text-xs">Attendees: {r.strategyMeetingAttendees.join(", ")}</p>
                        </div>
                      )}
                    </div>

                    {/* investigation findings */}
                    {r.investigationFindings && (
                      <div>
                        <p className="font-medium mb-1">Investigation Findings</p>
                        <p className="text-muted-foreground">{r.investigationFindings}</p>
                      </div>
                    )}

                    {/* notifications */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Ofsted Notified</p>
                        <p className="text-xs text-muted-foreground">{r.ofstedNotified ? `Yes — ${r.ofstedNotifiedDate}` : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Police Involved</p>
                        <p className="text-xs text-muted-foreground">{r.policeInvolved ? `Yes — ${r.policeRef}` : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">DBS Referral</p>
                        <p className="text-xs text-muted-foreground">{r.dBSReferral ? "Yes" : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Confidentiality</p>
                        <p className="text-xs text-muted-foreground capitalize">{r.confidentialityLevel.replace("_", " ")}</p>
                      </div>
                    </div>

                    {/* support */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="font-medium text-green-800 mb-1">Support for Staff Member</p>
                        <p className="text-green-700 text-xs">{r.supportForStaff}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="font-medium text-blue-800 mb-1">Support for Child</p>
                        <p className="text-blue-700 text-xs">{r.supportForChild}</p>
                      </div>
                    </div>

                    {/* lessons learned */}
                    {r.lessonLearned && (
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="font-medium text-amber-800 mb-1">Lessons Learned</p>
                        <p className="text-amber-700 text-xs">{r.lessonLearned}</p>
                      </div>
                    )}

                    {/* review timeline */}
                    {r.reviewDates.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Review Dates</p>
                        <div className="flex gap-2 flex-wrap">
                          {r.reviewDates.map((rd, i) => (
                            <Badge key={i} variant="outline" className="bg-muted/30">{rd}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* footer */}
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>Referred by: {getStaffName(r.referredBy)}</span>
                      <span>Allegation date: {r.dateAllegation}</span>
                      <span>{r.closedDate ? `Closed: ${r.closedDate} by ${getStaffName(r.closedBy!)}` : "⚠ Open"}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── regulatory note ────────────────────────────────────────────── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Working Together to Safeguard Children 2023 — all allegations against staff in positions of trust must be referred to the LADO within 1 working day. Children&apos;s Homes (England) Regulations 2015, Reg 33 — notification to Ofsted of any allegation against a member of staff. Keeping Children Safe in Education — managing allegations. DBS referrals must be made when a person is removed from regulated activity due to safeguarding concerns. Records retained indefinitely on personnel file.</p>
        </div>
      </div>

      {/* ── new referral dialog ────────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New LADO Referral</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Date of Allegation</Label><Input type="date" /></div>
            <div><Label>Date Referred</Label><Input type="date" /></div>
            <div><Label>Subject Staff Member</Label><Select><SelectTrigger><SelectValue placeholder="Select staff…" /></SelectTrigger><SelectContent><SelectItem value="staff_anna">Anna</SelectItem><SelectItem value="staff_edward">Edward</SelectItem><SelectItem value="staff_ryan">Ryan</SelectItem><SelectItem value="staff_chervelle">Chervelle</SelectItem><SelectItem value="staff_lackson">Lackson</SelectItem><SelectItem value="staff_mirela">Mirela</SelectItem></SelectContent></Select></div>
            <div><Label>Allegation Type</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(ALLG_LABEL) as AllegationType[]).map((k) => (<SelectItem key={k} value={k}>{ALLG_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Child Involved</Label><Select><SelectTrigger><SelectValue placeholder="Select child…" /></SelectTrigger><SelectContent><SelectItem value="yp_alex">Alex</SelectItem><SelectItem value="yp_jordan">Jordan</SelectItem><SelectItem value="yp_casey">Casey</SelectItem></SelectContent></Select></div>
            <div><Label>LADO Name</Label><Input placeholder="LADO officer name" /></div>
            <div className="col-span-2"><Label>Allegation Summary</Label><Textarea placeholder="Describe the allegation…" rows={4} /></div>
            <div className="col-span-2"><Label>Evidence Summary</Label><Textarea placeholder="Evidence gathered so far…" rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button onClick={() => setShowNew(false)}>Submit Referral</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
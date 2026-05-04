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
  Shield, Search, ArrowUpDown, Plus, AlertTriangle,
  CheckCircle2, Clock, Eye, Users, BookOpen,
  ChevronDown, ChevronUp, Activity, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── date helper ───────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ──────────────────────────────────────────────────────────── */
type ReferralType =
  | "prevent_referral"
  | "channel_referral"
  | "community_concern"
  | "online_concern"
  | "training_record";

type RiskLevel = "low" | "medium" | "high";

type Status =
  | "open"
  | "referred"
  | "channel_active"
  | "channel_closed"
  | "nfa"
  | "monitoring";

interface PreventRecord {
  id: string;
  date: string;
  staffId: string;
  youngPersonId: string | null;
  referralType: ReferralType;
  riskLevel: RiskLevel;
  status: Status;
  indicators: string[];
  description: string;
  actionsTaken: string;
  multiAgency: string[];
  channelOutcome: string;
  trainingCompleted: boolean;
  reviewDate: string;
}

/* ── label / colour maps ───────────────────────────────────────────── */
const REFERRAL_TYPE_LABELS: Record<ReferralType, string> = {
  prevent_referral: "Prevent Referral",
  channel_referral: "Channel Referral",
  community_concern: "Community Concern",
  online_concern: "Online Concern",
  training_record: "Training Record",
};

const REFERRAL_TYPE_COLOURS: Record<ReferralType, string> = {
  prevent_referral: "bg-red-100 text-red-800",
  channel_referral: "bg-orange-100 text-orange-800",
  community_concern: "bg-amber-100 text-amber-800",
  online_concern: "bg-purple-100 text-purple-800",
  training_record: "bg-blue-100 text-blue-800",
};

const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const RISK_COLOURS: Record<RiskLevel, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

const RISK_BORDER: Record<RiskLevel, string> = {
  low: "border-l-slate-300",
  medium: "border-l-amber-400",
  high: "border-l-red-500",
};

const STATUS_LABELS: Record<Status, string> = {
  open: "Open",
  referred: "Referred",
  channel_active: "Channel Active",
  channel_closed: "Channel Closed",
  nfa: "No Further Action",
  monitoring: "Monitoring",
};

const STATUS_COLOURS: Record<Status, string> = {
  open: "bg-blue-100 text-blue-800",
  referred: "bg-orange-100 text-orange-800",
  channel_active: "bg-violet-100 text-violet-800",
  channel_closed: "bg-green-100 text-green-800",
  nfa: "bg-slate-100 text-slate-700",
  monitoring: "bg-amber-100 text-amber-800",
};

/* ── seed data ──────────────────────────────────────────────────────── */
const SEED: PreventRecord[] = [
  {
    id: "prev_001",
    date: d(-60),
    staffId: "staff_darren",
    youngPersonId: null,
    referralType: "training_record",
    riskLevel: "low",
    status: "nfa",
    indicators: [],
    description:
      "Whole-team Prevent awareness training delivered by Derbyshire Constabulary Prevent Officer. All staff attended — covered recognising signs of radicalisation, reporting procedures, Channel programme overview, and online extremism awareness. Certificates issued.",
    actionsTaken:
      "Attendance logged for all staff. Certificates filed. Refresher scheduled for 12 months.",
    multiAgency: ["Derbyshire Constabulary Prevent Team"],
    channelOutcome: "",
    trainingCompleted: true,
    reviewDate: d(305),
  },
  {
    id: "prev_002",
    date: d(-35),
    staffId: "staff_edward",
    youngPersonId: "yp_alex",
    referralType: "community_concern",
    riskLevel: "low",
    status: "nfa",
    indicators: ["Viewing extreme content online", "Expressing interest in violent imagery"],
    description:
      "Night staff observed Alex watching what appeared to be violent extremist content on his phone during evening free time. On closer examination and discussion with Alex, it was established this was Call of Duty gameplay footage on YouTube. Alex was open about what he was watching and showed staff the channel. No radicalisation indicators identified.",
    actionsTaken:
      "Discussed with Alex calmly. Content reviewed by staff — confirmed gaming content, not extremist material. Recorded as low-level concern for audit trail. No referral required. Online safety conversation held as part of routine key-working.",
    multiAgency: [],
    channelOutcome: "",
    trainingCompleted: false,
    reviewDate: "",
  },
  {
    id: "prev_003",
    date: d(-14),
    staffId: "staff_ryan",
    youngPersonId: "yp_casey",
    referralType: "prevent_referral",
    riskLevel: "high",
    status: "monitoring",
    indicators: [
      "Contact with unknown adult online",
      "Extremist-adjacent social media accounts followed",
      "Secretive behaviour around phone use",
      "Change in language — using ideological terms",
    ],
    description:
      "Casey has been in contact with an unknown adult via social media who has extremist-adjacent content on their profile. Staff noticed Casey following several accounts linked to far-right groups and using language not previously heard. Casey became secretive about phone use and resistant to routine online safety check-ins. Concern raised with Registered Manager and referred to local Prevent team.",
    actionsTaken:
      "Immediate safeguarding discussion held with RM. Online safety review completed — phone checked with Casey's consent. Social worker notified. Prevent referral submitted to Derbyshire Constabulary. Multi-agency strategy discussion arranged. Increased key-working sessions scheduled. Casey engaged in open conversation — partially receptive.",
    multiAgency: [
      "Derbyshire Constabulary Prevent Team",
      "Local Authority Safeguarding",
      "Casey's Social Worker (Lisa Park)",
    ],
    channelOutcome: "Awaiting Channel panel decision. Initial assessment indicates suitability for Channel support.",
    trainingCompleted: false,
    reviewDate: d(14),
  },
  {
    id: "prev_004",
    date: d(-3),
    staffId: "staff_darren",
    youngPersonId: null,
    referralType: "training_record",
    riskLevel: "low",
    status: "open",
    indicators: [],
    description:
      "Prevent duty and Channel awareness training scheduled for new starter Mirela. To be delivered by in-house trainer with materials from Derbyshire Safeguarding Children Partnership. Covers statutory duties under Counter-Terrorism and Security Act 2015, recognising radicalisation, referral pathways, and online extremism.",
    actionsTaken:
      "Training date booked. Materials prepared. Mirela to complete Home Office online Prevent training module prior to classroom session.",
    multiAgency: [],
    channelOutcome: "",
    trainingCompleted: false,
    reviewDate: d(10),
  },
];

/* ── component ──────────────────────────────────────────────────────── */
export default function PreventDutyPage() {
  const [records] = useState<PreventRecord[]>(SEED);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  /* ── new-entry draft state ────────────────────────────────────────── */
  const [draft, setDraft] = useState({
    date: d(0),
    staffId: "staff_darren",
    youngPersonId: "",
    referralType: "community_concern" as ReferralType,
    riskLevel: "low" as RiskLevel,
    status: "open" as Status,
    indicators: "",
    description: "",
    actionsTaken: "",
    multiAgency: "",
    channelOutcome: "",
    trainingCompleted: false,
    reviewDate: "",
  });

  /* ── stats ────────────────────────────────────────────────────────── */
  const totalRecords = records.length;
  const referralCount = records.filter(
    (r) => r.referralType === "prevent_referral" || r.referralType === "channel_referral",
  ).length;
  const activeMonitoring = records.filter((r) => r.status === "monitoring" || r.status === "channel_active").length;
  const trainingRecords = records.filter((r) => r.referralType === "training_record");
  const trainingCompleted = trainingRecords.filter((r) => r.trainingCompleted).length;
  const trainingCompliance =
    trainingRecords.length > 0
      ? Math.round((trainingCompleted / trainingRecords.length) * 100)
      : 0;

  /* ── filter & sort ────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.description.toLowerCase().includes(q) ||
          (r.youngPersonId && getYPName(r.youngPersonId).toLowerCase().includes(q)) ||
          getStaffName(r.staffId).toLowerCase().includes(q) ||
          r.indicators.some((i) => i.toLowerCase().includes(q)),
      );
    }
    if (riskFilter !== "all") list = list.filter((r) => r.riskLevel === riskFilter);
    if (typeFilter !== "all") list = list.filter((r) => r.referralType === typeFilter);
    list.sort((a, b) =>
      sortDir === "desc"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date),
    );
    return list;
  }, [records, search, riskFilter, typeFilter, sortDir]);

  /* ── export columns ───────────────────────────────────────────────── */
  const exportCols: ExportColumn<PreventRecord>[] = [
    { header: "Date", accessor: (r: PreventRecord) => r.date },
    { header: "Reporter", accessor: (r: PreventRecord) => getStaffName(r.staffId) },
    { header: "Young Person", accessor: (r: PreventRecord) => r.youngPersonId ? getYPName(r.youngPersonId) : "N/A — whole team" },
    { header: "Type", accessor: (r: PreventRecord) => REFERRAL_TYPE_LABELS[r.referralType] },
    { header: "Risk Level", accessor: (r: PreventRecord) => RISK_LABELS[r.riskLevel] },
    { header: "Status", accessor: (r: PreventRecord) => STATUS_LABELS[r.status] },
    { header: "Indicators", accessor: (r: PreventRecord) => r.indicators.join("; ") },
    { header: "Description", accessor: (r: PreventRecord) => r.description },
    { header: "Actions Taken", accessor: (r: PreventRecord) => r.actionsTaken },
    { header: "Multi-Agency", accessor: (r: PreventRecord) => r.multiAgency.join("; ") },
    { header: "Channel Outcome", accessor: (r: PreventRecord) => r.channelOutcome || "N/A" },
    { header: "Training Completed", accessor: (r: PreventRecord) => r.trainingCompleted ? "Yes" : "No" },
    { header: "Review Date", accessor: (r: PreventRecord) => r.reviewDate || "N/A" },
  ];

  /* ── handlers ─────────────────────────────────────────────────────── */
  const handleSubmit = () => {
    // In production this would persist; currently display-only.
    setDialogOpen(false);
  };

  const staffIds = [
    "staff_darren", "staff_ryan", "staff_anna", "staff_edward",
    "staff_chervelle", "staff_lackson", "staff_mirela",
  ];
  const ypIds = ["yp_alex", "yp_jordan", "yp_casey"];

  return (
    <PageShell
      title="Prevent Duty"
      subtitle="Counter-Terrorism and Security Act 2015 — radicalisation awareness, referrals and Channel programme"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Prevent Duty" />
          <ExportButton data={filtered} columns={exportCols} filename="prevent-duty" />
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Entry
          </Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stat strip ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Records", value: totalRecords, icon: FileText, colour: "text-blue-600" },
            { label: "Referrals", value: referralCount, icon: Shield, colour: referralCount > 0 ? "text-red-600" : "text-slate-400" },
            { label: "Active Monitoring", value: activeMonitoring, icon: Eye, colour: activeMonitoring > 0 ? "text-orange-600" : "text-green-600" },
            { label: "Training Compliance", value: `${trainingCompliance}%`, icon: BookOpen, colour: trainingCompliance === 100 ? "text-green-600" : "text-amber-600" },
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

        {/* ── filters ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Risk level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risks</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {(Object.keys(REFERRAL_TYPE_LABELS) as ReferralType[]).map((t) => (
                <SelectItem key={t} value={t}>{REFERRAL_TYPE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDir((p) => (p === "desc" ? "asc" : "desc"))}
          >
            <ArrowUpDown className="h-4 w-4 mr-1" />
            {sortDir === "desc" ? "Newest First" : "Oldest First"}
          </Button>
        </div>

        {/* ── card list ──────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
              No records match the current filters.
            </div>
          )}
          {filtered.map((rec) => {
            const isExpanded = expanded === rec.id;
            return (
              <div
                key={rec.id}
                className={cn(
                  "rounded-xl border bg-white border-l-4 overflow-hidden",
                  RISK_BORDER[rec.riskLevel],
                )}
              >
                {/* collapsed header */}
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : rec.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Shield className="h-5 w-5 text-slate-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {REFERRAL_TYPE_LABELS[rec.referralType]}
                        </span>
                        <Badge className={cn("text-[10px]", RISK_COLOURS[rec.riskLevel])}>
                          {RISK_LABELS[rec.riskLevel]}
                        </Badge>
                        <Badge className={cn("text-[10px]", STATUS_COLOURS[rec.status])}>
                          {STATUS_LABELS[rec.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rec.date} · {getStaffName(rec.staffId)}
                        {rec.youngPersonId
                          ? ` · ${getYPName(rec.youngPersonId)}`
                          : " · Whole team"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {rec.reviewDate && rec.reviewDate <= d(0) && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                        Review Due
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {/* expanded detail */}
                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* description */}
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Description
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {rec.description}
                      </p>
                    </div>

                    {/* indicators */}
                    {rec.indicators.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Indicators
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.indicators.map((ind, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[11px] font-medium text-red-700"
                            >
                              <AlertTriangle className="h-2.5 w-2.5" />
                              {ind}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* actions taken */}
                    {rec.actionsTaken && (
                      <div className="rounded-xl bg-white border p-3">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Actions Taken
                        </p>
                        <p className="text-xs text-slate-700">{rec.actionsTaken}</p>
                      </div>
                    )}

                    {/* multi-agency involvement */}
                    {rec.multiAgency.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Multi-Agency Involvement
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.multiAgency.map((agency, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-medium text-blue-700"
                            >
                              <Users className="h-2.5 w-2.5" />
                              {agency}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* channel outcome */}
                    {rec.channelOutcome && (
                      <div className="rounded-xl bg-violet-50 border border-violet-200 p-3">
                        <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider mb-1">
                          Channel Outcome
                        </p>
                        <p className="text-xs text-violet-800">{rec.channelOutcome}</p>
                      </div>
                    )}

                    {/* training & review */}
                    <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                      {rec.referralType === "training_record" && (
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                          rec.trainingCompleted
                            ? "bg-green-50 text-green-700"
                            : "bg-amber-50 text-amber-700",
                        )}>
                          {rec.trainingCompleted ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {rec.trainingCompleted ? "Training Completed" : "Training Scheduled"}
                        </span>
                      )}
                      {rec.reviewDate && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Review: {rec.reviewDate}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── regulatory note ────────────────────────────────────── */}
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-500" />
              Regulatory Framework
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>
              Under the <strong>Counter-Terrorism and Security Act 2015</strong>, children&apos;s
              homes have a statutory duty to have due regard to the need to prevent people from
              being drawn into terrorism (the <strong>Prevent duty</strong>).
            </p>
            <p>
              Staff must be trained to recognise signs of radicalisation and know how to make
              referrals through the <strong>Channel programme</strong> — a multi-agency process
              providing support to individuals identified as vulnerable to being drawn into
              terrorism.
            </p>
            <p>
              All concerns, referrals, and training records should be documented here to
              demonstrate compliance with statutory guidance and Ofsted inspection requirements.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── new-entry dialog ────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Prevent Duty Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* date */}
            <div className="space-y-1">
              <Label htmlFor="pd-date">Date</Label>
              <Input
                id="pd-date"
                type="date"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </div>

            {/* reporter */}
            <div className="space-y-1">
              <Label htmlFor="pd-staff">Reporter</Label>
              <Select
                value={draft.staffId}
                onValueChange={(v) => setDraft({ ...draft, staffId: v })}
              >
                <SelectTrigger id="pd-staff">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {staffIds.map((s) => (
                    <SelectItem key={s} value={s}>{getStaffName(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* young person */}
            <div className="space-y-1">
              <Label htmlFor="pd-yp">Young Person (leave blank for whole-team records)</Label>
              <Select
                value={draft.youngPersonId}
                onValueChange={(v) => setDraft({ ...draft, youngPersonId: v })}
              >
                <SelectTrigger id="pd-yp">
                  <SelectValue placeholder="N/A — whole team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">N/A — whole team</SelectItem>
                  {ypIds.map((y) => (
                    <SelectItem key={y} value={y}>{getYPName(y)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* referral type */}
            <div className="space-y-1">
              <Label htmlFor="pd-type">Type</Label>
              <Select
                value={draft.referralType}
                onValueChange={(v) => setDraft({ ...draft, referralType: v as ReferralType })}
              >
                <SelectTrigger id="pd-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(REFERRAL_TYPE_LABELS) as ReferralType[]).map((t) => (
                    <SelectItem key={t} value={t}>{REFERRAL_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* risk level */}
            <div className="space-y-1">
              <Label htmlFor="pd-risk">Risk Level</Label>
              <Select
                value={draft.riskLevel}
                onValueChange={(v) => setDraft({ ...draft, riskLevel: v as RiskLevel })}
              >
                <SelectTrigger id="pd-risk">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* status */}
            <div className="space-y-1">
              <Label htmlFor="pd-status">Status</Label>
              <Select
                value={draft.status}
                onValueChange={(v) => setDraft({ ...draft, status: v as Status })}
              >
                <SelectTrigger id="pd-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as Status[]).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* indicators */}
            <div className="space-y-1">
              <Label htmlFor="pd-indicators">Indicators (comma-separated)</Label>
              <Input
                id="pd-indicators"
                placeholder="e.g. Secretive behaviour, Change in language"
                value={draft.indicators}
                onChange={(e) => setDraft({ ...draft, indicators: e.target.value })}
              />
            </div>

            {/* description */}
            <div className="space-y-1">
              <Label htmlFor="pd-desc">Description</Label>
              <Textarea
                id="pd-desc"
                rows={4}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>

            {/* actions taken */}
            <div className="space-y-1">
              <Label htmlFor="pd-actions">Actions Taken</Label>
              <Textarea
                id="pd-actions"
                rows={3}
                value={draft.actionsTaken}
                onChange={(e) => setDraft({ ...draft, actionsTaken: e.target.value })}
              />
            </div>

            {/* multi-agency */}
            <div className="space-y-1">
              <Label htmlFor="pd-ma">Multi-Agency Involvement (comma-separated)</Label>
              <Input
                id="pd-ma"
                placeholder="e.g. Prevent Team, Social Worker"
                value={draft.multiAgency}
                onChange={(e) => setDraft({ ...draft, multiAgency: e.target.value })}
              />
            </div>

            {/* channel outcome */}
            <div className="space-y-1">
              <Label htmlFor="pd-channel">Channel Outcome</Label>
              <Input
                id="pd-channel"
                value={draft.channelOutcome}
                onChange={(e) => setDraft({ ...draft, channelOutcome: e.target.value })}
              />
            </div>

            {/* review date */}
            <div className="space-y-1">
              <Label htmlFor="pd-review">Review Date</Label>
              <Input
                id="pd-review"
                type="date"
                value={draft.reviewDate}
                onChange={(e) => setDraft({ ...draft, reviewDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Save Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

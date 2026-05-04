"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RISK REGISTER
// Tracks live risks to young people, staff, and the home environment.
// Each risk has owner, category, likelihood/impact scoring, mitigations,
// review dates, and status. Supports Ofsted ILACS evidence that the home
// proactively identifies, manages, and reviews risk.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn, formatDate, todayStr } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  Plus, X, AlertTriangle, AlertOctagon, Shield, ShieldCheck,
  CheckCircle2, Clock, User, Calendar, Target, Activity,
  Loader2, TrendingUp, TrendingDown, Eye, Zap,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type RiskCategory = "safeguarding" | "behaviour" | "health" | "placement_stability" | "staffing" | "environmental" | "regulatory" | "emotional_wellbeing" | "exploitation" | "missing";
type RiskStatus = "active" | "mitigated" | "monitoring" | "closed" | "escalated";
type RiskLevel = "critical" | "high" | "medium" | "low";

interface RiskEntry {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  child_id: string | null;
  likelihood: number;      // 1-5
  impact: number;          // 1-5
  risk_score: number;      // likelihood * impact
  risk_level: RiskLevel;
  status: RiskStatus;
  owner_id: string;
  mitigations: string[];
  review_date: string;
  last_reviewed: string | null;
  created_at: string;
  updated_at: string;
  escalated_to: string | null;
  notes: string | null;
}

// ── Seed Data ─────────────────────────────────────────────────────────────────

function computeLevel(score: number): RiskLevel {
  if (score >= 20) return "critical";
  if (score >= 12) return "high";
  if (score >= 6) return "medium";
  return "low";
}

const SEED_RISKS: RiskEntry[] = [
  {
    id: "risk_001",
    title: "Evening dysregulation pattern — Alex",
    description: "Consistent pattern of dysregulation between 17:00-19:00, potentially linked to school-to-home transition or contact anxiety. Risk of escalation to physical intervention if not proactively managed.",
    category: "behaviour",
    child_id: "yp_alex",
    likelihood: 4,
    impact: 4,
    risk_score: 16,
    risk_level: "high",
    status: "active",
    owner_id: "staff_darren",
    mitigations: [
      "Proactive 5pm transition support intervention in place (named staff)",
      "ARIA pattern monitoring active — alerts if frequency increases",
      "De-escalation toolbox available and known to all staff",
      "Weekly review of dysregulation episodes with key worker",
    ],
    review_date: "2026-05-10",
    last_reviewed: "2026-04-25",
    created_at: "2026-04-08T09:00:00Z",
    updated_at: "2026-04-25T10:00:00Z",
    escalated_to: null,
    notes: "Linked to ARIA pattern alert pat_001. Intervention int_001 in place.",
  },
  {
    id: "risk_002",
    title: "Post-contact emotional distress — Casey",
    description: "Casey shows significant emotional distress following each contact session with her mother. Includes tearfulness, withdrawal, and reduced sleep. Risk of placement disruption if not managed.",
    category: "emotional_wellbeing",
    child_id: "yp_casey",
    likelihood: 4,
    impact: 3,
    risk_score: 12,
    risk_level: "high",
    status: "mitigated",
    owner_id: "staff_darren",
    mitigations: [
      "Pre-contact preparation session with key worker before each visit",
      "Post-contact de-brief and sensory regulation activity planned",
      "Social worker notified — contact review requested",
      "Sleep monitoring for 48 hours post-contact",
    ],
    review_date: "2026-05-15",
    last_reviewed: "2026-04-20",
    created_at: "2026-04-10T08:00:00Z",
    updated_at: "2026-04-20T14:00:00Z",
    escalated_to: null,
    notes: "Contact preparation plan shared with SW. Waiting on IRO decision re: contact frequency.",
  },
  {
    id: "risk_003",
    title: "Agency staffing during peak hours",
    description: "High reliance on agency staff for evening shifts (6 shifts in 14 days). Unfamiliar staff during vulnerable evening hours increases risk for all young people, particularly those with attachment difficulties.",
    category: "staffing",
    child_id: null,
    likelihood: 3,
    impact: 4,
    risk_score: 12,
    risk_level: "high",
    status: "active",
    owner_id: "staff_darren",
    mitigations: [
      "Same agency staff requested where possible for continuity",
      "Agency staff briefed on individual risk assessments and routines",
      "Rota review underway to cover gaps with permanent staff",
      "Recruitment to senior RSW vacancy progressing",
    ],
    review_date: "2026-05-08",
    last_reviewed: "2026-04-22",
    created_at: "2026-04-15T07:00:00Z",
    updated_at: "2026-04-22T09:00:00Z",
    escalated_to: "staff_alicia",
    notes: "Escalated to RI for provider-level recruitment support.",
  },
  {
    id: "risk_004",
    title: "Missing from care history — Alex",
    description: "Alex has a history of going missing from previous placements. While no missing episodes at Oak House yet, the risk remains elevated given his dysregulation pattern and previous behaviour.",
    category: "missing",
    child_id: "yp_alex",
    likelihood: 3,
    impact: 5,
    risk_score: 15,
    risk_level: "high",
    status: "monitoring",
    owner_id: "staff_ryan",
    mitigations: [
      "Missing from care protocol shared with all staff and reviewed",
      "Alex's missing risk assessment updated monthly",
      "Known locations and associates documented",
      "Police aware and flagged on PNC",
      "Grab pack maintained and up to date",
    ],
    review_date: "2026-05-05",
    last_reviewed: "2026-04-18",
    created_at: "2026-03-15T10:00:00Z",
    updated_at: "2026-04-18T11:00:00Z",
    escalated_to: null,
    notes: "No missing episodes since placement. Continue monitoring.",
  },
  {
    id: "risk_005",
    title: "Medication storage — fridge temperature logging",
    description: "Insulin for Alex requires refrigerated storage. Temperature logging has been inconsistent — 2 missed entries in past 14 days.",
    category: "health",
    child_id: "yp_alex",
    likelihood: 2,
    impact: 4,
    risk_score: 8,
    risk_level: "medium",
    status: "mitigated",
    owner_id: "staff_anna",
    mitigations: [
      "Daily temperature check added to shift handover checklist",
      "Digital thermometer with alarm installed in medication fridge",
      "Audit of missed entries — both within safe range",
      "Staff re-trained on medication storage procedures",
    ],
    review_date: "2026-05-20",
    last_reviewed: "2026-04-28",
    created_at: "2026-04-05T14:00:00Z",
    updated_at: "2026-04-28T10:00:00Z",
    escalated_to: null,
    notes: "Two missed entries were administrative — temperatures within range. Alarm system now mitigates.",
  },
  {
    id: "risk_006",
    title: "Fire safety — annual check overdue",
    description: "Annual fire safety inspection is 2 weeks overdue. The quarterly check was completed but the annual inspection by an external provider needs scheduling.",
    category: "environmental",
    child_id: null,
    likelihood: 2,
    impact: 5,
    risk_score: 10,
    risk_level: "medium",
    status: "active",
    owner_id: "staff_darren",
    mitigations: [
      "Quarterly fire safety check completed on time",
      "All fire equipment serviceable and checked monthly",
      "Fire drills up to date — last drill 3 weeks ago",
      "External inspection being scheduled for first week of May",
    ],
    review_date: "2026-05-10",
    last_reviewed: null,
    created_at: "2026-04-20T08:00:00Z",
    updated_at: "2026-04-20T08:00:00Z",
    escalated_to: null,
    notes: "Low concern — routine inspection, not a safety failure.",
  },
  {
    id: "risk_007",
    title: "Jordan — LAC review anxiety",
    description: "Jordan has expressed anxiety about her upcoming LAC review. While settled overall, she has historically disengaged from education around review periods.",
    category: "emotional_wellbeing",
    child_id: "yp_jordan",
    likelihood: 2,
    impact: 2,
    risk_score: 4,
    risk_level: "low",
    status: "monitoring",
    owner_id: "staff_lackson",
    mitigations: [
      "Key worker preparation conversations started — review goals discussed with Jordan",
      "Jordan has written her views for the review with support",
      "School informed to monitor attendance around review date",
      "Post-review check-in planned for same day",
    ],
    review_date: "2026-05-12",
    last_reviewed: "2026-04-25",
    created_at: "2026-04-20T12:00:00Z",
    updated_at: "2026-04-25T14:00:00Z",
    escalated_to: null,
    notes: "Positive — Jordan engaged with preparation. Low current risk.",
  },
  {
    id: "risk_008",
    title: "DBS renewal — Diane",
    description: "Diane's enhanced DBS is due for renewal in June 2026. While not yet expired, the renewal should be initiated to avoid a gap in compliance.",
    category: "regulatory",
    child_id: null,
    likelihood: 1,
    impact: 3,
    risk_score: 3,
    risk_level: "low",
    status: "closed",
    owner_id: "staff_darren",
    mitigations: [
      "DBS renewal application submitted on 28 April",
      "Update service check confirms clean record",
      "Renewal tracked in safer recruitment module",
    ],
    review_date: "2026-06-15",
    last_reviewed: "2026-04-28",
    created_at: "2026-04-10T09:00:00Z",
    updated_at: "2026-04-28T16:00:00Z",
    escalated_to: null,
    notes: "Application submitted. Closed — will reopen if renewal not received by June.",
  },
];

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<RiskCategory, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  safeguarding:        { label: "Safeguarding",        icon: Shield,        color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200"     },
  behaviour:           { label: "Behaviour",           icon: Zap,           color: "text-orange-700",  bg: "bg-orange-50",  border: "border-orange-200"  },
  health:              { label: "Health",               icon: Activity,      color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  placement_stability: { label: "Placement Stability", icon: Target,        color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200"    },
  staffing:            { label: "Staffing",             icon: User,          color: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200"  },
  environmental:       { label: "Environmental",       icon: ShieldCheck,   color: "text-teal-700",    bg: "bg-teal-50",    border: "border-teal-200"    },
  regulatory:          { label: "Regulatory",           icon: CheckCircle2,  color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200"  },
  emotional_wellbeing: { label: "Emotional Wellbeing", icon: TrendingDown,  color: "text-pink-700",    bg: "bg-pink-50",    border: "border-pink-200"    },
  exploitation:        { label: "Exploitation",         icon: AlertOctagon,  color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200"    },
  missing:             { label: "Missing",              icon: AlertTriangle, color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   },
};

const STATUS_CONFIG: Record<RiskStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  active:    { label: "Active",     icon: Zap,          color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200"     },
  escalated: { label: "Escalated",  icon: AlertOctagon, color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200"    },
  monitoring:{ label: "Monitoring", icon: Eye,          color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200"   },
  mitigated: { label: "Mitigated",  icon: Shield,       color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200"    },
  closed:    { label: "Closed",     icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
};

const LEVEL_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: "Critical", color: "text-red-700",    bg: "bg-red-100",    border: "border-red-300"    },
  high:     { label: "High",     color: "text-orange-700", bg: "bg-orange-50",  border: "border-orange-300" },
  medium:   { label: "Medium",   color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200"  },
  low:      { label: "Low",      color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200"   },
};

// ── Export Columns ────────────────────────────────────────────────────────────

const RISK_EXPORT_COLS: ExportColumn<RiskEntry>[] = [
  { header: "Title",         accessor: (r) => r.title },
  { header: "Category",      accessor: (r) => CATEGORY_CONFIG[r.category]?.label ?? r.category },
  { header: "Young Person",  accessor: (r) => r.child_id ? getYPName(r.child_id) : "Home-wide" },
  { header: "Likelihood",    accessor: (r) => r.likelihood },
  { header: "Impact",        accessor: (r) => r.impact },
  { header: "Risk Score",    accessor: (r) => r.risk_score },
  { header: "Risk Level",    accessor: (r) => LEVEL_CONFIG[r.risk_level]?.label ?? r.risk_level },
  { header: "Status",        accessor: (r) => STATUS_CONFIG[r.status]?.label ?? r.status },
  { header: "Owner",         accessor: (r) => getStaffName(r.owner_id) },
  { header: "Mitigations",   accessor: (r) => r.mitigations.join("; ") },
  { header: "Review Date",   accessor: (r) => r.review_date },
  { header: "Last Reviewed", accessor: (r) => r.last_reviewed ?? "" },
  { header: "Escalated To",  accessor: (r) => r.escalated_to ? getStaffName(r.escalated_to) : "" },
  { header: "Notes",         accessor: (r) => r.notes ?? "" },
  { header: "Created",       accessor: (r) => r.created_at.slice(0, 10) },
];

// ── Risk Score Matrix ────────────────────────────────────────────────────────

function RiskScoreBadge({ score, level }: { score: number; level: RiskLevel }) {
  const lc = LEVEL_CONFIG[level];
  return (
    <div className={cn("flex items-center gap-1 rounded-md px-2 py-0.5 border text-xs font-bold", lc.bg, lc.color, lc.border)}>
      {score}
      <span className="font-normal text-[10px] opacity-70">({lc.label})</span>
    </div>
  );
}

// ── Risk Card ────────────────────────────────────────────────────────────────

function RiskCard({
  risk,
  onStatusChange,
  busy,
}: {
  risk: RiskEntry;
  onStatusChange: (newStatus: RiskStatus) => void;
  busy: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_CONFIG[risk.category];
  const st = STATUS_CONFIG[risk.status];
  const CatIcon = cat.icon;
  const StIcon = st.icon;

  const isOverdue = risk.review_date < todayStr() && risk.status !== "closed";

  return (
    <div className={cn(
      "rounded-lg border bg-white transition-all",
      risk.risk_level === "critical" && risk.status !== "closed" && "ring-2 ring-red-400 border-red-300",
      isOverdue && "border-amber-300",
    )}>
      {/* Header */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={cn("mt-0.5 rounded-md p-1.5 border", cat.bg, cat.border)}>
          <CatIcon className={cn("h-4 w-4", cat.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-semibold text-slate-900">{risk.title}</h3>
            {isOverdue && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0">
                Review overdue
              </Badge>
            )}
            {risk.escalated_to && (
              <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] px-1.5 py-0">
                Escalated
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <CatIcon className="h-3 w-3" />
              {cat.label}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {risk.child_id ? getYPName(risk.child_id) : "Home-wide"}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Review: {formatDate(risk.review_date)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <RiskScoreBadge score={risk.risk_score} level={risk.risk_level} />
          <Badge className={cn("text-[10px] px-2 py-0.5 border", st.bg, st.color, st.border)}>
            <StIcon className="h-3 w-3 mr-1" />
            {st.label}
          </Badge>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-4">
          {/* Description */}
          <div>
            <h4 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">Risk Description</h4>
            <p className="text-xs text-slate-700 leading-relaxed">{risk.description}</p>
          </div>

          {/* Likelihood x Impact */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-center">
              <div className="text-lg font-bold text-slate-700">{risk.likelihood}</div>
              <div className="text-[10px] text-slate-500">Likelihood (1-5)</div>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-center">
              <div className="text-lg font-bold text-slate-700">{risk.impact}</div>
              <div className="text-[10px] text-slate-500">Impact (1-5)</div>
            </div>
            <div className={cn("rounded-lg border p-2.5 text-center", LEVEL_CONFIG[risk.risk_level].bg, LEVEL_CONFIG[risk.risk_level].border)}>
              <div className={cn("text-lg font-bold", LEVEL_CONFIG[risk.risk_level].color)}>{risk.risk_score}</div>
              <div className="text-[10px] text-slate-500">Risk Score</div>
            </div>
          </div>

          {/* Mitigations */}
          {risk.mitigations.length > 0 && (
            <div>
              <h4 className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide mb-2">
                Mitigations ({risk.mitigations.length})
              </h4>
              <ul className="space-y-1.5">
                {risk.mitigations.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Owner + Notes */}
          <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1 border-t border-slate-100">
            <span>Owner: {getStaffName(risk.owner_id)}</span>
            {risk.last_reviewed && <span>Last reviewed: {formatDate(risk.last_reviewed)}</span>}
            {risk.escalated_to && <span>Escalated to: {getStaffName(risk.escalated_to)}</span>}
          </div>

          {risk.notes && (
            <p className="text-[11px] text-slate-500 italic">{risk.notes}</p>
          )}

          {/* Status actions */}
          {risk.status !== "closed" && (
            <div className="flex items-center gap-2 pt-1">
              {risk.status === "active" && (
                <>
                  <Button size="sm" variant="outline" className="text-xs h-7 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" onClick={(e) => { e.stopPropagation(); onStatusChange("monitoring"); }} disabled={busy}>
                    <Eye className="h-3 w-3 mr-1" /> Monitor
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" onClick={(e) => { e.stopPropagation(); onStatusChange("mitigated"); }} disabled={busy}>
                    <Shield className="h-3 w-3 mr-1" /> Mitigated
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7 bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100" onClick={(e) => { e.stopPropagation(); onStatusChange("escalated"); }} disabled={busy}>
                    <TrendingUp className="h-3 w-3 mr-1" /> Escalate
                  </Button>
                </>
              )}
              {(risk.status === "monitoring" || risk.status === "mitigated" || risk.status === "escalated") && (
                <Button size="sm" variant="outline" className="text-xs h-7 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" onClick={(e) => { e.stopPropagation(); onStatusChange("closed"); }} disabled={busy}>
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Close Risk
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── New Risk Dialog ──────────────────────────────────────────────────────────

function NewRiskDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (risk: RiskEntry) => void;
}) {
  const { currentUser } = useAuthContext();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RiskCategory>("safeguarding");
  const [childId, setChildId] = useState("none");
  const [likelihood, setLikelihood] = useState("3");
  const [impact, setImpact] = useState("3");
  const [mitigations, setMitigations] = useState("");
  const [reviewDate, setReviewDate] = useState("");

  function handleSubmit() {
    if (!title.trim() || !description.trim()) return;
    const l = parseInt(likelihood);
    const imp = parseInt(impact);
    const score = l * imp;
    const now = new Date().toISOString();
    const risk: RiskEntry = {
      id: `risk_local_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      child_id: childId === "none" ? null : childId,
      likelihood: l,
      impact: imp,
      risk_score: score,
      risk_level: computeLevel(score),
      status: "active",
      owner_id: currentUser?.id ?? "staff_darren",
      mitigations: mitigations.split("\n").filter(Boolean),
      review_date: reviewDate || todayStr(),
      last_reviewed: null,
      created_at: now,
      updated_at: now,
      escalated_to: null,
      notes: null,
    };
    onSubmit(risk);
    onClose();
    setTitle("");
    setDescription("");
    setCategory("safeguarding");
    setChildId("none");
    setLikelihood("3");
    setImpact("3");
    setMitigations("");
    setReviewDate("");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-red-600" />
            New Risk Entry
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1 block">Risk Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief title for this risk" className="h-8 text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Category</label>
              <Select value={category} onValueChange={(v) => setCategory(v as RiskCategory)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_CONFIG) as RiskCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_CONFIG[c].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Young Person</label>
              <Select value={childId} onValueChange={setChildId}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Home-wide</SelectItem>
                  <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
                  <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
                  <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1 block">Description *</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the risk, context, and potential impact…" className="text-xs min-h-[80px]" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Likelihood (1-5)</label>
              <Select value={likelihood} onValueChange={setLikelihood}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map((n) => <SelectItem key={n} value={String(n)}>{n} — {["Rare","Unlikely","Possible","Likely","Almost certain"][n-1]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Impact (1-5)</label>
              <Select value={impact} onValueChange={setImpact}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map((n) => <SelectItem key={n} value={String(n)}>{n} — {["Negligible","Minor","Moderate","Major","Catastrophic"][n-1]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Review Date</label>
              <Input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>

          {/* Live score preview */}
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Computed risk score:</span>
            <RiskScoreBadge
              score={parseInt(likelihood) * parseInt(impact)}
              level={computeLevel(parseInt(likelihood) * parseInt(impact))}
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-600 mb-1 block">Mitigations (one per line)</label>
            <Textarea value={mitigations} onChange={(e) => setMitigations(e.target.value)} placeholder="Enter each mitigation on a new line…" className="text-xs min-h-[60px]" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="text-xs" onClick={handleSubmit} disabled={!title.trim() || !description.trim()}>
            Add Risk
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function RiskRegisterPage() {
  const [risks, setRisks] = useState<RiskEntry[]>(SEED_RISKS);
  const [showNew, setShowNew] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Filters
  const [tab, setTab] = useState<RiskStatus | "all" | "overdue">("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<RiskCategory | "all">("all");
  const [levelFilter, setLevelFilter] = useState<RiskLevel | "all">("all");
  const [sortBy, setSortBy] = useState("score");

  const today = todayStr();

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = [...risks];

    if (tab === "overdue") {
      list = list.filter((r) => r.review_date < today && r.status !== "closed");
    } else if (tab !== "all") {
      list = list.filter((r) => r.status === tab);
    }

    if (categoryFilter !== "all") {
      list = list.filter((r) => r.category === categoryFilter);
    }

    if (levelFilter !== "all") {
      list = list.filter((r) => r.risk_level === levelFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (r.child_id && getYPName(r.child_id).toLowerCase().includes(q)) ||
          getStaffName(r.owner_id).toLowerCase().includes(q)
      );
    }

    const LEVEL_ORDER: Record<RiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    switch (sortBy) {
      case "score":
        list.sort((a, b) => b.risk_score - a.risk_score);
        break;
      case "review":
        list.sort((a, b) => a.review_date.localeCompare(b.review_date));
        break;
      case "level":
        list.sort((a, b) => LEVEL_ORDER[a.risk_level] - LEVEL_ORDER[b.risk_level]);
        break;
      case "category":
        list.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case "child":
        list.sort((a, b) => {
          const na = a.child_id ? getYPName(a.child_id) : "ZZZ";
          const nb = b.child_id ? getYPName(b.child_id) : "ZZZ";
          return na.localeCompare(nb);
        });
        break;
    }

    return list;
  }, [risks, tab, categoryFilter, levelFilter, search, sortBy, today]);

  // Stats
  const stats = useMemo(() => {
    const active = risks.filter((r) => r.status === "active").length;
    const critical = risks.filter((r) => r.risk_level === "critical" && r.status !== "closed").length;
    const high = risks.filter((r) => r.risk_level === "high" && r.status !== "closed").length;
    const overdue = risks.filter((r) => r.review_date < today && r.status !== "closed").length;
    const mitigated = risks.filter((r) => r.status === "mitigated").length;
    const closed = risks.filter((r) => r.status === "closed").length;
    return { total: risks.length, active, critical, high, overdue, mitigated, closed };
  }, [risks, today]);

  const hasFilters = search || categoryFilter !== "all" || levelFilter !== "all";

  const handleStatusChange = (id: string, newStatus: RiskStatus) => {
    setBusyId(id);
    setTimeout(() => {
      setRisks((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: newStatus, updated_at: new Date().toISOString() } : r)
      );
      setBusyId(null);
    }, 300);
  };

  const handleCreate = (risk: RiskEntry) => {
    setRisks((prev) => [risk, ...prev]);
  };

  // Tabs
  const TABS: { key: typeof tab; label: string; count: number }[] = [
    { key: "all",       label: "All",        count: stats.total     },
    { key: "active",    label: "Active",     count: stats.active    },
    { key: "overdue",   label: "Overdue",    count: stats.overdue   },
    { key: "mitigated", label: "Mitigated",  count: stats.mitigated },
    { key: "closed",    label: "Closed",     count: stats.closed    },
  ];

  return (
    <PageShell
      title="Risk Register"
      subtitle="Live risk tracking — young people, staff, and environment"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={RISK_EXPORT_COLS} filename="risk-register" />
          <PrintButton title="Risk Register" subtitle="Oak House — Risk Management" />
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowNew(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Risk
          </Button>
        </div>
      }
    >
      {/* ── Summary stats ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Total Risks",   value: stats.total,     color: "text-slate-700",   bg: "bg-slate-50",   border: "border-slate-200"   },
          { label: "Active",        value: stats.active,    color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200"     },
          { label: "Critical",      value: stats.critical,  color: "text-red-700",     bg: "bg-red-100",    border: "border-red-300"     },
          { label: "High",          value: stats.high,      color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200"  },
          { label: "Overdue Review",value: stats.overdue,   color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200"   },
          { label: "Closed",        value: stats.closed,    color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-lg border p-3 text-center", s.bg, s.border)}>
            <div className={cn("text-xl font-bold", s.color)}>{s.value}</div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alert banner */}
      {(stats.critical > 0 || stats.overdue > 0) && (
        <div className={cn(
          "rounded-lg border p-3 mb-6 flex items-start gap-3",
          stats.critical > 0 ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
        )}>
          <AlertTriangle className={cn("h-5 w-5 mt-0.5 flex-shrink-0", stats.critical > 0 ? "text-red-600" : "text-amber-600")} />
          <div>
            <p className={cn("text-sm font-semibold", stats.critical > 0 ? "text-red-800" : "text-amber-800")}>
              {stats.critical > 0 && `${stats.critical} critical risk${stats.critical !== 1 ? "s" : ""}`}
              {stats.critical > 0 && stats.overdue > 0 && " · "}
              {stats.overdue > 0 && `${stats.overdue} overdue review${stats.overdue !== 1 ? "s" : ""}`}
            </p>
            <p className={cn("text-xs mt-0.5", stats.critical > 0 ? "text-red-700" : "text-amber-700")}>
              Ensure all risks are actively managed and reviews are completed on time.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
              tab === t.key ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {t.label}
            <span className="ml-1.5 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input placeholder="Search risks…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>

        <Filter className="h-3.5 w-3.5 text-slate-400" />

        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as RiskCategory | "all")}>
          <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {(Object.keys(CATEGORY_CONFIG) as RiskCategory[]).map((c) => (
              <SelectItem key={c} value={c}>{CATEGORY_CONFIG[c].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as RiskLevel | "all")}>
          <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Risk level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {(["critical", "high", "medium", "low"] as RiskLevel[]).map((l) => (
              <SelectItem key={l} value={l}>{LEVEL_CONFIG[l].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Risk score</SelectItem>
              <SelectItem value="level">Level</SelectItem>
              <SelectItem value="review">Review date</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="child">Young person</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500" onClick={() => { setSearch(""); setCategoryFilter("all"); setLevelFilter("all"); }}>
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Risk List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Shield className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No risks found</p>
          <p className="text-xs mt-1">{hasFilters ? "Try adjusting your filters" : "No risks in this category"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((risk) => (
            <RiskCard
              key={risk.id}
              risk={risk}
              onStatusChange={(s) => handleStatusChange(risk.id, s)}
              busy={busyId === risk.id}
            />
          ))}
        </div>
      )}

      <div className="text-center text-[10px] text-slate-400 mt-6">
        Showing {filtered.length} of {stats.total} risk{stats.total !== 1 ? "s" : ""}
      </div>

      {/* Regulatory Note */}
      <div className="mt-8 rounded-lg bg-slate-50 border border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-1">About the Risk Register</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              The risk register is a live record of all identified risks affecting young people, staff, and the
              home environment. Each risk is scored using a likelihood × impact matrix, assigned an owner,
              and tracked through a mitigation and review cycle. This register supports Regulation 12
              (Protection of Children) and Regulation 13 (Quality of Care) of the Children&apos;s Homes
              Regulations 2015, and provides direct evidence of proactive risk management for Ofsted
              inspection under the Social Care Common Inspection Framework (SCCIF).
            </p>
          </div>
        </div>
      </div>

      <NewRiskDialog open={showNew} onClose={() => setShowNew(false)} onSubmit={handleCreate} />
    </PageShell>
  );
}

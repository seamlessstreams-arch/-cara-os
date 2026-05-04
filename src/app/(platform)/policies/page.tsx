"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — POLICIES & PROCEDURES
// Centralised register of all home policies required by Children's Homes
// Regulations 2015 & Quality Standards 2015. Tracks version history,
// review dates, responsible owners, and staff read-acknowledgements.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn, formatDate, todayStr } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { getStaffName } from "@/lib/seed-data";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import {
  FileText, Search, Filter, ArrowUpDown, CheckCircle2, AlertTriangle,
  Clock, ChevronDown, ChevronUp, Eye, Shield, Users, Calendar, Download,
  BookOpen, Loader2, RefreshCw, Star, Lock, UserCheck, Pencil,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type PolicyCategory =
  | "safeguarding"
  | "care_practice"
  | "health_safety"
  | "workforce"
  | "behaviour"
  | "complaints"
  | "data_protection"
  | "admissions"
  | "missing_persons"
  | "medication"
  | "fire_safety"
  | "lone_working"
  | "whistleblowing";

type PolicyStatus = "current" | "due_review" | "overdue" | "draft" | "archived";

interface PolicyReadAck {
  staff_id: string;
  read_at: string;
  acknowledged: boolean;
}

interface Policy {
  id: string;
  title: string;
  category: PolicyCategory;
  description: string;
  version: string;
  status: PolicyStatus;
  owner_id: string;
  approved_by: string | null;
  approved_date: string | null;
  effective_date: string;
  next_review_date: string;
  last_reviewed: string | null;
  statutory_basis: string;
  linked_standard: string;
  key_points: string[];
  read_acknowledgements: PolicyReadAck[];
  total_staff_required: number;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<PolicyCategory, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  safeguarding:     { label: "Safeguarding",       icon: Shield,      color: "text-red-600",      bg: "bg-red-50",      border: "border-red-200"     },
  care_practice:    { label: "Care Practice",       icon: BookOpen,    color: "text-indigo-600",   bg: "bg-indigo-50",   border: "border-indigo-200"  },
  health_safety:    { label: "Health & Safety",     icon: CheckCircle2,color: "text-emerald-600",  bg: "bg-emerald-50",  border: "border-emerald-200" },
  workforce:        { label: "Workforce",           icon: Users,       color: "text-teal-600",     bg: "bg-teal-50",     border: "border-teal-200"    },
  behaviour:        { label: "Behaviour Support",   icon: Star,        color: "text-amber-600",    bg: "bg-amber-50",    border: "border-amber-200"   },
  complaints:       { label: "Complaints",          icon: FileText,    color: "text-violet-600",   bg: "bg-violet-50",   border: "border-violet-200"  },
  data_protection:  { label: "Data Protection",     icon: Lock,        color: "text-slate-600",    bg: "bg-slate-50",    border: "border-slate-200"   },
  admissions:       { label: "Admissions",          icon: UserCheck,   color: "text-blue-600",     bg: "bg-blue-50",     border: "border-blue-200"    },
  missing_persons:  { label: "Missing Persons",     icon: AlertTriangle,color: "text-orange-600",  bg: "bg-orange-50",   border: "border-orange-200"  },
  medication:       { label: "Medication",          icon: FileText,    color: "text-pink-600",     bg: "bg-pink-50",     border: "border-pink-200"    },
  fire_safety:      { label: "Fire Safety",         icon: AlertTriangle,color: "text-red-600",     bg: "bg-red-50",      border: "border-red-200"     },
  lone_working:     { label: "Lone Working",        icon: Users,       color: "text-slate-600",    bg: "bg-slate-50",    border: "border-slate-200"   },
  whistleblowing:   { label: "Whistleblowing",      icon: Shield,      color: "text-indigo-600",   bg: "bg-indigo-50",   border: "border-indigo-200"  },
};

const STATUS_CONFIG: Record<PolicyStatus, { label: string; cls: string }> = {
  current:    { label: "Current",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  due_review: { label: "Due Review",  cls: "bg-amber-50 text-amber-700 border-amber-200"      },
  overdue:    { label: "Overdue",     cls: "bg-red-50 text-red-700 border-red-200"             },
  draft:      { label: "Draft",       cls: "bg-slate-50 text-slate-600 border-slate-200"       },
  archived:   { label: "Archived",    cls: "bg-slate-50 text-slate-400 border-slate-200"       },
};

// ── Seed data ────────────────────────────────────────────────────────────────

const now = new Date().toISOString();

function makeAcks(staffIds: string[], readIds: string[]): PolicyReadAck[] {
  return staffIds.map((sid) => ({
    staff_id: sid,
    read_at: readIds.includes(sid) ? "2026-04-15T10:00:00Z" : "",
    acknowledged: readIds.includes(sid),
  }));
}

const ALL_STAFF = ["staff_darren", "staff_ryan", "staff_anna", "staff_chervelle", "staff_diane", "staff_edward", "staff_lackson", "staff_mirela"];

const POLICIES: Policy[] = [
  {
    id: "pol_001", title: "Safeguarding & Child Protection Policy", category: "safeguarding",
    description: "Comprehensive policy covering all safeguarding responsibilities, LADO referral processes, contextual safeguarding, and the home's approach to managing disclosures, allegations, and concerns.",
    version: "4.2", status: "current", owner_id: "staff_darren", approved_by: "staff_darren", approved_date: "2026-01-15",
    effective_date: "2026-01-15", next_review_date: "2026-07-15", last_reviewed: "2026-01-10",
    statutory_basis: "Children Act 1989 & 2004; Working Together to Safeguard Children 2023",
    linked_standard: "Quality Standard 5 — Protection of Children",
    key_points: ["All staff trained to Level 3 safeguarding", "LADO referral within 1 working day", "Contextual safeguarding assessment framework", "Monthly safeguarding audits", "Young person voice captured at all stages"],
    read_acknowledgements: makeAcks(ALL_STAFF, ALL_STAFF), total_staff_required: 8,
    created_at: now, updated_at: now,
  },
  {
    id: "pol_002", title: "Behaviour Support & Physical Intervention Policy", category: "behaviour",
    description: "Outlines the home's trauma-informed approach to behaviour support. Covers de-escalation strategies, safety planning, approved physical intervention techniques (PRICE), debrief requirements, and recording obligations.",
    version: "3.1", status: "current", owner_id: "staff_darren", approved_by: "staff_darren", approved_date: "2025-12-01",
    effective_date: "2025-12-01", next_review_date: "2026-06-01", last_reviewed: "2025-11-28",
    statutory_basis: "Children's Homes Regulations 2015, Reg 20; QS Standard 11",
    linked_standard: "Quality Standard 11 — Positive Relationships",
    key_points: ["PRICE-approved techniques only", "De-escalation is always first approach", "Debrief within 24 hours — child and staff", "Body-worn cameras during PI where proportionate", "Monthly PI analysis and trends review"],
    read_acknowledgements: makeAcks(ALL_STAFF, ["staff_darren", "staff_ryan", "staff_anna", "staff_chervelle", "staff_edward", "staff_lackson"]),
    total_staff_required: 8,
    created_at: now, updated_at: now,
  },
  {
    id: "pol_003", title: "Missing from Care Protocol", category: "missing_persons",
    description: "Step-by-step protocol for responding to missing from care episodes including risk assessment triggers, police notification timescales, return home interview requirements, and pattern analysis.",
    version: "2.4", status: "due_review", owner_id: "staff_ryan", approved_by: "staff_darren", approved_date: "2025-10-20",
    effective_date: "2025-10-20", next_review_date: "2026-04-20", last_reviewed: "2025-10-15",
    statutory_basis: "Children Act 1989; DfE Statutory guidance on children who run away or go missing 2014",
    linked_standard: "Quality Standard 5 — Protection of Children",
    key_points: ["Immediate risk assessment on discovery", "Police notification within 1 hour for high-risk", "Return home interview within 72 hours", "Strategy meeting if 3+ episodes in 28 days", "Pattern analysis monthly"],
    read_acknowledgements: makeAcks(ALL_STAFF, ["staff_darren", "staff_ryan", "staff_anna", "staff_edward"]),
    total_staff_required: 8,
    created_at: now, updated_at: now,
  },
  {
    id: "pol_004", title: "Medication Administration Policy", category: "medication",
    description: "Covers the safe storage, administration, recording, and disposal of medication. Includes controlled drugs, PRN protocols, medication errors, and stock check procedures.",
    version: "3.0", status: "current", owner_id: "staff_ryan", approved_by: "staff_darren", approved_date: "2026-02-01",
    effective_date: "2026-02-01", next_review_date: "2026-08-01", last_reviewed: "2026-01-28",
    statutory_basis: "Children's Homes Regulations 2015, Reg 23",
    linked_standard: "Quality Standard 3 — Health & Well-Being",
    key_points: ["Two-staff witness for controlled drugs", "MAR sheet completed immediately", "Medication errors reported within 1 hour", "Weekly stock checks by senior staff", "PRN protocols signed by prescriber"],
    read_acknowledgements: makeAcks(ALL_STAFF, ALL_STAFF), total_staff_required: 8,
    created_at: now, updated_at: now,
  },
  {
    id: "pol_005", title: "Complaints & Representations Policy", category: "complaints",
    description: "Statutory complaints procedure including timescales for acknowledgement (3 working days) and response (10 working days). Covers young person, parent, and professional complaints plus the escalation pathway.",
    version: "2.2", status: "current", owner_id: "staff_darren", approved_by: "staff_darren", approved_date: "2025-11-01",
    effective_date: "2025-11-01", next_review_date: "2026-05-01", last_reviewed: "2025-10-28",
    statutory_basis: "Statutory Guidance on Representations and Complaints (2016); QS Standard 3",
    linked_standard: "Quality Standard 3 — Rights & Responsibilities",
    key_points: ["Young person-friendly version available", "Acknowledgement within 3 working days", "Stage 1 response within 10 working days", "Independent advocate offered", "Annual complaints summary for Reg 45"],
    read_acknowledgements: makeAcks(ALL_STAFF, ALL_STAFF), total_staff_required: 8,
    created_at: now, updated_at: now,
  },
  {
    id: "pol_006", title: "Data Protection & GDPR Policy", category: "data_protection",
    description: "Data handling procedures, consent management, data subject access requests, breach notification protocols, and records retention schedule for children's social care data.",
    version: "2.0", status: "overdue", owner_id: "staff_darren", approved_by: "staff_darren", approved_date: "2025-03-01",
    effective_date: "2025-03-01", next_review_date: "2025-09-01", last_reviewed: "2025-02-25",
    statutory_basis: "UK GDPR 2018; Data Protection Act 2018",
    linked_standard: "Quality Standard 14 — Financial Viability & Governance",
    key_points: ["All data stored on encrypted systems", "Subject access requests within 30 days", "Breach notification to ICO within 72 hours", "Retention: care records 75 years after DOB", "DPO: Registered Manager"],
    read_acknowledgements: makeAcks(ALL_STAFF, ["staff_darren", "staff_ryan", "staff_anna"]),
    total_staff_required: 8,
    created_at: now, updated_at: now,
  },
  {
    id: "pol_007", title: "Admissions & Matching Policy", category: "admissions",
    description: "Impact risk assessment and matching procedure for new placements. Covers referral assessment, existing children impact assessment, compatibility review, and emergency placement protocols.",
    version: "1.5", status: "current", owner_id: "staff_darren", approved_by: "staff_darren", approved_date: "2026-01-10",
    effective_date: "2026-01-10", next_review_date: "2026-07-10", last_reviewed: "2026-01-08",
    statutory_basis: "Children's Homes Regulations 2015, Reg 14; QS Standard 7",
    linked_standard: "Quality Standard 7 — Children Missing from Home and Care",
    key_points: ["72-hour impact assessment for all placements", "Existing children consulted", "Risk compatibility matrix completed", "Emergency placements: 24-hour review", "RI approval required for all planned admissions"],
    read_acknowledgements: makeAcks(ALL_STAFF, ["staff_darren", "staff_ryan", "staff_chervelle"]),
    total_staff_required: 8,
    created_at: now, updated_at: now,
  },
  {
    id: "pol_008", title: "Fire Safety Policy & Evacuation Procedures", category: "fire_safety",
    description: "Fire risk assessment outcomes, evacuation procedures, personal emergency evacuation plans (PEEPs) for each young person, fire drill schedule, and fire safety equipment maintenance.",
    version: "2.8", status: "current", owner_id: "staff_ryan", approved_by: "staff_darren", approved_date: "2026-03-01",
    effective_date: "2026-03-01", next_review_date: "2026-09-01", last_reviewed: "2026-02-28",
    statutory_basis: "Regulatory Reform (Fire Safety) Order 2005; QS Standard 10",
    linked_standard: "Quality Standard 10 — Premises",
    key_points: ["Fire drills every 4 weeks minimum", "PEEPs for all young people", "Weekly fire alarm tests", "Assembly point: front car park", "Night-time evacuation procedures documented"],
    read_acknowledgements: makeAcks(ALL_STAFF, ALL_STAFF), total_staff_required: 8,
    created_at: now, updated_at: now,
  },
  {
    id: "pol_009", title: "Lone Working Policy", category: "lone_working",
    description: "Risk assessment and procedures for lone working situations. Covers when lone working is permitted, check-in procedures, communication requirements, and incident reporting.",
    version: "1.3", status: "current", owner_id: "staff_ryan", approved_by: "staff_darren", approved_date: "2025-11-15",
    effective_date: "2025-11-15", next_review_date: "2026-05-15", last_reviewed: "2025-11-10",
    statutory_basis: "Health & Safety at Work Act 1974; Management of Health and Safety at Work Regulations 1999",
    linked_standard: "Quality Standard 6 — Staffing",
    key_points: ["Lone working risk assessment completed", "30-minute check-in intervals", "Emergency contact procedures", "On-call manager always available", "Waking night: minimum 2 staff where possible"],
    read_acknowledgements: makeAcks(ALL_STAFF, ALL_STAFF), total_staff_required: 8,
    created_at: now, updated_at: now,
  },
  {
    id: "pol_010", title: "Whistleblowing Policy", category: "whistleblowing",
    description: "Procedures for staff to raise concerns about malpractice, abuse, or regulatory non-compliance. Covers internal escalation, external reporting routes, and protection for whistleblowers.",
    version: "1.2", status: "draft", owner_id: "staff_darren", approved_by: null, approved_date: null,
    effective_date: "2025-06-01", next_review_date: "2026-06-01", last_reviewed: null,
    statutory_basis: "Public Interest Disclosure Act 1998; Employment Rights Act 1996",
    linked_standard: "Quality Standard 14 — Financial Viability & Governance",
    key_points: ["No detriment to whistleblower", "External reporting to Ofsted available", "Named confidential contact", "Investigation within 10 working days", "Annual reminder to all staff"],
    read_acknowledgements: makeAcks(ALL_STAFF, ["staff_darren"]),
    total_staff_required: 8,
    created_at: now, updated_at: now,
  },
];

const POLICY_EXPORT_COLS: ExportColumn<Policy>[] = [
  { header: "Title", accessor: (p) => p.title },
  { header: "Category", accessor: (p) => CATEGORY_CONFIG[p.category].label },
  { header: "Version", accessor: (p) => p.version },
  { header: "Status", accessor: (p) => STATUS_CONFIG[p.status].label },
  { header: "Owner", accessor: (p) => getStaffName(p.owner_id) },
  { header: "Effective Date", accessor: (p) => p.effective_date },
  { header: "Next Review", accessor: (p) => p.next_review_date },
  { header: "Last Reviewed", accessor: (p) => p.last_reviewed ?? "—" },
  { header: "Statutory Basis", accessor: (p) => p.statutory_basis },
  { header: "Linked Standard", accessor: (p) => p.linked_standard },
  { header: "Read %", accessor: (p) => `${Math.round((p.read_acknowledgements.filter((a) => a.acknowledged).length / p.total_staff_required) * 100)}%` },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

// ── Policy Card ──────────────────────────────────────────────────────────────

function PolicyCard({ policy }: { policy: Policy }) {
  const [expanded, setExpanded] = useState(false);
  const catCfg = CATEGORY_CONFIG[policy.category];
  const CatIcon = catCfg.icon;
  const stCfg = STATUS_CONFIG[policy.status];
  const readCount = policy.read_acknowledgements.filter((a) => a.acknowledged).length;
  const readPct = Math.round((readCount / policy.total_staff_required) * 100);
  const reviewDays = daysUntil(policy.next_review_date);

  return (
    <div className={cn(
      "rounded-2xl border bg-white overflow-hidden transition-all",
      policy.status === "overdue" ? "border-red-200" :
      policy.status === "due_review" ? "border-amber-200" :
      policy.status === "draft" ? "border-slate-200 border-dashed" :
      "border-slate-200",
    )}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", catCfg.bg)}>
          <CatIcon className={cn("h-4 w-4", catCfg.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-slate-800">{policy.title}</span>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", stCfg.cls)}>
              {stCfg.label}
            </Badge>
            <span className="text-[10px] text-slate-400 font-mono">v{policy.version}</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />Owner: {getStaffName(policy.owner_id)}
            </span>
            <span>·</span>
            <span className={cn(
              "flex items-center gap-1",
              reviewDays < 0 ? "text-red-600 font-semibold" :
              reviewDays <= 30 ? "text-amber-600" :
              "text-slate-500",
            )}>
              <Calendar className="h-3 w-3" />
              {reviewDays < 0
                ? `Review ${Math.abs(reviewDays)}d overdue`
                : reviewDays === 0
                  ? "Review due today"
                  : `Review in ${reviewDays}d`}
            </span>
            <span>·</span>
            <span className={cn(
              "flex items-center gap-1",
              readPct === 100 ? "text-emerald-600" :
              readPct >= 75 ? "text-amber-600" :
              "text-red-600",
            )}>
              <Eye className="h-3 w-3" />{readCount}/{policy.total_staff_required} read ({readPct}%)
            </span>
          </div>

          {/* Read progress bar */}
          <div className="mt-2 max-w-xs">
            <Progress value={readPct} className="h-1.5" />
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-slate-600 shrink-0"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
          {/* Description */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Description</p>
            <p className="text-xs text-slate-700 leading-relaxed">{policy.description}</p>
          </div>

          {/* Key points */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
            <p className="text-[10px] font-semibold text-indigo-700 uppercase tracking-widest mb-2">Key Points</p>
            <ul className="space-y-1">
              {policy.key_points.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="h-3 w-3 text-indigo-500 shrink-0 mt-0.5" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Statutory basis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Statutory Basis</p>
              <p className="text-xs text-slate-700">{policy.statutory_basis}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Linked Quality Standard</p>
              <p className="text-xs text-slate-700">{policy.linked_standard}</p>
            </div>
          </div>

          {/* Read acknowledgements */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Staff Read Status</p>
            <div className="flex flex-wrap gap-2">
              {policy.read_acknowledgements.map((ack) => (
                <div
                  key={ack.staff_id}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium",
                    ack.acknowledged
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-red-50 border-red-200 text-red-700",
                  )}
                >
                  {ack.acknowledged ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {getStaffName(ack.staff_id)}
                </div>
              ))}
            </div>
          </div>

          {/* Version & dates */}
          <div className="flex items-center gap-4 text-[10px] text-slate-400 flex-wrap">
            {policy.approved_by && (
              <span>Approved by {getStaffName(policy.approved_by)} on {formatDate(policy.approved_date!)}</span>
            )}
            <span>Effective {formatDate(policy.effective_date)}</span>
            {policy.last_reviewed && (
              <span>Last reviewed {formatDate(policy.last_reviewed)}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

type ViewTab = "all" | "current" | "due_review" | "overdue";

export default function PoliciesPage() {
  const policies = POLICIES;

  const [viewTab, setViewTab] = useState<ViewTab>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"title" | "review" | "read" | "category">("review");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Computed statuses — override seed status based on real dates
  const enrichedPolicies = useMemo(() => {
    const today = todayStr();
    return policies.map((p) => {
      let status = p.status;
      if (status !== "draft" && status !== "archived") {
        if (p.next_review_date < today) status = "overdue";
        else if (daysUntil(p.next_review_date) <= 30) status = "due_review";
        else status = "current";
      }
      return { ...p, status } as Policy;
    });
  }, [policies]);

  // Counts
  const currentCount = enrichedPolicies.filter((p) => p.status === "current").length;
  const dueReviewCount = enrichedPolicies.filter((p) => p.status === "due_review").length;
  const overdueCount = enrichedPolicies.filter((p) => p.status === "overdue").length;
  const draftCount = enrichedPolicies.filter((p) => p.status === "draft").length;

  // Overall read compliance
  const overallReadPct = useMemo(() => {
    const total = enrichedPolicies.reduce((acc, p) => acc + p.total_staff_required, 0);
    const read = enrichedPolicies.reduce((acc, p) => acc + p.read_acknowledgements.filter((a) => a.acknowledged).length, 0);
    return total > 0 ? Math.round((read / total) * 100) : 0;
  }, [enrichedPolicies]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of enrichedPolicies) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [enrichedPolicies]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = enrichedPolicies;

    // Tab
    switch (viewTab) {
      case "current": list = list.filter((p) => p.status === "current"); break;
      case "due_review": list = list.filter((p) => p.status === "due_review"); break;
      case "overdue": list = list.filter((p) => p.status === "overdue"); break;
    }

    // Category
    if (categoryFilter !== "all") list = list.filter((p) => p.category === categoryFilter);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.statutory_basis.toLowerCase().includes(q) ||
        CATEGORY_CONFIG[p.category].label.toLowerCase().includes(q)
      );
    }

    // Sort
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "title": return a.title.localeCompare(b.title);
        case "category": return CATEGORY_CONFIG[a.category].label.localeCompare(CATEGORY_CONFIG[b.category].label);
        case "read": {
          const aPct = a.read_acknowledgements.filter((x) => x.acknowledged).length / a.total_staff_required;
          const bPct = b.read_acknowledgements.filter((x) => x.acknowledged).length / b.total_staff_required;
          return aPct - bPct; // least read first
        }
        default: // review date — soonest first
          return a.next_review_date.localeCompare(b.next_review_date);
      }
    });

    return list;
  }, [enrichedPolicies, viewTab, categoryFilter, search, sortBy]);

  return (
    <PageShell
      title="Policies & Procedures"
      subtitle="All home policies — version control, review dates, and staff read-acknowledgements"
      quickCreateContext={{ module: "compliance", defaultTaskCategory: "compliance" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={filtered} columns={POLICY_EXPORT_COLS} filename="policies" />
          <PrintButton title="Policies & Procedures" subtitle="Oak House — Policies Register" targetId="policies-content" />
          <SmartUploadButton variant="inline" label="Upload Policy" uploadContext="Policies & Procedures — policy document upload" />
        </div>
      }
    >
      <div id="policies-content" className="space-y-5 animate-fade-in">

        {/* ── Summary stats ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total Policies", value: enrichedPolicies.length, colour: "text-slate-700", bg: "bg-slate-50 border-slate-100", icon: FileText },
            { label: "Current", value: currentCount, colour: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", icon: CheckCircle2 },
            { label: "Due Review", value: dueReviewCount, colour: dueReviewCount > 0 ? "text-amber-600" : "text-emerald-600", bg: dueReviewCount > 0 ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100", icon: Clock },
            { label: "Overdue", value: overdueCount, colour: overdueCount > 0 ? "text-red-600" : "text-emerald-600", bg: overdueCount > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100", icon: AlertTriangle },
            { label: "Staff Read %", value: `${overallReadPct}%`, colour: overallReadPct >= 90 ? "text-emerald-600" : overallReadPct >= 70 ? "text-amber-600" : "text-red-600", bg: overallReadPct >= 90 ? "bg-emerald-50 border-emerald-100" : overallReadPct >= 70 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100", icon: Eye },
          ].map(({ label, value, colour, bg, icon: Icon }) => (
            <div key={label} className={cn("rounded-2xl border p-4 text-center", bg)}>
              <Icon className={cn("h-4 w-4 mx-auto mb-1", colour)} />
              <div className={cn("text-2xl font-bold tabular-nums", colour)}>{value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Overdue alert ────────────────────────────────────────────────── */}
        {overdueCount > 0 && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-800">
                {overdueCount} polic{overdueCount !== 1 ? "ies" : "y"} overdue for review
              </p>
              <p className="text-[11px] text-red-700 mt-0.5">
                Overdue policies are a common Ofsted finding. Review and update these as a priority.
              </p>
            </div>
          </div>
        )}

        {/* ── Tab bar + search ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search policies, standards, legislation…"
              className="pl-9 h-8 text-xs"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            {([
              { key: "all" as const, label: `All (${enrichedPolicies.length})` },
              { key: "current" as const, label: `Current (${currentCount})` },
              { key: "due_review" as const, label: `Due Review (${dueReviewCount})` },
              { key: "overdue" as const, label: `Overdue (${overdueCount})` },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setViewTab(key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  viewTab === key
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 outline-none"
            >
              <option value="all">All categories</option>
              {(Object.entries(CATEGORY_CONFIG) as [PolicyCategory, typeof CATEGORY_CONFIG[PolicyCategory]][]).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label} ({categoryCounts[key] ?? 0})</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 outline-none"
            >
              <option value="review">Review date (soonest first)</option>
              <option value="title">Title A–Z</option>
              <option value="category">Category</option>
              <option value="read">Read % (lowest first)</option>
            </select>
          </div>
          {(search || categoryFilter !== "all") && (
            <p className="text-xs text-slate-400 ml-auto">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* ── Policies list ────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium">
              {search ? `No policies match "${search}"` : "No policies in this view"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((policy) => (
              <PolicyCard key={policy.id} policy={policy} />
            ))}
          </div>
        )}

        {/* ── Regulatory note ──────────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Regulatory Basis — </span>
          Children&apos;s Homes Regulations 2015, Reg 16 (Statement of Purpose) requires that the home
          has clear policies covering all aspects of care. Quality Standard 14 (Financial Viability &amp;
          Governance) requires policies to be current, reviewed regularly, understood by all staff, and
          effectively implemented. Ofsted inspectors routinely check that policies are up to date,
          that staff can evidence their understanding of key policies, and that practice reflects written policy.
          All policies should be reviewed at least annually — critical policies (safeguarding, medication, PI)
          should be reviewed 6-monthly.
        </div>
      </div>
    </PageShell>
  );
}

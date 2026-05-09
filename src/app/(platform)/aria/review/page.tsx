"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ARIA REVIEW QUEUE
//
// The manager's working queue for ARIA suggestions. Every proactive suggestion
// (incident-linked intelligence, management oversight prompts, linked record
// reviews, risk flags) lands here for human review before any action is taken.
//
// ARIA never commits to a record without explicit manager approval.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { AriaHealthPanel } from "@/components/aria/aria-health-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Search,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Shield,
  Filter,
  CircleDot,
  ClipboardCheck,
  FileText,
  Users,
  Heart,
  Brain,
  Bell,
  ArrowUpDown,
  BarChart3,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type RiskLevel = "urgent" | "high" | "medium" | "low";
type SuggestionStatus = "draft" | "awaiting_review" | "approved" | "amended_and_approved" | "rejected" | "no_action_required" | "committed" | "archived";
type SuggestionType = "management_oversight" | "risk_review" | "plan_review" | "behaviour_support_review" | "key_work" | "safeguarding_review" | "staff_debrief" | "notification" | "task" | "linked_record_review" | "handover_update" | "incident_analysis";

interface ReviewItem {
  id: string;
  title: string;
  summary: string;
  suggestion_type: SuggestionType;
  related_record_type: string;
  related_record_id: string;
  child_name?: string;
  risk_level: RiskLevel;
  confidence_level: "low" | "medium" | "high";
  status: SuggestionStatus;
  reason: string;
  draft_text?: string;
  created_at: string;
  reviewer_role?: string;
  linked_count: number;
}

// ─── Demo data ──────────────────────────────────────────────────────────────

const DEMO_ITEMS: ReviewItem[] = [
  {
    id: "as_001",
    title: "Management oversight required — physical intervention incident",
    summary: "A physical intervention was recorded. The Registered Manager should review the response, consider whether the intervention was proportionate, check that the child's voice has been captured, and record oversight.",
    suggestion_type: "management_oversight",
    related_record_type: "incident",
    related_record_id: "inc_042",
    child_name: "Alex W",
    risk_level: "urgent",
    confidence_level: "high",
    status: "awaiting_review",
    reason: "Physical intervention incidents require immediate management oversight under Regulation 35 and the Quality Standards.",
    draft_text: "I have reviewed this incident involving a physical intervention with Alex. The records show that staff attempted verbal de-escalation and distraction before any physical intervention was considered...",
    created_at: "2026-05-05T08:15:00Z",
    reviewer_role: "Registered Manager",
    linked_count: 4,
  },
  {
    id: "as_002",
    title: "Risk assessment review — escalating behaviour pattern",
    summary: "Three incidents involving similar behaviour within 14 days. The current risk assessment may not reflect the child's present needs.",
    suggestion_type: "risk_review",
    related_record_type: "incident",
    related_record_id: "inc_042",
    child_name: "Alex W",
    risk_level: "high",
    confidence_level: "high",
    status: "awaiting_review",
    reason: "Pattern of three incidents in 14 days suggests the risk assessment requires review to ensure it reflects the child's current presentation.",
    created_at: "2026-05-05T08:15:00Z",
    reviewer_role: "Registered Manager",
    linked_count: 2,
  },
  {
    id: "as_003",
    title: "Safeguarding review — consider whether threshold for LADO is met",
    summary: "The incident involves a staff member and a child. The manager should consider whether the threshold for LADO consultation has been met.",
    suggestion_type: "safeguarding_review",
    related_record_type: "incident",
    related_record_id: "inc_042",
    child_name: "Alex W",
    risk_level: "high",
    confidence_level: "medium",
    status: "awaiting_review",
    reason: "Any incident involving physical contact between staff and a child should be considered against the LADO threshold, even where the intervention was proportionate.",
    created_at: "2026-05-05T08:15:00Z",
    reviewer_role: "Registered Manager",
    linked_count: 1,
  },
  {
    id: "as_004",
    title: "Staff debrief recommended — emotional incident",
    summary: "Staff involved in the incident should be offered a debrief to reflect on practice, consider what went well, what could be different, and whether support is needed.",
    suggestion_type: "staff_debrief",
    related_record_type: "incident",
    related_record_id: "inc_039",
    child_name: "Jordan M",
    risk_level: "medium",
    confidence_level: "high",
    status: "awaiting_review",
    reason: "Staff involved in emotional or high-intensity incidents benefit from structured debrief. This supports wellbeing and reflective practice.",
    created_at: "2026-05-04T16:30:00Z",
    reviewer_role: "Registered Manager",
    linked_count: 1,
  },
  {
    id: "as_005",
    title: "Key work session — capture child's wishes and feelings",
    summary: "Following this incident, a key work session should be offered to the child to explore how they are feeling and what they need.",
    suggestion_type: "key_work",
    related_record_type: "incident",
    related_record_id: "inc_038",
    child_name: "Casey T",
    risk_level: "medium",
    confidence_level: "high",
    status: "awaiting_review",
    reason: "The child's voice is not yet visible in the post-incident records. A key work session provides the opportunity to capture wishes and feelings.",
    created_at: "2026-05-04T14:00:00Z",
    reviewer_role: "Registered Manager",
    linked_count: 2,
  },
  {
    id: "as_006",
    title: "Behaviour support plan review — changed presentation",
    summary: "The child's recent behaviour pattern differs from what the current behaviour support plan describes. The plan may need updating.",
    suggestion_type: "behaviour_support_review",
    related_record_type: "incident",
    related_record_id: "inc_038",
    child_name: "Casey T",
    risk_level: "medium",
    confidence_level: "medium",
    status: "awaiting_review",
    reason: "When a child's presentation changes, the behaviour support plan should be reviewed to ensure strategies remain appropriate and trauma-informed.",
    created_at: "2026-05-04T14:00:00Z",
    linked_count: 1,
  },
  {
    id: "as_007",
    title: "Placement plan review — changed presentation",
    summary: "Following the pattern of incidents, the placement plan should be reviewed to ensure it reflects the child's current needs and that support is appropriate.",
    suggestion_type: "plan_review",
    related_record_type: "incident",
    related_record_id: "inc_042",
    child_name: "Alex W",
    risk_level: "high",
    confidence_level: "medium",
    status: "approved",
    reason: "Placement stability review should be considered where incident patterns suggest changed need.",
    created_at: "2026-05-03T10:00:00Z",
    linked_count: 3,
  },
  {
    id: "as_008",
    title: "Notification consideration — repeated incidents",
    summary: "Three incidents involving the same child in two weeks. Consider whether the social worker and placing authority should be updated.",
    suggestion_type: "notification",
    related_record_type: "incident",
    related_record_id: "inc_040",
    child_name: "Jordan M",
    risk_level: "high",
    confidence_level: "high",
    status: "rejected",
    reason: "Repeated incidents may require notification under Regulation 40. The social worker should be kept informed of patterns, not just individual events.",
    created_at: "2026-05-02T11:00:00Z",
    linked_count: 0,
  },
  {
    id: "as_009",
    title: "Management oversight — minor damage incident",
    summary: "A minor damage incident was recorded. Management oversight should confirm the response was proportionate and the child was supported.",
    suggestion_type: "management_oversight",
    related_record_type: "incident",
    related_record_id: "inc_037",
    child_name: "Casey T",
    risk_level: "low",
    confidence_level: "high",
    status: "committed",
    reason: "All incidents benefit from management oversight, even where severity is low.",
    created_at: "2026-05-01T09:00:00Z",
    linked_count: 1,
  },
];

// ─── Config ─────────────────────────────────────────────────────────────────

const RISK_CONFIG: Record<RiskLevel, { label: string; colour: string; bg: string; dot: string; border: string }> = {
  urgent: { label: "Urgent", colour: "text-red-700", bg: "bg-red-100 text-red-800", dot: "bg-red-500", border: "border-l-red-500" },
  high:   { label: "High",   colour: "text-orange-700", bg: "bg-orange-100 text-orange-800", dot: "bg-orange-500", border: "border-l-orange-500" },
  medium: { label: "Medium", colour: "text-amber-700", bg: "bg-amber-100 text-amber-800", dot: "bg-amber-500", border: "border-l-amber-400" },
  low:    { label: "Low",    colour: "text-slate-600", bg: "bg-slate-100 text-slate-700", dot: "bg-slate-400", border: "border-l-slate-300" },
};

const STATUS_CONFIG: Record<SuggestionStatus, { label: string; icon: React.ElementType; colour: string; bg: string }> = {
  draft:               { label: "Draft",              icon: FileText,     colour: "text-slate-500",   bg: "bg-slate-100 text-slate-700" },
  awaiting_review:     { label: "Awaiting review",    icon: Clock,        colour: "text-amber-600",   bg: "bg-amber-100 text-amber-800" },
  approved:            { label: "Approved",            icon: CheckCircle2, colour: "text-emerald-600", bg: "bg-emerald-100 text-emerald-800" },
  amended_and_approved:{ label: "Amended & approved",  icon: CheckCircle2, colour: "text-emerald-600", bg: "bg-emerald-100 text-emerald-800" },
  rejected:            { label: "Rejected",            icon: XCircle,      colour: "text-red-600",     bg: "bg-red-100 text-red-800" },
  no_action_required:  { label: "No action required",  icon: Eye,          colour: "text-slate-500",   bg: "bg-slate-100 text-slate-700" },
  committed:           { label: "Committed",           icon: CheckCircle2, colour: "text-blue-600",    bg: "bg-blue-100 text-blue-800" },
  archived:            { label: "Archived",            icon: FileText,     colour: "text-slate-400",   bg: "bg-slate-100 text-slate-600" },
};

const TYPE_CONFIG: Record<SuggestionType, { label: string; icon: React.ElementType }> = {
  management_oversight:     { label: "Management oversight",     icon: Shield },
  risk_review:              { label: "Risk assessment review",    icon: AlertTriangle },
  plan_review:              { label: "Placement plan review",     icon: ClipboardCheck },
  behaviour_support_review: { label: "Behaviour support review",  icon: Heart },
  key_work:                 { label: "Key work session",          icon: Users },
  safeguarding_review:      { label: "Safeguarding review",       icon: Shield },
  staff_debrief:            { label: "Staff debrief",             icon: Users },
  notification:             { label: "Notification",              icon: Bell },
  task:                     { label: "Task",                      icon: ClipboardCheck },
  linked_record_review:     { label: "Linked record review",      icon: FileText },
  handover_update:          { label: "Handover update",           icon: ArrowUpDown },
  incident_analysis:        { label: "Incident analysis",         icon: Brain },
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function AriaReviewQueuePage() {
  const [statusFilter, setStatusFilter] = useState<SuggestionStatus | "all">("awaiting_review");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [typeFilter, setTypeFilter] = useState<SuggestionType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let items = DEMO_ITEMS;
    if (statusFilter !== "all") items = items.filter((i) => i.status === statusFilter);
    if (riskFilter !== "all") items = items.filter((i) => i.risk_level === riskFilter);
    if (typeFilter !== "all") items = items.filter((i) => i.suggestion_type === typeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.summary.toLowerCase().includes(q) ||
          (i.child_name ?? "").toLowerCase().includes(q),
      );
    }
    return items;
  }, [statusFilter, riskFilter, typeFilter, searchQuery]);

  const counts = useMemo(() => {
    const c = { awaiting: 0, approved: 0, rejected: 0, committed: 0, total: DEMO_ITEMS.length };
    for (const item of DEMO_ITEMS) {
      if (item.status === "awaiting_review") c.awaiting++;
      else if (item.status === "approved" || item.status === "amended_and_approved") c.approved++;
      else if (item.status === "rejected") c.rejected++;
      else if (item.status === "committed") c.committed++;
    }
    return c;
  }, []);

  return (
    <PageShell
      title="Aria Review Queue"
      subtitle="Every Aria suggestion requires human review. Approve, reject, amend or mark as no action required."
    >
      {/* ARIA health diagnostics — visible to managers only */}
      <AriaHealthPanel
        userRole="registered_manager"
        userId="current_user"
        className="mb-6"
      />

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total" value={counts.total} colour="text-slate-700" bg="bg-slate-50" icon={BarChart3} />
        <StatCard label="Awaiting review" value={counts.awaiting} colour="text-amber-700" bg="bg-amber-50" icon={Clock} pulse={counts.awaiting > 0} />
        <StatCard label="Approved" value={counts.approved} colour="text-emerald-700" bg="bg-emerald-50" icon={CheckCircle2} />
        <StatCard label="Rejected" value={counts.rejected} colour="text-red-700" bg="bg-red-50" icon={XCircle} />
        <StatCard label="Committed" value={counts.committed} colour="text-blue-700" bg="bg-blue-50" icon={ClipboardCheck} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SuggestionStatus | "all")}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="awaiting_review">Awaiting review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="amended_and_approved">Amended &amp; approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="no_action_required">No action required</SelectItem>
            <SelectItem value="committed">Committed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskLevel | "all")}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All risk levels</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as SuggestionType | "all")}>
          <SelectTrigger className="w-[200px] h-8 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(TYPE_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suggestions…"
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">No suggestions match your filters</p>
            <p className="text-xs text-slate-400 mt-1">Adjust your filters or check back after Aria reviews new records.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <SuggestionRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Regulatory note */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground">
        <p className="font-medium mb-1">Aria Review Queue</p>
        <p>
          Every Aria suggestion is labelled as an Aria suggested draft. The Registered Manager
          remains the decision-maker. Suggestions are generated to support professional judgement
          and to prompt oversight where practice, regulation or safeguarding considerations indicate
          it is needed. No suggestion is committed to a statutory record without explicit human approval.
        </p>
      </div>
    </PageShell>
  );
}

// ─── Suggestion row ─────────────────────────────────────────────────────────

function SuggestionRow({ item }: { item: ReviewItem }) {
  const risk = RISK_CONFIG[item.risk_level];
  const status = STATUS_CONFIG[item.status];
  const type = TYPE_CONFIG[item.suggestion_type];
  const StatusIcon = status.icon;
  const TypeIcon = type.icon;

  return (
    <Link
      href={`/aria/review/${item.id}`}
      className={cn(
        "block rounded-xl border bg-white hover:shadow-md transition-all group border-l-4",
        risk.border,
      )}
    >
      <div className="px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <TypeIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-500 font-medium">{type.label}</span>
              {item.child_name && (
                <>
                  <span className="text-slate-300">&middot;</span>
                  <span className="text-xs text-slate-500">{item.child_name}</span>
                </>
              )}
              <span className="text-slate-300">&middot;</span>
              <span className="text-xs text-slate-400">
                {item.related_record_type} {item.related_record_id}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors line-clamp-1">
              {item.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.summary}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge className={cn("text-[10px]", risk.bg)}>{risk.label}</Badge>
            <div className="flex items-center gap-1">
              <StatusIcon className={cn("h-3 w-3", status.colour)} />
              <span className={cn("text-[10px] font-medium", status.colour)}>{status.label}</span>
            </div>
          </div>
        </div>
        {item.linked_count > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
            <FileText className="h-3 w-3" />
            {item.linked_count} linked record suggestion{item.linked_count > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── Stat card ──────────────────────────────────────────────────────────────

function StatCard({
  label, value, colour, bg, icon: Icon, pulse,
}: {
  label: string;
  value: number;
  colour: string;
  bg: string;
  icon: React.ElementType;
  pulse?: boolean;
}) {
  return (
    <div className={cn("rounded-xl px-4 py-3 relative", bg)}>
      <div className="flex items-center justify-between">
        <Icon className={cn("h-4 w-4", colour)} />
        {pulse && value > 0 && <CircleDot className="h-2.5 w-2.5 text-red-500 animate-pulse" />}
      </div>
      <div className={cn("text-2xl font-bold mt-1 tabular-nums", colour)}>{value}</div>
      <div className="text-[10px] text-slate-500 font-medium">{label}</div>
    </div>
  );
}

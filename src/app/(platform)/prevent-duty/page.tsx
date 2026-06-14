"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
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
  ChevronDown, ChevronUp, Activity, FileText, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { usePreventRecords, useCreatePreventRecord } from "@/hooks/use-prevent-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { PreventRecord, PreventReferralType, PreventRiskLevel, PreventStatus } from "@/types/extended";
import {
  PREVENT_REFERRAL_TYPE_LABEL,
  PREVENT_RISK_LEVEL_LABEL,
  PREVENT_STATUS_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── label / colour maps ───────────────────────────────────────────── */
const REFERRAL_TYPE_COLOURS: Record<PreventReferralType, string> = {
  prevent_referral: "bg-red-100 text-red-800",
  channel_referral: "bg-orange-100 text-orange-800",
  community_concern: "bg-amber-100 text-amber-800",
  online_concern: "bg-purple-100 text-purple-800",
  training_record: "bg-blue-100 text-blue-800",
};

const RISK_COLOURS: Record<PreventRiskLevel, string> = {
  low: "bg-slate-100 text-[var(--cs-text-secondary)]",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

const RISK_BORDER: Record<PreventRiskLevel, string> = {
  low: "border-l-slate-300",
  medium: "border-l-amber-400",
  high: "border-l-red-500",
};

const STATUS_COLOURS: Record<PreventStatus, string> = {
  open: "bg-blue-100 text-blue-800",
  referred: "bg-orange-100 text-orange-800",
  channel_active: "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)]",
  channel_closed: "bg-green-100 text-green-800",
  nfa: "bg-slate-100 text-[var(--cs-text-secondary)]",
  monitoring: "bg-amber-100 text-amber-800",
};

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── component ──────────────────────────────────────────────────────── */
export default function PreventDutyPage() {
  const { data: records = [], isLoading } = usePreventRecords();
  const createMutation = useCreatePreventRecord();
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  /* ── new-entry draft state ────────────────────────────────────────── */
  const [draft, setDraft] = useState({
    date: d(0),
    staff_id: "staff_darren",
    child_id: "",
    referral_type: "community_concern" as PreventReferralType,
    risk_level: "low" as PreventRiskLevel,
    status: "open" as PreventStatus,
    indicators: "",
    description: "",
    actions_taken: "",
    multi_agency: "",
    channel_outcome: "",
    training_completed: false,
    review_date: "",
  });

  /* ── stats ────────────────────────────────────────────────────────── */
  const totalRecords = records.length;
  const referralCount = records.filter(
    (r) => r.referral_type === "prevent_referral" || r.referral_type === "channel_referral",
  ).length;
  const activeMonitoring = records.filter((r) => r.status === "monitoring" || r.status === "channel_active").length;
  const trainingRecords = records.filter((r) => r.referral_type === "training_record");
  const trainingCompleted = trainingRecords.filter((r) => r.training_completed).length;
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
          (r.child_id && getYPName(r.child_id).toLowerCase().includes(q)) ||
          getStaffName(r.staff_id).toLowerCase().includes(q) ||
          r.indicators.some((i) => i.toLowerCase().includes(q)),
      );
    }
    if (riskFilter !== "all") list = list.filter((r) => r.risk_level === riskFilter);
    if (typeFilter !== "all") list = list.filter((r) => r.referral_type === typeFilter);
    list.sort((a, b) =>
      sortDir === "desc"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date),
    );
    return list;
  }, [records, search, riskFilter, typeFilter, sortDir]);

  /* ── export columns ───────────────────────────────────────────────── */
  const exportCols: ExportColumn<PreventRecord>[] = [
    { header: "Date", accessor: (r) => r.date },
    { header: "Reporter", accessor: (r) => getStaffName(r.staff_id) },
    { header: "Young Person", accessor: (r) => r.child_id ? getYPName(r.child_id) : "N/A — whole team" },
    { header: "Type", accessor: (r) => PREVENT_REFERRAL_TYPE_LABEL[r.referral_type] },
    { header: "Risk Level", accessor: (r) => PREVENT_RISK_LEVEL_LABEL[r.risk_level] },
    { header: "Status", accessor: (r) => PREVENT_STATUS_LABEL[r.status] },
    { header: "Indicators", accessor: (r) => r.indicators.join("; ") },
    { header: "Description", accessor: (r) => r.description },
    { header: "Actions Taken", accessor: (r) => r.actions_taken },
    { header: "Multi-Agency", accessor: (r) => r.multi_agency.join("; ") },
    { header: "Channel Outcome", accessor: (r) => r.channel_outcome || "N/A" },
    { header: "Training Completed", accessor: (r) => r.training_completed ? "Yes" : "No" },
    { header: "Review Date", accessor: (r) => r.review_date || "N/A" },
  ];

  /* ── handlers ─────────────────────────────────────────────────────── */
  const handleSubmit = () => {
    createMutation.mutate({
      ...draft,
      child_id: draft.child_id === "none" || !draft.child_id ? null : draft.child_id,
      indicators: draft.indicators ? draft.indicators.split(",").map((s) => s.trim()).filter(Boolean) : [],
      multi_agency: draft.multi_agency ? draft.multi_agency.split(",").map((s) => s.trim()).filter(Boolean) : [],
    });
    setDialogOpen(false);
  };

  const staffIds = [
    "staff_darren", "staff_ryan", "staff_anna", "staff_edward",
    "staff_chervelle", "staff_lackson", "staff_mirela",
  ];
  const ypIds = ["yp_alex", "yp_jordan", "yp_casey"];

  if (isLoading) {
    return (
      <PageShell title="Prevent Duty" subtitle="Counter-Terrorism and Security Act 2015 — radicalisation awareness, referrals and Channel programme">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Prevent Duty"
      subtitle="Counter-Terrorism and Security Act 2015 — radicalisation awareness, referrals and Channel programme"
      caraContext={{ pageTitle: "Prevent Duty", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Prevent Duty" />
          <ExportButton data={filtered} columns={exportCols} filename="prevent-duty" />
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Entry
          </Button>
          <CaraStudioQuickActionButton context={{ record_type: "safeguarding", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stat strip ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Records", value: totalRecords, icon: FileText, colour: "text-blue-600" },
            { label: "Referrals", value: referralCount, icon: Shield, colour: referralCount > 0 ? "text-red-600" : "text-[var(--cs-text-muted)]" },
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
              {(Object.entries(PREVENT_RISK_LEVEL_LABEL) as [PreventRiskLevel, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {(Object.entries(PREVENT_REFERRAL_TYPE_LABEL) as [PreventReferralType, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
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
                  RISK_BORDER[rec.risk_level],
                )}
              >
                {/* collapsed header */}
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : rec.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Shield className="h-5 w-5 text-[var(--cs-text-muted)] shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {PREVENT_REFERRAL_TYPE_LABEL[rec.referral_type]}
                        </span>
                        <Badge className={cn("text-[10px]", RISK_COLOURS[rec.risk_level])}>
                          {PREVENT_RISK_LEVEL_LABEL[rec.risk_level]}
                        </Badge>
                        <Badge className={cn("text-[10px]", STATUS_COLOURS[rec.status])}>
                          {PREVENT_STATUS_LABEL[rec.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rec.date} · {getStaffName(rec.staff_id)}
                        {rec.child_id
                          ? ` · ${getYPName(rec.child_id)}`
                          : " · Whole team"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {rec.review_date && rec.review_date <= d(0) && (
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
                      <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-1">
                        Description
                      </p>
                      <p className="text-sm text-[var(--cs-text-secondary)] leading-relaxed">
                        {rec.description}
                      </p>
                    </div>

                    {/* indicators */}
                    {rec.indicators.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-1">
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
                    {rec.actions_taken && (
                      <div className="rounded-xl bg-white border p-3">
                        <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-1">
                          Actions Taken
                        </p>
                        <p className="text-xs text-[var(--cs-text-secondary)]">{rec.actions_taken}</p>
                      </div>
                    )}

                    {/* multi-agency involvement */}
                    {rec.multi_agency.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-1">
                          Multi-Agency Involvement
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.multi_agency.map((agency, i) => (
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
                    {rec.channel_outcome && (
                      <div className="rounded-xl bg-[var(--cs-cara-gold-bg)] border border-[var(--cs-cara-gold-soft)] p-3">
                        <p className="text-[10px] font-semibold text-[var(--cs-cara-gold)] uppercase tracking-wider mb-1">
                          Channel Outcome
                        </p>
                        <p className="text-xs text-[var(--cs-navy)]">{rec.channel_outcome}</p>
                      </div>
                    )}

                    {/* training & review */}
                    <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                      {rec.referral_type === "training_record" && (
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                          rec.training_completed
                            ? "bg-green-50 text-green-700"
                            : "bg-amber-50 text-amber-700",
                        )}>
                          {rec.training_completed ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {rec.training_completed ? "Training Completed" : "Training Scheduled"}
                        </span>
                      )}
                      {rec.review_date && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Review: {rec.review_date}
                        </span>
                      )}
                    </div>

                    {rec.child_id && (
                      <SmartLinkPanel sourceType="prevent_record" sourceId={rec.id} childId={rec.child_id} compact />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── regulatory note ────────────────────────────────────── */}
        <Card className="bg-slate-50 border-[var(--cs-border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--cs-text-muted)]" />
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
            <div className="space-y-1">
              <Label htmlFor="pd-date">Date</Label>
              <Input id="pd-date" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pd-staff">Reporter</Label>
              <Select value={draft.staff_id} onValueChange={(v) => setDraft({ ...draft, staff_id: v })}>
                <SelectTrigger id="pd-staff"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {staffIds.map((s) => <SelectItem key={s} value={s}>{getStaffName(s)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="pd-yp">Young Person (leave blank for whole-team records)</Label>
              <Select value={draft.child_id} onValueChange={(v) => setDraft({ ...draft, child_id: v })}>
                <SelectTrigger id="pd-yp"><SelectValue placeholder="N/A — whole team" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">N/A — whole team</SelectItem>
                  {ypIds.map((y) => <SelectItem key={y} value={y}>{getYPName(y)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="pd-type">Type</Label>
              <Select value={draft.referral_type} onValueChange={(v) => setDraft({ ...draft, referral_type: v as PreventReferralType })}>
                <SelectTrigger id="pd-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(PREVENT_REFERRAL_TYPE_LABEL) as [PreventReferralType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="pd-risk">Risk Level</Label>
              <Select value={draft.risk_level} onValueChange={(v) => setDraft({ ...draft, risk_level: v as PreventRiskLevel })}>
                <SelectTrigger id="pd-risk"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(PREVENT_RISK_LEVEL_LABEL) as [PreventRiskLevel, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="pd-status">Status</Label>
              <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as PreventStatus })}>
                <SelectTrigger id="pd-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(PREVENT_STATUS_LABEL) as [PreventStatus, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="pd-indicators">Indicators (comma-separated)</Label>
              <Input id="pd-indicators" placeholder="e.g. Secretive behaviour, Change in language" value={draft.indicators} onChange={(e) => setDraft({ ...draft, indicators: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pd-desc">Description</Label>
              <Textarea id="pd-desc" rows={4} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pd-actions">Actions Taken</Label>
              <Textarea id="pd-actions" rows={3} value={draft.actions_taken} onChange={(e) => setDraft({ ...draft, actions_taken: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pd-ma">Multi-Agency Involvement (comma-separated)</Label>
              <Input id="pd-ma" placeholder="e.g. Prevent Team, Social Worker" value={draft.multi_agency} onChange={(e) => setDraft({ ...draft, multi_agency: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pd-channel">Channel Outcome</Label>
              <Input id="pd-channel" value={draft.channel_outcome} onChange={(e) => setDraft({ ...draft, channel_outcome: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pd-review">Review Date</Label>
              <Input id="pd-review" type="date" value={draft.review_date} onChange={(e) => setDraft({ ...draft, review_date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Safeguarding"
        category="safeguarding"
        days={90}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Prevent Duty — radicalisation risk, channel referrals, vulnerability concerns, counter-terrorism duties, staff training, referral decisions, multi-agency actions, safeguarding evidence"
        recordType="safeguarding"
        className="mt-6"
      />
    </PageShell>
  );
}

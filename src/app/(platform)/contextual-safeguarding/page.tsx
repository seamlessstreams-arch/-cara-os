"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlatList, FlatListRow, FlatListRowDetail, type RowSeverity } from "@/components/ui/list-row";
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
import { EntryAssist } from "@/components/forms/entry-assist";
import {
  Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, MapPin, Users, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { toast } from "sonner";

import type {
  ContextualSafeguardingRisk,
  ContextualRiskLevel,
  ContextualContextType,
  ContextualSafeguardingStatus,
} from "@/types/extended";
import {
  CONTEXTUAL_RISK_LEVEL_LABEL,
  CONTEXTUAL_CONTEXT_TYPE_LABEL,
  CONTEXTUAL_SAFEGUARDING_STATUS_LABEL,
} from "@/types/extended";
import {
  useContextualSafeguardingRisks,
  useCreateContextualSafeguardingRisk,
} from "@/hooks/use-contextual-safeguarding-risks";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── colour / border maps (kept local) ────────────────────────────────────── */

const CONTEXT_CLR: Record<ContextualContextType, string> = { location: "bg-blue-100 text-blue-800", peer_group: "bg-purple-100 text-purple-800", online_space: "bg-indigo-100 text-indigo-800", transport_route: "bg-amber-100 text-amber-800", school: "bg-green-100 text-green-800", community_facility: "bg-teal-100 text-teal-800" };
const RISK_ROW: Record<ContextualRiskLevel, RowSeverity> = { low: "success", medium: "warning", high: "risk", very_high: "risk" };
const RISK_TEXT: Record<ContextualRiskLevel, string> = { low: "text-[--cs-success]", medium: "text-yellow-700", high: "text-orange-700", very_high: "text-[--cs-risk]" };
const STATUS_TEXT: Record<ContextualSafeguardingStatus, string> = { active: "text-[--cs-risk]", monitoring: "text-[--cs-warning]", resolved: "text-[--cs-success]", escalated: "text-purple-700" };

/* ── empty form state ─────────────────────────────────────────────────────── */

const EMPTY_FORM = {
  context_type: "" as string,
  risk_level: "" as string,
  location_or_context: "",
  description: "",
  community_mapping: "",
  review_date: "",
};

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function ContextualSafeguardingPage() {
  const { data: queryData, isLoading } = useContextualSafeguardingRisks();
  const records = queryData?.data ?? [];
  const createMutation = useCreateContextualSafeguardingRisk();

  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("risk");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const setField = (key: keyof typeof EMPTY_FORM, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.context_type || !form.risk_level || !form.location_or_context) {
      toast.error("Please fill in context type, risk level, and location/context");
      return;
    }
    createMutation.mutate(
      {
        context_type: form.context_type as ContextualContextType,
        risk_level: form.risk_level as ContextualRiskLevel,
        status: "active" as ContextualSafeguardingStatus,
        location_or_context: form.location_or_context,
        description: form.description,
        community_mapping: form.community_mapping,
        review_date: form.review_date,
        date_identified: new Date().toISOString().slice(0, 10),
        children_affected: [],
        risk_factors: [],
        protective_actions: [],
        multi_agency_actions: [],
        police_intelligence: "",
      },
      {
        onSuccess: () => {
          toast.success("Contextual risk added");
          setShowNew(false);
          setForm(EMPTY_FORM);
        },
        onError: () => toast.error("Failed to save contextual risk"),
      },
    );
  };

  if (isLoading) return <PageShell title="Contextual Safeguarding" subtitle="Loading contextual safeguarding data…"><div /></PageShell>;

  const filtered = (() => {
    let rows = records.filter((r) => {
      if (filterRisk !== "all" && r.risk_level !== filterRisk) return false;
      if (filterType !== "all" && r.context_type !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        return r.location_or_context.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.date_identified.localeCompare(a.date_identified);
        case "risk": { const o = ["very_high", "high", "medium", "low"]; return o.indexOf(a.risk_level) - o.indexOf(b.risk_level); }
        default: return 0;
      }
    });
    return rows;
  })();

  const activeRisks = records.filter((r) => r.status === "active" || r.status === "escalated").length;
  const highVeryHigh = records.filter((r) => r.risk_level === "high" || r.risk_level === "very_high").length;
  const monitoring = records.filter((r) => r.status === "monitoring").length;

  const exportCols: ExportColumn<ContextualSafeguardingRisk>[] = [
    { header: "Date Identified", accessor: (r: ContextualSafeguardingRisk) => r.date_identified },
    { header: "Context Type", accessor: (r: ContextualSafeguardingRisk) => CONTEXTUAL_CONTEXT_TYPE_LABEL[r.context_type] },
    { header: "Location/Context", accessor: (r: ContextualSafeguardingRisk) => r.location_or_context },
    { header: "Risk Level", accessor: (r: ContextualSafeguardingRisk) => CONTEXTUAL_RISK_LEVEL_LABEL[r.risk_level] },
    { header: "Status", accessor: (r: ContextualSafeguardingRisk) => CONTEXTUAL_SAFEGUARDING_STATUS_LABEL[r.status] },
    { header: "Children Affected", accessor: (r: ContextualSafeguardingRisk) => r.children_affected.map(getYPName).join(", ") },
    { header: "Description", accessor: (r: ContextualSafeguardingRisk) => r.description },
    { header: "Review Date", accessor: (r: ContextualSafeguardingRisk) => r.review_date },
    { header: "Identified By", accessor: (r: ContextualSafeguardingRisk) => getStaffName(r.identified_by) },
  ];

  return (
    <PageShell title="Contextual Safeguarding" subtitle="Working Together 2023 · Community Risk Mapping · Environmental Factors" caraContext={{ pageTitle: "Contextual Safeguarding", sourceType: "child_record" }} actions={<div className="flex items-center gap-2"><PrintButton title="Contextual Safeguarding" /><ExportButton data={filtered} columns={exportCols} filename="contextual-safeguarding" /><Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Add Context</Button><CaraStudioQuickActionButton context={{ record_type: "safeguarding", record_id: "home_oak", home_id: "home_oak" }} /></div>}>
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Contexts", value: records.length, icon: MapPin, clr: "text-blue-600" },
            { label: "Active Risks", value: activeRisks, icon: AlertTriangle, clr: "text-red-600" },
            { label: "High / Very High", value: highVeryHigh, icon: Shield, clr: "text-orange-600" },
            { label: "Monitoring", value: monitoring, icon: Users, clr: "text-amber-600" },
          ].map((s) => (
            <Card key={s.label}><CardContent className="pt-4 pb-3 text-center"><s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} /><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
          ))}
        </div>

        {highVeryHigh > 0 && (
          <div className="bg-[--cs-risk-bg] border border-[--cs-risk-soft] rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-[--cs-risk] shrink-0 mt-0.5" />
            <div className="text-sm"><p className="font-semibold text-[--cs-risk]">{highVeryHigh} high/very high contextual risk(s) active</p><p className="text-[--cs-risk]">These locations or contexts pose significant risks to young people. Staff must be aware and follow protective measures.</p></div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search location, context…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={filterRisk} onValueChange={setFilterRisk}><SelectTrigger className="w-[140px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Risk</SelectItem>{(Object.keys(CONTEXTUAL_RISK_LEVEL_LABEL) as ContextualRiskLevel[]).map((k) => (<SelectItem key={k} value={k}>{CONTEXTUAL_RISK_LEVEL_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem>{(Object.keys(CONTEXTUAL_CONTEXT_TYPE_LABEL) as ContextualContextType[]).map((k) => (<SelectItem key={k} value={k}>{CONTEXTUAL_CONTEXT_TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="risk">By Risk Level</SelectItem><SelectItem value="date-desc">Newest First</SelectItem></SelectContent></Select>
        </div>

        <FlatList>
          {filtered.map((r) => {
            const open = expanded[r.id];
            return (
              <div key={r.id}>
                <FlatListRow severity={RISK_ROW[r.risk_level]} onClick={() => toggle(r.id)} aria-expanded={!!open}>
                  <div className="flex items-start justify-between flex-1 min-w-0">
                    <div className="space-y-1 min-w-0">
                      <p className="text-base font-semibold text-[var(--cs-navy)] flex items-center gap-2 flex-wrap">
                        <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                        {r.location_or_context}
                        <Badge variant="outline" className={CONTEXT_CLR[r.context_type]}>{CONTEXTUAL_CONTEXT_TYPE_LABEL[r.context_type]}</Badge>
                        <span className={cn("text-[11px] font-semibold uppercase tracking-wide", RISK_TEXT[r.risk_level])}>{CONTEXTUAL_RISK_LEVEL_LABEL[r.risk_level]}</span>
                        <span className={cn("text-[11px] font-semibold uppercase tracking-wide", STATUS_TEXT[r.status])}>{CONTEXTUAL_SAFEGUARDING_STATUS_LABEL[r.status]}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">Children: {r.children_affected.map(getYPName).join(", ")} · Identified: {r.date_identified} · Review: {r.review_date}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </div>
                </FlatListRow>
                {open && (
                  <FlatListRowDetail className="text-sm">
                    <div><p className="font-medium mb-1">Description</p><p className="text-muted-foreground">{r.description}</p></div>
                    <div className="bg-[--cs-risk-bg] rounded-lg p-3"><p className="font-medium text-[--cs-risk] mb-2">Risk Factors</p><ul className="space-y-1">{r.risk_factors.map((rf, i) => (<li key={i} className="text-xs text-[--cs-risk] flex items-start gap-1"><AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" /> {rf}</li>))}</ul></div>
                    <div className="bg-[--cs-success-bg] rounded-lg p-3"><p className="font-medium text-[--cs-success] mb-2">Protective Actions</p><ul className="space-y-1">{r.protective_actions.map((pa, i) => (<li key={i} className="text-xs text-[--cs-success] flex items-start gap-1"><CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" /> {pa}</li>))}</ul></div>
                    <div className="bg-indigo-50 rounded-lg p-3"><p className="font-medium text-indigo-800 mb-2">Multi-Agency Actions</p><ul className="space-y-1">{r.multi_agency_actions.map((ma, i) => (<li key={i} className="text-xs text-indigo-700 flex items-start gap-1"><Shield className="h-3 w-3 shrink-0 mt-0.5" /> {ma}</li>))}</ul></div>
                    {r.police_intelligence && <div className="bg-amber-50 rounded-lg p-3"><p className="font-medium text-amber-800 mb-1">Police Intelligence</p><p className="text-amber-700 text-xs">{r.police_intelligence}</p></div>}
                    <div><p className="font-medium mb-1">Community Mapping</p><p className="text-muted-foreground text-xs">{r.community_mapping}</p></div>
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground"><span>Identified by: {getStaffName(r.identified_by)}</span><span>Last reviewed: {r.last_reviewed}</span><span>Next review: {r.review_date}</span></div>
                  </FlatListRowDetail>
                )}
              </div>
            );
          })}
        </FlatList>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Contextual safeguarding recognises that young people face risks outside the home — in their communities, peer groups, and online spaces. Working Together to Safeguard Children 2023 requires a contextual approach. Children&apos;s Homes must maintain awareness of local risks (locality risk assessment, Reg 46) and actively map the contexts that affect the young people in their care. This record supports the location assessment (Reg 46), MACE engagement, and Ofsted inspection framework.</p>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Contextual Risk</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Context Type</Label><Select value={form.context_type} onValueChange={(v) => setField("context_type", v)}><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(CONTEXTUAL_CONTEXT_TYPE_LABEL) as ContextualContextType[]).map((k) => (<SelectItem key={k} value={k}>{CONTEXTUAL_CONTEXT_TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Risk Level</Label><Select value={form.risk_level} onValueChange={(v) => setField("risk_level", v)}><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(CONTEXTUAL_RISK_LEVEL_LABEL) as ContextualRiskLevel[]).map((k) => (<SelectItem key={k} value={k}>{CONTEXTUAL_RISK_LEVEL_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div className="col-span-2"><Label>Location / Context</Label><Input placeholder="Where or what is the context?" value={form.location_or_context} onChange={(e) => setField("location_or_context", e.target.value)} /></div>
            <div className="col-span-2"><Label>Description</Label><Textarea rows={3} placeholder="Describe the risk…" value={form.description} onChange={(e) => setField("description", e.target.value)} /><EntryAssist value={form.description} onChange={(v) => setField("description", v)} sourceRecordType="contextual_safeguarding" className="mt-1" /></div>
            <div className="col-span-2"><Label>Community Mapping</Label><Textarea rows={2} placeholder="Describe the physical/online environment…" value={form.community_mapping} onChange={(e) => setField("community_mapping", e.target.value)} /></div>
            <div><Label>Review Date</Label><Input type="date" value={form.review_date} onChange={(e) => setField("review_date", e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button onClick={handleSave} disabled={createMutation.isPending}>{createMutation.isPending ? "Saving…" : "Save Context"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Safeguarding"
        category={["safeguarding", "missing_episode"]}
        days={90}
        defaultCollapsed
      />
    </PageShell>
  );
}

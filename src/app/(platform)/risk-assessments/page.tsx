"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useRiskAssessments, useCreateRiskAssessment } from "@/hooks/use-risk-assessments";
import { toast } from "sonner";
import type { RiskAssessment, RiskDomain, RiskLevel, RiskTrend, RiskMitigation } from "@/types/extended";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  ShieldAlert, AlertTriangle, CheckCircle2, Clock, Calendar,
  Shield, ArrowUp, ArrowDown, Minus, Loader2, ArrowUpRight,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";


const DOMAIN_META: Record<RiskDomain, { label: string; color: string }> = {
  self_harm:         { label: "Self-Harm",           color: "bg-red-100 text-red-800" },
  absconding:        { label: "Absconding / Missing", color: "bg-orange-100 text-orange-800" },
  aggression:        { label: "Aggression / Violence", color: "bg-red-100 text-red-800" },
  exploitation:      { label: "Exploitation (CSE/CCE)", color: "bg-purple-100 text-purple-800" },
  substance_use:     { label: "Substance Use",        color: "bg-amber-100 text-amber-800" },
  online_safety:     { label: "Online Safety",        color: "bg-blue-100 text-blue-800" },
  fire_setting:      { label: "Fire Setting",         color: "bg-rose-100 text-rose-800" },
  sexual_behaviour:  { label: "Harmful Sexual Behaviour", color: "bg-pink-100 text-pink-800" },
  self_neglect:      { label: "Self-Neglect",          color: "bg-teal-100 text-teal-800" },
  emotional_harm:    { label: "Emotional Harm",       color: "bg-indigo-100 text-indigo-800" },
};

const LEVEL_META: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  low:       { label: "Low",       color: "text-green-700",  bg: "bg-green-100" },
  medium:    { label: "Medium",    color: "text-amber-700",  bg: "bg-amber-100" },
  high:      { label: "High",      color: "text-orange-700", bg: "bg-orange-100" },
  very_high: { label: "Very High", color: "text-red-700",    bg: "bg-red-100" },
};

const TREND_ICON: Record<RiskTrend, React.ReactNode> = {
  increasing: <ArrowUp className="h-3.5 w-3.5 text-red-600" />,
  stable:     <Minus className="h-3.5 w-3.5 text-amber-600" />,
  decreasing: <ArrowDown className="h-3.5 w-3.5 text-green-600" />,
};

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

// ── Export ────────────────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<RiskAssessment>[] = [
  { header: "ID",             accessor: (r: RiskAssessment) => r.id },
  { header: "Young Person",   accessor: (r: RiskAssessment) => getYPName(r.child_id) },
  { header: "Domain",         accessor: (r: RiskAssessment) => DOMAIN_META[r.domain].label },
  { header: "Current Level",  accessor: (r: RiskAssessment) => LEVEL_META[r.current_level].label },
  { header: "Previous Level", accessor: (r: RiskAssessment) => LEVEL_META[r.previous_level].label },
  { header: "Trend",          accessor: (r: RiskAssessment) => r.trend },
  { header: "Assessed By",    accessor: (r: RiskAssessment) => getStaffName(r.assessed_by) },
  { header: "Assessed Date",  accessor: (r: RiskAssessment) => r.assessed_date },
  { header: "Review Date",    accessor: (r: RiskAssessment) => r.review_date },
  { header: "Triggers",       accessor: (r: RiskAssessment) => r.triggers.join("; ") },
  { header: "Mitigations",    accessor: (r: RiskAssessment) => r.mitigations.map((m: RiskMitigation) => m.strategy).join("; ") },
  { header: "Contingency",    accessor: (r: RiskAssessment) => r.contingency_plan },
  { header: "Child Views",    accessor: (r: RiskAssessment) => r.child_views },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function RiskAssessmentsPage() {
  const { data: raData, isLoading } = useRiskAssessments();
  const createRA = useCreateRiskAssessment();
  const assessments = raData?.data ?? [];
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sortBy, setSortBy] = useState("level");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const children = useMemo(() => {
    const ids = [...new Set(assessments.map((a) => a.child_id))];
    return ids.map((id) => ({ id, name: getYPName(id) }));
  }, [assessments]);

  const filtered = useMemo(() => {
    let list = [...assessments];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((a) => a.triggers.some((t) => t.toLowerCase().includes(s)) || a.contingency_plan.toLowerCase().includes(s));
    }
    if (childFilter !== "all") list = list.filter((a) => a.child_id === childFilter);
    if (levelFilter !== "all") list = list.filter((a) => a.current_level === levelFilter);

    const levelOrder: Record<string, number> = { very_high: 0, high: 1, medium: 2, low: 3 };
    list.sort((a, b) => {
      switch (sortBy) {
        case "level":  return levelOrder[a.current_level] - levelOrder[b.current_level];
        case "domain": return DOMAIN_META[a.domain].label.localeCompare(DOMAIN_META[b.domain].label);
        case "review": return a.review_date.localeCompare(b.review_date);
        case "child":  return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default:       return 0;
      }
    });
    return list;
  }, [assessments, search, childFilter, levelFilter, sortBy]);

  const stats = useMemo(() => {
    const total = assessments.length;
    const highRisk = assessments.filter((a) => a.current_level === "high" || a.current_level === "very_high").length;
    const dueReview = assessments.filter((a) => a.review_date <= d(7)).length;
    const improving = assessments.filter((a) => a.trend === "decreasing").length;
    return { total, highRisk, dueReview, improving };
  }, [assessments]);

  // Per-child risk summary
  const childRiskSummary = useMemo(() => {
    return children.map((c) => {
      const ca = assessments.filter((a) => a.child_id === c.id);
      const levelOrder: Record<string, number> = { very_high: 3, high: 2, medium: 1, low: 0 };
      const highest = ca.reduce((max, a) => levelOrder[a.current_level] > max ? levelOrder[a.current_level] : max, 0);
      const highestLabel = (["low", "medium", "high", "very_high"] as RiskLevel[])[highest];
      return { ...c, count: ca.length, highest: highestLabel };
    });
  }, [children, assessments]);

  return (
    <PageShell
      title="Risk Assessments"
      subtitle="Individual risk assessments — triggers, mitigations, and contingency plans"
      ariaContext={{ pageTitle: "Risk Assessments", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Risk Assessments" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="risk-assessments" />
          <AriaStudioQuickActionButton context={{ record_type: "risk_assessment", record_id: "home_oak", home_id: "home_oak" }} />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Assessment</Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <div id="print-area" className="space-y-6">
        <AriaPanel mode="assist" pageContext="Risk Assessments — individual risk assessment, triggers, mitigations, contingency planning, placement risk management" recordType="risk_assessment" userRole="registered_manager" className="mb-2" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Assessments", value: stats.total,     icon: <ShieldAlert className="h-4 w-4" />,    color: "text-blue-600" },
            { label: "High / Very High",  value: stats.highRisk,  icon: <AlertTriangle className="h-4 w-4" />,  color: "text-red-600" },
            { label: "Review Due (7d)",   value: stats.dueReview, icon: <Clock className="h-4 w-4" />,          color: "text-amber-600" },
            { label: "Improving",         value: stats.improving, icon: <ArrowDown className="h-4 w-4" />,      color: "text-green-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", s.color)}>{s.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Per-child summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {childRiskSummary.map((c) => (
            <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setChildFilter(childFilter === c.id ? "all" : c.id)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.count} risk domains assessed</p>
                </div>
                <Badge className={cn("text-xs", LEVEL_META[c.highest].bg, LEVEL_META[c.highest].color)}>Highest: {LEVEL_META[c.highest].label}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search risk assessments…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={childFilter} onValueChange={setChildFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Child" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {Object.entries(LEVEL_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="level">Risk Level</SelectItem>
                <SelectItem value="domain">Domain</SelectItem>
                <SelectItem value="review">Review Date</SelectItem>
                <SelectItem value="child">Child</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No assessments match your filters.</p>}
          {filtered.map((a) => {
            const open = !!expanded[a.id];
            const domainM = DOMAIN_META[a.domain];
            const levelM = LEVEL_META[a.current_level];
            const reviewDue = a.review_date <= d(7);
            return (
              <Card key={a.id} className={cn("border-l-4", a.current_level === "very_high" || a.current_level === "high" ? "border-l-red-500" : a.current_level === "medium" ? "border-l-amber-400" : "border-l-green-400")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(a.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", domainM.color)}>{domainM.label}</Badge>
                        <Badge className={cn("text-xs", levelM.bg, levelM.color)}>{levelM.label}</Badge>
                        <span className="flex items-center gap-0.5 text-xs">{TREND_ICON[a.trend]} <span className="text-muted-foreground">{a.trend}</span></span>
                        {reviewDue && <Badge variant="destructive" className="text-xs">Review due</Badge>}
                        {(a as never as { care_event_id?: string }).care_event_id && (
                          <Link
                            href={`/care-events/${(a as never as { care_event_id: string }).care_event_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                          >
                            <ArrowUpRight className="h-3 w-3" />
                            From Care Event
                          </Link>
                        )}
                      </div>
                      <p className="font-semibold">{getYPName(a.child_id)} — {domainM.label}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>Assessed: {a.assessed_date}</span>
                        <span>By {getStaffName(a.assessed_by)}</span>
                        <span>Review: {a.review_date}</span>
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-3 border-t pt-3 text-sm">
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Known Triggers</p>
                        <div className="flex flex-wrap gap-1">{(a.triggers ?? []).map((t, i) => <Badge key={i} variant="outline" className="text-xs text-red-600 border-red-200">{t}</Badge>)}</div>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Warning Indicators</p>
                        <div className="flex flex-wrap gap-1">{a.indicators.map((ind, i) => <Badge key={i} variant="outline" className="text-xs text-amber-600 border-amber-200">{ind}</Badge>)}</div>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Mitigation Strategies</p>
                        <div className="space-y-1">
                          {a.mitigations.map((m, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs bg-muted/40 p-2 rounded">
                              {m.effectiveness === "effective" ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5" /> : m.effectiveness === "partially_effective" ? <Clock className="h-3.5 w-3.5 text-amber-600 mt-0.5" /> : <AlertTriangle className="h-3.5 w-3.5 text-gray-400 mt-0.5" />}
                              <div>
                                <p>{m.strategy}</p>
                                <p className="text-muted-foreground">Owner: {m.responsible}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Contingency Plan</p>
                        <p className="bg-red-50 p-2 rounded text-xs text-red-900 border border-red-200">{a.contingency_plan}</p>
                      </div>
                      {a.child_views && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Child&apos;s Views</p>
                          <div className="bg-pink-50 p-2 rounded border border-pink-200 italic text-pink-900 text-xs">{a.child_views}</div>
                        </div>
                      )}
                      {a.history_notes && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">History / Context</p>
                          <p className="text-xs text-muted-foreground italic">{a.history_notes}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Previous level: <span className={LEVEL_META[a.previous_level].color}>{LEVEL_META[a.previous_level].label}</span></span>
                        <span>→ Current: <span className={levelM.color}>{levelM.label}</span></span>
                      </div>
                      <SmartLinkPanel sourceType="risk_assessment" sourceId={a.id} childId={a.child_id} compact />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Risk assessments must be reviewed at least monthly, or immediately following any incident or change in circumstances. All staff must be familiar with each child&apos;s risk assessments and contingency plans. The child&apos;s views must be incorporated. Risk assessments inform placement matching and are a key Ofsted requirement.
            </span>
          </CardContent>
        </Card>
      </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Risk Assessment</DialogTitle></DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const childId = fd.get("child_id") as string;
            const domain = fd.get("domain") as string;
            if (!childId || !domain) return;
            createRA.mutate({
              child_id: childId, domain: domain as RiskDomain,
              current_level: (fd.get("level") as RiskLevel) || "medium",
              previous_level: "medium", trend: "stable", status: "current",
              assessed_by: "staff_darren", assessed_date: d(0), review_date: fd.get("review_date") as string || d(30),
              triggers: (fd.get("triggers") as string || "").split("\n").filter(Boolean),
              indicators: [], mitigations: [], contingency_plan: fd.get("contingency_plan") as string || "",
              child_views: fd.get("child_views") as string || "", history_notes: "",
              linked_incidents: [], home_id: "home_oak", created_at: new Date().toISOString(),
            }, {
              onSuccess: () => { toast.success("Risk assessment created"); setShowNew(false); },
              onError: () => toast.error("Failed to create assessment"),
            });
          }} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Young Person</label>
              <Select name="child_id"><SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>{children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Risk Domain</label>
                <Select name="domain"><SelectTrigger><SelectValue placeholder="Domain" /></SelectTrigger>
                  <SelectContent>{Object.entries(DOMAIN_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Risk Level</label>
                <Select name="level"><SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
                  <SelectContent>{Object.entries(LEVEL_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Triggers</label><Textarea name="triggers" placeholder="Known triggers (one per line)" rows={2} /></div>
            <div><label className="text-sm font-medium">Mitigation Strategies</label><Textarea placeholder="Key strategies (one per line)" rows={3} /></div>
            <div><label className="text-sm font-medium">Contingency Plan</label><Textarea name="contingency_plan" placeholder="What to do if risk escalates…" rows={3} /></div>
            <div><label className="text-sm font-medium">Child&apos;s Views</label><Textarea name="child_views" placeholder="Child's perspective on this risk…" rows={2} /></div>
            <div><label className="text-sm font-medium">Review Date</label><Input name="review_date" type="date" /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createRA.isPending}>{createRA.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : "Save Assessment"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Behaviour & Risk"
        category={["behaviour", "safeguarding"]}
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}

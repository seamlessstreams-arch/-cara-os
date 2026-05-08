"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Clock, Shield, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { useRiskManagementPlanRecords } from "@/hooks/use-risk-management-plan-records";
import type { RiskManagementPlanRecord, RiskMgmtPlanCategory, RiskMgmtPlanStatus } from "@/types/extended";
import { RISK_MGMT_PLAN_CATEGORY_LABEL, RISK_MGMT_PLAN_STATUS_LABEL } from "@/types/extended";
import type { RiskLevel } from "@/types/extended";

/* ── local config ────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const RC_CLR: Record<RiskMgmtPlanCategory, string> = { self_harm: "bg-red-100 text-red-800", absconding: "bg-purple-100 text-purple-800", aggression: "bg-orange-100 text-orange-800", exploitation: "bg-red-200 text-red-900", substance_misuse: "bg-amber-100 text-amber-800", sexualised_behaviour: "bg-pink-100 text-pink-800", online_risk: "bg-blue-100 text-blue-800", radicalisation: "bg-slate-100 text-slate-800", trafficking: "bg-red-200 text-red-900", other: "bg-gray-100 text-gray-800" };
const RL_CLR: Record<RiskLevel, string> = { low: "bg-green-100 text-green-800", medium: "bg-amber-100 text-amber-800", high: "bg-red-100 text-red-800", very_high: "bg-red-900 text-white" };
const PS_CLR: Record<RiskMgmtPlanStatus, string> = { active: "bg-green-100 text-green-800", under_review: "bg-amber-100 text-amber-800", archived: "bg-gray-100 text-gray-800", draft: "bg-blue-100 text-blue-800" };

/* ── page ────────────────────────────────────────────────────────────── */

export default function RiskManagementPlansPage() {
  const { data: records = [], isLoading } = useRiskManagementPlanRecords();
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortBy, setSortBy] = useState("risk");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);
  const today = d(0);
  const childIds = useMemo(() => Array.from(new Set(records.map((r) => r.child_id))), [records]);

  const filtered = useMemo(() => {
    let out = [...records];
    if (search) { const s = search.toLowerCase(); out = out.filter(r => getYPName(r.child_id).toLowerCase().includes(s) || r.risk_description.toLowerCase().includes(s)); }
    if (childFilter !== "all") out = out.filter(r => r.child_id === childFilter);
    if (riskFilter !== "all") out = out.filter(r => r.current_risk_level === riskFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "review": return a.review_date.localeCompare(b.review_date);
        case "category": return a.risk_category.localeCompare(b.risk_category);
        default: { const ord: RiskLevel[] = ["very_high", "high", "medium", "low"]; return ord.indexOf(a.current_risk_level) - ord.indexOf(b.current_risk_level); }
      }
    });
    return out;
  }, [records, search, childFilter, riskFilter, sortBy]);

  const highRisk = records.filter(r => r.current_risk_level === "high" || r.current_risk_level === "very_high").length;
  const reviewDue = records.filter(r => r.review_date <= today).length;

  const exportCols: ExportColumn<RiskManagementPlanRecord>[] = useMemo(() => [
    { header: "Young Person", accessor: (r: RiskManagementPlanRecord) => getYPName(r.child_id) },
    { header: "Risk Category", accessor: (r: RiskManagementPlanRecord) => RISK_MGMT_PLAN_CATEGORY_LABEL[r.risk_category] },
    { header: "Current Level", accessor: (r: RiskManagementPlanRecord) => r.current_risk_level },
    { header: "Previous Level", accessor: (r: RiskManagementPlanRecord) => r.previous_risk_level },
    { header: "Description", accessor: (r: RiskManagementPlanRecord) => r.risk_description },
    { header: "Strategies", accessor: (r: RiskManagementPlanRecord) => r.management_strategies.map(s => s.strategy).join("; ") },
    { header: "Protective Factors", accessor: (r: RiskManagementPlanRecord) => r.protective_factors.join("; ") },
    { header: "Status", accessor: (r: RiskManagementPlanRecord) => RISK_MGMT_PLAN_STATUS_LABEL[r.status] },
    { header: "Review Date", accessor: (r: RiskManagementPlanRecord) => r.review_date },
    { header: "Created By", accessor: (r: RiskManagementPlanRecord) => getStaffName(r.created_by) },
  ], []);

  if (isLoading) {
    return (
      <PageShell title="Risk Management Plans" subtitle="Individual child risk management strategies — Regulation 12">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Risk Management Plans"
      subtitle="Individual child risk management strategies — Regulation 12"
      actions={[
        <PrintButton key="p" title="Risk Management Plans" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="risk-management-plans" />,
        <Button key="n" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />New Plan</Button>,
      ]}
    >
      <div id="print-area" className="space-y-6">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Plans", value: records.filter(r => r.status === "active").length, icon: Shield, colour: "text-blue-600" },
            { label: "High / Very High", value: highRisk, icon: AlertTriangle, colour: "text-red-600" },
            { label: "Review Due", value: reviewDue, icon: Clock, colour: "text-amber-600" },
            { label: "Risk Reducing", value: records.filter(r => { const ord: RiskLevel[] = ["low", "medium", "high", "very_high"]; return ord.indexOf(r.current_risk_level) < ord.indexOf(r.previous_risk_level); }).length, icon: CheckCircle2, colour: "text-green-600" },
          ].map(s => (
            <Card key={s.label}><CardContent className="pt-4 flex items-center gap-3"><s.icon className={cn("h-8 w-8", s.colour)} /><div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></CardContent></Card>
          ))}
        </div>

        {reviewDue > 0 && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div><p className="font-semibold text-amber-900">{reviewDue} plan(s) due for review</p></div>
          </div>
        )}

        <Card><CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]"><Label className="text-xs">Search</Label><div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Name, description…" value={search} onChange={e => setSearch(e.target.value)} /></div></div>
            <div className="w-36"><Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Child</Label><Select value={childFilter} onValueChange={setChildFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{childIds.map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-36"><Label className="text-xs">Risk Level</Label><Select value={riskFilter} onValueChange={setRiskFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{(["low", "medium", "high", "very_high"] as RiskLevel[]).map(r => <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>
            <div className="w-36"><Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="risk">Risk Level</SelectItem><SelectItem value="review">Review Due</SelectItem><SelectItem value="category">Category</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent></Card>

        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            const rDue = r.review_date <= today;
            const riskDown = (["low", "medium", "high", "very_high"] as RiskLevel[]).indexOf(r.current_risk_level) < (["low", "medium", "high", "very_high"] as RiskLevel[]).indexOf(r.previous_risk_level);
            return (
              <Card key={r.id} className={cn("border-l-4", r.current_risk_level === "very_high" ? "border-red-600" : r.current_risk_level === "high" ? "border-red-400" : r.current_risk_level === "medium" ? "border-amber-400" : "border-green-400")}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{getYPName(r.child_id)}</CardTitle>
                        <Badge className={cn("text-xs", RC_CLR[r.risk_category])}>{RISK_MGMT_PLAN_CATEGORY_LABEL[r.risk_category]}</Badge>
                        <Badge className={cn("text-xs", RL_CLR[r.current_risk_level])}>{r.current_risk_level.replace("_", " ").toUpperCase()}</Badge>
                        {riskDown && <span className="text-green-600 text-xs font-medium">↓ from {r.previous_risk_level}</span>}
                        <Badge className={cn("text-xs", PS_CLR[r.status])}>{RISK_MGMT_PLAN_STATUS_LABEL[r.status]}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {rDue && <Badge className="text-xs bg-red-100 text-red-800">Review Due</Badge>}
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-4 pt-0">
                    <p className="text-sm">{r.risk_description}</p>

                    <div><p className="text-xs font-semibold mb-2">Known Triggers</p>
                      <div className="space-y-1">{r.triggers.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Badge className={cn("text-xs", t.likelihood === "high" ? "bg-red-100 text-red-800" : t.likelihood === "medium" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800")}>{t.likelihood}</Badge>
                          <span>{t.trigger}</span><span className="text-xs text-muted-foreground">({t.context})</span>
                        </div>
                      ))}</div>
                    </div>

                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-xs font-semibold text-amber-800 mb-1">Warning Signals</p>
                      <ul className="text-sm text-amber-900 list-disc list-inside">{r.warning_signals.map((w, i) => <li key={i}>{w}</li>)}</ul>
                    </div>

                    <div><p className="text-xs font-semibold mb-2">Management Strategies</p>
                      <table className="w-full text-sm border"><thead className="bg-muted/50"><tr><th className="text-left p-2 font-medium">Strategy</th><th className="text-left p-2 font-medium">Owner</th><th className="text-left p-2 font-medium">Frequency</th><th className="text-left p-2 font-medium">Effectiveness</th></tr></thead>
                        <tbody>{r.management_strategies.map((s, i) => (
                          <tr key={i} className="border-t"><td className="p-2">{s.strategy}</td><td className="p-2">{getStaffName(s.owner)}</td><td className="p-2">{s.frequency}</td>
                            <td className="p-2"><Badge className={cn("text-xs", s.effectiveness === "effective" ? "bg-green-100 text-green-800" : s.effectiveness === "partially_effective" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800")}>{s.effectiveness.replace("_", " ")}</Badge></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>

                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="text-xs font-semibold text-red-800 mb-1">Emergency Plan</p>
                      <p className="text-sm text-red-900 whitespace-pre-line">{r.emergency_plan}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-semibold text-green-800 mb-1">Protective Factors</p>
                        <ul className="text-sm text-green-900 list-disc list-inside">{r.protective_factors.map((p, i) => <li key={i}>{p}</li>)}</ul>
                      </div>
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-semibold text-blue-800 mb-1">Escalation Procedure</p>
                        <p className="text-sm text-blue-900">{r.escalation_procedure}</p>
                      </div>
                    </div>

                    {r.child_views && (
                      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                        <p className="text-xs font-semibold text-pink-800 mb-1">Child&apos;s Views</p>
                        <p className="text-sm text-pink-900">{r.child_views}</p>
                      </div>
                    )}

                    {r.multi_agency_input.length > 0 && (
                      <div><p className="text-xs font-semibold mb-2">Multi-Agency Input</p>
                        <table className="w-full text-sm border"><thead className="bg-muted/50"><tr><th className="text-left p-2 font-medium">Professional</th><th className="text-left p-2 font-medium">Role</th><th className="text-left p-2 font-medium">Input</th></tr></thead>
                          <tbody>{r.multi_agency_input.map((m, i) => <tr key={i} className="border-t"><td className="p-2">{m.professional}</td><td className="p-2">{m.role}</td><td className="p-2">{m.input}</td></tr>)}</tbody>
                        </table>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground flex flex-wrap gap-4">
                      <span>Created: {getStaffName(r.created_by)}</span>
                      <span>Approved: {getStaffName(r.approved_by)}</span>
                      <span>Last reviewed: {r.last_reviewed}</span>
                      <span className={cn(rDue && "text-red-600 font-medium")}>Next review: {r.review_date}</span>
                    </div>

                    <SmartLinkPanel sourceType="risk-management-plan" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory Framework</p>
          <p>Children&apos;s Homes Regulations 2015, Reg 12 — Protection of children. Individual risk management plans must be in place for identified risks, reviewed regularly, and informed by multi-agency professional input. Plans must include the child&apos;s voice and be accessible to all staff.</p>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Risk Management Plan</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Young Person</Label><Select><SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger><SelectContent>{childIds.map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Risk Category</Label><Select><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(RISK_MGMT_PLAN_CATEGORY_LABEL) as [RiskMgmtPlanCategory, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Risk Level</Label><Select><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(["low", "medium", "high", "very_high"] as RiskLevel[]).map(r => <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Risk Description</Label><Textarea rows={3} placeholder="Describe the risk…" /></div>
            <div><Label>Emergency Plan</Label><Textarea rows={3} placeholder="Emergency procedure…" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={() => setDialogOpen(false)}>Create Plan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

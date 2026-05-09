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
  AlertTriangle, CheckCircle2, Clock, Heart, Home, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useAfterCare } from "@/hooks/use-after-care";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type {
  AfterCareLeftReason,
  AfterCareAccomStatus,
  AfterCareEETStatus,
  AfterCareRAG,
  AfterCareWellbeing,
  AfterCareContactLog,
  AfterCareSupportPkg,
  AfterCareRecord,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const LR_LABEL: Record<AfterCareLeftReason, string> = { age_18: "Turned 18", moved_placement: "Moved Placement", reunification: "Reunification", semi_independent: "Semi-Independent", adoption: "Adoption", other: "Other" };
const LR_CLR: Record<AfterCareLeftReason, string> = { age_18: "bg-blue-100 text-blue-800", moved_placement: "bg-purple-100 text-purple-800", reunification: "bg-green-100 text-green-800", semi_independent: "bg-teal-100 text-teal-800", adoption: "bg-indigo-100 text-indigo-800", other: "bg-gray-100 text-gray-800" };

const AS_LABEL: Record<AfterCareAccomStatus, string> = { stable: "Stable", at_risk: "At Risk", homeless: "Homeless", sofa_surfing: "Sofa Surfing", supported_housing: "Supported Housing" };
const AS_CLR: Record<AfterCareAccomStatus, string> = { stable: "bg-green-100 text-green-800", at_risk: "bg-amber-100 text-amber-800", homeless: "bg-red-100 text-red-800", sofa_surfing: "bg-orange-100 text-orange-800", supported_housing: "bg-blue-100 text-blue-800" };

const EET_LABEL: Record<AfterCareEETStatus, string> = { education: "Education", employment: "Employment", training: "Training", neet: "NEET", unknown: "Unknown" };
const EET_CLR: Record<AfterCareEETStatus, string> = { education: "bg-blue-100 text-blue-800", employment: "bg-green-100 text-green-800", training: "bg-teal-100 text-teal-800", neet: "bg-red-100 text-red-800", unknown: "bg-gray-100 text-gray-800" };

const RAG_CLR: Record<AfterCareRAG, string> = { green: "border-green-400 bg-green-50", amber: "border-amber-400 bg-amber-50", red: "border-red-400 bg-red-50" };
const RAG_BADGE: Record<AfterCareRAG, string> = { green: "bg-green-100 text-green-800", amber: "bg-amber-100 text-amber-800", red: "bg-red-100 text-red-800" };

const WB_CLR: Record<AfterCareWellbeing, string> = { good: "text-green-600", fair: "text-blue-600", poor: "text-amber-600", concern: "text-red-600" };

/* ── component ─────────────────────────────────────────────────────────────── */

export default function AfterCarePage() {
  const { data: result, isLoading } = useAfterCare();
  const records = result?.data ?? [];

  const [search, setSearch] = useState("");
  const [ragFilter, setRagFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rag");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);
  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let out = [...records];
    if (search) { const s = search.toLowerCase(); out = out.filter(r => getYPName(r.child_id).toLowerCase().includes(s) || r.current_accommodation.toLowerCase().includes(s)); }
    if (ragFilter !== "all") out = out.filter(r => r.overall_rag === ragFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "name": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "left": return a.left_date.localeCompare(b.left_date);
        default: { const ord: AfterCareRAG[] = ["red", "amber", "green"]; return ord.indexOf(a.overall_rag) - ord.indexOf(b.overall_rag); }
      }
    });
    return out;
  }, [records, search, ragFilter, sortBy]);

  const stayingClose = records.filter(r => r.staying_close_eligible).length;
  const eetRate = records.length ? Math.round(records.filter(r => r.eet_status !== "neet" && r.eet_status !== "unknown").length / records.length * 100) : 0;
  const contactOverdue = records.filter(r => r.next_contact_due < today).length;

  const exportCols: ExportColumn<AfterCareRecord>[] = useMemo(() => [
    { header: "Young Person", accessor: (r: AfterCareRecord) => getYPName(r.child_id) },
    { header: "Left Date", accessor: (r: AfterCareRecord) => r.left_date },
    { header: "Left Reason", accessor: (r: AfterCareRecord) => LR_LABEL[r.left_reason] },
    { header: "Accommodation", accessor: (r: AfterCareRecord) => r.current_accommodation },
    { header: "Accommodation Status", accessor: (r: AfterCareRecord) => AS_LABEL[r.accommodation_status] },
    { header: "EET", accessor: (r: AfterCareRecord) => r.education_employment },
    { header: "EET Status", accessor: (r: AfterCareRecord) => EET_LABEL[r.eet_status] },
    { header: "RAG", accessor: (r: AfterCareRecord) => r.overall_rag.toUpperCase() },
    { header: "Key Worker", accessor: (r: AfterCareRecord) => getStaffName(r.key_worker) },
    { header: "Next Contact", accessor: (r: AfterCareRecord) => r.next_contact_due },
    { header: "Concerns", accessor: (r: AfterCareRecord) => r.current_concerns.join("; ") },
    { header: "Positives", accessor: (r: AfterCareRecord) => r.positives.join("; ") },
  ], []);

  if (isLoading) {
    return (
      <PageShell title="After-Care & Staying Close" subtitle="Post-placement support and outcomes tracking — Children Act 1989">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="After-Care & Staying Close"
      subtitle="Post-placement support and outcomes tracking — Children Act 1989"
      actions={[
        <PrintButton key="p" title="After-Care & Staying Close" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="after-care" />,
        <Button key="n" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Add Record</Button>,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Cases", value: records.length, icon: Heart, colour: "text-blue-600" },
            { label: "Staying Close", value: stayingClose, icon: Home, colour: "text-teal-600" },
            { label: "EET Rate", value: `${eetRate}%`, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Contact Overdue", value: contactOverdue, icon: AlertTriangle, colour: "text-red-600" },
          ].map(s => (
            <Card key={s.label}><CardContent className="pt-4 flex items-center gap-3"><s.icon className={cn("h-8 w-8", s.colour)} /><div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></CardContent></Card>
          ))}
        </div>

        {/* RAG overview cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {records.map(r => {
            const daysSince = r.contact_log.length ? Math.round((Date.now() - new Date(r.contact_log[0].date).getTime()) / 86400000) : 999;
            return (
              <Card key={r.id} className={cn("border-l-4", RAG_CLR[r.overall_rag])}>
                <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2">{getYPName(r.child_id)} <Badge className={cn("text-xs", RAG_BADGE[r.overall_rag])}>{r.overall_rag.toUpperCase()}</Badge></CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Accommodation</span><Badge className={cn("text-xs", AS_CLR[r.accommodation_status])}>{AS_LABEL[r.accommodation_status]}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">EET</span><Badge className={cn("text-xs", EET_CLR[r.eet_status])}>{EET_LABEL[r.eet_status]}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Last Contact</span><span>{daysSince} days ago</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Next Due</span><span className={cn(r.next_contact_due < today && "text-red-600 font-medium")}>{r.next_contact_due}</span></div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* alert */}
        {contactOverdue > 0 && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div><p className="font-semibold text-red-900">{contactOverdue} overdue contact(s)</p>
              <ul className="text-sm text-red-800 mt-1 list-disc list-inside">{records.filter(r => r.next_contact_due < today).map(r => <li key={r.id}>{getYPName(r.child_id)} — due {r.next_contact_due}</li>)}</ul>
            </div>
          </div>
        )}

        {/* filter */}
        <Card><CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]"><Label className="text-xs">Search</Label><div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Name, accommodation…" value={search} onChange={e => setSearch(e.target.value)} /></div></div>
            <div className="w-36"><Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />RAG</Label><Select value={ragFilter} onValueChange={setRagFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="red">Red</SelectItem><SelectItem value="amber">Amber</SelectItem><SelectItem value="green">Green</SelectItem></SelectContent></Select></div>
            <div className="w-36"><Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="rag">RAG Priority</SelectItem><SelectItem value="name">Name</SelectItem><SelectItem value="left">Left Date</SelectItem></SelectContent></Select></div>
          </div>
        </CardContent></Card>

        {/* case cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", RAG_CLR[r.overall_rag])}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{getYPName(r.child_id)}</CardTitle>
                        <Badge className={cn("text-xs", RAG_BADGE[r.overall_rag])}>{r.overall_rag.toUpperCase()}</Badge>
                        <Badge className={cn("text-xs", LR_CLR[r.left_reason])}>{LR_LABEL[r.left_reason]}</Badge>
                        {r.staying_close_eligible && <Badge className="text-xs bg-teal-100 text-teal-800">Staying Close</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Left: {r.left_date}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1"><Home className="h-3 w-3" />Accommodation</p>
                        <p>{r.current_accommodation}</p>
                        <Badge className={cn("text-xs mt-1", AS_CLR[r.accommodation_status])}>{AS_LABEL[r.accommodation_status]}</Badge>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1">Education / Employment</p>
                        <p>{r.education_employment}</p>
                        <Badge className={cn("text-xs mt-1", EET_CLR[r.eet_status])}>{EET_LABEL[r.eet_status]}</Badge>
                      </div>
                    </div>

                    {/* support package */}
                    {r.support_package.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2">Support Package</p>
                        <table className="w-full text-sm border">
                          <thead className="bg-muted/50"><tr><th className="text-left p-2 font-medium">Area</th><th className="text-left p-2 font-medium">Provider</th><th className="text-left p-2 font-medium">Frequency</th><th className="text-left p-2 font-medium">Status</th></tr></thead>
                          <tbody>{r.support_package.map((sp, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2">{sp.area}</td><td className="p-2">{sp.provider}</td><td className="p-2">{sp.frequency}</td>
                              <td className="p-2"><Badge className={cn("text-xs", sp.status === "active" ? "bg-green-100 text-green-800" : sp.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800")}>{sp.status}</Badge></td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    )}

                    {/* contact log */}
                    <div>
                      <p className="text-xs font-semibold mb-2">Contact Log</p>
                      <div className="space-y-2 border-l-2 border-blue-200 pl-4">
                        {r.contact_log.map((c, i) => (
                          <div key={i} className="relative">
                            <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-blue-400" />
                            <div className="text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{c.date}</span>
                                <Badge variant="outline" className="text-xs">{c.contact_type}</Badge>
                                <span className="text-xs text-muted-foreground">{getStaffName(c.staff_id)}</span>
                                <span className={cn("text-xs font-medium", WB_CLR[c.wellbeing])}>{c.wellbeing}</span>
                              </div>
                              <p className="text-muted-foreground mt-0.5">{c.summary}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* concerns / positives */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {r.current_concerns.length > 0 && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                          <p className="text-xs font-semibold text-red-800 mb-1">Current Concerns</p>
                          <ul className="text-sm text-red-900 list-disc list-inside space-y-0.5">{r.current_concerns.map((c, i) => <li key={i}>{c}</li>)}</ul>
                        </div>
                      )}
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-semibold text-green-800 mb-1">Positives</p>
                        <ul className="text-sm text-green-900 list-disc list-inside space-y-0.5">{r.positives.map((p, i) => <li key={i}>{p}</li>)}</ul>
                      </div>
                    </div>

                    {/* meta */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Key Worker: <strong>{getStaffName(r.key_worker)}</strong></span>
                      <span>Personal Adviser: <strong>{r.personal_adviser}</strong></span>
                      {r.pathway_plan && <span>Pathway Plan Review: <strong>{r.pathway_plan_review_date}</strong></span>}
                      <span>Emergency Contact: <strong>{r.emergency_contact}</strong></span>
                    </div>

                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Next contact due: <strong className={cn(r.next_contact_due < today && "text-red-600")}>{r.next_contact_due}</strong></p>

                    {r.notes && <p className="text-xs text-muted-foreground italic">{r.notes}</p>}

                    <SmartLinkPanel sourceType="after_care" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* outcomes */}
        <Card>
          <CardHeader><CardTitle className="text-base">Outcomes Dashboard</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-3xl font-bold text-green-600">{eetRate}%</p><p className="text-xs text-muted-foreground">In Education, Employment or Training</p></div>
              <div><p className="text-3xl font-bold text-blue-600">{records.length ? Math.round(records.filter(r => r.accommodation_status === "stable" || r.accommodation_status === "supported_housing").length / records.length * 100) : 0}%</p><p className="text-xs text-muted-foreground">Stable Accommodation</p></div>
              <div>
                <div className="flex justify-center gap-2">
                  {(["green", "amber", "red"] as AfterCareRAG[]).map(r => (
                    <Badge key={r} className={cn("text-xs", RAG_BADGE[r])}>{r.toUpperCase()}: {records.filter(d => d.overall_rag === r).length}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">RAG Distribution</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* regulatory note */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory Framework</p>
          <p>Children Act 1989 (as amended by Children and Social Work Act 2017) — local authorities have a duty to support care leavers up to age 25. Staying Close provision enables continued support from children&apos;s homes. Pathway Plans must be reviewed at least every 6 months. Regular contact with former looked-after children must be maintained and documented.</p>
        </div>
      </div>

      {/* dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add After-Care Record</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Young Person</Label><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{["yp_alex", "yp_jordan", "yp_casey"].map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Left Date</Label><Input type="date" /></div>
            <div><Label>Left Reason</Label><Select><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.entries(LR_LABEL) as [AfterCareLeftReason, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Current Accommodation</Label><Input placeholder="Address and provider" /></div>
            <div><Label>Education / Employment</Label><Input placeholder="Current EET details" /></div>
            <div><Label>Notes</Label><Textarea rows={2} placeholder="Additional notes…" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setDialogOpen(false)}>Save Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}

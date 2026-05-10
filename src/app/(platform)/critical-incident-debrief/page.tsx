"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, ChevronDown, ChevronUp, ArrowUpDown, AlertTriangle, CheckCircle2,
  Clock, Search, Shield, Brain, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import type { CriticalIncidentDebriefRecord, DebriefIncidentCategory, IncidentDebriefStatus, DebriefImpactLevel } from "@/types/extended";
import { DEBRIEF_INCIDENT_CATEGORY_LABEL, INCIDENT_DEBRIEF_STATUS_LABEL, DEBRIEF_IMPACT_LEVEL_LABEL } from "@/types/extended";
import { toast } from "sonner";
import { useCriticalIncidentDebriefRecords, useCreateCriticalIncidentDebriefRecord } from "@/hooks/use-critical-incident-debrief-records";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const IMPACT_CLR: Record<DebriefImpactLevel, string> = { low: "bg-green-100 text-green-800", medium: "bg-amber-100 text-amber-800", high: "bg-red-100 text-red-800", critical: "bg-red-200 text-red-900" };
const IMPACT_BORDER: Record<DebriefImpactLevel, string> = { low: "border-l-green-400", medium: "border-l-amber-400", high: "border-l-red-500", critical: "border-l-red-700" };
const STATUS_CLR: Record<IncidentDebriefStatus, string> = { scheduled: "bg-blue-100 text-blue-800", completed: "bg-green-100 text-green-800", deferred: "bg-amber-100 text-amber-800", not_required: "bg-slate-100 text-slate-700" };

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function CriticalIncidentDebriefPage() {
  const { data: raw, isLoading } = useCriticalIncidentDebriefRecords();
  const records = raw?.data ?? [];
  const createRecord = useCreateCriticalIncidentDebriefRecord();
  const [cidForm, setCidForm] = useState({ incident_date: "", debrief_date: "", incident_category: "other" as DebriefIncidentCategory, impact_level: "medium" as DebriefImpactLevel, incident_summary: "" });
  const setCID = (k: string, v: unknown) => setCidForm((p) => ({ ...p, [k]: v }));

  const handleScheduleDebrief = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cidForm.incident_summary.trim()) { toast.error("Incident summary is required."); return; }
    await createRecord.mutateAsync({ incident_date: cidForm.incident_date || new Date().toISOString().slice(0, 10), debrief_date: cidForm.debrief_date || "", incident_category: cidForm.incident_category, incident_summary: cidForm.incident_summary.trim(), impact_level: cidForm.impact_level, young_person_ids: [], staff_involved_ids: [], facilitator_id: "", attendees: [], status: "scheduled", what_happened: "", what_worked_well: [], what_could_improve: [], root_causes: [], emotional_impact: "", actions_agreed: [], actions_completed: 0, policy_changes: "", training_needs: [], shared_with: [], follow_up_date: null, notes: "", created_at: new Date().toISOString() });
    toast.success("Debrief scheduled.");
    setCidForm({ incident_date: "", debrief_date: "", incident_category: "other", impact_level: "medium", incident_summary: "" });
    setShowNew(false);
  };

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterImpact, setFilterImpact] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    let rows = [...records];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r.incident_summary.toLowerCase().includes(q) ||
        r.young_person_ids.some((id) => getYPName(id).toLowerCase().includes(q)) ||
        r.staff_involved_ids.some((id) => getStaffName(id).toLowerCase().includes(q))
      );
    }
    if (filterCategory !== "all") rows = rows.filter((r) => r.incident_category === filterCategory);
    if (filterImpact !== "all") rows = rows.filter((r) => r.impact_level === filterImpact);
    rows.sort((a, b) => sortBy === "newest" ? b.incident_date.localeCompare(a.incident_date) : a.incident_date.localeCompare(b.incident_date));
    return rows;
  }, [records, search, filterCategory, filterImpact, sortBy]);

  if (isLoading) return <PageShell title="Critical Incident Debriefs" subtitle="Post-Incident Learning · Reflective Practice · Continuous Improvement"><div /></PageShell>;

  const total = records.length;
  const completed = records.filter((r) => r.status === "completed").length;
  const scheduled = records.filter((r) => r.status === "scheduled").length;
  const totalActions = records.reduce((s, r) => s + r.actions_agreed.length, 0);
  const completedActions = records.reduce((s, r) => s + r.actions_completed, 0);

  const exportCols: ExportColumn<CriticalIncidentDebriefRecord>[] = [
    { header: "Incident Date", accessor: (r: CriticalIncidentDebriefRecord) => r.incident_date },
    { header: "Debrief Date", accessor: (r: CriticalIncidentDebriefRecord) => r.debrief_date },
    { header: "Category", accessor: (r: CriticalIncidentDebriefRecord) => DEBRIEF_INCIDENT_CATEGORY_LABEL[r.incident_category] },
    { header: "Impact", accessor: (r: CriticalIncidentDebriefRecord) => DEBRIEF_IMPACT_LEVEL_LABEL[r.impact_level] },
    { header: "YP", accessor: (r: CriticalIncidentDebriefRecord) => r.young_person_ids.map(getYPName).join(", ") },
    { header: "Staff", accessor: (r: CriticalIncidentDebriefRecord) => r.staff_involved_ids.map(getStaffName).join(", ") },
    { header: "Status", accessor: (r: CriticalIncidentDebriefRecord) => INCIDENT_DEBRIEF_STATUS_LABEL[r.status] },
    { header: "Actions", accessor: (r: CriticalIncidentDebriefRecord) => `${r.actions_completed}/${r.actions_agreed.length}` },
  ];

  return (
    <PageShell
      title="Critical Incident Debriefs"
      subtitle="Post-Incident Learning · Reflective Practice · Continuous Improvement"
      ariaContext={{ pageTitle: "Critical Incident Debriefs", sourceType: "incident" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Critical Incident Debriefs" />
          <ExportButton data={records} columns={exportCols} filename="critical-incident-debriefs" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Schedule Debrief</Button>
          <AriaStudioQuickActionButton context={{ record_type: "incident", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        {/* stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Debriefs", value: total, icon: Brain, clr: "text-blue-600" },
            { label: "Completed", value: completed, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Scheduled", value: scheduled, icon: Clock, clr: "text-amber-600" },
            { label: "Actions", value: `${completedActions}/${totalActions}`, icon: Shield, clr: "text-purple-600" },
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

        {/* filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search debriefs..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {(Object.entries(DEBRIEF_INCIDENT_CATEGORY_LABEL) as [DebriefIncidentCategory, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterImpact} onValueChange={setFilterImpact}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Impact" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Impact</SelectItem>
              {(Object.entries(DEBRIEF_IMPACT_LEVEL_LABEL) as [DebriefImpactLevel, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}>
            <ArrowUpDown className="h-4 w-4 mr-1" />{sortBy === "newest" ? "Newest" : "Oldest"}
          </Button>
        </div>

        {/* scheduled alert */}
        {scheduled > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-800">{scheduled} debrief(s) scheduled</p>
              <p className="text-blue-700">Critical incident debriefs should be conducted within 72 hours of the incident where possible. All staff involved should attend. The debrief should focus on learning, not blame.</p>
            </div>
          </div>
        )}

        {/* debrief cards */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", IMPACT_BORDER[r.impact_level])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {DEBRIEF_INCIDENT_CATEGORY_LABEL[r.incident_category]}
                        <Badge variant="outline" className={IMPACT_CLR[r.impact_level]}>{DEBRIEF_IMPACT_LEVEL_LABEL[r.impact_level]}</Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{INCIDENT_DEBRIEF_STATUS_LABEL[r.status]}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Incident: {r.incident_date} · Debrief: {r.debrief_date}
                        {" "}· YP: {r.young_person_ids.map(getYPName).join(", ")}
                        {" "}· Staff: {r.staff_involved_ids.map(getStaffName).join(", ")}
                        {" "}· Facilitator: {getStaffName(r.facilitator_id)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.actions_agreed.length > 0 && (
                        <Badge variant="outline" className="bg-muted/50">{r.actions_completed}/{r.actions_agreed.length}</Badge>
                      )}
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* incident summary */}
                    <div>
                      <p className="font-medium mb-1">Incident Summary</p>
                      <p className="text-muted-foreground text-xs">{r.incident_summary}</p>
                    </div>

                    {/* what happened */}
                    {r.what_happened && (
                      <div>
                        <p className="font-medium mb-1">What Happened (Debrief Account)</p>
                        <p className="text-muted-foreground text-xs">{r.what_happened}</p>
                      </div>
                    )}

                    {/* what worked well */}
                    {r.what_worked_well.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-green-700">What Worked Well</p>
                        <ul className="space-y-1">
                          {r.what_worked_well.map((w, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* what could improve */}
                    {r.what_could_improve.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-amber-700">What Could Improve</p>
                        <ul className="space-y-1">
                          {r.what_could_improve.map((w, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* root causes */}
                    {r.root_causes.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Root Causes Identified</p>
                        <div className="flex flex-wrap gap-1">
                          {r.root_causes.map((c, i) => (
                            <Badge key={i} variant="outline" className="bg-red-50 text-red-700 text-xs">{c}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* emotional impact */}
                    {r.emotional_impact && (
                      <div className="bg-purple-50 border border-purple-200 rounded p-2">
                        <p className="font-medium text-xs text-purple-800 mb-1">Emotional Impact on Staff & YP</p>
                        <p className="text-xs text-purple-700">{r.emotional_impact}</p>
                      </div>
                    )}

                    {/* actions */}
                    {r.actions_agreed.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Actions Agreed ({r.actions_completed}/{r.actions_agreed.length})</p>
                        <ul className="space-y-1">
                          {r.actions_agreed.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              {i < r.actions_completed
                                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                                : <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                              }
                              <span className={i < r.actions_completed ? "line-through text-muted-foreground" : ""}>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* training needs */}
                    {r.training_needs.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Training Needs Identified</p>
                        <div className="flex flex-wrap gap-1">
                          {r.training_needs.map((t, i) => (
                            <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 text-xs">{t}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* shared with */}
                    {r.shared_with.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Learning Shared With</p>
                        <div className="flex flex-wrap gap-1">
                          {r.shared_with.map((s, i) => (
                            <Badge key={i} variant="outline" className="bg-muted/50 text-xs"><Users className="h-3 w-3 mr-1" />{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* notes */}
                    {r.notes && (
                      <div><p className="font-medium mb-1">Manager Notes</p><p className="text-muted-foreground text-xs">{r.notes}</p></div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Best Practice Framework</p>
          <p>Critical incident debriefs should be conducted within 72 hours of any significant incident. The debrief process must be non-punitive and focused on learning. All staff involved should attend where possible. Debriefs should address: factual account, what worked well, what could improve, root causes, emotional impact, and agreed actions. Learning should be shared with the wider team (anonymised where appropriate) and inform policy/procedure updates. Debriefs are monitored through Reg 44/45 reporting and form part of the home&apos;s continuous improvement cycle. Staff wellbeing must be considered throughout — any staff member can request additional support following a debrief.</p>
        </div>
      </div>

      {/* new debrief dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Schedule Debrief</DialogTitle></DialogHeader>
          <form onSubmit={handleScheduleDebrief} className="space-y-3">
            <div><Label>Incident Date</Label><Input type="date" value={cidForm.incident_date} onChange={(e) => setCID("incident_date", e.target.value)} /></div>
            <div><Label>Debrief Date</Label><Input type="date" value={cidForm.debrief_date} onChange={(e) => setCID("debrief_date", e.target.value)} /></div>
            <div>
              <Label>Category</Label>
              <Select value={cidForm.incident_category} onValueChange={(v) => setCID("incident_category", v)}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(DEBRIEF_INCIDENT_CATEGORY_LABEL) as [DebriefIncidentCategory, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Impact Level</Label>
              <Select value={cidForm.impact_level} onValueChange={(v) => setCID("impact_level", v)}><SelectTrigger><SelectValue placeholder="Select impact" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(DEBRIEF_IMPACT_LEVEL_LABEL) as [DebriefImpactLevel, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Incident Summary *</Label><Textarea placeholder="Brief description of the incident..." value={cidForm.incident_summary} onChange={(e) => setCID("incident_summary", e.target.value)} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createRecord.isPending}>{createRecord.isPending ? "Saving…" : "Schedule"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Critical Incident Debriefs — post-incident debrief, staff support, learning review, action points, reporting, Reg 40, Reg 45 evidence, trauma-informed approach, improvement plan"
        recordType="incident"
        className="mt-6"
      />
    </PageShell>
  );
}

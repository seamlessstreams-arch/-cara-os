"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  Calendar, AlertTriangle, CheckCircle2, BookOpen, Target, Star, Clock,
  ArrowUpDown, Loader2, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName, YOUNG_PEOPLE } from "@/lib/seed-data";
import { usePepRecords, useCreatePepRecord } from "@/hooks/use-pep-records";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { PepRecord, PepStatus, PepAttainmentLevel, PepProgress, PepSenStatus, PepActionStatus } from "@/types/extended";
import { PEP_STATUS_LABEL, PEP_ATTAINMENT_LEVEL_LABEL, PEP_PROGRESS_LABEL, PEP_SEN_STATUS_LABEL, PEP_ACTION_STATUS_LABEL } from "@/types/extended";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const STATUS_META: Record<PepStatus, { label: string; color: string }> = {
  current: { label: PEP_STATUS_LABEL.current, color: "bg-green-100 text-green-800" },
  review_due: { label: PEP_STATUS_LABEL.review_due, color: "bg-amber-100 text-amber-800" },
  overdue: { label: PEP_STATUS_LABEL.overdue, color: "bg-red-100 text-red-800" },
  draft: { label: PEP_STATUS_LABEL.draft, color: "bg-slate-100 text-slate-700" },
};

const ATT_META: Record<PepAttainmentLevel, { label: string; color: string }> = {
  above: { label: PEP_ATTAINMENT_LEVEL_LABEL.above, color: "text-green-700 bg-green-100" },
  at: { label: PEP_ATTAINMENT_LEVEL_LABEL.at, color: "text-blue-700 bg-blue-100" },
  below: { label: PEP_ATTAINMENT_LEVEL_LABEL.below, color: "text-amber-700 bg-amber-100" },
  significantly_below: { label: PEP_ATTAINMENT_LEVEL_LABEL.significantly_below, color: "text-red-700 bg-red-100" },
};

const PROGRESS_META: Record<PepProgress, { label: string; color: string; icon: React.ElementType }> = {
  exceeded: { label: PEP_PROGRESS_LABEL.exceeded, color: "text-green-700", icon: TrendingUp },
  on_track: { label: PEP_PROGRESS_LABEL.on_track, color: "text-green-600", icon: TrendingUp },
  some_progress: { label: PEP_PROGRESS_LABEL.some_progress, color: "text-amber-600", icon: Minus },
  limited_progress: { label: PEP_PROGRESS_LABEL.limited_progress, color: "text-red-600", icon: TrendingDown },
};

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function PepTrackerPage() {
  const { data: res, isLoading } = usePepRecords();
  const peps: PepRecord[] = res?.data ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const createPep = useCreatePepRecord();
  const [pepForm, setPepForm] = useState({ child_id: "", school: "", year_group: "", pep_date: new Date().toISOString().slice(0, 10) });
  const setPEP = (k: string, v: unknown) => setPepForm((p) => ({ ...p, [k]: v }));

  const handleSavePep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pepForm.child_id) { toast.error("Please select a young person."); return; }
    const next = new Date(); next.setMonth(next.getMonth() + 4);
    await createPep.mutateAsync({ child_id: pepForm.child_id, school: pepForm.school.trim(), year_group: parseInt(pepForm.year_group) || 9, key_stage: "KS4", designated_teacher: "", virtual_school_contact: "", pep_date: pepForm.pep_date, next_review_date: next.toISOString().slice(0, 10), status: "draft" as PepStatus, attendance: 0, exclusions: 0, exclusion_days: 0, sen_status: "none" as PepSenStatus, sen_details: "", targets: [], pupil_premium: { annual_allocation: 2530, spent_to_date: 0, items: [] }, child_views: "", carer_views: "", social_worker_views: "", strengths: [], barriers: [], key_worker: "", actions: [] });
    toast.success("PEP record created.");
    setPepForm({ child_id: "", school: "", year_group: "", pep_date: new Date().toISOString().slice(0, 10) });
    setShowNew(false);
  };
  const [sortBy, setSortBy] = useState<"date" | "attendance" | "name">("date");

  const sorted = useMemo(() => {
    return [...peps].sort((a, b) => {
      switch (sortBy) {
        case "attendance": return a.attendance - b.attendance;
        case "name": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        default: return b.pep_date.localeCompare(a.pep_date);
      }
    });
  }, [peps, sortBy]);

  const exportData = useMemo(() => {
    return peps.flatMap((p) =>
      p.targets.map((t) => ({
        youngPerson: getYPName(p.child_id),
        school: p.school,
        yearGroup: p.year_group,
        subject: t.subject,
        currentLevel: t.current_level,
        targetLevel: t.target_level,
        attainment: ATT_META[t.attainment].label,
        progress: PROGRESS_META[t.progress].label,
        attendance: p.attendance,
        ppAllocated: p.pupil_premium.annual_allocation,
        ppSpent: p.pupil_premium.spent_to_date,
        pepDate: p.pep_date,
        nextReview: p.next_review_date,
        status: STATUS_META[p.status].label,
      }))
    );
  }, [peps]);

  type ExportRow = (typeof exportData)[number];

  const exportCols: ExportColumn<ExportRow>[] = [
    { header: "Young Person", accessor: (r: ExportRow) => r.youngPerson },
    { header: "School", accessor: (r: ExportRow) => r.school },
    { header: "Year", accessor: (r: ExportRow) => String(r.yearGroup) },
    { header: "Subject", accessor: (r: ExportRow) => r.subject },
    { header: "Current Level", accessor: (r: ExportRow) => r.currentLevel },
    { header: "Target Level", accessor: (r: ExportRow) => r.targetLevel },
    { header: "Attainment", accessor: (r: ExportRow) => r.attainment },
    { header: "Progress", accessor: (r: ExportRow) => r.progress },
    { header: "Attendance %", accessor: (r: ExportRow) => String(r.attendance) },
    { header: "PP Allocated", accessor: (r: ExportRow) => `£${r.ppAllocated}` },
    { header: "PP Spent", accessor: (r: ExportRow) => `£${r.ppSpent}` },
    { header: "PEP Date", accessor: (r: ExportRow) => r.pepDate },
    { header: "Next Review", accessor: (r: ExportRow) => r.nextReview },
    { header: "Status", accessor: (r: ExportRow) => r.status },
  ];

  /* summary stats */
  const totalPP = peps.reduce((s, p) => s + p.pupil_premium.annual_allocation, 0);
  const spentPP = peps.reduce((s, p) => s + p.pupil_premium.spent_to_date, 0);
  const avgAttendance = peps.length ? Math.round(peps.reduce((s, p) => s + p.attendance, 0) / peps.length) : 0;
  const overdueCount = peps.filter((p) => p.status === "overdue" || p.status === "review_due").length;

  return (
    <PageShell
      title="PEP Tracker"
      subtitle="Personal Education Plans · Pupil Premium · Educational Attainment"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="PEP Tracker" />
          <ExportButton data={exportData} columns={exportCols} filename="pep-tracker" />
          <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />New PEP</Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <div id="print-area">
        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{peps.length}</p>
              <p className="text-xs text-muted-foreground">Active PEPs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{avgAttendance}%</p>
              <p className="text-xs text-muted-foreground">Avg Attendance</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">£{totalPP.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Pupil Premium (Total)</p>
              {totalPP > 0 && <p className="text-xs text-muted-foreground">£{spentPP.toLocaleString()} spent ({Math.round((spentPP / totalPP) * 100)}%)</p>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className={cn("text-2xl font-bold", overdueCount > 0 ? "text-amber-600" : "text-green-600")}>{overdueCount}</p>
              <p className="text-xs text-muted-foreground">Reviews Due / Overdue</p>
            </CardContent>
          </Card>
        </div>

        {/* attendance alert */}
        {peps.some((p) => p.attendance < 70) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">Attendance Concern</p>
              <p className="text-red-700">
                {peps.filter((p) => p.attendance < 70).map((p) => `${getYPName(p.child_id)} (${p.attendance}%)`).join(", ")} — attendance below 70%. Virtual School Head notified. Educational engagement is a priority in care planning.
              </p>
            </div>
          </div>
        )}

        {/* sort */}
        <div className="flex items-center gap-2 mb-4">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            className="text-sm border rounded px-2 py-1"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="date">PEP Date (newest)</option>
            <option value="attendance">Attendance (lowest first)</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </div>

        {/* PEP cards */}
        <div className="space-y-3">
          {sorted.map((p) => {
            const isOpen = expandedId === p.id;
            const ppPercent = p.pupil_premium.annual_allocation > 0 ? Math.round((p.pupil_premium.spent_to_date / p.pupil_premium.annual_allocation) * 100) : 0;
            return (
              <Card key={p.id} className={cn("border-l-4", p.attendance >= 85 ? "border-l-green-400" : p.attendance >= 70 ? "border-l-amber-400" : "border-l-red-500")}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : p.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                        {getYPName(p.child_id)}
                        <Badge variant="outline" className={STATUS_META[p.status].color}>{STATUS_META[p.status].label}</Badge>
                        {p.sen_status !== "none" && (
                          <Badge variant="outline" className="bg-purple-100 text-purple-800">{PEP_SEN_STATUS_LABEL[p.sen_status]}</Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {p.school} · Year {p.year_group} ({p.key_stage}) · Attendance: {p.attendance}% · PP: £{p.pupil_premium.spent_to_date}/£{p.pupil_premium.annual_allocation} ({ppPercent}%)
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* school info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">Designated Teacher</p>
                        <p className="font-medium">{p.designated_teacher}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">Virtual School</p>
                        <p className="font-medium">{p.virtual_school_contact}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">PEP Date</p>
                        <p className="font-medium">{p.pep_date}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="text-muted-foreground">Next Review</p>
                        <p className="font-medium">{p.next_review_date}</p>
                      </div>
                    </div>

                    {/* attendance & exclusions */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className={cn("font-medium", p.attendance >= 85 ? "text-green-700" : p.attendance >= 70 ? "text-amber-700" : "text-red-700")}>
                          {p.attendance}% attendance
                        </span>
                      </div>
                      {p.exclusions > 0 && (
                        <div className="flex items-center gap-1 text-red-700">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">{p.exclusions} exclusion(s) — {p.exclusion_days} day(s)</span>
                        </div>
                      )}
                    </div>

                    {/* SEN */}
                    {p.sen_status !== "none" && (
                      <div className="bg-purple-50 border border-purple-200 rounded p-2">
                        <p className="font-medium text-xs text-purple-800 mb-1">{PEP_SEN_STATUS_LABEL[p.sen_status]}</p>
                        <p className="text-xs text-purple-700">{p.sen_details}</p>
                      </div>
                    )}

                    {/* targets */}
                    <div>
                      <p className="font-medium mb-2 flex items-center gap-1"><Target className="h-4 w-4 text-blue-600" /> Academic Targets</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {p.targets.map((t, i) => {
                          const ProgressIcon = PROGRESS_META[t.progress].icon;
                          return (
                            <div key={i} className="bg-muted/40 rounded p-2">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-xs">{t.subject}</p>
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline" className={cn("text-[10px]", ATT_META[t.attainment].color)}>{ATT_META[t.attainment].label}</Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-xs mb-1">
                                <span>{t.current_level}</span>
                                <span className="text-muted-foreground">→</span>
                                <span className="font-medium">{t.target_level}</span>
                                <div className="flex items-center gap-0.5 ml-auto">
                                  <ProgressIcon className={cn("h-3 w-3", PROGRESS_META[t.progress].color)} />
                                  <span className={cn("text-[10px]", PROGRESS_META[t.progress].color)}>{PROGRESS_META[t.progress].label}</span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">{t.notes}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* pupil premium */}
                    <div>
                      <p className="font-medium mb-2 flex items-center gap-1"><Star className="h-4 w-4 text-amber-500" /> Pupil Premium Plus (£{p.pupil_premium.annual_allocation})</p>
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>£{p.pupil_premium.spent_to_date} of £{p.pupil_premium.annual_allocation} spent</span>
                          <span className="font-medium">{ppPercent}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={cn("rounded-full h-2", ppPercent >= 70 ? "bg-green-500" : ppPercent >= 40 ? "bg-amber-500" : "bg-red-500")}
                            style={{ width: `${Math.min(ppPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        {p.pupil_premium.items.map((item, i) => (
                          <div key={i} className="bg-muted/40 rounded p-2 text-xs">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-medium">{item.description}</span>
                              <span className="text-muted-foreground">£{item.amount}</span>
                            </div>
                            <p className="text-muted-foreground">{item.impact}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* strengths & barriers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <p className="font-medium text-xs text-green-800 mb-1">Strengths</p>
                        <ul className="space-y-0.5">
                          {p.strengths.map((s, i) => (
                            <li key={i} className="text-xs text-green-700 flex items-start gap-1">
                              <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded p-2">
                        <p className="font-medium text-xs text-red-800 mb-1">Barriers to Learning</p>
                        <ul className="space-y-0.5">
                          {p.barriers.map((b, i) => (
                            <li key={i} className="text-xs text-red-700 flex items-start gap-1">
                              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* child views */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="font-medium text-xs text-blue-800 mb-1">Child&apos;s Views</p>
                      <p className="text-xs text-blue-700">{p.child_views}</p>
                    </div>

                    {/* carer views */}
                    <div>
                      <p className="font-medium text-xs mb-1">Carer&apos;s Views</p>
                      <p className="text-xs text-muted-foreground">{p.carer_views}</p>
                    </div>

                    {/* social worker views */}
                    <div>
                      <p className="font-medium text-xs mb-1">Social Worker&apos;s Views</p>
                      <p className="text-xs text-muted-foreground">{p.social_worker_views}</p>
                    </div>

                    {/* actions */}
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-1"><Clock className="h-4 w-4 text-purple-600" /> PEP Actions</p>
                      {p.actions.map((act, i) => (
                        <div key={i} className="bg-muted/40 rounded p-2 mb-1 flex items-start gap-2 text-xs">
                          {act.status === "completed" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className={act.status === "completed" ? "line-through text-muted-foreground" : ""}>{act.action}</p>
                            <p className="text-muted-foreground">{act.owner} · Due: {act.deadline}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* smart link panel */}
                    <SmartLinkPanel sourceType="pep_record" sourceId={p.id} childId={p.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Personal Education Plans</p>
          <p>PEPs are a statutory requirement for all looked-after children under the Children Act 1989 and the Children and Young Persons Act 2008. They must be completed within 20 school days of entering care and reviewed at least termly (every school term). The PEP should be a &quot;living document&quot; that drives educational progress. The Virtual School Head has a duty to ensure PEPs are high quality. Pupil Premium Plus (currently £2,530 per child per year) must be used to address educational needs identified in the PEP. The designated teacher at each school is responsible for coordinating the PEP in partnership with the child&apos;s social worker, carer, and Virtual School. The child&apos;s views must be central to the PEP process. Educational outcomes for looked-after children are a key Ofsted focus area.</p>
        </div>
      </div>
      )}
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New PEP Record</DialogTitle></DialogHeader>
          <form onSubmit={handleSavePep} className="space-y-3 py-2">
            <div><Label>Young Person *</Label><Select value={pepForm.child_id} onValueChange={(v) => setPEP("child_id", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select young person…" /></SelectTrigger><SelectContent>{YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => (<SelectItem key={y.id} value={y.id}>{y.preferred_name ?? y.first_name}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>School</Label><Input className="mt-1" placeholder="School name" value={pepForm.school} onChange={(e) => setPEP("school", e.target.value)} /></div>
            <div><Label>Year Group</Label><Input className="mt-1" type="number" min={7} max={13} placeholder="9" value={pepForm.year_group} onChange={(e) => setPEP("year_group", e.target.value)} /></div>
            <div><Label>PEP Date</Label><Input className="mt-1" type="date" value={pepForm.pep_date} onChange={(e) => setPEP("pep_date", e.target.value)} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button type="submit" disabled={createPep.isPending}>{createPep.isPending ? "Saving…" : "Create PEP"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

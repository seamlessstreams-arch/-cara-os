"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { PacePanel } from "@/components/pace/pace-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { WritingAssistantInline } from "@/components/writing-assistant/writing-assistant-inline";
import { InlinePracticeReasoning } from "@/components/cara-reasoning/inline-practice-reasoning";
import { InlinePracticeModules } from "@/components/intelligence/practice-module-panels";
import { InlineCaraHeartPanel } from "@/components/cara-heart/inline-cara-heart-panel";
import type { CaraPracticeRecord } from "@/lib/cara-heart/types";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
import { Card, CardContent } from "@/components/ui/card";
import { FlatList, FlatListRow, FlatListRowDetail, type RowSeverity } from "@/components/ui/list-row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName, YOUNG_PEOPLE } from "@/lib/seed-data";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  ShieldAlert, AlertTriangle, CheckCircle2, Clock, Calendar,
  Heart, Shield, Users, Eye, Loader2
} from "lucide-react";
import { useRestraints, useCreateRestraint } from "@/hooks/use-restraints";
import { toast } from "sonner";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { RestraintType, RestraintReason, RestraintReviewStatus, RestraintRecord } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const REASON_META: Record<RestraintReason, string> = {
  harm_to_self:         "Prevent harm to self",
  harm_to_others:       "Prevent harm to others",
  significant_damage:   "Prevent significant damage to property",
  absconding_danger:    "Prevent absconding into danger",
};

const TYPE_META: Record<RestraintType, string> = {
  standing: "Standing", seated: "Seated", ground: "Ground", escort: "Guided Escort", other: "Other",
};

const REVIEW_META: Record<RestraintReviewStatus, { label: string; color: string }> = {
  pending_rm:    { label: "Pending RM Review",  color: "bg-[--cs-warning-bg] text-[--cs-warning]" },
  pending_ri:    { label: "Pending RI Review",   color: "bg-purple-100 text-purple-700" },
  reviewed:      { label: "Reviewed",            color: "bg-[--cs-success-bg] text-[--cs-success]" },
  referred_lado: { label: "Referred to LADO",   color: "bg-[--cs-risk-bg] text-[--cs-risk]" },
};

// Bar carries the assurance state; a LADO referral or recorded injury is the alarm tier.
const REVIEW_ROW: Record<RestraintReviewStatus, RowSeverity> = {
  pending_rm: "warning", pending_ri: "warning", reviewed: "success", referred_lado: "risk",
};
const REVIEW_TEXT: Record<RestraintReviewStatus, string> = {
  pending_rm: "text-[--cs-warning]", pending_ri: "text-purple-700", reviewed: "text-[--cs-success]", referred_lado: "text-[--cs-risk]",
};


const EXPORT_COLS: ExportColumn<RestraintRecord>[] = [
  { header: "ID",              accessor: (r: RestraintRecord) => r.id },
  { header: "Date",            accessor: (r: RestraintRecord) => r.date },
  { header: "Start",           accessor: (r: RestraintRecord) => r.start_time },
  { header: "End",             accessor: (r: RestraintRecord) => r.end_time },
  { header: "Duration (s)",    accessor: (r: RestraintRecord) => String(r.duration) },
  { header: "Young Person",    accessor: (r: RestraintRecord) => getYPName(r.child_id) },
  { header: "Staff",           accessor: (r: RestraintRecord) => r.staff_involved.map((s: { staff_id: string; role: string }) => `${getStaffName(s.staff_id)} (${s.role})`).join(", ") },
  { header: "Reason",          accessor: (r: RestraintRecord) => REASON_META[r.reason] },
  { header: "Type",            accessor: (r: RestraintRecord) => TYPE_META[r.restraint_type] },
  { header: "De-escalation",   accessor: (r: RestraintRecord) => r.de_escalation_attempts.join("; ") },
  { header: "Description",     accessor: (r: RestraintRecord) => r.description },
  { header: "Injuries",        accessor: (r: RestraintRecord) => r.injuries.length > 0 ? r.injuries.map((inj: { person: string; injury: string }) => `${inj.person}: ${inj.injury}`).join("; ") : "None" },
  { header: "Review Status",   accessor: (r: RestraintRecord) => REVIEW_META[r.review_status]?.label ?? String(r.review_status ?? "Unknown") },
  { header: "Notifications",   accessor: (r: RestraintRecord) => r.notifications_sent.map((n: { party: string; date: string }) => `${n.party} (${n.date})`).join("; ") },
  { header: "Recorded By",     accessor: (r: RestraintRecord) => getStaffName(r.recorded_by) },
];

export default function RestraintLogPage() {
  const { data: rstData, isLoading } = useRestraints();
  const records = rstData?.data ?? [];
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const createRestraint = useCreateRestraint();
  const [rlForm, setRlForm] = useState({ date: new Date().toISOString().slice(0, 10), child_id: "", start_time: "", end_time: "", reason: "harm_to_self" as RestraintReason, antecedent: "", de_escalation_attempts: "", description: "" });
  const setRL = (k: string, v: unknown) => setRlForm((p) => ({ ...p, [k]: v }));

  const rlHeartRecord = useMemo<CaraPracticeRecord | null>(() => {
    if (!rlForm.child_id || rlForm.description.length < 30) return null;
    const context = [rlForm.antecedent, rlForm.description].filter(Boolean).join(" | ");
    return {
      id: "draft",
      childId: rlForm.child_id,
      type: "physical_intervention",
      dateTime: `${rlForm.date}T${rlForm.start_time || "00:00"}:00`,
      severity: 4,
      description: context,
      staffResponse: rlForm.de_escalation_attempts || undefined,
      immediateRisk: "high",
      restraintUsed: true,
      staffDebriefRecorded: false,
    };
  }, [rlForm.child_id, rlForm.description, rlForm.antecedent, rlForm.de_escalation_attempts, rlForm.date, rlForm.start_time]);

  const handleSaveRestraint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rlForm.child_id) { toast.error("Please select a young person."); return; }
    if (!rlForm.description.trim()) { toast.error("Description is required."); return; }
    await createRestraint.mutateAsync({ date: rlForm.date, start_time: rlForm.start_time, end_time: rlForm.end_time, duration: 0, child_id: rlForm.child_id, staff_involved: [], reason: rlForm.reason, restraint_type: "standing", antecedent: rlForm.antecedent.trim(), behaviour: "", de_escalation_attempts: rlForm.de_escalation_attempts.split("\n").filter(Boolean), justification: "", description: rlForm.description.trim(), injuries: [], child_debriefed: false, child_debrief_notes: "", staff_debriefed: false, witnessed_by: [], review_status: "pending_rm", review_notes: "", reviewed_by: "", linked_incident_id: "", notifications_sent: [], body_map_completed: false, medical_check_completed: false, recorded_by: "staff_darren", created_at: new Date().toISOString() });
    toast.success("Restraint record saved.");
    setRlForm({ date: new Date().toISOString().slice(0, 10), child_id: "", start_time: "", end_time: "", reason: "harm_to_self", antecedent: "", de_escalation_attempts: "", description: "" });
    setShowNew(false);
  };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((r) => r.description.toLowerCase().includes(s) || r.antecedent.toLowerCase().includes(s));
    }
    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }, [records, search, sortBy]);

  const stats = useMemo(() => {
    const total = records.length;
    const cutoff = (() => { const dt = new Date(); dt.setDate(dt.getDate() - 90); return dt.toISOString().slice(0, 10); })();
    const last90Days = records.filter((r) => r.date >= cutoff).length;
    const avgDuration = total > 0 ? Math.round(records.reduce((a, r) => a + r.duration, 0) / total) : 0;
    const pendingReview = records.filter((r) => r.review_status === "pending_rm" || r.review_status === "pending_ri").length;
    return { total, last90Days, avgDuration, pendingReview };
  }, [records]);

  return (
    <PageShell
      title="Restraint Log"
      subtitle="Physical intervention records — Regulation 35 compliance"
      caraContext={{ pageTitle: "Care Events — Restraint &amp; Physical Intervention", sourceType: "incident" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Restraint Log" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="restraint-log" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Record Restraint</Button>
          <CaraStudioQuickActionButton context={{ record_type: "incident", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
      <div id="print-area" className="space-y-6">
        <CaraPanel
          mode="assist"
          pageContext="Restraint Log — physical intervention records, Regulation 35 compliance, debrief"
          recordType="restraint"
          userRole="registered_manager"
          className="mb-2"
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Records",    value: stats.total,         icon: <ShieldAlert className="h-4 w-4" />,    color: "text-[--cs-info]" },
            { label: "Last 90 Days",      value: stats.last90Days,    icon: <Calendar className="h-4 w-4" />,       color: "text-purple-600" },
            { label: "Avg Duration",      value: `${stats.avgDuration}s`, icon: <Clock className="h-4 w-4" />,     color: "text-[--cs-warning]" },
            { label: "Pending Review",    value: stats.pendingReview, icon: <Eye className="h-4 w-4" />,            color: stats.pendingReview > 0 ? "text-[--cs-risk]" : "text-[--cs-success]" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", s.color)}>{s.icon}</div>
                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-lg font-bold">{s.value}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search restraint records…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <FlatList>
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No restraint records found.</p>}
          {filtered.map((r) => {
            const open = !!expanded[r.id];
            const reviewM = REVIEW_META[r.review_status] ?? { label: String(r.review_status ?? "Unknown"), color: "bg-slate-100 text-slate-700" };
            const severity: RowSeverity = r.injuries.length > 0 ? "risk" : (REVIEW_ROW[r.review_status] ?? "warning");
            return (
              <div key={r.id}>
                <FlatListRow severity={severity} onClick={() => toggle(r.id)} aria-expanded={open}>
                  <div className="flex items-start justify-between flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant="outline" className="text-xs">{TYPE_META[r.restraint_type]}</Badge>
                        <span className={cn("text-[11px] font-semibold uppercase tracking-wide", REVIEW_TEXT[r.review_status] ?? "text-slate-600")}>{reviewM.label}</span>
                        {r.injuries.length > 0 && <span className="text-[11px] font-semibold uppercase tracking-wide text-[--cs-risk]">Injury recorded</span>}
                        {(r as never as { care_event_id?: string }).care_event_id && (
                          <Link
                            href={`/care-events/${(r as never as { care_event_id: string }).care_event_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                          >
                            <ShieldAlert className="h-2.5 w-2.5" />
                            Care Event
                          </Link>
                        )}
                      </div>
                      <p className="font-semibold">{getYPName(r.child_id)} — {REASON_META[r.reason]}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{r.date} {r.start_time}–{r.end_time}</span>
                        <span>Duration: {Math.floor(r.duration / 60)}m {r.duration % 60}s</span>
                        <span>Staff: {r.staff_involved.map((s) => getStaffName(s.staff_id)).join(", ")}</span>
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />}
                  </div>
                </FlatListRow>

                  {open && (
                    <FlatListRowDetail className="text-sm">
                      <div><p className="font-medium text-muted-foreground mb-1">Antecedent</p><p className="text-xs">{r.antecedent}</p></div>
                      <div><p className="font-medium text-muted-foreground mb-1">Behaviour</p><p className="text-xs">{r.behaviour}</p></div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">De-escalation Attempts</p>
                        <ul className="space-y-0.5 text-xs">{r.de_escalation_attempts.map((de, i) => <li key={i} className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-[--cs-success]" />{de}</li>)}</ul>
                      </div>
                      <div><p className="font-medium text-muted-foreground mb-1">Justification</p><p className="bg-[--cs-warning-bg] p-2 rounded text-xs text-[--cs-warning]">{r.justification}</p></div>
                      <div><p className="font-medium text-muted-foreground mb-1">Description of Intervention</p><p className="text-xs">{r.description}</p></div>

                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Staff Involved</p>
                        <div className="space-y-1">{r.staff_involved.map((s, i) => (
                          <div key={i} className="text-xs flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">{getStaffName(s.staff_id)}</Badge>
                            <span>Role: {s.role}</span>
                            <span className="text-muted-foreground">Technique: {s.technique}</span>
                          </div>
                        ))}</div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="flex items-center gap-1 text-xs">{r.child_debriefed ? <CheckCircle2 className="h-3.5 w-3.5 text-[--cs-success]" /> : <AlertTriangle className="h-3.5 w-3.5 text-[--cs-risk]" />}<span>Child debriefed</span></div>
                        <div className="flex items-center gap-1 text-xs">{r.staff_debriefed ? <CheckCircle2 className="h-3.5 w-3.5 text-[--cs-success]" /> : <AlertTriangle className="h-3.5 w-3.5 text-[--cs-risk]" />}<span>Staff debriefed</span></div>
                        <div className="flex items-center gap-1 text-xs">{r.body_map_completed ? <CheckCircle2 className="h-3.5 w-3.5 text-[--cs-success]" /> : <AlertTriangle className="h-3.5 w-3.5 text-[--cs-risk]" />}<span>Body map</span></div>
                        <div className="flex items-center gap-1 text-xs">{r.medical_check_completed ? <CheckCircle2 className="h-3.5 w-3.5 text-[--cs-success]" /> : <AlertTriangle className="h-3.5 w-3.5 text-[--cs-risk]" />}<span>Medical check</span></div>
                      </div>

                      {r.child_debrief_notes && (
                        <div><p className="font-medium text-muted-foreground mb-1">Child Debrief</p>
                          <div className="bg-pink-50 p-2 rounded border border-pink-200 italic text-pink-900 text-xs">{r.child_debrief_notes}</div>
                        </div>
                      )}

                      {r.injuries.length > 0 && (
                        <div>
                          <p className="font-medium text-[--cs-risk] mb-1">Injuries</p>
                          {r.injuries.map((inj, i) => (
                            <div key={i} className="bg-[--cs-risk-bg] p-2 rounded text-xs text-[--cs-risk]">
                              <span className="font-medium">{inj.person}:</span> {inj.injury} — Treatment: {inj.treatment}
                            </div>
                          ))}
                        </div>
                      )}

                      {r.notifications_sent.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Notifications Sent</p>
                          <div className="space-y-0.5">{r.notifications_sent.map((n, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-[--cs-success]" /><span>{n.party}</span><span className="text-muted-foreground">{n.date}</span></div>
                          ))}</div>
                        </div>
                      )}

                      {r.review_notes && (
                        <div><p className="font-medium text-muted-foreground mb-1">Review Notes</p><p className="bg-[--cs-success-bg] p-2 rounded text-xs text-[--cs-success]">{r.review_notes}</p><p className="text-xs text-muted-foreground mt-1">Reviewed by: {getStaffName(r.reviewed_by)}</p></div>
                      )}

                      <SmartLinkPanel sourceType="restraint" sourceId={r.id} childId={r.child_id} compact />
                  </FlatListRowDetail>
                )}
              </div>
            );
          })}
        </FlatList>

        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Physical interventions must only be used as a last resort when all de-escalation has been exhausted. Under Regulation 35, the Registered Manager must review every use of restraint within 48 hours. Ofsted, the placing authority, and parents/guardians must be notified. Body maps and medical checks are mandatory. Children and staff must be debriefed.
            </span>
          </CardContent>
        </Card>
      </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Physical Intervention</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveRestraint} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Date</label><Input type="date" value={rlForm.date} onChange={(e) => setRL("date", e.target.value)} /></div>
              <div><label className="text-sm font-medium">Young Person *</label>
                <Select value={rlForm.child_id} onValueChange={(v) => setRL("child_id", v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => <SelectItem key={y.id} value={y.id}>{y.preferred_name ?? y.first_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {rlForm.child_id && (
              <>
                <InlinePracticeReasoning childId={rlForm.child_id} childName={YOUNG_PEOPLE.find((y) => y.id === rlForm.child_id)?.preferred_name ?? rlForm.child_id} />
                <InlinePracticeModules childId={rlForm.child_id} modules={["rights"]} />
              </>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Start Time</label><Input type="time" value={rlForm.start_time} onChange={(e) => setRL("start_time", e.target.value)} /></div>
              <div><label className="text-sm font-medium">End Time</label><Input type="time" value={rlForm.end_time} onChange={(e) => setRL("end_time", e.target.value)} /></div>
            </div>
            <div><label className="text-sm font-medium">Reason</label>
              <Select value={rlForm.reason} onValueChange={(v) => setRL("reason", v)}><SelectTrigger><SelectValue placeholder="Reason" /></SelectTrigger>
                <SelectContent>{Object.entries(REASON_META).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Antecedent</label>
              <Textarea placeholder="What led up to the incident?" rows={2} value={rlForm.antecedent} onChange={(e) => setRL("antecedent", e.target.value)} />
              <WritingAssistantInline value={rlForm.antecedent} onApplyText={(t) => setRL("antecedent", t)} recordType="incident" fieldName="antecedent" childId={rlForm.child_id || undefined} mode="standard" />
            </div>
            <div><label className="text-sm font-medium">De-escalation Attempts</label><Textarea placeholder="List all de-escalation attempts (one per line)" rows={2} value={rlForm.de_escalation_attempts} onChange={(e) => setRL("de_escalation_attempts", e.target.value)} /></div>
            <div>
              <label className="text-sm font-medium">Description *</label>
              <Textarea placeholder="Detailed description of the intervention…" rows={3} value={rlForm.description} onChange={(e) => setRL("description", e.target.value)} />
              <WritingAssistantInline value={rlForm.description} onApplyText={(t) => setRL("description", t)} recordType="incident" fieldName="description" childId={rlForm.child_id || undefined} mode="standard" />
            </div>
            <InlineCaraHeartPanel record={rlHeartRecord} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createRestraint.isPending}>{createRestraint.isPending ? "Saving…" : "Save Record"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Care Events pipeline — physical intervention &amp; restraint events routed here */}
      <CareEventsPanel
        title="Care Events — Restraint &amp; Physical Intervention"
        category={["physical_intervention", "restraint"]}
        days={60}
        defaultCollapsed
      />
      <div className="mt-4">
        <PacePanel context="PHYSICAL_INTERVENTION" title="PACE check — the relational stance during & after" />
      </div>
    </PageShell>
  );
}

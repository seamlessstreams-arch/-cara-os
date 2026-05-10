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
  Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Clock, GraduationCap, BookOpen, UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { toast } from "sonner";
import { useCMERecords, useCreateCMERecord } from "@/hooks/use-cme-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type {
  CMERecord, CMEStatus, AttendanceLevel,
} from "@/types/extended";
import {
  CME_STATUS_LABEL, ATTENDANCE_LEVEL_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── colour maps (snake_case keys — match DB schema) ─────────────────────── */

const STATUS_CLR: Record<CMEStatus, string> = {
  in_education: "bg-green-100 text-green-800", missing_education: "bg-red-100 text-red-800",
  part_time_timetable: "bg-amber-100 text-amber-800", exclusion: "bg-red-100 text-red-800",
  awaiting_placement: "bg-purple-100 text-purple-800", elective_home_ed: "bg-blue-100 text-blue-800",
};

const ATTEND_CLR: Record<AttendanceLevel, string> = {
  good: "bg-green-100 text-green-800", concerning: "bg-amber-100 text-amber-800",
  persistent_absence: "bg-orange-100 text-orange-800", severe_absence: "bg-red-100 text-red-800",
};

const BORDER_STATUS: Record<CMEStatus, string> = {
  in_education: "border-l-green-500", missing_education: "border-l-red-600",
  part_time_timetable: "border-l-amber-500", exclusion: "border-l-red-400",
  awaiting_placement: "border-l-purple-500", elective_home_ed: "border-l-blue-400",
};

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function ChildrenMissingEducationPage() {
  const { data: res, isLoading } = useCMERecords();
  const items = res?.data ?? [];
  const createMut = useCreateCMERecord();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAttendance, setFilterAttendance] = useState("all");
  const [sortBy, setSortBy] = useState("attendance-asc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── loading ────────────────────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <PageShell
        title="Children Missing Education"
        subtitle="Education Act 1996 · Children Act 2004 · CME Monitoring & Attendance Tracking"
      >
        <div />
      </PageShell>
    );
  }

  /* ── derived ────────────────────────────────────────────────────────────── */

  const filtered = (() => {
    let rows = items.filter((r) => {
      if (filterStatus !== "all" && r.current_status !== filterStatus) return false;
      if (filterAttendance !== "all" && r.attendance_level !== filterAttendance) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          getYPName(r.child_id).toLowerCase().includes(q) ||
          r.school.toLowerCase().includes(q) ||
          r.concerns.toLowerCase().includes(q) ||
          CME_STATUS_LABEL[r.current_status].toLowerCase().includes(q)
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "attendance-asc": return a.attendance_percentage - b.attendance_percentage;
        case "attendance-desc": return b.attendance_percentage - a.attendance_percentage;
        case "name-asc": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "name-desc": return getYPName(b.child_id).localeCompare(getYPName(a.child_id));
        default: return 0;
      }
    });
    return rows;
  })();

  /* ── stats ──────────────────────────────────────────────────────────────── */

  const totalChildren = items.length;
  const missingEd = items.filter((r) => r.current_status === "missing_education").length;
  const partTime = items.filter((r) => r.current_status === "part_time_timetable").length;
  const belowThreshold = items.filter((r) => r.attendance_percentage < 90).length;

  /* ── export ─────────────────────────────────────────────────────────────── */

  const exportCols: ExportColumn<CMERecord>[] = [
    { header: "Young Person", accessor: (r: CMERecord) => getYPName(r.child_id) },
    { header: "School", accessor: (r: CMERecord) => r.school },
    { header: "Year Group", accessor: (r: CMERecord) => r.year_group },
    { header: "Status", accessor: (r: CMERecord) => CME_STATUS_LABEL[r.current_status] },
    { header: "Attendance %", accessor: (r: CMERecord) => `${r.attendance_percentage}%` },
    { header: "Attendance Level", accessor: (r: CMERecord) => ATTENDANCE_LEVEL_LABEL[r.attendance_level] },
    { header: "Authorised Absences", accessor: (r: CMERecord) => r.authorised_absences.toString() },
    { header: "Unauthorised Absences", accessor: (r: CMERecord) => r.unauthorised_absences.toString() },
    { header: "Fixed-Term Exclusions", accessor: (r: CMERecord) => r.exclusions.fixed_term.toString() },
    { header: "Permanent Exclusions", accessor: (r: CMERecord) => r.exclusions.permanent.toString() },
    { header: "Part-Time Timetable", accessor: (r: CMERecord) => r.part_time_timetable ? "Yes" : "No" },
    { header: "SEN Status", accessor: (r: CMERecord) => r.sen_status },
    { header: "EHCP", accessor: (r: CMERecord) => r.ehcp_in_place ? "Yes" : "No" },
    { header: "Virtual School Contact", accessor: (r: CMERecord) => r.virtual_school_contact },
    { header: "Last PEP", accessor: (r: CMERecord) => r.last_pep_date },
    { header: "Next PEP", accessor: (r: CMERecord) => r.next_pep_date },
    { header: "Concerns", accessor: (r: CMERecord) => r.concerns },
  ];

  /* ── create handler ────────────────────────────────────────────────────── */

  const onSubmit = async (formData: Partial<CMERecord>) => {
    try {
      await createMut.mutateAsync(formData);
      toast.success("CME record created");
      setShowNew(false);
    } catch {
      toast.error("Failed to create CME record");
    }
  };

  /* ── render ─────────────────────────────────────────────────────────────── */

  return (
    <PageShell
      title="Children Missing Education"
      subtitle="Education Act 1996 · Children Act 2004 · CME Monitoring & Attendance Tracking"
      ariaContext={{ pageTitle: "Children Missing Education", sourceType: "incident" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Children Missing Education" />
          <ExportButton data={filtered} columns={exportCols} filename="children-missing-education" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Entry</Button>
          <AriaStudioQuickActionButton context={{ record_type: "education", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        {/* ── stat strip ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Children Tracked", value: totalChildren, icon: GraduationCap, clr: "text-blue-600" },
            { label: "Missing Education", value: missingEd, icon: UserX, clr: "text-red-600" },
            { label: "Part-Time Timetable", value: partTime, icon: Clock, clr: "text-amber-600" },
            { label: "Below 90% Attendance", value: belowThreshold, icon: AlertTriangle, clr: "text-orange-600" },
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

        {/* ── alert banner ─────────────────────────────────────────────────── */}
        {missingEd > 0 && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">{missingEd} child(ren) currently missing education</p>
              <p className="text-red-700">Local Authority must be notified of any child missing education. Ensure CME referral has been made, virtual school is aware, and alternative provision is being actively explored.</p>
            </div>
          </div>
        )}

        {/* ── filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, school, concerns..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[190px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{(Object.keys(CME_STATUS_LABEL) as CMEStatus[]).map((k) => (<SelectItem key={k} value={k}>{CME_STATUS_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterAttendance} onValueChange={setFilterAttendance}><SelectTrigger className="w-[190px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Attendance</SelectItem>{(Object.keys(ATTENDANCE_LEVEL_LABEL) as AttendanceLevel[]).map((k) => (<SelectItem key={k} value={k}>{ATTENDANCE_LEVEL_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[180px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="attendance-asc">Attendance (Low First)</SelectItem><SelectItem value="attendance-desc">Attendance (High First)</SelectItem><SelectItem value="name-asc">Name A-Z</SelectItem><SelectItem value="name-desc">Name Z-A</SelectItem></SelectContent></Select>
        </div>

        {/* ── records ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_STATUS[r.current_status])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getYPName(r.child_id)} — {r.school}
                        <Badge variant="outline" className={STATUS_CLR[r.current_status]}>{CME_STATUS_LABEL[r.current_status]}</Badge>
                        <Badge variant="outline" className={ATTEND_CLR[r.attendance_level]}>{r.attendance_percentage}% — {ATTENDANCE_LEVEL_LABEL[r.attendance_level]}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.year_group} · Authorised: {r.authorised_absences} · Unauthorised: {r.unauthorised_absences} · Exclusions: {r.exclusions.fixed_term} FTE, {r.exclusions.permanent} Perm
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.ehcp_in_place && <Badge variant="outline" className="bg-indigo-100 text-indigo-800">EHCP</Badge>}
                      {r.part_time_timetable && <Badge variant="outline" className="bg-amber-100 text-amber-800">PTT</Badge>}
                      {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* attendance & exclusion summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Attendance</p>
                        <p className="text-xs text-muted-foreground">{r.attendance_percentage}% ({ATTENDANCE_LEVEL_LABEL[r.attendance_level]})</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Authorised Absences</p>
                        <p className="text-xs text-muted-foreground">{r.authorised_absences}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Unauthorised Absences</p>
                        <p className="text-xs text-muted-foreground">{r.unauthorised_absences}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Current Exclusion</p>
                        <p className="text-xs text-muted-foreground">{r.current_exclusion ? "Yes" : "No"}</p>
                      </div>
                    </div>

                    {/* exclusion details */}
                    {r.exclusion_details && (
                      <div>
                        <p className="font-medium mb-1">Exclusion History</p>
                        <p className="text-muted-foreground">{r.exclusion_details}</p>
                      </div>
                    )}

                    {/* part-time timetable */}
                    {r.part_time_timetable && (
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="font-medium text-amber-800 mb-1">Part-Time Timetable</p>
                        <p className="text-amber-700 text-xs">{r.ptt_details}</p>
                        {r.ptt_review_date && (
                          <p className="text-amber-600 text-xs mt-1 font-medium">Next PTT Review: {r.ptt_review_date}</p>
                        )}
                      </div>
                    )}

                    {/* SEN & PEP */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-indigo-50 rounded-lg p-3">
                        <p className="font-medium text-indigo-800 mb-1">SEN Status</p>
                        <p className="text-indigo-700 text-xs">{r.sen_status}</p>
                        <p className="text-indigo-700 text-xs mt-1">EHCP: {r.ehcp_in_place ? "Yes — in place" : "No"}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="font-medium text-blue-800 mb-1">PEP Dates</p>
                        <p className="text-blue-700 text-xs">Last PEP: {r.last_pep_date}</p>
                        <p className="text-blue-700 text-xs">Next PEP: {r.next_pep_date}</p>
                      </div>
                    </div>

                    {/* virtual school contact */}
                    <div className="bg-muted/40 rounded p-3">
                      <p className="font-medium text-xs mb-1">Virtual School Contact</p>
                      <p className="text-xs text-muted-foreground">{r.virtual_school_contact}</p>
                    </div>

                    {/* actions taken */}
                    {r.actions_taken.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Actions Taken</p>
                        <ul className="list-disc list-inside space-y-1">
                          {r.actions_taken.map((a, i) => (
                            <li key={i} className="text-xs text-muted-foreground">{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* concerns */}
                    {r.concerns && (
                      <div className="bg-red-50 rounded-lg p-3">
                        <p className="font-medium text-red-800 mb-1">Concerns</p>
                        <p className="text-red-700 text-xs">{r.concerns}</p>
                      </div>
                    )}

                    {/* notes */}
                    {r.notes && (
                      <div>
                        <p className="font-medium mb-1">Notes</p>
                        <p className="text-muted-foreground">{r.notes}</p>
                      </div>
                    )}

                    {/* smart links */}
                    <SmartLinkPanel sourceType="cme-record" sourceId={r.id} childId={r.child_id} compact />

                    {/* footer */}
                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>{r.school} — {r.year_group}</span>
                      <span>Last PEP: {r.last_pep_date}</span>
                      <span>Next PEP: {r.next_pep_date}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── regulatory note ────────────────────────────────────────────── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Education Act 1996, s.436A — Local authorities must identify children not receiving suitable education. Children Act 2004 — duty to safeguard and promote welfare, including access to education. The Virtual School Head (VSH) has responsibility for monitoring and promoting the educational achievement of looked-after children. Personal Education Plans (PEPs) must be initiated within 20 school days of entering care and reviewed termly. Local authorities must be notified when a child is missing education or at risk of becoming so. Part-time timetables must be regularly reviewed and should not become a long-term arrangement without formal agreement.</p>
        </div>
      </div>

      {/* ── new entry dialog ──────────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New CME Record</DialogTitle></DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              onSubmit({
                child_id: fd.get("child_id") as string,
                school: fd.get("school") as string,
                year_group: fd.get("year_group") as string,
                current_status: fd.get("current_status") as CMEStatus,
                attendance_percentage: Number(fd.get("attendance_percentage")),
                attendance_level: fd.get("attendance_level") as AttendanceLevel,
                authorised_absences: Number(fd.get("authorised_absences")),
                unauthorised_absences: Number(fd.get("unauthorised_absences")),
                sen_status: fd.get("sen_status") as string,
                virtual_school_contact: fd.get("virtual_school_contact") as string,
                last_pep_date: fd.get("last_pep_date") as string,
                next_pep_date: fd.get("next_pep_date") as string,
                concerns: fd.get("concerns") as string,
                notes: fd.get("notes") as string,
              });
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Young Person</Label><Select name="child_id"><SelectTrigger><SelectValue placeholder="Select young person..." /></SelectTrigger><SelectContent><SelectItem value="yp_alex">Alex</SelectItem><SelectItem value="yp_jordan">Jordan</SelectItem><SelectItem value="yp_casey">Casey</SelectItem></SelectContent></Select></div>
              <div><Label>School / Setting</Label><Input name="school" placeholder="School name" /></div>
              <div><Label>Year Group</Label><Input name="year_group" placeholder="e.g. Year 9" /></div>
              <div><Label>Current Status</Label><Select name="current_status"><SelectTrigger><SelectValue placeholder="Select status..." /></SelectTrigger><SelectContent>{(Object.keys(CME_STATUS_LABEL) as CMEStatus[]).map((k) => (<SelectItem key={k} value={k}>{CME_STATUS_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
              <div><Label>Attendance %</Label><Input name="attendance_percentage" type="number" placeholder="e.g. 85" min={0} max={100} /></div>
              <div><Label>Attendance Level</Label><Select name="attendance_level"><SelectTrigger><SelectValue placeholder="Select level..." /></SelectTrigger><SelectContent>{(Object.keys(ATTENDANCE_LEVEL_LABEL) as AttendanceLevel[]).map((k) => (<SelectItem key={k} value={k}>{ATTENDANCE_LEVEL_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
              <div><Label>Authorised Absences</Label><Input name="authorised_absences" type="number" placeholder="0" min={0} /></div>
              <div><Label>Unauthorised Absences</Label><Input name="unauthorised_absences" type="number" placeholder="0" min={0} /></div>
              <div><Label>SEN Status</Label><Input name="sen_status" placeholder="e.g. No SEN, SEN Support, EHCP" /></div>
              <div><Label>Virtual School Contact</Label><Input name="virtual_school_contact" placeholder="Name and role" /></div>
              <div><Label>Last PEP Date</Label><Input name="last_pep_date" type="date" /></div>
              <div><Label>Next PEP Date</Label><Input name="next_pep_date" type="date" /></div>
              <div className="col-span-2"><Label>Concerns</Label><Textarea name="concerns" placeholder="Describe any current concerns..." rows={3} /></div>
              <div className="col-span-2"><Label>Notes</Label><Textarea name="notes" placeholder="Additional notes..." rows={3} /></div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createMut.isPending}>{createMut.isPending ? "Saving..." : "Save Record"}</Button>
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
        pageContext="Children Missing Education — school roll, off-roll, EOTAS, EHE, elective home education, exclusion, non-attendance, CME referral, LA education officer, PEP review, urgent action"
        recordType="education"
        className="mt-6"
      />
    </PageShell>
  );
}

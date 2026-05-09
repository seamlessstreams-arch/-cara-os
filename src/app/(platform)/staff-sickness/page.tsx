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
  Clock, Search, UserMinus, Calendar, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, STAFF } from "@/lib/seed-data";
import { useStaffSicknessRecords, useCreateStaffSicknessRecord } from "@/hooks/use-staff-sickness-records";
import { toast } from "sonner";
import type {
  StaffSicknessRecord,
  StaffSicknessCategory,
  StaffSicknessAbsenceReason,
  StaffSicknessRTWStatus,
} from "@/types/extended";
import {
  STAFF_SICKNESS_CATEGORY_LABEL,
  STAFF_SICKNESS_ABSENCE_REASON_LABEL,
  STAFF_SICKNESS_RTW_STATUS_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local config (colours not serializable) ─────────────────────────────── */

const CAT_CLR: Record<StaffSicknessCategory, string> = { short_term: "bg-blue-100 text-blue-800", long_term: "bg-red-100 text-red-800", intermittent: "bg-amber-100 text-amber-800", work_related: "bg-purple-100 text-purple-800" };
const RTW_CLR: Record<StaffSicknessRTWStatus, string> = { not_required: "bg-slate-100 text-slate-700", scheduled: "bg-blue-100 text-blue-800", completed: "bg-green-100 text-green-800", overdue: "bg-red-100 text-red-800" };

/* ── component ────────────────────────────────────────────────────────────── */

export default function StaffSicknessPage() {
  const { data: records = [], isLoading } = useStaffSicknessRecords();
  const createAbsence = useCreateStaffSicknessRecord();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterRTW, setFilterRTW] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showNew, setShowNew] = useState(false);

  const [ssForm, setSsForm] = useState({
    staff_id: "",
    date_started: new Date().toISOString().slice(0, 10),
    reason: "" as StaffSicknessAbsenceReason | "",
    reason_detail: "",
    cover_arrangements: "",
  });
  const setSSF = (k: keyof typeof ssForm, v: string) => setSsForm((p) => ({ ...p, [k]: v }));

  const handleCreateAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssForm.staff_id || !ssForm.reason) {
      toast.error("Staff member and reason are required.");
      return;
    }
    await createAbsence.mutateAsync({
      staff_id: ssForm.staff_id,
      date_started: ssForm.date_started,
      date_ended: null,
      total_days: 1,
      category: "short_term" as StaffSicknessCategory,
      reason: ssForm.reason as StaffSicknessAbsenceReason,
      reason_detail: ssForm.reason_detail,
      self_certified: true,
      fit_note: false,
      fit_note_expiry: null,
      cover_arrangements: ssForm.cover_arrangements,
      rtw_status: "not_required" as StaffSicknessRTWStatus,
      rtw_date: null,
      rtw_conducted_by_id: null,
      rtw_outcome: "",
      occupational_health_referral: false,
      trigger_points: [],
      manager_notes: "",
    });
    toast.success("Sickness absence logged.");
    setSsForm({ staff_id: "", date_started: new Date().toISOString().slice(0, 10), reason: "", reason_detail: "", cover_arrangements: "" });
    setShowNew(false);
  };

  const filtered = useMemo(() => {
    let rows = [...records];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        getStaffName(r.staff_id).toLowerCase().includes(q) ||
        STAFF_SICKNESS_ABSENCE_REASON_LABEL[r.reason].toLowerCase().includes(q)
      );
    }
    if (filterCategory !== "all") rows = rows.filter((r) => r.category === filterCategory);
    if (filterRTW !== "all") rows = rows.filter((r) => r.rtw_status === filterRTW);
    rows.sort((a, b) => sortBy === "newest" ? b.date_started.localeCompare(a.date_started) : a.date_started.localeCompare(b.date_started));
    return rows;
  }, [records, search, filterCategory, filterRTW, sortBy]);

  const totalAbsences = records.length;
  const totalDays = records.reduce((s, r) => s + r.total_days, 0);
  const currentlyOff = records.filter((r) => r.date_ended === null).length;
  const rtwOverdue = records.filter((r) => r.rtw_status === "overdue").length;

  const exportCols: ExportColumn<StaffSicknessRecord>[] = [
    { header: "Staff", accessor: (r: StaffSicknessRecord) => getStaffName(r.staff_id) },
    { header: "Start", accessor: (r: StaffSicknessRecord) => r.date_started },
    { header: "End", accessor: (r: StaffSicknessRecord) => r.date_ended || "Ongoing" },
    { header: "Days", accessor: (r: StaffSicknessRecord) => String(r.total_days) },
    { header: "Category", accessor: (r: StaffSicknessRecord) => STAFF_SICKNESS_CATEGORY_LABEL[r.category] },
    { header: "Reason", accessor: (r: StaffSicknessRecord) => STAFF_SICKNESS_ABSENCE_REASON_LABEL[r.reason] },
    { header: "Fit Note", accessor: (r: StaffSicknessRecord) => r.fit_note ? "Yes" : "No" },
    { header: "RTW Status", accessor: (r: StaffSicknessRecord) => STAFF_SICKNESS_RTW_STATUS_LABEL[r.rtw_status] },
    { header: "OH Referral", accessor: (r: StaffSicknessRecord) => r.occupational_health_referral ? "Yes" : "No" },
  ];

  if (isLoading) {
    return (
      <PageShell title="Staff Sickness & Return to Work" subtitle="Absence Management · Wellbeing · Workforce Planning">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Staff Sickness & Return to Work"
      subtitle="Absence Management · Wellbeing · Workforce Planning"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Staff Sickness Record" />
          <ExportButton data={records} columns={exportCols} filename="staff-sickness" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Log Absence</Button>
        </div>
      }
    >
      <div id="print-area">
        {/* stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Absences (Year)", value: totalAbsences, icon: UserMinus, clr: "text-blue-600" },
            { label: "Total Days Lost", value: totalDays, icon: Calendar, clr: "text-amber-600" },
            { label: "Currently Off", value: currentlyOff, icon: Clock, clr: "text-red-600" },
            { label: "RTW Overdue", value: rtwOverdue, icon: AlertTriangle, clr: "text-red-600" },
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
            <Input className="pl-8" placeholder="Search staff, reasons..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {(Object.entries(STAFF_SICKNESS_CATEGORY_LABEL) as [StaffSicknessCategory, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterRTW} onValueChange={setFilterRTW}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="RTW Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All RTW</SelectItem>
              {(Object.entries(STAFF_SICKNESS_RTW_STATUS_LABEL) as [StaffSicknessRTWStatus, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}>
            <ArrowUpDown className="h-4 w-4 mr-1" />{sortBy === "newest" ? "Newest" : "Oldest"}
          </Button>
        </div>

        {/* absence cards */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", r.date_ended === null ? "border-l-red-500" : r.total_days > 7 ? "border-l-amber-400" : "border-l-green-400")}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getStaffName(r.staff_id)}
                        <Badge variant="outline" className={CAT_CLR[r.category]}>{STAFF_SICKNESS_CATEGORY_LABEL[r.category]}</Badge>
                        <Badge variant="outline" className={RTW_CLR[r.rtw_status]}>{STAFF_SICKNESS_RTW_STATUS_LABEL[r.rtw_status]}</Badge>
                        {r.occupational_health_referral && <Badge variant="outline" className="bg-purple-100 text-purple-800">OH Referral</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {STAFF_SICKNESS_ABSENCE_REASON_LABEL[r.reason]} · {r.date_started} → {r.date_ended || "Ongoing"} · {r.total_days} day(s)
                        {r.fit_note && " · Fit Note"} {r.self_certified && " · Self-Cert"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{r.total_days}d</span>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* reason detail */}
                    <div>
                      <p className="font-medium mb-1">Absence Details</p>
                      <p className="text-muted-foreground text-xs">{r.reason_detail}</p>
                    </div>

                    {/* cover */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="font-medium text-xs text-blue-800 mb-1">Cover Arrangements</p>
                      <p className="text-xs text-blue-700">{r.cover_arrangements}</p>
                    </div>

                    {/* RTW */}
                    {r.rtw_outcome && (
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <p className="font-medium text-xs text-green-800 mb-1">Return to Work Interview</p>
                        <p className="text-xs text-green-700">
                          {r.rtw_date && `Date: ${r.rtw_date}`}
                          {r.rtw_conducted_by_id && ` · Conducted by: ${getStaffName(r.rtw_conducted_by_id)}`}
                        </p>
                        <p className="text-xs text-green-700 mt-1">{r.rtw_outcome}</p>
                      </div>
                    )}

                    {/* trigger points */}
                    {r.trigger_points.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Trigger Points / Actions</p>
                        <div className="flex flex-wrap gap-1">
                          {r.trigger_points.map((t, i) => (
                            <Badge key={i} variant="outline" className="bg-amber-50 text-amber-700 text-xs">{t}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* summary grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">Self-Certified</p>
                        <p className="text-xs font-bold">{r.self_certified ? "Yes" : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">Fit Note</p>
                        <p className="text-xs font-bold">{r.fit_note ? `Yes (exp: ${r.fit_note_expiry})` : "N/A"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">OH Referral</p>
                        <p className="text-xs font-bold">{r.occupational_health_referral ? "Yes" : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">Duration</p>
                        <p className="text-xs font-bold">{r.total_days} day(s)</p>
                      </div>
                    </div>

                    {/* manager notes */}
                    <div><p className="font-medium mb-1">Manager Notes</p><p className="text-muted-foreground text-xs">{r.manager_notes}</p></div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* policy note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Absence Management Policy</p>
          <p>All sickness absences must be recorded. Staff must notify the home as early as possible (minimum 1 hour before shift start). Self-certification covers up to 7 days; a GP fit note is required for absences exceeding 7 calendar days. Return to work interviews must be conducted after every absence regardless of length. The Bradford Factor is monitored — trigger points are: Score 100 (informal discussion), Score 250 (formal meeting), Score 500 (final review). Occupational health referrals should be made for absences exceeding 14 days or where a pattern of concern is identified. All records are confidential and stored in accordance with GDPR. Cover arrangements must be documented to demonstrate continuity of care for children.</p>
        </div>
      </div>

      {/* new absence dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Sickness Absence</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateAbsence} className="space-y-3">
            <div>
              <Label>Staff Member *</Label>
              <Select value={ssForm.staff_id} onValueChange={(v) => setSSF("staff_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>{STAFF.filter((s) => s.employment_status === "active").map((s) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Date Started</Label><Input type="date" value={ssForm.date_started} onChange={(e) => setSSF("date_started", e.target.value)} /></div>
            <div>
              <Label>Reason *</Label>
              <Select value={ssForm.reason} onValueChange={(v) => setSSF("reason", v)}>
                <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(STAFF_SICKNESS_ABSENCE_REASON_LABEL) as [StaffSicknessAbsenceReason, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Details</Label><Textarea placeholder="Describe symptoms and circumstances..." value={ssForm.reason_detail} onChange={(e) => setSSF("reason_detail", e.target.value)} /></div>
            <div><Label>Cover Arrangements</Label><Textarea placeholder="How will shifts be covered?" value={ssForm.cover_arrangements} onChange={(e) => setSSF("cover_arrangements", e.target.value)} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createAbsence.isPending}>{createAbsence.isPending ? "Logging…" : "Log Absence"}</Button>
            </DialogFooter>
          </form>
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

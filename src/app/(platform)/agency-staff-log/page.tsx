"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
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
  Clock, Search, Users, UserCheck, Shield, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { toast } from "sonner";
import { useAgencyStaffLog } from "@/hooks/use-agency-staff-log";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { AgencyVettingStatus, AgencyBookingReason, AgencyStaffRecord } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const VETTING_LABEL: Record<AgencyVettingStatus, string> = { fully_vetted: "Fully Vetted", partially_vetted: "Partially Vetted", pending: "Pending", expired: "Expired" };
const VETTING_CLR: Record<AgencyVettingStatus, string> = { fully_vetted: "bg-green-100 text-green-800", partially_vetted: "bg-amber-100 text-amber-800", pending: "bg-red-100 text-red-800", expired: "bg-red-200 text-red-900" };
const VETTING_BORDER: Record<AgencyVettingStatus, string> = { fully_vetted: "border-l-green-400", partially_vetted: "border-l-amber-400", pending: "border-l-red-500", expired: "border-l-red-700" };

const REASON_LABEL: Record<AgencyBookingReason, string> = {
  sickness_cover: "Sickness Cover", vacancy_cover: "Vacancy Cover", annual_leave: "Annual Leave Cover",
  training_cover: "Training Cover", additional_support: "Additional Support", emergency: "Emergency Cover",
};

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function AgencyStaffLogPage() {
  const { data: result, isLoading } = useAgencyStaffLog();
  const records = result?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterVetting, setFilterVetting] = useState("all");
  const [filterReason, setFilterReason] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    let rows = [...records];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r.worker_name.toLowerCase().includes(q) ||
        r.agency_name.toLowerCase().includes(q) ||
        r.worker_ref.toLowerCase().includes(q)
      );
    }
    if (filterVetting !== "all") rows = rows.filter((r) => r.vetting_status === filterVetting);
    if (filterReason !== "all") rows = rows.filter((r) => r.booking_reason === filterReason);
    rows.sort((a, b) => sortBy === "newest" ? b.date_of_shift.localeCompare(a.date_of_shift) : a.date_of_shift.localeCompare(b.date_of_shift));
    return rows;
  }, [records, search, filterVetting, filterReason, sortBy]);

  const totalShifts = records.length;
  const totalHours = records.reduce((s, r) => s + r.shift_hours, 0);
  const totalCost = records.reduce((s, r) => s + (r.shift_hours * r.cost_per_hour), 0);
  const withConcerns = records.filter((r) => r.concerns.length > 0).length;
  const uniqueWorkers = new Set(records.map((r) => r.worker_ref)).size;

  const exportCols: ExportColumn<AgencyStaffRecord>[] = [
    { header: "Date", accessor: (r: AgencyStaffRecord) => r.date_of_shift },
    { header: "Worker", accessor: (r: AgencyStaffRecord) => r.worker_name },
    { header: "Ref", accessor: (r: AgencyStaffRecord) => r.worker_ref },
    { header: "Agency", accessor: (r: AgencyStaffRecord) => r.agency_name },
    { header: "Shift", accessor: (r: AgencyStaffRecord) => r.shift_type },
    { header: "Hours", accessor: (r: AgencyStaffRecord) => String(r.shift_hours) },
    { header: "Reason", accessor: (r: AgencyStaffRecord) => REASON_LABEL[r.booking_reason] },
    { header: "Vetting", accessor: (r: AgencyStaffRecord) => VETTING_LABEL[r.vetting_status] },
    { header: "Induction", accessor: (r: AgencyStaffRecord) => r.induction_completed ? "Yes" : "No" },
    { header: "Score", accessor: (r: AgencyStaffRecord) => r.feedback_score !== null ? `${r.feedback_score}/5` : "N/A" },
    { header: "Cost/hr", accessor: (r: AgencyStaffRecord) => `£${r.cost_per_hour.toFixed(2)}` },
  ];

  if (isLoading) {
    return (
      <PageShell title="Agency Staff Log" subtitle="Reg 32 · Fitness of Workers · Safer Recruitment · Agency Vetting">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Agency Staff Log"
      subtitle="Reg 32 · Fitness of Workers · Safer Recruitment · Agency Vetting"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Agency Staff Log" />
          <ExportButton data={records} columns={exportCols} filename="agency-staff-log" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Log Agency Shift</Button>
        </div>
      }
    >
      <div id="print-area">
        {/* stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Shifts", value: totalShifts, icon: Users, clr: "text-blue-600" },
            { label: "Total Hours", value: totalHours, icon: Clock, clr: "text-amber-600" },
            { label: "Unique Workers", value: uniqueWorkers, icon: UserCheck, clr: "text-purple-600" },
            { label: "With Concerns", value: withConcerns, icon: AlertTriangle, clr: "text-red-600" },
            { label: "Total Cost", value: `£${totalCost.toFixed(0)}`, icon: Shield, clr: "text-green-600" },
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
            <Input className="pl-8" placeholder="Search workers, agencies..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterVetting} onValueChange={setFilterVetting}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Vetting" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vetting</SelectItem>
              {(Object.entries(VETTING_LABEL) as [AgencyVettingStatus, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterReason} onValueChange={setFilterReason}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Reason" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reasons</SelectItem>
              {(Object.entries(REASON_LABEL) as [AgencyBookingReason, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}>
            <ArrowUpDown className="h-4 w-4 mr-1" />{sortBy === "newest" ? "Newest" : "Oldest"}
          </Button>
        </div>

        {/* concerns alert */}
        {withConcerns > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">{withConcerns} shift(s) with concerns recorded</p>
              <p className="text-amber-700">All concerns about agency staff must be fed back to the supplying agency in writing. Concerns about safeguarding must be escalated to the LADO. Persistent concerns should result in the worker being removed from the preferred list.</p>
            </div>
          </div>
        )}

        {/* shift cards */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", VETTING_BORDER[r.vetting_status])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {r.worker_name} ({r.worker_ref})
                        <Badge variant="outline" className={VETTING_CLR[r.vetting_status]}>{VETTING_LABEL[r.vetting_status]}</Badge>
                        <Badge variant="outline" className="bg-muted/50">{REASON_LABEL[r.booking_reason]}</Badge>
                        {r.concerns && <Badge variant="outline" className="bg-red-100 text-red-800">Concern</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.agency_name} · {r.date_of_shift} · {r.shift_type} · {r.shift_hours}hrs
                        {r.covering_for_id && ` · Covering: ${getStaffName(r.covering_for_id)}`}
                        {" "}· Auth: {getStaffName(r.authorised_by_id)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.feedback_score !== null && (
                        <Badge variant="outline" className={cn(
                          r.feedback_score >= 4 ? "bg-green-100 text-green-800" :
                          r.feedback_score >= 3 ? "bg-amber-100 text-amber-800" :
                          "bg-red-100 text-red-800"
                        )}>{r.feedback_score}/5</Badge>
                      )}
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* compliance checklist */}
                    <div>
                      <p className="font-medium mb-1">Compliance Checklist</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { label: "DBS Enhanced", ok: r.dbs_enhanced },
                          { label: "Induction", ok: r.induction_completed },
                          { label: "Safeguarding Brief", ok: r.safeguarding_briefing },
                          { label: "YP Briefing", ok: r.young_people_briefing },
                          { label: "Medication Trained", ok: r.medication_trained },
                          { label: "PRICE Trained", ok: !!r.price_trained_level },
                        ].map((c) => (
                          <div key={c.label} className="flex items-center gap-1.5 text-xs">
                            {c.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                            <span className={c.ok ? "" : "text-red-700 font-medium"}>{c.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* DBS details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">DBS Number</p>
                        <p className="text-xs font-bold">{r.dbs_number}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">DBS Date</p>
                        <p className="text-xs font-bold">{r.dbs_date}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">PRICE Level</p>
                        <p className="text-xs font-bold">{r.price_trained_level || "None"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">Cost/Hour</p>
                        <p className="text-xs font-bold">£{r.cost_per_hour.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* induction */}
                    {r.induction_completed && r.induction_date && r.induction_by && (
                      <div className="bg-green-50 border border-green-200 rounded p-2">
                        <p className="text-xs"><span className="font-medium text-green-800">Induction completed:</span> <span className="text-green-700">{r.induction_date} by {getStaffName(r.induction_by)}</span></p>
                      </div>
                    )}
                    {!r.induction_completed && (
                      <div className="bg-red-50 border border-red-200 rounded p-2">
                        <p className="text-xs font-medium text-red-800">⚠ Full induction NOT completed — verbal briefing only</p>
                      </div>
                    )}

                    {/* feedback */}
                    {r.feedback_notes && (
                      <div>
                        <p className="font-medium mb-1">Shift Feedback</p>
                        <p className="text-muted-foreground text-xs">{r.feedback_notes}</p>
                      </div>
                    )}

                    {/* concerns */}
                    {r.concerns && (
                      <div className="bg-red-50 border border-red-200 rounded p-2">
                        <p className="font-medium text-xs text-red-800 mb-1">Concerns</p>
                        <p className="text-xs text-red-700">{r.concerns}</p>
                      </div>
                    )}

                    {/* notes */}
                    <div><p className="font-medium mb-1">Notes</p><p className="text-muted-foreground text-xs">{r.notes}</p></div>

                    {/* smart links */}
                    <SmartLinkPanel sourceType="agency_staff_log" sourceId={r.id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Children&apos;s Homes (England) Regulations 2015, Reg 32 — the registered person must ensure that all persons working at the home (including agency staff) are of integrity and good character, have the qualifications, skills, and experience necessary, and are physically and mentally fit. Agency workers must have enhanced DBS checks, receive a local induction (including safeguarding, YP profiles, emergency procedures), and be briefed on behaviour support plans. The home must maintain records of all agency usage, including vetting checks, induction records, and any concerns. Agency use should be minimised and monitored via Reg 44/45 reporting.</p>
        </div>
      </div>

      {/* new shift dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Agency Shift</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Agency Name</Label><Input placeholder="e.g. CareStaff Solutions" /></div>
            <div><Label>Worker Name</Label><Input placeholder="Full name" /></div>
            <div><Label>Worker Reference</Label><Input placeholder="e.g. CSS-4821" /></div>
            <div><Label>Date of Shift</Label><Input type="date" /></div>
            <div>
              <Label>Shift Type</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day Shift (08:00–20:00)</SelectItem>
                  <SelectItem value="night">Waking Night (20:00–08:00)</SelectItem>
                  <SelectItem value="short">Short Shift (08:00–14:00)</SelectItem>
                  <SelectItem value="late">Late Shift (14:00–22:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Booking Reason</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(REASON_LABEL) as [AgencyBookingReason, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>DBS Number</Label><Input placeholder="DBS reference" /></div>
            <div><Label>Notes</Label><Textarea placeholder="Shift notes, feedback..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={() => setShowNew(false)}>Log Shift</Button>
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

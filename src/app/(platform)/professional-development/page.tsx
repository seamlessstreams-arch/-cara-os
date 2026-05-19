"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  GraduationCap,
  BookOpen,
  Award,
  Users,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  ArrowUpDown,
  Shield,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCpdRecords } from "@/hooks/use-cpd-records";
import type { CPDRecord, CPDType, CPDStatus } from "@/types/extended";
import { CPD_TYPE_LABEL, CPD_STATUS_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── local colour maps ────────────────────────────────────────────────────── */

const TYPE_COLOUR: Record<CPDType, string> = {
  qualification: "bg-purple-100 text-purple-800",
  training: "bg-blue-100 text-blue-800",
  conference: "bg-amber-100 text-amber-800",
  reflective_account: "bg-green-100 text-green-800",
  mentoring: "bg-indigo-100 text-indigo-800",
  shadowing: "bg-pink-100 text-pink-800",
};

const STATUS_COLOUR: Record<CPDStatus, string> = {
  completed: "bg-emerald-100 text-emerald-800",
  in_progress: "bg-blue-100 text-blue-800",
  planned: "bg-slate-100 text-[var(--cs-text-secondary)]",
};

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

/* ── component ─────────────────────────────────────────────────────────────── */

export default function ProfessionalDevelopmentPage() {
  const { data: records = [], isLoading } = useCpdRecords();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);
  const staffIds = useMemo(() => [...new Set(records.map(r => r.staff_id))], [records]);

  /* ── filtering & sorting ── */
  const filtered = useMemo(() => {
    let out = [...records];
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(r =>
        r.title.toLowerCase().includes(s) ||
        getStaffName(r.staff_id).toLowerCase().includes(s) ||
        r.provider.toLowerCase().includes(s)
      );
    }
    if (typeFilter !== "all") out = out.filter(r => r.type === typeFilter);
    if (staffFilter !== "all") out = out.filter(r => r.staff_id === staffFilter);
    out.sort((a, b) => {
      if (sortBy === "oldest") return a.start_date.localeCompare(b.start_date);
      if (sortBy === "hours") return b.cpd_hours - a.cpd_hours;
      return b.start_date.localeCompare(a.start_date);
    });
    return out;
  }, [records, search, typeFilter, staffFilter, sortBy]);

  /* ── summary stats ── */
  const totalHours = useMemo(() => records.reduce((sum, r) => sum + r.cpd_hours, 0), [records]);
  const avgPerStaff = useMemo(() => staffIds.length > 0 ? Math.round(totalHours / staffIds.length) : 0, [totalHours, staffIds.length]);
  const qualificationsInProgress = useMemo(() => records.filter(r => r.type === "qualification" && r.status === "in_progress").length, [records]);
  const completedThisQuarter = useMemo(() => records.filter(r => r.completed_date && r.completed_date >= d(-90)).length, [records]);

  /* ── export columns ── */
  const exportCols: ExportColumn<CPDRecord>[] = useMemo(() => [
    { header: "Staff", accessor: (r) => getStaffName(r.staff_id) },
    { header: "Title", accessor: (r) => r.title },
    { header: "Type", accessor: (r) => CPD_TYPE_LABEL[r.type] },
    { header: "Provider", accessor: (r) => r.provider },
    { header: "Start Date", accessor: (r) => r.start_date },
    { header: "Completed", accessor: (r) => r.completed_date ?? "In progress" },
    { header: "Duration", accessor: (r) => r.duration },
    { header: "Status", accessor: (r) => CPD_STATUS_LABEL[r.status] },
    { header: "CPD Hours", accessor: (r) => String(r.cpd_hours) },
    { header: "Certificate", accessor: (r) => r.certificate_obtained ? "Yes" : "No" },
    { header: "Impact on Practice", accessor: (r) => r.impact_on_practice },
    { header: "Notes", accessor: (r) => r.notes },
  ], []);

  if (isLoading) {
    return (
      <PageShell title="Professional Development" subtitle="CPD records, qualifications, conferences, and learning activities">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Professional Development"
      subtitle="CPD records, qualifications, conferences, and learning activities"
      ariaContext={{ pageTitle: "Professional Development Records", sourceType: "staff" }}
      actions={[
        <PrintButton key="p" title="Professional Development Records" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="professional-development" />,
        <AriaStudioQuickActionButton key="a" context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />,
      ]}
    >
      <div id="print-area" className="space-y-6">
        {/* ── summary stats ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total CPD Hours (Team)", value: totalHours, icon: Clock, colour: "text-blue-600" },
            { label: "Average per Staff", value: `${avgPerStaff} hrs`, icon: Users, colour: "text-indigo-600" },
            { label: "Qualifications In Progress", value: qualificationsInProgress, icon: GraduationCap, colour: "text-purple-600" },
            { label: "Completed This Quarter", value: completedThisQuarter, icon: CheckCircle2, colour: "text-emerald-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 flex items-center gap-3">
                <s.icon className={cn("h-8 w-8", s.colour)} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── filters ────────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[180px]">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Title, staff, provider…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="w-44">
                <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {(Object.entries(CPD_TYPE_LABEL) as [CPDType, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40">
                <Label className="text-xs">Staff</Label>
                <Select value={staffFilter} onValueChange={setStaffFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {staffIds.map(id => (
                      <SelectItem key={id} value={id}>{getStaffName(id)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-36">
                <Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="hours">Most Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── results count ──────────────────────────────────────────────── */}
        {(search || typeFilter !== "all" || staffFilter !== "all") && (
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {records.length} record{records.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* ── CPD record cards ───────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expandedId === r.id;
            return (
              <Card key={r.id} className={cn(r.status === "in_progress" && "border-blue-200")}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{r.title}</CardTitle>
                        <Badge className={cn("text-xs", TYPE_COLOUR[r.type])}>{CPD_TYPE_LABEL[r.type]}</Badge>
                        <Badge className={cn("text-xs", STATUS_COLOUR[r.status])}>{CPD_STATUS_LABEL[r.status]}</Badge>
                        {r.certificate_obtained && <Badge className="text-xs bg-amber-100 text-amber-800"><Award className="h-3 w-3 mr-0.5" />Certificate</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{r.start_date} · {getStaffName(r.staff_id)}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{r.provider}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.duration}</span>
                      <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{r.cpd_hours} CPD hours</span>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-3 pt-0">
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-1">Notes</p>
                      <p className="text-sm text-blue-900">{r.notes}</p>
                    </div>
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                      <p className="text-xs font-semibold text-green-800 mb-1">Impact on Practice</p>
                      <p className="text-sm text-green-900">{r.impact_on_practice}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="rounded-lg bg-slate-50 border p-2">
                        <p className="font-semibold text-[var(--cs-text-secondary)]">Start Date</p>
                        <p className="text-[var(--cs-navy)]">{r.start_date}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 border p-2">
                        <p className="font-semibold text-[var(--cs-text-secondary)]">Completed</p>
                        <p className="text-[var(--cs-navy)]">{r.completed_date ?? "Ongoing"}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 border p-2">
                        <p className="font-semibold text-[var(--cs-text-secondary)]">CPD Hours</p>
                        <p className="text-[var(--cs-navy)]">{r.cpd_hours}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 border p-2">
                        <p className="font-semibold text-[var(--cs-text-secondary)]">Certificate</p>
                        <p className="text-[var(--cs-navy)]">{r.certificate_obtained ? "Yes" : "No"}</p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── regulatory note ────────────────────────────────────────────── */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" />Workforce Development — Regulatory Context</p>
          <p>
            Regulation 33 (Schedule 2) requires the registered person to ensure staff receive appropriate training, professional development, and supervision. All residential care workers must hold or be working towards the Level 3 Diploma for Residential Childcare (or equivalent) within two years of starting in post. The registered manager must hold the Level 5 Diploma in Leadership and Management for Residential Childcare.
          </p>
          <p>
            CPD records should be reviewed regularly to ensure workforce development aligns with the home&apos;s Statement of Purpose and the needs of the children in placement. Evidence of impact on practice is critical — Ofsted inspectors look for how learning translates into improved outcomes for children.
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Professional Development Records — staff CPD, training courses, diplomas, Level 3/5, QCF, supervision goals, reflective practice, career development, mandatory training"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}

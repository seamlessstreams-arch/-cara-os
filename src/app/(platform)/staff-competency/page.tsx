"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Plus,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Circle,
  ShieldCheck,
  XCircle,
  Award,
  Users,
  BarChart3,
  Loader2,
} from "lucide-react";
import { PageShell }    from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge }        from "@/components/ui/badge";
import { cn }           from "@/lib/utils";
import { getStaffName, STAFF } from "@/lib/seed-data";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useStaffCompetencyRecords, useCreateStaffCompetencyRecord } from "@/hooks/use-staff-competency-records";
import type { StaffCompetencyRecord, StaffCompetencyLevel } from "@/types/extended";
import { STAFF_COMPETENCY_LEVEL_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── local config ─────────────────────────────────────────────────────── */

const LEVEL_META: Record<StaffCompetencyLevel, { label: string; colour: string; icon: typeof CheckCircle2 }> = {
  competent:    { label: "Competent",     colour: "bg-green-100 text-green-700",  icon: CheckCircle2 },
  developing:   { label: "Developing",    colour: "bg-blue-100 text-blue-700",    icon: Clock },
  not_assessed: { label: "Not Assessed",  colour: "bg-gray-100 text-gray-700",    icon: Circle },
  expired:      { label: "Expired",       colour: "bg-red-100 text-red-700",      icon: XCircle },
};

const COMPETENCY_AREAS = [
  "Safeguarding (Level 3)",
  "Medication Administration",
  "TCI/Restraint",
  "First Aid",
  "Fire Safety",
  "Record Keeping",
  "Key Working",
  "Lone Working",
  "ASD Awareness",
  "Exploitation Awareness",
] as const;

/* ── component ─────────────────────────────────────────────────────────── */

export default function StaffCompetencyPage() {
  const { data: records = [], isLoading } = useStaffCompetencyRecords();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showDialog, setShowDialog] = useState(false);

  const createCompetency = useCreateStaffCompetencyRecord();
  const [scForm, setScForm] = useState({ staff_id: "", area: "", level: "not_assessed" as StaffCompetencyLevel, assessed_date: new Date().toISOString().slice(0, 10), assessed_by: "", expiry_date: "", notes: "" });
  const setSC = (k: string, v: unknown) => setScForm((p) => ({ ...p, [k]: v }));

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    const staff = STAFF.find((s) => s.id === scForm.staff_id);
    if (!staff) { toast.error("Please select a staff member."); return; }
    if (!scForm.area) { toast.error("Please select a competency area."); return; }
    await createCompetency.mutateAsync({ staff_id: scForm.staff_id, staff_name: staff.full_name, role: staff.role ?? "", entries: [{ id: crypto.randomUUID(), area: scForm.area, level: scForm.level, assessed_date: scForm.assessed_date || null, assessed_by: scForm.assessed_by || null, expiry_date: scForm.expiry_date || null, notes: scForm.notes.trim() }] });
    toast.success("Competency assessment saved.");
    setScForm({ staff_id: "", area: "", level: "not_assessed", assessed_date: new Date().toISOString().slice(0, 10), assessed_by: "", expiry_date: "", notes: "" });
    setShowDialog(false);
  };

  /* ── stats ────────────────────────────────────────────────────────────── */

  const stats = useMemo(() => {
    const allEntries = records.flatMap((s) => s.entries);
    const total = allEntries.length;
    const competent = allEntries.filter((e) => e.level === "competent").length;
    const developing = allEntries.filter((e) => e.level === "developing").length;
    const notAssessed = allEntries.filter((e) => e.level === "not_assessed").length;
    const expired = allEntries.filter((e) => e.level === "expired").length;

    const expiringSoon = allEntries.filter((e) => {
      if (!e.expiry_date || e.level === "expired") return false;
      const days = Math.ceil((new Date(e.expiry_date).getTime() - Date.now()) / 86400000);
      return days > 0 && days <= 90;
    }).length;

    const compliancePct = total > 0 ? Math.round((competent / total) * 100) : 0;
    const fullyCompetent = records.filter((s) => s.entries.every((e) => e.level === "competent")).length;

    return { total, competent, developing, notAssessed, expired, expiringSoon, compliancePct, fullyCompetent };
  }, [records]);

  /* ── alerts ───────────────────────────────────────────────────────────── */

  const alerts = useMemo(() => {
    const items: { staffName: string; area: string; type: "expired" | "expiring"; expiryDate: string }[] = [];
    records.forEach((s) => {
      s.entries.forEach((e) => {
        if (e.level === "expired") {
          items.push({ staffName: s.staff_name, area: e.area, type: "expired", expiryDate: e.expiry_date || "" });
        } else if (e.expiry_date) {
          const days = Math.ceil((new Date(e.expiry_date).getTime() - Date.now()) / 86400000);
          if (days > 0 && days <= 90) {
            items.push({ staffName: s.staff_name, area: e.area, type: "expiring", expiryDate: e.expiry_date });
          }
        }
      });
    });
    return items;
  }, [records]);

  /* ── filter + sort ────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterLevel !== "all") {
      list = list.filter((s) => s.entries.some((e) => e.level === filterLevel));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.staff_name.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.entries.some((e) => e.area.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "compliance": {
          const aPct = a.entries.length > 0 ? a.entries.filter((e) => e.level === "competent").length / a.entries.length : 0;
          const bPct = b.entries.length > 0 ? b.entries.filter((e) => e.level === "competent").length / b.entries.length : 0;
          return aPct - bPct;
        }
        case "issues": {
          const aIssues = a.entries.filter((e) => e.level === "expired" || e.level === "not_assessed").length;
          const bIssues = b.entries.filter((e) => e.level === "expired" || e.level === "not_assessed").length;
          return bIssues - aIssues;
        }
        default: return a.staff_name.localeCompare(b.staff_name);
      }
    });
    return list;
  }, [records, filterLevel, search, sortBy]);

  /* ── export ───────────────────────────────────────────────────────────── */

  const exportData = useMemo(() => records.flatMap((s) => s.entries.map((e) => ({
    staffName: s.staff_name,
    role: s.role,
    area: e.area,
    level: STAFF_COMPETENCY_LEVEL_LABEL[e.level],
    assessedDate: e.assessed_date || "",
    assessedBy: e.assessed_by ? getStaffName(e.assessed_by) : "",
    expiryDate: e.expiry_date || "",
    notes: e.notes,
  }))), [records]);

  const exportCols: ExportColumn<typeof exportData[number]>[] = [
    { header: "Staff Name",    accessor: (r) => r.staffName },
    { header: "Role",          accessor: (r) => r.role },
    { header: "Competency",    accessor: (r) => r.area },
    { header: "Level",         accessor: (r) => r.level },
    { header: "Assessed",      accessor: (r) => r.assessedDate },
    { header: "Assessed By",   accessor: (r) => r.assessedBy },
    { header: "Expiry",        accessor: (r) => r.expiryDate },
    { header: "Notes",         accessor: (r) => r.notes },
  ];

  if (isLoading) {
    return (
      <PageShell title="Staff Competency Assessments" subtitle="Reg 32/33 — skills sign-offs, practical competency checks, and professional development benchmarks">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Staff Competency Assessments"
      subtitle="Reg 32/33 — skills sign-offs, practical competency checks, and professional development benchmarks"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={exportData} columns={exportCols} filename="staff-competency" />
          <PrintButton title="Staff Competency Assessments" />
          <button onClick={() => setShowDialog(true)} className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand/90">
            <Plus className="h-4 w-4" /> New Assessment
          </button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">

        {/* ── summary stats ──────────────────────────────────────────────── */}

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {[
            { l: "Competencies",     v: stats.total, icon: ClipboardCheck, c: "text-blue-600" },
            { l: "Competent",        v: stats.competent, icon: CheckCircle2, c: "text-green-600" },
            { l: "Developing",       v: stats.developing, icon: Clock, c: "text-blue-600" },
            { l: "Not Assessed",     v: stats.notAssessed, icon: Circle, c: "text-gray-500" },
            { l: "Expired",          v: stats.expired, icon: XCircle, c: stats.expired > 0 ? "text-red-600" : "text-gray-400" },
            { l: "Expiring Soon",    v: stats.expiringSoon, icon: AlertTriangle, c: stats.expiringSoon > 0 ? "text-amber-600" : "text-gray-400" },
            { l: "Fully Competent",  v: `${stats.fullyCompetent}/${records.length}`, icon: Award, c: "text-green-600" },
            { l: "Compliance",       v: `${stats.compliancePct}%`, icon: BarChart3, c: stats.compliancePct >= 80 ? "text-green-600" : stats.compliancePct >= 60 ? "text-amber-600" : "text-red-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* ── compliance bar ─────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" /> Overall Competency Compliance
            </span>
            <span className={cn(
              "font-bold tabular-nums",
              stats.compliancePct >= 80 ? "text-green-600" : stats.compliancePct >= 60 ? "text-amber-600" : "text-red-600",
            )}>
              {stats.compliancePct}%
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                stats.compliancePct >= 80 ? "bg-green-500" : stats.compliancePct >= 60 ? "bg-amber-500" : "bg-red-500",
              )}
              style={{ width: `${stats.compliancePct}%` }}
            />
          </div>
        </div>

        {/* ── alerts ─────────────────────────────────────────────────────── */}

        {alerts.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-800">
              <AlertTriangle className="h-4 w-4" />
              {alerts.filter((a) => a.type === "expired").length > 0 && (
                <span>{alerts.filter((a) => a.type === "expired").length} expired competenc{alerts.filter((a) => a.type === "expired").length === 1 ? "y" : "ies"}</span>
              )}
              {alerts.filter((a) => a.type === "expired").length > 0 && alerts.filter((a) => a.type === "expiring").length > 0 && <span>·</span>}
              {alerts.filter((a) => a.type === "expiring").length > 0 && (
                <span className="text-amber-700">{alerts.filter((a) => a.type === "expiring").length} expiring within 90 days</span>
              )}
            </div>
            <div className="space-y-1">
              {alerts.map((a, i) => (
                <div key={i} className={cn(
                  "flex items-center gap-2 text-xs rounded px-2 py-1",
                  a.type === "expired" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800",
                )}>
                  {a.type === "expired" ? <XCircle className="h-3 w-3 flex-shrink-0" /> : <Clock className="h-3 w-3 flex-shrink-0" />}
                  <span className="font-medium">{a.staffName}</span> — {a.area}
                  {a.expiryDate && <span className="text-muted-foreground ml-auto">{a.type === "expired" ? "Expired" : "Expires"}: {a.expiryDate}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── filters ────────────────────────────────────────────────────── */}

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff or competency area..." className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {(Object.keys(STAFF_COMPETENCY_LEVEL_LABEL) as StaffCompetencyLevel[]).map((k) => (
                <SelectItem key={k} value={k}>{STAFF_COMPETENCY_LEVEL_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="name">Name</option>
              <option value="compliance">Compliance (low first)</option>
              <option value="issues">Issues (most first)</option>
            </select>
          </div>
        </div>

        {/* ── competency matrix overview ──────────────────────────────────── */}

        <Card className="overflow-hidden">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-brand" />
              Competency Matrix
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-2 px-4 text-left text-xs font-semibold text-muted-foreground w-[180px] sticky left-0 bg-gray-50 z-10">Staff</th>
                    {COMPETENCY_AREAS.map((area) => (
                      <th key={area} className="py-2 px-1 text-center text-[10px] font-medium text-muted-foreground min-w-[80px]">
                        <div className="truncate max-w-[75px] mx-auto" title={area}>{area.replace(" (Level 3)", "").replace("TCI/", "")}</div>
                      </th>
                    ))}
                    <th className="py-2 px-3 text-center text-xs font-semibold text-muted-foreground">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((staff) => {
                    const comp = staff.entries.filter((e) => e.level === "competent").length;
                    const pct = staff.entries.length > 0 ? Math.round((comp / staff.entries.length) * 100) : 0;
                    return (
                      <tr key={staff.id} className="border-b hover:bg-gray-50/50">
                        <td className="py-2 px-4 sticky left-0 bg-white z-10">
                          <div className="text-xs font-medium">{staff.staff_name}</div>
                          <div className="text-[10px] text-muted-foreground">{staff.role}</div>
                        </td>
                        {COMPETENCY_AREAS.map((area) => {
                          const entry = staff.entries.find((e) => e.area === area);
                          if (!entry) return <td key={area} className="py-2 px-1 text-center"><span className="text-[10px] text-gray-300">--</span></td>;
                          const meta = LEVEL_META[entry.level];
                          const Icon = meta.icon;
                          return (
                            <td key={area} className="py-2 px-1 text-center">
                              <div className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium", meta.colour)} title={`${entry.area}: ${meta.label}`}>
                                <Icon className="h-3 w-3" />
                              </div>
                            </td>
                          );
                        })}
                        <td className="py-2 px-3 text-center">
                          <span className={cn(
                            "text-xs font-bold tabular-nums",
                            pct === 100 ? "text-green-600" : pct >= 70 ? "text-amber-600" : "text-red-600",
                          )}>{pct}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ── expandable staff cards ─────────────────────────────────────── */}

        {filtered.map((staff) => {
          const comp = staff.entries.filter((e) => e.level === "competent").length;
          const total = staff.entries.length;
          const pct = total > 0 ? Math.round((comp / total) * 100) : 0;
          const hasExpired = staff.entries.some((e) => e.level === "expired");
          const hasDeveloping = staff.entries.some((e) => e.level === "developing");
          const hasNotAssessed = staff.entries.some((e) => e.level === "not_assessed");

          return (
            <div key={staff.id} className={cn(
              "rounded-lg border bg-white overflow-hidden",
              hasExpired ? "border-red-200" : "",
            )}>
              <button onClick={() => setExpanded(expanded === staff.id ? null : staff.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <ShieldCheck className={cn("h-5 w-5", pct === 100 ? "text-green-600" : pct >= 70 ? "text-amber-500" : "text-red-500")} />
                  <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{staff.staff_name}</h3>
                      <span className="text-xs text-muted-foreground">{staff.role}</span>
                      {hasExpired && <Badge variant="destructive" className="text-[10px] h-5">Expired</Badge>}
                      {hasDeveloping && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700">Developing</span>}
                      {hasNotAssessed && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600">Gaps</span>}
                      {pct === 100 && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-700">Fully Competent</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{comp}/{total} competencies ({pct}%) · Assessed by {getStaffName("staff_darren")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden hidden sm:block">
                    <div className={cn("h-full rounded-full", pct === 100 ? "bg-green-400" : pct >= 70 ? "bg-amber-400" : "bg-red-400")} style={{ width: `${pct}%` }} />
                  </div>
                  {expanded === staff.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>

              {expanded === staff.id && (
                <div className="border-t p-4 space-y-2">
                  {staff.entries.map((entry) => {
                    const meta = LEVEL_META[entry.level];
                    const Icon = meta.icon;
                    const isExpired = entry.level === "expired";
                    const isExpiring = entry.expiry_date && entry.level !== "expired" && Math.ceil((new Date(entry.expiry_date).getTime() - Date.now()) / 86400000) <= 90 && Math.ceil((new Date(entry.expiry_date).getTime() - Date.now()) / 86400000) > 0;

                    return (
                      <div key={entry.id} className={cn(
                        "rounded border p-3",
                        isExpired ? "border-red-200 bg-red-50" : isExpiring ? "border-amber-200 bg-amber-50" : "",
                      )}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0",
                              isExpired ? "text-red-600" :
                              entry.level === "competent" ? "text-green-600" :
                              entry.level === "developing" ? "text-blue-600" :
                              "text-gray-400"
                            )} />
                            <div>
                              <p className="text-sm font-medium">{entry.area}</p>
                              {entry.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{entry.notes}</p>}
                              {entry.assessed_by && entry.assessed_date && (
                                <p className="text-xs text-muted-foreground mt-0.5">Assessed by {getStaffName(entry.assessed_by)} on {entry.assessed_date}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", meta.colour)}>{meta.label}</span>
                            {entry.expiry_date && (
                              <p className={cn("text-xs mt-0.5", isExpired ? "text-red-600 font-medium" : isExpiring ? "text-amber-600" : "text-muted-foreground")}>
                                {isExpired ? "Expired" : "Expires"}: {entry.expiry_date}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* ── regulatory note ────────────────────────────────────────────── */}

        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900 space-y-2">
          <p>
            <strong>Reg 32 — Fitness of Workers</strong> — The registered person must not employ a person to work at the home unless that person is fit to do so, with the qualifications, competence, skills, and experience necessary for the work they are to perform.
          </p>
          <p>
            <strong>Reg 33 — Employment of Staff</strong> — The registered person must ensure that all employees receive appropriate training, professional development, and supervision to enable them to fulfil their roles effectively.
          </p>
          <p>
            <strong>Quality Standards — Workforce Development</strong> — Staff must be equipped to meet children&apos;s needs through ongoing competency assessment, reflective practice, and evidenced professional development aligned to care standards.
          </p>
        </div>
      </div>

      {/* ── new assessment dialog ─────────────────────────────────────────── */}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Competency Assessment</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveAssessment} className="grid gap-3 py-2">
            <select className="rounded border px-3 py-2 text-sm" value={scForm.staff_id} onChange={(e) => setSC("staff_id", e.target.value)}>
              <option value="">Select staff member...</option>
              {STAFF.filter((s) => s.employment_status === "active").map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
            <select className="rounded border px-3 py-2 text-sm" value={scForm.area} onChange={(e) => setSC("area", e.target.value)}>
              <option value="">Competency area...</option>
              {COMPETENCY_AREAS.map((area) => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
            <Select value={scForm.level} onValueChange={(v) => setSC("level", v)}>
              <SelectTrigger><SelectValue placeholder="Competency level..." /></SelectTrigger>
              <SelectContent>
                {(Object.keys(STAFF_COMPETENCY_LEVEL_LABEL) as StaffCompetencyLevel[]).map((k) => (
                  <SelectItem key={k} value={k}>{STAFF_COMPETENCY_LEVEL_LABEL[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="date" className="rounded border px-3 py-2 text-sm" value={scForm.assessed_date} onChange={(e) => setSC("assessed_date", e.target.value)} />
            <select className="rounded border px-3 py-2 text-sm" value={scForm.assessed_by} onChange={(e) => setSC("assessed_by", e.target.value)}>
              <option value="">Assessed by...</option>
              {STAFF.filter((s) => s.employment_status === "active").map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
            <input type="date" placeholder="Expiry date (if applicable)" className="rounded border px-3 py-2 text-sm" value={scForm.expiry_date} onChange={(e) => setSC("expiry_date", e.target.value)} />
            <textarea placeholder="Assessment notes..." rows={3} className="rounded border px-3 py-2 text-sm" value={scForm.notes} onChange={(e) => setSC("notes", e.target.value)} />
            <DialogFooter>
              <button type="button" onClick={() => setShowDialog(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
              <button type="submit" disabled={createCompetency.isPending} className="rounded-md bg-brand px-4 py-2 text-sm text-white hover:bg-brand/90">{createCompetency.isPending ? "Saving…" : "Save Assessment"}</button>
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

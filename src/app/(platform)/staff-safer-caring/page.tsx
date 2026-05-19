"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  Shield, CheckCircle2, Clock, AlertTriangle, User, Users, Heart, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useStaffSaferCaringRecords } from "@/hooks/use-staff-safer-caring-records";
import type { StaffSaferCaringRecord, StaffSaferCaringPlanStatus } from "@/types/extended";
import { STAFF_SAFER_CARING_PLAN_STATUS_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── local config (colours not serializable) ─────────────────────────────── */

const STATUS_CLR: Record<StaffSaferCaringPlanStatus, string> = { current: "bg-green-100 text-green-800", review_due: "bg-amber-100 text-amber-800" };
const BORDER_STATUS: Record<StaffSaferCaringPlanStatus, string> = { current: "border-l-green-400", review_due: "border-l-amber-400" };

/* ── component ────────────────────────────────────────────────────────────── */

export default function StaffSaferCaringPage() {
  const { data: records = [], isLoading } = useStaffSaferCaringRecords();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let rows = records.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return getStaffName(r.staff_id).toLowerCase().includes(q) || r.role.toLowerCase().includes(q);
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "name": return getStaffName(a.staff_id).localeCompare(getStaffName(b.staff_id));
        case "review": return a.review_date.localeCompare(b.review_date);
        case "role": return a.role.localeCompare(b.role);
        default: return 0;
      }
    });
    return rows;
  }, [records, search, filterStatus, sortBy]);

  const totalPlans = records.length;
  const currentCount = records.filter((r) => r.status === "current").length;
  const currentPct = totalPlans > 0 ? Math.round((currentCount / totalPlans) * 100) : 0;
  const reviewDueCount = records.filter((r) => r.status === "review_due").length;

  const exportCols: ExportColumn<StaffSaferCaringRecord>[] = [
    { header: "Staff", accessor: (r: StaffSaferCaringRecord) => getStaffName(r.staff_id) },
    { header: "Role", accessor: (r: StaffSaferCaringRecord) => r.role },
    { header: "Status", accessor: (r: StaffSaferCaringRecord) => STAFF_SAFER_CARING_PLAN_STATUS_LABEL[r.status] },
    { header: "Signed", accessor: (r: StaffSaferCaringRecord) => r.signed_date },
    { header: "Review Due", accessor: (r: StaffSaferCaringRecord) => r.review_date },
    { header: "Physical Contact", accessor: (r: StaffSaferCaringRecord) => r.physical_contact_guidance },
    { header: "Boundaries", accessor: (r: StaffSaferCaringRecord) => r.professional_boundaries.join("; ") },
    { header: "Social Media", accessor: (r: StaffSaferCaringRecord) => r.social_media_rules },
    { header: "Lone Working", accessor: (r: StaffSaferCaringRecord) => r.lone_working_protocol },
    { header: "Gift Giving", accessor: (r: StaffSaferCaringRecord) => r.gift_giving },
    { header: "Transport", accessor: (r: StaffSaferCaringRecord) => r.transport },
    { header: "Personal Info", accessor: (r: StaffSaferCaringRecord) => r.personal_information },
  ];

  if (isLoading) {
    return (
      <PageShell title="Safer Caring Plans" subtitle="Children's Homes (England) Regulations 2015 · Schedule 1 · Safer Recruitment">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Safer Caring Plans" subtitle="Children's Homes (England) Regulations 2015 · Schedule 1 · Safer Recruitment" 
      ariaContext={{ pageTitle: "Safer Caring Plans", sourceType: "staff" }}
      actions={<div className="flex items-center gap-2"><PrintButton title="Safer Caring Plans" /><ExportButton data={filtered} columns={exportCols} filename="safer-caring-plans" /><AriaStudioQuickActionButton context={{ record_type: "safeguarding", record_id: "home_oak", home_id: "home_oak" }} /></div>}>
      <div id="print-area">
        {/* ── summary stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Plans in Place", value: totalPlans, icon: Shield, clr: "text-blue-600" },
            { label: "Current", value: `${currentCount} (${currentPct}%)`, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Review Due", value: reviewDueCount, icon: Clock, clr: "text-amber-600" },
            { label: "Children Covered", value: 3, icon: Users, clr: "text-purple-600" },
          ].map((s) => (
            <Card key={s.label}><CardContent className="pt-4 pb-3 text-center"><s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} /><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
          ))}
        </div>

        {/* ── filters ── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search staff, role…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="current">Current</SelectItem><SelectItem value="review_due">Review Due</SelectItem></SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="name">By Name</SelectItem><SelectItem value="review">By Review Date</SelectItem><SelectItem value="role">By Role</SelectItem></SelectContent></Select>
        </div>

        {/* ── plan cards ── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_STATUS[r.status])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {getStaffName(r.staff_id)} — {r.role}
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{STAFF_SAFER_CARING_PLAN_STATUS_LABEL[r.status]}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Signed: {r.signed_date} · Review: {r.review_date} · Witnessed by: {getStaffName(r.acknowledgements.witnessed_by)}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* Physical Contact */}
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="font-medium text-blue-800 mb-1 flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> Physical Contact Guidance</p>
                      <p className="text-blue-700 text-xs">{r.physical_contact_guidance}</p>
                    </div>

                    {/* Professional Boundaries */}
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="font-medium text-green-800 mb-2 flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Professional Boundaries</p>
                      <ul className="space-y-1">{r.professional_boundaries.map((b, i) => (
                        <li key={i} className="text-xs text-green-700 flex items-start gap-1"><CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" /> {b}</li>
                      ))}</ul>
                    </div>

                    {/* Social Media */}
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="font-medium text-purple-800 mb-1">Social Media Rules</p>
                      <p className="text-purple-700 text-xs">{r.social_media_rules}</p>
                    </div>

                    {/* Lone Working */}
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="font-medium text-amber-800 mb-1">Lone Working Protocol</p>
                      <p className="text-amber-700 text-xs">{r.lone_working_protocol}</p>
                    </div>

                    {/* Additional policies grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium text-gray-700 mb-1 text-xs">Gift Giving</p>
                        <p className="text-gray-600 text-xs">{r.gift_giving}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium text-gray-700 mb-1 text-xs">Transport</p>
                        <p className="text-gray-600 text-xs">{r.transport}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium text-gray-700 mb-1 text-xs">Personal Information</p>
                        <p className="text-gray-600 text-xs">{r.personal_information}</p>
                      </div>
                    </div>

                    {/* Child-Specific Considerations */}
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="font-medium text-red-800 mb-2 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Child-Specific Considerations</p>
                      <div className="space-y-2">
                        {Object.entries(r.child_specific_considerations).map(([childId, note]) => (
                          <div key={childId} className="text-xs">
                            <span className="font-medium text-red-700">{getYPName(childId)}:</span>{" "}
                            <span className="text-red-600">{note}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Acknowledgement */}
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      Plan signed: {r.acknowledgements.signed_date} · Witnessed by: {getStaffName(r.acknowledgements.witnessed_by)}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── regulatory note ── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework &amp; Safer Caring Culture</p>
          <p className="mb-2">
            Children&apos;s Homes (England) Regulations 2015, Schedule 1 — all staff must undergo enhanced DBS checks and barred list checks as part of safer recruitment. Safer caring plans are individual documents that protect both children and staff by making explicit the expected behaviours, boundaries, and protocols for each team member relative to the children in placement.
          </p>
          <p className="mb-2">
            Plans are reviewed at least annually, or sooner if: a new child is admitted; a concern or allegation arises; the staff member&apos;s role changes; or following a significant incident. All staff must sign their plan and have it witnessed by a senior colleague.
          </p>
          <p>
            Oak House operates a whistleblowing culture where any staff member can raise concerns about the conduct of a colleague without fear of reprisal. Concerns about professional boundaries, physical contact, or inappropriate relationships must be reported to the Registered Manager or, if the concern involves the RM, directly to the Responsible Individual or Ofsted.
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Safeguarding"
        category={["safeguarding", "behaviour"]}
        days={90}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Safer Caring Plans — staff individual safe caring agreements, physical boundaries, professional conduct, safeguarding obligations, allegation risk reduction, DBS, restrictions"
        recordType="safeguarding"
        className="mt-6"
      />
    </PageShell>
  );
}

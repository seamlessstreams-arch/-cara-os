"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { AriaPanel } from "@/components/aria/aria-panel";
import { useAdmissions, useCreateReferral, useUpdateReferral } from "@/hooks/use-admissions";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getStaffName } from "@/lib/seed-data";
import type { AdmissionReferral, AdmissionReferralStatus, AdmissionReferralSource } from "@/types/extended";
import { ADMISSION_REFERRAL_STATUS_LABEL, ADMISSION_REFERRAL_SOURCE_LABEL } from "@/types/extended";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  UserPlus, Clock, AlertTriangle, CheckCircle2,
  XCircle, Shield, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<AdmissionReferralStatus, string> = {
  new:                 "bg-blue-100 text-blue-800",
  under_assessment:    "bg-purple-100 text-purple-800",
  impact_assessment:   "bg-indigo-100 text-indigo-800",
  panel_decision:      "bg-amber-100 text-amber-800",
  accepted:            "bg-green-100 text-green-800",
  declined:            "bg-red-100 text-red-800",
  withdrawn:           "bg-gray-100 text-gray-800",
  placed:              "bg-emerald-100 text-emerald-800",
};

const BORDER_COLOR: Record<string, string> = {
  accepted: "border-l-green-500", placed: "border-l-green-500",
  declined: "border-l-red-500", withdrawn: "border-l-gray-400",
};

// ══════════════════════════════════════════════════════════════════════════════
export default function AdmissionsPage() {
  const { data: response, isLoading } = useAdmissions();
  const createReferral = useCreateReferral();
  const updateReferral = useUpdateReferral();

  const records = response?.data ?? [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tab, setTab] = useState("active");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((r) =>
        r.child_name.toLowerCase().includes(s) ||
        r.referred_by.toLowerCase().includes(s) ||
        r.local_authority.toLowerCase().includes(s) ||
        r.notes.toLowerCase().includes(s)
      );
    }
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    if (tab === "active") list = list.filter((r) => !["declined", "withdrawn", "placed"].includes(r.status));
    if (tab === "closed") list = list.filter((r) => ["declined", "withdrawn", "placed"].includes(r.status));

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":   return b.referral_date.localeCompare(a.referral_date);
        case "status": return a.status.localeCompare(b.status);
        case "age":    return a.age - b.age;
        default:       return 0;
      }
    });
    return list;
  }, [records, search, statusFilter, tab, sortBy]);

  const stats = useMemo(() => {
    const total = records.length;
    const active = records.filter((r) => !["declined", "withdrawn", "placed"].includes(r.status)).length;
    const accepted = records.filter((r) => r.status === "accepted" || r.status === "placed").length;
    const declined = records.filter((r) => r.status === "declined").length;
    return { total, active, accepted, declined };
  }, [records]);

  const exportCols: ExportColumn<AdmissionReferral>[] = [
    { header: "ID",                accessor: (r: AdmissionReferral) => r.id },
    { header: "Child",             accessor: (r: AdmissionReferral) => r.child_name },
    { header: "Age",               accessor: (r: AdmissionReferral) => String(r.age) },
    { header: "Gender",            accessor: (r: AdmissionReferral) => r.gender },
    { header: "Referral Date",     accessor: (r: AdmissionReferral) => r.referral_date },
    { header: "Source",            accessor: (r: AdmissionReferral) => ADMISSION_REFERRAL_SOURCE_LABEL[r.referral_source] },
    { header: "Referred By",       accessor: (r: AdmissionReferral) => r.referred_by },
    { header: "Local Authority",   accessor: (r: AdmissionReferral) => r.local_authority },
    { header: "Status",            accessor: (r: AdmissionReferral) => ADMISSION_REFERRAL_STATUS_LABEL[r.status] },
    { header: "Presenting Needs",  accessor: (r: AdmissionReferral) => r.presenting_needs.join("; ") },
    { header: "Risk Factors",      accessor: (r: AdmissionReferral) => r.risk_factors.join("; ") },
    { header: "Decision",          accessor: (r: AdmissionReferral) => r.decision_reason || "—" },
    { header: "Decision By",       accessor: (r: AdmissionReferral) => r.decision_by ? getStaffName(r.decision_by) : "—" },
    { header: "Notes",             accessor: (r: AdmissionReferral) => r.notes },
  ];

  const advanceStatus = (id: string, newStatus: AdmissionReferralStatus, label: string) => {
    updateReferral.mutate(
      { id, status: newStatus },
      { onSuccess: () => toast.success(label), onError: () => toast.error("Failed to update") },
    );
  };

  if (isLoading) {
    return (
      <PageShell title="Admissions & Referrals" subtitle="Pre-admission referrals, impact assessments, and matching decisions">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Admissions & Referrals"
      subtitle="Pre-admission referrals, impact assessments, and matching decisions"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Admissions & Referrals" />
          <ExportButton data={filtered} columns={exportCols} filename="admissions-referrals" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Referral</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <AriaPanel mode="assist" pageContext="Admissions & Referrals — pre-admission referrals, impact assessments, matching decisions, placement suitability" recordType="admission" userRole="registered_manager" className="mb-2" />
        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Referrals", value: stats.total,    icon: <UserPlus className="h-4 w-4" />,       color: "text-blue-600" },
            { label: "Active",          value: stats.active,   icon: <Clock className="h-4 w-4" />,          color: "text-amber-600" },
            { label: "Accepted/Placed", value: stats.accepted, icon: <CheckCircle2 className="h-4 w-4" />,   color: "text-green-600" },
            { label: "Declined",        value: stats.declined, icon: <XCircle className="h-4 w-4" />,        color: "text-red-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", s.color)}>{s.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search referrals…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(Object.entries(ADMISSION_REFERRAL_STATUS_LABEL) as [AdmissionReferralStatus, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="age">Age</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Referral list ────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No referrals match your filters.</p>}
          {filtered.map((r) => {
            const open = !!expanded[r.id];
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_COLOR[r.status] ?? "border-l-blue-400")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" role="button" tabIndex={0} aria-expanded={open} aria-label={`Expand referral details for ${r.child_name}`} onClick={() => toggle(r.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(r.id); } }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", STATUS_COLOR[r.status])}>{ADMISSION_REFERRAL_STATUS_LABEL[r.status]}</Badge>
                        <Badge variant="outline" className="text-xs">{ADMISSION_REFERRAL_SOURCE_LABEL[r.referral_source]}</Badge>
                        {r.risk_factors.length > 2 && <Badge variant="outline" className="text-xs text-red-600 border-red-300">High complexity</Badge>}
                      </div>
                      <p className="font-semibold">{r.child_name} — Age {r.age}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>Referred: {r.referral_date}</span>
                        <span>{r.local_authority}</span>
                        <span>By: {r.referred_by}</span>
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-3 border-t pt-3 text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div><p className="text-xs text-muted-foreground">DOB</p><p className="font-medium">{r.date_of_birth}</p></div>
                        <div><p className="text-xs text-muted-foreground">Gender</p><p className="font-medium capitalize">{r.gender.replace("_", " ")}</p></div>
                        <div><p className="text-xs text-muted-foreground">Ethnicity</p><p className="font-medium">{r.ethnicity}</p></div>
                        <div><p className="text-xs text-muted-foreground">LA</p><p className="font-medium">{r.local_authority}</p></div>
                      </div>

                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Presenting Needs</p>
                        <div className="flex flex-wrap gap-1">{r.presenting_needs.map((n, i) => <Badge key={i} variant="secondary" className="text-xs">{n}</Badge>)}</div>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Risk Factors</p>
                        <div className="flex flex-wrap gap-1">{r.risk_factors.map((rf, i) => <Badge key={i} variant="outline" className="text-xs text-red-600 border-red-200">{rf}</Badge>)}</div>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Placement History</p>
                        <p className="text-xs">{r.placement_history}</p>
                      </div>

                      {r.impact_assessment_complete && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Impact Assessment</p>
                          <p className="bg-blue-50 p-2 rounded text-xs text-blue-900">{r.impact_assessment_notes}</p>
                        </div>
                      )}
                      {r.matching_considerations && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Matching Considerations</p>
                          <p className="text-xs">{r.matching_considerations}</p>
                        </div>
                      )}
                      {r.decision_reason && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Decision</p>
                          <p className="text-xs font-medium">{r.decision_reason}</p>
                          {r.decision_by && <p className="text-xs text-muted-foreground mt-1">By: {getStaffName(r.decision_by)} on {r.decision_date}</p>}
                        </div>
                      )}
                      {r.notes && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Notes</p>
                          <p className="italic text-muted-foreground text-xs">{r.notes}</p>
                        </div>
                      )}

                      {!["declined", "withdrawn", "placed"].includes(r.status) && (
                        <div className="flex gap-2">
                          {r.status === "new" && <Button size="sm" variant="outline" onClick={() => advanceStatus(r.id, "under_assessment", "Assessment started")}>Begin Assessment</Button>}
                          {r.status === "under_assessment" && <Button size="sm" variant="outline" onClick={() => advanceStatus(r.id, "impact_assessment", "Impact assessment started")}>Impact Assessment</Button>}
                          {r.status === "impact_assessment" && <Button size="sm" variant="outline" onClick={() => advanceStatus(r.id, "panel_decision", "Sent to panel")}>Send to Panel</Button>}
                          {r.status === "panel_decision" && (
                            <>
                              <Button size="sm" variant="default" onClick={() => advanceStatus(r.id, "accepted", "Referral accepted")}>Accept</Button>
                              <Button size="sm" variant="outline" className="text-red-600" onClick={() => advanceStatus(r.id, "declined", "Referral declined")}>Decline</Button>
                            </>
                          )}
                        </div>
                      )}
                      <SmartLinkPanel sourceType="admission" sourceId={r.id} compact />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Guidance ─────────────────────────────────────────────────────── */}
        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              All referrals must receive an impact assessment before a child is admitted. The Registered Manager must consider the impact on existing children. Admissions must be in line with the home&apos;s Statement of Purpose and Ofsted registration. Emergency placements require retrospective impact assessment within 72 hours.
            </span>
          </CardContent>
        </Card>
      </div>

      {/* ── New referral dialog ───────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Referral</DialogTitle></DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            createReferral.mutate(
              { child_name: "New Referral", status: "new", referral_date: new Date().toISOString().slice(0, 10), staff_id: "staff_darren" },
              { onSuccess: () => toast.success("Referral logged"), onError: () => toast.error("Failed to log referral") },
            );
            setShowNew(false);
          }} className="space-y-3">
            <div>
              <label htmlFor="ref-name" className="text-sm font-medium">Child&apos;s Name / Reference</label>
              <Input id="ref-name" placeholder="Child name or anonymised reference" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="ref-dob" className="text-sm font-medium">Date of Birth</label>
                <Input id="ref-dob" type="date" />
              </div>
              <div>
                <label htmlFor="ref-gender" className="text-sm font-medium">Gender</label>
                <Select><SelectTrigger id="ref-gender"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="non_binary">Non-binary</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label htmlFor="ref-referred-by" className="text-sm font-medium">Referred By</label>
              <Input id="ref-referred-by" placeholder="Name and role of referring professional" />
            </div>
            <div>
              <label htmlFor="ref-la" className="text-sm font-medium">Local Authority</label>
              <Input id="ref-la" placeholder="Placing local authority" />
            </div>
            <div>
              <label htmlFor="ref-source" className="text-sm font-medium">Source</label>
              <Select><SelectTrigger id="ref-source"><SelectValue placeholder="Referral source" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(ADMISSION_REFERRAL_SOURCE_LABEL) as [AdmissionReferralSource, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="ref-needs" className="text-sm font-medium">Presenting Needs</label>
              <Textarea id="ref-needs" placeholder="Key needs (one per line)" rows={3} />
            </div>
            <div>
              <label htmlFor="ref-risks" className="text-sm font-medium">Risk Factors</label>
              <Textarea id="ref-risks" placeholder="Known risk factors (one per line)" rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={createReferral.isPending}>{createReferral.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : "Log Referral"}</Button>
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

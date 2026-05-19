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
  AlertTriangle, CheckCircle2, Clock, Shield, UserX, Lock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useLadoReferrals, useCreateLadoReferral } from "@/hooks/use-lado-referrals";
import type { LadoReferral, LadoAllegationType, LadoOutcome, LadoReferralStatus, LadoStaffAction } from "@/types/extended";
import {
  LADO_ALLEGATION_TYPE_LABEL,
  LADO_OUTCOME_LABEL,
  LADO_REFERRAL_STATUS_LABEL,
  LADO_STAFF_ACTION_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── UI metadata ─────────────────────────────────────────────────────────── */

const ALLG_CLR: Record<LadoAllegationType, string> = {
  physical_abuse: "bg-red-100 text-red-800", emotional_abuse: "bg-orange-100 text-orange-800",
  sexual_abuse: "bg-red-100 text-red-800", neglect: "bg-amber-100 text-amber-800",
  inappropriate_behaviour: "bg-yellow-100 text-yellow-800", inappropriate_relationship: "bg-purple-100 text-purple-800",
  boundary_violation: "bg-blue-100 text-blue-800", other: "bg-slate-100 text-[var(--cs-navy)]",
};

const OUTCOME_CLR: Record<LadoOutcome, string> = { substantiated: "bg-red-100 text-red-800", unsubstantiated: "bg-amber-100 text-amber-800", unfounded: "bg-green-100 text-green-800", malicious: "bg-purple-100 text-purple-800", pending: "bg-blue-100 text-blue-800" };

const STATUS_CLR: Record<LadoReferralStatus, string> = {
  initial_assessment: "bg-blue-100 text-blue-800", lado_contacted: "bg-indigo-100 text-indigo-800",
  strategy_meeting: "bg-yellow-100 text-yellow-800", investigation: "bg-orange-100 text-orange-800",
  outcome_reached: "bg-purple-100 text-purple-800", closed: "bg-slate-100 text-[var(--cs-navy)]",
  nfa: "bg-green-100 text-green-800",
};

const STAFF_ACTION_CLR: Record<LadoStaffAction, string> = { suspended: "bg-red-100 text-red-800", restricted_duties: "bg-orange-100 text-orange-800", normal_duties: "bg-green-100 text-green-800", resigned: "bg-slate-100 text-[var(--cs-navy)]", dismissed: "bg-red-100 text-red-800", cleared: "bg-green-100 text-green-800" };

const BORDER_OUTCOME: Record<LadoOutcome, string> = { substantiated: "border-l-red-600", unsubstantiated: "border-l-amber-400", unfounded: "border-l-green-400", malicious: "border-l-purple-500", pending: "border-l-blue-400" };

/* ── page ─────────────────────────────────────────────────────────────────── */

export default function LADOReferralsPage() {
  const { data: res, isLoading } = useLadoReferrals();
  const data: LadoReferral[] = res?.data ?? [];
  const createMut = useCreateLadoReferral();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterOutcome, setFilterOutcome] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let rows = data.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterOutcome !== "all" && r.outcome !== filterOutcome) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          getStaffName(r.subject_staff_id).toLowerCase().includes(q) ||
          r.allegation_summary.toLowerCase().includes(q) ||
          LADO_ALLEGATION_TYPE_LABEL[r.allegation_type].toLowerCase().includes(q) ||
          r.child_ids.some((c) => getYPName(c).toLowerCase().includes(q))
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "date-desc": return b.date_referred.localeCompare(a.date_referred);
        case "date-asc": return a.date_referred.localeCompare(b.date_referred);
        default: return 0;
      }
    });
    return rows;
  }, [data, search, filterStatus, filterOutcome, sortBy]);

  const activeReferrals = data.filter((r) => r.status !== "closed" && r.status !== "nfa").length;
  const totalReferrals = data.length;
  const substantiated = data.filter((r) => r.outcome === "substantiated").length;
  const pending = data.filter((r) => r.outcome === "pending").length;

  const exportCols: ExportColumn<LadoReferral>[] = [
    { header: "Date Referred", accessor: (r: LadoReferral) => r.date_referred },
    { header: "Date of Allegation", accessor: (r: LadoReferral) => r.date_allegation },
    { header: "Subject Staff", accessor: (r: LadoReferral) => getStaffName(r.subject_staff_id) },
    { header: "Role", accessor: (r: LadoReferral) => r.subject_staff_role },
    { header: "Allegation Type", accessor: (r: LadoReferral) => LADO_ALLEGATION_TYPE_LABEL[r.allegation_type] },
    { header: "Children Involved", accessor: (r: LadoReferral) => r.child_ids.map(getYPName).join(", ") },
    { header: "Status", accessor: (r: LadoReferral) => LADO_REFERRAL_STATUS_LABEL[r.status] },
    { header: "Outcome", accessor: (r: LadoReferral) => LADO_OUTCOME_LABEL[r.outcome] },
    { header: "Staff Action", accessor: (r: LadoReferral) => LADO_STAFF_ACTION_LABEL[r.staff_action] },
    { header: "LADO", accessor: (r: LadoReferral) => r.lado_name },
    { header: "Ofsted Notified", accessor: (r: LadoReferral) => r.ofsted_notified ? "Yes" : "No" },
    { header: "Police", accessor: (r: LadoReferral) => r.police_involved ? `Yes (${r.police_ref})` : "No" },
    { header: "DBS Referral", accessor: (r: LadoReferral) => r.dbs_referral ? "Yes" : "No" },
    { header: "Referred By", accessor: (r: LadoReferral) => getStaffName(r.referred_by) },
  ];

  if (isLoading) return <PageShell title="LADO Referrals" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="LADO Referrals"
      subtitle="Working Together to Safeguard Children 2023 · Reg 33 · Allegations Management"
      ariaContext={{ pageTitle: "LADO Referrals", sourceType: "general" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="LADO Referrals" />
          <ExportButton data={filtered} columns={exportCols} filename="lado-referrals" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Referral</Button>
          <AriaStudioQuickActionButton context={{ record_type: "safeguarding", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area">
        {/* confidentiality banner */}
        <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-6 flex items-start gap-2">
          <Lock className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-red-800">HIGHLY RESTRICTED — Confidential Personnel Information</p>
            <p className="text-red-700">Access to LADO referral records is restricted to the Registered Manager, Responsible Individual, and authorised HR personnel. Do not discuss details with staff members not directly involved.</p>
          </div>
        </div>

        {/* stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Referrals", value: totalReferrals, icon: Shield, clr: "text-blue-600" },
            { label: "Active / Open", value: activeReferrals, icon: AlertTriangle, clr: "text-amber-600" },
            { label: "Substantiated", value: substantiated, icon: UserX, clr: "text-red-600" },
            { label: "Pending Outcome", value: pending, icon: Clock, clr: "text-indigo-600" },
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

        {/* active alert */}
        {activeReferrals > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">{activeReferrals} active LADO referral(s)</p>
              <p className="text-amber-700">Ensure regular review meetings are scheduled and all actions are progressed in a timely manner.</p>
            </div>
          </div>
        )}

        {/* filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search staff, child, allegation…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem>{(Object.keys(LADO_REFERRAL_STATUS_LABEL) as LadoReferralStatus[]).map((k) => (<SelectItem key={k} value={k}>{LADO_REFERRAL_STATUS_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={filterOutcome} onValueChange={setFilterOutcome}><SelectTrigger className="w-[170px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Outcomes</SelectItem>{(Object.keys(LADO_OUTCOME_LABEL) as LadoOutcome[]).map((k) => (<SelectItem key={k} value={k}>{LADO_OUTCOME_LABEL[k]}</SelectItem>))}</SelectContent></Select>
          <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="date-desc">Newest First</SelectItem><SelectItem value="date-asc">Oldest First</SelectItem></SelectContent></Select>
        </div>

        {/* records */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_OUTCOME[r.outcome])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {getStaffName(r.subject_staff_id)} — {r.subject_staff_role}
                        <Badge variant="outline" className={ALLG_CLR[r.allegation_type]}>{LADO_ALLEGATION_TYPE_LABEL[r.allegation_type]}</Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{LADO_REFERRAL_STATUS_LABEL[r.status]}</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Referred: {r.date_referred} · Children: {r.child_ids.map(getYPName).join(", ")} · Outcome: <span className="font-medium">{LADO_OUTCOME_LABEL[r.outcome]}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={STAFF_ACTION_CLR[r.staff_action]}>{LADO_STAFF_ACTION_LABEL[r.staff_action]}</Badge>
                      {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium mb-1">Allegation Summary</p>
                        <p className="text-muted-foreground">{r.allegation_summary}</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Evidence Summary</p>
                        <p className="text-muted-foreground">{r.evidence_summary}</p>
                      </div>
                    </div>

                    <div className="bg-indigo-50 rounded-lg p-3">
                      <p className="font-medium text-indigo-800 mb-1">LADO Details</p>
                      <p className="text-indigo-700 text-xs">{r.lado_name} — {r.lado_contact}</p>
                      {r.strategy_meeting_date && (
                        <div className="mt-2">
                          <p className="text-indigo-700 text-xs font-medium">Strategy Meeting: {r.strategy_meeting_date}</p>
                          <p className="text-indigo-600 text-xs">Attendees: {r.strategy_meeting_attendees.join(", ")}</p>
                        </div>
                      )}
                    </div>

                    {r.investigation_findings && (
                      <div>
                        <p className="font-medium mb-1">Investigation Findings</p>
                        <p className="text-muted-foreground">{r.investigation_findings}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Ofsted Notified</p>
                        <p className="text-xs text-muted-foreground">{r.ofsted_notified ? `Yes — ${r.ofsted_notified_date}` : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Police Involved</p>
                        <p className="text-xs text-muted-foreground">{r.police_involved ? `Yes — ${r.police_ref}` : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">DBS Referral</p>
                        <p className="text-xs text-muted-foreground">{r.dbs_referral ? "Yes" : "No"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Confidentiality</p>
                        <p className="text-xs text-muted-foreground capitalize">{r.confidentiality_level.replace("_", " ")}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="font-medium text-green-800 mb-1">Support for Staff Member</p>
                        <p className="text-green-700 text-xs">{r.support_for_staff}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="font-medium text-blue-800 mb-1">Support for Child</p>
                        <p className="text-blue-700 text-xs">{r.support_for_child}</p>
                      </div>
                    </div>

                    {r.lesson_learned && (
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="font-medium text-amber-800 mb-1">Lessons Learned</p>
                        <p className="text-amber-700 text-xs">{r.lesson_learned}</p>
                      </div>
                    )}

                    {r.review_dates.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Review Dates</p>
                        <div className="flex gap-2 flex-wrap">
                          {r.review_dates.map((rd, i) => (
                            <Badge key={i} variant="outline" className="bg-muted/30">{rd}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>Referred by: {getStaffName(r.referred_by)}</span>
                      <span>Allegation date: {r.date_allegation}</span>
                      <span>{r.closed_date ? `Closed: ${r.closed_date} by ${getStaffName(r.closed_by!)}` : "⚠ Open"}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Working Together to Safeguard Children 2023 — all allegations against staff in positions of trust must be referred to the LADO within 1 working day. Children&apos;s Homes (England) Regulations 2015, Reg 33 — notification to Ofsted of any allegation against a member of staff. Keeping Children Safe in Education — managing allegations. DBS referrals must be made when a person is removed from regulated activity due to safeguarding concerns. Records retained indefinitely on personnel file.</p>
        </div>
      </div>

      {/* new referral dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New LADO Referral</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Date of Allegation</Label><Input type="date" /></div>
            <div><Label>Date Referred</Label><Input type="date" /></div>
            <div><Label>Subject Staff Member</Label><Select><SelectTrigger><SelectValue placeholder="Select staff…" /></SelectTrigger><SelectContent><SelectItem value="staff_anna">Anna</SelectItem><SelectItem value="staff_edward">Edward</SelectItem><SelectItem value="staff_ryan">Ryan</SelectItem><SelectItem value="staff_chervelle">Chervelle</SelectItem><SelectItem value="staff_lackson">Lackson</SelectItem><SelectItem value="staff_mirela">Mirela</SelectItem></SelectContent></Select></div>
            <div><Label>Allegation Type</Label><Select><SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{(Object.keys(LADO_ALLEGATION_TYPE_LABEL) as LadoAllegationType[]).map((k) => (<SelectItem key={k} value={k}>{LADO_ALLEGATION_TYPE_LABEL[k]}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Child Involved</Label><Select><SelectTrigger><SelectValue placeholder="Select child…" /></SelectTrigger><SelectContent><SelectItem value="yp_alex">Alex</SelectItem><SelectItem value="yp_jordan">Jordan</SelectItem><SelectItem value="yp_casey">Casey</SelectItem></SelectContent></Select></div>
            <div><Label>LADO Name</Label><Input placeholder="LADO officer name" /></div>
            <div className="col-span-2"><Label>Allegation Summary</Label><Textarea placeholder="Describe the allegation…" rows={4} /></div>
            <div className="col-span-2"><Label>Evidence Summary</Label><Textarea placeholder="Evidence gathered so far…" rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button onClick={() => setShowNew(false)}>Submit Referral</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Safeguarding"
        category="safeguarding"
        days={90}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="LADO Referrals — Local Authority Designated Officer referrals, allegations against staff, safeguarding concerns, threshold decisions, risk assessments, regulatory notifications, Ofsted evidence"
        recordType="safeguarding"
        className="mt-6"
      />
    </PageShell>
  );
}

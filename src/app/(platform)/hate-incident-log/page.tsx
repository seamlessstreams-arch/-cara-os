"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown, ChevronUp, ArrowUpDown, AlertTriangle, CheckCircle2,
  Search, Shield, Heart, Scale, ShieldAlert, FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import type { HateIncident, HateTargetType, HatePerpetratorType, HateIncidentType, HateIncidentStatus } from "@/types/extended";
import { HATE_TARGET_TYPE_LABEL, HATE_PERPETRATOR_TYPE_LABEL, HATE_INCIDENT_TYPE_LABEL, HATE_INCIDENT_STATUS_LABEL } from "@/types/extended";
import { useHateIncidents } from "@/hooks/use-hate-incidents";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const TYPE_CLR: Record<HateIncidentType, string> = {
  racist: "bg-red-100 text-red-800",
  homophobic_transphobic: "bg-purple-100 text-purple-800",
  religious: "bg-amber-100 text-amber-800",
  disability_related: "bg-blue-100 text-blue-800",
  antisemitic: "bg-orange-100 text-orange-800",
  misogynistic: "bg-pink-100 text-pink-800",
  other: "bg-slate-100 text-slate-800",
};

const STATUS_CLR: Record<HateIncidentStatus, string> = {
  open: "bg-amber-100 text-amber-800",
  closed_resolved: "bg-green-100 text-green-800",
  closed_escalated: "bg-red-100 text-red-800",
};

const STATUS_BORDER: Record<HateIncidentStatus, string> = {
  open: "border-l-amber-400",
  closed_resolved: "border-l-green-400",
  closed_escalated: "border-l-red-500",
};

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function HateIncidentLogPage() {
  const { data: res, isLoading } = useHateIncidents();
  const data = res?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r.description.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.target_identity.toLowerCase().includes(q) ||
        getStaffName(r.reported_by).toLowerCase().includes(q)
      );
    }
    if (filterType !== "all") rows = rows.filter((r) => r.incident_type === filterType);
    if (filterStatus !== "all") rows = rows.filter((r) => r.status === filterStatus);
    rows.sort((a, b) => sortBy === "newest" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date));
    return rows;
  }, [data, search, filterType, filterStatus, sortBy]);

  /* ── stats (12 month window) ────────────────────────────────────────────── */
  const cutoff12mo = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 365); return d.toISOString().slice(0, 10); }, []);
  const last12 = data.filter((r) => r.date >= cutoff12mo);
  const cutoffQ = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 90); return d.toISOString().slice(0, 10); }, []);
  const thisQuarter = data.filter((r) => r.date >= cutoffQ).length;
  const policeReported = last12.filter((r) => r.reported_to_police).length;
  const closed = last12.filter((r) => r.status !== "open").length;
  const resolvedPct = last12.length === 0 ? 0 : Math.round((closed / last12.length) * 100);

  const exportCols: ExportColumn<HateIncident>[] = [
    { header: "Date", accessor: (r: HateIncident) => r.date },
    { header: "Time", accessor: (r: HateIncident) => r.time },
    { header: "Location", accessor: (r: HateIncident) => r.location },
    { header: "Target", accessor: (r: HateIncident) => `${HATE_TARGET_TYPE_LABEL[r.target_type]} — ${r.target_identity}` },
    { header: "Perpetrator", accessor: (r: HateIncident) => HATE_PERPETRATOR_TYPE_LABEL[r.perpetrator_type] },
    { header: "Type", accessor: (r: HateIncident) => HATE_INCIDENT_TYPE_LABEL[r.incident_type] },
    { header: "Reported By", accessor: (r: HateIncident) => getStaffName(r.reported_by) },
    { header: "Police", accessor: (r: HateIncident) => r.reported_to_police ? r.police_reference || "Yes" : "No" },
    { header: "Ofsted", accessor: (r: HateIncident) => r.reported_to_ofsted ? "Yes" : "No" },
    { header: "LA", accessor: (r: HateIncident) => r.reported_to_la ? "Yes" : "No" },
    { header: "School", accessor: (r: HateIncident) => r.school_notified ? "Yes" : "No" },
    { header: "Status", accessor: (r: HateIncident) => HATE_INCIDENT_STATUS_LABEL[r.status] },
    { header: "Follow-up", accessor: (r: HateIncident) => r.follow_up_date },
  ];

  const openCount = data.filter((r) => r.status === "open").length;

  if (isLoading) return <PageShell title="Hate Incident Log" subtitle="Equality Act 2010 · Quality Standard 5 (Protection) · Public Sector Equality Duty"><div className="p-8 text-center text-muted-foreground">Loading hate incidents…</div></PageShell>;

  return (
    <PageShell
      title="Hate Incident Log"
      subtitle="Equality Act 2010 · Quality Standard 5 (Protection) · Public Sector Equality Duty"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "incident" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Hate Incident Log" />
          <ExportButton data={data} columns={exportCols} filename="hate-incident-log" />
        </div>
      }
    >
      <div id="print-area">
        {/* stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Incidents (12 mo)", value: last12.length, icon: FileWarning, clr: "text-red-600" },
            { label: "This Quarter", value: thisQuarter, icon: AlertTriangle, clr: "text-amber-600" },
            { label: "Police-reported", value: policeReported, icon: Scale, clr: "text-blue-600" },
            { label: "Resolved %", value: `${resolvedPct}%`, icon: CheckCircle2, clr: "text-green-600" },
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

        {/* sensitive note — child's right */}
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4 flex items-start gap-2">
          <Heart className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-rose-800">Reporting hate incidents is a child&apos;s right, not optional</p>
            <p className="text-rose-700">
              Every child living here has the right to be free from prejudice and to have hate against them
              taken seriously, recorded, and acted upon. Staff must never minimise, frame as &quot;banter&quot;,
              or place the burden of proof on the child. The child&apos;s wishes about how to respond
              (police, restorative, confidentiality, pace) lead the process — but the duty to record and learn is ours.
            </p>
          </div>
        </div>

        {/* open alert */}
        {openCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">{openCount} open incident(s) requiring follow-up</p>
              <p className="text-amber-700">
                Open hate incidents must be reviewed at every supervision and every Reg 44 visit until closure.
                Check that the affected child still feels supported and that agreed prevention measures are in place.
              </p>
            </div>
          </div>
        )}

        {/* filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search incidents..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Incident type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {(Object.keys(TYPE_CLR) as HateIncidentType[]).map((k) => (
                <SelectItem key={k} value={k}>{HATE_INCIDENT_TYPE_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(STATUS_CLR) as HateIncidentStatus[]).map((k) => (
                <SelectItem key={k} value={k}>{HATE_INCIDENT_STATUS_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* incident cards */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", STATUS_BORDER[r.status])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {HATE_INCIDENT_TYPE_LABEL[r.incident_type]}
                        <Badge variant="outline" className={TYPE_CLR[r.incident_type]}>{HATE_TARGET_TYPE_LABEL[r.target_type]}</Badge>
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{HATE_INCIDENT_STATUS_LABEL[r.status]}</Badge>
                        {r.reported_to_police && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                            <Scale className="h-3 w-3 mr-1" />Police
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.date} {r.time} · {r.location}
                        {" "}· Target: {r.target_identity}
                        {" "}· Perpetrator: {HATE_PERPETRATOR_TYPE_LABEL[r.perpetrator_type]}
                        {" "}· Reported by: {getStaffName(r.reported_by)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* description */}
                    <div>
                      <p className="font-medium mb-1">Factual Account</p>
                      <p className="text-muted-foreground text-xs">{r.description}</p>
                    </div>

                    {/* affected person response */}
                    <div className="bg-rose-50 border border-rose-200 rounded p-2">
                      <p className="font-medium text-xs text-rose-800 mb-1">Affected Person&apos;s Response & Voice</p>
                      <p className="text-xs text-rose-700">{r.affected_person_response}</p>
                    </div>

                    {/* support */}
                    {r.support_provided.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-green-700">Support Provided</p>
                        <ul className="space-y-1">
                          {r.support_provided.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <Heart className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* reporting */}
                    <div>
                      <p className="font-medium mb-1">External Reporting</p>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className={r.reported_to_police ? "bg-blue-50 text-blue-700 text-xs" : "bg-muted/50 text-xs"}>
                          Police: {r.reported_to_police ? (r.police_reference || "Yes") : "No"}
                        </Badge>
                        <Badge variant="outline" className={r.reported_to_ofsted ? "bg-blue-50 text-blue-700 text-xs" : "bg-muted/50 text-xs"}>
                          Ofsted: {r.reported_to_ofsted ? "Yes" : "No"}
                        </Badge>
                        <Badge variant="outline" className={r.reported_to_la ? "bg-blue-50 text-blue-700 text-xs" : "bg-muted/50 text-xs"}>
                          LA: {r.reported_to_la ? "Yes" : "No"}
                        </Badge>
                        <Badge variant="outline" className={r.school_notified ? "bg-blue-50 text-blue-700 text-xs" : "bg-muted/50 text-xs"}>
                          School: {r.school_notified ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>

                    {/* restorative */}
                    {r.restorative_approach && (
                      <div>
                        <p className="font-medium mb-1">Restorative Approach</p>
                        <p className="text-muted-foreground text-xs">{r.restorative_approach}</p>
                      </div>
                    )}

                    {/* perpetrator addressed */}
                    {r.perpetrator_addressed && (
                      <div>
                        <p className="font-medium mb-1">How the Perpetrator was Addressed</p>
                        <p className="text-muted-foreground text-xs">{r.perpetrator_addressed}</p>
                      </div>
                    )}

                    {/* prevention */}
                    {r.prevention_measures_added.length > 0 && (
                      <div>
                        <p className="font-medium mb-1 text-blue-700">Prevention Measures Added</p>
                        <ul className="space-y-1">
                          {r.prevention_measures_added.map((m, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <Shield className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* learnings */}
                    {r.learnings && (
                      <div className="bg-purple-50 border border-purple-200 rounded p-2">
                        <p className="font-medium text-xs text-purple-800 mb-1">Learnings</p>
                        <p className="text-xs text-purple-700">{r.learnings}</p>
                      </div>
                    )}

                    {/* follow up */}
                    <div className="text-xs text-muted-foreground">
                      Follow-up review: <span className="font-medium text-foreground">{r.follow_up_date}</span>
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
          <p>
            Hate incidents must be recorded and addressed under the Equality Act 2010, the Public Sector Equality
            Duty, and Quality Standard 5 (Protection of Children) of the Children&apos;s Homes Regulations 2015.
            Where an incident may also be a notifiable event under Regulation 40, Ofsted must be notified without
            delay. The local authority and (where relevant) the placing authority must be informed. Hate crimes
            must be reported to the police where the affected child consents, or where there is a safeguarding
            duty to report regardless of consent. Records are reviewed at each Reg 44 visit, in supervision, and in
            quarterly equality monitoring. The home&apos;s response is led by the affected child&apos;s wishes — but
            the duty to record, escalate where there is a safeguarding concern, and learn from each incident is the
            home&apos;s, not the child&apos;s.
          </p>
        </div>
      </div>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}

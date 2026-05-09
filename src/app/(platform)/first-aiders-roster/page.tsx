"use client";

import { useMemo, useState } from "react";
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
  HeartPulse, Shield, AlertCircle, ChevronUp, ChevronDown, ArrowUpDown, Search, Award, Calendar, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import type {
  FirstAiderRecord, FirstAidCertType, FirstAidCertStatus,
} from "@/types/extended";
import {
  FIRST_AID_CERT_TYPE_LABEL, FIRST_AID_CERT_STATUS_LABEL,
} from "@/types/extended";
import { useFirstAiderRecords } from "@/hooks/use-first-aider-records";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const STATUS_CLR: Record<FirstAidCertStatus, string> = {
  in_date: "bg-green-100 text-green-800 border-green-200",
  expiring_soon: "bg-amber-100 text-amber-800 border-amber-200",
  expired: "bg-red-100 text-red-800 border-red-200",
  renewal_booked: "bg-sky-100 text-sky-800 border-sky-200",
};

const CERT_TYPES = Object.keys(FIRST_AID_CERT_TYPE_LABEL) as FirstAidCertType[];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function FirstAidersRosterPage() {
  const { data: res, isLoading } = useFirstAiderRecords();
  const records = res?.data ?? [];
  const [search, setSearch] = useState("");
  const [filterCert, setFilterCert] = useState<string>("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let rows = records.filter((r) => {
      if (filterCert !== "all" && !r.certifications.some((c) => c.type === filterCert)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          getStaffName(r.staff_id).toLowerCase().includes(q) ||
          r.certifications.some((c) => FIRST_AID_CERT_TYPE_LABEL[c.type].toLowerCase().includes(q) || c.provider.toLowerCase().includes(q)) ||
          r.home_roles_covered.some((h) => h.toLowerCase().includes(q))
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return getStaffName(a.staff_id).localeCompare(getStaffName(b.staff_id));
        case "name-desc":
          return getStaffName(b.staff_id).localeCompare(getStaffName(a.staff_id));
        case "lead-first": {
          const av = a.is_current_lead_first_aider ? 0 : 1;
          const bv = b.is_current_lead_first_aider ? 0 : 1;
          return av - bv;
        }
        case "review":
          return a.review_date.localeCompare(b.review_date);
        default:
          return 0;
      }
    });
    return rows;
  }, [records, search, filterCert, sortBy]);

  const leadCount = records.filter((r) => r.is_current_lead_first_aider).length;
  const allCerts = records.flatMap((r) => r.certifications);
  const expiringCount = allCerts.filter((c) => c.status === "expiring_soon").length;
  const expiredCount = allCerts.filter((c) => c.status === "expired").length;
  const mhfaTrained = records.filter((r) =>
    r.certifications.some((c) => c.type === "mental_health_first_aid" && (c.status === "in_date" || c.status === "expiring_soon"))
  ).length;

  const stats = [
    { label: "Lead First Aiders", value: leadCount, icon: Shield, clr: "text-sky-600", bg: "bg-sky-50" },
    { label: "Expiring (60d)", value: expiringCount, icon: AlertCircle, clr: "text-amber-600", bg: "bg-amber-50" },
    { label: "Expired", value: expiredCount, icon: AlertCircle, clr: "text-red-600", bg: "bg-red-50" },
    { label: "MHFA-trained", value: mhfaTrained, icon: HeartPulse, clr: "text-teal-600", bg: "bg-teal-50" },
  ];

  const exportCols: ExportColumn<FirstAiderRecord>[] = [
    { header: "Staff", accessor: (r: FirstAiderRecord) => getStaffName(r.staff_id) },
    { header: "Lead First Aider", accessor: (r: FirstAiderRecord) => (r.is_current_lead_first_aider ? "Yes" : "No") },
    { header: "Certifications", accessor: (r: FirstAiderRecord) => r.certifications.map((c) => FIRST_AID_CERT_TYPE_LABEL[c.type]).join("; ") },
    { header: "In Date", accessor: (r: FirstAiderRecord) => String(r.certifications.filter((c) => c.status === "in_date").length) },
    { header: "Expiring/Expired", accessor: (r: FirstAiderRecord) => String(r.certifications.filter((c) => c.status === "expiring_soon" || c.status === "expired").length) },
    { header: "Earliest Expiry", accessor: (r: FirstAiderRecord) => [...r.certifications].sort((a, b) => a.expiry_date.localeCompare(b.expiry_date))[0]?.expiry_date ?? "" },
    { header: "Shift Pattern", accessor: (r: FirstAiderRecord) => r.primary_shift_pattern },
    { header: "Home Roles", accessor: (r: FirstAiderRecord) => r.home_roles_covered.join("; ") },
    { header: "Review Date", accessor: (r: FirstAiderRecord) => r.review_date },
  ];

  return (
    <PageShell
      title="First Aiders Roster"
      subtitle="HSE First Aid Needs Assessment · CHR Quality Standard 8 · Reg 31"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="First Aiders Roster" />
          <ExportButton data={filtered} columns={exportCols} filename="first-aiders-roster" />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <div id="print-area">
        {/* stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((s) => (
            <Card key={s.label} className={cn("border-l-4", s.bg.replace("bg-", "border-l-").replace("-50", "-300"))}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* defib location callout */}
        <div className="bg-gradient-to-r from-sky-50 to-teal-50 border border-sky-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <HeartPulse className="h-6 w-6 text-sky-700 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-sky-900">AED / Defibrillator location</p>
            <p className="text-sky-800">
              Wall-mounted in the staff office (ground floor, by the medication cupboard). Pad expiry checked weekly on the H&amp;S walkround.
              Battery service date logged with Resuscitation Council UK guidance. All AED-trained staff above are familiar with deployment.
            </p>
          </div>
        </div>

        {/* alerts */}
        {expiredCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800">{expiredCount} expired certification(s)</p>
              <p className="text-red-700">
                Staff with expired first aid certification must not be the sole first aider on shift. Pair with an in-date first aider until renewal.
              </p>
            </div>
          </div>
        )}

        {/* filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff, certification, provider…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterCert} onValueChange={setFilterCert}>
            <SelectTrigger className="w-[260px]">
              <Award className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All certification types</SelectItem>
              {CERT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{FIRST_AID_CERT_TYPE_LABEL[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name A–Z</SelectItem>
              <SelectItem value="name-desc">Name Z–A</SelectItem>
              <SelectItem value="lead-first">Lead first aider first</SelectItem>
              <SelectItem value="review">By review date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* roster cards */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expanded[r.id];
            const inDateCount = r.certifications.filter((c) => c.status === "in_date").length;
            const concernCount = r.certifications.filter((c) => c.status === "expiring_soon" || c.status === "expired").length;
            return (
              <Card
                key={r.id}
                className={cn(
                  "border-l-4",
                  r.is_current_lead_first_aider ? "border-l-sky-500" : concernCount > 0 ? "border-l-amber-400" : "border-l-teal-400"
                )}
              >
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex flex-wrap items-center gap-2">
                        {getStaffName(r.staff_id)}
                        {r.is_current_lead_first_aider && (
                          <Badge variant="outline" className="bg-sky-100 text-sky-800 border-sky-200">
                            <Shield className="h-3 w-3 mr-1" /> Lead First Aider
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                          {inDateCount} in-date
                        </Badge>
                        {concernCount > 0 && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                            {concernCount} expiring/expired
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.primary_shift_pattern} · Review: {r.review_date}
                      </p>
                    </div>
                    {open ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* certifications */}
                    <div>
                      <p className="font-medium mb-2 flex items-center gap-1">
                        <Award className="h-4 w-4 text-sky-600" /> Certifications
                      </p>
                      <div className="space-y-2">
                        {r.certifications.map((c, i) => (
                          <div
                            key={i}
                            className="border rounded-lg p-3 bg-gradient-to-r from-sky-50/50 to-transparent"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                              <span className="font-medium">{FIRST_AID_CERT_TYPE_LABEL[c.type]}</span>
                              <Badge variant="outline" className={cn("text-xs", STATUS_CLR[c.status])}>
                                {FIRST_AID_CERT_STATUS_LABEL[c.status]}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Issued: {c.issued_date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Expires: {c.expiry_date}
                              </span>
                              <span>Provider: {c.provider}</span>
                            </div>
                            {c.renewal_booked && (
                              <p className="text-xs text-sky-700 mt-1">
                                Renewal booked: {c.renewal_booked}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* shift + roles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-teal-50/60 border border-teal-100 rounded-lg p-3">
                        <p className="font-medium text-teal-900 text-xs mb-1">Primary shift pattern</p>
                        <p className="text-teal-800 text-xs">{r.primary_shift_pattern}</p>
                      </div>
                      <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-3">
                        <p className="font-medium text-blue-900 text-xs mb-1">Home roles covered</p>
                        <ul className="list-disc list-inside text-blue-800 text-xs space-y-0.5">
                          {r.home_roles_covered.map((h, i) => (
                            <li key={i}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {r.notes && (
                      <div>
                        <p className="font-medium mb-1">Notes</p>
                        <p className="text-muted-foreground text-xs">{r.notes}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                      <span>Review date: {r.review_date}</span>
                      <span>{r.certifications.length} certification(s) on file</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory framework */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>
            Health &amp; Safety (First-Aid) Regulations 1981 — employers must provide adequate and appropriate equipment, facilities and personnel
            based on a written HSE first aid needs assessment. Children&apos;s Homes (England) Regulations 2015, Quality Standard 8 (Health &amp; Wellbeing)
            requires the home to meet children&apos;s health needs, including timely first aid response. Reg 31 requires accurate records of staff
            qualifications and training to be maintained and available for inspection. Resuscitation Council UK guidelines inform AED placement,
            checks, and CPR/AED training currency. At least one paediatric first aid trained staff member should be on shift at all times where
            children are present, with a deputised lead first aider available.
          </p>
        </div>
      </div>
      )}
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}

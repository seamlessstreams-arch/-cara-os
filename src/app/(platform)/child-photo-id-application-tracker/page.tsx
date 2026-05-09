"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FileText, Camera, ShieldCheck, ChevronUp, ChevronDown, ArrowUpDown, Search, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import type { PhotoIdRecord, PhotoIdType, PhotoIdStatus } from "@/types/extended";
import { PHOTO_ID_TYPE_LABEL, PHOTO_ID_STATUS_LABEL } from "@/types/extended";
import { usePhotoIdRecords } from "@/hooks/use-photo-id-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── colour maps ──────────────────────────────────────────────────────────── */

const ID_TYPE_CLR: Record<PhotoIdType, string> = {
  british_passport: "bg-sky-100 text-sky-800",
  provisional_driving_licence: "bg-blue-100 text-blue-800",
  citizen_card: "bg-teal-100 text-teal-800",
  young_scot_card: "bg-indigo-100 text-indigo-800",
  photo_voter_id: "bg-purple-100 text-purple-800",
  pass_card: "bg-cyan-100 text-cyan-800",
  other: "bg-gray-100 text-gray-800",
};

const STATUS_CLR: Record<PhotoIdStatus, string> = {
  considering_planning: "bg-gray-100 text-gray-800",
  documents_being_gathered: "bg-amber-100 text-amber-800",
  application_drafted: "bg-yellow-100 text-yellow-800",
  application_submitted: "bg-blue-100 text-blue-800",
  awaiting_biometrics: "bg-indigo-100 text-indigo-800",
  issued: "bg-green-100 text-green-800",
  renewal_due: "bg-orange-100 text-orange-800",
  lost_replacement_applied: "bg-red-100 text-red-800",
  not_applicable: "bg-slate-100 text-slate-800",
};

/* ── helpers ──────────────────────────────────────────────────────────────── */

const fmtGBP = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);

const daysUntil = (iso?: string) => {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  const now = new Date().getTime();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};

/* ── component ───────────────────────────────────────────────────────────── */

export default function ChildPhotoIdApplicationTrackerPage() {
  const { data: raw, isLoading } = usePhotoIdRecords();
  const items = raw?.data ?? [];

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("name");
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  const filtered = useMemo(() => {
    let out = [...items];
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(r =>
        getYPName(r.child_id).toLowerCase().includes(s) ||
        PHOTO_ID_TYPE_LABEL[r.id_type].toLowerCase().includes(s) ||
        PHOTO_ID_STATUS_LABEL[r.status].toLowerCase().includes(s) ||
        (r.document_number ?? "").toLowerCase().includes(s)
      );
    }
    if (typeFilter !== "all") out = out.filter(r => r.id_type === typeFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "name": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "type": return a.id_type.localeCompare(b.id_type);
        case "status": return a.status.localeCompare(b.status);
        case "expiry": {
          const av = a.expiry_date ?? "9999-12-31";
          const bv = b.expiry_date ?? "9999-12-31";
          return av.localeCompare(bv);
        }
        case "cost": return (b.cost_paid ?? 0) - (a.cost_paid ?? 0);
        default: return 0;
      }
    });
    return out;
  }, [items, search, typeFilter, sortBy]);

  if (isLoading) {
    return (
      <PageShell
        title="Child Photo ID Application Tracker"
        subtitle="Passport, provisional licence, Citizen Card, voter ID and under-16 photo ID applications, renewals and storage — Care Leavers (England) Regulations 2010 and s.23B(8) Children Act 1989"
      >
        <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
      </PageShell>
    );
  }

  const issuedCount = items.filter(r => r.status === "issued").length;
  const inProgressCount = items.filter(r =>
    r.status === "documents_being_gathered" ||
    r.status === "application_drafted" ||
    r.status === "application_submitted" ||
    r.status === "awaiting_biometrics" ||
    r.status === "lost_replacement_applied"
  ).length;
  const expiringSoonCount = items.filter(r => {
    const days = daysUntil(r.expiry_date);
    return r.status === "issued" && days !== null && days <= 90 && days >= 0;
  }).length;
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const totalCostYTD = items
    .filter(r => (r.application_date ?? "") >= yearStart)
    .reduce((s, r) => s + (r.cost_paid ?? 0), 0);

  const exportCols: ExportColumn<PhotoIdRecord>[] = [
    { header: "Young Person", accessor: (r: PhotoIdRecord) => getYPName(r.child_id) },
    { header: "Recorded Date", accessor: (r: PhotoIdRecord) => r.recorded_date },
    { header: "ID Type", accessor: (r: PhotoIdRecord) => PHOTO_ID_TYPE_LABEL[r.id_type] },
    { header: "Status", accessor: (r: PhotoIdRecord) => PHOTO_ID_STATUS_LABEL[r.status] },
    { header: "Application Date", accessor: (r: PhotoIdRecord) => r.application_date ?? "" },
    { header: "Cost Paid", accessor: (r: PhotoIdRecord) => r.cost_paid !== undefined ? fmtGBP(r.cost_paid) : "" },
    { header: "Funding Source", accessor: (r: PhotoIdRecord) => r.funding_source ?? "" },
    { header: "Document Number", accessor: (r: PhotoIdRecord) => r.document_number ?? "" },
    { header: "Issue Date", accessor: (r: PhotoIdRecord) => r.issue_date ?? "" },
    { header: "Expiry Date", accessor: (r: PhotoIdRecord) => r.expiry_date ?? "" },
    { header: "Storage Location", accessor: (r: PhotoIdRecord) => r.storage_location },
    { header: "Child Has Original", accessor: (r: PhotoIdRecord) => r.child_has_original ? "Yes" : "No" },
    { header: "Copies Kept", accessor: (r: PhotoIdRecord) => r.copies_kept.join("; ") },
    { header: "Evidence Provided", accessor: (r: PhotoIdRecord) => r.evidence_provided_to_authority.join("; ") },
    { header: "LAC Challenges", accessor: (r: PhotoIdRecord) => r.unique_challenges_for_lac.join("; ") },
    { header: "Child Voice", accessor: (r: PhotoIdRecord) => r.child_voice },
    { header: "Staff Observation", accessor: (r: PhotoIdRecord) => r.staff_observation },
    { header: "Review Date", accessor: (r: PhotoIdRecord) => r.review_date },
    { header: "Key Worker", accessor: (r: PhotoIdRecord) => getStaffName(r.key_worker) },
  ];

  return (
    <PageShell
      title="Child Photo ID Application Tracker"
      subtitle="Passport, provisional licence, Citizen Card, voter ID and under-16 photo ID applications, renewals and storage — Care Leavers (England) Regulations 2010 and s.23B(8) Children Act 1989"
      actions={[
        <PrintButton key="p" title="Photo ID Applications" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="child-photo-id-application-tracker" />,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "IDs Issued", value: issuedCount, icon: ShieldCheck, colour: "text-green-600" },
            { label: "Applications In Progress", value: inProgressCount, icon: FileText, colour: "text-sky-600" },
            { label: "Expiring within 90 days", value: expiringSoonCount, icon: Calendar, colour: "text-orange-600" },
            { label: "Total Cost YTD", value: fmtGBP(totalCostYTD), icon: Camera, colour: "text-teal-600" },
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

        {/* filter bar */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Name, ID type, status, document number…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="w-64">
                <Label className="text-xs">ID Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ID types</SelectItem>
                    {Object.entries(PHOTO_ID_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="type">ID Type</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="expiry">Expiry Date</SelectItem>
                    <SelectItem value="cost">Cost Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* records */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            const days = daysUntil(r.expiry_date);
            const expiringSoon = r.status === "issued" && days !== null && days <= 90 && days >= 0;
            const expired = days !== null && days < 0 && r.status !== "renewal_due";

            return (
              <Card key={r.id} className="border-l-4 border-sky-400 bg-sky-50/30">
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{getYPName(r.child_id)}</CardTitle>
                        <Badge className={cn("text-xs", ID_TYPE_CLR[r.id_type])}>{PHOTO_ID_TYPE_LABEL[r.id_type]}</Badge>
                        <Badge className={cn("text-xs", STATUS_CLR[r.status])}>{PHOTO_ID_STATUS_LABEL[r.status]}</Badge>
                        {r.expiry_date && (
                          <Badge variant="outline" className={cn("text-xs", expiringSoon && "bg-orange-100 text-orange-800 border-orange-300", expired && "bg-red-100 text-red-800 border-red-300")}>
                            Expires {r.expiry_date}{days !== null && ` (${days >= 0 ? `${days}d` : `${Math.abs(days)}d ago`})`}
                          </Badge>
                        )}
                        <Badge variant="outline" className={cn("text-xs", r.child_has_original ? "bg-teal-50 text-teal-800 border-teal-300" : "bg-slate-50 text-slate-700")}>
                          {r.child_has_original ? "Child holds original" : "Held by placement"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Recorded: {r.recorded_date}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {open && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="rounded-lg border bg-white p-3 space-y-1">
                        <p className="text-xs font-semibold text-sky-800 flex items-center gap-1"><FileText className="h-3 w-3" />Application</p>
                        <p className="text-xs">Application date: <strong>{r.application_date ?? "—"}</strong></p>
                        <p className="text-xs">Cost paid: <strong>{r.cost_paid !== undefined ? fmtGBP(r.cost_paid) : "—"}</strong></p>
                        <p className="text-xs">Funding: <strong>{r.funding_source ?? "—"}</strong></p>
                      </div>
                      <div className="rounded-lg border bg-white p-3 space-y-1">
                        <p className="text-xs font-semibold text-teal-800 flex items-center gap-1"><ShieldCheck className="h-3 w-3" />Document</p>
                        <p className="text-xs">Document number: <span className="font-mono">{r.document_number ?? "—"}</span></p>
                        <p className="text-xs">Issued: <strong>{r.issue_date ?? "—"}</strong></p>
                        <p className="text-xs">Expires: <strong>{r.expiry_date ?? "—"}</strong></p>
                      </div>
                    </div>

                    {/* storage */}
                    <div className="rounded-lg border bg-white p-3 text-sm space-y-1">
                      <p className="text-xs font-semibold text-blue-800 flex items-center gap-1"><Camera className="h-3 w-3" />Storage and Copies</p>
                      <p className="text-xs">Storage location: <strong>{r.storage_location}</strong></p>
                      <p className="text-xs">Child has original: <strong>{r.child_has_original ? "Yes" : "No"}</strong></p>
                      {r.copies_kept.length > 0 && (
                        <ul className="list-disc list-inside text-xs space-y-0.5 mt-1">
                          {r.copies_kept.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      )}
                    </div>

                    {/* evidence */}
                    {r.evidence_provided_to_authority.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1"><FileText className="h-3 w-3" />Evidence Provided to Issuing Authority</p>
                        <ul className="list-disc list-inside text-sm space-y-0.5">
                          {r.evidence_provided_to_authority.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* LAC challenges */}
                    {r.unique_challenges_for_lac.length > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-semibold text-amber-900 mb-1">Unique Challenges for Looked-After Children</p>
                        <ul className="list-disc list-inside text-sm space-y-0.5 text-amber-900">
                          {r.unique_challenges_for_lac.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* child voice */}
                    <div className="rounded-lg bg-sky-50 border border-sky-200 p-3">
                      <p className="text-xs font-semibold text-sky-800 mb-1">Child&apos;s Voice</p>
                      <p className="text-sm italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>

                    {/* staff observation */}
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-1">Staff Observation</p>
                      <p className="text-sm">{r.staff_observation}</p>
                    </div>

                    {/* meta */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Key Worker: <strong>{getStaffName(r.key_worker)}</strong></span>
                      <span>Review Date: <strong>{r.review_date}</strong></span>
                    </div>

                    <SmartLinkPanel sourceType="photo-id-record" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory Framework</p>
          <p>Photo ID provision for looked-after children and care leavers is recorded under the Care Leavers (England) Regulations 2010 and section 23B(8) of the Children Act 1989, which places a duty on the local authority (as corporate parent) to assist care leavers in obtaining identity documents. The CitizenCard free-for-care-leavers scheme provides PASS-accredited photo ID at no cost. Photo Voter ID provision aligns with the Elections Act 2022 — a Citizen Card or passport is an accepted form. Pathway Plan reviews ensure ID is in place before a young person needs it for voting, banking, travel or employment. The work supports UNCRC Article 7 (right to identity registration) and Article 8 (preserving identity). Without ID, looked-after children disproportionately face barriers to voting, banking, accessing healthcare records, travel, employment and housing — this tracker exists to prevent that.</p>
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

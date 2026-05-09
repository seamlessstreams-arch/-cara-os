"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
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
  Globe, FileText, Shield, ChevronUp, ChevronDown, ArrowUpDown, Search, Calendar, Heart, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import type { ImmigrationUascRecord, ImmigrationStatus } from "@/types/extended";
import { IMMIGRATION_STATUS_LABEL, ENGLISH_LANGUAGE_LEVEL_LABEL } from "@/types/extended";
import { useImmigrationUascRecords } from "@/hooks/use-immigration-uasc-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const STATUS_CLR: Record<ImmigrationStatus, string> = {
  british_citizen: "bg-emerald-100 text-emerald-800",
  settled_ilr: "bg-teal-100 text-teal-800",
  pre_settled_status: "bg-cyan-100 text-cyan-800",
  uasc_claim_pending: "bg-amber-100 text-amber-800",
  refugee_status: "bg-green-100 text-green-800",
  humanitarian_protection: "bg-lime-100 text-lime-800",
  discretionary_leave: "bg-yellow-100 text-yellow-800",
  uasc_leave_until_17_5: "bg-orange-100 text-orange-800",
  appeal_pending: "bg-rose-100 text-rose-800",
  refused_appeals_exhausted: "bg-red-100 text-red-800",
  naturalisation_in_progress: "bg-indigo-100 text-indigo-800",
  other: "bg-slate-100 text-slate-800",
};

const STATUS_BORDER: Record<ImmigrationStatus, string> = {
  british_citizen: "border-emerald-400 bg-emerald-50",
  settled_ilr: "border-teal-400 bg-teal-50",
  pre_settled_status: "border-cyan-400 bg-cyan-50",
  uasc_claim_pending: "border-amber-400 bg-amber-50",
  refugee_status: "border-green-400 bg-green-50",
  humanitarian_protection: "border-lime-400 bg-lime-50",
  discretionary_leave: "border-yellow-400 bg-yellow-50",
  uasc_leave_until_17_5: "border-orange-400 bg-orange-50",
  appeal_pending: "border-rose-400 bg-rose-50",
  refused_appeals_exhausted: "border-red-400 bg-red-50",
  naturalisation_in_progress: "border-indigo-400 bg-indigo-50",
  other: "border-slate-400 bg-slate-50",
};

/* ── component ─────────────────────────────────────────────────────────────── */

export default function ChildImmigrationUascSupportPage() {
  const { data: queryData, isLoading } = useImmigrationUascRecords();
  const items = queryData?.data ?? [];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("status");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const ypLabel = (id: string) => {
    if (id.startsWith("yp_")) return getYPName(id);
    return id;
  };

  const filtered = useMemo(() => {
    let out = [...items];
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(r =>
        ypLabel(r.child_id).toLowerCase().includes(s) ||
        IMMIGRATION_STATUS_LABEL[r.immigration_status].toLowerCase().includes(s) ||
        (r.country_of_origin?.toLowerCase().includes(s) ?? false)
      );
    }
    if (statusFilter !== "all") out = out.filter(r => r.immigration_status === statusFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "yp": return ypLabel(a.child_id).localeCompare(ypLabel(b.child_id));
        case "review": return a.review_date.localeCompare(b.review_date);
        case "recorded": return b.recorded_date.localeCompare(a.recorded_date);
        default: {
          const ord: ImmigrationStatus[] = [
            "uasc_claim_pending", "appeal_pending", "uasc_leave_until_17_5",
            "discretionary_leave", "humanitarian_protection", "refugee_status",
            "pre_settled_status", "settled_ilr", "naturalisation_in_progress",
            "british_citizen", "refused_appeals_exhausted", "other",
          ];
          return ord.indexOf(a.immigration_status) - ord.indexOf(b.immigration_status);
        }
      }
    });
    return out;
  }, [items, search, statusFilter, sortBy]);

  const activeMatters = items.filter(r =>
    r.immigration_status !== "british_citizen" &&
    r.immigration_status !== "settled_ilr"
  ).length;
  const claimsPending = items.filter(r =>
    r.immigration_status === "uasc_claim_pending" || r.immigration_status === "appeal_pending"
  ).length;
  const ageAssessmentsCompleted = items.filter(r => r.age_assessment_completed).length;
  const reviewsDue90 = items.filter(r => {
    if (!r.review_date) return false;
    const dt = new Date(r.review_date).getTime();
    const now = Date.now();
    return dt - now <= 90 * 24 * 60 * 60 * 1000 && dt - now >= 0;
  }).length;

  const exportCols: ExportColumn<ImmigrationUascRecord>[] = useMemo(() => [
    { header: "Young Person", accessor: (r: ImmigrationUascRecord) => ypLabel(r.child_id) },
    { header: "Recorded Date", accessor: (r: ImmigrationUascRecord) => r.recorded_date },
    { header: "Immigration Status", accessor: (r: ImmigrationUascRecord) => IMMIGRATION_STATUS_LABEL[r.immigration_status] },
    { header: "Country of Origin", accessor: (r: ImmigrationUascRecord) => r.country_of_origin ?? "" },
    { header: "Arrival UK", accessor: (r: ImmigrationUascRecord) => r.arrival_uk ?? "" },
    { header: "Age at Arrival", accessor: (r: ImmigrationUascRecord) => r.age_at_arrival ?? "" },
    { header: "Age Assessment Completed", accessor: (r: ImmigrationUascRecord) => r.age_assessment_completed ? "Yes" : "No" },
    { header: "Age Assessment Date", accessor: (r: ImmigrationUascRecord) => r.age_assessment_date ?? "" },
    { header: "Age Assessment Outcome", accessor: (r: ImmigrationUascRecord) => r.age_assessment_outcome ?? "" },
    { header: "Asylum Claim Submitted", accessor: (r: ImmigrationUascRecord) => r.asylum_claim?.submitted_date ?? "" },
    { header: "Asylum First Hearing", accessor: (r: ImmigrationUascRecord) => r.asylum_claim?.first_hearing_date ?? "" },
    { header: "Asylum Reasons", accessor: (r: ImmigrationUascRecord) => r.asylum_claim?.reasons_for_claim.join("; ") ?? "" },
    { header: "Legal Rep", accessor: (r: ImmigrationUascRecord) => r.legal_representative ? `${r.legal_representative.name} (${r.legal_representative.firm})` : "" },
    { header: "Legal Rep LAA-funded", accessor: (r: ImmigrationUascRecord) => r.legal_representative ? (r.legal_representative.laa_funded ? "Yes" : "No") : "" },
    { header: "Home Office References", accessor: (r: ImmigrationUascRecord) => r.home_office_references.map(h => `${h.type}: ${h.reference}`).join("; ") },
    { header: "Documents Held", accessor: (r: ImmigrationUascRecord) => r.documents_held.join("; ") },
    { header: "Documents Awaiting", accessor: (r: ImmigrationUascRecord) => r.documents_awaiting.join("; ") },
    { header: "English Level", accessor: (r: ImmigrationUascRecord) => ENGLISH_LANGUAGE_LEVEL_LABEL[r.english_language_level] },
    { header: "ESOL Engaged", accessor: (r: ImmigrationUascRecord) => r.esol_engaged ? "Yes" : "No" },
    { header: "Family Tracing Active", accessor: (r: ImmigrationUascRecord) => r.family_tracing_active ? "Yes" : "No" },
    { header: "Family Tracing Service", accessor: (r: ImmigrationUascRecord) => r.family_tracing_service ?? "" },
    { header: "Culture / Community Links", accessor: (r: ImmigrationUascRecord) => r.culture_community_links.join("; ") },
    { header: "Trauma-Informed Support", accessor: (r: ImmigrationUascRecord) => r.trauma_informed_support.join("; ") },
    { header: "NRPF Considerations", accessor: (r: ImmigrationUascRecord) => r.nrpf_considerations.join("; ") },
    { header: "Pathway Plan Linked", accessor: (r: ImmigrationUascRecord) => r.pathway_plan_linked_to_immigration ? "Yes" : "No" },
    { header: "Child's Voice", accessor: (r: ImmigrationUascRecord) => r.child_voice },
    { header: "Staff Observation", accessor: (r: ImmigrationUascRecord) => r.staff_observation },
    { header: "Review Date", accessor: (r: ImmigrationUascRecord) => r.review_date },
    { header: "Key Worker", accessor: (r: ImmigrationUascRecord) => getStaffName(r.key_worker) },
  ], []);

  if (isLoading) {
    return (
      <PageShell
        title="Child Immigration & UASC Support"
        subtitle="Per-child immigration status, age assessment, asylum claim, family tracing, leave-to-remain reviews — handled with trauma-informed care"
      >
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Child Immigration & UASC Support"
      subtitle="Per-child immigration status, age assessment, asylum claim, family tracing, leave-to-remain reviews — handled with trauma-informed care"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={[
        <PrintButton key="p" title="Immigration & UASC Support" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="child-immigration-uasc-support" />,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* sensitivity / framing note */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex items-start gap-3">
          <Globe className="h-5 w-5 text-amber-700 mt-0.5" />
          <div>
            <p className="font-semibold">Every child's immigration status matters — and is handled with care</p>
            <p className="text-xs mt-1">Whether a child is a UK citizen, holds settled status, or is an unaccompanied asylum-seeking child (UASC), this record helps us hold the right information about identity, entitlements and risk in one place. We work with specialist immigration solicitors, the British Red Cross and the Refugee Council. We never treat heritage as suspicion. We never gather facial or biometric data outside lawful Home Office processes. We support family tracing only with the young person's informed consent and with safety paramount.</p>
          </div>
        </div>

        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Children with active immigration matters", value: activeMatters, icon: Globe, colour: "text-amber-700" },
            { label: "Asylum claims pending", value: claimsPending, icon: FileText, colour: "text-rose-700" },
            { label: "Age assessments completed", value: ageAssessmentsCompleted, icon: Shield, colour: "text-teal-700" },
            { label: "Reviews due in 90 days", value: reviewsDue90, icon: Calendar, colour: "text-indigo-700" },
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

        {/* filters / sort */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Young person, country, status…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="w-56">
                <Label className="text-xs">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {(Object.entries(IMMIGRATION_STATUS_LABEL) as [ImmigrationStatus, string][]).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Stage priority</SelectItem>
                    <SelectItem value="yp">Young person</SelectItem>
                    <SelectItem value="review">Review date</SelectItem>
                    <SelectItem value="recorded">Recorded date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* expandable cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", STATUS_BORDER[r.immigration_status])}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{ypLabel(r.child_id)}</CardTitle>
                        <Badge className={cn("text-xs", STATUS_CLR[r.immigration_status])}>{IMMIGRATION_STATUS_LABEL[r.immigration_status]}</Badge>
                        {r.country_of_origin && (
                          <Badge variant="outline" className="text-xs"><Globe className="h-3 w-3 mr-1" />{r.country_of_origin}</Badge>
                        )}
                        {r.asylum_claim && (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />Asylum claim {r.asylum_claim.first_hearing_date ? "— hearing booked" : "— submitted"}
                          </Badge>
                        )}
                        {r.family_tracing_active && (
                          <Badge variant="outline" className="text-xs bg-rose-50 text-rose-800 border-rose-200">Family tracing active</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Key worker: {getStaffName(r.key_worker)}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" />Arrival & age</p>
                        <ul className="text-xs space-y-0.5">
                          <li><span className="text-muted-foreground">Country of origin:</span> <strong>{r.country_of_origin ?? "—"}</strong></li>
                          <li><span className="text-muted-foreground">Arrival in UK:</span> <strong>{r.arrival_uk ?? "—"}</strong></li>
                          <li><span className="text-muted-foreground">Age at arrival:</span> <strong>{r.age_at_arrival ?? "—"}</strong></li>
                          <li><span className="text-muted-foreground">Recorded:</span> <strong>{r.recorded_date}</strong></li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1"><Shield className="h-3 w-3" />Age assessment</p>
                        {r.age_assessment_completed ? (
                          <>
                            <p className="text-xs"><span className="text-muted-foreground">Completed:</span> <strong>{r.age_assessment_date ?? "—"}</strong></p>
                            <p className="text-sm mt-1">{r.age_assessment_outcome ?? "—"}</p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">Not applicable / not required.</p>
                        )}
                      </div>
                    </div>

                    {/* asylum claim */}
                    {r.asylum_claim && (
                      <div className="rounded-lg bg-rose-50 border border-rose-200 p-3">
                        <p className="text-xs font-semibold text-rose-800 mb-1 flex items-center gap-1"><FileText className="h-3 w-3" />Asylum claim</p>
                        <ul className="text-xs space-y-0.5 text-rose-900">
                          <li><span className="text-rose-700">Submitted:</span> <strong>{r.asylum_claim.submitted_date}</strong></li>
                          <li><span className="text-rose-700">First hearing:</span> <strong>{r.asylum_claim.first_hearing_date ?? "—"}</strong></li>
                        </ul>
                        <p className="text-xs font-semibold text-rose-800 mt-2">Reasons for claim</p>
                        <ul className="text-sm text-rose-900 list-disc list-inside space-y-0.5">
                          {r.asylum_claim.reasons_for_claim.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* legal rep + Home Office references */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                        <p className="text-xs font-semibold text-indigo-800 mb-1">Legal representative</p>
                        {r.legal_representative ? (
                          <ul className="text-sm text-indigo-900 space-y-0.5">
                            <li><strong>{r.legal_representative.name}</strong> — {r.legal_representative.firm}</li>
                            <li className="text-xs">Specialism: {r.legal_representative.specialism}</li>
                            <li className="text-xs">LAA-funded: <strong>{r.legal_representative.laa_funded ? "Yes" : "No"}</strong></li>
                          </ul>
                        ) : <p className="text-sm text-indigo-900">Not engaged.</p>}
                      </div>
                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                        <p className="text-xs font-semibold text-slate-800 mb-1">Home Office references</p>
                        {r.home_office_references.length > 0 ? (
                          <ul className="text-sm text-slate-900 space-y-0.5">
                            {r.home_office_references.map((h, i) => (
                              <li key={i} className="text-xs"><span className="text-slate-600">{h.type}:</span> <strong className="font-mono">{h.reference}</strong></li>
                            ))}
                          </ul>
                        ) : <p className="text-sm text-slate-900">No Home Office references — not applicable.</p>}
                      </div>
                    </div>

                    {/* documents */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                        <p className="text-xs font-semibold text-emerald-800 mb-1">Documents held</p>
                        {r.documents_held.length > 0 ? (
                          <ul className="text-sm text-emerald-900 list-disc list-inside space-y-0.5">
                            {r.documents_held.map((d, i) => <li key={i}>{d}</li>)}
                          </ul>
                        ) : <p className="text-sm text-emerald-900">None recorded.</p>}
                      </div>
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-semibold text-amber-800 mb-1">Documents awaiting</p>
                        {r.documents_awaiting.length > 0 ? (
                          <ul className="text-sm text-amber-900 list-disc list-inside space-y-0.5">
                            {r.documents_awaiting.map((d, i) => <li key={i}>{d}</li>)}
                          </ul>
                        ) : <p className="text-sm text-amber-900">None outstanding.</p>}
                      </div>
                    </div>

                    {/* English / ESOL / family tracing */}
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold mb-1">English language</p>
                        <p className="text-xs"><span className="text-muted-foreground">CEFR level:</span> <strong>{ENGLISH_LANGUAGE_LEVEL_LABEL[r.english_language_level]}</strong></p>
                        <p className="text-xs"><span className="text-muted-foreground">ESOL engaged:</span> <strong>{r.esol_engaged ? "Yes" : "No"}</strong></p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1">Family tracing</p>
                        <p className="text-xs"><span className="text-muted-foreground">Active:</span> <strong>{r.family_tracing_active ? "Yes" : "No"}</strong></p>
                        {r.family_tracing_service && <p className="text-xs mt-1">{r.family_tracing_service}</p>}
                      </div>
                    </div>

                    {/* culture community + trauma support */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-teal-50 border border-teal-200 p-3">
                        <p className="text-xs font-semibold text-teal-800 mb-1 flex items-center gap-1"><Heart className="h-3 w-3" />Culture & community links</p>
                        <ul className="text-sm text-teal-900 list-disc list-inside space-y-0.5">
                          {r.culture_community_links.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                        <p className="text-xs font-semibold text-purple-800 mb-1 flex items-center gap-1"><Shield className="h-3 w-3" />Trauma-informed support</p>
                        <ul className="text-sm text-purple-900 list-disc list-inside space-y-0.5">
                          {r.trauma_informed_support.map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                      </div>
                    </div>

                    {/* NRPF */}
                    <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
                      <p className="text-xs font-semibold text-orange-800 mb-1">NRPF (No Recourse to Public Funds) considerations</p>
                      <ul className="text-sm text-orange-900 list-disc list-inside space-y-0.5">
                        {r.nrpf_considerations.map((n, i) => <li key={i}>{n}</li>)}
                      </ul>
                      <p className="text-xs text-orange-700 mt-2">Pathway plan linked to immigration status: <strong>{r.pathway_plan_linked_to_immigration ? "Yes" : "No"}</strong></p>
                    </div>

                    {/* child voice */}
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-xs font-semibold text-amber-800 mb-1">Child's voice</p>
                      <p className="text-sm italic text-amber-900">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>

                    {/* staff observation */}
                    <div>
                      <p className="text-xs font-semibold mb-1">Staff observation</p>
                      <p className="text-sm text-muted-foreground">{r.staff_observation}</p>
                    </div>

                    {/* meta */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Key worker: <strong>{getStaffName(r.key_worker)}</strong></span>
                      <span>Recorded: <strong>{r.recorded_date}</strong></span>
                      <span>Review: <strong>{r.review_date}</strong></span>
                    </div>

                    {/* smart link panel */}
                    <SmartLinkPanel sourceType="immigration_uasc" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory & practice framework</p>
          <p>Immigration Act 1971 and Nationality and Borders Act 2022 — primary statutes governing immigration status, asylum claims and removal. Children Act 1989 — local authority duties to UASC under s.20 (accommodation) and s.17 (children in need); LA holds full corporate parenting responsibility regardless of immigration status. Children (Leaving Care) Act 2000 — care leaver entitlements continue for eligible/relevant/former-relevant young people while immigration matters resolve. Modern Slavery Act 2015 — National Referral Mechanism (NRM) where trafficking is a reasonable suspicion. Statutory Guidance for Local Authorities on the care of unaccompanied asylum-seeking and trafficked children (DfE 2017). Hillingdon Judgment (R (Hillingdon LBC) v Secretary of State 2003) — confirms LA duty to provide s.20 accommodation to UASC. Merton-compliant principles (R (B) v Merton LBC 2003) and ADCS Age Assessment Guidance (AAR) — joint assessment by two qualified social workers, benefit of the doubt, interpreter, appropriate adult, no purely visual assessments. Working Together to Safeguard Children 2023. UNCRC Articles 7 (identity), 8 (preservation of identity), 22 (refugee children). External partners: British Red Cross International Family Tracing; Refugee Council Children's Section; Freedom from Torture; Helen Bamber Foundation; UK Visas and Immigration. Records retained securely; access controlled; data shared only on lawful basis with the child's interests paramount.</p>
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

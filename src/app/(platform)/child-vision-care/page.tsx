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
  Eye, Glasses, Calendar, ChevronUp, ChevronDown, ArrowUpDown, Search, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import type {
  VisionCareRecord,
  VisionStatus,
  GlassesWearConsistency,
} from "@/types/extended";
import {
  VISION_STATUS_LABEL,
  GLASSES_WEAR_CONSISTENCY_LABEL,
} from "@/types/extended";
import { useVisionCareRecords } from "@/hooks/use-vision-care-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const STATUS_CLR: Record<VisionStatus, string> = {
  no_correction_needed: "bg-emerald-100 text-emerald-800",
  prescription_glasses: "bg-sky-100 text-sky-800",
  contact_lenses: "bg-teal-100 text-teal-800",
  glasses_and_contacts: "bg-cyan-100 text-cyan-800",
  awaiting_test: "bg-amber-100 text-amber-800",
  specialist_referral_active: "bg-rose-100 text-rose-800",
};

const BORDER_STATUS: Record<VisionStatus, string> = {
  no_correction_needed: "border-l-emerald-400",
  prescription_glasses: "border-l-sky-500",
  contact_lenses: "border-l-teal-500",
  glasses_and_contacts: "border-l-cyan-500",
  awaiting_test: "border-l-amber-500",
  specialist_referral_active: "border-l-rose-500",
};

const WEAR_CLR: Record<GlassesWearConsistency, string> = {
  always: "bg-emerald-100 text-emerald-800",
  mostly: "bg-sky-100 text-sky-800",
  inconsistent: "bg-amber-100 text-amber-800",
  resists: "bg-rose-100 text-rose-800",
};

const isOverdue = (dateStr?: string) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};

const daysUntil = (dateStr?: string) => {
  if (!dateStr) return Infinity;
  const ms = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function ChildVisionCarePage() {
  const { data: res, isLoading } = useVisionCareRecords();
  const items = res?.data ?? [];

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("review-asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((p) => (p === id ? null : id));

  /* ── derived ─────────────────────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let rows = items.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          getYPName(r.child_id).toLowerCase().includes(q) ||
          (r.optometrist ?? "").toLowerCase().includes(q) ||
          r.staff_observation.toLowerCase().includes(q) ||
          r.child_voice.toLowerCase().includes(q) ||
          r.symptoms_reported.some((s) => s.toLowerCase().includes(q))
        );
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "review-asc": return a.review_date.localeCompare(b.review_date);
        case "review-desc": return b.review_date.localeCompare(a.review_date);
        case "yp": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "status": return a.status.localeCompare(b.status);
        case "test-overdue": {
          const ao = isOverdue(a.next_sight_test_due) ? 0 : 1;
          const bo = isOverdue(b.next_sight_test_due) ? 0 : 1;
          if (ao !== bo) return ao - bo;
          return (a.next_sight_test_due ?? "").localeCompare(b.next_sight_test_due ?? "");
        }
        default: return 0;
      }
    });
    return rows;
  }, [items, search, filterStatus, sortBy]);

  /* ── stats ───────────────────────────────────────────────────────────────── */

  const prescriptionCount = items.filter(
    (r) => r.status === "prescription_glasses" || r.status === "contact_lenses" || r.status === "glasses_and_contacts",
  ).length;

  const overdueTests = items.filter((r) => isOverdue(r.next_sight_test_due)).length;

  const sparesAvailable = items.filter((r) => r.spare_glasses_available).length;

  const reviewsDue90 = items.filter((r) => {
    const days = daysUntil(r.review_date);
    return days >= 0 && days <= 90;
  }).length;

  /* ── export ──────────────────────────────────────────────────────────────── */

  const exportCols: ExportColumn<VisionCareRecord>[] = [
    { header: "Young Person", accessor: (r: VisionCareRecord) => getYPName(r.child_id) },
    { header: "Recorded Date", accessor: (r: VisionCareRecord) => r.recorded_date },
    { header: "Status", accessor: (r: VisionCareRecord) => VISION_STATUS_LABEL[r.status] },
    { header: "Last Sight Test", accessor: (r: VisionCareRecord) => r.last_sight_test_date ?? "" },
    { header: "Next Sight Test Due", accessor: (r: VisionCareRecord) => r.next_sight_test_due ?? "" },
    { header: "Optometrist", accessor: (r: VisionCareRecord) => r.optometrist ?? "" },
    { header: "Right Eye", accessor: (r: VisionCareRecord) => r.prescription?.right ?? "" },
    { header: "Left Eye", accessor: (r: VisionCareRecord) => r.prescription?.left ?? "" },
    { header: "Frame Brand", accessor: (r: VisionCareRecord) => r.glasses_frames?.brand ?? "" },
    { header: "Frame Model", accessor: (r: VisionCareRecord) => r.glasses_frames?.model ?? "" },
    { header: "Frame Purchase Date", accessor: (r: VisionCareRecord) => r.glasses_frames?.purchase_date ?? "" },
    { header: "Spare Glasses Available", accessor: (r: VisionCareRecord) => (r.spare_glasses_available ? "Yes" : "No") },
    { header: "Contact Lens Type", accessor: (r: VisionCareRecord) => r.contact_lens_type ?? "" },
    { header: "Symptoms Reported", accessor: (r: VisionCareRecord) => r.symptoms_reported.join("; ") },
    { header: "Specialist Service", accessor: (r: VisionCareRecord) => r.specialist_referral?.service ?? "" },
    { header: "Specialist Referral Date", accessor: (r: VisionCareRecord) => r.specialist_referral?.date ?? "" },
    { header: "Specialist Reason", accessor: (r: VisionCareRecord) => r.specialist_referral?.reason ?? "" },
    { header: "School Aware", accessor: (r: VisionCareRecord) => (r.school_aware ? "Yes" : "No") },
    { header: "Wears Consistently", accessor: (r: VisionCareRecord) => r.child_wears_consistently ? GLASSES_WEAR_CONSISTENCY_LABEL[r.child_wears_consistently] : "" },
    { header: "Cleaning Routine", accessor: (r: VisionCareRecord) => r.cleaning_routine },
    { header: "Child Voice", accessor: (r: VisionCareRecord) => r.child_voice },
    { header: "Staff Observation", accessor: (r: VisionCareRecord) => r.staff_observation },
    { header: "Review Date", accessor: (r: VisionCareRecord) => r.review_date },
    { header: "Key Worker", accessor: (r: VisionCareRecord) => getStaffName(r.key_worker) },
  ];

  /* ── loading state ─────────────────────────────────────────────────────── */

  if (isLoading) return <PageShell title="Child Vision Care" subtitle="Quality Standard 8 (Health) · NHS sight test entitlement · UNCRC Art. 24 · GOC standards"><div /></PageShell>;

  /* ── render ──────────────────────────────────────────────────────────────── */

  return (
    <PageShell
      title="Child Vision Care"
      subtitle="Quality Standard 8 (Health) · NHS sight test entitlement · UNCRC Art. 24 · GOC standards"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Vision Care" />
          <ExportButton data={filtered} columns={exportCols} filename="child-vision-care" />
        </div>
      }
    >
      <div id="print-area">
        {/* ── stat strip ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Children with Prescriptions", value: prescriptionCount, icon: Glasses, clr: "text-sky-600" },
            { label: "Sight Tests Overdue", value: overdueTests, icon: AlertTriangle, clr: "text-rose-600" },
            { label: "Spare Glasses Available", value: sparesAvailable, icon: Eye, clr: "text-teal-600" },
            { label: "Reviews Due (90d)", value: reviewsDue90, icon: Calendar, clr: "text-cyan-600" },
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

        {/* ── overdue banner ───────────────────────────────────────────────── */}
        {overdueTests > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-rose-800">
                {overdueTests} child / children overdue for an NHS sight test
              </p>
              <p className="text-rose-700">
                Under-16s in education are entitled to a free NHS sight test annually. Care leavers under 25 in
                continuing education also retain free entitlement. Book promptly and record outcomes here.
              </p>
            </div>
          </div>
        )}

        {/* ── NHS entitlement banner ───────────────────────────────────────── */}
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 mb-6 flex items-start gap-2">
          <Eye className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="font-semibold text-sky-800">NHS Sight Test Entitlement</p>
            <p className="text-sky-700">
              Free NHS sight tests for under-16s, full-time students up to 18, and care leavers under 25. NHS optical
              vouchers cover frame and lens costs for eligible looked-after children. Record optometrist details, both
              eye prescriptions, frame information and child&apos;s own voice on wearing glasses or lenses.
            </p>
          </div>
        </div>

        {/* ── filters ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search child, optometrist, symptoms…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[210px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {(Object.entries(VISION_STATUS_LABEL) as [VisionStatus, string][]).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]"><ArrowUpDown className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="review-asc">Review Soonest</SelectItem>
              <SelectItem value="review-desc">Review Latest</SelectItem>
              <SelectItem value="test-overdue">Test Overdue First</SelectItem>
              <SelectItem value="yp">By Child</SelectItem>
              <SelectItem value="status">By Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── records ──────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const open = expandedId === r.id;
            const overdue = isOverdue(r.next_sight_test_due);
            return (
              <Card key={r.id} className={cn("border-l-4", BORDER_STATUS[r.status])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {getYPName(r.child_id)}
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{VISION_STATUS_LABEL[r.status]}</Badge>
                        {r.last_sight_test_date && (
                          <Badge variant="outline" className="bg-slate-100 text-slate-700">
                            <Calendar className="h-3 w-3 mr-1" /> Tested {r.last_sight_test_date}
                          </Badge>
                        )}
                        {r.child_wears_consistently && (
                          <Badge variant="outline" className={WEAR_CLR[r.child_wears_consistently]}>
                            Wears: {GLASSES_WEAR_CONSISTENCY_LABEL[r.child_wears_consistently]}
                          </Badge>
                        )}
                        {overdue && (
                          <Badge variant="outline" className="bg-rose-100 text-rose-800 border-rose-300">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Test overdue
                          </Badge>
                        )}
                        {r.specialist_referral && (
                          <Badge variant="outline" className="bg-rose-50 text-rose-700">
                            Specialist: {r.specialist_referral.service}
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Recorded {r.recorded_date} · Key worker: {getStaffName(r.key_worker)} · Review {r.review_date}
                      </p>
                    </div>
                    {open ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground mt-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground mt-1" />
                    )}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* test summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-sky-50 rounded p-2">
                        <p className="font-medium text-xs">Last Sight Test</p>
                        <p className="text-xs text-muted-foreground">{r.last_sight_test_date ?? "—"}</p>
                      </div>
                      <div className={cn("rounded p-2", overdue ? "bg-rose-50" : "bg-teal-50")}>
                        <p className="font-medium text-xs">Next Test Due</p>
                        <p className="text-xs text-muted-foreground">{r.next_sight_test_due ?? "—"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">Optometrist</p>
                        <p className="text-xs text-muted-foreground">{r.optometrist ?? "—"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2">
                        <p className="font-medium text-xs">School Aware</p>
                        <p className="text-xs text-muted-foreground">{r.school_aware ? "Yes" : "No"}</p>
                      </div>
                    </div>

                    {/* prescription / frames */}
                    {(r.prescription || r.glasses_frames || r.contact_lens_type) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {r.prescription && (
                          <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                            <p className="font-medium mb-1 flex items-center gap-1 text-sky-800">
                              <Eye className="h-4 w-4" /> Prescription
                            </p>
                            <p className="text-xs text-sky-900">Right eye: {r.prescription.right}</p>
                            <p className="text-xs text-sky-900">Left eye: {r.prescription.left}</p>
                          </div>
                        )}
                        {r.glasses_frames && (
                          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                            <p className="font-medium mb-1 flex items-center gap-1 text-teal-800">
                              <Glasses className="h-4 w-4" /> Frames
                            </p>
                            <p className="text-xs text-teal-900">
                              {r.glasses_frames.brand} — {r.glasses_frames.model}
                            </p>
                            <p className="text-xs text-teal-900">Purchased: {r.glasses_frames.purchase_date}</p>
                            <p className="text-xs text-teal-900 mt-1">
                              Spare pair: {r.spare_glasses_available ? "Yes" : "No"}
                            </p>
                          </div>
                        )}
                        {r.contact_lens_type && (
                          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 md:col-span-2">
                            <p className="font-medium mb-1 text-cyan-800">Contact Lenses</p>
                            <p className="text-xs text-cyan-900">{r.contact_lens_type}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* specialist referral */}
                    {r.specialist_referral && (
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                        <p className="font-medium text-rose-800 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" /> Specialist referral active
                        </p>
                        <p className="text-xs text-rose-700 mt-1">
                          {r.specialist_referral.service} · referred {r.specialist_referral.date}
                        </p>
                        <p className="text-xs text-rose-700">Reason: {r.specialist_referral.reason}</p>
                      </div>
                    )}

                    {/* symptoms */}
                    {r.symptoms_reported.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Symptoms Reported</p>
                        <ul className="list-disc list-inside text-muted-foreground text-xs space-y-0.5">
                          {r.symptoms_reported.map((s, i) => (<li key={i}>{s}</li>))}
                        </ul>
                      </div>
                    )}

                    {/* cleaning routine */}
                    {r.cleaning_routine && (
                      <div>
                        <p className="font-medium mb-1">Cleaning &amp; Care Routine</p>
                        <p className="text-muted-foreground text-xs">{r.cleaning_routine}</p>
                      </div>
                    )}

                    {/* child voice */}
                    <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                      <p className="font-medium text-sky-800 mb-1">Child&apos;s Voice</p>
                      <p className="text-sky-900 italic">&ldquo;{r.child_voice}&rdquo;</p>
                    </div>

                    {/* staff observation */}
                    <div>
                      <p className="font-medium mb-1">Staff Observation</p>
                      <p className="text-muted-foreground">{r.staff_observation}</p>
                    </div>

                    {/* smart link panel */}
                    <SmartLinkPanel sourceType="vision-care-record" sourceId={r.id} childId={r.child_id} compact />

                    {/* footer */}
                    <div className="flex flex-wrap justify-between items-center pt-2 border-t text-xs text-muted-foreground gap-2">
                      <span>Key worker: {getStaffName(r.key_worker)}</span>
                      <span>Next review: {r.review_date}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* ── regulatory note ────────────────────────────────────────────── */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>
            Children&apos;s Homes (England) Regulations 2015, Quality Standard 8 (Health and well-being) — children
            must receive timely health interventions and have their physical, emotional and mental health needs met.
            Vision care forms part of the routine annual health assessment alongside dental, hearing and developmental
            screening. NHS sight test entitlement: free annual sight tests for under-16s, full-time students to age
            18, and care leavers under 25. NHS optical vouchers cover frames and lenses for eligible looked-after
            children. UNCRC Article 24 — every child has the right to the highest attainable standard of health.
            General Optical Council (GOC) standards govern professional optometric practice. Records retained until
            the child&apos;s 25th birthday (or 75 years for looked-after children, per Reg 37).
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

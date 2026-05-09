"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  Glasses,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOpticiansRecords } from "@/hooks/use-opticians-records";
import type { OpticiansRecord, OpticalStatus, OpticalRecallInterval } from "@/types/extended";
import { OPTICAL_STATUS_LABEL, OPTICAL_RECALL_INTERVAL_LABEL, GLASSES_TYPE_LABEL } from "@/types/extended";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

const statusColour: Record<OpticalStatus, string> = {
  active_nhs: "bg-green-100 text-green-800",
  active_private: "bg-blue-100 text-blue-800",
  awaiting_registration: "bg-amber-100 text-amber-800",
};

export default function OpticiansRecordsPage() {
  const { data: res, isLoading } = useOpticiansRecords();
  const data: OpticiansRecord[] = res?.data ?? [];

  const [filterYP, setFilterYP] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const ypIds = [...new Set(data.map((r) => r.child_id))];

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((r) => r.child_id === filterYP);
    items.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.child_id.localeCompare(b.child_id);
        case "exam":
          return a.next_exam_due.localeCompare(b.next_exam_due);
        default:
          return 0;
      }
    });
    return items;
  }, [data, filterYP, sortBy]);

  const total = data.length;
  const allRegistered = data.every((r) => r.status === "active_nhs" || r.status === "active_private");
  const wearingGlasses = data.filter((r) => r.glasses_issued.length > 0).length;

  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
  const sixtyDaysStr = sixtyDaysFromNow.toISOString().slice(0, 10);
  const dueExam = data.filter((r) => r.next_exam_due <= sixtyDaysStr).length;

  const exportCols: ExportColumn<OpticiansRecord>[] = [
    { header: "Young Person", accessor: (r: OpticiansRecord) => getYPName(r.child_id) },
    { header: "Practice", accessor: (r: OpticiansRecord) => r.practice },
    { header: "Optometrist", accessor: (r: OpticiansRecord) => r.optometrist },
    { header: "Status", accessor: (r: OpticiansRecord) => OPTICAL_STATUS_LABEL[r.status] },
    { header: "Recall", accessor: (r: OpticiansRecord) => OPTICAL_RECALL_INTERVAL_LABEL[r.recall_interval] },
    { header: "Last Exam", accessor: (r: OpticiansRecord) => r.last_exam_date },
    { header: "Next Due", accessor: (r: OpticiansRecord) => r.next_exam_due },
    { header: "Glasses", accessor: (r: OpticiansRecord) => r.glasses_issued.length > 0 ? `${r.glasses_issued.length} pair(s)` : "None" },
  ];

  return (
    <PageShell
      title="Opticians Records"
      subtitle="Per-child eye care — registrations, prescriptions, glasses, and reasonable adjustments"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="opticians-records" />
          <PrintButton title="Opticians Records" />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Active Records</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{allRegistered ? "100%" : `${data.filter((r) => r.status === "active_nhs" || r.status === "active_private").length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Registered</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{wearingGlasses}/{total}</p>
          <p className="text-xs text-muted-foreground">Wearing Glasses</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", dueExam > 0 ? "text-amber-600" : "text-green-600")}>{dueExam}</p>
          <p className="text-xs text-muted-foreground">Exam Due 60d</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <Eye className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          Eye health is part of overall wellbeing and learning. Each child registered with an NHS optometrist;
          children with sensory needs may use specialist paediatric optometrists. Frames are children&apos;s
          choice. Reasonable adjustments respected.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {ypIds.map((id) => (
              <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="exam">Next Exam Due</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;

          return (
            <div key={r.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Eye className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(r.child_id)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.practice} &middot; {OPTICAL_RECALL_INTERVAL_LABEL[r.recall_interval]} &middot; Last exam {r.last_exam_date} &middot; Next due {r.next_exam_due}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColour[r.status])}>{OPTICAL_STATUS_LABEL[r.status]}</span>
                  {r.glasses_issued.length > 0 && <Glasses className="h-4 w-4 text-blue-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="bg-white rounded-lg p-2 border text-sm">
                      <p className="text-xs text-muted-foreground">Optometrist</p>
                      <p className="font-medium">{r.optometrist}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-sm">
                      <p className="text-xs text-muted-foreground">Registered</p>
                      <p className="font-medium">{r.registered_date}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-sm">
                      <p className="text-xs text-muted-foreground">Current Prescription</p>
                      <p className="font-mono text-xs">R: {r.current_prescription.right_sphere} / {r.current_prescription.right_cylinder}</p>
                      <p className="font-mono text-xs">L: {r.current_prescription.left_sphere} / {r.current_prescription.left_cylinder}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border text-sm">
                      <p className="text-xs text-muted-foreground">Visual Impairment</p>
                      <p className="font-medium">{r.visual_impairment || "None"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Exam History</p>
                    <div className="space-y-1">
                      {r.exam_history.map((e, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <p className="font-medium">{e.date} — {e.outcome}</p>
                          <p className="text-xs text-muted-foreground">Prescription: {e.prescription}</p>
                          <p className="text-xs text-muted-foreground">Recommendations: {e.recommendations}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {r.glasses_issued.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        <Glasses className="h-3 w-3 inline mr-1" />Glasses Issued
                      </p>
                      <div className="space-y-1">
                        {r.glasses_issued.map((g, i) => (
                          <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                            <p className="font-medium">{g.date} — {GLASSES_TYPE_LABEL[g.glasses_type]}</p>
                            <p className="text-xs text-muted-foreground">{g.frames_chosen}</p>
                            <p className="text-xs text-muted-foreground">{g.lens_type} &middot; £{g.cost}{g.child_chose && " (child chose)"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {r.reasonable_adjustments.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Reasonable Adjustments</p>
                      <ul className="space-y-1">
                        {r.reasonable_adjustments.map((a, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-purple-500 mt-1 shrink-0" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">Child&apos;s Attitude</p>
                    <p className="text-sm">{r.child_attitude_to_optometrist}</p>
                  </div>

                  {r.notes && (
                    <div className="bg-slate-50 rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm">{r.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Clock className="h-3 w-3 inline mr-1" />Last exam: {r.last_exam_date}</span>
                    <span>Next due: {r.next_exam_due}</span>
                    <span>Reviewed: {getStaffName(r.reviewed_by)}</span>
                  </div>

                  <SmartLinkPanel sourceType="opticians_record" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Eye care records support Quality Standard 7 (health and
          wellbeing), Care Planning Regulations 2010 (statutory annual health), and reasonable adjustments
          per Equality Act 2010. Linked to Annual Health Assessment, Healthcare Plans, EHCP Tracker, and
          Sensory Profiles.
        </p>
      </div>
      </>
      )}
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}

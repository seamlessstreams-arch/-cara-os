"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  ChevronDown, ChevronUp, ArrowUpDown, AlertTriangle, CheckCircle2,
  XCircle, Search, ShieldCheck, ClipboardCheck, BadgeCheck, Building2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";
import { useAgencyInductions } from "@/hooks/use-agency-inductions";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { AgencyInduction, AgencyInductionType } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const TYPE_CLR: Record<AgencyInductionType, string> = {
  pre_shift_brief: "bg-amber-100 text-amber-800",
  half_day_full_induction: "bg-blue-100 text-blue-800",
  returning_staff_refresh: "bg-purple-100 text-purple-800",
};

const TYPE_BORDER: Record<AgencyInductionType, string> = {
  pre_shift_brief: "border-l-amber-400",
  half_day_full_induction: "border-l-blue-400",
  returning_staff_refresh: "border-l-purple-400",
};

const TYPE_LABEL: Record<AgencyInductionType, string> = {
  pre_shift_brief: "Pre-shift brief",
  half_day_full_induction: "Half-day full induction",
  returning_staff_refresh: "Returning staff refresh",
};

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function AgencyStaffInductionPage() {
  const { data: result, isLoading } = useAgencyInductions();
  const data = result?.data ?? [];

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterAgency, setFilterAgency] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const agencies = useMemo(() => Array.from(new Set(data.map((r) => r.agency))).sort(), [data]);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r.agency_staff_name.toLowerCase().includes(q) ||
        r.agency.toLowerCase().includes(q)
      );
    }
    if (filterType !== "all") rows = rows.filter((r) => r.induction_type === filterType);
    if (filterAgency !== "all") rows = rows.filter((r) => r.agency === filterAgency);
    rows.sort((a, b) => sortBy === "newest"
      ? b.date_inducted.localeCompare(a.date_inducted)
      : a.date_inducted.localeCompare(b.date_inducted));
    return rows;
  }, [data, search, filterType, filterAgency, sortBy]);

  /* summary stats */
  const activeAgencies = agencies.length;
  const yearStart = new Date().toISOString().slice(0, 4) + "-01-01";
  const inductionsThisYear = data.filter((r) => r.date_inducted >= yearStart).length;
  const approvedForRepeat = data.filter((r) => r.repeat_booking_approved).length;
  const dbsVerifiedCount = data.filter((r) => r.agency_dbs_verified).length;

  const exportCols: ExportColumn<AgencyInduction>[] = [
    { header: "Date", accessor: (r: AgencyInduction) => r.date_inducted },
    { header: "Agency Worker", accessor: (r: AgencyInduction) => r.agency_staff_name },
    { header: "Agency", accessor: (r: AgencyInduction) => r.agency },
    { header: "Inducted By", accessor: (r: AgencyInduction) => getStaffName(r.inducted_by) },
    { header: "Type", accessor: (r: AgencyInduction) => TYPE_LABEL[r.induction_type] },
    { header: "Duration (mins)", accessor: (r: AgencyInduction) => String(r.induction_duration) },
    { header: "DBS Verified", accessor: (r: AgencyInduction) => r.agency_dbs_verified ? "Yes" : "No" },
    { header: "Training Verified", accessor: (r: AgencyInduction) => r.agency_training_verified ? "Yes" : "No" },
    { header: "References Verified", accessor: (r: AgencyInduction) => r.agency_references_verified ? "Yes" : "No" },
    { header: "BSPs Briefed", accessor: (r: AgencyInduction) => r.behaviour_support_plans_briefed ? "Yes" : "No" },
    { header: "Pack Signed", accessor: (r: AgencyInduction) => r.agency_staff_signed_induction_pack ? "Yes" : "No" },
    { header: "Shifts Booked", accessor: (r: AgencyInduction) => String(r.shifts_booked) },
    { header: "Repeat Approved", accessor: (r: AgencyInduction) => r.repeat_booking_approved ? "Yes" : "No" },
  ];

  return (
    <PageShell
      title="Agency Staff Induction"
      subtitle="Reg 32 · Quality Standard 13 · KCSIE 2024 — Induction of agency staff who cover shifts"
      ariaContext={{ pageTitle: "Agency Staff Induction", sourceType: "staff" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Agency Staff Induction" />
          <ExportButton data={data} columns={exportCols} filename="agency-staff-induction" />
          <AriaStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <div id="print-area">
        {/* summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Active Agencies", value: activeAgencies, icon: Building2, clr: "text-blue-600" },
            { label: "Inductions This Year", value: inductionsThisYear, icon: ClipboardCheck, clr: "text-amber-600" },
            { label: "Approved for Repeat", value: approvedForRepeat, icon: BadgeCheck, clr: "text-green-600" },
            { label: "DBS Verified", value: `${dbsVerifiedCount}/${data.length}`, icon: ShieldCheck, clr: "text-purple-600" },
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

        {/* filters / sort */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search worker or agency..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Induction Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Induction Types</SelectItem>
              <SelectItem value="pre_shift_brief">Pre-shift brief</SelectItem>
              <SelectItem value="half_day_full_induction">Half-day full induction</SelectItem>
              <SelectItem value="returning_staff_refresh">Returning staff refresh</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterAgency} onValueChange={setFilterAgency}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Agency" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agencies</SelectItem>
              {agencies.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
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

        {/* induction cards */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            const topicsCovered = r.induction_topics.filter((t) => t.covered).length;
            const topicsTotal = r.induction_topics.length;
            const fullyComplete =
              r.agency_dbs_verified && r.agency_training_verified && r.agency_references_verified &&
              r.behaviour_support_plans_briefed && r.agency_staff_signed_induction_pack &&
              topicsCovered === topicsTotal;
            return (
              <Card key={r.id} className={cn("border-l-4", TYPE_BORDER[r.induction_type])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {r.agency_staff_name}
                        <Badge variant="outline" className={TYPE_CLR[r.induction_type]}>{TYPE_LABEL[r.induction_type]}</Badge>
                        {r.repeat_booking_approved
                          ? <Badge variant="outline" className="bg-green-100 text-green-800">Repeat OK</Badge>
                          : <Badge variant="outline" className="bg-red-100 text-red-800">Repeat Declined</Badge>}
                        {!fullyComplete && <Badge variant="outline" className="bg-amber-100 text-amber-800">Induction in progress</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.agency} · {r.date_inducted} · {r.induction_duration} mins · By {getStaffName(r.inducted_by)} · Topics {topicsCovered}/{topicsTotal} · Shifts booked: {r.shifts_booked}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* vetting checklist */}
                    <div>
                      <p className="font-medium mb-1">Vetting & Pre-Shift Verification</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { label: "DBS Verified", ok: r.agency_dbs_verified },
                          { label: "Training Verified", ok: r.agency_training_verified },
                          { label: "References Verified", ok: r.agency_references_verified },
                          { label: "Photo Verified", ok: r.photo_taken_and_verified },
                          { label: "BSPs Briefed", ok: r.behaviour_support_plans_briefed },
                          { label: "Induction Pack Signed", ok: r.agency_staff_signed_induction_pack },
                          { label: "Children Informed", ok: r.children_informed_about_agency_arrival },
                        ].map((c) => (
                          <div key={c.label} className="flex items-center gap-1.5 text-xs">
                            {c.ok
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                              : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                            <span className={c.ok ? "" : "text-red-700 font-medium"}>{c.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* topics */}
                    <div>
                      <p className="font-medium mb-1">Induction Topics ({topicsCovered}/{topicsTotal} covered)</p>
                      <div className="space-y-1.5">
                        {r.induction_topics.map((t) => (
                          <div key={t.topic} className={cn(
                            "rounded p-2 text-xs",
                            t.covered ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"
                          )}>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {t.covered
                                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                : <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
                              <span className="font-medium">{t.topic}</span>
                            </div>
                            {t.notes && <p className="text-muted-foreground ml-5">{t.notes}</p>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* child information shared */}
                    <div>
                      <p className="font-medium mb-1">Child Information Shared (high-level only)</p>
                      <p className="text-muted-foreground text-xs">{r.child_information_shared}</p>
                    </div>

                    {/* policies */}
                    <div>
                      <p className="font-medium mb-1">Key Policies Shared</p>
                      <div className="flex flex-wrap gap-1.5">
                        {r.key_policies_shared.map((p) => (
                          <Badge key={p} variant="outline" className="bg-muted/50 text-xs">{p}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* feedback */}
                    {r.agency_staff_feedback && (
                      <div>
                        <p className="font-medium mb-1">Agency Staff Feedback</p>
                        <p className="text-muted-foreground text-xs">{r.agency_staff_feedback}</p>
                      </div>
                    )}
                    {r.home_feedback_on_agency && (
                      <div>
                        <p className="font-medium mb-1">Home Feedback on Agency</p>
                        <p className="text-muted-foreground text-xs">{r.home_feedback_on_agency}</p>
                      </div>
                    )}

                    {/* repeat booking */}
                    <div className={cn(
                      "rounded p-2",
                      r.repeat_booking_approved ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
                    )}>
                      <p className={cn(
                        "text-xs font-medium",
                        r.repeat_booking_approved ? "text-green-800" : "text-red-800"
                      )}>
                        {r.repeat_booking_approved
                          ? "Approved for repeat booking — added to preferred worker list."
                          : r.shifts_booked === 0
                            ? "Repeat booking pending — induction not yet fully complete."
                            : "Repeat booking declined — feedback returned to agency."}
                      </p>
                    </div>

                    {/* smart links */}
                    <SmartLinkPanel sourceType="agency_induction" sourceId={r.id} compact />
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
            Children&apos;s Homes (England) Regulations 2015, Reg 32 — Fitness of Workers — requires that all persons working at the home (including agency staff covering shifts) are of integrity and good character, have the necessary qualifications, skills and experience, and are physically and mentally fit. Quality Standard 13 (Leadership and Management) requires the registered person to ensure staff (including agency staff) understand the home&apos;s ethos, the children&apos;s needs, and their role in safeguarding. KCSIE 2024 reinforces that agency staff must receive a documented local induction, be briefed on individual children on a need-to-know basis, and understand reporting and safeguarding routes. Induction records must be retained, vetting verified before first shift, and any concerns fed back to the supplying agency in writing. Repeat booking decisions should be evidenced. Agency use is monitored under Reg 44/45.
          </p>
        </div>
      </div>
      )}
      <CareEventsPanel
        title="Care Events — General"
        category="general"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Agency Staff Induction — agency worker induction log, mandatory briefings, safeguarding awareness, medication competency, home rules, expectations, Reg 44 evidence"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}

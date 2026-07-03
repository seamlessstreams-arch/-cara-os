"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { FlatList, FlatListRow, FlatListRowDetail, type RowSeverity } from "@/components/ui/list-row";
import { getStaffName } from "@/lib/seed-data";
import { cn, todayStr } from "@/lib/utils";
import { useAsbestosRecords } from "@/hooks/use-asbestos-records";
import type { AsbestosRecord } from "@/types/extended";
import {
  ASBESTOS_SURVEY_TYPE_LABEL,
  ASBESTOS_CONDITION_RATING_LABEL,
  ASBESTOS_REINSPECTION_FREQUENCY_LABEL,
} from "@/types/extended";
import {
  Shield,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  CheckCircle,
  Calendar,
  FileText,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

const surveyTypeColour: Record<string, string> = {
  management_survey: "bg-indigo-100 text-indigo-800 border-indigo-200",
  refurbishment_demolition_survey: "bg-rose-100 text-rose-800 border-rose-200",
  re_inspection: "bg-sky-100 text-sky-800 border-sky-200",
  air_monitoring: "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)] border-[var(--cs-cara-gold-soft)]",
  removal_record: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const CONDITION_ROW: Record<string, RowSeverity> = {
  no_acm_identified: "success",
  good_condition_sealed: "warning",
  minor_damage_encapsulated: "warning",
  significant_damage_action_required: "risk",
  removed: "neutral",
};
const CONDITION_TEXT: Record<string, string> = {
  no_acm_identified: "text-[--cs-success]",
  good_condition_sealed: "text-[--cs-warning]",
  minor_damage_encapsulated: "text-orange-800",
  significant_damage_action_required: "text-[--cs-risk]",
  removed: "text-[var(--cs-text-secondary)]",
};

const exportCols: ExportColumn<AsbestosRecord>[] = [
  { header: "Survey Date", accessor: (r) => r.survey_date },
  { header: "Survey Type", accessor: (r) => ASBESTOS_SURVEY_TYPE_LABEL[r.survey_type] },
  { header: "Surveyor", accessor: (r) => r.surveyor },
  { header: "Accreditation", accessor: (r) => r.surveyor_accreditation },
  { header: "Certificate Number", accessor: (r) => r.certificate_number },
  { header: "Building Area", accessor: (r) => r.building_area },
  { header: "ACM Identified", accessor: (r) => (r.acm_identified ? "Yes" : "No") },
  { header: "ACM Type", accessor: (r) => r.acm_type ?? "—" },
  { header: "Condition Rating", accessor: (r) => ASBESTOS_CONDITION_RATING_LABEL[r.condition_rating] },
  { header: "Management Action", accessor: (r) => r.management_action },
  {
    header: "Removal Contractor",
    accessor: (r) =>
      r.removal_contractor
        ? `${r.removal_contractor.name} (HSE licence ${r.removal_contractor.hse_licence_number}, ${r.removal_contractor.date})`
        : "—",
  },
  { header: "Encapsulation Details", accessor: (r) => r.encapsulation_details ?? "—" },
  { header: "Re-inspection Frequency", accessor: (r) => ASBESTOS_REINSPECTION_FREQUENCY_LABEL[r.reinspection_frequency] },
  { header: "Next Inspection Due", accessor: (r) => r.next_inspection_due ?? "—" },
  { header: "Tradesperson Briefings Required", accessor: (r) => (r.tradesperson_briefings_required ? "Yes" : "No") },
  { header: "Notes for Contractors", accessor: (r) => r.notes_for_contractors ?? "—" },
  { header: "Recorded By", accessor: (r) => getStaffName(r.recorded_by) },
  { header: "Flags / Concerns", accessor: (r) => r.flags_concerns.join("; ") },
];

export default function BuildingAsbestosRegisterPage() {
  const { data: res, isLoading } = useAsbestosRecords();
  const data = useMemo(() => res?.data ?? [], [res]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "type" | "condition" | "nextInspection">("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <PageShell title="Asbestos Register & Management Plan" subtitle="Statutory asbestos register and management plan for the home premises">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  const today = todayStr();
  const sixtyDaysFromNow = (() => { const dt = new Date(); dt.setDate(dt.getDate() + 60); return dt.toISOString().slice(0, 10); })();

  const filtered = (() => {
    let r = data.filter((rec) => {
      const matchesSearch =
        !search ||
        rec.building_area.toLowerCase().includes(search.toLowerCase()) ||
        rec.surveyor.toLowerCase().includes(search.toLowerCase()) ||
        (rec.acm_type ?? "").toLowerCase().includes(search.toLowerCase()) ||
        rec.certificate_number.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || rec.survey_type === typeFilter;
      return matchesSearch && matchesType;
    });
    r = [...r].sort((a, b) => {
      if (sortBy === "type") return a.survey_type.localeCompare(b.survey_type);
      if (sortBy === "condition") return a.condition_rating.localeCompare(b.condition_rating);
      if (sortBy === "nextInspection") {
        const aN = a.next_inspection_due ?? "9999-99-99";
        const bN = b.next_inspection_due ?? "9999-99-99";
        return aN.localeCompare(bN);
      }
      return b.survey_date.localeCompare(a.survey_date);
    });
    return r;
  })();

  const stats = (() => {
    const surveysCompleted = data.filter(
      (r) => r.survey_type === "management_survey" || r.survey_type === "refurbishment_demolition_survey" || r.survey_type === "re_inspection",
    ).length;
    const acmsIdentified = data.filter(
      (r) => r.acm_identified && (r.survey_type === "management_survey" || r.survey_type === "refurbishment_demolition_survey"),
    ).length;
    const nextInspection60d = data.filter(
      (r) => r.next_inspection_due && r.next_inspection_due >= today && r.next_inspection_due <= sixtyDaysFromNow,
    ).length;
    const yearStart = (() => { const dt = new Date(); dt.setDate(dt.getDate() - 365); return dt.toISOString().slice(0, 10); })();
    const briefingsYTD = data.filter(
      (r) => r.survey_date >= yearStart && r.certificate_number.includes("BRIEFING"),
    ).length;
    return { surveysCompleted, acmsIdentified, nextInspection60d, briefingsYTD };
  })();

  return (
    <PageShell
      title="Asbestos Register & Management Plan"
      subtitle="Statutory asbestos register and management plan for the home premises — Control of Asbestos Regulations 2012 (CAR 2012). Records of survey type, location of any asbestos-containing materials (ACMs), condition rating per HSG264, encapsulation, removal records, contractor licence details, and pre-works tradesperson briefings before any drilling or disturbance work. Children's Homes Regs Reg 25 (premises) and Quality Standard 10."
      caraContext={{ pageTitle: "Asbestos Register", sourceType: "home_check" }}
      actions={
        <div className="flex gap-2">
          <ExportButton data={filtered} columns={exportCols} filename="building-asbestos-register" />
          <PrintButton title="Asbestos Register" />
          <CaraStudioQuickActionButton context={{ record_type: "ofsted_evidence", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg border border-[var(--cs-border)] bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-[var(--cs-text-secondary)] text-sm mb-1">
            <FileText className="h-4 w-4" />
            <span>Surveys completed</span>
          </div>
          <div className="text-2xl font-semibold text-[var(--cs-navy)]">{stats.surveysCompleted}</div>
        </div>
        <div className="rounded-lg border border-[--cs-warning-soft] bg-[--cs-warning-bg] p-4">
          <div className="flex items-center gap-2 text-[--cs-warning] text-sm mb-1">
            <AlertTriangle className="h-4 w-4" />
            <span>ACMs identified</span>
          </div>
          <div className="text-2xl font-semibold text-[--cs-warning]">{stats.acmsIdentified}</div>
        </div>
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
          <div className="flex items-center gap-2 text-sky-800 text-sm mb-1">
            <Calendar className="h-4 w-4" />
            <span>Inspection due (60d)</span>
          </div>
          <div className="text-2xl font-semibold text-sky-900">{stats.nextInspection60d}</div>
        </div>
        <div className="rounded-lg border border-[--cs-success-soft] bg-[--cs-success-bg] p-4">
          <div className="flex items-center gap-2 text-[--cs-success] text-sm mb-1">
            <Shield className="h-4 w-4" />
            <span>Contractor briefings YTD</span>
          </div>
          <div className="text-2xl font-semibold text-[--cs-success]">{stats.briefingsYTD}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--cs-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search area, surveyor, ACM type or certificate..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--cs-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Survey type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All survey types</SelectItem>
            <SelectItem value="management_survey">{ASBESTOS_SURVEY_TYPE_LABEL.management_survey}</SelectItem>
            <SelectItem value="refurbishment_demolition_survey">{ASBESTOS_SURVEY_TYPE_LABEL.refurbishment_demolition_survey}</SelectItem>
            <SelectItem value="re_inspection">{ASBESTOS_SURVEY_TYPE_LABEL.re_inspection}</SelectItem>
            <SelectItem value="air_monitoring">{ASBESTOS_SURVEY_TYPE_LABEL.air_monitoring}</SelectItem>
            <SelectItem value="removal_record">{ASBESTOS_SURVEY_TYPE_LABEL.removal_record}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-52">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Most recent</SelectItem>
            <SelectItem value="type">Survey type</SelectItem>
            <SelectItem value="condition">Condition rating</SelectItem>
            <SelectItem value="nextInspection">Next inspection due</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <FlatList>
        {filtered.map((r) => {
          const isOpen = expandedId === r.id;
          const inspectionSoon = r.next_inspection_due && r.next_inspection_due >= today && r.next_inspection_due <= sixtyDaysFromNow;
          const inspectionOverdue = r.next_inspection_due && r.next_inspection_due < today;
          const rowSev: RowSeverity = inspectionOverdue ? "risk" : (CONDITION_ROW[r.condition_rating] ?? "neutral");
          return (
            <div key={r.id}>
              <FlatListRow
                severity={rowSev}
                className="justify-between gap-3"
                onClick={() => setExpandedId(isOpen ? null : r.id)}
                aria-expanded={isOpen}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-[var(--cs-navy)]">{r.survey_date}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", surveyTypeColour[r.survey_type])}>
                      {ASBESTOS_SURVEY_TYPE_LABEL[r.survey_type]}
                    </span>
                    <span className={cn("text-[11px] font-semibold uppercase tracking-wide", CONDITION_TEXT[r.condition_rating])}>
                      {ASBESTOS_CONDITION_RATING_LABEL[r.condition_rating]}
                    </span>
                    {r.acm_identified ? (
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[--cs-warning]">ACM present</span>
                    ) : (
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[--cs-success]">No ACM</span>
                    )}
                    {r.next_inspection_due ? (
                      inspectionOverdue ? (
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-[--cs-risk]">Inspection overdue · {r.next_inspection_due}</span>
                      ) : inspectionSoon ? (
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-[--cs-warning]">Next inspection {r.next_inspection_due}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Next inspection {r.next_inspection_due}</span>
                      )
                    ) : null}
                  </div>
                  <div className="text-sm text-[var(--cs-text-secondary)]">
                    {r.building_area.length > 110 ? `${r.building_area.slice(0, 110)}…` : r.building_area}
                  </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />}
              </FlatListRow>
              {isOpen && (
                <FlatListRowDetail>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Surveyor</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[var(--cs-text-secondary)]">
                        <div><span className="text-[var(--cs-text-muted)]">Surveyor:</span> {r.surveyor}</div>
                        <div><span className="text-[var(--cs-text-muted)]">Accreditation:</span> {r.surveyor_accreditation}</div>
                        <div className="sm:col-span-2"><span className="text-[var(--cs-text-muted)]">Certificate number:</span> <span className="font-mono">{r.certificate_number}</span></div>
                      </div>
                    </div>

                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Building area surveyed</div>
                      <p className="text-sm text-[var(--cs-text-secondary)]">{r.building_area}</p>
                    </div>

                    <div className={cn("rounded-md border p-3", r.acm_identified ? "border-[--cs-warning-soft] bg-[--cs-warning-bg]" : "border-[--cs-success-soft] bg-[--cs-success-bg]")}>
                      <div className="flex items-center gap-2 mb-2">
                        {r.acm_identified ? <AlertTriangle className="h-4 w-4 text-[--cs-warning]" /> : <CheckCircle className="h-4 w-4 text-[--cs-success]" />}
                        <div className={cn("text-xs font-semibold uppercase", r.acm_identified ? "text-[--cs-warning]" : "text-[--cs-success]")}>ACM details</div>
                      </div>
                      <div className={cn("text-sm", r.acm_identified ? "text-[--cs-warning]" : "text-[--cs-success]")}>
                        {r.acm_identified ? r.acm_type ?? "ACM identified — see register entry" : "No asbestos-containing materials identified in this scope."}
                      </div>
                    </div>

                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Condition rating</div>
                      <div className="text-sm text-[var(--cs-text-secondary)]">{ASBESTOS_CONDITION_RATING_LABEL[r.condition_rating]}</div>
                    </div>

                    <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3 lg:col-span-2">
                      <div className="text-xs font-semibold text-indigo-800 uppercase mb-2">Management action</div>
                      <p className="text-sm text-indigo-900">{r.management_action}</p>
                    </div>

                    {r.encapsulation_details && (
                      <div className="rounded-md border border-[--cs-warning-soft] bg-[--cs-warning-bg] p-3 lg:col-span-2">
                        <div className="text-xs font-semibold text-[--cs-warning] uppercase mb-2">Encapsulation</div>
                        <p className="text-sm text-[--cs-warning]">{r.encapsulation_details}</p>
                      </div>
                    )}

                    {r.removal_contractor && (
                      <div className="rounded-md border border-[--cs-success-soft] bg-[--cs-success-bg] p-3 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-[--cs-success]" />
                          <div className="text-xs font-semibold text-[--cs-success] uppercase">Licensed removal contractor</div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-[--cs-success]">
                          <div><span className="text-[--cs-success]">Contractor:</span> {r.removal_contractor.name}</div>
                          <div><span className="text-[--cs-success]">HSE licence:</span> <span className="font-mono">{r.removal_contractor.hse_licence_number}</span></div>
                          <div><span className="text-[--cs-success]">Removal date:</span> {r.removal_contractor.date}</div>
                        </div>
                      </div>
                    )}

                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Re-inspection cadence</div>
                      <div className="text-sm text-[var(--cs-text-secondary)]">{ASBESTOS_REINSPECTION_FREQUENCY_LABEL[r.reinspection_frequency]}</div>
                    </div>

                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3">
                      <div className="text-xs font-semibold text-[var(--cs-text-muted)] uppercase mb-2">Next inspection due</div>
                      <div className="text-sm text-[var(--cs-text-secondary)]">{r.next_inspection_due ?? "—"}</div>
                    </div>

                    {r.tradesperson_briefings_required ? (
                      <div className="rounded-md border-2 border-[--cs-warning-soft] bg-[--cs-warning-bg] p-3 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-[--cs-warning]" />
                          <div className="text-xs font-semibold text-[--cs-warning] uppercase">Tradesperson briefing required before any drilling / disturbance</div>
                        </div>
                        <p className="text-sm text-[--cs-warning]">
                          {r.notes_for_contractors ?? "All contractors must be briefed on the location and condition of identified ACMs before any work begins. Briefing record must be signed and held in the Buildings folder."}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2 text-sm text-[var(--cs-text-secondary)]">
                        No tradesperson briefing required for this entry.
                      </div>
                    )}

                    {r.flags_concerns.length > 0 && (
                      <div className="rounded-md border border-[--cs-risk-soft] bg-[--cs-risk-bg] p-3 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-[--cs-risk]" />
                          <div className="text-xs font-semibold text-[--cs-risk] uppercase">Flags / concerns</div>
                        </div>
                        <ul className="text-sm text-[--cs-risk] space-y-1">
                          {r.flags_concerns.map((f, i) => (
                            <li key={i} className="flex gap-2"><span>!</span><span>{f}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="rounded-md border border-[var(--cs-border)] bg-white p-3 lg:col-span-2 text-xs text-[var(--cs-text-muted)]">
                      Recorded by {getStaffName(r.recorded_by)}
                    </div>
                  </div>
                </FlatListRowDetail>
              )}
            </div>
          );
        })}
      </FlatList>

      <div className="mt-6 rounded-lg border border-[--cs-warning-soft] bg-[--cs-warning-bg] p-4 text-sm text-[--cs-warning]">
        <div className="font-semibold mb-1">Regulatory framework</div>
        <p>
          Control of Asbestos Regulations 2012 (CAR 2012) — duty to manage asbestos in non-domestic
          premises (Reg 4) applies to communal areas of children&rsquo;s homes; HSG264 sets the standard
          for management surveys and refurbishment &amp; demolition surveys; HSG227 covers the
          duty-holder&rsquo;s management plan; Children&rsquo;s Homes (England) Regulations 2015 Reg 25
          (premises) and Quality Standard 10 (Care planning); Health &amp; Safety at Work etc. Act 1974.
          Register reviewed annually as a minimum and on any change of building use, and made available
          to Ofsted, contractors, and emergency services on request.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Health & Safety"
        category="health"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Asbestos Register — asbestos survey, ACM location, risk rating, condition, management plan, disturbance records, R&R contractor, Control of Asbestos Regulations 2012, HSE compliance"
        recordType="ofsted_evidence"
        className="mt-6"
      />
    </PageShell>
  );
}

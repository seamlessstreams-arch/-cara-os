"use client";

// ══════════════════════════════════════════════════════════════════════════════
// HR INSPECTION MODE
//
// Structured export of the home's full HR position for Ofsted inspection.
// Produces a printable view (browser print → PDF) and downloadable CSV
// spreadsheets. Covers the 8 domains an inspector reviews:
//
//   1. Workforce summary (staffing, vacancies, agency usage)
//   2. Safer recruitment position (gate outcomes, outstanding checks)
//   3. Active HR cases (by type, risk, safeguarding status)
//   4. Case chronology (significant events timeline)
//   5. Suspension register (active + resolved in period)
//   6. Safeguarding / LADO referrals
//   7. Training and compliance (DBS, mandatory training, supervision)
//   8. RI oversight and quality assurance
//
// All data is anonymised to "Staff Member A/B/C…" in the demo. Production
// data is drawn from the HR schema tables. The export audit-logs every
// download and print event.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { useHrInspection } from "@/hooks/use-intelligence-layer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Printer,
  Download,
  FileSpreadsheet,
  ShieldCheck,
  ShieldAlert,
  Users,
  FileSearch,
  AlertTriangle,
  Clock,
  Eye,
  Gavel,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Building2,
  Activity,
  Scale,
} from "lucide-react";
import type {
  HrCaseType,
  HrRiskLevel,
  HrCaseStatus,
  HrSafeguardingStatus,
} from "@/lib/hr/types";

// ─── Types ──────────────────────────────────────────────────────────────────

interface WorkforceSummary {
  totalStaff: number;
  permanentStaff: number;
  agencyStaff: number;
  vacancies: number;
  staffInProbation: number;
  staffSuspended: number;
  averageTenureMonths: number;
  turnoverLast12Months: number;
}

interface RecruitmentCheck {
  staffRef: string;
  startDate: string;
  dbsCleared: boolean;
  dbsDate?: string;
  referencesReceived: boolean;
  referenceCount: number;
  rightToWork: boolean;
  qualificationsVerified: boolean;
  healthDeclaration: boolean;
  safeguardingTraining: boolean;
  gateOutcome: "approved" | "blocked" | "senior_risk_acceptance";
  outstandingItems: string[];
}

interface CaseRecord {
  id: string;
  staffRef: string;
  caseType: HrCaseType;
  riskLevel: HrRiskLevel;
  status: HrCaseStatus;
  safeguardingStatus: HrSafeguardingStatus;
  openedAt: string;
  closedAt?: string;
  daysDuration: number;
  actionCount: number;
  lettersIssued: number;
  guardianReviews: number;
  riOversightRequired: boolean;
  riOversightCompleted: boolean;
  outcome?: string;
}

interface ChronologyEvent {
  date: string;
  caseRef: string;
  staffRef: string;
  event: string;
  significance: "routine" | "significant" | "critical";
}

interface SuspensionRecord {
  staffRef: string;
  startDate: string;
  endDate?: string;
  daysActive: number;
  reason: string;
  riskFactorsConsidered: boolean;
  alternativesConsidered: boolean;
  welfarePlanInPlace: boolean;
  reviewsDue: number;
  reviewsCompleted: number;
  ladoLinked: boolean;
  resolved: boolean;
  resolutionOutcome?: string;
}

interface LadoReferral {
  staffRef: string;
  referralDate: string;
  allegationCategory: string;
  ladoOutcome?: string;
  dbsReferralMade: boolean;
  ofstedNotified: boolean;
  status: "open" | "closed";
  daysToResolution?: number;
}

interface ComplianceItem {
  staffRef: string;
  dbsStatus: "current" | "due_renewal" | "expired" | "not_started";
  dbsUpdateServiceRegistered: boolean;
  mandatoryTrainingComplete: boolean;
  mandatoryTrainingGaps: string[];
  lastSupervisionDate?: string;
  supervisionOverdueDays: number;
  lastAppraisalDate?: string;
  appraisalOverdueDays: number;
}

interface OversightRecord {
  caseRef: string;
  staffRef: string;
  oversightType: "ri_review" | "rm_quality_check" | "audit";
  completedBy: string;
  completedAt: string;
  findingSummary: string;
  actionsRequired: number;
  actionsCompleted: number;
}

type InspectionSection =
  | "workforce"
  | "recruitment"
  | "cases"
  | "chronology"
  | "suspensions"
  | "lado"
  | "compliance"
  | "oversight";

// ─── Demo data ──────────────────────────────────────────────────────────────


// ─── Helpers ────────────────────────────────────────────────────────────────

const SECTION_LABELS: Record<InspectionSection, string> = {
  workforce: "1. Workforce Summary",
  recruitment: "2. Safer Recruitment Position",
  cases: "3. HR Cases",
  chronology: "4. Case Chronology",
  suspensions: "5. Suspension Register",
  lado: "6. Safeguarding / LADO Referrals",
  compliance: "7. Training & Compliance",
  oversight: "8. RI Oversight & Quality Assurance",
};

const ALL_SECTIONS: InspectionSection[] = [
  "workforce", "recruitment", "cases", "chronology",
  "suspensions", "lado", "compliance", "oversight",
];

function riskBadge(level: HrRiskLevel) {
  const styles: Record<HrRiskLevel, string> = {
    black: "bg-gray-900 text-white",
    red: "bg-red-600 text-white",
    amber: "bg-amber-500 text-white",
    green: "bg-emerald-600 text-white",
  };
  return <Badge className={styles[level]}>{level.toUpperCase()}</Badge>;
}

function significanceBadge(sig: "routine" | "significant" | "critical") {
  const styles = {
    routine: "bg-slate-100 text-[var(--cs-text-secondary)]",
    significant: "bg-amber-100 text-amber-800",
    critical: "bg-red-100 text-red-800",
  };
  return <Badge className={styles[sig]}>{sig}</Badge>;
}

function statusBadge(status: string) {
  if (status === "approved") return <Badge className="bg-emerald-100 text-emerald-800">Approved</Badge>;
  if (status === "blocked") return <Badge className="bg-red-100 text-red-800">Blocked</Badge>;
  if (status === "senior_risk_acceptance") return <Badge className="bg-amber-100 text-amber-800">Senior Risk Acceptance</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(row.map(escape).join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function HrInspectionModePage() {
  const [expandedSections, setExpandedSections] = useState<Set<InspectionSection>>(
    new Set(ALL_SECTIONS),
  );
  const [period, setPeriod] = useState<string>("6_months");
  const printRef = useRef<HTMLDivElement>(null);

  const [rawWorkforce, setRawWorkforce] = useState<WorkforceSummary>({
    totalStaff: 0, permanentStaff: 0, agencyStaff: 0, vacancies: 0,
    staffInProbation: 0, staffSuspended: 0, averageTenureMonths: 0, turnoverLast12Months: 0,
  });
  const [rawRecruitment, setRawRecruitment] = useState<RecruitmentCheck[]>([]);
  const [rawCases, setRawCases] = useState<CaseRecord[]>([]);
  const [rawChronology, setRawChronology] = useState<ChronologyEvent[]>([]);
  const [rawSuspensions, setRawSuspensions] = useState<SuspensionRecord[]>([]);
  const [rawLado, setRawLado] = useState<LadoReferral[]>([]);
  const [rawCompliance, setRawCompliance] = useState<ComplianceItem[]>([]);
  const [rawOversight, setRawOversight] = useState<OversightRecord[]>([]);

  const { data: apiData } = useHrInspection();
  useEffect(() => {
    if (apiData?.persisted) {
      if (apiData.workforce) setRawWorkforce(apiData.workforce as WorkforceSummary);
      if (Array.isArray(apiData.recruitment)) setRawRecruitment(apiData.recruitment as RecruitmentCheck[]);
      if (Array.isArray(apiData.cases)) setRawCases(apiData.cases as CaseRecord[]);
      if (Array.isArray(apiData.chronology)) setRawChronology(apiData.chronology as ChronologyEvent[]);
      if (Array.isArray(apiData.suspensions)) setRawSuspensions(apiData.suspensions as SuspensionRecord[]);
      if (Array.isArray(apiData.lado)) setRawLado(apiData.lado as LadoReferral[]);
      if (Array.isArray(apiData.compliance)) setRawCompliance(apiData.compliance as ComplianceItem[]);
      if (Array.isArray(apiData.oversight)) setRawOversight(apiData.oversight as OversightRecord[]);
    }
  }, [apiData]);

  const toggleSection = useCallback((section: InspectionSection) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => setExpandedSections(new Set(ALL_SECTIONS)), []);
  const collapseAll = useCallback(() => setExpandedSections(new Set()), []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadAll = useCallback(() => {
    // Cases CSV
    downloadCsv(
      "hr_inspection_cases.csv",
      ["Case ID", "Staff Ref", "Type", "Risk Level", "Status", "Safeguarding Status", "Opened", "Closed", "Duration (days)", "Actions", "Letters", "Guardian Reviews", "RI Oversight Required", "RI Oversight Completed", "Outcome"],
      rawCases.map((c) => [c.id, c.staffRef, c.caseType, c.riskLevel, c.status, c.safeguardingStatus, c.openedAt, c.closedAt ?? "", String(c.daysDuration), String(c.actionCount), String(c.lettersIssued), String(c.guardianReviews), c.riOversightRequired ? "Yes" : "No", c.riOversightCompleted ? "Yes" : "No", c.outcome ?? ""]),
    );
    // Recruitment CSV
    downloadCsv(
      "hr_inspection_recruitment.csv",
      ["Staff Ref", "Start Date", "DBS Cleared", "DBS Date", "References Received", "Reference Count", "Right to Work", "Qualifications", "Health Declaration", "Safeguarding Training", "Gate Outcome", "Outstanding Items"],
      rawRecruitment.map((r) => [r.staffRef, r.startDate, r.dbsCleared ? "Yes" : "No", r.dbsDate ?? "", r.referencesReceived ? "Yes" : "No", String(r.referenceCount), r.rightToWork ? "Yes" : "No", r.qualificationsVerified ? "Yes" : "No", r.healthDeclaration ? "Yes" : "No", r.safeguardingTraining ? "Yes" : "No", r.gateOutcome, r.outstandingItems.join("; ")]),
    );
    // Compliance CSV
    downloadCsv(
      "hr_inspection_compliance.csv",
      ["Staff Ref", "DBS Status", "DBS Update Service", "Mandatory Training Complete", "Training Gaps", "Last Supervision", "Supervision Overdue (days)", "Last Appraisal", "Appraisal Overdue (days)"],
      rawCompliance.map((c) => [c.staffRef, c.dbsStatus, c.dbsUpdateServiceRegistered ? "Yes" : "No", c.mandatoryTrainingComplete ? "Yes" : "No", c.mandatoryTrainingGaps.join("; "), c.lastSupervisionDate ?? "None", String(c.supervisionOverdueDays), c.lastAppraisalDate ?? "None", String(c.appraisalOverdueDays)]),
    );
    // Chronology CSV
    downloadCsv(
      "hr_inspection_chronology.csv",
      ["Date", "Case Ref", "Staff Ref", "Event", "Significance"],
      rawChronology.map((e) => [e.date, e.caseRef, e.staffRef, e.event, e.significance]),
    );
    // Suspensions CSV
    downloadCsv(
      "hr_inspection_suspensions.csv",
      ["Staff Ref", "Start Date", "End Date", "Days Active", "Reason", "Risk Factors Considered", "Alternatives Considered", "Welfare Plan", "Reviews Due", "Reviews Completed", "LADO Linked", "Resolved", "Resolution Outcome"],
      rawSuspensions.map((s) => [s.staffRef, s.startDate, s.endDate ?? "", String(s.daysActive), s.reason, s.riskFactorsConsidered ? "Yes" : "No", s.alternativesConsidered ? "Yes" : "No", s.welfarePlanInPlace ? "Yes" : "No", String(s.reviewsDue), String(s.reviewsCompleted), s.ladoLinked ? "Yes" : "No", s.resolved ? "Yes" : "No", s.resolutionOutcome ?? ""]),
    );
    // LADO CSV
    downloadCsv(
      "hr_inspection_lado.csv",
      ["Staff Ref", "Referral Date", "Allegation Category", "LADO Outcome", "DBS Referral Made", "Ofsted Notified", "Status", "Days to Resolution"],
      rawLado.map((l) => [l.staffRef, l.referralDate, l.allegationCategory, l.ladoOutcome ?? "", l.dbsReferralMade ? "Yes" : "No", l.ofstedNotified ? "Yes" : "No", l.status, l.daysToResolution != null ? String(l.daysToResolution) : ""]),
    );
  }, []);

  // ── Summary stats ─────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const openCases = rawCases.filter((c) => c.status !== "closed" && c.status !== "withdrawn");
    const safeguardingCases = rawCases.filter((c) => c.safeguardingStatus !== "not_safeguarding");
    const overdueSupervisions = rawCompliance.filter((c) => c.supervisionOverdueDays > 0);
    const blockedRecruits = rawRecruitment.filter((r) => r.gateOutcome === "blocked");
    const pendingOversight = rawCases.filter((c) => c.riOversightRequired && !c.riOversightCompleted);
    return {
      openCases: openCases.length,
      safeguardingCases: safeguardingCases.length,
      activeSuspensions: rawSuspensions.filter((s) => !s.resolved).length,
      openLado: rawLado.filter((l) => l.status === "open").length,
      overdueSupervisions: overdueSupervisions.length,
      blockedRecruits: blockedRecruits.length,
      pendingOversight: pendingOversight.length,
      totalStaff: rawWorkforce.totalStaff,
    };
  }, []);

  return (
    <PageShell
      title="HR Inspection Mode"
      subtitle="Structured HR export for Ofsted inspection — print to PDF or download spreadsheets"
    >
      {/* ── Controls ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6 print:hidden">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3_months">Last 3 months</SelectItem>
            <SelectItem value="6_months">Last 6 months</SelectItem>
            <SelectItem value="12_months">Last 12 months</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={expandAll}>
          Expand All
        </Button>
        <Button variant="outline" size="sm" onClick={collapseAll}>
          Collapse All
        </Button>

        <div className="flex-1" />

        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print / PDF
        </Button>
        <Button variant="default" size="sm" onClick={handleDownloadAll}>
          <Download className="h-4 w-4 mr-2" />
          Download All CSVs
        </Button>
      </div>

      {/* ── Header banner ─────────────────────────────────────────────── */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileSearch className="h-6 w-6 text-blue-700 mt-0.5 shrink-0" />
            <div>
              <h2 className="font-semibold text-blue-900 text-lg">Inspection Pack — HR Intelligence</h2>
              {/* suppressHydrationWarning: "as at <today>" is a wall-clock read.
                  The SSR HTML is frozen at build time, so any view on a later day
                  would disagree with it on hydration (React error #418). */}
              <p suppressHydrationWarning className="text-sm text-blue-800 mt-1">
                This pack presents the home&apos;s HR position across the 8 domains an Ofsted
                inspector reviews. Every section can be printed to PDF or exported as a
                spreadsheet. All staff names shown here are anonymised references. The
                pack is generated from live data and reflects the position as at{" "}
                {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Summary cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Staff" value={stats.totalStaff} />
        <StatCard icon={<Gavel className="h-5 w-5" />} label="Open Cases" value={stats.openCases} variant={stats.openCases > 0 ? "amber" : "green"} />
        <StatCard icon={<ShieldAlert className="h-5 w-5" />} label="Safeguarding Cases" value={stats.safeguardingCases} variant={stats.safeguardingCases > 0 ? "red" : "green"} />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Active Suspensions" value={stats.activeSuspensions} variant={stats.activeSuspensions > 0 ? "red" : "green"} />
        <StatCard icon={<ShieldCheck className="h-5 w-5" />} label="Open LADO" value={stats.openLado} variant={stats.openLado > 0 ? "red" : "green"} />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Overdue Supervisions" value={stats.overdueSupervisions} variant={stats.overdueSupervisions > 0 ? "amber" : "green"} />
        <StatCard icon={<XCircle className="h-5 w-5" />} label="Blocked Recruits" value={stats.blockedRecruits} variant={stats.blockedRecruits > 0 ? "amber" : "green"} />
        <StatCard icon={<Eye className="h-5 w-5" />} label="Pending RI Oversight" value={stats.pendingOversight} variant={stats.pendingOversight > 0 ? "amber" : "green"} />
      </div>

      {/* ── Sections ──────────────────────────────────────────────────── */}
      <div ref={printRef} className="space-y-4">
        {/* 1. Workforce Summary */}
        <InspectionSectionCard
          section="workforce"
          expanded={expandedSections.has("workforce")}
          onToggle={toggleSection}
          onDownload={() => downloadCsv(
            "hr_inspection_workforce.csv",
            ["Metric", "Value"],
            [
              ["Total staff", String(rawWorkforce.totalStaff)],
              ["Permanent staff", String(rawWorkforce.permanentStaff)],
              ["Agency staff", String(rawWorkforce.agencyStaff)],
              ["Vacancies", String(rawWorkforce.vacancies)],
              ["Staff in probation", String(rawWorkforce.staffInProbation)],
              ["Staff suspended", String(rawWorkforce.staffSuspended)],
              ["Average tenure (months)", String(rawWorkforce.averageTenureMonths)],
              ["Turnover (last 12 months)", String(rawWorkforce.turnoverLast12Months)],
            ],
          )}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCell label="Total staff" value={rawWorkforce.totalStaff} />
            <MetricCell label="Permanent" value={rawWorkforce.permanentStaff} />
            <MetricCell label="Agency" value={rawWorkforce.agencyStaff} />
            <MetricCell label="Vacancies" value={rawWorkforce.vacancies} warn={rawWorkforce.vacancies > 0} />
            <MetricCell label="In probation" value={rawWorkforce.staffInProbation} />
            <MetricCell label="Suspended" value={rawWorkforce.staffSuspended} warn={rawWorkforce.staffSuspended > 0} />
            <MetricCell label="Avg tenure (months)" value={rawWorkforce.averageTenureMonths} />
            <MetricCell label="Turnover (12m)" value={rawWorkforce.turnoverLast12Months} />
          </div>
        </InspectionSectionCard>

        {/* 2. Safer Recruitment Position */}
        <InspectionSectionCard
          section="recruitment"
          expanded={expandedSections.has("recruitment")}
          onToggle={toggleSection}
          onDownload={() => downloadCsv(
            "hr_inspection_recruitment.csv",
            ["Staff Ref", "Start Date", "DBS Cleared", "References", "Right to Work", "Qualifications", "Health", "Safeguarding Training", "Gate Outcome", "Outstanding"],
            rawRecruitment.map((r) => [r.staffRef, r.startDate, r.dbsCleared ? "Yes" : "No", `${r.referenceCount} received`, r.rightToWork ? "Yes" : "No", r.qualificationsVerified ? "Yes" : "No", r.healthDeclaration ? "Yes" : "No", r.safeguardingTraining ? "Yes" : "No", r.gateOutcome, r.outstandingItems.join("; ")]),
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4">Staff Ref</th>
                  <th className="pb-2 pr-4">Start Date</th>
                  <th className="pb-2 pr-4">DBS</th>
                  <th className="pb-2 pr-4">References</th>
                  <th className="pb-2 pr-4">Right to Work</th>
                  <th className="pb-2 pr-4">Qualifications</th>
                  <th className="pb-2 pr-4">Gate Outcome</th>
                  <th className="pb-2">Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {rawRecruitment.map((r) => (
                  <tr key={r.staffRef} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{r.staffRef}</td>
                    <td className="py-2 pr-4">{formatDate(r.startDate)}</td>
                    <td className="py-2 pr-4">{r.dbsCleared ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-red-600" />}</td>
                    <td className="py-2 pr-4">{r.referenceCount}/2 {r.referencesReceived ? <CheckCircle2 className="h-4 w-4 text-emerald-600 inline ml-1" /> : <XCircle className="h-4 w-4 text-red-600 inline ml-1" />}</td>
                    <td className="py-2 pr-4">{r.rightToWork ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-red-600" />}</td>
                    <td className="py-2 pr-4">{r.qualificationsVerified ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-red-600" />}</td>
                    <td className="py-2 pr-4">{statusBadge(r.gateOutcome)}</td>
                    <td className="py-2 text-xs text-muted-foreground">{r.outstandingItems.length > 0 ? r.outstandingItems.join(", ") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </InspectionSectionCard>

        {/* 3. HR Cases */}
        <InspectionSectionCard
          section="cases"
          expanded={expandedSections.has("cases")}
          onToggle={toggleSection}
          onDownload={() => downloadCsv(
            "hr_inspection_cases.csv",
            ["Case ID", "Staff Ref", "Type", "Risk", "Status", "Safeguarding", "Opened", "Duration", "Actions", "Letters", "Guardian Reviews", "RI Oversight"],
            rawCases.map((c) => [c.id, c.staffRef, c.caseType, c.riskLevel, c.status, c.safeguardingStatus, c.openedAt, String(c.daysDuration), String(c.actionCount), String(c.lettersIssued), String(c.guardianReviews), c.riOversightRequired ? (c.riOversightCompleted ? "Completed" : "Pending") : "N/A"]),
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4">Case</th>
                  <th className="pb-2 pr-4">Staff Ref</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Risk</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Safeguarding</th>
                  <th className="pb-2 pr-4">Opened</th>
                  <th className="pb-2 pr-4">Days</th>
                  <th className="pb-2 pr-4">Actions</th>
                  <th className="pb-2 pr-4">Letters</th>
                  <th className="pb-2 pr-4">Guardian</th>
                  <th className="pb-2">RI Oversight</th>
                </tr>
              </thead>
              <tbody>
                {rawCases.map((c) => (
                  <tr key={c.id} className={cn("border-b last:border-0", c.riskLevel === "black" && "bg-gray-50", c.riskLevel === "red" && "bg-red-50/30")}>
                    <td className="py-2 pr-4 font-mono text-xs">{c.id}</td>
                    <td className="py-2 pr-4 font-medium">{c.staffRef}</td>
                    <td className="py-2 pr-4">{c.caseType.replace(/_/g, " ")}</td>
                    <td className="py-2 pr-4">{riskBadge(c.riskLevel)}</td>
                    <td className="py-2 pr-4"><Badge variant="outline">{c.status.replace(/_/g, " ")}</Badge></td>
                    <td className="py-2 pr-4">{c.safeguardingStatus !== "not_safeguarding" ? <Badge className="bg-purple-100 text-purple-800">{c.safeguardingStatus.replace(/_/g, " ")}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="py-2 pr-4">{formatDate(c.openedAt)}</td>
                    <td className="py-2 pr-4">{c.daysDuration}</td>
                    <td className="py-2 pr-4">{c.actionCount}</td>
                    <td className="py-2 pr-4">{c.lettersIssued}</td>
                    <td className="py-2 pr-4">{c.guardianReviews}</td>
                    <td className="py-2">
                      {c.riOversightRequired ? (
                        c.riOversightCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-600" />
                        )
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </InspectionSectionCard>

        {/* 4. Case Chronology */}
        <InspectionSectionCard
          section="chronology"
          expanded={expandedSections.has("chronology")}
          onToggle={toggleSection}
          onDownload={() => downloadCsv(
            "hr_inspection_chronology.csv",
            ["Date", "Case Ref", "Staff Ref", "Event", "Significance"],
            rawChronology.map((e) => [e.date, e.caseRef, e.staffRef, e.event, e.significance]),
          )}
        >
          <div className="space-y-2">
            {rawChronology.map((e, i) => (
              <div key={i} className={cn("flex items-start gap-3 p-3 rounded-lg border", e.significance === "critical" && "border-red-200 bg-red-50/30", e.significance === "significant" && "border-amber-200 bg-amber-50/30")}>
                <div className="text-xs text-muted-foreground whitespace-nowrap pt-0.5 w-20 shrink-0">{formatDate(e.date)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{e.staffRef}</span>
                    <span className="text-xs text-muted-foreground font-mono">{e.caseRef}</span>
                    {significanceBadge(e.significance)}
                  </div>
                  <p className="text-sm">{e.event}</p>
                </div>
              </div>
            ))}
          </div>
        </InspectionSectionCard>

        {/* 5. Suspension Register */}
        <InspectionSectionCard
          section="suspensions"
          expanded={expandedSections.has("suspensions")}
          onToggle={toggleSection}
          onDownload={() => downloadCsv(
            "hr_inspection_suspensions.csv",
            ["Staff Ref", "Start", "End", "Days", "Reason", "Risk Factors", "Alternatives", "Welfare Plan", "Reviews Due", "Reviews Done", "LADO Linked", "Resolved", "Outcome"],
            rawSuspensions.map((s) => [s.staffRef, s.startDate, s.endDate ?? "", String(s.daysActive), s.reason, s.riskFactorsConsidered ? "Yes" : "No", s.alternativesConsidered ? "Yes" : "No", s.welfarePlanInPlace ? "Yes" : "No", String(s.reviewsDue), String(s.reviewsCompleted), s.ladoLinked ? "Yes" : "No", s.resolved ? "Yes" : "No", s.resolutionOutcome ?? ""]),
          )}
        >
          <div className="space-y-4">
            {rawSuspensions.map((s, i) => (
              <div key={i} className={cn("p-4 rounded-lg border", !s.resolved ? "border-red-200 bg-red-50/30" : "border-gray-200")}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.staffRef}</span>
                    {!s.resolved ? <Badge className="bg-red-600 text-white">Active</Badge> : <Badge className="bg-gray-100 text-gray-700">Resolved</Badge>}
                    {s.ladoLinked && <Badge className="bg-purple-100 text-purple-800">LADO linked</Badge>}
                  </div>
                  <span className="text-sm text-muted-foreground">{s.daysActive} days</span>
                </div>
                <p className="text-sm mb-3">{s.reason}</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    {s.riskFactorsConsidered ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-red-600" />}
                    <span>Risk factors</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {s.alternativesConsidered ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-red-600" />}
                    <span>Alternatives</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {s.welfarePlanInPlace ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-red-600" />}
                    <span>Welfare plan</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Reviews: {s.reviewsCompleted}/{s.reviewsDue}</span>
                  </div>
                  {s.resolutionOutcome && (
                    <div className="flex items-center gap-1 col-span-2 md:col-span-1">
                      <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{s.resolutionOutcome}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </InspectionSectionCard>

        {/* 6. Safeguarding / LADO */}
        <InspectionSectionCard
          section="lado"
          expanded={expandedSections.has("lado")}
          onToggle={toggleSection}
          onDownload={() => downloadCsv(
            "hr_inspection_lado.csv",
            ["Staff Ref", "Referral Date", "Category", "Outcome", "DBS Referral", "Ofsted Notified", "Status", "Days to Resolution"],
            rawLado.map((l) => [l.staffRef, l.referralDate, l.allegationCategory, l.ladoOutcome ?? "", l.dbsReferralMade ? "Yes" : "No", l.ofstedNotified ? "Yes" : "No", l.status, l.daysToResolution != null ? String(l.daysToResolution) : ""]),
          )}
        >
          <div className="space-y-4">
            {rawLado.map((l, i) => (
              <div key={i} className={cn("p-4 rounded-lg border", l.status === "open" ? "border-red-200 bg-red-50/30" : "border-gray-200")}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{l.staffRef}</span>
                    {l.status === "open" ? <Badge className="bg-red-600 text-white">Open</Badge> : <Badge className="bg-gray-100 text-gray-700">Closed</Badge>}
                  </div>
                  <span className="text-sm text-muted-foreground">{formatDate(l.referralDate)}</span>
                </div>
                <p className="text-sm mb-3">{l.allegationCategory}</p>
                <div className="flex flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    {l.ofstedNotified ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-red-600" />}
                    <span>Ofsted notified</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {l.dbsReferralMade ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <span className="text-muted-foreground">—</span>}
                    <span>DBS referral {l.dbsReferralMade ? "made" : "not required yet"}</span>
                  </div>
                  {l.ladoOutcome && (
                    <div className="flex items-center gap-1">
                      <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Outcome: {l.ladoOutcome}</span>
                    </div>
                  )}
                  {l.daysToResolution != null && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{l.daysToResolution} days to resolution</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </InspectionSectionCard>

        {/* 7. Training & Compliance */}
        <InspectionSectionCard
          section="compliance"
          expanded={expandedSections.has("compliance")}
          onToggle={toggleSection}
          onDownload={() => downloadCsv(
            "hr_inspection_compliance.csv",
            ["Staff Ref", "DBS Status", "Update Service", "Mandatory Training", "Gaps", "Last Supervision", "Supervision Overdue", "Last Appraisal", "Appraisal Overdue"],
            rawCompliance.map((c) => [c.staffRef, c.dbsStatus, c.dbsUpdateServiceRegistered ? "Yes" : "No", c.mandatoryTrainingComplete ? "Yes" : "No", c.mandatoryTrainingGaps.join("; "), c.lastSupervisionDate ?? "", String(c.supervisionOverdueDays), c.lastAppraisalDate ?? "", String(c.appraisalOverdueDays)]),
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4">Staff Ref</th>
                  <th className="pb-2 pr-4">DBS</th>
                  <th className="pb-2 pr-4">Update Service</th>
                  <th className="pb-2 pr-4">Mandatory Training</th>
                  <th className="pb-2 pr-4">Last Supervision</th>
                  <th className="pb-2 pr-4">Last Appraisal</th>
                  <th className="pb-2">Issues</th>
                </tr>
              </thead>
              <tbody>
                {rawCompliance.map((c) => {
                  const issues: string[] = [];
                  if (c.supervisionOverdueDays > 0) issues.push(`Supervision overdue ${c.supervisionOverdueDays}d`);
                  if (c.appraisalOverdueDays > 0) issues.push(`Appraisal overdue ${c.appraisalOverdueDays}d`);
                  if (c.mandatoryTrainingGaps.length > 0) issues.push(...c.mandatoryTrainingGaps);
                  if (c.dbsStatus === "due_renewal") issues.push("DBS due renewal");
                  if (c.dbsStatus === "expired") issues.push("DBS expired");
                  return (
                    <tr key={c.staffRef} className={cn("border-b last:border-0", issues.length > 0 && "bg-amber-50/30")}>
                      <td className="py-2 pr-4 font-medium">{c.staffRef}</td>
                      <td className="py-2 pr-4">
                        <Badge className={cn(c.dbsStatus === "current" ? "bg-emerald-100 text-emerald-800" : c.dbsStatus === "expired" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800")}>
                          {c.dbsStatus.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4">{c.dbsUpdateServiceRegistered ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}</td>
                      <td className="py-2 pr-4">{c.mandatoryTrainingComplete ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-red-600" />}</td>
                      <td className="py-2 pr-4">
                        {c.lastSupervisionDate ? (
                          <span className={cn(c.supervisionOverdueDays > 0 && "text-amber-700 font-medium")}>{formatDate(c.lastSupervisionDate)}</span>
                        ) : (
                          <span className="text-red-600 font-medium">None</span>
                        )}
                      </td>
                      <td className="py-2 pr-4">
                        {c.lastAppraisalDate ? (
                          <span className={cn(c.appraisalOverdueDays > 0 && "text-amber-700 font-medium")}>{formatDate(c.lastAppraisalDate)}</span>
                        ) : (
                          <span className="text-red-600 font-medium">None</span>
                        )}
                      </td>
                      <td className="py-2 text-xs">
                        {issues.length > 0 ? (
                          <span className="text-amber-700">{issues.join(", ")}</span>
                        ) : (
                          <span className="text-emerald-600">All clear</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </InspectionSectionCard>

        {/* 8. RI Oversight & Quality Assurance */}
        <InspectionSectionCard
          section="oversight"
          expanded={expandedSections.has("oversight")}
          onToggle={toggleSection}
          onDownload={() => downloadCsv(
            "hr_inspection_oversight.csv",
            ["Case Ref", "Staff Ref", "Type", "Completed By", "Date", "Finding", "Actions Required", "Actions Completed"],
            rawOversight.map((o) => [o.caseRef, o.staffRef, o.oversightType.replace(/_/g, " "), o.completedBy, o.completedAt, o.findingSummary, String(o.actionsRequired), String(o.actionsCompleted)]),
          )}
        >
          <div className="space-y-4">
            {rawOversight.map((o, i) => (
              <div key={i} className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{o.staffRef}</span>
                    <span className="text-xs text-muted-foreground font-mono">{o.caseRef}</span>
                    <Badge variant="outline">{o.oversightType.replace(/_/g, " ")}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{formatDate(o.completedAt)}</span>
                </div>
                <p className="text-sm mb-2">{o.findingSummary}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>By: {o.completedBy}</span>
                  <span>Actions: {o.actionsCompleted}/{o.actionsRequired} completed</span>
                  {o.actionsCompleted >= o.actionsRequired ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </InspectionSectionCard>
      </div>

      {/* ── Print footer ──────────────────────────────────────────────── */}
      <div className="hidden print:block mt-8 pt-4 border-t text-xs text-muted-foreground">
        <p>Generated by Cara HR Intelligence — {new Date().toISOString()}</p>
        <p>This document contains sensitive HR information. Handle in accordance with data protection policy.</p>
      </div>
    </PageShell>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ icon, label, value, variant = "neutral" }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  variant?: "neutral" | "green" | "amber" | "red";
}) {
  const bg = {
    neutral: "bg-white",
    green: "bg-emerald-50 border-emerald-200",
    amber: "bg-amber-50 border-amber-200",
    red: "bg-red-50 border-red-200",
  };
  return (
    <Card className={cn(bg[variant])}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">{icon}<span className="text-xs">{label}</span></div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function MetricCell({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className={cn("p-3 rounded-lg border text-center", warn && "border-amber-200 bg-amber-50/50")}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function InspectionSectionCard({ section, expanded, onToggle, onDownload, children }: {
  section: InspectionSection;
  expanded: boolean;
  onToggle: (s: InspectionSection) => void;
  onDownload: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => onToggle(section)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{SECTION_LABELS[section]}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="print:hidden"
              onClick={(e) => { e.stopPropagation(); onDownload(); }}
            >
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              CSV
            </Button>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="print:block">{children}</CardContent>
      )}
    </Card>
  );
}

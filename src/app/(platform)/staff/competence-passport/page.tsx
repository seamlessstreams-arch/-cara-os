"use client";

import React, { useState, useEffect } from "react";
import { useCompetenceRecords, useCreateCompetenceRecord } from "@/hooks/use-intelligence-layer";
import { PageShell } from "@/components/layout/page-shell";
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
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  GraduationCap,
  UserCheck,
  Calendar,
  Star,
  FileCheck,
  Heart,
  Award,
  Ban,
  ThumbsUp,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type ComplianceStatus = "valid" | "expiring" | "expired" | "not_started" | "in_progress";

interface PassportItem {
  label: string;
  status: ComplianceStatus;
  detail: string;
  expiryDate?: string;
}

interface CompetencyFlag {
  label: string;
  granted: boolean;
  grantedDate?: string;
}

interface Warning {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  date: string;
}

interface Restriction {
  id: string;
  restriction: string;
  reason: string;
  appliedDate: string;
  appliedBy: string;
}

interface Compliment {
  id: string;
  text: string;
  from: string;
  date: string;
}

interface StaffRecord {
  id: string;
  name: string;
  role: string;
  startDate: string;
  passport: PassportItem[];
  competencyFlags: CompetencyFlag[];
  warnings: Warning[];
  restrictions: Restriction[];
  compliments: Compliment[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<ComplianceStatus, { label: string; color: string; icon: React.ReactNode }> = {
  valid: { label: "Valid", color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> },
  expiring: { label: "Expiring Soon", color: "bg-amber-100 text-amber-800", icon: <Clock className="h-3.5 w-3.5 text-amber-600" /> },
  expired: { label: "Expired", color: "bg-red-100 text-red-800", icon: <XCircle className="h-3.5 w-3.5 text-red-600" /> },
  not_started: { label: "Not Started", color: "bg-gray-100 text-gray-800", icon: <Clock className="h-3.5 w-3.5 text-gray-500" /> },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800", icon: <Clock className="h-3.5 w-3.5 text-blue-600" /> },
};

const SEVERITY_META: Record<string, { color: string }> = {
  low: { color: "bg-blue-100 text-blue-800" },
  medium: { color: "bg-amber-100 text-amber-800" },
  high: { color: "bg-orange-100 text-orange-800" },
  critical: { color: "bg-red-100 text-red-800" },
};

// ── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_STAFF: StaffRecord[] = [
  {
    id: "staff-a",
    name: "Staff A - Sarah Mitchell",
    role: "Senior Residential Worker",
    startDate: "2022-03-15",
    passport: [
      { label: "DBS Status", status: "valid", detail: "Enhanced DBS - Update service registered", expiryDate: "2027-03-15" },
      { label: "References", status: "valid", detail: "2 satisfactory references on file" },
      { label: "Right to Work", status: "valid", detail: "British Citizen - passport verified" },
      { label: "Induction", status: "valid", detail: "Completed 18 Mar 2022" },
      { label: "Probation", status: "valid", detail: "Passed - June 2022" },
      { label: "Level 3 Diploma", status: "valid", detail: "Level 3 Children & Young People achieved 2023" },
      { label: "Mandatory Training", status: "valid", detail: "All 12 modules completed. Renewal Mar 2027" },
      { label: "Safeguarding Training", status: "valid", detail: "Level 3 - Refreshed Jan 2026", expiryDate: "2028-01-15" },
      { label: "Medication Competency", status: "valid", detail: "Assessed and signed off by manager", expiryDate: "2026-11-20" },
      { label: "Physical Intervention", status: "valid", detail: "Team Teach Level 2 - refreshed Feb 2026", expiryDate: "2027-02-10" },
      { label: "Last Supervision", status: "valid", detail: "28 Apr 2026 - next due 26 May 2026" },
      { label: "Last Appraisal", status: "valid", detail: "Annual appraisal completed Mar 2026" },
    ],
    competencyFlags: [
      { label: "Can Lead Shift", granted: true, grantedDate: "2023-06-01" },
      { label: "Can Administer Medication", granted: true, grantedDate: "2022-09-15" },
      { label: "Can Lone Work", granted: true, grantedDate: "2023-01-10" },
      { label: "Can Supervise Others", granted: true, grantedDate: "2024-03-01" },
    ],
    warnings: [],
    restrictions: [],
    compliments: [
      { id: "c1", text: "Brilliant handling of a difficult situation with Child A. Calm, professional, and child-centred throughout.", from: "Darren Laville (RM)", date: "2026-04-20" },
      { id: "c2", text: "Thank you for covering extra shifts this month without complaint. Really valued.", from: "Darren Laville (RM)", date: "2026-04-05" },
    ],
  },
  {
    id: "staff-b",
    name: "Staff B - James Cooper",
    role: "Residential Worker",
    startDate: "2023-09-01",
    passport: [
      { label: "DBS Status", status: "valid", detail: "Enhanced DBS", expiryDate: "2026-09-01" },
      { label: "References", status: "valid", detail: "2 satisfactory references on file" },
      { label: "Right to Work", status: "valid", detail: "British Citizen" },
      { label: "Induction", status: "valid", detail: "Completed Sep 2023" },
      { label: "Probation", status: "valid", detail: "Passed - March 2024" },
      { label: "Level 3 Diploma", status: "in_progress", detail: "Started Jan 2025 - Unit 4 of 8 complete" },
      { label: "Mandatory Training", status: "expiring", detail: "10 of 12 modules current. 2 due renewal", expiryDate: "2026-06-01" },
      { label: "Safeguarding Training", status: "valid", detail: "Level 2 - completed Oct 2025", expiryDate: "2027-10-15" },
      { label: "Medication Competency", status: "valid", detail: "Assessed by senior", expiryDate: "2026-12-01" },
      { label: "Physical Intervention", status: "valid", detail: "Team Teach Level 1", expiryDate: "2027-01-20" },
      { label: "Last Supervision", status: "expiring", detail: "15 Apr 2026 - overdue by 3 days" },
      { label: "Last Appraisal", status: "valid", detail: "Completed Jan 2026" },
    ],
    competencyFlags: [
      { label: "Can Lead Shift", granted: false },
      { label: "Can Administer Medication", granted: true, grantedDate: "2024-06-01" },
      { label: "Can Lone Work", granted: false },
      { label: "Can Supervise Others", granted: false },
    ],
    warnings: [
      { id: "w1", severity: "medium", title: "Supervision overdue", description: "Last supervision was 20 days ago. Monthly supervision required per Reg 33.", date: "2026-05-05" },
      { id: "w2", severity: "low", title: "2 training modules expiring", description: "Fire Safety and First Aid modules expire on 1 June 2026.", date: "2026-05-01" },
    ],
    restrictions: [],
    compliments: [
      { id: "c1", text: "Great relationship building with Child C. They really respond well to you.", from: "Sarah Mitchell (Senior)", date: "2026-03-15" },
    ],
  },
  {
    id: "staff-c",
    name: "Staff C - Tom Richards",
    role: "Residential Worker",
    startDate: "2024-06-01",
    passport: [
      { label: "DBS Status", status: "valid", detail: "Enhanced DBS", expiryDate: "2027-06-01" },
      { label: "References", status: "valid", detail: "2 satisfactory references" },
      { label: "Right to Work", status: "valid", detail: "Settled Status" },
      { label: "Induction", status: "valid", detail: "Completed Jun 2024" },
      { label: "Probation", status: "valid", detail: "Passed - Dec 2024" },
      { label: "Level 3 Diploma", status: "not_started", detail: "Scheduled to start Sep 2026" },
      { label: "Mandatory Training", status: "valid", detail: "All modules current" },
      { label: "Safeguarding Training", status: "valid", detail: "Level 2", expiryDate: "2027-07-01" },
      { label: "Medication Competency", status: "not_started", detail: "Assessment booked for June 2026" },
      { label: "Physical Intervention", status: "valid", detail: "Team Teach Level 1", expiryDate: "2027-03-01" },
      { label: "Last Supervision", status: "valid", detail: "1 May 2026" },
      { label: "Last Appraisal", status: "valid", detail: "Due Dec 2026 (first annual)" },
    ],
    competencyFlags: [
      { label: "Can Lead Shift", granted: false },
      { label: "Can Administer Medication", granted: false },
      { label: "Can Lone Work", granted: false },
      { label: "Can Supervise Others", granted: false },
    ],
    warnings: [
      { id: "w1", severity: "low", title: "Medication competency not yet assessed", description: "Cannot administer medication until assessment completed.", date: "2026-05-01" },
    ],
    restrictions: [
      { id: "r1", restriction: "Cannot administer medication", reason: "Competency assessment not yet completed", appliedDate: "2024-06-01", appliedBy: "Darren Laville" },
    ],
    compliments: [],
  },
  {
    id: "staff-d",
    name: "Staff D - Priya Patel",
    role: "Waking Night Worker",
    startDate: "2023-01-10",
    passport: [
      { label: "DBS Status", status: "valid", detail: "Enhanced DBS", expiryDate: "2026-01-10" },
      { label: "References", status: "valid", detail: "2 satisfactory references" },
      { label: "Right to Work", status: "valid", detail: "British Citizen" },
      { label: "Induction", status: "valid", detail: "Completed Jan 2023" },
      { label: "Probation", status: "valid", detail: "Passed - Jul 2023" },
      { label: "Level 3 Diploma", status: "valid", detail: "Achieved 2024" },
      { label: "Mandatory Training", status: "expired", detail: "3 modules expired in April 2026", expiryDate: "2026-04-01" },
      { label: "Safeguarding Training", status: "valid", detail: "Level 2", expiryDate: "2027-02-01" },
      { label: "Medication Competency", status: "valid", detail: "Night meds only", expiryDate: "2026-08-01" },
      { label: "Physical Intervention", status: "expired", detail: "Team Teach expired March 2026", expiryDate: "2026-03-01" },
      { label: "Last Supervision", status: "expired", detail: "Last session 2 Mar 2026 - 9 weeks overdue" },
      { label: "Last Appraisal", status: "valid", detail: "Completed Feb 2026" },
    ],
    competencyFlags: [
      { label: "Can Lead Shift", granted: false },
      { label: "Can Administer Medication", granted: true, grantedDate: "2023-08-01" },
      { label: "Can Lone Work", granted: true, grantedDate: "2023-09-15" },
      { label: "Can Supervise Others", granted: false },
    ],
    warnings: [
      { id: "w1", severity: "high", title: "Physical intervention training expired", description: "Team Teach certification expired March 2026. Cannot be involved in any physical interventions.", date: "2026-04-01" },
      { id: "w2", severity: "high", title: "Supervision severely overdue", description: "9 weeks since last supervision. Reg 33 requires monthly. Immediate action needed.", date: "2026-05-05" },
      { id: "w3", severity: "medium", title: "3 mandatory training modules expired", description: "Lone Working, Equality & Diversity, and Data Protection all expired.", date: "2026-04-15" },
    ],
    restrictions: [
      { id: "r1", restriction: "Cannot use physical intervention", reason: "Team Teach certification expired", appliedDate: "2026-04-01", appliedBy: "Darren Laville" },
    ],
    compliments: [
      { id: "c1", text: "Priya is always calm and reassuring during night shifts. The children feel safe with her.", from: "Darren Laville (RM)", date: "2026-02-20" },
    ],
  },
  {
    id: "staff-e",
    name: "Staff E - Marcus Williams",
    role: "Senior Residential Worker",
    startDate: "2021-11-01",
    passport: [
      { label: "DBS Status", status: "valid", detail: "Enhanced DBS - Update service", expiryDate: "2027-11-01" },
      { label: "References", status: "valid", detail: "2 satisfactory references" },
      { label: "Right to Work", status: "valid", detail: "British Citizen" },
      { label: "Induction", status: "valid", detail: "Completed Nov 2021" },
      { label: "Probation", status: "valid", detail: "Passed - May 2022" },
      { label: "Level 3 Diploma", status: "valid", detail: "Level 5 Leadership achieved 2025" },
      { label: "Mandatory Training", status: "valid", detail: "All 12 modules current" },
      { label: "Safeguarding Training", status: "valid", detail: "Level 3", expiryDate: "2027-09-01" },
      { label: "Medication Competency", status: "valid", detail: "Full competency", expiryDate: "2027-01-15" },
      { label: "Physical Intervention", status: "valid", detail: "Team Teach Level 2 - Trainer", expiryDate: "2027-06-01" },
      { label: "Last Supervision", status: "valid", detail: "30 Apr 2026" },
      { label: "Last Appraisal", status: "valid", detail: "Completed Nov 2025" },
    ],
    competencyFlags: [
      { label: "Can Lead Shift", granted: true, grantedDate: "2022-05-01" },
      { label: "Can Administer Medication", granted: true, grantedDate: "2022-03-01" },
      { label: "Can Lone Work", granted: true, grantedDate: "2022-06-15" },
      { label: "Can Supervise Others", granted: true, grantedDate: "2023-11-01" },
    ],
    warnings: [],
    restrictions: [],
    compliments: [
      { id: "c1", text: "Marcus is an outstanding practitioner. His approach with the most challenging children is exemplary.", from: "Ofsted Inspector", date: "2025-11-10" },
      { id: "c2", text: "Thank you for mentoring the new staff so effectively. They all speak highly of your support.", from: "Darren Laville (RM)", date: "2026-03-01" },
      { id: "c3", text: "Marcus handled the crisis brilliantly. Professional, proportionate and child-focused throughout.", from: "RI - Regional Manager", date: "2026-01-15" },
    ],
  },
  {
    id: "staff-f",
    name: "Staff F - Amy Green",
    role: "Residential Worker (New Starter)",
    startDate: "2026-04-14",
    passport: [
      { label: "DBS Status", status: "valid", detail: "Enhanced DBS received 10 Apr 2026" },
      { label: "References", status: "valid", detail: "2 satisfactory references" },
      { label: "Right to Work", status: "valid", detail: "British Citizen" },
      { label: "Induction", status: "in_progress", detail: "Week 3 of 6-week induction programme" },
      { label: "Probation", status: "in_progress", detail: "Started 14 Apr 2026 - 6 month period" },
      { label: "Level 3 Diploma", status: "not_started", detail: "To start after probation" },
      { label: "Mandatory Training", status: "in_progress", detail: "5 of 12 modules completed" },
      { label: "Safeguarding Training", status: "valid", detail: "Level 2 completed in induction week 1" },
      { label: "Medication Competency", status: "not_started", detail: "Scheduled for induction week 5" },
      { label: "Physical Intervention", status: "in_progress", detail: "Team Teach booked 20 May 2026" },
      { label: "Last Supervision", status: "valid", detail: "2 May 2026 (weekly during induction)" },
      { label: "Last Appraisal", status: "not_started", detail: "First appraisal due Oct 2026" },
    ],
    competencyFlags: [
      { label: "Can Lead Shift", granted: false },
      { label: "Can Administer Medication", granted: false },
      { label: "Can Lone Work", granted: false },
      { label: "Can Supervise Others", granted: false },
    ],
    warnings: [],
    restrictions: [
      { id: "r1", restriction: "Cannot lone work", reason: "Induction period - must be supernumerary", appliedDate: "2026-04-14", appliedBy: "Darren Laville" },
      { id: "r2", restriction: "Cannot administer medication", reason: "Not yet assessed", appliedDate: "2026-04-14", appliedBy: "Darren Laville" },
      { id: "r3", restriction: "Cannot use physical intervention", reason: "Training not yet completed", appliedDate: "2026-04-14", appliedBy: "Darren Laville" },
    ],
    compliments: [],
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function StaffCompetencePassportPage() {
  const [selectedStaff, setSelectedStaff] = useState("staff-a");
  const [staffRecords, setStaffRecords] = useState<StaffRecord[]>(DEMO_STAFF);

  /* ── API hooks ─────────────────────────────────────────────────────────── */
  const { data: apiData } = useCompetenceRecords();
  const updateCompetence = useCreateCompetenceRecord();

  useEffect(() => {
    if (apiData?.persisted && apiData.records.length > 0) {
      setStaffRecords((apiData.records as Record<string, unknown>[]).map((row) => ({
        id: row.id as string,
        name: (row.staff_id as string) ?? "",
        role: "",
        startDate: "",
        passport: [
          { label: "Safer Recruitment", status: row.safer_recruitment_complete ? "valid" as ComplianceStatus : "not_started" as ComplianceStatus, detail: row.safer_recruitment_complete ? "Complete" : "Incomplete" },
          { label: "DBS Check", status: (row.dbs_status as ComplianceStatus) ?? "not_started", detail: (row.dbs_status as string) ?? "", expiryDate: (row.dbs_date as string) ?? undefined },
          { label: "Induction", status: row.induction_complete ? "valid" as ComplianceStatus : "not_started" as ComplianceStatus, detail: row.induction_complete ? "Complete" : "Incomplete" },
          { label: "Mandatory Training", status: row.mandatory_training_complete ? "valid" as ComplianceStatus : "not_started" as ComplianceStatus, detail: row.mandatory_training_complete ? "Complete" : "Incomplete" },
          { label: "Safeguarding Training", status: row.safeguarding_training_date ? "valid" as ComplianceStatus : "not_started" as ComplianceStatus, detail: (row.safeguarding_training_date as string) ?? "" },
          { label: "Medication Competency", status: row.medication_competency ? "valid" as ComplianceStatus : "not_started" as ComplianceStatus, detail: row.medication_competency ? "Passed" : "Not assessed" },
          { label: "Supervision", status: row.last_supervision_date ? "valid" as ComplianceStatus : "not_started" as ComplianceStatus, detail: row.last_supervision_date ? `Last: ${row.last_supervision_date}` : "None recorded" },
        ],
        competencyFlags: [
          { label: "Can Lead Shift", granted: (row.can_lead_shift as boolean) ?? false },
          { label: "Can Administer Medication", granted: (row.can_administer_medication as boolean) ?? false },
          { label: "Can Lone Work", granted: (row.can_lone_work as boolean) ?? false },
        ],
        warnings: (row.performance_concerns as string)
          ? [{ id: "w1", severity: "medium" as const, title: "Performance Concern", description: row.performance_concerns as string, date: "" }]
          : [],
        restrictions: (row.restrictions as string)
          ? [{ id: "r1", restriction: row.restrictions as string, reason: "", appliedDate: "", appliedBy: "" }]
          : [],
        compliments: (row.compliments as string)
          ? [{ id: "c1", text: row.compliments as string, from: "", date: "" }]
          : [],
      })));
    }
  }, [apiData]);

  const staff = staffRecords.find((s) => s.id === selectedStaff) || staffRecords[0];

  const validCount = staff.passport.filter((p) => p.status === "valid").length;
  const totalCount = staff.passport.length;
  const compliancePercent = Math.round((validCount / totalCount) * 100);

  return (
    <PageShell
      title="Staff Competence Passport"
      subtitle="Competencies, compliance, warnings, and restrictions"
      ariaContext={{ pageTitle: "Competencies, compliance, warnings, and restrictions", sourceType: "child_record" }}
    >
      <div className="space-y-6">
        {/* Staff Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffRecords.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                "text-xs",
                compliancePercent === 100
                  ? "bg-green-100 text-green-800"
                  : compliancePercent >= 75
                  ? "bg-amber-100 text-amber-800"
                  : "bg-red-100 text-red-800"
              )}
            >
              {compliancePercent}% compliant
            </Badge>
            <Badge variant="outline" className="text-xs">
              {staff.role}
            </Badge>
          </div>
        </div>

        {/* Passport Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-600" />
              Compliance Passport
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {staff.passport.map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "border rounded-lg p-3 space-y-1.5",
                    item.status === "expired" && "border-red-200 bg-red-50/50",
                    item.status === "expiring" && "border-amber-200 bg-amber-50/50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{item.label}</span>
                    {STATUS_META[item.status].icon}
                  </div>
                  <Badge className={cn("text-xs", STATUS_META[item.status].color)}>
                    {STATUS_META[item.status].label}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                  {item.expiryDate && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Expires: {new Date(item.expiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Competency Flags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-600" />
              Competency Flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {staff.competencyFlags.map((flag) => (
                <div
                  key={flag.label}
                  className={cn(
                    "border rounded-lg p-4 flex items-center gap-3",
                    flag.granted
                      ? "border-green-200 bg-green-50/50"
                      : "border-red-200 bg-red-50/50"
                  )}
                >
                  {flag.granted ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{flag.label}</p>
                    {flag.grantedDate && (
                      <p className="text-xs text-muted-foreground">
                        Since {new Date(flag.grantedDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Warnings */}
        {staff.warnings.length > 0 && (
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
                Warnings ({staff.warnings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staff.warnings.map((warning) => (
                  <div
                    key={warning.id}
                    className="border rounded-lg p-3 space-y-1.5 bg-amber-50/30"
                  >
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-xs", SEVERITY_META[warning.severity].color)}>
                        {warning.severity}
                      </Badge>
                      <span className="text-sm font-medium">{warning.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{warning.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Flagged: {new Date(warning.date).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Restrictions */}
        {staff.restrictions.length > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <Ban className="h-5 w-5" />
                Restrictions ({staff.restrictions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staff.restrictions.map((restriction) => (
                  <div
                    key={restriction.id}
                    className="border border-red-100 rounded-lg p-3 space-y-1 bg-red-50/30"
                  >
                    <p className="text-sm font-medium text-red-900">{restriction.restriction}</p>
                    <p className="text-sm text-muted-foreground">{restriction.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Applied {new Date(restriction.appliedDate).toLocaleDateString("en-GB")} by {restriction.appliedBy}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compliments */}
        {staff.compliments.length > 0 && (
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <ThumbsUp className="h-5 w-5" />
                Compliments ({staff.compliments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {staff.compliments.map((compliment) => (
                  <div
                    key={compliment.id}
                    className="border border-green-100 rounded-lg p-3 space-y-1 bg-green-50/30"
                  >
                    <p className="text-sm italic text-green-900">&ldquo;{compliment.text}&rdquo;</p>
                    <p className="text-xs text-muted-foreground">
                      {compliment.from} - {new Date(compliment.date).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manager Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              Manager Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <GraduationCap className="h-4 w-4 mr-1" />
                Assign Training
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-1" />
                Schedule Supervision
              </Button>
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-1" />
                Restrict Duty
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={updateCompetence.isPending}
                onClick={() => updateCompetence.mutate({
                  staffId: selectedStaff,
                  homeId: "oak-house",
                  mandatoryTrainingComplete: true,
                })}
              >
                <Star className="h-4 w-4 mr-1" />
                {updateCompetence.isPending ? "Saving..." : "Approve Competency"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

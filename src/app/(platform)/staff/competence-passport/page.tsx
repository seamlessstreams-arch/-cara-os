"use client";

import React, { useState, useEffect } from "react";
import { useCompetenceRecords, useCreateCompetenceRecord } from "@/hooks/use-intelligence-layer";
import { PageShell } from "@/components/layout/page-shell";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";
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


// ── Component ────────────────────────────────────────────────────────────────

export default function StaffCompetencePassportPage() {
  const [selectedStaff, setSelectedStaff] = useState("staff-a");
  const [staffRecords, setStaffRecords] = useState<StaffRecord[]>([]);

  /* ── API hooks ─────────────────────────────────────────────────────────── */
  const { data: apiData } = useCompetenceRecords();
  const updateCompetence = useCreateCompetenceRecord();

  useEffect(() => {
    const rich = (apiData as unknown as { richRecords?: unknown[] } | undefined)?.richRecords;
    if (apiData?.persisted && Array.isArray(rich) && rich.length > 0) {
      setStaffRecords(rich as StaffRecord[]);
      return;
    }
    if (apiData?.persisted && Array.isArray(apiData.records) && apiData.records.length > 0) {
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

  if (!staff) {
    return (
      <PageShell
        title="Staff Competence Passport"
        subtitle="Competencies, compliance, warnings, and restrictions"
        ariaContext={{ pageTitle: "Staff Competence Passport", sourceType: "staff" }}
      >
        <div className="p-12 text-center text-muted-foreground">Loading staff competence records…</div>
      </PageShell>
    );
  }

  const validCount = staff.passport.filter((p) => p.status === "valid").length;
  const totalCount = staff.passport.length;
  const compliancePercent = Math.round((validCount / totalCount) * 100);

  return (
    <PageShell
      title="Staff Competence Passport"
      subtitle="Competencies, compliance, warnings, and restrictions"
      ariaContext={{ pageTitle: "Staff Competence Passport", sourceType: "staff" }}
      actions={<AriaStudioQuickActionButton context={{ record_type: "staff_training", record_id: "home_oak", home_id: "home_oak" }} />}
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
        {(staff.warnings?.length ?? 0) > 0 && (
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
                Warnings ({(staff.warnings?.length ?? 0)})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(staff.warnings ?? []).map((warning) => (
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
      <AriaPanel
        mode="assist"
        pageContext="Staff Competence Passport — individual staff competencies, skills, compliance status, training records, warnings and restrictions, Reg 40 staff qualifications evidence, Ofsted workforce"
        recordType="staff_training"
        className="mt-6"
      />
    </PageShell>
  );
}

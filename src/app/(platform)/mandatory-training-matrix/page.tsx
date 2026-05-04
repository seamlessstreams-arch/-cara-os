"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle, CheckCircle2, Clock, Users, Shield, GraduationCap,
  ChevronDown, ChevronUp, ArrowUpDown, FileCheck, Award, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type CourseCategory = "Mandatory" | "Role-specific" | "Best practice";
type CourseStatus = "Valid" | "Expiring soon" | "Expired" | "Not completed";
type OverallCompliance = "Fully compliant" | "Action required" | "Non-compliant";

interface TrainingStatus {
  courseName: string;
  category: CourseCategory;
  completedDate: string;
  expiryDate: string;
  validityMonths: number;
  status: CourseStatus;
  provider: string;
  certificateOnFile: boolean;
}

interface TrainingMatrixRow {
  id: string;
  staffId: string;
  role: string;
  trainingStatuses: TrainingStatus[];
  overallCompliance: OverallCompliance;
  nextRefresherDue: string;
  totalCourses: number;
  validCount: number;
  expiringCount: number;
  expiredCount: number;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const STATUS_CLR: Record<CourseStatus, string> = {
  "Valid": "bg-green-100 text-green-800",
  "Expiring soon": "bg-amber-100 text-amber-800",
  "Expired": "bg-red-100 text-red-800",
  "Not completed": "bg-slate-100 text-slate-700",
};

const STATUS_DOT: Record<CourseStatus, string> = {
  "Valid": "bg-green-500",
  "Expiring soon": "bg-amber-500",
  "Expired": "bg-red-500",
  "Not completed": "bg-slate-400",
};

const COMPLIANCE_CLR: Record<OverallCompliance, string> = {
  "Fully compliant": "bg-green-100 text-green-800",
  "Action required": "bg-amber-100 text-amber-800",
  "Non-compliant": "bg-red-100 text-red-800",
};

const COMPLIANCE_BORDER: Record<OverallCompliance, string> = {
  "Fully compliant": "border-l-green-400",
  "Action required": "border-l-amber-400",
  "Non-compliant": "border-l-red-500",
};

const CATEGORY_CLR: Record<CourseCategory, string> = {
  "Mandatory": "bg-blue-50 text-blue-700 border-blue-200",
  "Role-specific": "bg-purple-50 text-purple-700 border-purple-200",
  "Best practice": "bg-slate-50 text-slate-700 border-slate-200",
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: TrainingMatrixRow[] = [
  {
    id: "tm_1",
    staffId: "staff_darren",
    role: "Registered Manager",
    trainingStatuses: [
      { courseName: "Safeguarding Children Level 3", category: "Mandatory", completedDate: d(-180), expiryDate: d(545), validityMonths: 24, status: "Valid", provider: "Derby Safeguarding Children Partnership", certificateOnFile: true },
      { courseName: "Positive Behaviour Support", category: "Mandatory", completedDate: d(-200), expiryDate: d(165), validityMonths: 12, status: "Valid", provider: "Team Teach", certificateOnFile: true },
      { courseName: "First Aid (Paediatric)", category: "Mandatory", completedDate: d(-300), expiryDate: d(795), validityMonths: 36, status: "Valid", provider: "St John Ambulance", certificateOnFile: true },
      { courseName: "Lone Working Awareness", category: "Mandatory", completedDate: d(-220), expiryDate: d(145), validityMonths: 12, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Trauma-Informed Practice", category: "Mandatory", completedDate: d(-150), expiryDate: d(575), validityMonths: 24, status: "Valid", provider: "Beacon House", certificateOnFile: true },
      { courseName: "Online Safety", category: "Mandatory", completedDate: d(-340), expiryDate: d(25), validityMonths: 12, status: "Expiring soon", provider: "Educare", certificateOnFile: true },
      { courseName: "Equality & Diversity", category: "Mandatory", completedDate: d(-110), expiryDate: d(615), validityMonths: 24, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Data Protection (GDPR)", category: "Mandatory", completedDate: d(-90), expiryDate: d(275), validityMonths: 12, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Fire Safety", category: "Mandatory", completedDate: d(-80), expiryDate: d(285), validityMonths: 12, status: "Valid", provider: "Derbyshire Fire & Rescue", certificateOnFile: true },
      { courseName: "Medication Administration", category: "Mandatory", completedDate: d(-160), expiryDate: d(205), validityMonths: 12, status: "Valid", provider: "Boots Healthcare", certificateOnFile: true },
      { courseName: "Leadership Level 5 (Diploma)", category: "Role-specific", completedDate: d(-420), expiryDate: d(9999), validityMonths: 0, status: "Valid", provider: "Skills for Care", certificateOnFile: true },
      { courseName: "Safer Recruitment", category: "Role-specific", completedDate: d(-260), expiryDate: d(105), validityMonths: 12, status: "Valid", provider: "NSPCC Learning", certificateOnFile: true },
    ],
    overallCompliance: "Action required",
    nextRefresherDue: d(25),
    totalCourses: 12,
    validCount: 11,
    expiringCount: 1,
    expiredCount: 0,
  },
  {
    id: "tm_2",
    staffId: "staff_ryan",
    role: "Deputy Manager",
    trainingStatuses: [
      { courseName: "Safeguarding Children Level 3", category: "Mandatory", completedDate: d(-90), expiryDate: d(635), validityMonths: 24, status: "Valid", provider: "Derby Safeguarding Children Partnership", certificateOnFile: true },
      { courseName: "Positive Behaviour Support", category: "Mandatory", completedDate: d(-100), expiryDate: d(265), validityMonths: 12, status: "Valid", provider: "Team Teach", certificateOnFile: true },
      { courseName: "First Aid (Paediatric)", category: "Mandatory", completedDate: d(-200), expiryDate: d(895), validityMonths: 36, status: "Valid", provider: "St John Ambulance", certificateOnFile: true },
      { courseName: "Lone Working Awareness", category: "Mandatory", completedDate: d(-130), expiryDate: d(235), validityMonths: 12, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Trauma-Informed Practice", category: "Mandatory", completedDate: d(-95), expiryDate: d(630), validityMonths: 24, status: "Valid", provider: "Beacon House", certificateOnFile: true },
      { courseName: "Online Safety", category: "Mandatory", completedDate: d(-110), expiryDate: d(255), validityMonths: 12, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Equality & Diversity", category: "Mandatory", completedDate: d(-115), expiryDate: d(610), validityMonths: 24, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Data Protection (GDPR)", category: "Mandatory", completedDate: d(-105), expiryDate: d(260), validityMonths: 12, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Fire Safety", category: "Mandatory", completedDate: d(-70), expiryDate: d(295), validityMonths: 12, status: "Valid", provider: "Derbyshire Fire & Rescue", certificateOnFile: true },
      { courseName: "Medication Administration", category: "Mandatory", completedDate: d(-140), expiryDate: d(225), validityMonths: 12, status: "Valid", provider: "Boots Healthcare", certificateOnFile: true },
    ],
    overallCompliance: "Fully compliant",
    nextRefresherDue: d(225),
    totalCourses: 10,
    validCount: 10,
    expiringCount: 0,
    expiredCount: 0,
  },
  {
    id: "tm_3",
    staffId: "staff_edward",
    role: "Residential Care Worker",
    trainingStatuses: [
      { courseName: "Safeguarding Children Level 3", category: "Mandatory", completedDate: d(-380), expiryDate: d(-15), validityMonths: 24, status: "Expired", provider: "Derby Safeguarding Children Partnership", certificateOnFile: true },
      { courseName: "Positive Behaviour Support", category: "Mandatory", completedDate: d(-260), expiryDate: d(105), validityMonths: 12, status: "Valid", provider: "Team Teach", certificateOnFile: true },
      { courseName: "First Aid (Paediatric)", category: "Mandatory", completedDate: d(-410), expiryDate: d(685), validityMonths: 36, status: "Valid", provider: "St John Ambulance", certificateOnFile: true },
      { courseName: "Lone Working Awareness", category: "Mandatory", completedDate: d(-340), expiryDate: d(25), validityMonths: 12, status: "Expiring soon", provider: "Educare", certificateOnFile: true },
      { courseName: "Trauma-Informed Practice", category: "Mandatory", completedDate: d(-200), expiryDate: d(525), validityMonths: 24, status: "Valid", provider: "Beacon House", certificateOnFile: true },
      { courseName: "Online Safety", category: "Mandatory", completedDate: d(-220), expiryDate: d(145), validityMonths: 12, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Equality & Diversity", category: "Mandatory", completedDate: d(-180), expiryDate: d(545), validityMonths: 24, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Data Protection (GDPR)", category: "Mandatory", completedDate: d(-170), expiryDate: d(195), validityMonths: 12, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Fire Safety", category: "Mandatory", completedDate: d(-150), expiryDate: d(215), validityMonths: 12, status: "Valid", provider: "Derbyshire Fire & Rescue", certificateOnFile: true },
    ],
    overallCompliance: "Non-compliant",
    nextRefresherDue: d(-15),
    totalCourses: 9,
    validCount: 7,
    expiringCount: 1,
    expiredCount: 1,
  },
  {
    id: "tm_4",
    staffId: "staff_anna",
    role: "Residential Care Worker",
    trainingStatuses: [
      { courseName: "Safeguarding Children Level 3", category: "Mandatory", completedDate: d(-150), expiryDate: d(575), validityMonths: 24, status: "Valid", provider: "Derby Safeguarding Children Partnership", certificateOnFile: true },
      { courseName: "Positive Behaviour Support", category: "Mandatory", completedDate: d(-160), expiryDate: d(205), validityMonths: 12, status: "Valid", provider: "Team Teach", certificateOnFile: true },
      { courseName: "First Aid (Paediatric)", category: "Mandatory", completedDate: d(-250), expiryDate: d(845), validityMonths: 36, status: "Valid", provider: "St John Ambulance", certificateOnFile: true },
      { courseName: "Lone Working Awareness", category: "Mandatory", completedDate: d(-170), expiryDate: d(195), validityMonths: 12, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Trauma-Informed Practice", category: "Mandatory", completedDate: d(-140), expiryDate: d(585), validityMonths: 24, status: "Valid", provider: "Beacon House", certificateOnFile: true },
      { courseName: "Online Safety", category: "Mandatory", completedDate: d(-160), expiryDate: d(205), validityMonths: 12, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Equality & Diversity", category: "Mandatory", completedDate: d(-145), expiryDate: d(580), validityMonths: 24, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Data Protection (GDPR)", category: "Mandatory", completedDate: d(-155), expiryDate: d(210), validityMonths: 12, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Fire Safety", category: "Mandatory", completedDate: d(-120), expiryDate: d(245), validityMonths: 12, status: "Valid", provider: "Derbyshire Fire & Rescue", certificateOnFile: true },
      { courseName: "Medication Administration", category: "Mandatory", completedDate: d(-180), expiryDate: d(185), validityMonths: 12, status: "Valid", provider: "Boots Healthcare", certificateOnFile: true },
    ],
    overallCompliance: "Fully compliant",
    nextRefresherDue: d(185),
    totalCourses: 10,
    validCount: 10,
    expiringCount: 0,
    expiredCount: 0,
  },
  {
    id: "tm_5",
    staffId: "staff_chervelle",
    role: "Residential Care Worker",
    trainingStatuses: [
      { courseName: "Safeguarding Children Level 3", category: "Mandatory", completedDate: d(-110), expiryDate: d(615), validityMonths: 24, status: "Valid", provider: "Derby Safeguarding Children Partnership", certificateOnFile: true },
      { courseName: "Positive Behaviour Support", category: "Mandatory", completedDate: d(-120), expiryDate: d(245), validityMonths: 12, status: "Valid", provider: "Team Teach", certificateOnFile: true },
      { courseName: "First Aid (Paediatric)", category: "Mandatory", completedDate: d(-100), expiryDate: d(995), validityMonths: 36, status: "Valid", provider: "St John Ambulance", certificateOnFile: true },
      { courseName: "Lone Working Awareness", category: "Mandatory", completedDate: d(-330), expiryDate: d(35), validityMonths: 12, status: "Expiring soon", provider: "Educare", certificateOnFile: true },
      { courseName: "Trauma-Informed Practice", category: "Mandatory", completedDate: d(-105), expiryDate: d(620), validityMonths: 24, status: "Valid", provider: "Beacon House", certificateOnFile: true },
      { courseName: "Online Safety", category: "Mandatory", completedDate: d(-115), expiryDate: d(250), validityMonths: 12, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Equality & Diversity", category: "Mandatory", completedDate: d(-95), expiryDate: d(630), validityMonths: 24, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Data Protection (GDPR)", category: "Mandatory", completedDate: d(-100), expiryDate: d(265), validityMonths: 12, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Fire Safety", category: "Mandatory", completedDate: d(-85), expiryDate: d(280), validityMonths: 12, status: "Valid", provider: "Derbyshire Fire & Rescue", certificateOnFile: true },
      { courseName: "Medication Administration", category: "Mandatory", completedDate: d(-130), expiryDate: d(235), validityMonths: 12, status: "Valid", provider: "Boots Healthcare", certificateOnFile: true },
    ],
    overallCompliance: "Action required",
    nextRefresherDue: d(35),
    totalCourses: 10,
    validCount: 9,
    expiringCount: 1,
    expiredCount: 0,
  },
  {
    id: "tm_6",
    staffId: "staff_lackson",
    role: "Residential Care Worker",
    trainingStatuses: [
      { courseName: "Safeguarding Children Level 3", category: "Mandatory", completedDate: d(-200), expiryDate: d(525), validityMonths: 24, status: "Valid", provider: "Derby Safeguarding Children Partnership", certificateOnFile: true },
      { courseName: "Positive Behaviour Support", category: "Mandatory", completedDate: d(-210), expiryDate: d(155), validityMonths: 12, status: "Valid", provider: "Team Teach", certificateOnFile: true },
      { courseName: "First Aid (Paediatric)", category: "Mandatory", completedDate: d(-220), expiryDate: d(875), validityMonths: 36, status: "Valid", provider: "St John Ambulance", certificateOnFile: true },
      { courseName: "Lone Working Awareness", category: "Mandatory", completedDate: d(-220), expiryDate: d(145), validityMonths: 12, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Trauma-Informed Practice", category: "Mandatory", completedDate: d(-360), expiryDate: d(-5), validityMonths: 12, status: "Expired", provider: "Beacon House", certificateOnFile: true },
      { courseName: "Online Safety", category: "Mandatory", completedDate: d(-200), expiryDate: d(165), validityMonths: 12, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Equality & Diversity", category: "Mandatory", completedDate: d(-180), expiryDate: d(545), validityMonths: 24, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Data Protection (GDPR)", category: "Mandatory", completedDate: d(-190), expiryDate: d(175), validityMonths: 12, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Fire Safety", category: "Mandatory", completedDate: d(-160), expiryDate: d(205), validityMonths: 12, status: "Valid", provider: "Derbyshire Fire & Rescue", certificateOnFile: true },
    ],
    overallCompliance: "Non-compliant",
    nextRefresherDue: d(-5),
    totalCourses: 9,
    validCount: 8,
    expiringCount: 0,
    expiredCount: 1,
  },
  {
    id: "tm_7",
    staffId: "staff_mirela",
    role: "Residential Care Worker",
    trainingStatuses: [
      { courseName: "Safeguarding Children Level 3", category: "Mandatory", completedDate: d(-60), expiryDate: d(665), validityMonths: 24, status: "Valid", provider: "Derby Safeguarding Children Partnership", certificateOnFile: true },
      { courseName: "Positive Behaviour Support", category: "Mandatory", completedDate: d(-55), expiryDate: d(310), validityMonths: 12, status: "Valid", provider: "Team Teach", certificateOnFile: true },
      { courseName: "First Aid (Paediatric)", category: "Mandatory", completedDate: d(-50), expiryDate: d(1045), validityMonths: 36, status: "Valid", provider: "St John Ambulance", certificateOnFile: true },
      { courseName: "Lone Working Awareness", category: "Mandatory", completedDate: d(-40), expiryDate: d(325), validityMonths: 12, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Trauma-Informed Practice", category: "Mandatory", completedDate: d(-65), expiryDate: d(660), validityMonths: 24, status: "Valid", provider: "Beacon House", certificateOnFile: true },
      { courseName: "Online Safety", category: "Mandatory", completedDate: d(-50), expiryDate: d(315), validityMonths: 12, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Equality & Diversity", category: "Mandatory", completedDate: d(-45), expiryDate: d(680), validityMonths: 24, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Data Protection (GDPR)", category: "Mandatory", completedDate: d(-55), expiryDate: d(310), validityMonths: 12, status: "Valid", provider: "Educare", certificateOnFile: true },
      { courseName: "Fire Safety", category: "Mandatory", completedDate: d(-30), expiryDate: d(335), validityMonths: 12, status: "Valid", provider: "Derbyshire Fire & Rescue", certificateOnFile: true },
      { courseName: "Medication Administration", category: "Mandatory", completedDate: d(0), expiryDate: d(0), validityMonths: 12, status: "Not completed", provider: "Boots Healthcare", certificateOnFile: false },
    ],
    overallCompliance: "Action required",
    nextRefresherDue: d(310),
    totalCourses: 10,
    validCount: 9,
    expiringCount: 0,
    expiredCount: 0,
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function MandatoryTrainingMatrixPage() {
  const [data] = useState<TrainingMatrixRow[]>(SEED);
  const [filterCompliance, setFilterCompliance] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "compliance" | "expiry">("compliance");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* summary stats */
  const stats = useMemo(() => {
    const totalStaff = data.length;
    const totalCourses = data.reduce((sum, r) => sum + r.totalCourses, 0);
    const totalValid = data.reduce((sum, r) => sum + r.validCount, 0);
    const totalExpiring = data.reduce((sum, r) => sum + r.expiringCount, 0);
    const totalExpired = data.reduce((sum, r) => sum + r.expiredCount, 0);
    const fullyCompliant = data.filter((r) => r.overallCompliance === "Fully compliant").length;
    const compliancePct = totalCourses > 0 ? Math.round((totalValid / totalCourses) * 100) : 0;
    return { totalStaff, totalCourses, totalValid, totalExpiring, totalExpired, fullyCompliant, compliancePct };
  }, [data]);

  /* alerts: expired or expiring courses */
  const alerts = useMemo(() => {
    const list: { staffId: string; course: string; status: CourseStatus; expiryDate: string }[] = [];
    data.forEach((r) => {
      r.trainingStatuses.forEach((t) => {
        if (t.status === "Expired" || t.status === "Expiring soon" || t.status === "Not completed") {
          list.push({ staffId: r.staffId, course: t.courseName, status: t.status, expiryDate: t.expiryDate });
        }
      });
    });
    return list;
  }, [data]);

  /* filter + sort */
  const filtered = useMemo(() => {
    let rows = data;
    if (filterCompliance !== "all") {
      rows = rows.filter((r) => r.overallCompliance === filterCompliance);
    }
    const sorted = [...rows];
    if (sortBy === "name") {
      sorted.sort((a, b) => getStaffName(a.staffId).localeCompare(getStaffName(b.staffId)));
    } else if (sortBy === "compliance") {
      const order: Record<OverallCompliance, number> = { "Non-compliant": 0, "Action required": 1, "Fully compliant": 2 };
      sorted.sort((a, b) => order[a.overallCompliance] - order[b.overallCompliance]);
    } else if (sortBy === "expiry") {
      sorted.sort((a, b) => a.nextRefresherDue.localeCompare(b.nextRefresherDue));
    }
    return sorted;
  }, [data, filterCompliance, sortBy]);

  /* export columns */
  const exportCols: ExportColumn<TrainingMatrixRow>[] = [
    { header: "Staff", accessor: (r: TrainingMatrixRow) => getStaffName(r.staffId) },
    { header: "Role", accessor: (r: TrainingMatrixRow) => r.role },
    { header: "Total Courses", accessor: (r: TrainingMatrixRow) => String(r.totalCourses) },
    { header: "Valid", accessor: (r: TrainingMatrixRow) => String(r.validCount) },
    { header: "Expiring Soon", accessor: (r: TrainingMatrixRow) => String(r.expiringCount) },
    { header: "Expired", accessor: (r: TrainingMatrixRow) => String(r.expiredCount) },
    { header: "Overall Compliance", accessor: (r: TrainingMatrixRow) => r.overallCompliance },
    { header: "Next Refresher Due", accessor: (r: TrainingMatrixRow) => r.nextRefresherDue },
  ];

  return (
    <PageShell
      title="Mandatory Training Matrix"
      subtitle="Cross-staff training currency · Reg 32 · KCSIE 2024 · Quality Standard 13"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Mandatory Training Matrix" />
          <ExportButton data={data} columns={exportCols} filename="mandatory-training-matrix" />
        </div>
      }
    >
      <div id="print-area">
        {/* ── summary stats ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Team Compliance", value: `${stats.compliancePct}%`, icon: Shield, clr: "text-purple-600" },
            { label: "Expiring (30 days)", value: stats.totalExpiring, icon: Clock, clr: "text-amber-600" },
            { label: "Expired Courses", value: stats.totalExpired, icon: AlertTriangle, clr: "text-red-600" },
            { label: "Fully Compliant Staff", value: `${stats.fullyCompliant}/${stats.totalStaff}`, icon: CheckCircle2, clr: "text-green-600" },
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

        {/* ── alerts ─────────────────────────────────────────────────────── */}
        {alerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm flex-1">
              <p className="font-semibold text-red-800 mb-1">
                {alerts.length} training {alerts.length === 1 ? "issue" : "issues"} requiring attention
              </p>
              <ul className="space-y-1 text-red-700">
                {alerts.map((a, i) => (
                  <li key={i} className="text-xs flex items-start gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full mt-1.5 shrink-0", STATUS_DOT[a.status])} />
                    <span>
                      <span className="font-medium">{getStaffName(a.staffId)}</span> — {a.course}
                      {" · "}
                      <span className="font-medium">{a.status}</span>
                      {a.status !== "Not completed" && <> (expiry {a.expiryDate})</>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── filters / sort ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Select value={filterCompliance} onValueChange={setFilterCompliance}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Compliance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All staff</SelectItem>
              <SelectItem value="Fully compliant">Fully compliant</SelectItem>
              <SelectItem value="Action required">Action required</SelectItem>
              <SelectItem value="Non-compliant">Non-compliant</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as "name" | "compliance" | "expiry")}>
            <SelectTrigger className="w-[200px]">
              <ArrowUpDown className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compliance">Compliance (worst first)</SelectItem>
              <SelectItem value="name">Name (A–Z)</SelectItem>
              <SelectItem value="expiry">Next refresher due</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto text-xs text-muted-foreground">
            Showing {filtered.length} of {data.length} staff
          </div>
        </div>

        {/* ── matrix card list ───────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            const compliancePct = r.totalCourses > 0 ? Math.round((r.validCount / r.totalCourses) * 100) : 0;
            return (
              <Card key={r.id} className={cn("border-l-4", COMPLIANCE_BORDER[r.overallCompliance])}>
                <CardHeader
                  className="pb-2 cursor-pointer"
                  onClick={() => setExpandedId(isOpen ? null : r.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {getStaffName(r.staffId)}
                        <Badge variant="outline" className="bg-muted/50 text-xs">{r.role}</Badge>
                        <Badge variant="outline" className={COMPLIANCE_CLR[r.overallCompliance]}>
                          {r.overallCompliance}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.validCount}/{r.totalCourses} valid · {compliancePct}% compliance · Next refresher {r.nextRefresherDue}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden md:flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" />{r.validCount}</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />{r.expiringCount}</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />{r.expiredCount}</span>
                      </div>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* compliance bar */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="text-xs text-muted-foreground">Total Courses</p>
                        <p className="text-lg font-bold">{r.totalCourses}</p>
                      </div>
                      <div className="bg-green-50 rounded p-2 text-center">
                        <p className="text-xs text-green-700">Valid</p>
                        <p className="text-lg font-bold text-green-700">{r.validCount}</p>
                      </div>
                      <div className="bg-amber-50 rounded p-2 text-center">
                        <p className="text-xs text-amber-700">Expiring soon</p>
                        <p className="text-lg font-bold text-amber-700">{r.expiringCount}</p>
                      </div>
                      <div className="bg-red-50 rounded p-2 text-center">
                        <p className="text-xs text-red-700">Expired</p>
                        <p className="text-lg font-bold text-red-700">{r.expiredCount}</p>
                      </div>
                    </div>

                    {/* course table */}
                    <div>
                      <p className="font-medium mb-2 flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" /> Course Currency
                      </p>
                      <div className="space-y-1.5">
                        {r.trainingStatuses.map((t, i) => (
                          <div
                            key={i}
                            className="grid grid-cols-12 gap-2 items-center bg-muted/30 rounded px-2 py-1.5 text-xs"
                          >
                            <div className="col-span-12 md:col-span-4 flex items-center gap-2">
                              <span className={cn("h-2 w-2 rounded-full shrink-0", STATUS_DOT[t.status])} />
                              <span className="font-medium truncate">{t.courseName}</span>
                            </div>
                            <div className="col-span-4 md:col-span-2">
                              <Badge variant="outline" className={cn("text-[10px]", CATEGORY_CLR[t.category])}>
                                {t.category}
                              </Badge>
                            </div>
                            <div className="col-span-4 md:col-span-2 text-muted-foreground">
                              {t.status === "Not completed" ? "—" : t.completedDate}
                            </div>
                            <div className="col-span-4 md:col-span-2">
                              {t.status === "Not completed" ? (
                                <span className="text-muted-foreground">—</span>
                              ) : t.validityMonths === 0 ? (
                                <span className="text-muted-foreground">No expiry</span>
                              ) : (
                                <span className={cn(
                                  t.status === "Expired" && "text-red-600 font-medium",
                                  t.status === "Expiring soon" && "text-amber-700 font-medium",
                                )}>
                                  {t.expiryDate}
                                </span>
                              )}
                            </div>
                            <div className="col-span-12 md:col-span-2 flex items-center gap-2 justify-end">
                              <Badge variant="outline" className={cn("text-[10px]", STATUS_CLR[t.status])}>
                                {t.status}
                              </Badge>
                              {t.certificateOnFile ? (
                                <FileCheck className="h-3.5 w-3.5 text-green-600" aria-label="Certificate on file" />
                              ) : (
                                <FileCheck className="h-3.5 w-3.5 text-slate-300" aria-label="No certificate" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* providers summary */}
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5" />
                      Providers: {Array.from(new Set(r.trainingStatuses.map((t) => t.provider))).join(", ")}
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <GraduationCap className="h-3.5 w-3.5 mr-1" />
                        Schedule refresher
                      </Button>
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
            Children&apos;s Homes (England) Regulations 2015, Reg 32 (Staffing of the children&apos;s home) requires the registered person
            to ensure that all staff receive appropriate training, supervision and appraisal to deliver care that meets the home&apos;s Statement of Purpose.
            Quality Standard 13 (Leadership and Management) requires staff to have the experience, qualifications and skills to meet children&apos;s needs.
            Keeping Children Safe in Education (KCSIE 2024) requires all staff working with children to receive Safeguarding Level 3 training every two years,
            with annual safeguarding briefings and online safety updates. Training currency must be evidenced through certificates retained in personnel files
            and reviewed at supervision. Out-of-date mandatory training is a regulatory shortfall and may be cited at Ofsted inspection or Reg 44 independent visits.
          </p>
        </div>
      </div>
    </PageShell>
  );
}

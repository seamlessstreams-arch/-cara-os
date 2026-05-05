"use client";

import React, { useState } from "react";
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
  Building2,
  Shield,
  AlertTriangle,
  Users,
  TrendingUp,
  FileText,
  CheckCircle2,
  Clock,
  Eye,
  MessageSquare,
  Download,
  BarChart3,
  Activity,
  XCircle,
  UserCheck,
  GraduationCap,
  Calendar,
  Sparkles,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface HomeData {
  id: string;
  name: string;
  manager: string;
  totalChildren: number;
  capacity: number;
  totalStaff: number;
  inspectionReadiness: number;
  openRisks: number;
  seriousIncidents: number;
  reg44Status: "completed" | "overdue" | "due_soon";
  reg45Status: "completed" | "overdue" | "due_soon";
  supervisionCompliance: number;
  trainingCompliance: number;
  recruitmentCompliance: number;
  overdueActions: number;
  complaints: number;
  missingEpisodes: number;
  ariaRiskFlags: string[];
  lastReviewed: string;
}

interface OversightEntry {
  id: string;
  date: string;
  home: string;
  type: "comment" | "action_request" | "review" | "escalation";
  content: string;
  author: string;
  status: "open" | "closed";
}

// ── Constants ────────────────────────────────────────────────────────────────

const REG_STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-800", icon: <XCircle className="h-3.5 w-3.5 text-red-600" /> },
  due_soon: { label: "Due Soon", color: "bg-amber-100 text-amber-800", icon: <Clock className="h-3.5 w-3.5 text-amber-600" /> },
};

const ENTRY_TYPE_META: Record<string, { label: string; color: string }> = {
  comment: { label: "Comment", color: "bg-blue-100 text-blue-800" },
  action_request: { label: "Action Request", color: "bg-amber-100 text-amber-800" },
  review: { label: "Review", color: "bg-green-100 text-green-800" },
  escalation: { label: "Escalation", color: "bg-red-100 text-red-800" },
};

// ── Demo Data ────────────────────────────────────────────────────────────────

const DEMO_HOMES: HomeData[] = [
  {
    id: "oak-house",
    name: "Oak House",
    manager: "Darren Laville",
    totalChildren: 3,
    capacity: 4,
    totalStaff: 12,
    inspectionReadiness: 88,
    openRisks: 2,
    seriousIncidents: 0,
    reg44Status: "completed",
    reg45Status: "completed",
    supervisionCompliance: 92,
    trainingCompliance: 95,
    recruitmentCompliance: 100,
    overdueActions: 3,
    complaints: 1,
    missingEpisodes: 1,
    ariaRiskFlags: ["Staff supervision gap detected for 1 night worker"],
    lastReviewed: "2026-05-01",
  },
  {
    id: "birch-lodge",
    name: "Birch Lodge",
    manager: "Karen Thompson",
    totalChildren: 4,
    capacity: 4,
    totalStaff: 14,
    inspectionReadiness: 62,
    openRisks: 5,
    seriousIncidents: 2,
    reg44Status: "overdue",
    reg45Status: "due_soon",
    supervisionCompliance: 68,
    trainingCompliance: 71,
    recruitmentCompliance: 85,
    overdueActions: 11,
    complaints: 3,
    missingEpisodes: 4,
    ariaRiskFlags: [
      "Pattern of missing episodes detected - 4 in 30 days",
      "Supervision compliance below 70% threshold",
      "3 staff have expired mandatory training",
      "Reg 44 overdue by 12 days",
    ],
    lastReviewed: "2026-04-18",
  },
  {
    id: "willow-place",
    name: "Willow Place",
    manager: "David Okonkwo",
    totalChildren: 3,
    capacity: 3,
    totalStaff: 10,
    inspectionReadiness: 94,
    openRisks: 1,
    seriousIncidents: 0,
    reg44Status: "completed",
    reg45Status: "completed",
    supervisionCompliance: 100,
    trainingCompliance: 98,
    recruitmentCompliance: 100,
    overdueActions: 1,
    complaints: 0,
    missingEpisodes: 0,
    ariaRiskFlags: [],
    lastReviewed: "2026-05-03",
  },
];

const DEMO_OVERSIGHT_LOG: OversightEntry[] = [
  {
    id: "ol-1",
    date: "2026-05-03",
    home: "Willow Place",
    type: "review",
    content: "Monthly quality review completed. All areas meeting or exceeding standards. Commend David and team for consistent excellence.",
    author: "Regional Inspector",
    status: "closed",
  },
  {
    id: "ol-2",
    date: "2026-05-01",
    home: "Oak House",
    type: "comment",
    content: "Noted improvement in recording quality following last visit. Progress entries are now timely and outcome-focused. One night staff supervision gap to address.",
    author: "Regional Inspector",
    status: "open",
  },
  {
    id: "ol-3",
    date: "2026-04-28",
    home: "Birch Lodge",
    type: "action_request",
    content: "Reg 44 visit now 12 days overdue. Manager to complete within 48 hours and submit report. Supervision compliance plan required by 5 May.",
    author: "Regional Inspector",
    status: "open",
  },
  {
    id: "ol-4",
    date: "2026-04-25",
    home: "Birch Lodge",
    type: "escalation",
    content: "Pattern of missing episodes identified - 4 in 30 days involving 2 different young people. Requesting immediate review of risk assessments and boundary agreements.",
    author: "Regional Inspector",
    status: "open",
  },
  {
    id: "ol-5",
    date: "2026-04-20",
    home: "Oak House",
    type: "review",
    content: "Unannounced visit completed. Children appeared settled and engaged. Staff interactions observed as warm and appropriate. Minor recommendation around medication storage labelling.",
    author: "Regional Inspector",
    status: "closed",
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function ProviderOversightPage() {
  const [selectedHome, setSelectedHome] = useState<string>("all");
  const [oversightComment, setOversightComment] = useState("");

  const filteredHomes =
    selectedHome === "all"
      ? DEMO_HOMES
      : DEMO_HOMES.filter((h) => h.id === selectedHome);

  const totals = {
    children: DEMO_HOMES.reduce((sum, h) => sum + h.totalChildren, 0),
    staff: DEMO_HOMES.reduce((sum, h) => sum + h.totalStaff, 0),
    openRisks: DEMO_HOMES.reduce((sum, h) => sum + h.openRisks, 0),
    seriousIncidents: DEMO_HOMES.reduce((sum, h) => sum + h.seriousIncidents, 0),
    overallReadiness: Math.round(
      DEMO_HOMES.reduce((sum, h) => sum + h.inspectionReadiness, 0) / DEMO_HOMES.length
    ),
  };

  const getReadinessColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-amber-600";
    return "text-red-600";
  };

  const getComplianceColor = (percent: number) => {
    if (percent >= 90) return "bg-green-500";
    if (percent >= 75) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <PageShell
      title="RI / Provider Oversight"
      subtitle="Strategic view across all homes — compliance, risks, and readiness"
    >
      <div className="space-y-6">
        {/* Home Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Select value={selectedHome} onValueChange={setSelectedHome}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select home" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Homes</SelectItem>
              <SelectItem value="oak-house">Oak House</SelectItem>
              <SelectItem value="birch-lodge">Birch Lodge</SelectItem>
              <SelectItem value="willow-place">Willow Place</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Provider-Level Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold">{totals.children}</p>
              <p className="text-xs text-muted-foreground">Total Children</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <UserCheck className="h-5 w-5 text-indigo-600 mx-auto mb-1" />
              <p className="text-2xl font-bold">{totals.staff}</p>
              <p className="text-xs text-muted-foreground">Total Staff</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
              <p className="text-2xl font-bold">{totals.openRisks}</p>
              <p className="text-xs text-muted-foreground">Open Risks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Shield className="h-5 w-5 text-red-600 mx-auto mb-1" />
              <p className="text-2xl font-bold">{totals.seriousIncidents}</p>
              <p className="text-xs text-muted-foreground">Serious Incidents</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className={cn("h-5 w-5 mx-auto mb-1", getReadinessColor(totals.overallReadiness))} />
              <p className={cn("text-2xl font-bold", getReadinessColor(totals.overallReadiness))}>
                {totals.overallReadiness}%
              </p>
              <p className="text-xs text-muted-foreground">Overall Readiness</p>
            </CardContent>
          </Card>
        </div>

        {/* Per-Home Cards */}
        <div className="grid gap-4 lg:grid-cols-1">
          {filteredHomes.map((home) => (
            <Card
              key={home.id}
              className={cn(
                home.inspectionReadiness < 70 && "border-red-200",
                home.inspectionReadiness >= 85 && "border-green-200"
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-slate-600" />
                    {home.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Manager: {home.manager}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {home.totalChildren}/{home.capacity} occupancy
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Inspection Readiness */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Inspection Readiness</span>
                    <span className={cn("text-sm font-bold", getReadinessColor(home.inspectionReadiness))}>
                      {home.inspectionReadiness}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        home.inspectionReadiness >= 85
                          ? "bg-green-500"
                          : home.inspectionReadiness >= 70
                          ? "bg-amber-500"
                          : "bg-red-500"
                      )}
                      style={{ width: `${home.inspectionReadiness}%` }}
                    />
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="border rounded-lg p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Open Risks</p>
                    <p className={cn("text-lg font-bold", home.openRisks > 3 ? "text-red-600" : "text-slate-900")}>
                      {home.openRisks}
                    </p>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Serious Incidents</p>
                    <p className={cn("text-lg font-bold", home.seriousIncidents > 0 ? "text-red-600" : "text-slate-900")}>
                      {home.seriousIncidents}
                    </p>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Overdue Actions</p>
                    <p className={cn("text-lg font-bold", home.overdueActions > 5 ? "text-red-600" : "text-slate-900")}>
                      {home.overdueActions}
                    </p>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Missing Episodes</p>
                    <p className={cn("text-lg font-bold", home.missingEpisodes > 2 ? "text-red-600" : "text-slate-900")}>
                      {home.missingEpisodes}
                    </p>
                  </div>
                </div>

                {/* Regulation Status */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <span className="text-sm">Reg 44 Visit</span>
                    <Badge className={cn("text-xs flex items-center gap-1", REG_STATUS_META[home.reg44Status].color)}>
                      {REG_STATUS_META[home.reg44Status].icon}
                      {REG_STATUS_META[home.reg44Status].label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between border rounded-lg p-3">
                    <span className="text-sm">Reg 45 Report</span>
                    <Badge className={cn("text-xs flex items-center gap-1", REG_STATUS_META[home.reg45Status].color)}>
                      {REG_STATUS_META[home.reg45Status].icon}
                      {REG_STATUS_META[home.reg45Status].label}
                    </Badge>
                  </div>
                </div>

                {/* Compliance Bars */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Supervision Compliance
                      </span>
                      <span className="font-medium">{home.supervisionCompliance}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", getComplianceColor(home.supervisionCompliance))}
                        style={{ width: `${home.supervisionCompliance}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5" />
                        Training Compliance
                      </span>
                      <span className="font-medium">{home.trainingCompliance}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", getComplianceColor(home.trainingCompliance))}
                        style={{ width: `${home.trainingCompliance}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5" />
                        Recruitment Compliance
                      </span>
                      <span className="font-medium">{home.recruitmentCompliance}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", getComplianceColor(home.recruitmentCompliance))}
                        style={{ width: `${home.recruitmentCompliance}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Complaints */}
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">Complaints: <span className="font-medium text-slate-900">{home.complaints}</span></span>
                  <span className="text-muted-foreground">Last reviewed: <span className="font-medium text-slate-900">{new Date(home.lastReviewed).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span></span>
                </div>

                {/* ARIA Risk Flags */}
                {home.ariaRiskFlags.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-semibold text-amber-800">ARIA Risk Flags</span>
                    </div>
                    <ul className="space-y-1">
                      {home.ariaRiskFlags.map((flag, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-amber-900">
                          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* RI Oversight Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              RI Oversight Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Add Oversight Comment</label>
              <textarea
                className="w-full min-h-[80px] p-3 text-sm border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Record oversight observation, action request, or review note..."
                value={oversightComment}
                onChange={(e) => setOversightComment(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-1" />
                Add Oversight Comment
              </Button>
              <Button variant="outline" size="sm">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Request Action
              </Button>
              <Button variant="outline" size="sm">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark Reviewed
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Oversight Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-600" />
              Oversight Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {DEMO_OVERSIGHT_LOG.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    "border rounded-lg p-3 space-y-2",
                    entry.status === "open" && "border-l-4 border-l-blue-400"
                  )}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-xs", ENTRY_TYPE_META[entry.type].color)}>
                        {ENTRY_TYPE_META[entry.type].label}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">{entry.home}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        entry.status === "open" ? "text-blue-600" : "text-gray-500"
                      )}
                    >
                      {entry.status === "open" ? "Open" : "Closed"}
                    </Badge>
                  </div>
                  <p className="text-sm">{entry.content}</p>
                  <p className="text-xs text-muted-foreground">By: {entry.author}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

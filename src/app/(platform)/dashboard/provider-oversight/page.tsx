"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  useProviderSummaries,
  useCreateProviderSummary,
  useAttentionItems,
  useReg44Visits,
  useReg45Reviews,
  useCompetenceRecords,
  useVoiceEntries,
  useEvidenceItems,
} from "@/hooks/use-intelligence-layer";
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
  caraRiskFlags: string[];
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


// ── Component ────────────────────────────────────────────────────────────────

export default function ProviderOversightPage() {
  const [selectedHome, setSelectedHome] = useState<string>("all");
  const [oversightComment, setOversightComment] = useState("");
  const [homes, setHomes] = useState<HomeData[]>([]);
  const [oversightLog, setOversightLog] = useState<OversightEntry[]>([]);

  /* ── API hooks ─────────────────────────────────────────────────────────── */
  const { data: apiData } = useProviderSummaries();
  const createSummary = useCreateProviderSummary();
  const { data: attentionData } = useAttentionItems();
  const { data: reg44Data } = useReg44Visits();
  const { data: reg45Data } = useReg45Reviews();
  const { data: competenceData } = useCompetenceRecords();
  const { data: voiceData } = useVoiceEntries();
  const { data: evidenceData } = useEvidenceItems();

  useEffect(() => {
    const rich = (apiData as unknown as { richSummaries?: unknown[]; oversightLog?: unknown[] } | undefined);
    if (apiData?.persisted && Array.isArray(rich?.richSummaries) && rich!.richSummaries!.length > 0) {
      setHomes(rich!.richSummaries as HomeData[]);
      if (Array.isArray(rich?.oversightLog)) {
        setOversightLog(rich!.oversightLog as OversightEntry[]);
      }
      return;
    }
    if (apiData?.persisted && Array.isArray(apiData.summaries) && apiData.summaries.length > 0) {
      setHomes((apiData.summaries as Record<string, unknown>[]).map((row) => ({
        id: row.id as string,
        name: (row.home_id as string) ?? "",
        manager: (row.created_by as string) ?? "",
        totalChildren: (row.occupancy as number) ?? 0,
        capacity: 0,
        totalStaff: (row.staffing_level as number) ?? 0,
        inspectionReadiness: 0,
        openRisks: (row.incident_count as number) ?? 0,
        seriousIncidents: 0,
        reg44Status: (row.reg44_status as HomeData["reg44Status"]) ?? "due_soon",
        reg45Status: (row.reg45_status as HomeData["reg45Status"]) ?? "due_soon",
        supervisionCompliance: 0,
        trainingCompliance: 0,
        recruitmentCompliance: 0,
        overdueActions: 0,
        complaints: (row.complaint_count as number) ?? 0,
        missingEpisodes: 0,
        caraRiskFlags: [],
        lastReviewed: (row.summary_date as string) ?? "",
      })));
    }
  }, [apiData]);

  const filteredHomes =
    selectedHome === "all"
      ? homes
      : homes.filter((h) => h.id === selectedHome);

  const totals = useMemo(() => {
    const children = homes.reduce((sum, h) => sum + h.totalChildren, 0);
    const staff = homes.reduce((sum, h) => sum + h.totalStaff, 0);
    const openRisks = homes.reduce((sum, h) => sum + h.openRisks, 0);
    const seriousIncidents = homes.reduce((sum, h) => sum + h.seriousIncidents, 0);

    // Compute inspection readiness from live cross-module data
    const reg44Visits = (reg44Data?.visits as Record<string, unknown>[]) ?? [];
    const currentMonth = new Date().toISOString().slice(0, 7);
    const hasReg44 = reg44Visits.some((v) => ((v.visit_date as string) ?? "").startsWith(currentMonth));

    const reg45Reviews = (reg45Data?.reviews as Record<string, unknown>[]) ?? [];
    const draftReg45 = reg45Reviews.filter((r) => r.status === "draft" || r.status === "in_progress").length;

    const competence = (competenceData?.records as Record<string, unknown>[]) ?? [];
    const mandatoryIncomplete = competence.filter((r) => !r.mandatory_training_complete).length;

    const voiceEntries = (voiceData?.entries as Record<string, unknown>[]) ?? [];
    const voiceLast30 = voiceEntries.filter((e) => {
      const d = (e.entry_date as string) ?? (e.created_at as string) ?? "";
      return d >= new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    }).length;

    const evidence = (evidenceData?.items as Record<string, unknown>[]) ?? [];
    const evidenceCount = evidence.length;

    const attentionItems = (attentionData?.items as Record<string, unknown>[]) ?? [];
    const criticalOpen = attentionItems.filter(
      (i) => i.urgency === "critical" && i.status !== "closed" && i.status !== "reviewed"
    ).length;

    const factors = [
      hasReg44 ? 15 : 0,
      draftReg45 === 0 ? 15 : 7,
      mandatoryIncomplete === 0 ? 20 : Math.max(0, 20 - mandatoryIncomplete * 4),
      voiceLast30 >= 3 ? 15 : Math.round((voiceLast30 / 3) * 15),
      evidenceCount >= 10 ? 15 : Math.round((evidenceCount / 10) * 15),
      criticalOpen === 0 ? 20 : Math.max(0, 20 - criticalOpen * 5),
    ];
    const overallReadiness = factors.reduce((a, b) => a + b, 0);

    return { children, staff, openRisks, seriousIncidents, overallReadiness };
  }, [homes, reg44Data, reg45Data, competenceData, voiceData, evidenceData, attentionData]);

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
      caraContext={{ pageTitle: "Strategic view across all homes — compliance, risks, and readiness", sourceType: "child_record" }}
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
              <SelectItem value="oak-house">Chamberlain House</SelectItem>
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
                    <Building2 className="h-5 w-5 text-[var(--cs-text-secondary)]" />
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
                    <p className={cn("text-lg font-bold", home.openRisks > 3 ? "text-red-600" : "text-[var(--cs-navy)]")}>
                      {home.openRisks}
                    </p>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Serious Incidents</p>
                    <p className={cn("text-lg font-bold", home.seriousIncidents > 0 ? "text-red-600" : "text-[var(--cs-navy)]")}>
                      {home.seriousIncidents}
                    </p>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Overdue Actions</p>
                    <p className={cn("text-lg font-bold", home.overdueActions > 5 ? "text-red-600" : "text-[var(--cs-navy)]")}>
                      {home.overdueActions}
                    </p>
                  </div>
                  <div className="border rounded-lg p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Missing Episodes</p>
                    <p className={cn("text-lg font-bold", home.missingEpisodes > 2 ? "text-red-600" : "text-[var(--cs-navy)]")}>
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
                  <span className="text-muted-foreground">Complaints: <span className="font-medium text-[var(--cs-navy)]">{home.complaints}</span></span>
                  <span className="text-muted-foreground">Last reviewed: <span className="font-medium text-[var(--cs-navy)]">{new Date(home.lastReviewed).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span></span>
                </div>

                {/* Cara Risk Flags */}
                {home.caraRiskFlags.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-semibold text-amber-800">Cara Risk Flags</span>
                    </div>
                    <ul className="space-y-1">
                      {home.caraRiskFlags.map((flag, idx) => (
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
              <Button
                variant="outline"
                size="sm"
                disabled={!oversightComment.trim() || createSummary.isPending}
                onClick={() => {
                  createSummary.mutate({
                    homeId: selectedHome === "all" ? "oak-house" : selectedHome,
                    notes: oversightComment,
                  }, {
                    onSuccess: () => setOversightComment(""),
                  });
                }}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                {createSummary.isPending ? "Saving..." : "Add Oversight Comment"}
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
              <FileText className="h-5 w-5 text-[var(--cs-text-secondary)]" />
              Oversight Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {oversightLog.map((entry) => (
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

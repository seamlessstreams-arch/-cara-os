"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — GENERATE NEW REPORT
//
// Form for requesting a new Cara-generated report. The user selects a child,
// report type, audience, and date range, then submits to the generation API.
// On success, redirects to the newly created report for review.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  REPORT_TYPES,
  REPORT_TYPE_LABELS,
  REPORT_AUDIENCES,
  REPORT_AUDIENCE_LABELS,
} from "@/types/cara-reports";
import type { ReportType, ReportAudience } from "@/types/cara-reports";
import {
  Sparkles,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";

// ── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_ORG_ID = "demo-org";
const DEFAULT_HOME_ID = "demo-home";
const DEFAULT_USER_ID = "demo-user";

// ── Demo children ───────────────────────────────────────────────────────────

const DEMO_CHILDREN = [
  { id: "demo-child-1", name: "Jayden Mitchell" },
  { id: "demo-child-2", name: "Amara Osei" },
  { id: "demo-child-3", name: "Reuben Walsh" },
];

// ── Component ───────────────────────────────────────────────────────────────

export default function CaraReportNewPage() {
  const router = useRouter();

  const [childId, setChildId] = useState("");
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [audience, setAudience] = useState<ReportAudience | "">("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid =
    childId !== "" &&
    reportType !== "" &&
    audience !== "" &&
    dateStart !== "" &&
    dateEnd !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/cara/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisationId: DEFAULT_ORG_ID,
          homeId: DEFAULT_HOME_ID,
          childId,
          reportType,
          audience,
          dateRangeStart: dateStart,
          dateRangeEnd: dateEnd,
          requestedBy: DEFAULT_USER_ID,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        setError(json.error ?? "Report generation failed.");
        return;
      }

      const reportId = json.data?.report?.id;
      if (reportId) {
        router.push(`/cara/reports/${reportId}`);
      } else {
        setError("Report was generated but no ID was returned.");
      }
    } catch (err) {
      console.error("[cara/reports/new] Generation error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <PageShell
      title="Generate Report"
      subtitle="Create a new Cara intelligence report"
    >
      {/* Back link */}
      <Link
        href="/cara/reports"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)] hover:text-blue-600 mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Reports
      </Link>

      <div className="max-w-2xl mx-auto">
        <Card className="border-[var(--cs-cara-gold-soft)]">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-[var(--cs-cara-gold)]" />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] p-3 mb-6">
              <p className="text-[10px] text-[var(--cs-cara-gold)] font-medium">
                Cara will retrieve relevant evidence, generate a structured
                report, and run challenge mode automatically. The report will be
                created in draft status for your review.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Child selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--cs-text-secondary)]">
                  Child
                </Label>
                <Select
                  value={childId}
                  onValueChange={(v) => setChildId(v)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select a child..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DEMO_CHILDREN.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Report type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--cs-text-secondary)]">
                  Report Type
                </Label>
                <Select
                  value={reportType}
                  onValueChange={(v) => setReportType(v as ReportType)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select report type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {REPORT_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Audience */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--cs-text-secondary)]">
                  Audience
                </Label>
                <Select
                  value={audience}
                  onValueChange={(v) => setAudience(v as ReportAudience)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select audience..." />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_AUDIENCES.map((a) => (
                      <SelectItem key={a} value={a}>
                        {REPORT_AUDIENCE_LABELS[a]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--cs-text-secondary)]">
                    Date Range Start
                  </Label>
                  <Input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[var(--cs-text-secondary)]">
                    Date Range End
                  </Label>
                  <Input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit */}
              {generating ? (
                <div className="rounded-xl border border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] p-6 text-center">
                  <Loader2 className="h-6 w-6 text-[var(--cs-cara-gold)] mx-auto mb-3 animate-spin" />
                  <p className="text-sm font-medium text-[var(--cs-navy)]">
                    Cara is generating your report...
                  </p>
                  <p className="text-xs text-[var(--cs-text-muted)] mt-1">
                    Retrieving evidence, building sections, and running
                    challenge mode. This may take a moment.
                  </p>
                </div>
              ) : (
                <Button
                  type="submit"
                  disabled={!isValid}
                  className="w-full gap-2"
                  variant="cara"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Report
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

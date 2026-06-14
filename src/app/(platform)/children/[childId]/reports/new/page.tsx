"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — GENERATE NEW REPORT (CHILD-SCOPED)
//
// Report generation form pre-scoped to a specific child. The child is locked
// and cannot be changed. Otherwise behaves identically to /cara/reports/new.
// ══════════════════════════════════════════════════════════════════════════════

import React, { use, useState } from "react";
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

// ── Child name lookup ───────────────────────────────────────────────────────

const CHILD_NAMES: Record<string, string> = {
  "child_1": "Jayden Mitchell",
  "child_2": "Amara Osei",
  "child_3": "Reuben Walsh",
  "demo-child-1": "Jayden Mitchell",
  "demo-child-2": "Amara Osei",
  "demo-child-3": "Reuben Walsh",
};

// ── Component ───────────────────────────────────────────────────────────────

export default function ChildNewReportPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = use(params);
  const childName = CHILD_NAMES[childId] ?? childId;
  const router = useRouter();

  const [reportType, setReportType] = useState<ReportType | "">("");
  const [audience, setAudience] = useState<ReportAudience | "">("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!reportType || !audience || !dateStart || !dateEnd) {
      setError("Please complete all fields.");
      return;
    }
    setLoading(true);
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

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Failed to generate report.");
        setLoading(false);
        return;
      }

      router.push(`/cara/reports/${data.report.id}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <PageShell title={`New Report — ${childName}`}>
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href={`/children/${childId}/reports`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: "var(--cs-cara-gold-bg)" }}
          >
            <Sparkles className="h-5 w-5" style={{ color: "var(--cs-cara-gold)" }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--cs-navy)" }}>
              Generate Report for {childName}
            </h1>
            <p className="text-sm" style={{ color: "var(--cs-text-muted)" }}>
              Cara will gather evidence and draft a report for review
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Report Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Child (locked) */}
            <div>
              <Label>Child</Label>
              <Input value={childName} disabled className="mt-1 bg-gray-50" />
            </div>

            {/* Report Type */}
            <div>
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select report type..." />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {REPORT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Audience */}
            <div>
              <Label>Audience</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as ReportAudience)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select audience..." />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_AUDIENCES.map((aud) => (
                    <SelectItem key={aud} value={aud}>
                      {REPORT_AUDIENCE_LABELS[aud]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full gap-2"
              style={{ backgroundColor: "var(--cs-cara-gold)" }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

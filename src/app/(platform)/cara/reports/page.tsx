"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — REPORTS LIST
//
// Browseable, filterable list of all generated child reports. Supports
// filtering by report type, status, and free-text search across titles and
// child names. Each card links to the full report review page.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ChildReport, ReportType, ReportStatus } from "@/types/cara-reports";
import {
  REPORT_TYPES,
  REPORT_TYPE_LABELS,
  REPORT_STATUSES,
  REPORT_STATUS_LABELS,
  REPORT_AUDIENCE_LABELS,
} from "@/types/cara-reports";
import {
  Sparkles,
  FileText,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Loader2,
  Calendar,
} from "lucide-react";

// ── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_HOME_ID = "demo-home";

// ── Child name lookup (demo) ────────────────────────────────────────────────

const CHILD_NAMES: Record<string, string> = {
  "demo-child-1": "Jayden Mitchell",
  "demo-child-2": "Amara Osei",
  "demo-child-3": "Reuben Walsh",
  "demo-child": "Jayden Mitchell",
};

// ── Status badge variant mapping ────────────────────────────────────────────

function statusBadgeVariant(status: string) {
  switch (status) {
    case "draft":
      return "warning" as const;
    case "pending_review":
      return "info" as const;
    case "approved":
      return "success" as const;
    case "rejected":
      return "destructive" as const;
    case "locked":
      return "purple" as const;
    case "archived":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

// ── Component ───────────────────────────────────────────────────────────────

export default function CaraReportsListPage() {
  const [reports, setReports] = useState<ChildReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<ReportType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch(
          `/api/cara/reports/list?homeId=${DEFAULT_HOME_ID}`,
        );
        const json = await res.json();
        if (json.ok) setReports(json.data);
      } catch (err) {
        console.error("[cara/reports] Failed to fetch reports:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  const filtered = useMemo(() => {
    let items = reports;

    if (typeFilter !== "all") {
      items = items.filter((r) => r.report_type === typeFilter);
    }
    if (statusFilter !== "all") {
      items = items.filter((r) => r.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (CHILD_NAMES[r.child_id] ?? "").toLowerCase().includes(q),
      );
    }

    return items;
  }, [reports, typeFilter, statusFilter, searchQuery]);

  return (
    <PageShell
      title="Cara Reports"
      subtitle="Browse and manage generated intelligence reports"
      actions={
        <Link href="/cara/reports/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Generate Report
          </Button>
        </Link>
      }
    >
      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-1.5 text-xs text-[var(--cs-text-muted)]">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </div>

        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as ReportType | "all")}
        >
          <SelectTrigger className="w-[200px] h-8 text-xs">
            <SelectValue placeholder="Report type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All report types</SelectItem>
            {REPORT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {REPORT_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ReportStatus | "all")}
        >
          <SelectTrigger className="w-[170px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {REPORT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {REPORT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cs-text-muted)]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports..."
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* ── Report list ──────────────────────────────────────────────────── */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-6 w-6 text-[var(--cs-text-gentle)] mx-auto mb-3 animate-spin" />
            <p className="text-sm text-[var(--cs-text-muted)]">
              Loading reports...
            </p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-8 w-8 text-[var(--cs-text-gentle)] mx-auto mb-3" />
            <p className="text-sm text-[var(--cs-text-muted)] font-medium">
              {reports.length === 0
                ? "No reports have been generated yet."
                : "No reports match your filters."}
            </p>
            {reports.length === 0 && (
              <Link href="/cara/reports/new" className="inline-block mt-3">
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Generate your first report
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <Link
              key={report.id}
              href={`/cara/reports/${report.id}`}
              className="block rounded-xl border border-[var(--cs-border)] bg-white hover:shadow-md transition-all group"
            >
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <Badge variant="cara" className="text-[10px]">
                        {REPORT_TYPE_LABELS[report.report_type]}
                      </Badge>
                      <Badge
                        variant={statusBadgeVariant(report.status)}
                        className="text-[10px]"
                      >
                        {REPORT_STATUS_LABELS[report.status]}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--cs-navy)] group-hover:text-blue-700 transition-colors line-clamp-1">
                      {report.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--cs-text-muted)]">
                      <span className="font-medium">
                        {CHILD_NAMES[report.child_id] ?? report.child_id}
                      </span>
                      <span className="text-[var(--cs-text-gentle)]">&middot;</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {report.date_range_start} — {report.date_range_end}
                      </span>
                      <span className="text-[var(--cs-text-gentle)]">&middot;</span>
                      <span>
                        {REPORT_AUDIENCE_LABELS[report.audience]}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--cs-text-muted)] mt-1">
                      Created {new Date(report.created_at).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--cs-text-gentle)] shrink-0 mt-2 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}

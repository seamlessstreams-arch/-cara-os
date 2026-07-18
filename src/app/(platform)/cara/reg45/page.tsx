"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara — REGULATION 45 EVIDENCE BANK
//
// Displays and filters Reg 45 evidence items. Evidence is gathered from
// across Cara and categorised for inclusion in monthly reports.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Regulation45EvidenceItem } from "@/types/cara-reports";
import {
  Scale,
  Search,
  ShieldAlert,
  Quote,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  BarChart3,
  Filter,
} from "lucide-react";
import { demoSeed } from "@/lib/demo/demo-seed";

// ── Demo Data ───────────────────────────────────────────────────────────────

const DEMO_EVIDENCE: Regulation45EvidenceItem[] = [
  {
    id: "reg45-1", organisation_id: "demo-org", home_id: "demo-home", child_id: "child-1",
    month: "May", year: 2026, category: "Quality of Care",
    title: "Jayden's keywork session focused on emotional regulation using PACE framework",
    description: "30-minute keywork session with detailed reflective notes demonstrating therapeutic parenting approach.",
    source_table: "daily_log_entries", source_record_id: "dl-101", source_date: "2026-05-06",
    quality_score: 85, is_child_voice: true, is_safeguarding: false, is_risk_related: false,
    agent_run_id: null, reviewed_by: "Sarah Thompson", reviewed_at: "2026-05-07T10:00:00Z",
    status: "accepted", created_at: "2026-05-06T18:00:00Z",
  },
  {
    id: "reg45-2", organisation_id: "demo-org", home_id: "demo-home", child_id: "child-2",
    month: "May", year: 2026, category: "Safeguarding",
    title: "Amara's missing episode — return interview conducted within 72 hours",
    description: "Independent return interview completed. Amara shared that she left to see a friend. No safeguarding concerns identified.",
    source_table: "missing_episodes", source_record_id: "me-201", source_date: "2026-05-03",
    quality_score: 92, is_child_voice: true, is_safeguarding: true, is_risk_related: true,
    agent_run_id: null, reviewed_by: "Sarah Thompson", reviewed_at: "2026-05-04T09:00:00Z",
    status: "accepted", created_at: "2026-05-03T22:00:00Z",
  },
  {
    id: "reg45-3", organisation_id: "demo-org", home_id: "demo-home", child_id: null,
    month: "May", year: 2026, category: "Leadership & Management",
    title: "Monthly team meeting — practice standards review and staff feedback",
    description: "All staff attended. Discussed recording quality improvements and introduced new reflective practice templates.",
    source_table: "generic_records", source_record_id: "gr-301", source_date: "2026-05-01",
    quality_score: 78, is_child_voice: false, is_safeguarding: false, is_risk_related: false,
    agent_run_id: null, reviewed_by: null, reviewed_at: null,
    status: "suggested", created_at: "2026-05-01T15:00:00Z",
  },
  {
    id: "reg45-4", organisation_id: "demo-org", home_id: "demo-home", child_id: "child-1",
    month: "May", year: 2026, category: "Children's Outcomes",
    title: "Jayden achieved 95% school attendance this month",
    description: "Significant improvement from 72% last month. Key worker and school liaison worked collaboratively.",
    source_table: "generic_records", source_record_id: "gr-401", source_date: "2026-05-10",
    quality_score: 90, is_child_voice: false, is_safeguarding: false, is_risk_related: false,
    agent_run_id: null, reviewed_by: "Sarah Thompson", reviewed_at: "2026-05-10T16:00:00Z",
    status: "included_in_report", created_at: "2026-05-10T14:00:00Z",
  },
  {
    id: "reg45-5", organisation_id: "demo-org", home_id: "demo-home", child_id: null,
    month: "May", year: 2026, category: "Workforce Development",
    title: "Two staff completed Level 3 Safeguarding refresher training",
    description: "Online accredited course completed by Marcus Johnson and Priya Patel.",
    source_table: "generic_records", source_record_id: "gr-501", source_date: "2026-05-08",
    quality_score: 70, is_child_voice: false, is_safeguarding: false, is_risk_related: false,
    agent_run_id: null, reviewed_by: null, reviewed_at: null,
    status: "suggested", created_at: "2026-05-08T12:00:00Z",
  },
  {
    id: "reg45-6", organisation_id: "demo-org", home_id: "demo-home", child_id: "child-3",
    month: "May", year: 2026, category: "Quality of Care",
    title: "Reuben expressed feeling settled and safe during weekly check-in",
    description: "Direct quote recorded: 'I like it here now. The staff are alright.' Staff responded with warmth and validation.",
    source_table: "daily_log_entries", source_record_id: "dl-601", source_date: "2026-05-09",
    quality_score: 88, is_child_voice: true, is_safeguarding: false, is_risk_related: false,
    agent_run_id: null, reviewed_by: "Sarah Thompson", reviewed_at: "2026-05-09T17:00:00Z",
    status: "accepted", created_at: "2026-05-09T16:00:00Z",
  },
  {
    id: "reg45-7", organisation_id: "demo-org", home_id: "demo-home", child_id: "child-2",
    month: "May", year: 2026, category: "Safeguarding",
    title: "Low-level concern regarding online contact — strategy discussion held",
    description: "Multi-agency strategy discussion held with social worker. Agreed monitoring plan in place.",
    source_table: "incidents", source_record_id: "inc-701", source_date: "2026-05-07",
    quality_score: 82, is_child_voice: false, is_safeguarding: true, is_risk_related: true,
    agent_run_id: null, reviewed_by: "Sarah Thompson", reviewed_at: "2026-05-08T10:00:00Z",
    status: "accepted", created_at: "2026-05-07T20:00:00Z",
  },
  {
    id: "reg45-8", organisation_id: "demo-org", home_id: "demo-home", child_id: null,
    month: "May", year: 2026, category: "Leadership & Management",
    title: "Reg 44 independent visitor report received — all areas satisfactory",
    description: "Monthly independent visit completed. Two minor recommendations noted and actioned same week.",
    source_table: "documents", source_record_id: "doc-801", source_date: "2026-05-05",
    quality_score: 75, is_child_voice: false, is_safeguarding: false, is_risk_related: false,
    agent_run_id: null, reviewed_by: null, reviewed_at: null,
    status: "suggested", created_at: "2026-05-05T14:00:00Z",
  },
];

// ── Categories ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  "All Categories",
  "Quality of Care",
  "Safeguarding",
  "Leadership & Management",
  "Children's Outcomes",
  "Workforce Development",
];

const STATUSES = ["All", "suggested", "accepted", "rejected", "included_in_report"];

// ── Status badge mapping ────────────────────────────────────────────────────

function statusVariant(status: string) {
  switch (status) {
    case "suggested": return "warning" as const;
    case "accepted": return "success" as const;
    case "rejected": return "destructive" as const;
    case "included_in_report": return "cara" as const;
    default: return "secondary" as const;
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "suggested": return "Suggested";
    case "accepted": return "Accepted";
    case "rejected": return "Rejected";
    case "included_in_report": return "In Report";
    default: return status;
  }
}

// ── Component ───────────────────────────────────────────────────────────────

export default function CaraReg45Page() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState("All");

  const filtered = useMemo(() => {
    return demoSeed(DEMO_EVIDENCE).filter((item) => {
      if (category !== "All Categories" && item.category !== category) return false;
      if (status !== "All" && item.status !== status) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          (item.description ?? "").toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, category, status]);

  const stats = useMemo(() => {
    const total = demoSeed(DEMO_EVIDENCE).length;
    const accepted = demoSeed(DEMO_EVIDENCE).filter((e) => e.status === "accepted" || e.status === "included_in_report").length;
    const avgQuality = Math.round(
      demoSeed(DEMO_EVIDENCE).reduce((sum, e) => sum + (e.quality_score ?? 0), 0) / total,
    );
    const categories = new Set(demoSeed(DEMO_EVIDENCE).map((e) => e.category));
    return { total, accepted, avgQuality, categoryCount: categories.size };
  }, []);

  return (
    <PageShell title="Regulation 45 Evidence Bank">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: "var(--cs-cara-gold-bg)" }}
        >
          <Scale className="h-5 w-5" style={{ color: "var(--cs-cara-gold)" }} />
        </div>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--cs-navy)" }}>
            Regulation 45 Evidence Bank
          </h1>
          <p className="text-sm" style={{ color: "var(--cs-text-muted)" }}>
            Evidence gathered across Cara for monthly Reg 45 reporting
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={FileText} label="Total Items" value={stats.total} />
        <StatCard icon={CheckCircle2} label="Accepted" value={stats.accepted} color="green" />
        <StatCard icon={BarChart3} label="Avg Quality" value={`${stats.avgQuality}%`} />
        <StatCard icon={Filter} label="Categories" value={stats.categoryCount} />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-3 pt-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--cs-text-muted)" }} />
            <Input
              placeholder="Search evidence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "var(--cs-border)" }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "var(--cs-border)" }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === "All" ? "All Statuses" : statusLabel(s)}</option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Evidence Items */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center" style={{ color: "var(--cs-text-muted)" }}>
              No evidence items match your filters.
            </CardContent>
          </Card>
        )}
        {filtered.map((item) => (
          <Card key={item.id} className="transition-shadow hover:bg-[var(--cs-surface)]">
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">{item.category}</Badge>
                    <Badge variant={statusVariant(item.status)} className="text-xs">
                      {statusLabel(item.status)}
                    </Badge>
                    {item.is_child_voice && (
                      <Badge variant="info" className="text-xs">
                        <Quote className="mr-1 h-3 w-3" /> Child Voice
                      </Badge>
                    )}
                    {item.is_safeguarding && (
                      <Badge variant="destructive" className="text-xs">
                        <ShieldAlert className="mr-1 h-3 w-3" /> Safeguarding
                      </Badge>
                    )}
                    {item.is_risk_related && !item.is_safeguarding && (
                      <Badge variant="warning" className="text-xs">
                        <AlertTriangle className="mr-1 h-3 w-3" /> Risk
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-medium text-sm" style={{ color: "var(--cs-navy)" }}>
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-1 text-sm line-clamp-2" style={{ color: "var(--cs-text-secondary)" }}>
                      {item.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-xs" style={{ color: "var(--cs-text-muted)" }}>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {item.source_date}
                    </span>
                    {item.reviewed_by && (
                      <span>Reviewed by {item.reviewed_by}</span>
                    )}
                  </div>
                </div>
                {/* Quality Score */}
                {item.quality_score != null && (
                  <div className="flex flex-col items-center gap-1 min-w-[60px]">
                    <span className="text-xs font-medium" style={{ color: "var(--cs-text-muted)" }}>Quality</span>
                    <div className="relative h-2 w-14 rounded-full bg-gray-200">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full"
                        style={{
                          width: `${item.quality_score}%`,
                          backgroundColor: item.quality_score >= 80 ? "#22c55e" : item.quality_score >= 60 ? "var(--cs-cara-gold)" : "#ef4444",
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold">{item.quality_score}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: "var(--cs-cara-gold-bg)" }}
        >
          <Icon className="h-4 w-4" style={{ color: color ?? "var(--cs-cara-gold)" }} />
        </div>
        <div>
          <p className="text-xs" style={{ color: "var(--cs-text-muted)" }}>{label}</p>
          <p className="text-lg font-semibold" style={{ color: "var(--cs-navy)" }}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

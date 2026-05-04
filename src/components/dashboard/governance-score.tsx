"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — GOVERNANCE SCORE WIDGET
// Dashboard card showing the live RI governance score at a glance.
// Displays overall score, risk level, category breakdown, and RAG status.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import {
  BarChart3, Shield, Users, Heart, FileCheck,
  Loader2, ChevronRight, Zap,
} from "lucide-react";

type ScorecardMeta = {
  overall: number;
  risk_level: string;
  categories: {
    safeguarding: number;
    workforce: number;
    care_quality: number;
    governance: number;
  };
  rag: { green: number; amber: number; red: number };
};

function useGovernanceScore() {
  return useQuery({
    queryKey: ["ri", "scorecard"],
    queryFn: () => api.get<{ meta: ScorecardMeta }>("/ri/scorecard"),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

const CATEGORY_CONFIG = [
  { key: "safeguarding" as const,  label: "Safeguarding", icon: Shield,    colour: "text-red-600" },
  { key: "workforce" as const,     label: "Workforce",    icon: Users,     colour: "text-blue-600" },
  { key: "care_quality" as const,  label: "Care Quality", icon: Heart,     colour: "text-violet-600" },
  { key: "governance" as const,    label: "Governance",   icon: FileCheck, colour: "text-emerald-600" },
];

const RISK_COLOUR: Record<string, string> = {
  low:      "text-emerald-700 bg-emerald-100",
  medium:   "text-amber-700 bg-amber-100",
  high:     "text-orange-700 bg-orange-100",
  critical: "text-red-700 bg-red-100",
};

export function GovernanceScore() {
  const { data, isLoading } = useGovernanceScore();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <BarChart3 className="h-4 w-4 text-indigo-500" />
            Governance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const meta = data?.meta;
  if (!meta) return null;

  const overall = meta.overall;
  const overallColour = overall >= 80 ? "text-emerald-600" : overall >= 65 ? "text-amber-600" : "text-red-600";
  const barColour     = overall >= 80 ? "bg-emerald-400" : overall >= 65 ? "bg-amber-400" : "bg-red-400";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <BarChart3 className="h-4 w-4 text-indigo-500" />
            Governance Score
          </CardTitle>
          <Link href="/ri/scorecard">
            <Badge className="text-[9px] bg-indigo-100 text-indigo-700 border-0 rounded-full hover:bg-indigo-200 cursor-pointer">
              Full scorecard
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* Overall score */}
        <div className="flex items-center gap-3">
          <div className={cn("text-3xl font-bold tabular-nums", overallColour)}>
            {overall}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase", RISK_COLOUR[meta.risk_level])}>
                {meta.risk_level} risk
              </span>
              <div className="flex items-center gap-0.5">
                <Zap className="h-2.5 w-2.5 text-emerald-500" />
                <span className="text-[9px] text-slate-400">Live</span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", barColour)} style={{ width: `${overall}%` }} />
            </div>
          </div>
        </div>

        {/* RAG summary */}
        <div className="flex items-center gap-2 justify-center">
          {[
            { label: "Green", count: meta.rag.green, dot: "bg-emerald-400", text: "text-emerald-700" },
            { label: "Amber", count: meta.rag.amber, dot: "bg-amber-400",   text: "text-amber-700" },
            { label: "Red",   count: meta.rag.red,   dot: "bg-red-400",     text: "text-red-700" },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-1 text-[10px]">
              <div className={cn("w-2 h-2 rounded-full", r.dot)} />
              <span className={cn("font-semibold", r.text)}>{r.count}</span>
            </div>
          ))}
        </div>

        {/* Category bars */}
        {CATEGORY_CONFIG.map(({ key, label, icon: Icon, colour }) => {
          const score = meta.categories[key];
          const catBar = score >= 80 ? "bg-emerald-400" : score >= 65 ? "bg-amber-300" : "bg-red-400";
          const catText = score >= 80 ? "text-emerald-600" : score >= 65 ? "text-amber-600" : "text-red-600";
          return (
            <Link key={key} href="/ri/scorecard">
              <div className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-slate-50 transition-colors">
                <Icon className={cn("h-3 w-3 shrink-0", colour)} />
                <span className="text-[10px] text-slate-500 w-16 truncate">{label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className={cn("h-full rounded-full", catBar)} style={{ width: `${score}%` }} />
                </div>
                <span className={cn("text-[10px] font-bold tabular-nums w-6 text-right", catText)}>
                  {score}
                </span>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

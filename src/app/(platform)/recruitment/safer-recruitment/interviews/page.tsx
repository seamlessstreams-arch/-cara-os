"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare, CheckCircle2, Clock, AlertCircle, Loader2, Info,
  Video, Phone, MapPin, Users, Star, Shield, Heart, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  useRecruitment,
  type Interview,
  type CandidateDetail,
} from "@/hooks/use-recruitment";
import { SmartUploadButton } from "@/components/documents/smart-upload-button";
import { PrintButton } from "@/components/common/print-button";

// ── Helpers ───────────────────────────────────────────────────────────────────

type InterviewTab = "upcoming" | "completed" | "all";

function modeIcon(mode: Interview["mode"]) {
  switch (mode) {
    case "video": return <Video className="h-3.5 w-3.5" />;
    case "phone": return <Phone className="h-3.5 w-3.5" />;
    default: return <MapPin className="h-3.5 w-3.5" />;
  }
}

function modeLabel(mode: Interview["mode"]): string {
  switch (mode) {
    case "video": return "Video";
    case "phone": return "Phone";
    default: return "In Person";
  }
}

function recommendationColor(rec: Interview["recommendation"]): string {
  switch (rec) {
    case "proceed": return "bg-emerald-100 text-emerald-700";
    case "decline": return "bg-red-100 text-red-700";
    case "hold": return "bg-amber-100 text-amber-700";
    default: return "bg-slate-100 text-slate-500";
  }
}

function recommendationLabel(rec: Interview["recommendation"]): string {
  switch (rec) {
    case "proceed": return "Recommend";
    case "decline": return "Do Not Recommend";
    case "hold": return "Borderline / Hold";
    default: return "Pending";
  }
}

function formatDateTime(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB") + " at " + dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function isUpcoming(interview: Interview): boolean {
  return new Date(interview.scheduled_at) > new Date() && interview.status === "scheduled";
}

// ── Interview Card ────────────────────────────────────────────────────────────

interface InterviewCardProps {
  interview: Interview;
  candidateName: string;
  roleApplied: string;
}

function InterviewCard({ interview, candidateName, roleApplied }: InterviewCardProps) {
  const upcoming = isUpcoming(interview);
  const completed = interview.status === "completed";

  return (
    <Card className={cn("rounded-2xl", upcoming ? "border-blue-200" : "border-slate-200")}>
      <CardContent className="pt-4 pb-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-900">{candidateName}</span>
              <Badge className="text-[9px] rounded-full bg-slate-100 text-slate-600">{roleApplied}</Badge>
              {upcoming && (
                <Badge className="text-[9px] rounded-full bg-blue-100 text-blue-700 flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />Upcoming
                </Badge>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              {modeIcon(interview.mode)}
              <span>{modeLabel(interview.mode)}</span>
              <span className="text-slate-300">·</span>
              <span>{formatDateTime(interview.scheduled_at)}</span>
              {interview.location && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{interview.location}</span>
                </>
              )}
            </div>
          </div>
          {completed && interview.recommendation && (
            <Badge className={cn("text-[9px] rounded-full shrink-0 px-2.5 py-0.5", recommendationColor(interview.recommendation))}>
              {recommendationLabel(interview.recommendation)}
            </Badge>
          )}
        </div>

        {/* Panel members */}
        {interview.panel_members.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Panel:</span>
            {interview.panel_members.map((member, i) => (
              <span key={i} className="flex items-center gap-1 text-xs text-slate-600">
                {member}
                {interview.safer_recruitment_trained && i === 0 && (
                  <Badge className="text-[8px] rounded-full bg-green-100 text-green-700 px-1.5 py-0">SR Trained</Badge>
                )}
              </span>
            ))}
          </div>
        )}

        {/* SR Compliance badges */}
        <div className="flex gap-2 flex-wrap">
          {interview.safer_recruitment_trained ? (
            <Badge className="text-[9px] rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
              <Shield className="h-2.5 w-2.5" />SR-Trained on Panel
            </Badge>
          ) : (
            <Badge className="text-[9px] rounded-full bg-red-100 text-red-700 flex items-center gap-0.5">
              <Shield className="h-2.5 w-2.5" />No SR-Trained Interviewer
            </Badge>
          )}
          {completed && (
            <>
              <Badge className={cn(
                "text-[9px] rounded-full flex items-center gap-0.5",
                // We don't have safeguarding_question_asked on this Interview type directly, show placeholder
                "bg-blue-100 text-blue-700"
              )}>
                <Shield className="h-2.5 w-2.5" />Safeguarding Q
              </Badge>
              <Badge className="text-[9px] rounded-full bg-purple-100 text-purple-700 flex items-center gap-0.5">
                <Heart className="h-2.5 w-2.5" />Motivation Q
              </Badge>
            </>
          )}
        </div>

        {/* Score */}
        {completed && interview.overall_score !== null && (
          <div className="flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-slate-700">
              Overall Score: {interview.overall_score}/100
            </span>
          </div>
        )}

        {/* Notes */}
        {interview.notes && (
          <div className="text-xs text-slate-600 bg-slate-50 rounded-xl px-3 py-2 line-clamp-2">
            {interview.notes}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {completed ? (
            <Button size="sm" variant="outline" className="h-7 text-xs" disabled title="Interview scores are recorded in the candidate profile.">View Scores</Button>
          ) : (
            <Button size="sm" variant="outline" className="h-7 text-xs" disabled title="Add interview scores from the candidate profile page.">Add Scores</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

interface InterviewWithCandidate extends Interview {
  candidateName: string;
  roleApplied: string;
}

export default function InterviewsPage() {
  const [tab, setTab] = useState<InterviewTab>("upcoming");
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, error } = useRecruitment();

  const allInterviews = useMemo<InterviewWithCandidate[]>(() => {
    if (!data?.candidates) return [];
    return data.candidates.flatMap((c: CandidateDetail) =>
      c.interviews.map(i => ({
        ...i,
        candidateName: `${c.first_name} ${c.last_name}`,
        roleApplied: c.role_applied,
      }))
    ).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  }, [data]);

  const filtered = useMemo(() => {
    let list = allInterviews;
    if (tab === "upcoming") list = list.filter(i => isUpcoming(i));
    else if (tab === "completed") list = list.filter(i => i.status === "completed");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => {
        const hay = [i.candidateName, i.roleApplied, i.notes || "", i.location || "", modeLabel(i.mode), ...i.panel_members].join(" ").toLowerCase();
        return hay.includes(q);
      });
    }
    return list;
  }, [allInterviews, tab, search]);

  const upcomingCount = allInterviews.filter(i => isUpcoming(i)).length;

  const TABS: { key: InterviewTab; label: string }[] = [
    { key: "upcoming", label: `Upcoming (${upcomingCount})` },
    { key: "completed", label: "Completed" },
    { key: "all", label: "All" },
  ];

  return (
    <PageShell
      title="Interviews"
      subtitle="Panel interviews with safer recruitment compliance"
      showQuickCreate={false}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Interviews" subtitle="Oak House — Safer Recruitment Interviews" targetId="interviews-content" />
          <SmartUploadButton variant="inline" label="Upload Interview Notes" uploadContext="Safer Recruitment — interview notes or scoring template upload" />
        </div>
      }
    >
      <div id="interviews-content" className="space-y-0">
      {/* Compliance note */}
      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex gap-3 mb-6">
        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          Every interview panel must include at least one safer-recruitment-trained interviewer.
          Safeguarding motivations and values-based questions are mandatory for all children&apos;s residential care roles.
        </div>
      </div>

      {/* Search + Tabs */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative w-60">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search interviews…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
              tab === t.key
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {t.label}
          </button>
        ))}
        {search.trim() && (
          <span className="text-xs text-slate-400 ml-auto">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {isError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-center gap-3 text-red-600 mb-5">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{(error as Error)?.message || "Failed to load data"}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span className="text-sm">Loading interviews...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-400">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 text-slate-200" />
          <div className="text-sm font-medium">
            {search.trim() ? "No interviews match your search" : tab === "upcoming" ? "No upcoming interviews scheduled" : "No interviews in this view"}
          </div>
          <div className="text-xs mt-1">
            {search.trim() ? "Try a different search term or change the filter tab" : "Interviews are logged against candidate profiles"}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(i => (
            <InterviewCard
              key={i.id}
              interview={i}
              candidateName={i.candidateName}
              roleApplied={i.roleApplied}
            />
          ))}
        </div>
      )}
      </div>{/* close #interviews-content */}
    </PageShell>
  );
}

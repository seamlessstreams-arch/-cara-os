"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useVoiceEntries, useCreateVoiceEntry } from "@/hooks/use-intelligence-layer";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { PageShell } from "@/components/layout/page-shell";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";
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
  MessageCircle,
  Heart,
  Star,
  Plus,
  ChevronDown,
  ChevronUp,
  Calendar,
  Link2,
  Sparkles,
  Quote,
  TrendingUp,
  Home,
  BookOpen,
  Utensils,
  Activity,
  Shield,
  Users,
  Smile,
  Palette,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type VoiceCategory =
  | "wishes_and_feelings"
  | "complaint"
  | "compliment"
  | "house_meeting"
  | "food"
  | "activity"
  | "bedroom"
  | "family_time"
  | "education"
  | "health"
  | "safety"
  | "relationship_with_staff"
  | "general_wellbeing";

interface VoiceEntry {
  id: string;
  date: string;
  category: VoiceCategory;
  childWords: string;
  summary: string;
  actionTaken: string;
  staffResponse: string;
  staffMember: string;
  linkedRecord?: string;
}

interface ThemeCount {
  category: VoiceCategory;
  count: number;
}

interface OutcomeFromVoice {
  id: string;
  voiceEntryId: string;
  whatChanged: string;
  date: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<VoiceCategory, { label: string; color: string; icon: React.ReactNode }> = {
  wishes_and_feelings: { label: "Wishes & Feelings", color: "bg-indigo-100 text-indigo-800", icon: <Heart className="h-3.5 w-3.5" /> },
  complaint: { label: "Complaint", color: "bg-red-100 text-red-800", icon: <MessageCircle className="h-3.5 w-3.5" /> },
  compliment: { label: "Compliment", color: "bg-green-100 text-green-800", icon: <Star className="h-3.5 w-3.5" /> },
  house_meeting: { label: "House Meeting", color: "bg-purple-100 text-purple-800", icon: <Home className="h-3.5 w-3.5" /> },
  food: { label: "Food", color: "bg-orange-100 text-orange-800", icon: <Utensils className="h-3.5 w-3.5" /> },
  activity: { label: "Activity", color: "bg-sky-100 text-sky-800", icon: <Activity className="h-3.5 w-3.5" /> },
  bedroom: { label: "Bedroom", color: "bg-pink-100 text-pink-800", icon: <Home className="h-3.5 w-3.5" /> },
  family_time: { label: "Family Time", color: "bg-amber-100 text-amber-800", icon: <Users className="h-3.5 w-3.5" /> },
  education: { label: "Education", color: "bg-blue-100 text-blue-800", icon: <BookOpen className="h-3.5 w-3.5" /> },
  health: { label: "Health", color: "bg-emerald-100 text-emerald-800", icon: <Activity className="h-3.5 w-3.5" /> },
  safety: { label: "Safety", color: "bg-rose-100 text-rose-800", icon: <Shield className="h-3.5 w-3.5" /> },
  relationship_with_staff: { label: "Staff Relationship", color: "bg-teal-100 text-teal-800", icon: <Users className="h-3.5 w-3.5" /> },
  general_wellbeing: { label: "General Wellbeing", color: "bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)]", icon: <Smile className="h-3.5 w-3.5" /> },
};

const CHILDREN = [
  { id: "child-a", name: "Child A" },
  { id: "child-b", name: "Child B" },
  { id: "child-c", name: "Child C" },
];


// ── Component ────────────────────────────────────────────────────────────────

export default function VoiceOfTheChildPage() {
  const [selectedChild, setSelectedChild] = useState("child-a");
  const [showAddForm, setShowAddForm] = useState(false);
  const [entries, setEntries] = useState<VoiceEntry[]>([]);

  const themes = useMemo<ThemeCount[]>(() => {
    const counts = new Map<VoiceCategory, number>();
    for (const e of entries) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [entries]);

  const outcomes = useMemo<OutcomeFromVoice[]>(() => {
    return entries
      .filter((e) => e.actionTaken && e.actionTaken.trim().length > 0)
      .map((e) => ({
        id: `o_${e.id}`,
        voiceEntryId: e.id,
        whatChanged: e.actionTaken,
        date: e.date,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries]);

  const [newCategory, setNewCategory] = useState<VoiceCategory>("wishes_and_feelings");
  const [newDate, setNewDate] = useState("2026-05-05");
  const [newChildWords, setNewChildWords] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newActionTaken, setNewActionTaken] = useState("");
  const [newStaffResponse, setNewStaffResponse] = useState("");

  /* ── API hooks ─────────────────────────────────────────────────────────── */
  const { data: apiData } = useVoiceEntries();
  const createEntry = useCreateVoiceEntry();

  useEffect(() => {
    if (apiData?.persisted && Array.isArray(apiData.entries)) {
      setEntries((apiData.entries as Record<string, unknown>[]).map((e) => ({
        id: e.id as string,
        date: (e.entry_date as string) ?? "",
        category: e.category as VoiceCategory,
        childWords: (e.child_words as string) ?? "",
        summary: (e.summary as string) ?? "",
        actionTaken: (e.action_taken as string) ?? "",
        staffResponse: (e.staff_response as string) ?? "",
        staffMember: (e.created_by as string) ?? "",
        linkedRecord: e.linked_record_id as string | undefined,
      })));
    }
  }, [apiData]);

  return (
    <PageShell
      title="Voice of the Child"
      subtitle="Capturing what matters most — in their own words"
      caraContext={{ pageTitle: "Voice of the Child", sourceType: "care_plan" }}
      actions={<CaraStudioQuickActionButton context={{ record_type: "direct_work", record_id: "home_oak", home_id: "home_oak" }} />}
    >
      <div className="space-y-6">
        {/* Child Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {CHILDREN.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? (
              <ChevronUp className="h-4 w-4 mr-1" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            Add Voice Entry
          </Button>
        </div>

        {/* Add Voice Entry Form */}
        {showAddForm && (
          <Card className="border-indigo-200 bg-indigo-50/30">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-indigo-600" />
                New Voice Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={newCategory} onValueChange={(v) => setNewCategory(v as VoiceCategory)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_META).map(([key, meta]) => (
                        <SelectItem key={key} value={key}>
                          {meta.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <input
                    type="date"
                    className="w-full p-2 text-sm border rounded-md"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Child&apos;s Words</label>
                <textarea
                  className="w-full min-h-[80px] p-3 text-sm border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]/30"
                  placeholder="Record exactly what the child said, in their own words..."
                  value={newChildWords}
                  onChange={(e) => setNewChildWords(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Summary</label>
                <textarea
                  className="w-full min-h-[60px] p-3 text-sm border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]/30"
                  placeholder="Brief summary for records..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Action Taken</label>
                <textarea
                  className="w-full min-h-[60px] p-3 text-sm border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]/30"
                  placeholder="What was done in response..."
                  value={newActionTaken}
                  onChange={(e) => setNewActionTaken(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Staff Response (shared with child)</label>
                <textarea
                  className="w-full min-h-[60px] p-3 text-sm border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]/30"
                  placeholder="Your response to the child..."
                  value={newStaffResponse}
                  onChange={(e) => setNewStaffResponse(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-[var(--cs-navy)] hover:bg-[var(--cs-navy)]/90 text-white"
                  disabled={!newChildWords.trim() || createEntry.isPending}
                  onClick={() => {
                    createEntry.mutate({
                      childId: selectedChild,
                      homeId: "oak-house",
                      category: newCategory,
                      entryDate: newDate,
                      childWords: newChildWords,
                      summary: newSummary,
                      actionTaken: newActionTaken,
                      staffResponse: newStaffResponse,
                    }, {
                      onSuccess: () => {
                        setNewChildWords("");
                        setNewSummary("");
                        setNewActionTaken("");
                        setNewStaffResponse("");
                        setShowAddForm(false);
                      },
                    });
                  }}
                >
                  {createEntry.isPending ? "Saving..." : "Save Entry"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Voice Timeline */}
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id} className="border-indigo-100 hover:border-indigo-200 transition-colors">
              <CardContent className="p-5 space-y-3">
                {/* Child's Words - Quote Style */}
                <div className="bg-blue-50 border-l-4 border-indigo-300 rounded-r-lg p-4">
                  <div className="flex items-start gap-2">
                    <Quote className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-base italic text-indigo-900 leading-relaxed">
                      &ldquo;{entry.childWords}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn("text-xs flex items-center gap-1", CATEGORY_META[entry.category].color)}>
                    {CATEGORY_META[entry.category].icon}
                    {CATEGORY_META[entry.category].label}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(entry.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Recorded by {entry.staffMember}
                  </span>
                </div>

                {/* Details */}
                <div className="grid gap-2 sm:grid-cols-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Summary</p>
                    <p className="text-sm">{entry.summary}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Action Taken</p>
                    <p className="text-sm">{entry.actionTaken}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Staff Response</p>
                    <p className="text-sm">{entry.staffResponse}</p>
                  </div>
                </div>

                {/* Linked Record */}
                {entry.linkedRecord && (
                  <div className="flex items-center gap-1.5 text-xs text-indigo-600">
                    <Link2 className="h-3 w-3" />
                    <span>Linked: {entry.linkedRecord}</span>
                  </div>
                )}

                {/* Smart Links */}
                <SmartLinkPanel
                  sourceType="key_work"
                  sourceId={entry.id}
                  homeId="oak-house"
                  childId={selectedChild}
                  category={entry.category}
                  compact
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Themes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-indigo-600" />
              Themes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {themes.map((theme) => (
                <div
                  key={theme.category}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border",
                    CATEGORY_META[theme.category].color
                  )}
                >
                  {CATEGORY_META[theme.category].icon}
                  <span className="text-xs font-medium">
                    {CATEGORY_META[theme.category].label}
                  </span>
                  <Badge variant="outline" className="text-xs h-5 w-5 flex items-center justify-center rounded-full p-0">
                    {theme.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* What Changed Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              What Changed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {outcomes.map((outcome) => {
                const linkedEntry = entries.find((e) => e.id === outcome.voiceEntryId);
                return (
                  <div
                    key={outcome.id}
                    className="border border-green-100 rounded-lg p-3 bg-green-50/30 space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <div className="space-y-1 flex-1">
                        <p className="text-sm">{outcome.whatChanged}</p>
                        {linkedEntry && (
                          <p className="text-xs text-muted-foreground italic">
                            In response to: &ldquo;{linkedEntry.childWords.substring(0, 60)}...&rdquo;
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(outcome.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      <CaraPanel
        mode="assist"
        pageContext="Voice of the Child — children's wishes and feelings, direct work records, child consultations, participation activities, complaints, advocacy, Reg 45 children's views evidence"
        recordType="direct_work"
        className="mt-6"
      />
    </PageShell>
  );
}

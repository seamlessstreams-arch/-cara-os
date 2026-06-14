"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara STUDIO
// Independent generative intelligence workspace. Create 30+ artifact types
// from a single studio. Cara drafts. Humans decide. Nothing commits without
// approval.
// ══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Wand2, Plus, Search, Filter, AlertTriangle, CheckCircle,
  Clock, Eye, Layers, Cpu, Zap, RefreshCw,
} from "lucide-react";
import {
  useCaraArtifacts, useGenerateCaraArtifact, useUpdateCaraArtifact,
  useDeleteCaraArtifact, useCaraGaps,
} from "@/hooks/use-cara-studio";
import { useYoungPeople } from "@/hooks/use-young-people";
import { CaraStudioArtifactCard } from "@/components/cara/studio-artifact-card";
import type {
  CaraArtifactType, CaraFramework, CaraTone, CaraCreativeMode, CaraGenerationRequest,
} from "@/types/cara-studio";
import {
  CARA_ARTIFACT_TYPE_LABELS, CARA_FRAMEWORK_LABELS,
  CARA_TONE_LABELS, CARA_CREATIVE_MODE_LABELS,
} from "@/types/cara-studio";

// ── Artifact type groups ───────────────────────────────────────────────────

const ARTIFACT_TYPE_GROUPS: Array<{ label: string; types: CaraArtifactType[] }> = [
  {
    label: "Child-centred practice",
    types: ["keywork_session", "direct_work_session", "child_friendly_worksheet", "child_friendly_explanation"],
  },
  {
    label: "Management & oversight",
    types: ["management_oversight", "incident_learning_review", "risk_review", "safeguarding_review", "supervision_prompt"],
  },
  {
    label: "Plans & updates",
    types: ["child_plan", "placement_plan_update", "care_plan_update", "action_plan", "social_worker_update"],
  },
  {
    label: "Regulatory & inspection",
    types: ["reg45_summary", "annex_a_update", "ofsted_readiness_summary", "ri_briefing"],
  },
  {
    label: "Training & development",
    types: ["staff_training", "quiz", "flashcards", "reflective_practice_prompt", "scenario_simulation"],
  },
  {
    label: "Communication",
    types: ["parent_professional_letter", "team_meeting_discussion", "audio_briefing_script", "video_briefing_script", "slide_deck_outline"],
  },
  {
    label: "Visual & structured",
    types: ["mind_map", "timeline", "visual_formulation", "reflective_workbook"],
  },
];

const FRAMEWORKS: CaraFramework[] = [
  "pace", "ddp", "arc", "trauma_informed", "therapeutic_parenting",
  "restorative_practice", "youth_work", "psychologically_informed",
  "relationship_based", "safeguarding_led", "strengths_based",
  "attachment_informed", "signs_of_safety", "none",
];

const TONES: CaraTone[] = ["professional", "warm", "child_friendly", "formal", "therapeutic", "plain_english", "legal_careful"];
const CREATIVE_MODES: CaraCreativeMode[] = ["conservative", "balanced", "creative", "therapeutic", "child_friendly", "training_focused", "inspection_ready", "reflective", "plain_english", "professional_legal"];

// ── Component ─────────────────────────────────────────────────────────────────

export default function CaraStudioPage() {
  return (
    <Suspense fallback={null}>
      <CaraStudioPageInner />
    </Suspense>
  );
}

function CaraStudioPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill from query params (quick action entry)
  const preArtifactType = searchParams.get("artifact_type") as CaraArtifactType | null;
  const preChildId = searchParams.get("child_id");

  // ── Filters ──────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [childFilter, setChildFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  // ── Create dialog ────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<CaraArtifactType | null>(preArtifactType);
  const [formData, setFormData] = useState({
    child_id: preChildId ?? "__home",
    framework: "none" as CaraFramework,
    tone: "professional" as CaraTone,
    creative_mode: "balanced" as CaraCreativeMode,
    additional_context: "",
    title: "",
  });

  // Open dialog automatically if coming from quick action
  useEffect(() => {
    if (preArtifactType) {
      setDialogOpen(true);
      setStep(2);
    }
  }, [preArtifactType]);

  // ── Data ─────────────────────────────────────────────────────────────────
  const { data: artifactsData, isLoading } = useCaraArtifacts({
    status: statusFilter === "all" ? undefined : statusFilter,
    artifact_type: typeFilter || undefined,
    child_id: childFilter === "all" ? undefined : childFilter,
  });
  const { data: gapsData } = useCaraGaps({ status: "open" });
  const { data: youngPeopleData } = useYoungPeople();

  const generateMutation = useGenerateCaraArtifact();
  const updateMutation = useUpdateCaraArtifact();
  const deleteMutation = useDeleteCaraArtifact();

  const artifacts = artifactsData?.data ?? [];
  const meta = artifactsData?.meta;
  const gaps = gapsData?.data ?? [];
  const youngPeople = youngPeopleData?.data ?? [];

  // Client-side search filter
  const filteredArtifacts = search
    ? artifacts.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          a.artifact_type.includes(search.toLowerCase())
      )
    : artifacts;

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleSelectType(type: CaraArtifactType) {
    setSelectedType(type);
    // Auto-generate title
    setFormData((prev) => ({
      ...prev,
      title: CARA_ARTIFACT_TYPE_LABELS[type] ?? type,
    }));
    setStep(2);
  }

  async function handleGenerate() {
    if (!selectedType) return;

    const request: CaraGenerationRequest = {
      artifact_type: selectedType,
      title: formData.title || CARA_ARTIFACT_TYPE_LABELS[selectedType],
      child_id: formData.child_id && formData.child_id !== "__home" ? formData.child_id : null,
      home_id: "home_oak",
      staff_id: "staff_anna",
      incident_id: null,
      linked_record_id: null,
      linked_record_type: null,
      framework: formData.framework,
      tone: formData.tone,
      creative_mode: formData.creative_mode,
      source_ids: [],
      additional_context: formData.additional_context,
      requested_by: "staff_anna",
      date_range_from: null,
      date_range_to: null,
    };

    const result = await generateMutation.mutateAsync(request);
    setDialogOpen(false);
    setStep(1);
    setSelectedType(null);
    router.push(`/intelligence/cara/studio/${result.data.id}`);
  }

  function handleSubmit(artifactId: string) {
    updateMutation.mutate({ id: artifactId, action: "submit", actor_id: "staff_anna" });
  }

  function handleArchive(artifactId: string) {
    updateMutation.mutate({ id: artifactId, action: "archive", actor_id: "staff_anna" });
  }

  function handleDelete(artifactId: string) {
    deleteMutation.mutate(artifactId);
  }

  function handleRecover(artifactId: string) {
    updateMutation.mutate({ id: artifactId, action: "recover", actor_id: "staff_anna" });
  }

  return (
    <PageShell
      title="Cara Studio"
      subtitle="Generative intelligence workspace — create, review and commit 30+ artifact types"
      caraContext={{
        pageTitle: "Cara Studio — generative intelligence workspace",
        suggestedAction: "Generate a new artifact from home records",
      }}
    >
      {/* ── Critical gaps banner ───────────────────────────────────────────── */}
      {gaps.filter((g) => g.severity === "high" || g.severity === "critical").length > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-700">
              {gaps.filter((g) => g.severity === "high" || g.severity === "critical").length} high-priority evidence gap(s) detected
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              {gaps.filter((g) => g.severity === "critical" || g.severity === "high").slice(0, 2).map((g) => g.title).join(" · ")}
            </p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 border-red-200 text-red-700 hover:bg-red-50">
            Review gaps
          </Button>
        </div>
      )}

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total", value: meta?.total ?? 0, icon: Layers, colour: "text-muted-foreground" },
          { label: "Draft", value: meta?.draft ?? 0, icon: Clock, colour: "text-yellow-700" },
          { label: "In review", value: meta?.in_review ?? 0, icon: Eye, colour: "text-blue-700" },
          { label: "Committed", value: meta?.committed ?? 0, icon: CheckCircle, colour: "text-green-700" },
        ].map((stat) => (
          <Card key={stat.label} className="py-3">
            <CardContent className="p-0 px-4 flex items-center gap-3">
              <stat.icon className={`h-4 w-4 ${stat.colour}`} />
              <div>
                <p className="text-xl font-bold leading-none">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search artifacts..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_review">In review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="committed">Committed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={childFilter} onValueChange={setChildFilter}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="All children" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All children</SelectItem>
            {youngPeople.map((yp) => (
              <SelectItem key={yp.id} value={yp.id}>
                {yp.first_name} {yp.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => { setDialogOpen(true); setStep(1); }} className="h-9 gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          New artifact
        </Button>
      </div>

      {/* ── Artifact grid ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-lg border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : filteredArtifacts.length === 0 ? (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 rounded-full bg-violet-50 flex items-center justify-center">
              <Wand2 className="h-8 w-8 text-violet-500" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg">No artifacts yet</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                Generate your first artifact from evidence in the home record.
                Cara drafts — you approve.
              </p>
            </div>
            <Button onClick={() => { setDialogOpen(true); setStep(1); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Generate first artifact
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredArtifacts.map((artifact) => (
            <CaraStudioArtifactCard
              key={artifact.id}
              artifact={artifact}
              onSubmit={handleSubmit}
              onArchive={handleArchive}
              onDelete={handleDelete}
              onRecover={handleRecover}
            />
          ))}
        </div>
      )}

      {/* ── Safety disclaimer ─────────────────────────────────────────────── */}
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground border-t pt-4">
        <Cpu className="h-3.5 w-3.5 text-violet-500 shrink-0" />
        <span>
          Cara Studio generates draft content only. All outputs require human review and manager approval
          before they become part of any official record. Cara drafts. Humans decide.
        </span>
      </div>

      {/* ── Create / Generate dialog ──────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setStep(1); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-violet-600" />
              Generate with Cara
            </DialogTitle>
            <DialogDescription>
              {step === 1
                ? "Choose the type of artifact to generate"
                : "Configure and generate your artifact"}
            </DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4 py-2">
              {ARTIFACT_TYPE_GROUPS.map((group) => (
                <div key={group.label}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {group.label}
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {group.types.map((type) => (
                      <button
                        key={type}
                        onClick={() => handleSelectType(type)}
                        className={`text-left px-3 py-2 rounded-md border text-xs hover:bg-violet-50 hover:border-violet-300 transition-colors ${
                          selectedType === type ? "bg-violet-50 border-violet-400 font-medium" : ""
                        }`}
                      >
                        {CARA_ARTIFACT_TYPE_LABELS[type]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 2 && selectedType && (
            <div className="space-y-4 py-2">
              {/* Selected type display */}
              <div className="flex items-center gap-2 p-2 bg-violet-50 rounded-md">
                <Badge variant="outline" className="text-violet-700 border-violet-300">
                  {CARA_ARTIFACT_TYPE_LABELS[selectedType]}
                </Badge>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-muted-foreground hover:text-foreground ml-auto"
                >
                  Change
                </button>
              </div>

              <div className="space-y-3">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    placeholder={`e.g. ${CARA_ARTIFACT_TYPE_LABELS[selectedType]} — [child name]`}
                    className="h-9"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Child */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Child (optional)</Label>
                    <Select value={formData.child_id} onValueChange={(v) => setFormData((p) => ({ ...p, child_id: v }))}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All / home-level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__home">Home-level</SelectItem>
                        {youngPeople.map((yp) => (
                          <SelectItem key={yp.id} value={yp.id}>
                            {yp.first_name} {yp.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Framework */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Framework</Label>
                    <Select
                      value={formData.framework}
                      onValueChange={(v) => setFormData((p) => ({ ...p, framework: v as CaraFramework }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FRAMEWORKS.map((f) => (
                          <SelectItem key={f} value={f} className="text-xs">
                            {CARA_FRAMEWORK_LABELS[f].split(" (")[0]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tone */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Tone</Label>
                    <Select
                      value={formData.tone}
                      onValueChange={(v) => setFormData((p) => ({ ...p, tone: v as CaraTone }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TONES.map((t) => (
                          <SelectItem key={t} value={t} className="text-xs">
                            {CARA_TONE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Creative mode */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Mode</Label>
                    <Select
                      value={formData.creative_mode}
                      onValueChange={(v) => setFormData((p) => ({ ...p, creative_mode: v as CaraCreativeMode }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CREATIVE_MODES.map((m) => (
                          <SelectItem key={m} value={m} className="text-xs">
                            {CARA_CREATIVE_MODE_LABELS[m]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Additional context */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Additional context for Cara{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    value={formData.additional_context}
                    onChange={(e) => setFormData((p) => ({ ...p, additional_context: e.target.value }))}
                    placeholder="Any specific focus, recent events, or context Cara should consider..."
                    className="text-sm resize-none h-20"
                  />
                </div>
              </div>

              {/* Safety notice */}
              <div className="text-xs text-muted-foreground bg-muted/40 rounded-md p-3 flex gap-2">
                <Zap className="h-3.5 w-3.5 text-violet-500 shrink-0 mt-0.5" />
                <span>
                  Cara will gather evidence from the home record and generate a structured draft.
                  The output will be clearly marked as a draft and will require your review before
                  any approval or commit action.
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || !formData.title}
                  className="flex-1 gap-2"
                >
                  {generateMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

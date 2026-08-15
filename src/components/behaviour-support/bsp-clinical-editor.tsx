"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BSP — clinical sections editor.
//
// The quick-create dialog deliberately does not collect these five sections
// (#930): each item needs judgement the create step never asks for, and
// storing free text as a typed record would state a severity, likelihood or
// effectiveness nobody assessed. This is where that judgement is recorded —
// one row at a time, with every field the shape requires.
//
// A row is saved only when it is complete. An unfinished row is kept on screen
// and counted back to the user rather than dropped silently: staff read this
// plan at the moment a child is escalating, and a half-filled row is worse
// than an absent one.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import {
  FREQUENCIES, SEVERITIES, TRENDS, TRIGGER_CATEGORIES, LIKELIHOODS, STAGES, EFFECTIVENESS,
  toBehaviours, toTriggers, toStages, toStrategies, toSafetyItems, incompleteCount,
  type DraftBehaviour, type DraftTrigger, type DraftStage, type DraftStrategy, type DraftSafetyItem,
} from "@/lib/behaviour-support/plan-items";
import type { BehaviourSupportPlan } from "@/types/extended";

const label = (s: string) => s.replace(/_/g, " ");

function Section({ title, hint, onAdd, children }: {
  title: string; hint: string; onAdd: () => void; children: React.ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-[var(--cs-border)] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--cs-navy)]">{title}</p>
          <p className="text-[11px] text-[var(--cs-text-muted)]">{hint}</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onAdd}>
          <Plus className="mr-1 h-3 w-3" /> Add
        </Button>
      </div>
      {children}
    </div>
  );
}

function RemoveRow({ onRemove }: { onRemove: () => void }) {
  return (
    <Button type="button" size="sm" variant="ghost" onClick={onRemove} aria-label="Remove this row">
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}

export interface BspClinicalEditorProps {
  plan: BehaviourSupportPlan;
  saving?: boolean;
  onCancel: () => void;
  onSave: (updates: Partial<BehaviourSupportPlan>) => void;
}

export function BspClinicalEditor({ plan, saving, onCancel, onSave }: BspClinicalEditorProps) {
  const uid = useId();
  const [behaviours, setBehaviours] = useState<DraftBehaviour[]>(plan.primary_behaviours ?? []);
  const [triggers, setTriggers] = useState<DraftTrigger[]>(plan.known_triggers ?? []);
  const [stages, setStages] = useState<DraftStage[]>(
    (plan.de_escalation ?? []).map((s) => ({ ...s, strategies: (s.strategies ?? []).join(", ") })),
  );
  const [strategies, setStrategies] = useState<DraftStrategy[]>(plan.positive_strategies ?? []);
  const [safety, setSafety] = useState<DraftSafetyItem[]>(
    (plan.safety_plan ?? []).map((s) => ({ ...s, staff_required: String(s.staff_required ?? "") })),
  );

  const unfinished = incompleteCount(behaviours, triggers, stages, strategies, safety);

  const upd = <T,>(set: React.Dispatch<React.SetStateAction<T[]>>, i: number, patch: Partial<T>) =>
    set((rows) => rows.map((r, n) => (n === i ? { ...r, ...patch } : r)));
  const del = <T,>(set: React.Dispatch<React.SetStateAction<T[]>>, i: number) =>
    set((rows) => rows.filter((_, n) => n !== i));

  function save() {
    onSave({
      primary_behaviours: toBehaviours(behaviours),
      known_triggers: toTriggers(triggers),
      de_escalation: toStages(stages),
      positive_strategies: toStrategies(strategies),
      safety_plan: toSafetyItems(safety),
    });
  }

  return (
    <div className="space-y-4">
      <Section
        title="Primary behaviours"
        hint="What the behaviour is, how often, how serious, and which way it is going."
        onAdd={() => setBehaviours((r) => [...r, {}])}
      >
        {behaviours.map((b, i) => (
          <div key={i} className="grid grid-cols-12 items-end gap-2">
            <div className="col-span-5">
              <Label htmlFor={`${uid}-beh-${i}`} className="text-[11px]">Behaviour</Label>
              <Input id={`${uid}-beh-${i}`} value={b.behaviour ?? ""} onChange={(e) => upd(setBehaviours, i, { behaviour: e.target.value })} placeholder="e.g. hitting out at bedtime" />
            </div>
            <div className="col-span-2">
              <Label htmlFor={`${uid}-beh-freq-${i}`} className="text-[11px]">Frequency</Label>
              <Select value={b.frequency ?? ""} onValueChange={(v) => upd(setBehaviours, i, { frequency: v as DraftBehaviour["frequency"] })}>
                <SelectTrigger id={`${uid}-beh-freq-${i}`}><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{label(f)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor={`${uid}-beh-sev-${i}`} className="text-[11px]">Severity</Label>
              <Select value={b.severity ?? ""} onValueChange={(v) => upd(setBehaviours, i, { severity: v as DraftBehaviour["severity"] })}>
                <SelectTrigger id={`${uid}-beh-sev-${i}`}><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor={`${uid}-beh-trend-${i}`} className="text-[11px]">Trend</Label>
              <Select value={b.trend ?? ""} onValueChange={(v) => upd(setBehaviours, i, { trend: v as DraftBehaviour["trend"] })}>
                <SelectTrigger id={`${uid}-beh-trend-${i}`}><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{TRENDS.map((t) => <SelectItem key={t} value={t}>{label(t)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-1"><RemoveRow onRemove={() => del(setBehaviours, i)} /></div>
          </div>
        ))}
      </Section>

      <Section
        title="Known triggers"
        hint="What sets the behaviour off, the kind of trigger it is, and how likely it is."
        onAdd={() => setTriggers((r) => [...r, {}])}
      >
        {triggers.map((t, i) => (
          <div key={i} className="grid grid-cols-12 items-end gap-2">
            <div className="col-span-5">
              <Label htmlFor={`${uid}-trg-${i}`} className="text-[11px]">Trigger</Label>
              <Input id={`${uid}-trg-${i}`} value={t.trigger ?? ""} onChange={(e) => upd(setTriggers, i, { trigger: e.target.value })} placeholder="e.g. unannounced visitors" />
            </div>
            <div className="col-span-3">
              <Label htmlFor={`${uid}-trg-cat-${i}`} className="text-[11px]">Category</Label>
              <Select value={t.category ?? ""} onValueChange={(v) => upd(setTriggers, i, { category: v as DraftTrigger["category"] })}>
                <SelectTrigger id={`${uid}-trg-cat-${i}`}><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{TRIGGER_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{label(c)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-3">
              <Label htmlFor={`${uid}-trg-lik-${i}`} className="text-[11px]">Likelihood</Label>
              <Select value={t.likelihood ?? ""} onValueChange={(v) => upd(setTriggers, i, { likelihood: v as DraftTrigger["likelihood"] })}>
                <SelectTrigger id={`${uid}-trg-lik-${i}`}><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{LIKELIHOODS.map((l) => <SelectItem key={l} value={l}>{label(l)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-1"><RemoveRow onRemove={() => del(setTriggers, i)} /></div>
          </div>
        ))}
      </Section>

      <Section
        title="De-escalation"
        hint="Green, amber and red — what to try at each stage, and how adults should be."
        onAdd={() => setStages((r) => [...r, {}])}
      >
        {stages.map((s, i) => (
          <div key={i} className="grid grid-cols-12 items-end gap-2">
            <div className="col-span-2">
              <Label htmlFor={`${uid}-stg-${i}`} className="text-[11px]">Stage</Label>
              <Select value={s.stage ?? ""} onValueChange={(v) => upd(setStages, i, { stage: v as DraftStage["stage"] })}>
                <SelectTrigger id={`${uid}-stg-${i}`}><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{STAGES.map((g) => <SelectItem key={g} value={g}>{label(g)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-5">
              <Label htmlFor={`${uid}-stg-strat-${i}`} className="text-[11px]">Strategies (one per line)</Label>
              <Textarea id={`${uid}-stg-strat-${i}`} rows={2} value={s.strategies ?? ""} onChange={(e) => upd(setStages, i, { strategies: e.target.value })} placeholder="Offer space&#10;Lower voice" />
            </div>
            <div className="col-span-4">
              <Label htmlFor={`${uid}-stg-app-${i}`} className="text-[11px]">Staff approach</Label>
              <Textarea id={`${uid}-stg-app-${i}`} rows={2} value={s.staff_approach ?? ""} onChange={(e) => upd(setStages, i, { staff_approach: e.target.value })} placeholder="One familiar adult only" />
            </div>
            <div className="col-span-1"><RemoveRow onRemove={() => del(setStages, i)} /></div>
          </div>
        ))}
      </Section>

      <Section
        title="Positive strategies"
        hint="What helps, how often it is used, and how well it actually works."
        onAdd={() => setStrategies((r) => [...r, {}])}
      >
        {strategies.map((s, i) => (
          <div key={i} className="grid grid-cols-12 items-end gap-2">
            <div className="col-span-5">
              <Label htmlFor={`${uid}-pos-${i}`} className="text-[11px]">Strategy</Label>
              <Input id={`${uid}-pos-${i}`} value={s.strategy ?? ""} onChange={(e) => upd(setStrategies, i, { strategy: e.target.value })} placeholder="e.g. evening walk before bed" />
            </div>
            <div className="col-span-3">
              <Label htmlFor={`${uid}-pos-freq-${i}`} className="text-[11px]">How often</Label>
              <Input id={`${uid}-pos-freq-${i}`} value={s.frequency ?? ""} onChange={(e) => upd(setStrategies, i, { frequency: e.target.value })} placeholder="e.g. daily" />
            </div>
            <div className="col-span-3">
              <Label htmlFor={`${uid}-pos-eff-${i}`} className="text-[11px]">Effectiveness</Label>
              <Select value={s.effectiveness ?? ""} onValueChange={(v) => upd(setStrategies, i, { effectiveness: v as DraftStrategy["effectiveness"] })}>
                <SelectTrigger id={`${uid}-pos-eff-${i}`}><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{EFFECTIVENESS.map((e) => <SelectItem key={e} value={e}>{label(e)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-1"><RemoveRow onRemove={() => del(setStrategies, i)} /></div>
          </div>
        ))}
      </Section>

      <Section
        title="Safety plan"
        hint="The scenario, the agreed response, and how many staff it needs."
        onAdd={() => setSafety((r) => [...r, {}])}
      >
        {safety.map((s, i) => (
          <div key={i} className="grid grid-cols-12 items-end gap-2">
            <div className="col-span-4">
              <Label htmlFor={`${uid}-saf-${i}`} className="text-[11px]">Scenario</Label>
              <Input id={`${uid}-saf-${i}`} value={s.scenario ?? ""} onChange={(e) => upd(setSafety, i, { scenario: e.target.value })} placeholder="e.g. leaves the building" />
            </div>
            <div className="col-span-5">
              <Label htmlFor={`${uid}-saf-res-${i}`} className="text-[11px]">Response</Label>
              <Textarea id={`${uid}-saf-res-${i}`} rows={2} value={s.response ?? ""} onChange={(e) => upd(setSafety, i, { response: e.target.value })} placeholder="Follow at a distance, call the manager" />
            </div>
            <div className="col-span-2">
              <Label htmlFor={`${uid}-saf-staff-${i}`} className="text-[11px]">Staff needed</Label>
              <Input id={`${uid}-saf-staff-${i}`} type="number" min={1} value={s.staff_required ?? ""} onChange={(e) => upd(setSafety, i, { staff_required: e.target.value })} />
            </div>
            <div className="col-span-1"><RemoveRow onRemove={() => del(setSafety, i)} /></div>
          </div>
        ))}
      </Section>

      {unfinished > 0 && (
        <p className="text-xs text-amber-700">
          {unfinished === 1 ? "One row is" : `${unfinished} rows are`} still missing an answer and
          will not be saved. Finish or remove {unfinished === 1 ? "it" : "them"} — a half-filled row
          in a behaviour plan is read at the worst possible moment.
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save clinical sections"}
        </Button>
      </div>
    </div>
  );
}

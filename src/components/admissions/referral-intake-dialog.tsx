"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — REFERRAL INTAKE DIALOG (Phase 6 · Intelligence · Module 2)
//
// Paste a referral document → deterministic extraction (M1 engine) prefills the
// New Referral form → the manager reviews every field → logs it. This also fixes
// the form itself: previously the inputs were unbound and submit sent a hardcoded
// "New Referral". Extraction is a suggestion the human confirms — nothing is
// saved until they press Log Referral.
// ══════════════════════════════════════════════════════════════════════════════

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useReferralExtraction } from "@/hooks/use-referral-extraction";
import { ADMISSION_REFERRAL_SOURCE_LABEL } from "@/types/extended";
import type { AdmissionReferral, AdmissionReferralSource, AdmissionGender } from "@/types/extended";
import { Sparkles, Loader2, Info } from "lucide-react";
import { toast } from "sonner";

const GENDERS: AdmissionGender[] = ["male", "female", "non_binary", "prefer_not_to_say"];

function mapGender(g: string | null): "" | AdmissionGender {
  if (!g) return "";
  const norm = g.toLowerCase().replace(/[\s-]+/g, "_");
  return (GENDERS as string[]).includes(norm) ? (norm as AdmissionGender) : "";
}

function splitLines(s: string): string[] {
  return s
    .split(/\r?\n/)
    .map((x) => x.replace(/^[-*•·\s]+/, "").trim())
    .filter(Boolean);
}

export function ReferralIntakeDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (payload: Partial<AdmissionReferral>) => void;
  isSubmitting: boolean;
}) {
  const extract = useReferralExtraction();
  const [paste, setPaste] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"" | AdmissionGender>("");
  const [referredBy, setReferredBy] = useState("");
  const [la, setLa] = useState("");
  const [source, setSource] = useState<"" | AdmissionReferralSource>("");
  const [needs, setNeeds] = useState("");
  const [risks, setRisks] = useState("");
  const [note, setNote] = useState<string | null>(null);

  function reset() {
    setPaste(""); setName(""); setDob(""); setGender(""); setReferredBy("");
    setLa(""); setSource(""); setNeeds(""); setRisks(""); setNote(null);
    extract.reset();
  }

  function handleOpenChange(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  function runExtract() {
    if (paste.trim().length < 20) {
      toast.error("Paste at least a short paragraph of the referral first.");
      return;
    }
    extract.mutate(paste, {
      onSuccess: (res) => {
        const f = res.data.fields;
        if (f.child_name) setName(f.child_name);
        if (f.date_of_birth) setDob(f.date_of_birth);
        const g = mapGender(f.gender);
        if (g) setGender(g);
        if (f.referred_by) setReferredBy(f.referred_by);
        if (f.local_authority) setLa(f.local_authority);
        if (f.referral_source) setSource(f.referral_source);
        if (f.presenting_needs.length) setNeeds(f.presenting_needs.join("\n"));
        if (f.risk_factors.length) setRisks(f.risk_factors.join("\n"));
        const aiFilled = res.ai?.used ? res.ai.filled.length : 0;
        setNote(
          `Prefilled ${res.data.found.length} of 7 fields — review every field before saving.` +
            (aiFilled > 0 ? ` ${aiFilled} suggested by Cara AI — check those carefully.` : ""),
        );
        toast.success("Referral extracted — please check each field.");
      },
      onError: () => toast.error("Could not extract from that text."),
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      child_name: name.trim() || "New Referral",
      date_of_birth: dob || undefined,
      gender: (gender || undefined) as AdmissionGender | undefined,
      referred_by: referredBy.trim() || undefined,
      local_authority: la.trim() || undefined,
      referral_source: (source || undefined) as AdmissionReferralSource | undefined,
      presenting_needs: splitLines(needs),
      risk_factors: splitLines(risks),
      status: "new",
      referral_date: new Date().toISOString().slice(0, 10),
      staff_id: "staff_darren",
    });
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Referral</DialogTitle></DialogHeader>

        {/* ── Paste-and-extract ─────────────────────────────────────────────── */}
        <div className="rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface-subtle)] p-3 space-y-2">
          <label htmlFor="ref-paste" className="flex items-center gap-1.5 text-sm font-medium text-[var(--cs-navy)]">
            <Sparkles className="h-4 w-4" /> Paste a referral to prefill
          </label>
          <Textarea
            id="ref-paste"
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder="Paste the referral email or document here — Cara extracts the fields for you to review."
            rows={4}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-[var(--cs-text-gentle)]">Nothing is saved until you press Log Referral.</p>
            <Button type="button" size="sm" variant="outline" onClick={runExtract} disabled={extract.isPending}>
              {extract.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Extracting…</> : "Extract with Cara"}
            </Button>
          </div>
          {note ? (
            <p className="flex items-start gap-1.5 text-xs text-[var(--cs-text-secondary)]">
              <Info className="mt-0.5 h-3 w-3 shrink-0" /> {note}
            </p>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="ref-name" className="text-sm font-medium">Child&apos;s Name / Reference</label>
            <Input id="ref-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Child name or anonymised reference" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="ref-dob" className="text-sm font-medium">Date of Birth</label>
              <Input id="ref-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>
            <div>
              <label htmlFor="ref-gender" className="text-sm font-medium">Gender</label>
              <Select value={gender} onValueChange={(v) => setGender(v as AdmissionGender)}>
                <SelectTrigger id="ref-gender"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non_binary">Non-binary</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label htmlFor="ref-referred-by" className="text-sm font-medium">Referred By</label>
            <Input id="ref-referred-by" value={referredBy} onChange={(e) => setReferredBy(e.target.value)} placeholder="Name and role of referring professional" />
          </div>
          <div>
            <label htmlFor="ref-la" className="text-sm font-medium">Local Authority</label>
            <Input id="ref-la" value={la} onChange={(e) => setLa(e.target.value)} placeholder="Placing local authority" />
          </div>
          <div>
            <label htmlFor="ref-source" className="text-sm font-medium">Source</label>
            <Select value={source} onValueChange={(v) => setSource(v as AdmissionReferralSource)}>
              <SelectTrigger id="ref-source"><SelectValue placeholder="Referral source" /></SelectTrigger>
              <SelectContent>
                {(Object.entries(ADMISSION_REFERRAL_SOURCE_LABEL) as [AdmissionReferralSource, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="ref-needs" className="text-sm font-medium">Presenting Needs</label>
            <Textarea id="ref-needs" value={needs} onChange={(e) => setNeeds(e.target.value)} placeholder="Key needs (one per line)" rows={3} />
          </div>
          <div>
            <label htmlFor="ref-risks" className="text-sm font-medium">Risk Factors</label>
            <Textarea id="ref-risks" value={risks} onChange={(e) => setRisks(e.target.value)} placeholder="Known risk factors (one per line)" rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving…</> : "Log Referral"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

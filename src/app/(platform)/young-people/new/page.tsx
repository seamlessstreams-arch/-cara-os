"use client";

// ══════════════════════════════════════════════════════════════════════════════
// ADMIT A CHILD — /young-people/new
//
// Referral-first intake. Upload or paste the child's initial referral and the
// deterministic extraction (no AI, no credits) prefills the admission form and
// surfaces the referral's presenting needs and risk factors. Admitting then
// routes the information where it needs to go in ONE action:
//   • the young person record (dual-mode dal — durable on live),
//   • the referral filed through the smart-documents pipeline against the
//     child (#823),
//   • draft risk assessments seeded per recognised risk domain, carrying the
//     referral's own wording,
//   • the New Placement Admission workflow instantiated as dated tasks.
// The manual path still works — skip the referral and fill the form by hand;
// the admission tasks are created either way.
// ══════════════════════════════════════════════════════════════════════════════

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdmitChild, type AdmitChildResult } from "@/hooks/use-young-people";
import { useReferralExtraction } from "@/hooks/use-referral-extraction";
import { YoungPersonEditDialog } from "@/components/young-people/young-person-edit-dialog";
import { LEGAL_STATUSES } from "@/lib/young-people/field-options";
import { useHomeName } from "@/hooks/use-home-profile";
import { CheckCircle2, FileText, Sparkles, Upload, Pencil } from "lucide-react";

const FIELD =
  "w-full rounded-md border border-[var(--cs-border)] bg-[var(--cs-surface)] px-3 py-2 text-sm text-[var(--cs-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-teal)]";

// Open the native date picker on any click/focus of the field, not only the
// tiny calendar glyph (which is easy to miss in the dark theme). showPicker is
// widely supported; the optional-chain guards older browsers.
function openPicker(e: { currentTarget: EventTarget & HTMLInputElement }) {
  const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
  try { el.showPicker?.(); } catch { /* not user-activated / unsupported */ }
}

export default function NewYoungPersonPage() {
  const router = useRouter();
  const homeName = useHomeName();
  const admit = useAdmitChild();
  const extract = useReferralExtraction();
  const fileInput = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    preferred_name: "",
    date_of_birth: "",
    gender: "",
    placement_start: new Date().toISOString().slice(0, 10),
    local_authority: "",
    legal_status: LEGAL_STATUSES[0],
  });
  const [referralText, setReferralText] = useState("");
  const [referralFileName, setReferralFileName] = useState<string | null>(null);
  const [needs, setNeeds] = useState<string[]>([]);
  const [risks, setRisks] = useState<string[]>([]);
  const [extracted, setExtracted] = useState(false);
  const [result, setResult] = useState<AdmitChildResult | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function readFile(file: File) {
    // Client-side text read — same paste/.txt convention as the compliance
    // document intake. Rich formats need their text pasted.
    file.text().then((text) => {
      setReferralText(text.slice(0, 40_000));
      setReferralFileName(file.name);
    });
  }

  function runExtraction() {
    if (referralText.trim().length < 20 || extract.isPending) return;
    extract.mutate(referralText, {
      onSuccess: (res) => {
        const f = res.data.fields;
        setExtracted(true);
        setNeeds(f.presenting_needs ?? []);
        setRisks(f.risk_factors ?? []);
        setForm((prev) => {
          const next = { ...prev };
          if (f.child_name) {
            const parts = f.child_name.trim().split(/\s+/);
            next.first_name = parts[0] ?? prev.first_name;
            next.last_name = parts.slice(1).join(" ") || prev.last_name;
          }
          if (f.date_of_birth) next.date_of_birth = f.date_of_birth;
          if (f.gender) next.gender = f.gender;
          if (f.local_authority) next.local_authority = f.local_authority;
          if (f.estimated_placement_date) next.placement_start = f.estimated_placement_date;
          return next;
        });
      },
    });
  }

  const missing =
    !form.first_name.trim() ||
    !form.last_name.trim() ||
    !form.date_of_birth ||
    !form.placement_start ||
    !form.local_authority.trim();

  function submit() {
    if (missing || admit.isPending) return;
    admit.mutate(
      {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        preferred_name: form.preferred_name.trim() || undefined,
        date_of_birth: form.date_of_birth,
        gender: form.gender.trim() || undefined,
        placement_start: form.placement_start,
        local_authority: form.local_authority.trim(),
        legal_status: form.legal_status,
        referral_text: referralText.trim() || undefined,
        referral_file_name: referralFileName ?? undefined,
      },
      { onSuccess: (res) => setResult(res.data) },
    );
  }

  // ── Post-admission summary: show what the one action created ───────────────
  if (result) {
    const yp = result.young_person;
    return (
      <PageShell title="Child admitted" description={`${yp.first_name} ${yp.last_name} has been admitted to ${homeName}.`}>
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="rounded-lg border border-[var(--cs-success-soft)] bg-[var(--cs-success-bg)] p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-[--cs-success] shrink-0 mt-0.5" />
            <div className="text-sm text-[var(--cs-navy)]">
              <p className="font-semibold">{yp.first_name} {yp.last_name} is now in Young People.</p>
              <p className="mt-1 text-[var(--cs-slate)]">
                {result.tasks_created.length} admission task{result.tasks_created.length === 1 ? "" : "s"} created
                {result.document ? " · initial referral filed to Documents" : ""}
                {result.risk_assessments.length > 0
                  ? ` · ${result.risk_assessments.length} draft risk assessment${result.risk_assessments.length === 1 ? "" : "s"} seeded`
                  : ""}.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cs-slate)] mb-2">Admission workflow tasks</p>
            <ul className="space-y-1.5">
              {result.tasks_created.map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--cs-navy)]">{t.title}</span>
                  <span className="text-xs text-[var(--cs-slate)] tabular-nums shrink-0 ml-3">due {t.due_date}</span>
                </li>
              ))}
            </ul>
          </div>

          {result.risk_assessments.length > 0 && (
            <div className="rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cs-slate)] mb-2">Draft risk assessments (from the referral — complete them)</p>
              <div className="flex flex-wrap gap-1.5">
                {result.risk_assessments.map((r) => (
                  <span key={r.id} className="rounded-full border border-[var(--cs-warning-soft)] bg-[var(--cs-warning-bg)] px-2.5 py-0.5 text-xs text-[--cs-warning]">
                    {r.domain.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button onClick={() => router.push(`/young-people/${yp.id}`)}>Open {yp.first_name}&rsquo;s record</Button>
            <Button variant="outline" className="gap-1.5" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />Correct details
            </Button>
            <Link href="/tasks" className="text-sm text-[var(--cs-slate)] hover:underline">View tasks</Link>
          </div>

          <YoungPersonEditDialog
            child={yp}
            open={editOpen}
            onOpenChange={setEditOpen}
            onSaved={(updated) => setResult((r) => (r ? { ...r, young_person: updated } : r))}
          />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Admit a child" description={`Start from the initial referral, or fill the form directly. They will appear in Young People immediately.`}>
      <div className="mx-auto max-w-2xl space-y-4">
        {/* ── Referral-first intake ─────────────────────────────────────── */}
        <div className="rounded-lg border border-[var(--cs-border)] bg-[var(--cs-surface)] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[var(--cs-teal)]" />
            <p className="text-sm font-semibold text-[var(--cs-navy)]">Start from the initial referral</p>
          </div>
          <p className="text-xs text-[var(--cs-slate)]">
            Upload a .txt file or paste the referral. Cara extracts the child&rsquo;s details deterministically to prefill the form,
            files the referral against their record, and seeds draft risk assessments from the risks it names.
          </p>
          <textarea
            className={`${FIELD} min-h-28 font-mono text-xs`}
            placeholder="Paste the referral text here…"
            value={referralText}
            onChange={(e) => { setReferralText(e.target.value); setExtracted(false); }}
          />
          <div className="flex items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              accept=".txt,text/plain"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); }}
            />
            <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
              <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload .txt
            </Button>
            <Button size="sm" onClick={runExtraction} disabled={referralText.trim().length < 20 || extract.isPending}>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> {extract.isPending ? "Extracting…" : "Extract & prefill"}
            </Button>
            {referralFileName && <span className="text-xs text-[var(--cs-slate)] truncate">{referralFileName}</span>}
          </div>

          {extract.isError && (
            <p className="text-xs text-[var(--cs-red)]">Couldn&rsquo;t extract from that text — check it and try again.</p>
          )}
          {extracted && (
            <div className="rounded-md border border-[var(--cs-border)] p-3 space-y-2">
              <p className="text-xs text-[var(--cs-slate)]">
                Fields found were prefilled below — review and correct them; a blank field simply wasn&rsquo;t in the text.
              </p>
              {needs.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-slate)] mb-1">Presenting needs</p>
                  <div className="flex flex-wrap gap-1">
                    {needs.map((n) => <span key={n} className="rounded-full border border-[var(--cs-border)] px-2 py-0.5 text-[11px] text-[var(--cs-navy)]">{n}</span>)}
                  </div>
                </div>
              )}
              {risks.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--cs-slate)] mb-1">Risk factors → draft risk assessments on admit</p>
                  <div className="flex flex-wrap gap-1">
                    {risks.map((r) => <span key={r} className="rounded-full border border-[var(--cs-warning-soft)] bg-[var(--cs-warning-bg)] px-2 py-0.5 text-[11px] text-[--cs-warning]">{r}</span>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Admission details ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--cs-slate)]">First name *</span>
            <Input value={form.first_name} onChange={set("first_name")} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--cs-slate)]">Last name *</span>
            <Input value={form.last_name} onChange={set("last_name")} />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--cs-slate)]">Preferred name</span>
            <Input value={form.preferred_name} onChange={set("preferred_name")} placeholder="Optional" />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--cs-slate)]">Gender</span>
            <Input value={form.gender} onChange={set("gender")} placeholder="Optional" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--cs-slate)]">Date of birth *</span>
            <Input type="date" value={form.date_of_birth} onChange={set("date_of_birth")} onClick={openPicker} onFocus={openPicker} />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--cs-slate)]">Placement start *</span>
            <Input type="date" value={form.placement_start} onChange={set("placement_start")} onClick={openPicker} onFocus={openPicker} />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-[var(--cs-slate)]">Placing local authority *</span>
          <Input value={form.local_authority} onChange={set("local_authority")} placeholder="e.g. Liverpool City Council" />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-[var(--cs-slate)]">Legal status</span>
          <select className={FIELD} value={form.legal_status} onChange={set("legal_status")}>
            {LEGAL_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        {admit.isError && (
          <p className="text-sm text-[var(--cs-red)]">Couldn&rsquo;t admit the child. Please try again.</p>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button onClick={submit} disabled={missing || admit.isPending}>
            {admit.isPending ? "Admitting…" : "Admit child"}
          </Button>
          <Link href="/young-people" className="text-sm text-[var(--cs-slate)] hover:underline">
            Cancel
          </Link>
        </div>
        <p className="text-xs text-[var(--cs-text-muted)]">
          Admitting creates the New Placement Admission workflow tasks (referral assessment through 72-hour review)
          {referralText.trim().length >= 20 ? ", files the referral to Documents, and seeds draft risk assessments from it" : ""}.
        </p>
      </div>
    </PageShell>
  );
}

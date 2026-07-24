// ══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATED SMOKE-RUN — Admit a child, end to end, against LIVE
//
// The admit flow and its records are auth-gated (real Supabase session), so they
// can't be exercised anonymously. This runs INSIDE your already-signed-in
// browser, so every fetch carries your session cookie — no credentials are
// handled by anyone but you.
//
// HOW TO RUN
//   1. Sign in to the live app in your browser: https://cara-paintpoint.vercel.app
//   2. Open DevTools → Console (⌥⌘I / F12).
//   3. Paste this whole file and press Enter.
//   4. Read the PASS/FAIL report it prints.
//
// It creates ONE obvious test child ("ZZ-Smoke Test-DELETE") and verifies the
// whole chain persisted to live Postgres. It does NOT auto-clean-up (there is
// no update/delete API for young people yet), so remove that child and its
// referral document / tasks / draft risk assessments from the UI afterwards.
// ══════════════════════════════════════════════════════════════════════════════

(async () => {
  const BASE = "/api/v1";

  const results = [];
  const ok = (name, pass, detail = "") => { results.push({ name, pass, detail }); };
  const j = async (path, init) => {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
      ...init,
    });
    let body = null;
    try { body = await res.json(); } catch { /* non-JSON */ }
    return { status: res.status, body };
  };

  const REFERRAL = [
    "Referral for: ZZ-Smoke Test-DELETE",
    "Date of Birth: 01/01/2012",
    "Gender: Male",
    "Local Authority: SMOKE TEST — delete this record",
    "Referral Source: Local Authority placement",
    "Date of Referral: 1 July 2026",
    "Social Worker: A Test",
    "",
    "Presenting Needs:",
    "- Emotional dysregulation following family breakdown",
    "- Disrupted education, needs reintegration support",
    "",
    "Risk Factors:",
    "- History of going missing",
    "- Vulnerable to child criminal exploitation",
    "- Self-harm (historic)",
    "",
    "Estimated Placement Date: 1 August 2026",
  ].join("\n");

  console.log("%c⟳ Cara admit smoke-run starting…", "font-weight:bold");

  // ── 0. Authenticated? ───────────────────────────────────────────────────────
  const auth = await j("/young-people?status=current");
  if (auth.status === 401) {
    console.error("✗ Not signed in — the API returned 401. Log in to the live app first, then re-run.");
    return;
  }
  ok("Authenticated session", auth.status === 200, `GET /young-people → ${auth.status}`);
  const rosterBefore = Array.isArray(auth.body?.data) ? auth.body.data.length : 0;

  // ── 1. Admit the test child from the referral ───────────────────────────────
  const admit = await j("/admissions/admit", {
    method: "POST",
    body: JSON.stringify({
      first_name: "ZZ-Smoke",
      last_name: "Test-DELETE",
      date_of_birth: "2012-01-01",
      placement_start: new Date().toISOString().slice(0, 10),
      local_authority: "SMOKE TEST — delete this record",
      legal_status: "Section 20 (voluntary accommodation)",
      referral_text: REFERRAL,
      referral_file_name: "zz-smoke-referral.txt",
    }),
  });
  ok("Admit returns 200", admit.status === 200, `POST /admissions/admit → ${admit.status}`);
  const d = admit.body?.data ?? {};
  const childId = d.young_person?.id;
  ok("Young person created", !!childId, childId ? `id=${childId}` : "no id returned");
  ok("Admission workflow tasks created", (d.tasks_created?.length ?? 0) >= 1, `${d.tasks_created?.length ?? 0} task(s)`);
  ok("Referral filed as a document", !!d.document?.id, d.document ? `doc=${d.document.id}, ${d.document.suggested_tasks} suggested` : "no document");
  const raDomains = (d.risk_assessments ?? []).map((r) => r.domain).sort();
  ok("Draft risk assessments seeded", raDomains.length >= 1, raDomains.join(", ") || "none");
  ok("Risk domains mapped from the referral", ["absconding", "exploitation", "self_harm"].every((x) => raDomains.includes(x)),
     `got: ${raDomains.join(", ")}`);

  if (!childId) {
    console.warn("No child id — skipping durability checks.");
    return report();
  }

  // ── 2. Durability: are the records actually readable back from live? ─────────
  const roster = await j("/young-people?status=current");
  const childInRoster = (roster.body?.data ?? []).some((c) => c.id === childId);
  ok("Young person durable (in current roster)", childInRoster,
     `roster ${rosterBefore} → ${roster.body?.data?.length ?? "?"}`);

  const ras = await j(`/risk-assessments?child_id=${encodeURIComponent(childId)}`);
  const raCount = (ras.body?.data ?? []).length;
  ok("Risk assessments durable (generic_records)", raCount >= raDomains.length,
     `read back ${raCount} of ${raDomains.length} — THIS is the #825 fix`);
  const allDraft = (ras.body?.data ?? []).every((r) => r.status === "draft");
  ok("Seeded RAs are drafts (not fabricated assessments)", raCount === 0 ? true : allDraft, `status: ${[...new Set((ras.body?.data ?? []).map((r) => r.status))].join(",")}`);

  const docs = await j("/doc-intelligence");
  const smokeDoc = (docs.body?.data ?? []).find((x) => x.id === d.document?.id);
  ok("Referral document durable + analysed", !!smokeDoc && !!smokeDoc.ai_result,
     smokeDoc ? `category=${smokeDoc.document_category}` : "not found in list");

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  // No automatic cleanup: young-people has no update/delete API path today (the
  // /young-people/:id route is GET-only and the dispatcher upsert would create a
  // DUPLICATE, not archive), so the harness deliberately leaves the record
  // rather than pollute the roster with a copy. Remove "ZZ-Smoke Test-DELETE"
  // and its referral document / tasks / draft RAs from the UI when you're done.

  return report();

  function report() {
    const pass = results.filter((r) => r.pass).length;
    console.log(`\n%cCara admit smoke-run — ${pass}/${results.length} passed`,
      `font-weight:bold;color:${pass === results.length ? "#16a34a" : "#dc2626"}`);
    console.table(results.map((r) => ({ check: r.name, result: r.pass ? "✓ PASS" : "✗ FAIL", detail: r.detail })));
    if (pass !== results.length) {
      console.warn("Some checks failed. Copy the table above and hand it back for a fix.");
    } else {
      console.log("%c✓ Admit works end to end on live — child, tasks, referral document and draft risk assessments all persisted.", "color:#16a34a");
    }
  }
})();

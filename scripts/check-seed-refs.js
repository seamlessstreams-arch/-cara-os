#!/usr/bin/env node
/*
 * check-seed-refs.js — referential integrity for seeded demo data.
 *
 * The class this guards (it has now bitten three times): a seed record
 * references a person by id — staff_id: "staff_naomi", supervised_by:
 * "staff_jasmine" — but no roster entry with that id exists anywhere. The
 * reference "resolves" to nothing: name lookups fall back to the raw id
 * (a supervisor rendering as "staff_jasmine" in the relational timeline),
 * per-staff rollups silently drop the records, and the
 * "every authored record resolves to a named staff member" test goes red on
 * main days after the seed change merges (PR #767; before that fc2d87e39
 * remapped 45 of these in one sweep).
 *
 * The guard: collect every DEFINED person id (id: "staff_…" / id: "yp_…")
 * across non-test src/lib sources, collect every REFERENCE to one (a known
 * person-reference field whose value is "staff_…" / "yp_…"), and fail on any
 * reference whose id is defined nowhere.
 *
 * SCOPE:
 *   - Non-test .ts files under src/lib only. Tests are deliberately excluded
 *     on BOTH sides: a test defining its own synthetic fixture ids
 *     (staff_x, staff_b…) is the CORRECT pattern, not a phantom.
 *   - References are matched structurally — `field: "staff_x"` — so a bare
 *     column-name string like .eq("staff_id", …) never matches.
 *   - Definitions are any `id: "staff_…"` / `id: "yp_…"` object field. The
 *     union across all scoped files is the roster; integrity is checked
 *     repo-wide, not per-file (stores legitimately reference each other's
 *     people).
 *
 * When this fails: either the id is a typo for a real roster member (the
 * staff_naomi case — fix the reference), or the seed author invented a person
 * the story needs (the staff_jasmine case — add the roster entry). Never
 * silence one by widening ALLOWLIST without a comment saying why the
 * reference is legitimately unresolvable.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src", "lib");

// References that are legitimately unresolvable, each with its reason.
const ALLOWLIST = new Set([
  // calendar-seeds attendee: the record carries its own display name
  // ("Olivia Hayes") and ask-cara derives readable names from the id by
  // convention — there is deliberately no roster row behind it.
  "staff_olivia",
]);

// Fields whose string value is a person reference.
// Derived from the field names the seed actually uses to point at a person,
// not guessed. The original twenty covered `created_by` but not `updated_by`,
// and `child_id` but not `linked_child_id` — a phantom in either passed the
// guard in silence, which was confirmed by planting one.
const STAFF_REF_FIELDS = [
  "staff_id", "supervised_by", "created_by", "key_worker_id", "keyworker_id",
  "supervisor_id", "authored_by", "assigned_to", "worker_id", "owner_id",
  "rm_id", "recorded_by", "completed_by", "reviewed_by", "approved_by",
  "signed_off_by", "escalated_by", "raised_by", "led_by", "reported_by",
  "accessed_by", "acknowledged_by", "action_completed_by", "actor_id",
  "actor_staff_id", "administered_by", "admission_checked_by",
  "admission_witnessed_by", "agreed_by", "answeredBy", "appraiser_id",
  "assessed_by", "assessed_by_id", "assigned_manager_id", "audited_by",
  "authorised_by", "authorised_by_id", "buddy_id", "capturedBy", "changed_by",
  "checked_by", "collected_by", "committed_by", "completed_by_user_id",
  "conducted_by", "contributed_by", "cooked_by", "createdBy", "decision_by",
  "facilitated_by", "facilitator_id", "generated_by", "handled_by",
  "host_staff_id", "identified_by", "investigated_by", "issued_by",
  "last_audit_by", "lead_by", "line_manager_id", "linked_staff_id", "logged_by",
  "manager_id", "manager_responded_by", "manager_response_by", "observer_id",
  "organiser_id", "oversight_by", "prepared_by", "recipient_id",
  "registered_manager_id", "requester_id", "resolved_by",
  "responsible_individual_id", "return_interview_by", "returned_by",
  "reviewer_id", "ri_review_by", "rm_sign_off_by", "rtw_conducted_by_id",
  "secondary_worker_id", "sent_by", "set_by", "shopped_by", "staff_debrief_by",
  "started_by_user_id", "submitted_by", "target_staff_id", "updatedBy",
  "updated_by", "user_id", "verbal_verified_by", "verified_by", "witnessed_by",
  "yp_debrief_by",
];
const CHILD_REF_FIELDS = [
  "child_id", "childId", "yp_id", "young_person_id",
  "linked_child_id", "suggested_child_id",
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      walk(full, out);
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(ROOT).map((f) => ({ file: f, src: fs.readFileSync(f, "utf8") }));

// 1 · every defined person id, union across all scoped files
const defined = new Set();
for (const { src } of files) {
  for (const m of src.matchAll(/\bid:\s*"((?:staff|yp)_[a-z0-9_]+)"/g)) defined.add(m[1]);
}

// 2 · every reference; fail on those defined nowhere
const refRe = new RegExp(
  `\\b(${[...STAFF_REF_FIELDS, ...CHILD_REF_FIELDS].join("|")})\\s*:\\s*"((?:staff|yp)_[a-z0-9_]+)"`,
  "g",
);
const offenders = [];
for (const { file, src } of files) {
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    for (const m of lines[i].matchAll(refRe)) {
      const id = m[2];
      if (defined.has(id) || ALLOWLIST.has(id)) continue;
      offenders.push({
        loc: `${path.relative(path.join(__dirname, ".."), file)}:${i + 1}`,
        field: m[1],
        id,
      });
    }
  }
}

if (offenders.length > 0) {
  console.error(
    `check-seed-refs: ${offenders.length} seed reference(s) to a person id that is defined nowhere.\n` +
      `Fix the typo (reference a real roster id) or add the missing roster entry — a phantom id\n` +
      `renders as a raw "staff_…" string and drops the record from every per-person rollup:\n`,
  );
  for (const o of offenders) console.error(`  ✖ ${o.loc}  ${o.field}: "${o.id}"`);
  process.exit(1);
}

console.log(
  `check-seed-refs: all person references resolve (${defined.size} defined ids) ✓`,
);

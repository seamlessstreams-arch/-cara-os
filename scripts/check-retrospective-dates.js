#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Guard: a field that records WHEN SOMETHING HAPPENED must not accept a future
// date — in the form or at the API.
//
// Cara reads dates as fact. A future-dated incident sorts to the top of a
// child's chronology, counts inside "last 21 days" windows that have not
// happened yet, and moves the cumulative-risk and escalation-quality engines,
// which all measure recency. One mistyped year (2027 for 2026) does it, and
// nothing downstream can tell it from a real event.
//
// This is NOT a rule about dates in general. A review date, target date,
// expiry, next visit, planned admission, scheduled meeting or rota shift is
// legitimately in the future — bounding those would break real work. Only
// fields whose NAME states a past event are in scope, listed here one at a
// time so the judgement is auditable rather than inferred from a regex.
//
// Deliberately NOT in scope, each checked rather than assumed:
//   - a bare `date` field: ambiguous by name. The same identifier records a
//     past event on /incidents and a planned one on /rota, /shift-plan,
//     /menu-planning and the calendar. Adjudicating it centrally would be a
//     guess; it belongs to its page.
//   - meetingDate: /api/operations/multi-agency defaults `status` to
//     "scheduled", so meetings are genuinely booked ahead.
//   - independent-visitors visitDate: a visit may be planned. Not adjudicated.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require("node:fs");
const path = require("node:path");

// Fields where a future value is definitionally impossible.
const PAST_EVENT = [
  "incidentDate", "incident_date",
  "eventDate", "event_date",
  "debriefDate", "debrief_date",
  "assessmentDate", "assessment_date",
  "dateReceived", "date_received",
  "dateOccurred", "date_occurred",
  "reportedDate", "date_reported",
  "recordDate", "recordedDate",
  "referralDate", "referral_date",
  "shiftDate", "shift_date",
  "date_imposed",
  "date_of_birth",
  "visit_date", // reg44 statutory visit — the visit has been made
];

function* walk(dir, filter) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      yield* walk(full, filter);
    } else if (filter(entry.name)) {
      yield full;
    }
  }
}

const violations = [];

// ── Leg 1: UI — a past-event date input must carry max ──────────────────────
for (const file of walk("src", (n) => /\.tsx$/.test(n) && !/\.(test|spec)\.tsx$/.test(n))) {
  const text = fs.readFileSync(file, "utf8");
  if (!text.includes('type="date"')) continue;
  const rel = file.split(path.sep).join("/");
  const re = /<[Ii]nput[^>]*type="date"[^>]*>/gs;
  let m;
  while ((m = re.exec(text))) {
    const tag = m.group ?? m[0];
    if (/\bmax=/.test(tag)) continue;
    const v = /value=\{([^}]{0,80})\}/.exec(tag);
    if (!v) continue;
    const field = v[1].replace(/^.*\./, "").replace(/ \?\? ""/, "").trim();
    if (!PAST_EVENT.includes(field)) continue;
    const line = text.slice(0, m.index).split("\n").length;
    violations.push(`${rel}:${line}  <input type="date"> for ${field} has no max — add max={todayStr()}`);
  }
}

// ── Leg 2: API — a POST accepting a past-event field must reject the future ──
for (const file of walk("src/app/api", (n) => n === "route.ts")) {
  const text = fs.readFileSync(file, "utf8");
  if (!/export\s+async\s+function\s+POST/.test(text)) continue;
  if (text.includes("rejectFutureDates")) continue;
  const rel = file.split(path.sep).join("/");
  const taken = PAST_EVENT.filter((f) => new RegExp(`\\bbody\\.${f}\\b`).test(text));
  if (taken.length === 0) continue;
  violations.push(
    `${rel}  POST accepts ${taken.join(", ")} without rejectFutureDates(body, [...])`
  );
}

if (violations.length) {
  console.error(
    `check-retrospective-dates: ${violations.length} site(s) accept a future date for a past event.\n` +
      `A record of something that happened cannot be dated ahead — it sorts to the top of the\n` +
      `child's chronology and lands inside recency windows that have not occurred. Bound the\n` +
      `input with max={todayStr()} and reject it server-side with rejectFutureDates from\n` +
      `@/lib/http/retrospective-dates.\n`
  );
  for (const v of violations) console.error("  " + v);
  process.exit(1);
}
console.log("check-retrospective-dates: every past-event date field is bounded in the form and at the API.");

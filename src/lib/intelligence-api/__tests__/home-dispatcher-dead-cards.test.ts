import { describe, it, expect } from "vitest";
import { dispatchHomeHandler } from "../home-dispatcher";

// Regression guard for the dead-card fix (fix/dispatcher-dead-cards).
//
// During the 303-route → catch-all consolidation, the generator dropped several
// pure module-level helper functions (isNightTime, parseMood, deriveSleepQuality,
// mapRefStatus, deriveIsSatisfactory). Their absence made these UI-consumed
// dashboard cards throw ReferenceError at runtime → HTTP 500. The helpers were
// restored (exact originals from the pre-consolidation source, commit d2188c87^).
//
// Each handler must now EXECUTE against the seeded store and return 200 + data.
const RESTORED = [
  "wellbeing-intelligence",
  "keyworker-intelligence",
  "night-safety-intelligence",
  "safer-recruitment-intelligence",
];

describe("home-dispatcher — restored dead-card handlers", () => {
  for (const slug of RESTORED) {
    it(`${slug} runs without ReferenceError and returns 200 + data`, async () => {
      const handler = dispatchHomeHandler(slug);
      expect(handler).toBeTruthy();
      const res = await handler!();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("data");
      expect(body.data).toBeTruthy();
    });
  }
});

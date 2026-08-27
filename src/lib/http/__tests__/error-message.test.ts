import { describe, it, expect } from "vitest";
import { errorMessage, errorStatus, errorName } from "../error-message";

// Handlers used to read `err.message` off a `catch (err: any)`. That is right
// for an Error and undefined for every other kind of throw, and
// `{ error: undefined }` serialises to no key at all — a failure reported with
// nothing said about it.

describe("errorMessage", () => {
  it("uses an Error's own message", () => {
    expect(errorMessage(new Error("child record not found"))).toBe("child record not found");
  });

  it("reads a thrown string", () => {
    expect(errorMessage("upstream timed out")).toBe("upstream timed out");
  });

  it("reads a message off a plain object — a Supabase error is not an Error", () => {
    expect(errorMessage({ message: "permission denied for table incidents" }))
      .toBe("permission denied for table incidents");
  });

  it("never returns an empty string for an empty throw", () => {
    for (const thrown of [null, undefined, {}, "", "   ", new Error(""), { message: "" }, 42]) {
      expect(errorMessage(thrown)).toBe("Internal server error");
    }
  });

  it("uses the caller's fallback when one is given", () => {
    expect(errorMessage(null, "Could not load the rota")).toBe("Could not load the rota");
  });
});

describe("errorStatus", () => {
  it("honours a plausible error status", () => {
    expect(errorStatus({ statusCode: 429 })).toBe(429);
  });

  it("ignores a status NextResponse would reject, rather than passing it on", () => {
    // `err?.statusCode ?? 500` handed these straight to NextResponse.json,
    // which throws a RangeError — the handled error became an unhandled one.
    for (const bad of [0, 200, 999, -1, 1.5, "500", null, undefined, {}]) {
      expect(errorStatus({ statusCode: bad })).toBe(500);
    }
    expect(errorStatus(new Error("no status"))).toBe(500);
  });

  it("uses the caller's fallback", () => {
    expect(errorStatus(null, 503)).toBe(503);
  });
});

describe("errorName", () => {
  it("reads an Error's name and a plain object's", () => {
    expect(errorName(new TypeError("x"))).toBe("TypeError");
    expect(errorName({ name: "AbortError" })).toBe("AbortError");
  });

  it("is an empty string when there is no name to read", () => {
    expect(errorName("just a string")).toBe("");
    expect(errorName(null)).toBe("");
  });
});

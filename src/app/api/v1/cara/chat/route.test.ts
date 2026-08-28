import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

// The Cara Intelligence Centre used to mount a panel whose ask handler was an
// empty function, so a manager got nothing back at all. It now mounts the same
// deterministic surface as the Ask Cara page, which runs through here. These
// pin the part that matters: it answers from records, and it says so honestly
// when it cannot.

function ask(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/v1/cara/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: "ask", natural: false, ...body }),
  });
}

describe("POST /api/v1/cara/chat — deterministic ask", () => {
  it("answers a question about the home from its records", async () => {
    const res = await POST(ask({
      prompt: "Which children are currently placed?",
      role: "registered_manager",
    }));
    expect(res.status).toBe(200);
    const { answer } = await res.json();
    expect(answer.text.length).toBeGreaterThan(0);
    expect(answer.engineVersion).toBeTruthy();
  });

  it("labels what it says, so a reader can tell a fact from an interpretation", async () => {
    const res = await POST(ask({
      prompt: "Which children are currently placed?",
      role: "registered_manager",
    }));
    const { answer } = await res.json();
    expect(Array.isArray(answer.labelled)).toBe(true);
    const labels = new Set(answer.labelled.map((l: { label: string }) => l.label));
    for (const label of labels) {
      expect(["fact", "account", "analysis", "hypothesis", "action", "context"]).toContain(label);
    }
  });

  it("returns an answer object even for a question it cannot answer", async () => {
    const res = await POST(ask({
      prompt: "What will the weather be next Tuesday?",
      role: "registered_manager",
    }));
    expect(res.status).toBe(200);
    const { answer } = await res.json();
    // Honest refusal is still an answer — never an empty body the UI cannot show.
    expect(typeof answer.answered).toBe("boolean");
    expect(answer.text.length).toBeGreaterThan(0);
  });
});

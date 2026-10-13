import { describe, it, expect } from "vitest";
import { buildNotebookMindMap, type MindMapInput } from "../notebook/notebook-mindmap";

function input(over: Partial<MindMapInput> = {}): MindMapInput {
  return {
    childName: "Alex River",
    services: {},
    keyConnectors: [],
    trustedAdults: [],
    riskThemes: [],
    strengths: [],
    ...over,
  };
}
const group = (m: ReturnType<typeof buildNotebookMindMap>, key: string) => m.groups.find((g) => g.key === key)!;

describe("notebook mind map", () => {
  it("maps an empty child to empty groups with an honest note", () => {
    const m = buildNotebookMindMap(input());
    expect(m.groups.map((g) => g.key)).toEqual(["people", "risks", "strengths", "services"]);
    expect(m.groups.every((g) => g.nodes.length === 0)).toBe(true);
    expect(m.note).toMatch(/nothing to map yet/i);
  });

  it("builds people from key connectors then trusted adults, de-duplicated by name", () => {
    const m = buildNotebookMindMap(input({
      keyConnectors: [{ name: "Olivia", connections: 4 }],
      trustedAdults: ["Olivia", "Marcus"],
    }));
    const people = group(m, "people").nodes;
    expect(people.map((n) => n.label)).toEqual(["Olivia", "Marcus"]); // Olivia once
    expect(people[0].sub).toMatch(/4 connections/);
    expect(people[1].sub).toBe("trusted adult");
  });

  it("maps services from the child record", () => {
    const m = buildNotebookMindMap(input({ services: { school: "Oak Academy", socialWorker: "J. Smith", legalStatus: "Section 20" } }));
    const svc = group(m, "services").nodes;
    expect(svc.map((n) => n.label)).toEqual(["Oak Academy", "J. Smith", "Section 20"]);
    expect(svc.find((n) => n.label === "Oak Academy")!.sub).toBe("school");
  });

  it("de-duplicates and caps risks, and reports a populated note", () => {
    const m = buildNotebookMindMap(input({ riskThemes: ["going missing", "Going Missing", "substance use"] }));
    expect(group(m, "risks").nodes.map((n) => n.label)).toEqual(["going missing", "substance use"]);
    expect(m.note).toMatch(/already on file/i);
  });

  it("is deterministic", () => {
    const i = input({ keyConnectors: [{ name: "Olivia", connections: 2 }], riskThemes: ["aggression"] });
    expect(buildNotebookMindMap(i)).toEqual(buildNotebookMindMap(i));
  });
});

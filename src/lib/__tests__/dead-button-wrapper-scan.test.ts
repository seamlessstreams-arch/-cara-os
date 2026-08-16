// ══════════════════════════════════════════════════════════════════════════════
// CARA OS — DEAD-BUTTON GUARD: the wrapper scanner
//
// A <Button> with no handler is only dead if nothing around it carries the
// action. Three parents do: <Link>, a Radix *Trigger, and a plain <a href>.
// Getting that judgement wrong is expensive in BOTH directions, and this guard
// has now been wrong in both:
//
//   - Too narrow (#935): it did not know about <a href> wrappers, so it
//     reported 7 working exports as dead — including every recruitment CSV.
//   - Too narrow again (#937): `<Link[^>]*>` stops at the FIRST '>', which in
//     `<Link href={x} onClick={(e) => e.stop()}>` is the one inside the arrow
//     function. A correctly wrapped link therefore read as unwrapped. Same
//     `[^>]*` trap that once broke the retrospective-date codemod.
//
// So the scanner is exercised directly rather than trusted. The over-broad
// direction matters just as much: a dead button that merely FOLLOWS a closed
// <Link>…</Link> must still be caught, or the exemption swallows real defects.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/** Runs the real guard over a throwaway page and returns the labels it flags. */
function flaggedLabels(pageBody: string): string[] {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "deadbtn-"));
  const dir = path.join(root, "src", "app", "(platform)", "probe");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "page.tsx"), pageBody);

  let out = "";
  try {
    out = execFileSync("node", [path.join(process.cwd(), "scripts", "check-dead-buttons.js")], {
      cwd: root,
      encoding: "utf8",
    });
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string };
    out = `${e.stdout ?? ""}\n${e.stderr ?? ""}`;
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }

  return [...out.matchAll(/"([^"]+)" has no onClick/g)].map((m) => m[1]);
}

const page = (jsx: string) => `"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export default function Probe() {
  return (<div>${jsx}</div>);
}
`;

describe("dead-button guard — wrapper detection", () => {
  it("flags a button with no handler and no wrapper", () => {
    expect(flaggedLabels(page(`<Button variant="outline">Bare Dead</Button>`))).toContain("Bare Dead");
  });

  it("exempts a <Link> wrapper whose tag contains an arrow function", () => {
    // The #937 regression: `[^>]*` stopped at the '>' in `(e) =>`.
    const jsx = `<Link href="/y" onClick={(e) => e.stopPropagation()}><Button variant="outline">Wrapped Arrow</Button></Link>`;
    expect(flaggedLabels(page(jsx))).not.toContain("Wrapped Arrow");
  });

  it("exempts a plain <Link> wrapper", () => {
    expect(flaggedLabels(page(`<Link href="/y"><Button variant="outline">Wrapped Plain</Button></Link>`)))
      .not.toContain("Wrapped Plain");
  });

  it("exempts an <a href> wrapper — the anchor carries the action", () => {
    const jsx = `<a href="/api/v1/x/export" download><Button variant="outline">Anchor Export</Button></a>`;
    expect(flaggedLabels(page(jsx))).not.toContain("Anchor Export");
  });

  it("still flags a dead button that merely FOLLOWS a closed <Link>", () => {
    // The over-broad direction. Nearest-opener-wins would wrongly exempt this.
    const jsx = `<Link href="/x">Go</Link><Button variant="outline">After Closed Link</Button>`;
    expect(flaggedLabels(page(jsx))).toContain("After Closed Link");
  });

  it("does not treat a self-closing <Link /> as a wrapper", () => {
    const jsx = `<Link href="/x" /><Button variant="outline">After Self Closing</Button>`;
    expect(flaggedLabels(page(jsx))).toContain("After Self Closing");
  });

  it("requires an href on an <a> before exempting", () => {
    expect(flaggedLabels(page(`<a className="x"><Button variant="outline">Anchor No Href</Button></a>`)))
      .toContain("Anchor No Href");
  });

  it("does not flag a button that is disabled, or has its own handler", () => {
    const jsx = `
      <Button variant="outline" disabled>Honestly Off</Button>
      <Button variant="outline" onClick={() => save()}>Has Handler</Button>`;
    expect(flaggedLabels(page(jsx))).toEqual([]);
  });
});

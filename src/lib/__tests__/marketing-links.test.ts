import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

// ─────────────────────────────────────────────────────────────────────────────
// Guard: the marketing site must never link to a route that doesn't exist.
//
// The product tour promises "every mockup is a real page; click any one to step
// straight into it" — then step 06 pointed at /workforce/oversight-workflow,
// which never existed (the real route is top-level /oversight-workflow). A
// prospect clicking the screenshot landed on a 404. Nothing caught it because
// hrefs are just strings.
//
// This resolves every internal link in the marketing pages against the real
// App Router tree, the same way Next does (route groups like "(platform)" are
// transparent in the URL).
// ─────────────────────────────────────────────────────────────────────────────

const APP = path.join(process.cwd(), "src", "app");

/** Every real route, derived from the page.tsx tree (route groups stripped). */
function realRoutes(): Set<string> {
  const routes = new Set<string>();
  const walk = (dir: string, url: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "api" || entry.name.startsWith("_")) continue;
        // "(group)" segments are organisational — invisible in the URL.
        const seg = entry.name.startsWith("(") && entry.name.endsWith(")") ? "" : `/${entry.name}`;
        walk(full, url + seg);
      } else if (entry.name === "page.tsx") {
        routes.add(url === "" ? "/" : url);
      }
    }
  };
  walk(APP, "");
  return routes;
}

/** Internal hrefs used by the public marketing pages + shared marketing UI. */
function marketingLinks(): { href: string; file: string }[] {
  const files: string[] = [];
  const collect = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) collect(full);
      else if (entry.name.endsWith(".tsx")) files.push(full);
    }
  };
  for (const d of [
    path.join(APP, "product"),
    path.join(process.cwd(), "src", "components", "marketing"),
  ]) {
    if (fs.existsSync(d)) collect(d);
  }
  for (const f of ["page.tsx", "pricing/page.tsx", "about/page.tsx", "security/page.tsx", "contact/page.tsx"]) {
    const full = path.join(APP, f);
    if (fs.existsSync(full)) files.push(full);
  }

  const out: { href: string; file: string }[] = [];
  for (const file of files) {
    const src = fs.readFileSync(file, "utf8");
    // Both JSX (href="/x") and data-object (href: "/x") forms.
    for (const re of [/href="(\/[^"#?]*)/g, /href:\s*"(\/[^"#?]*)/g]) {
      for (const m of src.matchAll(re)) {
        const href = m[1] === "" ? "/" : m[1].replace(/\/$/, "") || "/";
        out.push({ href, file: path.relative(process.cwd(), file) });
      }
    }
  }
  return out;
}

describe("marketing links resolve to real routes", () => {
  const routes = realRoutes();

  it("finds the App Router tree", () => {
    expect(routes.size).toBeGreaterThan(100);
    expect(routes.has("/")).toBe(true);
    expect(routes.has("/product/tour")).toBe(true);
  });

  it("every internal marketing link points at a page that exists", () => {
    const links = marketingLinks();
    expect(links.length).toBeGreaterThan(10); // the extractor itself must work

    const dead = links.filter(({ href }) => {
      if (routes.has(href)) return false;
      // Tolerate dynamic segments: /children/[id] matches /children/yp_alex.
      const parts = href.split("/").filter(Boolean);
      return ![...routes].some((r) => {
        const rp = r.split("/").filter(Boolean);
        return rp.length === parts.length &&
          rp.every((seg, i) => seg.startsWith("[") || seg === parts[i]);
      });
    });

    expect(dead.map((d) => `${d.href}  (linked from ${d.file})`)).toEqual([]);
  });
});

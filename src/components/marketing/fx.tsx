"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — MARKETING FX PRIMITIVES
// The public site's motion vocabulary: scroll-choreographed reveals, true-3D
// pointer-tilt cards, count-up stats, an infinite marquee and the aurora
// scroll-progress hairline. Pure React + rAF + IntersectionObserver — no
// animation dependencies. Everything respects prefers-reduced-motion (the CSS
// side collapses transitions; the JS side checks before animating).
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useState } from "react";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// ── Reveal — adds .mk-in when the element scrolls into view ──────────────────
export function Reveal({
  children,
  delay = 0,
  scale = false,
  as: Tag = "div",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  scale?: boolean;
  as?: "div" | "section" | "li" | "span";
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) { el.classList.add("mk-in"); return; }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { e.target.classList.add("mk-in"); io.unobserve(e.target); }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    // Fail-open: if the observer never fires (capture contexts, odd engines),
    // content must still appear — hidden marketing copy is worse than a
    // missed entrance.
    const failsafe = window.setTimeout(() => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("mk-in");
    }, 1400);
    return () => { io.disconnect(); window.clearTimeout(failsafe); };
  }, []);
  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={`mk-reveal ${scale ? "mk-reveal-scale" : ""} ${className}`}
      style={{ "--mk-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}

// ── TiltCard — pointer-tracked 3D tilt with a travelling glare ───────────────
export function TiltCard({
  children,
  className = "",
  max = 7,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) translateY(-2px)`;
        el.style.setProperty("--mk-gx", `${px * 100}%`);
        el.style.setProperty("--mk-gy", `${py * 100}%`);
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.transform = "";
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [max]);
  return (
    <div ref={ref} className={`mk-tilt relative ${className}`}>
      {children}
      <span className="mk-tilt-glare" aria-hidden />
    </div>
  );
}

// ── CountUp — animates a number when it enters the viewport ─────────────────
export function CountUp({
  to,
  duration = 1600,
  prefix = "",
  suffix = "",
  className = "",
}: {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) { setVal(to); return; }
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(to * eased));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, duration]);
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}{val.toLocaleString()}{suffix}
    </span>
  );
}

// ── Marquee — seamless infinite band (content duplicated for the loop) ───────
export function Marquee({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mk-marquee ${className}`} aria-hidden="false">
      <div className="mk-marquee-track">{children}</div>
      <div className="mk-marquee-track" aria-hidden="true">{children}</div>
    </div>
  );
}

// ── ScrollProgress — the aurora hairline tracking page position ─────────────
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        el.style.setProperty("--mk-progress", String(max > 0 ? h.scrollTop / max : 0));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); };
  }, []);
  return <div ref={ref} className="mk-progress mk-aurora-line" aria-hidden />;
}

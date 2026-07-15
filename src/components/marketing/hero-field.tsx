"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HERO CONSTELLATION FIELD
// A living 3D constellation: ~300 nodes (one per deterministic engine) on a
// slowly-turning sphere, projected onto a 2D canvas with depth-scaled size and
// alpha, near-threshold linking lines, and gentle pointer parallax. Hand-rolled
// projection — no WebGL, no dependencies — so it costs nothing at build and
// degrades to a beautiful static frame under prefers-reduced-motion.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef } from "react";

type P3 = { x: number; y: number; z: number; hue: number; r: number };

const AURORA = [
  [45, 212, 191], // teal
  [96, 165, 250], // blue
  [167, 139, 250], // violet
  [212, 175, 55], // cara gold — the rare warm node
] as const;

function buildSphere(count: number): P3[] {
  // Fibonacci sphere — even coverage, organic feel.
  const pts: P3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const theta = phi * i;
    // Deterministic pseudo-random per index (no Math.random — stable frames).
    const h = (i * 2654435761) % 100;
    pts.push({
      x: Math.cos(theta) * rad,
      y,
      z: Math.sin(theta) * rad,
      hue: h < 6 ? 3 : h % 3, // ~6% gold, rest aurora
      r: 1.1 + ((i * 7919) % 10) / 9,
    });
  }
  return pts;
}

export function HeroField({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pts = buildSphere(300);
    let w = 0, h = 0, dpr = 1, raf = 0;
    let rotY = 0.4, rotX = -0.18;
    let targetPX = 0, targetPY = 0, px = 0, py = 0;
    let running = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      const R = Math.min(w, h) * 0.42;
      px += (targetPX - px) * 0.04;
      py += (targetPY - py) * 0.04;
      const ry = rotY + px * 0.35;
      const rx = rotX + py * 0.22;
      const sy = Math.sin(ry), cyr = Math.cos(ry);
      const sx = Math.sin(rx), cxr = Math.cos(rx);

      // project
      const proj: { x: number; y: number; s: number; a: number; p: P3 }[] = [];
      for (const p of pts) {
        // rotate Y then X
        const x1 = p.x * cyr + p.z * sy;
        const z1 = -p.x * sy + p.z * cyr;
        const y2 = p.y * cxr - z1 * sx;
        const z2 = p.y * sx + z1 * cxr;
        const depth = (z2 + 1.6) / 2.6; // 0 far → 1 near
        proj.push({ x: cx + x1 * R, y: cy + y2 * R * 0.94, s: depth, a: 0.12 + depth * 0.78, p });
      }

      // near-threshold links, drawn first (behind nodes)
      ctx.lineWidth = 0.6;
      for (let i = 0; i < proj.length; i += 3) {
        const a = proj[i];
        if (a.s < 0.55) continue;
        for (let j = i + 3; j < Math.min(i + 45, proj.length); j += 3) {
          const b = proj[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 5200) {
            const al = (1 - d2 / 5200) * 0.16 * Math.min(a.s, b.s);
            ctx.strokeStyle = `rgba(120,160,240,${al.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // nodes with a slow shimmer
      for (const q of proj) {
        const [r, g, b] = AURORA[q.p.hue];
        const tw = reduced ? 1 : 0.82 + 0.18 * Math.sin(t / 1400 + q.p.x * 5 + q.p.y * 7);
        const rad = q.p.r * (0.5 + q.s) * tw;
        ctx.fillStyle = `rgba(${r},${g},${b},${(q.a * tw).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(q.x, q.y, rad, 0, Math.PI * 2);
        ctx.fill();
        if (q.p.hue === 3 && q.s > 0.7) {
          // gold nodes glow softly — the lights on in the home
          ctx.fillStyle = `rgba(${r},${g},${b},0.10)`;
          ctx.beginPath();
          ctx.arc(q.x, q.y, rad * 3.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const loop = (t: number) => {
      if (!running) return;
      rotY += 0.00042;
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetPX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetPY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    // Pause when off-screen — never burn frames the visitor can't see.
    const vis = new IntersectionObserver((entries) => {
      const on = entries.some((e) => e.isIntersecting);
      if (on && !running && !reduced) { running = true; raf = requestAnimationFrame(loop); }
      if (!on) { running = false; cancelAnimationFrame(raf); }
    });

    resize();
    window.addEventListener("resize", resize);
    if (reduced) {
      draw(0); // one perfect still frame
    } else {
      window.addEventListener("pointermove", onPointer, { passive: true });
      vis.observe(canvas);
      raf = requestAnimationFrame(loop);
    }
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      vis.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}

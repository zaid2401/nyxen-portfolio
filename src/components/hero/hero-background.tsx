"use client";

import { useEffect, useRef } from "react";
import { useSystem } from "@/components/system/system-provider";
import { useIsCompact, usePointerFine } from "@/hooks/use-media-query";

/**
 * The hero's node field.
 *
 * A 2D canvas, not Three.js — this is a flat network of points and lines, and
 * pulling in a WebGL renderer for it would cost hundreds of kilobytes to draw
 * something canvas already draws well. The library budget is spent where it
 * earns its place.
 *
 * Cost control, in order of importance:
 *  • Nothing runs at all unless motion is enabled (effects on, reduced-motion off).
 *  • An IntersectionObserver stops the loop the moment the hero leaves the
 *    viewport, and `visibilitychange` stops it on a background tab.
 *  • Pointer attraction is only wired up for fine pointers.
 *  • Node count and connection radius drop on small screens.
 *  • Device pixel ratio is capped at 2 — a 3x phone display gains nothing here.
 */

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Home position; nodes are elastically tethered so the field never drifts. */
  hx: number;
  hy: number;
  r: number;
}

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { motionEnabled } = useSystem();
  const compact = useIsCompact();
  const fine = usePointerFine();

  useEffect(() => {
    if (!motionEnabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const NODE_COUNT = compact ? 24 : 58;
    const LINK_DISTANCE = compact ? 108 : 142;
    const POINTER_RADIUS = 180;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let nodes: Node[] = [];
    let frame = 0;
    let running = true;

    const pointer = { x: -9999, y: -9999, active: false };

    function seed() {
      // A jittered grid, so coverage is even but the result never looks like
      // a grid. Random placement clumps; a pure grid looks mechanical.
      const columns = Math.ceil(Math.sqrt(NODE_COUNT * (width / height || 1)));
      const rows = Math.ceil(NODE_COUNT / columns);
      nodes = [];

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          if (nodes.length >= NODE_COUNT) break;
          const x =
            ((col + 0.5) / columns) * width +
            (Math.random() - 0.5) * (width / columns) * 0.8;
          const y =
            ((row + 0.5) / rows) * height +
            (Math.random() - 0.5) * (height / rows) * 0.8;
          nodes.push({
            x,
            y,
            hx: x,
            hy: y,
            vx: (Math.random() - 0.5) * 0.12,
            vy: (Math.random() - 0.5) * 0.12,
            r: Math.random() * 1.1 + 0.7,
          });
        }
      }
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);

      for (const node of nodes) {
        // Drift.
        node.x += node.vx;
        node.y += node.vy;

        // Tether back home — keeps the composition stable over minutes.
        node.vx += (node.hx - node.x) * 0.0006;
        node.vy += (node.hy - node.y) * 0.0006;

        if (pointer.active) {
          const dx = pointer.x - node.x;
          const dy = pointer.y - node.y;
          const distance = Math.hypot(dx, dy);
          if (distance < POINTER_RADIUS && distance > 0.5) {
            // Gentle attraction, strongest at the centre of the radius.
            const force = (1 - distance / POINTER_RADIUS) * 0.035;
            node.vx += (dx / distance) * force;
            node.vy += (dy / distance) * force;
          }
        }

        node.vx *= 0.982;
        node.vy *= 0.982;
      }

      // Links.
      ctx!.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.hypot(dx, dy);
          if (distance > LINK_DISTANCE) continue;

          const strength = 1 - distance / LINK_DISTANCE;
          ctx!.strokeStyle = `rgba(47, 224, 166, ${(strength * 0.16).toFixed(3)})`;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
      }

      // Nodes.
      for (const node of nodes) {
        const near = pointer.active
          ? Math.hypot(pointer.x - node.x, pointer.y - node.y) < POINTER_RADIUS
          : false;
        ctx!.fillStyle = near
          ? "rgba(47, 224, 166, 0.75)"
          : "rgba(160, 180, 200, 0.32)";
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      frame = requestAnimationFrame(draw);
    }

    function start() {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(draw);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(frame);
    }

    function onPointerMove(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    }

    function onPointerLeave() {
      pointer.active = false;
    }

    resize();
    frame = requestAnimationFrame(draw);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    // Stop drawing the instant the hero is off-screen.
    const visibility = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    visibility.observe(canvas);

    const onVisibilityChange = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibilityChange);

    if (fine) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("pointerleave", onPointerLeave);
    }

    return () => {
      stop();
      resizeObserver.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [motionEnabled, compact, fine]);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {/* Static substrate — always present, so turning effects off leaves a
          composed background rather than an empty rectangle. */}
      <div className="grid-field absolute inset-0 opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(47,224,166,0.07),transparent_58%)]" />
      <div className="from-void absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t to-transparent" />

      {motionEnabled && (
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      )}
    </div>
  );
}

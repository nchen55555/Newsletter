"use client";

import { useEffect, useRef } from "react";

/**
 * NeuralRainbowNetwork
 * A neuron-like network with rainbow spike pulses that travel along curved axons.
 */
type Props = {
  width?: number;            // if omitted, fills parent
  height?: number;           // if omitted, fills parent
  nodeCount?: number;        // number of neurons
  avgDegree?: number;        // avg outgoing links per node
  seedEveryMs?: number;      // how often to trigger a random seed spike
  pulseSpeed?: number;       // px per second along links
  className?: string;
};

type Node = {
  x: number; y: number; r: number;
  vx: number; vy: number;
  lastSpikeAt: number;       // ms timestamp
  refractoryUntil: number;   // ms timestamp
};

type Link = {
  from: number; to: number;
  // curve control (quadratic)
  cx: number; cy: number;
  length: number;            // cached pixel length
  lastPulseAt: number;       // ms timestamp of most recent pulse (for glow decay)
};

type Pulse = {
  linkIndex: number;
  t: number;                 // 0..1 along the curve
  hue0: number;              // starting hue
  bornAt: number;            // ms
};

export default function NeuralRainbowNetwork({
  width,
  height,
  nodeCount = 50,
  avgDegree = 2.8,
  seedEveryMs = 1000,
  pulseSpeed = 300,
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const linksRef = useRef<Link[]>([]);
  const pulsesRef = useRef<Pulse[]>([]);
  const t0Ref = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const lastSeedRef = useRef<number>(0);

  // ---------- sizing ----------
  const fit = () => {
    const c = canvasRef.current!;
    const parent = c.parentElement!;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const W = width ?? parent.getBoundingClientRect().width;
    const H = height ?? parent.getBoundingClientRect().height;
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    c.style.width = `${W}px`;
    c.style.height = `${H}px`;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  // Helpers
  const qPoint = (t: number, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number) => {
    const mt = 1 - t;
    const x = mt * mt * x0 + 2 * mt * t * cx + t * t * x1;
    const y = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
    return { x, y };
  };

  const approxQuadLength = (x0: number, y0: number, cx: number, cy: number, x1: number, y1: number) => {
    // quick polyline approximation
    const STEPS = 24;
    let len = 0;
    let prev = { x: x0, y: y0 };
    for (let i = 1; i <= STEPS; i++) {
      const t = i / STEPS;
      const p = qPoint(t, x0, y0, cx, cy, x1, y1);
      const dx = p.x - prev.x, dy = p.y - prev.y;
      len += Math.hypot(dx, dy);
      prev = p;
    }
    return len;
  };

  // ---------- layout ----------
  const init = () => {
    const c = canvasRef.current!;
    const { width: W, height: H } = c.getBoundingClientRect();

    // Place nodes in loose lobes/clusters
    const nodes: Node[] = [];
    const lobes = 3;
    const perLobe = Math.ceil(nodeCount / lobes);
    const center = { x: W / 2, y: H / 2 };
    let created = 0;

    for (let l = 0; l < lobes; l++) {
      const angle = (l / lobes) * Math.PI * 2 + Math.random() * 0.4;
      const radius = Math.min(W, H) * (0.22 + 0.20 * Math.random()); // Increased from 0.16 + 0.15
      const lcx = center.x + Math.cos(angle) * radius;
      const lcy = center.y + Math.sin(angle) * radius;
      const count = Math.min(perLobe, nodeCount - created);

      for (let i = 0; i < count; i++) {
        const jitterR = (Math.random() ** 0.6) * Math.min(W, H) * 0.25; // Increased from 0.18
        const jitterA = Math.random() * Math.PI * 2;
        const x = lcx + Math.cos(jitterA) * jitterR;
        const y = lcy + Math.sin(jitterA) * jitterR;
        nodes.push({
          x: Math.max(25, Math.min(W - 25, x)), // Reduced margin from 30 to 25
          y: Math.max(25, Math.min(H - 25, y)),
          r: 6 + Math.random() * 4, // Increased from 5 + 3 to 6 + 4 for bigger nodes
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          lastSpikeAt: -1e9,
          refractoryUntil: -1e9,
        });
        created++;
        if (created >= nodeCount) break;
      }
    }

    // Build directed links favoring nearby (axon-like)
    const links: Link[] = [];
    const tried = new Set<string>();
    const kOut = Math.max(1, Math.round(avgDegree));

    for (let i = 0; i < nodes.length; i++) {
      // nearest neighbors
      const dists = nodes
        .map((n, j) => ({
          j,
          d: i === j ? Infinity : (nodes[i].x - n.x) ** 2 + (nodes[i].y - n.y) ** 2,
        }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 10);

      const out = 1 + Math.floor(Math.random() * (kOut + 1)); // 1..kOut+1
      for (let m = 0; m < out; m++) {
        const pick = dists[(Math.random() * Math.min(10, dists.length)) | 0].j;
        if (pick === i) continue;
        const a = i, b = pick;
        const key = `${a}->${b}`;
        if (tried.has(key)) continue;
        tried.add(key);

        // curve control: mid plus perpendicular offset
        const nA = nodes[a], nB = nodes[b];
        const mx = (nA.x + nB.x) / 2;
        const my = (nA.y + nB.y) / 2;
        const dx = nB.x - nA.x, dy = nB.y - nA.y;
        const dist = Math.hypot(dx, dy);
        const nx = -dy / (dist || 1), ny = dx / (dist || 1);
        const bulge = Math.min(40, 14 + dist * 0.08) * (Math.random() < 0.5 ? 1 : -1);
        const cx = mx + nx * bulge;
        const cy = my + ny * bulge;

        links.push({
          from: a,
          to: b,
          cx, cy,
          length: approxQuadLength(nA.x, nA.y, cx, cy, nB.x, nB.y),
          lastPulseAt: -1e9,
        });
      }
    }

    nodesRef.current = nodes;
    linksRef.current = links;
    pulsesRef.current = [];
    t0Ref.current = performance.now();
    lastSeedRef.current = t0Ref.current;
  };

  // ---------- spiking ----------
  const seedSpike = (now: number) => {
    const nodes = nodesRef.current;
    if (nodes.length === 0) return;
    const idx = (Math.random() * nodes.length) | 0;
    triggerSpike(idx, now);
  };

  const triggerSpike = (nodeIndex: number, now: number) => {
    const node = nodesRef.current[nodeIndex];
    if (now < node.refractoryUntil) return; // still cooling down
    node.lastSpikeAt = now;
    node.refractoryUntil = now + 800 + Math.random() * 600;

    // enqueue pulses on all outgoing links
    linksRef.current.forEach((L, i) => {
      if (L.from !== nodeIndex) return;
      pulsesRef.current.push({
        linkIndex: i,
        t: 0,
        hue0: (now / 1000 * 120 + nodeIndex * 11.3) % 360,
        bornAt: now,
      });
      L.lastPulseAt = now;
    });
  };

  // ---------- drawing ----------
  const drawLink = (ctx: CanvasRenderingContext2D, L: Link, now: number) => {
    const a = nodesRef.current[L.from];
    const b = nodesRef.current[L.to];

    // base axon: very light gray
    ctx.strokeStyle = "rgba(17,24,39,0.06)";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(L.cx, L.cy, b.x, b.y);
    ctx.stroke();

    // residual glow if a pulse passed recently
    const since = now - L.lastPulseAt;
    if (since < 700) {
      const alpha = 0.18 * (1 - since / 700);
      const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      const base = (now / 1000 * 40) % 360;
      grad.addColorStop(0, `hsla(${base}, 80%, 75%, ${alpha})`);
      grad.addColorStop(1, `hsla(${(base + 120) % 360}, 80%, 75%, ${alpha})`);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(L.cx, L.cy, b.x, b.y);
      ctx.stroke();
      ctx.restore();
    }
  };

  const drawPulse = (ctx: CanvasRenderingContext2D, P: Pulse, now: number) => {
    const L = linksRef.current[P.linkIndex];
    const nA = nodesRef.current[L.from];
    const nB = nodesRef.current[L.to];

    const { x, y } = qPoint(P.t, nA.x, nA.y, L.cx, L.cy, nB.x, nB.y);

    const age = now - P.bornAt;
    const hue = (P.hue0 + age * 0.06) % 360;

    // trail (faint)
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `hsla(${hue}, 85%, 70%, 0.25)`;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    // short backward segment for a comet tail
    const tBack = Math.max(0, P.t - 0.04);
    const back = qPoint(tBack, nA.x, nA.y, L.cx, L.cy, nB.x, nB.y);
    ctx.moveTo(back.x, back.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    // head
    const r = 2.2;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 10);
    g.addColorStop(0, `hsla(${hue}, 95%, 65%, 0.9)`);
    g.addColorStop(0.6, `hsla(${hue}, 95%, 65%, 0.25)`);
    g.addColorStop(1, `hsla(${hue}, 95%, 65%, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // arrival?
    if (P.t >= 1) {
      L.lastPulseAt = now;
      // synapse bloom at target
      synapseBloom(ctx, nB.x, nB.y, hue);
      // trigger downstream spike
      triggerSpike(L.to, now);
    }
  };

  const synapseBloom = (ctx: CanvasRenderingContext2D, x: number, y: number, hue: number) => {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(x, y, 0, x, y, 16);
    g.addColorStop(0, `hsla(${hue}, 90%, 70%, 0.6)`);
    g.addColorStop(0.6, `hsla(${(hue + 60) % 360}, 90%, 75%, 0.25)`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawNode = (ctx: CanvasRenderingContext2D, n: Node, now: number) => {
    // soma
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fill();

    // idle outline
    ctx.strokeStyle = "rgba(17,24,39,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r + 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // spike glow
    const since = now - n.lastSpikeAt;
    if (since >= 0 && since < 650) {
      const k = 1 - since / 650;
      const hue = ((n.lastSpikeAt / 1000) * 120 + n.x * 0.2 + n.y * 0.1) % 360;
      const glowR = n.r + 10 + 10 * (1 - k);
      const g = ctx.createRadialGradient(n.x, n.y, n.r, n.x, n.y, glowR);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(1, `hsla(${hue}, 85%, 70%, ${0.22 * k})`);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  // ---------- frame ----------
  const step = (now: number) => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const { width: W, height: H } = c.getBoundingClientRect();

    // seed a random spike periodically
    if (now - lastSeedRef.current > seedEveryMs) {
      seedSpike(now);
      lastSeedRef.current = now;
    }

    ctx.clearRect(0, 0, W, H);

    // links first (mesh)
    for (const L of linksRef.current) drawLink(ctx, L, now);

    // pulses
    const pulses = pulsesRef.current;
    const nodes = nodesRef.current;
    // advance pulses along their curves
    for (let i = pulses.length - 1; i >= 0; i--) {
      const P = pulses[i];
      const L = linksRef.current[P.linkIndex];
      const dt = 1 / 60; // seconds per frame approx
      const dPixels = pulseSpeed * dt;
      const dT = L.length > 0 ? dPixels / L.length : 1;
      P.t += dT;

      drawPulse(ctx, P, now);

      if (P.t >= 1) pulses.splice(i, 1);
    }

    // nodes with gentle drift and bounds
    for (const n of nodes) {
      n.x += n.vx * 0.25;
      n.y += n.vy * 0.25;
      const margin = 30;
      if (n.x < margin || n.x > W - margin) n.vx *= -1;
      if (n.y < margin || n.y > H - margin) n.vy *= -1;
      drawNode(ctx, n, now);
    }
  };

  const loop = (t: number) => {
    step(t);
    rafRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    const onResize = () => {
      fit();
      init();
    };
    fit();
    init();
    rafRef.current = requestAnimationFrame(loop);
    window.addEventListener("resize", onResize);

    const vis = () => {
      if (document.hidden) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else {
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", vis);

    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", vis);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, nodeCount, avgDegree, seedEveryMs, pulseSpeed]);

  return (
    <div className={`relative ${className}`} aria-label="Neural rainbow network" role="img">
      <canvas ref={canvasRef} className="block w-full h-full rounded-2xl" />
    </div>
  );
}

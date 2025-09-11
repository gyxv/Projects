import type React from "react";
const { useEffect, useRef, useState } = React;

// Three‑Body Glass Simulation (Zoom + Sliders)
// • Equal masses, Newtonian gravity (RK4)
// • Elastic sphere–sphere collisions
// • Pre-sim finds a near-perfect setup (slightly perturbed) that produces a first event (collision/ejection)
// • Event is mapped to occur at a chosen real-time target using a time mapping (sim seconds per real second)
// • UI adds: zoom (wheel + slider), speed slider, trail length slider, and a "Time‑to‑Event" slider
// • Default view is close; trails are short and fade fast (editable)

export default function ThreeBodyGlassSim() {
  // ======== UI State ========
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [eventType, setEventType] = useState<null | "collision" | "ejection">(null);
  const [eventBodyInfo, setEventBodyInfo] = useState(""); // e.g., "1↔2" or "body 3"
  const [countdown, setCountdown] = useState(120);
  const [hexColors, setHexColors] = useState<string[]>(["#cccccc", "#cccccc", "#cccccc"]);
  const [chosenDuration, setChosenDuration] = useState<number | null>(null); // real seconds until event

  // ======== Canvas / Animation Refs ========
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // ======== Physics / Simulation Refs ========
  const G = 1.0; // gravitational constant in sim units
  const mass = 1.0; // equal masses
  const radius = 0.035; // sphere radius (sim units)
  const softEps = 1e-4; // gravitational softening

  // View scaling (px per sim unit)
  const targetScaleRef = useRef<number>(180);
  const scaleRef = useRef<number>(180);
  const userZoomRef = useRef<number>(1.35); // default: rather close

  // Buffer from pre-sim to guarantee an event and reproducibility
  const preBufRef = useRef<{
    dt: number;
    states: Array<{ p: [number, number][], v: [number, number][] }>;
    tEvent: number; // sim seconds at event
    kind: "collision" | "ejection";
    info: string;
  } | null>(null);

  // Live state after event time (or during preplay)
  const liveRef = useRef({
    p: [[0, 0], [0, 0], [0, 0]] as [number, number][],
    v: [[0, 0], [0, 0], [0, 0]] as [number, number][],
    tSim: 0,
  });

  // Time mapping: real time → sim time
  // simRate = baseSpeed * speedMul (sim seconds / real second)
  const mapRef = useRef({ realStart: 0, baseSpeed: 1 });
  const [speedMul, setSpeedMul] = useState(1); // UI speed multiplier (0.25× .. 3×)

  // Trails
  const trailsRef = useRef<[number, number][][]>([[], [], []]);
  const [trailMax, setTrailMax] = useState(90); // short and quick fade by default

  // Panels
  const [panelOpen, setPanelOpen] = useState(true);

  // Which step index is the pre-sim event?
  const eventIndexRef = useRef<number>(-1);

  // ======== Utility: Colors ========
  function hslToHex(h: number, s: number, l: number) {
    l = Math.max(0, Math.min(1, l));
    s = Math.max(0, Math.min(1, s));
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = h / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r = 0, g = 0, b = 0;
    if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
    else if (hp < 2) [r, g, b] = [x, c, 0];
    else if (hp < 3) [r, g, b] = [0, c, x];
    else if (hp < 4) [r, g, b] = [0, x, c];
    else if (hp < 5) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    const m = l - c / 2;
    const R = Math.round((r + m) * 255);
    const Gc = Math.round((g + m) * 255);
    const B = Math.round((b + m) * 255);
    return `#${((1 << 24) + (R << 16) + (Gc << 8) + B).toString(16).slice(1)}`;
  }
  function randomTriadicHex() {
    const hue = Math.random() * 360;
    const s = 0.72, l = 0.55;
    const tri1 = (hue + 120) % 360;
    const tri2 = (hue + 240) % 360;
    const base = hslToHex(hue, s, l);
    return { base, tri: [hslToHex(tri1, s, l), hslToHex(tri2, s, l)] };
  }

  // ======== Vector Math ========
  const add = (a: number[], b: number[]) => [a[0] + b[0], a[1] + b[1]] as [number, number];
  const sub = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1]] as [number, number];
  const mul = (a: number[], s: number) => [a[0] * s, a[1] * s] as [number, number];
  const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1];
  const norm = (a: number[]) => Math.hypot(a[0], a[1]);

  function accelerations(p: [number, number][]) {
    const a: [number, number][] = [[0, 0], [0, 0], [0, 0]];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) if (j !== i) {
        const r = sub(p[j], p[i]);
        const d2 = r[0] * r[0] + r[1] * r[1] + softEps * softEps;
        const d = Math.sqrt(d2);
        const fac = (G * mass) / (d2 * d);
        a[i] = add(a[i], mul(r, fac));
      }
    }
    return a;
  }
  function rk4Step(p: [number, number][], v: [number, number][], dt: number) {
    const a1 = accelerations(p);
    const pv1 = p.map((pi, i) => add(pi, mul(v[i], dt * 0.5))) as [number, number][];
    const vv1 = v.map((vi, i) => add(vi, mul(a1[i], dt * 0.5))) as [number, number][];
    const a2 = accelerations(pv1);
    const pv2 = p.map((pi, i) => add(pi, mul(vv1[i], dt * 0.5))) as [number, number][];
    const vv2 = v.map((vi, i) => add(vi, mul(a2[i], dt * 0.5))) as [number, number][];
    const a3 = accelerations(pv2);
    const pv3 = p.map((pi, i) => add(pi, mul(vv2[i], dt))) as [number, number][];
    const vv3 = v.map((vi, i) => add(vi, mul(a3[i], dt))) as [number, number][];
    const a4 = accelerations(pv3);
    const pNext = p.map((pi, i) => add(pi, mul(add(add(v[i], mul(add(vv1[i], vv2[i]), 2)), vv3[i]), dt / 6))) as [number, number][];
    const vNext = v.map((vi, i) => add(vi, mul(add(add(a1[i], mul(add(a2[i], a3[i]), 2)), a4[i]), dt / 6))) as [number, number][];
    return { p: pNext, v: vNext };
  }
  function handleCollision(p: [number, number][], v: [number, number][]) {
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
      const rij = sub(p[i], p[j]);
      const d = norm(rij);
      if (d <= 2 * radius) {
        const n = mul(rij, 1 / (d || 1e-9));
        const relv = sub(v[i], v[j]);
        const vrn = dot(relv, n);
        if (vrn < 0) {
          const overlap = 2 * radius - d;
          if (overlap > 0) {
            const corr = mul(n, overlap * 0.5 + 1e-6);
            p[i] = add(p[i], corr) as [number, number];
            p[j] = sub(p[j], corr) as [number, number];
          }
          const impulse = mul(n, vrn);
          v[i] = sub(v[i], impulse) as [number, number];
          v[j] = add(v[j], impulse) as [number, number];
        }
      }
    }
  }
  function energyOfBody(k: number, p: [number, number][], v: [number, number][]) {
    const v2 = dot(v[k], v[k]);
    let U = 0;
    for (let j = 0; j < 3; j++) if (j !== k) {
      const r = norm(sub(p[k], p[j]));
      U -= G * mass * mass / Math.max(r, 1e-6);
    }
    return 0.5 * mass * v2 + U;
  }
  function centerOfMass(p: [number, number][]) {
    let pc = [0, 0];
    for (let i = 0; i < 3; i++) pc = add(pc, p[i]);
    return { pc: mul(pc, 1 / 3) };
  }

  // ======== Pre-simulation (with optional target sim-event time) ========
  async function preSimulateAndSetup(opts?: { targetTEvent?: number; targetRealTime?: number }) {
    // Colors first (new random base + triad companions)
    const { base, tri } = randomTriadicHex();
    const codes = [base, tri[0], tri[1]];
    setHexColors(codes);

    // Base figure-8 initial conditions (equal masses, G=1)
    let pBase: [number, number][] = [
      [ 0.97000436, -0.24308753],
      [-0.97000436,  0.24308753],
      [ 0.0,          0.0      ],
    ];
    let vBase: [number, number][] = [
      [ 0.4662036850,  0.4323657300],
      [ 0.4662036850,  0.4323657300],
      [-0.93240737,   -0.86473146   ],
    ];

    const epsCandidates = [1e-5, 5e-5, 1e-4, 3e-4, 1e-3, 3e-3, 7e-3, 1.2e-2];
    const dt = 0.004;
    const maxSteps = 220000; // ~880s sim time
    const collR = 2 * radius;

    let best: null | {
      buffer: Array<{ p: [number, number][], v: [number, number][] }>;
      tEvent: number; kind: "collision" | "ejection"; info: string;
    } = null;
    const target = opts?.targetTEvent ?? opts?.targetRealTime;

    // Search over small perturbations and random angles, choose earliest if no target; otherwise closest to target
    for (let e = 0; e < epsCandidates.length; e++) {
      for (let attempt = 0; attempt < 6; attempt++) {
        let p = pBase.map((x) => [...x]) as [number, number][];
        let v = vBase.map((x) => [...x]) as [number, number][];
        const ang = Math.random() * Math.PI * 2;
        const eps = epsCandidates[e];
        v[0] = add(v[0], [Math.cos(ang) * eps, Math.sin(ang) * eps]) as [number, number];

        const buffer: Array<{ p: [number, number][], v: [number, number][] }> = [];
        let found = false;
        let kind: "collision" | "ejection" = "collision";
        let info = "";
        let tEvent = 0;

        for (let step = 0; step < maxSteps; step++) {
          buffer.push({ p: [[...p[0]], [...p[1]], [...p[2]]] as any, v: [[...v[0]], [...v[1]], [...v[2]]] as any });

          // Collision check
          let collidedPair: [number, number] | null = null;
          outer: for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
            const d = norm(sub(p[i], p[j]));
            if (d <= collR) { collidedPair = [i, j]; break outer; }
          }
          if (collidedPair) {
            found = true; kind = "collision"; info = `${collidedPair[0] + 1}↔${collidedPair[1] + 1}`; tEvent = step * dt; break;
          }

          // Ejection heuristic
          const { pc } = centerOfMass(p);
          const pRel = p.map((pi) => sub(pi, pc));
          const vRel = v.map((vi) => vi);
          const R = pRel.map((ri) => norm(ri));
          for (let k = 0; k < 3; k++) {
            const eSpec = energyOfBody(k, pRel as any, vRel as any);
            const outward = dot(pRel[k], vRel[k]) > 0;
            if (R[k] > 7.0 && outward && eSpec > 0) { found = true; kind = "ejection"; info = `body ${k + 1}`; tEvent = step * dt; break; }
          }
          if (found) break;

          const next = rk4Step(p as any, v as any, dt);
          p = next.p as any; v = next.v as any;
        }

        if (found) {
          if (!best) {
            best = { buffer, tEvent, kind, info };
          } else if (target != null) {
            const prevErr = Math.abs(best.tEvent - target);
            const newErr = Math.abs(tEvent - target);
            if (newErr < prevErr) best = { buffer, tEvent, kind, info };
          } else {
            // Prefer the earliest event if no target specified
            if (tEvent < best.tEvent) best = { buffer, tEvent, kind, info };
          }
        }
      }
    }

    if (!best) {
      // Fallback: show countdown to nominal time
      const tEvent = 90; // default sim seconds
      preBufRef.current = { dt, states: [], tEvent, kind: "ejection", info: "body 3" };
      setEventType("ejection");
      setEventBodyInfo("body 3");
    } else {
      preBufRef.current = { dt, states: best.buffer, tEvent: best.tEvent, kind: best.kind, info: best.info };
      eventIndexRef.current = Math.floor(best.tEvent / dt);
      setEventType(best.kind);
      setEventBodyInfo(best.info);
    }

    // Reset live state from pre-sim start
    if (preBufRef.current && preBufRef.current.states.length > 0) {
      const startState = preBufRef.current.states[0];
      liveRef.current = { p: startState.p.map((x) => [...x]) as any, v: startState.v.map((x) => [...x]) as any, tSim: 0 };
    } else {
      liveRef.current = { p: [[0,0],[0,0],[0,0]] as any, v: [[0,0],[0,0],[0,0]] as any, tSim: 0 };
    }

    // Map sim time so that event occurs at desired real-time duration
    const desiredReal = opts?.targetRealTime ?? 120;
    mapRef.current = {
      realStart: performance.now() / 1000,
      baseSpeed: preBufRef.current ? preBufRef.current.tEvent / desiredReal : 1,
    };

    // Trails reset
    trailsRef.current = [[], [], []];

    // Initialize scale (close view by default)
    const span = preBufRef.current && preBufRef.current.states.length
      ? Math.max(
          norm(sub(preBufRef.current.states[0].p[0], preBufRef.current.states[0].p[1])),
          norm(sub(preBufRef.current.states[0].p[1], preBufRef.current.states[0].p[2])),
          norm(sub(preBufRef.current.states[0].p[2], preBufRef.current.states[0].p[0]))
        )
      : 1.2;
    targetScaleRef.current = Math.min(300, Math.max(140, 300 / Math.max(span, 0.4)));
    scaleRef.current = targetScaleRef.current * userZoomRef.current; // start close

    setIsReady(true);
  }

  // ======== Canvas Helpers ========
  function setupCanvas(ctx: CanvasRenderingContext2D) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const { clientWidth, clientHeight } = ctx.canvas;
    ctx.canvas.width = Math.floor(clientWidth * dpr);
    ctx.canvas.height = Math.floor(clientHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function worldToScreen(x: number, y: number, W: number, H: number) {
    const s = scaleRef.current;
    const cx = W / 2, cy = H / 2;
    return [cx + x * s, cy - y * s];
  }

  // ======== Drawing ========
  function drawScene(ctx: CanvasRenderingContext2D, p: [number, number][]) {
    const W = ctx.canvas.clientWidth;
    const H = ctx.canvas.clientHeight;

    // Auto-fit + user zoom
    const { pc } = centerOfMass(p);
    const maxR = Math.max(
      norm(sub(p[0], pc)),
      norm(sub(p[1], pc)),
      norm(sub(p[2], pc))
    );
    const baseTarget = maxR > 2.6 ? Math.max(70, 280 / (maxR + 0.6)) : targetScaleRef.current;
    const targetWithUser = baseTarget * userZoomRef.current;
    scaleRef.current = scaleRef.current * 0.88 + targetWithUser * 0.12;

    // Background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0b1020");
    grad.addColorStop(1, "#060912");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.save();
    ctx.globalAlpha = 0.08;
    const step = 80;
    ctx.beginPath();
    for (let x = 0; x < W; x += step) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
    for (let y = 0; y < H; y += step) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.restore();

    const glow = (hex: string, alpha = 0.9) => {
      ctx.shadowBlur = 22;
      ctx.shadowColor = hex + Math.floor(alpha * 255).toString(16).padStart(2, "0");
    };

    // Trails with per-segment fading
    for (let i = 0; i < 3; i++) {
      const trail = trailsRef.current[i];
      const n = trail.length;
      if (n > 2) {
        for (let k = 1; k < n; k++) {
          const [x0, y0] = worldToScreen(trail[k - 1][0], trail[k - 1][1], W, H);
          const [x1, y1] = worldToScreen(trail[k][0], trail[k][1], W, H);
          const t = k / n; // 0..1
          ctx.save();
          ctx.globalAlpha = 0.15 + 0.55 * t * t; // quick fade near tail
          ctx.lineWidth = 1.8 + 0.6 * t;
          ctx.strokeStyle = hexColors[i];
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Bodies
    for (let i = 0; i < 3; i++) {
      const [x, y] = worldToScreen(p[i][0], p[i][1], W, H);
      ctx.save();
      glow(hexColors[i], 0.9);
      ctx.fillStyle = hexColors[i];
      ctx.beginPath();
      ctx.arc(x, y, radius * scaleRef.current, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ======== Animation Loop ========
  const loopRef = useRef<() => void>(() => {});
  loopRef.current = () => {
    const buf = preBufRef.current; if (!buf) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;

    setupCanvas(ctx);

    const now = performance.now() / 1000;
    const realElapsed = Math.max(0, now - mapRef.current.realStart);
    const simRate = mapRef.current.baseSpeed * speedMul; // sim seconds per real second

    if (isPlaying) {
      const simTimeTarget = Math.max(0, realElapsed * simRate);
      const tEvent = buf.tEvent;

      if (simTimeTarget <= tEvent) {
        const idx = Math.min(buf.states.length - 1, Math.floor(simTimeTarget / buf.dt));
        const state = buf.states[idx] ?? buf.states[buf.states.length - 1];
        if (state) {
          liveRef.current.p = state.p.map((x) => [...x]) as any;
          liveRef.current.v = state.v.map((x) => [...x]) as any;
          liveRef.current.tSim = idx * buf.dt;
        }
      } else {
        if (Math.abs(liveRef.current.tSim - tEvent) < buf.dt) {
          const exact = buf.states[Math.min(buf.states.length - 1, Math.floor(tEvent / buf.dt))];
          if (exact) {
            liveRef.current.p = exact.p.map((x) => [...x]) as any;
            liveRef.current.v = exact.v.map((x) => [...x]) as any;
            liveRef.current.tSim = tEvent;
            if (buf.kind === "collision") handleCollision(liveRef.current.p as any, liveRef.current.v as any);
          }
        }
        // integrate forward in real time after the event
        let dtLeft = simTimeTarget - liveRef.current.tSim;
        const h = 0.005;
        while (dtLeft > 1e-6) {
          const step = Math.min(h, dtLeft);
          const next = rk4Step(liveRef.current.p as any, liveRef.current.v as any, step);
          liveRef.current.p = next.p as any;
          liveRef.current.v = next.v as any;
          handleCollision(liveRef.current.p as any, liveRef.current.v as any);
          liveRef.current.tSim += step;
          dtLeft -= step;
        }
      }
    }

    // Update trails
    const p = liveRef.current.p;
    for (let i = 0; i < 3; i++) {
      trailsRef.current[i].push([p[i][0], p[i][1]]);
      while (trailsRef.current[i].length > trailMax) trailsRef.current[i].shift();
    }

    // Draw
    drawScene(ctx, liveRef.current.p as any);

    // Countdown under current speed
    if (buf) {
      const tRemainingSim = Math.max(0, buf.tEvent - liveRef.current.tSim);
      const tRemainingReal = tRemainingSim / (mapRef.current.baseSpeed * speedMul);
      setCountdown(tRemainingReal);
    }

    rafRef.current = requestAnimationFrame(loopRef.current);
  };

  // ======== Effects ========
  useEffect(() => {
    if (chosenDuration == null) return;
    preSimulateAndSetup({ targetRealTime: chosenDuration });
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [chosenDuration]);
  useEffect(() => {
    if (!isReady) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loopRef.current);
  }, [isReady, isPlaying, speedMul, trailMax]);

  // ======== Interactions ========
  function resetAll() {
    setIsReady(false);
    setEventType(null);
    setEventBodyInfo("");
    setIsPlaying(true);
    if (chosenDuration != null) {
      preSimulateAndSetup({ targetRealTime: chosenDuration });
    } else {
      preSimulateAndSetup();
    }
  }
  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    const factor = Math.pow(1.05, -e.deltaY / 100);
    userZoomRef.current = Math.max(0.5, Math.min(2.5, userZoomRef.current * factor));
  }
  function retargetEventRealTime(desiredSeconds: number) {
    setIsReady(false);
    setEventType(null);
    setEventBodyInfo("");
    setChosenDuration(desiredSeconds);
    preSimulateAndSetup({ targetRealTime: desiredSeconds }).then(() => {
      mapRef.current.realStart = performance.now() / 1000;
      setIsReady(true);
    });
  }

  // ======== UI ========
  const durationOptions = [
    { label: "30s", seconds: 30 },
    { label: "2m", seconds: 120 },
    { label: "5m", seconds: 300 },
    { label: "10m", seconds: 600 },
    { label: "15m", seconds: 900 },
    { label: "30m", seconds: 1800 },
    { label: "45m", seconds: 2700 },
    { label: "1h", seconds: 3600 },
    { label: "1.5h", seconds: 5400 },
    { label: "2h", seconds: 7200 },
    { label: "2.5h", seconds: 9000 },
    { label: "3h", seconds: 10800 },
    { label: "6h", seconds: 21600 },
    { label: "12h", seconds: 43200 },
    { label: "24h", seconds: 86400 },
  ];
  const eventLabel = eventType === "collision"
    ? `collision (${eventBodyInfo})`
    : eventType === "ejection" ? `ejection of ${eventBodyInfo}` : "an event";

  if (chosenDuration === null) {
    return (
      <div className="relative w-full h-[88vh] md:h-[92vh] bg-black text-white font-sans overflow-hidden rounded-2xl shadow-2xl flex items-center justify-center">
        <div className="px-6 py-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-center">
          <div className="text-lg mb-3">Choose time until collision/ejection</div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {durationOptions.map((opt) => (
              <button
                key={opt.label}
                onClick={() => setChosenDuration(opt.seconds)}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[88vh] md:h-[92vh] bg-black text-white font-sans overflow-hidden rounded-2xl shadow-2xl" onWheel={handleWheel}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Top-left: Countdown glass panel */}
      <div className="absolute top-4 left-4 px-4 py-3 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
        <div className="text-xs uppercase tracking-wider text-white/70">Time to {eventLabel}</div>
        <div className="text-3xl font-semibold tabular-nums">
          {Math.floor(countdown / 60).toString().padStart(2, "0")}:{Math.floor(countdown % 60).toString().padStart(2, "0")}
        </div>
      </div>

      {/* Top-right: Colors panel */}
      <div className="absolute top-4 right-4 px-4 py-3 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
        <div className="text-xs uppercase tracking-wider text-white/70 mb-1">Triadic palette</div>
        <div className="flex items-center gap-3">
          {hexColors.map((hex, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full" style={{ background: hex }} />
              <span className="text-sm font-mono text-white/80">{hex.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          onClick={resetAll}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition leading-tight"
        >
          <span className="block">Reset</span>
          <span className="block text-xs opacity-80">(new colors)</span>
        </button>
        {isReady && preBufRef.current && (
          <div className="text-sm text-white/70 font-medium">
            Event: <span className="text-white/90">{eventLabel}</span>
            <span className="mx-2">•</span>
            Sim @ event: <span className="tabular-nums text-white/90">{preBufRef.current.tEvent.toFixed(2)}s</span>
            <span className="mx-2">•</span>
            Speed: <span className="tabular-nums text-white/90">×{(mapRef.current.baseSpeed * speedMul).toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Control Panel (minimizable glass) */}
      <div className="absolute left-4 bottom-24 md:bottom-28 px-4 py-3 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg w-[min(88vw,420px)]">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-widest text-white/70">Controls</div>
          <button onClick={() => setPanelOpen(v => !v)} className="text-white/80 text-xs px-2 py-1 rounded-lg bg-white/10 border border-white/20">
            {panelOpen ? "Minimize" : "Expand"}
          </button>
        </div>
        {panelOpen && (
          <div className="space-y-3">
            {/* Zoom */}
            <div>
              <div className="flex items-center justify-between text-xs text-white/70"><span>Zoom</span><span className="tabular-nums">{userZoomRef.current.toFixed(2)}×</span></div>
              <input type="range" min={0.5} max={2.5} step={0.01}
                value={userZoomRef.current}
                onChange={(e) => { userZoomRef.current = parseFloat(e.target.value); }}
                className="w-full accent-white/90" />
            </div>
            {/* Speed */}
            <div>
              <div className="flex items-center justify-between text-xs text-white/70"><span>Speed</span><span className="tabular-nums">×{(mapRef.current.baseSpeed * speedMul).toFixed(2)}</span></div>
              <input type="range" min={0.25} max={3} step={0.01}
                value={speedMul}
                onChange={(e) => setSpeedMul(parseFloat(e.target.value))}
                className="w-full accent-white/90" />
            </div>
            {/* Trails */}
            <div>
              <div className="flex items-center justify-between text-xs text-white/70"><span>Trail length</span><span className="tabular-nums">{trailMax}</span></div>
              <input type="range" min={20} max={600} step={1}
                value={trailMax}
                onChange={(e) => setTrailMax(parseInt(e.target.value))}
                className="w-full accent-white/90" />
            </div>
            {/* Time to Event */}
            <div>
              <div className="flex items-center justify-between text-xs text-white/70"><span>Time to collision/ejection</span><span className="tabular-nums">{Math.max(0, Math.round(countdown))}s</span></div>
              <input type="range" min={30} max={86400} step={1}
                value={Math.max(30, Math.min(86400, Math.round(countdown)))}
                onChange={(e) => retargetEventRealTime(parseFloat(e.target.value))}
                className="w-full accent-white/90" />
              <div className="text-[11px] text-white/60 mt-1">Keeps current speed; adjusts initial perturbation to aim for the chosen time.</div>
            </div>
          </div>
        )}
      </div>

      {/* Loading badge */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="px-6 py-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-center">
            <div className="text-xs uppercase tracking-widest text-white/70 mb-2">Preparing a near-perfect 3‑body setup…</div>
            <div className="text-lg font-medium">Searching for a slight perturbation that yields an event</div>
          </div>
        </div>
      )}
    </div>
  );
}

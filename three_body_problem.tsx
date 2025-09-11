import type React from "react";
const { useEffect, useRef, useState } = React;

type OrientationPreset = {
  label: string;
  p: [number, number][];
  v: [number, number][];
};
type Shard = {
  p: [number, number];
  v: [number, number];
  life: number;
  color: string;
};

type OuterObject = {
  mass: number;
  radius: number;
  orbitCenter: [number, number];
  orbitRadius: number;
  omega: number;
  phase: number;
  color: string;
};

const orientationPresets: OrientationPreset[] = [
  {
    label: "Figure‑8",
    p: [
      [0.97000436, -0.24308753],
      [-0.97000436, 0.24308753],
      [0.0, 0.0],
    ],
    v: [
      [0.466203685, 0.43236573],
      [0.466203685, 0.43236573],
      [-0.93240737, -0.86473146],
    ],
  },
  {
    label: "Circular",
    p: [
      [1, 0],
      [-0.5, 0.8660254],
      [-0.5, -0.8660254],
    ],
    v: [
      [0, 0.658],
      [-0.570, -0.329],
      [0.570, -0.329],
    ],
  },
];

function randomOrientation(): OrientationPreset {
  const rand = () => (Math.random() * 2 - 1) as number;
  return {
    label: "Random",
    p: [
      [rand(), rand()],
      [rand(), rand()],
      [rand(), rand()],
    ],
    v: [
      [rand() * 0.5, rand() * 0.5],
      [rand() * 0.5, rand() * 0.5],
      [rand() * 0.5, rand() * 0.5],
    ],
  };
}

function createObjectSet(center: [number, number]): OuterObject[] {
  const objs: OuterObject[] = [];
  const choice = Math.random();
  if (choice < 0.25) {
    const star = { mass: 5, radius: 0.15, orbitCenter: center, orbitRadius: 0, omega: 0, phase: 0, color: "#ffdd88" };
    objs.push(star);
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const r = 2 + Math.random() * 4;
      const omega = Math.sqrt(star.mass / Math.pow(r, 3));
      objs.push({ mass: 0.4, radius: 0.04, orbitCenter: center, orbitRadius: r, omega, phase: Math.random() * Math.PI * 2, color: "#88aaff" });
    }
  } else if (choice < 0.5) {
    const r = 0.6;
    const omega = Math.sqrt(2 / Math.pow(r, 3));
    objs.push({ mass: 0.8, radius: 0.06, orbitCenter: center, orbitRadius: r, omega, phase: 0, color: "#66ff66" });
    objs.push({ mass: 0.8, radius: 0.06, orbitCenter: center, orbitRadius: r, omega, phase: Math.PI, color: "#ff6666" });
  } else if (choice < 0.75) {
    const host = { mass: 2, radius: 0.1, orbitCenter: center, orbitRadius: 0, omega: 0, phase: 0, color: "#ffaa33" };
    objs.push(host);
    const beltR = 2.5 + Math.random();
    const omega = Math.sqrt(host.mass / Math.pow(beltR, 3));
    for (let i = 0; i < 12; i++) {
      objs.push({ mass: 0.01, radius: 0.02, orbitCenter: center, orbitRadius: beltR + (Math.random() - 0.5) * 0.3, omega, phase: Math.random() * Math.PI * 2, color: "#aaaaaa" });
    }
  } else {
    objs.push({ mass: 1.5, radius: 0.12, orbitCenter: center, orbitRadius: 0, omega: 0, phase: 0, color: "#55aaff" });
  }
  return objs;
}

function generateRegion(center: [number, number]): OuterObject[] {
  const objs: OuterObject[] = [];
  const count = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 20 + Math.random() * 8;
    const c: [number, number] = [center[0] + Math.cos(ang) * dist, center[1] + Math.sin(ang) * dist];
    objs.push(...createObjectSet(c));
  }
  return objs;
}

function outerObjectPosition(obj: OuterObject, t: number): [number, number] {
  const [cx, cy] = obj.orbitCenter;
  if (obj.orbitRadius === 0) return [cx, cy];
  const ang = obj.phase + obj.omega * t;
  return [cx + Math.cos(ang) * obj.orbitRadius, cy + Math.sin(ang) * obj.orbitRadius];
}

const defaultSettings = { zoom: 1.35, speedMul: 1, trail: 90 };

// Three‑Body Glass Simulation (Zoom + Sliders)
// • Equal masses, Newtonian gravity (RK4)
// • Elastic sphere–sphere collisions
// • Pre-sim finds a near-perfect setup (slightly perturbed) that produces a first event (collision/ejection)
// • Event is mapped to occur at a chosen real-time target using a time mapping (sim seconds per real second)
// • UI adds: zoom (wheel + slider), speed slider, trail length slider
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
  const [progressLines, setProgressLines] = useState<string[]>([]);
  const [candidateInfo, setCandidateInfo] = useState("");
  const [attemptInfo, setAttemptInfo] = useState("");
  const [orientation, setOrientation] = useState<OrientationPreset | null>(null);

  const [zoom, setZoom] = useState(defaultSettings.zoom);
  const orientationRef = useRef<OrientationPreset>(orientationPresets[0]);

  const [pan, setPan] = useState<[number, number]>([0, 0]);
  const panRef = useRef<[number, number]>([0, 0]);
  const followRef = useRef<number | null>(null);
  const shatterPosRef = useRef<[number, number][]>([[0, 0], [0, 0], [0, 0]]);
  const draggingRef = useRef(false);
  const dragStartRef = useRef<[number, number]>([0, 0]);
  const panStartRef = useRef<[number, number]>([0, 0]);
  const postEventRef = useRef(false);

  type Rocket = {
    p: [number, number];
    v: [number, number];
    angle: number;
    thrust: boolean;
    rotL: boolean;
    rotR: boolean;
  };
  const rocketRef = useRef<Rocket | null>(null);

  const seedRef = useRef<string>("");
  const [copied, setCopied] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [seedInput, setSeedInput] = useState("");
  const seedImportRef = useRef<{ p: [number, number][], v: [number, number][] } | null>(null);

  const outerObjectsRef = useRef<OuterObject[]>(generateRegion([0, 0]));
  const regionCentersRef = useRef<[number, number][]>([[0, 0]]);

  useEffect(() => {
    if (!importOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setImportOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [importOpen]);

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
  const userZoomRef = useRef<number>(defaultSettings.zoom); // default: rather close

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
  const shardsRef = useRef<Shard[]>([]);
  const destroyedRef = useRef<[boolean, boolean, boolean]>([false, false, false]);
  const collisionHandledRef = useRef(false);

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

  function ensureRegionAround(pt: [number, number]) {
    if (regionCentersRef.current.every((c) => norm(sub(pt, c)) > 40)) {
      regionCentersRef.current.push([pt[0], pt[1]]);
      outerObjectsRef.current.push(...generateRegion([pt[0], pt[1]]));
    }
  }

  function accelerations(p: [number, number][], t: number, includeOuter: boolean) {
    const a: [number, number][] = [[0, 0], [0, 0], [0, 0]];
    for (let i = 0; i < 3; i++) {
      if (destroyedRef.current[i]) continue;
      for (let j = 0; j < 3; j++) if (j !== i && !destroyedRef.current[j]) {
        const r = sub(p[j], p[i]);
        const d2 = r[0] * r[0] + r[1] * r[1] + softEps * softEps;
        const d = Math.sqrt(d2);
        const fac = (G * mass) / (d2 * d);
        a[i] = add(a[i], mul(r, fac));
      }
      if (includeOuter) {
        for (const obj of outerObjectsRef.current) {
          const pos = outerObjectPosition(obj, t);
          const r = sub(pos, p[i]);
          const d2 = r[0] * r[0] + r[1] * r[1] + softEps * softEps;
          const d = Math.sqrt(d2);
          const fac = (G * obj.mass) / (d2 * d);
          a[i] = add(a[i], mul(r, fac));
        }
      }
    }
    return a;
  }
  function rk4Step(p: [number, number][], v: [number, number][], dt: number, t: number, includeOuter: boolean) {
    const a1 = accelerations(p, t, includeOuter);
    const pv1 = p.map((pi, i) => add(pi, mul(v[i], dt * 0.5))) as [number, number][];
    const vv1 = v.map((vi, i) => add(vi, mul(a1[i], dt * 0.5))) as [number, number][];
    const a2 = accelerations(pv1, t + dt * 0.5, includeOuter);
    const pv2 = p.map((pi, i) => add(pi, mul(vv1[i], dt * 0.5))) as [number, number][];
    const vv2 = v.map((vi, i) => add(vi, mul(a2[i], dt * 0.5))) as [number, number][];
    const a3 = accelerations(pv2, t + dt * 0.5, includeOuter);
    const pv3 = p.map((pi, i) => add(pi, mul(vv2[i], dt))) as [number, number][];
    const vv3 = v.map((vi, i) => add(vi, mul(a3[i], dt))) as [number, number][];
    const a4 = accelerations(pv3, t + dt, includeOuter);
    const pNext = p.map((pi, i) => add(pi, mul(add(add(v[i], mul(add(vv1[i], vv2[i]), 2)), vv3[i]), dt / 6))) as [number, number][];
    const vNext = v.map((vi, i) => add(vi, mul(add(add(a1[i], mul(add(a2[i], a3[i]), 2)), a4[i]), dt / 6))) as [number, number][];
    return { p: pNext, v: vNext };
  }
  function handleCollision(p: [number, number][], v: [number, number][]) {
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
      if (destroyedRef.current[i] || destroyedRef.current[j]) continue;
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
  function handleOuterCollisions(p: [number, number][], v: [number, number][], t: number) {
    if (!preBufRef.current) return;
    if (t < preBufRef.current.tEvent) return;
    for (let i = 0; i < 3; i++) {
      if (destroyedRef.current[i]) continue;
      for (const obj of outerObjectsRef.current) {
        const pos = outerObjectPosition(obj, t);
        const rij = sub(p[i], pos);
        const d = norm(rij);
        if (d <= radius + obj.radius) {
          const n = mul(rij, 1 / (d || 1e-9));
          const vrn = dot(v[i], n);
          if (vrn < 0) {
            v[i] = sub(v[i], mul(n, 2 * vrn)) as [number, number];
          }
        }
      }
    }
  }

  function rocketAcceleration(pos: [number, number], t: number) {
    let a: [number, number] = [0, 0];
    for (let i = 0; i < 3; i++) {
      if (destroyedRef.current[i]) continue;
      const r = sub(liveRef.current.p[i], pos);
      const d2 = r[0] * r[0] + r[1] * r[1] + softEps * softEps;
      const d = Math.sqrt(d2);
      const fac = (G * mass) / (d2 * d);
      a = add(a, mul(r, fac));
    }
    for (const obj of outerObjectsRef.current) {
      const op = outerObjectPosition(obj, t);
      const r = sub(op, pos);
      const d2 = r[0] * r[0] + r[1] * r[1] + softEps * softEps;
      const d = Math.sqrt(d2);
      const fac = (G * obj.mass) / (d2 * d);
      a = add(a, mul(r, fac));
    }
    return a;
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
  async function preSimulateAndSetup(opts?: { targetTEvent?: number; targetRealTime?: number; seed?: { p: [number, number][]; v: [number, number][] } }) {
    // Colors first (new random base + triad companions)
    const { base, tri } = randomTriadicHex();
    const codes = [base, tri[0], tri[1]];
    setHexColors(codes);
    setProgressLines(["Starting search for perturbations..."]);
    setCandidateInfo("");
    setAttemptInfo("");
    shardsRef.current = [];
    destroyedRef.current = [false, false, false];
    collisionHandledRef.current = false;

    // Base initial conditions from selected orientation or seed
    let pBase = opts?.seed ? opts.seed.p.map((x) => [...x]) as [number, number][] : orientationRef.current.p.map((x) => [...x]) as [number, number][];
    let vBase = opts?.seed ? opts.seed.v.map((x) => [...x]) as [number, number][] : orientationRef.current.v.map((x) => [...x]) as [number, number][];

    const epsCandidates = [1e-5, 5e-5, 1e-4, 3e-4, 1e-3, 3e-3, 7e-3, 1.2e-2];
    const dt = 0.004;
    const target = opts?.targetTEvent ?? opts?.targetRealTime;
    const maxSteps = target ? Math.max(220000, Math.ceil(target / dt) + 5000) : 220000;
    const collR = 2 * radius;

    let best: null | {
      buffer: Array<{ p: [number, number][], v: [number, number][] }>;
      tEvent: number; kind: "collision" | "ejection"; info: string;
    } = null;

    if (opts?.seed) {
      let p = pBase.map((x) => [...x]) as [number, number][];
      let v = vBase.map((x) => [...x]) as [number, number][];
      const buffer: Array<{ p: [number, number][], v: [number, number][] }> = [];
      let found = false; let kind: "collision" | "ejection" = "collision"; let info = ""; let tEvent = 0;
      let ejectCand: { k: number; step: number } | null = null; const confirmSteps = 25000;
      for (let step = 0; step < maxSteps; step++) {
        buffer.push({ p: [[...p[0]], [...p[1]], [...p[2]]] as any, v: [[...v[0]], [...v[1]], [...v[2]]] as any });
        if (step % 5000 === 0) {
          const pct = ((step / maxSteps) * 100).toFixed(1);
          setProgressLines((l) => [...l.slice(-40), `    ${pct}%`]);
          await new Promise((r) => setTimeout(r, 0));
        }
        let collidedPair: [number, number] | null = null;
        outer: for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
          const d = norm(sub(p[i], p[j]));
          if (d <= collR) { collidedPair = [i, j]; break outer; }
        }
        if (collidedPair) { found = true; kind = "collision"; info = `${collidedPair[0] + 1}↔${collidedPair[1] + 1}`; tEvent = step * dt; break; }
        const { pc } = centerOfMass(p);
        const pRel = p.map((pi) => sub(pi, pc));
        const vRel = v.map((vi) => vi);
        const R = pRel.map((ri) => norm(ri));
        if (!ejectCand) {
          for (let k = 0; k < 3; k++) {
            const eSpec = energyOfBody(k, pRel as any, vRel as any);
            const outward = dot(pRel[k], vRel[k]) > 0;
            if (R[k] > 7.0 && outward && eSpec > 0) { ejectCand = { k, step }; break; }
          }
        } else {
          const k = ejectCand.k;
          const eSpec = energyOfBody(k, pRel as any, vRel as any);
          const outward = dot(pRel[k], vRel[k]) > 0;
          if (R[k] < 5.0 || !outward || eSpec < 0) {
            ejectCand = null;
          } else if (step - ejectCand.step > confirmSteps) {
            found = true; kind = "ejection"; info = `body ${k + 1}`; tEvent = ejectCand.step * dt; break;
          }
        }
        const next = rk4Step(p as any, v as any, dt, step * dt, false);
        p = next.p as any; v = next.v as any;
      }
      if (found) best = { buffer, tEvent, kind, info };
    } else {
      // Search over small perturbations and random angles, choose earliest if no target; otherwise closest to target
      for (let e = 0; e < epsCandidates.length; e++) {
        setCandidateInfo(`∈ candidate ${e + 1}/${epsCandidates.length}`);
        await new Promise((r) => setTimeout(r, 0));
        for (let attempt = 0; attempt < 6; attempt++) {
          setAttemptInfo(`attempt ${attempt + 1}/6`);
          await new Promise((r) => setTimeout(r, 0));
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
          let ejectCand: { k: number; step: number } | null = null;
          const confirmSteps = 25000;

          for (let step = 0; step < maxSteps; step++) {
            buffer.push({ p: [[...p[0]], [...p[1]], [...p[2]]] as any, v: [[...v[0]], [...v[1]], [...v[2]]] as any });

            if (step % 5000 === 0) {
              const pct = ((step / maxSteps) * 100).toFixed(1);
              setProgressLines((l) => [...l.slice(-40), `    ${pct}%`]);
              await new Promise((r) => setTimeout(r, 0));
            }

            // Collision check
            let collidedPair: [number, number] | null = null;
            outer: for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
              const d = norm(sub(p[i], p[j]));
              if (d <= collR) { collidedPair = [i, j]; break outer; }
            }
            if (collidedPair) {
              found = true; kind = "collision"; info = `${collidedPair[0] + 1}↔${collidedPair[1] + 1}`; tEvent = step * dt; break;
            }

            // Ejection detection with permanence check
            const { pc } = centerOfMass(p);
            const pRel = p.map((pi) => sub(pi, pc));
            const vRel = v.map((vi) => vi);
            const R = pRel.map((ri) => norm(ri));
            if (!ejectCand) {
              for (let k = 0; k < 3; k++) {
                const eSpec = energyOfBody(k, pRel as any, vRel as any);
                const outward = dot(pRel[k], vRel[k]) > 0;
                if (R[k] > 7.0 && outward && eSpec > 0) { ejectCand = { k, step }; break; }
              }
            } else {
              const k = ejectCand.k;
              const eSpec = energyOfBody(k, pRel as any, vRel as any);
              const outward = dot(pRel[k], vRel[k]) > 0;
              if (R[k] < 5.0 || !outward || eSpec < 0) {
                ejectCand = null;
              } else if (step - ejectCand.step > confirmSteps) {
                found = true; kind = "ejection"; info = `body ${k + 1}`; tEvent = ejectCand.step * dt; break;
              }
            }

            const next = rk4Step(p as any, v as any, dt, step * dt, false);
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

    if (preBufRef.current && opts?.targetRealTime) {
      mapRef.current.baseSpeed = preBufRef.current.tEvent / opts.targetRealTime;
      mapRef.current.realStart = performance.now() / 1000;
    }

    // Reset live state from pre-sim start
    if (preBufRef.current && preBufRef.current.states.length > 0) {
      const startState = preBufRef.current.states[0];
      liveRef.current = { p: startState.p.map((x) => [...x]) as any, v: startState.v.map((x) => [...x]) as any, tSim: 0 };
    } else {
      liveRef.current = { p: [[0,0],[0,0],[0,0]] as any, v: [[0,0],[0,0],[0,0]] as any, tSim: 0 };
    }

    // Map sim time so that event occurs at desired real-time duration
    mapRef.current.realStart = performance.now() / 1000;

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

    if (preBufRef.current && preBufRef.current.states.length > 0) {
      const init = preBufRef.current.states[0];
      seedRef.current = btoa(JSON.stringify({ p: init.p, v: init.v, duration: opts?.targetRealTime ?? 0 }));
    }

    setProgressLines((l) => [...l.slice(-40), "Finalizing setup..."]);
    await new Promise((r) => setTimeout(r, 0));
    setIsReady(true);
    setProgressLines([]);
    setCandidateInfo("");
    setAttemptInfo("");
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
    const [px, py] = panRef.current;
    const cx = W / 2, cy = H / 2;
    return [cx + (x - px) * s, cy - (y - py) * s];
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
      if (destroyedRef.current[i]) continue;
      const [x, y] = worldToScreen(p[i][0], p[i][1], W, H);
      ctx.save();
      glow(hexColors[i], 0.9);
      ctx.fillStyle = hexColors[i];
      ctx.beginPath();
      ctx.arc(x, y, radius * scaleRef.current, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Shards
    for (const sh of shardsRef.current) {
      const [x, y] = worldToScreen(sh.p[0], sh.p[1], W, H);
      ctx.save();
      ctx.globalAlpha = Math.max(0, sh.life / 3);
      ctx.fillStyle = sh.color;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Outer celestial objects (visible when zoomed out)
    if (scaleRef.current < 120) {
      for (const obj of outerObjectsRef.current) {
        const pos = outerObjectPosition(obj, liveRef.current.tSim);
        const [x, y] = worldToScreen(pos[0], pos[1], W, H);
        ctx.save();
        glow(obj.color, 0.8);
        ctx.fillStyle = obj.color;
        ctx.beginPath();
        ctx.arc(x, y, obj.radius * scaleRef.current, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    if (rocketRef.current) {
      const r = rocketRef.current;
      const [x, y] = worldToScreen(r.p[0], r.p[1], W, H);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-r.angle);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-4, 3);
      ctx.lineTo(-4, -3);
      ctx.closePath();
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
        postEventRef.current = true;
        if (Math.abs(liveRef.current.tSim - tEvent) < buf.dt) {
          const exact = buf.states[Math.min(buf.states.length - 1, Math.floor(tEvent / buf.dt))];
          if (exact) {
            liveRef.current.p = exact.p.map((x) => [...x]) as any;
            liveRef.current.v = exact.v.map((x) => [...x]) as any;
            liveRef.current.tSim = tEvent;
            if (buf.kind === "collision") handleCollision(liveRef.current.p as any, liveRef.current.v as any);
            handleOuterCollisions(liveRef.current.p as any, liveRef.current.v as any, liveRef.current.tSim);
          }
        }
        if (!collisionHandledRef.current && buf.kind === "collision" && simTimeTarget > tEvent) {
          const pair = buf.info.split("↔").map((n) => parseInt(n) - 1) as [number, number];
          const c = mul(add(liveRef.current.p[pair[0]], liveRef.current.p[pair[1]]), 0.5);
          for (let s = 0; s < 40; s++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 0.6 + Math.random() * 0.8;
            const color = hexColors[pair[Math.floor(Math.random() * 2)]];
            shardsRef.current.push({ p: [c[0], c[1]], v: [Math.cos(ang) * spd, Math.sin(ang) * spd], life: 3, color });
          }
          destroyedRef.current[pair[0]] = true;
          destroyedRef.current[pair[1]] = true;
          shatterPosRef.current[pair[0]] = [c[0], c[1]];
          shatterPosRef.current[pair[1]] = [c[0], c[1]];
          liveRef.current.p[pair[0]] = [9999, 9999];
          liveRef.current.p[pair[1]] = [9999, 9999];
          liveRef.current.v[pair[0]] = [0, 0];
          liveRef.current.v[pair[1]] = [0, 0];
          collisionHandledRef.current = true;
        }
        // integrate forward in real time after the event
        let dtLeft = simTimeTarget - liveRef.current.tSim;
        const h = 0.005;
        while (dtLeft > 1e-6) {
          const step = Math.min(h, dtLeft);
          const next = rk4Step(liveRef.current.p as any, liveRef.current.v as any, step, liveRef.current.tSim, true);
          liveRef.current.p = next.p as any;
          liveRef.current.v = next.v as any;
          handleCollision(liveRef.current.p as any, liveRef.current.v as any);
          handleOuterCollisions(liveRef.current.p as any, liveRef.current.v as any, liveRef.current.tSim);
          if (rocketRef.current) {
            const r = rocketRef.current;
            const rot = 1.5;
            if (r.rotL) r.angle += rot * step;
            if (r.rotR) r.angle -= rot * step;
            let acc = rocketAcceleration(r.p, liveRef.current.tSim);
            if (r.thrust) {
              const thrust = 0.4;
              acc = add(acc, [Math.cos(r.angle) * thrust, Math.sin(r.angle) * thrust]);
            }
            r.v = add(r.v, mul(acc, step));
            r.p = add(r.p, mul(r.v, step));
          }
          for (const sh of shardsRef.current) {
            sh.p = add(sh.p, mul(sh.v, step)) as [number, number];
            sh.life -= step;
          }
          shardsRef.current = shardsRef.current.filter((s) => s.life > 0);
          liveRef.current.tSim += step;
          dtLeft -= step;
        }
      }
    }

    // Update trails
    if (isPlaying) {
      const p = liveRef.current.p;
      for (let i = 0; i < 3; i++) {
        if (destroyedRef.current[i]) continue;
        trailsRef.current[i].push([p[i][0], p[i][1]]);
        while (trailsRef.current[i].length > trailMax) trailsRef.current[i].shift();
      }
    }

    if (postEventRef.current) {
      for (let i = 0; i < 3; i++) {
        if (!destroyedRef.current[i]) ensureRegionAround(liveRef.current.p[i]);
      }
      if (rocketRef.current) ensureRegionAround(rocketRef.current.p);
      if (followRef.current !== null) {
        const idx = followRef.current;
        let target: [number, number] | null = null;
        if (idx === 3 && rocketRef.current) target = rocketRef.current.p;
        else if (idx <= 2) target = destroyedRef.current[idx] ? shatterPosRef.current[idx] : liveRef.current.p[idx];
        if (target) {
          panRef.current = [target[0], target[1]];
          setPan([target[0], target[1]]);
          ensureRegionAround(panRef.current);
        }
      }
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
    preSimulateAndSetup({
      targetTEvent: mapRef.current.baseSpeed * chosenDuration,
      targetRealTime: chosenDuration,
      seed: seedImportRef.current || undefined,
    });
    seedImportRef.current = null;
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [chosenDuration]);
  useEffect(() => {
    if (!isReady) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loopRef.current);
  }, [isReady, isPlaying, speedMul, trailMax]);
  useEffect(() => {
    mapRef.current.realStart = performance.now() / 1000 - liveRef.current.tSim / (mapRef.current.baseSpeed * speedMul);
  }, [speedMul]);

  // ======== Interactions ========
  function resetAll() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    shardsRef.current = [];
    destroyedRef.current = [false, false, false];
    collisionHandledRef.current = false;
    setIsReady(false);
    setEventType(null);
    setEventBodyInfo("");
    setIsPlaying(true);
    setChosenDuration(null);
    setProgressLines([]);
    setCandidateInfo("");
    setAttemptInfo("");
    setOrientation(null);
    orientationRef.current = orientationPresets[0];
    userZoomRef.current = defaultSettings.zoom;
    setZoom(defaultSettings.zoom);
    setSpeedMul(defaultSettings.speedMul);
    setTrailMax(defaultSettings.trail);
    panRef.current = [0, 0];
    setPan([0, 0]);
    followRef.current = null;
    postEventRef.current = false;
    outerObjectsRef.current = generateRegion([0, 0]);
    regionCentersRef.current = [[0, 0]];
    rocketRef.current = null;
  }
  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    const factor = Math.pow(1.05, -e.deltaY / 100);
    userZoomRef.current = Math.max(0.5, Math.min(2.5, userZoomRef.current * factor));
    setZoom(userZoomRef.current);
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (!postEventRef.current) return;
    draggingRef.current = true;
    dragStartRef.current = [e.clientX, e.clientY];
    panStartRef.current = panRef.current;
    followRef.current = null;
  }

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - dragStartRef.current[0];
      const dy = e.clientY - dragStartRef.current[1];
      const s = scaleRef.current;
      const newPan: [number, number] = [panStartRef.current[0] - dx / s, panStartRef.current[1] + dy / s];
      panRef.current = newPan;
      setPan(newPan);
      ensureRegionAround(newPan);
    };
    const up = () => { draggingRef.current = false; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!postEventRef.current) return;
      if (e.code === "Digit1" || e.code === "Digit2" || e.code === "Digit3") {
        followRef.current = parseInt(e.code.slice(-1)) - 1;
      } else if (e.code === "Digit0") {
        if (e.shiftKey && !rocketRef.current) {
          rocketRef.current = { p: [0, 0], v: [0, 0], angle: 0, thrust: false, rotL: false, rotR: false };
        }
        if (rocketRef.current) followRef.current = 3;
      }
      if (rocketRef.current) {
        if (e.key === "w") rocketRef.current.thrust = true;
        if (e.key === "s") rocketRef.current.thrust = false;
        if (e.key === "a") rocketRef.current.rotL = true;
        if (e.key === "d") rocketRef.current.rotR = true;
      }
    };
    const up = (e: KeyboardEvent) => {
      if (!rocketRef.current) return;
      if (e.key === "a") rocketRef.current.rotL = false;
      if (e.key === "d") rocketRef.current.rotR = false;
      if (e.key === "w" || e.key === "s") rocketRef.current.thrust = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  function resetControls() {
    userZoomRef.current = defaultSettings.zoom;
    setZoom(defaultSettings.zoom);
    setSpeedMul(defaultSettings.speedMul);
    setTrailMax(defaultSettings.trail);
  }

  function togglePlay() {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      mapRef.current.realStart = performance.now() / 1000 - liveRef.current.tSim / (mapRef.current.baseSpeed * speedMul);
      setIsPlaying(true);
    }
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

  if (orientation === null) {
    return (
      <div className="relative w-full h-[88vh] md:h-[92vh] bg-black text-white font-sans overflow-hidden rounded-2xl shadow-2xl flex items-center justify-center">
        <div className="px-6 py-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-center">
          <div className="text-lg mb-3">Choose starting orientation</div>
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            {orientationPresets.map((opt) => (
              <button
                key={opt.label}
                onClick={() => { orientationRef.current = opt; setOrientation(opt); }}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20"
              >
                {opt.label}
              </button>
            ))}
            <button
              onClick={() => {
                const rand = randomOrientation();
                orientationRef.current = rand;
                setOrientation(rand);
              }}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20"
            >
              Random
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (chosenDuration === null) {
    return (
      <div className="relative w-full h-[88vh] md:h-[92vh] bg-black text-white font-sans overflow-hidden rounded-2xl shadow-2xl flex items-center justify-center">
        <div className="px-6 py-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-center">
          <div className="text-lg mb-3">Choose time until collision/ejection</div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {durationOptions.map((opt) => (
              <button
                key={opt.label}
                onClick={() => {
                  mapRef.current.baseSpeed = 1;
                  setSpeedMul(defaultSettings.speedMul);
                  setTrailMax(defaultSettings.trail);
                  userZoomRef.current = defaultSettings.zoom;
                  setZoom(defaultSettings.zoom);
                  setChosenDuration(opt.seconds);
                }}
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
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" onMouseDown={handleMouseDown} />

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
        <div className="text-right mt-2">
          <button
            onClick={() => {
              if (seedRef.current) {
                navigator.clipboard.writeText(seedRef.current);
                setCopied(true);
                setTimeout(() => setCopied(false), 1000);
              }
            }}
            className="text-xs px-2 py-1 rounded-lg bg-white/10 border border-white/20">
            {copied ? "Copied!" : "Copy seed"}
          </button>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg">
        <button
          onClick={togglePlay}
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
              <div className="flex items-center justify-between text-xs text-white/70"><span>Zoom</span><span className="tabular-nums">{zoom.toFixed(2)}×</span></div>
              <input type="range" min={0.5} max={2.5} step={0.01}
                value={zoom}
                onChange={(e) => { const z = parseFloat(e.target.value); setZoom(z); userZoomRef.current = z; }}
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
            <div className="pt-1 text-right">
              <button onClick={resetControls} className="px-3 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/20 border border-white/20">Reset</button>
            </div>
          </div>
        )}
      </div>

      {/* Loading badge */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="px-6 py-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-center relative">
            <div className="text-xs uppercase tracking-widest text-white/70 mb-2">Preparing a near-perfect 3‑body setup…</div>
            <div className="text-lg font-medium">Searching for a slight perturbation that yields an event</div>
            <div className="mt-3 text-left text-xs font-mono text-white/80 w-64">
              <div className="flex justify-between mb-1">
                <div>{candidateInfo}</div>
                <div>{attemptInfo}</div>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {progressLines.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
            <div className="mt-3 text-right">
              <button onClick={() => setImportOpen(true)} className="text-xs px-2 py-1 rounded-lg bg-white/10 border border-white/20">Skip Exploration</button>
            </div>
          </div>
          {importOpen && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="px-6 py-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-center relative">
                <button onClick={() => setImportOpen(false)} className="absolute top-2 right-2 text-white/80">×</button>
                <div className="mb-2">Paste seed</div>
                <textarea value={seedInput} onChange={e => setSeedInput(e.target.value)} className="w-64 h-24 text-black p-1 rounded" />
                <div className="mt-3 text-right">
                  <button onClick={() => {
                      try {
                        const data = JSON.parse(atob(seedInput.trim()));
                        orientationRef.current = { label: "Seed", p: data.p, v: data.v };
                        setOrientation({ label: "Seed", p: data.p, v: data.v });
                        seedImportRef.current = { p: data.p, v: data.v };
                        setChosenDuration(data.duration);
                        setImportOpen(false);
                      } catch (err) {
                        alert("Invalid seed");
                      }
                    }}
                    className="px-3 py-1 text-xs rounded-lg bg-white/10 border border-white/20">Import simulation</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

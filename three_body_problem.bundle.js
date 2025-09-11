var ThreeBodyGlassSim = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // three_body_problem.tsx
  var three_body_problem_exports = {};
  __export(three_body_problem_exports, {
    default: () => ThreeBodyGlassSim
  });
  function add(a, b) {
    return [a[0] + b[0], a[1] + b[1]];
  }
  function sub(a, b) {
    return [a[0] - b[0], a[1] - b[1]];
  }
  function mul(a, s) {
    return [a[0] * s, a[1] * s];
  }
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }
  function norm(a) {
    return Math.hypot(a[0], a[1]);
  }
  var orientationPresets = [
    {
      label: "Figure\u20118",
      p: [
        [0.97000436, -0.24308753],
        [-0.97000436, 0.24308753],
        [0, 0]
      ],
      v: [
        [0.466203685, 0.43236573],
        [0.466203685, 0.43236573],
        [-0.93240737, -0.86473146]
      ]
    },
    {
      label: "Circular",
      p: [
        [1, 0],
        [-0.5, 0.8660254],
        [-0.5, -0.8660254]
      ],
      v: [
        [0, 0.658],
        [-0.57, -0.329],
        [0.57, -0.329]
      ]
    }
  ];
  function randomOrientation() {
    const p = [];
    for (let i = 0; i < 3; i++) {
      p.push([Math.random() * 2 - 1, Math.random() * 2 - 1]);
    }
    const pc = p.reduce((acc, val) => add(acc, val), [0, 0]);
    for (let i = 0; i < 3; i++) {
      p[i] = sub(p[i], mul(pc, 1 / 3));
    }
    const v = [];
    for (let i = 0; i < 3; i++) {
      v.push([Math.random() - 0.5, Math.random() - 0.5]);
    }
    const vc = v.reduce((acc, val) => add(acc, val), [0, 0]);
    for (let i = 0; i < 3; i++) {
      v[i] = mul(sub(v[i], mul(vc, 1 / 3)), 0.5);
    }
    return { label: "Random", p, v };
  }
  var defaultSettings = { zoom: 1.35, speedMul: 1, trail: 90 };
  function ThreeBodyGlassSim() {
    const React = globalThis.React;
    const [isReady, setIsReady] = React.useState(false);
    const [isPlaying, setIsPlaying] = React.useState(true);
    const [eventType, setEventType] = React.useState(null);
    const [eventBodyInfo, setEventBodyInfo] = React.useState("");
    const [countdown, setCountdown] = React.useState(120);
    const [hexColors, setHexColors] = React.useState(["#cccccc", "#cccccc", "#cccccc"]);
    const [chosenDuration, setChosenDuration] = React.useState(null);
    const [progressLines, setProgressLines] = React.useState([]);
    const [candidateInfo, setCandidateInfo] = React.useState("");
    const [attemptInfo, setAttemptInfo] = React.useState("");
    const [orientation, setOrientation] = React.useState(null);
    const [zoom, setZoom] = React.useState(defaultSettings.zoom);
    const orientationRef = React.useRef(orientationPresets[0]);
    const outerDefsRef = React.useRef([]);
    const canvasRef = React.useRef(null);
    const rafRef = React.useRef(null);
    const G = 1;
    const mass = 1;
    const radius = 0.035;
    const softEps = 1e-4;
    const targetScaleRef = React.useRef(180);
    const scaleRef = React.useRef(180);
    const userZoomRef = React.useRef(defaultSettings.zoom);
    const preBufRef = React.useRef(null);
    const liveRef = React.useRef({
      p: [[0, 0], [0, 0], [0, 0]],
      v: [[0, 0], [0, 0], [0, 0]],
      tSim: 0
    });
    const mapRef = React.useRef({ realStart: 0, baseSpeed: 1 });
    const [speedMul, setSpeedMul] = React.useState(1);
    const trailsRef = React.useRef([[], [], []]);
    const [trailMax, setTrailMax] = React.useState(90);
    const [panelOpen, setPanelOpen] = React.useState(true);
    const eventIndexRef = React.useRef(-1);
    const shardsRef = React.useRef([]);
    const destroyedRef = React.useRef([false, false, false]);
    const collisionHandledRef = React.useRef(false);
    function hslToHex(h, s, l) {
      l = Math.max(0, Math.min(1, l));
      s = Math.max(0, Math.min(1, s));
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const hp = h / 60;
      const x = c * (1 - Math.abs(hp % 2 - 1));
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
    function accelerations(p, t, includeOuter) {
      const a = [[0, 0], [0, 0], [0, 0]];
      for (let i = 0; i < 3; i++) {
        if (destroyedRef.current[i]) continue;
        for (let j = 0; j < 3; j++) if (j !== i && !destroyedRef.current[j]) {
          const r = sub(p[j], p[i]);
          const d2 = r[0] * r[0] + r[1] * r[1] + softEps * softEps;
          const d = Math.sqrt(d2);
          const fac = G * mass / (d2 * d);
          a[i] = add(a[i], mul(r, fac));
        }
        if (includeOuter) {
          for (const obj of outerDefsRef.current) {
            const theta = obj.theta0 + obj.w * t;
            const pos = [obj.R * Math.cos(theta), obj.R * Math.sin(theta)];
            const r = sub(pos, p[i]);
            const d2 = r[0] * r[0] + r[1] * r[1] + softEps * softEps;
            const d = Math.sqrt(d2);
            const fac = G * obj.m / (d2 * d);
            a[i] = add(a[i], mul(r, fac));
          }
        }
      }
      return a;
    }
    function rk4Step(p, v, dt, t, includeOuter) {
      const a1 = accelerations(p, t, includeOuter);
      const pv1 = p.map((pi, i) => add(pi, mul(v[i], dt * 0.5)));
      const vv1 = v.map((vi, i) => add(vi, mul(a1[i], dt * 0.5)));
      const a2 = accelerations(pv1, t + dt * 0.5, includeOuter);
      const pv2 = p.map((pi, i) => add(pi, mul(vv1[i], dt * 0.5)));
      const vv2 = v.map((vi, i) => add(vi, mul(a2[i], dt * 0.5)));
      const a3 = accelerations(pv2, t + dt * 0.5, includeOuter);
      const pv3 = p.map((pi, i) => add(pi, mul(vv2[i], dt)));
      const vv3 = v.map((vi, i) => add(vi, mul(a3[i], dt)));
      const a4 = accelerations(pv3, t + dt, includeOuter);
      const pNext = p.map((pi, i) => add(pi, mul(add(add(v[i], mul(add(vv1[i], vv2[i]), 2)), vv3[i]), dt / 6)));
      const vNext = v.map((vi, i) => add(vi, mul(add(add(a1[i], mul(add(a2[i], a3[i]), 2)), a4[i]), dt / 6)));
      return { p: pNext, v: vNext };
    }
    function handleCollision(p, v) {
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
              p[i] = add(p[i], corr);
              p[j] = sub(p[j], corr);
            }
            const impulse = mul(n, vrn);
            v[i] = sub(v[i], impulse);
            v[j] = add(v[j], impulse);
          }
        }
      }
    }
    function handleOuterCollisions(p, t) {
      for (let i = 0; i < 3; i++) {
        if (destroyedRef.current[i]) continue;
        for (const obj of outerDefsRef.current) {
          const theta = obj.theta0 + obj.w * t;
          const pos = [obj.R * Math.cos(theta), obj.R * Math.sin(theta)];
          const d = norm(sub(p[i], pos));
          if (d <= radius + obj.r) {
            const c = p[i];
            for (let s = 0; s < 40; s++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = 0.6 + Math.random() * 0.8;
              const color = hexColors[i];
              shardsRef.current.push({ p: [c[0], c[1]], v: [Math.cos(ang) * spd, Math.sin(ang) * spd], life: 3, color });
            }
            destroyedRef.current[i] = true;
            liveRef.current.p[i] = [9999, 9999];
            liveRef.current.v[i] = [0, 0];
            break;
          }
        }
      }
    }
    function energyOfBody(k, p, v) {
      const v2 = dot(v[k], v[k]);
      let U = 0;
      for (let j = 0; j < 3; j++) if (j !== k) {
        const r = norm(sub(p[k], p[j]));
        U -= G * mass * mass / Math.max(r, 1e-6);
      }
      return 0.5 * mass * v2 + U;
    }
    function centerOfMass(p) {
      let pc = [0, 0];
      for (let i = 0; i < 3; i++) pc = add(pc, p[i]);
      return { pc: mul(pc, 1 / 3) };
    }
    async function preSimulateAndSetup(opts) {
      const { base, tri } = randomTriadicHex();
      const codes = [base, tri[0], tri[1]];
      setHexColors(codes);
      setProgressLines(["Starting search for perturbations..."]);
      setCandidateInfo("");
      setAttemptInfo("");
      shardsRef.current = [];
      destroyedRef.current = [false, false, false];
      collisionHandledRef.current = false;
      let pBase = orientationRef.current.p.map((x) => [...x]);
      let vBase = orientationRef.current.v.map((x) => [...x]);
      const epsCandidates = [1e-5, 5e-5, 1e-4, 3e-4, 1e-3, 3e-3, 7e-3, 0.012];
      const dt = 4e-3;
      const target = opts?.targetTEvent ?? opts?.targetRealTime;
      const maxSteps = target ? Math.max(22e4, Math.ceil(target / dt) + 5e3) : 22e4;
      const collR = 2 * radius;
      let best = null;
      const tol = target ? Math.max(5, target * 0.02) : 0;
      for (let pass = 0; pass < 3; pass++) {
        for (let e = 0; e < epsCandidates.length; e++) {
          setCandidateInfo(`\u2208 candidate ${e + 1}/${epsCandidates.length}`);
          await new Promise((r) => setTimeout(r, 0));
          for (let attempt = 0; attempt < 6; attempt++) {
            setAttemptInfo(`attempt ${attempt + 1}/6`);
            await new Promise((r) => setTimeout(r, 0));
            let p = pBase.map((x) => [...x]);
            let v = vBase.map((x) => [...x]);
            const ang = Math.random() * Math.PI * 2;
            const eps = epsCandidates[e];
            v[0] = add(v[0], [Math.cos(ang) * eps, Math.sin(ang) * eps]);
            const buffer = [];
            let found = false;
            let kind = "collision";
            let info = "";
            let tEvent = 0;
            for (let step = 0; step < maxSteps; step++) {
              buffer.push({ p: [[...p[0]], [...p[1]], [...p[2]]], v: [[...v[0]], [...v[1]], [...v[2]]] });
              if (step % 5e3 === 0) {
                const pct = (step / maxSteps * 100).toFixed(1);
                setProgressLines((l) => [...l.slice(-40), `    ${pct}%`]);
                await new Promise((r) => setTimeout(r, 0));
              }
              let collidedPair = null;
              outer: for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
                const d = norm(sub(p[i], p[j]));
                if (d <= collR) {
                  collidedPair = [i, j];
                  break outer;
                }
              }
              if (collidedPair) {
                found = true;
                kind = "collision";
                info = `${collidedPair[0] + 1}\u2194${collidedPair[1] + 1}`;
                tEvent = step * dt;
                break;
              }
              const { pc } = centerOfMass(p);
              const pRel = p.map((pi) => sub(pi, pc));
              const vRel = v.map((vi) => vi);
              const R = pRel.map((ri) => norm(ri));
              for (let k = 0; k < 3; k++) {
                const eSpec = energyOfBody(k, pRel, vRel);
                const outward = dot(pRel[k], vRel[k]) > 0;
                if (R[k] > 7 && outward && eSpec > 0) {
                  let pTest = p.map((x) => [...x]);
                  let vTest = v.map((x) => [...x]);
                  let stable = true;
                  let tCurr = step * dt;
                  for (let s = 0; s < 5e3; s++) {
                    const nxt = rk4Step(pTest, vTest, dt, tCurr, false);
                    tCurr += dt;
                    pTest = nxt.p;
                    vTest = nxt.v;
                    const { pc: pc2 } = centerOfMass(pTest);
                    const pRel2 = pTest.map((pi) => sub(pi, pc2));
                    if (norm(pRel2[k]) < 6) {
                      stable = false;
                      break;
                    }
                  }
                  if (stable) {
                    found = true;
                    kind = "ejection";
                    info = `body ${k + 1}`;
                    tEvent = step * dt;
                    break;
                  }
                }
              }
              if (found) break;
              const next = rk4Step(p, v, dt, step * dt, false);
              p = next.p;
              v = next.v;
            }
            if (found) {
              if (!best) {
                best = { buffer, tEvent, kind, info };
              } else if (target != null) {
                const prevErr = Math.abs(best.tEvent - target);
                const newErr = Math.abs(tEvent - target);
                if (newErr < prevErr) best = { buffer, tEvent, kind, info };
              } else {
                if (tEvent < best.tEvent) best = { buffer, tEvent, kind, info };
              }
            }
          }
          if (best && target != null && Math.abs(best.tEvent - target) <= tol) break;
        }
        if (!best) {
          const tEvent = 90;
          preBufRef.current = { dt, states: [], tEvent, kind: "ejection", info: "body 3" };
          setEventType("ejection");
          setEventBodyInfo("body 3");
        } else {
          preBufRef.current = { dt, states: best.buffer, tEvent: best.tEvent, kind: best.kind, info: best.info };
          eventIndexRef.current = Math.floor(best.tEvent / dt);
          setEventType(best.kind);
          setEventBodyInfo(best.info);
        }
        if (preBufRef.current && preBufRef.current.states.length > 0) {
          const startState = preBufRef.current.states[0];
          liveRef.current = { p: startState.p.map((x) => [...x]), v: startState.v.map((x) => [...x]), tSim: 0 };
        } else {
          liveRef.current = { p: [[0, 0], [0, 0], [0, 0]], v: [[0, 0], [0, 0], [0, 0]], tSim: 0 };
        }
        mapRef.current.realStart = performance.now() / 1e3;
        trailsRef.current = [[], [], []];
        const span = preBufRef.current && preBufRef.current.states.length ? Math.max(
          norm(sub(preBufRef.current.states[0].p[0], preBufRef.current.states[0].p[1])),
          norm(sub(preBufRef.current.states[0].p[1], preBufRef.current.states[0].p[2])),
          norm(sub(preBufRef.current.states[0].p[2], preBufRef.current.states[0].p[0]))
        ) : 1.2;
        targetScaleRef.current = Math.min(300, Math.max(140, 300 / Math.max(span, 0.4)));
        scaleRef.current = targetScaleRef.current * userZoomRef.current;
        setProgressLines((l) => [...l.slice(-40), "Finalizing setup..."]);
        await new Promise((r) => setTimeout(r, 0));
        setIsReady(true);
        setProgressLines([]);
        setCandidateInfo("");
        setAttemptInfo("");
      }
      function setupCanvas(ctx) {
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        const { clientWidth, clientHeight } = ctx.canvas;
        ctx.canvas.width = Math.floor(clientWidth * dpr);
        ctx.canvas.height = Math.floor(clientHeight * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      function worldToScreen(x, y, W, H) {
        const s = scaleRef.current;
        const cx = W / 2, cy = H / 2;
        return [cx + x * s, cy - y * s];
      }
      function drawScene(ctx, p) {
        const W = ctx.canvas.clientWidth;
        const H = ctx.canvas.clientHeight;
        const { pc } = centerOfMass(p);
        const maxR = Math.max(
          norm(sub(p[0], pc)),
          norm(sub(p[1], pc)),
          norm(sub(p[2], pc))
        );
        const baseTarget = maxR > 2.6 ? Math.max(70, 280 / (maxR + 0.6)) : targetScaleRef.current;
        const targetWithUser = baseTarget * userZoomRef.current;
        scaleRef.current = scaleRef.current * 0.88 + targetWithUser * 0.12;
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, "#0b1020");
        grad.addColorStop(1, "#060912");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.save();
        ctx.globalAlpha = 0.08;
        const step = 80;
        ctx.beginPath();
        for (let x = 0; x < W; x += step) {
          ctx.moveTo(x + 0.5, 0);
          ctx.lineTo(x + 0.5, H);
        }
        for (let y = 0; y < H; y += step) {
          ctx.moveTo(0, y + 0.5);
          ctx.lineTo(W, y + 0.5);
        }
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();
        ctx.restore();
        const glow = (hex, alpha = 0.9) => {
          ctx.shadowBlur = 22;
          ctx.shadowColor = hex + Math.floor(alpha * 255).toString(16).padStart(2, "0");
        };
        for (let i = 0; i < 3; i++) {
          const trail = trailsRef.current[i];
          const n = trail.length;
          if (n > 2) {
            for (let k = 1; k < n; k++) {
              const [x0, y0] = worldToScreen(trail[k - 1][0], trail[k - 1][1], W, H);
              const [x1, y1] = worldToScreen(trail[k][0], trail[k][1], W, H);
              const t = k / n;
              ctx.save();
              ctx.globalAlpha = 0.15 + 0.55 * t * t;
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
        for (const obj of outerDefsRef.current) {
          const theta = obj.theta0 + obj.w * liveRef.current.tSim;
          const pos = [obj.R * Math.cos(theta), obj.R * Math.sin(theta)];
          const [x, y] = worldToScreen(pos[0], pos[1], W, H);
          ctx.save();
          glow(obj.color, 0.7);
          ctx.fillStyle = obj.color;
          ctx.beginPath();
          ctx.arc(x, y, obj.r * scaleRef.current, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
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
      }
      const loopRef = React.useRef(() => {
      });
      loopRef.current = () => {
        const buf = preBufRef.current;
        if (!buf) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        setupCanvas(ctx);
        const now = performance.now() / 1e3;
        const realElapsed = Math.max(0, now - mapRef.current.realStart);
        const simRate = mapRef.current.baseSpeed * speedMul;
        if (isPlaying) {
          const simTimeTarget = Math.max(0, realElapsed * simRate);
          const tEvent = buf.tEvent;
          if (simTimeTarget <= tEvent) {
            const idx = Math.min(buf.states.length - 1, Math.floor(simTimeTarget / buf.dt));
            const state = buf.states[idx] ?? buf.states[buf.states.length - 1];
            if (state) {
              liveRef.current.p = state.p.map((x) => [...x]);
              liveRef.current.v = state.v.map((x) => [...x]);
              liveRef.current.tSim = idx * buf.dt;
            }
          } else {
            if (Math.abs(liveRef.current.tSim - tEvent) < buf.dt) {
              const exact = buf.states[Math.min(buf.states.length - 1, Math.floor(tEvent / buf.dt))];
              if (exact) {
                liveRef.current.p = exact.p.map((x) => [...x]);
                liveRef.current.v = exact.v.map((x) => [...x]);
                liveRef.current.tSim = tEvent;
                if (buf.kind === "collision") handleCollision(liveRef.current.p, liveRef.current.v);
              }
            }
            if (!collisionHandledRef.current && buf.kind === "collision" && simTimeTarget > tEvent) {
              const pair = buf.info.split("\u2194").map((n) => parseInt(n) - 1);
              const c = mul(add(liveRef.current.p[pair[0]], liveRef.current.p[pair[1]]), 0.5);
              for (let s = 0; s < 40; s++) {
                const ang = Math.random() * Math.PI * 2;
                const spd = 0.6 + Math.random() * 0.8;
                const color = hexColors[pair[Math.floor(Math.random() * 2)]];
                shardsRef.current.push({ p: [c[0], c[1]], v: [Math.cos(ang) * spd, Math.sin(ang) * spd], life: 3, color });
              }
              destroyedRef.current[pair[0]] = true;
              destroyedRef.current[pair[1]] = true;
              liveRef.current.p[pair[0]] = [9999, 9999];
              liveRef.current.p[pair[1]] = [9999, 9999];
              liveRef.current.v[pair[0]] = [0, 0];
              liveRef.current.v[pair[1]] = [0, 0];
              collisionHandledRef.current = true;
            }
            let dtLeft = simTimeTarget - liveRef.current.tSim;
            const h = 5e-3;
            while (dtLeft > 1e-6) {
              const step = Math.min(h, dtLeft);
              const next = rk4Step(liveRef.current.p, liveRef.current.v, step, liveRef.current.tSim, true);
              liveRef.current.p = next.p;
              liveRef.current.v = next.v;
              handleCollision(liveRef.current.p, liveRef.current.v);
              handleOuterCollisions(liveRef.current.p, liveRef.current.tSim);
              for (const sh of shardsRef.current) {
                sh.p = add(sh.p, mul(sh.v, step));
                sh.life -= step;
              }
              shardsRef.current = shardsRef.current.filter((s) => s.life > 0);
              liveRef.current.tSim += step;
              dtLeft -= step;
            }
          }
        }
        if (isPlaying) {
          const p = liveRef.current.p;
          for (let i = 0; i < 3; i++) {
            if (destroyedRef.current[i]) continue;
            trailsRef.current[i].push([p[i][0], p[i][1]]);
            while (trailsRef.current[i].length > trailMax) trailsRef.current[i].shift();
          }
        }
        drawScene(ctx, liveRef.current.p);
        if (buf) {
          const tRemainingSim = Math.max(0, buf.tEvent - liveRef.current.tSim);
          const tRemainingReal = tRemainingSim / (mapRef.current.baseSpeed * speedMul);
          setCountdown(tRemainingReal);
        }
        rafRef.current = requestAnimationFrame(loopRef.current);
      };
      React.useEffect(() => {
        if (chosenDuration == null) return;
        preSimulateAndSetup({
          targetTEvent: mapRef.current.baseSpeed * chosenDuration,
          targetRealTime: chosenDuration
        });
        return () => {
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
      }, [chosenDuration]);
      React.useEffect(() => {
        if (!isReady) return;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(loopRef.current);
      }, [isReady, isPlaying, speedMul, trailMax]);
      React.useEffect(() => {
        mapRef.current.realStart = performance.now() / 1e3 - liveRef.current.tSim / (mapRef.current.baseSpeed * speedMul);
      }, [speedMul]);
      React.useEffect(() => {
        initOuterObjects();
      }, []);
      function initOuterObjects() {
        outerDefsRef.current = [];
        const nOuter = 4 + Math.floor(Math.random() * 4);
        for (let i = 0; i < nOuter; i++) {
          const R = 12 + Math.random() * 8;
          const theta0 = Math.random() * Math.PI * 2;
          const w = 0.02 + Math.random() * 0.05;
          const m = 2 + Math.random() * 4;
          const rObj = 0.15 + Math.random() * 0.3;
          const color = hslToHex(Math.random() * 360, 0.6, 0.5);
          outerDefsRef.current.push({ R, theta0, w, m, r: rObj, color });
        }
      }
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
        initOuterObjects();
        userZoomRef.current = defaultSettings.zoom;
        setZoom(defaultSettings.zoom);
        setSpeedMul(defaultSettings.speedMul);
        setTrailMax(defaultSettings.trail);
      }
      function handleWheel(e) {
        e.preventDefault();
        const factor = Math.pow(1.05, -e.deltaY / 100);
        userZoomRef.current = Math.max(0.5, Math.min(2.5, userZoomRef.current * factor));
        setZoom(userZoomRef.current);
      }
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
          mapRef.current.realStart = performance.now() / 1e3 - liveRef.current.tSim / (mapRef.current.baseSpeed * speedMul);
          setIsPlaying(true);
        }
      }
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
        { label: "2.5h", seconds: 9e3 },
        { label: "3h", seconds: 10800 },
        { label: "6h", seconds: 21600 },
        { label: "12h", seconds: 43200 },
        { label: "24h", seconds: 86400 }
      ];
      const eventLabel = eventType === "collision" ? `collision (${eventBodyInfo})` : eventType === "ejection" ? `ejection of ${eventBodyInfo}` : "an event";
      if (orientation === null) {
        return /* @__PURE__ */ React.createElement("div", { className: "relative w-full h-[88vh] md:h-[92vh] bg-black text-white font-sans overflow-hidden rounded-2xl shadow-2xl flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "px-6 py-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-lg mb-3" }, "Choose starting orientation"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2 text-sm mb-3" }, orientationPresets.map((opt) => /* @__PURE__ */ React.createElement(
          "button",
          {
            key: opt.label,
            onClick: () => {
              orientationRef.current = opt;
              setOrientation(opt);
            },
            className: "px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20"
          },
          opt.label
        )), /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => {
              const rand = randomOrientation();
              orientationRef.current = rand;
              setOrientation(rand);
            },
            className: "px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20"
          },
          "Random"
        ))));
      }
      if (chosenDuration === null) {
        return /* @__PURE__ */ React.createElement("div", { className: "relative w-full h-[88vh] md:h-[92vh] bg-black text-white font-sans overflow-hidden rounded-2xl shadow-2xl flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "px-6 py-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-lg mb-3" }, "Choose time until collision/ejection"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-3 gap-2 text-sm" }, durationOptions.map((opt) => /* @__PURE__ */ React.createElement(
          "button",
          {
            key: opt.label,
            onClick: () => {
              mapRef.current.baseSpeed = 0.35 + Math.random() * (1.5 - 0.35);
              setSpeedMul(defaultSettings.speedMul);
              setTrailMax(defaultSettings.trail);
              userZoomRef.current = defaultSettings.zoom;
              setZoom(defaultSettings.zoom);
              setChosenDuration(opt.seconds);
            },
            className: "px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20"
          },
          opt.label
        )))));
      }
      return /* @__PURE__ */ React.createElement("div", { className: "relative w-full h-[88vh] md:h-[92vh] bg-black text-white font-sans overflow-hidden rounded-2xl shadow-2xl", onWheel: handleWheel }, /* @__PURE__ */ React.createElement("canvas", { ref: canvasRef, className: "absolute inset-0 w-full h-full" }), /* @__PURE__ */ React.createElement("div", { className: "absolute top-4 left-4 px-4 py-3 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs uppercase tracking-wider text-white/70" }, "Time to ", eventLabel), /* @__PURE__ */ React.createElement("div", { className: "text-3xl font-semibold tabular-nums" }, Math.floor(countdown / 60).toString().padStart(2, "0"), ":", Math.floor(countdown % 60).toString().padStart(2, "0"))), /* @__PURE__ */ React.createElement("div", { className: "absolute top-4 right-4 px-4 py-3 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs uppercase tracking-wider text-white/70 mb-1" }, "Triadic palette"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, hexColors.map((hex, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "w-5 h-5 rounded-full", style: { background: hex } }), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-mono text-white/80" }, hex.toUpperCase()))))), /* @__PURE__ */ React.createElement("div", { className: "absolute left-1/2 -translate-x-1/2 bottom-4 flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: togglePlay,
          className: "px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition"
        },
        isPlaying ? "Pause" : "Play"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: resetAll,
          className: "px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition leading-tight"
        },
        /* @__PURE__ */ React.createElement("span", { className: "block" }, "Reset"),
        /* @__PURE__ */ React.createElement("span", { className: "block text-xs opacity-80" }, "(new colors)")
      ), isReady && preBufRef.current && /* @__PURE__ */ React.createElement("div", { className: "text-sm text-white/70 font-medium" }, "Event: ", /* @__PURE__ */ React.createElement("span", { className: "text-white/90" }, eventLabel), /* @__PURE__ */ React.createElement("span", { className: "mx-2" }, "\u2022"), "Sim @ event: ", /* @__PURE__ */ React.createElement("span", { className: "tabular-nums text-white/90" }, preBufRef.current.tEvent.toFixed(2), "s"), /* @__PURE__ */ React.createElement("span", { className: "mx-2" }, "\u2022"), "Speed: ", /* @__PURE__ */ React.createElement("span", { className: "tabular-nums text-white/90" }, "\xD7", (mapRef.current.baseSpeed * speedMul).toFixed(2)))), /* @__PURE__ */ React.createElement("div", { className: "absolute left-4 bottom-24 md:bottom-28 px-4 py-3 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg w-[min(88vw,420px)]" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs uppercase tracking-widest text-white/70" }, "Controls"), /* @__PURE__ */ React.createElement("button", { onClick: () => setPanelOpen((v) => !v), className: "text-white/80 text-xs px-2 py-1 rounded-lg bg-white/10 border border-white/20" }, panelOpen ? "Minimize" : "Expand")), panelOpen && /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-xs text-white/70" }, /* @__PURE__ */ React.createElement("span", null, "Zoom"), /* @__PURE__ */ React.createElement("span", { className: "tabular-nums" }, zoom.toFixed(2), "\xD7")), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "range",
          min: 0.5,
          max: 2.5,
          step: 0.01,
          value: zoom,
          onChange: (e) => {
            const z = parseFloat(e.target.value);
            setZoom(z);
            userZoomRef.current = z;
          },
          className: "w-full accent-white/90"
        }
      )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-xs text-white/70" }, /* @__PURE__ */ React.createElement("span", null, "Speed"), /* @__PURE__ */ React.createElement("span", { className: "tabular-nums" }, "\xD7", (mapRef.current.baseSpeed * speedMul).toFixed(2))), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "range",
          min: 0.25,
          max: 3,
          step: 0.01,
          value: speedMul,
          onChange: (e) => setSpeedMul(parseFloat(e.target.value)),
          className: "w-full accent-white/90"
        }
      )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between text-xs text-white/70" }, /* @__PURE__ */ React.createElement("span", null, "Trail length"), /* @__PURE__ */ React.createElement("span", { className: "tabular-nums" }, trailMax)), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "range",
          min: 20,
          max: 600,
          step: 1,
          value: trailMax,
          onChange: (e) => setTrailMax(parseInt(e.target.value)),
          className: "w-full accent-white/90"
        }
      )), /* @__PURE__ */ React.createElement("div", { className: "pt-1 text-right" }, /* @__PURE__ */ React.createElement("button", { onClick: resetControls, className: "px-3 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/20 border border-white/20" }, "Reset")))), !isReady && /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { className: "px-6 py-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl text-center" }, /* @__PURE__ */ React.createElement("div", { className: "text-xs uppercase tracking-widest text-white/70 mb-2" }, "Preparing a near-perfect 3\u2011body setup\u2026"), /* @__PURE__ */ React.createElement("div", { className: "text-lg font-medium" }, "Searching for a slight perturbation that yields an event"), /* @__PURE__ */ React.createElement("div", { className: "mt-3 text-left text-xs font-mono text-white/80 w-64" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between mb-1" }, /* @__PURE__ */ React.createElement("div", null, candidateInfo), /* @__PURE__ */ React.createElement("div", null, attemptInfo)), /* @__PURE__ */ React.createElement("div", { className: "max-h-40 overflow-y-auto" }, progressLines.map((line, i) => /* @__PURE__ */ React.createElement("div", { key: i }, line)))))));
    }
  }
  return __toCommonJS(three_body_problem_exports);
})();

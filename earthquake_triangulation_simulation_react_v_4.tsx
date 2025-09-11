import { motion } from "framer-motion";

declare const React: typeof import("react");
const { useEffect, useRef, useState } = React;
type ReactMouseEvent<T = Element> = React.MouseEvent<T>;

// Compact, ASCII-only, safer build: no template literals in styles, no bracketed Tailwind classes
// Key fixes:
// 1) Epicenter is a DOM overlay dot (zIndex 50) so it cannot be covered.
// 2) Bottom coverage chart panel is visible and toggles open/closed.
// 3) Removed potential parsing pitfalls and non-null assertions.

// Utils
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const dist = (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x1 - x2, y1 - y2);
const rndPt = (w: number, h: number, m: number) => ({ x: m + Math.random() * (w - 2 * m), y: m + Math.random() * (h - 2 * m) });
function rndSpaced(
  w: number,
  h: number,
  c: number,
  m: number,
  s: number,
  avoid?: { x: number; y: number; r: number }
) {
  const pts: { x: number; y: number }[] = [];
  let tries = 0;
  while (pts.length < c && tries < 10000) {
    tries++;
    const p = rndPt(w, h, m);
    if (avoid && dist(p.x, p.y, avoid.x, avoid.y) < avoid.r) continue;
    if (pts.every(q => dist(p.x, p.y, q.x, q.y) >= s)) pts.push(p);
  }
  while (pts.length < c) pts.push(rndPt(w, h, m));
  return pts;
}

// Types
interface Station {
  x: number; y: number; tP: number; tS: number; dTrue: number; dEst: number; dMin: number; dMax: number; revealed: boolean;
}
interface Scenario {
  origin: { x: number; y: number }; stations: Station[];
}

export default function EarthquakeTriangulation() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const olRef = useRef<HTMLCanvasElement | null>(null);

  const [sz, setSz] = useState({ width: 960, height: 600 });
  const [sc, setSc] = useState<Scenario | null>(null);
  const [run, setRun] = useState(true);
  const [frozen, setFrozen] = useState(false);
  const [seed, setSeed] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [forceO, setForceO] = useState<{ x: number; y: number } | null>(null);
  const [freezeTS, setFreezeTS] = useState<number | null>(null);
  const [startTS, setStartTS] = useState<number | null>(null);
  const [revealK, setRevealK] = useState<number[]>([]);
  const [chartOpen, setChartOpen] = useState(false);
  const [pct, setPct] = useState<number[]>([]);
  const [infoOpen, setInfoOpen] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(true);
  const baseAreaCnt = useRef(0);
  const pauseAt = useRef<number | null>(null);

  // Tunables
  const vP = 260, vS = 150; // px/s
  const tReveal = 1.25; // s
  const tDelay = 0.35;  // s
  const finalDelay = 1.2; // s (real time)
  const finalFade = 1.4;  // s (real time)

  // Responsive sizing
  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(list => {
      for (const entry of list) {
        const r = entry.contentRect;
        setSz({ width: Math.max(640, r.width), height: Math.max(420, r.height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Init / reset scenario
  useEffect(() => {
    const w = sz.width, h = sz.height; const m = Math.min(w, h) * 0.08;
    const origin = forceO ? forceO : rndPt(w, h, m);
    const sPos = rndSpaced(w, h, 5, m, Math.min(w, h) * 0.15, { x: origin.x, y: origin.y, r: Math.min(w, h) * 0.2 });

    const S: Station[] = sPos.map(p => {
      const d = dist(p.x, p.y, origin.x, origin.y);
      const tP = d / vP; const tS = d / vS; const dEst = (vP * vS * (tS - tP)) / (vP - vS);
      const em = 0.06 + Math.random() * 0.12; // under
      const ep = 0.06 + Math.random() * 0.16; // over
      const dMin = Math.max(4, dEst * (1 - em));
      const dMax = Math.max(dMin + 4, dEst * (1 + ep));
      return { x: p.x, y: p.y, tP, tS, dTrue: d, dEst, dMin, dMax, revealed: false };
    }).sort((a, b) => a.tS - b.tS);

    setSc({ origin, stations: S });
    setStartTS(performance.now() / 1000);
    setRevealK(new Array(5).fill(0));
    setRun(true); setFrozen(false); setFreezeTS(null); setForceO(null);
    setPct([]); baseAreaCnt.current = 0;
  }, [seed, sz.width, sz.height]);

  // Main loop
  useEffect(() => {
    if (!sc) return;
    const base = baseRef.current; const ol = olRef.current; if (!base || !ol) return;
    const ctx = base.getContext("2d"); const octx = ol.getContext("2d"); if (!ctx || !octx) return;
    const w = sz.width, h = sz.height;

    // pixel ratio
    const dpr = window.devicePixelRatio || 1;
    [base, ol].forEach(c => { c.width = Math.floor(w * dpr); c.height = Math.floor(h * dpr); (c.style as any).width = w + "px"; (c.style as any).height = h + "px"; });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); octx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = 0; const rStarts = sc.stations.map((s, i) => s.tS + i * tDelay);

    const drawBG = () => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#0b1220"); g.addColorStop(1, "#060912");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.save(); ctx.globalAlpha = 0.1; const step = 40; ctx.beginPath();
      for (let x = 0; x <= w; x += step) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
      for (let y = 0; y <= h; y += step) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
      ctx.strokeStyle = "#93a2b833"; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    };

    const drawDot = (c: CanvasRenderingContext2D) => {
      const o = sc.origin; c.save(); c.shadowColor = "#ef4444"; c.shadowBlur = 18; c.fillStyle = "#ef4444"; c.beginPath(); c.arc(o.x, o.y, 4.5, 0, Math.PI * 2); c.fill(); c.restore();
    };

    const drawOrigin = (t: number) => {
      // draw red dot on base canvas too (DOM overlay also added in JSX for absolute topmost)
      drawDot(ctx);
      if (frozen) return; const rP = vP * t, rS = vS * t;
      const wave = (r: number, col: string) => { if (r < 4) return; ctx.save(); ctx.beginPath(); ctx.arc(sc.origin.x, sc.origin.y, r, 0, Math.PI * 2); ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.shadowColor = col; ctx.shadowBlur = 18; ctx.globalAlpha = 0.8; ctx.stroke(); ctx.restore(); };
      wave(rP, "#60a5fa"); wave(rS, "#34d399");
    };

    const updateCoverage = (k: number) => {
      const bands = sc.stations.slice(0, k).map(s => ({ x: s.x, y: s.y, r1: s.dMin, r2: s.dMax }));
      const scale = 0.35; const W = Math.floor(w * scale); const H = Math.floor(h * scale);
      let covered = 0;
      for (let yy = 0; yy < H; yy++) {
        for (let xx = 0; xx < W; xx++) {
          let ok = true;
          for (let i = 0; i < bands.length; i++) {
            const b = bands[i]; const dx = xx / scale - b.x; const dy = yy / scale - b.y; const d2 = dx * dx + dy * dy; if (d2 < b.r1 * b.r1 || d2 > b.r2 * b.r2) { ok = false; break; }
          }
          if (ok) covered++;
        }
      }
      if (k === 1) { baseAreaCnt.current = covered; setPct([100]); }
      else {
        const p = baseAreaCnt.current ? (covered / baseAreaCnt.current * 100) : 0;
        setPct(prev => { const arr = prev.slice(0, k - 1); arr.push(clamp(parseFloat(p.toFixed(1)), 0, 100)); return arr; });
      }
    };

    const drawStations = (t: number) => {
      const bands: { x: number; y: number; r1: number; r2: number }[] = [];
      sc.stations.forEach((s, idx) => {
        // station marker
        ctx.save(); ctx.beginPath(); ctx.arc(s.x, s.y, 5, 0, Math.PI * 2); ctx.fillStyle = "#e5e7eb"; ctx.shadowColor = "#93c5fd"; ctx.shadowBlur = 10; ctx.fill();
        if (t >= s.tP && !frozen) { const p = 1 + 0.65 * Math.sin((t - s.tP) * 10); ctx.beginPath(); ctx.arc(s.x, s.y, 8 * p, 0, Math.PI * 2); ctx.strokeStyle = "#60a5fa88"; ctx.lineWidth = 1.25; ctx.stroke(); }
        if (t >= s.tS && !frozen) { const p2 = 1 + 0.65 * Math.sin((t - s.tS) * 8); ctx.beginPath(); ctx.arc(s.x, s.y, 12 * p2, 0, Math.PI * 2); ctx.strokeStyle = "#34d39988"; ctx.lineWidth = 1.25; ctx.stroke(); }
        ctx.restore();

        // annulus reveal
        const rs = rStarts[idx];
        if (t >= rs && !s.revealed) { const k = clamp((t - rs) / tReveal, 0, 1); if (k >= 1) { s.revealed = true; revealK[idx] = 1; updateCoverage(idx + 1); } else { revealK[idx] = k; } }
        const k2 = s.revealed ? 1 : revealK[idx];
        if (k2 > 0) {
          const r1 = s.dMin * k2, r2 = s.dMax * k2; bands.push({ x: s.x, y: s.y, r1, r2 });
          ctx.save(); ctx.globalAlpha = 0.08; ctx.fillStyle = "#7dd3fc"; ctx.beginPath(); ctx.arc(s.x, s.y, r2, 0, Math.PI * 2); ctx.arc(s.x, s.y, r1, 0, Math.PI * 2, true); ctx.fill(); ctx.restore();
          ctx.save(); ctx.beginPath(); ctx.arc(s.x, s.y, r2, 0, Math.PI * 2); ctx.lineWidth = 2.25 + 1.25 * (s.revealed ? 1 : k2); ctx.strokeStyle = s.revealed ? "#e879f9" : "#a78bfa"; ctx.shadowColor = s.revealed ? "#e879f9" : "#a78bfa"; ctx.shadowBlur = 12; ctx.globalAlpha = 0.95; ctx.stroke(); ctx.restore();
          ctx.save(); ctx.beginPath(); ctx.arc(s.x, s.y, r1, 0, Math.PI * 2); ctx.lineWidth = 1.4; ctx.strokeStyle = "#c4b5fd88"; ctx.stroke(); ctx.restore();
        }
      });
      return bands;
    };

    const drawMask = (bands: { x: number; y: number; r1: number; r2: number }[], finalK: number) => {
      octx.clearRect(0, 0, w, h); if (!bands.length) return;
      const W = w, H = h; const counts = new Uint8Array(W * H);
      for (let bi = 0; bi < bands.length; bi++) {
        const b = bands[bi]; const xmin = Math.max(0, Math.floor(b.x - b.r2)); const xmax = Math.min(W - 1, Math.ceil(b.x + b.r2)); const ymin = Math.max(0, Math.floor(b.y - b.r2)); const ymax = Math.min(H - 1, Math.ceil(b.y + b.r2)); const r1sq = b.r1 * b.r1, r2sq = b.r2 * b.r2;
        for (let yy = ymin; yy <= ymax; yy++) { const dy = yy - b.y; for (let xx = xmin; xx <= xmax; xx++) { const dx = xx - b.x; const d2 = dx * dx + dy * dy; if (d2 >= r1sq && d2 <= r2sq) counts[yy * W + xx]++; } }
      }
      const img = octx.createImageData(W, H);
      for (let i = 0; i < counts.length; i++) { const n = counts[i]; if (n >= 2) { let r = 124, g = 58, b = 237; if (n === 2) { r = 45; g = 212; b = 191; } else if (n >= 4) { r = 244; g = 114; b = 182; } const a = Math.min(220, 70 + (n - 2) * 60); const j = i * 4; img.data[j] = r; img.data[j + 1] = g; img.data[j + 2] = b; img.data[j + 3] = a; } }
      const tmp = document.createElement("canvas"); tmp.width = W; tmp.height = H; const tctx = tmp.getContext("2d"); if (tctx) tctx.putImageData(img, 0, 0);
      octx.save(); octx.imageSmoothingEnabled = false; octx.globalCompositeOperation = "screen"; octx.drawImage(tmp, 0, 0, W, H, 0, 0, w, h);

      // final all-station intersection
      if (finalK > 0) {
        const need = sc.stations.length; const img2 = octx.createImageData(W, H); let any = false;
        for (let i = 0; i < counts.length; i++) { if (counts[i] >= need) { const j = i * 4; img2.data[j] = 253; img2.data[j + 1] = 224; img2.data[j + 2] = 71; img2.data[j + 3] = Math.floor(230 * finalK); any = true; } }
        if (any) { const tmp2 = document.createElement("canvas"); tmp2.width = W; tmp2.height = H; const t2 = tmp2.getContext("2d"); if (t2) t2.putImageData(img2, 0, 0); octx.globalCompositeOperation = "lighter"; octx.drawImage(tmp2, 0, 0, W, H, 0, 0, w, h); octx.globalCompositeOperation = "source-over"; }
      }
      octx.restore();
    };

    const tick = () => {
      const now = performance.now() / 1000; const t = startTS ? now - startTS : 0; const ts = t * speed;
      ctx.clearRect(0, 0, w, h); drawBG(); const bands = drawStations(ts); drawOrigin(ts);
      if (!frozen && sc.stations.every(s => s.revealed)) { setFrozen(true); setFreezeTS(now); }
      let k = 0; if (freezeTS) { k = clamp((now - freezeTS - finalDelay) / finalFade, 0, 1); }
      drawMask(bands, k);
      if (run || (frozen && k < 1)) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sc, run, frozen, sz.width, sz.height, speed, freezeTS]);

  // Reset and click-to-set origin
  const reset = () => setSeed(s => s + 1);
  const resetAt = (x: number, y: number) => { setForceO({ x, y }); setSeed(s => s + 1); };
  const clickBg = (e: ReactMouseEvent<HTMLDivElement>) => { const t = e.target as HTMLElement; if (t.closest("._uiPanel")) return; const el = wrapRef.current; if (!el) return; const r = el.getBoundingClientRect(); resetAt(e.clientX - r.left, e.clientY - r.top); };
  const toggleRun = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setRun(r => {
      if (r) {
        pauseAt.current = performance.now() / 1000;
        return false;
      } else {
        const now = performance.now() / 1000;
        if (pauseAt.current != null) {
          const delta = now - pauseAt.current;
          setStartTS(s => (s !== null ? s + delta : null));
        }
        pauseAt.current = null;
        return true;
      }
    });
  };

  // Helpers for inline styles to avoid template strings
  const pctHeight = (p: number) => String(Math.max(2, p)) + "%";

  return (
    <div ref={wrapRef} onClick={clickBg} className="relative w-full h-[100vh] bg-gradient-to-b from-slate-900 via-slate-950 to-black overflow-hidden">
      {/* canvases */}
      <canvas ref={baseRef} className="absolute inset-0 z-0" />
      <canvas ref={olRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* DOM epicenter marker on top of everything */}
      {sc ? (
        <div
          className="pointer-events-none absolute rounded-full"
          style={{ zIndex: 50, left: (sc.origin.x - 5), top: (sc.origin.y - 5), width: 10, height: 10, background: "#ef4444", boxShadow: "0 0 16px rgba(239,68,68,0.9)" }}
        />
      ) : null}

      {/* info panel */}
      {infoOpen ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="_uiPanel absolute top-4 left-4 z-40 backdrop-blur-md bg-white/10 border border-white/15 rounded-2xl p-4 text-slate-100 shadow-2xl max-w-md"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={e => { e.stopPropagation(); setInfoOpen(false); }}
            className="absolute top-2 right-2 text-xs text-slate-200/80 underline-offset-2 hover:underline"
          >
            Hide
          </button>
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <h1 className="text-lg font-semibold">Earthquake Triangulation</h1>
          </div>
          <p className="mt-2 text-xs text-slate-200/80">
            P (blue) and S (green) ripples radiate from a red epicenter. Each station draws an uncertainty band from S-P timing. After all five, the ALL-overlap fades in gold.
          </p>
        </motion.div>
      ) : (
        <button
          onClick={e => { e.stopPropagation(); setInfoOpen(true); }}
          className="_uiPanel absolute top-4 left-4 z-40 backdrop-blur-md bg-white/10 border border-white/15 rounded-2xl px-3 py-2 text-xs text-slate-100 shadow-2xl"
        >
          Show info
        </button>
      )}

      {controlsOpen ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="_uiPanel absolute top-4 right-4 z-40 backdrop-blur-xl bg-white/10 border border-white/15 rounded-2xl p-3 shadow-xl min-w-[240px]"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={e => { e.stopPropagation(); setControlsOpen(false); }}
            className="absolute top-2 right-2 text-xs text-slate-200/80 underline-offset-2 hover:underline"
          >
            Hide
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={e => { e.stopPropagation(); reset(); }}
              className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-slate-100 text-sm border border-white/20"
            >
              Reset
            </button>
            <button
              onClick={toggleRun}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-100 text-xs border border-white/20"
            >
              {run ? "Pause" : "Play"}
            </button>
          </div>
          <div className="mt-3">
            <label className="text-xs text-slate-200/80 flex items-center justify-between mb-1"><span>Speed</span><span className="font-mono">{speed.toFixed(2)}x</span></label>
            <input
              type="range"
              min={0.25}
              max={3}
              step={0.05}
              value={speed}
              onChange={e => setSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="mt-2" style={{ fontSize: 10, color: "rgba(226,232,240,0.7)" }}>Click anywhere to choose the next origin.</div>
        </motion.div>
      ) : (
        <button
          onClick={e => { e.stopPropagation(); setControlsOpen(true); }}
          className="_uiPanel absolute top-4 right-4 z-40 backdrop-blur-xl bg-white/10 border border-white/15 rounded-2xl px-3 py-2 text-xs text-slate-100 shadow-xl"
        >
          Show controls
        </button>
      )}

      {/* coverage chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="_uiPanel absolute bottom-3 left-3 z-40 backdrop-blur-xl bg-white/10 border border-white/15 rounded-2xl text-slate-100"
        style={{ width: chartOpen ? 560 : undefined, padding: chartOpen ? "12px 16px" : "8px" }}
        onClick={e => e.stopPropagation()}
      >
        {chartOpen ? (
          <>
            <button onClick={() => setChartOpen(false)} className="text-xs underline-offset-2 hover:underline">
              Hide coverage chart
            </button>
            <div className="mt-4" style={{ width: 520, height: 200, position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                top: 0,
                bottom: 60,
                display: "flex",
                alignItems: "flex-end",
                gap: 16,
              }}
            >
              {pct.map((p, i) => (
                <div
                  key={i}
                  style={{
                    width: 40,
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    borderRadius: 6,
                    height: pctHeight(p),
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: -24,
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: 12,
                    }}
                  >
                    {Math.round(p)}%
                  </span>
                </div>
              ))}
            </div>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 28,
                display: "flex",
                alignItems: "center",
                gap: 16,
                fontSize: 12,
              }}
            >
              {pct.map((_, i) => (
                <span key={i} style={{ width: 40, textAlign: "center" }}>{i + 1}</span>
              ))}
            </div>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                textAlign: "center",
                fontSize: 12,
              }}
            >
              Station number
            </div>
          </div>
          </>
        ) : (
          <button onClick={() => setChartOpen(true)} aria-label="Show coverage chart">
            📊
          </button>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="absolute bottom-14 left-1/2 -translate-x-1/2 text-center text-xs text-slate-300/60">Click anywhere to choose the next origin, or use Reset.</motion.div>
    </div>
  );
}

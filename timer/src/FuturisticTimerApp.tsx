import React, { useEffect, useMemo, useRef, useState } from "react";

// === Types ===
type TimerType = "Countdown" | "Hourglass" | "Candle" | "Bioluminescence" | "Progress Bar";
type Pace = "normal" | "accelerating" | "decelerating";
type ProgressBarShape = "linear" | "circular";

// === Utilities ===
const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const clampInt = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.floor(n)));
const pad = (n: number) => String(n).padStart(2, "0");
const toHMS = (totalSeconds: number) => {
  totalSeconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const easeByPace = (p: number, pace: Pace) => {
  p = clamp(p);
  switch (pace) {
    case "accelerating":
      return p * p * p; // easeInCubic
    case "decelerating":
      return 1 - Math.pow(1 - p, 3); // easeOutCubic
    default:
      return p; // normal/linear
  }
};

// Color helpers for Bioluminescence
type RGB = { r: number; g: number; b: number; a?: number };
const hexToRgb = (hex: string): RGB => {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpColor = (c1: RGB, c2: RGB, t: number): RGB => ({
  r: Math.round(lerp(c1.r, c2.r, t)),
  g: Math.round(lerp(c1.g, c2.g, t)),
  b: Math.round(lerp(c1.b, c2.b, t)),
  a: lerp(c1.a ?? 1, c2.a ?? 1, t),
});
const rgbToRgbaStr = (c: RGB) => `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a ?? 1})`;

// Bioluminescence gradient stops (start→end):
// black - purple - blue - green - yellow - orange - red - white - transparent
const BIO_COLORS: (string | RGB)[] = [
  "#000000",
  "#800080",
  "#0000FF",
  "#00FF00",
  "#FFFF00",
  "#FFA500",
  "#FF0000",
  "#FFFFFF",
  { r: 255, g: 255, b: 255, a: 0 }, // transparent (to fade out)
];

const colorAtProgress = (p: number): RGB => {
  p = clamp(p);
  const segments = BIO_COLORS.length - 1;
  const fp = p * segments;
  const i = Math.min(segments - 1, Math.floor(fp));
  const t = fp - i;
  const start = BIO_COLORS[i];
  const end = BIO_COLORS[i + 1];
  const c1 = typeof start === "string" ? hexToRgb(start) : start;
  const c2 = typeof end === "string" ? hexToRgb(end) : end;
  return lerpColor(c1, c2, t);
};

// Alerts list (value in fraction of total)
const ALERTS = [
  { label: "25%", value: 0.25 },
  { label: "33%", value: 1 / 3 },
  { label: "50%", value: 0.5 },
  { label: "66%", value: 2 / 3 },
  { label: "75%", value: 0.75 },
  { label: "90%", value: 0.9 },
  { label: "95%", value: 0.95 },
];

// =============== Fancy Controls =============== //
const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={"group inline-flex items-center gap-2 select-none"}
    aria-pressed={checked}
  >
    <span
      className={`relative h-6 w-11 rounded-full transition shadow-inner ${checked ? "bg-sky-500/80" : "bg-slate-300"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0"}`}
      />
    </span>
    {label && <span className="text-sm text-slate-700">{label}</span>}
  </button>
);

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: T[] }) {
  return (
    <div className="inline-flex rounded-xl border border-slate-900/10 bg-white/70 backdrop-blur px-1 py-1 shadow-sm">
      {options.map((opt) => (
        <button
          key={opt}
          className={`px-3 py-1.5 text-sm rounded-lg transition shadow-sm ${value === opt ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-200/60"}`}
          onClick={() => onChange(opt)}
        >
          {String(opt)}
        </button>
      ))}
    </div>
  );
}

// =============== Visuals =============== //

function HourglassCanvas({ progress }: { progress: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    const W = canvas.width;
    const H = canvas.height;

    const draw = () => {
      if (!running) return;
      const t = (tRef.current += 0.016);
      ctx.clearRect(0, 0, W, H);

      // Frame geometry
      const cx = W / 2;
      const topY = H * 0.12;
      const botY = H * 0.88;
      const midY = (topY + botY) / 2;
      const waist = 12; // neck half-width
      const bodyW = W * 0.6;

      // Glass silhouette (curvy hourglass)
      ctx.strokeStyle = "rgba(20,20,20,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      // left curve top->waist->bottom
      ctx.moveTo(cx - bodyW / 2, topY);
      ctx.bezierCurveTo(cx - bodyW / 2, topY + 80, cx - waist - 40, midY - 30, cx - waist, midY);
      ctx.bezierCurveTo(cx - waist - 40, midY + 30, cx - bodyW / 2, botY - 80, cx - bodyW / 2, botY);
      // right curve
      ctx.moveTo(cx + bodyW / 2, topY);
      ctx.bezierCurveTo(cx + bodyW / 2, topY + 80, cx + waist + 40, midY - 30, cx + waist, midY);
      ctx.bezierCurveTo(cx + waist + 40, midY + 30, cx + bodyW / 2, botY - 80, cx + bodyW / 2, botY);
      ctx.stroke();

      // Sand fill areas
      const topHeight = midY - topY;
      const botHeight = botY - midY;
      const topFill = topHeight * (1 - progress);
      const botFill = botHeight * progress;

      // Top sand (trapezoid approximation within glass)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx - bodyW / 2 + 4, topY + 4);
      ctx.lineTo(cx + bodyW / 2 - 4, topY + 4);
      ctx.lineTo(cx + waist - 2, midY - 2);
      ctx.lineTo(cx - waist + 2, midY - 2);
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = "rgba(234,179,8,0.9)";
      ctx.fillRect(cx - bodyW / 2 + 5, midY - topFill, bodyW - 10, topFill);
      ctx.restore();

      // Bottom sand
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx - waist + 2, midY + 2);
      ctx.lineTo(cx + waist - 2, midY + 2);
      ctx.lineTo(cx + bodyW / 2 - 4, botY - 4);
      ctx.lineTo(cx - bodyW / 2 + 4, botY - 4);
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = "rgba(217,119,6,0.95)";
      ctx.fillRect(cx - bodyW / 2 + 5, botY - botFill, bodyW - 10, botFill);
      ctx.restore();

      // Falling stream + bounce
      const grains = 60;
      ctx.fillStyle = "rgba(234,179,8,0.95)";
      for (let i = 0; i < grains; i++) {
        const phase = (i / grains) * Math.PI * 2;
        const y = midY - topHeight * (1 - progress) * ((t + i * 0.07) % 1);
        const x = cx + Math.sin(t * 6 + phase) * 1.4;
        if (y > topY && y < midY) {
          ctx.beginPath();
          ctx.arc(x, y, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      running = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [progress]);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={480}
      className="rounded-2xl border border-slate-900/10 bg-gradient-to-b from-slate-100/70 to-slate-200/40 backdrop-blur-xl shadow-xl"
    />
  );
}

function CandleCanvas({ progress }: { progress: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const hRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    const W = canvas.width;
    const H = canvas.height;
    const candleW = 80;
    const candleMaxH = H * 0.55;
    const baseY = H * 0.75;

    const draw = () => {
      if (!running) return;
      const t = (hRef.current += 0.016);
      ctx.clearRect(0, 0, W, H);

      // Background glass
      ctx.fillStyle = "rgba(248,250,252,0.5)"; // light glass
      ctx.fillRect(0, 0, W, H);

      // Candle body shrinking with progress
      const candleH = candleMaxH * (1 - progress);
      const x = W / 2 - candleW / 2;
      const y = baseY - candleH;

      // Candle wax gradient
      const grad = ctx.createLinearGradient(0, y, 0, baseY);
      grad.addColorStop(0, "#f8fafc");
      grad.addColorStop(1, "#e2e8f0");
      ctx.fillStyle = grad;
      ctx.strokeStyle = "rgba(2,6,23,0.15)";
      ctx.lineWidth = 2;
      const radius = 14;
      // Rounded rect
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + candleW - radius, y);
      ctx.quadraticCurveTo(x + candleW, y, x + candleW, y + radius);
      ctx.lineTo(x + candleW, baseY - radius);
      ctx.quadraticCurveTo(x + candleW, baseY, x + candleW - radius, baseY);
      ctx.lineTo(x + radius, baseY);
      ctx.quadraticCurveTo(x, baseY, x, baseY - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wick
      const wickY = y - 10;
      ctx.strokeStyle = "#0f172a"; // slate-900
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W / 2, y);
      ctx.lineTo(W / 2, wickY);
      ctx.stroke();

      // Flame (flicker)
      const flick = Math.sin(t * 8) * 4;
      const flameH = 26 + flick;
      const flameW = 16 + Math.cos(t * 6) * 2;

      const flameGrad = ctx.createRadialGradient(
        W / 2,
        wickY - flameH * 0.6,
        2,
        W / 2,
        wickY - flameH * 0.6,
        flameH
      );
      flameGrad.addColorStop(0, "rgba(255,220,120,0.95)");
      flameGrad.addColorStop(0.4, "rgba(255,170,60,0.8)");
      flameGrad.addColorStop(1, "rgba(255,120,0,0)");
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.ellipse(W / 2, wickY - flameH * 0.5, flameW, flameH, 0, 0, Math.PI * 2);
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      running = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [progress]);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={480}
      className="rounded-2xl border border-slate-900/10 bg-gradient-to-b from-slate-100/70 to-slate-200/40 backdrop-blur-xl shadow-xl"
    />
  );
}

function BioluminescenceOrb({ progress }: { progress: number }) {
  const color = colorAtProgress(progress);
  const rgba = rgbToRgbaStr(color);
  return (
    <div className="relative h-[360px] w-[360px] grid place-items-center">
      <div
        className="rounded-full animate-[pulse_2.4s_ease-in-out_infinite]"
        style={{
          width: 280,
          height: 280,
          background: `radial-gradient(circle, ${rgba} 0%, ${rgba} 45%, rgba(0,0,0,0) 75%)`,
          boxShadow: `0 0 90px 18px ${rgba}, inset 0 0 50px 10px ${rgba}`,
          filter: "saturate(1.15)",
        }}
      />
    </div>
  );
}

function LinearProgress({ progress }: { progress: number }) {
  return (
    <div className="w-[520px] max-w-[86vw] rounded-2xl border border-slate-900/10 bg-white/70 backdrop-blur-xl p-3 shadow-xl">
      <div className="h-4 w-full rounded-xl bg-slate-200 overflow-hidden">
        <div
          className="h-full rounded-xl bg-gradient-to-r from-indigo-500/80 via-sky-400/90 to-emerald-400/90 transition-[width] duration-150"
          style={{ width: `${clamp(progress) * 100}%` }}
        />
      </div>
    </div>
  );
}

function CircularProgress({ progress }: { progress: number }) {
  const size = 260;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const offset = C * (1 - clamp(progress));
  return (
    <svg
      width={size}
      height={size}
      className="rounded-2xl border border-slate-900/10 bg-white/70 backdrop-blur-xl shadow-xl"
    >
      <g transform={`translate(${size / 2}, ${size / 2})`}>
        <circle r={r} fill="none" stroke="rgba(2,6,23,0.1)" strokeWidth={stroke} />
        <circle
          r={r}
          fill="none"
          stroke="url(#grad)"
          strokeWidth={stroke}
          strokeDasharray={C}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.95" />
          </linearGradient>
        </defs>
      </g>
    </svg>
  );
}

// ===== Draggable Digital Time ===== //
function useDrag(initial: { x: number; y: number }) {
  const [pos, setPos] = useState(initial);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
    };
    const onUp = () => (dragging.current = false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const bind = {
    onMouseDown: (e: React.MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      dragging.current = true;
    },
  } as const;

  return { pos, setPos, bind };
}

function DraggableTime({ text, defaultTop = 120 }: { text: string; defaultTop?: number }) {
  const { pos, setPos, bind } = useDrag({ x: window.innerWidth / 2 - 240, y: defaultTop });
  useEffect(() => {
    const onResize = () => setPos((p) => ({ x: Math.max(16, Math.min(p.x, window.innerWidth - 16)), y: p.y }));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [setPos]);
  return (
    <div
      style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: 45 }}
      className="cursor-grab active:cursor-grabbing select-none"
      {...bind}
    >
      <div className="font-mono text-[9rem] leading-none tracking-widest text-slate-900/90 drop-shadow-[0_6px_18px_rgba(2,6,23,0.08)]">
        {text}
      </div>
    </div>
  );
}

// =============== Main App =============== //
export default function FuturisticTimerApp() {
  // Time state
  const [h, setH] = useState(0);
  const [m, setM] = useState(1);
  const [s, setS] = useState(0);

  const durationSec = useMemo(() => clampInt(h, 0, 99) * 3600 + clampInt(m, 0, 59) * 60 + clampInt(s, 0, 59), [h, m, s]);
  const [remaining, setRemaining] = useState<number>(durationSec);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);

  // UI state
  const [basicOpen, setBasicOpen] = useState(true); // default expanded
  const [otherOpen, setOtherOpen] = useState(false); // default collapsed

  const [timerType, setTimerType] = useState<TimerType>("Countdown");
  const [pace, setPace] = useState<Pace>("normal");
  const [barShape, setBarShape] = useState<ProgressBarShape>("linear");

  const [showDigits, setShowDigits] = useState(false); // optional for non-countdown

  // Alerts (store as string keys for stability)
  const [alertsEnabled, setAlertsEnabled] = useState<Record<string, boolean>>({
    "0.25": false,
    [String(1 / 3)]: false,
    "0.5": true, // default on
    [String(2 / 3)]: false,
    "0.75": false,
    "0.9": false,
    "0.95": false,
  });
  const [triggered, setTriggered] = useState<Set<string>>(new Set());

  // Audio (gentle chime) — initialized on first interaction
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playChime = (freq = 660) => {
    try {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      o.start();
      o.stop(now + 0.65);
    } catch {}
  };

  // Big alert overlay
  const [alertSplash, setAlertSplash] = useState<null | { label: string; id: number }>(null);
  const splashId = useRef(1);

  // Toasts (secondary, smaller)
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const toastIdRef = useRef(1);
  const pushToast = (text: string) => {
    const id = toastIdRef.current++;
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  };

  // Keep remaining in sync when duration changes and timer not running
  useEffect(() => {
    if (!running) setRemaining(durationSec);
  }, [durationSec, running]);

  // Tick loop (single interval guarded)
  useEffect(() => {
    if (!running || paused) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 0.1)), 100);
    return () => clearInterval(id);
  }, [running, paused]);

  // Progress
  const linProgress = useMemo(() => (durationSec > 0 ? clamp(1 - remaining / durationSec) : 0), [remaining, durationSec]);
  const visProgress = useMemo(() => easeByPace(linProgress, pace), [linProgress, pace]);

  // Alerts trigger
  useEffect(() => {
    ALERTS.forEach(({ label, value }) => {
      const key = String(value);
      if (alertsEnabled[key] && !triggered.has(key) && linProgress >= value) {
        setTriggered((prev) => new Set(prev).add(key));
        setAlertSplash({ label, id: splashId.current++ });
        pushToast(`Alert: ${label} reached`);
        playChime(660 + value * 240);
      }
    });
    // Completion 100%
    if (!triggered.has("1") && linProgress >= 1) {
      setTriggered((prev) => new Set(prev).add("1"));
      setAlertSplash({ label: "100%", id: splashId.current++ });
      pushToast("Time's up! ✅");
      playChime(880);
      setRunning(false);
    }
  }, [linProgress, alertsEnabled, triggered]);

  const showFinal10 = running && remaining <= 10.5;

  // Enforce digits shown when type is Countdown
  useEffect(() => {
    if (timerType === "Countdown") setShowDigits(true);
  }, [timerType]);

  const start = () => {
    if (durationSec <= 0) return;
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    setTriggered(new Set());
    setRunning(true);
    setPaused(false);
  };
  const pause = () => setPaused((p) => !p);
  const reset = () => {
    setRunning(false);
    setPaused(false);
    setTriggered(new Set());
    setRemaining(durationSec);
  };

  const ControlButton = ({ label, onClick, variant = "default" as const }) => (
    <button
      onClick={onClick}
      className={
        "rounded-xl px-4 py-2 text-sm font-medium transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-sky-400/50 " +
        (variant === "ghost"
          ? "border border-slate-900/10 bg-white/70 hover:bg-white shadow-sm"
          : variant === "danger"
          ? "bg-rose-500/90 hover:bg-rose-500 text-white"
          : "bg-slate-900 text-white hover:bg-slate-800")
      }
    >
      {label}
    </button>
  );

  const PanelSection = ({ title, open, setOpen, children }: { title?: string; open: boolean; setOpen: (v: boolean) => void; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-slate-900/10 bg-white/70 backdrop-blur-2xl shadow-2xl overflow-hidden">
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer select-none hover:bg-white/80"
        onClick={() => setOpen(!open)}
      >
        <div className="text-sm tracking-wide text-slate-700">
          {title ? title : <span className="opacity-0">(no-title)</span>}
        </div>
        <div className={`transition ${open ? "rotate-180" : "rotate-0"}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-70">
            <path d="M6 9l6 6 6-6" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <div className={`grid gap-3 px-3 transition-[max-height,padding] duration-300 ${open ? "py-3" : "py-0"}`}
        style={{ maxHeight: open ? 900 : 0, overflow: "hidden" }}
      >
        {children}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen w-full text-slate-900 bg-[linear-gradient(135deg,#F7F7F2_0%,#ECEDE7_100%)] overflow-hidden">
      {/* Subtle iridescent grain */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: `radial-gradient(circle at 20% 30%, #0f172a 1px, transparent 1px), radial-gradient(circle at 80% 70%, #0f172a 1px, transparent 1px)`, backgroundSize: "120px 120px, 180px 180px" }} />

      {/* Top-right glass control panel (force interactivity) */}
      <div className="fixed top-5 right-5 w-[360px] max-w-[92vw] space-y-3 z-[60] pointer-events-auto">
        <div className="rounded-2xl border border-slate-900/10 bg-white/60 backdrop-blur-2xl shadow-2xl p-3">
          {/* Basic settings (no title) */}
          <PanelSection title={undefined} open={basicOpen} setOpen={setBasicOpen}>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-[11px] uppercase tracking-wide text-slate-600 col-span-3">Time</div>
              <label className="grid gap-1 text-xs">
                <span className="text-slate-700">Hours</span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={h}
                  onChange={(e) => setH(clampInt(Number(e.target.value || 0), 0, 99))}
                  disabled={running}
                  className="rounded-xl bg-white border border-slate-900/10 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                />
              </label>
              <label className="grid gap-1 text-xs">
                <span className="text-slate-700">Minutes</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={m}
                  onChange={(e) => setM(clampInt(Number(e.target.value || 0), 0, 59))}
                  disabled={running}
                  className="rounded-xl bg-white border border-slate-900/10 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                />
              </label>
              <label className="grid gap-1 text-xs">
                <span className="text-slate-700">Seconds</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={s}
                  onChange={(e) => setS(clampInt(Number(e.target.value || 0), 0, 59))}
                  disabled={running}
                  className="rounded-xl bg-white border border-slate-900/10 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                />
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <ControlButton label={running ? (paused ? "Resume" : "Pause") : "Start"} onClick={running ? pause : start} />
              <ControlButton label="Reset" onClick={reset} variant="ghost" />
            </div>

            <div className="pt-3">
              <div className="text-[11px] uppercase tracking-wide text-slate-600 mb-2">Alerts</div>
              <div className="grid grid-cols-3 gap-3">
                {ALERTS.map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-2 text-sm bg-white rounded-xl px-3 py-2 border border-slate-900/10 shadow-sm">
                    <span className="text-slate-800">{label}</span>
                    <Toggle
                      checked={!!alertsEnabled[String(value)]}
                      onChange={(v) => setAlertsEnabled((prev) => ({ ...prev, [String(value)]: v }))}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-slate-600">100% completion always alerts; last 10s flashes.</div>
            </div>

            <div className="pt-3">
              <Toggle
                checked={timerType === "Countdown" ? true : showDigits}
                onChange={(v) => setShowDigits(v)}
                label="Show digital time (##:##:##)"
              />
              {timerType === "Countdown" && (
                <div className="text-[11px] text-slate-600 mt-1">(Always on for Countdown)</div>
              )}
            </div>
          </PanelSection>

          {/* Other settings */}
          <PanelSection title="Other settings" open={otherOpen} setOpen={setOtherOpen}>
            <div className="grid gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-slate-700">Timer type</span>
                <div>
                  <Segmented<TimerType>
                    value={timerType}
                    onChange={(v) => setTimerType(v)}
                    options={["Countdown", "Hourglass", "Candle", "Bioluminescence", "Progress Bar"]}
                  />
                </div>
              </label>

              <fieldset className="grid gap-2 text-sm">
                <legend className="text-slate-700">Pace</legend>
                <Segmented<Pace> value={pace} onChange={setPace} options={["normal", "accelerating", "decelerating"]} />
              </fieldset>

              {timerType === "Progress Bar" && (
                <fieldset className="grid gap-2 text-sm">
                  <legend className="text-slate-700">Progress bar style</legend>
                  <Segmented<ProgressBarShape>
                    value={barShape}
                    onChange={setBarShape}
                    options={["linear", "circular"]}
                  />
                </fieldset>
              )}
            </div>
          </PanelSection>
        </div>
      </div>

      {/* Center stage */}
      <div className="grid place-items-center min-h-screen px-4 z-10 relative">
        <div className="grid place-items-center gap-6">
          {/* Visual */}
          <div className="relative">
            {/* Main visual */}
            {timerType === "Hourglass" && <HourglassCanvas progress={visProgress} />}
            {timerType === "Candle" && <CandleCanvas progress={visProgress} />}
            {timerType === "Bioluminescence" && <BioluminescenceOrb progress={visProgress} />}
            {timerType === "Progress Bar" && (barShape === "linear" ? <LinearProgress progress={visProgress} /> : <CircularProgress progress={visProgress} />)}

            {/* Final 10s flashing overlay (non-blocking) */}
            {showFinal10 && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="font-mono text-6xl md:text-7xl px-6 py-3 rounded-2xl border border-amber-400/40 bg-amber-300/20 backdrop-blur-xl animate-[pulse_0.9s_ease-in-out_infinite] shadow-[0_0_40px_rgba(245,158,11,0.35)] text-slate-900">
                  {Math.max(0, Math.ceil(remaining))}
                </div>
              </div>
            )}
          </div>

          {/* Sub-caption */}
          <div className="text-xs text-slate-700 tracking-wider">Pace: {pace}</div>
        </div>
      </div>

      {/* Draggable digital time (always for Countdown; optional for others). Defaults ABOVE visuals */}
      {(timerType === "Countdown" || showDigits) && (
        <DraggableTime text={toHMS(remaining)} />
      )}

      {/* Toasts */}
      <div className="pointer-events-none fixed top-5 left-1/2 -translate-x-1/2 space-y-2 z-[55]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="px-4 py-2 rounded-xl bg-slate-900/70 text-white border border-slate-900/10 backdrop-blur-xl shadow-lg text-sm animate-[fade_0.2s_ease-out]"
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* Fullscreen alert splash */}
      {alertSplash && (
        <div key={alertSplash.id} className="fixed inset-0 z-[50] pointer-events-none grid place-items-center">
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] animate-[fade_0.2s_ease-out]" />
          <div className="relative grid place-items-center">
            <div className="w-72 h-72 rounded-full bg-sky-400/30 animate-[ring_1.6s_ease-out_forwards]" />
            <div className="absolute inset-0 grid place-items-center">
              <div className="px-6 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-white/20 text-2xl font-semibold animate-[fade_0.2s_ease-out]">
                {alertSplash.label} reached
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyframes */}
      <style>{`
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: .9 } 50% { transform: scale(1.04); opacity: 1 } }
        @keyframes fade { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ring { 0% { transform: scale(0.6); opacity: .6 } 70% { transform: scale(1.25); opacity: .25 } 100% { transform: scale(1.6); opacity: 0 } }
      `}</style>
    </div>
  );
}

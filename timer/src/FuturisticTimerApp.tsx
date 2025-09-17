import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

// === Types ===
type TimerType = "Countdown" | "Hourglass" | "Candle" | "Bioluminescence" | "Progress Bar";
type Pace = "normal" | "accelerating" | "decelerating";
type ProgressBarShape = "linear" | "circular";

// === Utilities ===
const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const clampInt = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.floor(n)));
const roundToStep = (value: number, step: number) => Math.round(value / step) * step;
const pad = (n: number) => String(n).padStart(2, "0");
const formatTimePart = (value: number, key: "h" | "m" | "s") => (key === "h" ? String(value) : pad(value));

type TimeStrings = { h: string; m: string; s: string };
type TimeNumbers = { h: number; m: number; s: number };

const INITIAL_TIME: TimeStrings = { h: "0", m: "01", s: "00" };
const toNumbers = ({ h, m, s }: TimeStrings): TimeNumbers => ({
  h: clampInt(Number(h || "0"), 0, 99),
  m: clampInt(Number(m || "0"), 0, 59),
  s: clampInt(Number(s || "0"), 0, 59),
});
const toStrings = ({ h, m, s }: TimeNumbers): TimeStrings => ({
  h: formatTimePart(h, "h"),
  m: formatTimePart(m, "m"),
  s: formatTimePart(s, "s"),
});
const INITIAL_COMMITTED = toNumbers(INITIAL_TIME);
const getDuration = ({ h, m, s }: TimeNumbers) => h * 3600 + m * 60 + s;
const toHMS = (totalSeconds: number) => {
  totalSeconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const formatTabTime = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
};

const easeByPace = (p: number, pace: Pace, curve: number) => {
  p = clamp(p);
  const exponent = clamp(curve, 1, 4);
  if (pace === "normal" || exponent === 1) return p;

  const eased =
    pace === "accelerating" ? Math.pow(p, exponent) : 1 - Math.pow(1 - p, exponent);

  // Blend with linear progress to avoid the visual completing before the real timer.
  const mix = clamp((exponent - 1) / 3, 0, 1);
  return clamp(p + (eased - p) * mix);
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
    className="group inline-flex items-center gap-3 select-none"
    aria-pressed={checked}
  >
    <span
      className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-all shadow-inner ${
        checked ? "border-sky-500/50 bg-sky-400/60" : "border-slate-400/40 bg-slate-200"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full shadow transition-transform ${
          checked ? "translate-x-[20px] bg-slate-900" : "translate-x-0 bg-slate-600"
        }`}
      />
    </span>
    {label && <span className="text-sm text-slate-700">{label}</span>}
  </button>
);

function Segmented<T extends string>({
  value,
  onChange,
  options,
  className = "",
}: {
  value: T;
  onChange: (v: T) => void;
  options: T[];
  className?: string;
}) {
  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-900/10 bg-white/70 px-1 py-1 shadow-sm ${className}`}
    >
      {options.map((opt) => (
        <button
          key={opt}
          className={`px-3 py-1.5 text-sm rounded-lg transition shadow-sm whitespace-nowrap ${
            value === opt ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-200/60"
          }`}
          onClick={() => onChange(opt)}
        >
          {String(opt)}
        </button>
      ))}
    </div>
  );
}

function IntensitySlider({
  value,
  onChange,
  min = 1,
  max = 4,
  step = 0.1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pointerRef = useRef<number | null>(null);
  const teardownRef = useRef<(() => void) | null>(null);

  const stopTracking = useCallback(() => {
    pointerRef.current = null;
    if (teardownRef.current) {
      teardownRef.current();
      teardownRef.current = null;
    }
  }, []);

  const commitValue = useCallback(
    (next: number) => {
      const clamped = clamp(next, min, max);
      const rounded = Number(roundToStep(clamped, step).toFixed(2));
      onChange(rounded);
    },
    [max, min, onChange, step]
  );

  const updateFromPointer = useCallback(
    (clientX: number) => {
      const input = inputRef.current;
      if (!input) return;
      const rect = input.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const raw = min + ratio * (max - min);
      commitValue(raw);
    },
    [commitValue, max, min]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLInputElement>) => {
      if (e.button !== undefined && e.button !== 0) return;
      const pointerId = e.pointerId;
      stopTracking();
      pointerRef.current = pointerId;
      const handleMove = (event: PointerEvent) => {
        if (event.pointerId !== pointerId) return;
        updateFromPointer(event.clientX);
      };
      const handleUp = (event: PointerEvent) => {
        if (event.pointerId !== pointerId) return;
        stopTracking();
      };
      teardownRef.current = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        window.removeEventListener("pointercancel", handleUp);
      };
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("pointercancel", handleUp);
      updateFromPointer(e.clientX);
      e.preventDefault();
    },
    [stopTracking, updateFromPointer]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLInputElement>) => {
      if (pointerRef.current !== e.pointerId) return;
      updateFromPointer(e.clientX);
    },
    [updateFromPointer]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLInputElement>) => {
      if (pointerRef.current !== e.pointerId) return;
      stopTracking();
    },
    [stopTracking]
  );

  const handleLostCapture = useCallback(() => {
    stopTracking();
  }, [stopTracking]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.valueAsNumber;
      if (!Number.isNaN(next)) {
        commitValue(next);
      }
    },
    [commitValue]
  );

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const delta = e.key === "ArrowRight" ? step : -step;
        commitValue(value + delta);
      }
    },
    [commitValue, step, value]
  );

  return (
    <input
      ref={inputRef}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={handleChange}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={handleLostCapture}
      onKeyDown={handleKeyDown}
      className="w-full accent-sky-500 cursor-pointer touch-none"
    />
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
  const size = 220;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const offset = C * (1 - clamp(progress));
  return (
    <div className="rounded-2xl border border-slate-900/10 bg-white/70 backdrop-blur-xl p-6 shadow-xl">
      <svg width={size} height={size} className="block">
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
    </div>
  );
}

// =============== Main App =============== //
export default function FuturisticTimerApp() {
  // Time state
  const [timeInput, setTimeInput] = useState<TimeStrings>(INITIAL_TIME);
  const [committedTime, setCommittedTime] = useState<TimeNumbers>(INITIAL_COMMITTED);
  const durationSec = useMemo(() => getDuration(committedTime), [committedTime]);
  const [remaining, setRemaining] = useState<number>(() => getDuration(INITIAL_COMMITTED));
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [activeField, setActiveField] = useState<null | "h" | "m" | "s">(null);
  const caretPositionsRef = useRef<Record<"h" | "m" | "s", number | null>>({ h: null, m: null, s: null });
  const hourInputRef = useRef<HTMLInputElement | null>(null);
  const minuteInputRef = useRef<HTMLInputElement | null>(null);
  const secondInputRef = useRef<HTMLInputElement | null>(null);
  const commitTimeInput = useCallback(() => {
    const sanitized = toNumbers(timeInput);
    setCommittedTime(sanitized);
    setTimeInput(toStrings(sanitized));
    return sanitized;
  }, [timeInput]);

  const handleTimeChange = useCallback(
    (key: "h" | "m" | "s") => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (/^\d*$/.test(value)) {
        caretPositionsRef.current[key] = e.target.selectionStart ?? value.length;
        setTimeInput((prev) => ({ ...prev, [key]: value }));
      }
    },
    []
  );

  const handleTimeBlur = useCallback(
    (key: "h" | "m" | "s") => () => {
      if (activeField === key) {
        setActiveField(null);
      }
      caretPositionsRef.current[key] = null;
      commitTimeInput();
    },
    [activeField, commitTimeInput]
  );

  const handleTimeFocus = useCallback((key: "h" | "m" | "s") => () => {
    setActiveField(key);
    caretPositionsRef.current[key] = null;
  }, []);

  const handleTimeSelect = useCallback((key: "h" | "m" | "s") => (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.currentTarget;
    caretPositionsRef.current[key] = target.selectionStart ?? target.value.length;
  }, []);

  const blurActiveTimeField = useCallback(() => {
    if (!activeField) return;
    const refs: Record<"h" | "m" | "s", React.RefObject<HTMLInputElement>> = {
      h: hourInputRef,
      m: minuteInputRef,
      s: secondInputRef,
    };
    const input = refs[activeField].current;
    if (input) {
      input.blur();
    }
  }, [activeField]);

  useEffect(() => {
    if (typeof document === "undefined" || !activeField) return;
    const refs: Record<"h" | "m" | "s", React.RefObject<HTMLInputElement>> = {
      h: hourInputRef,
      m: minuteInputRef,
      s: secondInputRef,
    };
    const input = refs[activeField].current;
    if (!input) return;
    if (document.activeElement !== input) {
      input.focus({ preventScroll: true });
    }
    const caret = caretPositionsRef.current[activeField];
    if (caret != null) {
      const pos = Math.min(caret, input.value.length);
      input.setSelectionRange(pos, pos);
    }
  }, [activeField, timeInput.h, timeInput.m, timeInput.s]);

  // UI state
  const [basicOpen, setBasicOpen] = useState(true); // default expanded
  const [otherOpen, setOtherOpen] = useState(false); // default collapsed

  const [timerType, setTimerType] = useState<TimerType>("Countdown");
  const [pace, setPace] = useState<Pace>("normal");
  const [paceCurve, setPaceCurve] = useState(2);
  const [barShape, setBarShape] = useState<ProgressBarShape>("linear");

  const [showDigits, setShowDigits] = useState(true);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panelLeft, setPanelLeft] = useState<number | null>(null);
  const [digitalOffset, setDigitalOffset] = useState({ x: 0, y: 0 });
  const digitalOffsetRef = useRef({ x: 0, y: 0 });
  const digitDragMeta = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const digitDragTeardown = useRef<(() => void) | null>(null);
  const [draggingDigits, setDraggingDigits] = useState(false);
  const lastTickRef = useRef<number | null>(null);
  const defaultTitleRef = useRef<string | null>(null);
  const lastTitleSeconds = useRef<number | null>(null);

  const updateDigitalOffset = useCallback((next: { x: number; y: number }) => {
    digitalOffsetRef.current = next;
    setDigitalOffset(next);
  }, []);

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
  const playChime = useCallback((freq = 660) => {
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
  }, []);

  // Big alert overlay
  const [alertSplash, setAlertSplash] = useState<null | { label: string; id: number }>(null);
  const splashId = useRef(1);

  // Toasts (secondary, smaller)
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const toastIdRef = useRef(1);
  const pushToast = useCallback((text: string) => {
    const id = toastIdRef.current++;
    setToasts((t) => [...t, { id, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => {
      if (!panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      setPanelLeft(rect.left);
    };
    update();
    window.addEventListener("resize", update);
    let observer: ResizeObserver | null = null;
    if (panelRef.current && "ResizeObserver" in window) {
      observer = new ResizeObserver(update);
      observer.observe(panelRef.current);
    }
    return () => {
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, []);

  // Keep remaining in sync when duration changes and timer not running
  useEffect(() => {
    if (!running) setRemaining(durationSec);
  }, [durationSec, running]);

  // Tick loop (single interval guarded)
  useEffect(() => {
    if (!running || paused) {
      lastTickRef.current = null;
      return;
    }
    lastTickRef.current = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const last = lastTickRef.current ?? now;
      const delta = Math.max(0, (now - last) / 1000);
      lastTickRef.current = now;
      if (delta > 0) {
        setRemaining((prev) => Math.max(0, prev - delta));
      }
    }, 100);
    return () => {
      lastTickRef.current = null;
      window.clearInterval(id);
    };
  }, [running, paused]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (defaultTitleRef.current == null) {
      defaultTitleRef.current = document.title;
    }
    if (running) {
      const seconds = Math.max(0, Math.floor(remaining));
      if (lastTitleSeconds.current !== seconds || paused) {
        document.title = formatTabTime(remaining);
        lastTitleSeconds.current = seconds;
      }
    } else if (defaultTitleRef.current) {
      lastTitleSeconds.current = null;
      document.title = defaultTitleRef.current;
    }
  }, [remaining, running, paused]);

  useEffect(() => {
    return () => {
      if (typeof document !== "undefined" && defaultTitleRef.current) {
        document.title = defaultTitleRef.current;
      }
    };
  }, []);

  // Progress
  const linProgress = useMemo(() => (durationSec > 0 ? clamp(1 - remaining / durationSec) : 0), [remaining, durationSec]);
  const visProgress = useMemo(() => easeByPace(linProgress, pace, paceCurve), [linProgress, pace, paceCurve]);

  // Alerts trigger
  useEffect(() => {
    if (!running || paused) return;
    const nextTriggered = new Set(triggered);
    let updated = false;

    ALERTS.forEach(({ label, value }) => {
      const key = String(value);
      if (alertsEnabled[key] && !nextTriggered.has(key) && linProgress >= value) {
        nextTriggered.add(key);
        updated = true;
        setAlertSplash({ label, id: splashId.current++ });
        pushToast(`Alert: ${label} reached`);
        playChime(660 + value * 240);
      }
    });

    if (!nextTriggered.has("1") && linProgress >= 1) {
      nextTriggered.add("1");
      updated = true;
      setAlertSplash({ label: "100%", id: splashId.current++ });
      pushToast("Time's up! ✅");
      playChime(880);
      setRunning(false);
      setPaused(false);
    }

    if (updated) {
      setTriggered(nextTriggered);
    }
  }, [alertsEnabled, linProgress, paused, running, triggered, playChime, pushToast]);

  const showFinal10 = running && !paused && remaining <= 10;

  useEffect(() => {
    if (!showFinal10) return;
    setAlertSplash((prev) => (prev ? null : prev));
  }, [showFinal10]);

  const digitalAnchor = useMemo(() => {
    if (panelLeft == null) return 160;
    return Math.max(120, panelLeft / 2);
  }, [panelLeft]);

  const stopDigitDrag = useCallback(() => {
    if (digitDragTeardown.current) {
      digitDragTeardown.current();
      digitDragTeardown.current = null;
    }
    if (typeof document !== "undefined") {
      document.body.style.userSelect = "";
    }
    digitDragMeta.current = null;
    setDraggingDigits(false);
  }, []);

  const moveDigits = useCallback(
    (clientX: number, clientY: number) => {
      if (!digitDragMeta.current) return;
      const dx = clientX - digitDragMeta.current.startX;
      const dy = clientY - digitDragMeta.current.startY;
      updateDigitalOffset({
        x: digitDragMeta.current.originX + dx,
        y: digitDragMeta.current.originY + dy,
      });
    },
    [updateDigitalOffset]
  );

  const handleDigitsPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const { pointerId, clientX, clientY } = e;
      if (digitDragTeardown.current) {
        digitDragTeardown.current();
        digitDragTeardown.current = null;
      }
      digitDragMeta.current = {
        pointerId,
        startX: clientX,
        startY: clientY,
        originX: digitalOffsetRef.current.x,
        originY: digitalOffsetRef.current.y,
      };
      if (typeof document !== "undefined") {
        document.body.style.userSelect = "none";
      }
      const handleMove = (event: PointerEvent) => {
        if (!digitDragMeta.current || digitDragMeta.current.pointerId !== event.pointerId) return;
        moveDigits(event.clientX, event.clientY);
      };
      const handleUp = (event: PointerEvent) => {
        if (!digitDragMeta.current || digitDragMeta.current.pointerId !== event.pointerId) return;
        stopDigitDrag();
      };
      digitDragTeardown.current = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        window.removeEventListener("pointercancel", handleUp);
      };
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("pointercancel", handleUp);
      setDraggingDigits(true);
    },
    [moveDigits, stopDigitDrag]
  );

  const handleDigitsPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!digitDragMeta.current || digitDragMeta.current.pointerId !== e.pointerId) return;
      moveDigits(e.clientX, e.clientY);
    },
    [moveDigits]
  );

  const finishDigitDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!digitDragMeta.current || digitDragMeta.current.pointerId !== e.pointerId) return;
      stopDigitDrag();
    },
    [stopDigitDrag]
  );

  const handleDigitsLostCapture = useCallback(() => {
    stopDigitDrag();
  }, [stopDigitDrag]);

  useEffect(() => {
    return () => {
      stopDigitDrag();
    };
  }, [stopDigitDrag]);

  const start = useCallback(() => {
    blurActiveTimeField();
    const sanitized = commitTimeInput();
    const total = getDuration(sanitized);
    if (total <= 0) return;
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    setTriggered(new Set());
    setAlertSplash(null);
    setToasts([]);
    setRemaining(total);
    setRunning(true);
    setPaused(false);
  }, [blurActiveTimeField, commitTimeInput]);
  const pause = useCallback(() => {
    blurActiveTimeField();
    if (!running) return;
    setPaused((p) => !p);
  }, [blurActiveTimeField, running]);
  const reset = useCallback(() => {
    blurActiveTimeField();
    const sanitized = commitTimeInput();
    const total = getDuration(sanitized);
    setRunning(false);
    setPaused(false);
    setTriggered(new Set());
    setAlertSplash(null);
    setToasts([]);
    setRemaining(total);
    updateDigitalOffset({ x: 0, y: 0 });
    stopDigitDrag();
  }, [blurActiveTimeField, commitTimeInput, stopDigitDrag, updateDigitalOffset]);

  const ControlButton = ({ label, onClick, variant = "default" as const }) => (
    <button
      type="button"
      onClick={() => {
        blurActiveTimeField();
        onClick();
      }}
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
        onClick={() => {
          blurActiveTimeField();
          setOpen(!open);
        }}
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
      <div
        ref={panelRef}
        className="fixed top-5 right-5 z-[250] w-[360px] max-h-[calc(100vh-40px)] max-w-[92vw] space-y-3 overflow-y-auto pr-1 pointer-events-auto"
      >
        <div className="rounded-2xl border border-slate-900/10 bg-white/60 backdrop-blur-2xl shadow-2xl p-3">
          {/* Basic settings (no title) */}
          <PanelSection title={undefined} open={basicOpen} setOpen={setBasicOpen}>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-[11px] uppercase tracking-wide text-slate-600 col-span-3">Time</div>
              <label className="grid gap-1 text-xs">
                <span className="text-slate-700">Hours</span>
                <input
                  id="timer-hours"
                  name="timer-hours"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={timeInput.h}
                  onChange={handleTimeChange("h")}
                  onBlur={handleTimeBlur("h")}
                  onFocus={handleTimeFocus("h")}
                  onSelect={handleTimeSelect("h")}
                  autoComplete="off"
                  ref={hourInputRef}
                  data-time-input="true"
                  className="rounded-xl bg-white border border-slate-900/10 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                />
              </label>
              <label className="grid gap-1 text-xs">
                <span className="text-slate-700">Minutes</span>
                <input
                  id="timer-minutes"
                  name="timer-minutes"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={timeInput.m}
                  onChange={handleTimeChange("m")}
                  onBlur={handleTimeBlur("m")}
                  onFocus={handleTimeFocus("m")}
                  onSelect={handleTimeSelect("m")}
                  autoComplete="off"
                  ref={minuteInputRef}
                  data-time-input="true"
                  className="rounded-xl bg-white border border-slate-900/10 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-400/50"
                />
              </label>
              <label className="grid gap-1 text-xs">
                <span className="text-slate-700">Seconds</span>
                <input
                  id="timer-seconds"
                  name="timer-seconds"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={timeInput.s}
                  onChange={handleTimeChange("s")}
                  onBlur={handleTimeBlur("s")}
                  onFocus={handleTimeFocus("s")}
                  onSelect={handleTimeSelect("s")}
                  autoComplete="off"
                  ref={secondInputRef}
                  data-time-input="true"
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ALERTS.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 text-sm bg-white rounded-xl px-4 py-3 border border-slate-900/10 shadow-sm min-h-[60px]"
                  >
                    <span className="text-slate-800">{label}</span>
                    <Toggle
                      checked={!!alertsEnabled[String(value)]}
                      onChange={(v) => {
                        blurActiveTimeField();
                        setAlertsEnabled((prev) => ({ ...prev, [String(value)]: v }));
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-slate-600">100% completion always alerts; last 10s flashes.</div>
            </div>

            <div className="pt-3">
              <Toggle
                checked={showDigits}
                onChange={(v) => {
                  blurActiveTimeField();
                  setShowDigits(v);
                }}
                label="Show digital time (##:##:##)"
              />
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
                    onChange={(v) => {
                      blurActiveTimeField();
                      setTimerType(v);
                    }}
                    options={["Countdown", "Hourglass", "Candle", "Bioluminescence", "Progress Bar"]}
                    className="max-h-24 overflow-y-auto pr-1"
                  />
                </div>
              </label>

              <fieldset className="grid gap-2 text-sm">
                <legend className="text-slate-700">Pace</legend>
                <Segmented<Pace>
                  value={pace}
                  onChange={(v) => {
                    blurActiveTimeField();
                    setPace(v);
                  }}
                  options={["normal", "accelerating", "decelerating"]}
                  className="w-fit"
                />
                {(pace === "accelerating" || pace === "decelerating") && (
                  <label className="grid gap-1 text-xs text-slate-600">
                    <span className="font-medium text-slate-700">
                      {pace === "accelerating" ? "Acceleration rate" : "Deceleration rate"}
                    </span>
                    <IntensitySlider
                      value={paceCurve}
                      onChange={(next) => {
                        blurActiveTimeField();
                        setPaceCurve(next);
                      }}
                      min={1}
                      max={4}
                      step={0.1}
                    />
                    <span className="text-[11px] tracking-wide">{paceCurve.toFixed(1)}× intensity</span>
                  </label>
                )}
              </fieldset>

              {timerType === "Progress Bar" && (
                <fieldset className="grid gap-2 text-sm">
                  <legend className="text-slate-700">Progress bar style</legend>
                  <Segmented<ProgressBarShape>
                    value={barShape}
                    onChange={(v) => {
                      blurActiveTimeField();
                      setBarShape(v);
                    }}
                    options={["linear", "circular"]}
                    className="w-fit"
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
          </div>
        </div>
      </div>

      {/* Digital time readout anchored between screen edge and control panel */}
      {showDigits && (
        <div
          className="fixed select-none"
          style={{
            left: digitalAnchor + digitalOffset.x,
            top: 24 + digitalOffset.y,
            transform: "translateX(-50%)",
            cursor: draggingDigits ? "grabbing" : "grab",
            userSelect: "none",
            touchAction: "none",
            zIndex: draggingDigits ? 80 : 45,
          }}
          onPointerDown={handleDigitsPointerDown}
          onPointerMove={handleDigitsPointerMove}
          onPointerUp={finishDigitDrag}
          onPointerCancel={finishDigitDrag}
          onLostPointerCapture={handleDigitsLostCapture}
          title="Drag to reposition the timer"
        >
          <div className="pointer-events-none font-mono text-[clamp(3rem,6vw,8rem)] leading-none tracking-[0.4em] text-slate-900/90 drop-shadow-[0_6px_18px_rgba(2,6,23,0.08)]">
            {toHMS(remaining)}
          </div>
        </div>
      )}

      {/* Milestones on the left */}
      <div className="fixed top-32 left-6 z-[55] flex max-w-[320px] flex-col gap-3 pointer-events-none">
        {alertSplash && (
          <div key={alertSplash.id} className="rounded-2xl border border-sky-400/40 bg-sky-100/90 px-4 py-3 shadow-lg">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-sky-700">Milestone</div>
            <div className="text-lg font-bold text-slate-900">{alertSplash.label} reached</div>
          </div>
        )}
        {showFinal10 && (
          <div className="rounded-2xl border border-amber-400/50 bg-amber-200/40 px-4 py-3 text-center shadow-lg">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Final seconds</div>
            <div className="font-mono text-4xl text-slate-900">{Math.max(0, Math.floor(remaining))}</div>
          </div>
        )}
      </div>

      {/* Progress alerts centered at the bottom */}
      <div className="pointer-events-none fixed bottom-12 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-xl border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-800 shadow-lg"
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: .9 } 50% { transform: scale(1.04); opacity: 1 } }
        @keyframes fade { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ring { 0% { transform: scale(0.6); opacity: .6 } 70% { transform: scale(1.25); opacity: .25 } 100% { transform: scale(1.6); opacity: 0 } }
      `}</style>
    </div>
  );
}

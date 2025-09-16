import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";

/**
 * MorseTelegraph_V5.tsx
 *
 * V5 changes
 * - HOLD ⇧ Shift to PAUSE rings/timers (yellow/blue/red) mid-progress; release to resume from the same angle.
 *   • Works for manual entry (while pressed or during letter/word gaps).
 *   • Effective press duration excludes paused time, so dot/dash threshold is frozen while paused.
 * - Playback transcript no longer doubles; during playback the transcript switches to a single, styled view
 *   with the CURRENT character highlighted (bold green). Outside playback it remains a textarea editor.
 * - Page title and header text changed to "Morse Telegraph".
 * - Key face shows fixed per-speed timings: dot, dash, char, word (minimums for the chosen speed).
 * - Center key + visuals enlarged ~35% (kept perfectly anchored at center).
 *
 * Kept from V4
 * - Playback waits for BLUE (letter) and RED (word) ring durations; rings animate during playback.
 * - Key anchored with fixed overlay; side panels no longer nudge it.
 */

// ---------- Morse Maps ----------
const CHAR_TO_MORSE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....",
  I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.",
  Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
  Y: "-.--", Z: "--..",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....",
  6: "-....", 7: "--...", 8: "---..", 9: "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.", "!": "-.--.",
  "/": "-..-.", "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...",
  ";": "-.-.-.", "=": "-...-", "+": ".-.-.", "-": "-....-", "_": "..--_-",
  '"': ".-..-.", "$": "...-..-", "@": ".--.-.",
};
CHAR_TO_MORSE["_"] = "..--.-"; // fix underscore typo
const MORSE_TO_CHAR: Record<string, string> = Object.fromEntries(
  Object.entries(CHAR_TO_MORSE).map(([k, v]) => [v, k])
);

type LibraryEntry = { char: string; code: string; synthetic?: boolean };
type PlaybackPreviewState = {
  prev: string | null;
  current: string | null;
  next: string | null;
  activeSymbolIndex: number | null;
};

// ---------- Utilities ----------
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const dotDashLex = (a: string, b: string) => { const n = Math.min(a.length, b.length); for (let i=0;i<n;i++) if (a[i]!==b[i]) return a[i]==='.'?-1:1; return a.length-b.length; };
const bufferToPretty = (buf: string[]) => buf.map(s => (s === "." ? "·" : "–")).join(" ");
const prettyRef = (code: string) => { // add thin space between adjacent dashes
  const THIN = "\u2009"; // thin space
  let out = "";
  for (let i=0;i<code.length;i++) {
    const c = code[i];
    if (c === '-') { out += '–'; if (i < code.length-1 && code[i+1] === '-') out += THIN; }
    else if (c === '.') out += '·';
    else out += c;
  }
  return out;
};
function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }
function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }, [key, value]);
  return [value, setValue] as const;
}

// ---------- Speed Profiles ----------
const SPEEDS = {
  fast:     { key: "fast",     label: "Fast",      gapScale: 0.55 }, // movie-like
  normal:   { key: "normal",   label: "Normal",    gapScale: 1.00 },
  slow:     { key: "slow",     label: "Slow",      gapScale: 1.50 }, // default
  verySlow: { key: "verySlow", label: "Very slow", gapScale: 2.20 },
} as const;

type SpeedKey = keyof typeof SPEEDS;

// Fixed display dot durations per speed (ms)
const DISPLAY_DOT_MS: Record<SpeedKey, number> = {
  verySlow: 240,
  slow: 170,
  normal: 120,
  fast: 70,
};

// ---------- Audio Engine ----------
class Sidetone { ctx: AudioContext | null = null; gain: GainNode | null = null; osc: OscillatorNode | null = null; targetHz=740; vol=0.06;
  ensure(){ if(this.ctx) return; const Ctx=(window as any).AudioContext||(window as any).webkitAudioContext; if(!Ctx) return; this.ctx=new Ctx(); const g=this.ctx.createGain(); g.gain.setValueAtTime(0,this.ctx.currentTime); g.connect(this.ctx.destination); this.gain=g; }
  start(){ this.ensure(); if(!this.ctx||!this.gain||this.osc) return; const o=this.ctx.createOscillator(); o.frequency.value=this.targetHz; o.type="sine"; o.connect(this.gain); o.start(); const t=this.ctx.currentTime; this.gain.gain.cancelScheduledValues(t); this.gain.gain.setTargetAtTime(this.vol,t,0.01); this.osc=o; }
  stop(){ if(!this.ctx||!this.gain||!this.osc) return; const t=this.ctx.currentTime; this.gain.gain.cancelScheduledValues(t); this.gain.gain.setTargetAtTime(0,t,0.01); const s=this.osc; this.osc=null; setTimeout(()=>{try{s.stop();}catch{}},60); }
}

// ---------- Main Component ----------
export default function MorseTelegraph_V5() {
  // Document title
  useEffect(()=>{ document.title = "Morse Telegraph"; }, []);

  // Visual / preferences
  const [panelOpen, setPanelOpen] = useLocalStorage<boolean>("morse.panelOpen", true);
  const [legendOpen, setLegendOpen] = useLocalStorage<boolean>("morse.legendOpen", false);
  const [sortMode, setSortMode] = useLocalStorage<"alpha" | "alphaRev" | "shape">("morse.sort", "alpha");
  const [filter, setFilter] = useState("");
  const [speed, setSpeed] = useLocalStorage<SpeedKey>("morse.speed", "slow"); // default slow
  const [dark, setDark] = useLocalStorage<boolean>("morse.dark", false);
  const [branching, setBranching] = useLocalStorage<boolean>("morse.branching", false);

  // Decoding state
  const [isPressed, setIsPressed] = useState(false);
  const pressStartRef = useRef<number | null>(null);
  const [unitMs, setUnitMs] = useLocalStorage<number>("morse.unit", 120); // adaptive internal unit
  const unitSamplesRef = useRef<number[]>([]);
  const [symbolBuffer, setSymbolBuffer] = useState<string[]>([]);
  const [transcript, setTranscript] = useLocalStorage<string>("morse.transcript", "");
  const symbolBufferRef = useRef<string[]>([]);
  useEffect(() => { symbolBufferRef.current = symbolBuffer; }, [symbolBuffer]);

  // Manual timers
  const letterTimerRef = useRef<number | null>(null);
  const wordTimerRef = useRef<number | null>(null);

  // Playback-only ring timers (visuals only)
  const pbBlueTimerRef = useRef<number | null>(null);
  const pbRedTimerRef  = useRef<number | null>(null);

  // Rings
  const [blueCycle, setBlueCycle] = useState(0);  // letter readiness (after release)
  const [blueMs, setBlueMs] = useState(0);
  const [blueActive, setBlueActive] = useState(false);

  const [yellowCycle, setYellowCycle] = useState(0); // hold threshold (while pressed)
  const [yellowMs, setYellowMs] = useState(0);
  const [yellowActive, setYellowActive] = useState(false);

  const [redCycle, setRedCycle] = useState(0); // word readiness (after release)
  const [redMs, setRedMs] = useState(0);
  const [redActive, setRedActive] = useState(false);

  // Pause state (Shift)
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const blueStartAtRef = useRef<number | null>(null);
  const redStartAtRef  = useRef<number | null>(null);
  const yellowStartAtRef = useRef<number | null>(null);
  const letterEndAtRef = useRef<number | null>(null);
  const wordEndAtRef   = useRef<number | null>(null);
  const blueRemainRef = useRef(0);
  const redRemainRef  = useRef(0);
  const yellowRemainRef = useRef(0);
  const letterRemainRef = useRef(0);
  const wordRemainRef   = useRef(0);
  const pressPauseStartRef = useRef<number | null>(null);
  const pressPausedAccumRef = useRef(0);

  // Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [playGlow, setPlayGlow] = useState(false);
  const [playIdx, setPlayIdx] = useState<number | null>(null); // highlight index during playback
  const playAbortRef = useRef({ abort: false });
  const [playbackPreview, setPlaybackPreview] = useState<PlaybackPreviewState>(() => ({ prev: null, current: null, next: null, activeSymbolIndex: null }));
  const pendingWordGapRef = useRef(0);

  const [soundOn] = useState(true);
  const toneRef = useRef(new Sidetone());
  const keyHeldRef = useRef<{ [k: string]: boolean }>({});

  // Derived helpers
  const gapScale = SPEEDS[speed].gapScale;
  const LETTER_COEF = 2.6; // tuned to feel responsive
  const WORD_COEF   = 6.8;
  const letterGapMs = (unit: number) => Math.round(LETTER_COEF * unit * gapScale);
  const wordGapMs   = (unit: number) => Math.round(WORD_COEF   * unit * gapScale);
  const dotDashThresholdMs = (unit: number) => Math.round(2.0 * unit * gapScale);
  const playbackUnit = () => clamp(unitMs * gapScale, 60, 220);

  // FIXED display timings
  const dotMsDisp = DISPLAY_DOT_MS[speed];
  const dashMsDisp = dotMsDisp * 3;
  const charMsDisp = Math.round(LETTER_COEF * dotMsDisp * gapScale);
  const wordMsDisp = Math.round(WORD_COEF   * dotMsDisp * gapScale);

  // Info panel entries
  const entries = useMemo(() => {
    const all = Object.entries(CHAR_TO_MORSE).map(([char, code]) => ({ char, code }));
    const letters = all.filter(e => /^[A-Z]$/.test(e.char));
    const digits = all.filter(e => /^[0-9]$/.test(e.char));
    const symbols = all.filter(e => !/^[A-Z0-9]$/.test(e.char));
    const orderAlpha = (arr: typeof all, dir = 1) => arr.sort((a, b) => dir * a.char.localeCompare(b.char));
    if (sortMode === "shape") return [...all].sort((a, b) => (a.code.length - b.code.length) || dotDashLex(a.code, b.code));
    const dir = sortMode === "alpha" ? 1 : -1;
    return [...orderAlpha(letters, dir), ...orderAlpha(digits, dir), ...orderAlpha(symbols, dir)];
  }, [sortMode]);

  const { libraryEntries, highlightCode } = useMemo(() => {
    const rawQuery = filter.trim();
    const normalizeQuery = (input: string) => input.replace(/dot|\./gi, ".").replace(/dash|-/gi, "-");
    let baseList: LibraryEntry[] = entries;

    if (rawQuery) {
      const charTokens = new Set<string>();
      for (const ch of rawQuery) {
        if (/\s/.test(ch)) continue;
        const upper = ch.toUpperCase();
        if (Object.prototype.hasOwnProperty.call(CHAR_TO_MORSE, upper)) {
          charTokens.add(upper);
          continue;
        }
        if (Object.prototype.hasOwnProperty.call(CHAR_TO_MORSE, ch)) {
          charTokens.add(ch);
        }
      }

      const normalized = normalizeQuery(rawQuery);
      const codeTokens = new Set<string>();
      normalized.split(/[^.\-]+/).forEach(token => {
        if (token.length > 1) codeTokens.add(token);
        else if (token.length === 1 && !charTokens.size) codeTokens.add(token);
      });

      const lowerQuery = rawQuery.toLowerCase();
      if (charTokens.size || codeTokens.size) {
        baseList = entries.filter(entry => {
          const entryCharUpper = entry.char.toUpperCase();
          if (charTokens.has(entryCharUpper) || charTokens.has(entry.char)) return true;
          for (const token of codeTokens) {
            if (entry.code.includes(token)) return true;
          }
          return false;
        });
      } else {
        const normalizedLower = normalizeQuery(lowerQuery);
        baseList = entries.filter(entry =>
          entry.char.toLowerCase().includes(lowerQuery) || (normalizedLower && entry.code.includes(normalizedLower))
        );
      }

      if (baseList.length === 0) {
        const normalizedLower = normalizeQuery(lowerQuery);
        baseList = entries.filter(entry =>
          entry.char.toLowerCase().includes(lowerQuery) || (normalizedLower && entry.code.includes(normalizedLower))
        );
      }
    }

    if (!branching || symbolBuffer.length === 0) {
      return { libraryEntries: baseList, highlightCode: null as string | null };
    }
    const prefix = symbolBuffer.join("");
    const matches = baseList.filter(e => e.code.startsWith(prefix));
    let list: LibraryEntry[] = [...matches];
    const exactChar = MORSE_TO_CHAR[prefix];
    if (exactChar) {
      const existingIdx = list.findIndex(e => e.char === exactChar);
      if (existingIdx > -1) {
        const [found] = list.splice(existingIdx, 1);
        list = [found, ...list];
      } else {
        const entryFromAll = entries.find(e => e.char === exactChar);
        if (entryFromAll) list = [entryFromAll, ...list];
        else list = [{ char: exactChar, code: prefix, synthetic: true }, ...list];
      }
    } else {
      list = [{ char: "�", code: prefix, synthetic: true }, ...list];
    }
    if (list.length === 0) {
      if (exactChar) list = [{ char: exactChar, code: prefix, synthetic: true }];
      else list = [{ char: "�", code: prefix, synthetic: true }];
    }
    return { libraryEntries: list, highlightCode: prefix };
  }, [entries, filter, branching, symbolBuffer]);

  // ---------- Timing & Classification ----------
  function addUnitSample(dur: number) {
    const arr = unitSamplesRef.current; arr.push(dur); if (arr.length > 12) arr.shift();
    const s = [...arr].sort((a, b) => a - b); const k = Math.max(1, Math.floor(s.length/3));
    const trimmed = s.slice(0, k); const avg = trimmed.reduce((a,b)=>a+b,0)/(trimmed.length||1);
    const clamped = clamp(avg || unitMs, 50, 240); setUnitMs(clamped); return clamped;
  }
  function clearManualTimers() {
    if (letterTimerRef.current) { window.clearTimeout(letterTimerRef.current); letterTimerRef.current = null; }
    if (wordTimerRef.current)   { window.clearTimeout(wordTimerRef.current);   wordTimerRef.current = null; }
  }
  function clearPlaybackRingTimers() {
    if (pbBlueTimerRef.current) { window.clearTimeout(pbBlueTimerRef.current); pbBlueTimerRef.current = null; }
    if (pbRedTimerRef.current)  { window.clearTimeout(pbRedTimerRef.current);  pbRedTimerRef.current = null; }
  }

  function scheduleLetterAndWord(unit: number) {
    clearManualTimers();
    const lGap = letterGapMs(unit); const wGap = wordGapMs(unit);
    // Start blue/red rings ONLY after release
    setBlueMs(lGap); setBlueActive(true); setBlueCycle(c=>c+1);
    blueStartAtRef.current = performance.now();
    letterEndAtRef.current = (blueStartAtRef.current ?? 0) + lGap;
    letterTimerRef.current = window.setTimeout(finalizeLetter, lGap);

    setRedMs(wGap); setRedActive(true); setRedCycle(c=>c+1);
    redStartAtRef.current = performance.now();
    wordEndAtRef.current = (redStartAtRef.current ?? 0) + wGap;
    wordTimerRef.current = window.setTimeout(insertSpaceIfNeeded, wGap);
  }

  function finalizeLetter() {
    letterTimerRef.current = null; setBlueActive(false);
    setSymbolBuffer(curr => { if (!curr.length) return curr; const code = curr.join(""); const ch = MORSE_TO_CHAR[code] ?? "�"; setTranscript(t=>t+ch); return []; });
  }
  function insertSpaceIfNeeded() {
    wordTimerRef.current = null; setRedActive(false);
    setSymbolBuffer(curr => { if (curr.length > 0) return curr; setTranscript(t => (t.endsWith(" ") || t.length===0 ? t : t+" ")); return curr; });
  }
  function addCharFromPanel(ch: string) {
    if (ch === "�") return;
    const buf = symbolBufferRef.current;
    if (buf.length > 0) { const code = buf.join(""); const decoded = MORSE_TO_CHAR[code] ?? "�"; setTranscript(t => t + decoded + ch); setSymbolBuffer([]); clearManualTimers(); setBlueActive(false); setBlueCycle(c=>c+1); setRedActive(false); setRedCycle(c=>c+1); }
    else setTranscript(t => t + ch);
  }

  // ---------- Pause / Resume (Shift) ----------
  function beginPause() {
    if (pausedRef.current) return;
    pausedRef.current = true; setPaused(true);
    const now = performance.now();
    // track press pause so duration excludes paused time
    if (isPressed && pressPauseStartRef.current == null) pressPauseStartRef.current = now;

    // YELLOW
    if (yellowActive) {
      const start = yellowStartAtRef.current ?? now; const elapsed = now - start;
      const remain = Math.max(0, yellowMs - elapsed);
      yellowRemainRef.current = remain; setYellowActive(false);
    }
    // BLUE
    if (blueActive) {
      const endAt = letterEndAtRef.current ?? now; const remain = Math.max(0, endAt - now);
      blueRemainRef.current = remain; letterRemainRef.current = remain; setBlueActive(false); if (letterTimerRef.current) window.clearTimeout(letterTimerRef.current); letterTimerRef.current = null;
    }
    // RED
    if (redActive) {
      const endAt = wordEndAtRef.current ?? now; const remain = Math.max(0, endAt - now);
      redRemainRef.current = remain; wordRemainRef.current = remain; setRedActive(false); if (wordTimerRef.current) window.clearTimeout(wordTimerRef.current); wordTimerRef.current = null;
    }
  }
  function endPause() {
    if (!pausedRef.current) return;
    pausedRef.current = false; setPaused(false);
    const now = performance.now();
    if (pressPauseStartRef.current != null) { pressPausedAccumRef.current += now - pressPauseStartRef.current; pressPauseStartRef.current = null; }
    // resume YELLOW only if still holding
    if (isPressed && yellowRemainRef.current > 0) {
      setYellowMs(yellowRemainRef.current); setYellowActive(true); setYellowCycle(c=>c+1); yellowStartAtRef.current = now;
    }
    // resume BLUE
    if (blueRemainRef.current > 0) {
      setBlueMs(blueRemainRef.current); setBlueActive(true); setBlueCycle(c=>c+1); blueStartAtRef.current = now; letterEndAtRef.current = now + blueRemainRef.current; letterTimerRef.current = window.setTimeout(finalizeLetter, blueRemainRef.current);
    }
    // resume RED
    if (redRemainRef.current > 0) {
      setRedMs(redRemainRef.current); setRedActive(true); setRedCycle(c=>c+1); redStartAtRef.current = now; wordEndAtRef.current = now + redRemainRef.current; wordTimerRef.current = window.setTimeout(insertSpaceIfNeeded, redRemainRef.current);
    }
  }

  // ---------- Input Handlers ----------
  function vibrate(ms: number) { try { (navigator as any).vibrate?.(ms); } catch {} }
  const isEditableTarget = (el: EventTarget | null) => { const node = el as HTMLElement | null; if (!node) return false; return !!node.closest('input, textarea, [contenteditable="true"]'); };

  function handleDown() {
    if (isPlaying) return; if (isPressed) return; setIsPressed(true); vibrate(5); pressStartRef.current = performance.now(); pressPausedAccumRef.current = 0; pressPauseStartRef.current = null; if (soundOn) toneRef.current.start();
    // start yellow hold ring (dot→dash threshold)
    const holdDur = dotDashThresholdMs(unitMs); setYellowMs(holdDur); setYellowActive(true); setYellowCycle(c=>c+1); yellowStartAtRef.current = performance.now();
    // cancel blue/red if active (stay in same letter)
    if (blueActive) { setBlueActive(false); setBlueCycle(c=>c+1); }
    if (redActive)  { setRedActive(false);  setRedCycle(c=>c+1); }
    clearManualTimers();
  }
  function handleUp() {
    if (!isPressed) return; setIsPressed(false); vibrate(2); if (soundOn) toneRef.current.stop(); setYellowActive(false);
    const start = pressStartRef.current; pressStartRef.current = null; if (start==null) return;
    if (pressPauseStartRef.current != null) { // ended while paused
      pressPausedAccumRef.current += performance.now() - pressPauseStartRef.current; pressPauseStartRef.current = null;
    }
    const rawDur = performance.now() - start; const effectiveDur = Math.max(0, rawDur - pressPausedAccumRef.current); pressPausedAccumRef.current = 0;
    const unit = addUnitSample(effectiveDur); const threshold = dotDashThresholdMs(unit);
    const sym = effectiveDur < threshold ? '.' : '-'; setSymbolBuffer(buf => [...buf, sym]); scheduleLetterAndWord(unit);
  }

  // Key pointer events
  const keyRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = keyRef.current; if (!el) return;
    const onDown = (e: PointerEvent) => { (e as any).preventDefault?.(); if (!isPlaying) { el.setPointerCapture?.(e.pointerId); handleDown(); } };
    const onUp = (e: PointerEvent) => { (e as any).preventDefault?.(); if (!isPlaying) handleUp(); };
    const onCancel = () => { if (!isPlaying) handleUp(); };
    el.addEventListener("pointerdown", onDown); el.addEventListener("pointerup", onUp); el.addEventListener("pointercancel", onCancel); el.addEventListener("pointerleave", onCancel);
    return () => { el.removeEventListener("pointerdown", onDown); el.removeEventListener("pointerup", onUp); el.removeEventListener("pointercancel", onCancel); el.removeEventListener("pointerleave", onCancel); };
  }, [isPressed, isPlaying]);

  // Keyboard (ignore when typing in inputs)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if ((e.key === " " || e.key === "Spacebar" || e.key === "Enter") && !keyHeldRef.current[e.key]) { e.preventDefault(); keyHeldRef.current[e.key] = true; handleDown(); }
      else if (e.key === "Backspace") { e.preventDefault(); setSymbolBuffer(buf => (buf.length ? [] : buf)); clearManualTimers(); setBlueActive(false); setBlueCycle(c=>c+1); setRedActive(false); setRedCycle(c=>c+1); setTranscript(t => t.slice(0, -1)); }
      else if (e.key === "Shift" && !pausedRef.current) { e.preventDefault(); beginPause(); }
    };
    const up = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if ((e.key === " " || e.key === "Spacebar" || e.key === "Enter") && keyHeldRef.current[e.key]) { e.preventDefault(); keyHeldRef.current[e.key] = false; handleUp(); }
      else if (e.key === "Shift" && pausedRef.current) { e.preventDefault(); endPause(); }
    };
    window.addEventListener("keydown", down, { passive: false }); window.addEventListener("keyup", up, { passive: false });
    return () => { window.removeEventListener("keydown", down as any); window.removeEventListener("keyup", up as any); };
  }, [transcript, isPressed, paused]);

  // Cleanup
  useEffect(() => () => { clearManualTimers(); clearPlaybackRingTimers(); try { toneRef.current.stop(); } catch {} }, []);

  // ---------- Playback ring helpers (visuals only) ----------
  function pbStartPress(unit: number, symbolMs: number) {
    setIsPressed(true); setPlayGlow(true);
    pendingWordGapRef.current = 0;
    const threshold = dotDashThresholdMs(unit);
    setYellowMs(threshold); setYellowActive(true); setYellowCycle(c=>c+1);
    if (soundOn) toneRef.current.start();
    return { threshold, symbolMs };
  }
  function pbEndPress() {
    setIsPressed(false); setPlayGlow(false); if (soundOn) toneRef.current.stop(); setYellowActive(false);
  }
  function pbStartReleaseRings(unit: number) {
    clearPlaybackRingTimers();
    const lGap = letterGapMs(unit); const wGap = wordGapMs(unit);
    setBlueMs(lGap); setBlueActive(true); setBlueCycle(c=>c+1);
    setRedMs(wGap);  setRedActive(true);  setRedCycle(c=>c+1);
    pbBlueTimerRef.current = window.setTimeout(() => setBlueActive(false), lGap);
    pbRedTimerRef.current  = window.setTimeout(() => setRedActive(false),  wGap);
    pendingWordGapRef.current = wGap;
    return { lGap, wGap };
  }
  function pbStartWordGapOnly(unit: number) {
    clearPlaybackRingTimers();
    const wGap = wordGapMs(unit);
    setRedMs(wGap); setRedActive(true); setRedCycle(c=>c+1);
    pbRedTimerRef.current = window.setTimeout(() => setRedActive(false), wGap);
    pendingWordGapRef.current = wGap;
    return { wGap };
  }

  // ---------- Playback (aligned to rings, with highlight) ----------
  async function playTranscriptNow() {
    if (!transcript.trim() || isPlaying) return; setIsPlaying(true); playAbortRef.current.abort = false; setPlayGlow(false); setPlayIdx(null); setPlaybackPreview({ prev: null, current: null, next: null, activeSymbolIndex: null });
    try {
      const unit = playbackUnit();
      const chars = transcript.split("");
      const nextCodeFor = (idx: number) => {
        for (let j = idx + 1; j < chars.length; j++) {
          const nextChar = chars[j];
          if (nextChar === " ") continue;
          const candidate = CHAR_TO_MORSE[nextChar.toUpperCase() as keyof typeof CHAR_TO_MORSE];
          if (candidate) return candidate;
        }
        return null;
      };
      let lastCode: string | null = null;
      for (let i = 0; i < chars.length; i++) {
        if (playAbortRef.current.abort) break;
        const ch = chars[i]; setPlayIdx(i);
        if (ch === " ") {
          const nextCode = nextCodeFor(i);
          setPlaybackPreview({ prev: lastCode, current: null, next: nextCode, activeSymbolIndex: null });
          const remainingGap = pendingWordGapRef.current;
          if (remainingGap > 0) {
            await sleep(remainingGap);
            pendingWordGapRef.current = 0;
          } else {
            const { wGap } = pbStartWordGapOnly(unit);
            await sleep(wGap);
            pendingWordGapRef.current = 0;
          }
          continue;
        }
        const upper = ch.toUpperCase();
        const code = CHAR_TO_MORSE[upper as keyof typeof CHAR_TO_MORSE];
        const nextCode = nextCodeFor(i);
        if (!code) {
          setPlaybackPreview({ prev: lastCode, current: null, next: nextCode, activeSymbolIndex: null });
          await sleep(1 * unit);
          pendingWordGapRef.current = Math.max(0, pendingWordGapRef.current - 1 * unit);
          continue;
        }
        setPlaybackPreview({ prev: lastCode, current: code, next: nextCode, activeSymbolIndex: null });
        const parts = code.split("");
        for (let s = 0; s < parts.length; s++) {
          if (playAbortRef.current.abort) break;
          const symUnit = parts[s] === "." ? 1 : 3;
          const symbolMs = symUnit * unit;
          setPlaybackPreview(prev => ({ ...prev, activeSymbolIndex: s }));
          pbStartPress(unit, symbolMs);
          await sleep(symbolMs);
          pbEndPress();
          setPlaybackPreview(prev => ({ ...prev, activeSymbolIndex: null }));
          if (playAbortRef.current.abort) break;
          if (s < parts.length - 1) {
            pbStartReleaseRings(unit);
            await sleep(1 * unit);
            pendingWordGapRef.current = Math.max(0, pendingWordGapRef.current - 1 * unit);
          }
        }
        if (playAbortRef.current.abort) break;
        setPlaybackPreview(prev => ({ ...prev, prev: code, current: null, activeSymbolIndex: null }));
        lastCode = code;
        const { lGap } = pbStartReleaseRings(unit);
        await sleep(lGap);
        pendingWordGapRef.current = Math.max(0, pendingWordGapRef.current - lGap);
      }
    } finally {
      setYellowActive(false); setBlueActive(false); setRedActive(false);
      setIsPressed(false); setPlayGlow(false); if (soundOn) toneRef.current.stop(); setIsPlaying(false); clearPlaybackRingTimers(); setPlayIdx(null);
      setPlaybackPreview({ prev: null, current: null, next: null, activeSymbolIndex: null });
      pendingWordGapRef.current = 0;
    }
  }
  function stopPlayback() {
    if (!isPlaying) return;
    playAbortRef.current.abort = true;
    setPlaybackPreview({ prev: null, current: null, next: null, activeSymbolIndex: null });
  }

  // ---------- UI ----------
  const bgStyle: CSSProperties = dark ? {
    backgroundColor: "#0b1220",
    backgroundImage:
      "radial-gradient(1200px 800px at 80% -10%, rgba(255,255,255,0.04), rgba(0,0,0,0) 60%),"+
      "radial-gradient(1000px 700px at -10% 90%, rgba(255,255,255,0.035), rgba(0,0,0,0) 55%)",
    minHeight: "100vh",
  } : {
    backgroundColor: "#F5F3EE",
    backgroundImage:
      "radial-gradient(1200px 800px at 80% -10%, rgba(0,0,0,0.06), rgba(0,0,0,0) 60%)," +
      "radial-gradient(1000px 700px at -10% 90%, rgba(0,0,0,0.05), rgba(0,0,0,0) 55%)",
    minHeight: "100vh",
  };

  const panelChrome = dark ? "backdrop-blur bg-white/5 border border-white/10" : "backdrop-blur bg-white/60 border border-slate-200/70";
  const textMain = dark ? "text-slate-100" : "text-slate-800";
  const subText = dark ? "text-slate-400" : "text-slate-600";
  const chipOff = dark ? "text-slate-200 hover:bg-white/10" : "text-slate-700 hover:bg-white";
  const chipOn  = dark ? "bg-slate-100 text-slate-900" : "bg-slate-900 text-white";
  const buttonBase = dark ? "bg-white/10 border border-white/15 text-slate-100 hover:bg-white/15" : "bg-white/80 border border-slate-200 text-slate-800 hover:bg-white";
  const libraryButtonBase = dark ? "bg-white/5 border border-white/10 hover:bg-white/10" : "bg-white/70 border border-slate-200 hover:bg-white";
  const libraryHighlight = dark ? "bg-emerald-500/20 border border-emerald-400/40 hover:bg-emerald-500/25" : "bg-emerald-100 border border-emerald-300 hover:bg-emerald-100/80";
  const previewPanelClass = dark
    ? "bg-white/5 border border-white/10"
    : "bg-white border border-slate-300 shadow-sm";
  const branchingToggleClass = branching
    ? (dark ? "bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/25" : "bg-emerald-100 border border-emerald-300 text-emerald-700 hover:bg-emerald-100/80")
    : (dark ? "bg-white/10 border border-white/15 text-slate-200 hover:bg-white/15" : "bg-white/80 border border-slate-300 text-slate-600 hover:bg-white");

  function clearTranscript() {
    if (isPlaying) stopPlayback();
    setTranscript("");
    setSymbolBuffer([]);
  }
  const livePreview = bufferToPretty(symbolBuffer);
  const highlightFirstEntry = branching && symbolBuffer.length > 0 && libraryEntries.length > 0 && highlightCode === libraryEntries[0]?.code;
  const playButtonDisabled = !isPlaying && !transcript.trim();
  const renderCodeLine = (code: string | null, colorClass: string, highlightIndex: number | null) => {
    if (!code || code.length === 0) {
      return <span className={`block font-mono text-sm tracking-wide ${colorClass} opacity-60`}>&nbsp;</span>;
    }
    return (
      <span className={`block font-mono text-sm tracking-wide ${colorClass}`}>
        {code.split("").map((sym, idx, arr) => (
          <span key={idx} className={highlightIndex === idx ? "text-red-500 font-bold" : undefined}>
            {sym === "." ? "·" : "–"}
            {idx < arr.length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    );
  };

  // Ring geometry (SVG keeps 240 viewBox; element is scaled up via CSS so rings enlarge in lockstep)
  const R_RED = 118, R_BLUE = 112, R_YELLOW = 100;
  const CIRC_RED = 2 * Math.PI * R_RED, CIRC_BLUE = 2 * Math.PI * R_BLUE, CIRC_YELLOW = 2 * Math.PI * R_YELLOW;

  const visPressed = isPressed || playGlow;

  return (
    <div style={bgStyle} data-theme={dark?"dark":"light"} className={`relative ${textMain} antialiased overflow-hidden`}>
      {/* Decorative backdrop */}
      <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden>
        <div className="absolute -left-24 -top-24 w-[40rem] h-[40rem] rounded-full blur-3xl"
             style={{ background: dark?"linear-gradient(135deg, rgba(56,189,248,.12), rgba(52,211,153,.12))":"linear-gradient(135deg, rgba(59,130,246,.25), rgba(16,185,129,.25))" }} />
        <div className="absolute -right-24 bottom-0 w-[36rem] h-[36rem] rounded-full blur-3xl"
             style={{ background: dark?"linear-gradient(135deg, rgba(168,85,247,.12), rgba(244,63,94,.12))":"linear-gradient(135deg, rgba(99,102,241,.2), rgba(236,72,153,.2))" }} />
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-10 pb-40">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Morse Telegraph</h1>
            <p className={`text-sm mt-1 ${subText}`}>Press & hold · Auto timing · Live decode · Playback</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Speed selector */}
            <div className={`inline-flex items-center gap-1 rounded-xl p-1 shadow-sm ${panelChrome}`}>
              {(["verySlow","slow","normal","fast"] as SpeedKey[]).map(k => (
                <button key={k} onClick={() => setSpeed(k)} className={`px-3 py-1.5 rounded-lg text-sm transition ${speed===k?chipOn:chipOff}`}>{SPEEDS[k].label}</button>
              ))}
            </div>
            {/* Dark toggle */}
            <button onClick={()=>setDark(d=>!d)} className={`px-3 py-1.5 rounded-lg text-sm ${buttonBase}`}>{dark?"Light":"Dark"}</button>
          </div>
        </header>

        {/* Panels area (center column intentionally empty; key is overlaid and fixed) */}
        <main className="grid grid-cols-[280px_minmax(520px,1fr)_360px] gap-8 mt-10">
          {/* Left Legend Panel (arrow unchanged) */}
          <aside className="relative">
            <motion.div className={`${panelChrome} rounded-2xl shadow-sm overflow-hidden`}
              initial={false}
              animate={{ width: legendOpen ? 280 : 56 }}
              transition={{ type:"spring", stiffness:280, damping:28 }}
              style={{ maxHeight: "min(68vh, 640px)" }}
            >
              <div className={`flex items-center justify-between gap-2 px-3 py-2 ${dark?"border-b border-white/10":"border-b border-slate-200/70"}`}>
                <button className={`inline-flex items-center justify-center text-sm p-1.5 rounded-md ${dark?"bg-white text-slate-900":"bg-slate-900 text-white"}`}
                        onClick={()=>setLegendOpen(o=>!o)} aria-expanded={legendOpen} aria-label={legendOpen?"Collapse legend":"Expand legend"}>
                  {legendOpen ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>} {legendOpen && <span className="ml-2">Legend</span>}
                </button>
                {legendOpen && (<div className={`text-[11px] ${subText}`}>Rings & Colors</div>)}
              </div>
              {legendOpen && (
                <div className="p-3 text-sm">
                  <div className="flex items-center gap-3 mb-2"><span className="inline-block w-4 h-4 rounded-full" style={{background:"rgba(245,158,11,.9)"}}/> <div>Yellow: hold threshold (dot→dash)</div></div>
                  <div className="flex items-center gap-3 mb-2"><span className="inline-block w-4 h-4 rounded-full" style={{background:"rgba(2,132,199,.85)"}}/> <div>Blue: letter readiness (end of character)</div></div>
                  <div className="flex items-center gap-3"><span className="inline-block w-4 h-4 rounded-full" style={{background:"rgba(239,68,68,.85)"}}/> <div>Red: word readiness (space between words)</div></div>
                </div>
              )}
            </motion.div>
          </aside>

          {/* Center column left empty intentionally to maintain layout height */}
          <section className="min-h-[260px]" />

          {/* Right Library Panel */}
          <aside className="relative">
            <motion.div className={`${panelChrome} rounded-2xl shadow-sm overflow-hidden`}
              initial={false}
              animate={{ width: panelOpen ? 360 : 56 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              style={{ maxHeight: "min(68vh, 640px)" }}
            >
              <div className={`flex items-center justify-between gap-2 px-3 py-2 ${dark?"border-b border-white/10":"border-b border-slate-200/70"}`}>
                <button className={`inline-flex items-center justify-center text-sm p-1.5 rounded-md ${dark?"bg-white text-slate-900":"bg-slate-900 text-white"}`}
                        onClick={() => setPanelOpen(o => !o)} aria-expanded={panelOpen} aria-label={panelOpen?"Collapse library":"Expand library"}>
                  {/* Collapsed shows ▶ to expand; open shows ◀ to collapse */}
                  {panelOpen ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>} {panelOpen && <span className="ml-2">Library</span>}
                </button>
                {panelOpen && (<div className={`text-[11px] ${subText}`}>Morse Library</div>)}
              </div>
              {panelOpen && (
                <div className="p-3">
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex gap-2 items-center">
                      <label className={`text-xs ${subText}`}>Sort</label>
                      <select value={sortMode} onChange={e => setSortMode(e.target.value as any)} className={`text-sm px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400 ${dark?"bg-white/10 border border-white/15 text-slate-100":"bg-white/80 border border-slate-300"}`}>
                        <option value="alpha">Alphabetical (symbols last)</option>
                        <option value="alphaRev">Reverse alphabetical</option>
                        <option value="shape">Code shape (short→long, dots→dashes)</option>
                      </select>
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <label className={`text-xs ${subText}`}>Speed</label>
                      <select value={speed} onChange={e => setSpeed(e.target.value as SpeedKey)} className={`text-sm px-2 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400 ${dark?"bg-white/10 border border-white/15 text-slate-100":"bg-white/80 border border-slate-300"}`}>
                        <option value="verySlow">Very slow</option>
                        <option value="slow">Slow (default)</option>
                        <option value="normal">Normal</option>
                        <option value="fast">Fast</option>
                      </select>
                      <button onClick={() => setBranching(b => !b)} aria-pressed={branching} className={`px-3 py-1 rounded-md text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-400 ${branchingToggleClass}`}>
                        Branching {branching ? "On" : "Off"}
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter… (A, .-, etc.)" className={`w-full text-sm px-2 py-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-400 ${dark?"bg-white/10 border border-white/15 text-slate-100 placeholder:text-slate-400":"bg-white/80 border border-slate-300"}`} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 pr-1 overflow-auto" style={{ maxHeight: 440 }}>
                    {libraryEntries.map(({ char, code, synthetic }, idx) => (
                      <button key={`${char}-${code}`}
                              onClick={() => !synthetic && addCharFromPanel(char)}
                              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !synthetic) { e.preventDefault(); addCharFromPanel(char); } }}
                              disabled={synthetic}
                              className={`rounded-lg px-2 py-2 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60 disabled:cursor-not-allowed ${highlightFirstEntry && idx === 0 ? libraryHighlight : libraryButtonBase}`}>
                        <div className={`text-center text-[11px] ${subText}`}>{char}</div>
                        <div className="text-center font-mono tracking-wide">{prettyRef(code)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </aside>
        </main>
      </div>

      {/* Fixed overlay: key anchored dead-center of the viewport (enlarged) */}
      <div className="fixed inset-0 z-10 pointer-events-none flex items-center justify-center">
        <div className="pointer-events-auto">
          <motion.div ref={keyRef} role="button" aria-pressed={isPressed}
            className={`relative select-none w-[324px] h-[324px] rounded-full shadow-xl cursor-pointer outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-transparent flex items-center justify-center`}
            style={{
              background: (isPressed || playGlow) ? (dark?"linear-gradient(145deg, #0d1424, #0a111f)":"linear-gradient(145deg, #ffffff, #f0eee9)") : (dark?"linear-gradient(145deg, #0e1628, #0a111f)":"linear-gradient(145deg, #ffffff, #efece6)"),
              boxShadow: (isPressed || playGlow)
                ? (dark?"inset 8px 8px 20px rgba(0,0,0,.35), inset -8px -8px 20px rgba(255,255,255,.06), 0 0 0 18px rgba(56,189,248,.10), 0 12px 48px rgba(2,132,199,.25)":"inset 8px 8px 20px rgba(0,0,0,.06), inset -8px -8px 20px rgba(255,255,255,.8), 0 0 0 18px rgba(56,189,248,.15), 0 12px 48px rgba(2,132,199,.35)")
                : (dark?"10px 10px 28px rgba(0,0,0,.5), -10px -10px 28px rgba(255,255,255,.03)":"10px 10px 28px rgba(0,0,0,.08), -10px -10px 28px rgba(255,255,255,.9)"),
              pointerEvents: isPlaying ? "none" : undefined,
            }}
            animate={{ scale: (isPressed || playGlow) ? 0.98 : 1 }} transition={{ type: "spring", stiffness: 320, damping: 22 }} onContextMenu={(e) => e.preventDefault()}>

            {/* Rings around key */}
            <svg className="absolute inset-0" viewBox="0 0 240 240" aria-hidden>
              {/* RED (word readiness) */}
              {redActive && (
                <>
                  <circle cx="120" cy="120" r={R_RED} fill="none" stroke={dark?"rgba(239,68,68,.18)":"rgba(239,68,68,.14)"} strokeWidth="6" />
                  <motion.circle key={redCycle} cx="120" cy="120" r={R_RED} fill="none"
                    stroke={"rgba(239,68,68,.85)"} strokeWidth="7" strokeLinecap="round" strokeDasharray={CIRC_RED}
                    initial={{ strokeDashoffset: CIRC_RED, opacity: 0.95 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: redMs/1000, ease: "linear" }} />
                </>
              )}

              {/* BLUE (letter readiness) */}
              <circle cx="120" cy="120" r={R_BLUE} fill="none" stroke={dark?"rgba(56,189,248,.14)":"rgba(2,132,199,.12)"} strokeWidth="6" />
              {blueActive && (
                <motion.circle key={blueCycle} cx="120" cy="120" r={R_BLUE} fill="none"
                  stroke={dark?"rgba(56,189,248,.9)":"rgba(2,132,199,.85)"} strokeWidth="7" strokeLinecap="round" strokeDasharray={CIRC_BLUE}
                  initial={{ strokeDashoffset: CIRC_BLUE, opacity: 0.95 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: blueMs/1000, ease: "linear" }} />
              )}

              {/* YELLOW (hold threshold while pressed) */}
              <circle cx="120" cy="120" r={R_YELLOW} fill="none" stroke={dark?"rgba(245,158,11,.18)":"rgba(245,158,11,.16)"} strokeWidth="6" />
              {yellowActive && (
                <motion.circle key={yellowCycle} cx="120" cy="120" r={R_YELLOW} fill="none"
                  stroke={"rgba(245,158,11,.95)"} strokeWidth="7" strokeLinecap="round" strokeDasharray={CIRC_YELLOW}
                  initial={{ strokeDashoffset: CIRC_YELLOW, opacity: 0.95 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: yellowMs/1000, ease: "linear" }} />
              )}
            </svg>

            <motion.div className="w-[230px] h-[230px] rounded-full flex items-center justify-center"
              style={{
                background: (isPressed || playGlow)
                  ? (dark?"radial-gradient(circle at 40% 40%, rgba(2,132,199,.20), rgba(2,132,199,.06))":"radial-gradient(circle at 40% 40%, rgba(2,132,199,.25), rgba(2,132,199,.05))")
                  : (dark?"radial-gradient(circle at 60% 60%, rgba(255,255,255,.06), rgba(255,255,255,0))":"radial-gradient(circle at 60% 60%, rgba(15,23,42,.06), rgba(15,23,42,0))"),
                border: dark?"1px solid rgba(255,255,255,.06)":"1px solid rgba(15,23,42,.08)",
              }}
              animate={{ boxShadow: (isPressed || playGlow) ? (dark?"0 0 96px rgba(59,130,246,.35)":"0 0 96px rgba(56,189,248,.55)") : "0 0 0 rgba(0,0,0,0)" }} transition={{ duration: 0.12 }}>
              <div className="text-center">
                <div className={`tracking-wide ${subText} text-sm`}>PRESS & HOLD</div>
                <div className="text-5xl mt-1 font-semibold tracking-tight">Key</div>
                <div className={`mt-2 text-[12px] ${subText}`}>dot ≈ {dotMsDisp}ms · dash ≈ {dashMsDisp}ms</div>
                <div className={`text-[12px] ${subText}`}>char ≈ {charMsDisp}ms</div>
                <div className={`text-[12px] ${subText}`}>word ≈ {wordMsDisp}ms</div>
              </div>
            </motion.div>

            {/* Ripple when pressed or during playback */}
            <AnimatePresence>
              {(isPressed || playGlow) && (
                <motion.span className="absolute inset-0 rounded-full"
                  initial={{ boxShadow: "0 0 0 0 rgba(56,189,248,.0)" }}
                  animate={{ boxShadow: ["0 0 0 0 rgba(56,189,248,.0)", "0 0 0 28px rgba(56,189,248,.12)", "0 0 0 56px rgba(56,189,248,.06)"] }}
                  exit={{ boxShadow: "0 0 0 0 rgba(56,189,248,.0)" }} transition={{ duration: 0.8, ease: "easeOut", repeat: Infinity, repeatType: "loop" }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Glass Transcript Bar */}
      <div className="fixed left-0 right-0 bottom-0 z-20">
        <div className="mx-auto max-w-6xl px-4 pb-6">
          <div className={`glass-bar rounded-2xl shadow-lg ${dark?"border border-white/10":"border border-white/40"}`}>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className={`text-xs uppercase tracking-wider ${subText}`}>Transcript</div>
                <div className="mt-1 flex items-start gap-3">
                  {!isPlaying ? (
                    <textarea value={transcript} onChange={e=>setTranscript(e.target.value)} rows={2} placeholder="Type or edit here…"
                              className={`flex-1 resize-y rounded-md px-3 py-2 font-medium tracking-wide min-h-[48px] focus:outline-none focus:ring-2 focus:ring-sky-400 ${dark?"bg-white/5 border border-white/10 text-slate-100 placeholder:text-slate-400":"bg-white/80 border border-slate-200"}`} />
                  ) : (
                    <div className={`flex-1 rounded-md px-3 py-2 font-medium tracking-wide min-h-[48px] ${dark?"bg-white/5 border border-white/10 text-slate-100":"bg-white/80 border border-slate-200"} whitespace-pre-wrap`}
                         role="status" aria-live="polite">
                      {transcript.split("").map((ch, idx) => (
                        <span key={idx} className={idx===playIdx?"text-green-500 font-bold":""}>{ch}</span>
                      ))}
                    </div>
                  )}
                  <div className="shrink-0 mt-2 min-w-[116px] text-right flex justify-end">
                    {!isPlaying ? (
                      symbolBuffer.length > 0 ? (
                        <div className={`${previewPanelClass} rounded-md px-3 py-2`}>
                          <span className="block text-sky-500 font-mono text-sm tracking-wide">{livePreview}</span>
                        </div>
                      ) : null
                    ) : (
                      <div className={`${previewPanelClass} rounded-md px-3 py-2 flex flex-col items-end gap-1`}>
                        {renderCodeLine(playbackPreview.prev, "text-sky-500", null)}
                        {renderCodeLine(playbackPreview.current, "text-emerald-500", playbackPreview.activeSymbolIndex)}
                        {renderCodeLine(playbackPreview.next, "text-sky-500", null)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className={`px-3 py-2 rounded-md text-sm ${buttonBase}`} onClick={()=>setTranscript(t=>t.slice(0,-1))} title="Backspace">Backspace</button>
                <button className={`px-3 py-2 rounded-md text-sm ${dark?"bg-rose-600 text-white hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-400":"bg-rose-600 text-white hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-400"}`} onClick={clearTranscript}>Clear</button>
                <button className={`px-3 py-2 rounded-md text-sm border disabled:opacity-60 disabled:cursor-not-allowed ${isPlaying?(dark?"bg-sky-600 text-white border-sky-600 hover:bg-sky-500":"bg-sky-700 text-white border-sky-700 hover:bg-sky-600"):buttonBase}`} onClick={()=> (isPlaying? stopPlayback() : playTranscriptNow())} disabled={playButtonDisabled} title="Play back with tone (uses current speed)">{isPlaying?"Stop":"Play"}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .glass-bar { backdrop-filter: blur(12px) saturate(160%); -webkit-backdrop-filter: blur(12px) saturate(160%); }
        [data-theme='light'] .glass-bar { background: rgba(246,246,242,0.65); }
        [data-theme='dark'] .glass-bar  { background: rgba(2,6,23,0.6); }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}

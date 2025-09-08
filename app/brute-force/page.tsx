import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Info, Lock, Play, Pause, RotateCcw, Sparkles, Eye, EyeOff, Check, X } from "lucide-react";
import { WORDLISTS } from "./wordlists";

// ---- utils (condensed) ----
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const DIGITS="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const SYMBOLS="!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
const getCharsetForPassword=p=>{let s="";if(/[a-z]/.test(p))s+="abcdefghijklmnopqrstuvwxyz";if(/[A-Z]/.test(p))s+="ABCDEFGHIJKLMNOPQRSTUVWXYZ";if(/[0-9]/.test(p))s+="0123456789";if(/[^a-zA-Z0-9]/.test(p))s+=SYMBOLS;return s||DIGITS+SYMBOLS};
const pow10=x=>Math.pow(10,x);
const fmtPow10=x=>{if(!isFinite(x))return"∞";if(x===0)return"0";const e=Math.floor(Math.log10(Math.abs(x))),m=x/Math.pow(10,e);return`${m.toFixed(2)}e${e>=0?"+":""}${e}`};
const fmtTime=s=>s<60?`${Math.floor(s)}s`:s<3600?`${(s/60).toFixed(1)}m`:s<86400?`${(s/3600).toFixed(1)}h`:`${(s/86400).toFixed(1)}d`;
const fmtLong=s=>{if(!isFinite(s))return"(effectively impossible)";const u=[{s:1,l:"s"},{s:60,l:"min"},{s:3600,l:"h"},{s:86400,l:"d"},{s:31536000,l:"yr"},{s:31536000000,l:"millennia"}];let i=0;while(i<u.length-1&&s>=u[i+1].s)i++;const v=s/u[i].s;return`${v.toFixed(v>=100?0:v>=10?1:2)} ${u[i].l}`};
const log10Space=(len,cs)=>len*Math.log10(cs);
const rand=(n,ch)=>Array.from({length:n},()=>ch[Math.floor(Math.random()*ch.length)]).join("");
const fmtCommas=n=>{if(!isFinite(n))return"∞";return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,",")};

const lerp=(a,b,t)=>a+(b-a)*t;
const lerpColor=(c1,c2,t)=>[0,1,2].map(i=>Math.round(lerp(c1[i],c2[i],t)));
const TIMER_FROM=[255,255,255]; const TIMER_TO=[148,163,184];
const timerColor=p=>{const [r,g,b]=lerpColor(TIMER_FROM,TIMER_TO,clamp(p,0,1)); return `rgb(${r}, ${g}, ${b})`};

// Neon ring with progress-based glow
function Ring({progress}:{progress:number}){const p=clamp(progress,0,1),deg=p*360,glow=18+22*p,alpha=0.25+0.35*p;return(<div className="relative z-10 w-72 h-72 md:w-80 md:h-80"><div className="absolute inset-0 rounded-full" style={{background:`conic-gradient(rgb(56 189 248) ${deg}deg, rgb(30 41 59) ${deg}deg 360deg)`,filter:`drop-shadow(0 0 ${glow}px rgba(56,189,248,${alpha}))`}}/><div className="absolute inset-2 rounded-full bg-slate-900/70 backdrop-blur-xl border border-white/15"/></div>)}

function MiniRing({progress,color}:{progress:number;color:string}){const p=clamp(progress,0,1),deg=p*360;return(<div className="relative w-16 h-16"><div className="absolute inset-0 rounded-full" style={{background:`conic-gradient(${color} ${deg}deg, rgb(30 41 59) ${deg}deg 360deg)`}}/><div className="absolute inset-[2px] rounded-full bg-slate-900/70 border border-white/15"/></div>)}

function WordlistAttack({list,password,gps}:{list:{key:string;name:string;passwords:readonly string[]};password:string;gps:number}){
  const [started,setStarted]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const [done,setDone]=useState(false);
  const index=useMemo(()=>list.passwords.indexOf(password),[list,password]);
  const found=index!==-1;
  const finalProgress=found?(index+1)/list.passwords.length:1;
  const duration=useMemo(()=>finalProgress*list.passwords.length/gps,[finalProgress,list.passwords.length,gps]);
  const progress=started?Math.min(elapsed/duration,1)*finalProgress:0;
  useEffect(()=>{ if(!started||done) return; let raf:number; const start=performance.now(); const tick=(t:number)=>{const e=(t-start)/1000; if(e>=duration){setElapsed(duration); setDone(true);} else {setElapsed(e); raf=requestAnimationFrame(tick);} }; raf=requestAnimationFrame(tick); return()=>cancelAnimationFrame(raf); },[started,done,duration]);
  useEffect(()=>{ setStarted(false); setElapsed(0); setDone(false); },[password,gps,list]);
  const color=done?(found?"rgb(248 113 113)":"rgb(16 185 129)"):"rgb(56 189 248)";
  return(
    <div className="flex flex-col items-center gap-2">
      <Button onClick={()=>setStarted(true)} disabled={started} className="bg-white/10 hover:bg-white/20 text-slate-100 border-white/20 w-full justify-center">{list.name}</Button>
      {started&&(
        <div className="relative">
          <MiniRing progress={progress} color={color}/>
          <div className="absolute inset-0 grid place-items-center text-xs text-slate-100">
            {done ? (found ? <X className="h-4 w-4"/> : <Check className="h-4 w-4"/>) : fmtTime(elapsed)}
          </div>
        </div>
      )}
    </div>
  );
}

const PRESETS=[
  {name:"BlackBerry (2009)",exp:5.0,note:"~10^5 guesses/s (illustrative)"},
  {name:"iPhone (modern)",exp:8.0,note:"~10^8 guesses/s (illustrative)"},
  {name:"MacBook (CPU)",exp:9.0,note:"~10^9 guesses/s"},
  {name:"Gaming GPU",exp:11.0,note:"~10^11 guesses/s"},
  {name:"Cloud GPU Rig",exp:12.0,note:"~10^12 guesses/s"},
  {name:"FPGA/ASIC",exp:13.0,note:"~10^13 guesses/s"},
  {name:"Supercomputer",exp:14.5,note:"~10^14.5 guesses/s"},
  {name:"Quantum (theoretical)",exp:16.0,note:"Illustrative only"},
];

export default function BruteforceSimulator(){
  const [password,setPassword]=useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [started,setStarted]=useState(false);
  const [paused,setPaused]=useState(false);
  const [showAttemptStream,setShowAttemptStream]=useState(true);
  const [exp,setExp]=useState(11);
  const gps=useMemo(()=>pow10(exp),[exp]);
  const charset=useMemo(()=>getCharsetForPassword(password),[password]);
  const len=password.length||8, cs=charset.length;
  const l10Space=useMemo(()=>log10Space(len,cs),[len,cs]);
  const l10Avg=useMemo(()=>l10Space-Math.log10(2),[l10Space]);
  const l10Gps=useMemo(()=>Math.log10(gps),[gps]);
  const l10Sec=useMemo(()=>l10Avg-l10Gps,[l10Avg,l10Gps]);
  const estSec=useMemo(()=>Math.pow(10,l10Sec),[l10Sec]);

  const [elapsed,setElapsed]=useState(0); const [cracked,setCracked]=useState(false);
  const running=started&&!paused&&!cracked;

  // RAF loop
  const raf=useRef<number | null>(null); const last=useRef<number | null>(null);
  useEffect(()=>{ if(!running){ if(raf.current)cancelAnimationFrame(raf.current); raf.current=null; last.current=null; return; }
    const tick=(t:number)=>{ if(last.current==null) last.current=t; const dt=(t-last.current)/1000; last.current=t; setElapsed(e=>e+dt); raf.current=requestAnimationFrame(tick); };
    raf.current=requestAnimationFrame(tick); return()=>{ if(raf.current)cancelAnimationFrame(raf.current); };
  },[running]);

  const progress=useMemo(()=>clamp(estSec>0?elapsed/estSec:1,0,1),[elapsed,estSec]);
  useEffect(()=>{ if(!cracked&&progress>=1) setCracked(true); },[progress,cracked]);

  // Attempt stream and count
  const [stream,setStream]=useState<{s:string;hit?:boolean}[]>([]);
  useEffect(()=>{ if(!running) return; const iv=setInterval(()=>{ const items=Array.from({length:12},()=>({s:rand(len,charset)})); setStream(p=>[...items,...p].slice(0,80)); },120); return()=>clearInterval(iv); },[running,len,charset]);
  useEffect(()=>{ if(started&&cracked) setStream(p=>[{s:password||rand(len,charset),hit:true},...p].slice(0,80)); },[cracked,started,password,len,charset]);
  const attemptsTried=useMemo(()=>{const t=elapsed*gps;return Number.isFinite(t)?Math.floor(t):Number.POSITIVE_INFINITY;},[elapsed,gps]);

  // Reset on param changes if not started
  useEffect(()=>{ if(!started){ setElapsed(0); setCracked(false); setStream([]);} },[password,exp,started]);
  // If password changes mid-run, terminate/run reset (no false cracked)
  const pw0=useRef(password); useEffect(()=>{ if(started&&pw0.current!==password){ handleReset(); pw0.current=password; } else if(pw0.current!==password){ pw0.current=password; } },[password,started]);

  const canStart=password.length>0&&!started;
  const handleStart=()=>{ if(!password) return; setStarted(true); setPaused(false); setCracked(false); setElapsed(0); setStream([]); };
  const handleReset=()=>{ setStarted(false); setPaused(false); setCracked(false); setElapsed(0); setStream([]); };

  return(
  <TooltipProvider>
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-500/15 blur-3xl"/>
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-fuchsia-500/10 blur-3xl"/>
        <div className="absolute inset-0 opacity-[0.08]" style={{backgroundImage:"radial-gradient(circle at 1px 1px, rgba(255,255,255,.9) 1px, transparent 1px)",backgroundSize:24}}/>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-cyan-400/25 border border-cyan-400/40 grid place-items-center"><Sparkles className="h-5 w-5 text-cyan-200"/></div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Bruteforce Password Simulator</h1>
              <p className="text-sm text-slate-300">Futuristic glass UI to teach security & code.</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-slate-300 text-sm"><Info className="h-4 w-4"/> Educational simulation — illustrative speeds.</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Attack */}
          <Card className="relative overflow-visible bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl ring-1 ring-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-100"><Lock className="h-5 w-5 text-cyan-300"/> Live Attack</CardTitle>
              <CardDescription className="text-slate-200">Timer counts up until your password is cracked.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="relative flex flex-col items-center justify-center">
                  <div className="relative">
                    <Ring progress={progress}/>
                    <div className="absolute inset-0 grid place-items-center z-30">
                      <motion.div key={fmtTime(elapsed)} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:0.25}} className="text-4xl sm:text-5xl md:text-6xl font-semibold tabular-nums tracking-tight" style={{color: timerColor(progress), textShadow: '0 2px 8px rgba(0,0,0,0.35)'}}>
                          {fmtTime(elapsed)}
                        </motion.div>
                      <div className="mt-2 text-xs text-slate-200">progress {(progress*100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-slate-300 mb-1">Password</div>
                    <div className="relative">
                      <Input placeholder="Enter a password to simulate…" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&canStart)handleStart();}} className="bg-white/10 border-white/20 focus-visible:ring-cyan-300/60 text-slate-100 placeholder:text-slate-400 pr-12" type={showPassword?"text":"password"}/>
                      <button aria-label={showPassword?"Hide password":"Show password"} onClick={()=>setShowPassword(v=>!v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md bg-white/10 hover:bg-white/20 border border-white/20">
                        {showPassword?<EyeOff className="h-4 w-4 text-slate-100"/>:<Eye className="h-4 w-4 text-slate-100"/>}
                      </button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button variant="secondary" className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 border-0" onClick={()=>setPassword(rand(12,DIGITS+SYMBOLS))}>Suggest</Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-xl bg-white/10 border border-white/15"><div className="text-slate-300 text-xs">Assumed charset</div><div className="font-medium text-slate-100">{cs} symbols</div></div>
                    <div className="p-3 rounded-xl bg-white/10 border border-white/15"><div className="text-slate-300 text-xs">Length</div><div className="font-medium text-slate-100">{len} chars</div></div>
                    <div className="p-3 rounded-xl bg-white/10 border border-white/15 col-span-2"><div className="text-slate-300 text-xs">Search space</div><div className="font-medium text-slate-100">10^{l10Space.toFixed(2)} ≈ {fmtPow10(Math.pow(10,l10Space))}</div></div>
                  </div>

                  <Separator className="bg-white/15"/>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-xl bg-white/10 border border-white/15"><div className="text-slate-300 text-xs">Speed</div><div className="font-medium text-slate-100">10^{exp.toFixed(1)} guesses/s</div></div>
                    <div className="p-3 rounded-xl bg-white/10 border border-white/15"><div className="text-slate-300 text-xs">Est. crack time</div><div className="font-medium text-slate-100">{isFinite(estSec)?fmtLong(estSec):"—"}</div></div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {!started&&(<Button onClick={handleStart} disabled={!canStart} className="gap-2 bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"><Play className="h-4 w-4"/> Start</Button>)}
                    {started&&!paused&&!cracked&&(<Button onClick={()=>setPaused(true)} variant="secondary" className="gap-2 bg-white/10 hover:bg-white/20 text-slate-100"><Pause className="h-4 w-4"/> Pause</Button>)}
                    {started&&paused&&!cracked&&(<Button onClick={()=>setPaused(false)} className="gap-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400"><Play className="h-4 w-4"/> Resume</Button>)}
                    {(started||cracked)&&(<Button onClick={handleReset} variant="ghost" className="gap-2 text-slate-100 hover:bg-white/10"><RotateCcw className="h-4 w-4"/> Reset</Button>)}
                    {cracked&&(<Badge className="bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">Cracked in {fmtTime(elapsed)}</Badge>)}
                  </div>

                  <Separator className="bg-white/15"/>

                  <div className="pt-4 space-y-3">
                    <div className="text-sm text-slate-100">Wordlist attacks</div>
                    <div className="grid grid-cols-2 gap-4">
                      {WORDLISTS.map(list=>(
                        <WordlistAttack key={list.key} list={list} password={password} gps={gps}/>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Control Panel */}
          <Card className="relative overflow-hidden bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl ring-1 ring-white/10">
            <CardHeader>
              <CardTitle className="text-lg text-slate-100">Control Panel</CardTitle>
              <CardDescription className="text-slate-200">Logarithmic speed & reference presets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3"><div className="text-sm text-slate-100">Logarithmic speed</div><div className="text-xs text-slate-300">10^{exp.toFixed(1)} guesses/sec</div></div>
                <Slider value={[exp]} onValueChange={v=>setExp(clamp(v[0],3,16))} min={3} max={16} step={0.1} className="cursor-pointer"/>
                <div className="flex justify-between text-xs text-slate-400 mt-2"><span>10^3</span><span>10^6</span><span>10^9</span><span>10^12</span><span>10^15</span></div>
              </div>

              <div>
                <div className="text-sm text-slate-100 mb-3">Presets</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESETS.map(p=>(
                    <Tooltip key={p.name}>
                      <TooltipTrigger asChild>
                        <Button variant="secondary" className="justify-start bg-white/10 hover:bg-white/20 text-slate-100 border-white/20" onClick={()=>setExp(p.exp)}>
                          <span className="truncate">{p.name}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">{p.note}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>

              <Separator className="bg-white/15"/>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-white/15 to-white/10 border border-white/20"><div className="text-xs text-slate-300">Average tries</div><div className="text-lg font-semibold text-slate-100">10^{l10Avg.toFixed(2)}</div><div className="text-xs text-slate-300">≈ {fmtPow10(Math.pow(10,l10Avg))} tries</div></div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-white/15 to-white/10 border border-white/20"><div className="text-xs text-slate-300">Time at this speed</div><div className="text-lg font-semibold text-slate-100">{isFinite(estSec)?fmtLong(estSec):"—"}</div><div className="text-xs text-slate-300">10^{l10Sec.toFixed(2)} seconds</div></div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 border border-white/20">
                <div className="text-sm text-slate-100 flex items-center gap-2"><Eye className="h-4 w-4"/> Show attempt stream</div>
                <Switch checked={showAttemptStream} onCheckedChange={setShowAttemptStream} className="bg-black data-[state=checked]:bg-white [&>span]:bg-white [&[data-state=checked]>span]:bg-black"/>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed">This is an educational simulation. Real attacks depend on hashing, salts, rate limits, and wordlists. Presets are ballpark references.</div>
            </CardContent>
          </Card>
        </div>

        {/* Attempt Stream */}
        <AnimatePresence>
          {showAttemptStream&&(
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:12}} transition={{duration:0.35}} className="mt-8">
              <Card className="bg-white/10 backdrop-blur-xl border-white/20 ring-1 ring-white/10 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-slate-100">Attempt Stream</CardTitle>
                  <CardDescription className="text-slate-200">Recently tried passwords</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {/* Right-aligned, comma-formatted growing count */}
                  <div className="mb-3 min-w-0">
                    <div className="text-xs text-slate-300 text-right">Tried</div>
                    <div className="font-mono text-lg text-slate-100 text-right overflow-x-auto whitespace-nowrap">{fmtCommas(attemptsTried)}</div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 pointer-events-none opacity-40" style={{backgroundImage:"linear-gradient(transparent, rgba(0,0,0,0.6))"}}/>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-hidden">
                      {stream.map((it,i)=>(
                        <motion.div key={it.s+"-"+i} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:0.2}} className={`text-sm font-mono tracking-tight px-3 py-2 rounded-lg border bg-white/[0.06] border-white/15 ${it.hit?"text-emerald-300 border-emerald-400/40 bg-emerald-400/10 shadow-[0_0_24px_rgba(16,185,129,0.25)]":"text-slate-100"}`}>
                          {it.s}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 text-center text-xs text-slate-400">Stronger, longer, diverse passwords grow the search space exponentially.</div>
      </div>
    </div>
  </TooltipProvider>
  );
}

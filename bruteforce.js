const {useState,useEffect,useMemo,useRef} = React;

const WORDLISTS = [
  { key: "100k-common", name: "100k-common", file: "public/wordlists/100k-most-used-passwords-NCSC.txt" },
  { key: "10k-common", name: "10k-common", file: "public/wordlists/10k-most-common.txt" },
  { key: "2024-common", name: "2024-common", file: "public/wordlists/2024-197_most_used_passwords.txt" },
  { key: "defaults", name: "defaults", file: "public/wordlists/default-passwords.txt" },
  { key: "rockyou", name: "rockyou", file: "public/wordlists/rockyou.txt" },
];

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

function Ring({progress}){
  const p=clamp(progress,0,1),deg=p*360;
  return React.createElement("div",{className:"big-ring"},
    React.createElement("div",{className:"ring-bg",style:{background:`conic-gradient(#38bdf8 ${deg}deg,#1e293b ${deg}deg)`}}),
    React.createElement("div",{className:"ring-center"})
  );
}

function MiniRing({progress,color}){
  const p=clamp(progress,0,1),deg=p*360;
  return React.createElement("div",{className:"mini-ring"},
    React.createElement("div",{className:"ring-bg",style:{background:`conic-gradient(${color} ${deg}deg,#1e293b ${deg}deg)`}}),
    React.createElement("div",{className:"ring-center"})
  );
}

function WordlistAttack({list,password,gps,onReveal}){
  const [words,setWords]=useState([]);
  const [started,setStarted]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const [done,setDone]=useState(false);
  const [denied,setDenied]=useState(false);

  useEffect(()=>{fetch(list.file).then(r=>r.text()).then(t=>setWords(t.split(/\r?\n/).filter(Boolean)));},[list]);

  const index=useMemo(()=>words.indexOf(password),[words,password]);
  const found=index!==-1;
  const finalProgress=words.length?(found?(index+1)/words.length:1):0;
  const duration=useMemo(()=>finalProgress*words.length/gps,[finalProgress,words.length,gps]);
  const progress=started&&duration>0?Math.min(elapsed/duration,1)*finalProgress:0;

  useEffect(()=>{if(!started||done)return;let raf;const start=performance.now();const tick=t=>{const e=(t-start)/1000;if(e>=duration){setElapsed(duration);setDone(true);}else{setElapsed(e);raf=requestAnimationFrame(tick);}};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);},[started,done,duration]);
  useEffect(()=>{setStarted(false);setElapsed(0);setDone(false);},[password,gps,list]);

  const handleButton=e=>{
    if(e.shiftKey){
      const open=w=>{const opened=onReveal(list,w);if(!opened)setDenied(true);};
      if(!words.length){fetch(list.file).then(r=>r.text()).then(t=>{const w=t.split(/\r?\n/).filter(Boolean);setWords(w);open(w);});}
      else{open(words);}
    }else{
      if(!words.length||!password)return;
      setStarted(true);
    }
  };

  const handleSkip=()=>{if(started&&!done){setElapsed(duration);setDone(true);}};
  const color=done?(found?"#f87171":"#10b981"):"#38bdf8";

  return React.createElement("div",{className:`wordlist ${denied?"denied":""}`},
    React.createElement("button",{className:"list-btn",disabled:started||!words.length,onClick:handleButton},list.name),
    started&&React.createElement("div",{className:"timer"},
      React.createElement("div",{className:"mini",onClick:handleSkip},
        React.createElement(MiniRing,{progress,color}),
        React.createElement("div",{className:"center"},done?(found?"✖":"✔"):fmtTime(elapsed))
      ),
      React.createElement("div",{className:"elapsed"},fmtTime(done?duration:elapsed))
    )
  );
}

function Overlay({data,onClose}){
  if(!data) return null;
  return React.createElement("div",{className:"overlay"},
    React.createElement("div",{className:"panel"},
      React.createElement("button",{className:"close",onClick:onClose},"×"),
      React.createElement("h2",null,data.name),
      React.createElement("pre",{className:"words"},data.passwords.join("\n")),
      React.createElement("a",{href:data.file,download:data.name+".txt",className:"download"},"Download")
    )
  );
}

function App(){
  const [password,setPassword]=useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [started,setStarted]=useState(false);
  const [paused,setPaused]=useState(false);
  const [overlay,setOverlay]=useState(null);
  const [adult,setAdult]=useState(null);
  const [exp,setExp]=useState(11);
  const gps=useMemo(()=>pow10(exp),[exp]);

  const charset=useMemo(()=>getCharsetForPassword(password),[password]);
  const len=password.length||8,cs=charset.length;
  const l10Space=useMemo(()=>log10Space(len,cs),[len,cs]);
  const l10Avg=useMemo(()=>l10Space-Math.log10(2),[l10Space]);
  const l10Gps=useMemo(()=>Math.log10(gps),[gps]);
  const l10Sec=useMemo(()=>l10Avg-l10Gps,[l10Avg,l10Gps]);
  const estSec=useMemo(()=>Math.pow(10,l10Sec),[l10Sec]);

  const [elapsed,setElapsed]=useState(0); const [cracked,setCracked]=useState(false);
  const running=started&&!paused&&!cracked;
  const raf=useRef(null); const last=useRef(null);
  useEffect(()=>{if(!running){if(raf.current)cancelAnimationFrame(raf.current);raf.current=null;last.current=null;return;}const tick=t=>{if(last.current==null)last.current=t;const dt=(t-last.current)/1000;last.current=t;setElapsed(e=>e+dt);raf.current=requestAnimationFrame(tick);};raf.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf.current);},[running]);

  const progress=useMemo(()=>clamp(estSec>0?elapsed/estSec:1,0,1),[elapsed,estSec]);
  useEffect(()=>{if(!cracked&&progress>=1)setCracked(true);},[progress,cracked]);

  const [stream,setStream]=useState([]);
  useEffect(()=>{if(!running)return;const iv=setInterval(()=>{const items=Array.from({length:12},()=>({s:rand(len,charset)}));setStream(p=>[...items,...p].slice(0,80));},120);return()=>clearInterval(iv);},[running,len,charset]);
  useEffect(()=>{if(started&&cracked)setStream(p=>[{s:password||rand(len,charset),hit:true},...p].slice(0,80));},[cracked,started,password,len,charset]);
  const attemptsTried=useMemo(()=>{const t=elapsed*gps;return Number.isFinite(t)?Math.floor(t):Number.POSITIVE_INFINITY;},[elapsed,gps]);

  useEffect(()=>{if(!started){setElapsed(0);setCracked(false);setStream([]);}},[password,exp,started]);
  const pw0=useRef(password);
  const handleReset=()=>{setStarted(false);setPaused(false);setCracked(false);setElapsed(0);setStream([]);};
  useEffect(()=>{if(started&&pw0.current!==password){handleReset();pw0.current=password;}else if(pw0.current!==password){pw0.current=password;}},[password,started]);

  const canStart=password.length>0&&!started;
  const handleStart=()=>{if(!password)return;setStarted(true);setPaused(false);setCracked(false);setElapsed(0);setStream([]);};

  const handleReveal=(list,words)=>{
    if(adult===false)return false;
    if(adult===null){const ok=window.confirm("This list may contain sensitive content. Are you 18 or older?");setAdult(ok);if(!ok)return false;}
    setOverlay({name:list.name,passwords:words,file:list.file});
    return true;
  };

  return React.createElement("div",null,
    React.createElement("h1",null,"Bruteforce Password Simulator"),
    React.createElement("div",{className:"live-attack"},
      React.createElement("div",{className:"ring-container"},
        React.createElement(Ring,{progress}),
        React.createElement("div",{className:"ring-label"},fmtTime(elapsed))
      ),
      React.createElement("div",{className:"controls"},
        React.createElement("input",{type:showPassword?"text":"password",placeholder:"Enter password",value:password,onChange:e=>setPassword(e.target.value)}),
        React.createElement("div",{className:"buttons"},
          !started && React.createElement("button",{onClick:handleStart,disabled:!canStart},"Start"),
          started&&!paused&&!cracked && React.createElement("button",{onClick:()=>setPaused(true)},"Pause"),
          started&&paused&&!cracked && React.createElement("button",{onClick:()=>setPaused(false)},"Resume"),
          (started||cracked) && React.createElement("button",{onClick:handleReset},"Reset")
        ),
        React.createElement("div",{className:"stats"},
          React.createElement("div",null,`Assumed charset: ${cs}`),
          React.createElement("div",null,`Length: ${len}`),
          React.createElement("div",null,`Search space: 10^${l10Space.toFixed(2)} ≈ ${fmtPow10(Math.pow(10,l10Space))}`),
          React.createElement("div",null,`Speed: 10^${exp.toFixed(1)} guesses/s`),
          React.createElement("div",null,`Est. crack time: ${isFinite(estSec)?fmtLong(estSec):"—"}`)
        ),
        React.createElement("div",{className:"speed"},
          React.createElement("input",{type:"range",min:3,max:16,step:0.1,value:exp,onChange:e=>setExp(parseFloat(e.target.value))})
        )
      )
    ),
    React.createElement("div",{className:"wordlists"},
      WORDLISTS.map(list=>React.createElement(WordlistAttack,{key:list.key,list,password,gps,onReveal:handleReveal}))
    ),
    React.createElement("div",{className:"attempt-stream"},
      React.createElement("div",null,`Tried: ${fmtCommas(attemptsTried)}`),
      React.createElement("div",{className:"attempts"},
        stream.map((it,i)=>React.createElement("div",{key:i,className:`attempt ${it.hit?"hit":""}`},it.s))
      )
    ),
    React.createElement(Overlay,{data:overlay,onClose:()=>setOverlay(null)})
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));


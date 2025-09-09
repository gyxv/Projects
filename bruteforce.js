const {useState,useEffect,useRef} = React;

const WORDLISTS = [
  { name: "100k-common", file: "public/wordlists/100k-most-used-passwords-NCSC.txt" },
  { name: "10k-common", file: "public/wordlists/10k-most-common.txt" },
  { name: "2024-common", file: "public/wordlists/2024-197_most_used_passwords.txt" },
  { name: "defaults", file: "public/wordlists/default-passwords.txt" },
  { name: "rockyou", file: "public/wordlists/rockyou.txt" }
];

const gps = 1e5; // guesses per second

function fmtTime(s){
  if(s<60) return `${s.toFixed(1)}s`;
  if(s<3600) return `${(s/60).toFixed(1)}m`;
  if(s<86400) return `${(s/3600).toFixed(1)}h`;
  return `${(s/86400).toFixed(1)}d`;
}

function MiniTimer({progress,color,onClick,text}){
  return React.createElement("div",{className:"mini",onClick},
    React.createElement("div",{className:"ring",style:{background:`conic-gradient(${color} ${progress*360}deg,#1e293b ${progress*360}deg)`}}),
    React.createElement("div",{className:"center"},text)
  );
}

function Wordlist({list,password,onReveal}){
  const [words,setWords] = useState([]);
  const [started,setStarted] = useState(false);
  const [elapsed,setElapsed] = useState(0);
  const [done,setDone] = useState(false);
  const [denied,setDenied] = useState(false);

  useEffect(()=>{fetch(list.file).then(r=>r.text()).then(t=>setWords(t.split(/\r?\n/).filter(Boolean)));},[list]);

  const index = words.indexOf(password);
  const found = index !== -1;
  const finalProgress = words.length ? (found ? (index+1)/words.length : 1) : 0;
  const duration = finalProgress * words.length / gps;

  useEffect(()=>{
    if(!started || done) return;
    let raf; const start = performance.now();
    const tick = t=>{
      const e = (t-start)/1000;
      if(e>=duration){ setElapsed(duration); setDone(true); }
      else { setElapsed(e); raf=requestAnimationFrame(tick); }
    };
    raf=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(raf);
  },[started,duration,done]);

  useEffect(()=>{ setStarted(false); setElapsed(0); setDone(false); },[password,list]);

  const handleButton = e => {
    if(e.shiftKey){
      const opened = onReveal(list, words);
      if(!opened) setDenied(true);
    }else{
      if(!words.length || !password) return;
      setStarted(true);
    }
  };

  const handleSkip = () => { if(started && !done){ setElapsed(duration); setDone(true); } };

  const color = done ? (found ? "#f87171" : "#10b981") : "#38bdf8";
  const progress = started && duration>0 ? Math.min(elapsed/duration,1)*finalProgress : 0;
  const text = done ? (found?"✖":"✔") : fmtTime(elapsed);

  return React.createElement("div",{className:`wordlist ${denied?"denied":""}`},
    React.createElement("button",{className:"list-btn",disabled:started || !words.length,onClick:handleButton},list.name),
    started && React.createElement("div",{className:"timer"},
      React.createElement(MiniTimer,{progress,color,onClick:handleSkip,text}),
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
  const [password,setPassword] = useState("");
  const [overlay,setOverlay] = useState(null);
  const [adult,setAdult] = useState(null);

  const handleReveal = (list, words) => {
    if(adult === false) return false;
    if(adult === null){
      const ok = window.confirm("This list may contain sensitive content. Are you 18 or older?");
      setAdult(ok); if(!ok) return false;
    }
    setOverlay({name:list.name,passwords:words,file:list.file});
    return true;
  };

  return React.createElement("div",{className:"app"},
    React.createElement("h1",null,"Password Simulator"),
    React.createElement("input",{type:password?"text":"password",placeholder:"Enter password",value:password,onChange:e=>setPassword(e.target.value)}),
    React.createElement("div",{className:"lists"},
      WORDLISTS.map(w=>React.createElement(Wordlist,{key:w.name,list:w,password,onReveal:handleReveal}))
    ),
    React.createElement(Overlay,{data:overlay,onClose:()=>setOverlay(null)})
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));


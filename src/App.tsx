
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, ArrowDownToLine, ArrowUpFromLine, BookOpen, Bookmark, Brain,
  CalendarDays, Check, ChevronDown, ChevronRight, CircleHelp, Clock3,
  FileText, GraduationCap, Home, Layers, ListChecks, Menu, Plus, Search,
  Settings, Sparkles, Trash2, X, ClipboardList, RotateCcw, ArrowLeft,
  Star, TrendingUp, ShieldCheck, Landmark, Receipt, Briefcase
} from "lucide-react";
import { SYLLABUS } from "./syllabus";

type Subject = { id: string; name: string; code: string; group: string; color: string; };
type Topic = { id: string; subjectId: string; chapter: string; name: string; status: "Not started" | "Learning" | "Completed"; difficulty: "Easy" | "Medium" | "Difficult"; notes: string; resource: string; };
type Session = { id: string; date: string; subjectId: string; topicId: string; topicName: string; minutes: number; note: string; };
type Note = { id: string; subjectId: string; topicId: string; title: string; body: string; updated: string; };
type Question = { id: string; subjectId: string; topicId: string; prompt: string; options: string[]; answer: number; explanation: string; };
type Flashcard = { id: string; subjectId: string; front: string; back: string; };
type Revision = { id: string; topicId: string; date: string; cycle: string; done: boolean; };
type State = { subjects: Subject[]; topics: Topic[]; sessions: Session[]; notes: Note[]; questions: Question[]; flashcards: Flashcard[]; revisions: Revision[]; };

const subjects: Subject[] = [
  { id: "fr", name: "Financial Reporting", code: "Paper 1 · FR", group: "Group I", color: "#8b5cf6" },
  { id: "afm", name: "Advanced Financial Management", code: "Paper 2 · AFM", group: "Group I", color: "#14b88a" },
  { id: "audit", name: "Advanced Auditing, Assurance & Professional Ethics", code: "Paper 3 · Audit", group: "Group I", color: "#f28c28" },
  { id: "dt", name: "Direct Tax Laws & International Taxation", code: "Paper 4 · DT", group: "Group II", color: "#3b82f6" },
  { id: "idt", name: "Indirect Tax Laws", code: "Paper 5 · IDT", group: "Group II", color: "#e5484d" },
  { id: "ibs", name: "Integrated Business Solutions", code: "Paper 6 · IBS", group: "Group II", color: "#2f4bb5" }
];

const SUBJECT_ICON: Record<string, typeof BookOpen> = { fr: BookOpen, afm: TrendingUp, audit: ShieldCheck, dt: Landmark, idt: Receipt, ibs: Briefcase };
const tint = (c: string) => ({ "--c": c }) as React.CSSProperties;

const NAME = "Meghana";

// Jishnu Pedengal's notes: one is shown per day, cycling through the list. Add or edit freely.
export const QUOTES = [
  "You're not alone in this journey. I'm with you, cheering you on every step of the way. ❤️",
  "One day at a time, one topic at a time. You're doing better than you think.",
  "I believe in you, today and every day. Keep going!",
  "Hard chapters don't last. Your determination does. Proud of you.",
  "Take a deep breath. You've already come so far, and I'm right here with you.",
  "Every hour you put in today is a gift to the future you. You've got this.",
  "Rest when you need to. Progress isn't only measured in pages. ❤️",
  "Small steps every day add up to something amazing. I can't wait to celebrate with you.",
  "You're stronger, smarter and braver than this exam. Never forget that.",
  "Whatever today looks like, I'm proud of you for showing up.",
  "Doubts are normal. Giving up isn't you. Keep going, Meghana.",
  "One more page, one more question, one more step. I'm cheering loudly for you!",
  "Be kind to yourself today. You're working so hard and it shows.",
  "Some days are tough. Remember why you started, and that I'm always with you.",
  "Your future self is going to thank you for today. So am I. ❤️",
  "Mistakes in practice are lessons for the exam. You're learning, and that's what matters.",
  "Don't compare your pace with anyone else's. Your journey is yours, and it's beautiful.",
  "Drink some water, stretch a little, then go show that chapter who's boss!",
  "I'm so proud of the way you keep going. You inspire me every day.",
  "CA Final is tough, but so are you. Keep believing.",
  "Today is another chance to get a little closer to your dream. I'm right beside you.",
  "Whatever happens today, you are enough. Keep going at your own pace.",
  "Revision is where the magic happens. You've got this!",
  "Remember to smile today. You're doing something incredible.",
  "Every topic you complete is a win. Celebrate the small wins. ❤️",
  "When it feels heavy, take a break and come back. I'll be cheering either way.",
  "Focus on today. Tomorrow will take care of itself.",
  "You're building something that will last a lifetime. Keep stacking those bricks.",
  "I believe in you more than you know. Keep going, superstar.",
  "Consistency beats intensity. Just keep showing up, and you will make it.",
  "The finish line is coming closer every day. I'll be there with you. ❤️"
];

const PAGES = ["Dashboard", "Syllabus", "Learn & Notes", "Practice", "Flashcards", "Revision", "Study Log", "Analytics", "Settings"];
const pageFromUrl = () => {
  try { const p = decodeURIComponent(location.hash.slice(1)); return PAGES.includes(p) ? p : "Dashboard"; }
  catch { return "Dashboard"; } // malformed link
};

const LISTS = ["topics", "sessions", "notes", "questions", "flashcards", "revisions"] as const;
const emptyState: State = { subjects, topics: [], sessions: [], notes: [], questions: [], flashcards: [], revisions: [] };

const KEY = "ca-final-companion-v1";
// Local YYYY-MM-DD; toISOString() would give the UTC date (yesterday in IST before 05:30).
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
// Same note all day, a different one the next day (indexed by local calendar day).
export const dailyQuote = (d: Date) => QUOTES[Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000) % QUOTES.length];
// Field types each item needs for the pages to render; anything else in a store/backup is dropped.
const REQUIRED: Record<typeof LISTS[number], Record<string, string>> = {
  topics: { id: "string", subjectId: "string", chapter: "string", name: "string", status: "string", difficulty: "string" },
  sessions: { id: "string", date: "string", subjectId: "string", minutes: "number" },
  notes: { id: "string", subjectId: "string", title: "string", body: "string", updated: "string" },
  questions: { id: "string", subjectId: "string", prompt: "string", answer: "number" },
  flashcards: { id: "string", subjectId: "string", front: "string", back: "string" },
  revisions: { id: "string", topicId: "string", date: "string", cycle: "string", done: "boolean" }
};
const isValid = (k: typeof LISTS[number], x: unknown) => {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  return Object.entries(REQUIRED[k]).every(([f, t]) => typeof r[f] === t)
    && (k !== "questions" || (Array.isArray(r.options) && r.options.every(o => typeof o === "string")));
};
export const normalise = (raw: unknown): State => {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const s: State = { ...emptyState };
  for (const k of LISTS) { const v = o[k]; if (Array.isArray(v)) (s[k] as unknown[]) = v.filter(x => isValid(k, x)); }
  return s;
};
// Keep unreadable or partly invalid data aside instead of letting the next save overwrite it.
const keepAside = (raw: string | null) => { try { if (raw) localStorage.setItem(`${KEY}-unreadable`, raw); } catch { /* storage blocked */ } };
// Every ICAI chapter as a topic. New installs start with these; "Load ICAI chapters" adds any missing ones.
export const syllabusTopics = (): Topic[] => Object.entries(SYLLABUS).flatMap(([subjectId, groups]) => groups.flatMap(([chapter, names]) =>
  names.map(name => ({ id: uid(), subjectId, chapter, name, status: "Not started" as const, difficulty: "Medium" as const, notes: "", resource: "" }))));
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const today = () => ymd(new Date());
const readState = (): State => {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
    if (!raw) return { ...emptyState, topics: syllabusTopics() };
    const parsed = JSON.parse(raw);
    const s = normalise(parsed);
    if (LISTS.some(k => s[k].length !== (Array.isArray(parsed?.[k]) ? parsed[k].length : 0))) keepAside(raw);
    return s;
  } catch { keepAside(raw); return emptyState; }
};
const fmtHours = (mins: number) => `${Math.floor(mins / 60)}h ${mins % 60}m`;

export default function App() {
  const [data, setData] = useState<State>(readState);
  const [page, setPage] = useState(pageFromUrl);
  const [selectedSubject, setSelectedSubject] = useState("fr");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch { setToast("Couldn't save. Browser storage is full or blocked, so export a backup."); }
  }, [data]);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const update = (patch: Partial<State>) => setData(prev => ({ ...prev, ...patch }));
  const notify = (message: string) => setToast(message);
  const currentSubject = subjects.find(s => s.id === selectedSubject)!;
  const topicById = (id: string) => data.topics.find(t => t.id === id);
  const subjectTopics = data.topics.filter(t => t.subjectId === selectedSubject);
  const totalMinutes = data.sessions.reduce((n, s) => n + s.minutes, 0);
  const completedTopics = data.topics.filter(t => t.status === "Completed").length;
  const progress = data.topics.length ? Math.round(completedTopics / data.topics.length * 100) : 0;
  // Each page gets a browser history entry, so the phone/browser back button moves between pages.
  const go = (name: string) => {
    setMobileNav(false);
    if (name === page) return;
    history.pushState({ app: true }, "", `#${encodeURIComponent(name)}`);
    setPage(name);
  };
  // Back inside the app; if this page was opened directly (no in-app history), go to the dashboard instead of leaving.
  const back = () => history.state?.app ? history.back() : go("Dashboard");
  useEffect(() => {
    const onPop = () => { setPage(pageFromUrl()); setModal(""); setMobileNav(false); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const addTopic = (chapter: string, name: string) => {
    if (!name.trim()) return;
    update({ topics: [...data.topics, { id: uid(), subjectId: selectedSubject, chapter: chapter.trim() || "Uncategorised", name: name.trim(), status: "Not started", difficulty: "Medium", notes: "", resource: "" }] });
    setModal(""); notify("Topic added");
  };
  const loadSyllabus = () => {
    const have = new Set(data.topics.map(t => `${t.subjectId}|${t.name}`));
    const add = syllabusTopics().filter(t => !have.has(`${t.subjectId}|${t.name}`));
    if (add.length) update({ topics: [...data.topics, ...add] });
    notify(add.length ? `Added ${add.length} ICAI chapters` : "All ICAI chapters are already in your syllabus");
  };
  const updateTopic = (id: string, patch: Partial<Topic>) => update({ topics: data.topics.map(t => t.id === id ? { ...t, ...patch } : t) });
  const addSession = (payload: Omit<Session, "id">) => {
    update({ sessions: [...data.sessions, { ...payload, id: uid() }] });
    setModal(""); notify("Study time saved");
  };
  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "ca-final-study-companion-backup.json"; a.click(); URL.revokeObjectURL(url);
  };
  const importData = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const incoming = JSON.parse(String(reader.result));
        if (!incoming || !Array.isArray(incoming.topics) || !Array.isArray(incoming.sessions)) throw new Error();
        setData(normalise(incoming));
        notify("Backup restored");
      } catch { notify("That file is not a valid app backup"); }
    };
    reader.onerror = () => notify("Couldn't read that file");
    reader.readAsText(file);
  };

  const nav = [
    { label: "Overview", icon: Home, items: ["Dashboard"] },
    { label: "Study", icon: BookOpen, items: ["Syllabus", "Learn & Notes", "Practice", "Flashcards", "Revision"] },
    { label: "Track", icon: Activity, items: ["Study Log", "Analytics"] },
    { label: "Personalise", icon: Settings, items: ["Settings"] }
  ];

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "show" : ""}`}>
      <div className="profile-mini"><div className="avatar"><img src="./avatar.jpg" alt=""/></div><div><b>{NAME}</b><small>May 2027 attempt</small></div><button className="icon-btn close-nav" aria-label="Close menu" onClick={() => setMobileNav(false)}><X size={18}/></button></div>
      <nav>{nav.map(group => <div className="nav-group" key={group.label}><div className="nav-heading"><group.icon size={14}/>{group.label}</div>{group.items.map(item => <button key={item} className={`nav-item ${page === item ? "active" : ""}`} onClick={() => go(item)}>{item === "Dashboard" ? <Home/> : item === "Syllabus" ? <Layers/> : item === "Learn & Notes" ? <FileText/> : item === "Practice" ? <ClipboardList/> : item === "Flashcards" ? <Brain/> : item === "Revision" ? <RotateCcw/> : item === "Study Log" ? <Clock3/> : item === "Analytics" ? <Activity/> : <Settings/>}{item}</button>)}</div>)}</nav>
      <div className="sidebar-bottom"><p className="tiny muted">Made with love by Jishnu Pedengal</p><div className="exam-card"><b>CA Final, May 2027</b><small>Keep going. You've got this.</small></div></div>
    </aside>
    {mobileNav && <div className="scrim" onClick={() => setMobileNav(false)}/>}
    <main className="main">
      <header className="topbar">{page !== "Dashboard" && <button className="icon-btn" aria-label="Back" title="Back" onClick={back}><ArrowLeft size={18}/></button>}<div className="top-actions"><span className="date-chip"><CalendarDays size={15}/>{new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span><button className="avatar top-avatar" aria-label="Settings" onClick={() => go("Settings")}><img src="./avatar.jpg" alt=""/></button></div></header>
      <div className="content">
        {page === "Dashboard" && <Dashboard data={data} totalMinutes={totalMinutes} progress={progress} onNavigate={go} onAdd={() => setModal("session")} onSubject={id => {setSelectedSubject(id); go("Syllabus");}}/>}
        {page === "Syllabus" && <Syllabus data={data} selected={selectedSubject} setSelected={setSelectedSubject} search={search} setSearch={setSearch} onAdd={() => setModal("topic")} onLoad={loadSyllabus} onUpdate={updateTopic} onDelete={id => update({topics:data.topics.filter(t=>t.id!==id)})}/>}
        {page === "Learn & Notes" && <Learn data={data} selected={selectedSubject} setSelected={setSelectedSubject} onAddNote={note => {update({notes:[...data.notes,note]});notify("Note saved");}} onDeleteNote={id => update({notes:data.notes.filter(n=>n.id!==id)})} onUpdateTopic={updateTopic}/>}
        {page === "Practice" && <Practice data={data} selected={selectedSubject} setSelected={setSelectedSubject} onAdd={q => {update({questions:[...data.questions,q]});notify("Question added");}}/>}
        {page === "Flashcards" && <Flashcards data={data} selected={selectedSubject} setSelected={setSelectedSubject} onAdd={f => {update({flashcards:[...data.flashcards,f]});notify("Flashcard added");}} onDelete={id=>update({flashcards:data.flashcards.filter(f=>f.id!==id)})}/>}
        {page === "Revision" && <RevisionPage data={data} onAdd={r=>{update({revisions:[...data.revisions,r]});notify("Revision scheduled");}} onToggle={id=>update({revisions:data.revisions.map(r=>r.id===id?{...r,done:!r.done}:r)})}/>}
        {page === "Study Log" && <StudyLog data={data} onAdd={() => setModal("session")} onDelete={id=>update({sessions:data.sessions.filter(s=>s.id!==id)})}/>}
        {page === "Analytics" && <Analytics data={data}/>}
        {page === "Settings" && <SettingsPage onExport={exportData} onImport={()=>fileRef.current?.click()} onReset={()=>{if(confirm("Reset all app data in this browser? Export a backup first if you need it.")){setData(emptyState);notify("App data reset");}}}/>}
      </div>
    </main>
    <nav className="tabbar" aria-label="Quick navigation">
      <button className={page === "Dashboard" ? "on" : ""} onClick={() => go("Dashboard")}><Home/>Home</button>
      <button className={page === "Syllabus" ? "on" : ""} onClick={() => go("Syllabus")}><Layers/>Syllabus</button>
      <button className="fab" aria-label="Log study time" onClick={() => setModal("session")}><Plus/></button>
      <button className={page === "Analytics" ? "on" : ""} onClick={() => go("Analytics")}><Activity/>Analytics</button>
      <button onClick={() => setMobileNav(true)}><Menu/>More</button>
    </nav>
    <input ref={fileRef} hidden type="file" accept="application/json" onChange={e=>{importData(e.target.files?.[0]);e.target.value="";}}/>
    {modal === "topic" && <TopicModal onClose={()=>setModal("")} onSave={addTopic}/>}
    {modal === "session" && <SessionModal data={data} onClose={()=>setModal("")} onSave={addSession}/>}
    {toast && <div className="toast"><Check size={16}/>{toast}</div>}
  </div>;
}

function PageTitle({title,desc,action}:{title:string;desc:string;action?:React.ReactNode}) {
  return <div className="page-title"><div><h1>{title}</h1><p className="muted">{desc}</p></div>{action}</div>;
}
const HEART = "M60 104C22 78 8 56 12 37 15 21 31 12 46 17c6 2 11 7 14 13 3-6 8-11 14-13 15-5 31 4 34 20 4 19-10 41-48 67z";
function HeartArt() {
  return <svg className="note-art" viewBox="0 0 120 112" aria-hidden="true">
    <defs>
      <linearGradient id="heart-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff9cc0"/><stop offset=".55" stopColor="#e5487f"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient>
      <radialGradient id="heart-shine" cx=".32" cy=".28" r=".38"><stop offset="0" stopColor="#fff" stopOpacity=".9"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></radialGradient>
    </defs>
    <path d={HEART} fill="url(#heart-fill)"/><path d={HEART} fill="url(#heart-shine)"/>
    <path d="M104 4l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#8b5cf6"/>
    <path d="M10 70l2 4.5 4.5 2-4.5 2-2 4.5-2-4.5-4.5-2 4.5-2z" fill="#14b88a"/>
    <circle cx="98" cy="90" r="4" fill="#f5b301"/>
  </svg>;
}
const QUICK = [
  { page: "Practice", label: "Practice", Icon: ClipboardList, color: "var(--violet)" },
  { page: "Flashcards", label: "Flashcards", Icon: Brain, color: "var(--teal)" },
  { page: "Revision", label: "Revision", Icon: RotateCcw, color: "var(--orange)" },
  { page: "Learn & Notes", label: "Learn & Notes", Icon: FileText, color: "var(--blue)" }
];
function Dashboard({data,totalMinutes,progress,onNavigate,onAdd,onSubject}:{data:State;totalMinutes:number;progress:number;onNavigate:(s:string)=>void;onAdd:()=>void;onSubject:(id:string)=>void}) {
  const next = data.revisions.filter(r=>!r.done).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);
  const lastTopic = [...data.sessions].sort((a,b)=>b.date.localeCompare(a.date))[0];
  const done = data.topics.filter(t=>t.status==="Completed").length;
  const todayMins = data.sessions.filter(s=>s.date===today()).reduce((n,s)=>n+s.minutes,0);
  const paper = (id: string) => { const all = data.topics.filter(t=>t.subjectId===id); const d = all.filter(t=>t.status==="Completed").length; return { all: all.length, done: d, pct: all.length ? Math.round(d / all.length * 100) : 0 }; };
  return <>
    <section className="hello"><div><h1>Hi, <b>{NAME}</b></h1><p>{todayMins ? `You've studied ${fmtHours(todayMins).replace(/^0h /, "").replace(/ 0m$/, "")} today.` : "Ready for today's first session?"}</p></div><img className="hello-figure" src="./meghana-figure.webp" alt="" width={210} height={560}/></section>
    <div className="dash-top">
      <section className="personal-note"><div className="note-body"><h2>Today's note</h2><p className="note-text">{dailyQuote(new Date())}</p><p className="note-sign">— Jishnu Pedengal</p><button className="primary" onClick={onAdd}><Plus size={18}/> Log study time</button></div><HeartArt/></section>
      <button className="progress-card" onClick={()=>onNavigate("Syllabus")}>
        <div className="pc-head"><div><span className="pc-icon"><Layers size={18}/></span><b>Syllabus progress</b><small>{done} of {data.topics.length} chapters done</small></div><div className="pc-big">{progress}<span>%</span></div></div>
        <div className="slider"><span style={{width:`${progress}%`}}/></div>
        <div className="slider-ends"><small>0%</small><small>100%</small></div>
      </button>
    </div>
    <div className="section-heading"><h2>Practise now</h2></div>
    <div className="quick-grid">{QUICK.map(({page,label,Icon,color})=><button key={page} className="quick-tile" onClick={()=>onNavigate(page)}><span className="chip" style={tint(color)}><Icon/></span>{label}</button>)}</div>
    <div className="stats-grid">
      <Stat icon={<Clock3/>} label="Study time" value={fmtHours(totalMinutes)} sub="All sessions"/>
      <Stat icon={<Star/>} label="Chapters done" value={`${done}`} sub={`${data.topics.length} in your syllabus`}/>
      <Stat icon={<Brain/>} label="Questions" value={`${data.questions.length}`} sub="In your question bank"/>
    </div>
    <div className="section-heading"><div><h2>Your papers</h2><p className="muted">Open a paper to see its chapters.</p></div><button className="text-btn" onClick={()=>onNavigate("Syllabus")}>View syllabus <ChevronRight size={16}/></button></div>
    <div className="subject-grid">{data.subjects.map(s=>{const st=paper(s.id);const Icon=SUBJECT_ICON[s.id]??BookOpen;return <button className="subject-card" key={s.id} onClick={()=>onSubject(s.id)}><span className="chip soft" style={tint(s.color)}><Icon/></span><div className="grow"><b>{s.name}</b><small>{st.done} of {st.all} chapters done</small><div className="subject-progress"><span style={{width:`${st.pct}%`,background:s.color}}/></div></div><span className="pct">{st.pct}%</span></button>})}</div>
    <div className="two-col dashboard-bottom"><section className="panel"><div className="panel-head"><div><h2>Continue learning</h2><p className="muted">Your latest study session</p></div><button className="text-btn" onClick={()=>onNavigate("Study Log")}>View all</button></div>{lastTopic?<div className="continue-row"><div className="soft-icon"><BookOpen/></div><div className="grow"><b>{lastTopic.topicName||"Study session"}</b><small>{data.subjects.find(s=>s.id===lastTopic.subjectId)?.name}, {lastTopic.date}</small></div><b>{fmtHours(lastTopic.minutes)}</b></div>:<Empty text="Your study sessions will appear here once you log your first session."/>}</section>
    <section className="panel"><div className="panel-head"><div><h2>Upcoming revisions</h2><p className="muted">Keep important topics fresh</p></div><button className="text-btn" onClick={()=>onNavigate("Revision")}>Open planner</button></div>{next.length?next.map(r=><div className="revision-row" key={r.id}><div className="soft-icon"><RotateCcw/></div><div className="grow"><b>{data.topics.find(t=>t.id===r.topicId)?.name||"Topic"}</b><small>{r.cycle}, {r.date}</small></div><span className="status-pill">Planned</span></div>):<Empty text="No revisions scheduled yet. Add a topic to your revision plan when you're ready."/>}</section></div>
    <div className="resource-banner"><div className="resource-icon"><GraduationCap size={22}/></div><div className="grow"><b>Official ICAI learning resources</b><p>Study material, RTPs, MTPs and suggested answers on the Board of Studies portal.</p></div><a className="outline-link" href="https://boslive.icai.org/" target="_blank" rel="noreferrer">Visit ICAI portal <ChevronRight size={16}/></a></div>
  </>;
}
function Stat({icon,label,value,sub}:{icon:React.ReactNode;label:string;value:string;sub:string}){return <div className="stat-card"><div className="stat-icon">{icon}</div><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>}
function Empty({text}:{text:string}){return <div className="empty"><div className="empty-icon"><BookOpen size={19}/></div><p>{text}</p></div>}

function SubjectPicker({selected,setSelected}:{selected:string;setSelected:(s:string)=>void}) {
  return <div className="subject-tabs">{subjects.map(s=><button key={s.id} className={selected===s.id?"selected":""} onClick={()=>setSelected(s.id)}>{s.code.split(" · ")[1]}</button>)}</div>;
}
function Syllabus({data,selected,setSelected,search,setSearch,onAdd,onLoad,onUpdate,onDelete}:{data:State;selected:string;setSelected:(s:string)=>void;search:string;setSearch:(s:string)=>void;onAdd:()=>void;onLoad:()=>void;onUpdate:(id:string,p:Partial<Topic>)=>void;onDelete:(id:string)=>void}) {
  const list=data.topics.filter(t=>t.subjectId===selected&&`${t.name} ${t.chapter}`.toLowerCase().includes(search.toLowerCase()));
  const groups=[...new Set(list.map(t=>t.chapter))];
  const sub=subjects.find(s=>s.id===selected)!;
  return <><PageTitle title="Syllabus" desc="Track every chapter of the ICAI syllabus, and add your own topics." action={<div className="title-actions"><button className="secondary" onClick={onLoad}><ListChecks size={17}/> Load ICAI chapters</button><button className="primary" onClick={onAdd}><Plus size={17}/> Add topic</button></div>}/>
    <div className="info-strip"><CircleHelp size={17}/><span>Chapters are from ICAI's Board of Studies study material (May 2027 editions; AFM uses the May 2026 edition until ICAI publishes a newer one). IBS is a case-study paper with no chapters. Check ICAI's applicability list for your attempt.</span></div>
    <SubjectPicker selected={selected} setSelected={setSelected}/>
    <div className="toolbar"><div><h2>{sub.name}</h2><p className="muted">{sub.group} · {list.length} topics added</p></div><div className="search-box"><Search size={16}/><input placeholder="Search chapters or topics" value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
    {groups.length?groups.map(g=><div className="chapter-block" key={g}><div className="chapter-head"><b>{g}</b><span>{list.filter(t=>t.chapter===g&&t.status==="Completed").length}/{list.filter(t=>t.chapter===g).length} completed</span></div>{list.filter(t=>t.chapter===g).map(t=><div className="topic-row" key={t.id}><div className={`topic-check ${t.status==="Completed"?"done":""}`} onClick={()=>onUpdate(t.id,{status:t.status==="Completed"?"Learning":"Completed"})}>{t.status==="Completed"&&<Check size={13}/>}</div><div className="grow"><b>{t.name}</b><small>{t.difficulty} · {t.status}</small></div><select value={t.status} onChange={e=>onUpdate(t.id,{status:e.target.value as Topic["status"]})}><option>Not started</option><option>Learning</option><option>Completed</option></select><button className="icon-btn danger-hover" onClick={()=>onDelete(t.id)} title="Delete topic"><Trash2 size={16}/></button></div>)}</div>):<div className="empty-large"><div className="empty-icon"><Layers size={24}/></div><h3>No chapters here yet</h3><p>Load the ICAI chapter list for every paper in one click, or add your own topics.</p><button className="primary" onClick={onLoad}><ListChecks size={17}/> Load ICAI chapters</button><a href="https://boslive.icai.org/" target="_blank" rel="noreferrer">Open official ICAI BoS portal <ChevronRight size={14}/></a></div>}
  </>;
}

function Learn({data,selected,setSelected,onAddNote,onDeleteNote,onUpdateTopic}:{data:State;selected:string;setSelected:(s:string)=>void;onAddNote:(n:Note)=>void;onDeleteNote:(id:string)=>void;onUpdateTopic:(id:string,p:Partial<Topic>)=>void}) {
  const [topicId,setTopicId]=useState(""); const [title,setTitle]=useState(""); const [body,setBody]=useState("");
  const topics=data.topics.filter(t=>t.subjectId===selected); const notes=data.notes.filter(n=>n.subjectId===selected);
  const chosen=topics.find(t=>t.id===topicId);
  const workspace=useRef<HTMLElement>(null);
  // On phones the notes sit below the chapter list, so bring them into view when a chapter is picked.
  const pick=(id:string)=>{
    setTopicId(id);
    if(!window.matchMedia?.("(max-width: 760px)").matches)return;
    const smooth=!window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    workspace.current?.scrollIntoView?.({behavior:smooth?"smooth":"auto",block:"start"});
  };
  useEffect(()=>{if(!topics.some(t=>t.id===topicId))setTopicId(topics[0]?.id||"");},[selected,data.topics]);
  return <><PageTitle title="Learning workspace" desc="Keep your own explanations, class notes, links and study material together."/>
    <SubjectPicker selected={selected} setSelected={setSelected}/>
    <div className="learn-grid"><section className="panel"><div className="panel-head"><div><h2>Topics</h2><p className="muted">Choose what you're learning</p></div></div>{topics.length?topics.map(t=><button className={`learn-topic ${topicId===t.id?"chosen":""}`} key={t.id} onClick={()=>pick(t.id)}><span className="grow"><b>{t.name}</b><small>{t.chapter}</small></span><ChevronRight size={16}/></button>):<Empty text="Add topics in the Syllabus section to create your learning workspace."/>}</section>
    <section className="panel learn-main" ref={workspace}><div className="panel-head"><div><h2>{chosen?.name||"Select a topic"}</h2><p className="muted">{chosen?.chapter||"Your learning notes and resources"}</p></div>{chosen&&<select value={chosen.status} onChange={e=>onUpdateTopic(chosen.id,{status:e.target.value as Topic["status"]})}><option>Not started</option><option>Learning</option><option>Completed</option></select>}</div>
      {chosen?<><div className="learning-guidance"><Sparkles size={17}/><div><b>Suggested learning flow</b><p>Read the relevant ICAI material → understand the concepts → work through illustrations → solve exam questions → write down what needs revision.</p></div></div><label className="field-label">Official or personal resource link</label><input className="text-input" placeholder="Paste a link to ICAI material, lecture or reference" value={chosen.resource} onChange={e=>onUpdateTopic(chosen.id,{resource:e.target.value})}/>{chosen.resource&&<a className="inline-link" href={chosen.resource} target="_blank" rel="noreferrer">Open resource <ChevronRight size={14}/></a>}<label className="field-label">Topic notes / key takeaways</label><textarea className="textarea" rows={4} placeholder="Write concepts, examples, doubts or important points..." value={chosen.notes} onChange={e=>onUpdateTopic(chosen.id,{notes:e.target.value})}/><div className="save-row"><span className="tiny muted">Saved automatically in this browser</span><button className="secondary" onClick={()=>{setTitle(chosen.name+" — Notes");setBody(chosen.notes);}}>Copy topic notes to note editor</button></div></>:<Empty text="Select a topic after adding chapters in the Syllabus section."/>}
    </section></div>
    <section className="panel notes-panel"><div className="panel-head"><div><h2>Personal notes library</h2><p className="muted">Your own summaries, formulas and important points</p></div></div><div className="note-editor"><input className="text-input" placeholder="Note title" value={title} onChange={e=>setTitle(e.target.value)}/><select className="select-input" value={topicId} onChange={e=>setTopicId(e.target.value)}><option value="">No linked topic</option>{topics.map(t=><option value={t.id} key={t.id}>{t.name}</option>)}</select><textarea className="textarea" rows={3} placeholder="Write your notes..." value={body} onChange={e=>setBody(e.target.value)}/><div className="right"><button className="primary" disabled={!title.trim()||!body.trim()} onClick={()=>{onAddNote({id:uid(),subjectId:selected,topicId,title,body,updated:today()});setTitle("");setBody("");}}>Save note</button></div></div>{notes.map(n=><div className="saved-note" key={n.id}><div className="grow"><b>{n.title}</b><small>{n.updated} {n.topicId?"· "+(data.topics.find(t=>t.id===n.topicId)?.name||"Topic"):""}</small><p>{n.body}</p></div><button className="icon-btn danger-hover" onClick={()=>onDeleteNote(n.id)}><Trash2 size={16}/></button></div>)}</section>
  </>;
}

function Practice({data,selected,setSelected,onAdd}:{data:State;selected:string;setSelected:(s:string)=>void;onAdd:(q:Question)=>void}) {
  const [mode,setMode]=useState<"quiz"|"add">("quiz"); const [idx,setIdx]=useState(0); const [answer,setAnswer]=useState<number|null>(null); const [show,setShow]=useState(false);
  const [topicId,setTopicId]=useState(""); const [prompt,setPrompt]=useState(""); const [opts,setOpts]=useState(["","","",""]); const [correct,setCorrect]=useState("0"); const [explanation,setExplanation]=useState("");
  const qs=data.questions.filter(q=>q.subjectId===selected); const q=qs[idx];
  return <><PageTitle title="Practice & test" desc="Build a personal question bank and test your understanding." action={<button className="primary" onClick={()=>setMode(mode==="add"?"quiz":"add")}>{mode==="add"?<X size={16}/>:<Plus size={16}/>} {mode==="add"?"Close":"Add question"}</button>}/>
    <SubjectPicker selected={selected} setSelected={s=>{setSelected(s);setIdx(0);setAnswer(null);setShow(false);}}/>
    {mode==="add"?<section className="panel form-panel"><h2>Add a multiple-choice question</h2><p className="muted">Add questions from your own notes or permitted study resources.</p><label className="field-label">Question</label><textarea className="textarea" rows={3} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Enter the question..."/><label className="field-label">Link to topic</label><select className="select-input" value={topicId} onChange={e=>setTopicId(e.target.value)}><option value="">Choose topic (optional)</option>{data.topics.filter(t=>t.subjectId===selected).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>{opts.map((o,i)=><div className="option-edit" key={i}><input className="text-input" value={o} onChange={e=>setOpts(opts.map((v,j)=>i===j?e.target.value:v))} placeholder={`Option ${i+1}`}/><label><input type="radio" name="correct" checked={correct===String(i)} onChange={()=>setCorrect(String(i))}/> Correct</label></div>)}<label className="field-label">Explanation</label><textarea className="textarea" rows={2} value={explanation} onChange={e=>setExplanation(e.target.value)} placeholder="Why is this the correct answer?"/><button className="primary" disabled={!prompt.trim()||opts.some(o=>!o.trim())} onClick={()=>{onAdd({id:uid(),subjectId:selected,topicId,prompt,options:opts,answer:Number(correct),explanation});setPrompt("");setOpts(["","","",""]);setExplanation("");setMode("quiz");}}>Save question</button></section>:<section className="panel quiz-panel">{qs.length?<><div className="quiz-meta"><span>Question {idx+1} of {qs.length}</span><span>{data.topics.find(t=>t.id===q.topicId)?.name||"General"}</span></div><h2>{q.prompt}</h2><div className="quiz-options">{q.options.map((o,i)=><button key={i} disabled={show} className={`quiz-option ${answer===i?"picked":""} ${show&&i===q.answer?"correct":show&&answer===i?"incorrect":""}`} onClick={()=>setAnswer(i)}><span>{String.fromCharCode(65+i)}</span>{o}{show&&i===q.answer&&<Check size={17}/>}</button>)}</div>{show&&<div className="explanation"><b>{answer===q.answer?"Correct!":"Let's review this one."}</b><p>{q.explanation||"No explanation added yet. You can review this topic in your notes."}</p></div>}<div className="quiz-actions">{!show?<button className="primary" disabled={answer===null} onClick={()=>setShow(true)}>Check answer</button>:<button className="primary" onClick={()=>{setIdx((idx+1)%qs.length);setAnswer(null);setShow(false);}}>Next question <ChevronRight size={16}/></button>}</div></>:<div className="empty-large"><div className="empty-icon"><ClipboardList size={24}/></div><h3>Your question bank starts here</h3><p>Add MCQs with answer explanations. You can organise them by subject and topic, then practise them here whenever you revise.</p><button className="primary" onClick={()=>setMode("add")}><Plus size={16}/> Add first question</button></div>}</section>}
  </>;
}
function Flashcards({data,selected,setSelected,onAdd,onDelete}:{data:State;selected:string;setSelected:(s:string)=>void;onAdd:(f:Flashcard)=>void;onDelete:(id:string)=>void}) {
  const [front,setFront]=useState("");const [back,setBack]=useState("");const [index,setIndex]=useState(0);const [flipped,setFlipped]=useState(false);
  const cards=data.flashcards.filter(f=>f.subjectId===selected); const card=cards[index];
  return <><PageTitle title="Flashcards" desc="Create short question-and-answer cards for active recall."/><SubjectPicker selected={selected} setSelected={s=>{setSelected(s);setIndex(0);setFlipped(false);}}/>
    <div className="flash-layout"><section className="panel"><div className="panel-head"><div><h2>Study cards</h2><p className="muted">{cards.length} cards in this subject</p></div></div>{card?<><button className="flash-card" onClick={()=>setFlipped(!flipped)}><small>{flipped?"Answer":"Question"}</small><strong>{flipped?card.back:card.front}</strong><span><RotateCcw size={15}/> Tap to flip</span></button><div className="flash-controls"><button className="secondary" onClick={()=>{setIndex((index-1+cards.length)%cards.length);setFlipped(false);}}>Previous</button><span>{index+1} / {cards.length}</span><button className="secondary" onClick={()=>{setIndex((index+1)%cards.length);setFlipped(false);}}>Next</button><button className="icon-btn danger-hover" onClick={()=>{onDelete(card.id);setIndex(0);}}><Trash2 size={16}/></button></div></>:<Empty text="No flashcards yet. Create cards for formulas, definitions, standards and key provisions."/>}</section>
    <section className="panel"><h2>Create a flashcard</h2><label className="field-label">Front · Question or prompt</label><textarea className="textarea" rows={3} value={front} onChange={e=>setFront(e.target.value)} placeholder="What do you want to remember?"/><label className="field-label">Back · Answer</label><textarea className="textarea" rows={4} value={back} onChange={e=>setBack(e.target.value)} placeholder="Write the answer or explanation..."/><button className="primary" disabled={!front.trim()||!back.trim()} onClick={()=>{onAdd({id:uid(),subjectId:selected,front,back});setFront("");setBack("");}}>Save flashcard</button></section></div>
  </>;
}
function RevisionPage({data,onAdd,onToggle}:{data:State;onAdd:(r:Revision)=>void;onToggle:(id:string)=>void}) {
  const [topicId,setTopicId]=useState("");const [date,setDate]=useState(today());const [cycle,setCycle]=useState("First revision");
  const ordered=[...data.revisions].sort((a,b)=>a.date.localeCompare(b.date));
  return <><PageTitle title="Revision planner" desc="Plan your revision cycles and mark them complete when you finish."/><section className="panel form-panel"><h2>Schedule a revision</h2><div className="form-grid"><div><label className="field-label">Topic</label><select className="select-input" value={topicId} onChange={e=>setTopicId(e.target.value)}><option value="">Choose a topic</option>{data.topics.map(t=><option key={t.id} value={t.id}>{subjects.find(s=>s.id===t.subjectId)?.code} · {t.name}</option>)}</select></div><div><label className="field-label">Revision date</label><input className="text-input" type="date" value={date} onChange={e=>setDate(e.target.value)}/></div><div><label className="field-label">Revision cycle</label><select className="select-input" value={cycle} onChange={e=>setCycle(e.target.value)}><option>First revision</option><option>Second revision</option><option>Final revision</option><option>Quick recap</option></select></div></div><button className="primary" disabled={!topicId} onClick={()=>onAdd({id:uid(),topicId,date,cycle,done:false})}><Plus size={16}/> Schedule revision</button></section>
    <section className="panel"><div className="panel-head"><div><h2>Your revision list</h2><p className="muted">{ordered.filter(r=>r.done).length} of {ordered.length} completed</p></div></div>{ordered.length?ordered.map(r=><div className="topic-row" key={r.id}><button className={`topic-check ${r.done?"done":""}`} onClick={()=>onToggle(r.id)}>{r.done&&<Check size={13}/>}</button><div className="grow"><b>{data.topics.find(t=>t.id===r.topicId)?.name||"Deleted topic"}</b><small>{r.cycle} · {r.date}</small></div><span className={`status-pill ${r.done?"complete":""}`}>{r.done?"Completed":"Planned"}</span></div>):<Empty text="Your revision plan is empty. Schedule the topics you want to revisit."/>}</section>
  </>;
}
function StudyLog({data,onAdd,onDelete}:{data:State;onAdd:()=>void;onDelete:(id:string)=>void}) {
  const [month,setMonth]=useState(today().slice(0,7));
  const list=data.sessions.filter(s=>s.date.startsWith(month)).sort((a,b)=>b.date.localeCompare(a.date));
  const sum=list.reduce((n,s)=>n+s.minutes,0);
  return <><PageTitle title="Study log" desc="Log the actual time you studied. There is no compulsory daily target." action={<button className="primary" onClick={onAdd}><Plus size={16}/> Add session</button>}/><div className="log-summary"><div><span className="muted">Selected month total</span><strong>{fmtHours(sum)}</strong></div><div><span className="muted">Sessions</span><strong>{list.length}</strong></div><div><span className="muted">Study days</span><strong>{new Set(list.map(s=>s.date)).size}</strong></div><input className="text-input month-input" type="month" value={month} onChange={e=>setMonth(e.target.value)}/></div><section className="panel">{list.length?list.map(s=><div className="session-row" key={s.id}><div className="date-box"><b>{new Date(s.date+"T00:00:00").getDate()}</b><small>{new Date(s.date+"T00:00:00").toLocaleDateString("en-IN",{month:"short"})}</small></div><div className="grow"><b>{s.topicName||"Study session"}</b><small>{subjects.find(x=>x.id===s.subjectId)?.name} {s.note?"· "+s.note:""}</small></div><strong>{fmtHours(s.minutes)}</strong><button className="icon-btn danger-hover" onClick={()=>onDelete(s.id)}><Trash2 size={16}/></button></div>):<Empty text="No study sessions recorded for this month. Add a session whenever you finish studying."/>}</section></>;
}
function Analytics({data}:{data:State}) {
  const now=new Date(); const startWeek=new Date(now);startWeek.setDate(now.getDate()-((now.getDay()+6)%7));const weekKey=ymd(startWeek);
  const week=data.sessions.filter(s=>s.date>=weekKey);const month=data.sessions.filter(s=>s.date.startsWith(today().slice(0,7)));
  const all=data.sessions.reduce((n,s)=>n+s.minutes,0);
  const max=Math.max(1,...subjects.map(sub=>data.sessions.filter(s=>s.subjectId===sub.id).reduce((n,s)=>n+s.minutes,0)));
  return <><PageTitle title="Study analytics" desc="Where your time is going and how your preparation is progressing."/><div className="stats-grid analytics-stats"><Stat icon={<Clock3/>} label="All-time study" value={fmtHours(all)} sub={`${data.sessions.length} sessions logged`}/><Stat icon={<CalendarDays/>} label="This week" value={fmtHours(week.reduce((n,s)=>n+s.minutes,0))} sub="Since Monday"/><Stat icon={<Activity/>} label="This month" value={fmtHours(month.reduce((n,s)=>n+s.minutes,0))} sub="Current calendar month"/><Stat icon={<ListChecks/>} label="Topics completed" value={`${data.topics.filter(t=>t.status==="Completed").length}`} sub={`Out of ${data.topics.length} added topics`}/></div>
    <section className="panel analytics-panel"><div className="panel-head"><div><h2>Subject-wise study time</h2><p className="muted">All recorded sessions</p></div></div>{subjects.map(s=>{const mins=data.sessions.filter(x=>x.subjectId===s.id).reduce((n,x)=>n+x.minutes,0);const Icon=SUBJECT_ICON[s.id]??BookOpen;return <div className="bar-row" key={s.id}><span className="chip soft" style={tint(s.color)}><Icon/></span><div className="grow"><b>{s.name}</b><div className="bar-track"><span style={{width:`${mins/max*100}%`,background:s.color}}/></div></div><strong>{fmtHours(mins)}</strong></div>})}</section>
    <div className="two-col"><section className="panel"><h2>Preparation snapshot</h2><div className="snapshot-line"><span>Topics marked completed</span><b>{data.topics.filter(t=>t.status==="Completed").length}</b></div><div className="snapshot-line"><span>Topics currently learning</span><b>{data.topics.filter(t=>t.status==="Learning").length}</b></div><div className="snapshot-line"><span>Notes saved</span><b>{data.notes.length}</b></div><div className="snapshot-line"><span>Flashcards created</span><b>{data.flashcards.length}</b></div></section><section className="panel"><h2>Practice & revision</h2><div className="snapshot-line"><span>Questions in bank</span><b>{data.questions.length}</b></div><div className="snapshot-line"><span>Revisions scheduled</span><b>{data.revisions.length}</b></div><div className="snapshot-line"><span>Revisions completed</span><b>{data.revisions.filter(r=>r.done).length}</b></div><p className="tiny muted">Analytics are based only on information entered in this app. No target hours are assumed.</p></section></div>
  </>;
}
function SettingsPage({onExport,onImport,onReset}:{onExport:()=>void;onImport:()=>void;onReset:()=>void}) {
  return <><PageTitle title="Settings" desc="Back up, restore or reset your study data."/>
    <section className="panel settings-panel"><h2>Backup & restore</h2><p className="muted">Your data is stored locally in this browser. Export backups regularly, especially before clearing browser data or changing devices.</p><div className="backup-actions"><button className="secondary" onClick={onExport}><ArrowDownToLine size={17}/> Export backup (.json)</button><button className="secondary" onClick={onImport}><ArrowUpFromLine size={17}/> Restore backup</button></div></section>
    <section className="panel settings-panel"><h2>About your data</h2><ul className="plain-list"><li>There is no login or cloud sync. Your data stays in this browser.</li><li>Use Export backup to move your data to another browser or device.</li><li>Uploaded PDFs are not uploaded to a server. Add links to your resources or keep files in your own storage.</li><li>The syllabus is editable and should be checked against the ICAI material applicable to your exam attempt.</li></ul><div className="warning-box"><b>Reset app data</b><p>This removes the locally saved study data from this browser. Export a backup first if you want to keep it.</p><button className="danger-btn" onClick={onReset}><Trash2 size={15}/> Reset this browser's data</button></div></section>
  </>;
}

function TopicModal({onClose,onSave}:{onClose:()=>void;onSave:(chapter:string,name:string)=>void}) {
  const [chapter,setChapter]=useState("");const [name,setName]=useState("");
  return <Modal title="Add syllabus topic" onClose={onClose}><label className="field-label">Chapter / unit</label><input className="text-input" autoFocus value={chapter} onChange={e=>setChapter(e.target.value)} placeholder="e.g. Chapter 1"/><label className="field-label">Topic name</label><input className="text-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Enter topic name" onKeyDown={e=>e.key==="Enter"&&onSave(chapter,name)}/><div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={!name.trim()} onClick={()=>onSave(chapter,name)}>Add topic</button></div></Modal>;
}
function SessionModal({data,onClose,onSave}:{data:State;onClose:()=>void;onSave:(s:Omit<Session,"id">)=>void}) {
  const [date,setDate]=useState(today());const [subjectId,setSubjectId]=useState("fr");const [topicId,setTopicId]=useState("");const [hours,setHours]=useState("1");const [minutes,setMinutes]=useState("0");const [note,setNote]=useState("");
  const topicOptions=data.topics.filter(t=>t.subjectId===subjectId);
  return <Modal title="Log a study session" onClose={onClose}><p className="muted modal-desc">Enter the time you actually studied. You can log more than one session per day.</p><label className="field-label">Date</label><input className="text-input" type="date" value={date} onChange={e=>setDate(e.target.value)}/><label className="field-label">Subject</label><select className="select-input" value={subjectId} onChange={e=>{setSubjectId(e.target.value);setTopicId("");}}>{subjects.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select><label className="field-label">Topic (optional)</label><select className="select-input" value={topicId} onChange={e=>setTopicId(e.target.value)}><option value="">General study</option>{topicOptions.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select><label className="field-label">Actual study time</label><div className="duration-inputs"><div><input className="text-input" type="number" min="0" max="24" value={hours} onChange={e=>setHours(e.target.value)}/><small>Hours</small></div><div><input className="text-input" type="number" min="0" max="59" value={minutes} onChange={e=>setMinutes(e.target.value)}/><small>Minutes</small></div></div><label className="field-label">What did you cover? (optional)</label><input className="text-input" value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Read concepts and solved illustrations"/><div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={(Number(hours)||0)*60+(Number(minutes)||0)<=0||Number(hours)<0||Number(minutes)<0||Number(minutes)>59} onClick={()=>onSave({date,subjectId,topicId,topicName:topicOptions.find(t=>t.id===topicId)?.name||"",minutes:(Number(hours)||0)*60+(Number(minutes)||0),note})}>Save session</button></div></Modal>;
}
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="modal"><div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose}><X size={18}/></button></div>{children}</div></div>;}


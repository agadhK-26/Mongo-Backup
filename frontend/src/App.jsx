import { useEffect, useState, useCallback } from 'react';

// Replace ONLY the `const css = \`...\`;` block in App.jsx with this one.
// No JSX, state, handlers or API code is touched.

const css = `
*{box-sizing:border-box;margin:0}
[data-theme=dark]{--bg:#0f141b;--panel:#161d26;--panel2:#1c2530;--line:#263241;--text:#e4e9f0;--mute:#8b97a8;--side:#0b1118;--accent:#4c8dff;--accent2:#3b78e7;--btn:#2f6fe0;--btnh:#4580ec;--warnbg:rgba(239,83,80,.14);--warn:#ff7b78;--okbg:rgba(47,179,107,.15);--str:#5fcf94;--num:#6aa8ff;--oid:#e0b050;--dt:#b79cf0;--ok:#2fb36b;--shadow:0 1px 2px rgba(0,0,0,.35)}
[data-theme=light]{--bg:#f4f6f9;--panel:#ffffff;--panel2:#f1f3f7;--line:#dfe4ea;--text:#18212d;--mute:#637085;--side:#111c29;--accent:#1f5fd1;--accent2:#194fb0;--btn:#1f5fd1;--btnh:#194fb0;--warnbg:#fdecea;--warn:#c62828;--okbg:#e2f4ea;--str:#17794a;--num:#1f5fd1;--oid:#8f5f00;--dt:#6d3fc0;--ok:#1f9d5c;--shadow:0 1px 2px rgba(16,24,40,.06)}
html,body{height:100%}
body{background:var(--bg);color:var(--text);font-family:Inter,'Segoe UI',system-ui,-apple-system,Roboto,sans-serif;font-size:14px;line-height:1.45;-webkit-font-smoothing:antialiased}
.root{background:var(--bg);color:var(--text);min-height:100vh}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes slideIn{from{opacity:0}to{opacity:1}}
@keyframes pop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes pulse{0%{opacity:1}50%{opacity:.45}100%{opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes flow{0%{left:0;opacity:0}15%{opacity:1}85%{opacity:1}100%{left:100%;opacity:0}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes grad{0%{background-position:0 50%}100%{background-position:200% 50%}}
@keyframes leave{to{opacity:0;transform:translateX(24px);max-height:0;padding-top:0;padding-bottom:0;margin-bottom:0;border-width:0}}
@keyframes flashG{0%{background:var(--okbg)}100%{background:transparent}}
@keyframes toastbar{from{width:100%}to{width:0}}
@keyframes blink{50%{opacity:0}}
@keyframes line{from{opacity:0}to{opacity:1}}
@keyframes floaty{0%,100%{transform:none}}

/* startup screen */
.splash{position:fixed;inset:0;background:#0b1118;display:flex;align-items:center;justify-content:center;z-index:50}
.splash.out{opacity:0;transition:opacity .4s;pointer-events:none}
.term{width:min(460px,90vw);font-family:Consolas,'SFMono-Regular',monospace;color:#a9b6c6;font-size:13px;line-height:2}
.term .logo{font-size:20px;font-weight:600;color:#fff;margin-bottom:12px;font-family:Inter,'Segoe UI',sans-serif;letter-spacing:-.2px}
.term .logo span{color:#6aa8ff}
.term .ln{opacity:0;animation:line .3s forwards}
.term .ok{color:#2fb36b}
.term .cur{display:inline-block;width:7px;height:14px;background:#6aa8ff;vertical-align:middle;animation:blink 1s infinite}
.loadbar{height:2px;background:#1c2938;margin-top:16px;overflow:hidden}
.loadbar i{display:block;height:100%;width:0;background:#4c8dff;animation:lb 2s ease-out forwards}
@keyframes lb{to{width:100%}}

/* layout */
.app{display:flex;height:100vh}
.side{width:272px;background:var(--side);color:#b4bfcc;display:flex;flex-direction:column;flex-shrink:0;border-right:1px solid rgba(255,255,255,.06)}
.brand{padding:0 16px;height:52px;font-weight:600;color:#fff;font-size:14px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:10px;letter-spacing:-.1px}
.brand span{color:#8db4ff}
.logo-dot{width:26px;height:26px;border-radius:6px;background:#2f6fe0;display:grid;place-items:center;color:#fff;font-weight:700;font-size:13px}
.conn{padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.08);font-size:12px}
.conn b{display:flex;align-items:center;gap:8px;color:#fff;font-size:13px;font-weight:600;margin-bottom:3px;word-break:break-all}
.live{width:8px;height:8px;border-radius:50%;background:#2fb36b;flex-shrink:0}
.conn .ver{color:#8593a4}
.conn a{color:#8db4ff;cursor:pointer;font-size:12px;display:inline-block;margin-top:6px}
.conn a:hover{text-decoration:underline}
.tree{flex:1;overflow:auto;padding:10px 0}
.tree h4{padding:6px 16px 8px;font-size:12px;font-weight:600;color:#8593a4}
.dbrow{display:flex;justify-content:space-between;padding:7px 16px;cursor:pointer;color:#e6ebf2;transition:background .15s}
.dbrow:hover{background:rgba(255,255,255,.06)}
.dbrow small{color:#8593a4}
.colrow{padding:6px 16px 6px 36px;cursor:pointer;display:flex;justify-content:space-between;color:#b4bfcc;font-size:13px;transition:background .15s;border-left:2px solid transparent}
.colrow:hover{background:rgba(255,255,255,.05)}
.colrow.on{background:rgba(76,141,255,.14);color:#fff;border-left-color:#4c8dff}
.main{flex:1;display:flex;flex-direction:column;min-width:0;position:relative}
.top{background:var(--panel);border-bottom:1px solid var(--line);padding:0 24px;display:flex;gap:4px;align-items:flex-end;height:52px;position:relative}
.top .sp{flex:1}
.tabbtn{padding:16px 14px 13px;cursor:pointer;font-weight:500;color:var(--mute);border-bottom:2px solid transparent;transition:color .15s}
.tabbtn:hover{color:var(--text)}
.tabbtn.on{color:var(--text);font-weight:600;border-color:var(--accent)}
.theme{margin-bottom:10px;background:transparent;border:1px solid var(--line);color:var(--mute);border-radius:6px;padding:5px 12px;font-size:12px;cursor:pointer;transition:.15s}
.theme:hover{color:var(--text);border-color:var(--mute)}
.busybar{position:absolute;top:52px;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--accent),transparent);background-size:200% 100%;animation:shimmer 1.2s linear infinite;z-index:5}
.body{flex:1;overflow:auto;padding:24px 28px}
.page{animation:fadeUp .25s;max-width:1280px}
.crumb{font-size:20px;font-weight:600;letter-spacing:-.2px;margin-bottom:18px}
.crumb span{color:var(--mute);font-weight:400;font-size:14px}
.bar{display:flex;gap:10px;align-items:center;margin-bottom:14px}
.bar .grow{flex:1}

/* buttons / inputs */
.btn{background:var(--btn);color:#fff;border:1px solid transparent;border-radius:6px;padding:7px 14px;font-weight:600;font-size:13px;cursor:pointer;transition:background .15s,border-color .15s;font-family:inherit}
.btn:hover{background:var(--btnh)}
.btn:active{background:var(--accent2)}
.btn.sec{background:var(--panel);color:var(--text);border:1px solid var(--line);font-weight:500}
.btn.sec:hover{background:var(--panel2);border-color:var(--mute)}
.btn.red{background:transparent;color:var(--warn);border:1px solid var(--line);font-weight:500}
.btn.red:hover{background:var(--warnbg);border-color:var(--warn)}
.btn.sm{padding:4px 10px;font-size:12px}
.btn:disabled{opacity:.55;cursor:wait}
.spin{display:inline-block;width:12px;height:12px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;vertical-align:-2px;margin-right:6px}
input,select,textarea{padding:8px 10px;border:1px solid var(--line);border-radius:6px;font-size:13px;font-family:inherit;background:var(--panel);color:var(--text);width:100%;transition:border-color .15s,box-shadow .15s}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(76,141,255,.2)}
textarea{font-family:Consolas,'SFMono-Regular',monospace;line-height:1.5}
select option{background:var(--panel);color:var(--text)}

/* cards, docs */
.card{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:20px;margin-bottom:18px;box-shadow:var(--shadow)}
.card h3{font-size:15px;font-weight:600;margin-bottom:14px;display:flex;align-items:center}
.row{display:flex;gap:10px;margin-bottom:12px;align-items:center}
.lbl{font-size:12px;color:var(--mute);margin:12px 0 6px;font-weight:600}
.doc{background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:12px 16px;margin-bottom:10px;font-family:Consolas,'SFMono-Regular','Courier New',monospace;font-size:13px;line-height:1.65;overflow:hidden;transition:border-color .15s}
.doc:hover{border-color:var(--mute)}
.doc.leaving{animation:leave .4s forwards}
.dochead{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--line);font-family:Inter,'Segoe UI',system-ui,sans-serif}
.nest{padding-left:18px}
.k{color:var(--mute)}
.str{color:var(--str)}.num{color:var(--num)}.oid{color:var(--oid)}.nul{color:var(--mute)}.dt{color:var(--dt)}
table{width:100%;border-collapse:collapse;background:var(--panel);border:1px solid var(--line);border-radius:8px;overflow:hidden;box-shadow:var(--shadow)}
th{text-align:left;font-size:12px;font-weight:600;color:var(--mute);padding:10px 14px;background:var(--panel2);border-bottom:1px solid var(--line)}
td{padding:11px 14px;border-top:1px solid var(--line);font-size:13px}
thead tr td,thead+tbody tr:first-child td{border-top:0}
tr.rowin{animation:fadeUp .25s both}
tbody tr{transition:background .15s}
tbody tr:hover{background:var(--panel2)}
tr.fresh{animation:flashG 1.6s}
.mono{font-family:Consolas,'SFMono-Regular',monospace;font-size:12px;color:var(--mute)}
.badge{padding:2px 9px;border-radius:4px;font-size:12px;font-weight:600;display:inline-block}
.badge.auto{background:var(--okbg);color:var(--str)}
.badge.manual{background:rgba(217,164,65,.16);color:#b8800f}
.badge.warn{background:var(--warnbg);color:var(--warn)}
.status{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--mute);margin-right:8px}
.status.on{background:var(--ok)}
.empty{color:var(--mute);padding:32px;text-align:center}
.hint{font-size:12px;color:var(--mute);margin-top:10px;line-height:1.55}

/* overview */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:18px}
@media(max-width:1000px){.stats{grid-template-columns:repeat(2,1fr)}}
.stat{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:16px 18px;box-shadow:var(--shadow)}
.stat .n{font-size:28px;font-weight:600;color:var(--text);line-height:1.15;letter-spacing:-.5px;font-variant-numeric:tabular-nums}
.stat .l{font-size:13px;color:var(--mute);margin-top:4px}
.two{display:grid;grid-template-columns:1fr 320px;gap:18px;margin-bottom:18px}
.two .card{margin-bottom:0}
@media(max-width:1000px){.two{grid-template-columns:1fr}}
.pipe{display:flex;align-items:center;gap:0;margin:20px 0 8px}
.node{background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:14px;text-align:center;min-width:128px;transition:border-color .2s}
.node.hot{border-color:var(--accent)}
.node .ic{width:34px;height:34px;border-radius:6px;margin:0 auto 8px;display:grid;place-items:center;font-weight:700;font-size:11px;color:#fff;background:#2f6fe0}
.node.b .ic{background:#5b6b82}
.node.v .ic{background:#1f9d5c}
.node b{display:block;font-size:13px;font-weight:600}
.node small{color:var(--mute);font-size:11px}
.link{flex:1;height:2px;background:var(--line);position:relative;min-width:40px}
.link i{position:absolute;top:-2px;width:6px;height:6px;border-radius:50%;background:var(--accent);opacity:0}
.link.act i{animation:flow 2s linear infinite}
.link.act i:nth-child(2){animation-delay:.7s}
.link.act i:nth-child(3){animation-delay:1.4s}
.link.act{background:var(--accent)}
.ringwrap{display:grid;place-items:center;position:relative;margin:6px 0}
.ringwrap svg{transform:rotate(-90deg)}
.ringtxt{position:absolute;text-align:center}
.ringtxt b{display:block;font-size:22px;font-weight:600;font-family:Consolas,'SFMono-Regular',monospace;font-variant-numeric:tabular-nums}
.ringtxt small{color:var(--mute);font-size:11px}
.ring-bg{stroke:var(--line)}
.ring-fg{stroke:var(--accent);transition:stroke-dashoffset 1s linear}
.ring-spin{animation:spin 6s linear infinite;transform-origin:center}

/* connect */
.center{max-width:520px;margin:90px auto;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:32px;box-shadow:0 8px 30px rgba(16,24,40,.12);animation:fadeUp .3s}
.center h2{font-size:20px;font-weight:600;margin-bottom:6px;letter-spacing:-.2px}
.center p{color:var(--mute);margin-bottom:18px}
.presets{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}

/* toast */
.toast{position:fixed;bottom:20px;right:20px;padding:12px 18px;border-radius:6px;background:#1f9d5c;color:#fff;font-weight:500;box-shadow:0 8px 24px rgba(0,0,0,.28);z-index:60;max-width:420px;animation:pop .25s;overflow:hidden}
.toast.err{background:#c62828}
.toast i{position:absolute;left:0;bottom:0;height:3px;background:rgba(255,255,255,.45);animation:toastbar 4.5s linear forwards}

@media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
`;

const api = async (url, method = 'GET', body) => {
  const r = await fetch('/api' + url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(data.error || 'Request failed'); e.status = r.status; throw e; }
  return data;
};

const fmtSize = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : (b / 1024).toFixed(1) + ' KB');
const fmtTime = (ms) => {
  const s = Math.floor(ms / 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
};

function useCountUp(target) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf; const from = n; const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / 800);
      setN(Math.round(from + (target - from) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]); // eslint-disable-line
  return n;
}

const Stat = ({ label, value, suffix = '', delay = 0 }) => {
  const n = useCountUp(value);
  return (
    <div className="stat" style={{ animationDelay: delay + 'ms' }}>
      <div className="n">{n}{suffix}</div>
      <div className="l">{label}</div>
    </div>
  );
};

const Ring = ({ pct, text, sub, on }) => {
  const r = 60, c = 2 * Math.PI * r;
  return (
    <div className="ringwrap">
      <svg width="150" height="150" viewBox="0 0 150 150">
        <defs>
          <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00ed64" /><stop offset="100%" stopColor="#6aa8ff" />
          </linearGradient>
        </defs>
        <circle className="ring-bg" cx="75" cy="75" r={r} fill="none" strokeWidth="10" />
        <circle className="ring-fg" cx="75" cy="75" r={r} fill="none" strokeWidth="10" strokeLinecap="round"
          stroke="url(#rg)" strokeDasharray={c} strokeDashoffset={c * (1 - (on ? pct : 0))} />
      </svg>
      <div className="ringtxt"><b>{text}</b><small>{sub}</small></div>
    </div>
  );
};

const Pipeline = ({ active, on }) => (
  <div className="pipe">
    <div className={'node ' + (active ? 'hot' : '')}><div className="ic">DB</div><b>mongo</b><small>vol mongo-data</small></div>
    <div className={'link ' + (active ? 'act' : '')}><i /><i /><i /></div>
    <div className={'node b ' + (active ? 'hot' : '')}><div className="ic">API</div><b>backend</b><small>mongodump</small></div>
    <div className={'link ' + (active ? 'act' : '')}><i /><i /><i /></div>
    <div className={'node v ' + (active ? 'hot' : '')}><div className="ic">VOL</div><b>backup-data</b><small>{on ? 'auto backup ON' : 'Podman volume'}</small></div>
  </div>
);

const Val = ({ v, k }) => {
  if (v === null) return <span className="nul">null</span>;
  if (typeof v === 'string') {
    if (k === '_id' && /^[a-f0-9]{24}$/.test(v)) return <span className="oid">ObjectId('{v}')</span>;
    if (/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(v)) return <span className="dt">{v}</span>;
    return <span className="str">"{v}"</span>;
  }
  if (typeof v === 'number' || typeof v === 'boolean') return <span className="num">{String(v)}</span>;
  if (Array.isArray(v)) {
    return <span>[{v.map((x, i) => <span key={i}><Val v={x} />{i < v.length - 1 ? ', ' : ''}</span>)}]</span>;
  }
  return <div className="nest">{Object.entries(v).map(([kk, x]) => <div key={kk}><span className="k">{kk}: </span><Val v={x} k={kk} /></div>)}</div>;
};

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [splash, setSplash] = useState(true);
  const [splashOut, setSplashOut] = useState(false);
  const [conn, setConn] = useState(null);
  const [uriIn, setUriIn] = useState('');
  const [dbs, setDbs] = useState([]);
  const [open, setOpen] = useState({});
  const [sel, setSel] = useState({ db: null, col: null });
  const [docs, setDocs] = useState([]);
  const [backed, setBacked] = useState({});
  const [leaving, setLeaving] = useState({});
  const [rec, setRec] = useState({ items: [], log: [] });
  const [tab, setTab] = useState('overview');
  const [settings, setSettings] = useState(null);
  const [backups, setBackups] = useState([]);
  const [fresh, setFresh] = useState(null);
  const [val, setVal] = useState(4);
  const [unit, setUnit] = useState('hours');
  const [target, setTarget] = useState('all');
  const [formInit, setFormInit] = useState(false);
  const [showIns, setShowIns] = useState(false);
  const [ins, setIns] = useState({ db: '', col: '', json: '{\n  "name": "Test",\n  "value": 1\n}' });
  const [toast, setToast] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);

  const notify = (text, err = false) => { setToast({ text, err, k: Date.now() }); setTimeout(() => setToast(null), 4500); };

  const loadTop = useCallback(async () => {
    try {
      const c = await api('/connection');
      setConn(c);
      const [b, s] = await Promise.all([api('/backups'), api('/settings')]);
      setBackups(b); setSettings(s);
      if (c.connected) setDbs(await api('/databases')); else setDbs([]);
    } catch {}
  }, []);

  const loadDocs = async (db, col) => {
    const r = await api(`/databases/${db}/collections/${col}/docs`);
    setDocs(r.docs); setBacked(r.backed);
  };

  const loadRec = async () => {
    try {
      const [a, b] = await Promise.all([api('/recovery'), api('/deletions')]);
      setRec({ items: a, log: b });
    } catch {}
  };

  const recover = async (items) => {
    setBusy(true);
    try {
      const r = await api('/recover', 'POST', { items });
      notify(`Recovered ${r.recovered} document(s)`);
      await loadRec(); loadTop();
      if (sel.db && sel.col) loadDocs(sel.db, sel.col).catch(() => {});
    } catch (e) { notify(e.message, true); }
    setBusy(false);
  };

  const finishDelete = (id) => {
    setLeaving((l) => ({ ...l, [id]: true }));
    setTimeout(() => {
      setLeaving((l) => { const n = { ...l }; delete n[id]; return n; });
      loadDocs(sel.db, sel.col).catch(() => {});
      loadTop();
    }, 450);
  };

  const delDoc = async (id) => {
    if (!confirm('Delete this document?')) return;
    const url = `/databases/${sel.db}/collections/${sel.col}/docs/${encodeURIComponent(id)}`;
    try {
      await api(url + '?mode=safe', 'DELETE');
      notify('Deleted. A copy is safe in a backup.');
    } catch (e) {
      if (e.status !== 409) return notify(e.message, true);
      if (confirm('This document is NOT in any backup.\n\nOK = back it up first, then delete\nCancel = more options')) {
        try { await api(url + '?mode=backup', 'DELETE'); notify('Backed up, then deleted.'); }
        catch (e2) { return notify(e2.message, true); }
      } else if (confirm('Delete anyway?\nIt is not backed up, so it will be LOST permanently.')) {
        try { await api(url + '?mode=force', 'DELETE'); notify('Deleted. Not backed up, so it is lost.', true); }
        catch (e2) { return notify(e2.message, true); }
      } else return;
    }
    finishDelete(id);
  };

  const toggleDb = async (name) => {
    if (open[name]) { const o = { ...open }; delete o[name]; setOpen(o); return; }
    try { setOpen({ ...open, [name]: await api(`/databases/${name}/collections`) }); }
    catch (e) { notify(e.message, true); }
  };

  const pickCol = async (db, col) => {
    setSel({ db, col }); setTab('data');
    setIns((i) => ({ ...i, db, col }));
    try { await loadDocs(db, col); } catch (e) { notify(e.message, true); }
  };

  useEffect(() => { loadTop(); }, [loadTop]);
  useEffect(() => { if (conn?.connected) loadRec(); }, [conn?.connected]); // eslint-disable-line

  useEffect(() => {
    const a = setTimeout(() => setSplashOut(true), 2300);
    const b = setTimeout(() => setSplash(false), 2800);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);

  useEffect(() => {
    if (settings && !formInit) {
      const m = settings.everyMinutes;
      if (m % 60 === 0) { setVal(m / 60); setUnit('hours'); } else { setVal(m); setUnit('minutes'); }
      setTarget(settings.db || 'all');
      setFormInit(true);
    }
  }, [settings, formInit]);

  useEffect(() => {
    const t = setInterval(() => {
      loadTop();
      if (sel.db && sel.col) loadDocs(sel.db, sel.col).catch(() => {});
      if (tab === 'recover' || tab === 'overview') loadRec();
    }, 5000);
    return () => clearInterval(t);
  }, [sel, tab, loadTop]);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const doConnect = async (u) => {
    setBusy(true);
    try {
      await api('/connect', 'POST', { uri: u });
      setUriIn(''); setOpen({}); setSel({ db: null, col: null }); setDocs([]); setBacked({});
      notify('Connected'); await loadTop();
    } catch (e) { notify(e.message, true); }
    setBusy(false);
  };

  const disconnect = async () => {
    await api('/disconnect', 'POST');
    setOpen({}); setSel({ db: null, col: null }); setDocs([]); setBacked({});
    loadTop();
  };

  const saveSchedule = async (enabled) => {
    const everyMinutes = unit === 'hours' ? Number(val) * 60 : Number(val);
    try {
      setSettings(await api('/settings', 'POST', { enabled, everyMinutes, db: target }));
      notify(enabled ? `Auto backup ON: every ${val} ${unit}` : 'Auto backup stopped');
    } catch (e) { notify(e.message, true); }
  };

  const backupNow = async () => {
    setBusy(true);
    try {
      const r = await api('/backup', 'POST', { db: target });
      notify('Backup created: ' + r.file);
      setFresh(r.file); setTimeout(() => setFresh(null), 2000);
      loadTop();
    } catch (e) { notify(e.message, true); }
    setBusy(false);
  };

  const restore = async (file) => {
    if (!confirm(`Restore ${file}?\nCollections in the backed-up database(s) will be replaced.`)) return;
    setBusy(true);
    try { await api('/restore/' + file, 'POST'); notify('Restored ' + file); loadTop(); }
    catch (e) { notify(e.message, true); }
    setBusy(false);
  };

  const del = async (file) => {
    if (!confirm('Delete ' + file + '?')) return;
    try { await api('/backups/' + file, 'DELETE'); loadTop(); } catch (e) { notify(e.message, true); }
  };

  const insertDoc = async () => {
    let doc;
    try { doc = JSON.parse(ins.json); } catch { return notify('Invalid JSON', true); }
    try {
      await api('/insert', 'POST', { db: ins.db, collection: ins.col, doc });
      notify(`Inserted into ${ins.db}.${ins.col}`);
      setShowIns(false); await loadTop();
      setOpen({ ...open, [ins.db]: await api(`/databases/${ins.db}/collections`) });
      pickCol(ins.db, ins.col);
    } catch (e) { notify(e.message, true); }
  };

  const on = settings?.enabled;
  const total = settings ? settings.everyMinutes * 60000 : 1;
  const remaining = on && settings.nextRun ? Math.max(0, settings.nextRun - now) : null;
  const pct = remaining !== null ? 1 - remaining / total : 0;
  const ringText = on ? fmtTime(remaining ?? 0) : 'OFF';
  const ringSub = on ? 'until next backup' : 'scheduler stopped';
  const totalCols = dbs.reduce((a, d) => a + (d.collections || 0), 0);
  const totalSize = backups.reduce((a, b) => a + b.size, 0);
  const pipeActive = busy || !!on;

  const Toast = toast && (
    <div className={'toast ' + (toast.err ? 'err' : '')} key={toast.k}>{toast.text}<i /></div>
  );

  const Splash = splash && (
    <div className={'splash ' + (splashOut ? 'out' : '')}>
      <div className="term">
        <div className="logo">Mongo<span>Backup</span> · Podman</div>
        {[
          'podman network  mernnet',
          'podman volume   mongo-data',
          'podman volume   backup-data',
          'container       mongo',
          'container       backend',
          'container       frontend',
        ].map((t, i) => (
          <div className="ln" key={t} style={{ animationDelay: 0.2 + i * 0.28 + 's' }}>
            <span className="ok">✔</span> {t}
          </div>
        ))}
        <div className="ln" style={{ animationDelay: '2s' }}>ready <span className="cur" /></div>
        <div className="loadbar"><i /></div>
      </div>
    </div>
  );

  // ---------- not connected: connection screen ----------
  if (conn && !conn.connected) {
    return (
      <div className="root" data-theme={theme}>
        <style>{css}</style>
        {Splash}
        <div className="center">
          <h2>Connect to MongoDB</h2>
          <p>Paste a connection string, just like in MongoDB Compass.</p>
          <input value={uriIn} onChange={(e) => setUriIn(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && uriIn && doConnect(uriIn)}
            placeholder="mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/" />
          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn" disabled={busy || !uriIn} onClick={() => doConnect(uriIn)}>
              {busy && <span className="spin" />}{busy ? 'Connecting...' : 'Connect'}
            </button>
          </div>
          <div className="lbl">Quick connect</div>
          <div className="presets">
            <button className="btn sec" onClick={() => doConnect('mongodb://mongo:27017')}>Podman mongo container</button>
            <button className="btn sec" onClick={() => doConnect('mongodb://host.containers.internal:27017')}>MongoDB on my laptop</button>
          </div>
          <div className="hint">
            Atlas: allow your IP under Network Access, and URL-encode special characters in the password (@ becomes %40).
            The connection is saved in the backup-data volume, so it survives container restarts.
          </div>
        </div>
        {Toast}
      </div>
    );
  }

  return (
    <div className="root" data-theme={theme}>
      <style>{css}</style>
      {Splash}
      <div className="app">
        {/* SIDEBAR */}
        <div className="side">
          <div className="brand"><div className="logo-dot">M</div><div>Mongo<span>Backup</span> · Podman</div></div>
          <div className="conn">
            <b><span className="live" />{conn?.host || '...'}</b>
            <div className="ver">MongoDB {conn?.version || ''} · container {conn?.container}</div>
            <a onClick={disconnect}>Disconnect</a>
          </div>
          <div className="tree">
            <h4>Databases ({dbs.length})</h4>
            {dbs.length === 0 && <div className="empty" style={{ padding: 16 }}>No databases found</div>}
            {dbs.map((d, i) => (
              <div key={d.name}>
                <div className="dbrow" style={{ animationDelay: i * 60 + 'ms' }} onClick={() => toggleDb(d.name)}>
                  <span>{open[d.name] ? '▾' : '▸'} {d.name}</span>
                  <small>{d.collections}</small>
                </div>
                {open[d.name]?.map((c, j) => (
                  <div key={c.name} style={{ animationDelay: j * 50 + 'ms' }}
                    className={'colrow ' + (sel.db === d.name && sel.col === c.name ? 'on' : '')}
                    onClick={() => pickCol(d.name, c.name)}>
                    <span>{c.name}</span><small>{c.count}</small>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          <div className="top">
            <div className={'tabbtn ' + (tab === 'overview' ? 'on' : '')} onClick={() => setTab('overview')}>Overview</div>
            <div className={'tabbtn ' + (tab === 'data' ? 'on' : '')} onClick={() => setTab('data')}>Documents</div>
            <div className={'tabbtn ' + (tab === 'backup' ? 'on' : '')} onClick={() => setTab('backup')}>Backups ({backups.length})</div>
            <div className={'tabbtn ' + (tab === 'recover' ? 'on' : '')} onClick={() => { setTab('recover'); loadRec(); }}>
              Recovery ({rec.items.length})
            </div>
            <div className="sp" />
            <button className="theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? '☀ Light' : '☾ Dark'}
            </button>
          </div>
          {busy && <div className="busybar" />}

          <div className="body">
            {/* OVERVIEW */}
            {tab === 'overview' && (
              <div className="page">
                <div className="crumb">Overview <span>· rootless Podman containers</span></div>
                <div className="stats">
                  <Stat label="Databases" value={dbs.length} delay={0} />
                  <Stat label="Collections" value={totalCols} delay={80} />
                  <Stat label="Backups stored" value={backups.length} delay={160} />
                  <Stat label="Recoverable docs" value={rec.items.length} delay={240} />
                </div>

                <div className="two">
                  <div className="card">
                    <h3>Backup pipeline</h3>
                    <Pipeline active={pipeActive} on={on} />
                    <div className="hint">
                      mongodump reads from the mongo container, and the backend writes a compressed archive into the
                      Podman volume <b>backup-data</b>. Total stored: {fmtSize(totalSize)}.
                    </div>
                    <div className="row" style={{ marginTop: 16 }}>
                      <button className="btn" disabled={busy} onClick={backupNow}>
                        {busy && <span className="spin" />}Backup now
                      </button>
                      <button className="btn sec" onClick={() => setTab('backup')}>Schedule</button>
                    </div>
                  </div>

                  <div className="card">
                    <h3><span className={'status ' + (on ? 'on' : '')} />Next automatic backup</h3>
                    <Ring pct={pct} text={ringText} sub={ringSub} on={on} />
                    <div className="hint" style={{ textAlign: 'center' }}>
                      {on ? `Every ${settings.everyMinutes % 60 === 0 ? settings.everyMinutes / 60 + ' h' : settings.everyMinutes + ' min'} · ${settings.db}` : 'Start it from the Backups tab.'}
                      {settings?.lastRun && <><br />Last: {new Date(settings.lastRun).toLocaleString()}</>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DOCUMENTS */}
            {tab === 'data' && (
              <div className="page">
                <div className="crumb">
                  {sel.col ? <><span>{sel.db} / </span>{sel.col}</> : <span>Select a collection from the left</span>}
                </div>
                <div className="bar">
                  <div className="grow" />
                  <button className="btn" onClick={() => setShowIns(!showIns)}>+ Add data</button>
                </div>

                {showIns && (
                  <div className="card" style={{ animation: 'fadeUp .3s' }}>
                    <h3>Insert document</h3>
                    <div className="row">
                      <input placeholder="database" value={ins.db} onChange={(e) => setIns({ ...ins, db: e.target.value })} />
                      <input placeholder="collection" value={ins.col} onChange={(e) => setIns({ ...ins, col: e.target.value })} />
                    </div>
                    <textarea rows="6" value={ins.json} onChange={(e) => setIns({ ...ins, json: e.target.value })} />
                    <div className="row" style={{ marginTop: 12 }}>
                      <button className="btn" onClick={insertDoc}>Insert</button>
                      <button className="btn sec" onClick={() => setShowIns(false)}>Cancel</button>
                    </div>
                  </div>
                )}

                {sel.col && docs.length === 0 && <div className="empty">This collection has no documents.</div>}
                {docs.map((d, i) => (
                  <div className={'doc ' + (leaving[d._id] ? 'leaving' : '')} key={d._id} style={{ animationDelay: Math.min(i, 10) * 45 + 'ms' }}>
                    <div className="dochead">
                      {backed[d._id]
                        ? <span className="badge auto" title={backed[d._id]}>✔ in backup</span>
                        : <span className="badge warn">⚠ not backed up</span>}
                      <button className="btn red sm" onClick={() => delDoc(d._id)}>Delete</button>
                    </div>
                    {Object.entries(d).map(([k, v]) => <div key={k}><span className="k">{k}: </span><Val v={v} k={k} /></div>)}
                  </div>
                ))}
                {sel.col && docs.length >= 50 && <div className="hint">Showing the first 50 documents.</div>}
              </div>
            )}

            {/* BACKUPS */}
            {tab === 'backup' && (
              <div className="page">
                <div className="two">
                  <div className="card">
                    <h3><span className={'status ' + (on ? 'on' : '')} />Automatic backup is {on ? 'ON' : 'OFF'}</h3>
                    <div className="lbl">Back up every</div>
                    <div className="row">
                      <input type="number" min="1" value={val} onChange={(e) => setVal(e.target.value)} style={{ width: 110 }} />
                      <select value={unit} onChange={(e) => setUnit(e.target.value)} style={{ width: 130 }}>
                        <option value="hours">hours</option>
                        <option value="minutes">minutes</option>
                      </select>
                    </div>
                    <div className="lbl">Database</div>
                    <select value={target} onChange={(e) => setTarget(e.target.value)}>
                      <option value="all">All databases</option>
                      {dbs.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                    </select>
                    <div className="row" style={{ marginTop: 14 }}>
                      <button className="btn" onClick={() => saveSchedule(true)}>Start</button>
                      <button className="btn red" onClick={() => saveSchedule(false)}>Stop</button>
                      <button className="btn sec" disabled={busy} onClick={backupNow}>
                        {busy && <span className="spin" />}Backup now
                      </button>
                    </div>
                    <Pipeline active={pipeActive} on={on} />
                  </div>
                  <div className="card">
                    <h3>Countdown</h3>
                    <Ring pct={pct} text={ringText} sub={ringSub} on={on} />
                    <div className="hint" style={{ textAlign: 'center' }}>
                      {on ? `Every ${settings.everyMinutes % 60 === 0 ? settings.everyMinutes / 60 + ' h' : settings.everyMinutes + ' min'} · ${settings.db}` : 'Scheduler stopped.'}
                      {settings?.lastRun && <><br />Last: {new Date(settings.lastRun).toLocaleString()}</>}
                    </div>
                  </div>
                </div>

                <table>
                  <thead><tr><th>Type</th><th>Database</th><th>Created</th><th>Size</th><th>File</th><th></th></tr></thead>
                  <tbody>
                    {backups.length === 0 && <tr><td colSpan="6" className="empty">No backups yet.</td></tr>}
                    {backups.map((b, i) => (
                      <tr key={b.name} className={'rowin ' + (fresh === b.name ? 'fresh' : '')} style={{ animationDelay: Math.min(i, 10) * 40 + 'ms' }}>
                        <td><span className={'badge ' + b.type}>{b.type}</span></td>
                        <td>{b.db === 'all' ? 'All databases' : b.db}</td>
                        <td>{new Date(b.time).toLocaleString()}</td>
                        <td>{fmtSize(b.size)}</td>
                        <td className="mono">{b.name}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <button className="btn sm" disabled={busy} onClick={() => restore(b.name)}>Restore</button>{' '}
                          <button className="btn sec sm" onClick={() => (window.location = `/api/backups/${b.name}/download`)}>Download</button>{' '}
                          <button className="btn red sm" onClick={() => del(b.name)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="hint">Files live in the Podman volume <b>backup-data</b> (mounted at /backups in the backend container).</div>
              </div>
            )}

            {/* RECOVERY */}
            {tab === 'recover' && (
              <div className="page">
                <div className="crumb">Recovery</div>

                <div className="card">
                  <h3>Deleted from MongoDB but still safe in a backup ({rec.items.length})</h3>
                  {rec.items.length === 0
                    ? <div className="empty">Nothing to recover. Every backed-up document still exists in MongoDB.</div>
                    : <>
                        <button className="btn" disabled={busy} onClick={() => recover(rec.items)}>
                          {busy && <span className="spin" />}Recover all
                        </button>
                        <table style={{ marginTop: 12 }}>
                          <thead><tr><th>Database</th><th>Collection</th><th>_id</th><th>Found in backup</th><th></th></tr></thead>
                          <tbody>
                            {rec.items.map((i, n) => (
                              <tr key={i.db + i.col + i.id} className="rowin" style={{ animationDelay: Math.min(n, 10) * 40 + 'ms' }}>
                                <td>{i.db}</td><td>{i.col}</td>
                                <td className="mono">{i.id}</td>
                                <td className="mono">{i.backup}</td>
                                <td><button className="btn sm" disabled={busy} onClick={() => recover([i])}>Recover</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>}
                  <div className="hint">Recovery only adds missing documents. It never overwrites data that exists now.</div>
                </div>

                <div className="card">
                  <h3>Deletion log (deleted from this app)</h3>
                  <table>
                    <thead><tr><th>When</th><th>Document</th><th>Status</th></tr></thead>
                    <tbody>
                      {rec.log.length === 0 && <tr><td colSpan="3" className="empty">No deletions yet.</td></tr>}
                      {rec.log.map((l, n) => (
                        <tr key={n} className="rowin" style={{ animationDelay: Math.min(n, 10) * 40 + 'ms' }}>
                          <td>{new Date(l.time).toLocaleString()}</td>
                          <td className="mono">{l.db}.{l.col} · {l.id}</td>
                          <td>{l.status === 'saved'
                            ? <span className="badge auto">saved in {l.backup}</span>
                            : <span className="badge warn">LOST (was not backed up)</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {Toast}
    </div>
  );
}
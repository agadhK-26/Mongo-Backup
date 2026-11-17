const express = require('express');
const cors = require('cors');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { MongoClient, ObjectId } = require('mongodb');

const BACKUP_DIR = process.env.BACKUP_DIR || '/backups';      // = podman volume "backup-data"
const SETTINGS_FILE = path.join(BACKUP_DIR, 'settings.json');
const CONN_FILE = path.join(BACKUP_DIR, 'connection.json');
const DEL_FILE = path.join(BACKUP_DIR, 'deletions.json');
const HIDDEN = ['admin', 'local', 'config'];
const TMP_DB = 'zz_recover_tmp';
const DB_RE = /^[\w-]+$/;
const COL_RE = /^[\w.-]+$/;
const FILE_RE = /^backup-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)-(auto|manual)-(.+)\.gz$/;

const app = express();
app.use(cors());
app.use(express.json());

let client = null;
let uri = '';

const wrap = (fn) => (req, res) => fn(req, res).catch((e) => res.status(500).json({ error: e.message }));
const bad = (res, msg) => res.status(400).json({ error: msg });
const needConn = (req, res, next) => (client ? next() : res.status(503).json({ error: 'Not connected' }));

const mask = (u) => u.replace(/\/\/([^:@/]+):[^@]*@/, '//$1:****@');
const hostOf = (u) => { try { return new URL(u).host; } catch { return u; } };
const defaultDb = () => { try { return new URL(uri).pathname.slice(1); } catch { return ''; } };
const baseUri = () => { try { const u = new URL(uri); u.pathname = '/'; return u.toString(); } catch { return uri; } };

async function connect(newUri) {
  const c = new MongoClient(newUri, { serverSelectionTimeoutMS: 8000 });
  await c.connect();
  await c.db('admin').command({ ping: 1 });
  if (client) client.close().catch(() => {});
  client = c;
  uri = newUri;
  fs.writeFileSync(CONN_FILE, JSON.stringify({ uri }));
}

async function listDbs() {
  try {
    const r = await client.db('admin').command({ listDatabases: 1, authorizedDatabases: true });
    return r.databases.filter((d) => !HIDDEN.includes(d.name));
  } catch {
    const d = defaultDb();                       // user may not be allowed to list: use the db in the URI
    return d ? [{ name: d, sizeOnDisk: 0 }] : [];
  }
}

// ---------- Manifests (list of _ids inside each backup) ----------
async function buildManifest(db) {
  const names = db === 'all' ? (await listDbs()).map((d) => d.name) : [db];
  const data = {};
  for (const d of names) {
    data[d] = {};
    const cols = await client.db(d).listCollections({}, { nameOnly: true }).toArray();
    for (const c of cols) {
      if (c.name.startsWith('system.')) continue;
      const ids = await client.db(d).collection(c.name).find({}, { projection: { _id: 1 } }).limit(50000).toArray();
      data[d][c.name] = ids.map((x) => String(x._id));
    }
  }
  return { time: Date.now(), host: hostOf(uri), db, data };
}

const mcache = new Map();
function loadManifests() {                       // newest first, only for the connected server
  const host = hostOf(uri);
  const out = [];
  for (const f of fs.readdirSync(BACKUP_DIR)) {
    if (!/^backup-.*\.json$/.test(f)) continue;
    const gz = f.replace(/\.json$/, '.gz');
    if (!fs.existsSync(path.join(BACKUP_DIR, gz))) continue;
    let m = mcache.get(f);
    if (!m) {
      try {
        const j = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, f), 'utf8'));
        const sets = {};
        for (const [d, cs] of Object.entries(j.data)) {
          sets[d] = {};
          for (const [c, ids] of Object.entries(cs)) sets[d][c] = new Set(ids);
        }
        m = { name: gz, time: j.time, host: j.host, sets };
        mcache.set(f, m);
      } catch { continue; }
    }
    if (m.host === host) out.push(m);
  }
  return out.sort((a, b) => b.time - a.time);
}

const findBackup = (ms, d, c, id) => {
  for (const m of ms) if (m.sets[d]?.[c]?.has(id)) return m.name;
  return null;
};

// ---------- Backup / Restore (mongodump / mongorestore) ----------
async function runBackup(db = 'all', type = 'manual') {
  if (!uri) throw new Error('Not connected');
  if (db !== 'all' && !DB_RE.test(db)) throw new Error('Bad database name');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const name = `backup-${stamp}-${type}-${db}.gz`;
  const manifest = await buildManifest(db);      // taken just before the dump
  const args = ['--uri', baseUri(), `--archive=${path.join(BACKUP_DIR, name)}`, '--gzip'];
  if (db !== 'all') args.push('--db', db);
  await new Promise((resolve, reject) => {
    execFile('mongodump', args, (err, stdout, stderr) => {
      if (err) { console.error('Backup failed:', stderr || err.message); return reject(new Error(stderr || err.message)); }
      resolve();
    });
  });
  fs.writeFileSync(path.join(BACKUP_DIR, name.replace(/\.gz$/, '.json')), JSON.stringify(manifest));
  console.log(`Backup created: ${name}`);
  return name;
}

function runRestore(file) {
  return new Promise((resolve, reject) => {
    execFile('mongorestore',
      ['--uri', baseUri(), `--archive=${path.join(BACKUP_DIR, file)}`, '--gzip', '--drop'],
      (err, stdout, stderr) => (err ? reject(new Error(stderr || err.message)) : resolve()));
  });
}

const safeFile = (f) => {
  const b = path.basename(f || '');
  if (!FILE_RE.test(b) || !fs.existsSync(path.join(BACKUP_DIR, b))) throw new Error('Backup file not found');
  return b;
};

// ---------- Deletion log ----------
const readLog = () => { try { return JSON.parse(fs.readFileSync(DEL_FILE, 'utf8')); } catch { return []; } };
const addLog = (e) => fs.writeFileSync(DEL_FILE, JSON.stringify([...readLog(), e].slice(-500)));

// ---------- Scheduler (every N minutes/hours) ----------
let settings = { enabled: false, everyMinutes: 60, db: 'all', lastRun: null, nextRun: null };
let timer = null;
const loadSettings = () => { try { settings = { ...settings, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) }; } catch {} };
const saveSettings = () => fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));

function startScheduler() {
  if (timer) { clearInterval(timer); timer = null; }
  if (!settings.enabled) { settings.nextRun = null; saveSettings(); return; }
  const ms = settings.everyMinutes * 60 * 1000;
  settings.nextRun = Date.now() + ms;
  saveSettings();
  console.log(`Auto backup ON: every ${settings.everyMinutes} min, db=${settings.db}`);
  timer = setInterval(async () => {
    try { await runBackup(settings.db, 'auto'); } catch (e) { console.error(e.message); }
    settings.lastRun = Date.now();
    settings.nextRun = Date.now() + ms;
    saveSettings();
  }, ms);
}

// ---------- Connection ----------
app.get('/api/connection', wrap(async (req, res) => {
  let version = null;
  if (client) { try { version = (await client.db('admin').command({ buildInfo: 1 })).version; } catch {} }
  res.json({ connected: !!client, uri: uri ? mask(uri) : '', host: uri ? hostOf(uri) : '', version, container: os.hostname() });
}));

app.post('/api/connect', wrap(async (req, res) => {
  const u = (req.body.uri || '').trim();
  if (!/^mongodb(\+srv)?:\/\//.test(u)) return bad(res, 'Connection string must start with mongodb:// or mongodb+srv://');
  try { await connect(u); } catch (e) { return bad(res, 'Could not connect: ' + e.message); }
  res.json({ ok: true });
}));

app.post('/api/disconnect', wrap(async (req, res) => {
  if (client) await client.close().catch(() => {});
  client = null; uri = '';
  try { fs.unlinkSync(CONN_FILE); } catch {}
  res.json({ ok: true });
}));

// ---------- Browse databases ----------
app.get('/api/databases', needConn, wrap(async (req, res) => {
  const out = [];
  for (const d of await listDbs()) {
    let n = 0;
    try { n = (await client.db(d.name).listCollections({}, { nameOnly: true }).toArray()).length; } catch {}
    out.push({ name: d.name, sizeOnDisk: d.sizeOnDisk || 0, collections: n });
  }
  res.json(out);
}));

app.get('/api/databases/:db/collections', needConn, wrap(async (req, res) => {
  const { db } = req.params;
  if (!DB_RE.test(db)) return bad(res, 'Bad database name');
  const cols = await client.db(db).listCollections({}, { nameOnly: true }).toArray();
  const out = await Promise.all(cols.map(async (c) => ({
    name: c.name,
    count: await client.db(db).collection(c.name).estimatedDocumentCount(),
  })));
  res.json(out.sort((a, b) => a.name.localeCompare(b.name)));
}));

// documents + "is it in a backup?" flag for each
app.get('/api/databases/:db/collections/:col/docs', needConn, wrap(async (req, res) => {
  const { db, col } = req.params;
  if (!DB_RE.test(db) || !COL_RE.test(col)) return bad(res, 'Bad name');
  const docs = await client.db(db).collection(col).find({}).limit(50).toArray();
  const ms = loadManifests();
  const backed = {};
  for (const d of docs) backed[String(d._id)] = findBackup(ms, db, col, String(d._id));
  res.json({ docs, backed });
}));

// ---------- Add data ----------
app.post('/api/insert', needConn, wrap(async (req, res) => {
  const { db, collection, doc } = req.body;
  if (!DB_RE.test(db || '') || !COL_RE.test(collection || '')) return bad(res, 'Bad database or collection name');
  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) return bad(res, 'Document must be a JSON object');
  const r = await client.db(db).collection(collection).insertOne(doc);
  res.json({ ok: true, id: r.insertedId });
}));

// ---------- Guarded delete ----------
// mode=safe   : only deletes if the document is in a backup (otherwise 409)
// mode=backup : backs up that database first, then deletes
// mode=force  : deletes even if it is not backed up (data is lost)
app.delete('/api/databases/:db/collections/:col/docs/:id', needConn, wrap(async (req, res) => {
  const { db, col, id } = req.params;
  const mode = req.query.mode || 'safe';
  if (!DB_RE.test(db) || !COL_RE.test(col)) return bad(res, 'Bad name');

  const coll = client.db(db).collection(col);
  const cands = [id];
  if (/^[a-f0-9]{24}$/i.test(id)) cands.push(new ObjectId(id));
  if (id !== '' && !isNaN(id)) cands.push(Number(id));
  const doc = await coll.findOne({ _id: { $in: cands } });
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  const sid = String(doc._id);
  let backup = findBackup(loadManifests(), db, col, sid);

  if (!backup && mode === 'safe') return res.status(409).json({ error: 'This document is not in any backup' });

  if (!backup && mode === 'backup') {
    await runBackup(db, 'manual');
    backup = findBackup(loadManifests(), db, col, sid);
    if (!backup) return res.status(500).json({ error: 'Backup finished but the document was not found in it. Nothing deleted.' });
  }

  await coll.deleteOne({ _id: doc._id });
  addLog({ time: Date.now(), db, col, id: sid, backup, status: backup ? 'saved' : 'lost', doc: backup ? doc : undefined });
  res.json({ ok: true, backup });
}));

// ---------- Recovery ----------
// everything that exists in some backup but is missing from the live database now
app.get('/api/recovery', needConn, wrap(async (req, res) => {
  const per = new Map();                          // "db\0col" -> Map(id -> newest backup containing it)
  for (const m of loadManifests()) {
    for (const [d, cs] of Object.entries(m.sets)) {
      for (const [c, set] of Object.entries(cs)) {
        const k = d + '\0' + c;
        if (!per.has(k)) per.set(k, new Map());
        const mp = per.get(k);
        for (const id of set) if (!mp.has(id)) mp.set(id, m.name);
      }
    }
  }
  const items = [];
  for (const [k, mp] of per) {
    const [d, c] = k.split('\0');
    let live = new Set();
    try {
      live = new Set((await client.db(d).collection(c).find({}, { projection: { _id: 1 } }).toArray()).map((x) => String(x._id)));
    } catch {}
    for (const [id, backup] of mp) if (!live.has(id)) items.push({ db: d, col: c, id, backup });
    if (items.length >= 500) break;
  }
  res.json(items.slice(0, 500));
}));

// put missing documents back (never overwrites existing documents)
app.post('/api/recover', needConn, wrap(async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const groups = new Map();
  for (const it of items) {
    if (!DB_RE.test(it.db || '') || !COL_RE.test(it.col || '')) return bad(res, 'Bad name');
    const f = safeFile(it.backup);
    const k = [f, it.db, it.col].join('\0');
    if (!groups.has(k)) groups.set(k, { f, db: it.db, col: it.col, ids: new Set() });
    groups.get(k).ids.add(String(it.id));
  }
  let recovered = 0;
  for (const g of groups.values()) {
    await client.db(TMP_DB).dropDatabase().catch(() => {});
    // restore only this collection from the backup into a temporary database
    await new Promise((resolve, reject) => {
      execFile('mongorestore', [
        '--uri', baseUri(), `--archive=${path.join(BACKUP_DIR, g.f)}`, '--gzip',
        `--nsInclude=${g.db}.${g.col}`, `--nsFrom=${g.db}.${g.col}`, `--nsTo=${TMP_DB}.${g.col}`,
      ], (err, stdout, stderr) => (err ? reject(new Error(stderr || err.message)) : resolve()));
    });
    const tmpDocs = await client.db(TMP_DB).collection(g.col).find({}).toArray();
    const live = client.db(g.db).collection(g.col);
    for (const d of tmpDocs) {
      if (!g.ids.has(String(d._id))) continue;
      try { await live.insertOne(d); recovered++; } catch {}   // skip if it already exists
    }
    await client.db(TMP_DB).dropDatabase().catch(() => {});
  }
  res.json({ recovered });
}));

app.get('/api/deletions', (req, res) => res.json(readLog().reverse()));

// ---------- Settings / schedule ----------
app.get('/api/settings', (req, res) => res.json(settings));

app.post('/api/settings', (req, res) => {
  const { enabled, everyMinutes, db = 'all' } = req.body;
  const m = Number(everyMinutes);
  if (!(m >= 1 && m <= 10080)) return bad(res, 'Interval must be between 1 minute and 7 days');
  if (db !== 'all' && !DB_RE.test(db)) return bad(res, 'Bad database name');
  if (enabled && !client) return bad(res, 'Connect to a MongoDB first');
  settings = { ...settings, enabled: !!enabled, everyMinutes: m, db };
  startScheduler();
  res.json(settings);
});

// ---------- Backups ----------
app.post('/api/backup', wrap(async (req, res) => {
  const file = await runBackup(req.body.db || 'all', 'manual');
  settings.lastRun = Date.now();
  saveSettings();
  res.json({ file });
}));

app.get('/api/backups', wrap(async (req, res) => {
  const files = fs.readdirSync(BACKUP_DIR).map((f) => {
    const m = f.match(FILE_RE);
    if (!m) return null;
    const st = fs.statSync(path.join(BACKUP_DIR, f));
    return { name: f, type: m[2], db: m[3], size: st.size, time: st.mtimeMs };
  }).filter(Boolean).sort((a, b) => b.time - a.time);
  res.json(files);
}));

app.post('/api/restore/:file', wrap(async (req, res) => {
  await runRestore(safeFile(req.params.file));
  res.json({ ok: true });
}));

app.get('/api/backups/:file/download', (req, res) => {
  try { res.download(path.join(BACKUP_DIR, safeFile(req.params.file))); }
  catch (e) { res.status(404).json({ error: e.message }); }
});

app.delete('/api/backups/:file', wrap(async (req, res) => {
  const f = safeFile(req.params.file);
  fs.unlinkSync(path.join(BACKUP_DIR, f));
  const mf = f.replace(/\.gz$/, '.json');
  try { fs.unlinkSync(path.join(BACKUP_DIR, mf)); } catch {}
  mcache.delete(mf);
  res.json({ ok: true });
}));

// ---------- Start ----------
(async () => {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  let saved = process.env.MONGO_URL || '';
  try { saved = JSON.parse(fs.readFileSync(CONN_FILE, 'utf8')).uri || saved; } catch {}
  if (saved) {
    try { await connect(saved); console.log('Connected to', hostOf(saved)); }
    catch (e) { console.log('Saved connection failed:', e.message); }
  }
  loadSettings();
  if (settings.enabled && client) startScheduler();
  app.listen(5000, () => console.log('API on :5000, container:', os.hostname()));
})();
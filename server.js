'use strict';
/*
 * Great Emvic School – ID cards and gate attendance server.
 * One dependency (the official MongoDB driver). Node 18 or newer.
 *
 *   MONGODB_URI="..." node server.js
 *
 * Every rule that matters is enforced here, not in the browser:
 *   - passwords hashed with scrypt, sessions kept in memory (HttpOnly cookies)
 *   - roles: super > admin > operator; only admins create accounts
 *   - every API call checks the caller's permission
 *   - the server stamps every entry/exit time (Africa/Lagos display)
 *   - scans run one at a time (single-threaded, in-memory), so a student can never get two entries for a day
 *   - every scan and admin action is written to the audit log
 *   - data lives in MongoDB Atlas, not on this container's disk, so the app can sleep and
 *     restart on a free host without losing anything
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const createStore = require('./store');

const PORT = +process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const PUB = path.join(__dirname, 'public');
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
const SESSION_HOURS = +process.env.SESSION_HOURS || 12;

/* ---------- shared business rules (same file the browser uses) ---------- */
const coreSrc = fs.readFileSync(path.join(__dirname, 'core.js'), 'utf8');
const C = new Function(coreSrc + `
;return { get S() { return S; }, set S(v) { S = v; smap = null; }, set cur(v) { cur = v; }, dirty, stu, can, need, canManage, audit, recordScan, issueQR, lateFromText, todayStats, todayKey, dateKey, levelOf, fullName, uid, defState, FONTS };`)();

/* ---------- storage (MongoDB Atlas) ---------- */
let store, sessions = {};
async function loadDB() { C.S = await store.load(); }
let lastBackupDay = null;
/* write this request's changes to the database in ONE transaction; on any failure reload from Atlas so memory never drifts from what was actually saved */
async function persist(hint) {
  try { await store.sync(C.S, hint); }
  catch (e) {
    console.error('Database write failed, reloading from Atlas:', e.message); C.S = await store.load();
    throw Object.assign(new Error(e.code === 11000 || /duplicate key|E11000/i.test(e.message) ? 'That change would break a database rule (a duplicate ID or QR). It was not saved.' : 'The change could not be saved.'), { status: 409 });
  }
  const day = C.todayKey();
  if (day !== lastBackupDay) { lastBackupDay = day; store.saveBackupSnapshot(day, { state: C.S, photos: store.photos.all() }).catch(e => console.error('Daily backup failed:', e.message)); }
}
const PHOTO_RE = /^data:image\/(jpeg|png);base64,[A-Za-z0-9+\/=]+$/;
function putPhoto(id, data) { if (typeof data !== 'string' || data.length > 600000 || !PHOTO_RE.test(data)) bad('That image is not valid or is too large.'); store.photos.put(id, data); }
const getPhoto = id => store.photos.get(id);
const delPhoto = id => store.photos.del(id);
const allPhotos = () => store.photos.all();

/* ---------- helpers ---------- */
const bad = (m, status = 400) => { throw Object.assign(new Error(m), { status }); };
const str = (v, max = 120, req = false, label = 'This field') => { v = v == null ? '' : String(v).trim(); if (req && !v) bad(label + ' is required.'); if (v.length > max) bad(label + ' is too long.'); return v; };
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 64).toString('hex');
function newUser(name, username, pw, role) { const salt = crypto.randomBytes(16).toString('hex'); return { id: C.uid(), name, username, role, salt, hash: hashPw(pw, salt), active: true, created: new Date().toISOString(), lastLogin: null }; }
function checkPw(u, pw) { const a = Buffer.from(hashPw(String(pw), u.salt), 'hex'), b = Buffer.from(u.hash, 'hex'); return a.length === b.length && crypto.timingSafeEqual(a, b); }
const pub = u => ({ id: u.id, name: u.name, username: u.username, role: u.role, active: u.active, lastLogin: u.lastLogin, created: u.created });
const sha = t => crypto.createHash('sha256').update(t).digest('hex');
function checkNewAccount(d) {
  const name = str(d.name, 80, true, 'Name'), username = str(d.username, 30, true, 'Username'), pw = String(d.password || '');
  if (!/^[A-Za-z0-9_.-]{3,30}$/.test(username)) bad('Usernames are 3–30 letters, numbers, dot, dash or underscore.');
  if (pw.length < 8 || pw.length > 200) bad('Use a password of at least 8 characters.');
  if (C.S.users.some(u => u.username.toLowerCase() === username.toLowerCase())) bad('That username is taken.');
  return { name, username, pw };
}
const cookieOf = req => { const m = /(?:^|;\s*)gid=([a-f0-9]{64})/.exec(req.headers.cookie || ''); return m ? m[1] : null; };
function auth(req) {
  const t = cookieOf(req); if (!t) return null; const s = sessions[sha(t)]; if (!s || s.exp < Date.now()) return null;
  const u = C.S.users.find(x => x.id === s.uid); if (!u || !u.active) return null; s.exp = Date.now() + SESSION_HOURS * 3600e3; return u;
}
const isSecure = req => !!(req.socket.encrypted || (TRUST_PROXY && req.headers['x-forwarded-proto'] === 'https'));
function startSession(req, res, u) {
  const t = crypto.randomBytes(32).toString('hex'); const exp = Date.now() + SESSION_HOURS * 3600e3; sessions[sha(t)] = { uid: u.id, exp };
  res.setHeader('Set-Cookie', `gid=${t}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_HOURS * 3600}${isSecure(req) ? '; Secure' : ''}`);
}
const ipOf = req => (TRUST_PROXY && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress || 'x';
const tries = new Map();
function throttle(key, max, windowMs) {
  const now = Date.now(); const t = (tries.get(key) || []).filter(x => now - x < windowMs);
  if (t.length >= max) { tries.set(key, t); bad('Too many attempts. Wait a minute and try again.', 429); } t.push(now); tries.set(key, t);
}
const clearTries = key => tries.delete(key);
function killSessions(uid) { Object.keys(sessions).forEach(k => { if (sessions[k].uid === uid) delete sessions[k]; }); }

/* ---------- operations (each one is permission-checked) ---------- */
const OPS = {};
const ST = ['Active', 'Inactive', 'Graduated', 'Transferred', 'Suspended'];
const IDST = ['Active', 'Suspended', 'Lost', 'Replaced', 'Expired', 'Deactivated'];
const HEX = /^#[0-9a-fA-F]{6}$/;
const reqStudent = id => { const s = C.stu(String(id)); if (!s) bad('Student not found.', 404); return s; };
const TSTAT = ['Active', 'On leave', 'Inactive', 'Resigned'];
function autoId(prefix) {
  let max = 0; const re = new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d+)$', 'i');
  C.S.students.forEach(s => { const m = re.exec(s.sid || ''); if (m) max = Math.max(max, parseInt(m[1], 10)); });
  let n = max + 1, sid; do { sid = prefix + String(n).padStart(4, '0'); n++; } while (C.S.students.some(s => s.sid.toUpperCase() === sid.toUpperCase()));
  return sid;
}
function applyPerson(s, a, cl, T, sid) {
  const base = { sid, first: str(a.first, 60, true, 'First name'), middle: str(a.middle, 60), last: str(a.last, 60, true, 'Surname'), pref: str(a.pref, 60), sex: ['Male', 'Female'].includes(a.sex) ? a.sex : '', dob: /^\d{4}-\d{2}-\d{2}$/.test(a.dob || '') ? a.dob : '', updated: new Date().toISOString() };
  if (T) Object.assign(s, base, { kind: 'teacher', cls: 'Teacher', level: '', section: 'Teaching staff', session: '', dept: str(a.dept, 80), phone: str(a.phone || a.guardianPhone, 30), status: TSTAT.includes(a.status) ? a.status : 'Active' });
  else Object.assign(s, base, { kind: 'student', cls: cl.name, level: cl.level, section: cl.section, session: str(a.session, 20) || C.S.settings.session, phone: str(a.phone, 30), admissionYear: str(a.admissionYear, 4), status: ST.includes(a.status) ? a.status : 'Active', guardian: str(a.guardian, 120), guardianPhone: str(a.guardianPhone, 30) });
}
OPS['student.save'] = { perm: 'students.update', fn: a => {
  const S = C.S; let s = a.id ? reqStudent(a.id) : null; const isNew = !s; if (isNew) C.need('students.create');
  const T = s ? s.kind === 'teacher' : a.kind === 'teacher';
  let sid = str(a.sid, 40); if (!sid) sid = autoId(T ? 'GE/T/' : 'GE/' + (str(a.session, 20) || S.settings.session).slice(0, 4) + '/');
  if (S.students.some(x => (!s || x.id !== s.id) && x.sid.toUpperCase() === sid.toUpperCase())) bad('That ID is already in use.');
  let cl = null; if (!T) { cl = S.classes.find(c => c.name === a.cls); if (!cl) bad('Choose a valid class.'); }
  const fresh = isNew ? { id: C.uid(), created: new Date().toISOString(), qr: null, qrHistory: [] } : null;
  applyPerson(fresh || s, a, cl, T, sid); if (isNew) { s = fresh; S.students.push(s); }
  if (a.photo === 'remove') delPhoto(s.id); else if (a.photo) putPhoto(s.id, a.photo);
  C.dirty(); C.audit(isNew ? (T ? 'Teacher created' : 'Student created') : (T ? 'Teacher edited' : 'Student edited'), s.sid, C.fullName(s)); return { id: s.id };
} };
OPS['student.delete'] = { perm: 'students.delete', fn: a => {
  const s = reqStudent(a.id); if (C.S.attendance.some(r => r.studentId === s.id)) bad('This person has gate records. Set them to Inactive (or Transferred / Resigned) instead of deleting.');
  C.S.students = C.S.students.filter(x => x.id !== s.id); delPhoto(s.id); C.dirty(); C.audit('Student deleted', s.sid, C.fullName(s));
} };
OPS['students.import'] = { perm: 'students.create', fn: a => {
  const S = C.S; const T = a.kind === 'teacher'; const rows = Array.isArray(a.rows) ? a.rows.slice(0, 5000) : bad('No rows to import.'); const rejected = []; let n = 0;
  rows.forEach((r, i) => {
    try {
      const cl = T ? null : S.classes.find(c => c.name === r.cls); if (!T && !cl) throw new Error('Class is not set up');
      let sid = str(r.sid, 40); if (!sid) sid = autoId(T ? 'GE/T/' : 'GE/' + (str(r.session, 20) || S.settings.session).slice(0, 4) + '/');
      if (S.students.some(x => x.sid.toUpperCase() === sid.toUpperCase())) throw new Error('ID already exists');
      const s = { id: C.uid(), created: new Date().toISOString(), qr: null, qrHistory: [] }; applyPerson(s, r, cl, T, sid); S.students.push(s); n++;
    } catch (e) { rejected.push({ row: r._row || i + 2, reason: e.message }); }
  });
  C.dirty(); const me = C.S.users.find(u => u.id === CURRENT.id); S.imports.push({ ts: new Date().toISOString(), file: str(a.file, 120), kind: T ? 'teacher' : 'student', total: rows.length, imported: n, rejected: rejected.length, by: me.name });
  C.audit(T ? 'Teachers imported' : 'Students imported', str(a.file, 120), `${n} imported, ${rejected.length} rejected`); return { imported: n, rejected };
} };
OPS['photo.set'] = { perm: 'students.update', fn: a => { const items = Array.isArray(a.items) ? a.items.slice(0, 40) : []; items.forEach(it => { const s = reqStudent(it.id); putPhoto(s.id, it.data); C.audit('Photograph uploaded', s.sid, ''); }); return { count: items.length }; } };
OPS['id.generate'] = { perm: 'id_cards.generate', fn: a => {
  const ids = Array.isArray(a.ids) ? a.ids.slice(0, 5000) : []; let n = 0;
  ids.forEach(id => { const s = C.stu(String(id)); if (s && !s.qr) { C.issueQR(s, 'Initial ID'); n++; } });
  if (n) C.audit('ID generated', '', `${n} new QR codes`); return { created: n };
} };
OPS['id.replace'] = { perm: 'qr.regenerate', fn: a => {
  const s = reqStudent(a.id); if (!s.qr) bad('This student has no ID card yet.'); const old = ['Lost', 'Replaced', 'Deactivated'].includes(a.old) ? a.old : 'Replaced'; const reason = str(a.reason, 80, true, 'Reason'); const o = s.qr.value;
  C.issueQR(s, reason, old); C.audit('ID replaced', s.sid, `${reason}; old QR ${o.slice(0, 9)}… marked ${old}; new QR version ${s.qr.version}`);
} };
OPS['id.regen'] = { perm: 'qr.regenerate', fn: a => { const s = reqStudent(a.id); if (!s.qr) bad('This student has no ID card yet.'); C.issueQR(s, 'Regenerated by administrator', 'Replaced'); C.audit('QR regenerated', s.sid, 'QR version ' + s.qr.version); } };
OPS['id.status'] = { perm: 'id_cards.deactivate', fn: a => { const s = reqStudent(a.id); if (!s.qr) bad('This student has no ID card yet.'); if (!IDST.includes(a.status)) bad('Unknown status.'); const o = s.qr.status; s.qr.status = a.status; C.audit('ID status changed', s.sid, `${o} → ${a.status}`); } };
function cleanTpl(t) {
  const o = { id: str(t.id, 40), name: str(t.name, 60, true, 'Template name') };
  ['headerBg', 'headerText', 'mottoColor', 'bodyBg', 'accent', 'nameColor', 'textColor', 'subColor'].forEach(k => { if (!HEX.test(t[k] || '')) bad('Invalid colour for ' + k + '.'); o[k] = t[k]; });
  if (t.school != null) o.school = str(t.school, 80); if (t.motto != null) o.motto = str(t.motto, 120);
  o.font = Object.keys(C.FONTS).includes(t.font) ? t.font : 'Inter'; o.scale = Math.min(1.3, Math.max(0.7, +t.scale || 1));
  o.photoPos = t.photoPos === 'right' ? 'right' : 'left'; o.qrPos = t.qrPos === 'left' ? 'left' : 'right'; o.border = !!t.border; o.showBack = !!t.showBack; return o;
}
OPS['tpl.save'] = { perm: 'id_cards.update', fn: a => {
  const t = cleanTpl(a.tpl || {}); const S = C.S; const i = S.templates.findIndex(x => x.id === t.id);
  if (i >= 0) S.templates[i] = t; else { t.id = 't' + C.uid(); S.templates.push(t); } if (a.makeDefault) S.settings.defaultTemplate = t.id;
  C.audit(i >= 0 ? 'ID template saved' : 'ID template created', t.name, a.makeDefault ? 'set as default' : ''); return { id: t.id };
} };
OPS['settings.save'] = { perm: 'settings.update', fn: a => {
  const s = C.S.settings; const TM = /^([01]\d|2[0-3]):[0-5]\d$/; if (!TM.test(a.opening || '') || !TM.test(a.teacherOpening || a.opening)) bad('Opening time is not valid.');
  if (!C.S.templates.some(t => t.id === a.defaultTemplate)) bad('Choose a valid default template.');
  Object.assign(s, { school: str(a.school, 80, true, 'School name'), motto: str(a.motto, 120), opening: a.opening, teacherOpening: a.teacherOpening || a.opening, grace: Math.min(120, Math.max(0, Math.round(+a.grace || 0))), minExit: Math.min(60, Math.max(0, Math.round(+a.minExit || 0))), gate: str(a.gate, 60) || 'Main School Gate', session: str(a.session, 20, true, 'Session'), defaultTemplate: a.defaultTemplate, expiry: str(a.expiry, 80), contact: str(a.contact, 120) });
  C.audit('Settings changed', '', `Opening ${s.opening}, grace ${s.grace} min, repeat window ${s.minExit} min, session ${s.session}`);
} };
OPS['class.add'] = { perm: 'settings.update', fn: a => {
  const raw = str(a.name, 10); const m = /^(JSS[1-3]|SS[1-3]|Primary[1-9])([A-Z]?)$/i.exec(raw); if (!m) bad('Use a name like SS2, JSS1A or Primary4.');
  const lvl = m[1].toUpperCase(); const pfx = /^PRIMARY/.test(lvl) ? 'Primary' + lvl.slice(7) : lvl; const name = pfx + m[2].toUpperCase();
  if (C.S.classes.some(c => c.name === name)) bad('That class already exists.');
  const section = pfx.startsWith('Primary') ? 'Primary School' : pfx.startsWith('JSS') ? 'Junior Secondary School' : 'Senior Secondary School';
  C.S.classes.push({ name, level: pfx, section }); C.audit('Class added', name, '');
} };
OPS['logo.set'] = { perm: 'settings.update', fn: a => { if (a.data === null) C.S.settings.logo = null; else { if (typeof a.data !== 'string' || a.data.length > 400000 || !PHOTO_RE.test(a.data)) bad('That logo is not valid or is too large.'); C.S.settings.logo = a.data; } C.audit(a.data === null ? 'Logo removed' : 'Logo changed', '', ''); } };
const reqRec = id => { const r = C.S.attendance.find(x => x.id === String(id)); if (!r) bad('Record not found.', 404); return r; };
OPS['att.correct'] = { perm: 'gate.correct', fn: a => {
  const r = reqRec(a.id); const reason = str(a.reason, 200, true, 'A reason'); const T = /^\d{2}:\d{2}(:\d{2})?$/;
  if (!T.test(a.entry || '') || (a.exit && !T.test(a.exit))) bad('Times are not valid.');
  const before = { entry: r.entry, exit: r.exit }; const ne = require_lagosISO(r.date, a.entry), nx = a.exit ? require_lagosISO(r.date, a.exit) : null;
  if (nx && Date.parse(nx) <= Date.parse(ne)) bad('The exit time must be after the entry time.');
  const li = lateInfoOf(ne, (C.stu(r.studentId) || {}).kind); r.entry = ne; r.exit = nx; r.dur = nx ? (Date.parse(nx) - Date.parse(ne)) / 1000 : null; r.late = li.late; r.lateMin = li.lateMin; r.corrected = true;
  const me = C.S.users.find(u => u.id === CURRENT.id); if (nx && !r.exitOp) r.exitOp = me.name + ' (correction)'; if (!nx) r.exitOp = null;
  r.log = r.log || []; r.log.push({ ts: new Date().toISOString(), by: me.name, reason, before, after: { entry: ne, exit: nx } });
  const s = C.stu(r.studentId); C.audit('Attendance corrected', s ? s.sid : '', `${r.date} · entry ${before.entry} → ${ne}; exit ${before.exit || 'none'} → ${nx || 'none'} · ${reason}`);
} };
OPS['att.archive'] = { perm: 'gate.correct', fn: a => { const ids = new Set((Array.isArray(a.ids) ? a.ids : []).slice(0, 20000).map(String)); let n = 0; C.S.attendance.forEach(r => { if (ids.has(r.id)) { r.archived = !!a.archived; n++; } }); C.audit(a.archived ? 'Attendance archived' : 'Attendance restored', '', n + ' records'); } };
OPS['att.delete'] = { perm: 'gate.correct', fn: a => { const ids = new Set((Array.isArray(a.ids) ? a.ids : []).slice(0, 20000).map(String)); const before = C.S.attendance.length; C.S.attendance = C.S.attendance.filter(r => !ids.has(r.id)); C.audit('Attendance deleted permanently', '', (before - C.S.attendance.length) + ' records'); } };
OPS['audit.note'] = { perm: 'id_cards.read', fn: a => { C.audit(str(a.action, 60, true, 'Action'), str(a.target, 120), str(a.detail, 200)); } };
OPS['batch.log'] = { perm: 'id_cards.generate', fn: a => { const me = C.S.users.find(u => u.id === CURRENT.id); C.S.batches.push({ ts: new Date().toISOString(), label: str(a.label, 80), count: Math.max(0, +a.count | 0), template: str(a.template, 60), by: me.name, status: 'Completed' }); C.audit('ID cards generated', str(a.label, 80), `${+a.count | 0} cards, template ${str(a.template, 60)}`); } };
OPS['me.password'] = { perm: null, fn: a => {
  const u = C.S.users.find(x => x.id === CURRENT.id); if (!checkPw(u, a.old || '')) bad('Your current password is not correct.', 403);
  const pw = String(a.password || ''); if (pw.length < 8 || pw.length > 200) bad('Use a password of at least 8 characters.'); u.salt = crypto.randomBytes(16).toString('hex'); u.hash = hashPw(pw, u.salt); C.audit('Password changed', u.username, '');
} };
/* accounts: only admins create accounts. super creates admins and operators; admins create operators. */
OPS['user.create'] = { perm: 'operators.create', fn: a => {
  const role = a.role === 'admin' ? 'admin' : 'operator'; if (role === 'admin') C.need('admins.manage');
  const d = checkNewAccount(a); const u = newUser(d.name, d.username, d.pw, role); C.S.users.push(u); C.audit(role === 'admin' ? 'Administrator created' : 'Operator created', u.username, u.name); return { id: u.id };
} };
const reqManage = id => { const u = C.S.users.find(x => x.id === String(id)); if (!u) bad('Account not found.', 404); if (!C.canManage(u)) bad('You cannot manage this account.', 403); return u; };
OPS['user.reset'] = { perm: 'operators.update', fn: a => {
  const u = reqManage(a.id); const pw = String(a.password || ''); if (pw.length < 8 || pw.length > 200) bad('Use a password of at least 8 characters.');
  u.salt = crypto.randomBytes(16).toString('hex'); u.hash = hashPw(pw, u.salt); killSessions(u.id); C.audit('Password reset', u.username, u.role);
} };
OPS['user.toggle'] = { perm: 'operators.disable', fn: a => { const u = reqManage(a.id); u.active = !u.active; if (!u.active) killSessions(u.id); C.audit(u.active ? 'Account enabled' : 'Account disabled', u.username, u.role); } };
const DEMO = [['Daniel', 'Onyeka', 'SS2', 'Male', '#174A8B'], ['Sarah', 'Ade', 'JSS3', 'Female', '#7A3E65'], ['Michael', 'John', 'SS1', 'Male', '#2F6B4F'], ['David', 'Peter', 'JSS2', 'Male', '#8A5A16'], ['Grace', 'Okafor', 'SS3', 'Female', '#5B3F8C'], ['Emmanuel', 'Bello', 'JSS1', 'Male', '#1F6F7A']];
const DEMO_T = [['Ada', 'Obi', 'Mathematics', 'Female', '#7A3E65'], ['Tunde', 'Bello', 'English Language', 'Male', '#2F6B4F'], ['Ngozi', 'Eze', 'Biology', 'Female', '#5B3F8C']];
OPS['demo.load'] = { perm: 'students.create', fn: () => {
  const S = C.S; const out = []; const now = new Date().toISOString();
  DEMO.forEach((d, i) => { const sid = 'GE/2026/' + String(i + 1).padStart(4, '0'); if (S.students.some(s => s.sid === sid)) return; const cl = S.classes.find(c => c.name === d[2]);
    const s = { id: C.uid(), kind: 'student', sid, first: d[0], middle: '', last: d[1], sex: d[3], dob: '', cls: cl.name, level: cl.level, section: cl.section, session: S.settings.session, admissionYear: '2026', status: 'Active', guardian: '', guardianPhone: '', created: now, qr: null, qrHistory: [], demo: true };
    S.students.push(s); C.issueQR(s, 'Demo'); out.push({ id: s.id, color: d[4] }); });
  DEMO_T.forEach((d, i) => { const sid = 'GE/T/' + String(i + 1).padStart(4, '0'); if (S.students.some(s => s.sid === sid)) return;
    const s = { id: C.uid(), kind: 'teacher', sid, first: d[0], middle: '', last: d[1], sex: d[3], dob: '', cls: 'Teacher', level: '', section: 'Teaching staff', session: '', dept: d[2], phone: '', status: 'Active', created: now, qr: null, qrHistory: [], demo: true };
    S.students.push(s); C.issueQR(s, 'Demo'); out.push({ id: s.id, color: d[4] }); });
  C.dirty(); C.audit('Demo people loaded', '', out.length + ' students and teachers'); return { added: out };
} };
OPS['demo.remove'] = { perm: 'students.delete', fn: () => {
  const S = C.S; const ids = new Set(S.students.filter(s => s.demo).map(s => s.id)); S.students = S.students.filter(s => !ids.has(s.id)); S.attendance = S.attendance.filter(r => !ids.has(r.studentId)); S.scans = S.scans.filter(x => !ids.has(x.studentId)); ids.forEach(delPhoto); C.dirty(); C.audit('Demo data removed', '', ids.size + ' students'); return { removed: ids.size };
} };
OPS['system.reset'] = { perm: 'system.reset', fn: () => {
  const S = C.S; store.photos.clear(); S.students = []; S.attendance = []; S.scans = []; S.imports = []; S.batches = []; S.templates = C.defState().templates; S.classes = C.defState().classes; S.settings = Object.assign(C.defState().settings, { session: S.settings.session }); C.dirty(); C.audit('System reset', '', 'Students, photographs and gate records erased. Accounts and audit log kept.');
} };
/* the operations above read the caller through CURRENT */
let CURRENT = null;
function require_lagosISO(key, t) { return new Date(`${key}T${t.length === 5 ? t + ':00' : t}+01:00`).toISOString(); }
function lateInfoOf(iso, kind) {
  const s = C.S.settings; const [oh, om] = (kind === 'teacher' ? (s.teacherOpening || s.opening) : s.opening).split(':').map(Number); const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(iso)); const g = t => +p.find(x => x.type === t).value;
  const sec = g('hour') * 3600 + g('minute') * 60 + g('second'); const openSec = oh * 3600 + om * 60; return { late: sec >= openSec + s.grace * 60 + 60, lateMin: Math.max(0, Math.floor((sec - openSec) / 60)) };
}

/* ---------- HTTP ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
const CSP = "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";
function baseHeaders(res) {
  res.setHeader('Content-Security-Policy', CSP); res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Frame-Options', 'DENY'); res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()'); res.setHeader('Cache-Control', 'no-store');
}
const send = (res, status, obj) => { const b = JSON.stringify(obj); res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(b) }); res.end(b); };
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let n = 0; const chunks = [];
    req.on('data', c => { n += c.length; if (n > limit) { reject(Object.assign(new Error('That request is too large.'), { status: 413 })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch (e) { reject(Object.assign(new Error('Bad request.'), { status: 400 })); } });
    req.on('error', reject);
  });
}
function gateFeed() {
  const key = C.todayKey();
  return C.S.scans.filter(x => C.dateKey(x.ts) === key).slice(-10).reverse().map(x => { const t = C.stu(x.studentId); return { ts: x.ts, name: t ? C.fullName(t) : '', cls: t ? t.cls : '', code: x.code, result: x.result, note: x.note }; });
}
const gatePublic = () => ({ school: C.S.settings.school, motto: C.S.settings.motto, gate: C.S.settings.gate, opening: C.S.settings.opening, grace: C.S.settings.grace, minExit: C.S.settings.minExit, logo: C.S.settings.logo });
const files = {};
function staticFile(res, name) {
  const p = path.join(PUB, name); if (!fs.existsSync(p)) return false;
  const body = fs.readFileSync(p); res.writeHead(200, { 'Content-Type': MIME[path.extname(name)] || 'application/octet-stream', 'Content-Length': body.length }); res.end(body); return true;
}

async function handle(req, res) {
  baseHeaders(res);
  const url = new URL(req.url, 'http://x'); const p = url.pathname; const method = req.method;
  if (method === 'GET' && !p.startsWith('/api/')) {
    if (p === '/healthz') return send(res, 200, { ok: true });
    const name = p === '/' ? 'index.html' : p.slice(1);
    if (/^(index\.html|app\.js|app\.css)$/.test(name) && staticFile(res, name)) return;
    res.writeHead(404); return res.end('Not found');
  }
  if (method === 'POST') {
    if (req.headers['x-gemvic'] !== '1') bad('Forbidden.', 403);
    const o = req.headers.origin; if (o) { let h; try { h = new URL(o).host; } catch (e) { bad('Forbidden.', 403); } if (h !== req.headers.host) bad('Forbidden.', 403); }
  }
  const user = auth(req); CURRENT = user; C.cur = user;
  if (method === 'GET' && p === '/api/status') return send(res, 200, { needsSetup: C.S.users.length === 0, setupKey: !!process.env.SETUP_KEY, me: user ? pub(user) : null, settings: { school: C.S.settings.school, motto: C.S.settings.motto, logo: C.S.settings.logo } });
  if (method === 'POST' && p === '/api/setup') {
    if (C.S.users.length) bad('Setup is already complete.', 409); const b = await readBody(req, 1e5);
    if (process.env.SETUP_KEY) { const a = Buffer.from(String(b.key || '')), k = Buffer.from(process.env.SETUP_KEY); if (a.length !== k.length || !crypto.timingSafeEqual(a, k)) bad('The setup key is not correct.', 403); }
    const d = checkNewAccount(b); const u = newUser(d.name, d.username, d.pw, 'super'); u.lastLogin = new Date().toISOString(); C.S.users.push(u); C.cur = u; CURRENT = u; C.audit('Super account created', u.username, ''); startSession(req, res, u); await persist(); return send(res, 200, { user: pub(u) });
  }
  if (method === 'POST' && p === '/api/login') {
    const b = await readBody(req, 1e4); const username = String(b.username || '').trim().toLowerCase(); const ip = ipOf(req);
    throttle('ip|' + ip, 30, 60000); throttle('u|' + username, 6, 60000);
    const u = C.S.users.find(x => x.username.toLowerCase() === username);
    if (!u || !checkPw(u, b.password || '')) { if (u) { C.cur = u; C.audit('Failed login', u.username, ip); await persist(); } bad('Username or password is incorrect.', 401); }
    if (!u.active) bad('This account is disabled. Contact the administrator.', 403);
    clearTries('u|' + username); u.lastLogin = new Date().toISOString(); C.cur = u; C.audit('Login', u.username, ''); startSession(req, res, u); await persist(); return send(res, 200, { user: pub(u) });
  }
  if (!user) bad('Please sign in.', 401);
  if (method === 'POST' && p === '/api/logout') { const t = cookieOf(req); if (t) delete sessions[sha(t)]; C.audit('Logout', user.username, ''); await persist(); res.setHeader('Set-Cookie', 'gid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); return send(res, 200, { ok: true }); }
  if (method === 'POST' && p === '/api/rpc') {
    const b = await readBody(req, 12e6); const o = OPS[b.op]; if (!o) bad('Unknown operation.', 404);
    if (o.perm && !C.can(o.perm)) bad('You do not have permission to do this.', 403);
    if (!o.perm && b.op !== 'me.password') bad('Forbidden.', 403);
    const r = o.fn(b.args || {}) || {}; await persist(); return send(res, 200, Object.assign({ ok: true }, r));
  }
  if (method === 'POST' && p === '/api/scan') {
    C.need('gate.scan'); const b = await readBody(req, 1e4); const input = {};
    if (typeof b.code === 'string' && b.code.length <= 64) input.code = b.code; else if (typeof b.studentId === 'string') { C.need('student.basic.read'); input.studentId = b.studentId.slice(0, 40); } else bad('Nothing to scan.');
    const r = C.recordScan(input, { name: user.name }); await persist({ att: r.rec ? [r.rec.id] : [] });
    const out = { kind: r.kind };
    if (r.student) out.student = { sid: r.student.sid, name: C.fullName(r.student), cls: r.student.cls, section: r.student.section, photo: getPhoto(r.student.id) };
    if (r.rec) out.rec = { entry: r.rec.entry, exit: r.rec.exit, late: r.rec.late, lateMin: r.rec.lateMin, dur: r.rec.dur };
    return send(res, 200, out);
  }
  if (method === 'GET' && p === '/api/gate') { C.need('gate.today.read'); return send(res, 200, { stats: C.todayStats(), feed: gateFeed(), settings: gatePublic(), lateFrom: C.lateFromText() }); }
  if (method === 'GET' && p === '/api/gate/search') {
    C.need('student.basic.read'); const q = String(url.searchParams.get('q') || '').trim().toLowerCase(); if (q.length < 2) return send(res, 200, { students: [] });
    return send(res, 200, { students: C.S.students.filter(s => C.fullName(s).toLowerCase().includes(q) || s.sid.toLowerCase().includes(q)).slice(0, 8).map(s => ({ id: s.id, sid: s.sid, name: C.fullName(s), cls: s.kind === 'teacher' ? 'Teacher' : s.cls, section: s.section, photo: getPhoto(s.id) })) });
  }
  if (method === 'GET' && p === '/api/bootstrap') {
    C.need('students.read'); const S = C.S;
    return send(res, 200, { settings: S.settings, classes: S.classes, templates: S.templates, students: S.students, attendance: S.attendance, scans: S.scans.filter(x => x.ts >= new Date(Date.now() - 120 * 86400e3).toISOString()), audit: S.audit.slice(-5000), imports: S.imports, batches: S.batches, users: S.users.map(pub), lateFrom: C.lateFromText() });
  }
  if (method === 'GET' && p === '/api/photos') { C.need('students.read'); return send(res, 200, { photos: allPhotos() }); }
  if (method === 'POST' && p === '/api/backup') {
    C.need('settings.read'); const S = C.S; S.settings.lastBackup = new Date().toISOString(); C.audit('Backup downloaded', '', `${S.students.length} students, ${S.attendance.length} attendance records`); await persist();
    const st = Object.assign({}, S); delete st.users; return send(res, 200, { app: 'gemvic-id-gate', v: 1, exportedAt: new Date().toISOString(), state: st, photos: allPhotos() });
  }
  if (method === 'POST' && p === '/api/restore') {
    C.need('system.restore'); const j = await readBody(req, 300e6);
    if (!j || j.app !== 'gemvic-id-gate' || !j.state || !Array.isArray(j.state.students) || !Array.isArray(j.state.attendance)) bad('This is not a Great Emvic backup file.');
    const cur = C.S; const next = Object.assign(C.defState(), j.state); next.settings = Object.assign(C.defState().settings, j.state.settings || {}); next.users = cur.users; next.audit = cur.audit;
    store.photos.clear(); Object.entries(j.photos || {}).forEach(([id, d]) => { if (typeof d === 'string' && PHOTO_RE.test(d)) store.photos.put(id, d); });
    C.S = next; C.cur = user; C.audit('Backup restored', '', `${next.students.length} students`); await persist(); return send(res, 200, { ok: true });
  }
  bad('Not found.', 404);
}
const server = http.createServer((req, res) => {
  handle(req, res).catch(e => {
    if (!e.status) console.error(e);
    if (!res.headersSent) send(res, e.status || 500, { error: e.status ? e.message : 'Something went wrong on the server.' }); else res.end();
  });
});
// Embedded MongoDB connection: used automatically if the MONGODB_URI environment variable
// isn't set on the host. Change this line before your first deploy if you use a different
// Atlas cluster; an environment variable named MONGODB_URI, if set, always wins over this.
const EMBEDDED_MONGODB_URI = 'mongodb+srv://damsonshenua_db_user:AMibNFFGNcF50y3B@cluster0.8bassha.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Embedded super account: created automatically the first time this server ever starts.
// Change these three lines to whatever you want BEFORE the first start, then it's safe to leave them here --
// this block never runs again once the super account already exists, so editing it later does nothing.
const EMBEDDED_SUPER = { name: 'Big Vee', username: 'admin', password: 'Harbor-Comet-1387!' };

(async () => {
  store = await createStore({ uri: process.env.MONGODB_URI || EMBEDDED_MONGODB_URI, dbName: process.env.MONGODB_DB }, C.defState);
  await loadDB();
  if (!C.S.users.length) {
    const src = (process.env.SUPER_USERNAME && process.env.SUPER_PASSWORD) ? { name: process.env.SUPER_NAME || 'Super Admin', username: process.env.SUPER_USERNAME, password: process.env.SUPER_PASSWORD } : EMBEDDED_SUPER;
    const d = checkNewAccount(src); const u = newUser(d.name, d.username, d.pw, 'super'); C.S.users.push(u); C.cur = u; C.audit('Super account created', u.username, ''); await persist();
    console.log(`Super account created (username: ${d.username}). ${src === EMBEDDED_SUPER ? 'From the EMBEDDED_SUPER constant in server.js.' : 'From environment variables.'}`);
  }
  ['SIGINT', 'SIGTERM'].forEach(s => process.on(s, async () => { try { await store.close(); } catch (e) { } process.exit(0); }));
  server.listen(PORT, HOST, () => console.log(`Great Emvic ID & Gate server on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}  (database: MongoDB Atlas)`));
})().catch(err => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});

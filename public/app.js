'use strict';
//#CORE-START
const TZ = 'Africa/Lagos';
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const pad = n => String(n).padStart(2, '0');
const partsFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
function lagos(iso) {
  const p = {};
  partsFmt.formatToParts(new Date(iso)).forEach(x => { p[x.type] = x.value; });
  return { y: p.year, m: p.month, d: p.day, hh: +p.hour, mm: +p.minute, ss: +p.second, wd: p.weekday };
}
const dateKey = iso => { const p = lagos(iso); return `${p.y}-${p.m}-${p.d}`; };
const todayKey = () => dateKey(new Date().toISOString());
const secOfDay = iso => { const p = lagos(iso); return p.hh * 3600 + p.mm * 60 + p.ss; };
const t12 = iso => { const p = lagos(iso); return `${p.hh % 12 || 12}:${pad(p.mm)}:${pad(p.ss)} ${p.hh < 12 ? 'AM' : 'PM'}`; };
const t12m = iso => { const p = lagos(iso); return `${p.hh % 12 || 12}:${pad(p.mm)} ${p.hh < 12 ? 'AM' : 'PM'}`; };
const t24 = iso => { const p = lagos(iso); return `${pad(p.hh)}:${pad(p.mm)}:${pad(p.ss)}`; };
const dLong = iso => { const p = lagos(iso); return `${+p.d} ${MONTHS[+p.m - 1]} ${p.y}`; };
const dLongKey = k => `${+k.slice(8)} ${MONTHS[+k.slice(5, 7) - 1]} ${k.slice(0, 4)}`;
const dShort = k => `${k.slice(8)}/${k.slice(5, 7)}/${k.slice(0, 4)}`;
const dayOf = k => new Date(k + 'T12:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
const lagosISO = (key, hms) => new Date(`${key}T${hms.length === 5 ? hms + ':00' : hms}+01:00`).toISOString();
const hms = s => { s = Math.max(0, Math.round(s)); return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s % 3600 / 60))}:${pad(s % 60)}`; };
const durShort = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h}h ${pad(m)}m` : `${m}m`; };
const durLong = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return `${h} ${h === 1 ? 'hour' : 'hours'} ${m} ${m === 1 ? 'minute' : 'minutes'}`; };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fullName = s => [s.first, s.middle, s.last].filter(Boolean).join(' ');
const displayName = s => s.pref ? [s.pref, s.last].filter(Boolean).join(' ') : fullName(s);
const levelOf = cls => { const m = /^(JSS[1-3]|SS[1-3]|Primary[1-9])/i.exec(cls || ''); if (!m) return ''; return /^primary/i.test(m[1]) ? 'Primary' + m[1].replace(/[^0-9]/g, '') : m[1].toUpperCase(); };

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newQR(used) {
  let v;
  do {
    const b = new Uint8Array(12);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(b); else for (let i = 0; i < 12; i++) b[i] = Math.floor(Math.random() * 256);
    v = 'GE-ID-' + Array.from(b).map(x => ALPHA[x % 32]).join('');
  } while (used && used.has(v));
  return v;
}

const FONTS = {
  'Inter': 'Inter, "Segoe UI", Arial, sans-serif',
  'Georgia': 'Georgia, "Times New Roman", serif',
  'Arial': 'Arial, Helvetica, sans-serif',
  'Trebuchet MS': '"Trebuchet MS", Arial, sans-serif',
  'Verdana': 'Verdana, Geneva, sans-serif'
};
const defTemplates = () => [
  { id: 't1', name: 'Great Emvic Standard', headerBg: '#5C3A21', headerText: '#FFF6EE', mottoColor: '#F0B285', bodyBg: '#FFF6EE', accent: '#C97B4A', nameColor: '#5C3A21', textColor: '#3B2A1E', subColor: '#8B5E34', border: true, font: 'Inter', scale: 1, photoPos: 'left', qrPos: 'right', showBack: true },
  { id: 't2', name: 'Great Emvic Premium', headerBg: '#3F2718', headerText: '#FFEFDD', mottoColor: '#E8A97A', bodyBg: '#FFF1E3', accent: '#B5651D', nameColor: '#3F2718', textColor: '#3B2A1E', subColor: '#8B5E34', border: true, font: 'Georgia', scale: 1, photoPos: 'left', qrPos: 'right', showBack: true },
  { id: 't3', name: 'Great Emvic Minimal', headerBg: '#FFF6EE', headerText: '#5C3A21', mottoColor: '#C97B4A', bodyBg: '#FFFFFF', accent: '#5C3A21', nameColor: '#5C3A21', textColor: '#3B2A1E', subColor: '#8B5E34', border: false, font: 'Inter', scale: 1, photoPos: 'right', qrPos: 'left', showBack: false }
];
function defClasses() {
  const out = [];
  [['Primary School', ['Primary1', 'Primary2', 'Primary3', 'Primary4', 'Primary5']], ['Junior Secondary School', ['JSS1', 'JSS2', 'JSS3']], ['Senior Secondary School', ['SS1', 'SS2', 'SS3']]].forEach(([section, lv]) => lv.forEach(level => out.push({ name: level, level, section })));
  return out;
}
const defState = () => ({
  v: 1,
  settings: { school: 'Great Emvic School', motto: 'Godliness • Knowledge • Greatness', contact: '', opening: '08:00', teacherOpening: '07:30', grace: 10, minExit: 5, session: '2026/2027', gate: 'Main School Gate', expiry: 'End of academic session', defaultTemplate: 't1', lastBackup: null, logo: null },
  users: [], classes: defClasses(), templates: defTemplates(),
  students: [], attendance: [], scans: [], audit: [], imports: [], batches: []
});

let S = defState();
let cur = null;
let smap = null;
const stu = id => { if (!smap) smap = new Map(S.students.map(s => [s.id, s])); return smap.get(id); };
const dirty = () => { smap = null; };
const PERMS = { operator: ['gate.scan', 'gate.today.read', 'student.basic.read'] };
/* Roles: super (one owner account) > admin > operator. Only admins create accounts: the super account creates admins and operators, admins create operators. */
const SUPER_ONLY = ['admins.manage', 'system.restore', 'system.reset'];
const can = p => !!cur && (cur.role === 'super' || (cur.role === 'admin' && !SUPER_ONLY.includes(p)) || (PERMS[cur.role] || []).includes(p));
const canManage = t => !!cur && !!t && ((cur.role === 'super' && t.role !== 'super') || (cur.role === 'admin' && t.role === 'operator'));
const roleLabel = r => r === 'super' ? 'Super account' : r === 'admin' ? 'Administrator' : 'Gate operator';
function need(p) { if (!can(p)) throw Object.assign(new Error('You do not have permission to do this.'), { status: 403 }); }
function audit(action, target, detail) {
  S.audit.push({ id: uid(), ts: new Date().toISOString(), actor: cur ? cur.name : 'System', role: cur ? cur.role : '', action, target: target || '', detail: detail || '' });
}
const allQR = () => { const set = new Set(); S.students.forEach(s => { if (s.qr) set.add(s.qr.value); (s.qrHistory || []).forEach(h => set.add(h.value)); }); return set; };
function issueQR(st, reason, oldStatus) {
  const used = allQR(); const value = newQR(used); const now = new Date().toISOString();
  st.qrHistory = st.qrHistory || [];
  if (st.qr) st.qrHistory.push({ value: st.qr.value, version: st.qr.version, from: st.qr.from, to: now, status: oldStatus || 'Replaced', reason: reason || '' });
  st.qr = { value, version: st.qrHistory.length + 1, from: now, status: 'Active' };
  st.idGeneratedAt = st.idGeneratedAt || now;
  return st.qr;
}

/* ---------- gate logic ---------- */
const isTeacher = s => !!s && s.kind === 'teacher';
function lateInfo(iso, kind) {
  const [oh, om] = (kind === 'teacher' ? (S.settings.teacherOpening || S.settings.opening) : S.settings.opening).split(':').map(Number);
  const openSec = oh * 3600 + om * 60;
  const lateFrom = openSec + (+S.settings.grace || 0) * 60 + 60;
  const sec = secOfDay(iso);
  return { late: sec >= lateFrom, lateMin: Math.max(0, Math.floor((sec - openSec) / 60)) };
}
function lateFromText(kind) {
  const [oh, om] = (kind === 'teacher' ? (S.settings.teacherOpening || S.settings.opening) : S.settings.opening).split(':').map(Number);
  const t = oh * 60 + om + (+S.settings.grace || 0) + 1;
  const h = Math.floor(t / 60) % 24, m = t % 60;
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
}
function findByQR(code) {
  const c = String(code || '').trim().toUpperCase();
  if (!c) return null;
  for (const s of S.students) if (s.qr && s.qr.value === c) return { s, current: true };
  for (const s of S.students) if ((s.qrHistory || []).some(h => h.value === c)) return { s, current: false };
  return null;
}
const maskCode = c => { c = String(c || ''); return c.length > 10 ? c.slice(0, 9) + '…' : c; };
function statusOf(st, key) {
  const r = S.attendance.find(x => x.studentId === st.id && x.date === (key || todayKey()) && !x.archived);
  return !r ? 'NOT CHECKED IN' : (r.exit ? 'LEFT SCHOOL' : 'IN SCHOOL');
}
/* The one place attendance is written. Timestamps come from this function, never from the QR or the caller. */
function recordScan(input, actor) {
  const now = new Date().toISOString();
  const method = input.code != null ? 'QR' : 'Manual search';
  const log = (result, st, extra) => {
    S.scans.push({ id: uid(), ts: now, code: input.code != null ? maskCode(input.code) : '', studentId: st ? st.id : null, action: result.action, result: result.kind, operator: actor.name, gate: S.settings.gate, method, note: extra || '' });
  };
  let st = null;
  if (input.code != null) {
    const f = findByQR(input.code);
    if (!f) { const r = { kind: 'INVALID', action: 'SCAN' }; log(r); return r; }
    st = f.s;
    if (!f.current || st.qr.status !== 'Active') { const r = { kind: 'INACTIVE_ID', action: 'SCAN', student: st }; log(r, st); return r; }
  } else {
    st = stu(input.studentId);
    if (!st) { const r = { kind: 'INVALID', action: 'SCAN' }; log(r); return r; }
    if (st.qr && st.qr.status === 'Suspended') { const r = { kind: 'INACTIVE_ID', action: 'SCAN', student: st }; log(r, st); return r; }
  }
  if (st.status !== 'Active') { const r = { kind: 'INACTIVE_STUDENT', action: 'SCAN', student: st }; log(r, st); return r; }
  const key = dateKey(now);
  const rec = S.attendance.find(x => x.studentId === st.id && x.date === key && !x.archived);
  if (!rec) {
    const li = lateInfo(now, st.kind);
    const nr = { id: uid(), studentId: st.id, date: key, entry: now, exit: null, late: li.late, lateMin: li.lateMin, dur: null, entryOp: actor.name, exitOp: null, gate: S.settings.gate, method, qrVersion: st.qr ? st.qr.version : null, kind: isTeacher(st) ? 'teacher' : 'student', cls: st.cls, section: st.section, session: st.session, corrected: false, log: [], archived: false, demo: !!st.demo };
    S.attendance.push(nr);
    const r = { kind: 'ENTRY', action: 'ENTRY', student: st, rec: nr }; log(r, st, li.late ? 'late' : 'on time'); return r;
  }
  if (!rec.exit) {
    const elapsed = (Date.parse(now) - Date.parse(rec.entry)) / 1000;
    if (elapsed < (+S.settings.minExit || 0) * 60) { const r = { kind: 'DUP_IN', action: 'DUPLICATE', student: st, rec }; log(r, st); return r; }
    rec.exit = now; rec.dur = elapsed; rec.exitOp = actor.name;
    const r = { kind: 'EXIT', action: 'EXIT', student: st, rec }; log(r, st); return r;
  }
  const r = { kind: 'DUP_OUT', action: 'DUPLICATE', student: st, rec }; log(r, st); return r;
}
function todayStats() {
  const key = todayKey();
  const recs = S.attendance.filter(r => r.date === key && !r.archived);
  const isT = id => { const s = stu(id); return isTeacher(s); };
  const rs = recs.filter(r => !isT(r.studentId)), rt = recs.filter(r => isT(r.studentId));
  const seen = new Set(recs.map(r => r.studentId));
  const active = S.students.filter(s => s.status === 'Active' && !isTeacher(s)), tActive = S.students.filter(s => s.status === 'Active' && isTeacher(s));
  return {
    total: active.length, checkedIn: rs.length, notYet: active.filter(s => !seen.has(s.id)).length, late: rs.filter(r => r.late).length, inside: rs.filter(r => !r.exit).length,
    tTotal: tActive.length, tChecked: rt.length, tNot: tActive.filter(s => !seen.has(s.id)).length, tLate: rt.filter(r => r.late).length, tInside: rt.filter(r => !r.exit).length,
    inSchool: recs.filter(r => !r.exit).length, exited: recs.filter(r => r.exit).length
  };
}
//#CORE-END

/* ---------- libraries: several download sources, so one blocked CDN cannot break the scanner ---------- */
const LIBS = [
  { test: () => typeof qrcode !== 'undefined', urls: ['https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js', 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'] },
  { test: () => typeof jsQR !== 'undefined', urls: ['https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js', 'https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.js', 'https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js'] },
  { test: () => typeof XLSX !== 'undefined', urls: ['https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'] },
  { test: () => typeof jspdf !== 'undefined', urls: ['https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'] },
  { test: () => typeof JSZip !== 'undefined', urls: ['https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'] }
];
function loadScript(u) { return new Promise(res => { const s = document.createElement('script'); let done = false; const fin = v => { if (!done) { done = true; res(v); } }; s.src = u; s.onload = () => fin(true); s.onerror = () => { s.remove(); fin(false); }; document.head.appendChild(s); setTimeout(() => fin(false), 12000); }); }
let libsBusy = null;
function ensureLibs() {
  if (libsBusy) return libsBusy;
  libsBusy = (async () => { let changed = false; for (const L of LIBS) { if (L.test()) continue; for (const u of L.urls) { if ((await loadScript(u)) && L.test()) { changed = true; break; } } } libsBusy = null; return changed; })();
  return libsBusy;
}

/* ---------- storage ---------- */
const IDBK = { db: null, ok: false };
function idbOpen() {
  return new Promise(res => {
    try {
      const r = indexedDB.open('gemvic-id-gate', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => { IDBK.db = r.result; IDBK.ok = true; res(true); };
      r.onerror = () => res(false);
      r.onblocked = () => res(false);
    } catch (e) { res(false); }
  });
}
const idbGet = k => new Promise(res => { if (!IDBK.db) return res(undefined); try { const q = IDBK.db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(undefined); } catch (e) { res(undefined); } });
const idbSet = (k, v) => new Promise(res => { if (!IDBK.db) return res(false); try { const tx = IDBK.db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(v, k); tx.oncomplete = () => res(true); tx.onerror = () => res(false); tx.onabort = () => res(false); } catch (e) { res(false); } });
const idbDel = k => new Promise(res => { if (!IDBK.db) return res(false); try { const tx = IDBK.db.transaction('kv', 'readwrite'); tx.objectStore('kv').delete(k); tx.oncomplete = () => res(true); tx.onerror = () => res(false); } catch (e) { res(false); } });
const idbPhotos = () => new Promise(res => {
  const out = new Map(); if (!IDBK.db) return res(out);
  try {
    const q = IDBK.db.transaction('kv').objectStore('kv').openCursor();
    q.onsuccess = () => { const c = q.result; if (!c) return res(out); if (String(c.key).startsWith('photo:')) out.set(String(c.key).slice(6), c.value); c.continue(); };
    q.onerror = () => res(out);
  } catch (e) { res(out); }
});
const photos = new Map();
let saveT = null;
function save() { clearTimeout(saveT); saveT = setTimeout(() => idbSet('state', S), 250); }
async function flush() { clearTimeout(saveT); return idbSet('state', S); }
function setPhoto(id, url) { photos.set(id, url); idbSet('photo:' + id, url); }
function delPhoto(id) { photos.delete(id); idbDel('photo:' + id); }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
window.addEventListener('pagehide', () => { flush(); });

/* ---------- auth (browser prototype) ---------- */
async function hashPw(pw, salt) {
  const data = new TextEncoder().encode(salt + ':' + pw);
  if (window.crypto && crypto.subtle) {
    const b = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
  }
  let h = 5381; for (const c of data) h = ((h << 5) + h + c) >>> 0; return 'x' + h.toString(16);
}
const fails = {};
async function login(username, pw) {
  const u = S.users.find(x => x.username.toLowerCase() === String(username).trim().toLowerCase());
  const f = fails[username] || { n: 0, until: 0 };
  if (Date.now() < f.until) return { ok: false, msg: `Too many attempts. Try again in ${Math.ceil((f.until - Date.now()) / 1000)} seconds.` };
  if (!u || !u.active || (await hashPw(pw, u.salt)) !== u.hash) {
    f.n++; if (f.n >= 5) { f.until = Date.now() + 30000; f.n = 0; } fails[username] = f;
    if (u) { cur = null; S.audit.push({ id: uid(), ts: new Date().toISOString(), actor: u.name, role: u.role, action: 'Failed login', target: u.username, detail: u.active ? '' : 'Account disabled' }); save(); }
    return { ok: false, msg: u && !u.active ? 'This account is disabled. Contact the administrator.' : 'Username or password is incorrect.' };
  }
  fails[username] = { n: 0, until: 0 };
  cur = u; u.lastLogin = new Date().toISOString(); audit('Login', u.username, ''); save();
  try { sessionStorage.setItem('gemvic.uid', u.id); } catch (e) { }
  return { ok: true };
}
async function makeUser(name, username, pw, role) {
  const salt = uid() + uid();
  return { id: uid(), name, username, role, salt, hash: await hashPw(pw, salt), active: true, created: new Date().toISOString(), lastLogin: null };
}

/* ---------- small UI helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
function toast(msg, type = '') {
  const el = document.createElement('div'); el.className = 'toast ' + type; el.textContent = msg;
  $('#toast').appendChild(el); setTimeout(() => el.remove(), type === 'err' ? 5200 : 3000);
}
function layerEl(n) { let el = document.getElementById('modal' + (n || '')); if (!el) { el = document.createElement('div'); el.id = 'modal' + n; document.body.appendChild(el); } return el; }
function openModal(title, body, foot, o = {}) {
  const el = layerEl(o.layer || ''); const w = o.wide ? ' wide' : (o.small ? ' sm' : '');
  el.innerHTML = `<div class="mback" data-a="mback" data-layer="${o.layer || ''}"><div class="modal${w}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="mh"><h2>${esc(title)}</h2><button class="btn ghost sm" data-a="close" data-layer="${o.layer || ''}" aria-label="Close">Close</button></div><div class="mb">${body}</div>${foot ? `<div class="mf">${foot}</div>` : ''}</div></div>`;
  const f = $('input:not([type=hidden]):not([type=file]),select,textarea', el); if (f && !o.noFocus) setTimeout(() => f.focus(), 30);
}
function closeModal(n) { const el = document.getElementById('modal' + (n || '')); if (el) el.innerHTML = ''; }
function confirmBox(title, msg, okLabel, danger) {
  return new Promise(res => {
    openModal(title, `<p>${msg}</p>`, `<button class="btn ghost" data-a="cf-no">Cancel</button><button class="btn ${danger ? 'danger' : ''}" data-a="cf-yes">${esc(okLabel || 'Confirm')}</button>`, { layer: 3, small: true, noFocus: true });
    const el = layerEl(3); const h = e => { const b = e.target.closest('[data-a]'); if (!b) return; if (b.dataset.a === 'mback' && e.target !== b) return; if (b.dataset.a === 'cf-yes' || b.dataset.a === 'cf-no' || b.dataset.a === 'close' || b.dataset.a === 'mback') { e.stopPropagation(); el.removeEventListener('click', h, true); closeModal(3); res(b.dataset.a === 'cf-yes'); } };
    el.addEventListener('click', h, true);
  });
}
let DL = null;
if (window.claude && claude.use) { claude.use('downloads').then(d => { DL = d; }).catch(() => { }); }
async function saveFile(name, data) {
  if (DL) {
    try { await DL.save({ filename: name, data }); toast('Saved ' + name, 'ok'); return true; }
    catch (e) { if (e && e.code === 'declined') return false; toast('This file could not be saved here (' + ((e && e.code) || 'error') + ').', 'err'); return false; }
  }
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(data instanceof Blob ? data : new Blob([data])); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); return true; } catch (e) { toast('Download is not available in this view.', 'err'); return false; }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const tick = () => new Promise(r => setTimeout(r, 0));
const toBlobP = (c, type, q) => new Promise(r => c.toBlob(r, type, q));
const dataURLToBlob = u => { const [h, b] = u.split(','); const m = /:(.*?);/.exec(h)[1]; const bin = atob(b); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: m }); };

/* ---------- images ---------- */
const imgCache = new Map();
function loadImgRaw(src) { return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
function loadImg(src) { if (!src) return Promise.resolve(null); if (imgCache.size > 400) imgCache.clear(); if (!imgCache.has(src)) imgCache.set(src, loadImgRaw(src)); return imgCache.get(src); }
async function ensureFont(f) { try { const fam = FONTS[f] || FONTS.Inter; await document.fonts.load(`700 40px ${fam}`); await document.fonts.load(`400 24px ${fam}`); } catch (e) { } }
function autoCrop(img, W = 300, H = 400) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const r = Math.max(W / img.width, H / img.height); const dw = img.width * r, dh = img.height * r;
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh); return c.toDataURL('image/jpeg', 0.85);
}
async function resizeToPNG(file, max = 320) {
  const url = URL.createObjectURL(file); const img = await loadImgRaw(url); URL.revokeObjectURL(url); if (!img) return null;
  const r = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return c.toDataURL('image/png');
}
function cropPhoto(file) {
  return new Promise(async resolve => {
    const url = URL.createObjectURL(file); const img = await loadImgRaw(url);
    if (!img) { URL.revokeObjectURL(url); toast('That file could not be read as an image.', 'err'); return resolve(null); }
    const VW = 270, VH = 360; const min = Math.max(VW / img.width, VH / img.height);
    let scale = min, ox = (VW - img.width * scale) / 2, oy = (VH - img.height * scale) / 2;
    openModal('Crop photograph', `<div class="cropbox"><canvas id="cropc" width="${VW}" height="${VH}" aria-label="Drag to position the photograph"></canvas><div style="width:270px;max-width:100%"><label class="f" for="cropz">Zoom</label><input type="range" id="cropz" min="1" max="3" step="0.01" value="1"></div><p class="muted small" style="margin:0">Drag the photo so the face is centred. The card uses a 3:4 portrait frame.</p></div>`,
      `<button class="btn ghost" id="cropno">Cancel</button><button class="btn" id="cropok">Use photograph</button>`, { layer: 2, small: true, noFocus: true });
    const cv = $('#cropc'), g = cv.getContext('2d');
    const clamp = () => { ox = Math.min(0, Math.max(VW - img.width * scale, ox)); oy = Math.min(0, Math.max(VH - img.height * scale, oy)); };
    const draw = () => { clamp(); g.fillStyle = '#fff'; g.fillRect(0, 0, VW, VH); g.drawImage(img, ox, oy, img.width * scale, img.height * scale); };
    draw();
    let drag = null;
    cv.onpointerdown = e => { drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing'; };
    cv.onpointermove = e => { if (!drag) return; const k = VW / cv.getBoundingClientRect().width; ox += (e.clientX - drag.x) * k; oy += (e.clientY - drag.y) * k; drag = { x: e.clientX, y: e.clientY }; draw(); };
    cv.onpointerup = () => { drag = null; cv.style.cursor = 'grab'; };
    $('#cropz').oninput = e => { const ns = min * (+e.target.value); const cx = (VW / 2 - ox) / scale, cy = (VH / 2 - oy) / scale; scale = ns; ox = VW / 2 - cx * scale; oy = VH / 2 - cy * scale; draw(); };
    const done = v => { URL.revokeObjectURL(url); closeModal(2); resolve(v); };
    $('#cropno').onclick = () => done(null);
    $('#cropok').onclick = () => {
      const f = 300 / VW; const o = document.createElement('canvas'); o.width = 300; o.height = 400; const og = o.getContext('2d');
      og.fillStyle = '#fff'; og.fillRect(0, 0, 300, 400); og.drawImage(img, ox * f, oy * f, img.width * scale * f, img.height * scale * f); done(o.toDataURL('image/jpeg', 0.86));
    };
  });
}

/* ---------- ID card renderer (CR80 at 300 dpi: 1012 x 638) ---------- */
const CW = 1012, CH = 638;
const lum = hex => { const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
function fitPx(g, text, weight, fam, maxW, start, min) { let px = Math.round(start); g.font = `${weight} ${px}px ${fam}`; while (g.measureText(text).width > maxW && px > min) { px -= 2; g.font = `${weight} ${px}px ${fam}`; } return px; }
function fillFit(g, text, weight, fam, x, y, maxW, start, min, color) {
  const px = fitPx(g, text, weight, fam, maxW, start, min); g.fillStyle = color; g.textAlign = 'left';
  let t = text; while (g.measureText(t).width > maxW && t.length > 1) t = t.slice(0, -1); if (t !== text) t = t.slice(0, -1) + '…';
  g.fillText(t, x, y); return px;
}
function wrapText(g, text, x, y, maxW, lh) {
  const words = String(text).split(' '); let line = ''; let yy = y;
  words.forEach(w => { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, yy); line = w; yy += lh; } else line = t; });
  if (line) { g.fillText(line, x, yy); yy += lh; } return yy;
}
function drawCover(g, img, x, y, w, h) { const r = Math.max(w / img.width, h / img.height); const dw = img.width * r, dh = img.height * r; g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); g.restore(); }
function drawQR(g, value, x, y, size) {
  g.fillStyle = '#FFFFFF'; g.fillRect(x, y, size, size);
  if (typeof qrcode === 'undefined') { g.fillStyle = '#111'; g.font = '16px sans-serif'; g.fillText('QR library unavailable', x + 8, y + size / 2); return; }
  const qr = qrcode(0, 'M'); qr.addData(value, /^[0-9A-Z $%*+\-.\/:]+$/.test(value) ? 'Alphanumeric' : 'Byte'); qr.make(); const n = qr.getModuleCount(); const m = Math.floor(size / (n + 8)); const off = Math.floor((size - m * n) / 2);
  g.fillStyle = '#111111';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) g.fillRect(x + off + c * m, y + off + r * m, m, m);
}
function drawLogo(g, logo, cx, cy, r, tpl) {
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.closePath();
  if (logo) { g.clip(); drawCover(g, logo, cx - r, cy - r, r * 2, r * 2); g.restore(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.lineWidth = 3; g.strokeStyle = tpl.accent; g.stroke(); return; }
  g.fillStyle = tpl.accent; g.fill(); g.restore();
  g.fillStyle = lum(tpl.accent) > 0.5 ? '#0B1F3A' : '#FFFFFF'; g.font = `700 ${Math.round(r * 0.86)}px ${FONTS[tpl.font] || FONTS.Inter}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('GE', cx, cy + 2); g.textBaseline = 'alphabetic';
}
function drawSilhouette(g, x, y, w, h) {
  g.fillStyle = '#E6EAF1'; g.fillRect(x, y, w, h); g.fillStyle = '#B9C2D1';
  g.beginPath(); g.arc(x + w / 2, y + h * 0.38, w * 0.2, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(x + w / 2, y + h * 0.86, w * 0.36, h * 0.24, 0, Math.PI, 0); g.fill();
}
async function drawCard(st, tpl, side = 'front') {
  await ensureFont(tpl.font);
  const c = document.createElement('canvas'); c.width = CW; c.height = CH; const g = c.getContext('2d');
  const F = FONTS[tpl.font] || FONTS.Inter, sc = tpl.scale || 1;
  const school = String(tpl.school ?? S.settings.school).toUpperCase(), motto = tpl.motto ?? S.settings.motto;
  g.fillStyle = tpl.bodyBg; g.fillRect(0, 0, CW, CH);
  const HH = side === 'front' ? 150 : 112;
  g.fillStyle = tpl.headerBg; g.fillRect(0, 0, CW, HH); g.fillStyle = tpl.accent; g.fillRect(0, HH, CW, 8);
  const logo = await loadImg(S.settings.logo); const lr = side === 'front' ? 68 : 46, lx = 46 + lr;
  drawLogo(g, logo, lx, HH / 2, lr, tpl);
  const hx = lx + lr + 26, hw = CW - hx - 34;
  g.textBaseline = 'alphabetic';
  if (side === 'front') { fillFit(g, school, 700, F, hx, HH / 2 - 2, hw, 46 * sc, 22, tpl.headerText); fillFit(g, motto, 500, F, hx, HH / 2 + 36, hw, 26 * sc, 16, tpl.mottoColor); }
  else fillFit(g, school, 700, F, hx, HH / 2 + 12, hw, 40 * sc, 22, tpl.headerText);
  if (side === 'front') {
    const pw = 270, ph = 360, p0 = 46, py = HH + 8 + 28;
    const px = tpl.photoPos === 'right' ? CW - p0 - pw : p0;
    g.fillStyle = tpl.accent; g.fillRect(px - 6, py - 6, pw + 12, ph + 12);
    const img = await loadImg(photos.get(st.id));
    if (img) drawCover(g, img, px, py, pw, ph); else drawSilhouette(g, px, py, pw, ph);
    const tx0 = tpl.photoPos === 'right' ? p0 : p0 + pw + 40, tx1 = tpl.photoPos === 'right' ? CW - p0 - pw - 40 : CW - p0, zw = tx1 - tx0;
    const QS = 300, qy = CH - 34 - QS, qx = tpl.qrPos === 'left' ? tx0 : tx1 - QS;
    const lx0 = tpl.qrPos === 'left' ? tx0 + QS + 26 : tx0, lw = zw - QS - 26;
    fillFit(g, displayName(st).toUpperCase(), 700, F, tx0, py + 52, zw, 46 * sc, 24, tpl.nameColor);
    fillFit(g, st.sid, 700, F, tx0, py + 106, zw, 34 * sc, 20, tpl.subColor);
    fillFit(g, isTeacher(st) ? 'TEACHER' : (st.cls || ''), 700, F, lx0, py + 158, lw, 36 * sc, 20, tpl.textColor);
    g.font = `600 ${Math.round(26 * sc)}px ${F}`; g.fillStyle = tpl.textColor; g.textAlign = 'left';
    const yy = wrapText(g, String(isTeacher(st) ? (st.dept || 'Teaching staff') : st.section || '').toUpperCase(), lx0, py + 204, lw, 32 * sc);
    if (!isTeacher(st)) { g.font = `500 ${Math.round(26 * sc)}px ${F}`; g.fillStyle = '#5B677B'; g.fillText('Session ' + (st.session || ''), lx0, yy + 8); }
    g.strokeStyle = tpl.accent; g.lineWidth = 4; g.strokeRect(qx - 6, qy - 6, QS + 12, QS + 12);
    drawQR(g, st.qr ? st.qr.value : 'GE-ID-NOT-ISSUED', qx, qy, QS);
    if (!st.qr) { g.fillStyle = 'rgba(255,255,255,.86)'; g.fillRect(qx, qy, QS, QS); g.fillStyle = '#DC3545'; g.font = `700 22px ${F}`; g.textAlign = 'center'; g.fillText('NO QR ISSUED', qx + QS / 2, qy + QS / 2 + 8); g.textAlign = 'left'; }
    g.fillStyle = tpl.accent; g.fillRect(0, CH - 14, CW, 14);
  } else {
    g.fillStyle = tpl.textColor; g.textAlign = 'left'; g.font = `700 32px ${F}`;
    let y = wrapText(g, `This card is the property of ${tpl.school ?? S.settings.school}.`, 56, HH + 76, CW - 112, 42);
    g.font = `500 28px ${F}`; y = wrapText(g, 'If found, please kindly return it to the School Management with our thanks.', 56, y + 6, CW - 112, 38);
    if (S.settings.contact) { g.font = `600 26px ${F}`; g.fillStyle = tpl.subColor; y = wrapText(g, 'Contact: ' + S.settings.contact, 56, y + 14, CW - 112, 34); }
    g.fillStyle = tpl.textColor; g.font = `600 28px ${F}`; g.fillText((isTeacher(st) ? 'Staff ID: ' : 'Student ID: ') + st.sid, 56, CH - 118);
    if (!isTeacher(st)) { g.font = `500 24px ${F}`; g.fillStyle = '#5B677B'; g.fillText('Session ' + (st.session || ''), 56, CH - 80); }
    try { await document.fonts.load('700 46px "Dancing Script"'); } catch (e) { }
    g.font = `700 46px "Dancing Script", cursive`; g.fillStyle = tpl.nameColor; g.textAlign = 'left'; g.fillText('Vice Principal', 630, CH - 110);
    g.strokeStyle = tpl.textColor; g.lineWidth = 2; g.beginPath(); g.moveTo(620, CH - 96); g.lineTo(CW - 56, CH - 96); g.stroke();
    g.font = `500 20px ${F}`; g.fillStyle = '#5B677B'; g.fillText('Vice Principal', 620, CH - 66);
    g.fillStyle = tpl.accent; g.fillRect(0, CH - 14, CW, 14);
  }
  if (tpl.border) { g.strokeStyle = tpl.accent; g.lineWidth = 8; g.strokeRect(4, 4, CW - 8, CH - 8); }
  return c;
}
const sampleStudent = () => ({ id: '_sample', sid: 'GE/2026/0001', first: 'Daniel', middle: '', last: 'Onyeka', cls: 'SS2', section: 'Senior Secondary School', session: S.settings.session, qr: { value: 'GE-ID-SAMPLE000000', version: 1, status: 'Active' } });
const tplById = id => S.templates.find(t => t.id === id) || S.templates[0];
const fileSafe = s => String(s).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cardFile = (st, ext) => `GE_ID_${fileSafe(st.first)}_${fileSafe(st.last)}_${fileSafe(st.sid)}.${ext}`;

/* ---------- render sets and layouts ---------- */
async function renderSet(students, tpl, withBack, onProg) {
  const items = [];
  for (let i = 0; i < students.length; i++) {
    const st = students[i]; const f = await drawCard(st, tpl, 'front'); const it = { st, front: f.toDataURL('image/jpeg', 0.93) };
    if (withBack && tpl.showBack) { const b = await drawCard(st, tpl, 'back'); it.back = b.toDataURL('image/jpeg', 0.93); }
    items.push(it); if (onProg) onProg(i + 1, students.length); if (i % 4 === 3) await tick();
  }
  return items;
}
const CWM = 85.6, CHM = 53.98, GAP = 4;
function layoutDims(l) {
  if (l.mode === 'single') return { cols: 1, rows: 1 };
  const preset = { '4': [2, 2], '6': [2, 3], '8': [2, 4], '10': [2, 5] };
  if (preset[l.mode]) return { cols: preset[l.mode][0], rows: preset[l.mode][1] };
  return { cols: Math.min(2, Math.max(1, +l.cols || 2)), rows: Math.min(5, Math.max(1, +l.rows || 2)) };
}
function placePages(n, cols, rows, mirror) {
  const pages = [], per = cols * rows;
  for (let i = 0; i < n; i += per) { const pg = []; for (let j = 0; j < per && i + j < n; j++) { let col = j % cols; const row = Math.floor(j / cols); if (mirror) col = cols - 1 - col; pg.push({ idx: i + j, col, row }); } pages.push(pg); }
  return pages;
}
const gridOrigin = (cols, rows) => ({ x0: (210 - (cols * CWM + (cols - 1) * GAP)) / 2, y0: (297 - (rows * CHM + (rows - 1) * GAP)) / 2 });
function sheetPlan(items, layout, withBack) {
  const { cols, rows } = layoutDims(layout); const o = gridOrigin(cols, rows); const plan = [];
  placePages(items.length, cols, rows, false).forEach(pg => plan.push(pg.map(p => ({ src: items[p.idx].front, x: o.x0 + p.col * (CWM + GAP), y: o.y0 + p.row * (CHM + GAP) }))));
  if (withBack && items.some(i => i.back)) placePages(items.length, cols, rows, true).forEach(pg => plan.push(pg.filter(p => items[p.idx].back).map(p => ({ src: items[p.idx].back, x: o.x0 + p.col * (CWM + GAP), y: o.y0 + p.row * (CHM + GAP) }))));
  return plan;
}
function buildPDF(items, layout, withBack) {
  const { jsPDF } = window.jspdf;
  if (layout.mode === 'single') {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [CWM, CHM] }); let first = true;
    items.forEach(it => { if (!first) doc.addPage([CWM, CHM], 'landscape'); first = false; doc.addImage(it.front, 'JPEG', 0, 0, CWM, CHM); if (withBack && it.back) { doc.addPage([CWM, CHM], 'landscape'); doc.addImage(it.back, 'JPEG', 0, 0, CWM, CHM); } });
    return doc;
  }
  const doc = new jsPDF({ unit: 'mm', format: 'a4' }); const plan = sheetPlan(items, layout, withBack);
  doc.setDrawColor(130); doc.setLineWidth(0.1);
  plan.forEach((pg, i) => {
    if (i) doc.addPage('a4', 'portrait');
    pg.forEach(p => {
      doc.addImage(p.src, 'JPEG', p.x, p.y, CWM, CHM);
      [[p.x, p.y, -1, -1], [p.x + CWM, p.y, 1, -1], [p.x, p.y + CHM, -1, 1], [p.x + CWM, p.y + CHM, 1, 1]].forEach(([cx, cy, dx, dy]) => { doc.line(cx + dx * 0.8, cy, cx + dx * 3.2, cy); doc.line(cx, cy + dy * 0.8, cx, cy + dy * 3.2); });
    });
  });
  return doc;
}
function sheetsHTML(items, layout, withBack) {
  const single = layout.mode === 'single';
  if (single) {
    const cards = []; items.forEach(it => { cards.push(it.front); if (withBack && it.back) cards.push(it.back); });
    return cards.map(s => `<div class="sheet"><img class="pc" alt="ID card" src="${s}" style="left:${(210 - CWM) / 2}mm;top:${(297 - CHM) / 2}mm"></div>`).join('');
  }
  return sheetPlan(items, layout, withBack).map(pg => `<div class="sheet">${pg.map(p => {
    let m = `<img class="pc" alt="ID card" src="${p.src}" style="left:${p.x}mm;top:${p.y}mm">`;
    [[p.x, p.y, -1, -1], [p.x + CWM, p.y, 1, -1], [p.x, p.y + CHM, -1, 1], [p.x + CWM, p.y + CHM, 1, 1]].forEach(([cx, cy, dx, dy]) => {
      m += `<i class="cm" style="left:${dx < 0 ? cx - 3.2 : cx + 0.8}mm;top:${cy}mm;width:2.4mm;height:.1mm"></i><i class="cm" style="left:${cx}mm;top:${dy < 0 ? cy - 3.2 : cy + 0.8}mm;width:.1mm;height:2.4mm"></i>`;
    }); return m;
  }).join('')}</div>`).join('');
}
function openPrint(items, layout, withBack) {
  $('#printRoot').innerHTML = sheetsHTML(items, layout, withBack);
  openModal('Print preview', `<p class="muted small">A4 sheets at true size. Print at 100% scale (no “fit to page”) so the cards stay 85.6 × 53.98 mm. Crop guides sit between cards.</p><div class="prevwrap">${$('#printRoot').innerHTML}</div>`, `<button class="btn ghost" data-a="close">Close</button><button class="btn" data-a="doPrint">Print</button>`, { wide: true, noFocus: true });
}
function b64(url) { return url.split(',')[1]; }
async function buildDocx(items, layout, withBack) {
  if (typeof JSZip === 'undefined') throw new Error('Word export library not loaded');
  const { cols, rows } = layoutDims(layout); const zip = new JSZip(); const rels = []; let n = 0;
  const cards = items.map(i => i.front);
  const pages = placePages(cards.length, cols, rows, false).map(pg => pg.map(p => ({ src: cards[p.idx], col: p.col, row: p.row })));
  if (withBack) placePages(items.length, cols, rows, true).forEach(pg => { const q = pg.filter(p => items[p.idx].back).map(p => ({ src: items[p.idx].back, col: p.col, row: p.row })); if (q.length) pages.push(q); });
  const EW = Math.round(CWM * 36000), EH = Math.round(CHM * 36000); const cellW = Math.floor(10772 / cols);
  const pic = src => {
    n++; const name = `img${n}.jpeg`; zip.file('word/media/' + name, b64(src), { base64: true }); rels.push(`<Relationship Id="rId${n}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${name}"/>`);
    return `<w:r><w:rPr><w:sz w:val="2"/></w:rPr><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${EW}" cy="${EH}"/><wp:docPr id="${n}" name="Card ${n}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${n}" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId${n}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${EW}" cy="${EH}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
  };
  const tiny = '<w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/></w:pPr>';
  let body = '';
  pages.forEach((pg, pi) => {
    let t = `<w:tbl><w:tblPr><w:tblW w:w="${cellW * cols}" w:type="dxa"/><w:jc w:val="center"/><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${'<w:gridCol w:w="' + cellW + '"/>'.repeat(cols)}</w:tblGrid>`;
    const nrows = Math.max(...pg.map(p => p.row)) + 1;
    for (let r = 0; r < nrows; r++) {
      t += `<w:tr><w:trPr><w:trHeight w:val="3100" w:hRule="exact"/></w:trPr>`;
      for (let c = 0; c < cols; c++) { const p = pg.find(x => x.row === r && x.col === c); t += `<w:tc><w:tcPr><w:tcW w:w="${cellW}" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:spacing w:before="0" w:after="0"/><w:jc w:val="center"/></w:pPr>${p ? pic(p.src) : ''}</w:p></w:tc>`; }
      t += '</w:tr>';
    }
    t += '</w:tbl>'; body += t;
    body += pi < pages.length - 1 ? `<w:p>${tiny}<w:r><w:rPr><w:sz w:val="2"/></w:rPr><w:br w:type="page"/></w:r></w:p>` : `<w:p>${tiny}</w:p>`;
  });
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + rels.join('') + '</Relationships>');
  zip.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>' + body + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="400" w:right="567" w:bottom="400" w:left="567" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr></w:body></w:document>');
  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}
async function buildImageZip(students, tpl, fmt, withBack, onProg) {
  if (typeof JSZip === 'undefined') throw new Error('ZIP library not loaded');
  const zip = new JSZip(); const ext = fmt === 'png' ? 'png' : 'jpg', mime = fmt === 'png' ? 'image/png' : 'image/jpeg';
  for (let i = 0; i < students.length; i++) {
    const st = students[i]; zip.file(cardFile(st, ext).replace('.' + ext, '_front.' + ext), await toBlobP(await drawCard(st, tpl, 'front'), mime, 0.95));
    if (withBack && tpl.showBack) zip.file(cardFile(st, ext).replace('.' + ext, '_back.' + ext), await toBlobP(await drawCard(st, tpl, 'back'), mime, 0.95));
    if (onProg) onProg(i + 1, students.length); if (i % 3 === 2) await tick();
  }
  return zip.generateAsync({ type: 'blob' });
}
function xlsxBlob(rows, sheet, widths) {
  const ws = XLSX.utils.json_to_sheet(rows); if (rows[0]) ws['!cols'] = Object.keys(rows[0]).map((k, i) => ({ wch: (widths && widths[i]) || Math.min(34, Math.max(k.length + 2, 12)) }));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, sheet.slice(0, 31));
  return new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/octet-stream' });
}

/* =====================================================================
   VIEWS
   ===================================================================== */
let view = 'overview';
const ui = {
  stuQ: '', stuCls: '', stuStat: '', stuId: '', stuPg: 1, tchQ: '', tchStat: '', tchId: '', tchPg: 1,
  qrQ: '', qrStat: '', qrPg: 1,
  att: null, attPg: 1, sel: new Set(),
  todayAct: '', todayOp: '', todayCls: '', todaySec: '', todayPg: 1,
  inQ: '', inPg: 1, histQ: '', histId: null,
  repTab: 'daily', repDate: null, repFrom: null, repTo: null,
  auditQ: '', auditType: '', auditPg: 1,
  draft: null, tplId: null, prev: '', guides: true,
  gen: { scope: 'all', onlyNew: false, tplId: null, layout: '4', cols: 2, rows: 3, back: true, result: null }
};
const monthStart = () => todayKey().slice(0, 8) + '01';
const NAV = {
  overview: 'Overview', students: 'Students', teachers: 'Teachers', designer: 'ID card designer', generate: 'Generate ID cards', qr: 'QR management',
  scanner: 'Gate scanner', today: "Today's activity", attendance: 'Gate attendance', inschool: 'Currently in school', history: 'Student history', reports: 'Reports',
  operators: 'Accounts', audit: 'Audit log', settings: 'Settings'
};
const NAVGROUPS = [['', ['overview']], ['ID cards', ['students', 'teachers', 'designer', 'generate', 'qr']], ['Gate', ['scanner', 'today', 'attendance', 'inschool', 'history', 'reports']], ['Administration', ['operators', 'audit', 'settings']]];

const badge = (t, c) => `<span class="badge ${c}">${t}</span>`;
const idBadge = st => !st.qr ? badge('Not generated', 'mute') : st.qr.status === 'Active' ? badge('✓ Active', 'ok') : badge('⚠ ' + esc(st.qr.status), st.qr.status === 'Suspended' ? 'warn' : 'err');
const stBadge = s => s === 'Active' ? badge('✓ Active', 'ok') : badge(esc(s), 'warn');
const gateBadge = x => x === 'IN SCHOOL' ? badge('● In school', 'ok') : x === 'LEFT SCHOOL' ? badge('● Left school', 'info') : badge('Not checked in', 'mute');
const thumb = st => photos.get(st.id) ? `<img class="thumb" alt="" src="${photos.get(st.id)}">` : '<div class="thumb"></div>';
const tile = (label, val, cls = '') => `<div class="tile ${cls}"><div class="tv">${val}</div><div class="tl">${label}</div></div>`;
const empty = (t, s) => `<div class="empty"><b>${esc(t)}</b>${esc(s || '')}</div>`;
const head = (t, sub, actions) => `<div class="pagehead"><div><h1>${esc(t)}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="row">${actions || ''}</div></div>`;
function storeWarn() { return IDBK.ok ? '' : `<div class="note warn" style="margin-bottom:14px"><b>Storage is blocked in this browser.</b> Records will be lost when this page closes. Open the page in a normal browser window.</div>`; }
const libWarn = () => { const m = []; if (typeof qrcode === 'undefined') m.push('QR generation'); if (typeof jsQR === 'undefined') m.push('camera scanning'); if (typeof XLSX === 'undefined') m.push('Excel import/export'); if (typeof jspdf === 'undefined') m.push('PDF export'); if (typeof JSZip === 'undefined') m.push('Word/ZIP export'); return m.length ? `<div class="note err" style="margin-bottom:14px">Some libraries could not load, so these features are unavailable: ${m.join(', ')}. Check the network connection and reload.</div>` : ''; };
function pager(key, total, per = 25) {
  const pages = Math.max(1, Math.ceil(total / per)); const p = Math.min(Math.max(1, ui[key] || 1), pages); ui[key] = p;
  return { slice: a => a.slice((p - 1) * per, p * per), html: `<div class="pager"><span>${total ? `${(p - 1) * per + 1}–${Math.min(total, p * per)} of ${total}` : 'No records'}</span><span class="row"><button class="btn ghost sm" data-a="pg" data-k="${key}" data-d="-1" ${p <= 1 ? 'disabled' : ''}>Previous</button><span>Page ${p} of ${pages}</span><button class="btn ghost sm" data-a="pg" data-k="${key}" data-d="1" ${p >= pages ? 'disabled' : ''}>Next</button></span></div>` };
}
const sel = (name, val, opts, pg, attrs = '') => `<select data-f="${name}" ${pg ? `data-pg="${pg}"` : ''} ${attrs}>${opts.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`;
const classOpts = (blank) => [[blank ? '' : '', blank || 'All classes'], ...S.classes.map(c => [c.name, c.name])];
const sections = () => Array.from(new Set(S.classes.map(c => c.section)));
const sessions = () => Array.from(new Set([S.settings.session, ...S.students.map(s => s.session)].filter(Boolean)));
const scanBadge = x => {
  if (x.result === 'ENTRY') return x.note === 'late' ? badge('✓ Entry · Late', 'warn') : badge('✓ Entry', 'ok');
  if (x.result === 'EXIT') return badge('✓ Exit', 'info');
  if (x.result === 'DUP_IN') return badge('Already checked in', 'warn');
  if (x.result === 'DUP_OUT') return badge('Already checked out', 'warn');
  if (x.result === 'INVALID') return badge('⚠ Invalid QR', 'err');
  if (x.result === 'INACTIVE_ID') return badge('⚠ ID not active', 'err');
  return badge('⚠ Student not active', 'err');
};

/* ---------- shell ---------- */
const logoMark = () => S.settings.logo ? `<img alt="" src="${S.settings.logo}">` : 'GE';
function setupHTML() {
  return `<div class="login"><div class="box"><div class="brand"><div class="mark">GE</div><div><b>${esc(S.settings.school)}</b><span>ID cards and gate attendance</span></div></div>
  <h1 style="margin-bottom:6px">Create the super account</h1><p class="muted">This is the owner account. It creates the administrator accounts; administrators then create gate operators. Nobody can sign themselves up.</p>${storeWarn()}
  <form data-form="setup" autocomplete="off">${SETUP_KEY ? '<div class="field"><label class="f" for="su-key">Setup key (from the server settings)</label><input id="su-key" name="key" type="password" required></div>' : ''}<div class="field"><label class="f" for="su-name">Full name</label><input id="su-name" name="name" type="text" required></div>
  <div class="field"><label class="f" for="su-user">Username</label><input id="su-user" name="username" type="text" value="admin" required autocapitalize="none"></div>
  <div class="field"><label class="f" for="su-pw">Password (at least 8 characters)</label><input id="su-pw" name="pw" type="password" minlength="8" required autocomplete="new-password"></div>
  <div class="field"><label class="f" for="su-pw2">Confirm password</label><input id="su-pw2" name="pw2" type="password" minlength="8" required autocomplete="new-password"></div>
  <div id="formerr" class="note err hide" role="alert"></div><button class="btn lg" style="margin-top:10px;min-height:48px;font-size:16px" type="submit">Create account</button></form></div></div>`;
}
function loginHTML() {
  return `<div class="login"><div class="box"><div class="brand"><div class="mark">${logoMark()}</div><div><b>${esc(S.settings.school)}</b><span>${esc(S.settings.motto)}</span></div></div>
  <h1 style="margin-bottom:14px">Sign in</h1>${storeWarn()}
  <form data-form="login"><div class="field"><label class="f" for="li-user">Username</label><input id="li-user" name="username" type="text" required autocapitalize="none" autocomplete="username"></div>
  <div class="field"><label class="f" for="li-pw">Password</label><input id="li-pw" name="pw" type="password" required autocomplete="current-password"></div>
  <div id="formerr" class="note err hide" role="alert"></div><button class="btn lg" style="margin-top:10px;min-height:48px;font-size:16px" type="submit">Sign in</button></form>
  <p class="muted small" style="margin-top:14px">Administrators see the full system. Gate operators see the scanner only.</p></div></div>`;
}
function adminHTML() {
  const nav = NAVGROUPS.map(([g, ids]) => (g ? `<div class="grp">${g}</div>` : '') + ids.map(id => `<button data-a="go" data-v="${id}" ${view === id ? 'aria-current="page"' : ''}>${NAV[id]}</button>`).join('')).join('');
  return `<div class="app"><aside class="side"><div class="brand"><div class="mark">${logoMark()}</div><div><b>${esc(S.settings.school)}</b><span>ID cards and gate</span></div></div><nav class="nav" aria-label="Main">${nav}</nav>
  <div class="who"><div>${esc(cur.name)}<br><span class="small">${roleLabel(cur.role)}</span></div><button class="btn ghost sm" style="color:#fff;border-color:rgba(255,255,255,.35)" data-a="logout">Sign out</button></div></aside>
  <main class="main" id="main">${storeWarn()}${libWarn()}${(VIEWS[view] || VIEWS.overview)()}</main></div>`;
}
function kioskHTML() {
  return `<div class="kiosk"><header><div class="row"><div class="mark">${logoMark()}</div><div><b>${esc(S.settings.school)}</b><div class="small" style="color:#c7d2e3">Gate attendance · ${esc(cur.name)}</div></div></div><button class="btn ghost sm" style="color:#fff;border-color:rgba(255,255,255,.4)" data-a="logout">Sign out</button></header><div class="body">${storeWarn()}${scannerHTML(true)}</div></div>`;
}

const VIEWS = {};
/* ---------- overview ---------- */
VIEWS.overview = () => {
  const s = todayStats(), st = S.students;
  const activeIds = st.filter(x => x.qr && x.qr.status === 'Active').length, noId = st.filter(x => x.status === 'Active' && !x.qr).length;
  const recent = S.scans.filter(x => dateKey(x.ts) === todayKey()).slice(-8).reverse();
  const start = !st.length ? `<div class="card" style="margin-bottom:16px"><h2>Get started</h2><p class="muted">No students yet. Add students and teachers, generate their ID cards, then scan the QR codes at the gate.</p><div class="row"><button class="btn" data-a="importOpen">Import Excel or CSV</button><button class="btn ghost" data-a="studentForm">Add a student</button><button class="btn ghost" data-a="demoLoad">Load demo students</button></div></div>` : '';
  return head('ID and gate overview', `${dLong(new Date().toISOString())} · ${esc(S.settings.gate)}`, `<button class="btn" data-a="go" data-v="scanner">Open gate scanner</button>`) + start +
    `<div class="tiles">${tile('Total students', s.total, 'gold')}${tile('Teachers checked in', s.tChecked + ' / ' + s.tTotal, 'gold')}${tile('Active ID cards', activeIds)}${tile('IDs not generated', noId, noId ? 'warn' : '')}${tile('Students checked in', s.checkedIn, 'ok')}${tile('Currently in school', s.inSchool, 'ok')}${tile('Exited today', s.exited)}${tile('Not yet checked in', s.notYet)}${tile('Late today', s.late, s.late ? 'warn' : '')}</div>
    <div class="grid g2" style="margin-top:16px"><div class="card"><div class="row between"><h2>Recent scans</h2><button class="btn ghost sm" data-a="go" data-v="today">All activity</button></div>${recent.length ? recent.map(x => { const t = stu(x.studentId); return `<div class="listrow"><span class="t">${t12(x.ts)}</span><div class="grow"><b>${t ? esc(fullName(t)) : 'Unknown code'}</b><div class="muted small">${t ? esc(t.cls) : esc(x.code)}</div></div>${scanBadge(x)}</div>`; }).join('') : empty('No gate activity today', 'Scanned students will appear here.')}</div>
    <div class="card"><h2>How the gate records attendance</h2><div class="stack small"><p style="margin:0">The QR code only identifies the student. The system decides entry or exit and stamps the time itself (${esc(TZ)}); the code never carries a time or a status.</p><p style="margin:0">Opening time <b>${esc(S.settings.opening)}</b> with a <b>${+S.settings.grace} minute</b> grace period: arrivals from <b>${lateFromText()}</b> are marked late. The original scan time is never changed.</p><p style="margin:0">A second scan within <b>${+S.settings.minExit} minutes</b> of entry is treated as an accidental repeat and ignored.</p></div></div></div>`;
};

/* ---------- students and teachers ---------- */
const TSTAT = ['Active', 'On leave', 'Inactive', 'Resigned'];
function filteredPeople(kind) {
  const p = kind === 'teacher' ? 'tch' : 'stu'; const q = ui[p + 'Q'].trim().toLowerCase();
  return S.students.filter(s => {
    if (isTeacher(s) !== (kind === 'teacher')) return false;
    if (q && !(fullName(s).toLowerCase().includes(q) || s.sid.toLowerCase().includes(q))) return false;
    if (kind !== 'teacher' && ui.stuCls && s.cls !== ui.stuCls) return false;
    if (ui[p + 'Stat'] && s.status !== ui[p + 'Stat']) return false;
    const idf = ui[p + 'Id']; if (idf === 'none') return !s.qr; if (idf && (!s.qr || s.qr.status !== idf)) return false;
    return true;
  }).sort((a, b) => a.sid.localeCompare(b.sid));
}
function peopleView(kind) {
  const T = kind === 'teacher', p = T ? 'tch' : 'stu', word = T ? 'teacher' : 'student';
  const list = filteredPeople(kind), pg = pager(p + 'Pg', list.length), total = S.students.filter(s => isTeacher(s) === T).length;
  const rows = pg.slice(list).map(s => `<tr><td>${thumb(s)}</td><td><b>${esc(fullName(s))}</b><div class="muted small">${esc(s.sid)}</div></td><td>${T ? esc(s.dept || '—') : esc(s.cls) + `<div class="muted small">${esc(s.session)}</div>`}</td><td>${stBadge(s.status)}</td><td>${idBadge(s)}</td><td>${gateBadge(statusOf(s))}</td><td class="right"><button class="btn ghost sm" data-a="stuOpen" data-id="${s.id}">Open</button></td></tr>`).join('');
  const stat = T ? [['', 'All'], ...TSTAT] : [['', 'All'], 'Active', 'Inactive', 'Graduated', 'Transferred', 'Suspended'];
  return head(T ? 'Teachers' : 'Students', `${total} on record`, `<button class="btn" data-a="studentForm" data-kind="${word}">Add ${word}</button><button class="btn ghost" data-a="importOpen" data-kind="${word}">Import Excel/CSV</button><button class="btn ghost" data-a="photosOpen">Bulk photos</button>`) +
    `<div class="filters"><div><label class="f" for="fq-${p}">Search</label><input id="fq-${p}" type="search" data-f="${p}Q" data-pg="${p}Pg" value="${esc(ui[p + 'Q'])}" placeholder="Name or ${T ? 'staff' : 'student'} ID"></div>${T ? '' : `<div><label class="f">Class</label>${sel('stuCls', ui.stuCls, classOpts(), 'stuPg')}</div>`}<div><label class="f">${T ? 'Staff' : 'Student'} status</label>${sel(p + 'Stat', ui[p + 'Stat'], stat, p + 'Pg')}</div><div><label class="f">ID card</label>${sel(p + 'Id', ui[p + 'Id'], [['', 'All'], ['none', 'Not generated'], 'Active', 'Suspended', 'Lost', 'Replaced', 'Expired', 'Deactivated'], p + 'Pg')}</div></div>
    <div class="card flush">${list.length ? `<div class="tblwrap"><table class="tbl"><thead><tr><th></th><th>${T ? 'Teacher' : 'Student'}</th><th>${T ? 'Subject / department' : 'Class'}</th><th>Status</th><th>ID card</th><th>Today</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : empty(total ? `No ${word}s match these filters` : `No ${word}s found`, total ? 'Clear a filter to see more.' : `Add ${word}s manually or import an Excel/CSV file.`)}${pg.html}</div>`;
}
VIEWS.students = () => peopleView('student');
VIEWS.teachers = () => peopleView('teacher');
function studentForm(id, kind) {
  const s = id ? stu(id) : null; const T = s ? isTeacher(s) : kind === 'teacher'; const v = k => esc(s ? s[k] || '' : '');
  window._formPhoto = undefined;
  const clsHtml = sections().map(sec => `<optgroup label="${esc(sec)}">${S.classes.filter(c => c.section === sec).map(c => `<option ${s && s.cls === c.name ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</optgroup>`).join('');
  const photo = `<div class="field"><label class="f">Photograph</label><div class="row"><div id="ph-prev">${s && photos.get(s.id) ? `<img class="thumb" style="width:60px;height:80px" alt="" src="${photos.get(s.id)}">` : '<div class="thumb" style="width:60px;height:80px"></div>'}</div><input type="file" accept="image/*" id="ph-file" data-file="formPhoto"><button type="button" class="btn ghost sm ${s && photos.get(s.id) ? '' : 'hide'}" data-a="photoClear" id="ph-clear">Remove photo</button></div><div class="muted small">JPG or PNG. You can position the face before saving.</div></div>`;
  const fields = T ? `<div class="frm">
    <div class="field"><label class="f">Staff ID</label><input type="text" name="sid" value="${v('sid')}" placeholder="Leave blank to auto-generate"></div>
    <div class="field"><label class="f">First name</label><input type="text" name="first" value="${v('first')}" required></div>
    <div class="field"><label class="f">Preferred / short name</label><input type="text" name="pref" value="${v('pref')}" placeholder="Shown on the ID card, if given"></div>
    <div class="field"><label class="f">Middle name</label><input type="text" name="middle" value="${v('middle')}"></div>
    <div class="field"><label class="f">Surname</label><input type="text" name="last" value="${v('last')}" required></div>
    <div class="field"><label class="f">Subject or department</label><input type="text" name="dept" value="${v('dept')}" placeholder="e.g. Mathematics"></div>
    <div class="field"><label class="f">Phone</label><input type="tel" name="phone" value="${v('phone')}"></div>
    <div class="field"><label class="f">Staff status</label><select name="status">${TSTAT.map(x => `<option ${s && s.status === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div></div>` : `<div class="frm">
    <div class="field"><label class="f">Student ID</label><input type="text" name="sid" value="${v('sid')}" placeholder="Leave blank to auto-generate"></div>
    <div class="field"><label class="f">First name</label><input type="text" name="first" value="${v('first')}" required></div>
    <div class="field"><label class="f">Preferred / short name</label><input type="text" name="pref" value="${v('pref')}" placeholder="Shown on the ID card, if given"></div>
    <div class="field"><label class="f">Middle name</label><input type="text" name="middle" value="${v('middle')}"></div>
    <div class="field"><label class="f">Surname</label><input type="text" name="last" value="${v('last')}" required></div>
    <div class="field"><label class="f">Class</label><select name="cls" required><option value="">Select class</option>${clsHtml}</select></div>
    <div class="field"><label class="f">Academic session</label><input type="text" name="session" value="${esc(s ? s.session : S.settings.session)}"></div>
    <div class="field"><label class="f">Student status</label><select name="status">${['Active', 'Inactive', 'Graduated', 'Transferred', 'Suspended'].map(x => `<option ${s && s.status === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
    <div class="field"><label class="f">Phone <span class="muted small">(optional)</span></label><input type="tel" name="phone" value="${v('phone')}"></div>
    <div class="field"><label class="f">Parent/guardian name</label><input type="text" name="guardian" value="${v('guardian')}"></div>
    <div class="field"><label class="f">Parent/guardian phone</label><input type="tel" name="guardianPhone" value="${v('guardianPhone')}"></div></div>`;
  openModal(s ? (T ? 'Edit teacher' : 'Edit student') : (T ? 'Add teacher' : 'Add student'), `<form id="stuform" data-form="student" data-id="${id || ''}" data-kind="${T ? 'teacher' : 'student'}">${fields}${photo}<div id="formerr" class="note err hide" role="alert"></div></form>`,
    `<button class="btn ghost" data-a="close">Cancel</button><button class="btn" type="submit" form="stuform">${s ? 'Save changes' : (T ? 'Add teacher' : 'Add student')}</button>`);
}

/* ---------- profile ---------- */
async function studentModal(id) {
  const s = stu(id); if (!s) return; const T = isTeacher(s);
  const today = statusOf(s); const rec = S.attendance.filter(r => r.studentId === s.id && !r.archived).sort((a, b) => a.entry < b.entry ? 1 : -1);
  const last = rec[0];
  const hist = (s.qrHistory || []).map(h => `<tr><td>QR ${h.version}</td><td>${dShort(dateKey(h.from))} – ${dShort(dateKey(h.to))}</td><td>${badge(esc(h.status), 'mute')}</td><td>${esc(h.reason || '')}</td></tr>`).join('');
  const pref = s.pref ? `<dt>Preferred name</dt><dd>${esc(s.pref)}</dd>` : '';
  const info = T ? `<dt>Staff ID</dt><dd>${esc(s.sid)}</dd>${pref}<dt>Role</dt><dd>Teacher${s.dept ? ' · ' + esc(s.dept) : ''}</dd><dt>Staff status</dt><dd>${stBadge(s.status)}</dd>` : `<dt>Student ID</dt><dd>${esc(s.sid)}</dd>${pref}<dt>Class</dt><dd>${esc(s.cls)} · ${esc(s.section)}</dd><dt>Session</dt><dd>${esc(s.session)}</dd><dt>Student status</dt><dd>${stBadge(s.status)}</dd>`;
  const contact = (T ? `<dt>Phone</dt><dd>${esc(s.phone || '—')}</dd>` : `${s.phone ? `<dt>Phone</dt><dd>${esc(s.phone)}</dd>` : ''}<dt>Guardian</dt><dd>${esc(s.guardian || '—')}${s.guardianPhone ? ' · ' + esc(s.guardianPhone) : ''}</dd>`);
  const body = `<div class="grid g2"><div><div class="cardprev" id="sc-cards"><div class="muted">Drawing card…</div></div>
    <div class="row" style="margin-top:12px">${s.qr ? `<button class="btn sm" data-a="stuPdf" data-id="${s.id}">PDF</button><button class="btn ghost sm" data-a="stuPng" data-id="${s.id}">PNG</button><button class="btn ghost sm" data-a="stuJpg" data-id="${s.id}">JPG</button><button class="btn ghost sm" data-a="stuDocx" data-id="${s.id}">Word</button><button class="btn ghost sm" data-a="stuPrint" data-id="${s.id}">Print</button>` : `<button class="btn" data-a="idGenerate" data-id="${s.id}">Generate ID</button>`}</div></div>
    <div><dl class="kv">${info}<dt>ID card</dt><dd>${idBadge(s)}</dd>
    <dt>QR identifier</dt><dd>${s.qr ? `<code class="qrv">${esc(s.qr.value)}</code> <span class="muted small">version ${s.qr.version}</span>` : '—'}</dd><dt>Generated</dt><dd>${s.idGeneratedAt ? dLong(s.idGeneratedAt) : '—'}</dd>
    <dt>Today at the gate</dt><dd>${gateBadge(today)}</dd><dt>Last gate entry</dt><dd>${last ? `${dShort(last.date)} ${t12m(last.entry)}` : '—'}</dd><dt>Last gate exit</dt><dd>${last && last.exit ? `${dShort(last.date)} ${t12m(last.exit)}` : '—'}</dd>${contact}</dl>
    ${s.qr ? `<div class="row" style="margin-top:14px"><button class="btn ghost sm" data-a="idReplace" data-id="${s.id}">Replace lost ID</button><button class="btn ghost sm" data-a="idRegen" data-id="${s.id}">Regenerate QR</button><button class="btn ghost sm" data-a="idStatus" data-id="${s.id}">Change ID status</button></div>` : ''}
    ${hist ? `<h3 style="margin-top:16px">QR history</h3><div class="tblwrap"><table class="tbl"><tbody>${hist}</tbody></table></div>` : ''}</div></div>`;
  openModal(fullName(s), body, `<button class="btn danger" data-a="stuDelete" data-id="${s.id}" style="margin-right:auto">Delete ${T ? 'teacher' : 'student'}</button><button class="btn ghost" data-a="studentForm" data-id="${s.id}">Edit details</button><button class="btn ghost" data-a="close">Close</button>`, { wide: true, noFocus: true });
  const tpl = tplById(S.settings.defaultTemplate);
  const f = await drawCard(s, tpl, 'front'); let wrap = $('#sc-cards'); if (!wrap) return; wrap.innerHTML = ''; wrap.appendChild(f);
  if (tpl.showBack) { const bk = await drawCard(s, tpl, 'back'); wrap = $('#sc-cards'); if (wrap) wrap.appendChild(bk); }
}

/* ---------- import ---------- */
const IMPORT_MAP = { studentid: 'sid', id: 'sid', matric: 'sid', matricnumber: 'sid', matricno: 'sid', admissionnumber: 'sid', firstname: 'first', middlename: 'middle', lastname: 'last', surname: 'last', section: 'section', class: 'cls', classgroup: 'cls', session: 'session', academicsession: 'session', sex: 'sex', gender: 'sex', dateofbirth: 'dob', dob: 'dob', guardian: 'guardian', guardianname: 'guardian', parent: 'guardian', parentname: 'guardian', guardianphone: 'guardianPhone', parentphone: 'guardianPhone', phone: 'guardianPhone', status: 'status', staffid: 'sid', teacherid: 'sid', staffnumber: 'sid', subject: 'dept', department: 'dept', subjectdepartment: 'dept' };
const normSession = s => { s = String(s || '').trim(); const m = /^(\d{4})\s*[\/-]\s*(\d{2}|\d{4})$/.exec(s); if (!m) return s; return m[1] + '/' + (m[2].length === 2 ? m[1].slice(0, 2) + m[2] : m[2]); };
async function parseImport(file, kind) {
  if (typeof XLSX === 'undefined') throw new Error('The Excel library did not load. Reload the page and try again.');
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
  const seen = new Set(S.students.map(s => s.sid.toUpperCase())); const inFile = new Set();
  const rows = raw.map((r, i) => {
    const o = { _row: i + 2 }; Object.keys(r).forEach(k => { const m = IMPORT_MAP[String(k).toLowerCase().replace(/[^a-z]/g, '')]; if (m) { let v = r[k]; if (v instanceof Date) v = v.toISOString().slice(0, 10); o[m] = String(v).trim(); } });
    const err = []; const T = kind === 'teacher'; o.kind = T ? 'teacher' : 'student';
    if (!o.first) err.push('First name is missing'); if (!o.last) err.push('Last name is missing'); if (!T && !o.cls) err.push('Class is missing');
    const cl = T ? null : S.classes.find(c => c.name.toLowerCase() === String(o.cls || '').replace(/\s+/g, '').toLowerCase());
    if (!T && o.cls && !cl) err.push(`Class “${o.cls}” is not set up`); else if (cl) { o.cls = cl.name; o.section = cl.section; }
    if (T) { o.cls = 'Teacher'; o.section = 'Teaching staff'; o.phone = o.guardianPhone || ''; }
    o.session = T ? '' : (normSession(o.session) || S.settings.session);
    if (o.sid) { const k = o.sid.toUpperCase(); if (seen.has(k)) err.push('ID already exists'); else if (inFile.has(k)) err.push('Duplicate ID in this file'); inFile.add(k); }
    o.err = err; return o;
  });
  return { file: file.name, rows, kind: kind === 'teacher' ? 'teacher' : 'student' };
}
function importBody() {
  const im = ui.imp;
  if (!im) return `<p>Upload an Excel (.xlsx) or CSV file. ${ui.impKind === 'teacher' ? 'Required columns: <b>Staff ID, First Name, Last Name</b>. Optional: Middle Name, Subject, Sex, Date of Birth, Phone.' : 'Required columns: <b>Student ID, First Name, Last Name, Class</b>. Optional: Middle Name, Section, Session, Sex, Date of Birth, Guardian, Guardian Phone.'}</p><div class="dz" id="impdz"><input type="file" accept=".xlsx,.xls,.csv" id="impfile" data-file="import"><p style="margin:8px 0 0" class="small">Nothing is imported until you review the preview.</p></div><p style="margin-top:12px"><button class="btn ghost sm" data-a="importTemplate">Download spreadsheet template</button></p>`;
  const valid = im.rows.filter(r => !r.err.length), bad = im.rows.filter(r => r.err.length);
  return `<div class="tiles" style="margin-bottom:14px">${tile(im.kind === 'teacher' ? 'Teachers found' : 'Students found', im.rows.length)}${tile('Valid', valid.length, 'ok')}${tile('Need fixing', bad.length, bad.length ? 'err' : '')}${tile('Photos needed', valid.length, 'warn')}</div>
  ${bad.length ? `<div class="note err" style="margin-bottom:12px">${bad.length} record${bad.length > 1 ? 's' : ''} will not be imported until fixed. Correct the spreadsheet and upload it again, or import the valid records now.</div><div class="tblwrap card flush" style="margin-bottom:12px;max-height:220px;overflow:auto"><table class="tbl"><thead><tr><th>Row</th><th>Student</th><th>Problem</th></tr></thead><tbody>${bad.slice(0, 100).map(r => `<tr><td>${r._row}</td><td>${esc((r.first || '') + ' ' + (r.last || ''))} <span class="muted small">${esc(r.sid || '')}</span></td><td>${r.err.map(esc).join('; ')}</td></tr>`).join('')}</tbody></table></div>` : `<div class="note" style="margin-bottom:12px">All records are valid. Photographs can be added after the import (Bulk photos).</div>`}
  <div class="tblwrap card flush" style="max-height:220px;overflow:auto"><table class="tbl"><thead><tr><th>ID</th><th>Name</th><th>${im.kind === 'teacher' ? 'Subject' : 'Class'}</th><th>${im.kind === 'teacher' ? 'Phone' : 'Session'}</th></tr></thead><tbody>${valid.slice(0, 60).map(r => `<tr><td>${esc(r.sid)}</td><td>${esc(r.first + ' ' + r.last)}</td><td>${esc(im.kind === 'teacher' ? (r.dept || '') : r.cls)}</td><td>${esc(im.kind === 'teacher' ? (r.phone || '') : r.session)}</td></tr>`).join('')}</tbody></table></div>`;
}
function importOpen(kind) {
  ui.imp = null; ui.impKind = kind === 'teacher' ? 'teacher' : 'student';
  openModal(ui.impKind === 'teacher' ? 'Import teachers' : 'Import students', `<div id="impbody">${importBody()}</div>`, `<button class="btn ghost" data-a="close">Cancel</button><button class="btn hide" id="impgo" data-a="importGo">Import valid records</button>`, { wide: true, noFocus: true });
}
function importRefresh() { $('#impbody').innerHTML = importBody(); const v = ui.imp ? ui.imp.rows.filter(r => !r.err.length).length : 0; const b = $('#impgo'); b.classList.toggle('hide', !ui.imp); b.disabled = !v; b.textContent = `Import ${v} valid record${v === 1 ? '' : 's'}`; }

/* ---------- bulk photos ---------- */
function photosOpen() {
  openModal('Bulk photograph upload', `<p>Name each file with the student’s ID, for example <code class="qrv">GE-2026-0001.jpg</code> for GE/2026/0001. Photos are cropped to a 3:4 portrait and compressed automatically.</p><div class="dz" id="phdz"><input type="file" accept="image/*" multiple id="phfiles" data-file="bulkPhotos"><p class="small" style="margin:8px 0 0">Choose several files at once, or drag them here.</p></div><div id="phres" style="margin-top:14px"></div>`, `<button class="btn ghost" data-a="close">Close</button>`, { noFocus: true });
}
async function bulkPhotos(files) {
  const res = $('#phres'); const idx = new Map(S.students.map(s => [s.sid.replace(/[^a-z0-9]/gi, '').toLowerCase(), s])); const ok = [], no = [];
  res.innerHTML = `<div class="progress"><i id="phbar"></i></div><p class="small muted" id="phtxt">Processing…</p>`;
  for (let i = 0; i < files.length; i++) {
    const f = files[i]; const key = f.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]/gi, '').toLowerCase(); const st = idx.get(key);
    if (st) { const url = URL.createObjectURL(f); const img = await loadImgRaw(url); URL.revokeObjectURL(url); if (img) { setPhoto(st.id, autoCrop(img)); ok.push(st); audit('Photograph uploaded', st.sid, f.name); } else no.push(f.name + ' (not an image)'); } else no.push(f.name);
    $('#phbar').style.width = Math.round((i + 1) / files.length * 100) + '%'; $('#phtxt').textContent = `${i + 1} / ${files.length}`; await tick();
  }
  save();
  res.innerHTML = `<div class="tiles">${tile('Matched', ok.length, 'ok')}${tile('Unmatched', no.length, no.length ? 'warn' : '')}</div>${no.length ? `<h3 style="margin-top:14px">Unmatched files</h3><p class="small muted">No student ID matches these file names.</p><ul class="small">${no.slice(0, 80).map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}`;
  render();
}

/* ---------- designer ---------- */
function draftTpl() {
  if (!ui.tplId || !S.templates.find(t => t.id === ui.tplId)) { ui.tplId = S.settings.defaultTemplate; ui.draft = null; }
  if (!ui.draft) ui.draft = JSON.parse(JSON.stringify(tplById(ui.tplId)));
  return ui.draft;
}
VIEWS.designer = () => {
  const d = draftTpl();
  const col = (k, l) => `<div class="field"><label class="f" for="t-${k}">${l}</label><input id="t-${k}" type="color" data-t="${k}" value="${esc(d[k])}"></div>`;
  const studs = S.students.slice(0, 40);
  return head('ID card designer', 'Changes appear in the live preview. Saved templates apply to every new card.', `<button class="btn ghost" data-a="tplSaveNew">Save as new</button><button class="btn ghost" data-a="tplDefault">Set as default</button><button class="btn" data-a="tplSave">Save changes</button>`) +
    `<div class="grid" style="grid-template-columns:minmax(0,340px) minmax(0,1fr);align-items:start" id="dgrid"><div class="card"><div class="field"><label class="f" for="tplsel">Template</label><select id="tplsel" data-a="tplPick">${S.templates.map(t => `<option value="${t.id}" ${t.id === ui.tplId ? 'selected' : ''}>${esc(t.name)}${t.id === S.settings.defaultTemplate ? ' (default)' : ''}</option>`).join('')}</select></div>
    <div class="field"><label class="f" for="t-name">Template name</label><input id="t-name" type="text" data-t="name" value="${esc(d.name)}"></div>
    <div class="field"><label class="f" for="t-school">School name</label><input id="t-school" type="text" data-t="school" value="${esc(d.school ?? S.settings.school)}"></div>
    <div class="field"><label class="f" for="t-motto">Motto</label><input id="t-motto" type="text" data-t="motto" value="${esc(d.motto ?? S.settings.motto)}"></div>
    <div class="frm" style="grid-template-columns:1fr 1fr">${col('headerBg', 'Header')}${col('headerText', 'Header text')}${col('mottoColor', 'Motto')}${col('bodyBg', 'Background')}${col('accent', 'Border and accents')}${col('nameColor', 'Student name')}${col('subColor', 'Student ID text')}${col('textColor', 'Other text')}</div>
    <div class="field"><label class="f" for="t-font">Font</label><select id="t-font" data-t="font">${Object.keys(FONTS).map(f => `<option ${d.font === f ? 'selected' : ''}>${f}</option>`).join('')}</select></div>
    <div class="field"><label class="f" for="t-scale">Text size</label><input id="t-scale" type="range" min="0.8" max="1.15" step="0.01" data-t="scale" value="${d.scale}"></div>
    <div class="frm" style="grid-template-columns:1fr 1fr"><div class="field"><label class="f" for="t-photoPos">Photo position</label><select id="t-photoPos" data-t="photoPos"><option value="left" ${d.photoPos === 'left' ? 'selected' : ''}>Left</option><option value="right" ${d.photoPos === 'right' ? 'selected' : ''}>Right</option></select></div><div class="field"><label class="f" for="t-qrPos">QR position</label><select id="t-qrPos" data-t="qrPos"><option value="right" ${d.qrPos === 'right' ? 'selected' : ''}>Right</option><option value="left" ${d.qrPos === 'left' ? 'selected' : ''}>Left</option></select></div></div>
    <div class="field"><label><input type="checkbox" data-t="border" ${d.border ? 'checked' : ''}> Gold border around the card</label></div>
    <div class="field"><label><input type="checkbox" data-t="showBack" ${d.showBack ? 'checked' : ''}> Include the back of the card</label></div>
    <div class="field"><label class="f">School logo</label><div class="row"><input type="file" accept="image/*" data-file="logo"><button class="btn ghost sm ${S.settings.logo ? '' : 'hide'}" data-a="logoClear">Remove</button></div><div class="muted small">Without a logo the card shows a “GE” monogram. Upload the official Great Emvic logo here.</div></div>
    <p class="muted small" style="margin:0">Card size is the standard CR80 (85.6 × 53.98 mm). The QR keeps a white quiet zone and cannot be covered by other elements.</p></div>
    <div><div class="card"><div class="row between" style="margin-bottom:10px"><h2 style="margin:0">Live preview</h2><div class="row"><label class="small"><input type="checkbox" id="guides" ${ui.guides ? 'checked' : ''}> Safe-area guides</label><select id="prevsel" aria-label="Preview student" style="width:auto"><option value="">Sample student</option>${studs.map(s => `<option value="${s.id}" ${ui.prev === s.id ? 'selected' : ''}>${esc(fullName(s))}</option>`).join('')}</select></div></div><div class="cardprev" id="dprev"><div class="muted">Drawing preview…</div></div></div></div></div>`;
};
let dpT = null;
function designerRepaint() { clearTimeout(dpT); dpT = setTimeout(async () => { const w = $('#dprev'); if (!w) return; const d = ui.draft; const st = ui.prev && stu(ui.prev) ? stu(ui.prev) : sampleStudent(); const f = await drawCard(st, d, 'front'); if (ui.guides) { const g = f.getContext('2d'); g.save(); g.setLineDash([10, 8]); g.lineWidth = 2; g.strokeStyle = 'rgba(220,53,69,.85)'; g.strokeRect(30, 30, CW - 60, CH - 60); g.restore(); } const w2 = $('#dprev'); if (!w2) return; w2.innerHTML = ''; w2.appendChild(f); if (d.showBack) w2.appendChild(await drawCard(st, d, 'back')); }, 40); }

/* ---------- generate ---------- */
function genScopes() {
  const o = [['all', 'All active students'], ['kind:teacher', 'All active teachers']]; sections().forEach(sec => o.push(['sec:' + sec, sec]));
  Array.from(new Set(S.classes.map(c => c.level))).forEach(l => o.push(['lvl:' + l, `All ${l} students`])); S.classes.forEach(c => { if (c.name !== c.level) o.push(['cls:' + c.name, `Class ${c.name}`]); }); return o;
}
function genSelect() {
  const g = ui.gen; const [k, v] = g.scope === 'all' ? ['all', ''] : g.scope.split(/:(.*)/s);
  return S.students.filter(s => s.status === 'Active' && (k === 'kind' ? isTeacher(s) : (!isTeacher(s) && (k === 'all' || (k === 'sec' && s.section === v) || (k === 'lvl' && (s.level || levelOf(s.cls)) === v) || (k === 'cls' && s.cls === v)))) && (!g.onlyNew || !s.qr));
}
VIEWS.generate = () => {
  const g = ui.gen; g.tplId = g.tplId || S.settings.defaultTemplate; const list = genSelect(); const noPhoto = list.filter(s => !photos.get(s.id)).length; const r = g.result;
  return head('Generate ID cards', 'Create every card for a class, level or the whole school in one step.') +
    `<div class="grid g2"><div class="card"><h2>1. Choose students</h2><div class="field"><label class="f">Who</label>${sel('gen.scope', g.scope, genScopes())}</div><div class="field"><label><input type="checkbox" data-f="gen.onlyNew" ${g.onlyNew ? 'checked' : ''}> Only students who do not have an ID card yet</label></div>
    <p><b>${list.length}</b> student${list.length === 1 ? '' : 's'} selected${noPhoto ? ` · <span style="color:#B26A00">${noPhoto} without a photograph (a silhouette is used)</span>` : ''}.</p></div>
    <div class="card"><h2>2. Template and print layout</h2><div class="field"><label class="f">Template</label>${sel('gen.tplId', g.tplId, S.templates.map(t => [t.id, t.name]))}</div>
    <div class="field"><label class="f">Layout</label>${sel('gen.layout', g.layout, [['single', 'One card per page (card-sized page)'], ['4', 'A4 · 4 cards per page'], ['6', 'A4 · 6 cards per page'], ['8', 'A4 · 8 cards per page'], ['10', 'A4 · 10 cards per page'], ['custom', 'A4 · custom grid']])}</div>
    ${g.layout === 'custom' ? `<div class="frm" style="grid-template-columns:1fr 1fr"><div class="field"><label class="f">Columns (1–2)</label><input type="number" min="1" max="2" data-f="gen.cols" value="${g.cols}"></div><div class="field"><label class="f">Rows (1–5)</label><input type="number" min="1" max="5" data-f="gen.rows" value="${g.rows}"></div></div>` : ''}
    <div class="field"><label><input type="checkbox" data-f="gen.back" ${g.back ? 'checked' : ''}> Include the back of each card</label></div></div></div>
    <div class="card" style="margin-top:14px"><div class="row between"><div><h2 style="margin:0">3. Generate</h2><p class="muted small" style="margin:4px 0 0">Students without a QR code receive a new unique one. Existing active QR codes are kept.</p></div><button class="btn gold" data-a="genRun" ${list.length ? '' : 'disabled'} id="genbtn">Generate ${list.length} ID card${list.length === 1 ? '' : 's'}</button></div>
    <div id="genprog" class="hide" style="margin-top:14px"><div class="progress"><i id="genbar"></i></div><p class="small muted" id="gentxt" style="margin:6px 0 0"></p></div>
    <div id="genres">${r ? genResultHTML() : ''}</div></div>`;
};
function genResultHTML() {
  const r = ui.gen.result;
  return `<div class="note" style="margin-top:14px"><b>${r.items.length} ID card${r.items.length === 1 ? '' : 's'} generated</b> (${esc(r.label)}, ${esc(r.tpl.name)}).${r.skipped ? ` ${r.skipped} skipped because the ID card is not active.` : ''}</div>
  <div class="row" style="margin-top:12px"><button class="btn" data-a="genPdf">Download PDF</button><button class="btn ghost" data-a="genDocx">Download Word</button><button class="btn ghost" data-a="genZip" data-fmt="png">PNG images (ZIP)</button><button class="btn ghost" data-a="genZip" data-fmt="jpg">JPG images (ZIP)</button><button class="btn ghost" data-a="genPrint">Print preview</button></div>`;
}

/* ---------- QR management ---------- */
VIEWS.qr = () => {
  const q = ui.qrQ.trim().toLowerCase();
  const list = S.students.filter(s => { if (q && !(fullName(s).toLowerCase().includes(q) || s.sid.toLowerCase().includes(q) || (s.qr && s.qr.value.toLowerCase().includes(q)))) return false; if (ui.qrStat === 'none') return !s.qr; if (ui.qrStat && (!s.qr || s.qr.status !== ui.qrStat)) return false; return true; }).sort((a, b) => a.sid.localeCompare(b.sid));
  const pg = pager('qrPg', list.length);
  const rows = pg.slice(list).map(s => `<tr><td><b>${esc(fullName(s))}</b><div class="muted small">${esc(s.sid)} · ${isTeacher(s) ? 'Teacher' : esc(s.cls)}</div></td><td>${s.qr ? `<code class="qrv">${esc(s.qr.value)}</code>` : '—'}</td><td class="num">${s.qr ? s.qr.version : '—'}</td><td>${idBadge(s)}</td><td>${s.qr ? dShort(dateKey(s.qr.from)) : '—'}</td><td class="right"><div class="row" style="justify-content:flex-end">${s.qr ? `<button class="btn ghost sm" data-a="idReplace" data-id="${s.id}">Replace</button><button class="btn ghost sm" data-a="idRegen" data-id="${s.id}">Regenerate</button><button class="btn ghost sm" data-a="idStatus" data-id="${s.id}">Status</button>` : `<button class="btn sm" data-a="idGenerate" data-id="${s.id}">Generate</button>`}</div></td></tr>`).join('');
  return head('QR management', 'Each active card has one unique, unguessable identifier. It contains no personal information.') +
    `<div class="filters"><div><label class="f" for="qq">Search</label><input id="qq" type="search" data-f="qrQ" data-pg="qrPg" value="${esc(ui.qrQ)}" placeholder="Name, student ID or QR code"></div><div><label class="f">ID status</label>${sel('qrStat', ui.qrStat, [['', 'All'], ['none', 'Not generated'], 'Active', 'Suspended', 'Lost', 'Replaced', 'Expired', 'Deactivated'], 'qrPg')}</div></div>
    <div class="card flush">${list.length ? `<div class="tblwrap"><table class="tbl"><thead><tr><th>Student</th><th>QR identifier</th><th class="num">Version</th><th>Status</th><th>Issued</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : empty('No matching students', 'Adjust the search or status filter.')}${pg.html}</div>`;
};

/* ---------- gate scanner (shared by admin and operator) ---------- */
const scan = { active: false, stream: null, timer: 0, busy: false, last: '', lastAt: 0, facing: 'environment', hideT: 0, cv: null };
function gstats() { const s = todayStats(); return tile('Students in', s.checkedIn, 'ok') + tile('Teachers in', s.tChecked, 'ok') + tile('Inside now', s.inSchool) + tile('Exited', s.exited); }
function feedRows() { return S.scans.filter(x => dateKey(x.ts) === todayKey()).slice(-10).reverse().map(x => { const t = stu(x.studentId); return { ts: x.ts, name: t ? fullName(t) : '', cls: t ? t.cls : '', code: x.code, result: x.result, note: x.note }; }); }
function gfeedHTML() {
  const rows = feedRows();
  return rows.length ? rows.map(x => `<div class="listrow"><span class="t">${t12(x.ts)}</span><div class="grow"><b>${x.name ? esc(x.name) : 'Unknown code'}</b><div class="muted small">${x.name ? esc(x.cls) : esc(x.code)}</div></div>${scanBadge(x)}</div>`).join('') : empty('No gate activity today', 'Scanned students will appear here.');
}
function scannerHTML(kiosk) {
  return `<div class="gate">${kiosk ? `<h1 style="margin-bottom:2px">Gate attendance</h1><p class="muted">${dLong(new Date().toISOString())} · ${esc(S.settings.gate)}</p>` : head('Gate scanner', `${dLong(new Date().toISOString())} · ${esc(S.settings.gate)}`)}
  <div class="tiles" id="gstats">${gstats()}</div>
  <div id="gcamwrap" class="hide" style="margin-top:14px"><div class="cam"><video id="cam" playsinline muted></video><div class="frame"></div><div id="gcamstate" class="camstate hide"></div></div><p id="gdiag" class="muted small" style="margin:8px 0 0" aria-live="polite"></p><div class="row" style="margin-top:10px"><button class="btn ghost" data-a="camSwitch">Switch camera</button><button class="btn ghost" data-a="camStop">Stop camera</button></div></div>
  <div style="margin-top:14px"><button class="btn lg gold" id="gstart" data-a="camStart">Scan student ID</button></div>
  <details class="card" style="margin-top:14px"><summary style="cursor:pointer;font-weight:600">Can’t scan a card? Search for a student</summary><div style="margin-top:12px"><div class="field"><label class="f" for="msq">Name or student ID</label><input id="msq" type="search" data-m="q" autocomplete="off" placeholder="Start typing…"></div><div id="msres"></div>
  <div class="field" style="margin-top:12px"><label class="f" for="mphoto">Or take a photo of the QR code</label><input id="mphoto" type="file" accept="image/*" capture="environment" data-file="scanPhoto"><div class="muted small">Useful if the live camera cannot read a card.</div></div><div class="field" style="margin-top:12px"><label class="f" for="mcode">Or type the code</label><div class="row"><input id="mcode" type="text" autocapitalize="characters" autocomplete="off" placeholder="GE-ID-…" style="flex:1 1 180px"><button class="btn" data-a="manualCode">Record</button></div></div></div></details>
  <div class="card" style="margin-top:14px"><h2>Today’s activity</h2><div id="gfeed">${gfeedHTML()}</div></div>
  <div id="gover" class="result hide" style="position:fixed;z-index:80;cursor:pointer" data-a="overClose" role="alert"></div></div>`;
}
VIEWS.scanner = () => scannerHTML(false);
function camMsg(html) { const el = $('#gcamstate'); if (!el) return; el.innerHTML = html; el.classList.toggle('hide', !html); }
function stopStream() { if (scan.stream) { scan.stream.getTracks().forEach(t => t.stop()); scan.stream = null; } }
function camStop(keepUI) { scan.active = false; clearTimeout(scan.timer); stopStream(); const v = $('#cam'); if (v) v.srcObject = null; if (!keepUI) { const w = $('#gcamwrap'), b = $('#gstart'); if (w) w.classList.add('hide'); if (b) b.classList.remove('hide'); } }
function camFail(e) {
  const n = e && e.name; scan.active = false; stopStream(); let t, m;
  if (n === 'NotAllowedError' || n === 'SecurityError') { t = 'Camera access required'; m = 'Please allow camera access in your browser or device settings to use the QR scanner.'; }
  else if (n === 'NotFoundError' || n === 'NotSupportedError' || n === 'OverconstrainedError' || n === 'NotReadableError') { t = 'Camera not available'; m = 'Please check the device camera or use another supported device. You can still search for a student below.'; }
  else { t = 'Camera could not start'; m = 'Try again, or search for the student below.'; }
  camMsg(`<div><b style="font-size:18px">${t}</b><p style="margin:8px 0 14px">${m}</p><button class="btn gold" data-a="camStart">Try again</button></div>`);
}
async function camStart() {
  if (scan.active) return;
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.resume) actx.resume(); } catch (e) { }
  $('#gcamwrap').classList.remove('hide'); $('#gstart').classList.add('hide'); camMsg('Starting camera…');
  try {
    if (typeof ensureLibs === 'function' && typeof jsQR === 'undefined') await ensureLibs();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw { name: window.isSecureContext === false ? 'SecurityError' : 'NotSupportedError' };
    stopStream();
    scan.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: scan.facing }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
    const v = $('#cam'); if (!v) { stopStream(); return; }
    v.srcObject = scan.stream; await v.play();
    scan.bd = null; try { if ('BarcodeDetector' in window) scan.bd = new BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { scan.bd = null; }
    if (!scan.bd && typeof jsQR === 'undefined') { stopStream(); camMsg('<div><b style="font-size:18px">QR reader not loaded</b><p style="margin:8px 0 14px">The QR reading component could not be downloaded. Check the internet connection, then tap Try again. You can still search for the student below.</p><button class="btn gold" data-a="camStart">Try again</button></div>'); return; }
    camMsg(''); scan.active = true; diag('Camera ready. Hold the ID card inside the frame.'); scanLoop();
  } catch (e) { camFail(e); }
}
const diag = t => { const d = $('#gdiag'); if (d) d.textContent = t; };
async function decodeFrame(v) {
  if (scan.bd) { try { const r = await scan.bd.detect(v); if (r && r[0] && r[0].rawValue) return r[0].rawValue; } catch (e) { } }
  if (typeof jsQR === 'undefined') return null;
  const cv = scan.cv || (scan.cv = document.createElement('canvas')); const k = Math.min(1, 1100 / Math.max(v.videoWidth, v.videoHeight));
  cv.width = Math.round(v.videoWidth * k); cv.height = Math.round(v.videoHeight * k);
  const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(v, 0, 0, cv.width, cv.height);
  const img = g.getImageData(0, 0, cv.width, cv.height); const r = jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' });
  return r && r.data ? r.data : null;
}
async function scanLoop() {
  clearTimeout(scan.timer); if (!scan.active) return;
  const v = $('#cam'); if (!v) { camStop(true); return; }
  if (v.readyState >= 2 && v.videoWidth && !scan.busy) {
    let code = null; try { code = await decodeFrame(v); } catch (e) { }
    if (!scan.active) return;
    scan.frames = (scan.frames || 0) + 1; if (scan.frames === 40) diag('Still looking… move the card closer, keep it flat and well lit.');
    if (code) { const now = Date.now(); if (!(code === scan.last && now - scan.lastAt < 4000)) { scan.last = code; scan.lastAt = now; scan.frames = 0; diag('Code read.'); runRecord({ code }); } }
  }
  scan.timer = setTimeout(scanLoop, 60);
}
async function decodeImageFile(file) {
  const url = URL.createObjectURL(file); const img = await loadImgRaw(url); URL.revokeObjectURL(url); if (!img) return null;
  if (typeof ensureLibs === 'function' && typeof jsQR === 'undefined' && !('BarcodeDetector' in window)) await ensureLibs();
  const k = Math.min(1, 1600 / Math.max(img.width, img.height)); const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
  const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, cv.width, cv.height);
  try { if ('BarcodeDetector' in window) { const r = await new BarcodeDetector({ formats: ['qr_code'] }).detect(cv); if (r && r[0] && r[0].rawValue) return r[0].rawValue; } } catch (e) { }
  if (typeof jsQR === 'undefined') return null;
  const d = g.getImageData(0, 0, cv.width, cv.height); const r = jsQR(d.data, d.width, d.height, { inversionAttempts: 'attemptBoth' }); return r && r.data ? r.data : null;
}
let actx = null;
function beep(kind) {
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(); o.connect(g); g.connect(actx.destination); o.frequency.value = { ok: 880, exit: 660, warn: 440, err: 220 }[kind] || 440; g.gain.value = 0.07; o.start(); o.stop(actx.currentTime + (kind === 'err' ? 0.35 : 0.12)); } catch (e) { }
  try { if (navigator.vibrate) navigator.vibrate(kind === 'err' ? [120, 60, 120] : 60); } catch (e) { }
}
function overContent(res) {
  const st = res.student, r = res.rec; const ph = st && photos.get(st.id) ? `<img class="ph" alt="" src="${photos.get(st.id)}">` : '';
  const who = st ? `${ph}<div class="nm">${esc(displayName(st))}</div><div class="ln">${esc(st.sid)}</div><div class="ln">${esc(st.cls)} · ${esc(st.section)}</div>` : '';
  switch (res.kind) {
    case 'ENTRY': return ['ok', 'ok', `<div class="big">✓ ENTRY RECORDED</div>${who}<div class="tm">${t12(r.entry)}</div><div class="ln">${r.late ? `LATE · ${r.lateMin} min after opening` : 'ON TIME'} · IN SCHOOL</div>`];
    case 'EXIT': return ['exit', 'exit', `<div class="big">✓ EXIT RECORDED</div>${who}<div class="ln">Entry ${t12(r.entry)}</div><div class="tm">Exit ${t12(r.exit)}</div><div class="ln">Time on premises: ${durLong(r.dur)}</div><div class="ln">LEFT SCHOOL</div>`];
    case 'DUP_IN': return ['warn', 'warn', `<div class="big">ALREADY CHECKED IN</div>${who}<div class="ln">Today’s entry: ${t12(r.entry)}</div><div class="ln">Current status: IN SCHOOL</div>`];
    case 'DUP_OUT': return ['warn', 'warn', `<div class="big">ALREADY CHECKED OUT</div>${who}<div class="ln">Entry ${t12(r.entry)} · Exit ${t12(r.exit)}</div>`];
    case 'INACTIVE_ID': return ['err', 'err', `<div class="big">⚠ ID CARD NOT ACTIVE</div><div class="ln">This student ID card has been deactivated.<br>Please contact school administration.</div>${st ? `<div class="ln" style="margin-top:8px">${esc(fullName(st))}</div>` : ''}`];
    case 'INACTIVE_STUDENT': return ['err', 'err', `<div class="big">STUDENT NOT ACTIVE</div>${who}<div class="ln">Attendance cannot be recorded.<br>Please contact administration.</div>`];
    case 'OFFLINE': return ['err', 'err', `<div class="big">⚠ CONNECTION LOST</div><div class="ln">Attendance has NOT been confirmed.<br>Reconnect to the internet before continuing.</div>`];
    case 'ERROR': return ['err', 'err', `<div class="big">⚠ NOT CONFIRMED</div><div class="ln">Something went wrong while recording this scan.<br>The attendance was NOT confirmed. Please try again.</div>`];
    default: return ['err', 'err', `<div class="big">⚠ INVALID STUDENT ID</div><div class="ln">This QR code could not be verified.<br>Please contact school administration.</div>`];
  }
}
function showOver(res) {
  const el = $('#gover'); if (!el) { scan.busy = false; return; }
  const [cls, snd, html] = overContent(res); el.className = 'result ' + cls; el.style.position = 'fixed'; el.style.zIndex = 80; el.innerHTML = html; beep(snd);
  clearTimeout(scan.hideT); scan.hideT = setTimeout(hideOver, snd === 'err' ? 3200 : 2200);
}
function hideOver() {
  clearTimeout(scan.hideT); const el = $('#gover'); if (el) { el.className = 'result hide'; el.innerHTML = ''; }
  scan.busy = false; const s = $('#gstats'), f = $('#gfeed'); if (s) s.innerHTML = gstats(); if (f) f.innerHTML = gfeedHTML();
}
async function runRecord(input) {
  if (scan.busy) return; scan.busy = true;
  let res;
  try { need('gate.scan'); res = recordScan(input, cur); const ok = await flush(); if (!ok && IDBK.ok) res = { kind: 'ERROR' }; } catch (e) { console.error(e); res = { kind: 'ERROR' }; }
  showOver(res);
}

VIEWS.today = () => {
  const f = ui;
  const rows = S.scans.filter(x => dateKey(x.ts) === todayKey()).filter(x => {
    const t = stu(x.studentId);
    if (f.todayAct === 'ENTRY' && x.result !== 'ENTRY') return false; if (f.todayAct === 'EXIT' && x.result !== 'EXIT') return false;
    if (f.todayAct === 'LATE' && !(x.result === 'ENTRY' && x.note === 'late')) return false; if (f.todayAct === 'DUP' && x.action !== 'DUPLICATE') return false;
    if (f.todayAct === 'INVALID' && !['INVALID', 'INACTIVE_ID', 'INACTIVE_STUDENT'].includes(x.result)) return false;
    if (f.todayOp && x.operator !== f.todayOp) return false; if (f.todayCls && (!t || t.cls !== f.todayCls)) return false; if (f.todaySec && (!t || t.section !== f.todaySec)) return false; return true;
  }).reverse();
  const pg = pager('todayPg', rows.length, 30); const ops = Array.from(new Set(S.scans.map(x => x.operator)));
  const act = x => x.result === 'ENTRY' ? 'Entry' : x.result === 'EXIT' ? 'Exit' : x.action === 'DUPLICATE' ? 'Repeat scan' : 'Scan rejected';
  return head("Today's gate activity", dLong(new Date().toISOString())) +
    `<div class="filters"><div><label class="f">Show</label>${sel('todayAct', f.todayAct, [['', 'All scans'], ['ENTRY', 'Entries'], ['EXIT', 'Exits'], ['LATE', 'Late arrivals'], ['DUP', 'Repeat scans'], ['INVALID', 'Invalid or inactive']], 'todayPg')}</div><div><label class="f">Operator</label>${sel('todayOp', f.todayOp, [['', 'All operators'], ...ops], 'todayPg')}</div><div><label class="f">Class</label>${sel('todayCls', f.todayCls, classOpts(), 'todayPg')}</div><div><label class="f">Section</label>${sel('todaySec', f.todaySec, [['', 'All sections'], ...sections()], 'todayPg')}</div></div>
    <div class="card flush">${rows.length ? `<div class="tblwrap"><table class="tbl"><thead><tr><th>Time</th><th>Student</th><th>ID</th><th>Class</th><th>Action</th><th>Status</th><th>Operator</th></tr></thead><tbody>${pg.slice(rows).map(x => { const t = stu(x.studentId); return `<tr><td class="num">${t12(x.ts)}</td><td>${t ? esc(fullName(t)) : '<span class="muted">Unknown code</span>'}</td><td>${t ? esc(t.sid) : `<code class="qrv">${esc(x.code)}</code>`}</td><td>${t ? esc(t.cls) : '—'}</td><td>${act(x)}</td><td>${scanBadge(x)}</td><td>${esc(x.operator)}</td></tr>`; }).join('')}</tbody></table></div>` : empty('No gate activity today', 'Scanned students will appear here.')}${pg.html}</div>`;
};

/* ---------- gate attendance ---------- */
function attF() { if (!ui.att) ui.att = { from: monthStart(), to: todayKey(), kind: '', q: '', cls: '', section: '', session: '', exit: '', late: '', op: '', arch: '' }; return ui.att; }
function filterAtt(f) {
  const q = f.q.trim().toLowerCase();
  return S.attendance.filter(r => {
    if (f.arch === '' && r.archived) return false; if (f.arch === 'only' && !r.archived) return false;
    if (f.from && r.date < f.from) return false; if (f.to && r.date > f.to) return false;
    const st = stu(r.studentId) || {}; const rk = r.kind || (isTeacher(st) ? 'teacher' : 'student'); if (f.kind && rk !== f.kind) return false; const cls = r.cls || st.cls, sec = r.section || st.section, ses = r.session || st.session;
    if (q && !((fullName(st).toLowerCase().includes(q)) || String(st.sid || '').toLowerCase().includes(q))) return false;
    if (f.cls && cls !== f.cls) return false; if (f.section && sec !== f.section) return false; if (f.session && ses !== f.session) return false;
    if (f.exit === 'yes' && !r.exit) return false; if (f.exit === 'no' && r.exit) return false;
    if (f.late === 'late' && !r.late) return false; if (f.late === 'ontime' && r.late) return false;
    if (f.op && r.entryOp !== f.op && r.exitOp !== f.op) return false; return true;
  }).sort((a, b) => a.entry < b.entry ? 1 : -1);
}
function attRows(list) {
  return list.map(r => { const st = stu(r.studentId) || {}; const T = (r.kind || (isTeacher(st) ? 'teacher' : 'student')) === 'teacher'; return { 'Date': dShort(r.date), 'Day': dayOf(r.date), 'Type': T ? 'Teacher' : 'Student', 'ID Number': st.sid || '', 'Name': fullName(st), 'Section': r.section || st.section || '', 'Level': T ? '' : (st.level || levelOf(r.cls || st.cls)), 'Class / Role': T ? 'Teacher' : (r.cls || st.cls || ''), 'Subject': T ? (st.dept || '') : '', 'Academic Session': T ? '' : (r.session || st.session || ''), 'Entry Time': t24(r.entry), 'Exit Time': r.exit ? t24(r.exit) : 'Not recorded', 'Time on Premises': r.exit ? hms(r.dur) : '', 'Attendance Status': 'Present', 'Late Status': r.late ? `Late (${r.lateMin} min after opening)` : 'On time', 'Entry Operator': r.entryOp || '', 'Exit Operator': r.exitOp || '', 'Correction Status': r.corrected ? 'Corrected' : 'Original' }; });
}
function attFileName(f) {
  if (f.from && f.to && f.from.slice(0, 7) === f.to.slice(0, 7)) return `Great_Emvic_Gate_Attendance_${MONTHS[+f.from.slice(5, 7) - 1]}_${f.from.slice(0, 4)}.xlsx`;
  return `Great_Emvic_Gate_Attendance_${f.from || 'start'}_to_${f.to || 'today'}.xlsx`;
}
VIEWS.attendance = () => {
  const f = attF(); const list = filterAtt(f); const pg = pager('attPg', list.length, 30); const ops = Array.from(new Set(S.attendance.flatMap(r => [r.entryOp, r.exitOp]).filter(Boolean)));
  const pageRows = pg.slice(list);
  const rows = pageRows.map(r => { const st = stu(r.studentId) || {}; return `<tr><td><input type="checkbox" data-a="sel" data-id="${r.id}" ${ui.sel.has(r.id) ? 'checked' : ''} aria-label="Select record"></td><td class="num">${dShort(r.date)}</td><td><b>${esc(fullName(st))}</b><div class="muted small">${esc(st.sid || '')} · ${isTeacher(st) ? 'Teacher' : esc(r.cls || st.cls || '')}</div></td><td class="num">${t12(r.entry)}</td><td class="num">${r.exit ? t12(r.exit) : '<span class="muted">Not recorded</span>'}</td><td class="num">${r.exit ? durShort(r.dur) : '—'}</td><td>${r.late ? badge(`Late · ${r.lateMin} min`, 'warn') : badge('On time', 'ok')} ${r.corrected ? badge('Corrected', 'info') : ''} ${r.archived ? badge('Archived', 'mute') : ''}</td><td class="small">${esc(r.entryOp || '')}${r.exitOp && r.exitOp !== r.entryOp ? '<br>' + esc(r.exitOp) : ''}</td><td class="right"><button class="btn ghost sm" data-a="attCorrect" data-id="${r.id}">Correct</button></td></tr>`; }).join('');
  const n = ui.sel.size;
  return head('Gate attendance', 'Entry and exit records, one per student per day.', `<button class="btn" data-a="attExport" ${list.length ? '' : 'disabled'}>Export to Excel</button>`) +
    `<div class="filters"><div><label class="f">From</label><input type="date" data-f="att.from" data-pg="attPg" value="${f.from}"></div><div><label class="f">To</label><input type="date" data-f="att.to" data-pg="attPg" value="${f.to}"></div><div><label class="f">Show</label>${sel('att.kind', f.kind, [['', 'Students and teachers'], ['student', 'Students only'], ['teacher', 'Teachers only']], 'attPg')}</div><div><label class="f">Person</label><input type="search" data-f="att.q" data-pg="attPg" value="${esc(f.q)}" placeholder="Name or ID"></div><div><label class="f">Class</label>${sel('att.cls', f.cls, classOpts(), 'attPg')}</div></div>
    <div class="filters"><div><label class="f">Section</label>${sel('att.section', f.section, [['', 'All'], ...sections()], 'attPg')}</div><div><label class="f">Session</label>${sel('att.session', f.session, [['', 'All'], ...sessions()], 'attPg')}</div><div><label class="f">Exit</label>${sel('att.exit', f.exit, [['', 'Any'], ['yes', 'Exit recorded'], ['no', 'No exit recorded']], 'attPg')}</div><div><label class="f">Arrival</label>${sel('att.late', f.late, [['', 'Any'], ['late', 'Late'], ['ontime', 'On time']], 'attPg')}</div><div><label class="f">Operator</label>${sel('att.op', f.op, [['', 'All'], ...ops], 'attPg')}</div><div><label class="f">Archived</label>${sel('att.arch', f.arch, [['', 'Hide archived'], ['inc', 'Include archived'], ['only', 'Only archived']], 'attPg')}</div></div>
    <div class="row between" style="margin-bottom:10px"><span class="muted small">${list.length} record${list.length === 1 ? '' : 's'} match. Export includes only these.</span><span class="row" id="bulkbar"><span class="small" id="selcount">${n ? n + ' selected' : ''}</span>${n ? `${f.arch === 'only' ? '<button class="btn ghost sm" data-a="attRestore">Restore</button>' : '<button class="btn ghost sm" data-a="attArchive">Archive</button>'}<button class="btn danger sm" data-a="attDelete">Delete permanently</button>` : ''}</span></div>
    <div class="card flush">${list.length ? `<div class="tblwrap"><table class="tbl"><thead><tr><th><input type="checkbox" data-a="selPage" aria-label="Select all on this page"></th><th>Date</th><th>Student</th><th>Entry</th><th>Exit</th><th>Time inside</th><th>Status</th><th>Operator</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : empty('No attendance records', 'Change the dates or filters, or scan students at the gate.')}${pg.html}</div>`;
};

/* ---------- currently in school / history ---------- */
VIEWS.inschool = () => {
  const key = todayKey(); const q = ui.inQ.trim().toLowerCase();
  const list = S.attendance.filter(r => r.date === key && !r.exit && !r.archived).map(r => ({ r, s: stu(r.studentId) })).filter(x => x.s && (!q || fullName(x.s).toLowerCase().includes(q) || x.s.sid.toLowerCase().includes(q) || x.s.cls.toLowerCase().includes(q) || x.s.section.toLowerCase().includes(q))).sort((a, b) => a.r.entry < b.r.entry ? 1 : -1);
  const pg = pager('inPg', list.length, 30);
  return head('Currently in school', 'Students and teachers whose latest gate scan today is an entry with no exit.') + `<div class="tiles" style="margin-bottom:14px">${tile('Currently in school', list.length, 'ok')}</div>
  <div class="filters"><div><label class="f" for="inq">Search</label><input id="inq" type="search" data-f="inQ" data-pg="inPg" value="${esc(ui.inQ)}" placeholder="Name, class, section or ID"></div></div>
  <div class="card flush">${list.length ? `<div class="tblwrap"><table class="tbl"><thead><tr><th>Student</th><th>Class</th><th>Entered</th><th>Time inside so far</th></tr></thead><tbody>${pg.slice(list).map(({ r, s }) => `<tr><td><b>${esc(fullName(s))}</b><div class="muted small">${esc(s.sid)}</div></td><td>${isTeacher(s) ? 'Teacher' : esc(s.cls)}</td><td class="num">${t12m(r.entry)}</td><td class="num">${durShort((Date.now() - Date.parse(r.entry)) / 1000)}</td></tr>`).join('')}</tbody></table></div>` : empty('Nobody is recorded inside', 'Students appear here after their entry scan.')}${pg.html}</div>`;
};
function historyData(st) {
  const all = S.attendance.filter(r => !r.archived); const recs = all.filter(r => r.studentId === st.id).sort((a, b) => a.date < b.date ? 1 : -1);
  const first = dateKey(st.created || new Date(0).toISOString()); const gateDays = Array.from(new Set(all.map(r => r.date))).filter(d => d >= first || recs.some(r => r.date === d));
  return { recs, gateDays, entered: recs.length, missing: Math.max(0, gateDays.length - recs.length), late: recs.filter(r => r.late).length };
}
VIEWS.history = () => {
  const q = ui.histQ.trim().toLowerCase(); const st = ui.histId ? stu(ui.histId) : null;
  const matches = !st && q ? S.students.filter(s => fullName(s).toLowerCase().includes(q) || s.sid.toLowerCase().includes(q)).slice(0, 8) : [];
  let body = '';
  if (st) {
    const h = historyData(st);
    body = `<div class="card" style="margin-bottom:14px"><div class="row between"><div class="row">${thumb(st)}<div><h2 style="margin:0">${esc(fullName(st))}</h2><div class="muted">${esc(st.sid)} · ${esc(st.cls)} · ${esc(st.section)}</div></div></div><div class="row"><button class="btn ghost sm" data-a="histExport">Export Excel</button><button class="btn ghost sm" data-a="histClear">Search another</button></div></div></div>
    <div class="tiles" style="margin-bottom:14px">${tile('Gate-active days', h.gateDays.length)}${tile('Days entered', h.entered, 'ok')}${tile('Days not recorded', h.missing, h.missing ? 'warn' : '')}${tile('Late arrivals', h.late, h.late ? 'warn' : '')}</div>
    <p class="muted small">Gate-active days are days when at least one student was scanned at the gate.</p>
    <div class="card flush">${h.recs.length ? `<div class="tblwrap"><table class="tbl"><thead><tr><th>Date</th><th>Day</th><th>Entry</th><th>Exit</th><th>Time inside</th><th>Status</th></tr></thead><tbody>${h.recs.map(r => `<tr><td class="num">${dShort(r.date)}</td><td>${dayOf(r.date)}</td><td class="num">${t12m(r.entry)}</td><td class="num">${r.exit ? t12m(r.exit) : '<span class="muted">Not recorded</span>'}</td><td class="num">${r.exit ? durShort(r.dur) : '—'}</td><td>${r.late ? badge('Late', 'warn') : badge('Present', 'ok')} ${r.corrected ? badge('Corrected', 'info') : ''}</td></tr>`).join('')}</tbody></table></div>` : empty('No gate records for this student', 'Records appear after the first scan.')}</div>`;
  }
  return head('Student history', 'Search by student ID or name.') + (st ? '' : `<div class="filters"><div><label class="f" for="hq">Search</label><input id="hq" type="search" data-f="histQ" value="${esc(ui.histQ)}" placeholder="GE/2026/0001 or name"></div></div>${matches.length ? `<div class="card">${matches.map(s => `<div class="listrow">${thumb(s)}<div class="grow"><b>${esc(fullName(s))}</b><div class="muted small">${esc(s.sid)} · ${esc(s.cls)}</div></div><button class="btn sm" data-a="histPick" data-id="${s.id}">View history</button></div>`).join('')}</div>` : (q ? `<div class="card">${empty('No student found', 'Check the spelling or ID.')}</div>` : `<div class="card">${empty('Search for a student', 'Their entry and exit history will appear here.')}</div>`)}`) + body;
};

/* ---------- reports ---------- */
function dailyReport(key, kind) {
  const recs = S.attendance.filter(r => r.date === key && !r.archived); const map = new Map(recs.map(r => [r.studentId, r]));
  const want = s => !kind || (kind === 'teacher') === isTeacher(s);
  const people = S.students.filter(s => want(s) && (s.status === 'Active' || map.has(s.id))).sort((a, b) => (isTeacher(a) - isTeacher(b)) || (a.cls + a.last).localeCompare(b.cls + b.last));
  const rr = recs.filter(r => want(stu(r.studentId) || {}));
  const sum = { total: people.length, checked: rr.length, not: people.filter(s => !map.has(s.id)).length, inside: rr.filter(r => !r.exit).length, exited: rr.filter(r => r.exit).length, late: rr.filter(r => r.late).length };
  const rows = people.map(s => { const r = map.get(s.id); return { 'Date': dShort(key), 'Type': isTeacher(s) ? 'Teacher' : 'Student', 'ID Number': s.sid, 'Name': fullName(s), 'Class / Role': isTeacher(s) ? 'Teacher' : s.cls, 'Entry Time': r ? t24(r.entry) : '', 'Exit Time': r ? (r.exit ? t24(r.exit) : 'Not recorded') : '', 'Time on Premises': r && r.exit ? hms(r.dur) : '', 'Status': !r ? 'Not checked in' : r.exit ? 'Left school' : 'In school', 'Late': r && r.late ? 'Late' : '' }; });
  const html = `<div class="tiles" style="margin-bottom:14px">${tile('Total people', sum.total)}${tile('Checked in', sum.checked, 'ok')}${tile('Not checked in', sum.not, sum.not ? 'warn' : '')}${tile('No exit recorded', sum.inside)}${tile('Exited', sum.exited)}${tile('Late', sum.late, sum.late ? 'warn' : '')}</div>` + tableHTML(rows, ['Name', 'ID Number', 'Type', 'Class / Role', 'Entry Time', 'Exit Time', 'Time on Premises', 'Status']);
  return { rows, html, name: `Great_Emvic_Daily_Gate_Report_${key}${kind ? '_' + kind + 's' : ''}.xlsx`, title: `Daily gate attendance report – ${dLongKey(key)}${kind === 'teacher' ? ' (teachers)' : kind === 'student' ? ' (students)' : ''}` };
}
function tableHTML(rows, cols) { return rows.length ? `<div class="card flush"><div class="tblwrap"><table class="tbl"><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${esc(r[c] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>` : `<div class="card">${empty('Nothing to report', 'No matching records for these dates.')}</div>`; }
function reportData() {
  ui.repDate = ui.repDate || todayKey(); ui.repFrom = ui.repFrom || monthStart(); ui.repTo = ui.repTo || todayKey();
  const from = ui.repFrom, to = ui.repTo;
  if (ui.repTab === 'daily') return dailyReport(ui.repDate, ui.repKind);
  if (ui.repTab === 'late') {
    const list = S.attendance.filter(r => r.late && !r.archived && r.date >= from && r.date <= to).sort((a, b) => a.entry < b.entry ? 1 : -1);
    const rows = list.map(r => { const s = stu(r.studentId) || {}; return { 'Date': dShort(r.date), 'Student Name': fullName(s), 'Student ID': s.sid || '', 'Class': isTeacher(s) ? 'Teacher' : (r.cls || s.cls || ''), 'Entry Time': t12(r.entry), 'Opening Time': isTeacher(s) ? (S.settings.teacherOpening || S.settings.opening) : S.settings.opening, 'Minutes After Opening': r.lateMin, 'Status': 'Late' }; });
    return { rows, html: tableHTML(rows, ['Date', 'Student Name', 'Class', 'Entry Time', 'Opening Time', 'Minutes After Opening', 'Status']), name: `Great_Emvic_Late_Arrivals_${from}_to_${to}.xlsx`, title: `Late arrivals – ${dShort(from)} to ${dShort(to)}` };
  }
  if (ui.repTab === 'missing') {
    const list = S.attendance.filter(r => !r.exit && !r.archived && r.date >= from && r.date <= to).sort((a, b) => a.entry < b.entry ? 1 : -1);
    const rows = list.map(r => { const s = stu(r.studentId) || {}; return { 'Date': dShort(r.date), 'Student Name': fullName(s), 'Student ID': s.sid || '', 'Class': r.cls || s.cls || '', 'Entry Time': t12(r.entry), 'Exit Time': 'Not recorded', _id: r.id }; });
    const html = rows.length ? `<div class="card flush"><div class="tblwrap"><table class="tbl"><thead><tr><th>Date</th><th>Student</th><th>Class</th><th>Entry</th><th>Exit</th><th></th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.Date}</td><td>${esc(r['Student Name'])}<div class="muted small">${esc(r['Student ID'])}</div></td><td>${esc(r.Class)}</td><td class="num">${r['Entry Time']}</td><td class="muted">Not recorded</td><td class="right"><button class="btn ghost sm" data-a="attCorrect" data-id="${r._id}">Correct</button></td></tr>`).join('')}</tbody></table></div></div>` : `<div class="card">${empty('No missing exits', 'Every student in this range has an exit scan.')}</div>`;
    return { rows: rows.map(({ _id, ...r }) => r), html, name: `Great_Emvic_Missing_Exits_${from}_to_${to}.xlsx`, title: `Students without an exit record – ${dShort(from)} to ${dShort(to)}` };
  }
  const by = {}; S.scans.filter(x => { const k = dateKey(x.ts); return k >= from && k <= to; }).forEach(x => { const o = by[x.operator] || (by[x.operator] = { total: 0, ok: 0, bad: 0, dup: 0, ent: 0, ex: 0 }); o.total++; if (x.result === 'ENTRY') { o.ok++; o.ent++; } else if (x.result === 'EXIT') { o.ok++; o.ex++; } else if (x.action === 'DUPLICATE') o.dup++; else o.bad++; });
  const rows = Object.keys(by).sort().map(k => ({ 'Operator': k, 'Total Scans': by[k].total, 'Successful': by[k].ok, 'Invalid or Rejected': by[k].bad, 'Repeat Scans': by[k].dup, 'Entries': by[k].ent, 'Exits': by[k].ex }));
  return { rows, html: tableHTML(rows, ['Operator', 'Total Scans', 'Successful', 'Invalid or Rejected', 'Repeat Scans', 'Entries', 'Exits']), name: `Great_Emvic_Operator_Activity_${from}_to_${to}.xlsx`, title: `Operator activity – ${dShort(from)} to ${dShort(to)}` };
}
VIEWS.reports = () => {
  const t = ui.repTab; const d = reportData(); const tab = (k, l) => `<button role="tab" aria-selected="${t === k}" data-a="repTab" data-t="${k}">${l}</button>`;
  const ctl = t === 'daily' ? `<div><label class="f">Date</label><input type="date" data-f="repDate" value="${ui.repDate}"></div><div><label class="f">Show</label>${sel('repKind', ui.repKind || '', [['', 'Students and teachers'], ['student', 'Students only'], ['teacher', 'Teachers only']])}</div>` : `<div><label class="f">From</label><input type="date" data-f="repFrom" value="${ui.repFrom}"></div><div><label class="f">To</label><input type="date" data-f="repTo" value="${ui.repTo}"></div>`;
  return head('Reports', 'Class and date-range reports: use the filters on Gate attendance, then export.', `<button class="btn ghost" data-a="repPrint">Print</button><button class="btn" data-a="repExport" ${d.rows.length ? '' : 'disabled'}>Export to Excel</button>`) +
    `<div class="tabs" role="tablist">${tab('daily', 'Daily report')}${tab('late', 'Late arrivals')}${tab('missing', 'Missing exits')}${tab('ops', 'Operator activity')}</div><div class="filters">${ctl}</div><h2 style="margin-bottom:12px">${esc(d.title)}</h2>${d.html}`;
};

/* ---------- accounts ---------- */
VIEWS.operators = () => {
  const isSuper = cur.role === 'super'; const key = todayKey();
  const rank = { super: 0, admin: 1, operator: 2 };
  const list = S.users.filter(u => isSuper || u.role === 'operator').sort((a, b) => rank[a.role] - rank[b.role] || a.name.localeCompare(b.name));
  const rows = list.map(u => { const n = S.scans.filter(x => x.operator === u.name && dateKey(x.ts) === key).length; const m = canManage(u);
    return `<tr><td><b>${esc(u.name)}</b><div class="muted small">${esc(u.username)}</div></td><td>${badge(roleLabel(u.role), u.role === 'super' ? 'warn' : u.role === 'admin' ? 'info' : 'mute')}</td><td>${u.active ? badge('✓ Active', 'ok') : badge('Disabled', 'err')}</td><td>${u.lastLogin ? dShort(dateKey(u.lastLogin)) + ' ' + t12m(u.lastLogin) : 'Never'}</td><td class="num">${n}</td><td class="right">${m ? `<div class="row" style="justify-content:flex-end"><button class="btn ghost sm" data-a="opReset" data-id="${u.id}">Reset password</button><button class="btn ghost sm" data-a="opToggle" data-id="${u.id}">${u.active ? 'Disable' : 'Enable'}</button></div>` : '<span class="muted small">' + (u.id === cur.id ? 'This is you' : 'Managed by the super account') + '</span>'}</td></tr>`; }).join('');
  return head('Accounts', isSuper ? 'You are the super account. You create administrators; administrators create gate operators.' : 'Only administrators can create accounts. Create a gate operator for each person who scans at the gate.', `<button class="btn" data-a="opAdd">Add account</button>`) +
    `<div class="card flush">${list.length ? `<div class="tblwrap"><table class="tbl"><thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Last login</th><th class="num">Scans today</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : empty('No accounts yet', 'Add an account for each person who needs access.')}</div>`;
};

/* ---------- audit ---------- */
function auditRows() {
  const a = S.audit.map(x => ({ ts: x.ts, actor: x.actor, type: 'Admin', action: x.action, rec: x.target, detail: x.detail }));
  const g = S.scans.map(x => { const t = stu(x.studentId); const ok = x.result === 'ENTRY' || x.result === 'EXIT'; return { ts: x.ts, actor: x.operator, type: 'Gate', action: x.result === 'ENTRY' ? 'Entry scan' : x.result === 'EXIT' ? 'Exit scan' : x.action === 'DUPLICATE' ? 'Repeat scan' : 'Scan rejected', rec: t ? `${fullName(t)} (${t.sid})` : x.code, detail: (ok ? 'Successful' : x.result.replace(/_/g, ' ').toLowerCase()) + ' · ' + x.method }; });
  return a.concat(g).sort((p, q) => p.ts < q.ts ? 1 : -1);
}
VIEWS.audit = () => {
  const q = ui.auditQ.trim().toLowerCase(); const list = auditRows().filter(x => (!ui.auditType || x.type === ui.auditType) && (!q || (x.actor + ' ' + x.action + ' ' + x.rec + ' ' + x.detail).toLowerCase().includes(q)));
  const pg = pager('auditPg', list.length, 30);
  return head('Audit log', 'Every scan and administrative action is recorded here. Entries cannot be edited or deleted.', `<button class="btn ghost" data-a="auditExport">Export CSV</button>`) +
    `<div class="filters"><div><label class="f" for="aq">Search</label><input id="aq" type="search" data-f="auditQ" data-pg="auditPg" value="${esc(ui.auditQ)}" placeholder="Person, action or student"></div><div><label class="f">Type</label>${sel('auditType', ui.auditType, [['', 'All'], ['Gate', 'Gate scans'], ['Admin', 'Administrative actions']], 'auditPg')}</div></div>
    <div class="card flush">${list.length ? `<div class="tblwrap"><table class="tbl"><thead><tr><th>Date and time</th><th>Who</th><th>Action</th><th>Record</th><th>Detail</th></tr></thead><tbody>${pg.slice(list).map(x => `<tr><td class="num" style="white-space:nowrap">${dShort(dateKey(x.ts))} ${t12(x.ts)}</td><td>${esc(x.actor)}</td><td>${esc(x.action)}</td><td>${esc(x.rec)}</td><td class="small">${esc(x.detail)}</td></tr>`).join('')}</tbody></table></div>` : empty('No log entries', 'Actions will be listed here as they happen.')}${pg.html}</div>`;
};

/* ---------- settings ---------- */
VIEWS.settings = () => {
  const s = S.settings;
  return head('Settings', 'Gate rules, classes, templates and data.') +
    `<div class="grid g2"><div class="card"><h2>Gate and school</h2><form data-form="settings"><div class="frm"><div class="field"><label class="f">School name</label><input type="text" name="school" value="${esc(s.school)}" required></div><div class="field"><label class="f">Motto</label><input type="text" name="motto" value="${esc(s.motto)}"></div>
    <div class="field"><label class="f">Student opening time</label><input type="time" name="opening" value="${esc(s.opening)}" required></div><div class="field"><label class="f">Teacher opening time</label><input type="time" name="teacherOpening" value="${esc(s.teacherOpening || s.opening)}" required></div><div class="field"><label class="f">Late grace period (minutes)</label><input type="number" min="0" max="120" name="grace" value="${+s.grace}"></div>
    <div class="field"><label class="f">Ignore repeat scans within (minutes)</label><input type="number" min="0" max="60" name="minExit" value="${+s.minExit}"></div><div class="field"><label class="f">Gate name</label><input type="text" name="gate" value="${esc(s.gate)}"></div>
    <div class="field"><label class="f">Default academic session</label><input type="text" name="session" value="${esc(s.session)}"></div><div class="field"><label class="f">School timezone</label><input type="text" value="${TZ}" disabled></div>
    <div class="field"><label class="f">Default ID template</label><select name="defaultTemplate">${S.templates.map(t => `<option value="${t.id}" ${t.id === s.defaultTemplate ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></div><div class="field"><label class="f">ID card expiry policy</label><input type="text" name="expiry" value="${esc(s.expiry)}"></div></div>
    <div class="field"><label class="f">School contact printed on the card back</label><input type="text" name="contact" value="${esc(s.contact)}" placeholder="Phone number or email"></div>
    <p class="muted small">Students arriving from <b>${lateFromText()}</b> and teachers from <b>${lateFromText('teacher')}</b> are marked late. The original scan time is kept.</p><button class="btn" type="submit">Save settings</button></form></div>
    <div class="card"><h2>Classes</h2><div class="row" style="margin-bottom:12px">${S.classes.map(c => `<span class="badge info">${esc(c.name)}</span>`).join('')}</div><form data-form="class" class="row" style="align-items:flex-end"><div style="flex:1 1 130px"><label class="f" for="cn">New class</label><input id="cn" type="text" name="name" placeholder="e.g. SS2A or Primary6 (optional extra class)" required></div><button class="btn" type="submit">Add class</button></form><p class="muted small" style="margin-top:8px">The standard classes are Primary1–5, JSS1–3 and SS1–3. Add a group like SS2A or Primary6 only if you ever need one.</p></div></div>
    <div class="grid g2" style="margin-top:14px"><div class="card"><h2>Backup and restore</h2><p class="muted small">Last backup: ${s.lastBackup ? dLong(s.lastBackup) + ' ' + t12m(s.lastBackup) : 'Never'} · ${S.students.length} students · ${S.attendance.length} attendance records</p><div class="row"><button class="btn" data-a="backup">Download backup</button>${cur.role === 'super' ? '<label class="btn ghost" style="cursor:pointer">Restore from file<input type="file" accept=".json" data-file="restore" class="hide"></label>' : ''}</div>
    <div class="note warn" style="margin-top:12px">Records live in this browser on this device. Download a backup regularly, and after every busy morning.</div></div>
    <div class="card"><h2>Demo data and reset</h2><p class="muted small">Demo students (Daniel Onyeka and others) are marked and can be removed together with any attendance recorded for them.</p><div class="row"><button class="btn ghost" data-a="demoLoad">Load demo students</button><button class="btn ghost" data-a="demoRemove">Remove demo data</button>${cur.role === 'super' ? '<button class="btn danger" data-a="resetAll">Erase everything</button>' : ''}</div></div></div>
    <div class="card" style="margin-top:14px"><h2>My account</h2><form data-form="pw" class="row" style="align-items:flex-end"><div style="flex:1 1 180px"><label class="f" for="op">Current password</label><input id="op" type="password" name="old" required autocomplete="current-password"></div><div style="flex:1 1 180px"><label class="f" for="np">New password (8+ characters)</label><input id="np" type="password" name="pw" minlength="8" required autocomplete="new-password"></div><button class="btn" type="submit">Change password</button></form></div>`;
};

/* =====================================================================
   ACTIONS
   ===================================================================== */
const root = $('#root');
const ACT = {}, FORMS = {}, FILE = {};
let NEEDS_SETUP = null, SETUP_KEY = false;
const needsSetup = () => NEEDS_SETUP === null ? !S.users.length : NEEDS_SETUP;
function note(a, t, d) { audit(a, t, d); save(); }
const cb = l => `<button type="button" class="btn ghost" data-a="close" data-layer="${l || ''}">Cancel</button>`;
function formErr(msg) { const el = $('#formerr'); if (el) { el.textContent = msg; el.classList.remove('hide'); } else toast(msg, 'err'); }
function rerender() { const y = window.scrollY; render(true); window.scrollTo(0, y); }
function render(force) {
  if (force !== true && cur && view === 'scanner' && scan.active) return;
  const af = document.activeElement; const fk = af && af.dataset && af.dataset.f; const pos = af && af.selectionStart;
  let html;
  if (needsSetup()) html = setupHTML(); else if (!cur) html = loginHTML(); else if (cur.role === 'operator') { view = 'scanner'; html = kioskHTML(); } else html = adminHTML();
  root.innerHTML = html;
  if (fk) { const el = root.querySelector(`[data-f="${fk}"]`); if (el) { el.focus(); try { if (pos != null && ['text', 'search'].includes(el.type)) el.setSelectionRange(pos, pos); } catch (e) { } } }
  if (cur && cur.role !== 'operator' && view === 'designer') designerRepaint();
}
function go(v) { if (scan.active) camStop(); view = v; render(true); window.scrollTo(0, 0); }
async function logout() { try { audit('Logout', cur ? cur.username : '', ''); await flush(); } catch (e) { } camStop(); cur = null; try { sessionStorage.removeItem('gemvic.uid'); } catch (e) { } closeModal(); render(true); }

function setPath(path, val) { const p = path.split('.'); let o = ui; while (p.length > 1) o = o[p.shift()]; o[p[0]] = val; }
let ft = null;
function onField(e) {
  const el = e.target; if (!el.dataset || el.dataset.f == null) return;
  const isText = el.tagName === 'INPUT' && ['text', 'search'].includes(el.type);
  if (isText && e.type !== 'input') return; if (!isText && e.type !== 'change') return;
  let v = el.type === 'checkbox' ? el.checked : el.value; if (el.type === 'number') v = +v;
  setPath(el.dataset.f, v); if (el.dataset.pg) ui[el.dataset.pg] = 1;
  clearTimeout(ft); ft = setTimeout(() => render(true), isText ? 150 : 0);
}
document.addEventListener('input', onField); document.addEventListener('change', onField);
function onTpl(e) {
  const el = e.target; const k = el.dataset && el.dataset.t; if (!k || !ui.draft) return;
  ui.draft[k] = el.type === 'checkbox' ? el.checked : (el.type === 'range' ? +el.value : el.value); designerRepaint();
}
document.addEventListener('input', onTpl); document.addEventListener('change', onTpl);
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset && el.dataset.a === 'tplPick') { ui.tplId = el.value; ui.draft = null; render(true); }
  if (el.id === 'guides') { ui.guides = el.checked; designerRepaint(); }
  if (el.id === 'prevsel') { ui.prev = el.value; designerRepaint(); }
});
function renderSearchResults(list) {
  const out = $('#msres'); if (!out) return;
  out.innerHTML = list.length ? list.map(s => `<div class="listrow">${s.photo ? `<img class="thumb" alt="" src="${s.photo}">` : thumb(s)}<div class="grow"><b>${esc(s.name)}</b><div class="muted small">${esc(s.sid)} · ${esc(s.cls)}</div></div><button class="btn sm" data-a="manualStu" data-id="${s.id}">Record</button></div>`).join('') : '<p class="muted small">No student found.</p>';
}
async function manualSearch(q) {
  if (q.length < 2) { const o = $('#msres'); if (o) o.innerHTML = ''; return; }
  renderSearchResults(S.students.filter(s => fullName(s).toLowerCase().includes(q) || s.sid.toLowerCase().includes(q)).slice(0, 8).map(s => ({ id: s.id, sid: s.sid, cls: s.cls, name: fullName(s) })));
}
document.addEventListener('input', e => { const el = e.target; if (!el.dataset || el.dataset.m !== 'q') return; manualSearch(el.value.trim().toLowerCase()); });
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-a]'); if (!b || b.tagName === 'SELECT') return; const a = b.dataset.a;
  if (a === 'mback') { if (e.target === b) closeModal(b.dataset.layer); return; }
  const fn = ACT[a]; if (!fn) return;
  try { await fn(b, e); } catch (err) { console.error(err); toast(err.message || 'Something went wrong.', 'err'); }
});
document.addEventListener('submit', async e => {
  const f = e.target; if (!f.dataset || !f.dataset.form) return; e.preventDefault();
  try { await FORMS[f.dataset.form](f); } catch (err) { console.error(err); formErr(err.message || 'Something went wrong.'); }
});
document.addEventListener('change', async e => {
  const el = e.target; const kind = el.dataset && el.dataset.file; if (!kind || !FILE[kind]) return;
  const files = Array.from(el.files || []); if (!files.length) return;
  try { await FILE[kind](files, el); } catch (err) { console.error(err); toast(err.message || 'That file could not be used.', 'err'); }
  try { el.value = ''; } catch (e2) { }
});
document.addEventListener('dragover', e => { const z = e.target.closest && e.target.closest('.dz'); if (z) { e.preventDefault(); z.classList.add('over'); } });
document.addEventListener('dragleave', e => { const z = e.target.closest && e.target.closest('.dz'); if (z) z.classList.remove('over'); });
document.addEventListener('drop', async e => {
  const z = e.target.closest && e.target.closest('.dz'); if (!z) return; e.preventDefault(); z.classList.remove('over');
  const inp = $('input[type=file]', z); const files = Array.from(e.dataTransfer.files || []); if (!inp || !files.length) return;
  try { await FILE[inp.dataset.file](files, inp); } catch (err) { toast(err.message || 'That file could not be used.', 'err'); }
});

/* ---- navigation & generic ---- */
ACT.go = b => go(b.dataset.v);
ACT.logout = () => logout();
ACT.close = b => closeModal(b.dataset.layer);
ACT.pg = b => { ui[b.dataset.k] = (ui[b.dataset.k] || 1) + (+b.dataset.d); rerender(); };
ACT.doPrint = () => { try { window.print(); } catch (e) { toast('Printing is not available in this view.', 'err'); } };
ACT.sel = b => { if (b.checked) ui.sel.add(b.dataset.id); else ui.sel.delete(b.dataset.id); rerender(); };
ACT.selPage = b => { const list = filterAtt(attF()).slice((ui.attPg - 1) * 30, ui.attPg * 30); if (b.checked) list.forEach(r => ui.sel.add(r.id)); else list.forEach(r => ui.sel.delete(r.id)); rerender(); };

/* ---- setup & login ---- */
FORMS.setup = async f => {
  if (S.users.length) throw new Error('An administrator already exists.');
  const d = Object.fromEntries(new FormData(f)); if (d.pw !== d.pw2) throw new Error('The passwords do not match.'); if (d.pw.length < 8) throw new Error('Use at least 8 characters.');
  const u = await makeUser(d.name.trim(), d.username.trim(), d.pw, 'super'); S.users.push(u); cur = u; u.lastLogin = new Date().toISOString(); audit('Super account created', u.username, '');
  try { sessionStorage.setItem('gemvic.uid', u.id); } catch (e) { } await flush(); view = 'overview'; render(true);
};
FORMS.login = async f => {
  const d = Object.fromEntries(new FormData(f)); const r = await login(d.username, d.pw); if (!r.ok) throw new Error(r.msg);
  view = cur.role === 'operator' ? 'scanner' : 'overview'; render(true);
};
FORMS.pw = async f => { const d = Object.fromEntries(new FormData(f)); if (await hashPw(d.old, cur.salt) !== cur.hash) throw new Error('Your current password is not correct.'); if (d.pw.length < 8) throw new Error('Use at least 8 characters.'); cur.salt = uid() + uid(); cur.hash = await hashPw(d.pw, cur.salt); audit('Password changed', cur.username, ''); save(); f.reset(); toast('Password changed', 'ok'); };

/* ---- students ---- */
ACT.studentForm = b => studentForm(b.dataset.id || undefined, b.dataset.kind);
ACT.stuOpen = b => studentModal(b.dataset.id);
FILE.formPhoto = async files => {
  const url = await cropPhoto(files[0]); if (!url) return; window._formPhoto = url;
  const p = $('#ph-prev'); if (p) p.innerHTML = `<img class="thumb" style="width:60px;height:80px" alt="" src="${url}">`; const c = $('#ph-clear'); if (c) c.classList.remove('hide');
};
ACT.photoClear = () => { window._formPhoto = 'remove'; const p = $('#ph-prev'); if (p) p.innerHTML = '<div class="thumb" style="width:60px;height:80px"></div>'; $('#ph-clear').classList.add('hide'); };
function autoId(prefix) {
  let max = 0;
  S.students.forEach(s => { const m = new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d+)$', 'i').exec(s.sid || ''); if (m) max = Math.max(max, parseInt(m[1], 10)); });
  let n = max + 1, sid;
  do { sid = prefix + String(n).padStart(4, '0'); n++; } while (S.students.some(s => s.sid.toUpperCase() === sid.toUpperCase()));
  return sid;
}
FORMS.student = async f => {
  need('students.update'); const d = Object.fromEntries(new FormData(f)); const id = f.dataset.id; const T = f.dataset.kind === 'teacher';
  const session = (d.session || '').trim() || S.settings.session;
  let sid = (d.sid || '').trim();
  if (!sid) sid = T ? autoId('GE/T/') : autoId('GE/' + session.slice(0, 4) + '/');
  if (S.students.some(s => s.id !== id && s.sid.toUpperCase() === sid.toUpperCase())) throw new Error('That ID is already in use.');
  let cl = null; if (!T) { cl = S.classes.find(c => c.name === d.cls); if (!cl) throw new Error('Choose a class.'); }
  let s = id ? stu(id) : null; const isNew = !s;
  if (isNew) { need('students.create'); s = { id: uid(), created: new Date().toISOString(), qr: null, qrHistory: [] }; S.students.push(s); }
  Object.assign(s, { sid, first: d.first.trim(), middle: d.middle.trim(), last: d.last.trim(), pref: (d.pref || '').trim(), status: d.status, updated: new Date().toISOString() },
    T ? { kind: 'teacher', cls: 'Teacher', level: '', section: 'Teaching staff', session: '', dept: (d.dept || '').trim(), phone: (d.phone || '').trim() }
      : { kind: 'student', cls: cl.name, level: cl.level, section: cl.section, session, phone: (d.phone || '').trim(), guardian: d.guardian.trim(), guardianPhone: d.guardianPhone.trim() });
  if (window._formPhoto === 'remove') delPhoto(s.id); else if (window._formPhoto) setPhoto(s.id, window._formPhoto);
  window._formPhoto = undefined; dirty(); audit(isNew ? (T ? 'Teacher created' : 'Student created') : (T ? 'Teacher edited' : 'Student edited'), s.sid, fullName(s)); save(); closeModal(); render(true); toast(isNew ? (T ? 'Teacher added' : 'Student added') : 'Changes saved', 'ok');
};
ACT.stuDelete = async b => {
  need('students.delete'); const s = stu(b.dataset.id); const n = S.attendance.filter(r => r.studentId === s.id).length;
  if (n) { toast(`${fullName(s)} has ${n} gate record${n > 1 ? 's' : ''}. Set the student to Inactive or Transferred instead of deleting.`, 'err'); return; }
  if (!await confirmBox('Delete student?', `Delete <b>${esc(fullName(s))}</b> (${esc(s.sid)})? This cannot be undone.`, 'Delete', true)) return;
  S.students = S.students.filter(x => x.id !== s.id); delPhoto(s.id); dirty(); audit('Student deleted', s.sid, fullName(s)); save(); closeModal(); render(true);
};
async function stuExport(id, fmt) {
  need('id_cards.export'); const s = stu(id); const tpl = tplById(S.settings.defaultTemplate);
  if (!s.qr) throw new Error('Generate the ID card first.');
  if (fmt === 'pdf' || fmt === 'docx' || fmt === 'print') {
    const items = await renderSet([s], tpl, true);
    if (fmt === 'pdf') await saveFile(cardFile(s, 'pdf'), buildPDF(items, { mode: 'single' }, true).output('blob'));
    else if (fmt === 'docx') await saveFile(cardFile(s, 'docx'), await buildDocx(items, { mode: '8' }, true));
    else openPrint(items, { mode: '4' }, true);
  } else { const c = await drawCard(s, tpl, 'front'); await saveFile(cardFile(s, fmt), await toBlobP(c, fmt === 'png' ? 'image/png' : 'image/jpeg', 0.95)); }
  note('ID card exported', s.sid, fmt.toUpperCase());
}
ACT.stuPdf = b => stuExport(b.dataset.id, 'pdf'); ACT.stuPng = b => stuExport(b.dataset.id, 'png'); ACT.stuJpg = b => stuExport(b.dataset.id, 'jpg'); ACT.stuDocx = b => stuExport(b.dataset.id, 'docx'); ACT.stuPrint = b => stuExport(b.dataset.id, 'print');

/* ---- ID / QR ---- */
function afterId(id, fromModal) { closeModal(2); closeModal(); render(true); if (fromModal) studentModal(id); }
ACT.idGenerate = b => { need('id_cards.generate'); const s = stu(b.dataset.id); if (!s.qr) issueQR(s, 'Initial ID'); audit('ID generated', s.sid, 'QR version ' + s.qr.version); save(); afterId(s.id, !!b.closest('#modal')); toast('ID card generated', 'ok'); };
ACT.idReplace = b => {
  const s = stu(b.dataset.id);
  openModal('Replace ID card', `<form id="repform" data-form="idreplace" data-id="${s.id}" data-modal="${b.closest('#modal') ? 1 : ''}"><p>${esc(fullName(s))} · ${esc(s.sid)}<br><span class="muted small">A new QR code is issued. The old QR stops working immediately. The student ID does not change.</span></p><div class="field"><label class="f">Reason</label><select name="reason"><option>Lost ID card</option><option>Stolen ID card</option><option>Damaged ID card</option><option>Other</option></select></div><div class="field"><label class="f">Mark the old card as</label><select name="old"><option>Lost</option><option>Replaced</option><option>Deactivated</option></select></div><div id="formerr" class="note err hide"></div></form>`,
    `${cb(2)}<button class="btn" type="submit" form="repform">Issue new QR</button>`, { layer: 2, small: true });
};
FORMS.idreplace = f => { need('qr.regenerate'); const s = stu(f.dataset.id); const d = Object.fromEntries(new FormData(f)); const old = s.qr.value; issueQR(s, d.reason, d.old); audit('ID replaced', s.sid, `${d.reason}; old QR ${maskCode(old)} marked ${d.old}; new QR version ${s.qr.version}`); save(); afterId(s.id, !!f.dataset.modal); toast('New QR issued. The old card no longer works.', 'ok'); };
ACT.idRegen = async b => {
  need('qr.regenerate'); const s = stu(b.dataset.id);
  if (!await confirmBox('Regenerate QR code?', 'The current QR code will become invalid. Any previously issued copy of this QR will no longer work.', 'Regenerate', true)) return;
  issueQR(s, 'Regenerated by administrator', 'Replaced'); audit('QR regenerated', s.sid, 'QR version ' + s.qr.version); save(); afterId(s.id, !!b.closest('#modal')); toast('QR regenerated', 'ok');
};
ACT.idStatus = b => {
  const s = stu(b.dataset.id);
  openModal('Change ID status', `<form id="stform" data-form="idstatus" data-id="${s.id}" data-modal="${b.closest('#modal') ? 1 : ''}"><p>${esc(fullName(s))} · current status: ${idBadge(s)}</p><div class="field"><label class="f">New status</label><select name="status">${['Active', 'Suspended', 'Lost', 'Replaced', 'Expired', 'Deactivated'].map(x => `<option ${s.qr.status === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div><p class="muted small">Only an Active card is accepted at the gate.</p></form>`, `${cb(2)}<button class="btn" type="submit" form="stform">Save status</button>`, { layer: 2, small: true });
};
FORMS.idstatus = f => { need('id_cards.deactivate'); const s = stu(f.dataset.id); const d = Object.fromEntries(new FormData(f)); const old = s.qr.status; s.qr.status = d.status; audit('ID status changed', s.sid, `${old} → ${d.status}`); save(); afterId(s.id, !!f.dataset.modal); };

/* ---- import / photos ---- */
ACT.importOpen = b => importOpen(b && b.dataset ? b.dataset.kind : undefined);
ACT.importTemplate = () => ui.impKind === 'teacher' ? saveFile('Great_Emvic_Teacher_Import_Template.xlsx', xlsxBlob([{ 'Staff ID': 'GE/T/0001', 'First Name': 'Ada', 'Last Name': 'Obi', 'Subject': 'Mathematics', 'Sex': 'Female', 'Phone': '08012345678' }, { 'Staff ID': 'GE/T/0002', 'First Name': 'Tunde', 'Last Name': 'Bello', 'Subject': 'English', 'Sex': 'Male', 'Phone': '' }], 'Teachers')) : saveFile('Great_Emvic_Student_Import_Template.xlsx', xlsxBlob([{ 'Student ID': 'GE/2026/0001', 'First Name': 'Daniel', 'Last Name': 'Onyeka', 'Section': 'Senior Secondary School', 'Class': 'SS2', 'Session': '2026/2027' }, { 'Student ID': 'GE/2026/0002', 'First Name': 'Sarah', 'Last Name': 'Ade', 'Section': 'Junior Secondary School', 'Class': 'JSS3', 'Session': '2026/2027' }], 'Students'));
FILE.import = async files => { ui.imp = await parseImport(files[0], ui.impKind); importRefresh(); };
ACT.importGo = () => {
  need('students.create'); const im = ui.imp; if (!im) return; const valid = im.rows.filter(r => !r.err.length); const now = new Date().toISOString();
  valid.forEach(r => { const sid = (r.sid || '').trim() || autoId(im.kind === 'teacher' ? 'GE/T/' : 'GE/' + (r.session || S.settings.session).slice(0, 4) + '/'); if (im.kind === 'teacher') { S.students.push({ id: uid(), kind: 'teacher', sid, first: r.first, middle: r.middle || '', last: r.last, sex: r.sex || '', dob: r.dob || '', cls: 'Teacher', level: '', section: 'Teaching staff', session: '', dept: r.dept || '', phone: r.phone || '', status: 'Active', created: now, qr: null, qrHistory: [] }); } else { const cl = S.classes.find(c => c.name === r.cls); S.students.push({ id: uid(), sid, first: r.first, middle: r.middle || '', last: r.last, sex: r.sex || '', dob: r.dob || '', cls: cl.name, level: cl.level, section: cl.section, session: r.session || S.settings.session, admissionYear: '', status: /^(active|inactive|graduated|transferred|suspended)$/i.test(r.status || '') ? r.status[0].toUpperCase() + r.status.slice(1).toLowerCase() : 'Active', guardian: r.guardian || '', guardianPhone: r.guardianPhone || '', created: now, qr: null, qrHistory: [] }); } });
  S.imports.push({ ts: now, file: im.file, total: im.rows.length, imported: valid.length, rejected: im.rows.length - valid.length, by: cur.name }); dirty(); audit(im.kind === 'teacher' ? 'Teachers imported' : 'Students imported', im.file, `${valid.length} imported, ${im.rows.length - valid.length} rejected`); save(); ui.imp = null; closeModal(); render(true); toast(`${valid.length} students imported. Add photographs next.`, 'ok');
};
ACT.photosOpen = () => photosOpen();
FILE.bulkPhotos = files => bulkPhotos(files);
FILE.scanPhoto = async files => { toast('Reading the photo…'); const code = await decodeImageFile(files[0]); if (!code) { toast('No QR code found in that photo. Try again closer, flat and well lit.', 'err'); return; } await runRecord({ code }); };
FILE.logo = async files => { const u = await resizeToPNG(files[0]); if (!u) throw new Error('That file is not a readable image.'); S.settings.logo = u; imgCache.clear(); audit('Logo changed', '', ''); save(); render(true); };
ACT.logoClear = () => { S.settings.logo = null; imgCache.clear(); audit('Logo removed', '', ''); save(); render(true); };

/* ---- designer ---- */
function saveDraft() { need('id_cards.update'); const i = S.templates.findIndex(t => t.id === ui.tplId); S.templates[i] = JSON.parse(JSON.stringify(ui.draft)); audit('ID template saved', ui.draft.name, ''); save(); }
ACT.tplSave = () => { saveDraft(); toast('Template saved', 'ok'); render(true); };
ACT.tplSaveNew = () => { need('id_cards.update'); const c = JSON.parse(JSON.stringify(ui.draft)); c.id = 't' + uid(); if (S.templates.some(t => t.name === c.name)) c.name += ' copy'; S.templates.push(c); ui.tplId = c.id; ui.draft = null; audit('ID template created', c.name, ''); save(); toast('New template saved', 'ok'); render(true); };
ACT.tplDefault = () => { saveDraft(); S.settings.defaultTemplate = ui.tplId; audit('Default ID template set', ui.draft.name, ''); save(); toast('Default template updated', 'ok'); render(true); };

/* ---- generate ---- */
ACT.genRun = async () => {
  need('id_cards.generate'); const g = ui.gen; const list = genSelect(); const tpl = tplById(g.tplId); if (!list.length) return;
  $('#genbtn').disabled = true; $('#genprog').classList.remove('hide'); const bar = $('#genbar'), txt = $('#gentxt'); bar.style.width = '0'; txt.textContent = 'Preparing…';
  let skipped = 0, created = 0; const use = [];
  list.forEach(s => { if (!s.qr) { issueQR(s, 'Initial ID (batch)'); created++; } if (s.qr.status !== 'Active') { skipped++; return; } use.push(s); });
  save();
  const items = await renderSet(use, tpl, g.back, (i, n) => { bar.style.width = Math.round(i / n * 100) + '%'; txt.textContent = `Generating ID cards… ${i} / ${n}`; });
  const label = (genScopes().find(x => x[0] === g.scope) || ['', 'All students'])[1]; const file = g.scope === 'all' ? 'All' : fileSafe(g.scope.split(':')[1]);
  ui.gen.result = { items, tpl, layout: { mode: g.layout, cols: g.cols, rows: g.rows }, withBack: g.back, label, file, skipped };
  S.batches.push({ ts: new Date().toISOString(), label, count: items.length, template: tpl.name, by: cur.name, status: 'Completed' }); audit('ID cards generated', label, `${items.length} cards, ${created} new QR codes, template ${tpl.name}`); save();
  $('#genres').innerHTML = genResultHTML(); txt.textContent = `${items.length} ID cards generated`; $('#genbtn').disabled = false;
};
const genName = ext => { const r = ui.gen.result; return `Great_Emvic_ID_Cards_${r.file}_${fileSafe(S.settings.session)}.${ext}`; };
ACT.genPdf = async () => { need('id_cards.export'); const r = ui.gen.result; await saveFile(genName('pdf'), buildPDF(r.items, r.layout, r.withBack).output('blob')); note('ID cards exported', r.label, 'PDF'); };
ACT.genDocx = async () => { need('id_cards.export'); const r = ui.gen.result; await saveFile(genName('docx'), await buildDocx(r.items, r.layout, r.withBack)); note('ID cards exported', r.label, 'Word'); };
ACT.genZip = async b => { need('id_cards.export'); const r = ui.gen.result; const txt = $('#gentxt'); $('#genprog').classList.remove('hide'); const fmt = b.dataset.fmt; const blob = await buildImageZip(r.items.map(i => i.st), r.tpl, fmt, r.withBack, (i, n) => { txt.textContent = `Preparing images… ${i} / ${n}`; }); txt.textContent = ''; await saveFile(genName('zip').replace('.zip', '_' + fmt.toUpperCase() + '.zip'), blob); note('ID cards exported', r.label, fmt.toUpperCase() + ' images'); };
ACT.genPrint = () => { const r = ui.gen.result; openPrint(r.items, r.layout, r.withBack); };

/* ---- gate scanner actions ---- */
ACT.camStart = () => camStart();
ACT.camStop = () => camStop();
ACT.camSwitch = async () => { scan.facing = scan.facing === 'environment' ? 'user' : 'environment'; camStop(true); await camStart(); };
ACT.overClose = () => hideOver();
ACT.manualStu = b => { const q = $('#msq'); if (q) q.value = ''; const r = $('#msres'); if (r) r.innerHTML = ''; return runRecord({ studentId: b.dataset.id }); };
ACT.manualCode = () => { const el = $('#mcode'); const v = (el.value || '').trim(); if (!v) return; el.value = ''; return runRecord({ code: v }); };

/* ---- attendance ---- */
function correctRecord(id, entryT, exitT, reason) {
  need('gate.correct'); const r = S.attendance.find(x => x.id === id); if (!r) throw new Error('Record not found.'); if (!reason.trim()) throw new Error('A reason is required.');
  const before = { entry: r.entry, exit: r.exit }; const ne = lagosISO(r.date, entryT); const nx = exitT ? lagosISO(r.date, exitT) : null;
  if (nx && Date.parse(nx) <= Date.parse(ne)) throw new Error('The exit time must be after the entry time.');
  r.entry = ne; r.exit = nx; r.dur = nx ? (Date.parse(nx) - Date.parse(ne)) / 1000 : null; const li = lateInfo(ne); r.late = li.late; r.lateMin = li.lateMin; r.corrected = true; if (nx && !r.exitOp) r.exitOp = cur.name + ' (correction)'; if (!nx) r.exitOp = null;
  r.log = r.log || []; r.log.push({ ts: new Date().toISOString(), by: cur.name, reason: reason.trim(), before, after: { entry: ne, exit: nx } });
  const s = stu(r.studentId); audit('Attendance corrected', s ? s.sid : '', `${dShort(r.date)} · entry ${t24(before.entry)} → ${t24(ne)}; exit ${before.exit ? t24(before.exit) : 'none'} → ${nx ? t24(nx) : 'none'} · ${reason.trim()}`);
}
ACT.attCorrect = b => {
  const r = S.attendance.find(x => x.id === b.dataset.id); const s = stu(r.studentId) || {};
  openModal('Correct gate record', `<form id="corform" data-form="correct" data-id="${r.id}"><p><b>${esc(fullName(s))}</b> · ${esc(s.sid || '')}<br><span class="muted small">${dLongKey(r.date)}. The original values stay in the audit log.</span></p><div class="frm"><div class="field"><label class="f">Entry time</label><input type="time" step="1" name="entry" value="${t24(r.entry)}" required></div><div class="field"><label class="f">Exit time (leave blank if none)</label><input type="time" step="1" name="exit" value="${r.exit ? t24(r.exit) : ''}"></div></div><div class="field"><label class="f">Reason for correction</label><input type="text" name="reason" required placeholder="e.g. Operator missed the exit scan"></div><div id="formerr" class="note err hide"></div></form>`,
    `${cb('')}<button class="btn" type="submit" form="corform">Save correction</button>`, { small: true });
};
FORMS.correct = f => { const d = Object.fromEntries(new FormData(f)); correctRecord(f.dataset.id, d.entry, d.exit, d.reason); save(); closeModal(); rerender(); toast('Record corrected', 'ok'); };
ACT.attExport = async () => { need('gate.export'); const f = attF(); const list = filterAtt(f); await saveFile(attFileName(f), xlsxBlob(attRows(list), 'Gate attendance')); note('Attendance exported', '', `${list.length} records, ${f.from || 'start'} to ${f.to || 'today'}`); };
ACT.attArchive = () => { need('gate.correct'); const n = ui.sel.size; S.attendance.forEach(r => { if (ui.sel.has(r.id)) r.archived = true; }); audit('Attendance archived', '', n + ' records'); ui.sel.clear(); save(); rerender(); toast(n + ' records archived', 'ok'); };
ACT.attRestore = () => { need('gate.correct'); const n = ui.sel.size; S.attendance.forEach(r => { if (ui.sel.has(r.id)) r.archived = false; }); audit('Attendance restored', '', n + ' records'); ui.sel.clear(); save(); rerender(); toast(n + ' records restored', 'ok'); };
ACT.attDelete = async () => {
  need('gate.correct'); const n = ui.sel.size;
  if (!await confirmBox(`DELETE ${n.toLocaleString()} ATTENDANCE RECORD${n === 1 ? '' : 'S'}?`, 'This action cannot be undone. Consider archiving instead.', 'Confirm delete', true)) return;
  S.attendance = S.attendance.filter(r => !ui.sel.has(r.id)); audit('Attendance deleted permanently', '', n + ' records'); ui.sel.clear(); save(); rerender(); toast(n + ' records deleted');
};
ACT.histPick = b => { ui.histId = b.dataset.id; rerender(); };
ACT.histClear = () => { ui.histId = null; ui.histQ = ''; rerender(); };
ACT.histExport = () => { const s = stu(ui.histId); return saveFile(`Great_Emvic_Student_History_${fileSafe(s.sid)}.xlsx`, xlsxBlob(attRows(historyData(s).recs), 'Student history')); };
ACT.repTab = b => { ui.repTab = b.dataset.t; rerender(); };
ACT.repExport = async () => { need('gate.export'); const d = reportData(); await saveFile(d.name, xlsxBlob(d.rows, 'Report')); note('Report exported', d.title, ''); };
ACT.repPrint = () => { const d = reportData(); $('#printRoot').innerHTML = `<div style="padding:14mm;font-family:var(--font)"><h1 style="font-size:20px">${esc(S.settings.school)}</h1><h2 style="margin:4px 0 14px">${esc(d.title)}</h2>${d.html}</div>`; ACT.doPrint(); };

/* ---- operators, audit ---- */
ACT.opAdd = () => openModal('Add account', `<form id="opform" data-form="opadd">${cur.role === 'super' ? '<div class="field"><label class="f">Account type</label><select name="role"><option value="operator">Gate operator (scanner only)</option><option value="admin">Administrator (full control except super-only actions)</option></select></div>' : ''}<div class="field"><label class="f">Display name</label><input type="text" name="name" placeholder="Gate Operator 01" required></div><div class="field"><label class="f">Username</label><input type="text" name="username" autocapitalize="none" required></div><div class="field"><label class="f">Password (8+ characters)</label><input type="password" name="pw" minlength="8" required autocomplete="new-password"></div><div id="formerr" class="note err hide"></div></form>`, `${cb('')}<button class="btn" type="submit" form="opform">Create operator</button>`, { small: true });
FORMS.opadd = async f => { const d = Object.fromEntries(new FormData(f)); const role = cur.role === 'super' && d.role === 'admin' ? 'admin' : 'operator'; need(role === 'admin' ? 'admins.manage' : 'operators.create'); if (S.users.some(u => u.username.toLowerCase() === d.username.trim().toLowerCase())) throw new Error('That username is taken.'); if (d.pw.length < 8) throw new Error('Use at least 8 characters.'); const u = await makeUser(d.name.trim(), d.username.trim(), d.pw, role); S.users.push(u); audit(role === 'admin' ? 'Administrator created' : 'Operator created', u.username, u.name); save(); closeModal(); render(true); toast('Account created', 'ok'); };
ACT.opReset = b => { const u = S.users.find(x => x.id === b.dataset.id); openModal('Reset password', `<form id="rpform" data-form="opreset" data-id="${u.id}"><p>${esc(u.name)} (${esc(u.username)})</p><div class="field"><label class="f">New password (8+ characters)</label><input type="password" name="pw" minlength="8" required autocomplete="new-password"></div><div id="formerr" class="note err hide"></div></form>`, `${cb('')}<button class="btn" type="submit" form="rpform">Reset password</button>`, { small: true }); };
FORMS.opreset = async f => { const u = S.users.find(x => x.id === f.dataset.id); if (!canManage(u)) throw new Error('You cannot manage this account.'); const d = Object.fromEntries(new FormData(f)); u.salt = uid() + uid(); u.hash = await hashPw(d.pw, u.salt); audit('Password reset', u.username, u.role); save(); closeModal(); toast('Password reset', 'ok'); };
ACT.opToggle = b => { const u = S.users.find(x => x.id === b.dataset.id); if (!canManage(u)) throw new Error('You cannot manage this account.'); u.active = !u.active; audit(u.active ? 'Account enabled' : 'Account disabled', u.username, u.role); save(); render(true); };
ACT.auditExport = () => { need('audit.read'); const rows = auditRows(); const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"'; const csv = 'Date,Time,Who,Type,Action,Record,Detail\n' + rows.map(x => [dShort(dateKey(x.ts)), t24(x.ts), x.actor, x.type, x.action, x.rec, x.detail].map(q).join(',')).join('\n'); return saveFile(`Great_Emvic_Audit_Log_${todayKey()}.csv`, csv); };

/* ---- settings, data ---- */
FORMS.settings = f => {
  need('settings.update'); const d = Object.fromEntries(new FormData(f)); const s = S.settings;
  Object.assign(s, { school: d.school.trim(), motto: d.motto.trim(), opening: d.opening, grace: Math.max(0, +d.grace || 0), minExit: Math.max(0, +d.minExit || 0), gate: d.gate.trim() || 'Main School Gate', session: d.session.trim(), defaultTemplate: d.defaultTemplate, expiry: d.expiry.trim(), contact: d.contact.trim() });
  audit('Settings changed', '', `Opening ${s.opening}, grace ${s.grace} min, repeat window ${s.minExit} min, session ${s.session}`); save(); render(true); toast('Settings saved', 'ok');
};
FORMS.class = f => {
  need('settings.update'); const raw = new FormData(f).get('name').trim(); const m = /^(JSS[1-3]|SS[1-3]|Primary[1-9])([A-Z]?)$/i.exec(raw);
  if (!m) throw new Error('Use a name like SS2, JSS1A or Primary4.');
  const lvl = m[1].toUpperCase(); const pfx = /^PRIMARY/.test(lvl) ? 'Primary' + lvl.slice(7) : lvl; const name = pfx + m[2].toUpperCase();
  if (S.classes.some(c => c.name === name)) throw new Error('That class already exists.');
  const section = pfx.startsWith('Primary') ? 'Primary School' : pfx.startsWith('JSS') ? 'Junior Secondary School' : 'Senior Secondary School';
  S.classes.push({ name, level: pfx, section }); audit('Class added', name, ''); save(); render(true); toast('Class added', 'ok');
};
ACT.backup = async () => {
  need('settings.read'); const blob = new Blob([JSON.stringify({ app: 'gemvic-id-gate', v: 1, exportedAt: new Date().toISOString(), state: S, photos: Object.fromEntries(photos) })], { type: 'application/json' });
  if (await saveFile(`Great_Emvic_ID_Gate_Backup_${todayKey()}.json`, blob)) { S.settings.lastBackup = new Date().toISOString(); audit('Backup downloaded', '', `${S.students.length} students, ${S.attendance.length} attendance records`); save(); render(true); }
};
FILE.restore = async files => {
  need('system.restore'); const j = JSON.parse(await files[0].text()); if (!j || j.app !== 'gemvic-id-gate' || !j.state || !Array.isArray(j.state.students)) throw new Error('This is not a Great Emvic backup file.');
  if (!await confirmBox('Restore backup?', `This replaces everything on this device with the backup from ${esc(j.exportedAt ? dLong(j.exportedAt) : 'an unknown date')} (${j.state.students.length} students). You will be signed out.`, 'Restore', true)) return;
  for (const k of Array.from(photos.keys())) await idbDel('photo:' + k); photos.clear();
  S = Object.assign(defState(), j.state); S.settings = Object.assign(defState().settings, j.state.settings); dirty();
  for (const [k, v] of Object.entries(j.photos || {})) { photos.set(k, v); await idbSet('photo:' + k, v); }
  await flush(); imgCache.clear(); cur = null; try { sessionStorage.removeItem('gemvic.uid'); } catch (e) { } closeModal(); render(true); toast('Backup restored. Sign in again.', 'ok');
};
const DEMO = [['Daniel', 'Onyeka', 'SS2', 'Male', '#174A8B'], ['Sarah', 'Ade', 'JSS3', 'Female', '#7A3E65'], ['Michael', 'John', 'SS1', 'Male', '#2F6B4F'], ['David', 'Peter', 'JSS2', 'Male', '#8A5A16'], ['Grace', 'Okafor', 'SS3', 'Female', '#5B3F8C'], ['Emmanuel', 'Bello', 'JSS1', 'Male', '#1F6F7A']];
const DEMO_T = [['Ada', 'Obi', 'Mathematics', 'Female', '#7A3E65'], ['Tunde', 'Bello', 'English Language', 'Male', '#2F6B4F'], ['Ngozi', 'Eze', 'Biology', 'Female', '#5B3F8C']];
function demoPhoto(color) {
  const c = document.createElement('canvas'); c.width = 300; c.height = 400; const g = c.getContext('2d'); g.fillStyle = color; g.fillRect(0, 0, 300, 400);
  g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(150, 150, 62, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(150, 372, 112, 128, 0, Math.PI, 0); g.fill(); return c.toDataURL('image/jpeg', 0.8);
}
ACT.demoLoad = () => {
  need('students.create'); let n = 0; const now = new Date().toISOString();
  DEMO.forEach((d, i) => {
    const sid = 'GE/2026/' + String(i + 1).padStart(4, '0'); if (S.students.some(s => s.sid === sid)) return; const cl = S.classes.find(c => c.name === d[2]);
    const st = { id: uid(), sid, first: d[0], middle: '', last: d[1], sex: d[3], dob: '', cls: cl.name, level: cl.level, section: cl.section, session: S.settings.session, admissionYear: '2026', status: 'Active', guardian: '', guardianPhone: '', created: now, qr: null, qrHistory: [], demo: true };
    S.students.push(st); issueQR(st, 'Demo'); setPhoto(st.id, demoPhoto(d[4])); n++;
  });
  DEMO_T.forEach((d, i) => {
    const sid = 'GE/T/' + String(i + 1).padStart(4, '0'); if (S.students.some(s => s.sid === sid)) return;
    const st = { id: uid(), kind: 'teacher', sid, first: d[0], middle: '', last: d[1], sex: d[3], dob: '', cls: 'Teacher', level: '', section: 'Teaching staff', session: '', dept: d[2], phone: '', status: 'Active', created: now, qr: null, qrHistory: [], demo: true };
    S.students.push(st); issueQR(st, 'Demo'); setPhoto(st.id, demoPhoto(d[4])); n++;
  });
  dirty(); audit('Demo students loaded', '', n + ' people'); save(); render(true); toast(n ? `${n} demo students and teachers added with ID cards` : 'Demo students are already loaded', 'ok');
};
ACT.demoRemove = async () => {
  need('students.delete'); const ids = new Set(S.students.filter(s => s.demo).map(s => s.id)); if (!ids.size) { toast('There is no demo data.'); return; }
  if (!await confirmBox('Remove demo data?', `This removes ${ids.size} demo students and any gate records recorded for them.`, 'Remove', true)) return;
  S.students = S.students.filter(s => !ids.has(s.id)); S.attendance = S.attendance.filter(r => !ids.has(r.studentId)); S.scans = S.scans.filter(x => !ids.has(x.studentId)); ids.forEach(delPhoto); dirty(); audit('Demo data removed', '', ids.size + ' students'); save(); render(true);
};
ACT.resetAll = () => openModal('Erase everything', `<form id="rsform" data-form="reset"><p>This deletes all students, photographs, attendance, operators and settings on this device. Download a backup first.</p><div class="field"><label class="f">Type ERASE to confirm</label><input type="text" name="w" autocomplete="off"></div><div id="formerr" class="note err hide"></div></form>`, `${cb('')}<button class="btn danger" type="submit" form="rsform">Erase everything</button>`, { small: true });
FORMS.reset = async f => {
  need('system.reset'); if (new FormData(f).get('w') !== 'ERASE') throw new Error('Type ERASE exactly to continue.');
  for (const k of Array.from(photos.keys())) await idbDel('photo:' + k); photos.clear(); S = defState(); dirty(); imgCache.clear(); await flush(); cur = null; try { sessionStorage.removeItem('gemvic.uid'); } catch (e) { } closeModal(); render(true);
};

/* ---- boot (local mode) ---- */
async function boot() {
  await idbOpen();
  const saved = await idbGet('state');
  if (saved && saved.users) { S = Object.assign(defState(), saved); S.settings = Object.assign(defState().settings, saved.settings || {}); }
  (await idbPhotos()).forEach((v, k) => photos.set(k, v)); dirty();
  try { const id = sessionStorage.getItem('gemvic.uid'); if (id) { const u = S.users.find(x => x.id === id && x.active); if (u) cur = u; } } catch (e) { }
  if (cur && cur.role === 'operator') view = 'scanner';
  render(true);
}

/* =====================================================================
   SERVER MODE – the server is the source of truth. Everything below
   replaces the local-storage versions defined earlier in this file.
   ===================================================================== */
const REMOTE = true;
let gate = { stats: { checkedIn: 0, inSchool: 0, exited: 0 }, feed: [] };
async function api(method, url, body) {
  let r;
  try { r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'X-GEMVIC': '1' }, body: body === undefined ? undefined : JSON.stringify(body), credentials: 'same-origin' }); }
  catch (e) { throw Object.assign(new Error('Cannot reach the server. Check the internet connection.'), { offline: true }); }
  let j = null; try { j = await r.json(); } catch (e) { }
  if (r.status === 401 && cur) { cur = null; closeModal(); closeModal(2); render(true); throw new Error('Your session has ended. Please sign in again.'); }
  if (!r.ok) throw new Error((j && j.error) || `Request failed (${r.status})`);
  return j;
}
const rpc = (op, args) => api('POST', '/api/rpc', { op, args: args || {} });
function storeWarn() { return ''; }
function save() { }
async function flush() { return true; }
function applyBoot(b) {
  const d = defState();
  S = Object.assign(d, { settings: Object.assign(d.settings, b.settings), classes: b.classes, templates: b.templates, students: b.students, attendance: b.attendance, scans: b.scans, audit: b.audit, imports: b.imports, batches: b.batches, users: b.users });
  dirty();
}
async function refresh(withPhotos) {
  applyBoot(await api('GET', '/api/bootstrap'));
  if (withPhotos) { photos.clear(); imgCache.clear(); const p = (await api('GET', '/api/photos')).photos; Object.keys(p).forEach(k => photos.set(k, p[k])); }
}
async function refreshGate() { const g = await api('GET', '/api/gate'); gate = { stats: g.stats, feed: g.feed }; Object.assign(S.settings, g.settings); }
function gstats() { const s = gate.stats; return tile('Checked in', s.checkedIn, 'ok') + tile('Currently inside', s.inSchool) + tile('Exited', s.exited); }
function gfeedHTML() {
  const rows = gate.feed;
  return rows.length ? rows.map(x => `<div class="listrow"><span class="t">${t12(x.ts)}</span><div class="grow"><b>${x.name ? esc(x.name) : 'Unknown code'}</b><div class="muted small">${x.name ? esc(x.cls) : esc(x.code)}</div></div>${scanBadge(x)}</div>`).join('') : empty('No gate activity today', 'Scanned students will appear here.');
}
function paintGate() { const s = $('#gstats'), f = $('#gfeed'); if (s) s.innerHTML = gstats(); if (f) f.innerHTML = gfeedHTML(); }
function note(a, t, d) { rpc('audit.note', { action: a, target: t, detail: d }).catch(() => { }); }

/* ---- session ---- */
async function loadStatus() { const st = await api('GET', '/api/status'); NEEDS_SETUP = st.needsSetup; SETUP_KEY = st.setupKey; Object.assign(S.settings, st.settings); return st; }
async function afterLogin() {
  if (cur.role === 'operator') { view = 'scanner'; await refreshGate(); } else { view = 'overview'; await refresh(true); }
  render(true);
}
FORMS.setup = async f => {
  const d = Object.fromEntries(new FormData(f)); if (d.pw !== d.pw2) throw new Error('The passwords do not match.');
  const r = await api('POST', '/api/setup', { name: d.name, username: d.username, password: d.pw, key: d.key }); NEEDS_SETUP = false; cur = r.user; await afterLogin();
};
FORMS.login = async f => { const d = Object.fromEntries(new FormData(f)); const r = await api('POST', '/api/login', { username: d.username, password: d.pw }); cur = r.user; await afterLogin(); };
async function logout() { try { await api('POST', '/api/logout', {}); } catch (e) { } camStop(); cur = null; const s = S.settings; S = defState(); Object.assign(S.settings, { school: s.school, motto: s.motto, logo: s.logo }); photos.clear(); dirty(); closeModal(); closeModal(2); render(true); }
async function boot() {
  try { const st = await loadStatus(); if (st.me) { cur = st.me; await afterLogin(); return; } }
  catch (e) { root.innerHTML = '<div class="login"><div class="box"><h1>Cannot reach the server</h1><p class="muted">Check the internet connection, then reload this page.</p></div></div>'; return; }
  render(true);
}
async function go(v) {
  if (scan.active) camStop(); view = v;
  try { if (v === 'scanner') await refreshGate(); else if (cur.role !== 'operator') await refresh(); } catch (e) { toast(e.message, 'err'); }
  render(true); window.scrollTo(0, 0);
}
FORMS.pw = async f => { const d = Object.fromEntries(new FormData(f)); await rpc('me.password', { old: d.old, password: d.pw }); f.reset(); toast('Password changed', 'ok'); };
setInterval(async () => {
  if (!cur || document.visibilityState !== 'visible') return;
  try {
    if (cur.role === 'operator') { if (!scan.busy) { await refreshGate(); paintGate(); } return; }
    const typing = document.activeElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName);
    if (typing || scan.busy || scan.active || ['scanner', 'designer', 'generate'].includes(view) || $('#modal .modal') || $('#modal2 .modal')) return;
    await refresh(); rerender();
  } catch (e) { }
}, 20000);

/* ---- gate ---- */
async function runRecord(input) {
  if (scan.busy) return; scan.busy = true; let res;
  try {
    need('gate.scan'); const r = await api('POST', '/api/scan', input); res = { kind: r.kind, rec: r.rec };
    if (r.student) { res.student = { id: '_scan', first: r.student.name, sid: r.student.sid, cls: r.student.cls, section: r.student.section }; if (r.student.photo) photos.set('_scan', r.student.photo); else photos.delete('_scan'); }
  } catch (e) { res = { kind: e && e.offline ? 'OFFLINE' : 'ERROR' }; }
  showOver(res);
}
function hideOver() {
  clearTimeout(scan.hideT); const el = $('#gover'); if (el) { el.className = 'result hide'; el.innerHTML = ''; }
  scan.busy = false; refreshGate().then(paintGate).catch(() => { });
}
async function manualSearch(q) {
  if (q.length < 2) { const o = $('#msres'); if (o) o.innerHTML = ''; return; }
  try { renderSearchResults((await api('GET', '/api/gate/search?q=' + encodeURIComponent(q))).students); } catch (e) { toast(e.message, 'err'); }
}

/* ---- students ---- */
FORMS.student = async f => {
  const d = Object.fromEntries(new FormData(f)); const changed = window._formPhoto !== undefined;
  await rpc('student.save', Object.assign({}, d, { id: f.dataset.id || undefined, kind: f.dataset.kind, photo: window._formPhoto }));
  window._formPhoto = undefined; await refresh(changed); closeModal(); render(true); toast(f.dataset.id ? 'Changes saved' : (f.dataset.kind === 'teacher' ? 'Teacher added' : 'Student added'), 'ok');
};
ACT.stuDelete = async b => {
  const s = stu(b.dataset.id); if (!await confirmBox('Delete student?', `Delete <b>${esc(fullName(s))}</b> (${esc(s.sid)})? This cannot be undone.`, 'Delete', true)) return;
  await rpc('student.delete', { id: s.id }); photos.delete(s.id); await refresh(); closeModal(); render(true);
};
ACT.idGenerate = async b => { const id = b.dataset.id; await rpc('id.generate', { ids: [id] }); await refresh(); afterId(id, !!b.closest('#modal')); toast('ID card generated', 'ok'); };
FORMS.idreplace = async f => { const d = Object.fromEntries(new FormData(f)); await rpc('id.replace', { id: f.dataset.id, reason: d.reason, old: d.old }); await refresh(); afterId(f.dataset.id, !!f.dataset.modal); toast('New QR issued. The old card no longer works.', 'ok'); };
ACT.idRegen = async b => {
  if (!await confirmBox('Regenerate QR code?', 'The current QR code will become invalid. Any previously issued copy of this QR will no longer work.', 'Regenerate', true)) return;
  await rpc('id.regen', { id: b.dataset.id }); await refresh(); afterId(b.dataset.id, !!b.closest('#modal')); toast('QR regenerated', 'ok');
};
FORMS.idstatus = async f => { const d = Object.fromEntries(new FormData(f)); await rpc('id.status', { id: f.dataset.id, status: d.status }); await refresh(); afterId(f.dataset.id, !!f.dataset.modal); };
ACT.importGo = async () => {
  const im = ui.imp; if (!im) return; const okStatus = /^(active|inactive|graduated|transferred|suspended)$/i;
  const rows = im.rows.filter(r => !r.err.length).map(r => ({ _row: r._row, kind: im.kind, dept: r.dept || '', phone: r.phone || '', sid: r.sid, first: r.first, middle: r.middle || '', last: r.last, cls: r.cls, session: r.session, sex: r.sex || '', dob: r.dob || '', guardian: r.guardian || '', guardianPhone: r.guardianPhone || '', status: okStatus.test(r.status || '') ? r.status[0].toUpperCase() + r.status.slice(1).toLowerCase() : 'Active' }));
  const r = await rpc('students.import', { file: im.file, kind: im.kind, rows }); ui.imp = null; await refresh(); closeModal(); render(true); toast(`${r.imported} ${im.kind === 'teacher' ? 'teachers' : 'students'} imported${r.rejected.length ? `, ${r.rejected.length} rejected by the server` : ''}. Add photographs next.`, r.rejected.length ? '' : 'ok');
};
async function sendPhotos(items) { for (let i = 0; i < items.length; i += 12) await rpc('photo.set', { items: items.slice(i, i + 12) }); }
async function bulkPhotos(files) {
  const res = $('#phres'); const idx = new Map(S.students.map(s => [s.sid.replace(/[^a-z0-9]/gi, '').toLowerCase(), s])); const items = [], no = [];
  res.innerHTML = '<div class="progress"><i id="phbar"></i></div><p class="small muted" id="phtxt">Processing…</p>';
  for (let i = 0; i < files.length; i++) {
    const f = files[i]; const key = f.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]/gi, '').toLowerCase(); const st = idx.get(key);
    if (st) { const url = URL.createObjectURL(f); const img = await loadImgRaw(url); URL.revokeObjectURL(url); if (img) items.push({ id: st.id, data: autoCrop(img) }); else no.push(f.name + ' (not an image)'); } else no.push(f.name);
    $('#phbar').style.width = Math.round((i + 1) / files.length * 60) + '%'; $('#phtxt').textContent = `Reading ${i + 1} / ${files.length}`; await tick();
  }
  try { await sendPhotos(items); } catch (e) { toast(e.message, 'err'); }
  $('#phbar').style.width = '100%'; await refresh(true);
  res.innerHTML = `<div class="tiles">${tile('Matched', items.length, 'ok')}${tile('Unmatched', no.length, no.length ? 'warn' : '')}</div>${no.length ? `<h3 style="margin-top:14px">Unmatched files</h3><p class="small muted">No student ID matches these file names.</p><ul class="small">${no.slice(0, 80).map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}`;
  render(true);
}
FILE.logo = async files => { const u = await resizeToPNG(files[0]); if (!u) throw new Error('That file is not a readable image.'); await rpc('logo.set', { data: u }); imgCache.clear(); await refresh(); render(true); };
ACT.logoClear = async () => { await rpc('logo.set', { data: null }); imgCache.clear(); await refresh(); render(true); };

/* ---- designer, generate ---- */
ACT.tplSave = async () => { const r = await rpc('tpl.save', { tpl: ui.draft }); ui.tplId = r.id; ui.draft = null; await refresh(); toast('Template saved', 'ok'); render(true); };
ACT.tplSaveNew = async () => { const c = JSON.parse(JSON.stringify(ui.draft)); c.id = 'new'; if (S.templates.some(t => t.name === c.name)) c.name += ' copy'; const r = await rpc('tpl.save', { tpl: c }); ui.tplId = r.id; ui.draft = null; await refresh(); toast('New template saved', 'ok'); render(true); };
ACT.tplDefault = async () => { const r = await rpc('tpl.save', { tpl: ui.draft, makeDefault: true }); ui.tplId = r.id; ui.draft = null; await refresh(); toast('Default template updated', 'ok'); render(true); };
ACT.genRun = async () => {
  const g = ui.gen; const list = genSelect(); const tpl = tplById(g.tplId); if (!list.length) return;
  $('#genbtn').disabled = true; $('#genprog').classList.remove('hide'); const bar = $('#genbar'), txt = $('#gentxt'); bar.style.width = '0'; txt.textContent = 'Preparing…';
  await rpc('id.generate', { ids: list.map(s => s.id) }); await refresh();
  const fresh = list.map(s => stu(s.id)).filter(Boolean); const use = fresh.filter(s => s.qr && s.qr.status === 'Active'); const skipped = fresh.length - use.length;
  const items = await renderSet(use, tpl, g.back, (i, n) => { bar.style.width = Math.round(i / n * 100) + '%'; txt.textContent = `Generating ID cards… ${i} / ${n}`; });
  const label = (genScopes().find(x => x[0] === g.scope) || ['', 'All students'])[1]; const file = g.scope === 'all' ? 'All' : fileSafe(g.scope.split(':')[1]);
  ui.gen.result = { items, tpl, layout: { mode: g.layout, cols: g.cols, rows: g.rows }, withBack: g.back, label, file, skipped };
  rpc('batch.log', { label, count: items.length, template: tpl.name }).catch(() => { });
  $('#genres').innerHTML = genResultHTML(); txt.textContent = `${items.length} ID cards generated`; $('#genbtn').disabled = false;
};

/* ---- attendance ---- */
FORMS.correct = async f => { const d = Object.fromEntries(new FormData(f)); await rpc('att.correct', { id: f.dataset.id, entry: d.entry, exit: d.exit, reason: d.reason }); await refresh(); closeModal(); rerender(); toast('Record corrected', 'ok'); };
ACT.attArchive = async () => { const n = ui.sel.size; await rpc('att.archive', { ids: Array.from(ui.sel), archived: true }); ui.sel.clear(); await refresh(); rerender(); toast(n + ' records archived', 'ok'); };
ACT.attRestore = async () => { const n = ui.sel.size; await rpc('att.archive', { ids: Array.from(ui.sel), archived: false }); ui.sel.clear(); await refresh(); rerender(); toast(n + ' records restored', 'ok'); };
ACT.attDelete = async () => {
  const n = ui.sel.size; if (!await confirmBox(`DELETE ${n.toLocaleString()} ATTENDANCE RECORD${n === 1 ? '' : 'S'}?`, 'This action cannot be undone. Consider archiving instead.', 'Confirm delete', true)) return;
  await rpc('att.delete', { ids: Array.from(ui.sel) }); ui.sel.clear(); await refresh(); rerender(); toast(n + ' records deleted');
};

/* ---- accounts ---- */
FORMS.opadd = async f => { const d = Object.fromEntries(new FormData(f)); await rpc('user.create', { name: d.name, username: d.username, password: d.pw, role: d.role }); await refresh(); closeModal(); render(true); toast('Account created', 'ok'); };
FORMS.opreset = async f => { const d = Object.fromEntries(new FormData(f)); await rpc('user.reset', { id: f.dataset.id, password: d.pw }); closeModal(); toast('Password reset', 'ok'); };
ACT.opToggle = async b => { await rpc('user.toggle', { id: b.dataset.id }); await refresh(); render(true); };

/* ---- settings and data ---- */
FORMS.settings = async f => { await rpc('settings.save', Object.fromEntries(new FormData(f))); await refresh(); render(true); toast('Settings saved', 'ok'); };
FORMS.class = async f => { await rpc('class.add', { name: new FormData(f).get('name') }); await refresh(); render(true); toast('Class added', 'ok'); };
ACT.backup = async () => { const j = await api('POST', '/api/backup', {}); await saveFile(`Great_Emvic_ID_Gate_Backup_${todayKey()}.json`, new Blob([JSON.stringify(j)], { type: 'application/json' })); await refresh(); render(true); };
FILE.restore = async files => {
  need('system.restore'); const j = JSON.parse(await files[0].text()); if (!j || j.app !== 'gemvic-id-gate' || !j.state || !Array.isArray(j.state.students)) throw new Error('This is not a Great Emvic backup file.');
  if (!await confirmBox('Restore backup?', `This replaces all students, photographs and gate records with the backup from ${esc(j.exportedAt ? dLong(j.exportedAt) : 'an unknown date')} (${j.state.students.length} students). Accounts and the audit log are kept.`, 'Restore', true)) return;
  await api('POST', '/api/restore', j); await refresh(true); render(true); toast('Backup restored', 'ok');
};
ACT.demoLoad = async () => {
  const r = await rpc('demo.load'); if (r.added.length) await sendPhotos(r.added.map(x => ({ id: x.id, data: demoPhoto(x.color) })));
  await refresh(true); render(true); toast(r.added.length ? `${r.added.length} demo students and teachers added with ID cards` : 'Demo students are already loaded', 'ok');
};
ACT.demoRemove = async () => {
  if (!S.students.some(s => s.demo)) { toast('There is no demo data.'); return; }
  if (!await confirmBox('Remove demo data?', 'This removes the demo students and any gate records recorded for them.', 'Remove', true)) return;
  await rpc('demo.remove'); await refresh(true); render(true);
};
FORMS.reset = async f => { if (new FormData(f).get('w') !== 'ERASE') throw new Error('Type ERASE exactly to continue.'); await rpc('system.reset'); await refresh(true); closeModal(); render(true); toast('Everything was erased. Accounts were kept.'); };

boot();
ensureLibs().then(ch => { if (ch && !scan.active && (!document.activeElement || document.activeElement === document.body)) render(true); });

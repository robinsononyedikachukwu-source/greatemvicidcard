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

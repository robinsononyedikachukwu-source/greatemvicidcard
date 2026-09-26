'use strict';
/*
 * MongoDB Atlas storage for the Great Emvic ID & Gate server.
 *
 * Why: Render's free web service has no persistent disk, so anything saved to the
 * container's local filesystem (including the earlier SQLite file) is erased whenever
 * the free instance sleeps and restarts. Keeping the data in MongoDB Atlas instead means
 * the app can freely sleep/restart on Render's free plan without losing anything -- the
 * data lives somewhere else, on Atlas's own free, persistent, always-on tier.
 *
 * Design: the server keeps the school's records in memory for fast, single-threaded scan
 * handling (unchanged from the SQLite version), and writes every change through to
 * MongoDB in one request. The "one entry per person per day" rule and the "only one
 * super account" rule are enforced by MongoDB itself (unique indexes), not just by the
 * JavaScript above it.
 */
const { MongoClient } = require('mongodb');

async function ensureIndexes(col) {
  await col.users.createIndex({ username: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
  await col.users.createIndex({ role: 1 }, { unique: true, partialFilterExpression: { role: 'super' } });
  await col.people.createIndex({ sid: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
  await col.people.createIndex({ qr: 1 }, { unique: true, sparse: true });
  await col.people.createIndex({ kind: 1 });
  await col.attendance.createIndex({ personId: 1, date: 1 }, { unique: true, partialFilterExpression: { archived: false } });
  await col.attendance.createIndex({ date: 1 });
  await col.scans.createIndex({ ts: 1 });
  await col.audit.createIndex({ ts: 1 });
}

/* Pure diff helper: compares a fresh array (each item has .id) against a Map of
   { id -> lastWrittenJSON } and returns which items to upsert and which ids to remove.
   Kept as a standalone function so it can be unit-tested without a real database. */
function diffArray(arr, snap) {
  const upserts = []; const seen = new Set();
  for (const it of arr) {
    seen.add(it.id);
    const j = JSON.stringify(it);
    if (snap.get(it.id) !== j) upserts.push({ id: it.id, item: it, json: j });
  }
  const removes = [];
  for (const id of snap.keys()) if (!seen.has(id)) removes.push(id);
  return { upserts, removes };
}

module.exports = async function createStore({ uri, dbName }, defState) {
  if (!uri) throw new Error('MONGODB_URI is not set. Add it as an environment variable (see .env.example).');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000, appName: 'great-emvic-id-gate' });
  await client.connect();
  const db = client.db(dbName || 'great_emvic');
  const col = {
    meta: db.collection('meta'), users: db.collection('users'), people: db.collection('people'),
    attendance: db.collection('attendance'), scans: db.collection('scans'), audit: db.collection('audit'),
    photos: db.collection('photos'), backups: db.collection('backups')
  };
  await ensureIndexes(col);

  // in-memory snapshots, used only to know what changed since the last write (same idea as the SQLite version)
  let snapUsers = new Map(), snapPeople = new Map(), snapAtt = new Map();
  let scanIds = new Set(), scanN = 0, auditN = 0;
  const photosMem = new Map(); let photosDirty = new Set(); let photosClearAll = false;

  const toPersonDoc = p => ({ _id: p.id, kind: p.kind === 'teacher' ? 'teacher' : 'student', sid: p.sid, status: p.status, cls: p.cls || null, qr: p.qr ? p.qr.value : null, data: JSON.stringify(p) });
  const toAttDoc = r => ({ _id: r.id, personId: r.studentId, date: r.date, archived: !!r.archived, data: JSON.stringify(r) });
  const toUserDoc = u => ({ _id: u.id, username: u.username, role: u.role, data: JSON.stringify(u) });
  const fromDoc = d => JSON.parse(d.data);

  async function load() {
    const S = defState();
    const [metaDocs, users, people, attendance, scans, audit] = await Promise.all([
      col.meta.find().toArray(), col.users.find().toArray(), col.people.find().toArray(),
      col.attendance.find().sort({ date: 1 }).toArray(), col.scans.find().sort({ ts: 1 }).toArray(), col.audit.find().sort({ ts: 1 }).toArray()
    ]);
    const meta = {}; metaDocs.forEach(d => { meta[d._id] = d.value; });
    if (meta.settings) S.settings = Object.assign(S.settings, meta.settings);
    ['templates', 'classes', 'imports', 'batches'].forEach(k => { if (meta[k]) S[k] = meta[k]; });

    snapUsers = new Map(); S.users = users.map(d => { const u = fromDoc(d); snapUsers.set(u.id, d.data); return u; });
    snapPeople = new Map(); S.students = people.map(d => { const p = fromDoc(d); snapPeople.set(p.id, d.data); return p; });
    snapAtt = new Map(); S.attendance = attendance.map(d => { const r = fromDoc(d); snapAtt.set(r.id, d.data); return r; });
    S.scans = scans.map(d => JSON.parse(d.data)); scanIds = new Set(S.scans.map(x => x.id)); scanN = S.scans.length;
    S.audit = audit.map(d => JSON.parse(d.data)); auditN = S.audit.length;

    const photoDocs = await col.photos.find().toArray();
    photosMem.clear(); photoDocs.forEach(d => photosMem.set(d._id, d.data)); photosDirty = new Set(); photosClearAll = false;
    return S;
  }

  async function flushPhotos() {
    if (photosClearAll) { await col.photos.deleteMany({}); photosClearAll = false; }
    if (!photosDirty.size) return;
    const ops = [];
    for (const id of photosDirty) {
      if (photosMem.has(id)) ops.push({ replaceOne: { filter: { _id: id }, replacement: { _id: id, data: photosMem.get(id) }, upsert: true } });
      else ops.push({ deleteOne: { filter: { _id: id } } });
    }
    photosDirty = new Set();
    if (ops.length) await col.photos.bulkWrite(ops, { ordered: false });
  }

  async function sync(S, hint) {
    if (hint && hint.att) {
      // fast path used for a single gate scan: one attendance record, atomic by virtue of being one document write
      for (const id of hint.att) {
        const r = S.attendance.find(x => x.id === id); if (!r) continue;
        const doc = toAttDoc(r); const j = doc.data;
        if (snapAtt.get(id) !== j) { await col.attendance.replaceOne({ _id: id }, doc, { upsert: true }); snapAtt.set(id, j); }
      }
      await flushPhotos();
      return;
    }
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        const metaWrites = [];
        for (const [k, v] of [['settings', S.settings], ['templates', S.templates], ['classes', S.classes], ['imports', S.imports], ['batches', S.batches]]) metaWrites.push({ replaceOne: { filter: { _id: k }, replacement: { _id: k, value: v }, upsert: true } });
        if (metaWrites.length) await col.meta.bulkWrite(metaWrites, { session, ordered: false });

        const du = diffArray(S.users, snapUsers);
        const dp = diffArray(S.students, snapPeople);
        const da = diffArray(S.attendance, snapAtt);
        const userOps = du.upserts.map(u => ({ replaceOne: { filter: { _id: u.id }, replacement: toUserDoc(u.item), upsert: true } })).concat(du.removes.map(id => ({ deleteOne: { filter: { _id: id } } })));
        const peopleOps = dp.upserts.map(u => ({ replaceOne: { filter: { _id: u.id }, replacement: toPersonDoc(u.item), upsert: true } })).concat(dp.removes.map(id => ({ deleteOne: { filter: { _id: id } } })));
        const attOps = da.upserts.map(u => ({ replaceOne: { filter: { _id: u.id }, replacement: toAttDoc(u.item), upsert: true } })).concat(da.removes.map(id => ({ deleteOne: { filter: { _id: id } } })));
        if (userOps.length) await col.users.bulkWrite(userOps, { session, ordered: false });
        if (peopleOps.length) await col.people.bulkWrite(peopleOps, { session, ordered: false });
        if (attOps.length) await col.attendance.bulkWrite(attOps, { session, ordered: false });

        if (S.scans.length !== scanN || (S.scans.length && !scanIds.has(S.scans[S.scans.length - 1].id))) {
          const ids = new Set(S.scans.map(x => x.id));
          const toRemove = Array.from(scanIds).filter(id => !ids.has(id));
          if (toRemove.length) await col.scans.deleteMany({ _id: { $in: toRemove } }, { session });
          const toAdd = S.scans.filter(x => !scanIds.has(x.id));
          if (toAdd.length) await col.scans.insertMany(toAdd.map(x => ({ _id: x.id, ts: x.ts, data: JSON.stringify(x) })), { session, ordered: false });
        }
        if (S.audit.length > auditN) {
          const toAdd = S.audit.slice(auditN).map(a => ({ _id: a.id, ts: a.ts, data: JSON.stringify(a) }));
          if (toAdd.length) await col.audit.insertMany(toAdd, { session, ordered: false });
        }
      });
      snapUsers = new Map(S.users.map(u => [u.id, JSON.stringify(u)]));
      snapPeople = new Map(S.students.map(p => [p.id, JSON.stringify(p)]));
      snapAtt = new Map(S.attendance.map(r => [r.id, JSON.stringify(r)]));
      scanIds = new Set(S.scans.map(x => x.id)); scanN = S.scans.length;
      auditN = S.audit.length;
    } finally {
      await session.endSession();
    }
    await flushPhotos();
  }

  async function saveBackupSnapshot(day, snapshot) {
    await col.backups.updateOne({ _id: day }, { $setOnInsert: { _id: day, at: new Date().toISOString(), snapshot } }, { upsert: true });
    const cutoff = new Date(Date.now() - 30 * 86400e3).toISOString().slice(0, 10);
    await col.backups.deleteMany({ _id: { $lt: cutoff } });
  }

  const photos = {
    get: id => photosMem.get(String(id)) || null,
    put: (id, data) => { photosMem.set(String(id), data); photosDirty.add(String(id)); },
    del: id => { photosMem.delete(String(id)); photosDirty.add(String(id)); },
    all: () => { const o = {}; photosMem.forEach((v, k) => { o[k] = v; }); return o; },
    clear: () => { photosMem.clear(); photosDirty = new Set(); photosClearAll = true; }
  };
  const counts = async () => ({ people: await col.people.countDocuments(), attendance: await col.attendance.countDocuments() });
  const close = () => client.close();

  return { load, sync, saveBackupSnapshot, photos, counts, close };
};
module.exports.diffArray = diffArray; // exported for the unit test only
